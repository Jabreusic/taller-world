﻿// Variable global para solicitudes de mecánico
var solicitudMecanicoActiva = null;
cargarOpciones = function() {
    if (typeof cargarOpcionesEnUI === 'function') cargarOpcionesEnUI();
};
// --- Persistencia de trabajos activos (diagnóstico/reparación) ---
var tiradaKeyHandler = null;
const STORAGE_KEYS =
    (window.TallerApp && window.TallerApp.storage && window.TallerApp.storage.keys) || {};
const STORAGE_UTILS =
    (window.TallerApp && window.TallerApp.storage) || {};
const TRABAJOS_KEY = STORAGE_KEYS.activeJobs || 'trabajosActivos';

function registrarErrorPersistencia(origen, error) {
    if (STORAGE_UTILS && typeof STORAGE_UTILS.warn === 'function') {
        STORAGE_UTILS.warn(origen, TRABAJOS_KEY, error);
        return;
    }
    if (typeof console !== 'undefined' && console && typeof console.warn === 'function') {
        console.warn('[persistencia] ' + origen + ' fallo para ' + TRABAJOS_KEY + '.', error);
    }
}

function hayNuevaPartidaForzada() {
    try {
        if (STORAGE_UTILS && typeof STORAGE_UTILS.readRaw === 'function') {
            return STORAGE_UTILS.readRaw(STORAGE_KEYS.forceNewSession || 'tw_force_new', 'session') === '1';
        }
        return typeof sessionStorage !== 'undefined' && sessionStorage.getItem('tw_force_new') === '1';
    } catch (e) {
        registrarErrorPersistencia('leer-bandera-nueva-partida', e);
        return false;
    }
}

function limpiarTrabajosActivosPersistidos() {
    try {
        if (STORAGE_UTILS && typeof STORAGE_UTILS.remove === 'function') {
            STORAGE_UTILS.remove(TRABAJOS_KEY, 'local');
            return;
        }
        localStorage.removeItem(TRABAJOS_KEY);
    } catch (e) {
        registrarErrorPersistencia('eliminar-trabajos-activos', e);
    }
}

function obtenerSegundosCompatTrabajoActivo(trabajo) {
    var directo = Number(trabajo && trabajo.segundosPendientesReal);
    if (Number.isFinite(directo) && directo >= 0) {
        return Math.max(0, Math.round(directo));
    }

    var compat = Number(trabajo && trabajo.tiempoRestante);
    if (!Number.isFinite(compat) || compat < 0) compat = 0;
    var usaUnidadDirecta = !!(
        typeof window !== 'undefined' &&
        window &&
        typeof window.modoNivelesActivo === 'function' &&
        window.modoNivelesActivo()
    );
    var segundosPorUnidad = usaUnidadDirecta
        ? 1
        : Math.max(
            1,
            Math.round(
                (typeof window !== 'undefined' && window && Number(window.autoTurnoCadaSeg)) || 1,
            ),
        );
    return Math.max(0, Math.round(compat * segundosPorUnidad));
}

function forzarProgresoTrabajoActivo(item, esDelivery) {
    if (!item || typeof item !== 'object') return item;
    var ahora = Date.now();
    item.segundosPendientesReal = 0;
    item.ultimoTiempoSyncMs = ahora;
    if (esDelivery) {
        item.etaRestante = 0;
    } else {
        item.tiempoRestante = 0;
    }
    return item;
}

function guardarTrabajosActivos() {
    if (hayNuevaPartidaForzada()) {
        limpiarTrabajosActivosPersistidos();
        return;
    }
    try {
        // Guardar trabajos activos con tiempo real restante como fuente canonica.
        const trabajos = (window.reparacionesActivas || []).map(t => {
            if (!t) return null;
            return {
                ...t,
                _persistencia: {
                    timestamp: Date.now(),
                    segundosPendientesReal: obtenerSegundosCompatTrabajoActivo(t),
                    tiempoRestante: t.tiempoRestante || 0,
                    estado: t.estado || '',
                }
            };
        });
        if (STORAGE_UTILS && typeof STORAGE_UTILS.writeJSON === 'function') {
            STORAGE_UTILS.writeJSON(TRABAJOS_KEY, trabajos, 'local');
            return;
        }
        localStorage.setItem(TRABAJOS_KEY, JSON.stringify(trabajos));
    } catch (e) {
        registrarErrorPersistencia('guardar-trabajos-activos', e);
    }
}

function restaurarTrabajosActivos() {
    if (hayNuevaPartidaForzada()) {
        limpiarTrabajosActivosPersistidos();
        window.reparacionesActivas = [];
        return;
    }
    try {
        const trabajos = STORAGE_UTILS && typeof STORAGE_UTILS.readJSON === 'function'
            ? STORAGE_UTILS.readJSON(TRABAJOS_KEY, null, 'local')
            : JSON.parse(localStorage.getItem(TRABAJOS_KEY) || 'null');
        if (!Array.isArray(trabajos)) return;
        const ahora = Date.now();
        window.reparacionesActivas = trabajos.map(t => {
            if (!t || !t._persistencia) return t;
            const transcurrido = Math.floor((ahora - t._persistencia.timestamp) / 1000);
            const baseSegundos = Number.isFinite(Number(t._persistencia.segundosPendientesReal))
                ? Number(t._persistencia.segundosPendientesReal)
                : obtenerSegundosCompatTrabajoActivo(t);
            let segundosPendientesReal = Math.max(0, Math.round(baseSegundos - transcurrido));
            const usaUnidadDirecta = t && t.tipoTrabajo === 'diagnostico'
                ? !!(
                    typeof window !== 'undefined' &&
                    window &&
                    typeof window.modoNivelesActivo === 'function' &&
                    window.modoNivelesActivo()
                )
                : !!(
                    typeof window !== 'undefined' &&
                    window &&
                    typeof window.modoNivelesActivo === 'function' &&
                    window.modoNivelesActivo()
                );
            const segundosPorUnidad = usaUnidadDirecta
                ? 1
                : Math.max(
                    1,
                    Math.round(
                        (typeof window !== 'undefined' && window && Number(window.autoTurnoCadaSeg)) || 1,
                    ),
                );
            const tiempoRestante = Math.max(0, Math.ceil(segundosPendientesReal / segundosPorUnidad));
            // Diagnóstico y reparación son fases distintas. Al restaurar una
            // partida no conviertas un diagnóstico terminado en un caso listo
            // para cobrar: debe pasar por aprobación, piezas y reparación.
            const esDiagnostico = t && t.tipoTrabajo === 'diagnostico';
            if (segundosPendientesReal === 0 && !esDiagnostico && t.estado !== 'listoParaCobro') {
                t.listoParaCobro = true;
                t.estado = 'listoParaCobro';
                t.tiempoRestante = 0;
                t.segundosPendientesReal = 0;
                t.ultimoTiempoSyncMs = ahora;
                // Notificación si terminó el trabajo
                if (typeof window.enviarNotificacionSistema === 'function') {
                    window.enviarNotificacionSistema('Trabajo finalizado', {
                        body: `El trabajo/caso ${t.idCaso || ''} está listo para cobro.`
                    });
                }
            } else if (segundosPendientesReal === 0 && esDiagnostico) {
                t.diagnosticoCompletado = true;
                t.listoParaCobro = false;
                t.estado = 'diagnostico_completado';
                t.tiempoRestante = 0;
                t.segundosPendientesReal = 0;
                t.ultimoTiempoSyncMs = ahora;
            } else {
                t.tiempoRestante = tiempoRestante;
                t.segundosPendientesReal = segundosPendientesReal;
                t.ultimoTiempoSyncMs = ahora;
            }
            delete t._persistencia;
            return t;
        });
    } catch (e) {
        registrarErrorPersistencia('restaurar-trabajos-activos', e);
    }
}
    // ===============================
    // FUNCION: RECALCULAR COSTOS TACTICOS
    // ===============================
    function recalcularCostosTacticos() {
        return null;
    }

// Llamar a guardarTrabajosActivos() cada vez que se actualice el estado de trabajos activos
// y restaurarTrabajosActivos() al iniciar el juego

window.addEventListener('beforeunload', guardarTrabajosActivos);
window.addEventListener('pagehide', guardarTrabajosActivos);
restaurarTrabajosActivos();

// Inicialización del HUD de experiencia (XP)
if (window.XP_HUD && typeof window.XP_HUD.init === 'function') {
    window.XP_HUD.init(
        Math.max(1, Math.round((typeof nivelJugador === 'number' ? nivelJugador : (window.jugadorNivel || 1)) || 1)),
        Math.max(0, Math.round((typeof progresoNivel === 'number' ? progresoNivel : (window.jugadorXP || 0)) || 0)),
        Math.min(
            25,
            Math.max(
                0,
                Math.round(
                    ((window.resumenCasos && window.resumenCasos.rachaCasosExitosos) || 0) * 5,
                ),
            ),
        ),
    );
}

function eventoAleatorioNoche() {
    let r = Math.random();
    let msg = '';
    if (r < 0.3) {
        let gana = 300 + Math.random() * 500;


// ===============================
// GAMEPLAY LOOP CONTROLLER
// ===============================

// Job object template
function crearTrabajo({ descripcion, dificultad, tiempoEstimado, recompensa }) {
    return {
        id: generateJobId(),
        descripcion: descripcion || '',
        dificultad: Number.isFinite(dificultad) ? dificultad : 1, // 1-5
        tiempoEstimado: Number.isFinite(tiempoEstimado) ? tiempoEstimado : 10, // segundos
        recompensa: Number.isFinite(recompensa) ? recompensa : 0, // dinero
        estado: 'pending', // strict state machine
        progreso: 0, // 0-100
        falloDiagnostico: false,
        falloReparacion: false,
        eventos: [],
    };
}

// Main gameplay loop controller
function iniciarCicloTrabajo(trabajo) {
    if (trabajo.estado !== 'pending') return;
    const nextTrabajo = { ...trabajo, estado: 'diagnosing' };
    mostrarOfertaTrabajo(nextTrabajo);
}

function mostrarOfertaTrabajo(trabajo) {
    // Presenta 3 opciones: Diagnosticar, Reparar rápido, Hablar con cliente
    if (typeof mostrarOpcionesDecisionTrabajo === 'function') {
        mostrarOpcionesDecisionTrabajo(trabajo, function(accion) {
            if (accion === 'diagnostico') {
                trabajo.accionElegida = 'diagnostico';
                iniciarDiagnostico({ ...trabajo });
            } else if (accion === 'reparar') {
                trabajo.accionElegida = 'reparar';
                iniciarReparacionDirecta({ ...trabajo });
            } else if (accion === 'hablar') {
                trabajo.accionElegida = 'hablar';
                iniciarHablarCliente({ ...trabajo });
            }
        });
    } else {
        // Fallback: simple prompt
        let accion = prompt('Elige acción: diagnostico / reparar / hablar');
        if (accion === 'diagnostico') {
            trabajo.accionElegida = 'diagnostico';
            iniciarDiagnostico({ ...trabajo });
        } else if (accion === 'reparar') {
            trabajo.accionElegida = 'reparar';
            iniciarReparacionDirecta({ ...trabajo });
        } else {
            trabajo.accionElegida = 'hablar';
            iniciarHablarCliente({ ...trabajo });
        }
    }
}

// Acción: Reparar rápido (alto riesgo, rápido)
function iniciarReparacionDirecta(trabajo) {
    trabajo.estado = 'repairing';
    trabajo.progreso = 0;
    // Alto riesgo: base 40% + dificultad*30%
    let baseFallo = 0.4 + 0.3 * (trabajo.dificultad || 1);
    // Herramientas pueden reducir riesgo aquí en el futuro
    trabajo.falloReparacion = Math.random() < baseFallo;
    if (typeof mostrarTrabajoEnCasoActivo === 'function') mostrarTrabajoEnCasoActivo(trabajo);
    if (typeof animarProgresoTrabajo === 'function') {
        animarProgresoTrabajo(trabajo, 800 + 200 * (trabajo.dificultad || 1), function() {
            trabajo.progreso = 100;
            trabajo.estado = 'completed';
            if (trabajo.falloReparacion) {
                mostrarResultadoTrabajo(trabajo, false, 'Fallo en reparación rápida');
            } else {
                mostrarResultadoTrabajo(trabajo, true, '¡Reparación rápida exitosa!');
            }
        });
    }
}

// Acción: Hablar con cliente (reduce incertidumbre, puede dar info falsa)
function iniciarHablarCliente(trabajo) {
    trabajo.estado = 'talking';
    trabajo.progreso = 0;
    // 80% chance de info útil, 20% info falsa
    let infoUtil = Math.random() < 0.8;
    trabajo.infoCliente = infoUtil ? 'útil' : 'falsa';
    if (typeof mostrarTrabajoEnCasoActivo === 'function') mostrarTrabajoEnCasoActivo(trabajo);
    if (typeof animarProgresoTrabajo === 'function') {
        animarProgresoTrabajo(trabajo, 1000, function() {
            trabajo.progreso = 100;
            // Después de hablar, volver a elegir acción (pero con menos incertidumbre si info útil)
            if (infoUtil) {
                if (typeof mostrarFeedbackGameplay === 'function') mostrarFeedbackGameplay('El cliente te dio información útil. Riesgo reducido.', 'ok');
                trabajo.riesgoReducidoPorHablar = true;
            } else {
                if (typeof mostrarFeedbackGameplay === 'function') mostrarFeedbackGameplay('El cliente te confundió. Riesgo aumentado.', 'warn');
                trabajo.riesgoReducidoPorHablar = false;
            }
            // Volver a mostrar opciones, pero solo diagnostico o reparar
            if (typeof mostrarOpcionesDecisionTrabajo === 'function') {
                mostrarOpcionesDecisionTrabajo(trabajo, function(accion) {
                    if (accion === 'diagnostico') {
                        trabajo.accionElegida = 'diagnostico';
                        iniciarDiagnostico({ ...trabajo });
                    } else {
                        trabajo.accionElegida = 'reparar';
                        iniciarReparacionDirecta({ ...trabajo });
                    }
                }, true); // true = solo 2 opciones
            }
        });
    }
}

function iniciarDiagnostico(trabajo) {
    if (trabajo.estado !== 'diagnosing') return;
    let falloDiagnostico = Math.random() < (0.1 + 0.15 * (trabajo.dificultad || 1));
    let evento = null;
    if (Math.random() < 0.2) {
        evento = generarEventoAleatorio('diagnostico', trabajo);
        if (evento && typeof mostrarFeedbackGameplay === 'function') mostrarFeedbackGameplay(evento.mensaje, evento.tipo || 'info');
        if (evento && evento.afectaFallo) {
            falloDiagnostico = true;
        }
    }
    const nextTrabajo = { ...trabajo, progreso: 0, falloDiagnostico, estado: 'diagnosing' };
    if (typeof mostrarTrabajoEnCasoActivo === 'function') mostrarTrabajoEnCasoActivo(nextTrabajo);
    if (typeof animarProgresoTrabajo === 'function') {
        animarProgresoTrabajo(nextTrabajo, 1000 + 500 * (trabajo.dificultad || 1), function() {
            let updatedTrabajo = { ...nextTrabajo, progreso: 100 };
            if (updatedTrabajo.falloDiagnostico) {
                updatedTrabajo = { ...updatedTrabajo, estado: 'completed' };
                if (typeof mostrarTrabajoEnCasoActivo === 'function') mostrarTrabajoEnCasoActivo(updatedTrabajo);
                mostrarResultadoTrabajo(updatedTrabajo, false, 'Fallo en diagnóstico');
            } else {
                updatedTrabajo = { ...updatedTrabajo, estado: 'diagnosed' };
                if (typeof mostrarTrabajoEnCasoActivo === 'function') mostrarTrabajoEnCasoActivo(updatedTrabajo);
                iniciarReparacion(updatedTrabajo);
            }
        });
    }
}

function iniciarReparacion(trabajo) {
    if (trabajo.estado !== 'diagnosed') return;
    let falloReparacion = Math.random() < (0.05 + 0.2 * (trabajo.dificultad || 1));
    let evento = null;
    if (Math.random() < 0.25) {
        evento = generarEventoAleatorio('reparacion', trabajo);
        if (evento && typeof mostrarFeedbackGameplay === 'function') mostrarFeedbackGameplay(evento.mensaje, evento.tipo || 'info');
        if (evento && evento.afectaFallo) {
            falloReparacion = true;
        }
    }
    const nextTrabajo = { ...trabajo, progreso: 0, falloReparacion, estado: 'repairing' };
    if (typeof mostrarTrabajoEnCasoActivo === 'function') mostrarTrabajoEnCasoActivo(nextTrabajo);
    if (typeof animarProgresoTrabajo === 'function') {
        animarProgresoTrabajo(nextTrabajo, (trabajo.tiempoEstimado || 10) * 10, function() {
            let updatedTrabajo = { ...nextTrabajo, progreso: 100 };
            if (updatedTrabajo.falloReparacion) {
                updatedTrabajo = { ...updatedTrabajo, estado: 'completed' };
                if (typeof mostrarTrabajoEnCasoActivo === 'function') mostrarTrabajoEnCasoActivo(updatedTrabajo);
                mostrarResultadoTrabajo(updatedTrabajo, false, 'Fallo en reparación');
            } else {
                updatedTrabajo = { ...updatedTrabajo, estado: 'completed' };
                if (typeof mostrarTrabajoEnCasoActivo === 'function') mostrarTrabajoEnCasoActivo(updatedTrabajo);
                mostrarResultadoTrabajo(updatedTrabajo, true);
            }
        });
    }
}
// Generador de eventos aleatorios para diagnosis y reparación
function generarEventoAleatorio(fase, trabajo) {
    // Puedes expandir la lista de eventos según la fase y dificultad
    const eventosDiagnostico = [
        { mensaje: '¡Herramienta defectuosa! Diagnóstico más difícil.', afectaFallo: true, tipo: 'warn' },
        { mensaje: 'Cliente aporta información útil. Diagnóstico más fácil.', afectaFallo: false, tipo: 'ok' },
        { mensaje: 'Corte de energía momentáneo. Se retrasa el diagnóstico.', afectaFallo: false, tipo: 'info' },
    ];
    const eventosReparacion = [
        { mensaje: 'Pieza defectuosa encontrada. Reparación más difícil.', afectaFallo: true, tipo: 'warn' },
        { mensaje: 'Ayuda inesperada de un colega. Reparación más fácil.', afectaFallo: false, tipo: 'ok' },
        { mensaje: 'Herramienta especial disponible. Reparación más rápida.', afectaFallo: false, tipo: 'ok' },
    ];
    let pool = fase === 'diagnostico' ? eventosDiagnostico : eventosReparacion;
    // Elegir evento aleatorio
    let idx = Math.floor(Math.random() * pool.length);
    return pool[idx];
}

// --- XP y sistema de niveles ---
window.jugadorXP = window.jugadorXP || 0;
window.jugadorNivel = window.jugadorNivel || 1;
function xpParaNivel(nivel) {
    return 100 + (nivel - 1) * 60;
}

function otorgarXP(cantidad) {
    window.jugadorXP += cantidad;
    let subio = false;
    while (window.jugadorXP >= xpParaNivel(window.jugadorNivel)) {
        window.jugadorXP -= xpParaNivel(window.jugadorNivel);
        window.jugadorNivel++;
        subio = true;
    }
    if (typeof actualizarHUDXP === 'function') actualizarHUDXP();
    return subio;
}

// --- Economía y reputación ---
window.jugadorDinero = window.jugadorDinero || 1000;
window.jugadorReputacion = window.jugadorReputacion || 50;

function mostrarResultadoTrabajo(trabajo, exito, motivoFallo) {
    if (trabajo.estado !== 'completed') return;
    let resultado = 'perfecto';
    let resultadoCaso = 'exitoso';
    let resultadoNivel = 'critico';
    let pago = trabajo.recompensa;
    let rep = 0;
    let xp = 0;
    let feedback = '';
    let tipoFeedback = 'ok';
    // Lógica de resultado
    if (exito === true) {
        // Perfecto: diagnóstico + reparación sin fallo
        resultado = 'perfecto';
        resultadoCaso = 'exitoso';
        resultadoNivel = 'critico';
        pago = trabajo.recompensa;
        rep = 5;
        xp = 40 + (Number.isFinite(trabajo.dificultad) ? trabajo.dificultad : 1) * 20;
        feedback = '¡Perfect Fix! Cliente impresionado';
        tipoFeedback = 'ok';
    } else if (exito === 'parcial') {
        // Parcial: reparación exitosa pero sin diagnóstico o con evento negativo
        resultado = 'parcial';
        resultadoCaso = 'parcial';
        resultadoNivel = 'parcial';
        pago = Math.round(trabajo.recompensa * 0.7);
        rep = 0;
        xp = 20 + (Number.isFinite(trabajo.dificultad) ? trabajo.dificultad : 1) * 10;
        feedback = 'Reparación parcial. Cliente neutro';
        tipoFeedback = 'warn';
    } else {
        // Fallo: reparación fallida
        resultado = 'fallo';
        resultadoCaso = 'fallido';
        resultadoNivel = 'fallo';
        pago = -Math.round(trabajo.recompensa * 0.5);
        rep = -8;
        xp = -10;
        feedback = motivoFallo || 'Fallo caro. Cliente molesto';
        tipoFeedback = 'fail';
    }

    if (typeof saldo !== 'number') saldo = Math.max(0, Math.round(window.jugadorDinero || 0));
    if (typeof reputacion !== 'number') reputacion = Math.max(0, Math.round(window.jugadorReputacion || 50));
    if (typeof deuda !== 'number') deuda = 0;

    if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.asegurarResumenDiaContable === 'function') {
        window.TallerApp.helpers.asegurarResumenDiaContable();
    }

    if (pago >= 0) {
        saldo = Math.max(0, Math.round((saldo || 0) + pago));
        if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarIngresoDia === 'function') {
            window.TallerApp.helpers.registrarIngresoDia(pago, 'reparaciones');
        }
    } else {
        var perdida = Math.abs(Math.round(pago));
        if ((saldo || 0) >= perdida) {
            saldo = Math.max(0, Math.round((saldo || 0) - perdida));
        } else {
            var faltante = perdida - Math.max(0, Math.round(saldo || 0));
            saldo = 0;
            deuda = Math.max(0, Math.round((deuda || 0) + faltante));
        }
        if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarGastoDia === 'function') {
            window.TallerApp.helpers.registrarGastoDia(perdida, 'operaciones');
        }
    }

    reputacion = Math.max(0, Math.min(100, Math.round((reputacion || 0) + rep)));

    if (typeof registrarProgresoNivel === 'function') {
        registrarProgresoNivel(Math.max(0, pago), resultadoNivel);
    }

    if (typeof resumenDia === 'object' && resumenDia) {
        if (resultadoCaso === 'exitoso') resumenDia.reparacionesExitosas = Math.max(0, Math.round(resumenDia.reparacionesExitosas || 0) + 1);
        else if (resultadoCaso === 'parcial') resumenDia.reparacionesParciales = Math.max(0, Math.round(resumenDia.reparacionesParciales || 0) + 1);
        else resumenDia.reparacionesFallidas = Math.max(0, Math.round(resumenDia.reparacionesFallidas || 0) + 1);
    }

    if (typeof tramaEstado === 'object' && tramaEstado) {
        if (resultadoCaso === 'exitoso') tramaEstado.casosCriticosResueltos = Math.max(0, Math.round((tramaEstado.casosCriticosResueltos || 0) + 1));
        else if (resultadoCaso === 'parcial') tramaEstado.casosParciales = Math.max(0, Math.round((tramaEstado.casosParciales || 0) + 1));
    }

    if (typeof finalizarCaso === 'function') {
        finalizarCaso(resultadoCaso, trabajo.descripcion || null, trabajo.cliente || null);
    }

    if (typeof nuevoCaso === 'function') {
        nuevoCaso();
    }

    window.jugadorDinero = saldo;
    window.jugadorReputacion = reputacion;
    window.jugadorNivel = typeof nivelJugador === 'number' ? nivelJugador : (window.jugadorNivel || 1);
    if (typeof progresoNivel === 'number') window.jugadorXP = progresoNivel;

    if (typeof actualizarHUDXP === 'function') actualizarHUDXP();
    if (typeof actualizarHUDReputacion === 'function') actualizarHUDReputacion();
    if (typeof actualizarUI === 'function') actualizarUI();
    if (typeof verificarNarrativaPorCasoCompletado === 'function') verificarNarrativaPorCasoCompletado();
    // Feedback animado
    if (typeof mostrarFeedbackGameplay === 'function') {
        if (pago > 0) mostrarFeedbackGameplay(`+RD$${pago}`, 'money');
        if (pago < 0) mostrarFeedbackGameplay(`-RD$${-pago}`, 'fail');
        if (rep > 0) mostrarFeedbackGameplay(`+${rep} reputación`, 'rep');
        if (rep < 0) mostrarFeedbackGameplay(`${rep} reputación`, 'fail');
        mostrarFeedbackGameplay(feedback, tipoFeedback);
    }
    // Vibración para mobile
    if (window.navigator && window.navigator.vibrate) {
        if (resultado === 'perfecto') window.navigator.vibrate([40, 40, 80]);
        else if (resultado === 'parcial') window.navigator.vibrate([60, 40, 60]);
        else window.navigator.vibrate([120, 40, 120]);
    }
    // TODO: Siguiente trabajo o volver a menú
}

