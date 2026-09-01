// Opciones de inversión disponibles
const OPCIONES_INVERSIONES = [
    { clave: 'casa', nombre: 'Casa', costo: 5000, retorno: 900, requisitos: {} },
    { clave: 'colmado', nombre: 'Colmado', costo: 12000, retorno: 2500, requisitos: { casos: 20 } },
    { clave: 'supermercado', nombre: 'Supermercado', costo: 25000, retorno: 6000, requisitos: { casos: 40, reputacion: 60 } },
    { clave: 'surtidora', nombre: 'Surtidora', costo: 40000, retorno: 11000, requisitos: { casos: 60, reputacion: 80 } },
    { clave: 'carwash', nombre: 'Carwash', costo: 18000, retorno: 4200, requisitos: { casos: 30 } }
];

// Estado de inversiones del jugador
window.inversionesJugador = window.inversionesJugador || {};
window.casosDesdeUltimoRetornoInversion = window.casosDesdeUltimoRetornoInversion || 0;

// Renderiza el modal de inversiones
function renderizarModalInversiones() {
    const lista = document.getElementById('inversiones-lista');
    if (!lista) return;
    lista.innerHTML = '';
    const casosCerrados = typeof obtenerCasosCompletadosNarrativa === 'function' ? obtenerCasosCompletadosNarrativa() : 0;
    const rep = typeof reputacion === 'number' ? reputacion : 0;
    const casosRetorno = window.casosDesdeUltimoRetornoInversion || 0;
    OPCIONES_INVERSIONES.forEach(inv => {
        const yaInvertido = window.inversionesJugador[inv.clave];
        let cumple = true;
        let requisitosTxt = [];
        let casosReq = inv.requisitos && inv.requisitos.casos ? inv.requisitos.casos : 0;
        let repReq = inv.requisitos && inv.requisitos.reputacion ? inv.requisitos.reputacion : 0;
        if (casosReq) {
            requisitosTxt.push(`Casos cerrados: ${casosCerrados}/${casosReq}`);
            if (casosCerrados < casosReq) cumple = false;
        }
        if (repReq) {
            requisitosTxt.push(`Reputación: ${rep}/${repReq}`);
            if (rep < repReq) cumple = false;
        }

        // Contenedor visual
        const card = document.createElement('div');
        card.className = 'inversion-card';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.gap = '6px';
        card.style.padding = '10px';
        card.style.background = yaInvertido ? '#232a22' : '#1a1f19';
        card.style.border = '1px solid #7b5d3c';
        card.style.borderRadius = '8px';
        card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';

        // Título
        const titulo = document.createElement('div');
        titulo.style.fontWeight = 'bold';
        titulo.style.fontSize = '1.05em';
        titulo.style.color = yaInvertido ? '#e3bf79' : '#d7ccb2';
        titulo.innerText = inv.nombre;
        card.appendChild(titulo);

        // Requisitos barra
        if (casosReq || repReq) {
            const barraReq = document.createElement('div');
            barraReq.className = 'barra';
            barraReq.style.margin = '4px 0';
            barraReq.style.height = '12px';
            barraReq.style.background = '#181c18';
            barraReq.style.borderRadius = '6px';
            barraReq.style.overflow = 'hidden';
            barraReq.style.border = '1px solid #3a3a3a';
            const fillReq = document.createElement('div');
            fillReq.className = 'barra-fill estado-estable';
            let pctReq = 0;
            if (casosReq && repReq) {
                pctReq = Math.min(100, Math.round(((casosCerrados/casosReq + rep/repReq)/2)*100));
            } else if (casosReq) {
                pctReq = Math.min(100, Math.round((casosCerrados/casosReq)*100));
            } else if (repReq) {
                pctReq = Math.min(100, Math.round((rep/repReq)*100));
            }
            fillReq.style.width = pctReq + '%';
            barraReq.appendChild(fillReq);
            card.appendChild(barraReq);
            const reqTxt = document.createElement('div');
            reqTxt.style.fontSize = '0.85em';
            reqTxt.style.color = cumple ? '#b8e0b8' : '#e0b8b8';
            reqTxt.innerText = 'Requisitos: ' + requisitosTxt.join(', ');
            card.appendChild(reqTxt);
        }

        // Barra de retorno
        if (yaInvertido) {
            const barraRet = document.createElement('div');
            barraRet.className = 'barra';
            barraRet.style.margin = '4px 0';
            barraRet.style.height = '12px';
            barraRet.style.background = '#181c18';
            barraRet.style.borderRadius = '6px';
            barraRet.style.overflow = 'hidden';
            barraRet.style.border = '1px solid #3a3a3a';
            const fillRet = document.createElement('div');
            fillRet.className = 'barra-fill estado-estable';
            let pctRet = Math.min(100, Math.round((casosRetorno/12)*100));
            fillRet.style.width = pctRet + '%';
            barraRet.appendChild(fillRet);
            card.appendChild(barraRet);
            const retTxt = document.createElement('div');
            retTxt.style.fontSize = '0.85em';
            retTxt.style.color = '#b8e0b8';
            retTxt.innerText = `Retorno: ${casosRetorno}/12 casos para RD$${inv.retorno}`;
            card.appendChild(retTxt);
        }

        // Botón
        const btn = document.createElement('button');
        btn.className = 'btn';
        const fondosSuficientes = typeof saldo === 'number' && Number.isFinite(saldo) && saldo >= inv.costo;
        btn.disabled = yaInvertido || !cumple || !fondosSuficientes;
        if (!cumple || yaInvertido || !fondosSuficientes) {
            btn.style.background = '#bbb';
            btn.style.color = '#666';
            btn.style.borderColor = '#aaa';
            btn.style.cursor = 'not-allowed';
        }
        btn.innerText = yaInvertido
            ? `${inv.nombre} — Invertido | Retorno: RD$${inv.retorno} cada 12 casos`
            : (!fondosSuficientes ? `Faltan RD$${Math.max(0, inv.costo - (Number(saldo) || 0))}` : `Invertir en ${inv.nombre} | RD$${inv.costo} | Retorno: RD$${inv.retorno}`);
        btn.onclick = function() {
            invertirEnOpcion(inv.clave);
            renderizarModalInversiones();
        };
        card.appendChild(btn);

        lista.appendChild(card);
    });
}

