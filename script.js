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
    
    // Close export menu when clicking outside
    document.addEventListener('click', function(event) {
        const exportDropdown = document.querySelector('.export-dropdown');
        const exportMenu = document.getElementById('exportMenu');
        
        if (exportDropdown && !exportDropdown.contains(event.target)) {
            exportMenu.style.display = 'none';
        }
    });
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
                    <button class="action-btn view-btn" onclick="exportProductToPDF('${product.id}')" title="Export PDF">
                        <i class="fas fa-file-pdf"></i>
                    </button>
                    <button class="action-btn edit-btn" onclick="editProduct('${product.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteProduct('${product.id}')" title="Hapus">
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
                    <button class="action-btn view-btn" onclick="exportProductToPDF('${product.id}')" title="Export PDF">
                        <i class="fas fa-file-pdf"></i>
                    </button>
                    <button class="action-btn edit-btn" onclick="editProduct('${product.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteProduct('${product.id}')" title="Hapus">
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

// ============================================
// FITUR EXPORT PDF LENGKAP
// ============================================

// Export to PDF Function
function exportReport() {
    const period = document.getElementById('reportPeriod').value;
    const periodText = getPeriodText(period);
    
    // Create new PDF document
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add header
    addPDFHeader(doc, periodText);
    
    // Get report data
    const reportData = getReportData(period);
    
    // Add summary section
    addPDFSummary(doc, reportData.summary);
    
    // Add table
    addPDFTable(doc, reportData.products);
    
    // Save PDF
    doc.save(`Laporan_HPP_${periodText}_${formatDateForFile(new Date())}.pdf`);
}

function getPeriodText(period) {
    const periods = {
        'all': 'Semua Periode',
        'today': 'Hari Ini',
        'week': 'Minggu Ini',
        'month': 'Bulan Ini'
    };
    return periods[period] || period;
}

function addPDFHeader(doc, periodText) {
    // Company/App header
    doc.setFillColor(102, 126, 234); // Warna primary
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('LAPORAN HPP PRODUK', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('HPP Calculator - Tanpa Packaging', 105, 30, { align: 'center' });
    
    // Period and date info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Periode: ${periodText}`, 14, 50);
    doc.text(`Tanggal Cetak: ${formatDate(new Date())}`, 14, 57);
    doc.text(`Dicetak oleh: ${currentUser.name}`, 14, 64);
    
    // Line separator
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 70, 196, 70);
}

function getReportData(period) {
    let filteredProducts = [...products];
    const now = new Date();
    
    // Filter by period
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
    
    // Calculate summary
    let totalProduction = filteredProducts.length;
    let totalCost = 0;
    let totalIngredients = 0;
    
    filteredProducts.forEach(p => {
        totalCost += p.totalCost || 0;
        totalIngredients += p.ingredients ? p.ingredients.length : 0;
    });
    
    const averageCost = totalProduction > 0 ? totalCost / totalProduction : 0;
    
    return {
        summary: {
            totalProduction,
            totalCost,
            averageCost,
            totalIngredients
        },
        products: filteredProducts
    };
}

function addPDFSummary(doc, summary) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Ringkasan Laporan', 14, 85);
    
    // Summary boxes
    const startY = 95;
    const boxWidth = 45;
    const boxHeight = 25;
    const spacing = 5;
    
    const summaries = [
        { label: 'Total Produksi', value: summary.totalProduction.toString(), icon: '📦' },
        { label: 'Total Biaya', value: formatCurrency(summary.totalCost), icon: '💰' },
        { label: 'Rata-rata HPP', value: formatCurrency(summary.averageCost), icon: '📊' },
        { label: 'Total Bahan', value: summary.totalIngredients.toString(), icon: '🥫' }
    ];
    
    summaries.forEach((item, index) => {
        const x = 14 + (index * (boxWidth + spacing));
        
        // Box background
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(x, startY, boxWidth, boxHeight, 3, 3, 'F');
        
        // Border
        doc.setDrawColor(102, 126, 234);
        doc.setLineWidth(0.5);
        doc.roundedRect(x, startY, boxWidth, boxHeight, 3, 3, 'S');
        
        // Content
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(item.label, x + 3, startY + 8);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(102, 126, 234);
        doc.text(item.value, x + 3, startY + 18);
    });
}