// Ejemplo de uso:
// iniciarCicloTrabajo(crearTrabajo({
//     descripcion: 'Cambio de aceite y filtro',
//     dificultad: 2,
//     tiempoEstimado: 15,
//     recompensa: 300,
// }));
        saldo += gana;
        // Eliminar registro por día, solo sumar saldo
        msg = `Encontraste dinero en un bolsillo: +RD$${Math.round(gana)}`;
    } else if (r < 0.6) {
        let pierde = 200 + Math.random() * 400;
        if (saldo >= pierde) {
            saldo -= pierde;
        } else {
            let faltante = pierde - saldo;
            saldo = 0;
            deuda += faltante;
        }
        // Eliminar registro por día, solo restar saldo
        msg = `Se rompio una herramienta: -RD$${Math.round(pierde)}`;
    } else if (r < 0.8) {
        let idx = Math.floor(Math.random() * mecanicos.length);
        mecanicos[idx].enojo += 2;
        msg = `${mecanicos[idx].nombre} tuvo un problema personal y llega mas enojado.`;
    } else {
        reputacion += 5;
        msg = 'Un cliente misterioso dejo una resena positiva. +5 reputacion';
    }

    if (stewartStatus === 'contratado' && Math.random() < 0.3) {
        if (Math.random() < 0.5) {
            const _stewartRobo = 1000;
            const _stewartFalta = Math.max(0, _stewartRobo - saldo);
            if (_stewartFalta > 0) { deuda = (deuda || 0) + _stewartFalta; }
            saldo = Math.max(0, saldo - _stewartRobo);
            stewartStatus = 'traidor';
            msg += ' Stewart robo y huyo. -RD$1000';
        } else {
            saldo += 800;
            msg += ' Stewart trabajo extra y dejo dinero. +RD$800';
        }
    }

    return msg;
}

// Las deudas internas ya no se cobran al azar: se liquidan con la comisión
// del mecánico al cobrar cada caso. Conservamos esta función como compatibilidad
// con guardados y disparadores narrativos antiguos.
function procesarDevolucionDeudasMecanicosPorCasos(hitoCasoForzado) {
    return '';
}

function obtenerBioMecanicoSeguro(nombre) {
    const biografiasMecanicos = (window.TallerData && window.TallerData.biografiasMecanicos) || {};
    // Normalizar nombre para buscar biografía
    const normalizar = n => n && n.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim();
    const nombreNorm = normalizar(nombre);
    let base = biografiasMecanicos[nombre] || null;
    if (!base) {
        for (const key in biografiasMecanicos) {
            if (normalizar(key) === nombreNorm) {
                base = biografiasMecanicos[key];
                break;
            }
        }
    }
    base = base || {};
    return {
        historia: base.historia || 'Sin historia registrada.',
        habilidadTexto: base.habilidadTexto || 'Generalista',
        rivalidad: base.rivalidad || 'Sin rivalidad destacada.',
        necesidad: base.necesidad || 'No reporta necesidad urgente.',
        foto: base.foto || ''
    };
}

const UI_EDITOR_KEY = STORAGE_KEYS.uiEditor || 'tw_ui_editor_v1';
const UI_EDITOR_DEFAULT = {
    colaAncho: 260,
    filaMecanicosAlto: 132,
    dockAlto: 228,
    gapGeneral: 12,
    hudColsDesktop: 6,
    menuCols: 2,
    dockOrden: '1-2-3',
    colaDerecha: false
};

function limitarNumero(valor, min, max) {
    const n = Number(valor);
    if (!Number.isFinite(n)) return min;
    return Math.min(max, Math.max(min, n));
}

function leerNumeroVarCss(nombreVar, fallback) {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(nombreVar).trim();
    const num = parseFloat(raw);
    return Number.isFinite(num) ? num : fallback;
}

function normalizarConfigEditorInterfaz(input) {
    const data = input || {};
    const orden = String(data.dockOrden || UI_EDITOR_DEFAULT.dockOrden);
    const ordenValida = /^\d-\d-\d$/.test(orden) ? orden : UI_EDITOR_DEFAULT.dockOrden;
    return {
        colaAncho: limitarNumero(data.colaAncho, 180, 420),
        filaMecanicosAlto: limitarNumero(data.filaMecanicosAlto, 86, 220),
        dockAlto: limitarNumero(data.dockAlto, 150, 320),
        gapGeneral: limitarNumero(data.gapGeneral, 4, 24),
        hudColsDesktop: limitarNumero(data.hudColsDesktop, 2, 8),
        menuCols: limitarNumero(data.menuCols, 1, 3),
        dockOrden: ordenValida,
        colaDerecha: !!data.colaDerecha
    };
}

function obtenerConfigEditorInterfazBase() {
    const root = document.documentElement;
    const game = document.getElementById('game');
    const ordenJugador = Math.round(leerNumeroVarCss('--ui-orden-jugador', 1));
    const ordenOperaciones = Math.round(leerNumeroVarCss('--ui-orden-operaciones', 2));
    const ordenFinanzas = Math.round(leerNumeroVarCss('--ui-orden-finanzas', 3));
    return normalizarConfigEditorInterfaz({
        colaAncho: leerNumeroVarCss('--ui-cola-ancho', UI_EDITOR_DEFAULT.colaAncho),
        filaMecanicosAlto: leerNumeroVarCss('--ui-fila-mecanicos-alto', UI_EDITOR_DEFAULT.filaMecanicosAlto),
        dockAlto: leerNumeroVarCss('--ui-dock-alto', UI_EDITOR_DEFAULT.dockAlto),
        gapGeneral: leerNumeroVarCss('--ui-gap-general', UI_EDITOR_DEFAULT.gapGeneral),
        hudColsDesktop: leerNumeroVarCss('--ui-hud-columnas-desktop', UI_EDITOR_DEFAULT.hudColsDesktop),
        menuCols: leerNumeroVarCss('--ui-menu-principal-columnas', UI_EDITOR_DEFAULT.menuCols),
        dockOrden: `${ordenJugador}-${ordenOperaciones}-${ordenFinanzas}`,
        colaDerecha: !!(game && game.classList.contains('layout-cola-derecha'))
    });
}

function cargarConfigEditorInterfazGuardada() {
    const raw = localStorage.getItem(UI_EDITOR_KEY);
    if (!raw) return null;
    try {
        return normalizarConfigEditorInterfaz(JSON.parse(raw));
    } catch (e) {
        return null;
    }
}

function aplicarConfigEditorInterfaz(configInput) {
    const config = normalizarConfigEditorInterfaz(configInput);
    const root = document.documentElement;
    root.style.setProperty('--ui-cola-ancho', `${Math.round(config.colaAncho)}px`);
    root.style.setProperty('--ui-fila-mecanicos-alto', `${Math.round(config.filaMecanicosAlto)}px`);
    root.style.setProperty('--ui-dock-alto', `${Math.round(config.dockAlto)}px`);
    root.style.setProperty('--ui-gap-general', `${Math.round(config.gapGeneral)}px`);
    root.style.setProperty('--ui-hud-columnas-desktop', String(Math.round(config.hudColsDesktop)));
    root.style.setProperty('--ui-menu-principal-columnas', String(Math.round(config.menuCols)));

    const [ordJugador, ordOperaciones, ordFinanzas] = String(config.dockOrden).split('-').map(n => limitarNumero(n, 1, 3));
    root.style.setProperty('--ui-orden-jugador', String(ordJugador));
    root.style.setProperty('--ui-orden-operaciones', String(ordOperaciones));
    root.style.setProperty('--ui-orden-finanzas', String(ordFinanzas));

    const game = document.getElementById('game');
    if (game) game.classList.toggle('layout-cola-derecha', !!config.colaDerecha);
}

function obtenerConfigEditorInterfazDesdeInputs() {
    return normalizarConfigEditorInterfaz({
        colaAncho: parseInt((document.getElementById('ui-cola-ancho') || {}).value || UI_EDITOR_DEFAULT.colaAncho, 10),
        filaMecanicosAlto: parseInt((document.getElementById('ui-fila-mecanicos-alto') || {}).value || UI_EDITOR_DEFAULT.filaMecanicosAlto, 10),
        dockAlto: parseInt((document.getElementById('ui-dock-alto') || {}).value || UI_EDITOR_DEFAULT.dockAlto, 10),
        gapGeneral: parseInt((document.getElementById('ui-gap-general') || {}).value || UI_EDITOR_DEFAULT.gapGeneral, 10),
        hudColsDesktop: parseInt((document.getElementById('ui-hud-columnas-desktop') || {}).value || UI_EDITOR_DEFAULT.hudColsDesktop, 10),
        menuCols: parseInt((document.getElementById('ui-menu-principal-columnas') || {}).value || UI_EDITOR_DEFAULT.menuCols, 10),
        dockOrden: (document.getElementById('ui-dock-orden') || {}).value || UI_EDITOR_DEFAULT.dockOrden,
        colaDerecha: !!((document.getElementById('ui-cola-derecha') || {}).checked)
    });
}

function volcarConfigEditorInterfazAInputs(configInput) {
    const config = normalizarConfigEditorInterfaz(configInput);
    const setVal = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = String(value);
    };

    setVal('ui-cola-ancho', Math.round(config.colaAncho));
    setVal('ui-fila-mecanicos-alto', Math.round(config.filaMecanicosAlto));
    setVal('ui-dock-alto', Math.round(config.dockAlto));
    setVal('ui-gap-general', Math.round(config.gapGeneral));
    setVal('ui-hud-columnas-desktop', Math.round(config.hudColsDesktop));
    setVal('ui-menu-principal-columnas', Math.round(config.menuCols));
    setVal('ui-dock-orden', config.dockOrden);

    const colaDerecha = document.getElementById('ui-cola-derecha');
    if (colaDerecha) colaDerecha.checked = !!config.colaDerecha;
}

function actualizarEtiquetasEditorInterfaz(configInput) {
    const config = normalizarConfigEditorInterfaz(configInput);
    const setTxt = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.innerText = text;
    };
    setTxt('ui-cola-ancho-valor', `${Math.round(config.colaAncho)}px`);
    setTxt('ui-fila-mecanicos-alto-valor', `${Math.round(config.filaMecanicosAlto)}px`);
    setTxt('ui-dock-alto-valor', `${Math.round(config.dockAlto)}px`);
    setTxt('ui-gap-general-valor', `${Math.round(config.gapGeneral)}px`);
    setTxt('ui-hud-columnas-desktop-valor', `${Math.round(config.hudColsDesktop)}`);
    setTxt('ui-menu-principal-columnas-valor', `${Math.round(config.menuCols)}`);
}

function actualizarVistaEditorInterfaz() {
    const config = obtenerConfigEditorInterfazDesdeInputs();
    actualizarEtiquetasEditorInterfaz(config);
    aplicarConfigEditorInterfaz(config);
}

function cargarEditorInterfazEnUI() {
    const guardada = cargarConfigEditorInterfazGuardada();
    const base = guardada || obtenerConfigEditorInterfazBase();
    volcarConfigEditorInterfazAInputs(base);
    actualizarEtiquetasEditorInterfaz(base);
    aplicarConfigEditorInterfaz(base);
}

function guardarEditorInterfaz() {
    const config = obtenerConfigEditorInterfazDesdeInputs();
    aplicarConfigEditorInterfaz(config);
    localStorage.setItem(UI_EDITOR_KEY, JSON.stringify(config));
    log('Editor de interfaz guardado.', 'exito');
}

function resetearEditorInterfaz() {
    localStorage.removeItem(UI_EDITOR_KEY);
    volcarConfigEditorInterfazAInputs(UI_EDITOR_DEFAULT);
    actualizarEtiquetasEditorInterfaz(UI_EDITOR_DEFAULT);
    aplicarConfigEditorInterfaz(UI_EDITOR_DEFAULT);
    log('Interfaz restablecida a valores base.', 'info');
}

function aplicarPresetEditorInterfaz(tipo) {
    const actual = obtenerConfigEditorInterfazDesdeInputs();
    const preset = { ...actual };
    if (tipo === 'compacto') {
        preset.colaAncho = 220;
        preset.filaMecanicosAlto = 108;
        preset.dockAlto = 192;
        preset.gapGeneral = 7;
        preset.hudColsDesktop = 4;
    } else if (tipo === 'amplio') {
        preset.colaAncho = 320;
        preset.filaMecanicosAlto = 154;
        preset.dockAlto = 260;
        preset.gapGeneral = 14;
        preset.hudColsDesktop = 6;
    } else {
        return;
    }
    volcarConfigEditorInterfazAInputs(preset);
    actualizarEtiquetasEditorInterfaz(preset);
    aplicarConfigEditorInterfaz(preset);
}

function aplicarEditorInterfazGuardadoAlIniciar() {
    const guardada = cargarConfigEditorInterfazGuardada();
    if (guardada) aplicarConfigEditorInterfaz(guardada);
}

function solicitarPantallaCompletaMovil() {
    const root = document.documentElement;
    const request = root.requestFullscreen || root.webkitRequestFullscreen || root.msRequestFullscreen;
    if (!request) return;
    try {
        const result = request.call(root);
        if (result && typeof result.catch === 'function') {
            result.catch(() => {});
        }
    } catch (e) {}
}

function salirPantallaCompletaMovil() {
    const exit = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
    if (!exit) return;
    try {
        const result = exit.call(document);
        if (result && typeof result.catch === 'function') {
            result.catch(() => {});
        }
    } catch (e) {}
}

function estaEnPantallaCompletaMovil() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
}

function actualizarBotonesPantallaCompletaMovil() {
    const btnEntrar = document.getElementById('btn-mobile-fullscreen');
    const btnSalir = document.getElementById('btn-mobile-exit-fullscreen');
    if (!btnEntrar || !btnSalir) return;
    const activa = estaEnPantallaCompletaMovil();
    btnEntrar.classList.toggle('hidden', activa);
    btnSalir.classList.toggle('hidden', !activa);
}

function configurarBloqueoMovil() {
    const btnFullscreen = document.getElementById('btn-mobile-fullscreen');
    if (!btnFullscreen || btnFullscreen.dataset.bound === '1') return;
    btnFullscreen.dataset.bound = '1';
    btnFullscreen.addEventListener('click', solicitarPantallaCompletaMovil);
}

window.bancoModalContexto = window.bancoModalContexto || null;
window.bancoEventoPendiente = window.bancoEventoPendiente || null;

function formatoDineroBanco(monto) {
    return 'RD$ ' + Math.max(0, Math.round(monto || 0)).toLocaleString('es-DO');
}

function obtenerSituacionFinancieraBanco() {
    var deudaActual = Math.max(0, Math.round(deuda || 0));
    var saldoActual = Math.max(0, Math.round(saldo || 0));
    var ratio = deudaActual / Math.max(1, saldoActual + 1500);

    if (deudaActual >= 60000 || ratio >= 12 || (bancoMorasAplicadas || 0) >= 3) return 'muy_endeudado';
    if (deudaActual >= 18000 || ratio >= 5) return 'endeudado';
    if (deudaActual > 0) return 'estable';
    return 'sin_deuda';
}

function elegirTipoEventoBanco(situacion, tipoForzado) {
    if (tipoForzado && tipoForzado !== 'manual') return tipoForzado;
    if (situacion === 'muy_endeudado' && Math.random() < 0.44) return 'muy_endeudado';

    var pool = [
        { tipo: 'oferta_especial', peso: (situacion === 'sin_deuda' ? 3 : 1.3) },
        { tipo: 'cobro', peso: (situacion === 'sin_deuda' ? 0.5 : 2.4) },
        { tipo: 'advertencia', peso: (situacion === 'muy_endeudado' ? 2.2 : 1.3) },
        { tipo: 'inversion', peso: (situacion === 'estable' ? 2 : 1.1) },
        { tipo: 'refinanciacion', peso: (situacion === 'sin_deuda' ? 0.4 : 2.1) }
    ];

    var total = pool.reduce(function(acc, item) { return acc + item.peso; }, 0);

    var roll = Math.random() * total;
    var cursor = 0;
    for (var i = 0; i < pool.length; i++) {
        cursor += pool[i].peso;
        if (roll <= cursor) return pool[i].tipo;
    }
    return 'cobro';
}

function elegirExpresionGerenteBanco(tipoEvento, situacion) {
    if (tipoEvento === 'muy_endeudado') return 'sonrisa_maliciosa';
    if (tipoEvento === 'refinanciacion') return 'negociador';
    if (tipoEvento === 'oferta_especial' || tipoEvento === 'inversion') return 'sonrisa_confiada';
    if (tipoEvento === 'advertencia') return 'preocupado';
    if (situacion === 'muy_endeudado') return 'preocupado';
    return 'neutral';
}

function elegirMensajeGerenteBanco(tipoEvento, situacion) {
    var mensajes = {
        oferta_especial: [
            'Tu taller tiene potencial. Podemos ofrecerte un prestamo para expandirte.',
            'Un negocio en crecimiento siempre necesita respaldo financiero.',
            'Podemos ayudarte a expandirte... claro, con condiciones razonables.'
        ],
        cobro: [
            'Ha llegado el momento de revisar nuestras cuentas.',
            'Siempre hay una solucion financiera... aunque algunas son mas costosas.',
            'El credito es una herramienta poderosa, si sabes usarla.'
        ],
        advertencia: [
            'Tu flujo de caja esta bajo observacion. Conviene actuar antes del recargo.',
            'Veo movimiento en el taller, pero el riesgo financiero subio.',
            'Me interesa que sigas operando... siempre que respetes nuestras condiciones.'
        ],
        inversion: [
            'Hay una ventana para invertir y crecer mas rapido. Te conviene decidir hoy.',
            'Podemos estructurar una inyeccion de capital para tu expansion.',
            'Si cierras mas casos ahora, el banco tambien gana. Negocio para ambos.'
        ],
        refinanciacion: [
            'Si el pago es dificil ahora... podemos reorganizar la deuda.',
            'Podemos refinanciar tu deuda, si aceptas nuevas condiciones.',
            'Traigo una salida ordenada para tu deuda, con terminos actualizados.'
        ],
        muy_endeudado: [
            'Debo admitir que tu situacion financiera se ha vuelto... interesante.',
            'Parece que tu flujo de caja esta bajo presion.',
            'Podemos refinanciar tu deuda, si estas dispuesto a aceptar nuevas condiciones.'
        ],
        manual: [
            'Siempre hay una solucion financiera para tu taller.',
            'Estoy aqui para ayudarte a tomar decisiones de capital inteligentes.',
            'Revisemos tu situacion y veamos que opcion te conviene hoy.'
        ]
    };

    var clave = mensajes[tipoEvento] ? tipoEvento : 'manual';
    var lista = mensajes[clave];
    var base = lista[Math.floor(Math.random() * lista.length)];

    if (situacion === 'muy_endeudado' && tipoEvento !== 'muy_endeudado') {
        return base + ' Tu exposicion de deuda exige precision en cada movimiento.';
    }
    return base;
}

function construirAccionesEventoBanco(tipoEvento) {
    var deudaActual = Math.max(0, Math.round(deuda || 0));
    if (deudaActual <= 0) {
        return [
            { texto: 'Solicitar credito', accion: 'prestamo_pequeno' },
            { texto: 'Credito expansion', accion: 'prestamo_expansion', clase: 'btn-secundario' }
        ];
    }
    if (tipoEvento === 'oferta_especial' || tipoEvento === 'inversion') {
        return [
            { texto: 'Prestamo pequeno', accion: 'prestamo_pequeno' },
            { texto: 'Prestamo expansion', accion: 'prestamo_expansion' },
            { texto: 'Rechazar oferta', accion: 'rechazar_oferta', clase: 'btn-secundario' }
        ];
    }
    if (tipoEvento === 'cobro' || tipoEvento === 'advertencia') {
        return [
            { texto: 'Pagar cuota', accion: 'pagar_cuota' },
            { texto: 'Pagar parcial', accion: 'pagar_parcial' },
            { texto: 'Ignorar', accion: 'ignorar_cobro', clase: 'btn-danger' }
        ];
    }
    if (tipoEvento === 'refinanciacion') {
        return [
            { texto: 'Refinanciar', accion: 'refinanciar' },
            { texto: 'Mantener deuda actual', accion: 'mantener_deuda', clase: 'btn-secundario' }
        ];
    }
    if (tipoEvento === 'muy_endeudado') {
        var cargoReneg = Math.max(500, Math.round(deudaActual * 0.028));
        var cargoPenal = Math.max(680, Math.round(deudaActual * 0.035));
        var rescateCaja = Math.min(
            3200 + (Math.max(0, Math.round(bancoMorasAplicadas || 0)) * 180),
            Math.max(0, 5000 - Math.round(bancoCreditoUsado || 0))
        );
        var deudaRescate = Math.round(rescateCaja * 1.23);
        return [
            { texto: `Renegociar | deuda +RD$${cargoReneg}, mora reinicia`, accion: 'renegociar_deuda' },
            { texto: `Aceptar penalizacion | deuda +RD$${cargoPenal}, rep -2`, accion: 'aceptar_penalizacion', clase: 'btn-danger' },
            { texto: rescateCaja > 0 ? `Rescate | caja +RD$${rescateCaja}, deuda +RD$${deudaRescate}` : 'Rescate | linea sin fondos', accion: 'pedir_rescate_financiero' }
        ];
    }
    return [
        { texto: 'Solicitar prestamo', accion: 'prestamo_pequeno' },
        { texto: 'Pagar deuda', accion: 'pagar_cuota' },
        { texto: 'Refinanciar', accion: 'refinanciar' }
    ];
}

function construirContextoBanco(tipoForzado, origen) {
    var situacion = obtenerSituacionFinancieraBanco();
    var tipo = elegirTipoEventoBanco(situacion, tipoForzado);
    return {
        origen: origen || 'manual',
        tipoEvento: tipo,
        situacion: situacion,
        expresion: elegirExpresionGerenteBanco(tipo, situacion),
        mensaje: elegirMensajeGerenteBanco(tipo, situacion),
        acciones: construirAccionesEventoBanco(tipo),
        casosTotales: (typeof obtenerCasosCompletadosNarrativa === 'function') ? obtenerCasosCompletadosNarrativa() : 0,
        sello: Date.now()
    };
}

