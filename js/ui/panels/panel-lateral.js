// ui/panels/panel-lateral.js
// Funciones para el panel lateral y tabs

function cambiarPanelLateral(panel) {
    const permitidos = {
        queue: true,
        'pending-dx': true,
        events: true
    };
    panelLateralActivo = permitidos[panel] ? panel : 'queue';
    aplicarPanelLateral();
}

function aplicarPanelLateral() {
    const paneles = document.querySelectorAll('[data-lane-panel]');
    const btnQueue = document.getElementById('lane-tab-queue');
    const btnPendingDx = document.getElementById('lane-tab-pending-dx');
    const btnEvents = document.getElementById('lane-tab-events');

    paneles.forEach(panel => {
        const activo = panel.dataset.lanePanel === panelLateralActivo;
        panel.classList.toggle('active', activo);
    });

    if (btnQueue) btnQueue.classList.toggle('active', panelLateralActivo === 'queue');
    if (btnPendingDx) btnPendingDx.classList.toggle('active', panelLateralActivo === 'pending-dx');
    if (btnEvents) btnEvents.classList.toggle('active', panelLateralActivo === 'events');
}

function actualizarVisibilidadTabsPanelLateral() {
    const btnPendingDx = document.getElementById('lane-tab-pending-dx');
    const btnEvents = document.getElementById('lane-tab-events');

    const pendientesDx = Array.isArray(casosPendientesDiagnostico) ? casosPendientesDiagnostico.length : 0;
    const aprobadosPendientes = (typeof obtenerCasosAprobadosPendientes === 'function')
        ? obtenerCasosAprobadosPendientes().length
        : 0;
    const trabajosActivos = Array.isArray(reparacionesActivas) ? reparacionesActivas.length : 0;

    const mostrarPendDx = pendientesDx > 0 || panelLateralActivo === 'pending-dx';
    const mostrarEvents = (aprobadosPendientes + trabajosActivos) > 0 || panelLateralActivo === 'events';

    if (btnPendingDx) btnPendingDx.classList.toggle('hidden', !mostrarPendDx);
    if (btnEvents) btnEvents.classList.toggle('hidden', !mostrarEvents);

    if (panelLateralActivo === 'pending-dx' && !mostrarPendDx) panelLateralActivo = 'queue';
    if (panelLateralActivo === 'events' && !mostrarEvents) panelLateralActivo = 'queue';
}

if (typeof window !== 'undefined') {
    window.cambiarPanelLateral = cambiarPanelLateral;
}
