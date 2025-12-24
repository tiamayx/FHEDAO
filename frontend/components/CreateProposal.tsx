"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useStore } from "@/store/useStore";
import { CONTRACT_ADDRESS, CONTRACT_ABI, DURATIONS } from "@/lib/contract";
import { motion } from "framer-motion";

export function CreateProposal() {
  const { address } = useAccount();
  const { setCurrentView, setLoading, addProposal } = useStore();
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(DURATIONS[0].value);
  const hasHandledSuccess = useRef(false);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !address) return;

    setLoading(true, "CREATING PROPOSAL...");
    hasHandledSuccess.current = false;

    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "createProposal",
        args: [title, BigInt(duration)],
      });
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  // Handle loading state
  useEffect(() => {
    if (isPending) {
      setLoading(true, "SIGN TX...");
    } else if (isConfirming) {
      setLoading(true, "CONFIRMING TX...");
    }
  }, [isPending, isConfirming, setLoading]);

  // Handle success
  useEffect(() => {
    if (isSuccess && hash && !hasHandledSuccess.current) {
      hasHandledSuccess.current = true;
      setLoading(false);
      addProposal({
        id: Date.now(),
        title,
        creator: address!,
        endTime: Math.floor(Date.now() / 1000) + duration,
        hasVoted: false,
      });
      setCurrentView("proposals");
    }
  }, [isSuccess, hash, title, address, duration, setLoading, addProposal, setCurrentView]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen flex flex-col items-center justify-center px-4 py-32"
    >
      <button
        onClick={() => setCurrentView("proposals")}
        className="absolute top-24 left-8 text-muted-foreground hover:text-accent uppercase tracking-widest text-sm"
      >
        ← BACK
      </button>

      <h2 className="text-[clamp(2rem,8vw,6rem)] font-bold uppercase tracking-tighter mb-16">
        NEW <span className="text-accent">PROPOSAL</span>
      </h2>

      <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-8">
        {/* Title Input */}
        <div className="border-b-2 border-border focus-within:border-accent transition-colors">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="PROPOSAL TITLE"
            className="w-full h-24 bg-transparent text-4xl font-bold uppercase tracking-tighter placeholder:text-muted focus:outline-none"
            maxLength={100}
          />
        </div>

        {/* Duration Select */}
        <div className="border-2 border-border focus-within:border-accent transition-colors">
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full h-20 bg-background text-2xl font-bold uppercase tracking-tighter px-6 focus:outline-none cursor-pointer"
          >
            {DURATIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!title.trim() || isPending || isConfirming}
          className="w-full h-20 bg-accent text-accent-foreground text-2xl font-bold uppercase tracking-tighter hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          CREATE
        </button>
      </form>
    </motion.div>
  );
}
