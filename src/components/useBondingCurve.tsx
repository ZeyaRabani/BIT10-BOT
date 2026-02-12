/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useState, useEffect, useCallback } from "react";
import {
    useAccount,
    usePublicClient,
    useWalletClient,
    useBalance,
} from "wagmi";
import { parseEther, formatEther, formatUnits } from "viem";
import { BONDING_CURVE_ABI, ERC20_ABI } from "@/lib//contracts";

interface CurveState {
    graduated: boolean;
    currentPrice: bigint;
    ethBalance: bigint;
    tokenBalance: bigint;
    tokenAddress: string;
    graduationEth: bigint;
    maxSupply: bigint;
    progress: number;
}

interface UseBondingCurveReturn {
    curveState: CurveState | null;
    userTokenBalance: bigint;
    userEthBalance: bigint;
    isLoading: boolean;
    error: string | null;
    executeBuy: (
        amount: string,
        slippage: number
    ) => Promise<`0x${string}` | undefined>;
    executeSell: (
        amount: string,
        slippage: number
    ) => Promise<`0x${string}` | undefined>;
    estimateBuy: (
        ethAmount: string
    ) => Promise<{ tokensOut: bigint; willGraduate: boolean } | null>;
    estimateSell: (tokenAmount: string) => Promise<bigint | null>;
    refetch: () => Promise<void>;
}

