"use client";

import { useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { useStore } from "@/store/useStore";
import { initFhevm, resetFhevm } from "@/lib/fhe";
import { StatusBar } from "@/components/StatusBar";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { LandingView } from "@/components/LandingView";
import { ProposalsView } from "@/components/ProposalsView";
import { CreateProposal } from "@/components/CreateProposal";

export default function Home() {
  const { isConnected, address } = useAccount();
  const {
    currentView,
    setCurrentView,
    fhevmStatus,
    setFhevmStatus,
    setFhevmError,
    reset,
  } = useStore();

  const doInit = useCallback(async () => {
    if (fhevmStatus === "ready" || fhevmStatus === "initializing") return;

    setFhevmStatus("initializing");
    try {
      await initFhevm();
      setFhevmStatus("ready");
    } catch (error: any) {
      console.error("FHEVM init error:", error);
      setFhevmStatus("error");
      setFhevmError(error.message || "Failed to initialize FHEVM");
    }
  }, [fhevmStatus, setFhevmStatus, setFhevmError]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    doInit();
  }, [doInit]);

  useEffect(() => {
    if (!isConnected && currentView !== "landing") {
      reset();
      resetFhevm();
      doInit();
    }
  }, [isConnected, currentView, reset, doInit]);

  useEffect(() => {
    if (!isConnected) {
      setCurrentView("landing");
    }
  }, [isConnected, address, setCurrentView]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <StatusBar />
      <LoadingOverlay />

      {currentView === "landing" && <LandingView />}
      {currentView === "proposals" && <ProposalsView />}
      {currentView === "create" && <CreateProposal />}
    </main>
  );
}
