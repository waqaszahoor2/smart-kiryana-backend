/* ============================================
   Smart Store — Dashboard Application Logic
   ============================================ */

const API = window.location.origin;

// Theme setup (Run as early as possible to prevent flicker)
const savedTheme = localStorage.getItem("smartstore_theme");
const prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
if (savedTheme === "light" || (!savedTheme && prefersLight)) {
    document.documentElement.classList.add("light-mode");
}

if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", (e) => {
        if (!localStorage.getItem("smartstore_theme")) {
            if (e.matches) {
                document.documentElement.classList.add("light-mode");
            } else {
                document.documentElement.classList.remove("light-mode");
            }
            // Update buttons if the function exists
            const topBtn = document.getElementById("theme-toggle");
            if (topBtn) topBtn.textContent = e.matches ? "🌙" : "☀️";
        }
    });
}

// ─── State ───────────────────────────────────
let currentPage = "dashboard";
let soldToday = 0;
let dailySales = { revenue: 0, cost: 0 }; // Track daily profit

// ─── Init ────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    // Auth check — redirect to login if not signed in
    const storedUser = localStorage.getItem("smartstore_user");
    if (!storedUser) {
        window.location.href = "/";
        return;
    }

    // Display user info
    try {
        const user = JSON.parse(storedUser);
        document.querySelectorAll(".user-name").forEach(el => el.textContent = user.name || "User");
        document.querySelectorAll(".user-email").forEach(el => el.textContent = user.email || "—");
        document.querySelectorAll(".user-avatar").forEach(el => el.textContent = (user.name || "U").charAt(0).toUpperCase());
    } catch (e) {
        console.error("Failed to parse user data", e);
        localStorage.removeItem("smartstore_user");
        window.location.href = "/";
        return;
    }

    setupNavigation();
    updateClock();
    setInterval(updateClock, 1000);
    checkServerStatus();
    loadDashboard();

    // Load sold count from localStorage (persists per day)
    const today = new Date().toDateString();
    const stored = localStorage.getItem("smartstore_sold");
    if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.date === today) {
            soldToday = parsed.count;
        } else {
            localStorage.removeItem("smartstore_sold");
        }
    }

    // Load daily profit data
    const storedProfit = localStorage.getItem("smartstore_profit");
    if (storedProfit) {
        const parsed = JSON.parse(storedProfit);
        if (parsed.date === today) {
            dailySales = { revenue: parsed.revenue, cost: parsed.cost };
        } else {
            localStorage.removeItem("smartstore_profit");
        }
    }

    // Theme Setup
    const updateThemeButtons = () => {
        const isLight = document.documentElement.classList.contains("light-mode");
        const topBtn = document.getElementById("theme-toggle");
        if (topBtn) topBtn.textContent = isLight ? "🌙" : "☀️";
    };
    updateThemeButtons();

    document.querySelectorAll("#theme-toggle, .btn-theme-sidebar").forEach(btn => {
        btn.addEventListener("click", () => {
            const isLight = document.documentElement.classList.toggle("light-mode");
            localStorage.setItem("smartstore_theme", isLight ? "light" : "dark");
            updateThemeButtons();
        });
    });

    setupAutoLogout();
    if (storedProfit) {
        const parsed = JSON.parse(storedProfit);
        if (parsed.date === today) {
            dailySales = { revenue: parsed.revenue, cost: parsed.cost };
        } else {
            localStorage.removeItem("smartstore_profit");
        }
    }
});

// ─── Logout ──────────────────────────────────
async function handleLogout() {
    try {
        await fetch(`${API}/auth/logout`, { method: "POST", credentials: "include" });
    } catch {}
    localStorage.removeItem("smartstore_user");
    localStorage.removeItem("smartstore_last_activity");
    window.location.href = "/";
}

