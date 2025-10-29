// Aplicación principal - Dashboard

class InventoryApp {
    constructor() {
        this.products = [];
        this.movements = [];
        this.categories = [];
        this.suppliers = [];
        this.init();
    }

    // Inicializar aplicación
    async init() {
        await this.loadData();
        this.setupDashboard();
        this.setupEventListeners();
    }

    // Cargar datos
    async loadData() {
        try {
            this.products = Utils.loadFromStorage('inventory_products') || [];
            this.movements = Utils.loadFromStorage('inventory_movements') || [];
            this.categories = Utils.loadFromStorage('inventory_categories') || [];
            this.suppliers = Utils.loadFromStorage('inventory_suppliers') || [];

            // Datos de ejemplo si no hay datos
            if (this.products.length === 0) {
                await this.loadSampleData();
            }
        } catch (error) {
            console.error('Error loading data:', error);
            Utils.showNotification('Error al cargar los datos', 'danger');
        }
    }

    // Cargar datos de ejemplo
    async loadSampleData() {
        // Categorías de ejemplo
        this.categories = [
            { id: 'cat1', name: 'Electrónicos', description: 'Productos electrónicos' },
            { id: 'cat2', name: 'Ropa', description: 'Prendas de vestir' },
            { id: 'cat3', name: 'Hogar', description: 'Artículos para el hogar' },
            { id: 'cat4', name: 'Deportes', description: 'Artículos deportivos' }
        ];

        // Proveedores de ejemplo
        this.suppliers = [
            { 
                id: 'sup1', 
                name: 'TecnoSupply S.A.', 
                contact: 'Juan Pérez',
                email: 'juan@tecnosupply.com',
                phone: '+1234567890',
                address: 'Av. Tecnología 123'
            },
            { 
                id: 'sup2', 
                name: 'ModaExpress', 
                contact: 'María García',
                email: 'maria@modaexpress.com',
                phone: '+0987654321',
                address: 'Calle Moda 456'
            }
        ];

        // Productos de ejemplo
        this.products = [
            {
                id: 'prod1',
                code: 'PROD001',
                name: 'Laptop Gamer',
                category: 'cat1',
                supplier: 'sup1',
                purchasePrice: 800,
                salePrice: 1200,
                currentStock: 15,
                minStock: 5,
                description: 'Laptop para gaming de alta gama'
            },
            {
                id: 'prod2',
                code: 'PROD002',
                name: 'Smartphone Android',
                category: 'cat1',
                supplier: 'sup1',
                purchasePrice: 300,
                salePrice: 450,
                currentStock: 3,
                minStock: 10,
                description: 'Teléfono inteligente Android'
            },
            {
                id: 'prod3',
                code: 'PROD003',
                name: 'Camiseta Deportiva',
                category: 'cat2',
                supplier: 'sup2',
                purchasePrice: 15,
                salePrice: 25,
                currentStock: 50,
                minStock: 20,
                description: 'Camiseta para actividades deportivas'
            }
        ];

        // Movimientos de ejemplo
        this.movements = [
            {
                id: 'mov1',
                productId: 'prod1',
                type: 'entrada',
                quantity: 20,
                reason: 'compra',
                date: new Date().toISOString(),
                userId: '1',
                notes: 'Compra inicial'
            },
            {
                id: 'mov2',
                productId: 'prod1',
                type: 'salida',
                quantity: 5,
                reason: 'venta',
                date: new Date(Date.now() - 86400000).toISOString(),
                userId: '1',
                notes: 'Venta a cliente'
            }
        ];

        // Guardar datos
        this.saveAllData();
    }

    // Guardar todos los datos
    saveAllData() {
        Utils.saveToStorage('inventory_products', this.products);
        Utils.saveToStorage('inventory_movements', this.movements);
        Utils.saveToStorage('inventory_categories', this.categories);
        Utils.saveToStorage('inventory_suppliers', this.suppliers);
    }

