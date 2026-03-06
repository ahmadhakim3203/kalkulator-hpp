// Global variables
let currentUser = null;
let products = [];
let ingredients = [];
let autoSaveTimer = null;

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const user = localStorage.getItem('currentUser');
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    currentUser = JSON.parse(user);
    document.getElementById('usernameDisplay').textContent = currentUser.name;
    
    // Load data
    loadData();
    
    // Setup navigation
    setupNavigation();
    
    // Start auto-save
    startAutoSave();
    
    // Update dashboard stats
    updateDashboard();
});

// Navigation
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all nav items
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Show corresponding page
            const pageId = this.dataset.page;
            showPage(pageId);
            
            // Update page title
            updatePageTitle(pageId);
        });
    });
}

function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page
    document.getElementById(pageId).classList.add('active');
    
    // Load page specific data
    switch(pageId) {
        case 'products':
            loadProductsTable();
            break;
        case 'ingredients':
            loadIngredientsTable();
            break;
        case 'calculator':
            loadCalculatorProducts();
            break;
        case 'reports':
            generateReport();
            break;
    }
}

function updatePageTitle(pageId) {
    const titles = {
        'dashboard': 'Dashboard',
        'products': 'Manajemen Produk',
        'ingredients': 'Manajemen Bahan Baku',
        'calculator': 'Kalkulator HPP',
        'reports': 'Laporan HPP'
    };
    
    const descriptions = {
        'dashboard': 'Selamat datang di aplikasi HPP Calculator',
        'products': 'Kelola data produk Anda',
        'ingredients': 'Kelola data bahan baku',
        'calculator': 'Hitung HPP produk',
        'reports': 'Lihat laporan HPP'
    };
    
    document.getElementById('pageTitle').textContent = titles[pageId];
    document.getElementById('pageDescription').textContent = descriptions[pageId];
}

// Data Management
function loadData() {
    // Load products
    const savedProducts = localStorage.getItem('products');
    if (savedProducts) {
        products = JSON.parse(savedProducts);
    }
    
    // Load ingredients
    const savedIngredients = localStorage.getItem('ingredients');
    if (savedIngredients) {
        ingredients = JSON.parse(savedIngredients);
    }
}

function saveData() {
    localStorage.setItem('products', JSON.stringify(products));
    localStorage.setItem('ingredients', JSON.stringify(ingredients));
    
    // Update auto-save indicator
    const indicator = document.getElementById('autoSaveIndicator');
    indicator.innerHTML = '<i class="fas fa-check-circle"></i><span>Tersimpan</span>';
    
    setTimeout(() => {
        indicator.innerHTML = '<i class="fas fa-save"></i><span>Tersimpan</span>';
    }, 2000);
}

// Auto Save
function startAutoSave() {
    setInterval(() => {
        saveData();
    }, 30000); // Auto save every 30 seconds
}

// Dashboard
function updateDashboard() {
    document.getElementById('totalProducts').textContent = products.length;
    document.getElementById('totalIngredients').textContent = ingredients.length;
    
    // Calculate average HPP
    let totalHPP = 0;
    let productCount = 0;
    
    products.forEach(product => {
        if (product.totalCost) {
            totalHPP += product.totalCost;
            productCount++;
        }
    });
    
    const avgHPP = productCount > 0 ? totalHPP / productCount : 0;
    document.getElementById('avgHPP').textContent = formatCurrency(avgHPP);
    
    // Load recent products
    loadRecentProducts();
}

function loadRecentProducts() {
    const recentProducts = products.slice(-5).reverse();
    const tbody = document.getElementById('recentProductsBody');
    
    tbody.innerHTML = '';
    recentProducts.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.name}</td>
            <td>${product.ingredients ? product.ingredients.length : 0}</td>
            <td>${formatCurrency(product.totalCost || 0)}</td>
            <td>
                <div class="action-btns">
                    <button class="action-btn edit-btn" onclick="editProduct('${product.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteProduct('${product.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Products Management