function actualizarAvatarGerenteBanco(expresion) {
    var avatar = document.getElementById('banco-gerente-avatar');
    if (!avatar) return;

    var variantes = {
        neutral: 'img/personajes/gerente-banco-neutral.png',
        sonrisa_confiada: 'img/personajes/gerente-banco-sonrisa-confiada.png',
        negociador: 'img/personajes/gerente-banco-negociador.png',
        preocupado: 'img/personajes/gerente-banco-preocupado.png',
        sonrisa_maliciosa: 'img/personajes/gerente-banco-sonrisa-maliciosa.png'
    };

    var exp = String(expresion || 'neutral');
    avatar.dataset.expresion = exp;
    avatar.onerror = function() {
        this.onerror = null;
        this.src = 'img/personajes/gerente-banco.png';
    };
    avatar.src = variantes[exp] || 'img/personajes/gerente-banco.png';
}

function renderizarOpcionesBancoModal(acciones) {
    var contenedor = document.getElementById('banco-opciones-dinamicas');
    if (!contenedor) return;
    var lista = Array.isArray(acciones) ? acciones : [];

    contenedor.innerHTML = lista.map(function(item) {
        var claseExtra = item && item.clase ? (' ' + item.clase) : '';
        var texto = item && item.texto ? item.texto : 'Accion';
        var accion = item && item.accion ? item.accion : 'cerrar_conversacion';
        return '<button class="btn' + claseExtra + '" onclick="resolverAccionModalBanco(\'' + accion + '\')">' + texto + '</button>';
    }).join('');
}

function obtenerMetricasBancoActuales() {
    var deudaActual = Math.max(0, Math.round(deuda || 0));
    // Eliminada lógica de día actual, todo es dinámico
    var limite = (typeof calcularLimiteCreditoBanco === 'function')
        ? Math.max(0, Math.round(calcularLimiteCreditoBanco()))
        : Math.max(0, Math.round(deudaActual + 5000));
    var disponible = (typeof obtenerCreditoDisponibleBanco === 'function')
        ? Math.max(0, Math.round(obtenerCreditoDisponibleBanco()))
        : Math.max(0, limite - Math.max(0, Math.round(bancoCreditoUsado || 0)));
    var cuota = (typeof calcularCuotaBancoCierre === 'function')
        ? Math.max(0, Math.round(calcularCuotaBancoCierre(deudaActual)))
        : Math.max(0, Math.round(deudaActual * 0.03));
    var mora = (typeof calcularMoraBancoPendiente === 'function')
        ? Math.max(0, Math.round(calcularMoraBancoPendiente(deudaActual)))
        : Math.max(0, Math.round(deudaActual * 0.016));
    var umbralMora = (window.TallerApp && window.TallerApp.config && window.TallerApp.config.bancoMoraCasosUmbral)
        ? Math.max(2, Math.round(window.TallerApp.config.bancoMoraCasosUmbral))
        : 4;
    var sinPago = Math.max(0, Math.round(bancoCasosSinPago || 0));
    var faltanMora = Math.max(0, umbralMora - sinPago);
    var saldoActual = Math.max(0, Math.round(saldo || 0));
    var costoRef = Math.max(350, Math.round(deudaActual * 0.022));
    var creditoUsado = Math.max(0, Math.round(limite - disponible));
    var creditoUsoRatio = limite > 0 ? Math.max(0, Math.min(1, creditoUsado / limite)) : 0;
    var moraRatio = umbralMora > 0 ? Math.max(0, Math.min(1, sinPago / umbralMora)) : 0;
    return {
        deuda: deudaActual,
        limite: limite,
        disponible: disponible,
        cuota: cuota,
        mora: mora,
        umbralMora: umbralMora,
        casosSinPago: sinPago,
        faltanMora: faltanMora,
        saldo: saldoActual,
        costoRef: costoRef,
        creditoUsado: creditoUsado,
        creditoUsoRatio: creditoUsoRatio,
        moraRatio: moraRatio
    };
}

function renderizarInfoModalBanco(contexto) {
    var data = contexto && typeof contexto === 'object' ? contexto : (window.bancoModalContexto || {});
    var m = obtenerMetricasBancoActuales();
    var deuda = document.getElementById('banco-deuda');
    var disponible = document.getElementById('banco-disponible');
    var cuota = document.getElementById('banco-cuota');
    var creditoFill = document.getElementById('banco-credito-fill');
    var creditoLabel = document.getElementById('banco-credito-label');
    var moraFill = document.getElementById('banco-mora-fill');
    var moraLabel = document.getElementById('banco-mora-label');
    var refi = document.getElementById('banco-info-refinanciacion');
    var recomendacion = document.getElementById('banco-info-recomendacion');
    var miniStatMora = document.getElementById('banco-mora-casos');
    var deudaSaldada = m.deuda <= 0;

    function alternarBloqueBanco(elemento, selectorContenedor, oculto) {
        if (!elemento || !elemento.closest) return;
        var contenedor = elemento.closest(selectorContenedor);
        if (contenedor) contenedor.classList.toggle('hidden', !!oculto);
    }

    if (deuda) deuda.innerText = deudaSaldada ? 'Deuda saldada' : formatoDineroBanco(m.deuda);
    if (disponible) disponible.innerText = formatoDineroBanco(m.disponible);
    if (cuota) cuota.innerText = formatoDineroBanco(m.cuota);

    alternarBloqueBanco(miniStatMora, '.banco-mini-stat', deudaSaldada);
    alternarBloqueBanco(moraFill, '.banco-bar-box', deudaSaldada);
    if (refi) refi.classList.toggle('hidden', deudaSaldada);

    if (creditoFill) {
        creditoFill.style.width = Math.round(m.creditoUsoRatio * 100) + '%';
        creditoFill.classList.toggle('warn', m.creditoUsoRatio >= 0.55 && m.creditoUsoRatio < 0.82);
        creditoFill.classList.toggle('danger', m.creditoUsoRatio >= 0.82);
    }
    if (creditoLabel) {
        creditoLabel.innerText = formatoDineroBanco(m.creditoUsado) + ' / ' + formatoDineroBanco(m.limite);
    }

    if (moraFill && !deudaSaldada) {
        moraFill.style.width = Math.round(m.moraRatio * 100) + '%';
        moraFill.classList.toggle('warn', m.moraRatio >= 0.5 && m.moraRatio < 1);
        moraFill.classList.toggle('danger', m.moraRatio >= 1);
    }
    if (moraLabel && !deudaSaldada) {
        moraLabel.innerText = m.casosSinPago + ' / ' + m.umbralMora + ' casos';
    }

    if (refi && !deudaSaldada) {
        refi.innerText = 'Refinanciar baja la presion inmediata y reinicia el riesgo de mora, pero suma aprox. '
            + formatoDineroBanco(m.costoRef) + ' en cargos y mantiene la deuda viva.';
    }

    if (recomendacion) {
        var textoRec = '';
        if (deudaSaldada) {
            textoRec = 'Deuda saldada. Tienes linea disponible para solicitar credito solo cuando vaya a generar ingresos reales.';
        } else if (m.saldo >= m.cuota && m.faltanMora <= 1) {
            textoRec = 'Riesgo alto de recargo: prioriza pagar cuota hoy antes de tomar otro prestamo.';
        } else if (m.saldo < Math.round(m.cuota * 0.6)) {
            textoRec = 'Caja corta: refinanciar puede evitar mora inmediata, pero encarece el total a largo plazo.';
        } else if ((data.tipoEvento || '') === 'refinanciacion') {
            textoRec = 'Momento de decision: refinanciar baja la presion de ahora y sube el costo final.';
        } else {
            textoRec = 'Mantener pagos parciales constantes reduce riesgo y mejora tu perfil con el banco.';
        }
        recomendacion.innerText = 'Recomendacion: ' + textoRec;
    }
}

function renderizarModalBanco(contexto) {
    var data = contexto && typeof contexto === 'object' ? contexto : construirContextoBanco('manual', 'manual');
    window.bancoModalContexto = data;
    var metricas = obtenerMetricasBancoActuales();

    var texto = document.getElementById('texto-gerente');
    var deudaEl = document.getElementById('banco-deuda');
    var tagEvento = document.getElementById('banco-evento-tipo');

    if (texto) texto.innerText = data.mensaje || 'Podemos revisar su situacion financiera.';
    if (deudaEl) deudaEl.innerText = metricas.deuda <= 0 ? 'Deuda saldada' : formatoDineroBanco(deuda || 0);
    if (tagEvento) {
        var etiqueta = metricas.deuda <= 0
            ? 'Linea disponible'
            : {
            oferta_especial: 'Oferta especial',
            cobro: 'Cobro de deuda',
            advertencia: 'Advertencia',
            inversion: 'Inversion',
            refinanciacion: 'Refinanciacion',
            muy_endeudado: 'Riesgo alto'
        }[data.tipoEvento] || 'Revision financiera';
        tagEvento.innerText = etiqueta;
    }

    actualizarAvatarGerenteBanco(data.expresion || 'neutral');
    renderizarOpcionesBancoModal(data.acciones || []);
    renderizarInfoModalBanco(data);
}

function mostrarEventoBancoModal(origen, contextoForzado) {
    var data = (contextoForzado && typeof contextoForzado === 'object')
        ? contextoForzado
        : construirContextoBanco('', origen || 'manual');

    var modalBanco = document.getElementById('modal-banco');
    var bancoYaVisible = !!(modalBanco && !modalBanco.classList.contains('hidden'));
    if (!bancoYaVisible && typeof hayModalAbierto === 'function' && hayModalAbierto()) {
        window.bancoEventoPendiente = data;
        return false;
    }

    renderizarModalBanco(data);
    abrirModal('banco');

    if ((origen || '') !== 'manual') {
        log('Sr. Abreu B.N. pide una revision financiera desde Banco Confianza.', 'info');
        if (typeof mostrarFeedbackGameplay === 'function') {
            mostrarFeedbackGameplay('Evento banco: el gerente quiere hablar contigo.', 'info');
        }
    }
    return true;
}

function dispararEventoBancoPorCasos(casosTotales) {
    var total = Math.max(0, Math.round(casosTotales || 0));
    if (total <= 0 || (total % 5) !== 0) return false;
    return mostrarEventoBancoModal('hito_casos');
}

function registrarIngresoBancoEvento(monto, categoria) {
    var valor = Math.max(0, Math.round(monto || 0));
    if (valor <= 0) return 0;
    saldo += valor;
    return valor;
}

function registrarGastoBancoEvento(monto, categoria) {
    var valor = Math.max(0, Math.round(monto || 0));
    if (valor <= 0) return 0;
    if (saldo >= valor) {
        saldo -= valor;
    } else {
        var faltante = valor - saldo;
        saldo = 0;
        deuda += faltante;
    }
    return valor;
}

function pagarDeudaBancoSinFoco(montoObjetivo) {
    var objetivo = Math.max(0, Math.round(montoObjetivo || 0));
    if (objetivo <= 0) return { ok: false, mensaje: 'No hay monto valido para pagar.' };
    var deudaActual = Math.max(0, Math.round(deuda || 0));
    var pago = Math.min(objetivo, deudaActual, Math.max(0, Math.round(saldo || 0)));
    if (pago <= 0) {
        return { ok: false, mensaje: 'No hay caja suficiente para ese pago.' };
    }
    saldo -= pago;
    deuda = Math.max(0, deudaActual - pago);
    if (typeof registrarPagoBanco === 'function') registrarPagoBanco(pago);
    if (deuda <= 0) {
        bancoCasosSinPago = 0;
        bancoMorasAplicadas = 0;
        bancoCreditoUsado = 0;
    }
    if (deuda <= 0 && typeof mostrarFeedbackGameplay === 'function') {
        mostrarFeedbackGameplay('Deuda bancaria saldada. El banco reconoce tu historial limpio y libera la linea completa de credito.', 'ok');
    }
    return { ok: true, monto: pago, mensaje: 'Pago aplicado por ' + formatoDineroBanco(pago) + '.' };
}

function tomarPrestamoBancoEvento(montoObjetivo, extraInteres) {
    var disponible = (typeof obtenerCreditoDisponibleBanco === 'function')
        ? Math.max(0, Math.round(obtenerCreditoDisponibleBanco()))
        : Math.max(0, 5000 - Math.round(bancoCreditoUsado || 0));
    if (disponible <= 0) {
        return { ok: false, mensaje: 'Su linea de credito esta bloqueada hasta amortizar deuda.' };
    }

    var objetivo = Math.max(300, Math.round(montoObjetivo || 0));
    var principal = Math.min(objetivo, disponible);
    var interesBase = (window.TallerApp && window.TallerApp.config && window.TallerApp.config.bancoInteresPrestamoRapido)
        ? Number(window.TallerApp.config.bancoInteresPrestamoRapido)
        : 0.12;
    var interesExtra = Math.max(0, Number(extraInteres || 0));
    var interesFinal = Math.min(0.36, interesBase + interesExtra);

    registrarIngresoBancoEvento(principal, 'prestamos');
    deuda += Math.round(principal * (1 + interesFinal));
    bancoCreditoUsado = Math.max(0, Math.round((bancoCreditoUsado || 0) + principal));

    return {
        ok: true,
        monto: principal,
        interes: interesFinal,
        mensaje: 'Aprobado: ' + formatoDineroBanco(principal) + ' acreditado. Interes aplicado ' + Math.round(interesFinal * 100) + '%. '
            + 'Recuerda que el banco siempre cobra primero.'
    };
}

function aplicarPenalizacionBancoEvento(monto, reputacionDelta, estresDelta) {
    var penalizacion = Math.max(0, Math.round(monto || 0));
    if (penalizacion <= 0) return 0;
    deuda += penalizacion;
    reputacion = Math.max(0, Math.round((reputacion || 0) + (reputacionDelta || 0)));
    estres = Math.min(100, Math.round((estres || 0) + (estresDelta || 0)));
    bancoMorasAplicadas = Math.max(0, Math.round((bancoMorasAplicadas || 0) + 1));
    return penalizacion;
}

function resolverAccionModalBanco(accion) {
    var a = String(accion || '').trim();
    if (!a) return;
    if (a === 'cerrar_conversacion') {
        cerrarModal();
        return;
    }

    var deudaActual = Math.max(0, Math.round(deuda || 0));
    var cuota = (typeof calcularCuotaBancoCierre === 'function')
        ? Math.max(250, Math.round(calcularCuotaBancoCierre(deudaActual)))
        : Math.max(250, Math.round(deudaActual * 0.03));
    var respuesta = 'Seguimos a su servicio.';
    var contexto = window.bancoModalContexto || construirContextoBanco('manual', 'manual');

    if (a === 'prestamo_pequeno') {
        var pequeno = tomarPrestamoBancoEvento(900 + (Math.max(0, Math.round(reputacion || 0)) * 4), 0.05);
        respuesta = pequeno.mensaje;
    } else if (a === 'prestamo_expansion') {
        var expansion = tomarPrestamoBancoEvento(2200 + (Math.max(1, Math.round(tallerNivel || 1)) * 220), 0.08);
        respuesta = expansion.mensaje;
    } else if (a === 'rechazar_oferta') {
        respuesta = 'Entiendo. Seguiremos observando su flujo para una nueva oferta.';
    } else if (a === 'pagar_cuota') {
        var pagoCuota = pagarDeudaBancoSinFoco(cuota);
        respuesta = pagoCuota.ok
            ? pagoCuota.mensaje + ' Su puntualidad mejora su perfil.'
            : 'Caja insuficiente para cuota completa de ' + formatoDineroBanco(cuota) + '.';
    } else if (a === 'pagar_parcial') {
        var parcialObjetivo = Math.max(250, Math.round(cuota * 0.45));
        var pagoParcial = pagarDeudaBancoSinFoco(parcialObjetivo);
        respuesta = pagoParcial.ok
            ? pagoParcial.mensaje + ' Pago parcial registrado con observacion.'
            : 'No se pudo registrar pago parcial por falta de caja.';
    } else if (a === 'ignorar_cobro') {
        var mora = aplicarPenalizacionBancoEvento(Math.max(220, Math.round((deudaActual || 0) * 0.016)), -1, 3);
        bancoCasosSinPago = Math.max(0, Math.round((bancoCasosSinPago || 0) + 1));
        respuesta = 'Cobro ignorado. Aplicamos recargo de ' + formatoDineroBanco(mora) + '.';
    } else if (a === 'refinanciar') {
        var costoRef = aplicarPenalizacionBancoEvento(Math.max(350, Math.round((deudaActual || 0) * 0.022)), 0, 1);
        bancoCasosSinPago = Math.max(0, Math.round((bancoCasosSinPago || 0) - 2));
        respuesta = 'Refinanciacion aprobada. Costo financiero agregado: ' + formatoDineroBanco(costoRef) + '.';
    } else if (a === 'mantener_deuda') {
        respuesta = 'Mantenemos condiciones actuales. El riesgo de mora sigue activo.';
    } else if (a === 'renegociar_deuda') {
        var costoReneg = aplicarPenalizacionBancoEvento(Math.max(500, Math.round((deudaActual || 0) * 0.028)), 0, 2);
        bancoCasosSinPago = 0;
        respuesta = 'Renegociacion ejecutada. Se agregaron cargos por ' + formatoDineroBanco(costoReneg) + '.';
    } else if (a === 'aceptar_penalizacion') {
        var penal = aplicarPenalizacionBancoEvento(Math.max(680, Math.round((deudaActual || 0) * 0.035)), -2, 4);
        respuesta = 'Penalizacion aplicada: ' + formatoDineroBanco(penal) + '. Sugerimos normalizar pagos cuanto antes.';
        contexto.expresion = 'sonrisa_maliciosa';
    } else if (a === 'pedir_rescate_financiero') {
        var rescate = tomarPrestamoBancoEvento(3200 + (Math.max(0, Math.round(bancoMorasAplicadas || 0)) * 180), 0.11);
        respuesta = rescate.mensaje + ' Este rescate tiene prioridad de cobro sobre cuotas ordinarias.';
        contexto.expresion = rescate.ok ? 'negociador' : 'preocupado';
    }

    // Tras saldar, el banco debe cambiar de cobranza a una oferta de credito nueva.
    if (deuda <= 0) {
        contexto = construirContextoBanco('manual', 'manual');
        contexto.expresion = 'sonrisa_confiada';
    }
    window.bancoModalContexto = contexto;
    actualizarAvatarGerenteBanco(contexto.expresion || 'neutral');

    var texto = document.getElementById('texto-gerente');
    if (texto) texto.innerText = respuesta;
    var deudaEl = document.getElementById('banco-deuda');
    if (deudaEl) deudaEl.innerText = formatoDineroBanco(deuda || 0);
    if (deuda <= 0) {
        renderizarModalBanco(contexto);
    } else {
        renderizarInfoModalBanco(contexto);
    }

    log('[Banco] ' + respuesta, 'info');
    if (typeof mostrarFeedbackGameplay === 'function') {
        mostrarFeedbackGameplay('Banco: ' + respuesta, 'info');
    }
    if (typeof actualizarIndicadoresBancoUI === 'function') actualizarIndicadoresBancoUI();
    if (typeof actualizarScreenExterior === 'function') actualizarScreenExterior();
    if (typeof actualizarUI === 'function') actualizarUI();
    if (typeof autoGuardarPartidaSilenciosa === 'function') autoGuardarPartidaSilenciosa('evento-banco-modal');
}

function abrirModal(tipo) {
        if (tipo === 'proyecto-muscle') {
            // Renderiza el contenido actualizado antes de mostrar
            if (typeof renderizarProyectoMuscleUI === 'function') renderizarProyectoMuscleUI();
            var modal = document.getElementById('modal-proyecto-muscle');
            if (modal) modal.classList.remove('hidden');
            return;
        }
    if (tiradaEnCurso && tipo !== 'tirada') return;
    cerrarModal();
    if (tipo === 'inversiones') {
        if (typeof renderizarModalInversiones === 'function') renderizarModalInversiones();
        document.getElementById('modal-inversiones').classList.remove('hidden');
    } else if (tipo === 'tienda') {
        if (typeof renderizarTiendasMejoras === 'function') renderizarTiendasMejoras();
        document.getElementById('modal-tienda').classList.remove('hidden');
    } else if (tipo === 'tienda-tactica') {
        if (typeof renderizarTiendasMejoras === 'function') renderizarTiendasMejoras();
        document.getElementById('modal-tienda-tactica').classList.remove('hidden');
    } else if (tipo === 'delivery-gestion') {
        if (typeof renderizarGestionDelivery === 'function') renderizarGestionDelivery();
        document.getElementById('modal-delivery-gestion').classList.remove('hidden');
    } else if (tipo === 'comida') {
        document.getElementById('modal-comida').classList.remove('hidden');
    } else if (tipo === 'cajab') {
        document.getElementById('modal-cajab').classList.remove('hidden');
    } else if (tipo === 'banco') {
        if (!window.bancoModalContexto || typeof window.bancoModalContexto !== 'object') {
            window.bancoModalContexto = construirContextoBanco('manual', 'manual');
        }
        renderizarModalBanco(window.bancoModalContexto);
        var deudaEl = document.getElementById('banco-deuda');
        if (deudaEl) deudaEl.innerText = formatoDineroBanco(deuda || 0);
        var modalBanco = document.getElementById('modal-banco');
        if (modalBanco) modalBanco.classList.remove('hidden');
    } else if (tipo === 'bar') {
        document.getElementById('modal-bar').classList.remove('hidden');
    } else if (tipo === 'mecanicos') {
        renderizarLoreMecanicos();
        document.getElementById('modal-mecanicos').classList.remove('hidden');
    } else if (tipo === 'equipo-of') {
        renderizarEquipoOficina();
        document.getElementById('modal-equipo-of').classList.remove('hidden');
    } else if (tipo === 'dueno') {
        var modalDueno = document.getElementById('modal-dueno');
        if (modalDueno) modalDueno.classList.remove('hidden');
    } else if (tipo === 'contratar') {
        renderizarContrataciones();
        document.getElementById('modal-contratar').classList.remove('hidden');
    } else if (tipo === 'decision') {
        document.getElementById('modal-decision').classList.remove('hidden');
    } else if (tipo === 'ayuda') {
        document.getElementById('modal-ayuda').classList.remove('hidden');
    } else if (tipo === 'cliente') {
        document.getElementById('modal-cliente').classList.remove('hidden');
    } else if (tipo === 'inspeccion') {
        if (typeof mostrarFeedbackGameplay === 'function') {
            mostrarFeedbackGameplay('Inspeccion manual desactivada en flujo simplificado.', 'ok');
        }
        return;
    } else if (tipo === 'opciones') {
        cargarOpcionesEnUI();
        document.getElementById('modal-opciones').classList.remove('hidden');
    } else if (tipo === 'editor-ui') {
        cargarEditorInterfazEnUI();
        document.getElementById('modal-editor-ui').classList.remove('hidden');
    } else if (tipo === 'pausa') {
        document.getElementById('modal-pausa').classList.remove('hidden');
    } else if (tipo === 'historial') {
        document.getElementById('modal-historial').classList.remove('hidden');
    } else if (tipo === 'oficina-dx') {
        if (typeof mostrarFeedbackGameplay === 'function') {
            mostrarFeedbackGameplay('Diagnostico simplificado activo: usa Gestion del caso en Taller.', 'ok');
        }
        if (typeof enfocarElementoUI === 'function') enfocarElementoUI('grid-mecanicos');
        return;
    } else if (tipo === 'historia-dia') {
        document.getElementById('modal-historia-dia').classList.remove('hidden');
    } else if (tipo === 'resultado-reparacion') {
        document.getElementById('modal-resultado-reparacion').classList.remove('hidden');
    } else if (tipo === 'repuestos') {
        renderizarTiendaRepuestos('todos');
        document.getElementById('modal-repuestos').classList.remove('hidden');
    }
    const gameEl = document.getElementById('game');
    const escenaOficinaActiva = !!(gameEl && gameEl.classList.contains('scene-oficina-activa'));

    if (tipo === 'bar' || tipo === 'banco' || tipo === 'repuestos' || tipo === 'comida') {
        lugarActual = 'Exterior';
    } else if (tipo === 'tienda' || tipo === 'tienda-tactica' || tipo === 'contratar' || tipo === 'mecanicos' || tipo === 'equipo-of') {
        lugarActual = 'Oficina';
    } else if (escenaOficinaActiva) {
        lugarActual = 'Oficina';
    } else {
        lugarActual = 'Taller';
    }
    if (typeof actualizarFondoJuego === 'function') actualizarFondoJuego();
    sincronizarPausaJuego();
}

