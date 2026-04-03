import Session from './session.js';

const BASE_URL = 'http://localhost:8080/api'; // aqui tiene que ir la url del javi

const API = {

  async _fetch(endpoint, options = {}) {
    const token = Session.obtenerToken();

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

  
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(BASE_URL + endpoint, {
      ...options,
      headers
    });

    
    if (res.status === 401) {
      Session.cerrar();
      throw new Error('Sesión expirada. Inicia sesión de nuevo.');
    }

    if (res.status === 403) {
      throw new Error('No tienes permiso para realizar esta acción.');
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Error ${res.status}`);
    }

    
    if (res.status === 204) return null;

    return res.json();
  },

  
  get(endpoint) {
    return API._fetch(endpoint);
  },

  post(endpoint, body) {
    return API._fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  put(endpoint, body) {
    return API._fetch(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  },

  delete(endpoint) {
    return API._fetch(endpoint, { method: 'DELETE' });
  },

  patch(endpoint, body) {
    return API._fetch(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  },

 
  login(email, password) {
    return API.post('/auth/login', { email, password });
  },

  registro(nombre, email, password) {
    return API.post('/auth/registro', { nombre, email, password });
  },

  
  getCitas() {
    return API.get('/citas');
  },

  getCitasPorFecha(fecha) {
    return API.get(`/citas?fecha=${fecha}`);
  },

  getCitasPorEstado(estado) {
    // estado: 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA'
    return API.get(`/citas?estado=${estado}`);
  },

  crearCita(datos) {
    // datos: { clienteNombre, hora, fecha, servicio, barberoId }
    return API.post('/citas', datos);
  },

  actualizarCita(id, datos) {
    return API.put(`/citas/${id}`, datos);
  },

  actualizarEstadoCita(id, estado) {
    return API.patch(`/citas/${id}/estado`, { estado });
  },

  eliminarCita(id) {
    return API.delete(`/citas/${id}`);
  },

  // ── Barberos ──────────────────────────────────────────────────
  getBarberos() {
    return API.get('/barberos');
  },

  getBarberoDisponible(barberoId, fecha) {
    return API.get(`/barberos/${barberoId}/disponibilidad?fecha=${fecha}`);
  },

  // ── Servicios ─────────────────────────────────────────────────
  getServicios() {
    return API.get('/servicios');
  },

  // ── Clientes ──────────────────────────────────────────────────
  getClientes() {
    return API.get('/clientes');
  },

  buscarCliente(nombre) {
    return API.get(`/clientes?nombre=${encodeURIComponent(nombre)}`);
  }
};

export default API;
