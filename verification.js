const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbyyHZI-HrYxjPKJ58CJD-CKPAOIxGNXdsvfSSXq33PGa5REaLIsWXf9EVXW7VTiPA7daA/exec";

const PAYMENT_PAGE_URL = "payment.html";

const orderID = localStorage.getItem("orderID");
const tableNo = localStorage.getItem("tableNo");

const orderDetailsDiv = document.getElementById("order-details");

if (!orderID || !tableNo) {
  orderDetailsDiv.innerHTML =
    "<p style='color:red;'>❌ No Order ID or Table number found!</p>";
} else {

  function loadOrderDetails() {
    fetch(`${WEB_APP_URL}?orderId=${orderID}`)
      .then(res => res.json())
      .then(data => {

        if (!data.items || data.items.length === 0) {
          orderDetailsDiv.innerHTML =
            "<p>⚠️ No items found for this order.</p>";
          return;
        }

        let html = `
          <p><strong>Order ID:</strong> ${orderID}</p>
          <p><strong>Table:</strong> ${tableNo}</p>
          <p><strong>Status:</strong> ${data.status}</p>
          <p><strong>Verification:</strong> ${data.verification}</p>
          <ul>
        `;

        data.items.forEach(item => {
          html += `<li>${item}</li>`;
        });

        html += `
          </ul>
          <h2>Total: ₹${data.total}</h2>
        `;

        orderDetailsDiv.innerHTML = html;

        // ✅ Auto redirect when waiter verifies
        if (
          data.verification &&
          data.verification.toLowerCase() === "done"
        ) {
          window.location.href = PAYMENT_PAGE_URL;
        }
      })
      .catch(err => {
        orderDetailsDiv.innerHTML =
          "<p style='color:red;'>❌ Failed to load order.</p>";
        console.error(err);
      });
  }

  loadOrderDetails();
  setInterval(loadOrderDetails, 5000); // refresh every 5 seconds
}
