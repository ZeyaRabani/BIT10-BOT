export interface TokenMetrics {
    marketCap: number;
    volume24h: number;
    change24h: number; // percent
    fromLaunch: number; // percent
    bondingProgress: number; // percent
}

export interface AnalysisResult {
    riskScore: number;
    qualityScore: number;
    signal: "BUY" | "HOLD" | "SELL";
    reason: string;
}

export function analyzeToken(
    data: TokenMetrics
): AnalysisResult {
    let risk = 50;
    let quality = 50;

    // ✅ Market cap factor
    if (data.marketCap < 10000) {
        risk += 20;
        quality -= 10;
    } else if (data.marketCap > 100000) {
        risk -= 10;
        quality += 15;
    }

    // ✅ Volume strength
    if (data.volume24h < 1000) {
        risk += 15;
    } else if (data.volume24h > 10000) {
        risk -= 10;
        quality += 10;
    }

    // ✅ 24h momentum
    if (data.change24h > 10) {
        quality += 10;
    }
    if (data.change24h < -10) {
        risk += 15;
    }

    // ✅ From launch (overextended?)
    if (data.fromLaunch > 300) {
        risk += 20;
        quality -= 10;
    }

    // ✅ Bonding curve near graduation = safer
    if (data.bondingProgress > 70) {
        risk -= 10;
        quality += 10;
    }

    risk = Math.max(0, Math.min(100, risk));
    quality = Math.max(0, Math.min(100, quality));

    let signal: "BUY" | "HOLD" | "SELL" = "HOLD";
    let reason = "Neutral conditions";

    if (quality > 65 && risk < 50) {
        signal = "BUY";
        reason = "Strong momentum + acceptable risk";
    } else if (risk > 70) {
        signal = "SELL";
        reason = "High risk and weak structure";
    }

    return {
        riskScore: risk,
        qualityScore: quality,
        signal,
        reason,
    };
}
