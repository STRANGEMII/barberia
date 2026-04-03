

const Session = {

  guardar(token) {
    localStorage.setItem('bq_token', token);
  },

  obtenerToken() {
    return localStorage.getItem('bq_token');
  },

  estaActiva() {
    const token = localStorage.getItem('bq_token');
    if (!token) return false;

    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const ahora = Math.floor(Date.now() / 1000);
      return payload.exp > ahora;
    } catch (e) {
      return !!token; 
    }
  },

  cerrar() {
    localStorage.removeItem('bq_token');
    localStorage.removeItem('bq_usuario');
    window.location.href = '/login.html';
  },

  guardarUsuario(usuario) {
    localStorage.setItem('bq_usuario', JSON.stringify(usuario));
  },

  obtenerUsuario() {
    try {
      return JSON.parse(localStorage.getItem('bq_usuario')) || null;
    } catch {
      return null;
    }
  }
};

export default Session;
