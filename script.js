// Edit the names, prices, and image filenames here to change the menu.
const menu = {
  breakfast: [
    {
      id: "macaroni",
      zh: "火腿通粉",
      en: "Ham macaroni soup, scrambled eggs & toast",
      price: 43,
    },
    {
      id: "satay",
      zh: "沙嗲牛肉公仔麵",
      en: "Satay beef noodles, fried eggs & toast",
      price: 45,
    },
    {
      id: "vermicelli",
      zh: "雪菜肉絲米粉",
      en: "Pork vermicelli soup, ham omelette & toast",
      price: 45,
    }
  ],
  "all-day": [
    {
      id: "steak",
      zh: "黑椒牛扒飯",
      en: "Black pepper steak with rice",
      price: 45,
    },
    {
      id: "chicken",
      zh: "燒汁雞扒飯",
      en: "BBQ chicken steak with rice",
      price: 38,
    },
    {
      id: "fried-chicken",
      zh: "炸雞髀",
      en: "Fried chicken leg with fries",
      price: 34,
    },
    {
      id: "pork",
      zh: "鮮茄焗豬扒飯",
      en: "Baked tomato pork chop rice",
      price: 48,
      image: "pork-chop-rice.png",
    },
    {
      id: "club",
      zh: "公司三文治",
      en: "Club sandwich",
      price: 34,
      image: "club-sandwich.png",
    },
    {
      id: "spam",
      zh: "餐蛋治",
      en: "Spam & egg sandwich",
      price: 22,
    },
    {
      id: "ham-egg",
      zh: "腿蛋治",
      en: "Ham & egg sandwich",
      price: 24,
    },
    {
      id: "ham-cheese",
      zh: "芝士火腿治",
      en: "Ham & cheese sandwich",
      price: 22,
    }
  ],
  tea: [
    {
      id: "lemon-tea",
      zh: "凍檸茶",
      en: "Iced lemon tea",
      price: 24,
      image: "lemon-tea.jpg",
    },
    {
      id: "milk-tea",
      zh: "港式奶茶",
      en: "Hong Kong milk tea",
      price: 22,
      image: "milk-tea.jpg",
    },
    {
      id: "crispy-bun",
      zh: "豬仔包",
      en: "Crispy bun",
      price: 12,
      image: "crispy-bun.jpg",
    },
    {
      id: "pineapple-bun",
      zh: "菠蘿油",
      en: "Pineapple bun with butter",
      price: 16,
      image: "pineapple-bun.jpg",
    }
  ]
};

const notes = {
  breakfast: "7:00 AM–11:30 AM · Each breakfast set includes a hot drink.",
  "all-day": "飯、意粉、三文治 · Rice, spaghetti and sandwiches.",
  tea: "一盅兩件 · A drink and a little something on the side."
};

const byId = (id) => document.getElementById(id);
const dishes = new Map(
  Object.values(menu)
    .flat()
    .map((dish) => [dish.id, dish])
);
const cart = new Map();
const seats = [...document.querySelectorAll(".seat-option")];
const categoryButtons = [...document.querySelectorAll("[data-category]")];
const nav = [...document.querySelectorAll(".stage-nav a")];
const stages = nav.map((link) => byId(link.hash.slice(1)));
const emptyTable = byId("served-dishes").innerHTML;
const money = (price) => `HK$${price}`;
let table = null;
let phase = "ordering";
let served = [];
let toastTimer;

function toast(message) {
  byId("toast").textContent = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    byId("toast").textContent = "";
  }, 2200);
}

function goTo(id) {
  if (location.hash !== `#${id}`) location.hash = id;
  else byId(id).scrollIntoView();
}

function renderMenu(category) {
  byId("menu-note").textContent = notes[category];
  categoryButtons.forEach((button) => {
    const active = button.dataset.category === category;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active);
  });
  byId("menu-items").innerHTML = menu[category].map((dish) => `
    <button class="menu-item" data-add="${dish.id}" ${phase !== "ordering" ? "disabled" : ""}
      aria-label="Add ${dish.en}, ${money(dish.price)}">
      <span><b lang="zh-Hant">${dish.zh}</b><small>${dish.en}</small></span>
      <strong>$${dish.price}<span aria-hidden="true">+</span></strong>
    </button>`).join("");
}

function renderTableNumber() {
  document.querySelectorAll("[data-table-label]").forEach((label) => { label.textContent = table || "—"; });
  seats.forEach((seat) => {
    seat.setAttribute("aria-pressed", seat.dataset.table === table);
    seat.disabled = phase !== "ordering";
  });
  byId("seat-message").textContent = table
    ? `坐呢度 · Table ${table} is yours.`
    : "Choose a seat to make it yours.";
}

