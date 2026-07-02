/* ==========================================================
   Ahmed Belal – Free Front-End Crash Course
   CTA click handler
   ==========================================================
   The actual click counting and link rotation now happens on
   the SERVER (see /api/click.js), so the count is shared
   across every visitor — not just per-browser.

   This file just:
   1. Calls /api/click when the button is pressed.
   2. Opens whichever WhatsApp link the server responds with.

   ⚠️ To change your WhatsApp links or the click buffer, edit
   the WHATSAPP_LINKS / CLICK_BUFFER values in /api/click.js —
   NOT this file.
   ========================================================== */

async function handleCtaClick(button) {
  // Briefly disable the button so a double-click can't fire
  // two requests (and so the user gets visual feedback).
  button.disabled = true;
  const originalText = button.innerHTML;

  try {
    const response = await fetch("/api/click", { method: "POST" });
    const data = await response.json();

    if (data && data.url) {
      window.open(data.url, "_blank", "noopener,noreferrer");
    }
  } catch (err) {
    console.error("Could not reach /api/click:", err);
    // If the API is unreachable (e.g. testing the HTML file
    // directly without Vercel), just let the user know gently.
    alert("حصلت مشكلة في الاتصال، حاول تاني.");
  } finally {
    button.disabled = false;
    button.innerHTML = originalText;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const ctaButton = document.getElementById("cta-btn");
  if (ctaButton) {
    ctaButton.addEventListener("click", () => handleCtaClick(ctaButton));
  }
});