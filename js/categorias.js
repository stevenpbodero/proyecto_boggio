// Gestión de categorías

class CategoryManager {
    constructor() {
        this.categories = [];
        this.products = [];
        this.init();
    }

    async init() {
        console.log('Inicializando CategoryManager...');
        
        // VERIFICACIÓN DE AUTENTICACIÓN - AGREGADO
        if (!authSystem || !authSystem.getCurrentUser()) {
            console.warn('Usuario no autenticado, redirigiendo a login...');
            window.location.href = 'index.html';
            return;
        }

        await this.loadData();
        this.loadCategoriesTable();
        this.setupEventListeners();
        console.log('CategoryManager inicializado correctamente');
    }


    // Cargar datos
    async loadData() {
        this.categories = Utils.loadFromStorage('inventory_categories') || [];
        this.products = Utils.loadFromStorage('inventory_products') || [];
    }

    // Cargar tabla de categorías
    loadCategoriesTable() {
        const tableBody = document.getElementById('categoriesTableBody');
        if (!tableBody) return;

        try {
            if (this.categories.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center">
                            <div class="empty-state">
                                <div class="icon">🏷️</div>
                                <p>No hay categorías registradas</p>
                                <button class="btn-primary mt-20" onclick="categoryManager.openCategoryModal()">
                                    ➕ Agregar Primera Categoría
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
                return;
            }

            tableBody.innerHTML = this.categories.map(category => {
                const productCount = this.products.filter(p => p.category === category.id).length;
                
                return `
                    <tr>
                        <td>${Utils.escapeHtml(category.name)}</td>
                        <td>${Utils.escapeHtml(category.description || 'Sin descripción')}</td>
                        <td>${productCount}</td>
                        <td>
                            <button class="btn-secondary" onclick="categoryManager.editCategory('${Utils.escapeHtml(category.id)}')" title="Editar categoría">✏️</button>
                            <button class="btn-danger" onclick="categoryManager.deleteCategory('${Utils.escapeHtml(category.id)}')" title="Eliminar categoría">🗑️</button>
                        </td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            console.error('Error loading categories table:', error);
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Error al cargar las categorías</td></tr>';
        }
    }

    // Configurar event listeners
    setupEventListeners() {
        const categoryForm = document.getElementById('categoryForm');
        if (categoryForm) {
            categoryForm.addEventListener('submit', (e) => this.saveCategory(e));
        }

        const searchInput = document.getElementById('searchCategory');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterCategories());
        }
    }

    // Filtrar categorías
    filterCategories() {
        const searchTerm = document.getElementById('searchCategory').value.toLowerCase();
        
        const filteredCategories = this.categories.filter(category => 
            category.name.toLowerCase().includes(searchTerm) ||
            (category.description && category.description.toLowerCase().includes(searchTerm))
        );

        this.updateCategoriesTable(filteredCategories);
    }

    // Actualizar tabla de categorías
    updateCategoriesTable(categories) {
        const tableBody = document.getElementById('categoriesTableBody');
        if (!tableBody) return;

        if (categories.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center">
                        <div class="empty-state">
                            <div class="icon">🔍</div>
                            <p>No se encontraron categorías</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = categories.map(category => {
            const productCount = this.products.filter(p => p.category === category.id).length;
            
            return `
                <tr>
                    <td>${Utils.escapeHtml(category.name)}</td>
                    <td>${Utils.escapeHtml(category.description || 'Sin descripción')}</td>
                    <td>${productCount}</td>
                    <td>
                        <button class="btn-secondary" onclick="categoryManager.editCategory('${Utils.escapeHtml(category.id)}')" title="Editar categoría">✏️</button>
                        <button class="btn-danger" onclick="categoryManager.deleteCategory('${Utils.escapeHtml(category.id)}')" title="Eliminar categoría">🗑️</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Abrir modal de categoría
    openCategoryModal() {
        document.getElementById('categoryModalTitle').textContent = 'Nueva Categoría';
        Utils.clearForm('categoryForm');
        document.getElementById('categoryId').value = '';
        
        const modal = document.getElementById('categoryModal');
        modal.style.display = 'block';
        modal.classList.add('show');
        
        // Enfocar primer campo
        setTimeout(() => {
            const firstInput = document.getElementById('categoryName');
            if (firstInput) firstInput.focus();
        }, 100);
    }

    // Cerrar modal de categoría
    closeCategoryModal() {
        const modal = document.getElementById('categoryModal');
        modal.style.display = 'none';
        modal.classList.remove('show');
    }

    // Editar categoría
    editCategory(categoryId) {
        const category = this.categories.find(c => c.id === categoryId);
        if (!category) {
            Utils.showNotification('Categoría no encontrada', 'danger');
            return;
        }

        document.getElementById('categoryModalTitle').textContent = 'Editar Categoría';
        document.getElementById('categoryId').value = category.id;
        document.getElementById('categoryName').value = category.name;
        document.getElementById('categoryDescription').value = category.description || '';

        const modal = document.getElementById('categoryModal');
        modal.style.display = 'block';
        modal.classList.add('show');
        
        // Enfocar primer campo
        setTimeout(() => {
            const firstInput = document.getElementById('categoryName');
            if (firstInput) firstInput.focus();
        }, 100);
    }

    // Guardar categoría
    async saveCategory(e) {
        e.preventDefault();

        const submitButton = e.target.querySelector('button[type="submit"]');
        Utils.setLoading(submitButton, true);

        try {
            const categoryId = document.getElementById('categoryId').value;
            const categoryData = {
                name: document.getElementById('categoryName').value.trim(),
                description: document.getElementById('categoryDescription').value.trim()
            };

            if (!this.validateCategory(categoryData)) {
                Utils.setLoading(submitButton, false);
                return;
            }

            // Simular delay de red
            await new Promise(resolve => setTimeout(resolve, 500));

            if (categoryId) {
                this.updateCategory(categoryId, categoryData);
            } else {
                this.createCategory(categoryData);
            }

            this.closeCategoryModal();
            await this.loadData();
            this.loadCategoriesTable();
            
            // Disparar evento para actualizar otros módulos
            document.dispatchEvent(new CustomEvent('dataUpdated'));
            
            Utils.showNotification(`Categoría ${categoryId ? 'actualizada' : 'creada'} correctamente`, 'success');
        } catch (error) {
            console.error('Error saving category:', error);
            Utils.showNotification('Error al guardar la categoría', 'danger');
        } finally {
            Utils.setLoading(submitButton, false);
        }
    }

    // Validar categoría
    validateCategory(category) {
        if (!category.name) {
            Utils.showNotification('El nombre de la categoría es obligatorio', 'danger');
            return false;
        }

        // Verificar nombre único
        if (!document.getElementById('categoryId').value) {
            const existingCategory = this.categories.find(c => 
                c.name.toLowerCase() === category.name.toLowerCase()
            );
            if (existingCategory) {
                Utils.showNotification('Ya existe una categoría con este nombre', 'danger');
                return false;
            }
        }

        return true;
    }

    // Crear categoría
    createCategory(categoryData) {
        const newCategory = {
            ...categoryData,
            id: Utils.generateId()
        };

        this.categories.push(newCategory);
        Utils.saveToStorage('inventory_categories', this.categories);
    }

    // Actualizar categoría
    updateCategory(categoryId, categoryData) {
        const index = this.categories.findIndex(c => c.id === categoryId);
        if (index !== -1) {
            this.categories[index] = { ...this.categories[index], ...categoryData };
            Utils.saveToStorage('inventory_categories', this.categories);
        }
    }

    // Eliminar categoría
    async deleteCategory(categoryId) {
        const category = this.categories.find(c => c.id === categoryId);
        if (!category) return;

        // Verificar si hay productos usando esta categoría
        const productsUsingCategory = this.products.filter(p => p.category === categoryId);
        
        if (productsUsingCategory.length > 0) {
            Utils.showNotification(`No se puede eliminar la categoría. Hay ${productsUsingCategory.length} productos usando esta categoría.`, 'danger');
            return;
        }

        if (!Utils.confirmAction('¿Estás seguro de que quieres eliminar esta categoría?')) {
            return;
        }

        try {
            this.categories = this.categories.filter(c => c.id !== categoryId);
            Utils.saveToStorage('inventory_categories', this.categories);
            
            await this.loadData();
            this.loadCategoriesTable();
            
            Utils.showNotification('Categoría eliminada correctamente', 'success');
        } catch (error) {
            console.error('Error deleting category:', error);
            Utils.showNotification('Error al eliminar la categoría', 'danger');
        }
    }
}

// Inicializar gestor de categorías
let categoryManager;

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('categorias.html')) {
        categoryManager = new CategoryManager();
    }
});