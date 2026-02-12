/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { chromium } from "playwright";

export const runtime = "nodejs";

export async function GET() {
  let browser;

  try {
    console.log("🚀 Launching browser...");

    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
      ],
    });

    const page = await browser.newPage({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 900 },
    });

    console.log("🌍 Navigating to robinpump.fun...");

    await page.goto("https://robinpump.fun", {
      waitUntil: "networkidle",
      timeout: 60000,
    });

    console.log("📜 Scrolling to trigger lazy loading...");

    // Auto-scroll to load dynamic content
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 500;

        const timer = setInterval(() => {
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= document.body.scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 200);
      });
    });

    await page.waitForTimeout(3000);

    console.log("⏳ Waiting for project cards...");

    await page.waitForSelector(
      "a[data-testid='project-card']",
      { timeout: 30000 }
    );

    console.log("📦 Extracting projects...");

    const projects = await page.evaluate(() => {
      const baseUrl = "https://robinpump.fun";

      const cards = document.querySelectorAll(
        "a[data-testid='project-card']"
      );

      const results: any[] = [];

      cards.forEach((card) => {
        const link =
          (card as HTMLAnchorElement).getAttribute("href") || null;

        const title =
          card.querySelector("h3")?.textContent?.trim() || null;

        const symbol =
          card.querySelector(
            ".text-muted-foreground.truncate"
          )?.textContent?.trim() || null;

        const description =
          card.querySelector("p")?.textContent?.trim() || null;

        const creator =
          card.querySelector(".font-mono")?.textContent?.trim() ||
          null;

        const age =
          card.querySelector(
            ".shrink-0.whitespace-nowrap"
          )?.textContent?.trim() || null;

        const marketCap =
          card.querySelector(
            ".font-semibold.text-foreground"
          )?.textContent?.trim() || null;

        const change =
          card.querySelector(".text-red-500, .text-green-500")
            ?.textContent?.trim() || null;

        const progress =
          (
            card.querySelector(
              ".bg-gradient-to-r"
            ) as HTMLElement
          )?.style?.width || null;

        const image =
          (card.querySelector("img") as HTMLImageElement)?.src ||
          null;

        results.push({
          title,
          symbol,
          description,
          creator,
          age,
          marketCap,
          change,
          progress,
          image,
          link: link ? baseUrl + link : null,
        });
      });

      return results;
    });

    console.log(`✅ Found ${projects.length} projects`);

    return NextResponse.json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (error: any) {
    console.error("🔥 SCRAPER CRASHED:");
    console.error(error);
    console.error(error?.stack);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    if (browser) {
      console.log("🧹 Closing browser...");
      await browser.close();
    }
  }
}