"use client";

import { useStore } from "@/store/useStore";
import { CONTRACT_ADDRESS } from "@/lib/contract";
import { useAccount, useDisconnect } from "wagmi";
import { useState } from "react";

export function StatusBar() {
  const { fhevmStatus, fhevmError, reset, currentView } = useStore();
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const [copied, setCopied] = useState(false);

  const shortenAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleHome = () => {
    reset();
    window.location.reload();
  };

  const handleDisconnect = () => {
    disconnect();
    reset();
    window.location.reload();
  };

  const statusConfig = {
    idle: { color: "bg-zinc-500", text: "FHE IDLE" },
    initializing: { color: "bg-yellow-500 animate-pulse", text: "FHE INIT..." },
    ready: { color: "bg-green-500", text: "FHE READY" },
    error: { color: "bg-red-500", text: "FHE ERROR" },
  }[fhevmStatus];

  return (
    <>
      {/* Home Button - Left side */}
      {address && currentView !== "landing" && (
        <div className="fixed top-0 left-0 z-50 p-4">
          <button
            onClick={handleHome}
            className="border-2 border-border px-3 py-2 bg-background text-xs uppercase tracking-widest text-muted-foreground hover:text-accent hover:border-accent transition-colors"
          >
            ← HOME
          </button>
        </div>
      )}

      {/* Right side status bar */}
      <div className="fixed top-0 right-0 z-50 flex items-center gap-3 p-4 text-xs uppercase tracking-widest">
      {/* FHEVM Status */}
      <div 
        className="flex items-center gap-2 border-2 border-border px-3 py-2 bg-background"
        title={fhevmError || ""}
      >
        <div className={`w-2 h-2 rounded-full ${statusConfig.color}`} />
        <span className={fhevmStatus === "ready" ? "text-green-400" : "text-muted-foreground"}>
          {statusConfig.text}
        </span>
      </div>

      {/* Contract Address */}
      <a
        href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
        target="_blank"
        rel="noopener noreferrer"
        className="border-2 border-border px-3 py-2 bg-background text-muted-foreground hover:text-accent hover:border-accent transition-colors"
      >
        CONTRACT: {shortenAddress(CONTRACT_ADDRESS)}
      </a>

      {/* Wallet Address */}
      {address && (
        <button
          onClick={copyAddress}
          className="border-2 border-border px-3 py-2 bg-background text-muted-foreground hover:text-accent hover:border-accent transition-colors"
        >
          {copied ? "COPIED!" : `WALLET: ${shortenAddress(address)}`}
        </button>
      )}

      {/* Disconnect Button */}
      {address && (
        <button
          onClick={handleDisconnect}
          className="border-2 border-red-500 px-3 py-2 bg-background text-red-500 hover:bg-red-500 hover:text-background transition-colors"
        >
          DISCONNECT
        </button>
      )}
      </div>
    </>
  );
}
