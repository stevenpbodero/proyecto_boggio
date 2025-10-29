// Gestión de movimientos de inventario

class MovementManager {
    constructor() {
        this.movements = [];
        this.products = [];
        this.init();
    }

    async init() {
        console.log('Inicializando MovementManager...');
        
        // VERIFICACIÓN DE AUTENTICACIÓN - AGREGADO
        if (!authSystem || !authSystem.getCurrentUser()) {
            console.warn('Usuario no autenticado, redirigiendo a login...');
            window.location.href = 'index.html';
            return;
        }

        await this.loadData();
        this.loadMovementsTable();
        this.loadProductSelect();
        this.setupEventListeners();
        console.log('MovementManager inicializado correctamente');
    }

    // Cargar datos
    async loadData() {
        this.movements = Utils.loadFromStorage('inventory_movements') || [];
        this.products = Utils.loadFromStorage('inventory_products') || [];
    }

    // Cargar datos
    async loadData() {
        this.movements = Utils.loadFromStorage('inventory_movements') || [];
        this.products = Utils.loadFromStorage('inventory_products') || [];
    }

    // Cargar tabla de movimientos
    loadMovementsTable() {
        const tableBody = document.getElementById('movementsTableBody');
        if (!tableBody) return;

        try {
            const sortedMovements = this.movements.sort((a, b) => new Date(b.date) - new Date(a.date));

            if (sortedMovements.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center">
                            <div class="empty-state">
                                <div class="icon">🔄</div>
                                <p>No hay movimientos registrados</p>
                                <button class="btn-primary mt-20" onclick="movementManager.openMovementModal()">
                                    ➕ Registrar Primer Movimiento
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
                return;
            }

            tableBody.innerHTML = sortedMovements.map(movement => {
                const product = this.products.find(p => p.id === movement.productId);
                const movementType = movement.type === 'entrada' ? 
                    '<span class="text-success">📥 Entrada</span>' : 
                    '<span class="text-danger">📤 Salida</span>';
                
                return `
                    <tr>
                        <td>${Utils.formatDate(movement.date)}</td>
                        <td>${Utils.escapeHtml(product?.name || 'Producto no encontrado')}</td>
                        <td>${movementType}</td>
                        <td>${movement.quantity}</td>
                        <td>${this.getReasonText(movement.reason)}</td>
                        <td>${Utils.escapeHtml(movement.notes || '-')}</td>
                        <td>
                            <button class="btn-danger" onclick="movementManager.deleteMovement('${Utils.escapeHtml(movement.id)}')" title="Eliminar movimiento">🗑️</button>
                        </td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            console.error('Error loading movements table:', error);
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Error al cargar los movimientos</td></tr>';
        }
    }

    // Obtener texto del motivo
    getReasonText(reason) {
        const reasons = {
            'compra': 'Compra',
            'venta': 'Venta',
            'ajuste': 'Ajuste',
            'daño': 'Daño',
            'caducidad': 'Caducidad',
            'devolucion': 'Devolución',
            'otros': 'Otros'
        };
        
        return reasons[reason] || reason;
    }

    // Cargar select de productos
    loadProductSelect() {
        const productSelect = document.getElementById('movementProduct');
        if (!productSelect) return;

        const availableProducts = this.products.filter(p => p.currentStock > 0);
        
        productSelect.innerHTML = '<option value="">Seleccionar producto</option>' +
            availableProducts.map(product => 
                `<option value="${Utils.escapeHtml(product.id)}" data-stock="${product.currentStock}">
                    ${Utils.escapeHtml(product.name)} (Stock: ${product.currentStock})
                </option>`
            ).join('');

        // Actualizar información de stock cuando se selecciona un producto
        productSelect.addEventListener('change', (e) => this.updateStockInfo(e.target.value));
    }

    // Actualizar información de stock
    updateStockInfo(productId) {
        const product = this.products.find(p => p.id === productId);
        const stockInfo = document.getElementById('stockInfo');
        
        if (!stockInfo) {
            // Crear elemento de información de stock si no existe
            const productSelect = document.getElementById('movementProduct');
            const stockInfoElement = document.createElement('div');
            stockInfoElement.id = 'stockInfo';
            stockInfoElement.className = 'stock-info';
            productSelect.parentNode.appendChild(stockInfoElement);
        }

        const stockInfoElement = document.getElementById('stockInfo');
        if (product) {
            stockInfoElement.innerHTML = `
                <small class="text-muted">
                    Stock actual: <strong>${product.currentStock}</strong> | 
                    Mínimo: <strong>${product.minStock}</strong>
                </small>
            `;
        } else {
            stockInfoElement.innerHTML = '';
        }
    }

    // Configurar event listeners
    setupEventListeners() {
        const movementForm = document.getElementById('movementForm');
        if (movementForm) {
            movementForm.addEventListener('submit', (e) => this.saveMovement(e));
        }

        const dateFilter = document.getElementById('dateFilter');
        const typeFilter = document.getElementById('typeFilter');
        
        if (dateFilter) dateFilter.addEventListener('change', () => this.filterMovements());
        if (typeFilter) typeFilter.addEventListener('change', () => this.filterMovements());

        // Actualizar cantidad máxima para salidas
        const movementType = document.getElementById('movementType');
        if (movementType) {
            movementType.addEventListener('change', () => this.updateQuantityValidation());
        }
    }

    // Actualizar validación de cantidad
    updateQuantityValidation() {
        const movementType = document.getElementById('movementType').value;
        const productId = document.getElementById('movementProduct').value;
        const quantityInput = document.getElementById('movementQuantity');
        
        if (movementType === 'salida' && productId) {
            const product = this.products.find(p => p.id === productId);
            if (product) {
                quantityInput.max = product.currentStock;
                quantityInput.title = `Máximo: ${product.currentStock} unidades`;
            }
        } else {
            quantityInput.removeAttribute('max');
            quantityInput.removeAttribute('title');
        }
    }

    // Filtrar movimientos
    filterMovements() {
        const dateFilter = document.getElementById('dateFilter').value;
        const typeFilter = document.getElementById('typeFilter').value;

        let filteredMovements = this.movements;

        if (dateFilter === 'today') {
            const today = new Date().toDateString();
            filteredMovements = filteredMovements.filter(movement => {
                const movementDate = new Date(movement.date).toDateString();
                return movementDate === today;
            });
        }

        if (typeFilter) {
            filteredMovements = filteredMovements.filter(movement => movement.type === typeFilter);
        }

        this.updateMovementsTable(filteredMovements);
    }

    // Actualizar tabla de movimientos
    updateMovementsTable(movements) {
        const tableBody = document.getElementById('movementsTableBody');
        if (!tableBody) return;

        const sortedMovements = movements.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (sortedMovements.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">
                        <div class="empty-state">
                            <div class="icon">🔍</div>
                            <p>No se encontraron movimientos</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = sortedMovements.map(movement => {
            const product = this.products.find(p => p.id === movement.productId);
            const movementType = movement.type === 'entrada' ? 
                '<span class="text-success">📥 Entrada</span>' : 
                '<span class="text-danger">📤 Salida</span>';
            
            return `
                <tr>
                    <td>${Utils.formatDate(movement.date)}</td>
                    <td>${Utils.escapeHtml(product?.name || 'Producto no encontrado')}</td>
                    <td>${movementType}</td>
                    <td>${movement.quantity}</td>
                    <td>${this.getReasonText(movement.reason)}</td>
                    <td>${Utils.escapeHtml(movement.notes || '-')}</td>
                    <td>
                        <button class="btn-danger" onclick="movementManager.deleteMovement('${Utils.escapeHtml(movement.id)}')" title="Eliminar movimiento">🗑️</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Abrir modal de movimiento
    openMovementModal() {
        document.getElementById('movementModalTitle').textContent = 'Nuevo Movimiento';
        Utils.clearForm('movementForm');
        
        const modal = document.getElementById('movementModal');
        modal.style.display = 'block';
        modal.classList.add('show');
        
        // Recargar select de productos
        this.loadProductSelect();
        
        // Enfocar primer campo
        setTimeout(() => {
            const firstSelect = document.getElementById('movementProduct');
            if (firstSelect) firstSelect.focus();
        }, 100);
    }

    // Cerrar modal de movimiento
    closeMovementModal() {
        const modal = document.getElementById('movementModal');
        modal.style.display = 'none';
        modal.classList.remove('show');
        
        // Limpiar información de stock
        const stockInfo = document.getElementById('stockInfo');
        if (stockInfo) stockInfo.innerHTML = '';
    }

    // Guardar movimiento
    async saveMovement(e) {
        e.preventDefault();

        const submitButton = e.target.querySelector('button[type="submit"]');
        Utils.setLoading(submitButton, true);

        try {
            const movementData = {
                productId: document.getElementById('movementProduct').value,
                type: document.getElementById('movementType').value,
                quantity: parseInt(document.getElementById('movementQuantity').value),
                reason: document.getElementById('movementReason').value,
                notes: document.getElementById('movementNotes').value.trim(),
                date: new Date().toISOString(),
                userId: authSystem.getCurrentUser()?.id || '1'
            };

            if (!this.validateMovement(movementData)) {
                Utils.setLoading(submitButton, false);
                return;
            }

            // Simular delay de red
            await new Promise(resolve => setTimeout(resolve, 500));

            this.createMovement(movementData);
            this.closeMovementModal();
            await this.loadData();
            this.loadMovementsTable();
            
            // Disparar evento para actualizar dashboard
            document.dispatchEvent(new CustomEvent('dataUpdated'));
            
            Utils.showNotification('Movimiento registrado correctamente', 'success');
        } catch (error) {
            console.error('Error saving movement:', error);
            Utils.showNotification('Error al registrar el movimiento', 'danger');
        } finally {
            Utils.setLoading(submitButton, false);
        }
    }

    // Validar movimiento
    validateMovement(movement) {
        if (!movement.productId || !movement.type || !movement.quantity || !movement.reason) {
            Utils.showNotification('Por favor complete todos los campos obligatorios', 'danger');
            return false;
        }

        if (!Utils.isPositiveNumber(movement.quantity) || movement.quantity <= 0) {
            Utils.showNotification('La cantidad debe ser un número mayor a 0', 'danger');
            return false;
        }

        // Validar stock para salidas
        if (movement.type === 'salida') {
            const product = this.products.find(p => p.id === movement.productId);
            if (product && product.currentStock < movement.quantity) {
                Utils.showNotification(`Stock insuficiente. Stock actual: ${product.currentStock}`, 'danger');
                return false;
            }
        }

        return true;
    }

    // Crear movimiento
    createMovement(movementData) {
        const newMovement = {
            ...movementData,
            id: Utils.generateId()
        };

        this.movements.push(newMovement);
        Utils.saveToStorage('inventory_movements', this.movements);

        // Actualizar stock del producto
        this.updateProductStock(movementData.productId, movementData.type, movementData.quantity);
    }

    // Actualizar stock del producto
    updateProductStock(productId, type, quantity) {
        const products = Utils.loadFromStorage('inventory_products') || [];
        const productIndex = products.findIndex(p => p.id === productId);
        
        if (productIndex !== -1) {
            if (type === 'entrada') {
                products[productIndex].currentStock += quantity;
            } else if (type === 'salida') {
                products[productIndex].currentStock -= quantity;
            }
            
            Utils.saveToStorage('inventory_products', products);
            this.products = products;
        }
    }

    // Eliminar movimiento
    async deleteMovement(movementId) {
        if (!Utils.confirmAction('¿Estás seguro de que quieres eliminar este movimiento?')) {
            return;
        }

        try {
            const movement = this.movements.find(m => m.id === movementId);
            if (!movement) {
                Utils.showNotification('Movimiento no encontrado', 'danger');
                return;
            }

            // Revertir el stock
            this.revertProductStock(movement.productId, movement.type, movement.quantity);

            this.movements = this.movements.filter(m => m.id !== movementId);
            Utils.saveToStorage('inventory_movements', this.movements);
            
            await this.loadData();
            this.loadMovementsTable();
            
            // Disparar evento para actualizar dashboard
            document.dispatchEvent(new CustomEvent('dataUpdated'));
            
            Utils.showNotification('Movimiento eliminado correctamente', 'success');
        } catch (error) {
            console.error('Error deleting movement:', error);
            Utils.showNotification('Error al eliminar el movimiento', 'danger');
        }
    }

    // Revertir stock del producto
    revertProductStock(productId, type, quantity) {
        const products = Utils.loadFromStorage('inventory_products') || [];
        const productIndex = products.findIndex(p => p.id === productId);
        
        if (productIndex !== -1) {
            if (type === 'entrada') {
                products[productIndex].currentStock -= quantity;
            } else if (type === 'salida') {
                products[productIndex].currentStock += quantity;
            }
            
            Utils.saveToStorage('inventory_products', products);
            this.products = products;
        }
    }
}

// Inicializar gestor de movimientos
let movementManager;

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('movimientos.html')) {
        movementManager = new MovementManager();
    }
});