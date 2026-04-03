
import Session  from './session.js';
import Auth     from './auth.js';
import API      from './api.js';
import Business from './business.js';

// ── Estado global de la app ────────────────────────────────────
const Estado = {
  citas: [],
  barberos: [],
  servicios: [],
  citasHoy: []
};

// VISTA 2 — CITAS: Formulario de nueva cita

async function guardarCita() {
  const nombreInput   = document.getElementById('form-nombre');
  const horaSelect    = document.getElementById('form-hora');
  const fechaInput    = document.getElementById('form-fecha');
  const servicioSel   = document.getElementById('form-servicio');

  const nombre  = nombreInput?.value   || document.querySelector('.form-input')?.value || '';
  const hora    = horaSelect?.value    || document.querySelectorAll('select')[0]?.value || '';
  const fecha   = fechaInput?.value    || document.querySelector('input[type=date]')?.value || '';
  const servicio= servicioSel?.value   || document.querySelectorAll('select')[1]?.value || '';

  const datos = { clienteNombre: nombre.trim(), hora, fecha, servicio };

  // 1. Validar con business.js
  const errores = Business.validarFormularioCita(datos);
  if (errores.length > 0) {
    mostrarToast(errores[0], 'error');
    return;
  }

  // 2. Verificar hora disponible
  const citasDelDia = Estado.citas.filter(c => c.fecha === fecha);
  if (!Business.horaDisponible(hora, citasDelDia)) {
    mostrarToast(`La hora ${hora} ya está ocupada, elige otra.`, 'error');
    return;
  }

  // 3. Enviar al backend de Javi
  try {
    mostrarCargando(true);
    const nuevaCita = await API.crearCita(datos);
    Estado.citas.push(nuevaCita);

    limpiarFormulario();
    await cargarCitas();
    mostrarToast('Cita agendada correctamente', 'exito');
  } catch (error) {
    mostrarToast(error.message, 'error');
  } finally {
    mostrarCargando(false);
  }
}

// ── Cambiar estado de una cita (confirmar / cancelar / reagendar) ──
async function cambiarEstadoCita(id, nuevoEstado, cita) {
  if (nuevoEstado === 'CANCELADA' && !Business.puedeCancelar(cita)) {
    mostrarToast('No se puede cancelar con menos de 2 horas de anticipación.', 'error');
    return;
  }

  try {
    await API.actualizarEstadoCita(id, nuevoEstado);
    await cargarCitas();
    mostrarToast(`Cita ${nuevoEstado.toLowerCase()} exitosamente`, 'exito');
  } catch (error) {
    mostrarToast(error.message, 'error');
  }
}


// CARGA DE DATOS desde el backend

async function cargarCitas() {
  try {
    Estado.citas = await API.getCitas();

    const hoy = new Date().toISOString().slice(0, 10);
    Estado.citasHoy = Estado.citas.filter(c => c.fecha === hoy);

    renderizarListaCitas(Estado.citas);
    actualizarStatsHoy(Estado.citasHoy);
  } catch (error) {
    console.error('Error al cargar citas:', error.message);
    // En modo demo (sin backend) silenciar el error
  }
}

async function cargarServicios() {
  try {
    Estado.servicios = await API.getServicios();
    poblarSelectServicios(Estado.servicios);
  } catch {
    // Fallback: usar servicios del HTML de Richi (ya están hardcodeados)
    console.warn('Usando servicios hardcodeados del HTML.');
  }
}

async function cargarBarberos() {
  try {
    Estado.barberos = await API.getBarberos();
  } catch {
    console.warn('No se pudieron cargar barberos.');
  }
}

