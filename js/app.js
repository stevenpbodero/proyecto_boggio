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
        try {
            // Verificar autenticación
            if (!authSystem || !authSystem.getCurrentUser()) {
                console.warn('Usuario no autenticado, redirigiendo...');
                window.location.href = 'index.html';
                return;
            }

            await this.loadData();
            this.setupDashboard();
            this.setupEventListeners();
            console.log('Dashboard inicializado correctamente para:', authSystem.getCurrentUser().name);
        } catch (error) {
            console.error('Error inicializando dashboard:', error);
            Utils.showNotification('Error al cargar el dashboard', 'danger');
        }
    }

    // Cargar datos
    async loadData() {
        try {
            this.products = Utils.loadFromStorage('inventory_products');
            this.movements = Utils.loadFromStorage('inventory_movements');
            this.categories = Utils.loadFromStorage('inventory_categories');
            this.suppliers = Utils.loadFromStorage('inventory_suppliers');

            console.log('Datos cargados:', {
                products: this.products.length,
                movements: this.movements.length,
                categories: this.categories.length,
                suppliers: this.suppliers.length
            });

        } catch (error) {
            console.error('Error loading data:', error);
            // Inicializar arrays vacíos en caso de error
            this.products = [];
            this.movements = [];
            this.categories = [];
            this.suppliers = [];
        }
    }

    // Configurar dashboard
    setupDashboard() {
        this.updateStats();
        this.updateRecentActivity();
        this.updateLowStockAlerts();
        this.updateUserInfo();
    }

    // Actualizar información del usuario
    updateUserInfo() {
        const currentUser = authSystem.getCurrentUser();
        if (currentUser) {
            const userElement = document.getElementById('currentUser');
            const roleElement = document.getElementById('userRole');
            
            if (userElement) userElement.textContent = currentUser.name;
            if (roleElement) {
                roleElement.textContent = currentUser.role === 'admin' ? 'Administrador' : 'Usuario';
                roleElement.className = `user-role ${currentUser.role === 'admin' ? 'admin-role' : 'user-role'}`;
            }
        }
    }

    // Actualizar estadísticas
    updateStats() {
        try {
            const totalProducts = this.products.length;
            const lowStockProducts = this.products.filter(p => p.currentStock <= p.minStock && p.currentStock > 0).length;
            const outOfStockProducts = this.products.filter(p => p.currentStock === 0).length;
            
            // Movimientos de hoy
            const today = new Date().toDateString();
            const todayMovements = this.movements.filter(m => {
                try {
                    const movementDate = new Date(m.date).toDateString();
                    return movementDate === today;
                } catch (e) {
                    return false;
                }
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
        } else {
            console.warn(`Elemento no encontrado: ${elementId}`);
        }
    }

    // Actualizar actividad reciente
    updateRecentActivity() {
        const recentActivity = document.getElementById('recentActivity');
        if (!recentActivity) {
            console.warn('Elemento recentActivity no encontrado');
            return;
        }

        try {
            const recentMovements = this.movements
                .sort((a, b) => {
                    try {
                        return new Date(b.date) - new Date(a.date);
                    } catch (e) {
                        return 0;
                    }
                })
                .slice(0, 5);

            if (recentMovements.length === 0) {
                recentActivity.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">📊</div>
                        <p>No hay actividad reciente</p>
                        <small>Los movimientos aparecerán aquí</small>
                    </div>
                `;
                return;
            }

            recentActivity.innerHTML = recentMovements.map(movement => {
                const product = this.products.find(p => p.id === movement.productId);
                const movementType = movement.type === 'entrada' ? '📥 Entrada' : '📤 Salida';
                const movementClass = movement.type === 'entrada' ? 'text-success' : 'text-danger';
                const productName = product ? Utils.escapeHtml(product.name) : 'Producto no encontrado';
                
                return `
                    <div class="activity-item">
                        <div class="activity-type ${movementClass}">${movementType}</div>
                        <div class="activity-details">${productName} - ${movement.quantity} unidades</div>
                        <div class="activity-time">${Utils.formatDate(movement.date)}</div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Error updating recent activity:', error);
            recentActivity.innerHTML = `
                <div class="empty-state">
                    <div class="icon">⚠️</div>
                    <p>Error al cargar la actividad</p>
                </div>
            `;
        }
    }

    // Actualizar alertas de stock bajo
    updateLowStockAlerts() {
        const lowStockAlerts = document.getElementById('lowStockAlerts');
        if (!lowStockAlerts) {
            console.warn('Elemento lowStockAlerts no encontrado');
            return;
        }

        try {
            const lowStockProducts = this.products.filter(p => p.currentStock <= p.minStock);

            if (lowStockProducts.length === 0) {
                lowStockAlerts.innerHTML = `
                    <div class="empty-state">
                        <div class="icon">✅</div>
                        <p>No hay alertas de stock bajo</p>
                        <small>Todo está en orden</small>
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
            lowStockAlerts.innerHTML = `
                <div class="empty-state">
                    <div class="icon">⚠️</div>
                    <p>Error al cargar las alertas</p>
                </div>
            `;
        }
    }

    // Configurar event listeners
    setupEventListeners() {
        // Escuchar eventos de actualización de datos
        document.addEventListener('dataUpdated', () => {
            console.log('Evento dataUpdated recibido, actualizando dashboard...');
            this.loadData().then(() => {
                this.setupDashboard();
                Utils.showNotification('Dato actualizado', 'success');
            });
        });

        // Actualizar cada 30 segundos
        setInterval(() => {
            this.loadData().then(() => {
                this.setupDashboard();
            });
        }, 30000);
    }
}

// Inicializar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, inicializando InventoryApp...');
    
    // Verificar si estamos en dashboard
    const isDashboard = window.location.pathname.includes('dashboard.html') || 
                       window.location.pathname.endsWith('/') ||
                       window.location.pathname === '';
    
    if (isDashboard) {
        console.log('Inicializando dashboard...');
        window.inventoryApp = new InventoryApp();
    }
});