// ─── Auto Logout (2 Hours) ───────────────────
function setupAutoLogout() {
    const TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours

    const checkTimeout = () => {
        const lastActivity = localStorage.getItem("smartstore_last_activity");
        if (lastActivity && Date.now() - parseInt(lastActivity) > TIMEOUT_MS) {
            handleLogout();
        }
    };

    // Check immediately on load
    checkTimeout();

    // Check periodically
    setInterval(checkTimeout, 60000);

    // Update activity timestamp on user interaction
    const updateActivity = () => {
        localStorage.setItem("smartstore_last_activity", Date.now().toString());
    };

    if (!localStorage.getItem("smartstore_last_activity")) {
        updateActivity();
    }

    let isThrottled = false;
    const throttledUpdate = () => {
        if (!isThrottled) {
            updateActivity();
            isThrottled = true;
            setTimeout(() => isThrottled = false, 5000);
        }
    };

    window.addEventListener("mousemove", throttledUpdate, { passive: true });
    window.addEventListener("click", throttledUpdate, { passive: true });
    window.addEventListener("keydown", throttledUpdate, { passive: true });
    window.addEventListener("scroll", throttledUpdate, { passive: true });
    window.addEventListener("touchstart", throttledUpdate, { passive: true });
}


// ─── Navigation ──────────────────────────────
function setupNavigation() {
    document.querySelectorAll(".nav-item").forEach((btn) => {
        btn.addEventListener("click", () => {
            switchPage(btn.dataset.page);
        });
    });
}

function switchPage(page) {
    currentPage = page;

    // Update nav
    document.querySelectorAll(".nav-item").forEach((b) => b.classList.remove("active"));
    const navBtn = document.querySelector(`[data-page="${page}"]`);
    if (navBtn) navBtn.classList.add("active");

    // Update pages
    document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
    const pageEl = document.getElementById(`page-${page}`);
    if (pageEl) pageEl.classList.add("active");

    // Update title
    const titles = { dashboard: "Dashboard", owners: "Business Owners", products: "Products", profile: "Menu" };
    document.getElementById("page-title").textContent = titles[page] || page;

    // Load data
    if (page === "dashboard") loadDashboard();
    if (page === "owners") loadOwners();
    if (page === "products") loadProducts();

}

