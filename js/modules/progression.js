// --- Progresion, logros y recompensas por hitos ---
const LOGROS = [
    { id: 'primer-caso', descripcion: 'Resuelve tu primer caso', check: () => (window.resumenCasos && window.resumenCasos.totalCasosJugados >= 1) },
    { id: 'racha-5', descripcion: 'Logra una racha de 5 casos exitosos', check: () => (window.resumenCasos && window.resumenCasos.rachaCasosExitosos >= 5) },
    { id: 'dinero-10k', descripcion: 'Alcanza RD$10,000', check: () => (window.saldo >= 10000) },
    { id: 'reputacion-10', descripcion: 'Llega a 10 de reputación', check: () => (window.reputacion >= 10) },
    { id: '50-casos', descripcion: 'Resuelve 50 casos', check: () => (window.resumenCasos && window.resumenCasos.totalCasosJugados >= 50) },
];
let logrosDesbloqueados = [];

function renderizarLogrosUI() {
    const cont = document.getElementById('logros-ui');
    if (!cont) return;
    cont.innerHTML = LOGROS.map(logro => {
        const unlocked = logrosDesbloqueados.includes(logro.id) || logro.check();
        return `<span style="display:inline-block;padding:0.3em 1em;border-radius:8px;${unlocked ? 'background:#90caf9;color:#222;font-weight:bold;' : 'background:#eee;color:#888;'};min-width:90px;">${logro.descripcion}</span>`;
    }).join('');
}

function verificarLogros() {
    LOGROS.forEach(logro => {
        if (logro.check() && !logrosDesbloqueados.includes(logro.id)) {
            logrosDesbloqueados.push(logro.id);
            if (typeof log === 'function') log(`¡Logro desbloqueado! ${logro.descripcion}`, 'exito');
            if (typeof mostrarFeedbackGameplay === 'function') mostrarFeedbackGameplay(`¡Logro desbloqueado! ${logro.descripcion}`, 'ok');
        }
    });
    renderizarLogrosUI();
}

const HITOS_OBJETIVOS = [
    { casos: 5, descripcion: '¡Primeros 5 casos!', recompensa: { saldo: 500, reputacion: 2 } },
    { casos: 10, descripcion: '¡10 casos resueltos!', recompensa: { saldo: 1000, reputacion: 3 } },
    { casos: 20, descripcion: '¡20 casos, taller en marcha!', recompensa: { saldo: 2000, reputacion: 5 } },
    { casos: 50, descripcion: '¡50 casos, leyenda local!', recompensa: { saldo: 5000, reputacion: 10 } },
];
let hitosAlcanzados = [];
var monitorProgresoInterval = null;

function renderizarHitosObjetivosUI() {
    const cont = document.getElementById('hitos-ui');
    if (!cont) return;
    const casosTotales = Math.max(0, Math.round((window.resumenCasos && window.resumenCasos.totalCasosJugados) || 0));
    cont.innerHTML = HITOS_OBJETIVOS.map(hito => {
        const alcanzado = hitosAlcanzados.includes(hito.casos) || casosTotales >= hito.casos;
        return `<span style="display:inline-block;padding:0.3em 1em;border-radius:8px;${alcanzado ? 'background:#f6d365;color:#222;font-weight:bold;' : 'background:#eee;color:#888;'};min-width:110px;">${hito.descripcion}</span>`;
    }).join('');
}

function verificarHitosObjetivos() {
    renderizarHitosObjetivosUI();
    if (!window.resumenCasos || typeof window.resumenCasos.totalCasosJugados !== 'number') return;
    const total = window.resumenCasos.totalCasosJugados;
    HITOS_OBJETIVOS.forEach(hito => {
        if (total >= hito.casos && !hitosAlcanzados.includes(hito.casos)) {
            if (typeof reservarRecompensa === 'function' && !reservarRecompensa('hito-casos-' + hito.casos)) {
                hitosAlcanzados.push(hito.casos);
                return;
            }
            if (typeof window.saldo === 'number') window.saldo += hito.recompensa.saldo || 0;
            if (typeof window.reputacion === 'number') window.reputacion += hito.recompensa.reputacion || 0;
            hitosAlcanzados.push(hito.casos);
            if (typeof log === 'function') log(`Hito alcanzado: ${hito.descripcion} +${hito.recompensa.saldo} RD$, +${hito.recompensa.reputacion} reputación`, 'exito');
            if (typeof mostrarFeedbackGameplay === 'function') mostrarFeedbackGameplay(`¡${hito.descripcion}! +${hito.recompensa.saldo} RD$, +${hito.recompensa.reputacion} reputación`, 'ok');
        }
    });
    renderizarHitosObjetivosUI();
}

function detenerMonitorProgreso() {
    if (!monitorProgresoInterval) return false;
    clearInterval(monitorProgresoInterval);
    monitorProgresoInterval = null;
    return true;
}

function iniciarMonitorProgreso() {
    detenerMonitorProgreso();
    verificarHitosObjetivos();
    verificarLogros();
    monitorProgresoInterval = setInterval(function() {
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
        verificarHitosObjetivos();
        verificarLogros();
    }, 2000);
}

if (typeof window !== 'undefined') {
    window.detenerMonitorProgreso = detenerMonitorProgreso;
}

function iniciarJuegoReal() {
    if (typeof empezarJornada === 'function') empezarJornada();
    if (typeof iniciarTimer === 'function') iniciarTimer();
    if (typeof mostrarHistoriaPrincipalModal === 'function') {
        setTimeout(function() { mostrarHistoriaPrincipalModal(); }, 60);
    }
    iniciarMonitorProgreso();
    if (typeof actualizarObjetivoOnboarding === 'function') actualizarObjetivoOnboarding();
    setTimeout(renderizarHitosObjetivosUI, 400);
    setTimeout(renderizarLogrosUI, 400);
}
