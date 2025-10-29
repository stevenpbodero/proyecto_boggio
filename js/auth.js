// Sistema de autenticación mejorado

class AuthSystem {
    constructor() {
        this.users = [];
        this.currentUser = null;
        this.init();
    }

    // Cargar usuarios
    loadUsers() {
        this.users = Utils.loadFromStorage('inventory_users');
        return this.users;
    }

    // Inicializar eventos de autenticación
    init() {
        this.loadUsers();
        this.checkAuthentication();
        this.setupEventListeners();
    }

    // Verificar si el usuario está autenticado
    checkAuthentication() {
        const userData = Utils.loadFromStorage('currentUser');
        this.currentUser = userData && userData.length > 0 ? userData[0] : null;
        
        const isLoginPage = window.location.pathname.includes('index.html') || 
                           window.location.pathname.endsWith('/') ||
                           window.location.pathname === '';
        
        const isRegisterPage = window.location.pathname.includes('registro.html');

        // Si no está en la página de login/registro y no hay usuario, redirigir al login
        if (!this.currentUser && !isLoginPage && !isRegisterPage) {
            window.location.href = 'index.html';
            return;
        }

        // Si está en login/registro y ya está autenticado, redirigir al dashboard
        if (this.currentUser && (isLoginPage || isRegisterPage)) {
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
            
            // Validación en tiempo real
            const usernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');
            
            if (usernameInput) {
                usernameInput.addEventListener('input', () => Utils.removeFormError(usernameInput));
            }
            if (passwordInput) {
                passwordInput.addEventListener('input', () => Utils.removeFormError(passwordInput));
            }
        }

        // Formulario de registro
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
            
            // Validación en tiempo real para registro
            this.setupRegisterValidation();
        }

