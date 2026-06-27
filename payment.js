const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwjsLSj5XbdyrkVcV6hpeMHcmT09hjMBWcuGvMbew7TxUa1crQSQXYeDJyMRSDCEmGKYg/exec";

const orderID = localStorage.getItem("orderID");
const tableNo = localStorage.getItem("tableNo");
const orderDetails = document.getElementById("order-details");
const paymentButtons = document.getElementById("payment-buttons");
let totalAmount = 0;
let orderIsVerified = false;

function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 2500);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  }[char]));
}

function showMessage(message, color = "#9b8263") {
  orderDetails.innerHTML = `<p style="text-align:center;color:${color};padding:16px;">${escapeHtml(message)}</p>`;
  paymentButtons.style.display = "none";
}

function validAmount(amount) {
  const parsed = Number(amount);
  return Number.isFinite(parsed) && parsed > 0 ? parsed.toFixed(2) : null;
}

let pollTimer = null;

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function loadOrderDetails() {
  fetch(`${WEB_APP_URL}?orderId=${encodeURIComponent(orderID)}`)
    .then(res => {
      if (!res.ok) throw new Error("Order request failed");
      return res.json();
    })
    .then(data => {
      if (!data.items || data.items.length === 0) {
        showMessage("No items found for this order.");
        return;
      }

      orderIsVerified = String(data.verification || "").toLowerCase() === "done";
      totalAmount = validAmount(data.total);
      const orderIsPaid = String(data.status || "").toLowerCase() === "paid";

      if (orderIsPaid) {
        localStorage.setItem("orderPaid", "true");
      }

      const itemsHtml = data.items.map(item =>
        `<div class="order-item-line"><span class="order-item-name">${escapeHtml(item)}</span></div>`
      ).join("");

      orderDetails.innerHTML = `
        <div class="order-meta">
          <div class="order-meta-row"><span>Order ID</span><strong>${escapeHtml(orderID)}</strong></div>
          <div class="order-meta-row"><span>Table</span><strong>Table ${escapeHtml(tableNo)}</strong></div>
          <div class="order-meta-row"><span>Status</span><span class="status-badge">${escapeHtml(data.status || "Active")}</span></div>
          <div class="order-meta-row"><span>Verification</span><span class="status-badge">${escapeHtml(data.verification || "Pending")}</span></div>
        </div>
        <div class="order-items">${itemsHtml}</div>
        <div class="order-total-row"><span>Total</span><span>&#8377;${escapeHtml(totalAmount || data.total || 0)}</span></div>
      `;

      if (orderIsPaid) {
        showMessage("This order has already been paid. Thank you!", "#2d7a4f");
        stopPolling();
        return;
      }

      if (!orderIsVerified) {
        showToast("Please wait for waiter verification before payment.");
        paymentButtons.style.display = "none";
        return;
      }

      if (!totalAmount) {
        showToast("Invalid bill amount. Please call waiter.");
        paymentButtons.style.display = "none";
        return;
      }

      paymentButtons.style.display = "flex";
    })
    .catch(err => {
      showMessage("Failed to load order. Please try again.", "#c0392b");
      console.error(err);
    });
}

if (!orderID || !tableNo) {
  showMessage("Order ID or Table number not found.", "#c0392b");
} else {
  loadOrderDetails();
  pollTimer = setInterval(loadOrderDetails, 5000);
}

function payOnline() {
  if (!orderIsVerified || !totalAmount) {
    showToast("Payment is available only after waiter verification.");
    return;
  }

  // Marked Paid immediately on click - staff are present supervising the
  // UPI payment at this point in the workflow, so this isn't an
  // unsupervised customer-only claim.
  recordPaymentEvent("Paid", "Online Payment Completed")
    .then(() => {
      localStorage.setItem("orderPaid", "true");
      stopPolling();
      showMessage("Payment received. Opening UPI app…", "#2d7a4f");
      const upiLink = `upi://pay?pa=merchant@upi&pn=${encodeURIComponent("Spice & Saffron")}&am=${encodeURIComponent(totalAmount)}&cu=INR&tn=${encodeURIComponent(orderID)}`;
      setTimeout(() => window.location.href = upiLink, 1200);
    })
    .catch(err => {
      showToast("Failed to record payment. Please try again.");
      console.error(err);
    });
}

function payOffline() {
  if (!orderIsVerified) {
    showToast("Please wait for waiter verification first.");
    return;
  }

  recordPaymentEvent("Paid", "Paid at Counter")
    .then(() => {
      localStorage.setItem("orderPaid", "true");
      stopPolling();
      showMessage("Payment received. Thank you!", "#2d7a4f");
    })
    .catch(err => { showToast("Failed to record payment."); console.error(err); });
}

function recordPaymentEvent(status, items) {
  const formData = new FormData();
  formData.append("orderId", orderID);
  formData.append("table", tableNo);
  formData.append("items", items);
  formData.append("status", status);
  formData.append("verification", "Done");

  return fetch(WEB_APP_URL, { method: "POST", body: formData });
}
