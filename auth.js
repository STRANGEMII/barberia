import Session from './session.js';
import API from './api.js';

const Auth = {

  // Login: guarda token y redirige al dashboard
  async login(email, password) {
    const data = await API.login(email, password);
    // El backend de Javi debe devolver: { token, usuario }
    Session.guardar(data.token);
    Session.guardarUsuario(data.usuario);
    return data.usuario;
  },

  // Registro de nuevo barbero/cliente
  async registro(nombre, email, password) {
    const data = await API.registro(nombre, email, password);
    Session.guardar(data.token);
    Session.guardarUsuario(data.usuario);
    return data.usuario;
  },

  // Cerrar sesión
  logout() {
    Session.cerrar();
  },

  // Verificar si hay sesión activa (para proteger páginas)
  requerirSesion() {
    if (!Session.estaActiva()) {
      window.location.href = '/login.html';
      return false;
    }
    return true;
  }
};

export default Auth;
