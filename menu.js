// ================= TABLE & ORDER INFO =================
const tableNo = localStorage.getItem("tableNo");
const orderID = localStorage.getItem("orderID");

if (!tableNo || !orderID) {
  alert("Invalid access. Please select table first.");
  window.location.href = "index.html";
}

if (localStorage.getItem("orderPaid") === "true") {
  window.location.replace("payment.html");
}

document.getElementById("tableNoDisplay").textContent = tableNo;
localStorage.setItem("sessionLocked", "true");

if (history.pushState) {
  history.replaceState({ page: "menu" }, "", window.location.href);
  history.pushState({ page: "menu-lock" }, "", window.location.href);
  window.addEventListener("popstate", () => {
    history.pushState({ page: "menu-lock" }, "", window.location.href);
    showToast("Use Pay Now when you are finished.");
  });
}

// ================= MENU DATA =================
const menuData = {
  "🥣 Soups": [["Tomato Soup",70],["Veg Manchow Soup",90],["Sweet Corn Soup",80],["Hot & Sour Soup",85],["Mulligatawny Soup",95],["Lemon Coriander Soup",85],["Palak Shorba",90]],
  "🍽️ Starters": [["Paneer Tikka",150],["Veg Spring Roll",130],["Stuffed Mushrooms",140],["Crispy Corn",120],["Hara Bhara Kabab",130],["Dhokla",100],["Aloo Tikki",110],["Samosa",90]],
  "🥗 Salads": [["Green Salad",60],["Russian Salad",90],["Fruit Salad",70],["Sprouts Salad",65],["Kachumber Salad",60],["Chickpea Salad",75],["Beetroot Salad",70]],
  "🍛 Main Course": [["Paneer Butter Masala",220],["Kaju Curry",210],["Veg Kolhapuri",190],["Malai Kofta",200],["Chole Bhature",180],["Baingan Bharta",170],["Aloo Gobi",160],["Dal Makhani",180]],
  "🍚 Rice & Biryani": [["Veg Biryani",180],["Jeera Rice",120],["Steam Rice",100],["Veg Fried Rice",140],["Lemon Rice",130],["Curd Rice",120],["Peas Pulao",150],["Tomato Rice",130]],
  "🍞 Roti & Breads": [["Tandoori Roti",20],["Butter Roti",25],["Plain Naan",30],["Butter Naan",40],["Garlic Naan",45],["Lachha Paratha",50],["Missi Roti",30],["Stuffed Kulcha",55],["Roomali Roti",35]],
  "🍰 Desserts": [["Ice Cream",80],["Gulab Jamun",60],["Brownie with Ice Cream",120],["Rasgulla",70]],
  "🍹 Beverages": [["Masala Chaas",40],["Lassi",60],["Fresh Lime Soda",50],["Cold Coffee",90]],
  "🥘 Gujarati Sabji": [["Dry Potato Curry",120],["Brinjal Potato",140],["Bhindi Masala",150],["Mix Veg Curry",160],["Jain Mix Veg",170],["Spicy Garlic Curry",180],["Seasonal Green Veg",130]]
};

// ================= BUILD CATEGORY NAV =================
const catNav = document.getElementById("catNav");
const menuContainer = document.getElementById("menu-container");

Object.keys(menuData).forEach((section, i) => {
  const chip = document.createElement("button");
  chip.className = "cat-chip" + (i === 0 ? " active" : "");
  chip.textContent = section;
  chip.addEventListener("click", () => {
    document.querySelectorAll(".cat-chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    const target = document.getElementById("cat-" + i);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  catNav.appendChild(chip);
});

// ================= PRICE MAP =================
const priceMap = {};
Object.values(menuData).forEach(items => items.forEach(([n, p]) => priceMap[n] = p));

// ================= RENDER MENU =================
Object.entries(menuData).forEach(([section, items], i) => {
  const cat = document.createElement("div");
  cat.className = "menu-category";
  cat.id = "cat-" + i;
  cat.innerHTML = `<h2>${section}</h2>`;

  items.forEach(([name, price]) => {
    const item = document.createElement("div");
    item.className = "menu-item";
    item.dataset.item = name;
    item.dataset.price = price;
    item.innerHTML = `
      <div class="item-info">
        <span class="item-name">${name}</span>
        <span class="item-price">&#8377;${price}</span>
      </div>
      <div class="button-wrapper">
        <button class="add-icon-btn" onclick="addItem(this)">+</button>
      </div>`;
    cat.appendChild(item);
  });

  menuContainer.appendChild(cat);
});

// ================= CART =================
const CART_STORAGE_KEY = "menuCart";
let cart = loadSavedCart();
let orderInProgress = false;

function loadSavedCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "{}");
    if (saved.orderID !== orderID || !saved.items || typeof saved.items !== "object") return {};
    return saved.items;
  } catch (err) {
    return {};
  }
}

function saveCart() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ orderID, tableNo, items: cart }));
}