function obtenerMaxBateriaDinamica() {
    const item = (ECONOMY_DATA.tiendaTactica || {}).bateria || { max: 3 };
    return Math.max(item.max || 3, (item.max || 3) + Math.floor(Math.max(0, (tallerNivel || 1) - 1) / 2));
}

function obtenerRecargaEnergiaDinamica() {
    return 4 + (mejorasTacticas.bateria || 0) + Math.floor(Math.max(0, (tallerNivel || 1) - 1) / 2);
}

function modoNivelesProgresionActiva() {
    return (typeof modoNivelesActivo === 'function' && modoNivelesActivo());
}

function obtenerNivelProgresionActual() {
    return Math.max(1, Math.round((typeof nivelJugador === 'number' ? nivelJugador : 1)));
}

function obtenerProgresoOperativoActual() {
    const nivel = obtenerNivelProgresionActual();
    const casos = (typeof obtenerCasosCompletadosNarrativa === 'function') ? obtenerCasosCompletadosNarrativa() : 0;
    const progresoCasos = 1 + Math.floor(casos / 4);
    return Math.max(nivel, progresoCasos);
}

function renderizarTiendasMejoras() {
    const modoNiveles = modoNivelesProgresionActiva();
    const nivelProgreso = obtenerNivelProgresionActual();
    const progresoOperativo = obtenerProgresoOperativoActual();
    const casosCerrados = (typeof obtenerCasosCompletadosNarrativa === 'function') ? obtenerCasosCompletadosNarrativa() : 0;
    const btnT = document.getElementById('btn-tienda-taller');
    const btnH = document.getElementById('btn-tienda-herramientas');
    const btnP = document.getElementById('btn-tienda-publicidad');
    const btnC = document.getElementById('btn-tienda-capacitacion');
    const btnM = document.getElementById('btn-tienda-maquina');
    const btnLavado = document.getElementById('btn-tienda-autolavado');
    const estadoBase = document.getElementById('tienda-mejoras-estado');
    document.querySelectorAll("#modal-tienda-tactica button[onclick*='organizador_cola'],#modal-tienda-tactica button[onclick*='control_calidad'],#modal-tienda-tactica button[onclick*='fidelidad_clientes'],#modal-tienda-tactica button[onclick*='ahorro_operativo']").forEach(function(btn) {
        var tipo = (btn.getAttribute('onclick') || '').match(/'([^']+)'/);
        var mapaNivel = { organizador_cola:['Organizador de Cola','organizadorCola'], control_calidad:['Control de Calidad','controlCalidad'], fidelidad_clientes:['Programa de Fidelidad','fidelidadClientes'], ahorro_operativo:['Plan de Ahorro','ahorroOperativo'] };
        var item = tipo && mapaNivel[tipo[1]];
        if (item) {
            var nivelItem = Math.min(10, Math.round(Number(mejorasTacticas[item[1]]) || 0));
            var costoItem = ({organizador_cola:1100, control_calidad:1450, fidelidad_clientes:1600, ahorro_operativo:1250}[tipo[1]]) + (nivelItem * ({organizador_cola:350, control_calidad:450, fidelidad_clientes:500, ahorro_operativo:400}[tipo[1]]));
            var bloqueadoItem = nivelItem >= 10 || progresoOperativo < 2 || reputacion < 40 || saldo < costoItem;
            btn.innerText = bloqueadoItem
                ? '🔒 ' + item[0] + ' · BLOQUEADO · Nv.' + nivelItem + '/10 · RD$' + costoItem + ' · Req P2 R40'
                : item[0] + ' · Nv.' + nivelItem + '/10 · RD$' + costoItem;
            // Se mantiene pulsable para explicar el requisito; la compra sigue
            // protegida por comprarMejoraTactica/comprarMejora.
            btn.disabled = false;
            btn.classList.toggle('upgrade-locked', bloqueadoItem);
            btn.setAttribute('aria-disabled', String(bloqueadoItem));
            btn.title = nivelItem >= 10 ? 'Nivel máximo alcanzado.' : (!bloqueadoItem ? 'Disponible.' : 'Bloqueado: requiere Progreso 2, Reputación 40 y RD$' + costoItem + '.');
        }
    });

    if (btnT) {
        const dataMejora = ECONOMY_DATA.mejoraTaller || { costoBase: 1400, costoPorNivel: 900, diaBase: 2, repBase: 52, repPorNivel: 4, nivelMax: 6 };
        const nivelMax = Math.max(2, Math.round(dataMejora.nivelMax || 6));
        const costo = Math.max(0, Math.round((dataMejora.costoBase || 0) + ((Math.max(1, tallerNivel || 1) - 1) * (dataMejora.costoPorNivel || 0))));
        const reqAvance = Math.max(1, Math.round((dataMejora.nivelBase || dataMejora.diaBase || 1) + Math.max(1, Math.round(tallerNivel || 1))));
        const reqRep = Math.max(0, Math.round((dataMejora.repBase || 0) + (Math.max(1, Math.round(tallerNivel || 1)) * (dataMejora.repPorNivel || 0))));
        const bloqueado = progresoOperativo < reqAvance || reputacion < reqRep || saldo < costo;
        const agotado = Math.max(1, Math.round(tallerNivel || 1)) >= nivelMax;
        const reqTxt = `Req P${reqAvance} R${reqRep}`;
        btnT.innerText = agotado
            ? `EXPANDIR TALLER | MAX ${nivelMax}`
            : bloqueado
                ? `🔒 EXPANDIR TALLER | BLOQUEADO | Nivel ${tallerNivel}/${nivelMax} | ${reqTxt}`
            : `EXPANDIR TALLER | Nivel ${tallerNivel}/${nivelMax} | RD$${costo} | +puestos | ${reqTxt}`;
        btnT.disabled = false;
        btnT.classList.toggle('upgrade-locked', agotado || bloqueado);
        btnT.title = agotado ? 'Nivel máximo alcanzado.' : (bloqueado ? 'Requisitos: Progreso P' + reqAvance + ', reputación R' + reqRep + ' y RD$' + costo + '.' : 'Disponible.');
        btnT.setAttribute('aria-disabled', String(btnT.disabled));
    }

    if (btnLavado) {
        const costoLavado = 2800;
        const nivelLavado = mejoras && mejoras.autolavado ? 1 : 0;
        const tieneAccesoLavado = tallerNivel >= 2 || casosCerrados >= 8;
        const sinCajaLavado = saldo < costoLavado;
        const bloqueadoLavado = nivelLavado >= 1 || !tieneAccesoLavado || sinCajaLavado;
        btnLavado.innerText = nivelLavado >= 1
            ? 'AUTOLAVADO | DESBLOQUEADO'
            : bloqueadoLavado
                ? `🔒 AUTOLAVADO | BLOQUEADO | RD$${costoLavado} | Req Taller 2 o 8 casos`
            : `AUTOLAVADO | RD$${costoLavado} | Nv. taller 2 o 8 casos`;
        btnLavado.disabled = false;
        btnLavado.setAttribute('aria-disabled', String(bloqueadoLavado));
        btnLavado.title = nivelLavado >= 1
            ? 'Servicio ya desbloqueado.'
            : (!tieneAccesoLavado
                ? `Bloqueado: requiere Taller nivel 2 o 8 casos completados. Vas ${casosCerrados} casos.`
                : (sinCajaLavado ? `Bloqueado: necesitas RD$${costoLavado}.` : 'Disponible para comprar.'));
        btnLavado.classList.toggle('is-locked', bloqueadoLavado);
        btnLavado.classList.toggle('upgrade-locked', bloqueadoLavado);
    }

    const map = {
        herramientas: btnH,
        publicidad: btnP,
        capacitacion: btnC,
        maquina: btnM
    };

    Object.keys(map).forEach(function(tipo) {
        const btn = map[tipo];
        if (!btn) return;
        const req = requisitosMejora(tipo);
        const nivelActual = tipo === 'maquina' ? (Number(mejoras.maquinaDiagnosis) || 0) : (mejoras[tipo] || 0);
        const bloqueado = progresoOperativo < req.nivelMin || reputacion < req.repMin || tallerNivel < req.tallerMin || saldo < req.costo;
        const agotado = nivelActual >= req.max;
        const efecto = tipo === 'herramientas'
            ? `+${Math.round((nivelActual + 1) * 8)}% habilidad mecanicos`
            : (tipo === 'publicidad'
                ? `+3 reputacion y mas llegada de clientes`
                : (tipo === 'capacitacion'
                    ? `Mejor lectura tecnica y menos enojo`
                    : 'Impulso fuerte al OBD y precision de dictamen'));
        const reqTxt = `Req P${req.nivelMin} R${req.repMin} T${req.tallerMin}`;
        btn.innerText = agotado
            ? `${tipo.toUpperCase()} | MAXIMO ALCANZADO`
            : bloqueado
                ? `🔒 ${tipo.toUpperCase()} | BLOQUEADO | Nivel ${nivelActual}/${req.max} | ${reqTxt}`
                : `${tipo.toUpperCase()} | Nivel ${nivelActual}/${req.max} | RD$${req.costo} | ${efecto} | ${reqTxt}`;
        btn.disabled = false;
        btn.classList.toggle('upgrade-locked', agotado || bloqueado);
        btn.title = agotado ? 'Nivel máximo alcanzado.' : (bloqueado ? 'Requisitos: Progreso P' + req.nivelMin + ', reputación R' + req.repMin + ', taller T' + req.tallerMin + ' y RD$' + req.costo + '.' : 'Disponible.');
        btn.setAttribute('aria-disabled', String(btn.disabled));
    });

    const btnRec = document.getElementById('btn-tactica-recarga');
    const btnBat = document.getElementById('btn-tactica-bateria');
    const btnRecEquipo = document.getElementById('btn-tactica-recuperacion-equipo');
    const btnMan = document.getElementById('btn-tactica-manual');
    const btnScn = document.getElementById('btn-tactica-scanner');
    const btnFlu = document.getElementById('btn-tactica-flujo');
    const estadoTac = document.getElementById('tienda-tactica-estado');

    const tienda = ECONOMY_DATA.tiendaTactica || {};
    const recargaCosto = (tienda.recarga_foco && tienda.recarga_foco.costo) || 320;
    const recargaEnergia = obtenerRecargaEnergiaDinamica();
    const bateriaItem = tienda.bateria || { costoBase: 600, costoPorNivel: 250, max: 3 };
    const bateriaMax = obtenerMaxBateriaDinamica();
    const bateriaCosto = bateriaItem.costoBase + ((mejorasTacticas.bateria || 0) * bateriaItem.costoPorNivel);
    const descansoItem = tienda.recuperacion_equipo || { costoBase: 800, costoPorNivel: 500, max: 3 };
    const descansoNivel = Math.max(0, Math.min(descansoItem.max, Math.round(Number(mejorasTacticas.recuperacionEquipo) || 0)));
    const descansoCosto = descansoItem.costoBase + (descansoNivel * descansoItem.costoPorNivel);
    const manualCosto = (tienda.manual_hablar && tienda.manual_hablar.costo) || 850;
    const scannerCosto = (tienda.scanner_dx && tienda.scanner_dx.costo) || 1200;
    const flujoCosto = (tienda.flujo_reparacion && tienda.flujo_reparacion.costo) || 1650;
    const infraMinimaNivel2 = progresoOperativo >= 2;

    if (btnRec) {
        btnRec.innerText = `IMPULSO | RD$${recargaCosto} | +${recargaEnergia} estabilidad operativa`;
        btnRec.disabled = saldo < recargaCosto;
        btnRec.title = btnRec.disabled ? 'Necesitas RD$' + recargaCosto + '.' : 'Disponible.';
    }
    if (btnBat) {
        btnBat.innerText = `ESTABILIZADOR | Nivel ${mejorasTacticas.bateria}/${bateriaMax} | RD$${bateriaCosto} | Mejora estabilidad de lectura`;
        btnBat.disabled = (mejorasTacticas.bateria >= bateriaMax) || saldo < bateriaCosto;
        btnBat.title = mejorasTacticas.bateria >= bateriaMax ? 'Nivel máximo alcanzado.' : (saldo < bateriaCosto ? 'Necesitas RD$' + bateriaCosto + '.' : 'Disponible.');
    }
    if (btnRecEquipo) {
        btnRecEquipo.innerText = `ÁREA DE DESCANSO | Nivel ${descansoNivel}/${descansoItem.max} | RD$${descansoCosto} | -${descansoNivel * 12}% fatiga`;
        btnRecEquipo.disabled = descansoNivel >= descansoItem.max || saldo < descansoCosto;
        btnRecEquipo.title = descansoNivel >= descansoItem.max ? 'Nivel máximo alcanzado.' : (saldo < descansoCosto ? 'Necesitas RD$' + descansoCosto + '.' : 'Reduce el gasto de energía de los mecánicos.');
    }
    if (btnMan) {
        btnMan.innerText = `MANUAL | RD$${manualCosto} | Entrevistas dan mas bonus real`;
        btnMan.disabled = !!mejorasTacticas.manualHablar || saldo < manualCosto;
        btnMan.title = mejorasTacticas.manualHablar ? 'Ya está comprada.' : (saldo < manualCosto ? 'Necesitas RD$' + manualCosto + '.' : 'Disponible.');
    }
    if (btnScn) {
        btnScn.innerText = `SCANNER OBD | RD$${scannerCosto} | Requiere Progreso 2 y Herramientas 1`;
        btnScn.disabled = !!mejorasTacticas.scannerDx || saldo < scannerCosto || !infraMinimaNivel2 || (mejoras.herramientas || 0) < 1;
        btnScn.title = mejorasTacticas.scannerDx ? 'Ya está comprado.' : (saldo < scannerCosto ? 'Necesitas RD$' + scannerCosto + '.' : (!infraMinimaNivel2 ? 'Requiere progreso 2.' : ((mejoras.herramientas || 0) < 1 ? 'Requiere Herramientas nivel 1.' : 'Disponible.')));
    }
    if (btnFlu) {
        btnFlu.innerText = `FLUJO REPARACION | RD$${flujoCosto} | Requiere Progreso 2 y Capacitacion 1`;
        btnFlu.disabled = !!mejorasTacticas.flujoReparacion || saldo < flujoCosto || !infraMinimaNivel2 || (mejoras.capacitacion || 0) < 1;
        btnFlu.title = mejorasTacticas.flujoReparacion ? 'Ya está comprado.' : (saldo < flujoCosto ? 'Necesitas RD$' + flujoCosto + '.' : (!infraMinimaNivel2 ? 'Requiere progreso 2.' : ((mejoras.capacitacion || 0) < 1 ? 'Requiere Capacitación nivel 1.' : 'Disponible.')));
    }

    if (estadoBase) {
        const pct = Math.round((progresoNivel / Math.max(1, progresoNivelMeta)) * 100);
        estadoBase.innerText = `Caja RD$${Math.round(saldo)} | Progreso ${progresoOperativo} | Nivel ${nivelProgreso} (${pct}%) | Casos ${casosCerrados} | Reputacion ${reputacion} | Taller ${tallerNivel}`;
    }
    if (estadoTac) {
        const scannerNivel = (typeof ofDxNivelScannerObd === 'function') ? ofDxNivelScannerObd() : 0;
        estadoTac.innerText = `OBD nivel ${scannerNivel} | Estabilizador ${mejorasTacticas.bateria}/${bateriaMax} | Configura compras para dictamen mas eficaz.`;
    }
}

function renderizarLoreMecanicos() {
    let cont = document.getElementById('mecanicos-lore');
    if (!cont) return;

    const listaMecanicos = Array.isArray(mecanicos)
        ? mecanicos.filter(function(m) { return !!(m && typeof m === 'object'); })
        : [];
    const reparaciones = Array.isArray(reparacionesActivas)
        ? reparacionesActivas
        : [];

    if (!listaMecanicos.length) {
        cont.innerHTML = '<div class="mecanico-ficha">No hay mecanicos disponibles.</div>';
        return;
    }

    if (typeof window.mecanicoPanelSeleccionadoIdx !== 'number' || window.mecanicoPanelSeleccionadoIdx < 0 || window.mecanicoPanelSeleccionadoIdx >= listaMecanicos.length) {
        let html = '';
        listaMecanicos.forEach(m => {
            const bio = obtenerBioMecanicoSeguro(m.nombre);
            const rasgo = (typeof obtenerPerfilRasgosMecanico === 'function')
                ? obtenerPerfilRasgosMecanico(m.nombre)
                : { ventaja: 'Sin rasgo definido.', desventaja: 'Sin desventaja definida.' };
            const foto = bio.foto ? `<img src="${bio.foto}" alt="${m.nombre}" style="width:62px; height:62px; object-fit:cover; border:1px solid #8f6b45; border-radius:6px; float:right; margin-left:8px;">` : '';
            html += `<div class="mecanico-ficha">${foto}<strong>${m.nombre}</strong><br>${bio.historia}<br><em>Fortaleza:</em> ${bio.habilidadTexto}<br><em>Ventaja:</em> ${rasgo.ventaja}<br><em>Desventaja:</em> ${rasgo.desventaja}<br><em>Rivalidad:</em> ${bio.rivalidad}<br><em>Necesidad actual:</em> ${bio.necesidad}</div>`;
        });
        cont.innerHTML = html;
        return;
    }

    const idx = window.mecanicoPanelSeleccionadoIdx;
    const m = listaMecanicos[idx];
    if (!m) {
        window.mecanicoPanelSeleccionadoIdx = -1;
        renderizarLoreMecanicos();
        return;
    }
    const bio = obtenerBioMecanicoSeguro(m.nombre);
    const rasgo = (typeof obtenerPerfilRasgosMecanico === 'function')
        ? obtenerPerfilRasgosMecanico(m.nombre)
        : { ventaja: 'Sin rasgo definido.', desventaja: 'Sin desventaja definida.' };
    const foto = bio.foto ? `<img src="${bio.foto}" alt="${m.nombre}" style="width:72px; height:72px; object-fit:cover; border:1px solid #8f6b45; border-radius:8px;">` : '';
    const trabajando = reparaciones.find(function(r) {
        return r && r.mecanicoNombre === m.nombre;
    }) || null;
    const enfriamientoTxt = (typeof formatearTiempoTrabajo === 'function')
        ? formatearTiempoTrabajo(m.enfriamientoTurnos || 0)
        : `${(m.enfriamientoTurnos || 0) * 10} min`;
    const bloqueoAyudaTxt = (typeof formatearBloqueoAyudaMecanico === 'function')
        ? formatearBloqueoAyudaMecanico(m.bloqueoAyudaTurnos || 0)
        : `${(m.bloqueoAyudaTurnos || 0) * 10} min`;
    const descansando = Number(m.descansoEnergiaTotal || 0) > 0 && Number(m.enfriamientoTurnos || 0) > 0;
    const energiaPct = Math.max(0, Math.min(100, Math.round(Number.isFinite(Number(m.energia)) ? Number(m.energia) : (100 - ((Number(m.trabajosHoy) || 0) * 16)))));
    const estadoTrabajo = trabajando
        ? (trabajando.listoParaCobro
            ? `LISTO: ${trabajando.idCaso || 'CASO-0000'} | pendiente revisar/cobrar`
                : `Trabajando: ${trabajando.idCaso || 'CASO-0000'} | ${trabajando.personaNombre || trabajando.clienteNombre || 'Cliente'}`)
        : ((m.bloqueoAyudaTurnos || 0) > 0
            ? `Fuera por asunto personal (${bloqueoAyudaTxt})`
            : ((m.enfriamientoTurnos || 0) > 0
                ? (descansando ? `Recuperando energía (${energiaPct}% · ${enfriamientoTxt})` : `En espera (${enfriamientoTxt})`)
                : 'Barajando (no trabajando)'));
    const humor = m.enojo >= 6 ? 'Humor: Molesto' : (m.enojo >= 4 ? 'Humor: Tenso' : 'Humor: Estable');
    const enojoPct = Math.max(0, Math.min(100, Math.round((Math.max(0, m.enojo || 0) / 8) * 100)));
    const calmaPct = Math.max(0, 100 - enojoPct);
    const ritmoPct = Math.max(30, Math.min(100, Math.round((m.habilidad || 0) * 100)));
    const colorHumor = calmaPct <= 30 ? '#cf5b4a' : (calmaPct <= 55 ? '#c28b3f' : '#4aa36a');
    const colorRitmo = ritmoPct <= 45 ? '#c28b3f' : (ritmoPct <= 70 ? '#4a8fcf' : '#4aa36a');
    const salarioCaso = Math.max(0, Math.round(Number(m.salarioBase) || 0));
    const deudaActual = Math.max(0, Math.round(Number(m.deudaConTaller) || 0));
    const prestadoAcumulado = Math.max(0, Math.round(Number(m.prestamosRecibidos) || deudaActual));
    const planDeuda = typeof obtenerPlanDeudaMecanico === 'function' ? obtenerPlanDeudaMecanico(m) : { etiqueta: 'Estándar', tasa: 0.20 };
    const cuotaEstimada = Math.min(deudaActual, Math.max(0, Math.round(salarioCaso * planDeuda.tasa)));
    const casosRestantesDeuda = typeof estimarCasosParaSaldarDeudaMecanico === 'function' ? estimarCasosParaSaldarDeudaMecanico(m) : 0;
    const ultimoDialogo = (window.dialogoMecanicoPanel && window.dialogoMecanicoPanel[m.nombre]) || 'Sin conversacion reciente.';
    const recordatorioTxt = m.recordatorioTrabajoDia === dia ? 'Recordatorio hoy: SI' : 'Recordatorio hoy: NO';

    const casos = obtenerCasosAprobadosPanelMecanico();
    const listaCasos = !casos.length
        ? '<div class="mecanico-panel-empty">No hay casos aprobados para asignar.</div>'
        : casos.map(function(caso) {
            const casoId = JSON.stringify(String(caso.idCaso || ''));
            const accion = caso.asignable
                ? `<button class="btn" type="button" onclick='asignarCasoAprobadoDesdePanel(${casoId})'>Asignar a ${m.nombre}</button>`
                : '<span class="creator-help">No disponible todavía</span>';
            return `<article class="mecanico-panel-case"><strong>${caso.idCaso}</strong><span>${caso.nombre}</span><small>${caso.nota}</small><div>${accion}</div></article>`;
        }).join('');

    const problemaNarrativo = m.bloqueoAyudaTurnos > 0
        ? `${m.nombre} está atendiendo un asunto personal y no puede concentrarse.`
        : (descansando ? `${m.nombre} está recuperando energía antes de volver a tomar casos.`
            : (m.enojo >= 6 ? `${m.nombre} siente que el taller le exige demasiado y está a punto de explotar.`
            : (m.enojo >= 4 ? `${m.nombre} está tenso: necesita apoyo antes de aceptar otro caso.`
                : `${m.nombre} está disponible y espera instrucciones claras.`)));

    const situacionClase = (m.bloqueoAyudaTurnos || 0) > 0 || m.enojo >= 6
        ? 'critica'
        : ((m.enfriamientoTurnos || 0) > 0 || m.enojo >= 4 || trabajando ? 'atencion' : 'estable');
    const situacionEtiqueta = situacionClase === 'critica' ? 'Requiere atención' : (situacionClase === 'atencion' ? 'En seguimiento' : 'Disponible');

    cont.innerHTML = `
        <article class="mecanico-panel">
            <header class="mecanico-panel-hero">
                ${foto}
                <div class="mecanico-panel-identity"><strong>${m.nombre}</strong><span>${capitalizarRotulo(m.especialidad || 'general')}</span></div>
                <span class="mecanico-panel-state is-${situacionClase}">${situacionEtiqueta}</span>
            </header>
            <section class="mecanico-panel-situacion is-${situacionClase}">
                <span>Situación actual</span>
                <strong>${estadoTrabajo}</strong>
                <p>${problemaNarrativo}</p>
            </section>
            <section class="mecanico-panel-stats">
                <div><div><span>Calma</span><b>${calmaPct}%</b></div><i><i style="width:${calmaPct}%; background:${colorHumor};"></i></i></div>
                <div><div><span>Ritmo técnico</span><b>${ritmoPct}%</b></div><i><i style="width:${ritmoPct}%; background:${colorRitmo};"></i></i></div>
                <div><div><span>Energía</span><b>${energiaPct}%</b></div><i><i style="width:${energiaPct}%; background:${descansando ? '#72d8ff' : '#8dbf6b'};"></i></i></div>
            </section>
            <section class="mecanico-panel-traits"><span><b>${humor}</b></span><span><b>Pago base por caso:</b> RD$${salarioCaso}</span><span><b>Deuda con el taller:</b> RD$${deudaActual}${prestadoAcumulado > deudaActual ? ` · Prestado acumulado RD$${prestadoAcumulado}` : ''}</span>${deudaActual > 0 ? `<span><b>Plan ${planDeuda.etiqueta}:</b> ${Math.round(planDeuda.tasa * 100)}% de comisión · cuota estimada RD$${cuotaEstimada} · ~${casosRestantesDeuda} caso(s)</span>` : ''}<span><b>Ventaja:</b> ${rasgo.ventaja}</span><span><b>Riesgo:</b> ${rasgo.desventaja}</span></section>
            <section class="mecanico-panel-dialogo"><b>Último diálogo</b><p>${ultimoDialogo}</p><small>${recordatorioTxt}</small></section>
            <div class="mecanico-panel-actions">
                <button class="btn" onclick="hablarConMecanicoPanel()">Hablar</button>
                <button class="btn" onclick="apoyarMecanicoDesdePanel()">Apoyar · RD$180</button>
                ${descansando ? `<button class="btn btn-cuidado-enfriamiento" disabled>Recuperando · ${enfriamientoTxt}</button>` : `<button class="btn" onclick="enviarMecanicoADescansarDesdePanel()">Descanso</button>`}
                ${m.preguntaPendiente ? '<button class="btn btn-primary" onclick="atenderSolicitudMecanicoDesdePanel()">Atender solicitud</button>' : ''}
                <button class="btn btn-danger mecanico-panel-dismiss" onclick="despedirMecanico('${m.nombre}')">Despedir</button>
            </div>
        </article>
        <section class="mecanico-panel-cases"><header><strong>Asignar caso</strong><span>Casos aprobados disponibles</span></header>${listaCasos}</section>
    `;
}

