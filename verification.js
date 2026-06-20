const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyyHZI-HrYxjPKJ58CJD-CKPAOIxGNXdsvfSSXq33PGa5REaLIsWXf9EVXW7VTiPA7daA/exec";
const PAYMENT_PAGE_URL = "payment.html";

const orderID = localStorage.getItem("orderID");
const tableNo = localStorage.getItem("tableNo");
const orderDetailsDiv = document.getElementById("order-details");

// ================= BACK NAVIGATION GUARD =================
// Once the order is placed, a back-press should not return the customer
// to the editable menu - keep them on this status page (or push them
// forward if they've already paid).
if (localStorage.getItem("orderStage") === "paid") {
  window.location.replace(PAYMENT_PAGE_URL);
}
history.pushState(null, "", location.href);
window.addEventListener("popstate", () => {
  history.pushState(null, "", location.href);
});

if (!orderID || !tableNo) {
  orderDetailsDiv.innerHTML = "<p style='color:#c0392b;text-align:center;padding:16px;'>No Order ID or Table number found!</p>";
} else {
  const TOKEN_KEY = "orderToken_" + orderID;

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = String(str);
    return div.innerHTML;
  }

  function loadOrderDetails() {
    fetch(`${WEB_APP_URL}?orderId=${encodeURIComponent(orderID)}`)
      .then(res => res.json())
      .then(data => {
        if (data.token) localStorage.setItem(TOKEN_KEY, data.token);

        if (!data.items || data.items.length === 0) {
          orderDetailsDiv.innerHTML = "<p style='text-align:center;color:#9b8263;padding:16px;'>No items found for this order.</p>";
          return;
        }

        let itemsHtml = data.items.map(item =>
          `<div class="order-item-line">${escapeHtml(item)}</div>`
        ).join("");

        const verificationDone = data.verification && data.verification.toLowerCase() === "done";

        // Update progress steps
        if (verificationDone) {
          document.getElementById("stepVerify").classList.add("active");
          document.querySelectorAll(".step-line")[0].classList.add("done");
        }

        orderDetailsDiv.innerHTML = `
          <div class="order-meta">
            <div class="order-meta-row"><span>Order ID</span><strong>${escapeHtml(orderID)}</strong></div>
            <div class="order-meta-row"><span>Table</span><strong>Table ${escapeHtml(tableNo)}</strong></div>
            <div class="order-meta-row"><span>Status</span><span class="status-badge">${escapeHtml(data.status || 'Active')}</span></div>
            <div class="order-meta-row"><span>Verification</span><span class="verify-badge">${escapeHtml(data.verification || 'Pending')}</span></div>
          </div>
          <div class="order-items">${itemsHtml}</div>
          <div class="order-total-row"><span>Total</span><span>&#8377;${Number(data.total) || 0}</span></div>
        `;

        if (verificationDone) {
          setTimeout(() => window.location.href = PAYMENT_PAGE_URL, 1000);
        }
      })
      .catch(err => {
        orderDetailsDiv.innerHTML = "<p style='color:#c0392b;text-align:center;padding:16px;'>Failed to load order. Retrying…</p>";
        console.error(err);
      });
  }

  loadOrderDetails();
  setInterval(loadOrderDetails, 5000);
}
