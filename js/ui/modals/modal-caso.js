// ui/modals/modal-caso.js
// Funciones relacionadas con los modales de casos

function abrirModalInfoExpandidaCaso(caso, titulo = 'Detalle del Caso') {
    if (!caso) return;
    let sugerencia = '';
    if (typeof obtenerSugerenciaCaso === 'function') {
        sugerencia = obtenerSugerenciaCaso(caso);
    } else {
        sugerencia = 'No hay sugerencia disponible.';
    }
    let html = `<div class='modal-detalle-caso'>
        <h2>${titulo}</h2>
        <div><strong>ID Caso:</strong> ${caso.idCaso || ''}</div>
        <div><strong>Cliente:</strong> ${caso.personaNombre || caso.clienteNombre || ''}</div>
        <div><strong>Vehículo:</strong> ${caso.vehiculo || ''}</div>
        <div><strong>Mecánico:</strong> ${caso.mecanicoNombre || '-'}</div>
        <div><strong>Tipo de trabajo:</strong> ${caso.tipoTrabajo || '-'}</div>
        <div><strong>Pago:</strong> RD$${Math.max(0, Math.round((caso && caso.pago) || 0))}</div>
        <div><strong>Estado:</strong> ${caso.estado || (caso.pausadaPorPieza ? 'PAUSADO' : 'EN CURSO')}</div>
        <div><strong>Relato:</strong> ${(caso.declaracionCliente || caso.miniHistoriaTexto || 'Sin relato técnico.')}</div>
        <div style='margin-top:10px;'><strong>Sugerencia:</strong> <span>${sugerencia}</span></div>
        <div style='margin-top:16px;text-align:right;'><button class='btn' onclick='cerrarModal()'>Cerrar</button></div>
    </div>`;
    mostrarModalPersonalizado(html);
}

function abrirModalDetalleCasoCliente() {
    if (!window.clienteActual) return;
    const caso = window.clienteActual;
    let sugerencia = '';
    if (typeof obtenerSugerenciaCaso === 'function') {
        sugerencia = obtenerSugerenciaCaso(caso);
    } else {
        sugerencia = 'No hay sugerencia disponible.';
    }
    let html = `<div class='modal-detalle-caso'>
        <h2>Detalle del Caso Activo</h2>
        <div><strong>ID Caso:</strong> ${caso.idCaso || ''}</div>
        <div><strong>Cliente:</strong> ${caso.personaNombre || caso.clienteNombre || ''}</div>
        <div><strong>Vehículo:</strong> ${caso.vehiculo || ''}</div>
        <div><strong>Pago:</strong> RD$${Math.max(0, Math.round((caso && caso.pago) || 0))}</div>
        <div><strong>Estado:</strong> ${caso.estado || ''}</div>
        <div><strong>Relato:</strong> ${(caso.declaracionCliente || 'Sin relato técnico.')}</div>
        <div style='margin-top:10px;'><strong>Sugerencia:</strong> <span>${sugerencia}</span></div>
        <div style='margin-top:16px;text-align:right;'><button class='btn' onclick='cerrarModal()'>Cerrar</button></div>
    </div>`;
    mostrarModalPersonalizado(html);
}

// Exportar para uso global si es necesario
if (typeof window !== 'undefined') {
    window.abrirModalInfoExpandidaCaso = abrirModalInfoExpandidaCaso;
    window.abrirModalDetalleCasoCliente = abrirModalDetalleCasoCliente;
}