// Lógica para invertir
function invertirEnOpcion(clave) {
    const inv = OPCIONES_INVERSIONES.find(i => i.clave === clave);
    if (!inv) return;
    if (window.inversionesJugador[clave]) return;
    const casosCerrados = typeof obtenerCasosCompletadosNarrativa === 'function' ? obtenerCasosCompletadosNarrativa() : 0;
    const casosReq = inv.requisitos && inv.requisitos.casos ? inv.requisitos.casos : 0;
    const repReq = inv.requisitos && inv.requisitos.reputacion ? inv.requisitos.reputacion : 0;
    if (casosCerrados < casosReq || (Number(reputacion) || 0) < repReq) {
        if (typeof mostrarFeedbackGameplay === 'function') mostrarFeedbackGameplay('Aun no cumples los requisitos de esta inversion.', 'error');
        return;
    }
    if (typeof saldo !== 'number' || saldo < inv.costo) {
        if (typeof mostrarFeedbackGameplay === 'function') mostrarFeedbackGameplay('No tienes suficiente dinero para invertir.', 'error');
        return;
    }
    saldo -= inv.costo;
    window.inversionesJugador[clave] = true;
    if (typeof mostrarFeedbackGameplay === 'function') mostrarFeedbackGameplay(`¡Invertiste en ${inv.nombre}!`, 'ok');
    if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarGastoDia === 'function') {
        window.TallerApp.helpers.registrarGastoDia(inv.costo, 'inversiones');
    }
    if (typeof actualizarUI === 'function') actualizarUI();
    if (typeof actualizarScreenExterior === 'function') actualizarScreenExterior();
    if (typeof autoGuardarPartidaSilenciosa === 'function') autoGuardarPartidaSilenciosa('inversion-' + clave);
}

