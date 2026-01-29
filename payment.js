const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbwjsLSj5XbdyrkVcV6hpeMHcmT09hjMBWcuGvMbew7TxUa1crQSQXYeDJyMRSDCEmGKYg/exec";

const orderID = localStorage.getItem("orderID");
const tableNo = localStorage.getItem("tableNo");

const orderDetails = document.getElementById("order-details");
const paymentButtons = document.getElementById("payment-buttons");

if (!orderID || !tableNo) {
  orderDetails.innerHTML = "<p>Order ID or Table number not found.</p>";
} else {
  fetch(`${WEB_APP_URL}?orderId=${orderID}`)
    .then(res => res.json())
    .then(data => {
      if (data.items && data.items.length > 0) {
        let html = `
          <p><strong>Order ID:</strong> ${orderID}</p>
          <p><strong>Table:</strong> ${tableNo}</p>
          <p><strong>Status:</strong> ${data.status}</p>
          <ul>
        `;

        data.items.forEach(item => {
          html += `<li>${item}</li>`;
        });

        html += `
          </ul>
          <h2>Total: ₹${data.total}</h2>
        `;

        orderDetails.innerHTML = html;
        paymentButtons.style.display = "block";
        window.totalAmount = data.total;
      } else {
        orderDetails.innerHTML = "<p>No items found for this order.</p>";
      }
    })
    .catch(err => {
      orderDetails.innerHTML = "<p>Failed to load order.</p>";
      console.error(err);
    });
}

// ===== ONLINE PAYMENT =====
function payOnline() {
  const upiLink =
    `upi://pay?pa=merchant@upi&pn=Restaurant%20Name&am=${window.totalAmount}&cu=INR`;

  alert("You will be redirected to your UPI app.");
  markAsPaid();
  window.location.href = upiLink;
}

// ===== OFFLINE PAYMENT =====
function payOffline() {
  const formData = new FormData();
  formData.append("orderId", orderID);
  formData.append("table", tableNo);
  formData.append("items", "Call a Waiter for Payment");
  formData.append("status", "Paid");
  formData.append("verification", "Done");

  fetch(WEB_APP_URL, {
    method: "POST",
    body: formData
  })
    .then(() => alert("Waiter notified. Payment marked as PAID."))
    .catch(err => {
      alert("Failed to call waiter.");
      console.error(err);
    });
}

// ===== MARK PAID =====
function markAsPaid() {
  const formData = new FormData();
  formData.append("orderId", orderID);
  formData.append("table", tableNo);
  formData.append("items", "Paid Online");
  formData.append("status", "Paid");
  formData.append("verification", "Done");

  fetch(WEB_APP_URL, {
    method: "POST",
    body: formData
  }).catch(console.error);
}
