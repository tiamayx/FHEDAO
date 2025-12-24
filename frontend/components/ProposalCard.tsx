"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useReadContract, useWalletClient } from "wagmi";
import { useStore, Proposal } from "@/store/useStore";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";
import { encryptVote, userDecryptMultiple } from "@/lib/fhe";
import { motion } from "framer-motion";

interface ProposalCardProps {
  proposal: Proposal;
}

export function ProposalCard({ proposal }: ProposalCardProps) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { setLoading, updateProposal } = useStore();
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  const { writeContractAsync } = useWriteContract();

  const { data: hasVotedData, refetch: refetchVoted } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "hasVoted",
    args: [BigInt(proposal.id), address as `0x${string}`],
  });

  const { refetch: refetchHandles } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getVoteHandles",
    args: [BigInt(proposal.id)],
  });

  useEffect(() => {
    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = proposal.endTime - now;

      if (remaining <= 0) {
        setTimeLeft("ENDED");
        setIsExpired(true);
      } else {
        const days = Math.floor(remaining / 86400);
        const hours = Math.floor((remaining % 86400) / 3600);
        const mins = Math.floor((remaining % 3600) / 60);
        const secs = remaining % 60;

        if (days > 0) {
          setTimeLeft(`${days}D ${hours}H ${mins}M`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}H ${mins}M ${secs}S`);
        } else {
          setTimeLeft(`${mins}M ${secs}S`);
        }
        setIsExpired(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [proposal.endTime]);

  const handleVote = async (isYes: boolean) => {
    if (!address || hasVotedData || isExpired || isVoting) return;

    setIsVoting(true);
    setLoading(true, "ENCRYPTING VOTE...");

    try {
      const { handle, inputProof } = await encryptVote(
        CONTRACT_ADDRESS,
        address,
        isYes
      );

      setLoading(true, "SIGN TX...");

      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "vote",
        args: [BigInt(proposal.id), handle, inputProof],
      });
      
      setLoading(true, "TX SENT! WAITING...");
      
      await new Promise(resolve => setTimeout(resolve, 8000));
      
      await refetchVoted();
      updateProposal(proposal.id, { hasVoted: true });
      
      setLoading(false);
      setIsVoting(false);
    } catch (error: any) {
      setLoading(false);
      setIsVoting(false);
    }
  };

  const handleDecrypt = async () => {
    if (!walletClient || !isExpired) return;

    setIsDecrypting(true);

    try {
      if (!hasVoted) {
        setLoading(true, "REQUESTING ACCESS...");
        await writeContractAsync({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: "requestDecryptAccess",
          args: [BigInt(proposal.id)],
        });

        setLoading(true, "WAITING FOR TX...");
        await new Promise(resolve => setTimeout(resolve, 8000));
      }

      setLoading(true, "FETCHING DATA...");
      const { data: freshHandles } = await refetchHandles();
      
      if (!freshHandles) {
        throw new Error("Failed to fetch vote handles");
      }

      setLoading(true, "DECRYPTING...");

      const [yesHandle, noHandle] = freshHandles as [bigint, bigint];
      const yesHandleHex = `0x${yesHandle.toString(16).padStart(64, "0")}`;
      const noHandleHex = `0x${noHandle.toString(16).padStart(64, "0")}`;

      const [yesVotes, noVotes] = await userDecryptMultiple(
        [yesHandleHex, noHandleHex],
        CONTRACT_ADDRESS,
        walletClient
      );

      updateProposal(proposal.id, {
        yesVotes: Number(yesVotes),
        noVotes: Number(noVotes),
        decrypted: true,
      });
    } catch (error) {
    } finally {
      setIsDecrypting(false);
      setLoading(false);
    }
  };

  const hasVoted = hasVotedData || proposal.hasVoted;
  const totalVotes = (proposal.yesVotes || 0) + (proposal.noVotes || 0);
  const yesPercent = totalVotes > 0 ? Math.round(((proposal.yesVotes || 0) / totalVotes) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-2 border-border p-8 group hover:border-accent hover:bg-accent transition-all duration-300"
    >
      {/* Title */}
      <h3 className="text-2xl md:text-4xl font-bold uppercase tracking-tighter group-hover:text-accent-foreground transition-colors">
        {proposal.title}
      </h3>

      {/* Timer */}
      <div className="flex items-center gap-4 mt-4">
        <span
          className={`text-lg font-bold uppercase tracking-widest ${
            isExpired ? "text-red-500" : "text-accent group-hover:text-accent-foreground"
          }`}
        >
          {timeLeft}
        </span>
      </div>

      {/* Voting or Results */}
      <div className="mt-8">
        {proposal.decrypted ? (
          /* Results */
          <div className="space-y-4">
            <div className="flex justify-between text-xl font-bold uppercase tracking-widest group-hover:text-accent-foreground">
              <span>YES: {proposal.yesVotes}</span>
              <span>NO: {proposal.noVotes}</span>
            </div>
            <div className="h-4 bg-muted relative">
              <div
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: `${yesPercent}%` }}
              />
            </div>
            <p className="text-center text-lg font-bold uppercase tracking-widest group-hover:text-accent-foreground">
              {yesPercent}% YES
            </p>
          </div>
        ) : isExpired ? (
          /* Decrypt button */
          <button
            onClick={handleDecrypt}
            disabled={isDecrypting}
            className="w-full h-16 bg-foreground text-background text-xl font-bold uppercase tracking-tighter hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
          >
            DECRYPT RESULTS
          </button>
        ) : hasVoted ? (
          /* Already voted */
          <div className="h-16 flex items-center justify-center border-2 border-muted">
            <span className="text-xl font-bold uppercase tracking-widest text-muted-foreground group-hover:text-accent-foreground/70">
              VOTE CAST ✓
            </span>
          </div>
        ) : (
          /* Vote buttons */
          <div className="flex gap-4">
            <button
              onClick={() => handleVote(true)}
              disabled={isVoting}
              className="flex-1 h-16 bg-green-600 text-foreground text-xl font-bold uppercase tracking-tighter hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
            >
              YES
            </button>
            <button
              onClick={() => handleVote(false)}
              disabled={isVoting}
              className="flex-1 h-16 bg-red-600 text-foreground text-xl font-bold uppercase tracking-tighter hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
            >
              NO
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
