"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useStore } from "@/store/useStore";
import { Marquee } from "./Marquee";
import { motion } from "framer-motion";

export function LandingView() {
  const { isConnected } = useAccount();
  const { setCurrentView, fhevmStatus } = useStore();

  const handleStart = () => {
    setCurrentView("proposals");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-32">
        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-[clamp(4rem,20vw,16rem)] font-bold uppercase tracking-tighter leading-none text-center"
        >
          FHE<span className="text-accent">DAO</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-xl md:text-2xl text-muted-foreground uppercase tracking-widest mt-8 text-center"
        >
          ENCRYPTED VOTING ON-CHAIN
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="mt-16"
        >
          {!isConnected ? (
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <button
                  onClick={openConnectModal}
                  className="px-12 py-6 bg-accent text-accent-foreground text-2xl font-bold uppercase tracking-tighter hover:scale-105 active:scale-95 transition-transform"
                >
                  CONNECT WALLET
                </button>
              )}
            </ConnectButton.Custom>
          ) : (
            <button
              onClick={handleStart}
              disabled={fhevmStatus !== "ready"}
              className="px-12 py-6 bg-accent text-accent-foreground text-2xl font-bold uppercase tracking-tighter hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {fhevmStatus === "ready" ? "START" : "INITIALIZING FHE..."}
            </button>
          )}
        </motion.div>
      </div>

      {/* Stats Marquee */}
      <Marquee text="PRIVATE VOTES • ENCRYPTED BALLOTS • ZERO KNOWLEDGE • FULLY HOMOMORPHIC" />

      {/* Background Numbers */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <span className="absolute top-20 left-10 text-[12rem] font-bold text-muted/30 select-none">
          01
        </span>
        <span className="absolute bottom-20 right-10 text-[12rem] font-bold text-muted/30 select-none">
          FHE
        </span>
      </div>
    </div>
  );
}

