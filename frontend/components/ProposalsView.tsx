"use client";

import { useEffect, useState, useCallback } from "react";
import { useAccount, useReadContract, usePublicClient } from "wagmi";
import { useStore } from "@/store/useStore";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";
import { ProposalCard } from "./ProposalCard";
import { Marquee } from "./Marquee";
import { motion } from "framer-motion";

export function ProposalsView() {
  const { address } = useAccount();
  const { setCurrentView, proposals, setProposals } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const publicClient = usePublicClient();

  // Get proposal count
  const { data: proposalCount, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "proposalCount",
  });

  // Fetch all proposals from contract
  const fetchProposals = useCallback(async () => {
    if (!proposalCount || !publicClient) return;
    
    const count = Number(proposalCount);
    if (count === 0) return;

    setIsLoading(true);
    try {
      const fetchedProposals = [];
      
      for (let i = 0; i < count; i++) {
        const data = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: "getProposal",
          args: [BigInt(i)],
        }) as [string, string, bigint, boolean];

        if (data[3]) { // exists
          fetchedProposals.push({
            id: i,
            title: data[0],
            creator: data[1],
            endTime: Number(data[2]),
            hasVoted: false,
          });
        }
      }

      setProposals(fetchedProposals.reverse()); // newest first
    } catch (error) {
      console.error("Failed to fetch proposals:", error);
    } finally {
      setIsLoading(false);
    }
  }, [proposalCount, publicClient, setProposals]);

  // Fetch on mount and when count changes
  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  // Refresh on page focus
  useEffect(() => {
    const handleFocus = () => {
      refetch();
      fetchProposals();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refetch, fetchProposals]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-8 border-b-2 border-border mt-16">
        <h2 className="text-4xl md:text-6xl font-bold uppercase tracking-tighter">
          PROPOSALS
        </h2>
        <button
          onClick={() => setCurrentView("create")}
          className="px-8 py-4 bg-accent text-accent-foreground text-lg font-bold uppercase tracking-tighter hover:scale-105 active:scale-95 transition-transform"
        >
          + NEW
        </button>
      </div>

      {/* Proposals Grid */}
      <div className="p-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <span className="text-4xl font-bold text-muted-foreground animate-pulse uppercase tracking-widest">
              LOADING...
            </span>
          </div>
        ) : proposals.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-32"
          >
            <span className="text-[8rem] font-bold text-muted">∅</span>
            <p className="text-2xl text-muted-foreground uppercase tracking-widest mt-4">
              NO PROPOSALS YET
            </p>
            <button
              onClick={() => setCurrentView("create")}
              className="mt-8 px-8 py-4 border-2 border-border text-lg font-bold uppercase tracking-tighter hover:border-accent hover:text-accent transition-colors"
            >
              CREATE FIRST
            </button>
          </motion.div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {proposals.map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} />
            ))}
          </div>
        )}
      </div>

      {/* Bottom Marquee */}
      <div className="fixed bottom-0 left-0 right-0">
        <Marquee text="ENCRYPTED • PRIVATE • SECURE • ON-CHAIN" speed={60} />
      </div>

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <span className="absolute bottom-32 right-8 text-[16rem] font-bold text-muted/20 select-none leading-none">
          DAO
        </span>
      </div>
    </div>
  );
}
