// Sistema de gestión de movimientos
class MovementManager {
    constructor() {
        this.movements = JSON.parse(localStorage.getItem('movements')) || [];
        this.suppliers = JSON.parse(localStorage.getItem('suppliers')) || [];
        this.purchaseOrders = JSON.parse(localStorage.getItem('purchaseOrders')) || [];
    }

    // Registrar entrada de productos
    registerEntry(entryData) {
        const newEntry = {
            id: Date.now().toString(),
            ...entryData,
            type: 'entrada',
            createdAt: new Date().toISOString(),
            user: authSystem.getCurrentUser()?.username || 'Sistema'
        };

        this.movements.push(newEntry);
        
        // Crear orden de compra
        const purchaseOrder = {
            id: `PO-${Date.now()}`,
            supplier: entryData.supplier,
            productId: entryData.productId,
            productName: entryData.productName,
            quantity: entryData.quantity,
            date: entryData.date,
            status: 'completado',
            createdAt: new Date().toISOString()
        };
        
        this.purchaseOrders.push(purchaseOrder);
        
        // Actualizar stock
        productManager.updateStock(entryData.productId, entryData.quantity, 'entrada');
        
        this.saveToStorage();
        return true;
    }

    // Registrar salida de productos
    registerExit(exitData) {
        const product = productManager.getProductById(exitData.productId);
        
        // Verificar stock suficiente
        if (product.stock < exitData.quantity) {
            return { success: false, message: 'Stock insuficiente' };
        }

        const newExit = {
            id: Date.now().toString(),
            ...exitData,
            type: 'salida',
            createdAt: new Date().toISOString(),
            user: authSystem.getCurrentUser()?.username || 'Sistema'
        };

        this.movements.push(newExit);
        
        // Actualizar stock
        productManager.updateStock(exitData.productId, exitData.quantity, 'salida');
        
        this.saveToStorage();
        return { success: true, message: 'Salida registrada exitosamente' };
    }

    // Obtener todos los movimientos
    getAllMovements() {
        return this.movements.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // Filtrar movimientos
    filterMovements(filters = {}) {
        let filtered = this.movements;

        if (filters.date) {
            filtered = filtered.filter(m => m.date === filters.date);
        }

        if (filters.type) {
            filtered = filtered.filter(m => m.type === filters.type);
        }

        return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // Obtener movimientos del día
    getTodayMovements() {
        const today = new Date().toISOString().split('T')[0];
        const todayEntries = this.movements.filter(m => 
            m.date === today && m.type === 'entrada'
        ).length;
        
        const todayExits = this.movements.filter(m => 
            m.date === today && m.type === 'salida'
        ).length;
        
        return {
            entries: todayEntries,
            exits: todayExits
        };
    }

    // Obtener todas las órdenes de compra
    getAllPurchaseOrders() {
        return this.purchaseOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // Guardar en localStorage
    saveToStorage() {
        localStorage.setItem('movements', JSON.stringify(this.movements));
        localStorage.setItem('purchaseOrders', JSON.stringify(this.purchaseOrders));
    }
}

// Instancia global del gestor de movimientos
const movementManager = new MovementManager();