function renderizarListaCitas(citas) {
  const lista = document.querySelector('.citas-list');
  if (!lista) return;

  if (citas.length === 0) {
    lista.innerHTML = `
      <div style="text-align:center; padding:30px; color:#4a4a4a;">
        No hay citas registradas.
      </div>`;
    return;
  }

  lista.innerHTML = citas.map(cita => {
    const badgeClase = {
      'CONFIRMADA': 'badge-confirmed',
      'PENDIENTE':  'badge-pending',
      'CANCELADA':  'badge-cancelled'
    }[cita.estado] || 'badge-pending';

    const badgeTexto = {
      'CONFIRMADA': 'Confirmado',
      'PENDIENTE':  'Pendiente',
      'CANCELADA':  'Cancelado'
    }[cita.estado] || cita.estado;

    const etiquetaFecha = Business.etiquetaFecha(cita.fecha);
    const puedeCancel   = Business.puedeCancelar(cita);

    let botonesHtml = '';
    if (cita.estado === 'PENDIENTE') {
      botonesHtml = `
        <button class="btn-sm" onclick="cambiarEstadoCita('${cita.id}', 'CONFIRMADA', ${JSON.stringify(cita).replace(/"/g, '&quot;')})">Confirmar</button>
        ${puedeCancel ? `<button class="btn-sm danger" onclick="cambiarEstadoCita('${cita.id}', 'CANCELADA', ${JSON.stringify(cita).replace(/"/g, '&quot;')})">Cancelar</button>` : ''}
      `;
    } else if (cita.estado === 'CONFIRMADA') {
      botonesHtml = `
        <button class="btn-sm">Editar</button>
        ${puedeCancel ? `<button class="btn-sm danger" onclick="cambiarEstadoCita('${cita.id}', 'CANCELADA', ${JSON.stringify(cita).replace(/"/g, '&quot;')})">Cancelar</button>` : ''}
      `;
    } else if (cita.estado === 'CANCELADA') {
      botonesHtml = `<button class="btn-sm">Reagendar</button>`;
    }

    return `
      <div class="cita-card">
        <div>
          <div class="cita-nombre">${cita.clienteNombre}</div>
          <div class="cita-meta">
            <span>🕐 ${cita.hora}</span>
            <span>📅 ${etiquetaFecha}</span>
            <span>✂️ ${cita.servicio}</span>
          </div>
        </div>
        <span class="badge-status ${badgeClase}">${badgeTexto}</span>
        <div class="cita-actions">${botonesHtml}</div>
      </div>`;
  }).join('');
}

function actualizarStatsHoy(citasHoy) {
  const stats = Business.calcularStats(citasHoy);

  // Actualizar contador principal (Vista 3)
  const numEl = document.querySelector('.today-count .num');
  if (numEl) numEl.textContent = stats.total;

  // Actualizar los 3 stat-box
  const statNums = document.querySelectorAll('.stat-num');
  if (statNums.length >= 3) {
    statNums[0].textContent = stats.confirmadas; // verde
    statNums[1].textContent = stats.pendientes;  // dorado
    statNums[2].textContent = stats.canceladas;  // rojo
  }

  // Actualizar badge "X pendientes" en Vista 1
  const menuCitas = document.querySelector('.menu-card:nth-child(3) .menu-card-sub');
  if (menuCitas) {
    menuCitas.textContent = `${stats.pendientes} pendientes`;
  }
}

function poblarSelectServicios(servicios) {
  const selects = document.querySelectorAll('select');
  // El 2do select del formulario es el de servicios
  const selectServicio = selects[1];
  if (!selectServicio || servicios.length === 0) return;

  selectServicio.innerHTML = servicios
    .map(s => `<option value="${s.nombre}">${s.nombre}</option>`)
    .join('');
}

function limpiarFormulario() {
  const inputs = document.querySelectorAll('.panel .form-input, .panel .form-select');
  inputs.forEach(el => { el.value = ''; });
}

function mostrarToast(mensaje, tipo = 'exito') {
  // Remover toast anterior si existe
  document.getElementById('bq-toast')?.remove();

  const color = tipo === 'error'
    ? 'rgba(176,48,48,.95)'
    : 'rgba(45,122,79,.95)';

  const toast = document.createElement('div');
  toast.id = 'bq-toast';
  toast.textContent = mensaje;
  toast.style.cssText = `
    position: fixed;
    bottom: 90px;
    left: 50%;
    transform: translateX(-50%);
    background: ${color};
    color: #fff;
    padding: 12px 20px;
    border-radius: 20px;
    font-size: 14px;
    font-family: 'Barlow', sans-serif;
    z-index: 9999;
    max-width: 300px;
    text-align: center;
    box-shadow: 0 4px 20px rgba(0,0,0,.5);
    animation: fadeInUp .3s ease;
  `;

  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

function mostrarCargando(activo) {
  const btn = document.querySelector('.panel .btn-primary');
  if (!btn) return;
  btn.disabled = activo;
  btn.textContent = activo ? 'Guardando...' : 'Guardar Cita';
}

window.cambiarEstadoCita = cambiarEstadoCita;
window.guardarCita       = guardarCita;

document.addEventListener('DOMContentLoaded', () => {
  // Conectar botón "Guardar Cita"
  const btnGuardar = document.querySelector('.panel .btn-primary');
  if (btnGuardar) {
    btnGuardar.addEventListener('click', guardarCita);
  }

  // Agregar animación de toast al CSS si no existe
  if (!document.getElementById('bq-toast-css')) {
    const style = document.createElement('style');
    style.id = 'bq-toast-css';
    style.textContent = `
      @keyframes fadeInUp {
        from { opacity:0; transform: translateX(-50%) translateY(10px); }
        to   { opacity:1; transform: translateX(-50%) translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }

  // Cargar datos del backend
  cargarCitas();
  cargarServicios();
  cargarBarberos();
});