        // Botón de logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => this.handleLogout(e));
        }

        // Enter key en formularios
        this.setupEnterKeySupport();
    }

    // Configurar validación de registro en tiempo real
    setupRegisterValidation() {
        const inputs = [
            'regName', 'regUsername', 'regEmail', 'regPassword', 'regConfirmPassword'
        ];

        inputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('input', () => Utils.removeFormError(input));
            }
        });

        // Validación especial para confirmar contraseña
        const passwordInput = document.getElementById('regPassword');
        const confirmInput = document.getElementById('regConfirmPassword');
        
        if (passwordInput && confirmInput) {
            confirmInput.addEventListener('input', () => {
                Utils.removeFormError(confirmInput);
                if (passwordInput.value && confirmInput.value && passwordInput.value !== confirmInput.value) {
                    Utils.showFormError(confirmInput, 'Las contraseñas no coinciden');
                }
            });
        }
    }

    // Soporte para tecla Enter
    setupEnterKeySupport() {
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const activeForm = document.querySelector('form');
                if (activeForm && e.target.tagName !== 'TEXTAREA') {
                    const submitEvent = new Event('submit', { cancelable: true });
                    activeForm.dispatchEvent(submitEvent);
                }
            }
        });
    }

    // Manejar login
    async handleLogin(e) {
        e.preventDefault();
        
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const submitButton = e.target.querySelector('button[type="submit"]');
        
        if (!usernameInput || !passwordInput || !submitButton) {
            Utils.showNotification('Error en el formulario de login', 'danger');
            return;
        }

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        // Validaciones básicas
        if (!username) {
            Utils.showFormError(usernameInput, 'Por favor ingrese un usuario');
            return;
        }

        if (!password) {
            Utils.showFormError(passwordInput, 'Por favor ingrese una contraseña');
            return;
        }

        // Mostrar loading
        Utils.setLoading(submitButton, true);

        try {
            // Simular delay de red
            await new Promise(resolve => setTimeout(resolve, 800));

            const user = this.authenticate(username, password);
            
            if (user) {
                this.currentUser = user;
                Utils.saveToStorage('currentUser', [user]);
                Utils.showNotification(`¡Bienvenido, ${user.name}!`, 'success');
                
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                Utils.showNotification('Usuario o contraseña incorrectos', 'danger');
                passwordInput.value = '';
                passwordInput.focus();
            }
        } catch (error) {
            console.error('Login error:', error);
            Utils.showNotification('Error en el proceso de login', 'danger');
        } finally {
            // Quitar loading
            Utils.setLoading(submitButton, false);
        }
    }

    // Manejar registro
    async handleRegister(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const userData = {
            name: formData.get('name').trim(),
            username: formData.get('username').trim(),
            email: formData.get('email').trim(),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword'),
            role: formData.get('role') || 'user'
        };

        const submitButton = e.target.querySelector('button[type="submit"]');

        // Validaciones
        if (!this.validateRegistration(userData)) {
            return;
        }

        // Mostrar loading
        Utils.setLoading(submitButton, true);

        try {
            // Simular delay de red
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (this.registerUser(userData)) {
                Utils.showNotification('¡Cuenta creada exitosamente! Redirigiendo...', 'success');
                
                // Auto-login después del registro
                const newUser = this.authenticate(userData.username, userData.password);
                if (newUser) {
                    this.currentUser = newUser;
                    Utils.saveToStorage('currentUser', [newUser]);
                    
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 2000);
                }
            }
        } catch (error) {
            console.error('Register error:', error);
            Utils.showNotification('Error en el proceso de registro', 'danger');
        } finally {
            Utils.setLoading(submitButton, false);
        }
    }

    // Validar datos de registro
    validateRegistration(userData) {
        let isValid = true;

        // Validar nombre
        if (!userData.name) {
            Utils.showFormError(document.getElementById('regName'), 'El nombre es obligatorio');
            isValid = false;
        }

        // Validar usuario
        const usernameError = Utils.validateUsername(userData.username);
        if (usernameError) {
            Utils.showFormError(document.getElementById('regUsername'), usernameError);
            isValid = false;
        }

        // Validar email
        if (!userData.email) {
            Utils.showFormError(document.getElementById('regEmail'), 'El email es obligatorio');
            isValid = false;
        } else if (!Utils.isValidEmail(userData.email)) {
            Utils.showFormError(document.getElementById('regEmail'), 'El formato del email no es válido');
            isValid = false;
        }

        // Validar contraseña
        const passwordError = Utils.validatePassword(userData.password);
        if (passwordError) {
            Utils.showFormError(document.getElementById('regPassword'), passwordError);
            isValid = false;
        }

        // Validar confirmación de contraseña
        if (userData.password !== userData.confirmPassword) {
            Utils.showFormError(document.getElementById('regConfirmPassword'), 'Las contraseñas no coinciden');
            isValid = false;
        }

        // Verificar si el usuario ya existe
        if (this.users.find(u => u.username === userData.username)) {
            Utils.showFormError(document.getElementById('regUsername'), 'Este usuario ya está registrado');
            isValid = false;
        }

        // Verificar si el email ya existe
        if (this.users.find(u => u.email === userData.email)) {
            Utils.showFormError(document.getElementById('regEmail'), 'Este email ya está registrado');
            isValid = false;
        }

        return isValid;
    }

    // Registrar nuevo usuario
    registerUser(userData) {
        const newUser = {
            id: Utils.generateId(),
            name: userData.name,
            username: userData.username,
            email: userData.email,
            password: userData.password, // En un sistema real esto debería estar encriptado
            role: userData.role,
            createdAt: new Date().toISOString(),
            active: true
        };

        this.users.push(newUser);
        const success = Utils.saveToStorage('inventory_users', this.users);
        
        if (success) {
            console.log('Nuevo usuario registrado:', newUser);
            return true;
        } else {
            Utils.showNotification('Error al guardar el usuario', 'danger');
            return false;
        }
    }

    // Autenticar usuario
    authenticate(username, password) {
        return this.users.find(user => 
            user.username === username && 
            user.password === password &&
            user.active !== false
        );
    }

    // Manejar logout
    handleLogout(e) {
        if (e) e.preventDefault();
        
        if (Utils.confirmAction('¿Estás seguro de que quieres cerrar sesión?')) {
            Utils.saveToStorage('currentUser', []);
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

    // Obtener todos los usuarios (solo admin)
    getUsers() {
        if (!this.isAdmin()) {
            return [];
        }
        return this.users;
    }
}

// Inicializar sistema de autenticación
let authSystem;

document.addEventListener('DOMContentLoaded', function() {
    authSystem = new AuthSystem();
});