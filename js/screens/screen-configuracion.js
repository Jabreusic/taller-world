/* =============================================================
   PANTALLA: CONFIGURACION
   Ajustes, guardado y accesos de sistema
   ============================================================= */
window.SCREEN_HTML = window.SCREEN_HTML || {};
window.SCREEN_HTML.configuracion = `
<div class="of-layout">
    <div class="of-topbar">
        <div class="of-player-band">
            <div class="of-player-copy">
                <strong>Configuracion del Taller</strong>
                <span>Ordena audio, flujo, interfaz y sistema</span>
            </div>
        </div>
        <div class="of-topbar-chips">
            <div class="of-chip"><small>ESTADO</small><strong id="cfg-estado">-</strong></div>
            <div class="of-chip"><small>HORA</small><strong id="cfg-hora">-</strong></div>
            <div class="of-chip of-chip-money"><small>CAJA</small><strong id="cfg-saldo">-</strong></div>
            <div class="of-chip of-chip-debt"><small>DEUDA</small><strong id="cfg-deuda">-</strong></div>
            <div class="of-chip"><small>FOCO</small><strong id="cfg-foco">-</strong></div>
        </div>
    </div>

    <div class="of-body">
        <div class="of-col">
            <div class="of-card">
                <div class="of-card-head">Audio y Alertas</div>
                <div class="cfg-pill-grid">
                    <div class="cfg-pill"><span>Música</span><strong id="cfg-musica">-</strong></div>
                    <div class="cfg-pill"><span>Efectos</span><strong id="cfg-efectos">-</strong></div>
                    <div class="cfg-pill"><span>Tema</span><strong id="cfg-tema">-</strong></div>
                    <div class="cfg-pill"><span>Notifs.</span><strong id="cfg-notif-estado">-</strong></div>
                </div>
                <div class="of-actions-grid">
                    <button class="btn" onclick="abrirModal('opciones')">Opciones generales</button>
                    <button class="btn" id="btn-notificaciones-sistema" onclick="if (typeof solicitarPermisoNotificaciones === 'function') solicitarPermisoNotificaciones();">Activar notificaciones</button>
                </div>
                <div id="cfg-audio-resumen" class="of-readout" style="margin-top:8px;">Sin datos de audio.</div>
                <div id="cfg-notificaciones" class="of-readout" style="margin-top:8px;">Estado notificaciones: pendiente.</div>
            </div>

            <div class="of-card">
                <div class="of-card-head">Ritmo e Interfaz</div>
                <div class="of-mejoras-grid cfg-stats-grid">
                    <div>Autoavance: <strong id="cfg-auto">-</strong></div>
                    <div>Intervalo: <strong id="cfg-auto-vel">-</strong></div>
                    <div>Cola: <strong id="cfg-cola">0</strong></div>
                    <div>Pendientes DX: <strong id="cfg-pdx">0</strong></div>
                </div>
                <div class="of-actions-grid">
                    <button class="btn" onclick="abrirModal('editor-ui')">Editor de interfaz</button>
                    <button class="btn" onclick="abrirMenuPausa()">Menu de pausa</button>
                    <button class="btn" onclick="abrirModal('ayuda')">Como jugar</button>
                    <button class="btn" onclick="navegarPantalla('taller')">Volver al taller</button>
                </div>
                <div id="cfg-resumen-flujo" class="of-readout" style="margin-top:8px;">Sin datos del flujo.</div>
            </div>
        </div>

        <div class="of-col">
            <div class="of-card">
                <div class="of-card-head">Partida y Sistema</div>
                <div class="of-actions-grid">
                    <button class="btn" onclick="guardarPartida()">Guardar partida</button>
                    <button class="btn" onclick="cargarPartida()">Cargar partida</button>
                    <button class="btn" onclick="salirAlMenuInicio()">Salir al menu</button>
                </div>
                <div id="cfg-resumen-guardado" class="of-readout" style="margin-top:8px;">Hay autosave en hitos clave, pero puedes guardar manual cuando quieras.</div>
            </div>

            <div class="of-card">
                <div class="of-card-head">Estado Rapido</div>
                <div class="of-mejoras-grid cfg-stats-grid">
                    <div>Activas: <strong id="cfg-rep">0</strong></div>
                    <div>Casos cerrados: <strong id="cfg-casos-cerrados">0</strong></div>
                    <div>Caja: <strong id="cfg-saldo-atajo">RD$0</strong></div>
                    <div>Deuda: <strong id="cfg-deuda-atajo">RD$0</strong></div>
                </div>
                <div id="cfg-resumen-riesgo" class="of-readout" style="margin-top:8px;">Sin alertas.</div>
            </div>
        </div>
    </div>
</div>
`;
