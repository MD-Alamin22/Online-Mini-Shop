const API_URL = 'http://localhost:3000/api';

async function fetchProducts() {
  try {
    const res = await fetch(`${API_URL}/products`);
    return await res.json();
  } catch (e) {
    console.error('Failed to fetch products', e);
    return [];
  }
}

async function loginUser(email, password) {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return await res.json();
  } catch (e) {
    return { error: 'Network error' };
  }
}

async function registerUser(name, email, password, role) {
  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });
    return await res.json();
  } catch (e) {
    return { error: 'Network error' };
  }
}

async function createProduct(data) {
  const token = localStorage.getItem('token');
  try {
    const isFormData = data instanceof FormData;
    const headers = { 'Authorization': `Bearer ${token}` };
    if (!isFormData) headers['Content-Type'] = 'application/json';

    const res = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers,
      body: isFormData ? data : JSON.stringify(data)
    });
    return await res.json();
  } catch (e) {
    return { error: 'Network error' };
  }
}

async function updateProduct(id, data) {
  const token = localStorage.getItem('token');
  try {
    const isFormData = data instanceof FormData;
    const headers = { 'Authorization': `Bearer ${token}` };
    if (!isFormData) headers['Content-Type'] = 'application/json';

    const res = await fetch(`${API_URL}/products/${id}`, {
      method: 'PUT',
      headers,
      body: isFormData ? data : JSON.stringify(data)
    });
    return await res.json();
  } catch (e) {
    return { error: 'Network error' };
  }
}

async function deleteProduct(id) {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_URL}/products/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await res.json();
  } catch (e) {
    return { error: 'Network error' };
  }
}

async function placeOrder(orderData) {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(orderData)
    });
    return await res.json();
  } catch (e) {
    return { error: 'Network error' };
  }
}

async function fetchAllOrders() {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_URL}/orders`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await res.json();
  } catch (e) {
    return [];
  }
}

async function fetchMyOrders() {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API_URL}/orders/my-orders`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return await res.json();
  } catch (e) {
    return [];
  }
}
