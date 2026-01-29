const tableSelect = document.getElementById("tableSelect");
const submitBtn = document.getElementById("submitBtn");
const goBtn = document.getElementById("goBtn");
const loader = document.getElementById("loaderWrapper");

tableSelect.addEventListener("change", () => {
  submitBtn.style.display = tableSelect.value ? "flex" : "none";
});

goBtn.addEventListener("click", () => {
  const table = tableSelect.value;
  if (!table) return;

  localStorage.clear();

  const now = new Date();
  const timeStr =
    now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, "0") +
    now.getDate().toString().padStart(2, "0") +
    now.getHours().toString().padStart(2, "0") +
    now.getMinutes().toString().padStart(2, "0") +
    now.getSeconds().toString().padStart(2, "0");

  const orderID = `T${table}-${timeStr}`;

  localStorage.setItem("orderID", orderID);
  localStorage.setItem("tableNo", table);

  goBtn.disabled = true;
  loader.style.display = "flex";

  setTimeout(() => {
    window.location.href = `menu.html`;
  }, 1000);
});

/* Disable right click */
document.addEventListener("contextmenu", e => e.preventDefault());
