/* =============================================================
   PANTALLA: OFICINA
   Gestion de la empresa, finanzas, equipo, estado del dueno
   ============================================================= */
window.SCREEN_HTML = window.SCREEN_HTML || {};
window.SCREEN_HTML.oficina = `
<div class="of-layout">
    <div class="of-topbar">
        <div class="of-player-band">
            <img id="of-player-foto" class="of-player-foto hidden" alt="Jugador" />
            <div class="of-player-copy">
                <strong id="of-player-nombre">-</strong>
                <span id="of-player-taller">-</span>
            </div>
        </div>
        <div class="of-topbar-chips">
            <div class="of-chip"><small>ESTADO</small><strong id="of-estado-flujo">-</strong></div>
            <div class="of-chip of-chip-money"><small>CAJA</small><strong id="of-saldo">-</strong></div>
            <div class="of-chip of-chip-debt"><small>DEUDA</small><strong id="of-deuda">-</strong></div>
            <div class="of-chip"><small>REP</small><strong id="of-reput">-</strong></div>
            <div class="of-chip"><small>XP</small><strong id="of-xp">-</strong></div>
        </div>
    </div>

    <div class="of-body">
        <!-- Botón para abrir modal del proyecto Muscle Car -->
        <div class="of-card of-card-proyecto-muscle" style="margin-bottom:18px;">
            <div class="of-card-head">Proyecto Especial: Muscle Car</div>
            <button class="btn" style="width:100%;margin-top:8px;" onclick="abrirModal('proyecto-muscle')">Ver/Continuar Proyecto</button>
        </div>

        <!-- Columna izquierda: bienestar + finanzas -->
        <div class="of-col">
            <div class="of-card oficina-progreso-duplicado">
                <div class="of-card-head">Progreso del Negocio</div>
                <div class="of-bio-row">
                    <span class="of-bio-label">&#x1F6E0; Nivel</span>
                    <div class="of-bio-bar"><div id="of-b-nivel" class="of-bio-fill"></div></div>
                    <span id="of-v-nivel" class="of-bio-value">-</span>
                </div>
                <div class="of-bio-row">
                    <span class="of-bio-label">XP</span>
                    <div class="of-bio-bar"><div id="of-b-xp" class="of-bio-fill"></div></div>
                    <span id="of-v-xp" class="of-bio-value">-</span>
                </div>
                <div class="of-bio-row">
                    <span class="of-bio-label">&#x2B50; Reput.</span>
                    <div class="of-bio-bar"><div id="of-b-reput" class="of-bio-fill"></div></div>
                    <span id="of-v-reput" class="of-bio-value">-</span>
                </div>
                <div class="of-bio-row">
                    <span class="of-bio-label">&#x1F91D; Moral</span>
                    <div class="of-bio-bar"><div id="of-b-moral" class="of-bio-fill"></div></div>
                    <span id="of-v-moral" class="of-bio-value">-</span>
                </div>
                <div id="of-estado-resumen" class="of-readout" style="margin-top:4px;"></div>
                <div class="of-quick-row" style="margin-top:8px;">
                    <button class="btn" onclick="comerDuenoDesdeOficina()">Comer | RD$180</button>
                    <button class="btn" onclick="descansarDuenoDesdeOficina()">Descansar</button>
                </div>
            </div>

            <div class="of-card">
                <div class="of-card-head">Necesidades y ritmo</div>
                <div class="of-bio-row"><span class="of-bio-label">Hambre</span><div class="of-bio-bar"><div id="of-b-hambre" class="of-bio-fill"></div></div><span id="of-v-hambre" class="of-bio-value">-</span></div>
                <div class="of-bio-row"><span class="of-bio-label">Sueño</span><div class="of-bio-bar"><div id="of-b-sueno" class="of-bio-fill"></div></div><span id="of-v-sueno" class="of-bio-value">-</span></div>
                <div class="of-bio-row"><span class="of-bio-label">Estrés</span><div class="of-bio-bar"><div id="of-b-estres" class="of-bio-fill"></div></div><span id="of-v-estres" class="of-bio-value">-</span></div>
                <div class="of-readout">Estas barras muestran el desgaste del dueño. El humor y las necesidades de cada mecánico se revisan en Recursos.</div>
            </div>

            <div class="of-card">
                <div class="of-card-head">Finanzas Operativas</div>
                <div class="of-kpi-pack">
                    <div class="of-kpi">
                        <span class="of-kpi-icon">&#x1F4BC;</span>
                        <div class="of-kpi-main">
                            <small>Solidez caja/deuda</small>
                            <div class="of-kpi-bar"><div id="of-b-solidez" class="of-kpi-fill"></div></div>
                            <strong id="of-v-solidez">-</strong>
                        </div>
                    </div>
                    <div class="of-kpi">
                        <span class="of-kpi-icon">&#x1F4C8;</span>
                        <div class="of-kpi-main">
                            <small>Flujo operativo</small>
                            <div class="of-kpi-bar"><div id="of-b-flujo" class="of-kpi-fill of-kpi-fill-flujo"></div></div>
                            <strong id="of-v-flujo">-</strong>
                        </div>
                    </div>
                </div>
                <div id="of-economia" class="of-readout">Sin movimientos.</div>
                <div id="of-facturas" class="of-readout">Sin cargos.</div>
                <div class="of-quick-row" style="margin-top:6px;">
                    <button class="btn" onclick="navegarPantalla('exterior')">&#x1F3E6; Ir al Banco</button>
                </div>
            </div>
        </div>

        <!-- Columna central: acciones de gestion -->
        <div class="of-col of-col-center">
            <div class="of-card">
                <div class="of-card-head">Gestion</div>
                <div class="of-actions-grid">
                    <button class="btn" onclick="abrirEquipoOficina()">&#x1F9D1;&#x200D;&#x1F527; Equipo</button>
                    <button class="btn" onclick="abrirModal('contratar')">&#x1F465; Contratar</button>
                    <button class="btn" onclick="abrirModal('tienda')">&#x1F6EC; Mejoras</button>
                    <button class="btn" onclick="abrirModal('tienda-tactica')">&#x1F3AF; Tactica</button>
                    <button class="btn" onclick="abrirModal('historial')">&#x1F4DC; Historial</button>
                </div>
            </div>

            <div class="of-card">
                <div class="of-card-head">Eventos activos</div>
                <div id="evento-container" class="evento-especial hidden"></div>
                <div id="of-alertas-of" class="of-readout" style="margin-top:6px;color:#e09050;">Sin alertas.</div>
            </div>
        </div>

        <!-- Columna derecha: estado del taller -->
        <div class="of-col">
            <div class="of-card">
                <div class="of-card-head">Estado del Taller</div>
                <div class="of-mejoras-grid" id="of-mejoras">
                    <div class="of-mej-row">
                        <div class="of-mej-head"><span>Herramientas</span><strong id="of-mej-h">-</strong></div>
                        <div class="of-mej-bar"><div id="of-mej-bar-h" class="of-mej-fill"></div></div>
                        <small id="of-mej-h-meta" class="of-mej-meta">Impacto en calidad de reparacion.</small>
                    </div>
                    <div class="of-mej-row">
                        <div class="of-mej-head"><span>Nivel del taller</span><strong id="of-mej-t">-</strong></div>
                        <div class="of-mej-bar"><div id="of-mej-bar-t" class="of-mej-fill"></div></div>
                        <small id="of-mej-t-meta" class="of-mej-meta">Define tope operativo y mejoras disponibles.</small>
                    </div>
                    <div class="of-mej-row">
                        <div class="of-mej-head"><span>Publicidad</span><strong id="of-mej-p">-</strong></div>
                        <div class="of-mej-bar"><div id="of-mej-bar-p" class="of-mej-fill"></div></div>
                        <small id="of-mej-p-meta" class="of-mej-meta">Empuja llegada de clientes y reputacion.</small>
                    </div>
                    <div class="of-mej-row">
                        <div class="of-mej-head"><span>Espacios de elevador</span><strong id="of-mej-e">-</strong></div>
                        <div class="of-mej-bar"><div id="of-mej-bar-e" class="of-mej-fill"></div></div>
                        <small id="of-mej-e-meta" class="of-mej-meta">Capacidad simultanea de reparaciones.</small>
                    </div>
                    <div class="of-mej-row">
                        <div class="of-mej-head"><span>Equipo activo</span><strong id="of-mej-ea">-</strong></div>
                        <div class="of-mej-bar"><div id="of-mej-bar-ea" class="of-mej-fill"></div></div>
                        <small id="of-mej-ea-meta" class="of-mej-meta">Mecanicos disponibles en plantilla.</small>
                    </div>
                    <div class="of-mej-row of-mej-row-risk">
                        <div class="of-mej-head"><span>Exposicion Caja B</span><strong id="of-mej-cb">-</strong></div>
                        <div class="of-mej-bar"><div id="of-mej-bar-cb" class="of-mej-fill of-mej-fill-risk"></div></div>
                        <small id="of-mej-cb-meta" class="of-mej-meta">A mayor monto, mayor riesgo legal.</small>
                    </div>
                    <div class="of-mej-chips">
                        <div class="of-mej-chip">Maquina DX: <strong id="of-mej-m">-</strong></div>
                        <div class="of-mej-chip">Ayudante: <strong id="of-mej-ay">-</strong></div>
                    </div>
                    <div class="of-mej-prestigio">
                        <div id="of-prestigio-label" class="of-mej-prestigio-label">Prestigio en evaluacion...</div>
                        <div class="of-mej-bar of-mej-bar-prestigio">
                            <div id="of-prestigio-bar" class="of-mej-fill of-mej-fill-prestigio"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="of-card of-card-malvavisco">
                <div class="of-card-head">&#x1F436; Malvavisco</div>
                <div id="of-malvavisco" class="of-readout">-</div>
                <div class="of-malvavisco-btns">
                    <button id="of-btn-malvavisco" class="btn" onclick="alimentarMalvavisco()">&#x1F436; Alimentar</button>
                    <button id="of-btn-malvavisco-acariciar" class="btn" onclick="acariciarMalvavisco()">&#x1F43E; Acariciar</button>
                </div>
            </div>
        </div>
        </div>
    `;

    // Estado del proyecto muscle car
    function obtenerEstadoProyectoMuscleInicial() {
        return { nivel: 1 };
    }

    function obtenerStorageProyectoMuscle() {
        return (window.TallerApp && window.TallerApp.storage) || {};
    }

    function obtenerClaveProyectoMuscle() {
        const storage = obtenerStorageProyectoMuscle();
        return (storage.keys && storage.keys.muscleProject) || 'estadoProyectoMuscle';
    }

    let progresoGuardado = null;
    if (window.estadoProyectoMuscle && typeof window.estadoProyectoMuscle === 'object') {
        progresoGuardado = window.estadoProyectoMuscle;
    } else {
        const storage = obtenerStorageProyectoMuscle();
        if (storage && typeof storage.readJSON === 'function') {
            progresoGuardado = storage.readJSON(obtenerClaveProyectoMuscle(), null, 'local');
        } else {
            try {
                progresoGuardado = JSON.parse(localStorage.getItem(obtenerClaveProyectoMuscle()));
            } catch (e) {
                if (storage && typeof storage.warn === 'function') {
                    storage.warn('leer', obtenerClaveProyectoMuscle(), e);
                }
            }
        }
    }
    window.estadoProyectoMuscle = progresoGuardado || obtenerEstadoProyectoMuscleInicial();

    function renderizarProyectoMuscleUI() {
                // Asegura que el modal exista en el DOM
                if (!document.getElementById('modal-proyecto-muscle')) {
                    const modal = document.createElement('div');
                    modal.id = 'modal-proyecto-muscle';
                    modal.className = 'modal-overlay hidden';
                    modal.innerHTML = `
                        <div class="modal-content" style="max-width:420px;">
                            <span class="close-btn" onclick="cerrarModal()">&times;</span>
                            <h3 style='margin-bottom:0.5em;'>Proyecto Muscle Car</h3>
                            <div id="proyecto-muscle-ui">Cargando proyecto...</div>
                            <button class="btn btn-danger" style="margin-top:10px;" onclick="cerrarModal()">Cerrar</button>
                        </div>
                    `;
                    document.body.appendChild(modal);
                }
        const cont = document.getElementById('proyecto-muscle-ui');
        const data = (window.TallerData && window.TallerData.proyectoMuscleCar) || null;
        if (!cont || !data) return;
        const nivel = window.estadoProyectoMuscle.nivel || 1;
        const etapa = data.niveles[nivel - 1];
        let html = `<div style='display:flex;flex-direction:column;align-items:center;gap:10px;'>`;
        html += `<img src='${etapa.imagen}' alt='Nivel ${nivel}' style='width:220px;height:120px;object-fit:cover;border-radius:8px;border:2px solid #888;background:#222;margin-bottom:8px;'>`;
        // Barra de progreso visual y tiempo real
        // Calcular progreso real si está en progreso
        let progreso = window.estadoProyectoMuscle.progreso || 0;
        let tiempoTotal = etapa.tiempoHoras ? etapa.tiempoHoras * 3600 : 3600;
        let tiempoRestante = tiempoTotal;
        if (window.estadoProyectoMuscle.enProgreso && window.estadoProyectoMuscle.inicio && window.estadoProyectoMuscle.duracion) {
            const ahora = Date.now();
            const transcurrido = Math.floor((ahora - window.estadoProyectoMuscle.inicio) / 1000);
            progreso = Math.min(1, transcurrido / window.estadoProyectoMuscle.duracion);
            tiempoTotal = window.estadoProyectoMuscle.duracion;
            tiempoRestante = Math.max(0, Math.round(window.estadoProyectoMuscle.duracion - transcurrido));
            // Si terminó, subir de nivel automáticamente
            if (progreso >= 1) {
                window.estadoProyectoMuscle.nivel = (window.estadoProyectoMuscle.nivel || 1) + 1;
                window.estadoProyectoMuscle.enProgreso = false;
                window.estadoProyectoMuscle.progreso = 0;
                window.estadoProyectoMuscle.inicio = null;
                window.estadoProyectoMuscle.duracion = null;
                guardarProgresoProyectoMuscle();
                if (typeof mostrarFeedbackGameplay === 'function') mostrarFeedbackGameplay('¡Mejora completada! Avanzaste de nivel.', 'ok');
                setTimeout(renderizarProyectoMuscleUI, 500);
                return;
            } else {
                window.estadoProyectoMuscle.progreso = progreso;
            }
        }
        const pct = Math.round(progreso * 100);
        function formatearTiempo(seg) {
            if (seg <= 0) return '¡Listo!';
            const h = Math.floor(seg / 3600);
            const m = Math.floor((seg % 3600) / 60);
            if (h > 0) return `${h}h ${m}min`;
            return `${m}min`;
        }
        html += `<div style='text-align:center;'><strong style='font-size:1.15em;'>${data.nombre}</strong><br>`;
        html += `<div style='margin:8px 0 8px 0;'>`;
        html += `<div style='background:#222;border-radius:8px;width:220px;height:22px;display:inline-block;overflow:hidden;position:relative;'>`;
        html += `<div style='background:linear-gradient(90deg,#e0b8b8,#b8e0b8);height:100%;width:${pct}%;transition:width 0.5s;'></div>`;
        html += `<div style='position:absolute;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:1.08em;color:#222;font-weight:bold;'>${formatearTiempo(tiempoRestante)} restantes</div>`;
        html += `</div>`;
        html += `<div style='margin-top:4px;font-size:0.98em;color:#b8e0b8;font-weight:bold;'>Progreso: ${pct}%</div>`;
        html += `<div style='margin-top:2px;font-size:1.08em;color:#e0b8b8;font-weight:bold;'>Tiempo restante: ${formatearTiempo(tiempoRestante)}</div>`;
        html += `</div><span style='font-size:0.92em;color:#b8b;'>Nivel ${nivel}/5</span></div>`;
        html += `<em style='font-size:1.08em;'>${etapa.nombre}</em><br><span style='font-size:0.97em;'>${etapa.descripcion}</span><br>`;
        html += `<span style='color:#b8e0b8;font-weight:bold;'>Costo: RD$${etapa.precio}</span><br>`;
        html += `<span style='color:#e0b8b8;'>${etapa.requisitos}</span></div></div>`;
        html += `<div style='margin-top:10px;'>`;
        if (nivel < 5) {
            const puedeInvertir = typeof saldo === 'number' && Number.isFinite(saldo) && saldo >= etapa.precio && !window.estadoProyectoMuscle.enProgreso;
            html += `<button class='btn' onclick='avanzarProyectoMuscle()' ${puedeInvertir ? '' : 'disabled'}>${window.estadoProyectoMuscle.enProgreso ? 'Mejora en curso' : (puedeInvertir ? `Invertir y avanzar a nivel ${nivel+1}` : `Faltan RD$${Math.max(0, etapa.precio - (Number(saldo) || 0))}`)}</button>`;
        } else {
            html += `<button class='btn' onclick='venderProyectoMuscle()'>Vender restaurado (RD$${data.precioVenta})</button>`;
        }
        html += `</div>`;
        cont.innerHTML = html;
        // Actualizar barra cada segundo si no está listo
        if (progreso < 1 && nivel < 5) {
            if (window._muscleTimer) clearTimeout(window._muscleTimer);
            window._muscleTimer = setTimeout(renderizarProyectoMuscleUI, 1000);
        }
    }

    function guardarProgresoProyectoMuscle() {
        const storage = obtenerStorageProyectoMuscle();
        if (storage && typeof storage.writeJSON === 'function') {
            storage.writeJSON(obtenerClaveProyectoMuscle(), window.estadoProyectoMuscle, 'local');
            return;
        }
        try {
            localStorage.setItem(obtenerClaveProyectoMuscle(), JSON.stringify(window.estadoProyectoMuscle));
        } catch(e) {
            if (storage && typeof storage.warn === 'function') {
                storage.warn('guardar', obtenerClaveProyectoMuscle(), e);
            }
        }
    }

    function avanzarProyectoMuscle() {
        const data = (window.TallerData && window.TallerData.proyectoMuscleCar) || null;
        if (!data) return;
        let nivel = window.estadoProyectoMuscle.nivel || 1;
        if (nivel >= 5) return;
        const etapa = data.niveles[nivel - 1];
        if (typeof saldo !== 'number' || saldo < etapa.precio) {
            if (typeof mostrarFeedbackGameplay === 'function') mostrarFeedbackGameplay('No tienes suficiente dinero para avanzar el proyecto.', 'error');
            return;
        }
        // Si ya está en progreso, no permitir doble avance
        if (window.estadoProyectoMuscle.enProgreso) {
            if (typeof mostrarFeedbackGameplay === 'function') mostrarFeedbackGameplay('Ya hay una mejora en curso.', 'warn');
            return;
        }
        saldo -= etapa.precio;
        // Iniciar progreso: guardar timestamp inicio y duración
        const tiempoHoras = etapa.tiempoHoras || 1; // por defecto 1h si no definido
        const tiempoTotal = tiempoHoras * 3600; // segundos
        window.estadoProyectoMuscle.enProgreso = true;
        window.estadoProyectoMuscle.progreso = 0;
        window.estadoProyectoMuscle.inicio = Date.now();
        window.estadoProyectoMuscle.duracion = tiempoTotal;
        guardarProgresoProyectoMuscle();
        if (typeof mostrarFeedbackGameplay === 'function') mostrarFeedbackGameplay('¡Mejora iniciada! El avance tomará tiempo real.', 'ok');
        renderizarProyectoMuscleUI();
    }

    function venderProyectoMuscle() {
        const data = (window.TallerData && window.TallerData.proyectoMuscleCar) || null;
        if (!data) return;
        if ((window.estadoProyectoMuscle.nivel || 1) < 5) return;
        saldo += data.precioVenta;
        window.estadoProyectoMuscle.nivel = 1;
        window.estadoProyectoMuscle.enProgreso = false;
        window.estadoProyectoMuscle.progreso = 0;
        window.estadoProyectoMuscle.inicio = null;
        window.estadoProyectoMuscle.duracion = null;
        guardarProgresoProyectoMuscle();
        if (typeof mostrarFeedbackGameplay === 'function') mostrarFeedbackGameplay('¡Vendiste el muscle car restaurado!', 'ok');
        renderizarProyectoMuscleUI();
    }

    if (typeof window !== 'undefined') {
        setTimeout(renderizarProyectoMuscleUI, 400);
    }
// Fin del archivo
