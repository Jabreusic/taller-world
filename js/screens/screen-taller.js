// Selección dinámica de casos según nivel
function seleccionarDiagnosticoPorNivel(nivel) {
    // Rango de dificultad y pago según nivel
    // Puedes ajustar estos valores para mayor reto
    let minDificultad = 0.4 + (nivel-1)*0.1;
    let maxDificultad = Math.min(1, 0.7 + (nivel-1)*0.12);
    let minPago = 500 + (nivel-1)*600;
    let maxPago = 3000 + (nivel-1)*1200;
    const pool = (window.TallerData && window.TallerData.diagnosticos) ? window.TallerData.diagnosticos.filter(d =>
        d.dificultad >= minDificultad && d.dificultad <= maxDificultad && d.pagoBase >= minPago && d.pagoBase <= maxPago
    ) : [];
    // Si no hay suficientes, relaja el filtro
    if (pool.length < 3 && window.TallerData && window.TallerData.diagnosticos) {
        return window.TallerData.diagnosticos[Math.floor(Math.random()*window.TallerData.diagnosticos.length)];
    }
    return pool[Math.floor(Math.random()*pool.length)];
}

// Ejemplo de uso para crear un nuevo caso dinámico:
// let nivel = (typeof obtenerNivelProgresionActual === 'function') ? obtenerNivelProgresionActual() : 1;
// let diagnostico = seleccionarDiagnosticoPorNivel(nivel);
// ...usar diagnostico para poblar el caso...
/* =============================================================
   PANTALLA: TALLER
   Operaciones del dia, diagnostico, mecanicos
   ============================================================= */
window.SCREEN_HTML = window.SCREEN_HTML || {};
window.SCREEN_HTML.taller = `
<div class="workbench-layout panel-tab active modo-cola" id="panel-taller">
    <section class="onboarding-objective" aria-live="polite">
        <div>
            <span class="onboarding-kicker">SIGUIENTE ACCIÓN</span>
            <strong id="onboarding-objective-title">Recibe tu primer cliente</strong>
            <p id="onboarding-objective-detail">Abre la Cola y selecciona un caso para iniciar el flujo del taller.</p>
        </div>
    </section>
    <section class="taller-puesto-switch" aria-label="Puesto del taller">
        <div class="lane-cola-tabs taller-puesto-tabs" role="tablist" aria-label="Paneles del taller">
            <button class="lane-tab active" id="taller-tab-cola" type="button" role="tab" aria-selected="true" onclick="seleccionarPuestoTaller('cola')">Cola</button>
            <button class="lane-tab" id="taller-tab-mi-puesto" type="button" role="tab" aria-selected="false" onclick="seleccionarPuestoTaller('mi-puesto')">Mi puesto</button>
            <button class="lane-tab" id="taller-tab-trabajos" type="button" role="tab" aria-selected="false" onclick="seleccionarPuestoTaller('trabajos')">Trabajos</button>
        </div>
        <button class="taller-fast-forward" id="btn-avance-rapido" type="button" onclick="avanceRapidoTaller()" title="Avanza 30 minutos por RD$150; existe 20% de riesgo de perder 2 de reputacion">
            <span aria-hidden="true">&gt;&gt;</span>
            <span>30 min</span>
            <small>RD$150 · riesgo 20%</small>
        </button>
    </section>

    <section class="taller-recursos-toolbar" id="panel-operaciones">
        <article class="dispatch-box" id="pending-dx-card">
            <div class="taller-recursos-head">
                <button class="resource-toolbar-toggle" id="resource-toolbar-toggle" type="button" aria-expanded="false" onclick="toggleToolbarRecursos()">
                    <span>Recursos</span>
                    <span id="resource-toolbar-toggle-icon">&#9662;</span>
                </button>
                <div class="taller-delivery-overview" id="taller-delivery-overview">
                    <span class="taller-stage-kicker">Asignacion</span>
                </div>
                <div class="taller-recursos-tabs" role="tablist" aria-label="Recursos disponibles para asignar">
                    <button class="taller-recurso-tab active" id="toolbar-tab-mecanicos" role="tab" aria-selected="true" onclick="seleccionarToolbarRecursos('mecanicos')">Mecanicos</button>
                    <button class="taller-recurso-tab" id="toolbar-tab-delivery" role="tab" aria-selected="false" onclick="seleccionarToolbarRecursos('delivery')">Delivery</button>
                </div>
            </div>
            <div class="taller-recursos-pool-wrap">
                <div class="mecanicos-grid mecanicos-bar" id="grid-mecanicos"></div>
                <div id="delivery-slots-top" class="delivery-slots-top"></div>
            </div>
        </article>
    </section>

    <section class="lane-cola">
        <article class="queue-box" id="queue-card">
            <div class="queue-mobile-head">
                <strong class="queue-mobile-title">Cola de casos</strong>
                <button
                    class="queue-mobile-toggle"
                    id="queue-mobile-toggle"
                    type="button"
                    aria-expanded="true"
                    onclick="toggleColaMovil()"
                >Plegar</button>
            </div>
            <div id="lista-cola-espera" class="lane-cola-switcher"></div>
        </article>
    </section>


    <section class="lane-trabajos" id="lane-trabajos" style="display:none">
        <article class="trabajos-box" id="trabajos-card">
            <div class="trabajos-head">
                <strong class="trabajos-title">Trabajos en proceso</strong>
            </div>
            <div id="lista-reparaciones-activas" class="work-toolbar-body"></div>
        </article>
    </section>

    <section class="lane-caso" id="lane-mi-puesto" aria-hidden="true" style="display:none">
        <article class="taller-focus-card taller-focus-main">
            <div class="taller-stage-head">
                <h3>Mi puesto</h3>
                <span class="taller-stage-pill">Diagnostico del dueno</span>
            </div>

            <article class="active-case-card owner-workbench-card" id="active-case-card"
                draggable="true"
                ondragstart="iniciarArrastreClienteActivo(event)"
                ondragend="finalizarArrastreCliente(event)"
                ondragover="permitirDropCliente(event)"
                ondrop="soltarClienteEnExpediente(event)">
                <div class="ofdx-callout">Selecciona un caso y envialo a Mi puesto para diagnosticarlo aqui.</div>
            </article>
        </article>
    </section>
</div>
`;
