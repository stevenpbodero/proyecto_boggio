// Sistema de autenticación
class AuthSystem {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('users')) || [];
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    }

    // Registrar nuevo usuario
    register(username, password) {
        // Verificar si el usuario ya existe
        if (this.users.find(user => user.username === username)) {
            return { success: false, message: 'El usuario ya existe' };
        }

        // Crear nuevo usuario
        const newUser = {
            id: Date.now().toString(),
            username,
            password, // En una aplicación real, esto debería estar encriptado
            createdAt: new Date().toISOString()
        };

        this.users.push(newUser);
        localStorage.setItem('users', JSON.stringify(this.users));
        
        return { success: true, message: 'Usuario registrado exitosamente' };
    }

    // Iniciar sesión
    login(username, password) {
        const user = this.users.find(u => u.username === username && u.password === password);
        
        if (user) {
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            return { success: true, message: 'Inicio de sesión exitoso' };
        } else {
            return { success: false, message: 'Usuario o contraseña incorrectos' };
        }
    }

    // Cerrar sesión
    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
    }

    // Verificar si hay un usuario autenticado
    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Obtener usuario actual
    getCurrentUser() {
        return this.currentUser;
    }
}

// Instancia global del sistema de autenticación
const authSystem = new AuthSystem();