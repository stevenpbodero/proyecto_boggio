// Sistema de gestión de productos
class ProductManager {
    constructor() {
        this.products = JSON.parse(localStorage.getItem('products')) || [];
        this.categories = JSON.parse(localStorage.getItem('categories')) || [];
        this.types = JSON.parse(localStorage.getItem('types')) || [];
    }

    // Crear o actualizar producto
    saveProduct(productData) {
        if (productData.id) {
            // Actualizar producto existente
            const index = this.products.findIndex(p => p.id === productData.id);
            if (index !== -1) {
                this.products[index] = { ...this.products[index], ...productData };
            }
        } else {
            // Crear nuevo producto
            const newProduct = {
                id: Date.now().toString(),
                ...productData,
                createdAt: new Date().toISOString()
            };
            this.products.push(newProduct);
        }

        this.saveToStorage();
        return true;
    }

    // Eliminar producto
    deleteProduct(productId) {
        this.products = this.products.filter(p => p.id !== productId);
        this.saveToStorage();
        return true;
    }

    // Obtener todos los productos
    getAllProducts() {
        return this.products;
    }

    // Obtener producto por ID
    getProductById(id) {
        return this.products.find(p => p.id === id);
    }

    // Buscar productos
    searchProducts(query) {
        const lowerQuery = query.toLowerCase();
        return this.products.filter(p => 
            p.name.toLowerCase().includes(lowerQuery) ||
            p.category.toLowerCase().includes(lowerQuery) ||
            p.type.toLowerCase().includes(lowerQuery)
        );
    }

    // Obtener productos con stock bajo
    getLowStockProducts() {
        return this.products.filter(p => p.stock <= p.minStock);
    }

    // Actualizar stock
    updateStock(productId, quantity, type) {
        const product = this.getProductById(productId);
        if (product) {
            if (type === 'entrada') {
                product.stock += quantity;
            } else if (type === 'salida') {
                product.stock -= quantity;
            }
            this.saveToStorage();
            return true;
        }
        return false;
    }

    // Guardar en localStorage
    saveToStorage() {
        localStorage.setItem('products', JSON.stringify(this.products));
        
        // Actualizar categorías y tipos automáticamente
        const categories = [...new Set(this.products.map(p => p.category))];
        const types = [...new Set(this.products.map(p => p.type))];
        
        localStorage.setItem('categories', JSON.stringify(categories));
        localStorage.setItem('types', JSON.stringify(types));
    }

    // Obtener estadísticas
    getStats() {
        const totalProducts = this.products.length;
        const lowStock = this.getLowStockProducts().length;
        
        return {
            totalProducts,
            lowStock
        };
    }
}

// Instancia global del gestor de productos
const productManager = new ProductManager();