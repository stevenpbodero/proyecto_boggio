// Aplicación principal
class InventoryApp {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthentication();
        this.loadInitialData();
    }

    // Configurar event listeners
    setupEventListeners() {
        // Login y registro
        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('register-form').addEventListener('submit', (e) => this.handleRegister(e));
        document.getElementById('register-link').addEventListener('click', (e) => this.showScreen('register-screen'));
        document.getElementById('login-link').addEventListener('click', (e) => this.showScreen('login-screen'));
        document.getElementById('logout-btn').addEventListener('click', () => this.handleLogout());

        // Navegación
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSection(e.target.getAttribute('data-target'));
            });
        });

        // Productos
        document.getElementById('btn-nuevo-producto').addEventListener('click', () => this.openProductModal());
        document.getElementById('form-producto').addEventListener('submit', (e) => this.saveProduct(e));
        document.getElementById('btn-buscar').addEventListener('click', () => this.searchProducts());
        document.getElementById('buscar-producto').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchProducts();
        });
        document.getElementById('btn-cancelar').addEventListener('click', () => this.closeProductModal());
        document.querySelector('.close').addEventListener('click', () => this.closeProductModal());

        // Movimientos
        document.getElementById('form-entrada').addEventListener('submit', (e) => this.registerEntry(e));
        document.getElementById('form-salida').addEventListener('submit', (e) => this.registerExit(e));
        document.getElementById('btn-filtrar').addEventListener('click', () => this.filterHistory());

        // Cerrar modal al hacer clic fuera
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('modal-producto');
            if (e.target === modal) {
                this.closeProductModal();
            }
        });
    }

    // Verificar autenticación
    checkAuthentication() {
        if (authSystem.isAuthenticated()) {
            this.showScreen('main-screen');
            this.updateUserDisplay();
        } else {
            this.showScreen('login-screen');
        }
    }

    // Manejar login
    handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        const result = authSystem.login(username, password);
        
        if (result.success) {
            this.showScreen('main-screen');
            this.updateUserDisplay();
            this.loadDashboard();
        } else {
            alert(result.message);
        }
    }

    // Manejar registro
    handleRegister(e) {
        e.preventDefault();
        
        const username = document.getElementById('reg-username').value;
        const password = document.getElementById('reg-password').value;
        const confirm = document.getElementById('reg-confirm').value;
        
        if (password !== confirm) {
            alert('Las contraseñas no coinciden');
            return;
        }
        
        const result = authSystem.register(username, password);
        
        if (result.success) {
            alert(result.message);
            this.showScreen('login-screen');
        } else {
            alert(result.message);
        }
    }

    // Manejar logout
    handleLogout() {
        authSystem.logout();
        this.showScreen('login-screen');
        
        // Limpiar formularios
        document.getElementById('login-form').reset();
        document.getElementById('register-form').reset();
    }

    // Mostrar pantalla específica
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }

    // Mostrar sección específica
    showSection(sectionId) {
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        document.getElementById(sectionId).classList.add('active');
        document.querySelector(`[data-target="${sectionId}"]`).classList.add('active');
        
        // Cargar datos específicos de la sección
        switch(sectionId) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'productos':
                this.loadProducts();
                break;
            case 'entradas':
                this.loadEntries();
                break;
            case 'salidas':
                this.loadExits();
                break;
            case 'historial':
                this.loadHistory();
                break;
        }
    }

    // Actualizar display del usuario
    updateUserDisplay() {
        const user = authSystem.getCurrentUser();
        if (user) {
            document.getElementById('user-display').textContent = user.username;
        }
    }

    // Cargar datos iniciales
    loadInitialData() {
        // Cargar datos de ejemplo si no hay datos
        if (productManager.getAllProducts().length === 0) {
            this.loadSampleData();
        }
    }

    // Cargar datos de ejemplo
    loadSampleData() {
        const sampleProducts = [
            {
                id: '1',
                name: 'Laptop Dell XPS 13',
                category: 'Electrónicos',
                type: 'Computadoras',
                stock: 15,
                minStock: 5,
                createdAt: new Date().toISOString()
            },
            {
                id: '2',
                name: 'Mouse Inalámbrico',
                category: 'Electrónicos',
                type: 'Periféricos',
                stock: 50,
                minStock: 10,
                createdAt: new Date().toISOString()
            },
            {
                id: '3',
                name: 'Teclado Mecánico',
                category: 'Electrónicos',
                type: 'Periféricos',
                stock: 25,
                minStock: 8,
                createdAt: new Date().toISOString()
            },
            {
                id: '4',
                name: 'Monitor 24"',
                category: 'Electrónicos',
                type: 'Monitores',
                stock: 8,
                minStock: 3,
                createdAt: new Date().toISOString()
            }
        ];

        sampleProducts.forEach(product => {
            productManager.saveProduct(product);
        });
    }

    // ===== DASHBOARD =====
    loadDashboard() {
        const stats = productManager.getStats();
        const todayMovements = movementManager.getTodayMovements();
        
        document.getElementById('total-productos').textContent = stats.totalProducts;
        document.getElementById('stock-bajo').textContent = stats.lowStock;
        document.getElementById('entradas-hoy').textContent = todayMovements.entries;
        document.getElementById('salidas-hoy').textContent = todayMovements.exits;
    }

    // ===== PRODUCTOS =====
    loadProducts() {
        const products = productManager.getAllProducts();
        this.renderProductsTable(products);
        this.updateProductSelects();
    }

    renderProductsTable(products) {
        const tbody = document.getElementById('productos-body');
        tbody.innerHTML = '';

        products.forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.id}</td>
                <td>${product.name}</td>
                <td>${product.category}</td>
                <td>${product.type}</td>
                <td>${product.stock}</td>
                <td>${product.minStock}</td>
                <td class="acciones">
                    <button class="btn-editar" onclick="app.editProduct('${product.id}')">Editar</button>
                    <button class="btn-eliminar" onclick="app.deleteProduct('${product.id}')">Eliminar</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    searchProducts() {
        const query = document.getElementById('buscar-producto').value;
        const results = productManager.searchProducts(query);
        this.renderProductsTable(results);
    }

    openProductModal(productId = null) {
        const modal = document.getElementById('modal-producto');
        const form = document.getElementById('form-producto');
        
        if (productId) {
            // Modo edición
            document.getElementById('modal-titulo').textContent = 'Editar Producto';
            const product = productManager.getProductById(productId);
            
            document.getElementById('producto-id').value = product.id;
            document.getElementById('producto-nombre').value = product.name;
            document.getElementById('producto-categoria').value = product.category;
            document.getElementById('producto-tipo').value = product.type;
            document.getElementById('producto-stock').value = product.stock;
            document.getElementById('producto-stock-minimo').value = product.minStock;
        } else {
            // Modo nuevo
            document.getElementById('modal-titulo').textContent = 'Nuevo Producto';
            form.reset();
            document.getElementById('producto-id').value = '';
        }
        
        modal.style.display = 'block';
    }

    closeProductModal() {
        document.getElementById('modal-producto').style.display = 'none';
    }

    saveProduct(e) {
        e.preventDefault();
        
        const productData = {
            id: document.getElementById('producto-id').value,
            name: document.getElementById('producto-nombre').value,
            category: document.getElementById('producto-categoria').value,
            type: document.getElementById('producto-tipo').value,
            stock: parseInt(document.getElementById('producto-stock').value),
            minStock: parseInt(document.getElementById('producto-stock-minimo').value)
        };

        const success = productManager.saveProduct(productData);
        
        if (success) {
            this.closeProductModal();
            this.loadProducts();
            this.updateProductSelects();
            alert('Producto guardado exitosamente');
        }
    }

    editProduct(productId) {
        this.openProductModal(productId);
    }

    deleteProduct(productId) {
        if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
            const success = productManager.deleteProduct(productId);
            if (success) {
                this.loadProducts();
                this.updateProductSelects();
                alert('Producto eliminado exitosamente');
            }
        }
    }

    updateProductSelects() {
        const products = productManager.getAllProducts();
        const productSelects = [
            document.getElementById('producto-entrada'),
            document.getElementById('producto-salida')
        ];

        productSelects.forEach(select => {
            // Guardar valor seleccionado actual
            const currentValue = select.value;
            
            // Limpiar opciones (excepto la primera)
            select.innerHTML = '<option value="">Seleccionar producto</option>';
            
            // Agregar productos
            products.forEach(product => {
                const option = document.createElement('option');
                option.value = product.id;
                option.textContent = `${product.name} (Stock: ${product.stock})`;
                select.appendChild(option);
            });
            
            // Restaurar valor seleccionado si existe
            if (currentValue && products.find(p => p.id === currentValue)) {
                select.value = currentValue;
            }
        });
    }

    // ===== ENTRADAS =====
    loadEntries() {
        this.updateProductSelects();
        this.loadPurchaseOrders();
        
        // Establecer fecha actual por defecto
        document.getElementById('fecha-entrada').value = new Date().toISOString().split('T')[0];
    }

    loadPurchaseOrders() {
        const orders = movementManager.getAllPurchaseOrders();
        const tbody = document.getElementById('ordenes-body');
        tbody.innerHTML = '';

        orders.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${order.id}</td>
                <td>${order.supplier}</td>
                <td>${order.productName}</td>
                <td>${order.quantity}</td>
                <td>${order.date}</td>
                <td><span class="estado-${order.status}">${order.status}</span></td>
            `;
            tbody.appendChild(row);
        });
    }

    registerEntry(e) {
        e.preventDefault();
        
        const productId = document.getElementById('producto-entrada').value;
        const product = productManager.getProductById(productId);
        
        if (!product) {
            alert('Por favor selecciona un producto válido');
            return;
        }

        const entryData = {
            supplier: document.getElementById('proveedor').value,
            productId: productId,
            productName: product.name,
            quantity: parseInt(document.getElementById('cantidad-entrada').value),
            date: document.getElementById('fecha-entrada').value
        };

        const success = movementManager.registerEntry(entryData);
        
        if (success) {
            alert('Entrada registrada exitosamente');
            document.getElementById('form-entrada').reset();
            this.loadPurchaseOrders();
            this.updateProductSelects();
        }
    }

    // ===== SALIDAS =====
    loadExits() {
        this.updateProductSelects();
        
        // Establecer fecha actual por defecto
        document.getElementById('fecha-salida').value = new Date().toISOString().split('T')[0];
    }

    registerExit(e) {
        e.preventDefault();
        
        const productId = document.getElementById('producto-salida').value;
        const product = productManager.getProductById(productId);
        
        if (!product) {
            alert('Por favor selecciona un producto válido');
            return;
        }

        const exitData = {
            productId: productId,
            productName: product.name,
            type: document.getElementById('tipo-salida').value,
            quantity: parseInt(document.getElementById('cantidad-salida').value),
            date: document.getElementById('fecha-salida').value,
            authorization: document.getElementById('autorizacion-salida').value
        };

        const result = movementManager.registerExit(exitData);
        
        if (result.success) {
            alert(result.message);
            document.getElementById('form-salida').reset();
            this.updateProductSelects();
        } else {
            alert(result.message);
        }
    }

    // ===== HISTORIAL =====
    loadHistory() {
        const movements = movementManager.getAllMovements();
        this.renderHistoryTable(movements);
    }

    renderHistoryTable(movements) {
        const tbody = document.getElementById('historial-body');
        tbody.innerHTML = '';

        movements.forEach(movement => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${movement.date}</td>
                <td>${movement.productName}</td>
                <td>${movement.type === 'entrada' ? 'Entrada' : 'Salida'}</td>
                <td>${movement.quantity}</td>
                <td>${movement.user}</td>
            `;
            tbody.appendChild(row);
        });
    }

    filterHistory() {
        const filters = {
            date: document.getElementById('filtro-fecha').value || null,
            type: document.getElementById('filtro-tipo').value || null
        };

        const filteredMovements = movementManager.filterMovements(filters);
        this.renderHistoryTable(filteredMovements);
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.app = new InventoryApp();
});