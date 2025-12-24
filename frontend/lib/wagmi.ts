"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "FHEDAO",
  projectId: "21fef48091f12692cad574a6f7753643", // Demo project ID
  chains: [sepolia],
  ssr: true,
});