function apoyarMecanicoDesdePanel() {
    const idx = window.mecanicoPanelSeleccionadoIdx;
    const m = (typeof idx === 'number' && mecanicos) ? mecanicos[idx] : null;
    const costo = 180;
    if (!m) return;
    if ((m.enfriamientoTurnos || 0) > 0 || (m.bloqueoAyudaTurnos || 0) > 0) {
        return mostrarFeedbackGameplay('No puedes apoyar a un mecánico que está fuera del taller. Espera a que regrese.', 'warn');
    }
    if (saldo < costo) return mostrarFeedbackGameplay('Necesitas RD$180 para preparar apoyo al mecánico.', 'warn');
    if (!consumirFoco('apoyoMecanico')) return;
    saldo -= costo;
    m.enojo = Math.max(0, Math.round(m.enojo || 0) - 2);
    m.lealtad = Math.min(100, Math.round((m.lealtad || 0) + 2));
    if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarGastoDia === 'function') window.TallerApp.helpers.registrarGastoDia(costo, 'equipo');
    if (typeof consumirTurno === 'function') consumirTurno('apoyo individual a mecanico', COSTOS_TURNO.decisionHistoria || 1);
    log(`Apoyaste a ${m.nombre}: enojo -2 y lealtad +2.`, 'exito');
    mostrarFeedbackGameplay(`${m.nombre} recibió apoyo. Su humor y compromiso mejoraron.`, 'ok');
    renderizarLoreMecanicos();
    actualizarUI();
}

function enviarMecanicoADescansarDesdePanel() {
    const idx = window.mecanicoPanelSeleccionadoIdx;
    const m = (typeof idx === 'number' && mecanicos) ? mecanicos[idx] : null;
    if (!m) return;
    if ((m.enfriamientoTurnos || 0) > 0 || (m.bloqueoAyudaTurnos || 0) > 0) return mostrarFeedbackGameplay(`${m.nombre} ya está fuera del taller.`, 'info');
    if ((reparacionesActivas || []).some(function(r) { return r && r.mecanicoNombre === m.nombre; })) return mostrarFeedbackGameplay(`${m.nombre} está trabajando y no puede descansar ahora.`, 'warn');
    const energiaActual = Number.isFinite(Number(m.energia))
        ? Math.max(0, Math.min(100, Math.round(Number(m.energia))))
        : Math.max(45, 100 - (Math.max(0, Number(m.trabajosHoy) || 0) * 16));
    const turnosDescanso = 2;
    m.descansoEnergiaInicio = energiaActual;
    m.descansoEnergiaObjetivo = Math.min(100, energiaActual + 40);
    m.descansoEnergiaTotal = turnosDescanso;
    m.energia = energiaActual;
    m.enfriamientoTurnos = turnosDescanso;
    m.ocupado = true;
    m.enojo = Math.max(0, Math.round(m.enojo || 0) - 1);
    if (typeof consumirTurno === 'function') consumirTurno('descanso de mecanico', COSTOS_TURNO.espera || 1);
    log(`${m.nombre} tomó un descanso programado y recuperará energía.`, 'info');
    mostrarFeedbackGameplay(`${m.nombre} descansará y recuperará energía hasta ${m.descansoEnergiaObjetivo}%.`, 'ok');
    renderizarLoreMecanicos();
    actualizarUI();
}

function atenderSolicitudMecanicoDesdePanel() {
    const idx = window.mecanicoPanelSeleccionadoIdx;
    const m = (typeof idx === 'number' && mecanicos) ? mecanicos[idx] : null;
    if (!m || !m.preguntaPendiente) return mostrarFeedbackGameplay('Este mecánico no tiene una solicitud pendiente.', 'info');
    const contactoId = 'mec_' + m.nombre;
    const solicitud = m.preguntaPendiente || {};
    const detalleSolicitud = solicitud.etiquetaCorta || solicitud.tipo || 'asunto pendiente';
    if (typeof pushMensajeTelefono === 'function') {
        pushMensajeTelefono(
            contactoId,
            m.nombre,
            `📩 Solicitud pendiente: ${detalleSolicitud}. Revisa las opciones para responderle.`,
            { clave: 'solicitud-panel-' + m.nombre + '-' + detalleSolicitud }
        );
    }
    cerrarModal();
    if (typeof navegarPantalla === 'function') navegarPantalla('telefono');
    if (typeof abrirChatTelefono === 'function') {
        abrirChatTelefono(contactoId);
        mostrarFeedbackGameplay(`Chat directo con ${m.nombre} abierto.`, 'info');
    } else {
        mostrarFeedbackGameplay(`Abre el chat de ${m.nombre} para responder su solicitud.`, 'warn');
    }
}

function obtenerCasosAprobadosPanelMecanico() {
    const lista = [];
    const estadosCerrados = new Set(['cobrado_retirado', 'pendiente_revision', 'rechazado_cliente', 'cerrado']);
    if (clienteActual && typeof asegurarIdCasoCliente === 'function') asegurarIdCasoCliente(clienteActual);

    if (clienteActual && clienteActual.aprobacionCliente) {
        const asignableActivo = true;
        lista.push({
            idCaso: clienteActual.idCaso || 'CASO-0000',
            nombre: clienteActual.personaNombre || 'Cliente',
            asignable: asignableActivo,
            nota: 'Caso activo aprobado: sueltalo sobre un mecanico para iniciar trabajo'
        });
    }

    if (Array.isArray(casosAtendidos)) {
        casosAtendidos.forEach(function(c) {
            if (!c) return;
            if (clienteActual && c.idCaso === clienteActual.idCaso) return;
            const snap = c.snapshot && typeof c.snapshot === 'object' ? c.snapshot : null;
            const estado = c.estado || '';
            if (estadosCerrados.has(estado)) return;
            const aprobado = estado === 'listo_asignacion' || estado === 'falta_pieza' || !!(snap && (snap.aprobacionCliente || snap.aprobadoCliente));
            if (!aprobado) return;
            const ocupado = (reparacionesActivas || []).some(function(r) { return r && r.idCaso === c.idCaso; });
            if (ocupado) return;
            const asignable = !!snap && (estado === 'listo_asignacion' || estado === 'falta_pieza' || !!(snap.aprobacionCliente || snap.aprobadoCliente));
            let piezasPendientes = [];
            if (snap && Array.isArray(snap.piezasRequeridasMecanico)) {
                const instaladas = Array.isArray(snap.piezasInstaladasMecanico) ? snap.piezasInstaladasMecanico : [];
                piezasPendientes = snap.piezasRequeridasMecanico
                    .filter(function(p) { return p && p.id && instaladas.indexOf(p.id) < 0; })
                    .map(function(p) { return p.nombre; });
            }
            const piezasTxt = piezasPendientes.length ? ` Pieza(s): ${piezasPendientes.join(', ')}` : '';
            lista.push({
                idCaso: c.idCaso || 'CASO-0000',
                nombre: c.personaNombre || 'Cliente',
                asignable: !!asignable,
                nota: !snap
                    ? 'Aprobado pendiente; expediente incompleto'
                    : (asignable
                        ? (estado === 'falta_pieza' ? `Trabajo pausado por piezas.${piezasTxt}` : 'Aprobado pendiente; arrastra este caso a un mecanico desde panel principal')
                        : 'Aprobado pendiente; falta requisito previo')
            });
        });
    }

    return lista.slice(0, 8);
}

function abrirEquipoOficina() {
    window.equipoOfCardExpandida = window.equipoOfCardExpandida || '';
    abrirModal('equipo-of');
    renderizarEquipoOficina();
}

function toggleEquipoOficinaCard(cardKey) {
    var key = String(cardKey || '');
    window.equipoOfCardExpandida = (window.equipoOfCardExpandida === key) ? '' : key;
    renderizarEquipoOficina();
}

function destacarAccionEquipoOficina(nombre, accion) {
    if (window.equipoOfAccionDestacadaTimer) {
        clearTimeout(window.equipoOfAccionDestacadaTimer);
        window.equipoOfAccionDestacadaTimer = 0;
    }
    window.equipoOfAccionDestacada = {
        nombre: String(nombre || ''),
        accion: String(accion || '')
    };
    window.equipoOfAccionDestacadaTimer = window.setTimeout(function() {
        window.equipoOfAccionDestacada = null;
        window.equipoOfAccionDestacadaTimer = 0;
        if (typeof renderizarEquipoOficina === 'function') renderizarEquipoOficina();
    }, 1200);
}

function desbloquearPuntoMecanicoOficina(mecNombre) {
    if (typeof desbloquearPuntoHabilidadMecanico !== 'function') return;
    const desbloqueado = desbloquearPuntoHabilidadMecanico(mecNombre);
    if (desbloqueado) {
        window.equipoOfUltimaMejora = {
            nombre: String(mecNombre || ''),
            mensaje: 'Punto de habilidad desbloqueado y listo para invertir.'
        };
        destacarAccionEquipoOficina(mecNombre, 'desbloquear');
    }
    renderizarEquipoOficina();
}

function invertirPuntoMecanicoOficina(mecNombre, stat) {
    if (typeof invertirPuntoHabilidad !== 'function') return;
    const invertido = invertirPuntoHabilidad(mecNombre, stat);
    if (invertido) {
        const m = (mecanicos || []).find(function(x) {
            return x && x.nombre === mecNombre;
        });
        let valorActual = '-';
        if (m) {
            if (stat === 'humor') {
                valorActual = `${Math.max(1, Math.round(m.humor || 7))}/10`;
            } else {
                valorActual = `${Math.max(0, Math.min(100, Math.round((m[stat] || 0) * 100)))}%`;
            }
        }
        window.equipoOfUltimaMejora = {
            nombre: String(mecNombre || ''),
            mensaje: `${capitalizarRotulo(stat)} mejorada: ${valorActual}.`
        };
        destacarAccionEquipoOficina(mecNombre, stat);
    }
    renderizarEquipoOficina();
}

function subirNivelDeliveryOficina(slotIndex) {
    if (typeof mejorarNivelDeliveryManual !== 'function') return;
    mejorarNivelDeliveryManual(slotIndex);
    renderizarEquipoOficina();
}

function renderizarEquipoOficina() {
    const resumenEl = document.getElementById('equipo-of-resumen');
    const listaEl = document.getElementById('equipo-of-lista');
    if (!resumenEl || !listaEl) return;

    const total = mecanicos.length;
    const avgHabilidad = total
        ? Math.round((mecanicos.reduce(function(s, m) { return s + (m.habilidad || 0); }, 0) / total) * 100)
        : 0;
    const avgEnojo = total
        ? Math.round(mecanicos.reduce(function(s, m) { return s + (m.enojo || 0); }, 0) / total * 10) / 10
        : 0;
    const costoSemanal = mecanicos.reduce(function(s, m) { return s + (m.costo || 0); }, 0);
    const trabajando = mecanicos.filter(function(m) {
        return (reparacionesActivas || []).some(function(r) { return r && r.mecanicoNombre === m.nombre; });
    }).length;
    const deliveryTotal = Math.max(1, Math.round(repartidoresMax || 1));
    const deliveryActivos = Array.isArray(entregasPiezasActivas) ? entregasPiezasActivas.length : 0;
    const deliveryLibres = Math.max(0, deliveryTotal - deliveryActivos);

    resumenEl.innerHTML = `
        <div class="equipo-of-kpis">
            <div class="equipo-of-kpi"><span>Equipo</span><strong>${total}</strong></div>
            <div class="equipo-of-kpi"><span>Trabajando</span><strong>${trabajando}</strong></div>
            <div class="equipo-of-kpi"><span>Delivery libres</span><strong>${deliveryLibres}/${deliveryTotal}</strong></div>
            <div class="equipo-of-kpi"><span>Habilidad media</span><strong>${avgHabilidad}%</strong></div>
            <div class="equipo-of-kpi ${avgEnojo >= 5 ? 'warn' : (avgEnojo >= 3 ? 'mid' : 'ok')}"><span>Enojo medio</span><strong>${avgEnojo}/8</strong></div>
            ${costoSemanal > 0 ? `<div class="equipo-of-kpi"><span>Costo contrato</span><strong>RD$${costoSemanal}</strong></div>` : ''}
        </div>
    `;

    const mecanicosHtml = mecanicos.map(function(m, idx) {
        if (typeof normalizarStatsMecanico === 'function') normalizarStatsMecanico(m);
        const modoSinCierre = (typeof estaModoSinCierreDia === 'function' && estaModoSinCierreDia());
        const bio = obtenerBioMecanicoSeguro(m.nombre);
        const rasgo = (typeof obtenerPerfilRasgosMecanico === 'function')
            ? obtenerPerfilRasgosMecanico(m.nombre)
            : { ventaja: '-', desventaja: '-' };

        const foto = bio.foto
            ? `<img src="${bio.foto}" alt="${m.nombre}" class="equipo-of-foto" onerror="this.style.display='none'">`
            : `<div class="equipo-of-foto-ph">${m.nombre.charAt(0)}</div>`;

        const repActiva = (reparacionesActivas || []).find(function(r) { return r && r.mecanicoNombre === m.nombre; });
        const progresoRep = repActiva
            ? Math.max(0, Math.min(100, repActiva.listoParaCobro ? 100 : Math.round((1 - (obtenerSegundosRestantesReparacion(repActiva) / Math.max(1, Number(repActiva.segundosTotalesReal || repActiva.duracionRealSeg || repActiva.tiempoTotal || 1)))) * 100)))
            : 0;
        const enfriamientoTxt = (typeof formatearTiempoTrabajo === 'function')
            ? formatearTiempoTrabajo(m.enfriamientoTurnos || 0)
            : `${(m.enfriamientoTurnos || 0) * 10} min`;
        const bloqueoAyudaTxt = (typeof formatearBloqueoAyudaMecanico === 'function')
            ? formatearBloqueoAyudaMecanico(m.bloqueoAyudaTurnos || 0)
            : `${(m.bloqueoAyudaTurnos || 0) * 10} min`;
        const estadoTxt = repActiva
            ? (repActiva.listoParaCobro ? `Listo: ${repActiva.idCaso || 'CASO-0000'}` : `Trabajando: ${repActiva.idCaso || 'CASO-0000'}`)
            : ((m.bloqueoAyudaTurnos || 0) > 0 ? `Fuera (${bloqueoAyudaTxt})`
            : ((m.enfriamientoTurnos || 0) > 0 ? `Enfriando (${enfriamientoTxt})`
            : ((!modoSinCierre && m.bloqueadoHastaDia >= dia) ? 'Bloqueado hoy' : 'Disponible')));
        const estadoClase = repActiva ? 'working' : (((!modoSinCierre && m.bloqueadoHastaDia >= dia) || (m.enfriamientoTurnos || 0) > 0 || (m.bloqueoAyudaTurnos || 0) > 0) ? 'locked' : (m.enojo >= 5 ? 'warn' : 'ok'));

        const habPct = Math.round((m.habilidad || 0) * 100);
        const enojoPct = Math.round(((m.enojo || 0) / 8) * 100);
        const lealtadTxt = (typeof m.lealtad === 'number') ? m.lealtad : '-';
        const deudaTxt = (m.deudaConTaller > 0) ? `Deuda: RD$${m.deudaConTaller}` : '';
        const costoTxt = (m.costo > 0) ? `Contrato: RD$${m.costo}` : 'Fundador';

        const nivel = Math.max(1, Math.round(m.nivel || 1));
        const xpActual = Math.max(0, Math.round(m.xp || 0));
        const xpMeta = (typeof xpParaSiguienteNivel === 'function') ? Math.max(0, Math.round(xpParaSiguienteNivel(nivel))) : 0;
        const xpTxt = (nivel >= 5 || xpMeta <= 0) ? 'MAX' : `${xpActual}/${xpMeta}`;
        const xpPct = (nivel >= 5 || xpMeta <= 0) ? 100 : Math.max(0, Math.min(100, Math.round((xpActual / xpMeta) * 100)));
        const puntosBloqueados = Math.max(0, Math.round(m.puntosBloqueados || 0));
        const puntosDisponibles = Math.max(0, Math.round(m.puntosHabilidad || 0));
        const costoDesbloqueo = (typeof obtenerCostoDesbloqueoPuntoMecanico === 'function')
            ? obtenerCostoDesbloqueoPuntoMecanico(nivel)
            : 0;
        const puedeDesbloquearPorXp = puntosBloqueados > 0;
        const puedePagarDesbloqueo = saldo >= costoDesbloqueo;
        const puedeDesbloquear = puedeDesbloquearPorXp && puedePagarDesbloqueo;
        let ctaDesbloqueo = `Desbloquear punto (${costoDesbloqueo > 0 ? 'RD$' + costoDesbloqueo : 'N/A'})`;
        if (!puedeDesbloquearPorXp) ctaDesbloqueo = 'Requiere subir nivel con XP';
        else if (!puedePagarDesbloqueo) ctaDesbloqueo = `Faltan RD$${costoDesbloqueo}`;
        const velocidadBasePct = Math.max(0, Math.min(100, Math.round(((m.velocidad || 0.5) * 100))));
        const velocidadEfectivaPct = Math.max(
            0,
            Math.min(
                100,
                Math.round(
                    ((typeof calcularVelocidadEfectiva === 'function'
                        ? calcularVelocidadEfectiva(m)
                        : (m.velocidad || 0.5)) * 100),
                ),
            ),
        );
        const eficienciaBasePct = Math.max(0, Math.min(100, Math.round(((m.eficiencia || 0.5) * 100))));
        const eficienciaEfectivaPct = Math.max(
            0,
            Math.min(
                100,
                Math.round(
                    ((typeof calcularEficienciaEfectiva === 'function'
                        ? calcularEficienciaEfectiva(m)
                        : (m.eficiencia || 0.5)) * 100),
                ),
            ),
        );
        const humorBase = Math.max(1, Math.min(10, Math.round(m.humor || 7)));
        const humorBasePct = Math.max(0, Math.min(100, Math.round((humorBase / 10) * 100)));
        const humorEfectivo = Math.max(
            1,
            Math.min(
                10,
                Math.round(
                    typeof calcularHumorEfectivo === 'function'
                        ? calcularHumorEfectivo(m)
                        : humorBase,
                ),
            ),
        );
        const ultimaMejora =
            window.equipoOfUltimaMejora &&
            window.equipoOfUltimaMejora.nombre === String(m.nombre || '')
                ? window.equipoOfUltimaMejora.mensaje
                : '';
        const accionDestacada =
            window.equipoOfAccionDestacada &&
            window.equipoOfAccionDestacada.nombre === String(m.nombre || '')
                ? String(window.equipoOfAccionDestacada.accion || '')
                : '';
        const claseDesbloqueo = accionDestacada === 'desbloquear' ? ' equipo-of-action-pulse' : '';
        const claseVelocidad = accionDestacada === 'velocidad' ? ' equipo-of-action-pulse' : '';
        const claseEficiencia = accionDestacada === 'eficiencia' ? ' equipo-of-action-pulse' : '';
        const claseHumor = accionDestacada === 'humor' ? ' equipo-of-action-pulse' : '';
        const nombreJs = JSON.stringify(String(m.nombre || ''));
        const cardKey = `mec-${idx}`;
        const expanded = (window.equipoOfCardExpandida || '') === cardKey;

        const rivalidad = bio.rivalidad || '-';
        const necesidad = bio.necesidad || '-';
        const necesidadPendiente = !!m.preguntaPendiente;
        const fueraNecesidad = Math.max(0, Number(m.bloqueoAyudaTurnos || 0));
        const humorBarBase = 100 - (Math.max(0, Number(m.enojo || 0)) * 8);
        const humorNecesidad = necesidadPendiente ? 18 : 0;
        const humorFuera = fueraNecesidad > 0 ? 28 : 0;
        const humorPct = Math.max(0, Math.min(100, Math.round(humorBarBase - humorNecesidad - humorFuera)));
        const humorColor = humorPct <= 30 ? 'anger' : (humorPct <= 60 ? 'mood' : 'skill');
        const humorMotivo = fueraNecesidad > 0 ? 'Asunto personal pendiente' : (necesidadPendiente ? 'Necesidad sin atender' : (m.enojo >= 4 ? 'Tensión alta' : 'Estable'));

        const fotoConProgreso = repActiva
            ? `<span class="mecanico-progress-ring mecanico-progress-ring-office" style="--progress:${progresoRep}%;" title="Progreso del trabajo: ${progresoRep}%"><span class="mecanico-progress-ring-value">${progresoRep}%</span>${foto}</span>`
            : foto;
        return `<div class="equipo-of-card" id="equipo-of-card-${idx}">
            <div class="equipo-of-card-top">
                ${fotoConProgreso}
                <div class="equipo-of-card-info">
                    <div class="equipo-of-name">${m.nombre}</div>
                    <div class="equipo-of-spec">${capitalizarRotulo(m.especialidad || 'general')}</div>
                    <div class="equipo-of-tag ${estadoClase}">${estadoTxt}</div>
                    <div class="equipo-of-meta">${costoTxt}${deudaTxt ? ' | ' + deudaTxt : ''} | Hoy: ${m.trabajosHoy || 0} trabajos</div>
                </div>
            </div>
            <button class="equipo-of-card-toggle" type="button" onclick="toggleEquipoOficinaCard('${cardKey}')">
                Gestionar progreso y puntos <span>${expanded ? '&#9652;' : '&#9662;'}</span>
            </button>
            <div class="equipo-of-bars">
                <div class="equipo-of-bar-row">
                    <span>Humor</span>
                    <div class="equipo-of-track"><div class="equipo-of-fill ${humorColor}" style="width:${humorPct}%"></div></div>
                    <span>${humorPct}%</span>
                </div>
                <div class="equipo-of-bar-row">
                    <span>Habilidad</span>
                    <div class="equipo-of-track"><div class="equipo-of-fill skill" style="width:${habPct}%"></div></div>
                    <span>${habPct}%</span>
                </div>
                <div class="equipo-of-bar-row">
                    <span>Enojo</span>
                    <div class="equipo-of-track"><div class="equipo-of-fill anger" style="width:${enojoPct}%"></div></div>
                    <span>${m.enojo || 0}/8</span>
                </div>
                <div class="equipo-of-mood-note">Estado: ${humorMotivo}${fueraNecesidad > 0 ? ` · ${bloqueoAyudaTxt}` : ''}</div>
                ${(typeof m.lealtad === 'number') ? `
                <div class="equipo-of-bar-row">
                    <span>Lealtad</span>
                    <div class="equipo-of-track"><div class="equipo-of-fill loyalty" style="width:${Math.max(0, Math.min(100, Math.round(m.lealtad)))}%"></div></div>
                    <span>${Math.round(m.lealtad)}/100</span>
                </div>` : ''}
            </div>
            <div class="equipo-of-expand ${expanded ? '' : 'hidden'}">
                <div class="equipo-of-points-box">
                    <div class="equipo-of-points-head">
                        <strong>Nivel ${nivel}</strong>
                        <span>XP ${xpTxt}</span>
                    </div>
                    <div class="equipo-of-track"><div class="equipo-of-fill skill" style="width:${xpPct}%"></div></div>
                    <div class="equipo-of-points-meta">Puntos bloqueados: ${puntosBloqueados} | Puntos disponibles: ${puntosDisponibles}</div>
                    <div class="equipo-of-stats-grid">
                        <div class="equipo-of-stat-card">
                            <div class="equipo-of-stat-head">
                                <strong>Velocidad</strong>
                                <span>${velocidadBasePct}%</span>
                            </div>
                            <div class="equipo-of-track"><div class="equipo-of-fill speed" style="width:${velocidadBasePct}%"></div></div>
                            <div class="equipo-of-stat-meta">Efectiva ${velocidadEfectivaPct}%</div>
                        </div>
                        <div class="equipo-of-stat-card">
                            <div class="equipo-of-stat-head">
                                <strong>Eficiencia</strong>
                                <span>${eficienciaBasePct}%</span>
                            </div>
                            <div class="equipo-of-track"><div class="equipo-of-fill efficiency" style="width:${eficienciaBasePct}%"></div></div>
                            <div class="equipo-of-stat-meta">Efectiva ${eficienciaEfectivaPct}%</div>
                        </div>
                        <div class="equipo-of-stat-card">
                            <div class="equipo-of-stat-head">
                                <strong>Humor</strong>
                                <span>${humorBase}/10</span>
                            </div>
                            <div class="equipo-of-track"><div class="equipo-of-fill mood" style="width:${humorBasePct}%"></div></div>
                            <div class="equipo-of-stat-meta">Operativo ${humorEfectivo}/10</div>
                        </div>
                    </div>
                    ${ultimaMejora ? `<div class="equipo-of-inline-feedback">${ultimaMejora}</div>` : ''}
                    <div class="equipo-of-acciones equipo-of-acciones-puntos">
                        <button class="btn${claseDesbloqueo}" onclick='desbloquearPuntoMecanicoOficina(${nombreJs})' ${puedeDesbloquear ? '' : 'disabled'}>
                            ${ctaDesbloqueo}
                        </button>
                        <button class="btn${claseVelocidad}" onclick='invertirPuntoMecanicoOficina(${nombreJs}, "velocidad")' ${(puntosDisponibles > 0 && (m.velocidad || 0) < 1) ? '' : 'disabled'}>
                            + Velocidad
                        </button>
                        <button class="btn${claseEficiencia}" onclick='invertirPuntoMecanicoOficina(${nombreJs}, "eficiencia")' ${(puntosDisponibles > 0 && (m.eficiencia || 0) < 1) ? '' : 'disabled'}>
                            + Eficiencia
                        </button>
                        <button class="btn${claseHumor}" onclick='invertirPuntoMecanicoOficina(${nombreJs}, "humor")' ${(puntosDisponibles > 0 && (m.humor || 0) < 10) ? '' : 'disabled'}>
                            + Humor
                        </button>
                    </div>
                </div>
                <details class="equipo-of-bio">
                    <summary>Bio &amp; rasgos</summary>
                    <div class="equipo-of-bio-body">
                        <p>${bio.historia}</p>
                        <p><strong>Fortaleza:</strong> ${bio.habilidadTexto}</p>
                        <p><strong>Ventaja:</strong> ${rasgo.ventaja}</p>
                        <p><strong>Desventaja:</strong> ${rasgo.desventaja}</p>
                        <p><strong>Rivalidad:</strong> ${rivalidad}</p>
                        <p><strong>Necesidad:</strong> ${necesidad}</p>
                    </div>
                </details>
                <div class="equipo-of-acciones">
                    <button class="btn" onclick="hablarConMecanicoDesdeOficina(${idx})">Hablar</button>
                    ${(m.deudaConTaller > 0) ? `<button class="btn" onclick="cobrarDeudaMecanicoOficina(${idx})">Cambiar plan de deuda</button>` : ''}
                    <button class="btn btn-danger" onclick="despedirMecanico('${m.nombre}'); renderizarEquipoOficina();">Despedir</button>
                </div>
            </div>
        </div>`;
    }).join('');

    let deliveryHtml = '';
    for (let slot = 0; slot < deliveryTotal; slot++) {
        const stats = (typeof obtenerStatsRepartidor === 'function')
            ? obtenerStatsRepartidor(slot)
            : { nivel: 1, xp: 0 };
        const nivel = Math.max(1, Math.round((stats && stats.nivel) || 1));
        const xp = Math.max(0, Math.round((stats && stats.xp) || 0));
        const xpMeta = (typeof xpSiguienteNivelDelivery === 'function') ? Math.max(1, Math.round(xpSiguienteNivelDelivery(nivel))) : 1;
        const xpTxt = (nivel >= 10) ? 'MAX' : `${xp}/${xpMeta}`;
        const xpPct = (nivel >= 10) ? 100 : Math.max(0, Math.min(100, Math.round((xp / xpMeta) * 100)));
        const entregaActiva = Array.isArray(entregasPiezasActivas)
            ? entregasPiezasActivas.find(function(e) { return e && typeof e.slotDelivery === 'number' && e.slotDelivery === slot; })
            : null;
        const estadoTxt = entregaActiva
            ? `En ruta (${typeof formatearTiempoTrabajo === 'function' ? formatearTiempoTrabajo(Math.max(0, Math.round(entregaActiva.etaRestante || 0))) : 'ocupado'})`
            : 'Disponible';
        const costo = (typeof obtenerCostoMejoraDelivery === 'function') ? obtenerCostoMejoraDelivery(nivel) : 0;
        const puedeXP = xp >= xpMeta;
        const puedePagar = saldo >= costo;
        const cardKey = `del-${slot}`;
        const expanded = (window.equipoOfCardExpandida || '') === cardKey;
        let ctaLabel = `Subir nivel (RD$${costo})`;
        if (nivel >= 10) ctaLabel = 'Nivel maximo';
        else if (!puedeXP) ctaLabel = `Requiere XP ${xpMeta}`;
        else if (!puedePagar) ctaLabel = `Faltan RD$${costo}`;

        deliveryHtml += `<div class="equipo-of-card equipo-of-card-delivery" id="equipo-of-delivery-${slot}">
            <div class="equipo-of-card-top">
                <div class="equipo-of-foto-ph">D${slot + 1}</div>
                <div class="equipo-of-card-info">
                    <div class="equipo-of-name">Delivery ${slot + 1}</div>
                    <div class="equipo-of-spec">Logistica de piezas</div>
                    <div class="equipo-of-tag ${entregaActiva ? 'working' : 'ok'}">${estadoTxt}</div>
                    <div class="equipo-of-meta">Nivel ${nivel} | XP ${xpTxt}</div>
                </div>
            </div>
            <button class="equipo-of-card-toggle" type="button" onclick="toggleEquipoOficinaCard('${cardKey}')">
                Gestionar progreso <span>${expanded ? '&#9652;' : '&#9662;'}</span>
            </button>
            <div class="equipo-of-expand ${expanded ? '' : 'hidden'}">
                <div class="equipo-of-points-box">
                    <div class="equipo-of-points-head">
                        <strong>Nivel ${nivel}</strong>
                        <span>XP ${xpTxt}</span>
                    </div>
                    <div class="equipo-of-track"><div class="equipo-of-fill loyalty" style="width:${xpPct}%"></div></div>
                    <div class="equipo-of-points-meta">Subida de nivel requiere experiencia y costo operativo.</div>
                    <div class="equipo-of-acciones equipo-of-acciones-puntos">
                        <button class="btn" onclick="subirNivelDeliveryOficina(${slot})" ${(nivel < 10 && puedeXP && puedePagar) ? '' : 'disabled'}>${ctaLabel}</button>
                    </div>
                </div>
            </div>
        </div>`;
    }

    listaEl.innerHTML = `${mecanicosHtml}${deliveryHtml}`;
}

