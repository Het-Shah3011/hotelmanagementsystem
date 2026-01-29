// ================= TABLE & ORDER INFO =================
const tableNo = localStorage.getItem("tableNo");
const orderID = localStorage.getItem("orderID");

if (!tableNo || !orderID) {
  alert("Invalid access. Please select table first.");
  window.location.href = "index.html";
}

document.getElementById("tableNoDisplay").textContent = tableNo;

// ================= MENU DATA (100% SAME AS BLOGGER) =================
const menuData = {
  "🥣 Soups": [
    ["Tomato Soup", 70],
    ["Veg Manchow Soup", 90],
    ["Sweet Corn Soup", 80],
    ["Hot & Sour Soup", 85],
    ["Mulligatawny Soup", 95],
    ["Lemon Coriander Soup", 85],
    ["Palak Shorba (Spinach Soup)", 90]
  ],

  "🍽️ Starters": [
    ["Paneer Tikka", 150],
    ["Veg Spring Roll", 130],
    ["Stuffed Mushrooms", 140],
    ["Crispy Corn", 120],
    ["Hara Bhara Kabab", 130],
    ["Dhokla", 100],
    ["Aloo Tikki", 110],
    ["Samosa", 90]
  ],

  "🥗 Salads": [
    ["Green Salad", 60],
    ["Russian Salad", 90],
    ["Fruit Salad", 70],
    ["Sprouts Salad", 65],
    ["Kachumber Salad", 60],
    ["Chickpea Salad", 75],
    ["Beetroot Salad", 70]
  ],

  "🍛 Main Course (Veg)": [
    ["Paneer Butter Masala", 220],
    ["Kaju Curry", 210],
    ["Veg Kolhapuri", 190],
    ["Malai Kofta", 200],
    ["Chole Bhature", 180],
    ["Baingan Bharta", 170],
    ["Aloo Gobi", 160],
    ["Dal Makhani", 180]
  ],

  "🍚 Rice & Biryani": [
    ["Veg Biryani", 180],
    ["Jeera Rice", 120],
    ["Steam Rice", 100],
    ["Veg Fried Rice", 140],
    ["Lemon Rice", 130],
    ["Curd Rice", 120],
    ["Peas Pulao", 150],
    ["Tomato Rice", 130]
  ],

  "🍞 Bread": [
    ["Butter Naan", 40],
    ["Garlic Naan", 50],
    ["Tandoori Roti", 20],
    ["Chapati", 15]
  ],

  "🍰 Desserts": [
    ["Ice Cream", 80],
    ["Gulab Jamun", 60],
    ["Brownie with Ice Cream", 120],
    ["Rasgulla", 70]
  ],

  "🍹 Beverages": [
    ["Masala Chaas", 40],
    ["Lassi", 60],
    ["Fresh Lime Soda", 50],
    ["Cold Coffee", 90]
  ],

  "🍞 Roti & Indian Breads": [
    ["Tandoori Roti", 20],
    ["Butter Roti", 25],
    ["Plain Naan", 30],
    ["Butter Naan", 40],
    ["Garlic Naan", 45],
    ["Lachha Paratha", 50],
    ["Missi Roti", 30],
    ["Stuffed Kulcha", 55],
    ["Roomali Roti", 35]
  ],

  "🥘 Gujarati Sabji (Veg Curries)": [
    ["Dry Potato Curry", 120],
    ["Brinjal Potato", 140],
    ["Bhindi Masala", 150],
    ["Mix Veg Curry", 160],
    ["Jain Mix Veg (No Onion/Garlic)", 170],
    ["Spicy Garlic Curry", 180],
    ["Seasonal Green Veg", 130]
  ]
};

// ================= RENDER MENU =================
const menuContainer = document.getElementById("menu-container");

for (const [section, items] of Object.entries(menuData)) {
  const category = document.createElement("div");
  category.className = "menu-category";
  category.innerHTML = `<h2>${section}</h2>`;

  items.forEach(([name, price]) => {
    category.innerHTML += `
      <div class="menu-item" data-item="${name}">
        <div class="item-info">
          <span class="item-name">${name}</span>
          <span class="item-price">₹${price}</span>
        </div>
        <div class="button-wrapper">
          <button class="add-icon-btn" onclick="addItem(this)">+</button>
        </div>
      </div>`;
  });

  menuContainer.appendChild(category);
}

// ================= QUANTITY CONTROLS =================
function addItem(btn) {
  btn.parentElement.innerHTML = `
    <div class="qty-control">
      <button onclick="changeQty(this,-1)">−</button>
      <span>1</span>
      <button onclick="changeQty(this,1)">+</button>
    </div>`;
}

function changeQty(btn, diff) {
  const span = btn.parentElement.querySelector("span");
  let qty = parseInt(span.textContent) + diff;

  if (qty <= 0) {
    btn.parentElement.parentElement.innerHTML =
      `<button class="add-icon-btn" onclick="addItem(this)">+</button>`;
  } else {
    span.textContent = qty;
  }
}

// ================= LOADER =================
function showLoader() {
  document.getElementById("loaderOverlay").style.display = "flex";
}
function hideLoader() {
  document.getElementById("loaderOverlay").style.display = "none";
}

// ================= ORDER =================
function submitOrder() {
  showLoader();

  const items = [];
  document.querySelectorAll(".menu-item").forEach(item => {
    const qtyEl = item.querySelector(".qty-control span");
    if (qtyEl) {
      items.push(`${item.dataset.item} x${qtyEl.textContent}`);
    }
  });

  if (!items.length) {
    alert("Please select items");
    hideLoader();
    return;
  }

  sendToGoogleSheet(orderID, tableNo, items.join(", "), () => {
    alert("Order placed successfully");
    hideLoader();
  });
}

// ================= WAITER =================
function callWaiter() {
  sendToGoogleSheet(orderID, tableNo, "Call Waiter", () => {
    alert("Waiter called");
  });
}

function callWaiterIssue(issue) {
  sendToGoogleSheet(orderID, tableNo, issue, () => {
    alert("Waiter notified");
  });
}

// ================= PAYMENT =================
function goToPaymentPage() {
  showLoader(); // optional loader if you have it

  sendToGoogleSheet(orderID, tableNo, "Customer going to payment", () => {
    window.location.href = "payment.html";
  });
}

// ================= GOOGLE SHEETS (UNCHANGED) =================
function sendToGoogleSheet(orderId, tableNo, items, callback) {
  const formData = new FormData();
  formData.append("orderId", orderId);
  formData.append("table", tableNo);
  formData.append("items", items);

  fetch("https://script.google.com/macros/s/AKfycbxHw9hkDRJi_AgZEw2xeS6LWu5nDJqkUhgrnmDmhOXFIpU8q8DO2xKW7_92KcKUXgFhTg/exec", {
    method: "POST",
    body: formData
  })
  .then(() => callback())
  .catch(err => {
    alert("Failed: " + err);
    hideLoader();
  });
}