function renderCart(focusAction) {
  const entries = [...cart].map(([id, quantity]) => ({ ...dishes.get(id), quantity }));
  const total = entries.reduce((sum, dish) => sum + dish.price * dish.quantity, 0);
  const count = entries.reduce((sum, dish) => sum + dish.quantity, 0);
  const cartItems = byId("cart-items");
  cartItems.innerHTML = entries.map((dish) => `
    <div class="slip-line">
      <span>${dish.en}</span>
      <span class="quantity">
        <button data-remove="${dish.id}" aria-label="Remove one ${dish.en}" ${phase !== "ordering" ? "disabled" : ""}>−</button>
        ${dish.quantity}
        <button data-more="${dish.id}" aria-label="Add one ${dish.en}" ${phase !== "ordering" ? "disabled" : ""}>+</button>
      </span>
    </div>`).join("") || '<p class="empty-cart">仲諗緊？<br><span>Take your pick from the menu.</span></p>';
  byId("bag-count").textContent = count;
  byId("cart-total").textContent = money(total);
  byId("send-order").disabled = !count || phase !== "ordering";
  document.querySelector(".slip-footnote").textContent = phase === "ordering"
    ? "Add a dish, then send your order." : "Your order is with the kitchen.";

  const receiptItems = byId("receipt-items");
  receiptItems.innerHTML = phase === "ordering"
    ? '<p class="receipt-empty">Your receipt will appear after you order.</p>'
    : entries.map((dish) => `<div class="slip-line"><span>${dish.quantity} × ${dish.en}</span><b>${money(dish.quantity * dish.price)}</b></div>`).join("");
  byId("receipt-total").textContent = money(phase === "ordering" ? 0 : total);
  if (focusAction) {
    const sameControl = cartItems.querySelector(`[${focusAction.attribute}="${focusAction.id}"]`);
    const fallback = byId("send-order").disabled ? document.querySelector(".menu-item") : byId("send-order");
    (sameControl || fallback)?.focus();
  }
}

function changeQuantity(id, change, focusAction) {
  if (phase !== "ordering" || !dishes.has(id)) return;
  const quantity = (cart.get(id) || 0) + change;
  if (quantity > 0) cart.set(id, quantity);
  else cart.delete(id);
  renderCart(focusAction);
  if (change > 0) toast(`已加單 · ${dishes.get(id).en} added.`);
}

function renderMeal() {
  const remaining = served.filter((serving) => !serving.finished).length;
  const tableTop = byId("served-dishes");
  tableTop.innerHTML = served.map((serving, index) => {
    const dish = dishes.get(serving.id);
    const image = dish.image ? `<img src="assets/${dish.image}" alt="">` : "";
    return `<button class="dish" data-serving="${index}" aria-pressed="${serving.finished}" ${phase !== "eating" ? "disabled" : ""}>
      ${image}<b lang="zh-Hant">${dish.zh}</b><span>${dish.en}</span>
      <span>${serving.finished ? "食完 · Finished" : "趁熱食 · Tap to eat"}</span>
    </button>`;
  }).join("") || emptyTable;
  byId("kitchen-status").textContent = served.length
    ? (remaining ? "嚟啦！ · Your order is here." : "食飽啦！ · All finished.")
    : "The kitchen is waiting for your order.";
  byId("eat-instruction").textContent = served.length
    ? (remaining ? `${remaining} left on your table.` : "Your table is cleared. You can ask for the bill.")
    : "Your dishes will appear here.";
  byId("ask-bill").disabled = phase !== "eating" || remaining > 0;
  byId("settle-bill").disabled = phase !== "billed";
  byId("paid-stamp").hidden = phase !== "paid";
}

// Connect the seat, menu, table, and cashier controls.
seats.forEach((seat) => seat.addEventListener("click", () => {
  table = seat.dataset.table;
  renderTableNumber();
}));
categoryButtons.forEach((button) => button.addEventListener("click", () => renderMenu(button.dataset.category)));
byId("menu-items").addEventListener("click", (event) => {
  const button = event.target.closest("[data-add]");
  if (button) changeQuantity(button.dataset.add, 1);
});
byId("cart-items").addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove], [data-more]");
  if (!button) return;
  const removing = button.hasAttribute("data-remove");
  const id = removing ? button.dataset.remove : button.dataset.more;
  changeQuantity(id, removing ? -1 : 1, { id, attribute: removing ? "data-remove" : "data-more" });
});
byId("send-order").addEventListener("click", () => {
  if (phase !== "ordering" || !cart.size) return;
  table ||= "05";
  phase = "eating";
  served = [...cart].flatMap(([id, count]) =>
    Array.from({ length: count }, () => ({ id, finished: false }))
  );
  renderTableNumber();
  renderCart();
  renderMenu(document.querySelector(".menu-filters .active").dataset.category);
  renderMeal();
  goTo("eat");
});
byId("served-dishes").addEventListener("click", (event) => {
  const button = event.target.closest("[data-serving]");
  if (!button || phase !== "eating") return;
  const index = Number(button.dataset.serving);
  served[index].finished = !served[index].finished;
  renderMeal();
  byId("served-dishes").querySelector(`[data-serving="${index}"]`).focus({ preventScroll: true });
});
byId("ask-bill").addEventListener("click", () => {
  if (phase !== "eating" || served.some((serving) => !serving.finished)) return;
  phase = "billed";
  renderMeal();
  goTo("leave");
});
byId("settle-bill").addEventListener("click", () => {
  if (phase !== "billed") return;
  phase = "paid";
  renderMeal();
  toast("多謝晒！ · See you again.");
});
byId("restart").addEventListener("click", () => {
  phase = "ordering";
  table = null;
  served = [];
  cart.clear();
  renderTableNumber();
  renderCart();
  renderMenu("breakfast");
  renderMeal();
  goTo("enter");
});

// Highlight the current stage while scrolling.
let trackingScroll = false;
function updateNavigation() {
  const marker = document.querySelector(".site-header").offsetHeight + 35;
  const current = stages.reduce(
    (active, stage, index) => stage.getBoundingClientRect().top <= marker ? index : active,
    0
  );
  nav.forEach((link, index) => {
    if (index === current) link.setAttribute("aria-current", "step");
    else link.removeAttribute("aria-current");
  });
  trackingScroll = false;
}
window.addEventListener("scroll", () => {
  if (!trackingScroll) {
    trackingScroll = true;
    requestAnimationFrame(updateNavigation);
  }
}, { passive: true });
window.addEventListener("resize", updateNavigation);
renderMenu("breakfast");
updateNavigation();