function addPDFTable(doc, products) {
    const startY = 135;
    
    // Table title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Detail Produk', 14, startY - 5);
    
    // Table headers
    const headers = [['No', 'Nama Produk', 'Tgl Dibuat', 'Jml Bahan', 'Total Biaya', 'HPP']];
    
    // Table data
    const data = products.map((product, index) => [
        (index + 1).toString(),
        product.name,
        formatDate(product.createdAt),
        product.ingredients ? product.ingredients.length.toString() : '0',
        formatCurrency(product.totalCost || 0),
        formatCurrency(product.totalCost || 0)
    ]);
    
    // Generate table
    doc.autoTable({
        head: headers,
        body: data,
        startY: startY,
        theme: 'striped',
        headStyles: {
            fillColor: [102, 126, 234],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center'
        },
        columnStyles: {
            0: { cellWidth: 15, halign: 'center' },
            1: { cellWidth: 50 },
            2: { cellWidth: 35 },
            3: { cellWidth: 25, halign: 'center' },
            4: { cellWidth: 35, halign: 'right' },
            5: { cellWidth: 35, halign: 'right' }
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245]
        },
        margin: { left: 14, right: 14 },
        didDrawPage: function(data) {
            // Add footer on each page
            addPDFFooter(doc, data.pageNumber);
        }
    });
    
    // Add total row at the bottom
    const finalY = doc.lastAutoTable.finalY + 10;
    
    // Calculate totals
    const totalProducts = products.length;
    const totalCost = products.reduce((sum, p) => sum + (p.totalCost || 0), 0);
    
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(120, finalY, 80, 15, 2, 2, 'F');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Total Produk:', 125, finalY + 5);
    doc.text(totalProducts.toString(), 145, finalY + 5);
    
    doc.text('Total Biaya:', 125, finalY + 11);
    doc.text(formatCurrency(totalCost), 145, finalY + 11);
}

function addPDFFooter(doc, pageNumber) {
    const pageCount = doc.internal.getNumberOfPages();
    
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    
    // Line separator
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 280, 196, 280);
    
    // Footer text
    doc.text('© 2024 HPP Calculator - Aplikasi Hitung HPP Tanpa Packaging', 105, 287, { align: 'center' });
    doc.text(`Halaman ${pageNumber} dari ${pageCount}`, 105, 293, { align: 'center' });
    
    // Generated timestamp
    doc.text(`Dicetak: ${formatDateTime(new Date())}`, 196, 293, { align: 'right' });
}

