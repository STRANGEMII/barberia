const Business = {
  //solo se puede cancelar con al menos 2 horas de anticipación
  puedeCancelar(cita) {
    const ahora = new Date();
    const horaCita = new Date(cita.fechaHora || `${cita.fecha}T${cita.hora}`);
    const diferenciaMs = horaCita - ahora;
    const diferenciaHoras = diferenciaMs / (1000 * 60 * 60);
    return diferenciaHoras >= 2;
  },

  // DISPONIBILIDAD
  // Verifica si un horario ya está ocupado
  horaDisponible(horaDeseada, citasExistentes) {
    return !citasExistentes.some(c => c.hora === horaDeseada);
  },

  // Genera slots de hora disponibles eliminando los ocupados
  horasDisponibles(citasDelDia) {
    const todasLasHoras = [
      '09:00', '09:30', '10:00', '10:30',
      '11:00', '11:30', '12:00', '12:30',
      '13:00', '13:30', '14:00', '14:30',
      '15:00', '15:30', '16:00', '16:30',
      '17:00', '17:30', '18:00'
    ];

    const horasOcupadas = citasDelDia
      .filter(c => c.estado !== 'CANCELADA')
      .map(c => c.hora);

    return todasLasHoras.filter(h => !horasOcupadas.includes(h));
  },

  // PRECIOS 
  // Tabla de precios por servicio (ya depende de ustedes si lo cambiamos)
  PRECIOS: {
    'Corte de cabello':   150,
    'Afeitado con navaja':120,
    'Corte + Barba':      220,
    'Corte + Afeitado':   240,
    'Diseño de barba':    100,
    'Tratamiento capilar':180,
    'Corte Especial':     200,
    'Corte Clásico':      130,
    'Desvanecido':        160
  },

  // Precio con descuento para clientes frecuentes (10+ visitas)
  calcularPrecio(servicio, cliente) {
    const base = this.PRECIOS[servicio] ?? 0;
    const visitas = cliente?.visitas ?? 0;
    if (visitas >= 10) return Math.round(base * 0.90); // 10% descuento
    if (visitas >= 5)  return Math.round(base * 0.95); // 5% descuento
    return base;
  },

  // ESTADÍSTICAS DEL DÍA 
  calcularStats(citas) {
    return {
      total:       citas.length,
      confirmadas: citas.filter(c => c.estado === 'CONFIRMADA').length,
      pendientes:  citas.filter(c => c.estado === 'PENDIENTE').length,
      canceladas:  citas.filter(c => c.estado === 'CANCELADA').length,
      ingresoTotal: citas
        .filter(c => c.estado !== 'CANCELADA')
        .reduce((sum, c) => sum + (this.PRECIOS[c.servicio] ?? 0), 0)
    };
  },

  // VALIDACIONES 
  validarFormularioCita({ clienteNombre, hora, fecha, servicio }) {
    const errores = [];

    if (!clienteNombre || clienteNombre.trim().length < 2) {
      errores.push('El nombre del cliente es requerido (mínimo 2 caracteres).');
    }

    if (!hora) {
      errores.push('Selecciona un horario.');
    }

    if (!fecha) {
      errores.push('Selecciona una fecha.');
    } else {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const fechaCita = new Date(fecha + 'T00:00:00');
      if (fechaCita < hoy) {
        errores.push('La fecha no puede ser en el pasado.');
      }
    }

    if (!servicio) {
      errores.push('Selecciona un servicio.');
    }

    return errores; // [] = válido
  },

  // FORMATO DE FECHAS 
  formatearFecha(fechaISO) {
    if (!fechaISO) return '';
    const opciones = {
      weekday: 'long', year: 'numeric',
      month: 'long',  day: 'numeric'
    };
    return new Date(fechaISO + 'T00:00:00')
      .toLocaleDateString('es-MX', opciones);
  },

  esHoy(fechaISO) {
    if (!fechaISO) return false;
    const hoy = new Date().toISOString().slice(0, 10);
    return fechaISO === hoy;
  },

  esMañana(fechaISO) {
    if (!fechaISO) return false;
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    return fechaISO === manana.toISOString().slice(0, 10);
  },

  etiquetaFecha(fechaISO) {
    if (this.esHoy(fechaISO)) return 'Hoy';
    if (this.esMañana(fechaISO)) return 'Mañana';
    return this.formatearFecha(fechaISO);
  }
};

export default Business;
