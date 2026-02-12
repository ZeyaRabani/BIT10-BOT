/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
"use client";

import { useState, useEffect } from "react";
import { parseEther } from "viem";
import { useAccount, useWriteContract, useReadContract, useChainId, useSwitchChain, useConnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { base } from "wagmi/chains";

// shadcn components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Wallet, Loader2, ArrowDown, ShieldCheck, Target, Ban } from "lucide-react";

const BONDING_CURVE_ABI = [
    { name: "buy", type: "function", stateMutability: "payable", inputs: [{ name: "minTokensOut", type: "uint256" }, { name: "deadline", type: "uint256" }], outputs: [{ type: "uint256" }] },
    { name: "sell", type: "function", stateMutability: "nonpayable", inputs: [{ name: "tokenAmount", type: "uint256" }, { name: "minEthOut", type: "uint256" }, { name: "deadline", type: "uint256" }], outputs: [{ type: "uint256" }] },
    { name: "simulateBuy", type: "function", stateMutability: "view", inputs: [{ name: "ethAmount", type: "uint256" }], outputs: [{ name: "ethToUse", type: "uint256" }, { name: "tokensOut", type: "uint256" }, { name: "refundAmount", type: "uint256" }, { name: "willGraduate", type: "bool" }] },
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
    const [takeProfit, setTakeProfit] = useState([50]);
    const [stopLoss, setStopLoss] = useState([20]);
    const [loading, setLoading] = useState(false);

    const { data: simulation } = useReadContract({
        address: curveAddress,
        abi: BONDING_CURVE_ABI,
        functionName: "simulateBuy",
        args: ethAmount ? [parseEther(ethAmount)] : undefined,
    });

    useEffect(() => {
        if (isConnected && chainId !== base.id) {
            switchChain({ chainId: base.id });
        }
    }, [chainId, isConnected, switchChain]);

    if (!isConnected) {
        return (
            <Card className="border-dashed flex flex-col items-center justify-center p-10 text-center space-y-4">
                <div className="bg-muted p-4 rounded-full"><Wallet className="h-8 w-8 text-muted-foreground" /></div>
                <div className="space-y-1">
                    <h3 className="font-bold text-lg">Wallet Disconnected</h3>
                    <p className="text-sm text-muted-foreground">Connect your wallet to start trading on Base.</p>
                </div>
                <Button onClick={() => connect({ connector: injected() })} className="w-full">Connect Wallet</Button>
            </Card>
        );
    }

    if (chainId !== base.id) {
        return (
            <Card className="border-destructive/50 bg-destructive/5 p-6 text-center space-y-4">
                <Ban className="h-10 w-10 text-destructive mx-auto" />
                <div className="space-y-1">
                    <h3 className="font-bold text-destructive">Wrong Network</h3>
                    <p className="text-xs">This contract only exists on Base Mainnet.</p>
                </div>
                <Button variant="destructive" className="w-full" onClick={() => switchChain({ chainId: base.id })}>Switch to Base</Button>
            </Card>
        );
    }

    const handleBuy = async () => {
        if (!ethAmount) return;
        try {
            setLoading(true);
            const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 5);
            await writeContractAsync({
                address: curveAddress,
                abi: BONDING_CURVE_ABI,
                functionName: "buy",
                // @ts-expect-error
                args: [0n, deadline],
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
            const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 5);
            await writeContractAsync({
                address: curveAddress,
                abi: BONDING_CURVE_ABI,
                functionName: "sell",
                // @ts-expect-error
                args: [BigInt(tokenAmount), 0n, deadline],
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
        <Card className="shadow-2xl overflow-hidden border-t-4 border-t-primary">
            <CardHeader className="pb-4 bg-muted/20">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold">Trade Terminal</CardTitle>
                    <Badge variant="secondary" className="font-mono text-[10px] tracking-widest uppercase">Base Network</Badge>
                </div>
            </CardHeader>

            <Tabs defaultValue="buy" className="w-full flex flex-col space-y-3 px-4">
                <TabsList className="grid w-full grid-cols-2 rounded-none bg-muted/50 h-12">
                    <TabsTrigger value="buy" className="font-bold data-[state=active]:bg-background">BUY</TabsTrigger>
                    <TabsTrigger value="sell" className="font-bold data-[state=active]:bg-background text-red-500">SELL</TabsTrigger>
                </TabsList>

                <CardContent className="pt-6 space-y-6">
                    <TabsContent value="buy" className="m-0 space-y-6">
                        {/* Input Group */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                                    <span>Amount to Spend</span>
                                    <span>ETH</span>
                                </div>
                                <Input
                                    placeholder="0.0"
                                    value={ethAmount}
                                    onChange={(e) => setEthAmount(e.target.value)}
                                    className="h-12 text-lg font-mono"
                                />
                            </div>

                            <div className="flex justify-center"><ArrowDown className="h-4 w-4 text-muted-foreground" /></div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                                    <span>Estimated Received</span>
                                    <span>Tokens</span>
                                </div>
                                <div className="h-12 flex items-center px-3 rounded-md bg-muted/40 border border-dashed font-mono text-sm overflow-hidden">
                                    {simulation ? (Number((simulation as any)[1]) / 1e18).toLocaleString() : "0.00"}
                                </div>
                            </div>
                        </div>

                        {/* Protection Group */}
                        <div className="p-4 rounded-xl border bg-primary/5 space-y-4">
                            <div className="flex items-center gap-2 text-primary">
                                <ShieldCheck className="h-4 w-4" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Automated Protection</span>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-bold">
                                        <span className="flex items-center gap-1"><Target className="h-3 w-3 text-green-500" /> TAKE PROFIT</span>
                                        <span className="text-green-500">+22.3%</span>
                                        {/* <span className="text-green-500">+{takeProfit}%</span> */}
                                    </div>
                                    {/* <Slider value={takeProfit} onValueChange={setTakeProfit} max={500} step={5} /> */}
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-bold">
                                        <span className="flex items-center gap-1"><Ban className="h-3 w-3 text-red-500" /> STOP LOSS</span>
                                        <span className="text-red-500">-5.6%</span>
                                        {/* <span className="text-red-500">-{stopLoss}%</span> */}
                                    </div>
                                    {/* <Slider value={stopLoss} onValueChange={setStopLoss} max={100} step={1} /> */}
                                </div>
                            </div>
                        </div>

                        <Button onClick={handleBuy} disabled={loading || !ethAmount} className="w-full h-12 text-md font-bold">
                            {loading ? <Loader2 className="animate-spin mr-2" /> : "Place Protected Buy"}
                        </Button>
                    </TabsContent>

                    <TabsContent value="sell" className="m-0 space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                                <span>Amount to Sell</span>
                                <span>Tokens (Wei)</span>
                            </div>
                            <Input
                                placeholder="0"
                                value={tokenAmount}
                                onChange={(e) => setTokenAmount(e.target.value)}
                                className="h-12 text-lg font-mono"
                            />
                        </div>
                        <Button onClick={handleSell} disabled={loading || !tokenAmount} variant="destructive" className="w-full h-12 text-md font-bold">
                            {loading ? <Loader2 className="animate-spin mr-2" /> : "Confirm Immediate Sell"}
                        </Button>
                    </TabsContent>
                </CardContent>
            </Tabs>
        </Card>
    );
}
