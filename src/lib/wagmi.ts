import { createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const config = createConfig({
    chains: [base],
    connectors: [
        injected({
            shimDisconnect: true,
            target: "metaMask", // ✅ important fallback
        }),
    ],
    transports: {
        [base.id]: http("https://mainnet.base.org"),
    },
});
// import { getDefaultConfig } from "@rainbow-me/rainbowkit";
// import { base } from "wagmi/chains";

// export const config = getDefaultConfig({
//     appName: "Your App",
//     projectId: "ac0698015835d4ab536cbe42447851f6", // get from walletconnect.com
//     chains: [base],
// });