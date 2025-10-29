// Utilidades generales para la aplicación

class Utils {
    // Formatear fecha
    static formatDate(date) {
        if (!date) return 'Fecha no disponible';
        try {
            return new Date(date).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Fecha inválida';
        }
    }

    // Formatear moneda
    static formatCurrency(amount) {
        if (isNaN(amount)) return '$0.00';
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    // Generar ID único
    static generateId() {
        return 'id_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    // Validar email
    static isValidEmail(email) {
        if (!email) return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Mostrar notificación
    static showNotification(message, type = 'success') {
        // Remover notificaciones existentes
        const existingAlerts = document.querySelectorAll('.alert-notification');
        existingAlerts.forEach(alert => {
            if (alert.parentNode) alert.remove();
        });

        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-notification`;
        notification.textContent = message;
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.zIndex = '10000';
        notification.style.minWidth = '300px';
        notification.style.maxWidth = '500px';
        notification.style.padding = '15px';
        notification.style.borderRadius = '8px';
        notification.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        
        document.body.appendChild(notification);
        
        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.opacity = '0';
                notification.style.transition = 'opacity 0.5s ease';
                setTimeout(() => {
                    if (notification.parentNode) notification.remove();
                }, 500);
            }
        }, 5000);

        // Cerrar al hacer click
        notification.addEventListener('click', () => {
            if (notification.parentNode) notification.remove();
        });
    }

    // Cargar datos del localStorage
    static loadFromStorage(key) {
        try {
            const data = localStorage.getItem(key);
            if (!data) return [];
            const parsed = JSON.parse(data);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.error('Error loading from storage:', error);
            return [];
        }
    }

    // Guardar datos en localStorage
    static saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving to storage:', error);
            Utils.showNotification('Error al guardar los datos', 'danger');
            return false;
        }
    }

    // Limpiar formulario
    static clearForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
            // Limpiar campos hidden también
            const hiddenInputs = form.querySelectorAll('input[type="hidden"]');
            hiddenInputs.forEach(input => input.value = '');
            
            // Limpiar mensajes de error
            const errorMessages = form.querySelectorAll('.error-message');
            errorMessages.forEach(msg => msg.remove());
            
            // Remover clases de error
            const errorInputs = form.querySelectorAll('.input-error');
            errorInputs.forEach(input => input.classList.remove('input-error'));
        }
    }

    // Confirmación de acción
    static confirmAction(message) {
        return confirm(message);
    }

    // Mostrar/ocultar loading
    static setLoading(element, isLoading) {
        if (!element) return;
        
        if (isLoading) {
            element.classList.add('loading');
            element.disabled = true;
            element.setAttribute('data-original-text', element.textContent);
            element.innerHTML = '⏳ Cargando...';
        } else {
            element.classList.remove('loading');
            element.disabled = false;
            const originalText = element.getAttribute('data-original-text');
            if (originalText) {
                element.textContent = originalText;
            }
        }
    }

    // Validar número positivo
    static isPositiveNumber(value) {
        const num = parseFloat(value);
        return !isNaN(num) && num >= 0;
    }

    // Escapar HTML para prevenir XSS
    static escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Validar que sea un array
    static ensureArray(data) {
        return Array.isArray(data) ? data : [];
    }

    // Inicializar datos por defecto
    static initializeDefaultData() {
        const defaultData = {
            inventory_users: [
                {
                    id: 1,
                    username: 'admin',
                    password: '123456',
                    name: 'Administrador Principal',
                    email: 'admin@inventario.com',
                    role: 'admin',
                    createdAt: new Date().toISOString()
                }
            ],
            inventory_categories: [
                { id: 'cat1', name: 'Electrónicos', description: 'Productos electrónicos' },
                { id: 'cat2', name: 'Ropa', description: 'Prendas de vestir' },
                { id: 'cat3', name: 'Hogar', description: 'Artículos para el hogar' },
                { id: 'cat4', name: 'Deportes', description: 'Artículos deportivos' }
            ],
            inventory_suppliers: [
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
            ],
            inventory_products: [
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
            ],
            inventory_movements: [
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
            ]
        };

        // Inicializar solo si no existen
        Object.keys(defaultData).forEach(key => {
            if (!localStorage.getItem(key) || Utils.loadFromStorage(key).length === 0) {
                Utils.saveToStorage(key, defaultData[key]);
                console.log(`Datos por defecto inicializados para: ${key}`);
            }
        });
    }

    // Mostrar mensaje de error en formulario
    static showFormError(input, message) {
        // Remover error anterior
        this.removeFormError(input);
        
        // Agregar clase de error
        input.classList.add('input-error');
        
        // Crear mensaje de error
        const errorElement = document.createElement('span');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        
        // Insertar después del input
        input.parentNode.appendChild(errorElement);
    }

    // Remover mensaje de error
    static removeFormError(input) {
        input.classList.remove('input-error');
        const existingError = input.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
    }

    // Validar contraseña
    static validatePassword(password) {
        if (password.length < 6) {
            return 'La contraseña debe tener al menos 6 caracteres';
        }
        return null;
    }

    // Validar usuario
    static validateUsername(username) {
        if (username.length < 3) {
            return 'El usuario debe tener al menos 3 caracteres';
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return 'El usuario solo puede contener letras, números y guiones bajos';
        }
        return null;
    }
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar datos por defecto
    Utils.initializeDefaultData();

    // Actualizar fecha actual
    const currentDateElement = document.getElementById('currentDate');
    if (currentDateElement) {
        const now = new Date();
        currentDateElement.textContent = Utils.formatDate(now);
        currentDateElement.setAttribute('datetime', now.toISOString());
    }

    // Configurar usuario actual en sidebar
    const currentUserElement = document.getElementById('currentUser');
    const userRoleElement = document.getElementById('userRole');
    if (currentUserElement) {
        const userData = Utils.loadFromStorage('currentUser');
        if (userData && userData.length > 0) {
            const user = userData[0];
            currentUserElement.textContent = user.name || 'Usuario';
            if (userRoleElement) {
                userRoleElement.textContent = user.role === 'admin' ? 'Administrador' : 'Usuario';
            }
        }
    }

    // Cerrar modal al hacer clic fuera
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
                modal.classList.remove('show');
            }
        });
    });

    // Cerrar modal con Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal.show');
            if (openModal) {
                openModal.style.display = 'none';
                openModal.classList.remove('show');
            }
        }
    });
});