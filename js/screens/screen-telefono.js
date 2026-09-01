/* =============================================================
   PANTALLA: TELEFONO
   Chat con clientes, mecanicos, proveedores, abogado, ex, etc.
   ============================================================= */
window.SCREEN_HTML = window.SCREEN_HTML || {};
window.SCREEN_HTML.telefono = `
<div class="tel-frame">
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
`;