// Llamar esta función cada vez que se cierre un caso
function procesarRetornoInversionesPorCaso() {
    window.casosDesdeUltimoRetornoInversion = (window.casosDesdeUltimoRetornoInversion || 0) + 1;
    if (window.casosDesdeUltimoRetornoInversion >= 12) {
        let totalRetorno = 0;
        OPCIONES_INVERSIONES.forEach(inv => {
            if (window.inversionesJugador[inv.clave]) {
                totalRetorno += inv.retorno;
            }
        });
        if (totalRetorno > 0) {
            saldo += totalRetorno;
            if (typeof mostrarFeedbackGameplay === 'function') mostrarFeedbackGameplay(`Recibiste RD$${totalRetorno} de tus inversiones.`, 'ok');
            if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarIngresoDia === 'function') {
                window.TallerApp.helpers.registrarIngresoDia(totalRetorno, 'inversiones');
            }
        }
        window.casosDesdeUltimoRetornoInversion = 0;
    }
}
/* =============================================================
   PANTALLA: EXTERIOR
   Zona de compras, banco, bar, comedor
   ============================================================= */
window.SCREEN_HTML = window.SCREEN_HTML || {};
window.SCREEN_HTML.exterior = `
<div class="ext-layout">
    <div class="ext-title">&#x1F306; Zona Exterior</div>

    <div class="ext-status-bar">
        <div class="ext-status-chip">
            <small>CAJA</small>
            <strong id="ext-saldo">-</strong>
        </div>
        <div class="ext-status-chip ext-chip-debt">
            <small>DEUDA</small>
            <strong id="ext-deuda-top">-</strong>
        </div>
        <div class="ext-status-chip">
            <small>ESTRES</small>
            <strong id="ext-estres">-</strong>
        </div>
        <div class="ext-status-chip">
            <small>HAMBRE</small>
            <strong id="ext-hambre">-</strong>
        </div>
        <div class="ext-status-chip">
            <small>REP</small>
            <strong id="ext-reput">-</strong>
        </div>
    </div>

    <div class="ext-grid">
        <!-- La Grua (repuestos) -->
        <div class="ext-card">
            <div class="ext-card-icon">&#x1F527;</div>
            <div class="ext-card-name">La Grua — Repuestos</div>
            <div class="ext-card-desc">
                Piezas para reparaciones. Una pieza instalada reduce riesgo, tiempo y puede subir el cobro.
            </div>
            <button class="btn ext-card-btn" onclick="abrirModal('repuestos')">Entrar al local</button>
        </div>

        <!-- Inversiones -->
        <div class="ext-card">
            <div class="ext-card-icon">💸</div>
            <div class="ext-card-name">Inversiones</div>
            <div class="ext-card-desc">Invierte en propiedades y negocios. Recibe retorno cada 12 casos cerrados.</div>
            <button class="btn ext-card-btn" onclick="abrirModal('inversiones')">Ver oportunidades</button>
        </div>

        <!-- Banco -->
        <div class="ext-card ext-card-bank">
            <div class="ext-card-icon">&#x1F3E6;</div>
            <div class="ext-card-name">Banco Confianza</div>
            <div class="ext-card-desc">Administra tu deuda, limite de credito y mora por retraso. Si no pagas en varios casos seguidos, llega recargo.</div>
            <div class="ext-bank-snapshot">
                <div class="ext-bank-stat">
                    <small>Deuda viva</small>
                    <strong id="ext-deuda">RD$0</strong>
                </div>
                <div class="ext-bank-stat">
                    <small>Disponible</small>
                    <strong id="ext-credito-disponible">RD$0</strong>
                </div>
                <div class="ext-bank-stat">
                    <small>Cuota hoy</small>
                    <strong id="ext-cuota-hoy">RD$0</strong>
                </div>
            </div>
            <div class="ext-bank-bars">
                <div class="ext-bank-bar-box">
                    <div class="ext-bank-bar-head">
                        <span>Linea usada</span>
                        <strong id="ext-credito-uso-label">0%</strong>
                    </div>
                    <div class="bank-progress-track">
                        <div id="ext-credito-uso-fill" class="bank-progress-fill"></div>
                    </div>
                </div>
                <div class="ext-bank-bar-box">
                    <div class="ext-bank-bar-head">
                        <span>Presion mora</span>
                        <strong id="ext-mora-label">0/4</strong>
                    </div>
                    <div class="bank-progress-track">
                        <div id="ext-mora-fill" class="bank-progress-fill"></div>
                    </div>
                </div>
            </div>
            <div class="ext-bank-info ext-bank-tip"><small id="ext-refi-info">Refinanciacion: sin datos.</small></div>
            <div class="ext-bank-info ext-bank-tip ext-bank-tip-alert"><small id="ext-banco-recomendacion">Sin alertas bancarias.</small></div>
            <div class="ext-bank-actions">
                <button id="ext-bank-pay-500" class="btn" onclick="pagarDeuda(500)">Pagar RD$500</button>
                <button id="ext-bank-pay-1000" class="btn" onclick="pagarDeuda(1000)">Pagar RD$1000</button>
                <button id="ext-bank-pay-2000" class="btn" onclick="pagarDeuda(2000)">Pagar RD$2000</button>
                <button id="ext-bank-loan-1000" class="btn btn-danger" onclick="pedirPrestamo(1000)">Prestamo +RD$1000</button>
                <button id="ext-bank-talk" class="btn" onclick="mostrarEventoBancoModal('manual')">Hablar con el gerente</button>
                <button id="ext-bank-refi" class="btn" onclick="mostrarEventoBancoModal('manual', construirContextoBanco('refinanciacion','manual'))">Revisar refinanciacion</button>
            </div>
        </div>

        <!-- Caja B (movidas informales limitadas) -->
        <div class="ext-card ext-card-cajab">
            <div class="ext-card-icon">&#x1F4E6;</div>
            <div class="ext-card-name">Caja B Del Barrio</div>
            <div class="ext-card-desc">Movidas rapidas inspiradas en realidad de taller: utiles, pero con cupos y riesgo legal real.</div>
            <div class="ext-bank-info">Caja B: <strong id="ext-cajab-monto">RD$0</strong></div>
            <div class="ext-bank-info">Cupos informales: <strong id="ext-cajab-cupos">0/3</strong></div>
            <div class="ext-bank-info">Calor inspector: <strong id="ext-cajab-calor">0/100</strong></div>
            <div class="ext-bank-info"><small id="ext-cajab-meta">Cada 3 casos cerrados recuperas 1 cupo.</small></div>
            <div class="ext-bank-actions">
                <button id="btn-cajab-picoteo" class="btn" onclick="operarCajaB('picoteo')">Picoteo rapido (+caja, riesgo bajo)</button>
                <button id="btn-cajab-rescate" class="btn" onclick="operarCajaB('rescate')">Rescate en calle (+caja, riesgo alto)</button>
                <button id="btn-cajab-cuadre" class="btn" onclick="operarCajaB('cuadre')">Cuadre con equipo (-calor, +moral)</button>
            </div>
        </div>

        <!-- Cafetin y comida corrida -->
        <div class="ext-card">
            <div class="ext-card-icon">&#x2615;</div>
            <div class="ext-card-name">Cafetin De La Esquina</div>
            <div class="ext-card-desc">Cafe, pizza y licuados para bajar la tension del taller. Sirve para levantar el humor de los mecanicos y darle aire al dia.</div>
            <button class="btn ext-card-btn" onclick="abrirModal('comida')">Pedir para el equipo</button>
        </div>

        <!-- Tienda tactica -->
        <div class="ext-card">
            <div class="ext-card-icon">&#x1F3AF;</div>
            <div class="ext-card-name">Ferreteria Tactica</div>
            <div class="ext-card-desc">Mejoras de eficiencia y energia. Invierte en tu rendimiento diario.</div>
            <button class="btn ext-card-btn" onclick="abrirModal('tienda-tactica')">Ver mejoras</button>
        </div>

        <!-- Tienda de mejoras -->
        <div class="ext-card">
            <div class="ext-card-icon">&#x1F6EC;</div>
            <div class="ext-card-name">Centro de Mejoras</div>
            <div class="ext-card-desc">Expande el taller, mejora herramientas y consigue publicidad.</div>
            <button class="btn ext-card-btn" onclick="abrirModal('tienda')">Ver catalogo</button>
        </div>
    </div>
</div>
`;
