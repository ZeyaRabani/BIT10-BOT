/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { chromium } from "playwright";

export const runtime = "nodejs";

export async function GET(
    request: Request,
    context: { params: Promise<{ address: string }> }
) {
    let browser;

    try {
        // ✅ IMPORTANT: Await params (Next 15 requirement)
        const { address } = await context.params;

        browser = await chromium.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        const page = await browser.newPage({
            userAgent:
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121 Safari/537.36",
        });

        const url = `https://robinpump.fun/project/${address}`;

        await page.goto(url, {
            waitUntil: "networkidle",
            timeout: 60000,
        });

        await page.waitForSelector("h1");

        const data = await page.evaluate(() => {
            const getText = (selector: string) =>
                document.querySelector(selector)?.textContent?.trim() ||
                null;

            const title = getText("h1");

            const symbol =
                document.querySelector("h1")
                    ?.parentElement?.querySelector(".font-medium")
                    ?.textContent?.trim() || null;

            const description =
                document.querySelector(
                    ".bg-card.border.border-border.rounded-2xl.px-4.py-3 p"
                )?.textContent?.trim() || null;

            const marketCap =
                document.querySelector(".text-3xl.font-bold")
                    ?.textContent?.trim() || null;

            const price =
                Array.from(
                    document.querySelectorAll(".text-sm.font-semibold")
                ).find((el) =>
                    el.textContent?.includes("$0.")
                )?.textContent || null;

            const fromLaunch =
                Array.from(
                    document.querySelectorAll(".text-sm.font-semibold")
                ).find((el) =>
                    el.textContent?.includes("%")
                )?.textContent || null;

            const progress =
                (
                    document.querySelector(
                        ".bg-gradient-to-r"
                    ) as HTMLElement
                )?.style.width || null;

            return {
                title,
                symbol,
                description,
                marketCap,
                price,
                fromLaunch,
                progress,
            };
        });

        return NextResponse.json({
            success: true,
            address,
            data,
        });
    } catch (error: any) {
        console.error("PROJECT SCRAPER ERROR:", error);

        return NextResponse.json(
            {
                success: false,
                error: error.message,
            },
            { status: 500 }
        );
    } finally {
        if (browser) await browser.close();
    }
}