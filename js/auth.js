// Sistema de autenticación

class AuthSystem {
    constructor() {
        this.users = this.loadUsers();
        this.currentUser = null;
        this.init();
    }

    // Cargar usuarios desde localStorage o crear defaults
    loadUsers() {
        let users = Utils.loadFromStorage('inventory_users');
        
        if (!users) {
            users = [
                {
                    id: 1,
                    username: 'admin',
                    password: '123456',
                    name: 'Administrador',
                    role: 'admin',
                    email: 'admin@inventario.com'
                },
                {
                    id: 2,
                    username: 'user',
                    password: '123456',
                    name: 'Usuario General',
                    role: 'user',
                    email: 'user@inventario.com'
                }
            ];
            Utils.saveToStorage('inventory_users', users);
        }
        
        return users;
    }

    // Inicializar eventos de autenticación
    init() {
        this.checkAuthentication();
        this.setupEventListeners();
    }

    // Verificar si el usuario está autenticado
    checkAuthentication() {
        this.currentUser = Utils.loadFromStorage('currentUser');
        
        const isLoginPage = window.location.pathname.includes('index.html') || 
                           window.location.pathname.endsWith('/');
        
        // Si no está en la página de login y no hay usuario, redirigir al login
        if (!this.currentUser && !isLoginPage) {
            window.location.href = 'index.html';
            return;
        }

        // Si está en login y ya está autenticado, redirigir al dashboard
        if (this.currentUser && isLoginPage) {
            window.location.href = 'dashboard.html';
            return;
        }
    }

    // Configurar event listeners
    setupEventListeners() {
        // Formulario de login
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Botón de logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => this.handleLogout(e));
        }

        // Enter key en login
        const passwordInput = document.getElementById('password');
        if (passwordInput) {
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const loginForm = document.getElementById('loginForm');
                    if (loginForm) {
                        loginForm.dispatchEvent(new Event('submit'));
                    }
                }
            });
        }
    }

    // Manejar login
    async handleLogin(e) {
        e.preventDefault();
        
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const submitButton = e.target.querySelector('button[type="submit"]');
        
        if (!usernameInput || !passwordInput || !submitButton) return;

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        // Mostrar loading
        Utils.setLoading(submitButton, true);

        // Simular delay de red
        await new Promise(resolve => setTimeout(resolve, 1000));

        const user = this.authenticate(username, password);
        
        if (user) {
            this.currentUser = user;
            Utils.saveToStorage('currentUser', user);
            Utils.showNotification(`Bienvenido, ${user.name}`, 'success');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            Utils.showNotification('Usuario o contraseña incorrectos', 'danger');
            passwordInput.value = '';
            passwordInput.focus();
        }

        // Quitar loading
        Utils.setLoading(submitButton, false);
    }

    // Autenticar usuario
    authenticate(username, password) {
        return this.users.find(user => 
            user.username === username && user.password === password
        );
    }

    // Manejar logout
    handleLogout(e) {
        e.preventDefault();
        
        if (Utils.confirmAction('¿Estás seguro de que quieres cerrar sesión?')) {
            Utils.saveToStorage('currentUser', null);
            this.currentUser = null;
            Utils.showNotification('Sesión cerrada correctamente', 'success');
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
    }

    // Verificar permisos
    hasPermission(requiredRole) {
        if (!this.currentUser) return false;
        
        if (requiredRole === 'admin') {
            return this.currentUser.role === 'admin';
        }
        
        return true; // Los usuarios normales pueden acceder
    }

    // Obtener usuario actual
    getCurrentUser() {
        return this.currentUser;
    }

    // Verificar si es admin
    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }
}

// Inicializar sistema de autenticación
let authSystem;

document.addEventListener('DOMContentLoaded', function() {
    authSystem = new AuthSystem();
});

// Exportar para uso en otros archivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthSystem;
}