// ─── Clock ───────────────────────────────────
function updateClock() {
    const now = new Date();
    document.getElementById("time-display").textContent = now.toLocaleString("en-PK", {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}

// ─── Server Status ───────────────────────────
async function checkServerStatus() {
    try {
        const res = await fetch(`${API}/health`, { credentials: "include" });
        const data = await res.json();
        updateServerStatusBadges(!!data.success);
    } catch {
        updateServerStatusBadges(false);
    }
}

function updateServerStatusBadges(isOnline) {
    document.querySelectorAll(".status-badge").forEach(badge => {
        // Keep existing styles or classes but replace online/offline
        badge.classList.remove("online", "offline");
        badge.classList.add(isOnline ? "online" : "offline");
        const textSpan = badge.querySelector(".server-status-text");
        if (textSpan) textSpan.textContent = isOnline ? "Server Online" : "Server Offline";
    });
}

// ─── API Helper ──────────────────────────────
async function apiCall(endpoint, options = {}) {
    try {
        const res = await fetch(`${API}${endpoint}`, {
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            ...options,
        });
        return await res.json();
    } catch (err) {
        console.error(`API Error [${endpoint}]:`, err);
        showToast(`Connection error: ${err.message}`, "error");
        return null;
    }
}

// ─── Dashboard ───────────────────────────────
async function loadDashboard() {
    // Load owners count
    const ownersData = await apiCall("/owners");
    if (ownersData) {
        document.getElementById("stat-owners").textContent = ownersData.count;
        renderRecentOwners(ownersData.data);
    }

    // Load products summary
    const summaryData = await apiCall("/products/summary");
    if (summaryData && summaryData.data) {
        const s = summaryData.data;
        document.getElementById("stat-products").textContent = s.total_products;
        document.getElementById("stat-value").textContent = `Rs ${formatNumber(s.total_inventory_value)}`;
        document.getElementById("stat-outofstock").textContent = s.out_of_stock || 0;
        document.getElementById("stat-categories").textContent = s.total_categories || 0;
    }

    // Update sold today stat
    document.getElementById("stat-sold").textContent = soldToday;

    // Update profit board
    updateProfitBoard();

    // Load recent products
    const productsData = await apiCall("/products");
    if (productsData) {
        renderRecentProducts(productsData.data);
    }
}

function renderRecentOwners(owners) {
    const container = document.getElementById("recent-owners-list");
    if (!owners || owners.length === 0) {
        container.innerHTML = '<div class="empty-state">No owners yet. Add your first owner!</div>';
        return;
    }
    const recent = owners.slice(0, 5);
    container.innerHTML = recent
        .map(
            (o) => `
        <div class="recent-item">
            <div class="recent-item-info">
                <span class="recent-item-name">${escapeHtml(o.shop_name)}</span>
                <span class="recent-item-sub">${escapeHtml(o.owner_name)}</span>
            </div>
            <span class="recent-item-badge">ID #${o.id}</span>
        </div>
    `
        )
        .join("");
}

function renderRecentProducts(products) {
    const container = document.getElementById("recent-products-list");
    if (!products || products.length === 0) {
        container.innerHTML = '<div class="empty-state">No products yet. Add your first product!</div>';
        return;
    }
    const recent = products.slice(0, 5);
    container.innerHTML = recent
        .map(
            (p) => `
        <div class="recent-item">
            <div class="recent-item-info">
                <span class="recent-item-name">${escapeHtml(p.product_name)}</span>
                <span class="recent-item-sub">${escapeHtml(p.category)} · Rs ${p.price}</span>
            </div>
            <span class="status-pill ${p.is_available && p.quantity > 0 ? "in-stock" : "out-of-stock"}">
                ${p.is_available && p.quantity > 0 ? `● ${p.quantity} ${escapeHtml(p.unit)}` : "● Out"}
            </span>
        </div>
    `
        )
        .join("");
}

// ─── Owners ──────────────────────────────────
async function loadOwners() {
    const data = await apiCall("/owners");
    const tbody = document.getElementById("owners-tbody");

    if (!data || !data.data || data.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No owners found. Click "+ Add Owner" to create one.</td></tr>';
        return;
    }

    tbody.innerHTML = data.data
        .map(
            (o) => `
        <tr>
            <td data-label="ID"><strong>#${o.id}</strong></td>
            <td data-label="Shop Name">${escapeHtml(o.shop_name)}</td>
            <td data-label="Owner Name">${escapeHtml(o.owner_name)}</td>
            <td data-label="Phone">${escapeHtml(o.phone || "—")}</td>
            <td data-label="Email">${escapeHtml(o.email || "—")}</td>
            <td data-label="Created" style="color: var(--text-muted); font-size: 0.82rem">${o.created_at}</td>
        </tr>
    `
        )
        .join("");
}

// ─── Products ────────────────────────────────
async function loadProducts() {
    const data = await apiCall("/products");
    const tbody = document.getElementById("products-tbody");

    if (!data || !data.data || data.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty-state">No products found. Click "+ Add Product" to create one.</td></tr>';
        return;
    }

    tbody.innerHTML = data.data
        .map(
            (p) => `
        <tr>
            <td data-label="ID"><strong>#${p.id}</strong></td>
            <td data-label="Product">${escapeHtml(p.product_name)}</td>
            <td data-label="Category">${escapeHtml(p.category)}</td>
            <td data-label="Price">Rs ${p.price}</td>
            <td data-label="Cost">Rs ${p.cost_price || 0}</td>
            <td data-label="Available"><span class="qty-highlight">${p.quantity}</span> ${escapeHtml(p.unit)}</td>
            <td data-label="Unit">${escapeHtml(p.unit)}</td>
            <td data-label="Status">
                <span class="status-pill ${p.is_available && p.quantity > 0 ? "in-stock" : "out-of-stock"}">
                    ${p.is_available && p.quantity > 0 ? "● In Stock" : "● Out of Stock"}
                </span>
            </td>
            <td data-label="Shop">${escapeHtml(p.shop_name || "—")}</td>
            <td data-label="Actions">
                <div class="action-btns">
                    <button class="btn btn-edit-sm btn-sm" onclick='openEditModal(${JSON.stringify(p).replace(/'/g, "&#39;")})'>
                        ✏️ Edit
                    </button>
                    <button class="btn btn-sell-sm btn-sm" onclick='openSellModal(${JSON.stringify(p).replace(/'/g, "&#39;")})' ${p.quantity <= 0 ? "disabled" : ""}>
                        🛒 Sell
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id})">
                        🗑️
                    </button>
                </div>
            </td>
        </tr>
    `
        )
        .join("");
}

// ─── Edit Product ────────────────────────────
function openEditModal(product) {
    document.getElementById("edit-product-id").value = product.id;
    document.getElementById("edit-product-name").value = product.product_name;
    document.getElementById("edit-product-category").value = product.category;
    document.getElementById("edit-product-price").value = product.price;
    document.getElementById("edit-product-cost").value = product.cost_price || 0;
    document.getElementById("edit-product-quantity").value = product.quantity;
    document.getElementById("edit-product-unit").value = product.unit;
    document.getElementById("edit-qty-hint").textContent =
        `Current stock: ${product.quantity} ${product.unit} — update if new stock arrived`;
    openModal("edit-modal");
}

async function handleEditProduct(e) {
    e.preventDefault();
    const btn = document.getElementById("btn-submit-edit");
    btn.disabled = true;
    btn.textContent = "Saving...";

    const productId = parseInt(document.getElementById("edit-product-id").value);
    const newQty = parseFloat(document.getElementById("edit-product-quantity").value);

    const body = {
        product_name: document.getElementById("edit-product-name").value.trim(),
        category: document.getElementById("edit-product-category").value,
        price: parseFloat(document.getElementById("edit-product-price").value),
        cost_price: parseFloat(document.getElementById("edit-product-cost").value),
        quantity: newQty,
        unit: document.getElementById("edit-product-unit").value,
        is_available: newQty > 0,
    };

    const data = await apiCall(`/product/${productId}`, {
        method: "PUT",
        body: JSON.stringify(body),
    });

    btn.disabled = false;
    btn.textContent = "Save Changes";

    if (data && data.success) {
        showToast(`✅ "${body.product_name}" updated!`, "success");
        closeModal("edit-modal");
        loadProducts();
        loadDashboard();
    } else {
        showToast(`❌ ${data?.message || "Failed to update"}`, "error");
    }
}

// ─── Sell Product ────────────────────────────
function openSellModal(product) {
    // Fill product info card
    document.getElementById("sell-product-info").innerHTML = `
        <div>
            <div class="sell-product-name">${escapeHtml(product.product_name)}</div>
            <div class="sell-product-detail">${escapeHtml(product.category)} · Rs ${product.price} per ${escapeHtml(product.unit)}</div>
        </div>
        <div class="sell-product-stock">
            <div class="sell-product-stock-value">${product.quantity}</div>
            <div class="sell-product-stock-label">Available ${escapeHtml(product.unit)}</div>
        </div>
    `;

    // Set hidden values
    document.getElementById("sell-product-id").value = product.id;
    document.getElementById("sell-product-id").dataset.cost = product.cost_price || 0;
    document.getElementById("sell-product-current-qty").value = product.quantity;
    document.getElementById("sell-quantity").value = "";
    document.getElementById("sell-quantity").max = product.quantity;
    document.getElementById("sell-hint").textContent = `Available: ${product.quantity} ${product.unit}`;
    document.getElementById("sell-summary").style.display = "none";

    // Live preview as user types quantity
    const qtyInput = document.getElementById("sell-quantity");
    qtyInput.oninput = () => {
        const sellQty = parseFloat(qtyInput.value) || 0;
        const currentQty = parseFloat(document.getElementById("sell-product-current-qty").value);
        const summary = document.getElementById("sell-summary");

        if (sellQty > 0) {
            summary.style.display = "block";
            document.getElementById("sell-before").textContent = `${currentQty} ${product.unit}`;
            document.getElementById("sell-amount").textContent = `−${sellQty} ${product.unit}`;
            const remaining = currentQty - sellQty;
            document.getElementById("sell-after").textContent = `${remaining >= 0 ? remaining : 0} ${product.unit}`;
            document.getElementById("sell-after").style.color =
                remaining <= 0 ? "var(--accent-danger)" : "var(--accent-success)";
        } else {
            summary.style.display = "none";
        }
    };

    openModal("sell-modal");
}

async function handleSellProduct(e) {
    e.preventDefault();

    const productId = parseInt(document.getElementById("sell-product-id").value);
    const currentQty = parseFloat(document.getElementById("sell-product-current-qty").value);
    const sellQty = parseFloat(document.getElementById("sell-quantity").value);

    if (sellQty <= 0) {
        showToast("❌ Please enter a valid quantity", "error");
        return;
    }

    if (sellQty > currentQty) {
        showToast(`❌ Cannot sell ${sellQty} — only ${currentQty} available!`, "error");
        return;
    }

    const btn = document.getElementById("btn-submit-sell");
    btn.disabled = true;
    btn.textContent = "Processing...";

    const newQty = currentQty - sellQty;
    const data = await apiCall(`/product/${productId}`, {
        method: "PUT",
        body: JSON.stringify({
            quantity: newQty,
            is_available: newQty > 0,
        }),
    });

    btn.disabled = false;
    btn.textContent = "Confirm Sale";

    if (data && data.success) {
        // Update sold count
        soldToday += sellQty;
        const today = new Date().toDateString();
        localStorage.setItem("smartstore_sold", JSON.stringify({ date: today, count: soldToday }));

        // Update profit tracking
        const sellingPrice = parseFloat(document.getElementById("sell-product-info").querySelector(".sell-product-detail")?.textContent.match(/Rs ([\d.]+)/)?.[1] || 0);
        const costPrice = parseFloat(document.getElementById("sell-product-id").dataset.cost || 0);
        dailySales.revenue += sellingPrice * sellQty;
        dailySales.cost += costPrice * sellQty;
        localStorage.setItem("smartstore_profit", JSON.stringify({ date: today, revenue: dailySales.revenue, cost: dailySales.cost }));

        showToast(`✅ Sold ${sellQty} units! Remaining: ${newQty}`, "success");
        closeModal("sell-modal");
        loadProducts();
        loadDashboard();
    } else {
        showToast(`❌ ${data?.message || "Failed to process sale"}`, "error");
    }
}

// ─── Add Owner ───────────────────────────────
async function handleAddOwner(e) {
    e.preventDefault();
    const btn = document.getElementById("btn-submit-owner");
    btn.disabled = true;
    btn.textContent = "Adding...";

    const body = {
        shop_name: document.getElementById("owner-shop").value.trim(),
        owner_name: document.getElementById("owner-name").value.trim(),
        phone: document.getElementById("owner-phone").value.trim(),
        email: document.getElementById("owner-email").value.trim(),
    };

    const data = await apiCall("/add-owner", {
        method: "POST",
        body: JSON.stringify(body),
    });

    btn.disabled = false;
    btn.textContent = "Add Owner";

    if (data && data.success) {
        showToast(`✅ Owner "${body.shop_name}" added!`, "success");
        closeModal("owner-modal");
        document.getElementById("owner-form").reset();
        loadDashboard();
        loadOwners();
    } else {
        showToast(`❌ ${data?.message || "Failed to add owner"}`, "error");
    }
}

// ─── Add Product ─────────────────────────────
async function handleAddProduct(e) {
    e.preventDefault();
    const btn = document.getElementById("btn-submit-product");
    btn.disabled = true;
    btn.textContent = "Adding...";

    const body = {
        owner_id: parseInt(document.getElementById("product-owner").value),
        product_name: document.getElementById("product-name").value.trim(),
        category: document.getElementById("product-category").value,
        price: parseFloat(document.getElementById("product-price").value),
        cost_price: parseFloat(document.getElementById("product-cost").value),
        quantity: parseFloat(document.getElementById("product-quantity").value),
        unit: document.getElementById("product-unit").value,
        is_available: true,
    };

    const data = await apiCall("/add-product", {
        method: "POST",
        body: JSON.stringify(body),
    });

    btn.disabled = false;
    btn.textContent = "Add Product";

    if (data && data.success) {
        showToast(`✅ Product "${body.product_name}" added!`, "success");
        
        // Remember last selected owner for convenience
        localStorage.setItem("smartstore_last_owner_id", body.owner_id.toString());

        closeModal("product-modal");
        document.getElementById("product-form").reset();
        loadDashboard();
        loadProducts();
    } else {
        showToast(`❌ ${data?.message || "Failed to add product"}`, "error");
    }
}

// ─── Delete Product ──────────────────────────
async function deleteProduct(id) {
    if (!confirm("Are you sure you want to delete this product?")) return;

    const data = await apiCall(`/product/${id}`, { method: "DELETE" });

    if (data && data.success) {
        showToast("🗑️ Product deleted!", "success");
        loadProducts();
        loadDashboard();
    } else {
        showToast(`❌ ${data?.message || "Failed to delete"}`, "error");
    }
}

// ─── Modals ──────────────────────────────────
function openModal(id) {
    document.getElementById(id).classList.add("open");
    // If product modal, load owner options
    if (id === "product-modal") loadOwnerOptions();
}

function closeModal(id) {
    document.getElementById(id).classList.remove("open");
}

async function loadOwnerOptions() {
    const data = await apiCall("/owners");
    const select = document.getElementById("product-owner");
    select.innerHTML = '<option value="">Select owner...</option>';
    if (data && data.data) {
        data.data.forEach((o) => {
            select.innerHTML += `<option value="${o.id}">${escapeHtml(o.shop_name)} — ${escapeHtml(o.owner_name)}</option>`;
        });

        // Auto-select last used owner if available
        const lastOwnerId = localStorage.getItem("smartstore_last_owner_id");
        if (lastOwnerId && [...select.options].some(opt => opt.value === lastOwnerId)) {
            select.value = lastOwnerId;
        }
    }
}

// ─── Search Products ─────────────────────────
function searchProducts() {
    const input = document.getElementById("search-product");
    const filter = input.value.toLowerCase();
    const tbody = document.getElementById("products-tbody");
    if (!tbody) return;
    const trs = tbody.getElementsByTagName("tr");

    for (let i = 0; i < trs.length; i++) {
        if (trs[i].querySelector(".empty-state")) continue;
        
        const textContent = trs[i].textContent || trs[i].innerText;
        if (textContent.toLowerCase().indexOf(filter) > -1) {
            trs[i].style.display = "";
        } else {
            trs[i].style.display = "none";
        }
    }
}

// Close modal on overlay click
document.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-overlay")) {
        e.target.classList.remove("open");
    }
});

