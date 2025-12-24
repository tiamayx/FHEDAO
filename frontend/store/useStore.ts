"use client";

import { create } from "zustand";

export type FhevmStatus = "idle" | "initializing" | "ready" | "error";

export interface Proposal {
  id: number;
  title: string;
  creator: string;
  endTime: number;
  hasVoted: boolean;
  yesHandle?: string;
  noHandle?: string;
  yesVotes?: number;
  noVotes?: number;
  decrypted?: boolean;
}

interface AppStore {
  fhevmStatus: FhevmStatus;
  fhevmError: string | null;
  proposals: Proposal[];
  currentView: "landing" | "proposals" | "create";
  isLoading: boolean;
  loadingMessage: string;

  setFhevmStatus: (status: FhevmStatus) => void;
  setFhevmError: (error: string | null) => void;
  setProposals: (proposals: Proposal[]) => void;
  addProposal: (proposal: Proposal) => void;
  updateProposal: (id: number, data: Partial<Proposal>) => void;
  setCurrentView: (view: "landing" | "proposals" | "create") => void;
  setLoading: (loading: boolean, message?: string) => void;
  reset: () => void;
}

export const useStore = create<AppStore>((set) => ({
  fhevmStatus: "idle",
  fhevmError: null,
  proposals: [],
  currentView: "landing",
  isLoading: false,
  loadingMessage: "",

  setFhevmStatus: (status) => set({ fhevmStatus: status }),
  setFhevmError: (error) => set({ fhevmError: error }),
  setProposals: (proposals) => set({ proposals }),
  addProposal: (proposal) =>
    set((state) => ({ proposals: [proposal, ...state.proposals] })),
  updateProposal: (id, data) =>
    set((state) => ({
      proposals: state.proposals.map((p) =>
        p.id === id ? { ...p, ...data } : p
      ),
    })),
  setCurrentView: (view) => set({ currentView: view }),
  setLoading: (loading, message = "") =>
    set({ isLoading: loading, loadingMessage: message }),
  reset: () =>
    set({
      fhevmStatus: "idle",
      fhevmError: null,
      proposals: [],
      currentView: "landing",
      isLoading: false,
      loadingMessage: "",
    }),
}));

