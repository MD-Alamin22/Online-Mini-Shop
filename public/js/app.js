// Global App Logic

// Check auth state and update navbar
function updateNav() {
  const navActions = document.getElementById('nav-actions');
  if (!navActions) return;

  const user = JSON.parse(localStorage.getItem('user'));
  const cart = getCart();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  let html = '';

  if (user) {
    html += `
    <li class="nav-item me-2 d-flex align-items-center">
      <a class="nav-link position-relative pt-2 pb-2 d-flex align-items-center" href="my-orders.html" title="My Orders">
        <i class="bi bi-box-seam fs-5 me-1"></i> <span class="d-none d-sm-inline">My Orders</span>
      </a>
    </li>
    `;
  }

  html += `
    <li class="nav-item me-3">
      <a class="nav-link position-relative pt-2 pb-2" href="cart.html">
        <i class="bi bi-cart3 fs-5"></i>
        ${cartCount > 0 ? `<span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" id="cart-badge">${cartCount}</span>` : ''}
      </a>
    </li>
  `;

  if (user) {
    if (user.role === 'admin') {
      html += `
        <li class="nav-item me-2"><a class="nav-link" href="admin.html">Admin</a></li>
      `;
    }
    html += `
      <li class="nav-item dropdown">
        <a class="nav-link dropdown-toggle d-flex align-items-center" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown">
          <i class="bi bi-person-circle fs-5 me-1"></i> ${user.name}
        </a>
        <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0">
          <li><a class="dropdown-item text-danger" href="#" onclick="logout()"><i class="bi bi-box-arrow-right me-2"></i>Logout</a></li>
        </ul>
      </li>
    `;
  } else {
    html += `
      <li class="nav-item"><a class="btn btn-outline-light btn-sm me-2 fw-semibold" href="login.html">Log In</a></li>
      <li class="nav-item"><a class="btn btn-primary btn-sm fw-semibold" href="register.html">Sign Up</a></li>
    `;
  }

  navActions.innerHTML = html;
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

// Cart Logic
function getCart() {
  return JSON.parse(localStorage.getItem('cart') || '[]');
}

function addToCart(productId, title, price, image) {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    showToast('Please log in to add items to your cart.');
    setTimeout(() => window.location.href = 'login.html', 1500);
    return;
  }

  const cart = getCart();
  const existing = cart.find(i => i.productId === productId);
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ productId, name: title, price: parseFloat(price), image, quantity: 1 });
  }
  localStorage.setItem('cart', JSON.stringify(cart));
  updateNav();
  showToast(`${title} added to cart!`);
}

function updateCartQuantity(productId, delta) {
  let cart = getCart();
  const existing = cart.find(i => i.productId === productId);
  if (existing) {
    existing.quantity += delta;
    if (existing.quantity <= 0) {
      cart = cart.filter(i => i.productId !== productId);
    }
  }
  localStorage.setItem('cart', JSON.stringify(cart));
  updateNav();
  if (window.location.pathname.includes('cart.html')) renderCart();
}

// UI Utilities
function showToast(message) {
  const toastEl = document.getElementById('liveToast');
  if(toastEl) {
    document.getElementById('toast-message').textContent = message;
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
  }
}

function updateCartIcon() {
  updateNav();
}

// Products Page Logic
async function loadProducts(renderCb) {
  const loader = document.getElementById('loader');
  if (loader) loader.style.display = 'block';
  
  const products = await fetchProducts();
  
  if (loader) loader.style.display = 'none';

  if (products && !products.error) {
    renderCb(products);
  } else {
    const list = document.getElementById('product-list');
    if (list) list.innerHTML = '<div class="alert alert-danger w-100 text-center">Failed to load products. Check server connection.</div>';
  }
}

function renderProducts(products) {
  const list = document.getElementById('product-list');
  if (!list) return;

  if (products.length === 0) {
    list.innerHTML = '<div class="col-12 text-center text-muted py-5"><h4>No products available right now.</h4></div>';
    return;
  }

  list.innerHTML = products.map(p => `
    <div class="col-sm-6 col-md-4 col-lg-3">
      <div class="card product-card">
        <div class="product-img-wrapper">
          <img src="${p.image_url || 'https://via.placeholder.com/300'}" alt="${p.name}">
        </div>
        <div class="card-body d-flex flex-column">
          <h5 class="card-title fw-bold text-truncate">${p.name}</h5>
          <p class="card-text text-muted mb-auto small" style="min-height: 40px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${p.description || ''}
          </p>
          <div class="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
            <span class="fs-5 fw-bold text-primary">$${parseFloat(p.price).toFixed(2)}</span>
            <button class="btn btn-sm btn-dark fw-semibold p-hover" onclick="addToCart(${p.id}, '${p.name.replace(/'/g, "\\'")}', ${p.price}, '${p.image_url}')">
              <i class="bi bi-plus-lg me-1"></i> Add
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

// Cart Page Logic
function renderCart() {
  const itemsContainer = document.getElementById('cart-items');
  const summaryEl = document.getElementById('cart-summary');
  const emptyEl = document.getElementById('empty-cart');
  const contentEl = document.getElementById('cart-content');
  
  if (!itemsContainer) return;

  const cart = getCart();

  if (cart.length === 0) {
    contentEl.style.display = 'none';
    emptyEl.style.display = 'block';
    return;
  }

  contentEl.style.display = 'flex';
  emptyEl.style.display = 'none';
  summaryEl.style.display = 'block';

  let total = 0;
  itemsContainer.innerHTML = cart.map(item => {
    total += (item.price * item.quantity);
    return `
      <div class="card mb-3 shadow-sm border-0">
        <div class="card-body p-3">
          <div class="d-flex align-items-center">
            <img src="${item.image || 'https://via.placeholder.com/150'}" class="rounded me-3" style="width: 80px; height: 80px; object-fit: cover;">
            <div class="flex-grow-1">
              <h5 class="fw-bold mb-1">${item.name}</h5>
              <div class="text-primary fw-semibold">$${item.price.toFixed(2)}</div>
            </div>
            <div class="d-flex align-items-center bg-light rounded p-1 shadow-sm me-3">
              <button class="btn btn-sm btn-light border-0 px-2" onclick="updateCartQuantity(${item.productId}, -1)"><i class="bi bi-dash"></i></button>
              <span class="mx-3 fw-bold">${item.quantity}</span>
              <button class="btn btn-sm btn-light border-0 px-2" onclick="updateCartQuantity(${item.productId}, 1)"><i class="bi bi-plus"></i></button>
            </div>
            <div class="text-end fw-bold fs-5 min-w-75px">
              $${(item.price * item.quantity).toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  document.getElementById('cart-subtotal').textContent = `$${total.toFixed(2)}`;
  document.getElementById('cart-total').textContent = `$${total.toFixed(2)}`;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', updateNav);