function hablarConMecanicoDesdeOficina(idx) {
    if (typeof idx !== 'number' || idx < 0 || idx >= mecanicos.length) return;
    const m = mecanicos[idx];
    if (typeof navegarPantalla === 'function') navegarPantalla('telefono');
    if (typeof abrirChatTelefono === 'function') abrirChatTelefono('mec_' + m.nombre);
}

function cobrarDeudaMecanicoOficina(idx) {
    if (typeof idx !== 'number' || idx < 0 || idx >= mecanicos.length) return;
    const m = mecanicos[idx];
    if (!m.deudaConTaller || m.deudaConTaller <= 0) return;
    const orden = ['flexible', 'estandar', 'rapido'];
    const actual = orden.indexOf(m.planDeudaTaller);
    m.planDeudaTaller = orden[(actual + 1) % orden.length];
    const plan = typeof obtenerPlanDeudaMecanico === 'function' ? obtenerPlanDeudaMecanico(m) : { etiqueta: 'Estándar', tasa: 0.20 };
    log(`${m.nombre} cambió al plan ${plan.etiqueta}: ${Math.round(plan.tasa * 100)}% de su comisión por caso irá a la deuda.`, 'info');
    if (typeof mostrarFeedbackGameplay === 'function') mostrarFeedbackGameplay(`Plan ${plan.etiqueta} activo para ${m.nombre}: cuota automática del ${Math.round(plan.tasa * 100)}%.`, 'ok');
    renderizarEquipoOficina();
}

function abrirPanelMecanico(idx) {
    if (typeof idx !== 'number' || idx < 0 || idx >= mecanicos.length) return;
    window.mecanicoPanelSeleccionadoIdx = idx;
    window.mecanicoPanelBioAbierta = false;
    abrirModal('mecanicos');
}

function verMecanicoPanel() {
    renderizarLoreMecanicos();
}

function toggleBiografiaMecanicoPanel() {
    window.mecanicoPanelBioAbierta = !window.mecanicoPanelBioAbierta;
    renderizarLoreMecanicos();
}

function hablarConMecanicoPanel() {
    const idx = window.mecanicoPanelSeleccionadoIdx;
    if (typeof idx !== 'number' || idx < 0 || idx >= mecanicos.length) return;
    const m = mecanicos[idx];
    const modoSinCierre = (typeof estaModoSinCierreDia === 'function' && estaModoSinCierreDia());
    m.recordatorioTrabajoDia = dia;
    if (!window.dialogoMecanicoPanel) window.dialogoMecanicoPanel = {};
    const opciones = [
        `Jefe, ${m.enojo >= 5 ? 'ando caliente' : 'estoy listo'} para el siguiente caso.`,
        m.enojo >= 4 ? 'Si me cargas otro problema sin piezas, voy a explotar.' : 'Dame un caso aprobado y lo saco rapido.',
        (!modoSinCierre && m.bloqueadoHastaDia >= dia) ? 'Hoy estoy bloqueado, no puedo tocar elevador.' : 'Si el caso esta aprobado, entro de una.',
        (m.bloqueoAyudaTurnos || 0) > 0 ? `Estoy fuera resolviendo un asunto personal por ${(typeof formatearBloqueoAyudaMecanico === 'function') ? formatearBloqueoAyudaMecanico(m.bloqueoAyudaTurnos || 0) : 'un rato'}.` : 'Si resuelvo mis asuntos, vuelvo de una.',
        (m.enfriamientoTurnos || 0) > 0 ? `Necesito ${(typeof formatearTiempoTrabajo === 'function') ? formatearTiempoTrabajo(m.enfriamientoTurnos || 0) : 'un momento'} para volver.` : 'Estoy en espera, barajando mientras llega trabajo.'
    ];
    const frase = opciones[Math.floor(Math.random() * opciones.length)];
    window.dialogoMecanicoPanel[m.nombre] = frase;
    log(`${m.nombre}: ${frase}`, 'info');
    if (typeof mostrarFeedbackGameplay === 'function') mostrarFeedbackGameplay(`${m.nombre} respondió: ${frase}`, 'info');
    renderizarLoreMecanicos();
}

function asignarCasoAprobadoDesdePanel(idCaso) {
    const idx = window.mecanicoPanelSeleccionadoIdx;
    if (typeof idx !== 'number' || idx < 0 || idx >= mecanicos.length) return;
    if (typeof intentarAsignarCasoAprobadoAMecanico !== 'function') {
        log('Ese caso no se pudo cargar para asignacion directa.', 'error');
        return;
    }
    const asignado = !!intentarAsignarCasoAprobadoAMecanico(idCaso, idx);
    if (asignado) {
        cerrarModal();
    } else {
        renderizarLoreMecanicos();
    }
}

function lanzarSolicitudMecanico() {
    // Asegurar que modo de eventos emergentes esté activo
    if (window.TallerApp && window.TallerApp.mode) {
        window.TallerApp.mode.eventosEmergentesActivos = true;
    }
    if (solicitudMecanicoActiva) return;
    if (!tramaEstado || typeof tramaEstado !== 'object') return;

    // Modo por casos: no depender de dia/turno.
    const casosActuales = (tramaEstado.casosCriticosResueltos || 0) + (tramaEstado.casosParciales || 0);
    const cadenciaCasos = 3;
    const ultimoSolicitud = Math.max(0, Math.round(tramaEstado.solicitudMecanicoUltimoCaso || 0));
    if (casosActuales < cadenciaCasos) return;
    if ((casosActuales - ultimoSolicitud) < cadenciaCasos) return;

    const esVapeador = function(nombre) {
        var key = String(nombre || '').toLowerCase();
        return key === 'frandy' || key === 'miguel' || key === 'cristofer' || key === 'morenai' || key === 'moreni' || key === 'martin';
    };
    const vapeadores = (mecanicos || []).filter(function(mx) {
        return mx && mx.nombre && esVapeador(mx.nombre);
    });
    if (!vapeadores.length) return;

    const ciclo = Math.max(0, Math.floor(casosActuales / cadenciaCasos));
    const m = vapeadores[ciclo % vapeadores.length];
    const monto = 100;
    solicitudMecanicoActiva = { nombre: m.nombre, monto: monto };
    tramaEstado.solicitudMecanicoUltimoCaso = casosActuales;

    document.getElementById('decision-titulo').innerText = `Solicitud de ${m.nombre}`;
    document.getElementById('decision-texto').innerText = `${m.nombre} te pide RD$${monto} para el liquido del vape.`;

    const btnA = document.getElementById('decision-opcion-a');
    const btnB = document.getElementById('decision-opcion-b');
    btnA.innerText = `Prestar RD$${monto}`;
    btnB.innerText = 'Negarse y exigir enfoque en el trabajo';

    btnA.onclick = () => resolverSolicitudMecanico(true);
    btnB.onclick = () => resolverSolicitudMecanico(false);
    abrirModal('decision');
}

function resolverSolicitudMecanico(aprobar) {
    if (!solicitudMecanicoActiva) {
        cerrarModal();
        return;
    }
    if (!consumirFoco('decisionHistoria')) return;

    const m = mecanicos.find(x => x.nombre === solicitudMecanicoActiva.nombre);
    const monto = solicitudMecanicoActiva.monto;

    if (aprobar && saldo >= monto) {
        saldo -= monto;
        if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarGastoDia === 'function') {
            window.TallerApp.helpers.registrarGastoDia(monto, 'equipo');
        }
        if (m) {
            m.lealtad += 2;
            m.enojo = Math.max(0, m.enojo - 1);
            if (typeof registrarPrestamoMecanico === 'function') registrarPrestamoMecanico(m, monto, 'evento');
            else m.deudaConTaller = Math.max(0, Number(m.deudaConTaller) || 0) + monto;
            m.habilidad = Math.min(1.2, m.habilidad + 0.03);
        }
        resumenDia.prestamosDados += monto;
        decisionesHistoria.prestamosAprobados++;
        tramaEstado.historiasMecanicosAtendidas += 1;
        log(`Prestaste RD$${monto} a ${solicitudMecanicoActiva.nombre}. Ganaste lealtad.`, 'exito');
        mostrarStamp('APROBADO', 'ok');
    } else {
        if (aprobar && saldo < monto) {
            log('Quisiste prestar, pero no habia saldo suficiente.', 'error');
        }
        if (m) {
            m.enojo = Math.min(8, m.enojo + 2);
            m.lealtad = Math.max(-2, m.lealtad - 1);
        }
        decisionesHistoria.prestamosNegados++;
        log(`Negaste la solicitud de ${solicitudMecanicoActiva.nombre}. Hay tension.`, 'error');
        mostrarStamp('RECHAZADO', 'error');
    }

    solicitudMecanicoActiva = null;
    cerrarModal();
    consumirTurno('decision de equipo', COSTOS_TURNO.decisionHistoria);
}

function resetearEventosDelDia() {
    eventoDiario = { activado: false, descripcion: '' };
    modificadorHabilidadDiario = 0;
    multiplicadorPagoDiario = 1;
    eventoPeleaHoy = false;
    solicitudMecanicoActiva = null;
    resumenDia = window.TallerApp.helpers.crearResumenCasosInicial();
    estrategiaCliente = 'balanceado';
    const eventoEl = document.getElementById('evento-container');
    if (eventoEl) {
        eventoEl.classList.add('hidden');
        eventoEl.innerText = '';
    }
}

function activarEventoDiario() {
    if (eventoDiario.activado) return;
    const r = Math.random();
    let texto = '';
    if (r < 0.25) {
        texto = 'Evento del dia: Cliente influencer viene temprano. +5 reputacion inmediata.';
        reputacion += 5;
    } else if (r < 0.5) {
        texto = 'Evento del dia: Falta una herramienta clave. Reparaciones con un poco mas de riesgo hoy.';
        modificadorHabilidadDiario = -0.03;
    } else if (r < 0.75) {
        texto = 'Evento del dia: Llega proveedor amigo. Cafe para todos y menos tension. -1 enojo a cada mecanico.';
        mecanicos.forEach(m => m.enojo = Math.max(0, m.enojo - 1));
    } else {
        texto = 'Evento del dia: Rumor de cierre del taller. +8 estres, pero +10% pago por urgencia.';
        estres = Math.min(100, estres + 8);
        multiplicadorPagoDiario = 1.1;
    }

    eventoDiario.activado = true;
    eventoDiario.descripcion = texto;
    const eventoEl = document.getElementById('evento-container');
    if (eventoEl) {
        eventoEl.innerText = texto;
        eventoEl.classList.remove('hidden');
    }
}

function requisitosMejora(tipo) {
    const claveConfig = tipo === 'maquina' ? 'maquinaDiagnosis' : tipo;
    const base = (ECONOMY_DATA.requisitosMejora || {})[claveConfig];
    if (!base) return { diaMin: 1, nivelMin: 1, repMin: 0, tallerMin: 1, costo: 0, max: 1 };
    const nivelActual = tipo === 'maquina' ? (Number(mejoras.maquinaDiagnosis) || 0) : (mejoras[tipo] || 0);
    const minProgreso = Math.max(1, base.nivelMin || base.progresoMin || base.diaMin || 1);
    return {
        diaMin: base.diaMin || minProgreso,
        nivelMin: minProgreso,
        repMin: Array.isArray(base.repMin) ? (base.repMin[Math.min(nivelActual, base.repMin.length - 1)] || base.repMin[base.repMin.length - 1] || 0) : (base.repMin || 0),
        tallerMin: base.tallerMin,
        costo: base.costoBase + (nivelActual * (base.costoPorNivel || 0)),
        max: base.max
    };
}

function sincronizarCompraMejoraUI() {
    if (typeof actualizarUI === 'function') actualizarUI();
    if (typeof actualizarScreenOficina === 'function') actualizarScreenOficina();
    if (typeof actualizarScreenExterior === 'function') actualizarScreenExterior();
    if (typeof renderizarTiendasMejoras === 'function') renderizarTiendasMejoras();
    if (typeof autoGuardarPartidaSilenciosa === 'function') {
        autoGuardarPartidaSilenciosa('compra-mejora');
    }
}

function notificarCompraMejoraTelefono(tipo, nombre, costo) {
    if (typeof pushMensajeTelefono !== 'function') return;
    var detalle = tipo === 'maquina'
        ? 'Instalacion confirmada. La Maquina DX suma un nivel OBD y mejora la precision del siguiente diagnostico.'
        : (tipo === 'bateria'
            ? 'Estabilizador nivel ' + Math.max(0, Math.round(mejorasTacticas.bateria || 0)) + ' instalado. Las recargas y la estabilidad operativa mejoran.'
            : nombre + ' ya figura como instalado en el taller.');
    pushMensajeTelefono('proveedor', 'proveedor', detalle + ' Cargo: RD$' + Math.max(0, Math.round(costo || 0)) + '.', {
        clave: 'compra-' + tipo + '-' + Date.now()
    });
}

