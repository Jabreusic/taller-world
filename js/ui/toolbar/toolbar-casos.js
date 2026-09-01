// ui/toolbar/toolbar-casos.js
// Funciones para el toolbar de casos de trabajo

function actualizarToolbarCasosTrabajoUI() {
    const abierto = !!window.toolbarCasosTrabajoAbierto;
    const card = document.getElementById('repairs-card');
    const body = document.getElementById('lista-reparaciones-activas');
    const btn = document.getElementById('work-toolbar-toggle');
    const icon = document.getElementById('work-toolbar-toggle-icon');
    if (!card || !body || !btn || !icon) return;

    card.classList.toggle('is-collapsed', !abierto);
    body.classList.toggle('hidden', !abierto);
    btn.setAttribute('aria-expanded', abierto ? 'true' : 'false');
    icon.innerHTML = abierto ? '&#9652;' : '&#9662;';
    asegurarNavPantallasInferior();
}

function toggleToolbarCasosTrabajo() {
    window.toolbarCasosTrabajoAbierto = !window.toolbarCasosTrabajoAbierto;
    actualizarToolbarCasosTrabajoUI();
}

if (typeof window !== 'undefined') {
    window.toggleToolbarCasosTrabajo = toggleToolbarCasosTrabajo;
}