function renderSavedCartControls() {
  Object.entries(cart).forEach(([name, qty]) => {
    const item = Array.from(document.querySelectorAll(".menu-item")).find(menuItem => menuItem.dataset.item === name);
    if (!item || qty <= 0) return;
    item.querySelector(".button-wrapper").innerHTML = `
      <div class="qty-control">
        <button onclick="changeQty(this,-1)">&minus;</button>
        <span>${qty}</span>
        <button onclick="changeQty(this,1)">+</button>
      </div>`;
  });
}

function resetCartAfterOrder() {
  cart = {};
  localStorage.removeItem(CART_STORAGE_KEY);
  document.querySelectorAll(".menu-item .button-wrapper").forEach(wrapper => {
    wrapper.innerHTML = `<button class="add-icon-btn" onclick="addItem(this)">+</button>`;
  });
  updateCart();
}

function updateCart() {
  let count = 0, total = 0;
  Object.entries(cart).forEach(([name, qty]) => {
    count += qty;
    total += priceMap[name] * qty;
  });

  document.getElementById("cartCount").textContent = count;
  document.getElementById("cartTotal").textContent = "\u20B9" + total;
  saveCart();

  const summary = document.getElementById("orderSummary");
  const orderList = document.getElementById("orderList");
  const totalDisplay = document.getElementById("orderTotalDisplay");

  if (count > 0) {
    summary.style.display = "block";
    let html = "";
    Object.entries(cart).forEach(([name, qty]) => {
      const lineTotal = priceMap[name] * qty;
      html += `<div class="order-line"><span class="order-line-name">${name} &times; ${qty}</span><span class="order-line-price">\u20B9${lineTotal}</span></div>`;
    });
    orderList.innerHTML = html;
    totalDisplay.textContent = "\u20B9" + total;
  } else {
    summary.style.display = "none";
    orderList.innerHTML = "";
    totalDisplay.textContent = "\u20B9" + total;
  }
}

function scrollToOrder() {
  const summary = document.getElementById("orderSummary");
  if (summary.style.display !== "none") {
    summary.scrollIntoView({ behavior: "smooth" });
  }
}

// ================= QUANTITY CONTROLS =================
function addItem(btn) {
  const item = btn.closest(".menu-item");
  const name = item.dataset.item;
  cart[name] = (cart[name] || 0) + 1;
  updateCart();
  showToast(name + " added");

  btn.parentElement.innerHTML = `
    <div class="qty-control">
      <button onclick="changeQty(this,-1)">&minus;</button>
      <span>${cart[name]}</span>
      <button onclick="changeQty(this,1)">+</button>
    </div>`;
}

function changeQty(btn, diff) {
  const item = btn.closest(".menu-item");
  const name = item.dataset.item;
  const span = btn.parentElement.querySelector("span");
  let qty = parseInt(span.textContent) + diff;

  if (qty <= 0) {
    delete cart[name];
    updateCart();
    btn.parentElement.parentElement.innerHTML =
      `<button class="add-icon-btn" onclick="addItem(this)">+</button>`;
  } else {
    cart[name] = qty;
    span.textContent = qty;
    updateCart();
  }
}

// ================= TOAST =================
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = "\u2713 " + msg;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 2200);
}

// ================= LOADER =================
function showLoader() { document.getElementById("loaderOverlay").style.display = "flex"; }
function hideLoader() { document.getElementById("loaderOverlay").style.display = "none"; }

// ================= ORDER =================
function submitOrder() {
  if (orderInProgress) {
    showToast("Order is already being placed");
    return;
  }

  const items = [];
  document.querySelectorAll(".menu-item").forEach(item => {
    const qtyEl = item.querySelector(".qty-control span");
    if (qtyEl) items.push(`${item.dataset.item} x${qtyEl.textContent}`);
  });

  if (!items.length) {
    showToast("Please select items first");
    return;
  }

  orderInProgress = true;
  showLoader();
  sendToGoogleSheet(orderID, tableNo, items.join(", "), () => {
    resetCartAfterOrder();
    showToast("Order placed successfully!");
    hideLoader();
    orderInProgress = false;
  }, () => {
    orderInProgress = false;
  });
}

// ================= WAITER =================
function callWaiter() {
  sendToGoogleSheet(orderID, tableNo, "Call Waiter", () => showToast("Waiter called!"));
}

function callWaiterIssue(issue) {
  sendToGoogleSheet(orderID, tableNo, issue, () => showToast("Waiter notified!"));
}

// ================= PAYMENT =================
function goToPaymentPage() {
  saveCart();
  showLoader();
  sendToGoogleSheet(orderID, tableNo, "Customer going to payment", () => {
    window.location.href = "payment.html";
  });
}

// ================= GOOGLE SHEETS =================
function sendToGoogleSheet(orderId, tableNo, items, callback, errorCallback) {
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
    showToast("Network error. Try again.");
    hideLoader();
    if (errorCallback) errorCallback(err);
  });
}


renderSavedCartControls();
updateCart();



