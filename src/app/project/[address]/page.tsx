/* eslint-disable @typescript-eslint/ban-ts-comment */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import TradePanel from "@/components/TradePanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { BrainCircuit, ShieldCheck, TrendingUp, AlertTriangle } from "lucide-react";

interface ProjectDetails {
    title: string | null;
    symbol: string | null;
    description: string | null;
    marketCap: string | null;
    price: string | null;
    fromLaunch: string | null;
    progress: string | null;
}

interface Analysis {
    riskScore: number;
    qualityScore: number;
    signal: "BUY" | "HOLD" | "SELL";
    reason: string;
}

// Logic preserved from original
function parseDollar(value: string | null): number {
    if (!value) return 0;
    return Number(value.replace(/[^0-9.-]+/g, "").replace("K", "000").replace("M", "000000"));
}

function parsePercent(value: string | null): number {
    if (!value) return 0;
    return Number(value.replace(/[^0-9.-]+/g, ""));
}

function analyze(data: ProjectDetails): Analysis {
    const marketCap = parseDollar(data.marketCap);
    const fromLaunch = parsePercent(data.fromLaunch);
    const bonding = parsePercent(data.progress);
    let risk = 50;
    let quality = 50;
    if (marketCap < 10000) { risk += 20; quality -= 10; }
    else if (marketCap > 100000) { risk -= 10; quality += 15; }
    if (fromLaunch > 300) { risk += 20; quality -= 10; }
    else if (fromLaunch > 100) { risk += 10; }
    if (bonding > 70) { risk -= 10; quality += 10; }
    else if (bonding < 25) { risk += 10; }
    risk = Math.max(0, Math.min(100, risk));
    quality = Math.max(0, Math.min(100, quality));
    let signal: "BUY" | "HOLD" | "SELL" = "HOLD";
    let reason = "Neutral structure";
    if (quality > 65 && risk < 50) { signal = "BUY"; reason = "Strong structure with manageable risk"; }
    else if (risk > 70) { signal = "SELL"; reason = "High risk microcap conditions"; }
    return { riskScore: risk, qualityScore: quality, signal, reason };
}

export default function ProjectPage() {
    const params = useParams();
    const address = params.address as string;
    const [data, setData] = useState<ProjectDetails | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const res = await fetch(`/api/project/${address}`);
            const json = await res.json();
            if (json.success) setData(json.data);
            setLoading(false);
        };
        if (address) fetchData();
    }, [address]);

    const analysis = useMemo(() => (data ? analyze(data) : null), [data]);

    if (loading) return <div className="p-10 max-w-6xl mx-auto space-y-4"><Skeleton className="h-12 w-1/2" /><Skeleton className="h-[400px] w-full" /></div>;
    if (!data) return <div className="p-10 text-center text-xl font-bold">Project not found</div>;

    return (
        <div className="container mx-auto py-8 px-4 max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <header className="space-y-2">
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl font-black tracking-tighter uppercase italic">{data.title}</h1>
                            <Badge className="bg-primary text-primary-foreground text-md font-mono">{data.symbol}</Badge>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">{data.description}</p>
                    </header>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard label="Mkt Cap" value={data.marketCap} icon={<TrendingUp className="h-3 w-3" />} />
                        <StatCard label="Price" value={data.price} />
                        <StatCard label="Performance" value={data.fromLaunch} />
                        <StatCard label="Bonding" value={data.progress} />
                    </div>

                    {analysis && (
                        <Card className="bg-zinc-950 text-white border-zinc-800 overflow-hidden">
                            <div className="bg-primary h-1 w-full" />
                            <CardHeader className="flex flex-row items-center gap-2">
                                <BrainCircuit className="h-5 w-5 text-primary" />
                                <CardTitle className="text-sm font-bold uppercase tracking-widest">AI Market Analysis</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-5">
                                        <ScoreBar label="Alpha Quality" value={analysis.qualityScore} color="bg-blue-500" />
                                        <ScoreBar label="Risk Exposure" value={analysis.riskScore} color="bg-red-500" />
                                    </div>
                                    <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800 text-center space-y-2">
                                        <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-tighter">Recommendation</p>
                                        <h3 className={`text-4xl font-black ${analysis.signal === "BUY" ? "text-green-500" : analysis.signal === "SELL" ? "text-red-500" : "text-yellow-500"
                                            }`}>{analysis.signal}</h3>
                                        <p className="text-xs text-zinc-400 italic">&apos;{analysis.reason}&apos;</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="lg:col-span-1">
                    {/* @ts-expect-error */}
                    <TradePanel curveAddress={address as `0x${string}`} currentPrice={data.price} />
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon }: { label: string; value: string | null; icon?: React.ReactNode }) {
    return (
        <div className="p-4 rounded-xl border bg-card flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                {icon} {label}
            </span>
            <span className="text-xl font-mono font-bold tracking-tight">{value || "---"}</span>
        </div>
    );
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                <span className="text-zinc-400">{label}</span>
                <span>{value}%</span>
            </div>
            {/* @ts-expect-error */}
            <Progress value={value} className="h-1.5 bg-zinc-800" indicatorClassName={color} />
        </div>
    );
}
