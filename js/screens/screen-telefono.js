/* =============================================================
   PANTALLA: TELEFONO
   Chat con clientes, mecanicos, proveedores, abogado, ex, etc.
   ============================================================= */
window.SCREEN_HTML = window.SCREEN_HTML || {};
window.SCREEN_HTML.telefono = `
<div class="tel-phone-shell">
    <header class="tel-device-header"><span>▣ TALLER OS</span><span id="tel-device-status">● En línea</span></header>
    <section id="tel-app-home" class="tel-app-home">
        <div class="tel-home-copy"><small>TELÉFONO DEL TALLER</small><strong>Herramientas de calle</strong><span id="tel-home-resumen">Conecta con clientes y controla el pulso del barrio.</span></div>
        <div class="tel-app-grid">
            <button class="tel-app-icon app-enlace" type="button" onclick="abrirAppTelefono('enlace')"><b>◌</b><span>Enlace</span><em id="tel-app-badge-enlace" class="hidden">0</em></button>
            <button class="tel-app-icon app-resenas" type="button" onclick="abrirAppTelefono('resenas')"><b>★</b><span>RepuTaller</span></button>
            <button class="tel-app-icon app-marcador" type="button" onclick="abrirAppTelefono('marcador')"><b>⌕</b><span>Marcador</span></button>
            <button class="tel-app-icon app-agenda" type="button" onclick="abrirAppTelefono('agenda')"><b>▤</b><span>Agenda</span></button>
            <button class="tel-app-icon app-radio" type="button" onclick="abrirAppTelefono('radio')"><b>♫</b><span>Radio Taller</span></button>
        </div>
        <p class="tel-home-tip">Enlace concentra conversaciones, decisiones y avisos narrativos. Las demás apps convierten la información del taller en acciones rápidas.</p>
    </section>
    <section id="tel-app-workspace" class="tel-app-workspace hidden">
        <div class="tel-app-bar"><button class="tel-home-btn" type="button" onclick="volverInicioTelefono()">← Apps</button><strong id="tel-app-title">Enlace</strong></div>
        <div id="tel-app-dynamic" class="tel-app-dynamic hidden"></div>
        <div id="tel-app-enlace" class="tel-frame">
    <div class="tel-sidebar">
        <div class="tel-sidebar-header">
            <span>&#x1F4F1; Mensajes</span>
            <small id="tel-meta-pill" class="tel-meta-pill">0 activos</small>
        </div>
        <div class="tel-filtros" role="tablist" aria-label="Filtro de contactos">
            <button id="tel-filtro-todos" class="tel-filtro-btn active" type="button" onclick="cambiarFiltroTelefono('todos')">Todo</button>
            <button id="tel-filtro-clientes" class="tel-filtro-btn" type="button" onclick="cambiarFiltroTelefono('clientes')">Clientes</button>
            <button id="tel-filtro-personal" class="tel-filtro-btn" type="button" onclick="cambiarFiltroTelefono('personal')">Personal</button>
            <button id="tel-filtro-urgente" class="tel-filtro-btn" type="button" onclick="cambiarFiltroTelefono('urgente')">Urgentes</button>
        </div>
        <div class="tel-search-wrap">
            <input id="tel-search-input" class="tel-search-input" type="search" placeholder="Buscar contacto o caso" oninput="buscarTelefono(this.value)" />
        </div>
        <div class="tel-sidebar-stats" id="tel-sidebar-stats">Sin actividad.</div>
        <div class="tel-story-panel hidden" id="tel-story-panel"></div>
        <div class="tel-contact-list" id="tel-contacts">
            <div class="tel-empty-contacts">Cargando contactos...</div>
        </div>
    </div>
    <div class="tel-chat-area">
        <div class="tel-chat-header" id="tel-chat-header">
            <div class="tel-chat-head-main">
                <button id="tel-back-btn" class="btn tel-back-btn hidden" type="button" onclick="volverListaTelefono()">&#x2190; Atras</button>
                <span class="tel-chat-nombre" id="tel-chat-nombre">Selecciona un contacto</span>
                <span class="tel-chat-tipo" id="tel-chat-tipo"></span>
            </div>
            <div id="tel-loop-context" class="tel-loop-context hidden"></div>
            <div id="tel-social-panel" class="tel-social-panel hidden"></div>
        </div>
        <div class="tel-messages" id="tel-messages">
            <div class="tel-empty">Elige un contacto para ver la conversacion.</div>
        </div>
        <div class="tel-reply-row" id="tel-reply-options">
            <div class="tel-empty">Selecciona un contacto para ver respuestas.</div>
        </div>
    </div>
</div>
</section>
</div>
`;
