/* =========================
   SHOW PENDING PAYMENT POPUP
   (FRONTEND ONLY)
========================= */
function showPendingRechargePopup() {
  try {
    const state = JSON.parse(localStorage.getItem("active_payment"));
    if (!state || state.status !== "PROCESSING") return;

    const shownKey = "pending_popup_shown_" + state.order_id;
    if (localStorage.getItem(shownKey)) return;

    alert(
      "⏳ Your payment is currently pending.\n\n" +
      "Please wait 2–5 minutes for confirmation.\n\n" +
      "Do not make another payment for the same order."
    );

    localStorage.setItem(shownKey, "1");
  } catch (err) {
    console.warn("Pending popup error:", err);
  }
}

/* =========================
   RUN ON PAGE LOAD
========================= */
document.addEventListener("DOMContentLoaded", () => {
  showPendingRechargePopup();
});
