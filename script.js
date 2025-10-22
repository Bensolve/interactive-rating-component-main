/* ==========================================================================
   File: script.js
   Project: Interactive Rating Component
   Author: Your Name
   Description:
     - Production-ready, modular, accessible, and secure vanilla JS
     - Implements rating selection, submit handling, and thank-you state
     - Performance: cached DOM queries, minimal DOM writes, getElementById used where appropriate
     - Accessibility: aria-pressed, aria-live, focus management, keyboard support
     - Security: no innerHTML, no global leaks (IIFE), sanitized textContent only
     - Refactoring-ready: small pure helpers, DRY handlers, easy to extend
   ========================================================================== */

(() => {
  "use strict";

  /* =========================
     Cached DOM references
     ========================= */
  const ratingButtons = Array.from(
    document.querySelectorAll("[data-rating-value]")
  );
  const form = document.querySelector(".card__form");
  const ratingCard = document.querySelector(".card--rating");
  const thankYouCard = document.querySelector(".card--thankyou");
  const selectedValueEl = document.querySelector('[data-js="selected-value"]');

  // Use getElementById for single, frequently used elements (fast lookup)
  const thankYouHeading = document.getElementById("thankyou-title");
  const main = document.getElementById("main");

  /* Defensive checks (graceful fail if HTML changed) */
  if (!form || !ratingCard || !thankYouCard || !selectedValueEl) {
    // If critical DOM is missing, exit early to avoid runtime errors.
    // Developers can inspect console for issues.
    // Do not throw to avoid breaking hosting environments.
    // eslint-disable-next-line no-console
    console.warn(
      "Interactive Rating: required DOM elements not found. Aborting JS initialization."
    );
    return;
  }

  /* =========================
     Internal state
     ========================= */
  let currentRating = null;

  /* =========================
     Pure helper functions
     ========================= */

  // Return rating value as string or null (pure: no DOM side-effects)
  const getButtonRatingValue = (btn) => {
    // dataset values are strings; keep them as strings to avoid accidental math issues
    return btn?.dataset?.ratingValue ?? null;
  };

  // Find active button (pure-ish: reads DOM but does not write)
  const findActiveButton = () =>
    ratingButtons.find((b) => b.getAttribute("aria-pressed") === "true");

  /* =========================
     DOM update helpers (batch DOM writes here)
     ========================= */

  const clearActiveStates = () => {
    for (const btn of ratingButtons) {
      btn.setAttribute("aria-pressed", "false");
      btn.classList.remove("is-active");
    }
  };

  const setActiveButton = (button) => {
    clearActiveStates();
    button.setAttribute("aria-pressed", "true");
    button.classList.add("is-active");
    currentRating = getButtonRatingValue(button);
  };

  // Create or update an inline accessible error message (non-modal)
  const showInlineError = (message) => {
    // remove existing error, if any
    const existing = form.querySelector(".card__error");
    if (existing) existing.remove();

    const p = document.createElement("p");
    p.className = "card__error";
    p.setAttribute("role", "alert"); // screen readers announce immediatedly
    p.textContent = message; // safe: textContent, no HTML injection
    // Insert before the submit button to keep UX contextual
    const submit = form.querySelector('[type="submit"]');
    if (submit) submit.insertAdjacentElement("beforebegin", p);

    // Remove the error after a short time (non-intrusive)
    window.setTimeout(() => {
      p.remove();
    }, 3500);
  };

  const showThankYouState = () => {
    // Batch DOM changes: update textContent then toggle visibility
    selectedValueEl.textContent = String(currentRating);
    ratingCard.hidden = true;
    thankYouCard.hidden = false;

    // Move focus to the thank-you heading for screen reader and keyboard users
    // Use a small timeout so browsers will shift focus reliably after DOM change
    window.setTimeout(() => {
      if (thankYouHeading && typeof thankYouHeading.focus === "function") {
        thankYouHeading.focus({ preventScroll: false });
      } else if (main && typeof main.focus === "function") {
        main.focus();
      }
    }, 50);
  };

  /* =========================
     Event handlers (DRY & reusable)
     ========================= */

  // Shared click/keyboard handler for rating buttons
  const handleRatingActivation = (event) => {
    // Use currentTarget to ensure we reference the button even if a child was clicked
    const button = event.currentTarget;
    if (!button) return;

    // Set active in a single function (DRY)
    setActiveButton(button);
  };

  // Keyboard support handler for buttons (Enter / Space)
  const handleRatingKeydown = (event) => {
    const key = event.key;
    if (key === "Enter" || key === " ") {
      // Prevent page scroll for Space
      event.preventDefault();
      handleRatingActivation(event);
    }
  };

  // Form submit handler
  const handleFormSubmit = (event) => {
    // Prevent default behavior — progressive enhancement: HTML form still works if JS disabled
    event.preventDefault();

    // Use cached state first; fallback to DOM query if needed
    const rating =
      currentRating ?? getButtonRatingValue(findActiveButton() || {});
    if (!rating) {
      // Accessible inline feedback (no alert())
      showInlineError("Please select a rating before submitting.");
      return;
    }

    // All checks passed -> show thank-you UI
    showThankYouState();
  };

  /* =========================
     Initialize: attach listeners (once)
     ========================= */

  // Attach handlers to each rating button (loop-driven, scalable)
  ratingButtons.forEach((btn) => {
    // Ensure buttons have semantic accessibility defaults
    // If aria-pressed is absent, initialize to false
    if (!btn.hasAttribute("aria-pressed")) {
      btn.setAttribute("aria-pressed", "false");
    }

    // Click listener (use currentTarget in handler via addEventListener)
    btn.addEventListener("click", handleRatingActivation);

    // Keyboard activation
    btn.addEventListener("keydown", handleRatingKeydown);

    // Improve hit area for motor accessibility by ensuring role is button (if not a real button)
    // NOTE: your HTML uses <button>, so this is typically unnecessary — kept defensive
    if (
      btn.getAttribute("role") === null &&
      btn.tagName.toLowerCase() !== "button"
    ) {
      btn.setAttribute("role", "button");
      btn.setAttribute("tabindex", "0");
    }
  });

  // Form submit listener (single handler)
  form.addEventListener("submit", handleFormSubmit);

  /* =========================
     Optional: Expose tiny API for testing or future hooks (kept local)
     ========================= */
  // No globals exported — this remains internal and safe.
})();
