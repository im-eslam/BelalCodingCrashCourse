// ==========================================================
// /api/stats — Vercel Serverless Function
// ==========================================================
// Visit this URL in your browser any time to see how many
// people have clicked the CTA, broken down per link:
//
//   https://your-domain.vercel.app/api/stats
//
// This is read-only — it never changes any numbers, it just
// reports what's currently stored in Vercel KV.
// ==========================================================

import { kv } from "@vercel/kv";

// Keep this in sync with the number of links in api/click.js
const LINK_COUNT = 5;

export default async function handler(req, res) {
  try {
    const totalClicks = (await kv.get("abc:total_clicks")) || 0;

    const perLink = [];
    for (let i = 0; i < LINK_COUNT; i++) {
      const clicks = (await kv.get(`abc:link:${i}:clicks`)) || 0;
      perLink.push({ link: i + 1, clicks });
    }

    return res.status(200).json({ totalClicks, perLink });
  } catch (err) {
    console.error("api/stats error:", err);
    return res.status(500).json({ error: "Could not read stats" });
  }
}