function loadProductsTable() {
    const tbody = document.getElementById('productsTableBody');
    tbody.innerHTML = '';
    
    products.forEach((product, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${product.name}</td>
            <td>${product.description || '-'}</td>
            <td>${product.ingredients ? product.ingredients.length : 0}</td>
            <td>${formatCurrency(product.totalCost || 0)}</td>
            <td>${formatDate(product.createdAt)}</td>
            <td>
                <div class="action-btns">
                    <button class="action-btn edit-btn" onclick="editProduct('${product.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteProduct('${product.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function filterProducts() {
    const searchTerm = document.getElementById('searchProduct').value.toLowerCase();
    const rows = document.querySelectorAll('#productsTableBody tr');
    
    rows.forEach(row => {
        const productName = row.cells[1].textContent.toLowerCase();
        if (productName.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function openProductModal(productId = null) {
    const modal = document.getElementById('productModal');
    const title = document.getElementById('modalTitle');
    
    if (productId) {
        title.textContent = 'Edit Produk';
        const product = products.find(p => p.id === productId);
        if (product) {
            document.getElementById('productId').value = product.id;
            document.getElementById('productName').value = product.name;
            document.getElementById('productDescription').value = product.description || '';
            
            // Load ingredients
            const container = document.getElementById('ingredientsContainer');
            container.innerHTML = '';
            
            if (product.ingredients) {
                product.ingredients.forEach(ing => {
                    addIngredientRow(ing.ingredientId, ing.quantity);
                });
            }
        }
    } else {
        title.textContent = 'Tambah Produk Baru';
        document.getElementById('productForm').reset();
        document.getElementById('productId').value = '';
        document.getElementById('ingredientsContainer').innerHTML = '';
    }
    
    modal.style.display = 'block';
}

function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
}

function addIngredientRow(selectedIngredientId = '', quantity = '') {
    const container = document.getElementById('ingredientsContainer');
    const row = document.createElement('div');
    row.className = 'ingredient-row';
    
    // Create select options
    let options = '<option value="">Pilih Bahan</option>';
    ingredients.forEach(ing => {
        const selected = ing.id === selectedIngredientId ? 'selected' : '';
        options += `<option value="${ing.id}" ${selected}>${ing.name} (${ing.unit})</option>`;
    });
    
    row.innerHTML = `
        <select class="ingredient-select" required>
            ${options}
        </select>
        <input type="number" class="ingredient-qty" placeholder="Jumlah" value="${quantity}" required min="0" step="0.01">
        <button type="button" class="remove-ingredient" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(row);
}

function saveProduct() {
    const id = document.getElementById('productId').value;
    const name = document.getElementById('productName').value;
    const description = document.getElementById('productDescription').value;
    
    // Get ingredients
    const ingredientRows = document.querySelectorAll('.ingredient-row');
    const productIngredients = [];
    let totalCost = 0;
    
    ingredientRows.forEach(row => {
        const select = row.querySelector('.ingredient-select');
        const qty = parseFloat(row.querySelector('.ingredient-qty').value);
        
        if (select.value && qty > 0) {
            const ingredient = ingredients.find(i => i.id === select.value);
            if (ingredient) {
                const cost = ingredient.price * qty;
                totalCost += cost;
                
                productIngredients.push({
                    ingredientId: select.value,
                    ingredientName: ingredient.name,
                    quantity: qty,
                    unit: ingredient.unit,
                    price: ingredient.price,
                    subtotal: cost
                });
            }
        }
    });
    
    if (id) {
        // Update existing product
        const index = products.findIndex(p => p.id === id);
        if (index !== -1) {
            products[index] = {
                ...products[index],
                name,
                description,
                ingredients: productIngredients,
                totalCost,
                updatedAt: new Date().toISOString()
            };
        }
    } else {
        // Add new product
        const newProduct = {
            id: generateId(),
            name,
            description,
            ingredients: productIngredients,
            totalCost,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        products.push(newProduct);
    }
    
    saveData();
    closeProductModal();
    loadProductsTable();
    updateDashboard();
}

function editProduct(id) {
    openProductModal(id);
}

function deleteProduct(id) {
    if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
        products = products.filter(p => p.id !== id);
        saveData();
        loadProductsTable();
        updateDashboard();
    }
}

// Ingredients Management
function loadIngredientsTable() {
    const tbody = document.getElementById('ingredientsTableBody');
    tbody.innerHTML = '';
    
    ingredients.forEach((ingredient, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${ingredient.name}</td>
            <td>${ingredient.unit}</td>
            <td>${formatCurrency(ingredient.price)}</td>
            <td>${ingredient.stock} ${ingredient.unit}</td>
            <td>${formatDate(ingredient.createdAt)}</td>
            <td>
                <div class="action-btns">
                    <button class="action-btn edit-btn" onclick="editIngredient('${ingredient.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteIngredient('${ingredient.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function filterIngredients() {
    const searchTerm = document.getElementById('searchIngredient').value.toLowerCase();
    const rows = document.querySelectorAll('#ingredientsTableBody tr');
    
    rows.forEach(row => {
        const ingredientName = row.cells[1].textContent.toLowerCase();
        if (ingredientName.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function openIngredientModal(ingredientId = null) {
    const modal = document.getElementById('ingredientModal');
    const title = document.getElementById('ingredientModalTitle');
    
    if (ingredientId) {
        title.textContent = 'Edit Bahan Baku';
        const ingredient = ingredients.find(i => i.id === ingredientId);
        if (ingredient) {
            document.getElementById('ingredientId').value = ingredient.id;
            document.getElementById('ingredientName').value = ingredient.name;
            document.getElementById('ingredientUnit').value = ingredient.unit;
            document.getElementById('ingredientPrice').value = ingredient.price;
            document.getElementById('ingredientStock').value = ingredient.stock;
        }
    } else {
        title.textContent = 'Tambah Bahan Baku';
        document.getElementById('ingredientForm').reset();
        document.getElementById('ingredientId').value = '';
    }
    
    modal.style.display = 'block';
}

function closeIngredientModal() {
    document.getElementById('ingredientModal').style.display = 'none';
}

function saveIngredient() {
    const id = document.getElementById('ingredientId').value;
    const name = document.getElementById('ingredientName').value;
    const unit = document.getElementById('ingredientUnit').value;
    const price = parseFloat(document.getElementById('ingredientPrice').value);
    const stock = parseFloat(document.getElementById('ingredientStock').value);
    
    if (id) {
        // Update existing ingredient
        const index = ingredients.findIndex(i => i.id === id);
        if (index !== -1) {
            ingredients[index] = {
                ...ingredients[index],
                name,
                unit,
                price,
                stock,
                updatedAt: new Date().toISOString()
            };
        }
    } else {
        // Add new ingredient
        const newIngredient = {
            id: generateId(),
            name,
            unit,
            price,
            stock,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        ingredients.push(newIngredient);
    }
    
    saveData();
    closeIngredientModal();
    loadIngredientsTable();
    updateDashboard();
}

function editIngredient(id) {
    openIngredientModal(id);
}

function deleteIngredient(id) {
    if (confirm('Apakah Anda yakin ingin menghapus bahan baku ini?')) {
        ingredients = ingredients.filter(i => i.id !== id);
        saveData();
        loadIngredientsTable();
        updateDashboard();
    }
}

// Calculator
function loadCalculatorProducts() {
    const select = document.getElementById('calcProduct');
    select.innerHTML = '<option value="">-- Pilih Produk --</option>';
    
    products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = product.name;
        select.appendChild(option);
    });
}

function loadProductForCalculation() {
    const productId = document.getElementById('calcProduct').value;
    const detailsDiv = document.getElementById('calculationDetails');
    
    if (!productId) {
        detailsDiv.style.display = 'none';
        return;
    }
    
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const tbody = document.getElementById('calculationIngredients');
    tbody.innerHTML = '';
    
    let totalCost = 0;
    
    if (product.ingredients) {
        product.ingredients.forEach(ing => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${ing.ingredientName}</td>
                <td>${ing.quantity}</td>
                <td>${ing.unit}</td>
                <td>${formatCurrency(ing.price)}</td>
                <td>${formatCurrency(ing.subtotal)}</td>
            `;
            tbody.appendChild(row);
            totalCost += ing.subtotal;
        });
    }
    
    document.getElementById('totalMaterialCost').textContent = formatCurrency(totalCost);
    document.getElementById('hppPerProduct').textContent = formatCurrency(totalCost);
    
    detailsDiv.style.display = 'block';
}

// Reports
function generateReport() {
    const period = document.getElementById('reportPeriod').value;
    let filteredProducts = [...products];
    
    const now = new Date();
    if (period === 'today') {
        filteredProducts = products.filter(p => {
            const date = new Date(p.createdAt);
            return date.toDateString() === now.toDateString();
        });
    } else if (period === 'week') {
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        filteredProducts = products.filter(p => new Date(p.createdAt) >= weekAgo);
    } else if (period === 'month') {
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
        filteredProducts = products.filter(p => new Date(p.createdAt) >= monthAgo);
    }
    
    // Update summary
    let totalProduction = filteredProducts.length;
    let totalCost = 0;
    
    filteredProducts.forEach(p => {
        totalCost += p.totalCost || 0;
    });
    
    const averageCost = totalProduction > 0 ? totalCost / totalProduction : 0;
    
    document.getElementById('totalProduction').textContent = totalProduction;
    document.getElementById('totalCost').textContent = formatCurrency(totalCost);
    document.getElementById('averageCost').textContent = formatCurrency(averageCost);
    
    // Load table
    const tbody = document.getElementById('reportBody');
    tbody.innerHTML = '';
    
    filteredProducts.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(product.createdAt)}</td>
            <td>${product.name}</td>
            <td>${product.ingredients ? product.ingredients.length : 0}</td>
            <td>${formatCurrency(product.totalCost || 0)}</td>
            <td>${formatCurrency(product.totalCost || 0)}</td>
        `;
        tbody.appendChild(row);
    });
}

function exportReport() {
    alert('Fitur export PDF akan segera hadir!');
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', function() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
});

// Utility Functions
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatCurrency(value) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(value);
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

// Click outside modal to close
window.onclick = function(event) {
    const productModal = document.getElementById('productModal');
    const ingredientModal = document.getElementById('ingredientModal');
    
    if (event.target === productModal) {
        closeProductModal();
    }
    if (event.target === ingredientModal) {
        closeIngredientModal();
    }
}