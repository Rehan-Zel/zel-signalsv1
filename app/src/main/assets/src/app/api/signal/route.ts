import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface Candle {
  datetime: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function extractJson(text: string): Record<string, unknown> | null {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v.replace(/[^0-9.\-]/g, ""));
  return NaN;
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return err("Invalid request body.");
  }

  const symbol = String(body.symbol ?? "").trim().toUpperCase();
  const timeframe = String(body.timeframe ?? "").trim();
  const twelveDataKey = String(body.twelveDataKey ?? "").trim();
  const aiKey = String(body.aiKey ?? "").trim();

  if (!symbol) return err("Please enter an asset symbol (e.g. XAU/USD).");
  if (!["1h", "4h", "1day"].includes(timeframe)) return err("Invalid timeframe.");
  if (!twelveDataKey) return err("Missing Twelve Data API key. Add it in Settings.");
  if (!aiKey) return err("Missing OpenRouter API key. Add it in Settings.");

  // 1. Fetch real market data
  let candles: Candle[] = [];
  try {
    const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(
      symbol
    )}&interval=${encodeURIComponent(timeframe)}&outputsize=10&apikey=${encodeURIComponent(
      twelveDataKey
    )}`;
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();

    if (!data || data.status === "error" || data.code >= 400 || !Array.isArray(data.values)) {
      return err(data?.message || "Twelve Data returned an error for this request.");
    }

    candles = (data.values as Record<string, string>[])
      .map((v) => ({
        datetime: v.datetime,
        open: parseFloat(v.open),
        high: parseFloat(v.high),
        low: parseFloat(v.low),
        close: parseFloat(v.close),
      }))
      .filter((c) => [c.open, c.high, c.low, c.close].every((n) => Number.isFinite(n)))
      .reverse(); // oldest -> newest
  } catch {
    return err("Could not reach Twelve Data. Please try again.", 502);
  }

  if (candles.length === 0) return err(`No market data found for ${symbol}.`);

  const currentPrice = candles[candles.length - 1].close;
  const candleText = candles
    .map(
      (c, i) =>
        `${i + 1}. ${c.datetime} | O: ${c.open} H: ${c.high} L: ${c.low} C: ${c.close}`
    )
    .join("\n");

  // 2. Call AI
  const systemPrompt = `You are an expert trader. Here is the real market data for ${symbol} on the ${timeframe} timeframe (oldest to newest, current price ${currentPrice}):\n${candleText}\nAnalyze this data and generate a trade setup. Return ONLY a valid JSON object with: 'bias' (Bullish/Bearish), 'confidence' (0-100), 'entry' (number), 'takeProfit' (number), 'stopLoss' (number), and 'reasoning' (string).`;

  let content = "";
  try {
    const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${aiKey}`,
        "Content-Type": "application/json",
        "X-Title": "Zel Signals",
      },
      body: JSON.stringify({
        model: "qwen/qwen-2.5-coder-32b-instruct",
        temperature: 0.3,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Generate the trade setup for ${symbol} (${timeframe}) now. Entry should be near ${currentPrice}. Respond with JSON only.`,
          },
        ],
      }),
    });
    const aiData = await aiRes.json();
    if (!aiRes.ok || aiData?.error) {
      const msg = aiData?.error?.message || `OpenRouter error (${aiRes.status}).`;
      return err(`AI error: ${msg}`, aiRes.status === 401 ? 401 : 502);
    }
    content = aiData?.choices?.[0]?.message?.content ?? "";
  } catch {
    return err("Could not reach OpenRouter. Please try again.", 502);
  }

  const parsed = extractJson(content);
  if (!parsed) return err("AI returned an unreadable response. Please try again.", 502);

  const biasRaw = String(parsed.bias ?? "").toLowerCase();
  const bias = biasRaw.includes("bear") ? "Bearish" : biasRaw.includes("bull") ? "Bullish" : null;
  const entry = toNum(parsed.entry);
  const takeProfit = toNum(parsed.takeProfit);
  const stopLoss = toNum(parsed.stopLoss);
  let confidence = toNum(parsed.confidence);
  if (confidence > 0 && confidence <= 1) confidence *= 100;

  if (!bias || ![entry, takeProfit, stopLoss, confidence].every(Number.isFinite)) {
    return err("AI returned an incomplete setup. Please try again.", 502);
  }

  // 3. Return signal
  return NextResponse.json({
    symbol,
    timeframe,
    bias,
    confidence: Math.max(0, Math.min(100, Math.round(confidence))),
    entry,
    takeProfit,
    stopLoss,
    reasoning: String(parsed.reasoning ?? "No reasoning provided."),
    currentPrice,
    generatedAt: Date.now(),
  });
}
