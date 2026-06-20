# 🍽️ Smart Table Ordering System

A QR-code-based table ordering and payment system for restaurants and hotels. Diners scan a code, order from their phone, track their order live, and pay — no app install required.

Built with plain HTML, CSS, and JavaScript on the front end, and Google Apps Script + Google Sheets as a lightweight backend.

---

## ✨ Features

- 📱 **No app required** — works in any mobile browser
- 🪑 **Table-based sessions** — each order is tied to a table and a unique order ID
- 🛒 **Persistent cart** — survives page refresh, not just lost on reload
- 🔒 **Back-navigation guard** — diners can't reopen an editable menu after placing an order
- 💳 **Two payment paths** — UPI (online) or pay-at-counter
- 🔐 **Token-based request authorization** — backend rejects requests that don't belong to the order
- 👨‍🍳 **Live order verification screen** — auto-refreshing status while staff confirm the order
- 🧾 **Google Sheets as a database** — no server hosting required for the backend

---

## 📂 Project Structure

```
.
├── index.html            # Table selection / landing page
├── style.css
│
├── menu.html              # Menu browsing, cart, place order, call waiter
├── menu.css
├── menu.js
│
├── verification.html      # Live order status while kitchen verifies
├── verification.css
├── verification.js
│
├── payment.html           # Bill summary + payment options
├── payment.css
├── payment.js
│
├── table.js               # Legacy table-select helper (see Notes)
│
└── apps-script-backend.gs # Google Apps Script backend (deploy separately)
```

---

## 🔁 How It Works

```
1. Select Table  →  2. Order Food  →  3. Kitchen Verifies  →  4. Pay Bill
   (index.html)       (menu.html)       (verification.html)      (payment.html)
```

1. **`index.html`** — diner picks a table number. A unique order ID (`T<table>-<timestamp>`) is generated and stored in the browser's `localStorage`.
2. **`menu.html`** — diner browses the menu, builds a cart, and places the order or calls a waiter. The cart is saved locally so a refresh doesn't lose it.
3. **`verification.html`** — polls the backend every 5 seconds so the diner sees live status while staff confirm the order matches what was prepared.
4. **`payment.html`** — fetches the authoritative bill total from the backend and offers **Pay Online (UPI)** or **Pay at Counter**.

All state (table number, order ID, cart, order stage) lives in `localStorage` — there's no cookie banner needed, since `localStorage` isn't a tracking cookie.

---

## 🔧 Setup

### 1. Front end

The front end is fully static — no build step, no framework, no dependencies.

```bash
git clone <this-repo>
cd <this-repo>
# Serve with any static file server, e.g.:
npx serve .
```

Open `index.html` in a browser (or scan a QR code pointing to it from a table).

### 2. Backend (Google Apps Script)

1. Create a new Google Sheet with a tab named `Orders` (or update `SHEET_NAME` in `apps-script-backend.gs`).
2. Add a header row with these columns, in this order:

   | OrderID | Table | Items | Total | Status | Verification | Token |
   |---------|-------|-------|-------|--------|--------------|-------|

3. Open **Extensions → Apps Script** in the Sheet, paste in `apps-script-backend.gs`.
4. Deploy as a **Web App** (Deploy → New deployment → Web app), with access set to "Anyone."
5. Copy the deployment URL and update the `WEB_APP_URL` / `MENU_WEB_APP_URL` constants in `menu.js`, `verification.js`, and `payment.js`.

> You can use one deployment for all three pages, or separate deployments per page — the backend logic is identical either way.

### 3. UPI Payment

Update the merchant UPI ID in `payment.js`:

```js
const upiLink = `upi://pay?pa=merchant@upi&pn=...&am=${serverTotal}&cu=INR`;
```

Replace `merchant@upi` with your actual UPI ID.

---

## 🔒 Security Notes

This system deliberately treats the customer's browser as **untrusted**:

- **Per-order tokens** — the backend issues a random token the first time an order is touched. Every write request (placing items, calling staff, payment status) must include the matching token, or it's rejected. This stops someone from finding the public Apps Script URL and tampering with another table's order.
- **"Paid" is staff-only** — the client can only ever set an order to `Awaiting Staff Confirmation` or `Payment Pending Verification`. Only a separate staff-side function (`markPaidByStaff`) can mark an order `Paid`. A UPI deep link has no way to confirm a payment actually succeeded, so the front end never assumes it did.
- **Cart sanitization** — anything read back from `localStorage` is validated against the live menu and must be a positive integer quantity before being trusted.
- **Input validation** — order IDs and table numbers are validated against a strict format both client-side and server-side.

See [`apps-script-backend.gs`](./apps-script-backend.gs) for the full backend implementation and inline comments.

---

## ⚠️ Known Limitations

- UPI payments still require a human (staff) to confirm the money actually arrived — there's no payment gateway webhook integrated yet.
- Google Apps Script has execution quotas; fine for a single location, but worth migrating to a proper database/backend if order volume grows significantly.
- The back-navigation guard redirects forward rather than truly disabling the browser's Back button — no website can fully block it, and this is the standard, honest pattern.

---

## 🛣️ Roadmap

- [ ] Staff-facing dashboard to confirm payments instead of editing the Sheet manually
- [ ] Real payment gateway integration (Razorpay / PhonePe Business) for verified, automatic payment confirmation
- [ ] Migrate from Google Sheets to a proper database at scale
- [ ] Session expiry for abandoned/idle orders

---

## 📝 Notes

- `table.js` is an earlier table-selection implementation kept for reference; `index.html` currently uses its own inline script instead.
- No frameworks, build tools, or package managers are required to run the front end — it's deliberately kept dependency-free for easy deployment on any static host (GitHub Pages, Netlify, Vercel, etc.).

---

## 📄 License

Add your preferred license here (e.g. MIT) before publishing.
