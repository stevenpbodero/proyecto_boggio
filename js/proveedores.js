// Gestión de proveedores

class SupplierManager {
    constructor() {
        this.suppliers = [];
        this.products = [];
        this.init();
    }

    async init() {
        await this.loadData();
        this.loadSuppliersTable();
        this.setupEventListeners();
    }

    // Cargar datos
    async loadData() {
        this.suppliers = Utils.loadFromStorage('inventory_suppliers') || [];
        this.products = Utils.loadFromStorage('inventory_products') || [];
    }

    // Cargar tabla de proveedores
    loadSuppliersTable() {
        const tableBody = document.getElementById('suppliersTableBody');
        if (!tableBody) return;

        try {
            if (this.suppliers.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center">
                            <div class="empty-state">
                                <div class="icon">👥</div>
                                <p>No hay proveedores registrados</p>
                                <button class="btn-primary mt-20" onclick="supplierManager.openSupplierModal()">
                                    ➕ Agregar Primer Proveedor
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
                return;
            }

            tableBody.innerHTML = this.suppliers.map(supplier => {
                const productCount = this.products.filter(p => p.supplier === supplier.id).length;
                
                return `
                    <tr>
                        <td>${Utils.escapeHtml(supplier.name)}</td>
                        <td>${Utils.escapeHtml(supplier.contact)}</td>
                        <td>${Utils.escapeHtml(supplier.email || '-')}</td>
                        <td>${Utils.escapeHtml(supplier.phone || '-')}</td>
                        <td>${productCount}</td>
                        <td>
                            <button class="btn-secondary" onclick="supplierManager.editSupplier('${Utils.escapeHtml(supplier.id)}')" title="Editar proveedor">✏️</button>
                            <button class="btn-danger" onclick="supplierManager.deleteSupplier('${Utils.escapeHtml(supplier.id)}')" title="Eliminar proveedor">🗑️</button>
                        </td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            console.error('Error loading suppliers table:', error);
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Error al cargar los proveedores</td></tr>';
        }
    }

    // Configurar event listeners
    setupEventListeners() {
        const supplierForm = document.getElementById('supplierForm');
        if (supplierForm) {
            supplierForm.addEventListener('submit', (e) => this.saveSupplier(e));
        }

        const searchInput = document.getElementById('searchSupplier');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterSuppliers());
        }
    }

    // Filtrar proveedores
    filterSuppliers() {
        const searchTerm = document.getElementById('searchSupplier').value.toLowerCase();
        
        const filteredSuppliers = this.suppliers.filter(supplier => 
            supplier.name.toLowerCase().includes(searchTerm) ||
            supplier.contact.toLowerCase().includes(searchTerm) ||
            (supplier.email && supplier.email.toLowerCase().includes(searchTerm))
        );

        this.updateSuppliersTable(filteredSuppliers);
    }

    // Actualizar tabla de proveedores
    updateSuppliersTable(suppliers) {
        const tableBody = document.getElementById('suppliersTableBody');
        if (!tableBody) return;

        if (suppliers.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">
                        <div class="empty-state">
                            <div class="icon">🔍</div>
                            <p>No se encontraron proveedores</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = suppliers.map(supplier => {
            const productCount = this.products.filter(p => p.supplier === supplier.id).length;
            
            return `
                <tr>
                    <td>${Utils.escapeHtml(supplier.name)}</td>
                    <td>${Utils.escapeHtml(supplier.contact)}</td>
                    <td>${Utils.escapeHtml(supplier.email || '-')}</td>
                    <td>${Utils.escapeHtml(supplier.phone || '-')}</td>
                    <td>${productCount}</td>
                    <td>
                        <button class="btn-secondary" onclick="supplierManager.editSupplier('${Utils.escapeHtml(supplier.id)}')" title="Editar proveedor">✏️</button>
                        <button class="btn-danger" onclick="supplierManager.deleteSupplier('${Utils.escapeHtml(supplier.id)}')" title="Eliminar proveedor">🗑️</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Abrir modal de proveedor
    openSupplierModal() {
        document.getElementById('supplierModalTitle').textContent = 'Nuevo Proveedor';
        Utils.clearForm('supplierForm');
        document.getElementById('supplierId').value = '';
        
        const modal = document.getElementById('supplierModal');
        modal.style.display = 'block';
        modal.classList.add('show');
        
        // Enfocar primer campo
        setTimeout(() => {
            const firstInput = document.getElementById('supplierName');
            if (firstInput) firstInput.focus();
        }, 100);
    }

    // Cerrar modal de proveedor
    closeSupplierModal() {
        const modal = document.getElementById('supplierModal');
        modal.style.display = 'none';
        modal.classList.remove('show');
    }

    // Editar proveedor
    editSupplier(supplierId) {
        const supplier = this.suppliers.find(s => s.id === supplierId);
        if (!supplier) {
            Utils.showNotification('Proveedor no encontrado', 'danger');
            return;
        }

        document.getElementById('supplierModalTitle').textContent = 'Editar Proveedor';
        document.getElementById('supplierId').value = supplier.id;
        document.getElementById('supplierName').value = supplier.name;
        document.getElementById('supplierContact').value = supplier.contact;
        document.getElementById('supplierEmail').value = supplier.email || '';
        document.getElementById('supplierPhone').value = supplier.phone || '';
        document.getElementById('supplierAddress').value = supplier.address || '';

        const modal = document.getElementById('supplierModal');
        modal.style.display = 'block';
        modal.classList.add('show');
        
        // Enfocar primer campo
        setTimeout(() => {
            const firstInput = document.getElementById('supplierName');
            if (firstInput) firstInput.focus();
        }, 100);
    }

    // Guardar proveedor
    async saveSupplier(e) {
        e.preventDefault();

        const submitButton = e.target.querySelector('button[type="submit"]');
        Utils.setLoading(submitButton, true);

        try {
            const supplierId = document.getElementById('supplierId').value;
            const supplierData = {
                name: document.getElementById('supplierName').value.trim(),
                contact: document.getElementById('supplierContact').value.trim(),
                email: document.getElementById('supplierEmail').value.trim(),
                phone: document.getElementById('supplierPhone').value.trim(),
                address: document.getElementById('supplierAddress').value.trim()
            };

            if (!this.validateSupplier(supplierData)) {
                Utils.setLoading(submitButton, false);
                return;
            }

            // Simular delay de red
            await new Promise(resolve => setTimeout(resolve, 500));

            if (supplierId) {
                this.updateSupplier(supplierId, supplierData);
            } else {
                this.createSupplier(supplierData);
            }

            this.closeSupplierModal();
            await this.loadData();
            this.loadSuppliersTable();
            
            Utils.showNotification(`Proveedor ${supplierId ? 'actualizado' : 'creado'} correctamente`, 'success');
        } catch (error) {
            console.error('Error saving supplier:', error);
            Utils.showNotification('Error al guardar el proveedor', 'danger');
        } finally {
            Utils.setLoading(submitButton, false);
        }
    }

    // Validar proveedor
    validateSupplier(supplier) {
        if (!supplier.name || !supplier.contact) {
            Utils.showNotification('El nombre y contacto son obligatorios', 'danger');
            return false;
        }

        if (supplier.email && !Utils.isValidEmail(supplier.email)) {
            Utils.showNotification('El formato del email no es válido', 'danger');
            return false;
        }

        // Verificar nombre único
        if (!document.getElementById('supplierId').value) {
            const existingSupplier = this.suppliers.find(s => 
                s.name.toLowerCase() === supplier.name.toLowerCase()
            );
            if (existingSupplier) {
                Utils.showNotification('Ya existe un proveedor con este nombre', 'danger');
                return false;
            }
        }

        return true;
    }

    // Crear proveedor
    createSupplier(supplierData) {
        const newSupplier = {
            ...supplierData,
            id: Utils.generateId()
        };

        this.suppliers.push(newSupplier);
        Utils.saveToStorage('inventory_suppliers', this.suppliers);
    }

    // Actualizar proveedor
    updateSupplier(supplierId, supplierData) {
        const index = this.suppliers.findIndex(s => s.id === supplierId);
        if (index !== -1) {
            this.suppliers[index] = { ...this.suppliers[index], ...supplierData };
            Utils.saveToStorage('inventory_suppliers', this.suppliers);
        }
    }

    // Eliminar proveedor
    async deleteSupplier(supplierId) {
        const supplier = this.suppliers.find(s => s.id === supplierId);
        if (!supplier) return;

        // Verificar si hay productos usando este proveedor
        const productsUsingSupplier = this.products.filter(p => p.supplier === supplierId);
        
        if (productsUsingSupplier.length > 0) {
            Utils.showNotification(`No se puede eliminar el proveedor. Hay ${productsUsingSupplier.length} productos asociados a este proveedor.`, 'danger');
            return;
        }

        if (!Utils.confirmAction('¿Estás seguro de que quieres eliminar este proveedor?')) {
            return;
        }

        try {
            this.suppliers = this.suppliers.filter(s => s.id !== supplierId);
            Utils.saveToStorage('inventory_suppliers', this.suppliers);
            
            await this.loadData();
            this.loadSuppliersTable();
            
            Utils.showNotification('Proveedor eliminado correctamente', 'success');
        } catch (error) {
            console.error('Error deleting supplier:', error);
            Utils.showNotification('Error al eliminar el proveedor', 'danger');
        }
    }
}

// Inicializar gestor de proveedores
let supplierManager;

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('proveedores.html')) {
        supplierManager = new SupplierManager();
    }
});