function comprarMejora(tipo) {
    const progresoOperativo = obtenerProgresoOperativoActual();
    const req = requisitosMejora(tipo);
    const nivelActual = tipo === 'maquina' ? (Number(mejoras.maquinaDiagnosis) || 0) : (mejoras[tipo] || 0);
    if (nivelActual >= req.max) {
        log('Esa mejora ya llego a su limite.', 'error');
        mostrarStamp('RECHAZADO', 'error');
        return;
    }
    if (progresoOperativo < req.nivelMin || reputacion < req.repMin || tallerNivel < req.tallerMin) {
        const reqTxt = `Bloqueado: requiere Progreso ${req.nivelMin}, Reputacion ${req.repMin} y Taller nivel ${req.tallerMin}.`;
        log(reqTxt, 'error');
        mostrarStamp('RECHAZADO', 'error');
        return;
    }
    if (saldo < req.costo) {
        log(`No tienes dinero. Esta mejora cuesta RD$${req.costo}.`, 'error');
        mostrarStamp('RECHAZADO', 'error');
        return;
    }
    if (!Number.isFinite(saldo) || !Number.isFinite(req.costo) || req.costo < 0) {
        log('Compra cancelada: caja o costo invalido.', 'error');
        if (typeof actualizarUI === 'function') actualizarUI();
        return;
    }
    if (!consumirFoco('mejorar')) return;

    switch (tipo) {
        case 'herramientas':
            saldo -= req.costo;
            if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarGastoDia === 'function') {
                window.TallerApp.helpers.registrarGastoDia(req.costo, 'mejoras');
            }
            mejoras.herramientas++;
            mecanicos.forEach(m => m.habilidad += 0.08);
            log(`Herramientas mejoradas por RD$${req.costo}. Sube precision tecnica del taller.`, 'exito');
            break;
        case 'publicidad':
            saldo -= req.costo;
            if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarGastoDia === 'function') {
                window.TallerApp.helpers.registrarGastoDia(req.costo, 'mejoras');
            }
            mejoras.publicidad++;
            reputacion += 3;
            log(`Publicidad comprada por RD$${req.costo}. +3 reputacion`, 'exito');
            break;
        case 'capacitacion':
            saldo -= req.costo;
            if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarGastoDia === 'function') {
                window.TallerApp.helpers.registrarGastoDia(req.costo, 'mejoras');
            }
            mejoras.capacitacion++;
            mecanicos.forEach(m => m.enojo = Math.max(0, m.enojo - 1));
            estres = Math.max(0, estres - 2);
            log(`Capacitacion completada por RD$${req.costo}. Mejora dictamen y calma al equipo.`, 'exito');
            break;
        case 'maquina':
            saldo -= req.costo;
            if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarGastoDia === 'function') {
                window.TallerApp.helpers.registrarGastoDia(req.costo, 'mejoras');
            }
            mejoras.maquinaDiagnosis = Math.min(10, (Number(mejoras.maquinaDiagnosis) || 0) + 1);
            log(`Maquina de diagnosis mejorada a nivel ${mejoras.maquinaDiagnosis} por RD$${req.costo}. OBD gana precision avanzada.`, 'exito');
            break;
    }
    // recalcularCostosTacticos();
    mostrarStamp('APROBADO', 'ok');
    consumirTurno('compra de mejora', COSTOS_TURNO.mejorar);
    notificarCompraMejoraTelefono(tipo, tipo === 'maquina' ? 'Maquina DX' : tipo, req.costo);
    if (typeof registrarEventoNarrativo === 'function') {
        registrarEventoNarrativo('mejora_comprada', { tipo: tipo, costo: req.costo, area: tipo === 'capacitacion' ? 'equipo' : 'taller' });
    }
    sincronizarCompraMejoraUI();
}

function comprarMejoraTactica(tipo) {
    if (!mejoras || typeof mejoras !== 'object') mejoras = { ...(ECONOMY_DATA.mejorasIniciales || {}) };
    if (!mejorasTacticas || typeof mejorasTacticas !== 'object') mejorasTacticas = {};
    mejorasTacticas.bateria = Number.isFinite(Number(mejorasTacticas.bateria))
        ? Math.max(0, Math.round(Number(mejorasTacticas.bateria)))
        : 0;
    mejorasTacticas.recuperacionEquipo = Number.isFinite(Number(mejorasTacticas.recuperacionEquipo))
        ? Math.max(0, Math.min(3, Math.round(Number(mejorasTacticas.recuperacionEquipo))))
        : 0;
    const tienda = ECONOMY_DATA.tiendaTactica || {};
    const modoNiveles = modoNivelesProgresionActiva();
    const progresoOperativo = obtenerProgresoOperativoActual();
    let costo = 0;
    let nombre = '';

    if (tipo === 'recarga_foco') {
        if (!modoNiveles && focoDiaActual >= focoDiaMax) {
            log('La capacidad operativa ya esta al maximo por hoy.', 'info');
            return;
        }
        if (modoNiveles && estres <= 6) {
            log('El pulso del taller ya esta estable.', 'info');
            return;
        }
        costo = (tienda.recarga_foco && tienda.recarga_foco.costo) || 320;
        nombre = (tienda.recarga_foco && tienda.recarga_foco.nombre) || 'Impulso operativo';
    } else if (tipo === 'bateria') {
        const item = tienda.bateria || { costoBase: 600, costoPorNivel: 250, max: 3, nombre: 'Estabilizador tecnico' };
        const maxBateria = obtenerMaxBateriaDinamica();
        if (mejorasTacticas.bateria >= maxBateria) {
            log('El estabilizador tecnico ya esta al maximo.', 'error');
            mostrarStamp('RECHAZADO', 'error');
            return;
        }
        costo = item.costoBase + (mejorasTacticas.bateria * item.costoPorNivel);
        nombre = item.nombre;
    } else if (tipo === 'recuperacion_equipo') {
        const item = tienda.recuperacion_equipo || { costoBase: 800, costoPorNivel: 500, max: 3, nombre: 'Área de descanso del equipo' };
        if (mejorasTacticas.recuperacionEquipo >= item.max) {
            log('El área de descanso ya está al máximo.', 'error');
            mostrarStamp('RECHAZADO', 'error');
            return;
        }
        costo = item.costoBase + (mejorasTacticas.recuperacionEquipo * item.costoPorNivel);
        nombre = item.nombre;
    } else if (tipo === 'manual_hablar') {
        const item = tienda.manual_hablar || { costo: 850, nombre: 'Manual de entrevista' };
        if (mejorasTacticas.manualHablar) {
            log('Ya compraste Manual de entrevista.', 'error');
            mostrarStamp('RECHAZADO', 'error');
            return;
        }
        costo = item.costo;
        nombre = item.nombre;
    } else if (tipo === 'scanner_dx') {
        const item = tienda.scanner_dx || { costo: 1200, nombre: 'Scanner rapido' };
        if (progresoOperativo < 2 || (mejoras.herramientas || 0) < 1) {
            log('Scanner OBD requiere Progreso 2 y Herramientas nivel 1.', 'error');
            mostrarStamp('RECHAZADO', 'error');
            return;
        }
        if (mejorasTacticas.scannerDx) {
            log('Ya compraste Scanner rapido.', 'error');
            mostrarStamp('RECHAZADO', 'error');
            return;
        }
        costo = item.costo;
        nombre = item.nombre;
    } else if (tipo === 'flujo_reparacion') {
        const item = tienda.flujo_reparacion || { costo: 1650, nombre: 'Flujo de reparacion' };
        if (progresoOperativo < 2 || (mejoras.capacitacion || 0) < 1) {
            log('Flujo de reparacion requiere Progreso 2 y Capacitacion nivel 1.', 'error');
            mostrarStamp('RECHAZADO', 'error');
            return;
        }
        if (mejorasTacticas.flujoReparacion) {
            log('Ya compraste Flujo de reparacion.', 'error');
            mostrarStamp('RECHAZADO', 'error');
            return;
        }
        costo = item.costo;
        nombre = item.nombre;
    } else if (['organizador_cola','control_calidad','fidelidad_clientes','ahorro_operativo'].includes(tipo)) {
        var extra = { organizador_cola:['organizadorCola','Organizador de Cola',1100,350], control_calidad:['controlCalidad','Control de Calidad',1450,450], fidelidad_clientes:['fidelidadClientes','Programa de Fidelidad',1600,500], ahorro_operativo:['ahorroOperativo','Plan de Ahorro',1250,400] }[tipo];
        var nivelExtra = Math.max(0, Math.min(10, Math.round(Number(mejorasTacticas[extra[0]]) || 0)));
        if (nivelExtra >= 10) { log(extra[1] + ' ya esta en nivel 10.', 'error'); mostrarStamp('RECHAZADO','error'); return; }
        costo = extra[2] + (nivelExtra * extra[3]); nombre = extra[1] + ' Nv.' + (nivelExtra + 1);
    } else {
        return;
    }

    if (!Number.isFinite(saldo)) {
        saldo = Math.max(0, Math.round(ECONOMY_DATA.saldoInicial || 2000));
    }
    if (!Number.isFinite(costo) || costo < 0) {
        log('Compra cancelada: el costo de la mejora es invalido.', 'error');
        sincronizarCompraMejoraUI();
        return;
    }
    if (saldo < costo) {
        log(`No tienes dinero para ${nombre}. Costo: RD$${costo}.`, 'error');
        mostrarStamp('RECHAZADO', 'error');
        return;
    }
    const requiereFocoCompra = !modoNiveles && (tipo !== 'recarga_foco' && tipo !== 'bateria' && tipo !== 'recuperacion_equipo');
    if (requiereFocoCompra && !consumirFoco('mejorar')) return;

    saldo -= costo;
    if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarGastoDia === 'function') {
        window.TallerApp.helpers.registrarGastoDia(costo, tipo === 'recarga_foco' ? 'operaciones' : 'mejoras');
    }
    if (tipo === 'recarga_foco') {
        if (typeof usaEstadosFisicosJugador === 'function' && !usaEstadosFisicosJugador()) {
            const impulsoAntes = (typeof ritmoTaller === 'object' && ritmoTaller)
                ? Math.round(ritmoTaller.impulso || 0)
                : 0;
            if (typeof asegurarRitmoTaller === 'function') asegurarRitmoTaller();
            if (typeof ritmoTaller === 'object' && ritmoTaller) {
                ritmoTaller.impulso = Math.min(100, Math.round((ritmoTaller.impulso || 0) + 10 + ((mejorasTacticas.bateria || 0) * 3)));
            }
            if (typeof obtenerResumenRitmoTaller === 'function') obtenerResumenRitmoTaller();
            if (typeof registrarProgresoNivel === 'function') registrarProgresoNivel(80, 'parcial');
            log(`Impulso operativo aplicado: taller ${impulsoAntes}% -> ${Math.round((ritmoTaller && ritmoTaller.impulso) || impulsoAntes)}%.`, 'exito');
            mostrarFeedbackGameplay('Impulso operativo activo: sube el ritmo del taller y empuja el siguiente bloque de casos.', 'ok');
        } else if (modoNiveles) {
            const estresAntes = estres;
            estres = Math.max(0, estres - (8 + ((mejorasTacticas.bateria || 0) * 2)));
            sueno = Math.max(0, sueno - 2);
            if (typeof registrarProgresoNivel === 'function') registrarProgresoNivel(80, 'parcial');
            log(`Impulso operativo aplicado: estres ${Math.round(estresAntes)} -> ${Math.round(estres)}.`, 'exito');
            mostrarFeedbackGameplay('Impulso operativo activo: taller mas estable y con mejor ritmo.', 'ok');
        } else {
            const focoAntes = focoDiaActual;
            const recarga = obtenerRecargaEnergiaDinamica();
            focoDiaActual = Math.min(focoDiaMax, focoDiaActual + recarga);
            estres = Math.max(0, estres - (4 + (mejorasTacticas.bateria || 0)));
            sueno = Math.max(0, sueno - 1);
            log(`Recarga aplicada: capacidad operativa +${focoDiaActual - focoAntes}.`, 'exito');
            mostrarFeedbackGameplay('Recarga aplicada. Tambien baja estres.', 'ok');
        }
    } else if (tipo === 'bateria') {
        mejorasTacticas.bateria += 1;
        if (typeof usaEstadosFisicosJugador === 'function' && !usaEstadosFisicosJugador()) {
            log(`Estabilizador instalado: las recargas operativas ganan potencia (nivel ${mejorasTacticas.bateria}).`, 'exito');
            mostrarFeedbackGameplay(`Estabilizador tecnico mejorado a nivel ${mejorasTacticas.bateria}.`, 'ok');
        } else {
            const focoMaxAntes = focoDiaMax;
            const nuevoMax = calcularFocoMaxDia();
            const delta = nuevoMax - focoDiaMax;
            focoDiaMax = nuevoMax;
            focoDiaActual = Math.min(focoDiaMax, focoDiaActual + Math.max(0, delta) + 2);
            log(`Estabilizador instalado: capacidad operativa ${focoMaxAntes} -> ${focoDiaMax}.`, 'exito');
            mostrarFeedbackGameplay(`Estabilizador tecnico mejorado a nivel ${mejorasTacticas.bateria}.`, 'ok');
        }
    } else if (tipo === 'recuperacion_equipo') {
        mejorasTacticas.recuperacionEquipo += 1;
        log(`Área de descanso mejorada a nivel ${mejorasTacticas.recuperacionEquipo}: la fatiga de mecánicos baja 12% por nivel.`, 'exito');
        mostrarFeedbackGameplay(`Área de descanso nivel ${mejorasTacticas.recuperacionEquipo}: menor gasto de energía y recuperación más rápida.`, 'ok');
    } else if (tipo === 'manual_hablar') {
        mejorasTacticas.manualHablar = true;
        log('Manual de entrevista activo: hablar con cliente da mas precision.', 'exito');
    } else if (tipo === 'scanner_dx') {
        mejorasTacticas.scannerDx = true;
        log('Scanner OBD activado: aumenta acierto tecnico y reduce errores de dictamen.', 'exito');
    } else if (tipo === 'flujo_reparacion') {
        mejorasTacticas.flujoReparacion = true;
        log('Flujo de reparacion activo: menos tiempo por trabajo y menos pausas por pieza.', 'exito');
    } else if (tipo === 'organizador_cola') {
        mejorasTacticas.organizadorCola = Math.min(10, (Number(mejorasTacticas.organizadorCola)||0) + 1); clientesEnEspera.forEach(function(c){ c.pacienciaCola = Math.min(100, (Number(c.pacienciaCola)||50) + 12 + mejorasTacticas.organizadorCola * 2); });
        log('Organizador de Cola activo: los clientes pierden menos paciencia.', 'exito');
    } else if (tipo === 'control_calidad') {
        mejorasTacticas.controlCalidad = Math.min(10, (Number(mejorasTacticas.controlCalidad)||0) + 1); log('Control de Calidad nivel ' + mejorasTacticas.controlCalidad + ' activo: reduce resultados parciales en reparaciones.', 'exito');
    } else if (tipo === 'fidelidad_clientes') {
        mejorasTacticas.fidelidadClientes = Math.min(10, (Number(mejorasTacticas.fidelidadClientes)||0) + 1); reputacion += 4 + mejorasTacticas.fidelidadClientes; log('Programa de Fidelidad nivel ' + mejorasTacticas.fidelidadClientes + ' activo.', 'exito');
    } else if (tipo === 'ahorro_operativo') {
        mejorasTacticas.ahorroOperativo = Math.min(10, (Number(mejorasTacticas.ahorroOperativo)||0) + 1); log('Plan de Ahorro nivel ' + mejorasTacticas.ahorroOperativo + ' activo: reduce gastos operativos futuros.', 'exito');
    }

    // recalcularCostosTacticos();
    if (tipo !== 'recarga_foco') log(`Compraste ${nombre} por RD$${costo}.`, 'exito');
    mostrarStamp('APROBADO', 'ok');
    consumirTurno('compra tactica', tipo === 'recarga_foco' ? 1 : COSTOS_TURNO.mejorar);
    if (tipo !== 'recarga_foco') notificarCompraMejoraTelefono(tipo, nombre, costo);
    sincronizarCompraMejoraUI();
}

function pagarDeuda(cantidad) {
    let realizado = false;
    const montoObjetivo = Math.max(0, Math.round(cantidad || 0));
    const montoPago = Math.min(montoObjetivo, Math.max(0, Math.round(deuda || 0)));
    if (montoPago <= 0) {
        log('No hay deuda pendiente para pagar.', 'info');
        actualizarUI();
        return;
    }
    if (saldo >= montoPago) {
        if (!consumirFoco('banco')) return;
        saldo -= montoPago;
        if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarGastoDia === 'function') {
            window.TallerApp.helpers.registrarGastoDia(montoPago, 'banco');
        }
        deuda = Math.max(0, deuda - montoPago);
        if (typeof registrarPagoBanco === 'function') registrarPagoBanco(montoPago);
        if (deuda <= 0) {
            bancoCasosSinPago = 0;
            bancoMorasAplicadas = 0;
            bancoCreditoUsado = 0;
        }
        if (deuda <= 0 && typeof mostrarFeedbackGameplay === 'function') {
            mostrarFeedbackGameplay('Deuda bancaria saldada. Tu linea de credito vuelve a estar disponible.', 'ok');
        }
        if (typeof registrarEventoNarrativo === 'function') {
            registrarEventoNarrativo('deuda_pagada', { monto: montoPago, deudaRestante: deuda });
        }
        log(`Pagaste RD$${montoPago} de deuda.`, 'exito');
        realizado = true;
    } else {
        log(`No tienes suficiente saldo para pagar RD$${montoPago}.`, 'error');
    }
    if (realizado) consumirTurno('gestion bancaria', COSTOS_TURNO.banco);
    else actualizarUI();
    actualizarIndicadoresBancoUI();
    if (realizado && typeof autoGuardarPartidaSilenciosa === 'function') {
        autoGuardarPartidaSilenciosa('pago-deuda');
    }
}

function pedirPrestamo(cantidad) {
    if (!consumirFoco('banco')) return;
    var disponible = (typeof obtenerCreditoDisponibleBanco === 'function')
        ? Math.max(0, Math.round(obtenerCreditoDisponibleBanco()))
        : Math.max(0, Math.round((deuda || 0) + 5000) - Math.round(deuda || 0));
    var montoSolicitado = Math.max(0, Math.round(cantidad || 0));
    if (disponible <= 0) {
        log('Credito bloqueado: alcanzaste el limite del banco.', 'error');
        actualizarUI();
        return;
    }
    if (montoSolicitado > disponible) {
        log(`Credito insuficiente para RD$${montoSolicitado}. Disponible: RD$${disponible}.`, 'error');
        actualizarUI();
        return;
    }
    var interes = (window.TallerApp && window.TallerApp.config && window.TallerApp.config.bancoInteresPrestamoRapido)
        ? Number(window.TallerApp.config.bancoInteresPrestamoRapido)
        : 0.12;

    saldo += montoSolicitado;
    if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarIngresoDia === 'function') {
        window.TallerApp.helpers.registrarIngresoDia(montoSolicitado, 'prestamos');
    }
    deuda += Math.round(montoSolicitado * (1 + interes));
    bancoCreditoUsado = Math.max(0, Math.round((bancoCreditoUsado || 0) + montoSolicitado));
    log(`Prestamo de RD$${montoSolicitado} recibido. Deuda aumenta con interes del ${Math.round(interes * 100)}%.`, 'info');
    consumirTurno('gestion bancaria', COSTOS_TURNO.banco);
    actualizarIndicadoresBancoUI();
}

function actualizarIndicadoresBancoUI() {
    var deudaSegura = Math.max(0, Math.round(deuda || 0));
    var deudaModal = document.getElementById('banco-deuda');
    if (deudaModal) deudaModal.innerText = formatoDineroBanco(deudaSegura);
    var deudaExt = document.getElementById('ext-deuda');
    if (deudaExt) deudaExt.innerText = deudaSegura;
    var deudaTop = document.getElementById('ext-deuda-top');
    if (deudaTop) deudaTop.innerText = 'RD$' + deudaSegura;
    if (typeof actualizarUI === 'function') actualizarUI();
    if (typeof actualizarScreenExterior === 'function') actualizarScreenExterior();
}

function tomarCerveza() {
    if (typeof usaEstadosFisicosJugador === 'function' && !usaEstadosFisicosJugador()) {
        log('El bar no aporta al loop por casos. Usa mejoras tacticas, banco o soporte al equipo.', 'info');
        if (typeof mostrarFeedbackGameplay === 'function') {
            mostrarFeedbackGameplay('Accion omitida: la cerveza no impacta el modo por casos.', 'info');
        }
        if (typeof cerrarModal === 'function') cerrarModal();
        return;
    }
    if (saldo < 150) {
        log('No tienes dinero', 'error');
        return;
    }
    if (!consumirFoco('bar')) return;
    saldo -= 150;
    if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarGastoDia === 'function') {
        window.TallerApp.helpers.registrarGastoDia(150, 'bar');
    }
    estres = Math.max(0, estres - 20);
    sueno = Math.min(100, sueno + 10);
    log('Cerveza: -20 estres, +10 sueno', 'exito');
    consumirTurno('bar cerveza', COSTOS_TURNO.bar);
    cerrarModal();
}

function jugarPool() {
    if (saldo < 100) {
        log('No tienes dinero', 'error');
        return;
    }
    if (!consumirFoco('bar')) return;
    saldo -= 100;
    if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarGastoDia === 'function') {
        window.TallerApp.helpers.registrarGastoDia(100, 'bar');
    }
    if (Math.random() < 0.4) {
        let gana = 200 + Math.random() * 300;
        saldo += gana;
        if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarIngresoDia === 'function') {
            window.TallerApp.helpers.registrarIngresoDia(Math.round(gana), 'juegos');
        }
        log(`Ganaste! +RD$${Math.round(gana)}`, 'exito');
    } else {
        log('Perdiste. Suerte para la proxima', 'error');
    }
    consumirTurno('bar pool', COSTOS_TURNO.bar);
    cerrarModal();
}

function finalizarJuego() {
    detenerTimer();
    document.getElementById('game').classList.add('hidden');
    var pantallaFinalEl = document.getElementById('pantalla-final');
    pantallaFinalEl.classList.remove('hidden');
    sincronizarPausaJuego();
    let titulo, desc, tono = 'neutral', sello = 'Veredicto';
    const lealtadTotal = mecanicos.reduce((acc, m) => acc + m.lealtad, 0);
    const deudaInterna = mecanicos.reduce((acc, m) => acc + m.deudaConTaller, 0);
    const capitalNarrativo = tramaEstado.clientesFrecuentesGanados + tramaEstado.urgenciasResueltas + tramaEstado.primerizosGuiados;
    const presionLegal = tramaEstado.inspectorGolpes + tramaEstado.inspectorSobornos + (cajaB >= 900 ? 2 : 0);
    const casosCompletados = (typeof obtenerCasosCompletadosNarrativa === 'function')
        ? Math.max(0, Math.round(obtenerCasosCompletadosNarrativa() || 0))
        : 0;

    if (deuda <= 0 && lealtadTotal >= 5 && decisionesHistoria.prestamosAprobados >= 2 && decisionesHistoria.acuerdosBarrio >= 3 && capitalNarrativo >= 5) {
        titulo = 'FINAL: FAMILIA DE ACERO';
        desc = 'Pagaste la deuda y construiste lealtad real. El equipo te respalda y el taller se vuelve referencia del barrio.';
        tono = 'success';
        sello = 'Legado';
    } else if (deuda <= 1200 && capitalNarrativo >= 7 && tramaEstado.casosCriticosResueltos >= 8) {
        titulo = 'FINAL: LEYENDA DEL BARRIO';
        desc = 'No solo sobreviviste: convertiste historias pequenas en reputacion gigante. El barrio defiende tu taller como propio.';
        tono = 'success';
        sello = 'Barrio';
    } else if (decisionesHistoria.atajosOscuros >= 5 && deuda > 0) {
        titulo = 'FINAL: VICTORIA GRIS';
        desc = 'Sobreviviste con atajos y favores turbios. El taller sigue abierto, pero tu nombre quedo marcado.';
        tono = 'danger';
        sello = 'Riesgo';
    } else if (presionLegal >= 5 && cajaB > 0) {
        titulo = 'FINAL: AUDITORIA FATAL';
        desc = 'Los ingresos por detras explotaron en tu contra. El taller sigue de pie, pero bajo sanciones y vigilancia.';
        tono = 'danger';
        sello = 'Sancion';
    } else if (deuda <= 0) {
        titulo = 'IMPERIO MECANICO';
        desc = 'Has pagado toda la deuda. Tu taller es un emblema en la ciudad.';
        tono = 'success';
        sello = 'Expansion';
    } else if (decisionesHistoria.peleasOcurridas >= 4 || lealtadTotal <= -3) {
        titulo = 'FINAL: MOTIN EN EL TALLER';
        desc = 'Las rivalidades explotaron. El equipo se rompio y perdiste el control del taller.';
        tono = 'danger';
        sello = 'Colapso';
    } else if (deudaInterna > 1800 && decisionesHistoria.favoresPerdidos > decisionesHistoria.favoresCobrados) {
        titulo = 'FINAL: MALOS PRESTAMOS';
        desc = 'Ayudaste al equipo, pero no recuperaste el dinero. Sobrevives, con cuentas internas ahogando el negocio.';
        tono = 'warning';
        sello = 'Deuda';
    } else if (reputacion >= 80) {
        titulo = 'TALLER DE CONFIANZA';
        desc = 'Aun debes dinero, pero tu reputacion es solida. Sobreviviras.';
        tono = 'warning';
        sello = 'Resistencia';
    } else if (saldo < 0) {
        titulo = 'BANCARROTA';
        desc = 'Perdiste el taller. Valeria se quedo con todo.';
        tono = 'danger';
        sello = 'Caida';
    } else {
        titulo = 'FIN DE LA AVENTURA';
        desc = 'El juicio termino. Tu futuro es incierto.';
    }
    document.getElementById('final-titulo').innerText = titulo;
    document.getElementById('final-desc').innerText = desc;
    pantallaFinalEl.setAttribute('data-final-tone', tono);
    var selloEl = document.getElementById('final-tone-pill');
    if (selloEl) selloEl.innerText = sello;
    var deudaEl = document.getElementById('final-stat-deuda');
    if (deudaEl) deudaEl.innerText = 'RD$' + Math.max(0, Math.round(deuda || 0));
    var saldoEl = document.getElementById('final-stat-saldo');
    if (saldoEl) saldoEl.innerText = 'RD$' + Math.max(0, Math.round(saldo || 0));
    var repEl = document.getElementById('final-stat-reputacion');
    if (repEl) repEl.innerText = Math.max(0, Math.round(reputacion || 0));
    var equipoEl = document.getElementById('final-stat-equipo');
    if (equipoEl) equipoEl.innerText = Array.isArray(mecanicos) ? mecanicos.length : 0;
    var tallerEl = document.getElementById('final-stat-taller');
    if (tallerEl) tallerEl.innerText = Math.max(1, Math.round(tallerNivel || 1));
    var casosEl = document.getElementById('final-stat-casos');
    if (casosEl) casosEl.innerText = casosCompletados;
}