// Close modal on Escape key
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        document.querySelectorAll(".modal-overlay.open").forEach((m) => m.classList.remove("open"));
    }
});

// ─── Toast ───────────────────────────────────
function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("hide");
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ─── Utilities ───────────────────────────────
function escapeHtml(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

function formatNumber(num) {
    if (num == null) return "0";
    return Number(num).toLocaleString("en-PK", { maximumFractionDigits: 0 });
}

// ─── Profit Board ────────────────────────────
function updateProfitBoard() {
    const revenue = dailySales.revenue;
    const cost = dailySales.cost;
    const profit = revenue - cost;
    const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : 0;

    document.getElementById("profit-revenue").textContent = `Rs ${formatNumber(revenue)}`;
    document.getElementById("profit-cost").textContent = `Rs ${formatNumber(cost)}`;
    document.getElementById("profit-net").textContent = `Rs ${formatNumber(profit)}`;
    document.getElementById("profit-net").style.color = profit >= 0 ? "var(--accent-success)" : "var(--accent-danger)";

    const bar = document.getElementById("profit-bar");
    bar.style.width = `${Math.min(Math.max(margin, 0), 100)}%`;
    bar.style.background = profit >= 0
        ? "linear-gradient(90deg, var(--accent-success), #34d399)"
        : "linear-gradient(90deg, var(--accent-danger), #f87171)";

    document.getElementById("profit-margin").textContent = `${margin}% profit margin`;
}
