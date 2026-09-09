/* Oficina v2: centro de decisiones, no un muro de reportes. */
window.SCREEN_HTML = window.SCREEN_HTML || {};
window.SCREEN_HTML.oficina = `
<div class="of-layout of-decision-layout">
  <div class="of-topbar">
    <div class="of-player-band">
      <img id="of-player-foto" class="of-player-foto hidden" alt="Jugador" />
      <div class="of-player-copy"><strong id="of-player-nombre">-</strong><span id="of-player-taller">-</span></div>
    </div>
    <div class="of-topbar-chips">
      <div class="of-chip"><small>ESTADO</small><strong id="of-estado-flujo">-</strong></div>
      <div class="of-chip of-chip-money"><small>CAJA</small><strong id="of-saldo">-</strong></div>
      <div class="of-chip of-chip-debt"><small>DEUDA</small><strong id="of-deuda">-</strong></div>
      <div class="of-chip"><small>REP</small><strong id="of-reput">-</strong></div>
      <div class="of-chip"><small>XP</small><strong id="of-xp">-</strong></div>
    </div>
  </div>

  <section class="of-command-card">
    <div class="of-command-copy"><span>OBJETIVO ACTUAL</span><strong id="of-objetivo-dia">Cargando objetivo...</strong><p id="of-proxima-decision">Calculando la próxima decisión.</p></div>
    <button class="btn btn-primary" type="button" onclick="navegarPantalla('taller')">VER TALLER</button>
  </section>

  <nav class="of-tabs" aria-label="Secciones de oficina">
    <button class="of-tab is-active" data-of-tab="resumen" type="button" onclick="seleccionarPestanaOficina('resumen')">Resumen</button>
    <button class="of-tab" data-of-tab="finanzas" type="button" onclick="seleccionarPestanaOficina('finanzas')">Finanzas</button>
    <button class="of-tab" data-of-tab="equipo" type="button" onclick="seleccionarPestanaOficina('equipo')">Equipo</button>
    <button class="of-tab" data-of-tab="mejoras" type="button" onclick="seleccionarPestanaOficina('mejoras')">Mejoras</button>
    <button class="of-tab" data-of-tab="historial" type="button" onclick="seleccionarPestanaOficina('historial')">Historial</button>
  </nav>

  <div class="of-tab-panels">
    <section class="of-tab-panel is-active" data-of-panel="resumen">
      <div class="of-decision-grid">
        <article class="of-card of-financial-health"><div class="of-card-head">Salud financiera</div><strong id="of-salud-financiera">-</strong><p id="of-cobertura-caja">-</p><div class="of-kpi-bar"><div id="of-b-solidez" class="of-kpi-fill"></div></div></article>
        <article class="of-card of-next-action"><div class="of-card-head">Acción recomendada</div><strong id="of-accion-recomendada">-</strong><p id="of-accion-detalle">-</p><button id="of-accion-boton" class="btn" type="button" onclick="navegarPantalla('taller')">IR AL TALLER</button></article>
      </div>
      <div class="of-body of-summary-body">
        <div class="of-col"><div class="of-card"><div class="of-card-head">Progreso del negocio</div>
          <div class="of-bio-row"><span class="of-bio-label">Nivel</span><div class="of-bio-bar"><div id="of-b-nivel" class="of-bio-fill"></div></div><span id="of-v-nivel" class="of-bio-value">-</span></div>
          <div class="of-bio-row"><span class="of-bio-label">Reput.</span><div class="of-bio-bar"><div id="of-b-reput" class="of-bio-fill"></div></div><span id="of-v-reput" class="of-bio-value">-</span></div>
          <div class="of-bio-row"><span class="of-bio-label">Moral</span><div class="of-bio-bar"><div id="of-b-moral" class="of-bio-fill"></div></div><span id="of-v-moral" class="of-bio-value">-</span></div>
          <div id="of-estado-resumen" class="of-readout"></div><div class="of-quick-row"><button class="btn" data-sfx="confirm" data-cuidado-accion="comer" onclick="comerDuenoDesdeOficina()">Comer · RD$180</button><button class="btn" data-sfx="confirm" data-cuidado-accion="descansar" onclick="descansarDuenoDesdeOficina()">Descansar</button></div>
        </div></div>
        <div class="of-col"><div class="of-card"><div class="of-card-head">Último caso</div><div id="of-ultimo-caso" class="of-case-profit">Aún no hay un caso cerrado.</div></div><div class="of-card"><div class="of-card-head">Alertas operativas</div><div id="of-alertas-of" class="of-readout">Sin alertas.</div></div></div>
      </div>
    </section>

    <section class="of-tab-panel" data-of-panel="finanzas">
      <div class="of-debt-card"><div><span>DEUDA VIVA</span><strong id="of-deuda-riesgo">RD$0</strong></div><div class="of-debt-metrics"><span>Próximo pago <b id="of-cuota-proxima">-</b></span><span>Margen antes de mora <b id="of-margen-mora">-</b></span><span>Presión <b id="of-presion-financiera">-</b></span></div><button class="btn" onclick="navegarPantalla('exterior')">IR AL BANCO</button></div>
      <div class="of-finance-grid"><article class="of-card"><div class="of-card-head">Resultado del día</div><div id="of-economia" class="of-readout"></div></article><article class="of-card"><div class="of-card-head">Flujo de caja</div><div class="of-kpi"><span class="of-kpi-icon">↗</span><div class="of-kpi-main"><small>Balance operativo</small><div class="of-kpi-bar"><div id="of-b-flujo" class="of-kpi-fill of-kpi-fill-flujo"></div></div><strong id="of-v-flujo">-</strong></div></div><p id="of-flujo-explicacion" class="of-readout"></p></article></div>
      <article class="of-card"><div class="of-card-head">Desglose y movimientos</div><div id="of-facturas" class="of-readout"></div></article>
    </section>

    <section class="of-tab-panel" data-of-panel="equipo">
      <div class="of-card"><div class="of-card-head">Equipo y rendimiento</div><div id="of-equipo-decisiones" class="of-team-decision-grid">Cargando equipo...</div></div>
      <div class="of-management-grid"><button class="of-management-action" onclick="abrirEquipoOficina()"><strong>VER EQUIPO</strong><span>Especialidad, humor y carga actual.</span></button><button class="of-management-action" onclick="abrirModal('contratar')"><strong>CONTRATAR AYUDANTE</strong><span>Coste desde RD$900 · libera capacidad.</span></button><button class="of-management-action" onclick="abrirModal('tienda-tactica')"><strong>PLAN TÁCTICO</strong><span>Mejora resultados del próximo caso.</span></button></div>
    </section>

    <section class="of-tab-panel" data-of-panel="mejoras">
      <div class="of-management-grid"><button class="of-management-action" data-sfx="menu_open" onclick="abrirModal('tienda')"><strong>MEJORAR TALLER</strong><span>Invierte para subir capacidad y precisión.</span></button><button class="of-management-action" data-sfx="confirm" onclick="abrirModal('proyecto-muscle')"><strong>CONTINUAR MUSCLE CAR</strong><span id="of-muscle-resumen">Consulta progreso y coste restante.</span></button></div>
      <div class="of-card"><div class="of-card-head">Capacidad y desbloqueos</div><div class="of-mejoras-grid">
        <div class="of-mej-row"><div class="of-mej-head"><span>Herramientas</span><strong id="of-mej-h">-</strong></div><div class="of-mej-bar"><div id="of-mej-bar-h" class="of-mej-fill"></div></div><small id="of-mej-h-meta" class="of-mej-meta">-</small></div>
        <div class="of-mej-row"><div class="of-mej-head"><span>Nivel taller</span><strong id="of-mej-t">-</strong></div><div class="of-mej-bar"><div id="of-mej-bar-t" class="of-mej-fill"></div></div><small id="of-mej-t-meta" class="of-mej-meta">-</small></div>
        <div class="of-mej-row"><div class="of-mej-head"><span>Publicidad</span><strong id="of-mej-p">-</strong></div><div class="of-mej-bar"><div id="of-mej-bar-p" class="of-mej-fill"></div></div><small id="of-mej-p-meta" class="of-mej-meta">-</small></div>
        <div class="of-mej-row"><div class="of-mej-head"><span>Elevadores</span><strong id="of-mej-e">-</strong></div><div class="of-mej-bar"><div id="of-mej-bar-e" class="of-mej-fill"></div></div><small id="of-mej-e-meta" class="of-mej-meta">-</small></div>
        <div class="of-mej-row"><div class="of-mej-head"><span>Equipo activo</span><strong id="of-mej-ea">-</strong></div><div class="of-mej-bar"><div id="of-mej-bar-ea" class="of-mej-fill"></div></div><small id="of-mej-ea-meta" class="of-mej-meta">-</small></div>
        <div class="of-mej-row of-mej-row-risk"><div class="of-mej-head"><span>Exposición Caja B</span><strong id="of-mej-cb">-</strong></div><div class="of-mej-bar"><div id="of-mej-bar-cb" class="of-mej-fill of-mej-fill-risk"></div></div><small id="of-mej-cb-meta" class="of-mej-meta">-</small></div>
        <div class="of-mej-chips"><div class="of-mej-chip">Máquina DX: <strong id="of-mej-m">-</strong></div><div class="of-mej-chip">Ayudante: <strong id="of-mej-ay">-</strong></div></div><div class="of-mej-prestigio"><div id="of-prestigio-label" class="of-mej-prestigio-label">-</div><div class="of-mej-bar"><div id="of-prestigio-bar" class="of-mej-fill of-mej-fill-prestigio"></div></div></div>
      </div></div>
    </section>

    <section class="of-tab-panel" data-of-panel="historial">
      <div class="of-management-grid"><button class="of-management-action" onclick="abrirModal('historial')"><strong>HISTORIAL DEL TALLER</strong><span>Revisa decisiones, ingresos y eventos.</span></button><button class="of-management-action" onclick="abrirModal('tienda-tactica')"><strong>EVENTOS ACTIVOS</strong><span>Resuelve el siguiente riesgo operativo.</span></button></div>
      <div id="evento-container" class="evento-especial hidden"></div><div class="of-card of-card-malvavisco"><div class="of-card-head">Malvavisco</div><div id="of-malvavisco" class="of-readout">-</div><div class="of-malvavisco-btns"><button id="of-btn-malvavisco" class="btn" onclick="alimentarMalvavisco()">Alimentar</button><button id="of-btn-malvavisco-acariciar" class="btn" onclick="acariciarMalvavisco()">Acariciar</button></div></div>
    </section>
  </div>
</div>`;

window.seleccionarPestanaOficina = function (tab) {
  var nombre = ["resumen", "finanzas", "equipo", "mejoras", "historial"].indexOf(tab) >= 0 ? tab : "resumen";
  window.oficinaTabActiva = nombre;
  document.querySelectorAll("[data-of-tab]").forEach(function (el) { el.classList.toggle("is-active", el.dataset.ofTab === nombre); });
  document.querySelectorAll("[data-of-panel]").forEach(function (el) { el.classList.toggle("is-active", el.dataset.ofPanel === nombre); });
};
