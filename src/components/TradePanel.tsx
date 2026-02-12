/* eslint-disable @typescript-eslint/ban-ts-comment */
"use client";

import { useState, useEffect } from "react";
import { parseEther } from "viem";
import {
    useAccount,
    useWriteContract,
    useReadContract,
    useChainId,
    useSwitchChain,
    useConnect,
} from "wagmi";
import { injected } from "wagmi/connectors";
import { base } from "wagmi/chains";

const BONDING_CURVE_ABI = [
    {
        name: "buy",
        type: "function",
        stateMutability: "payable",
        inputs: [
            { name: "minTokensOut", type: "uint256" },
            { name: "deadline", type: "uint256" },
        ],
        outputs: [{ type: "uint256" }],
    },
    {
        name: "sell",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
            { name: "tokenAmount", type: "uint256" },
            { name: "minEthOut", type: "uint256" },
            { name: "deadline", type: "uint256" },
        ],
        outputs: [{ type: "uint256" }],
    },
    {
        name: "simulateBuy",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "ethAmount", type: "uint256" }],
        outputs: [
            { name: "ethToUse", type: "uint256" },
            { name: "tokensOut", type: "uint256" },
            { name: "refundAmount", type: "uint256" },
            { name: "willGraduate", type: "bool" },
        ],
    },
];

interface Props {
    curveAddress: `0x${string}`;
}

export default function TradePanel({ curveAddress }: Props) {
    const { address, isConnected } = useAccount();
    const { connect } = useConnect();
    const chainId = useChainId();
    const { switchChain } = useSwitchChain();
    const { writeContractAsync } = useWriteContract();

    const [ethAmount, setEthAmount] = useState("");
    const [tokenAmount, setTokenAmount] = useState("");
    const [loading, setLoading] = useState(false);

    const { data: simulation } = useReadContract({
        address: curveAddress,
        abi: BONDING_CURVE_ABI,
        functionName: "simulateBuy",
        args: ethAmount ? [parseEther(ethAmount)] : undefined,
    });

    // ✅ Auto enforce Base
    useEffect(() => {
        if (isConnected && chainId !== base.id) {
            switchChain({ chainId: base.id });
        }
    }, [chainId, isConnected, switchChain]);

    // ✅ Not connected
    if (!isConnected) {
        return (
            <div style={{ marginTop: 40 }}>
                <button
                    onClick={() =>
                        connect({ connector: injected() })
                    }
                >
                    Connect Wallet
                </button>
            </div>
        );
    }

    // ✅ Wrong network
    if (chainId !== base.id) {
        return (
            <div style={{ marginTop: 40 }}>
                <h3>Wrong Network</h3>
                <p>Please switch to Base Mainnet</p>
                <button
                    onClick={() =>
                        switchChain({ chainId: base.id })
                    }
                >
                    Switch to Base
                </button>
            </div>
        );
    }

    const handleBuy = async () => {
        if (!ethAmount) return;

        try {
            setLoading(true);

            const deadline =
                BigInt(Math.floor(Date.now() / 1000) + 60 * 5);

            await writeContractAsync({
                address: curveAddress,
                abi: BONDING_CURVE_ABI,
                functionName: "buy",
                args: [0n, deadline], // slippage disabled for now
                value: parseEther(ethAmount),
            });

            alert("Buy transaction sent ✅");
        } catch (err) {
            console.error(err);
            alert("Buy failed ❌");
        } finally {
            setLoading(false);
        }
    };

    const handleSell = async () => {
        if (!tokenAmount) return;

        try {
            setLoading(true);

            const deadline =
                BigInt(Math.floor(Date.now() / 1000) + 60 * 5);

            await writeContractAsync({
                address: curveAddress,
                abi: BONDING_CURVE_ABI,
                functionName: "sell",
                args: [
                    BigInt(tokenAmount),
                    0n,
                    deadline,
                ],
            });

            alert("Sell transaction sent ✅");
        } catch (err) {
            console.error(err);
            alert("Sell failed ❌");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ marginTop: 40 }}>
            <h2>🚀 Trade on Base</h2>

            <div style={{ marginBottom: 20 }}>
                <h3>Buy</h3>

                <input
                    placeholder="ETH amount"
                    value={ethAmount}
                    onChange={(e) =>
                        setEthAmount(e.target.value)
                    }
                />

                {simulation && (
                    <p>
                        Tokens out:{" "}
                        {Number(simulation[1]) / 1e18}
                    </p>
                )}

                <button
                    onClick={handleBuy}
                    disabled={loading}
                >
                    Buy
                </button>
            </div>

            <div>
                <h3>Sell</h3>

                <input
                    placeholder="Token amount (wei)"
                    value={tokenAmount}
                    onChange={(e) =>
                        setTokenAmount(e.target.value)
                    }
                />

                <button
                    onClick={handleSell}
                    disabled={loading}
                >
                    Sell
                </button>
            </div>
        </div>
    );
}
