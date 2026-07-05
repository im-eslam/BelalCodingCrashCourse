// ==========================================================
// /api/click — Vercel Serverless Function
// ==========================================================
// This is the SINGLE SOURCE OF TRUTH for click counting and
// link rotation. Because it runs on the server (not in each
// visitor's browser), the count is shared across EVERYONE who
// clicks the button — not just per-device like LocalStorage.
//
// HOW IT WORKS:
// - Every click atomically increments one shared counter in
//   Upstash Redis (a free serverless Redis database).
// - We divide the total click count by CLICK_BUFFER to figure
//   out which link "bucket" we're currently in.
// - Once the last link's bucket is full, we simply keep reusing
//   the last link (so the button never breaks).
//
// HOW TO MAINTAIN (for non-developers):
// - Just edit the WHATSAPP_LINKS array below with your real
//   WhatsApp group invite links, in order.
// - CLICK_BUFFER controls how many clicks each link gets before
//   moving to the next one.
// ==========================================================

import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// 🔗 STEP 1: Put your WhatsApp group links here, in order.
const WHATSAPP_LINKS = [
  "https://chat.whatsapp.com/BfIcZVCiNiTL2cbwnsXHka",
  "https://chat.whatsapp.com/LsLW6G72lw6DPCS6gE7B3y",
  "https://chat.whatsapp.com/D4DlPExgLAH14sc9N69ppD",
  "https://chat.whatsapp.com/GasfTrZYEZZEtNWWHSKN55",
  "https://chat.whatsapp.com/IruyXF2sbycD8WU3fCMpl2",
];

// 🔢 STEP 2: How many clicks each link should receive before
//    the next one takes over.
const CLICK_BUFFER = 180;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Atomically increment the shared, global click counter.
    // redis.incr is atomic even under heavy concurrent traffic.
    const totalClicks = await redis.incr("abc:total_clicks");

    // Work out which link "bucket" this click falls into.
    // Clicks 1–125 -> link 0, clicks 126–250 -> link 1, etc.
    let linkIndex = Math.floor((totalClicks - 1) / CLICK_BUFFER);

    // Safety net: if we've somehow run past the last link,
    // just keep sending people to the last one.
    if (linkIndex >= WHATSAPP_LINKS.length) {
      linkIndex = WHATSAPP_LINKS.length - 1;
    }

    const url = WHATSAPP_LINKS[linkIndex];

    // Also track per-link totals, so /api/stats can show a
    // breakdown of how many clicks each individual link got.
    await redis.incr(`abc:link:${linkIndex}:clicks`);

    return res.status(200).json({ url, linkIndex, totalClicks });
  } catch (err) {
    console.error("api/click error:", err);

    // Fallback: if the database call fails for any reason,
    // don't break the user's experience — just send them to
    // the first link so the CTA still works.
    return res.status(200).json({
      url: WHATSAPP_LINKS[0],
      linkIndex: 0,
      totalClicks: null,
      fallback: true,
    });
  }
}