// Fungsi tambahan untuk format tanggal di file name
function formatDateForFile(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

function formatDateTime(date) {
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${formatDate(date)} ${hours}:${minutes}:${seconds}`;
}

// Export produk individual ke PDF
function exportProductToPDF(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(102, 126, 234);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('DETAIL PRODUK', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(product.name, 105, 30, { align: 'center' });
    
    // Product info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Informasi Produk', 14, 55);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Nama Produk: ${product.name}`, 14, 65);
    doc.text(`Deskripsi: ${product.description || '-'}`, 14, 72);
    doc.text(`Tanggal Dibuat: ${formatDate(product.createdAt)}`, 14, 79);
    doc.text(`Terakhir Update: ${formatDate(product.updatedAt)}`, 14, 86);
    
    // Ingredients table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Komposisi Bahan Baku', 14, 103);
    
    const headers = [['No', 'Bahan Baku', 'Jumlah', 'Satuan', 'Harga', 'Subtotal']];
    const data = product.ingredients.map((ing, index) => [
        (index + 1).toString(),
        ing.ingredientName,
        ing.quantity.toString(),
        ing.unit,
        formatCurrency(ing.price),
        formatCurrency(ing.subtotal)
    ]);
    
    doc.autoTable({
        head: headers,
        body: data,
        startY: 108,
        theme: 'striped',
        headStyles: {
            fillColor: [102, 126, 234],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
        },
        columnStyles: {
            0: { cellWidth: 15, halign: 'center' },
            4: { halign: 'right' },
            5: { halign: 'right' }
        }
    });
    
    // Total calculation
    const finalY = doc.lastAutoTable.finalY + 15;
    
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(120, finalY, 70, 25, 3, 3, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('TOTAL HPP', 125, finalY + 8);
    
    doc.setFontSize(14);
    doc.setTextColor(102, 126, 234);
    doc.text(formatCurrency(product.totalCost || 0), 125, finalY + 20);
    
    // Footer
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('© 2024 HPP Calculator', 105, 280, { align: 'center' });
    
    doc.save(`Produk_${product.name}_${formatDateForFile(new Date())}.pdf`);
}

// Export semua bahan baku ke PDF
function exportIngredientsToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(102, 126, 234);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('DAFTAR BAHAN BAKU', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text('HPP Calculator - Tanpa Packaging', 105, 30, { align: 'center' });
    
    // Summary
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Total Bahan: ${ingredients.length}`, 14, 50);
    doc.text(`Tanggal Cetak: ${formatDate(new Date())}`, 14, 57);
    
    const totalValue = ingredients.reduce((sum, ing) => sum + (ing.price * ing.stock), 0);
    doc.text(`Total Nilai Stok: ${formatCurrency(totalValue)}`, 14, 64);
    
    // Table
    const headers = [['No', 'Nama Bahan', 'Satuan', 'Harga', 'Stok', 'Nilai Stok']];
    const data = ingredients.map((ing, index) => [
        (index + 1).toString(),
        ing.name,
        ing.unit,
        formatCurrency(ing.price),
        `${ing.stock} ${ing.unit}`,
        formatCurrency(ing.price * ing.stock)
    ]);
    
    doc.autoTable({
        head: headers,
        body: data,
        startY: 75,
        theme: 'striped',
        headStyles: {
            fillColor: [102, 126, 234],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
        },
        columnStyles: {
            0: { cellWidth: 15, halign: 'center' },
            3: { halign: 'right' },
            5: { halign: 'right' }
        }
    });
    
    // Footer
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.text('© 2024 HPP Calculator', 105, 280, { align: 'center' });
    
    doc.save(`Bahan_Baku_${formatDateForFile(new Date())}.pdf`);
}

// Export semua produk ke PDF
function exportAllProductsPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(102, 126, 234);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('DAFTAR SEMUA PRODUK', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text('HPP Calculator - Tanpa Packaging', 105, 30, { align: 'center' });
    
    // Summary
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Total Produk: ${products.length}`, 14, 50);
    doc.text(`Tanggal Cetak: ${formatDate(new Date())}`, 14, 57);
    
    // Calculate totals
    const totalBiaya = products.reduce((sum, p) => sum + (p.totalCost || 0), 0);
    const rataHPP = products.length > 0 ? totalBiaya / products.length : 0;
    
    doc.text(`Total Biaya: ${formatCurrency(totalBiaya)}`, 14, 64);
    doc.text(`Rata-rata HPP: ${formatCurrency(rataHPP)}`, 14, 71);
    
    // Table
    const headers = [['No', 'Nama Produk', 'Jml Bahan', 'Total Biaya', 'HPP', 'Tgl Dibuat']];
    const data = products.map((product, index) => [
        (index + 1).toString(),
        product.name,
        product.ingredients ? product.ingredients.length.toString() : '0',
        formatCurrency(product.totalCost || 0),
        formatCurrency(product.totalCost || 0),
        formatDate(product.createdAt)
    ]);
    
    doc.autoTable({
        head: headers,
        body: data,
        startY: 82,
        theme: 'striped',
        headStyles: {
            fillColor: [102, 126, 234],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
        },
        columnStyles: {
            0: { cellWidth: 15, halign: 'center' },
            3: { halign: 'right' },
            4: { halign: 'right' }
        }
    });
    
    // Footer
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.text('© 2024 HPP Calculator', 105, 280, { align: 'center' });
    
    doc.save(`Semua_Produk_${formatDateForFile(new Date())}.pdf`);
}

// Toggle export menu
function toggleExportMenu() {
    const menu = document.getElementById('exportMenu');
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
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
