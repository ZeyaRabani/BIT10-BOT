"use client";

import { WagmiProvider } from "wagmi";
import {
    RainbowKitProvider,
    darkTheme,
} from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "@/lib/wagmi";
import "@rainbow-me/rainbowkit/styles.css";
import { base } from "wagmi/chains";

const queryClient = new QueryClient();

export default function Providers({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider
                    chains={[base]}
                    theme={darkTheme()}
                >
                    {children}
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}