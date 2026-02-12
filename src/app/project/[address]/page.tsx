"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import TradePanel from "@/components/TradePanel";

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

function parseDollar(value: string | null): number {
    if (!value) return 0;
    return Number(
        value
            .replace(/[^0-9.-]+/g, "")
            .replace("K", "000")
            .replace("M", "000000")
    );
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

    // Market cap factor
    if (marketCap < 10000) {
        risk += 20;
        quality -= 10;
    } else if (marketCap > 100000) {
        risk -= 10;
        quality += 15;
    }

    // Overextended?
    if (fromLaunch > 300) {
        risk += 20;
        quality -= 10;
    } else if (fromLaunch > 100) {
        risk += 10;
    }

    // Bonding curve strength
    if (bonding > 70) {
        risk -= 10;
        quality += 10;
    } else if (bonding < 25) {
        risk += 10;
    }

    risk = Math.max(0, Math.min(100, risk));
    quality = Math.max(0, Math.min(100, quality));

    let signal: "BUY" | "HOLD" | "SELL" = "HOLD";
    let reason = "Neutral structure";

    if (quality > 65 && risk < 50) {
        signal = "BUY";
        reason = "Strong structure with manageable risk";
    } else if (risk > 70) {
        signal = "SELL";
        reason = "High risk microcap conditions";
    }

    return { riskScore: risk, qualityScore: quality, signal, reason };
}

export default function ProjectPage() {
    const params = useParams();
    const address = params.address as string;

    const [data, setData] = useState<ProjectDetails | null>(
        null
    );
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const res = await fetch(`/api/project/${address}`);
            const json = await res.json();

            if (json.success) {
                setData(json.data);
            }

            setLoading(false);
        };

        if (address) fetchData();
    }, [address]);

    const analysis = useMemo(() => {
        if (!data) return null;
        return analyze(data);
    }, [data]);

    if (loading) return <div>Loading...</div>;
    if (!data) return <div>No data found</div>;

    return (
        <div style={{ padding: 20, maxWidth: 800 }}>
            <h1>{data.title}</h1>

            <p><strong>Symbol:</strong> {data.symbol}</p>
            <p><strong>Market Cap:</strong> {data.marketCap}</p>
            <p><strong>Price:</strong> {data.price}</p>
            <p><strong>From Launch:</strong> {data.fromLaunch}</p>
            <p><strong>Bonding Progress:</strong> {data.progress}</p>

            <hr style={{ margin: "30px 0" }} />

            {analysis && (
                <div>
                    <h2>📊 Asset Analysis</h2>

                    <p>
                        <strong>Risk Score:</strong>{" "}
                        {analysis.riskScore}/100
                    </p>

                    <p>
                        <strong>Quality Score:</strong>{" "}
                        {analysis.qualityScore}/100
                    </p>

                    <p>
                        <strong>Signal:</strong>{" "}
                        <span
                            style={{
                                color:
                                    analysis.signal === "BUY"
                                        ? "green"
                                        : analysis.signal === "SELL"
                                            ? "red"
                                            : "orange",
                                fontWeight: "bold",
                            }}
                        >
                            {analysis.signal}
                        </span>
                    </p>

                    <p>{analysis.reason}</p>
                </div>
            )}

            <hr style={{ margin: "30px 0" }} />

            <p>{data.description}</p>

            <TradePanel curveAddress={address as `0x${string}`} />
        </div>
    );
}