    // Configurar dashboard
    setupDashboard() {
        this.updateStats();
        this.updateRecentActivity();
        this.updateLowStockAlerts();
    }

    // Actualizar estadísticas
    updateStats() {
        try {
            const totalProducts = this.products.length;
            const lowStockProducts = this.products.filter(p => p.currentStock <= p.minStock && p.currentStock > 0).length;
            const outOfStockProducts = this.products.filter(p => p.currentStock === 0).length;
            const todayMovements = this.movements.filter(m => {
                const movementDate = new Date(m.date).toDateString();
                const today = new Date().toDateString();
                return movementDate === today;
            }).length;
            const totalSuppliers = this.suppliers.length;

            // Actualizar elementos del DOM
            this.updateElementText('totalProducts', totalProducts);
            this.updateElementText('lowStockProducts', lowStockProducts + outOfStockProducts);
            this.updateElementText('todayMovements', todayMovements);
            this.updateElementText('totalSuppliers', totalSuppliers);
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }

    // Helper para actualizar texto de elementos
    updateElementText(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    // Actualizar actividad reciente
    updateRecentActivity() {
        const recentActivity = document.getElementById('recentActivity');
        if (!recentActivity) return;

        try {
            const recentMovements = this.movements
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 5);

            if (recentMovements.length === 0) {
                recentActivity.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">📊</div>
                        <p>No hay actividad reciente</p>
                    </div>
                `;
                return;
            }

            recentActivity.innerHTML = recentMovements.map(movement => {
                const product = this.products.find(p => p.id === movement.productId);
                const movementType = movement.type === 'entrada' ? '📥 Entrada' : '📤 Salida';
                const movementClass = movement.type === 'entrada' ? 'text-success' : 'text-danger';
                
                return `
                    <div class="activity-item">
                        <div class="activity-type ${movementClass}">${movementType}</div>
                        <div class="activity-details">${Utils.escapeHtml(product?.name || 'Producto no encontrado')} - ${movement.quantity} unidades</div>
                        <div class="activity-time">${Utils.formatDate(movement.date)}</div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Error updating recent activity:', error);
            recentActivity.innerHTML = '<p>Error al cargar la actividad reciente</p>';
        }
    }

    // Actualizar alertas de stock bajo
    updateLowStockAlerts() {
        const lowStockAlerts = document.getElementById('lowStockAlerts');
        if (!lowStockAlerts) return;

        try {
            const lowStockProducts = this.products.filter(p => p.currentStock <= p.minStock);

            if (lowStockProducts.length === 0) {
                lowStockAlerts.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">✅</div>
                        <p>No hay alertas de stock bajo</p>
                    </div>
                `;
                return;
            }

            lowStockAlerts.innerHTML = lowStockProducts.map(product => {
                const stockStatus = product.currentStock === 0 ? 'stock-out' : 'stock-low';
                const statusText = product.currentStock === 0 ? 'SIN STOCK' : 'STOCK BAJO';
                
                return `
                    <div class="alert-item">
                        <div class="alert-info">
                            <h4>${Utils.escapeHtml(product.name)}</h4>
                            <p>Stock actual: <span class="${stockStatus}">${product.currentStock} unidades</span></p>
                            <p>Stock mínimo: ${product.minStock} unidades</p>
                        </div>
                        <div class="alert-actions">
                            <span class="stock-status ${stockStatus}">${statusText}</span>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Error updating low stock alerts:', error);
            lowStockAlerts.innerHTML = '<p>Error al cargar las alertas</p>';
        }
    }

    // Configurar event listeners
    setupEventListeners() {
        // Event listeners generales de la aplicación
        document.addEventListener('dataUpdated', () => {
            this.loadData().then(() => {
                this.setupDashboard();
            });
        });
    }
}

// Inicializar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('dashboard.html') || 
        window.location.pathname.endsWith('/')) {
        new InventoryApp();
    }
});