export function useBondingCurve(
    curveAddress: string | undefined
): UseBondingCurveReturn {
    const { address } = useAccount();
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();
    const { data: ethBalanceData } = useBalance({ address });

    const [curveState, setCurveState] = useState<CurveState | null>(null);
    // @ts-expect-error
    const [userTokenBalance, setUserTokenBalance] = useState<bigint>(0n);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const typedCurveAddress = curveAddress as `0x${string}` | undefined;

    const fetchCurveState = useCallback(async () => {
        if (!publicClient || !typedCurveAddress) return;

        try {
            const [
                graduated,
                currentPrice,
                ethBalance,
                tokenBalance,
                tokenAddress,
                graduationEth,
                maxSupply,
            ] = await Promise.all([
                publicClient.readContract({
                    address: typedCurveAddress,
                    abi: BONDING_CURVE_ABI,
                    functionName: "graduated",
                }) as Promise<boolean>,
                publicClient.readContract({
                    address: typedCurveAddress,
                    abi: BONDING_CURVE_ABI,
                    functionName: "currentPrice",
                }) as Promise<bigint>,
                publicClient.readContract({
                    address: typedCurveAddress,
                    abi: BONDING_CURVE_ABI,
                    functionName: "ethBalance",
                }) as Promise<bigint>,
                publicClient.readContract({
                    address: typedCurveAddress,
                    abi: BONDING_CURVE_ABI,
                    functionName: "tokenBalance",
                }) as Promise<bigint>,
                publicClient.readContract({
                    address: typedCurveAddress,
                    abi: BONDING_CURVE_ABI,
                    functionName: "token",
                }) as Promise<string>,
                publicClient.readContract({
                    address: typedCurveAddress,
                    abi: BONDING_CURVE_ABI,
                    functionName: "GRADUATION_ETH",
                }) as Promise<bigint>,
                publicClient.readContract({
                    address: typedCurveAddress,
                    abi: BONDING_CURVE_ABI,
                    functionName: "MAX_SUPPLY",
                }) as Promise<bigint>,
            ]);

    // @ts-expect-error
            const progress = graduationEth > 0n ? Number((ethBalance * 10000n) / graduationEth) / 100 : 0;

            setCurveState({
                graduated,
                currentPrice,
                ethBalance,
                tokenBalance,
                tokenAddress,
                graduationEth,
                maxSupply,
                progress: Math.min(progress, 100),
            });

            // Fetch user token balance
            if (address && tokenAddress) {
                const balance = (await publicClient.readContract({
                    address: tokenAddress as `0x${string}`,
                    abi: ERC20_ABI,
                    functionName: "balanceOf",
                    args: [address],
                })) as bigint;
                setUserTokenBalance(balance);
            }
        } catch (err) {
            console.error("Failed to fetch curve state:", err);
        }
    }, [publicClient, typedCurveAddress, address]);

    useEffect(() => {
        fetchCurveState();
        const interval = setInterval(fetchCurveState, 10000);
        return () => clearInterval(interval);
    }, [fetchCurveState]);

    const estimateBuy = useCallback(
        async (
            ethAmount: string
        ): Promise<{
            tokensOut: bigint;
            willGraduate: boolean;
        } | null> => {
            if (!publicClient || !typedCurveAddress || !ethAmount) return null;

            try {
                const value = parseEther(ethAmount);
    // @ts-expect-error
                if (value === 0n) return null;

                const result = await publicClient.readContract({
                    address: typedCurveAddress,
                    abi: BONDING_CURVE_ABI,
                    functionName: "simulateBuy",
                    args: [value],
                });

                const resultArray = result as [bigint, bigint, bigint, boolean];
                return {
                    tokensOut: resultArray[1],
                    willGraduate: resultArray[3],
                };
            } catch (err) {
                console.error("simulateBuy failed:", err);
                return null;
            }
        },
        [publicClient, typedCurveAddress]
    );

    const estimateSell = useCallback(
        async (tokenAmount: string): Promise<bigint | null> => {
            if (!publicClient || !typedCurveAddress || !tokenAmount)
                return null;

            try {
                const value = parseEther(tokenAmount);
    // @ts-expect-error
                if (value === 0n) return null;

                const result = await publicClient.readContract({
                    address: typedCurveAddress,
                    abi: BONDING_CURVE_ABI,
                    functionName: "simulateSell",
                    args: [value],
                });

                return result as bigint;
            } catch (err) {
                console.error("simulateSell failed:", err);
                return null;
            }
        },
        [publicClient, typedCurveAddress]
    );

    const executeBuy = useCallback(
        async (
            amount: string,
            slippage: number
        ): Promise<`0x${string}` | undefined> => {
            if (!walletClient || !publicClient || !address || !typedCurveAddress)
                return;
            if (!amount || Number(amount) <= 0) {
                setError("Enter a valid amount");
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const ethAmount = parseEther(amount);

                // Check if curve is graduated
                const isGraduated = (await publicClient.readContract({
                    address: typedCurveAddress,
                    abi: BONDING_CURVE_ABI,
                    functionName: "graduated",
                })) as boolean;

                if (isGraduated) {
                    throw new Error(
                        "This curve has graduated. Trade on the DEX instead."
                    );
                }

                // Simulate the buy
                const simulation = await publicClient.readContract({
                    address: typedCurveAddress,
                    abi: BONDING_CURVE_ABI,
                    functionName: "simulateBuy",
                    args: [ethAmount],
                });

                console.log("simulateBuy result:", simulation);

                const resultArray = simulation as [
                    bigint,
                    bigint,
                    bigint,
                    boolean,
                ];
                const tokensOut = resultArray[1];

    // @ts-expect-error
                if (!tokensOut || tokensOut === 0n) {
                    throw new Error(
                        "Simulation returned 0 tokens. The amount may be too " +
                        "small or the curve is fully sold."
                    );
                }

                // Calculate minTokensOut with slippage using basis points
                const slippageBps = BigInt(Math.floor(slippage * 100));
                const minTokens =
    // @ts-expect-error
                    (tokensOut * (10000n - slippageBps)) / 10000n;

                console.log("Buy params:", {
                    ethAmount: ethAmount.toString(),
                    tokensOut: tokensOut.toString(),
                    minTokens: minTokens.toString(),
                    slippage,
                });

    // @ts-expect-error
                if (minTokens === 0n) {
                    throw new Error(
                        "minTokensOut is 0 after slippage. Increase your buy amount."
                    );
                }

                const deadline = BigInt(Math.floor(Date.now() / 1000) + 300);

                const hash = await walletClient.writeContract({
                    address: typedCurveAddress,
                    abi: BONDING_CURVE_ABI,
                    functionName: "buy",
                    args: [minTokens, deadline],
                    value: ethAmount,
                });

                await publicClient.waitForTransactionReceipt({ hash });
                console.log("Buy confirmed:", hash);

                await fetchCurveState();
                return hash;
            } catch (err: any) {
                console.error("Buy failed:", err);
                const message =
                    err?.shortMessage || err?.message || "Buy failed";
                setError(message);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [
            walletClient,
            publicClient,
            address,
            typedCurveAddress,
            fetchCurveState,
        ]
    );

    const executeSell = useCallback(
        async (
            amount: string,
            slippage: number
        ): Promise<`0x${string}` | undefined> => {
            if (
                !walletClient ||
                !publicClient ||
                !address ||
                !typedCurveAddress ||
                !curveState
            )
                return;
            if (!amount || Number(amount) <= 0) {
                setError("Enter a valid amount");
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const tokenAmount = parseEther(amount);
                const tokenAddr = curveState.tokenAddress as `0x${string}`;

                // Check allowance
                const currentAllowance = (await publicClient.readContract({
                    address: tokenAddr,
                    abi: ERC20_ABI,
                    functionName: "allowance",
                    args: [address, typedCurveAddress],
                })) as bigint;

                if (currentAllowance < tokenAmount) {
                    console.log("Approving tokens...");
                    const approveHash = await walletClient.writeContract({
                        address: tokenAddr,
                        abi: ERC20_ABI,
                        functionName: "approve",
                        args: [
                            typedCurveAddress,
    // @ts-expect-error
                            115792089237316195423570985008687907853269984665640564039457584007913129639935n,
                        ],
                    });
                    await publicClient.waitForTransactionReceipt({
                        hash: approveHash,
                    });
                    console.log("Approval confirmed:", approveHash);
                }

                // Simulate the sell
                const ethOut = (await publicClient.readContract({
                    address: typedCurveAddress,
                    abi: BONDING_CURVE_ABI,
                    functionName: "simulateSell",
                    args: [tokenAmount],
                })) as bigint;

                console.log("simulateSell result:", ethOut.toString());

    // @ts-expect-error
                if (!ethOut || ethOut === 0n) {
                    throw new Error(
                        "Simulation returned 0 ETH. The amount may be invalid."
                    );
                }

                // Calculate minEthOut with slippage using basis points
                const slippageBps = BigInt(Math.floor(slippage * 100));
                const minEthOut =
    // @ts-expect-error
                    (ethOut * (10000n - slippageBps)) / 10000n;

                const deadline = BigInt(Math.floor(Date.now() / 1000) + 300);

                console.log("Sell params:", {
                    tokenAmount: tokenAmount.toString(),
                    ethOut: ethOut.toString(),
                    minEthOut: minEthOut.toString(),
                    slippage,
                });

                const hash = await walletClient.writeContract({
                    address: typedCurveAddress,
                    abi: BONDING_CURVE_ABI,
                    functionName: "sell",
                    args: [tokenAmount, minEthOut, deadline],
                });

                await publicClient.waitForTransactionReceipt({ hash });
                console.log("Sell confirmed:", hash);

                await fetchCurveState();
                return hash;
            } catch (err: any) {
                console.error("Sell failed:", err);
                const message =
                    err?.shortMessage || err?.message || "Sell failed";
                setError(message);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [
            walletClient,
            publicClient,
            address,
            typedCurveAddress,
            curveState,
            fetchCurveState,
        ]
    );

    return {
        curveState,
        userTokenBalance,
    // @ts-expect-error
        userEthBalance: ethBalanceData?.value ?? 0n,
        isLoading,
        error,
        executeBuy,
        executeSell,
        estimateBuy,
        estimateSell,
        refetch: fetchCurveState,
    };
}