cargarOpciones();
aplicarEditorInterfazGuardadoAlIniciar();
document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const hayModalAbierto = Array.from(document.querySelectorAll('.modal-overlay')).some(function(el) {
        return !el.classList.contains('hidden');
    });
    if (hayModalAbierto) {
        cerrarModal();
        return;
    }
    if (!document.getElementById('pantalla-taller').classList.contains('hidden')) {
        abrirMenuPausa();
    }
});
document.querySelectorAll('.modal-overlay').forEach(function(modal) {
    modal.addEventListener('click', function(e) {
        if (e.target === modal) cerrarModal();
    });
});
window.addEventListener('resize', () => aplicarTabsMovil());
document.addEventListener('fullscreenchange', actualizarBotonesPantallaCompletaMovil);
document.addEventListener('webkitfullscreenchange', actualizarBotonesPantallaCompletaMovil);
document.addEventListener('MSFullscreenChange', actualizarBotonesPantallaCompletaMovil);
recalcularCostosTacticos();
resetearEventosDelDia();
const forzarNueva = (STORAGE_UTILS && typeof STORAGE_UTILS.readRaw === 'function')
    ? STORAGE_UTILS.readRaw(STORAGE_KEYS.forceNewSession || 'tw_force_new', 'session') === '1'
    : sessionStorage.getItem('tw_force_new') === '1';
const menuInicioPrincipalEl = document.getElementById('menu-inicio');
console.log('[TALLER] Estado flag forzarNueva:', forzarNueva);
if (menuInicioPrincipalEl) {
    console.log('[TALLER] Estado inicial menu-inicio hidden:', menuInicioPrincipalEl.classList.contains('hidden'));
} else {
    console.log('[TALLER] menu-inicio NO EXISTE en el DOM');
}
// Refuerzo: si el flag de nueva partida está activo, oculta el menú de inicio inmediatamente
if (menuInicioPrincipalEl && (forzarNueva || menuInicioPrincipalEl.classList.contains('hidden'))) {
    menuInicioPrincipalEl.classList.add('hidden');
    console.log('[TALLER] Ocultando menu-inicio por flag forzarNueva o ya oculto');
}
let restauradaAutomaticamente = false;
if (!forzarNueva && typeof cargarPartidaSilenciosaInicial === 'function') {
    restauradaAutomaticamente = cargarPartidaSilenciosaInicial();
}
const debeAutoIniciarSinMenu = forzarNueva || (!restauradaAutomaticamente && !menuInicioPrincipalEl);

// Randomize initial mechanics for each new game
function randomizarMecanicosIniciales(cantidad = 2) {
    if (!window.TallerData || !Array.isArray(window.TallerData.mecanicosDisponiblesBase)) return;
    // La plantilla fija solo sirve como catálogo. La partida nueva elige dos
    // perfiles distintos de todo el personal disponible, incluidos Frandy y
    // Maicol, para que no siempre empiece con la misma pareja.
    const catalogo = [];
    (Array.isArray(window.TallerData.mecanicosIniciales) ? window.TallerData.mecanicosIniciales : [])
        .concat(window.TallerData.mecanicosDisponiblesBase)
        .forEach(function(m) {
            if (!m || !m.nombre || catalogo.some(function(x) { return x.nombre === m.nombre; })) return;
            catalogo.push(m);
        });
    const pool = catalogo.slice();
    if (pool.length < cantidad) return;
    // Shuffle pool
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    // Pick N random mechanics
    const seleccionados = pool.slice(0, cantidad).map(m => ({ ...m }));
    window.TallerData.mecanicosIniciales = seleccionados;
}

function mostrarJuegoYArrancarPartidaNueva() {
    randomizarMecanicosIniciales(2);
    var menuInicioEl = document.getElementById('menu-inicio');
    if (menuInicioEl) menuInicioEl.classList.add('hidden');
    var editorPersonajesEl = document.getElementById('editor-personajes');
    if (editorPersonajesEl) editorPersonajesEl.classList.add('hidden');
    document.getElementById('game').classList.remove('hidden');
    // Iniciar juego directamente, sin tutorial
    iniciarJuegoReal();
}



if (forzarNueva) {
    if (menuInicioPrincipalEl) menuInicioPrincipalEl.classList.add('hidden');
    document.getElementById('game').classList.remove('hidden');
    mostrarJuegoYArrancarPartidaNueva();
    // IMPORTANTE: Elimina el flag SOLO después de arrancar completamente la nueva partida
    setTimeout(function() {
        if (STORAGE_UTILS && typeof STORAGE_UTILS.remove === 'function') {
            STORAGE_UTILS.remove(STORAGE_KEYS.forceNewSession || 'tw_force_new', 'session');
        } else {
            sessionStorage.removeItem('tw_force_new');
        }
        console.log('[TALLER] Flag forzarNueva eliminado tras iniciar partida');
    }, 500);
} else if (restauradaAutomaticamente) {
    var menuInicioRestauradoEl = typeof obtenerMenuInicioEl === 'function'
        ? obtenerMenuInicioEl()
        : document.getElementById('menu-inicio');
    if (menuInicioRestauradoEl) {
        menuInicioRestauradoEl.classList.add('hidden');
        console.log('[TALLER] Ocultando menu-inicio tras restaurar partida automáticamente');
    } else {
        console.log('[TALLER] No se encontró menu-inicio para ocultar tras restaurar');
    }
    document.getElementById('game').classList.remove('hidden');
    console.log('[TALLER] Mostrando juego tras restaurar partida');
} else if (debeAutoIniciarSinMenu) {
    if (menuInicioPrincipalEl) {
        menuInicioPrincipalEl.classList.add('hidden');
        console.log('[TALLER] Ocultando menu-inicio por debeAutoIniciarSinMenu');
    } else {
        console.log('[TALLER] No se encontró menu-inicio para ocultar por debeAutoIniciarSinMenu');
    }
    document.getElementById('game').classList.remove('hidden');
    console.log('[TALLER] Mostrando juego por debeAutoIniciarSinMenu');
    mostrarJuegoYArrancarPartidaNueva();
} else {
    // Solo mostrar el menú si no está forzada nueva partida y no está oculto
    // Refuerzo: nunca mostrar el menú si forzarNueva sigue activo
    if (menuInicioPrincipalEl && !forzarNueva && !menuInicioPrincipalEl.classList.contains('hidden')) {
        menuInicioPrincipalEl.classList.remove('hidden');
        console.log('[TALLER] Mostrando menu-inicio (no forzarNueva y no oculto)');
    } else if (forzarNueva) {
        if (menuInicioPrincipalEl) menuInicioPrincipalEl.classList.add('hidden');
        console.log('[TALLER] Previniendo mostrar menu-inicio porque forzarNueva sigue activo');
    } else {
        console.log('[TALLER] No se muestra menu-inicio (forzarNueva:', forzarNueva, ', hidden:', menuInicioPrincipalEl && menuInicioPrincipalEl.classList.contains('hidden'), ')');
    }
    document.getElementById('game').classList.add('hidden');
    console.log('[TALLER] Ocultando juego, mostrando menú de inicio');
}
if (typeof actualizarEstadoMenuInicio === 'function') actualizarEstadoMenuInicio();
aplicarTabsMovil();
actualizarBotonesPantallaCompletaMovil();
actualizarUI();

// ============================================
// HERRAMIENTAS DE DEBUG: PRUEBA E2E Y BALANCE
// ============================================
function esperarTestTaller(ms) {
    return new Promise(function(resolve) { setTimeout(resolve, ms); });
}

function capturarSnapshotBalanceTaller() {
    return {
        saldo: Math.round(window.saldo || 0),
        deuda: Math.round(window.deuda || 0),
        reputacion: Math.round(window.reputacion || 0),
        combo: (window.ritmoTaller && Math.round(window.ritmoTaller.combo || 0)) || 0,
        impulso: (window.ritmoTaller && Math.round(window.ritmoTaller.impulso || 0)) || 0,
        casos: (window.resumenCasos && window.resumenCasos.totalCasosJugados) || 0
    };
}

function desbloquearNarrativaBalanceTaller() {
    if (typeof obtenerPendientesNarrativaTelefono !== 'function') return;
    var pendientes = obtenerPendientesNarrativaTelefono();
    pendientes.forEach(function(p) { p.resuelta = true; });
}

function prepararEntornoBalanceTaller(paralelos) {
    if (!Array.isArray(window.mecanicos) || window.mecanicos.length === 0) {
        return false;
    }
    window.saldo += 40000;
    window.repartidoresMax = Math.max(window.repartidoresMax || 1, paralelos || 2);
    if (typeof asegurarStatsRepartidores === 'function') asegurarStatsRepartidores();
    if (typeof asegurarRitmoTaller === 'function') asegurarRitmoTaller();
    desbloquearNarrativaBalanceTaller();
    return true;
}

function desbloquearMecanicosBalanceTaller(paralelos) {
    var maximo = Math.max(1, Math.round(paralelos || 2));
    (window.mecanicos || []).slice(0, maximo).forEach(function(m) {
        if (!m) return;
        m.ocupado = false;
        m.enfriamientoTurnos = 0;
        m.bloqueoAyudaTurnos = 0;
        m.bloqueadoHastaDia = 0;
        m.renunciaInminente = false;
        m.enojo = Math.min(1, Math.max(0, Math.round(m.enojo || 0)));
    });
}

function asegurarCasosBalanceTaller(minimo) {
    if (!window.clientesEnEspera) window.clientesEnEspera = [];
    var guard = 0;
    while ((((window.clienteActual && !((window.reparacionesActivas || []).some(function(r) { return r && window.clienteActual && r.idCaso === window.clienteActual.idCaso; }))) ? 1 : 0) + window.clientesEnEspera.length) < minimo && guard < (minimo * 6)) {
        if (typeof generarClienteEnCola === 'function') generarClienteEnCola();
        else if (typeof generarCliente === 'function') generarCliente();
        guard += 1;
    }
}

function construirTablaSensacionesBalanceTaller(detalle) {
    function resumirZona(nombre, lista) {
        if (!lista.length) return null;
        var criticos = lista.filter(function(d) { return d.nivelResultado === 'critico'; }).length;
        var parciales = lista.filter(function(d) { return d.nivelResultado === 'parcial'; }).length;
        var fallos = lista.filter(function(d) { return d.nivelResultado === 'fallo'; }).length;
        var dinero = Math.round(lista.reduce(function(acc, d) { return acc + (d.dineroCaso || 0); }, 0) / Math.max(1, lista.length));
        var comboPost = Math.round((lista.reduce(function(acc, d) { return acc + (d.comboPost || 0); }, 0) / Math.max(1, lista.length)) * 10) / 10;
        var lectura = 'sano';
        if (fallos > criticos) lectura = 'fragil';
        else if (dinero >= 1800) lectura = 'muy rentable';
        else if (dinero <= 600) lectura = 'apretado';
        return {
            tramo: nombre,
            casos: lista.length,
            criticos: criticos,
            parciales: parciales,
            fallos: fallos,
            gananciaMedia: dinero,
            comboPostMedio: comboPost,
            lectura: lectura
        };
    }

    return [
        resumirZona('Combo bajo', detalle.filter(function(d) { return d.comboPrev <= 1 && d.nivelResultado !== 'no_cerrado'; })),
        resumirZona('Combo medio', detalle.filter(function(d) { return d.comboPrev >= 2 && d.comboPrev <= 3 && d.nivelResultado !== 'no_cerrado'; })),
        resumirZona('Combo alto', detalle.filter(function(d) { return d.comboPrev >= 4 && d.nivelResultado !== 'no_cerrado'; })),
        resumirZona('Recuperacion tras fallo', detalle.filter(function(d, idx) { return idx > 0 && detalle[idx - 1].nivelResultado === 'fallo' && d.nivelResultado !== 'no_cerrado'; }))
    ].filter(Boolean);
}

window.testBalanceTaller = async function(totalCasos, opciones) {
    var cfg = opciones || {};
    var objetivo = Math.max(4, Math.min(40, Math.round(totalCasos || 16)));
    var paralelos = Math.max(1, Math.min(2, Math.round(cfg.paralelos || 2)));
    var waitMs = Math.max(0, Math.round(cfg.waitMs || 120));
    var detalle = [];
    var lotes = 0;
    var inicial = capturarSnapshotBalanceTaller();

    console.log('%c[Balance] Iniciando prueba de ' + objetivo + ' casos...', 'color: #4a8fcf; font-weight: bold; font-size: 13px;');
    if (!prepararEntornoBalanceTaller(paralelos)) {
        return {
            resumen: {
                objetivoCasos: objetivo,
                casosCerrados: 0,
                error: 'Inicia una partida antes de ejecutar la prueba de balance.'
            },
            tablaSensaciones: [],
            detalle: []
        };
    }

    while (detalle.length < objetivo && lotes < (objetivo * 3)) {
        lotes += 1;
        desbloquearNarrativaBalanceTaller();
        desbloquearMecanicosBalanceTaller(paralelos);
        asegurarCasosBalanceTaller(paralelos);

        var asignados = [];
        for (var idx = 0; idx < paralelos; idx += 1) {
            if (!window.clienteActual) {
                if ((window.clientesEnEspera || []).length > 0 && typeof seleccionarClienteCola === 'function') {
                    seleccionarClienteCola(0, false);
                } else if (typeof generarCliente === 'function') {
                    generarCliente();
                }
            }

            if (!window.clienteActual) continue;
            var snapshotPrevio = capturarSnapshotBalanceTaller();
            var casoActivo = window.clienteActual;
            var casoMeta = {
                lote: lotes,
                idCaso: casoActivo.idCaso || ('CASO-TEST-' + lotes + '-' + idx),
                mecanicoIdx: idx,
                mecanicoNombre: window.mecanicos && window.mecanicos[idx] ? window.mecanicos[idx].nombre : ('Mecanico ' + idx),
                comboPrev: snapshotPrevio.combo,
                impulsoPrev: snapshotPrevio.impulso,
                casoCaliente: !!casoActivo.casoCaliente,
                cadenaActiva: !!casoActivo.cadenaEspecialidadActiva,
                especialidad: casoActivo.especialidadIdeal || ''
            };
            var dxOk = typeof diagnosticarConMecanico === 'function' ? diagnosticarConMecanico(idx) : false;
            if (dxOk) asignados.push(casoMeta);
        }

        if (!asignados.length) break;

        if (Array.isArray(window.reparacionesActivas)) {
            window.reparacionesActivas.forEach(function(rep) {
                if (rep && rep.tipoTrabajo === 'diagnostico') {
                    forzarProgresoTrabajoActivo(rep, false);
                }
            });
        }
        if (typeof procesarReparacionesActivas === 'function') procesarReparacionesActivas();
        if (typeof actualizarUI === 'function') actualizarUI();
        await esperarTestTaller(waitMs);

        asignados.forEach(function(casoMeta, slot) {
            if (typeof iniciarPedidoPiezasConDelivery === 'function') {
                var pedido = iniciarPedidoPiezasConDelivery(casoMeta.idCaso, slot % Math.max(1, window.repartidoresMax || 1));
                if (pedido && typeof confirmarPagarDelivery === 'function') confirmarPagarDelivery(casoMeta.idCaso);
            }
        });

        if (Array.isArray(window.entregasPiezasActivas)) {
            window.entregasPiezasActivas.forEach(function(entrega) {
                if (entrega) forzarProgresoTrabajoActivo(entrega, true);
            });
        }
        if (typeof procesarEntregasPiezasActivas === 'function') procesarEntregasPiezasActivas();
        if (typeof actualizarUI === 'function') actualizarUI();
        await esperarTestTaller(waitMs);

        if (Array.isArray(window.reparacionesActivas)) {
            window.reparacionesActivas.forEach(function(rep) {
                if (rep && rep.tipoTrabajo === 'reparacion') {
                    forzarProgresoTrabajoActivo(rep, false);
                }
            });
        }
        if (typeof procesarReparacionesActivas === 'function') procesarReparacionesActivas();

        for (var casoIdx = 0; casoIdx < asignados.length && detalle.length < objetivo; casoIdx += 1) {
            var casoMeta = asignados[casoIdx];
            var rep = (window.reparacionesActivas || []).find(function(r) {
                return r && r.idCaso === casoMeta.idCaso;
            }) || null;
            if (!rep) {
                detalle.push(Object.assign({}, casoMeta, {
                    nivelResultado: 'no_cerrado',
                    dineroCaso: 0,
                    saldoDelta: 0,
                    reputacionDelta: 0,
                    comboPost: capturarSnapshotBalanceTaller().combo,
                    impulsoPost: capturarSnapshotBalanceTaller().impulso,
                    retornoGenerado: false
                }));
                continue;
            }

            if (!rep.resultadoVisible && typeof verResultadoReparacionLista === 'function') {
                verResultadoReparacionLista(casoMeta.idCaso, { sinModal: true });
            }

            var before = capturarSnapshotBalanceTaller();
            var nivelResultado = rep.nivelResultado || (rep.exito ? 'critico' : 'fallo');
            var dineroCaso = nivelResultado === 'fallo'
                ? -Math.round(rep.perdida || 0)
                : Math.round(rep.ganancia || 0);
            var cobro = typeof procesarCobroReparacionDirecto === 'function'
                ? procesarCobroReparacionDirecto(casoMeta.idCaso)
                : { ok: false, mensaje: 'Cobro no disponible' };
            var after = capturarSnapshotBalanceTaller();

            detalle.push(Object.assign({}, casoMeta, {
                nivelResultado: nivelResultado,
                dineroCaso: dineroCaso,
                saldoDelta: after.saldo - before.saldo,
                reputacionDelta: after.reputacion - before.reputacion,
                comboPost: after.combo,
                impulsoPost: after.impulso,
                retornoGenerado: /Retorno encadenado/.test(String((cobro && cobro.mensaje) || '')),
                mensaje: String((cobro && cobro.mensaje) || '')
            }));
        }

        if (typeof actualizarUI === 'function') actualizarUI();
        await esperarTestTaller(waitMs);
    }

    var final = capturarSnapshotBalanceTaller();
    var casosCerrados = detalle.filter(function(d) { return d.nivelResultado !== 'no_cerrado'; });
    var resumen = {
        objetivoCasos: objetivo,
        casosCerrados: casosCerrados.length,
        criticos: casosCerrados.filter(function(d) { return d.nivelResultado === 'critico'; }).length,
        parciales: casosCerrados.filter(function(d) { return d.nivelResultado === 'parcial'; }).length,
        fallos: casosCerrados.filter(function(d) { return d.nivelResultado === 'fallo'; }).length,
        gananciaNeta: final.saldo - inicial.saldo,
        deudaDelta: final.deuda - inicial.deuda,
        reputacionDelta: final.reputacion - inicial.reputacion,
        comboMaximo: detalle.reduce(function(acc, d) { return Math.max(acc, d.comboPost || 0); }, 0),
        impulsoMaximo: detalle.reduce(function(acc, d) { return Math.max(acc, d.impulsoPost || 0); }, 0),
        retornosGenerados: detalle.filter(function(d) { return d.retornoGenerado; }).length,
        casosCalientesJugados: detalle.filter(function(d) { return d.casoCaliente; }).length
    };
    var tablaSensaciones = construirTablaSensacionesBalanceTaller(casosCerrados);

    console.table(casosCerrados.map(function(d) {
        return {
            caso: d.idCaso,
            resultado: d.nivelResultado,
            comboPrev: d.comboPrev,
            comboPost: d.comboPost,
            impulsoPost: d.impulsoPost,
            dinero: d.dineroCaso,
            caliente: d.casoCaliente ? 'si' : 'no',
            cadena: d.cadenaActiva ? 'si' : 'no',
            retorno: d.retornoGenerado ? 'si' : 'no'
        };
    }));
    console.table(tablaSensaciones);
    console.log('%c[Balance] Resumen final', 'color: #4aa36a; font-weight: bold;', resumen);

    return {
        resumen: resumen,
        tablaSensaciones: tablaSensaciones,
        detalle: detalle
    };
};

window.testGameLoop = async function() {
    return window.testBalanceTaller(2, { paralelos: 2, waitMs: 120 });
};

// Botón flotante para ejecutar test en desarrollo
const MOSTRAR_BOTON_TEST_LOOP = false;
if (MOSTRAR_BOTON_TEST_LOOP) {
    let devBtn = document.createElement('button');
    devBtn.innerText = '🚀 Test Loop';
    devBtn.style.position = 'fixed';
    devBtn.style.top = '10px';
    devBtn.style.left = '50%';
    devBtn.style.transform = 'translateX(-50%)';
    devBtn.style.zIndex = '9999';
    devBtn.style.background = '#e67e22';
    devBtn.style.color = '#fff';
    devBtn.style.border = 'none';
    devBtn.style.padding = '8px 16px';
    devBtn.style.borderRadius = '20px';
    devBtn.style.fontWeight = 'bold';
    devBtn.style.cursor = 'pointer';
    devBtn.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
    devBtn.onclick = function() {
        devBtn.innerText = '⏳ Ejecutando...';
        devBtn.style.background = '#7f8c8d';
        window.testGameLoop().then(() => {
            devBtn.innerText = '✅ Finalizado';
            devBtn.style.background = '#27ae60';
            setTimeout(() => {
                devBtn.innerText = '🚀 Test Loop';
                devBtn.style.background = '#e67e22';
            }, 3000);
        });
    };
    document.body.appendChild(devBtn);
}

// configurarBloqueoMovil() eliminado — el juego es ahora responsive
