// Gestión de productos

class ProductManager {
    constructor() {
        this.products = [];
        this.categories = [];
        this.suppliers = [];
        this.init();
    }

    async init() {
        console.log('Inicializando ProductManager...');
        
        // VERIFICACIÓN DE AUTENTICACIÓN - AGREGADO
        if (!authSystem || !authSystem.getCurrentUser()) {
            console.warn('Usuario no autenticado, redirigiendo a login...');
            window.location.href = 'index.html';
            return;
        }

        await this.loadData();
        this.loadProductsTable();
        this.loadCategoryFilter();
        this.loadProductFormCategories();
        this.loadProductFormSuppliers();
        this.setupEventListeners();
        console.log('ProductManager inicializado correctamente');
    }


    // Cargar datos
    async loadData() {
        this.products = Utils.loadFromStorage('inventory_products') || [];
        this.categories = Utils.loadFromStorage('inventory_categories') || [];
        this.suppliers = Utils.loadFromStorage('inventory_suppliers') || [];
    }

    // Cargar tabla de productos
    loadProductsTable() {
        const tableBody = document.getElementById('productsTableBody');
        if (!tableBody) return;

        try {
            if (this.products.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="8" class="text-center">
                            <div class="empty-state">
                                <div class="icon">📦</div>
                                <p>No hay productos registrados</p>
                                <button class="btn-primary mt-20" onclick="productManager.openProductModal()">
                                    ➕ Agregar Primer Producto
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
                return;
            }

            tableBody.innerHTML = this.products.map(product => {
                const category = this.categories.find(c => c.id === product.category);
                const supplier = this.suppliers.find(s => s.id === product.supplier);
                const stockClass = this.getStockClass(product.currentStock, product.minStock);

                return `
                    <tr>
                        <td>${Utils.escapeHtml(product.code)}</td>
                        <td>${Utils.escapeHtml(product.name)}</td>
                        <td>${Utils.escapeHtml(category?.name || 'Sin categoría')}</td>
                        <td>${Utils.formatCurrency(product.purchasePrice)}</td>
                        <td>${Utils.formatCurrency(product.salePrice)}</td>
                        <td><span class="${stockClass}">${product.currentStock}</span></td>
                        <td>${product.minStock}</td>
                        <td>
                            <button class="btn-secondary" onclick="productManager.editProduct('${Utils.escapeHtml(product.id)}')" title="Editar producto">✏️</button>
                            <button class="btn-danger" onclick="productManager.deleteProduct('${Utils.escapeHtml(product.id)}')" title="Eliminar producto">🗑️</button>
                        </td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            console.error('Error loading products table:', error);
            tableBody.innerHTML = '<tr><td colspan="8" class="text-center">Error al cargar los productos</td></tr>';
        }
    }

    // Obtener clase CSS para el stock
    getStockClass(currentStock, minStock) {
        if (currentStock === 0) return 'stock-out';
        if (currentStock <= minStock) return 'stock-low';
        return 'stock-ok';
    }

    // Cargar filtro de categorías
    loadCategoryFilter() {
        const categoryFilter = document.getElementById('categoryFilter');
        if (!categoryFilter) return;

        categoryFilter.innerHTML = '<option value="">Todas las categorías</option>' +
            this.categories.map(category => 
                `<option value="${Utils.escapeHtml(category.id)}">${Utils.escapeHtml(category.name)}</option>`
            ).join('');
    }

    // Cargar categorías en el formulario
    loadProductFormCategories() {
        const categorySelect = document.getElementById('productCategory');
        if (!categorySelect) return;

        categorySelect.innerHTML = '<option value="">Seleccionar categoría</option>' +
            this.categories.map(category => 
                `<option value="${Utils.escapeHtml(category.id)}">${Utils.escapeHtml(category.name)}</option>`
            ).join('');
    }

    // Cargar proveedores en el formulario
    loadProductFormSuppliers() {
        const supplierSelect = document.getElementById('productSupplier');
        if (!supplierSelect) return;

        supplierSelect.innerHTML = '<option value="">Seleccionar proveedor</option>' +
            this.suppliers.map(supplier => 
                `<option value="${Utils.escapeHtml(supplier.id)}">${Utils.escapeHtml(supplier.name)}</option>`
            ).join('');
    }

    // Configurar event listeners
    setupEventListeners() {
        // Formulario de producto
        const productForm = document.getElementById('productForm');
        if (productForm) {
            productForm.addEventListener('submit', (e) => this.saveProduct(e));
        }

        // Búsqueda
        const searchInput = document.getElementById('searchProduct');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterProducts());
        }

        // Filtros
        const categoryFilter = document.getElementById('categoryFilter');
        const stockFilter = document.getElementById('stockFilter');
        
        if (categoryFilter) categoryFilter.addEventListener('change', () => this.filterProducts());
        if (stockFilter) stockFilter.addEventListener('change', () => this.filterProducts());

        // Precios automáticos
        const purchasePriceInput = document.getElementById('purchasePrice');
        const salePriceInput = document.getElementById('salePrice');
        
        if (purchasePriceInput && salePriceInput) {
            purchasePriceInput.addEventListener('change', () => this.calculateSalePrice());
        }
    }

    // Calcular precio de venta sugerido
    calculateSalePrice() {
        const purchasePrice = parseFloat(document.getElementById('purchasePrice').value);
        const salePriceInput = document.getElementById('salePrice');
        
        if (purchasePrice && salePriceInput && !salePriceInput.value) {
            const suggestedPrice = purchasePrice * 1.3; // 30% de margen
            salePriceInput.value = suggestedPrice.toFixed(2);
        }
    }

    // Filtrar productos
    filterProducts() {
        const searchTerm = document.getElementById('searchProduct').value.toLowerCase();
        const categoryFilter = document.getElementById('categoryFilter').value;
        const stockFilter = document.getElementById('stockFilter').value;

        const filteredProducts = this.products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm) || 
                                product.code.toLowerCase().includes(searchTerm);
            const matchesCategory = !categoryFilter || product.category === categoryFilter;
            const matchesStock = this.matchesStockFilter(product, stockFilter);

            return matchesSearch && matchesCategory && matchesStock;
        });

        this.updateProductsTable(filteredProducts);
    }

    // Verificar filtro de stock
    matchesStockFilter(product, stockFilter) {
        switch (stockFilter) {
            case 'low':
                return product.currentStock <= product.minStock && product.currentStock > 0;
            case 'out':
                return product.currentStock === 0;
            default:
                return true;
        }
    }

    // Actualizar tabla de productos
    updateProductsTable(products) {
        const tableBody = document.getElementById('productsTableBody');
        if (!tableBody) return;

        if (products.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">
                        <div class="empty-state">
                            <div class="icon">🔍</div>
                            <p>No se encontraron productos</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = products.map(product => {
            const category = this.categories.find(c => c.id === product.category);
            const stockClass = this.getStockClass(product.currentStock, product.minStock);

            return `
                <tr>
                    <td>${Utils.escapeHtml(product.code)}</td>
                    <td>${Utils.escapeHtml(product.name)}</td>
                    <td>${Utils.escapeHtml(category?.name || 'Sin categoría')}</td>
                    <td>${Utils.formatCurrency(product.purchasePrice)}</td>
                    <td>${Utils.formatCurrency(product.salePrice)}</td>
                    <td><span class="${stockClass}">${product.currentStock}</span></td>
                    <td>${product.minStock}</td>
                    <td>
                        <button class="btn-secondary" onclick="productManager.editProduct('${Utils.escapeHtml(product.id)}')" title="Editar producto">✏️</button>
                        <button class="btn-danger" onclick="productManager.deleteProduct('${Utils.escapeHtml(product.id)}')" title="Eliminar producto">🗑️</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Abrir modal de producto
    openProductModal() {
        document.getElementById('productModalTitle').textContent = 'Nuevo Producto';
        Utils.clearForm('productForm');
        document.getElementById('productId').value = '';
        
        const modal = document.getElementById('productModal');
        modal.style.display = 'block';
        modal.classList.add('show');
        
        // Enfocar primer campo
        setTimeout(() => {
            const firstInput = document.getElementById('productCode');
            if (firstInput) firstInput.focus();
        }, 100);
    }

    // Cerrar modal de producto
    closeProductModal() {
        const modal = document.getElementById('productModal');
        modal.style.display = 'none';
        modal.classList.remove('show');
    }

    // Editar producto
    editProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) {
            Utils.showNotification('Producto no encontrado', 'danger');
            return;
        }

        document.getElementById('productModalTitle').textContent = 'Editar Producto';
        document.getElementById('productId').value = product.id;
        document.getElementById('productCode').value = product.code;
        document.getElementById('productName').value = product.name;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productSupplier').value = product.supplier || '';
        document.getElementById('purchasePrice').value = product.purchasePrice;
        document.getElementById('salePrice').value = product.salePrice;
        document.getElementById('currentStock').value = product.currentStock;
        document.getElementById('minStock').value = product.minStock;
        document.getElementById('productDescription').value = product.description || '';

        const modal = document.getElementById('productModal');
        modal.style.display = 'block';
        modal.classList.add('show');
        
        // Enfocar primer campo
        setTimeout(() => {
            const firstInput = document.getElementById('productCode');
            if (firstInput) firstInput.focus();
        }, 100);
    }

    // Guardar producto
    async saveProduct(e) {
        e.preventDefault();

        const submitButton = e.target.querySelector('button[type="submit"]');
        Utils.setLoading(submitButton, true);

        try {
            const productId = document.getElementById('productId').value;
            const productData = {
                code: document.getElementById('productCode').value.trim(),
                name: document.getElementById('productName').value.trim(),
                category: document.getElementById('productCategory').value,
                supplier: document.getElementById('productSupplier').value || null,
                purchasePrice: parseFloat(document.getElementById('purchasePrice').value),
                salePrice: parseFloat(document.getElementById('salePrice').value),
                currentStock: parseInt(document.getElementById('currentStock').value),
                minStock: parseInt(document.getElementById('minStock').value),
                description: document.getElementById('productDescription').value.trim()
            };

            // Validaciones
            if (!this.validateProduct(productData)) {
                Utils.setLoading(submitButton, false);
                return;
            }

            // Simular delay de red
            await new Promise(resolve => setTimeout(resolve, 500));

            if (productId) {
                // Editar producto existente
                this.updateProduct(productId, productData);
            } else {
                // Crear nuevo producto
                this.createProduct(productData);
            }

            this.closeProductModal();
            await this.loadData();
            this.loadProductsTable();
            
            // Disparar evento para actualizar dashboard
            document.dispatchEvent(new CustomEvent('dataUpdated'));
            
            Utils.showNotification(`Producto ${productId ? 'actualizado' : 'creado'} correctamente`, 'success');
        } catch (error) {
            console.error('Error saving product:', error);
            Utils.showNotification('Error al guardar el producto', 'danger');
        } finally {
            Utils.setLoading(submitButton, false);
        }
    }

    // Validar producto
    validateProduct(product) {
        if (!product.code || !product.name || !product.category) {
            Utils.showNotification('Por favor complete todos los campos obligatorios', 'danger');
            return false;
        }

        // Verificar código único
        if (!document.getElementById('productId').value) {
            const existingProduct = this.products.find(p => p.code === product.code);
            if (existingProduct) {
                Utils.showNotification('Ya existe un producto con este código', 'danger');
                return false;
            }
        }

        if (!Utils.isPositiveNumber(product.purchasePrice) || !Utils.isPositiveNumber(product.salePrice)) {
            Utils.showNotification('Los precios deben ser números positivos', 'danger');
            return false;
        }

        if (!Number.isInteger(product.currentStock) || product.currentStock < 0) {
            Utils.showNotification('El stock actual debe ser un número entero no negativo', 'danger');
            return false;
        }

        if (!Number.isInteger(product.minStock) || product.minStock < 0) {
            Utils.showNotification('El stock mínimo debe ser un número entero no negativo', 'danger');
            return false;
        }

        if (product.salePrice <= product.purchasePrice) {
            if (!Utils.confirmAction('El precio de venta es menor o igual al precio de compra. ¿Desea continuar?')) {
                return false;
            }
        }

        return true;
    }

    // Crear producto
    createProduct(productData) {
        const newProduct = {
            ...productData,
            id: Utils.generateId()
        };

        this.products.push(newProduct);
        Utils.saveToStorage('inventory_products', this.products);
    }

    // Actualizar producto
    updateProduct(productId, productData) {
        const index = this.products.findIndex(p => p.id === productId);
        if (index !== -1) {
            this.products[index] = { ...this.products[index], ...productData };
            Utils.saveToStorage('inventory_products', this.products);
        }
    }

    // Eliminar producto
    async deleteProduct(productId) {
        if (!Utils.confirmAction('¿Estás seguro de que quieres eliminar este producto?')) {
            return;
        }

        try {
            // Verificar si hay movimientos asociados
            const movements = Utils.loadFromStorage('inventory_movements') || [];
            const hasMovements = movements.some(m => m.productId === productId);
            
            if (hasMovements) {
                Utils.showNotification('No se puede eliminar el producto porque tiene movimientos asociados', 'danger');
                return;
            }

            this.products = this.products.filter(p => p.id !== productId);
            Utils.saveToStorage('inventory_products', this.products);
            
            await this.loadData();
            this.loadProductsTable();
            
            // Disparar evento para actualizar dashboard
            document.dispatchEvent(new CustomEvent('dataUpdated'));
            
            Utils.showNotification('Producto eliminado correctamente', 'success');
        } catch (error) {
            console.error('Error deleting product:', error);
            Utils.showNotification('Error al eliminar el producto', 'danger');
        }
    }
}

// Inicializar gestor de productos
let productManager;

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('productos.html')) {
        productManager = new ProductManager();
    }
});