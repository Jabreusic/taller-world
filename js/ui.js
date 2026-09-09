
// --- Seguridad: asegurar que window.mecanicos siempre tenga datos válidos ---
function asegurarMecanicosGlobal() {
  if (typeof window === 'undefined') return;
  if (!Array.isArray(window.mecanicos) || window.mecanicos.length === 0) {
    if (window.TallerData && Array.isArray(window.TallerData.mecanicosIniciales) && window.TallerData.mecanicosIniciales.length > 0) {
      window.mecanicos = window.TallerData.mecanicosIniciales.map(m => ({ ...m }));
    } else if (window.MECANICOS_BASE && Array.isArray(window.MECANICOS_BASE)) {
      window.mecanicos = window.MECANICOS_BASE.map(m => ({ ...m }));
    } else {
      window.mecanicos = [];
    }
  }
}

function setInnerTextIfPresent(id, value) {
  var el = document.getElementById(id);
  if (el) el.innerText = value;
  return el;
}

// --- SFX helpers ---
function sfxClick() { playSfx && playSfx('click'); }
function sfxAssign() { playSfx && playSfx('assign'); }
function sfxSuccess() { playSfx && playSfx('case_success'); }
function sfxFail() { playSfx && playSfx('case_fail'); }
function sfxProgress() { playSfx && playSfx('progress'); }
function sfxLevelUp() { playSfx && playSfx('level_up'); }
function sfxNotify() { playSfx && playSfx('notify'); }
function sfxConfirm() { playSfx && playSfx('confirm'); }
function sfxReject() { playSfx && playSfx('reject'); }
function sfxMenuOpen() { playSfx && playSfx('menu_open'); }
function sfxMenuClose() { playSfx && playSfx('menu_close'); }
function sfxClientArrive() { playSfx && playSfx('client_arrive'); }
function sfxCarDelivered() { playSfx && playSfx('car_delivered'); }
function sfxBonus() { playSfx && playSfx('bonus'); }
function sfxWarning() { playSfx && playSfx('warning'); }

function obtenerMenuInicioEl() {
  if (typeof document === "undefined") return null;
  var menuPrincipal = document.getElementById("menu-inicio");
  if (menuPrincipal) return menuPrincipal;
  var editor = document.getElementById("editor-personajes");
  if (editor && !editor.classList.contains("hidden")) return editor;
  return document.querySelector(".menu-inicio:not(.hidden)");
}

function resumirPartidaGuardada(data) {
  if (!data || typeof data !== "object") {
    return {
      economiaValida: false,
      casoActivo: false,
      cola: 0,
      pendientesDx: 0,
      reparaciones: 0,
      casosAtendidos: 0,
      dia: 1,
      nivel: 1,
      progresoNivel: 0,
      estadoPantallas: {},
    };
  }
  return {
    economiaValida:
      Number.isFinite(Number(data.saldo)) || Number.isFinite(Number(data.deuda)),
    casoActivo: !!(data.clienteActual && typeof data.clienteActual === "object"),
    cola: Array.isArray(data.clientesEnEspera) ? data.clientesEnEspera.length : 0,
    pendientesDx: Array.isArray(data.casosPendientesDiagnostico)
      ? data.casosPendientesDiagnostico.length
      : 0,
    reparaciones: Array.isArray(data.reparacionesActivas)
      ? data.reparacionesActivas.length
      : 0,
    casosAtendidos: Array.isArray(data.casosAtendidos) ? data.casosAtendidos.length : 0,
    dia: Math.max(1, Math.round(Number(data.dia) || 1)),
    nivel: Math.max(1, Math.round(Number(data.nivelJugador) || 1)),
    progresoNivel: Math.max(0, Math.round(Number(data.progresoNivel) || 0)),
    estadoPantallas:
      data.estadoPantallas && typeof data.estadoPantallas === "object"
        ? data.estadoPantallas
        : {},
  };
}

function esPartidaGuardadaUtilizable(data) {
  var resumen = resumirPartidaGuardada(data);
  var estadoPantallas = resumen.estadoPantallas || {};
  var tienePantallaActiva = !!(
    estadoPantallas.historia ||
    estadoPantallas.taller ||
    estadoPantallas.cierre
  );
  var tieneProgreso = !!(
    resumen.casoActivo ||
    resumen.cola > 0 ||
    resumen.pendientesDx > 0 ||
    resumen.reparaciones > 0 ||
    resumen.casosAtendidos > 0 ||
    resumen.dia > 1 ||
    resumen.nivel > 1 ||
    resumen.progresoNivel > 0
  );
  return !!(resumen.economiaValida && (tieneProgreso || tienePantallaActiva));
}

function normalizarEstadoPantallasGuardado(data) {
  var estadoRaw =
    data && data.estadoPantallas && typeof data.estadoPantallas === "object"
      ? data.estadoPantallas
      : {};
  var historiaDisponible = !!document.getElementById("pantalla-historia");
  var cierreDisponible = !!document.getElementById("pantalla-cierre");
  var historia = historiaDisponible && !!estadoRaw.historia;
  var taller = !!estadoRaw.taller;
  var cierre = cierreDisponible && !!estadoRaw.cierre;

  if (!historia && !taller && !cierre) {
    taller = true;
  }

  if (cierre) {
    historia = false;
    taller = false;
  } else if (historia) {
    taller = false;
  } else {
    historia = false;
    cierre = false;
    taller = true;
  }

  return {
    historia: historia,
    taller: taller,
    cierre: cierre,
  };
}

function actualizarEstadoMenuInicio() {
  var btnContinuar = document.getElementById("menu-btn-continuar");
  var hint = document.getElementById("menu-save-hint");
  if (!btnContinuar && !hint) return false;

  var data = obtenerPartidaGuardadaParseada();
  var utilizable = esPartidaGuardadaUtilizable(data);
  if (btnContinuar) {
    btnContinuar.disabled = !utilizable;
    btnContinuar.setAttribute("aria-disabled", utilizable ? "false" : "true");
    btnContinuar.title = utilizable
      ? "Continuar partida guardada"
      : "No hay una partida válida para continuar";
  }
  if (hint) {
    hint.innerText = utilizable
      ? "Se detectó una partida válida guardada en este navegador."
      : "No hay una partida válida guardada en este navegador.";
  }
  return utilizable;
}

if (typeof window !== "undefined") {
  window.abrirPerfilDueno = abrirPerfilDueno;
  window.comprarMejoraDueno = comprarMejoraDueno;
  window.obtenerMenuInicioEl = obtenerMenuInicioEl;
  window.actualizarEstadoMenuInicio = actualizarEstadoMenuInicio;
}

// --- HUD reputación y dinero ---
function normalizarReputacionGlobal() {
  let repBase = typeof reputacion === 'number' ? reputacion : (window.jugadorReputacion || 0);
  let repNormalizada = Math.max(0, Math.min(100, Math.round(repBase || 0)));
  reputacion = repNormalizada;
  window.jugadorReputacion = repNormalizada;
  return repNormalizada;
}

function actualizarHUDReputacion() {
  let dinero = typeof saldo === 'number' ? saldo : (window.jugadorDinero || 0);
  let rep = normalizarReputacionGlobal();
  setInnerTextIfPresent('hud-dinero', 'RD$' + dinero);
  setInnerTextIfPresent('hud-reputacion', rep);
}

// Inicializar HUD reputación/dinero al cargar
document.addEventListener('DOMContentLoaded', function() {
  if (typeof actualizarHUDReputacion === 'function') actualizarHUDReputacion();
});
// --- HUD XP/Nivel ---
function actualizarHUDXP() {
  // XP y nivel en HUD superior
  let nivel = typeof nivelJugador === 'number' ? nivelJugador : (window.jugadorNivel || 1);
  let xp = typeof progresoNivel === 'number' ? progresoNivel : (window.jugadorXP || 0);
  let xpMeta = typeof progresoNivelMeta === 'number' ? progresoNivelMeta : (window.jugadorXPMeta || 1);
  setInnerTextIfPresent('hud-nivel', nivel);
  setInnerTextIfPresent('hud-exp', `XP ${xp}/${Math.max(1, xpMeta)}`);
}

document.addEventListener('DOMContentLoaded', function() {
  if (typeof actualizarHUDXP === 'function') actualizarHUDXP();
});

// Funciones globales y configuración inicial

// Variables globales necesarias para evitar ReferenceError
var malvaviscoAfinidad = 0;
var malvaviscoAlimentadoHoy = false;
var malvaviscoCasosCerrados = 0;
var malvaviscoUltimoEventoCasos = 0;
var hambre = 20;
var sueno = 20;
var estres = 10;
var focoDiaMax = 10;
var focoDiaActual = 10;
var turnoSegundos = 0;
var turnoActual = 0;
var autoTurnoCadaSeg = 30;
var modoRitmoJuego = "gestion";
var autoAvanceActivo = true;
var musicaFondoActiva = true;
var efectosSonidoActivos = true;
var notificacionesSistemaActivas = true;
var bancoCasosSinPago = 0;
var bancoCreditoUsado = 0;
var bancoMorasAplicadas = 0;
var ayudanteContratado = false;
var bonoAyudanteTiempo = 0;
var eventoDiario = { activado: false, descripcion: "" };
var modificadorHabilidadDiario = 0;
var multiplicadorPagoDiario = 1;
var eventoPeleaHoy = false;
var estrategiaCliente = "balanceado";
var rachaExitos = 0;
var rachaDiagnosticoPerfecto = 0;
var bonoFocoSiguienteCaso = 0;
var impactoHistoriaDiaAplicado = 0;
var modPeleaImpagoEmpleadosDia = 0;
var modFalloImpagoEmpleadosDia = 0;
var historiaPrincipalIndice;
var arcoNarrativoActual;
var arcosCumplidos;
var narrativaUltimoCasoProcesado = 0;
var ultimoMecanicoAsignado;
var cajaBCuposDisponibles = 1;
var cajaBUltimoHitoCasos = 0;
var cajaBCalor;
var cajaBUltimoControlInspectorCasos;
var clandestinoTrabajosHoy = 0;
var clandestinoUltimoTurno = -999;
var decisionesHistoria;
var misionDia = null;
var resumenDia = null;
var tramaEstado;
var eventosTurnoVistos = [];
var eventoNarrativoActivo;
var capituloNotificacionPendiente = null;
var eventosTurnoHoy = [];
var ultimoEventoTurno = 0;
var ultimoEventoCasos = 0;
var cierrePagoResuelto = true;
var cierreCostosPendientes = 0;
var cierreFacturasPendientes = null;
var penalizacionesDiaSiguiente = null;
var mejorasTacticas;
var mejoras;
var mejorasDueno = { puntos: 3, diagnostico: 0, negociacion: 0, energia: 0 };
var mejorasDuenoCargadas = false;
var tallerNivel;
var estadoCards = null;
var tabMovilActiva;
var moralEquipo;
var nivelJugador;
var progresoNivel;
var progresoNivelMeta;
var ahorroAcumulado;
var saldo;
var reputacion;
var deuda;
var cajaB;
var exRelacion;
var clienteActual;
var tiempoCliente = 0;
var ultimoTickRealMs = 0;
var mecanicos;
var mecanicosDisponibles;
var espaciosReparacionMax;
var reparacionesActivas;
var repartidoresMax;
var repartidoresStats;
var entregasPiezasActivas;
var clientesEnEspera;
var casosPendientesDiagnostico;
var casosAtendidos;
var experienciaVehiculoDx = {};
var historialClientes;
var inventarioPiezas;
var competenciaBarrioEstado = null;
var dia = 1;
var clientesHoy = 0;
var enfoqueDiagnostico = "general";
//

// Asegurar variables globales únicas
var estadoTaller = {
  get clientesEnEspera() { return clientesEnEspera; },
  set clientesEnEspera(valor) { clientesEnEspera = Array.isArray(valor) ? valor : []; },
  get reparacionesActivas() { return reparacionesActivas; },
  set reparacionesActivas(valor) { reparacionesActivas = Array.isArray(valor) ? valor : []; },
  get casosPendientesDiagnostico() { return casosPendientesDiagnostico; },
  set casosPendientesDiagnostico(valor) { casosPendientesDiagnostico = Array.isArray(valor) ? valor : []; },
  get entregasPiezasActivas() { return entregasPiezasActivas; },
  set entregasPiezasActivas(valor) { entregasPiezasActivas = Array.isArray(valor) ? valor : []; },
  get inventarioPiezas() { return inventarioPiezas; },
  set inventarioPiezas(valor) { inventarioPiezas = Array.isArray(valor) ? valor : []; },
  get clienteActual() { return clienteActual; },
  set clienteActual(valor) { clienteActual = valor && typeof valor === "object" ? valor : null; }
};
window.TallerApp = window.TallerApp || {};
window.TallerApp.estado = estadoTaller;
if (typeof window !== 'undefined') {
  if (typeof window.toolbarCasosTrabajoAbierto !== "boolean") {
    window.toolbarCasosTrabajoAbierto = true;
  }
}
var panelLateralActivo = "queue";
var tallerPuestoActivo = "cola";
var colaMovilContraida = false;
function capitalizarRotulo(txt) {
  txt = String(txt || "");
  return txt.charAt(0).toUpperCase() + txt.slice(1);
}

function formatearTiempoTrabajo(turnos) {
  var totalTurnos = Math.max(0, Math.round(turnos || 0));
  var totalMinutos = totalTurnos * 10;
  var horas = Math.floor(totalMinutos / 60);
  var minutos = totalMinutos % 60;

  if (horas <= 0) return minutos + ' min';
  if (minutos <= 0) return horas + ' h';
  return horas + ' h ' + minutos + ' min';
}

function calcularSegundosRestantesDesdeTicks(turnos) {
  var ticksRestantes = Math.max(0, Math.round(turnos || 0));
  var segundosPorTick = Math.max(1, Math.round(autoTurnoCadaSeg || 1));
  var segundosRestantes = ticksRestantes * segundosPorTick;
  var pantallaTaller = document.getElementById("pantalla-taller");
  var enTaller = !!(
    pantallaTaller && !pantallaTaller.classList.contains("hidden")
  );

  if (
    !segundosRestantes ||
    !autoAvanceActivo ||
    !enTaller ||
    typeof ultimoTickRealMs !== "number" ||
    !isFinite(ultimoTickRealMs) ||
    ultimoTickRealMs <= 0
  ) {
    return segundosRestantes;
  }

  var segundosDesdeUltimoTick = Math.max(
    0,
    Math.floor((Date.now() - ultimoTickRealMs) / 1000),
  );
  return Math.max(0, segundosRestantes - segundosDesdeUltimoTick);
}

function formatearTemporizadorTrabajo(turnos) {
  var totalSegundos = calcularSegundosRestantesDesdeTicks(turnos);
  var horas = Math.floor(totalSegundos / 3600);
  var minutos = Math.floor((totalSegundos % 3600) / 60);
  var segundos = totalSegundos % 60;

  if (horas > 0) {
    return (
      String(horas).padStart(2, "0") +
      ":" +
      String(minutos).padStart(2, "0") +
      ":" +
      String(segundos).padStart(2, "0")
    );
  }

  return (
    String(minutos).padStart(2, "0") +
    ":" +
    String(segundos).padStart(2, "0")
  );
}

function convertirDuracionTrabajoATiempoRealSeg(unidades, usarUnidadDirecta) {
  var total = Number(unidades);
  if (!Number.isFinite(total)) total = 0;
  total = Math.max(0, total);
  if (usarUnidadDirecta) return Math.max(0, Math.round(total));
  var segundosPorUnidad = Math.max(5, Math.min(10, Math.round(autoTurnoCadaSeg || 10)));
  return Math.max(1, Math.min(90, Math.round(total * segundosPorUnidad)));
}

function formatearDuracionSegundos(totalSegundos) {
  var seguro = Number(totalSegundos);
  if (!Number.isFinite(seguro)) seguro = 0;
  var normalizado = Math.max(0, Math.round(seguro));
  var horas = Math.floor(normalizado / 3600);
  var minutos = Math.floor((normalizado % 3600) / 60);
  var segundos = normalizado % 60;

  if (horas > 0) {
    return (
      String(horas).padStart(2, "0") +
      ":" +
      String(minutos).padStart(2, "0") +
      ":" +
      String(segundos).padStart(2, "0")
    );
  }

  return (
    String(minutos).padStart(2, "0") +
    ":" +
    String(segundos).padStart(2, "0")
  );
}

function sincronizarTemporizadorItemTiempoReal(item, opciones) {
  if (!item || typeof item !== "object") return null;

  var cfg = opciones && typeof opciones === "object" ? opciones : {};
  var totalKey = typeof cfg.totalKey === "string" ? cfg.totalKey : "tiempoTotal";
  var restanteKey = typeof cfg.restanteKey === "string" ? cfg.restanteKey : "tiempoRestante";
  var usarUnidadDirecta = !!cfg.usarUnidadDirecta;
  var pausado = !!cfg.pausado;
  var finalizado = !!cfg.finalizado;
  var ahora = Number(cfg.ahoraMs);
  if (!Number.isFinite(ahora) || ahora <= 0) ahora = Date.now();

  var totalCompat = Number(item[totalKey]);
  if (!Number.isFinite(totalCompat) || totalCompat <= 0) totalCompat = 1;
  totalCompat = Math.max(1, Math.round(totalCompat));

  var restanteCompat = Number(item[restanteKey]);
  if (!Number.isFinite(restanteCompat)) restanteCompat = finalizado ? 0 : totalCompat;
  restanteCompat = Math.max(0, Math.round(restanteCompat));

  var duracionRealSeg = Number(item.duracionRealSeg);
  if (!Number.isFinite(duracionRealSeg) || duracionRealSeg <= 0) {
    duracionRealSeg = convertirDuracionTrabajoATiempoRealSeg(totalCompat, usarUnidadDirecta);
  }
  duracionRealSeg = Math.max(1, Math.round(duracionRealSeg));

  var segundosPendientesReal = Number(item.segundosPendientesReal);
  if (!Number.isFinite(segundosPendientesReal)) {
    if (finalizado) {
      segundosPendientesReal = 0;
    } else {
      var ratioInicial = totalCompat > 0 ? restanteCompat / totalCompat : 1;
      segundosPendientesReal = duracionRealSeg * Math.max(0, ratioInicial);
    }
  }

  var ultimoTiempoSyncMs = Number(item.ultimoTiempoSyncMs);
  if (!Number.isFinite(ultimoTiempoSyncMs) || ultimoTiempoSyncMs <= 0) {
    ultimoTiempoSyncMs = ahora;
  }

  if (!pausado && !finalizado) {
    segundosPendientesReal = Math.max(
      0,
      segundosPendientesReal - Math.max(0, (ahora - ultimoTiempoSyncMs) / 1000),
    );
  } else if (finalizado) {
    segundosPendientesReal = 0;
  }

  if (segundosPendientesReal > duracionRealSeg) {
    duracionRealSeg = Math.max(1, Math.round(segundosPendientesReal));
  }

  var segundosPorUnidad = usarUnidadDirecta
    ? 1
    : Math.max(1, Math.round(autoTurnoCadaSeg || 1));
  var restanteNormalizado = finalizado
    ? 0
    : Math.max(0, Math.ceil(segundosPendientesReal / segundosPorUnidad));

  item.duracionRealSeg = duracionRealSeg;
  item.segundosTotalesReal = duracionRealSeg;
  item.segundosPendientesReal = finalizado ? 0 : segundosPendientesReal;
  item.ultimoTiempoSyncMs = ahora;
  item[totalKey] = totalCompat;
  item[restanteKey] = restanteNormalizado;
  return item;
}

function sincronizarTiempoReparacionReal(rep, ahoraMs) {
  if (!rep || typeof rep !== "object") return null;
  var usaTiempoDirecto =
    typeof modoNivelesActivo === "function" && modoNivelesActivo();
  return sincronizarTemporizadorItemTiempoReal(rep, {
    totalKey: "tiempoTotal",
    restanteKey: "tiempoRestante",
    usarUnidadDirecta: usaTiempoDirecto,
    pausado: !!(rep.pausadaPorPieza || rep.pedidoPendienteDelivery || rep.pausadaManualDueno),
    finalizado: !!rep.listoParaCobro,
    ahoraMs: ahoraMs,
  });
}

function sincronizarTiempoDeliveryReal(entrega, ahoraMs) {
  if (!entrega || typeof entrega !== "object") return null;
  return sincronizarTemporizadorItemTiempoReal(entrega, {
    totalKey: "etaTotal",
    restanteKey: "etaRestante",
    usarUnidadDirecta: false,
    pausado: false,
    finalizado: false,
    ahoraMs: ahoraMs,
  });
}

function obtenerSegundosRestantesReparacion(rep) {
  rep = sincronizarTiempoReparacionReal(rep);
  return Math.max(0, Math.round((rep && rep.segundosPendientesReal) || 0));
}

function obtenerSegundosRestantesDelivery(entrega) {
  entrega = sincronizarTiempoDeliveryReal(entrega);
  return Math.max(0, Math.round((entrega && entrega.segundosPendientesReal) || 0));
}

function ajustarTrabajoActivoSegundos(item, deltaSegundos, opciones) {
  if (!item || typeof item !== "object") return null;
  var cfg = opciones && typeof opciones === "object" ? opciones : {};
  var esDelivery = !!cfg.esDelivery;
  var ahora = Date.now();
  if (esDelivery) {
    item = sincronizarTiempoDeliveryReal(item, ahora);
  } else {
    item = sincronizarTiempoReparacionReal(item, ahora);
  }
  if (!item) return null;

  var delta = Number(deltaSegundos);
  if (!Number.isFinite(delta)) delta = 0;
  var totalSeg = Math.max(
    1,
    Math.round(Number(item.duracionRealSeg || item.segundosTotalesReal || 1)),
  );
  var restanteSeg = Math.max(
    0,
    Number(item.segundosPendientesReal || 0) + delta,
  );
  if (restanteSeg > totalSeg) totalSeg = Math.max(1, Math.round(restanteSeg));

  item.duracionRealSeg = totalSeg;
  item.segundosTotalesReal = totalSeg;
  item.segundosPendientesReal = restanteSeg;
  item.ultimoTiempoSyncMs = ahora;

  var segundosPorUnidad = esDelivery
    ? Math.max(1, Math.round(autoTurnoCadaSeg || 1))
    : (typeof modoNivelesActivo === "function" && modoNivelesActivo())
      ? 1
      : Math.max(1, Math.round(autoTurnoCadaSeg || 1));
  var totalCompat = Math.max(1, Math.ceil(totalSeg / segundosPorUnidad));
  var restanteCompat = Math.max(0, Math.ceil(restanteSeg / segundosPorUnidad));
  if (esDelivery) {
    item.etaTotal = totalCompat;
    item.etaRestante = restanteCompat;
  } else {
    item.tiempoTotal = totalCompat;
    item.tiempoRestante = item.listoParaCobro ? 0 : restanteCompat;
  }
  return item;
}

if (typeof window !== 'undefined') {
  window.formatearTiempoTrabajo = formatearTiempoTrabajo;
  window.formatearTemporizadorTrabajo = formatearTemporizadorTrabajo;
  window.convertirDuracionTrabajoATiempoRealSeg = convertirDuracionTrabajoATiempoRealSeg;
  window.formatearDuracionSegundos = formatearDuracionSegundos;
  window.sincronizarTiempoReparacionReal = sincronizarTiempoReparacionReal;
  window.sincronizarTiempoDeliveryReal = sincronizarTiempoDeliveryReal;
  window.obtenerSegundosRestantesReparacion = obtenerSegundosRestantesReparacion;
  window.obtenerSegundosRestantesDelivery = obtenerSegundosRestantesDelivery;
  window.ajustarTrabajoActivoSegundos = ajustarTrabajoActivoSegundos;
}

function calcularFocoMaxDia() {
  var economyData =
    typeof ECONOMY_DATA === 'object' && ECONOMY_DATA
      ? ECONOMY_DATA
      : window.TallerData && window.TallerData.economy
        ? window.TallerData.economy
        : {};
  var tiendaTactica =
    economyData && typeof economyData.tiendaTactica === 'object'
      ? economyData.tiendaTactica
      : {};
  var mejoraBateria =
    tiendaTactica && typeof tiendaTactica.bateria === 'object'
      ? tiendaTactica.bateria
      : {};
  var focoBase = Math.max(1, Math.round(economyData.focoBase || 10));
  var focoMaximo = Math.max(
    focoBase,
    Math.round(economyData.focoMaximo || focoBase),
  );
  var bateriaNivel = Math.max(
    0,
    Math.round(
      typeof mejorasTacticas === 'object' && mejorasTacticas
        ? mejorasTacticas.bateria || 0
        : 0,
    ),
  );
  var bonusPorNivel = Math.max(
    0,
    Math.round(mejoraBateria.bonusFocoMax || 5),
  );

  return Math.min(focoMaximo, focoBase + bateriaNivel * bonusPorNivel);
}

if (typeof window !== 'undefined') {
  window.calcularFocoMaxDia = calcularFocoMaxDia;
}
// Asegurar utilidades globales
function esInteraccionMovil() {
  if (typeof window === 'undefined') return false;
  return (window.matchMedia && window.matchMedia('(max-width: 980px)').matches) || ('ontouchstart' in window);
}
if (typeof window !== 'undefined') {
  window.esInteraccionMovil = esInteraccionMovil;
}

var malvaviscoAcariciadoHoy = false;
// ...otras funciones globales o inicialización aquí...
// Mostrar el nombre del taller en el header superior
document.addEventListener('DOMContentLoaded', function() {
  var nombre =
    (window.TallerData && window.TallerData.playerPreset && window.TallerData.playerPreset.tallerNombre)
      ? window.TallerData.playerPreset.tallerNombre
      : 'Taller World';
  var el = document.getElementById('hud-taller-nombre');
  if (el) el.innerText = nombre;
});

function ajustarReservaInferiorPantallasMovil(
  minGeneralPadding,
  minTallerPadding,
  activo,
) {
  var gameEl = document.getElementById("game");
  var flowLayer =
    gameEl && gameEl.querySelector
      ? gameEl.querySelector(".game-flow-layer")
      : null;
  var pantallaTaller = document.getElementById("pantalla-taller");
  var paddingGeneral = Math.max(0, Math.round(minGeneralPadding || 0));
  var paddingTaller = Math.max(0, Math.round(minTallerPadding || 0));

  if (!activo) {
    if (gameEl) gameEl.style.removeProperty("--hud-bottom-height");
    if (flowLayer) flowLayer.style.removeProperty("padding-bottom");
    if (pantallaTaller) {
      pantallaTaller.style.removeProperty("--hud-bottom-height");
      if (!pantallaTaller.classList.contains("fixed-workbench-layout")) {
        pantallaTaller.style.removeProperty("padding-bottom");
      }
    }
    return;
  }

  if (gameEl) {
    gameEl.style.setProperty("--hud-bottom-height", paddingGeneral + "px");
  }
  if (flowLayer) {
    flowLayer.style.setProperty(
      "padding-bottom",
      "calc(" + paddingGeneral + "px + env(safe-area-inset-bottom, 0px))",
      "important",
    );
  }
  if (pantallaTaller) {
    pantallaTaller.style.setProperty(
      "--hud-bottom-height",
      paddingTaller + "px",
    );
  }
}

function asegurarNavPantallasInferior() {
  var nav = document.getElementById("game-nav");
  var pantallaTaller = document.getElementById("pantalla-taller");
  if (!nav || !pantallaTaller) return;

  nav.classList.remove("hidden");
  var enVistaMovil = window.matchMedia("(max-width: 980px)").matches;

  // En escritorio dejamos que el CSS de layout controle posicion y espaciado.
  if (!enVistaMovil) {
    [
      "position",
      "left",
      "right",
      "bottom",
      "top",
      "z-index",
      "display",
      "visibility",
      "opacity",
      "pointer-events",
    ].forEach(function (prop) {
      nav.style.removeProperty(prop);
    });
    pantallaTaller.style.removeProperty("padding-bottom");
    ajustarReservaInferiorPantallasMovil(0, 0, false);
    return;
  }

  nav.style.setProperty("position", "fixed", "important");
  nav.style.setProperty("left", "10px", "important");
  nav.style.setProperty("right", "10px", "important");
  nav.style.setProperty("bottom", "8px", "important");
  nav.style.setProperty("top", "auto", "important");
  nav.style.setProperty("z-index", "80", "important");
  nav.style.setProperty("display", "grid", "important");
  nav.style.setProperty("visibility", "visible", "important");
  nav.style.setProperty("opacity", "1", "important");
  nav.style.setProperty("pointer-events", "auto", "important");

  // En movil el scroll pertenece al app shell, no a cada pantalla.
  // Evita acumular padding inline cada vez que cambia el viewport.
  if (window.matchMedia("(max-width: 700px)").matches) {
    pantallaTaller.style.removeProperty("padding-top");
    pantallaTaller.style.removeProperty("padding-bottom");
    ajustarReservaInferiorPantallasMovil(0, 0, false);
    return;
  }

  var navHeight = Math.max(nav.offsetHeight || 0, 40);
  var navBottomOffset = 8;
  var breathingSpace = window.matchMedia("(max-width: 640px)").matches
    ? 12
    : 14;
  var baseNavPadding = navHeight + navBottomOffset + breathingSpace;
  var esTallerActivo =
    typeof pantallaActiva === "string" ? pantallaActiva === "taller" : true;
  var tieneToolbarTrabajo = !!document.getElementById("taller-work-toolbar");
  var extraToolbar =
    esTallerActivo && tieneToolbarTrabajo
      ? window.toolbarCasosTrabajoAbierto
        ? 80
        : 36
      : 0;
  var minGeneralPadding = baseNavPadding;
  var minTallerPadding = baseNavPadding + extraToolbar;
  pantallaTaller.style.setProperty(
    "padding-bottom",
    "calc(" + minTallerPadding + "px + env(safe-area-inset-bottom, 0px))",
    "important",
  );
  ajustarReservaInferiorPantallasMovil(
    minGeneralPadding,
    minTallerPadding,
    true,
  );
}

var rafAjusteNavPantallas = 0;

function programarAjusteNavPantallas() {
  if (rafAjusteNavPantallas) return;
  rafAjusteNavPantallas = window.requestAnimationFrame(function () {
    rafAjusteNavPantallas = 0;
    asegurarNavPantallasInferior();
    if (typeof aplicarPuestoTaller === "function") {
      aplicarPuestoTaller();
    }
  });
}

window.addEventListener("resize", programarAjusteNavPantallas, {
  passive: true,
});
window.addEventListener("orientationchange", programarAjusteNavPantallas, {
  passive: true,
});
if (window.visualViewport) {
  window.visualViewport.addEventListener(
    "resize",
    programarAjusteNavPantallas,
    { passive: true },
  );
  window.visualViewport.addEventListener(
    "scroll",
    programarAjusteNavPantallas,
    { passive: true },
  );
}

function seleccionarMecanicoTapMovil(idx) {
  if (typeof idx !== "number" || idx < 0 || idx >= (mecanicos || []).length)
    return false;
  window.mecanicoTapSeleccionado =
    window.mecanicoTapSeleccionado === idx ? -1 : idx;
  var mecanico = mecanicos[idx];
  var trabajoOcupado = Array.isArray(reparacionesActivas) && mecanico
    ? reparacionesActivas.find(function (r) { return r && r.mecanicoNombre === mecanico.nombre && !r.listoParaCobro; })
    : null;
  if (trabajoOcupado) {
    window.mecanicoTapSeleccionado = -1;
    mostrarFeedbackGameplay(`${mecanico.nombre} está ocupado con ${trabajoOcupado.idCaso || 'otro caso'}. Espera a que termine.`, "warn");
    if (typeof actualizarUI === "function") actualizarUI();
    return false;
  }
  if (mecanico && Number(mecanico.bloqueoAyudaTurnos || 0) > 0) {
    window.mecanicoTapSeleccionado = -1;
    var fueraTxt = typeof formatearBloqueoAyudaMecanico === "function"
      ? formatearBloqueoAyudaMecanico(mecanico.bloqueoAyudaTurnos)
      : `${mecanico.bloqueoAyudaTurnos} turnos`;
    mostrarFeedbackGameplay(`${mecanico.nombre} está fuera por un asunto personal (${fueraTxt}). Revisa WhatsApp y atiende su necesidad.`, "warn");
    if (typeof actualizarUI === "function") actualizarUI();
    return false;
  }
  if (mecanico && Number(mecanico.enojo || 0) >= 4) {
    window.mecanicoTapSeleccionado = -1;
    mostrarFeedbackGameplay(`${mecanico.nombre} no está disponible: tiene tensión alta. Atiende primero su estado antes de asignarle otro caso.`, "warn");
    if (typeof actualizarUI === "function") actualizarUI();
    return false;
  }
  if (mecanico && mecanico.preguntaPendiente && typeof mostrarFeedbackGameplay === "function") {
    mostrarFeedbackGameplay(`${mecanico.nombre} tiene una necesidad pendiente. Atiéndela desde WhatsApp antes de asignarle otro caso.`, "warn");
  }
  if (typeof mostrarFeedbackGameplay === "function") {
    if (window.mecanicoTapSeleccionado >= 0) {
      var mec = mecanicos[idx];
      mostrarFeedbackGameplay(
        `${mec && mec.nombre ? mec.nombre : "Mecanico"} seleccionado. Ahora toca un caso para asignarlo.`,
        "ok",
      );
    } else {
      mostrarFeedbackGameplay("Seleccion de mecanico cancelada.", "warn");
    }
  }

  if (typeof actualizarUI === "function") actualizarUI();
  return true;
}

function obtenerCasoDesdeOrigenLista(origen, idCaso) {
  var clave = String(idCaso || "").trim();
  if (!clave) return null;

  var lista =
    origen === "pending-dx"
      ? Array.isArray(casosPendientesDiagnostico)
        ? casosPendientesDiagnostico
        : []
      : Array.isArray(clientesEnEspera)
        ? clientesEnEspera
        : [];

  var index = lista.findIndex(function (c) {
    return c && String(c.idCaso || "").trim() === clave;
  });
  if (index < 0) return null;
  return {
    caso: lista[index],
    index: index,
  };
}

function restaurarCasoEnOrigenLista(origen, caso, index) {
  if (!caso || typeof caso !== "object") return false;
  var clave = String(caso.idCaso || "").trim();
  if (!clave) return false;

  var lista =
    origen === "pending-dx"
      ? Array.isArray(casosPendientesDiagnostico)
        ? casosPendientesDiagnostico
        : []
      : Array.isArray(clientesEnEspera)
        ? clientesEnEspera
        : [];

  var existente = lista.findIndex(function (item) {
    return item && String(item.idCaso || "").trim() === clave;
  });
  if (existente >= 0) {
    lista[existente] = caso;
    return true;
  }

  if (typeof index === "number" && index >= 0 && index <= lista.length) {
    lista.splice(index, 0, caso);
  } else {
    lista.push(caso);
  }
  return true;
}

function tocarCasoReparacionConDelivery(idCaso) {
  var clave = String(idCaso || "").trim();
  if (!clave) { mostrarFeedbackGameplay("No se puede pedir piezas: caso inválido.", "warn"); return false; }

  var rep = Array.isArray(reparacionesActivas)
    ? reparacionesActivas.find(function (r) {
        return r && String(r.idCaso || "").trim() === clave;
      })
    : null;
  if (!rep || !rep.pausadaPorPieza) {
    mostrarFeedbackGameplay(`No se puede pedir piezas para ${clave}: el trabajo no está pausado esperando una pieza.`, "info");
    return false;
  }

  if (obtenerEntregaPiezasActivaPorCaso(clave)) {
    if (typeof mostrarFeedbackGameplay === "function") {
      mostrarFeedbackGameplay(
        "Ese caso ya tiene un delivery en camino.",
        "info",
      );
    }
    return false;
  }

  if (rep.pedidoPendienteDelivery) {
    var pagoPendienteOk = !!confirmarPagarDelivery(clave);
    if (pagoPendienteOk) {
      window.deliveryTapSeleccionado = -1;
      colapsarToolbarRecursos();
      if (typeof enfocarElementoUI === "function") {
        enfocarElementoUI("repairs-card");
      }
    }
    return pagoPendienteOk;
  }

  var slot = Number.isFinite(window.deliveryTapSeleccionado)
    ? window.deliveryTapSeleccionado
    : -1;
  if (slot < 0) {
    var pedidoPreparado = !!iniciarPedidoPiezasConDelivery(clave, null);
    if (pedidoPreparado) {
      if (typeof mostrarFeedbackGameplay === "function") {
        mostrarFeedbackGameplay(
          "Pedido preparado. Confirma el pago para enviar delivery.",
          "warn",
        );
      }
      if (typeof actualizarUI === "function") actualizarUI();
    }
    return pedidoPreparado;
  }

  var slotsOcupados =
    typeof obtenerSlotsDeliveryOcupados === "function"
      ? obtenerSlotsDeliveryOcupados()
      : new Set();
  if (slotsOcupados.has(slot)) {
    window.deliveryTapSeleccionado = -1;
    if (typeof mostrarFeedbackGameplay === "function") {
      mostrarFeedbackGameplay(
        `Delivery #${slot + 1} ya no esta disponible. Selecciona otro.`,
        "warn",
      );
    }
    if (typeof actualizarUI === "function") actualizarUI();
    return false;
  }

  var pedidoIniciado = !!iniciarPedidoPiezasConDelivery(clave, slot);
  if (!pedidoIniciado) return false;

  var pagoOk = !!confirmarPagarDelivery(clave);
  if (pagoOk) {
    window.deliveryTapSeleccionado = -1;
    colapsarToolbarRecursos();
    if (typeof enfocarElementoUI === "function") {
      enfocarElementoUI("repairs-card");
    }
  }
  return pagoOk;
}

function obtenerTrabajosCompatiblesDelivery() {
  return (Array.isArray(reparacionesActivas) ? reparacionesActivas : []).filter(
    function (rep) {
      return (
        rep &&
        rep.pausadaPorPieza &&
        !obtenerEntregaPiezasActivaPorCaso(String(rep.idCaso || ""))
      );
    },
  );
}

function seleccionarDeliveryTap(slot, disponible) {
  if (!disponible) {
    mostrarFeedbackGameplay(`Delivery ${slot + 1} esta ocupado.`, "warn");
    return false;
  }
  var compatibles = obtenerTrabajosCompatiblesDelivery();
  window.deliveryTapSeleccionado = slot;
  if (!compatibles.length) {
    mostrarFeedbackGameplay(
      "Disponible para 0 trabajos. Primero revisa y aprueba un diagnostico; el caso debe quedar pausado esperando piezas.",
      "info",
    );
  } else {
    mostrarFeedbackGameplay(
      `Disponible para ${compatibles.length} trabajo(s). Selecciona un caso resaltado que espere piezas.`,
      "ok",
    );
  }
  if (typeof actualizarUI === "function") actualizarUI();
  return true;
}

function obtenerCostoMejoraDelivery(nivelActual) {
  var nivel = Math.max(1, Math.round(nivelActual || 1));
  return Math.round(380 + nivel * 260);
}

function mejorarNivelDeliveryManual(slotIndex) {
  if (typeof slotIndex !== "number" || slotIndex < 0) return false;
  var stats =
    typeof obtenerStatsRepartidor === "function"
      ? obtenerStatsRepartidor(slotIndex)
      : null;
  if (!stats) return false;
  var nivelActual = Math.max(1, Math.round(stats.nivel || 1));
  if (nivelActual >= 10) {
    if (typeof mostrarFeedbackGameplay === "function")
      mostrarFeedbackGameplay(
        `Delivery #${slotIndex + 1} ya esta en nivel maximo.`,
        "info",
      );
    return false;
  }
  var xpActual = Math.max(0, Math.round(stats.xp || 0));
  var xpMeta =
    typeof xpSiguienteNivelDelivery === "function"
      ? Math.max(1, Math.round(xpSiguienteNivelDelivery(nivelActual)))
      : 1;
  if (xpActual < xpMeta) {
    if (typeof mostrarFeedbackGameplay === "function") {
      mostrarFeedbackGameplay(
        `Delivery #${slotIndex + 1} requiere XP ${xpActual}/${xpMeta} para subir de nivel.`,
        "warn",
      );
    }
    return false;
  }
  var costo = obtenerCostoMejoraDelivery(nivelActual);
  if ((typeof saldo !== "number" ? 0 : saldo) < costo) {
    if (typeof mostrarFeedbackGameplay === "function")
      mostrarFeedbackGameplay(
        `Fondos insuficientes para subir Delivery #${slotIndex + 1} (RD$${costo}).`,
        "warn",
      );
    return false;
  }

  saldo -= costo;
  if (
    window.TallerApp &&
    window.TallerApp.helpers &&
    typeof window.TallerApp.helpers.registrarGastoDia === "function"
  ) {
    window.TallerApp.helpers.registrarGastoDia(costo, "equipo");
  }
  stats.nivel = Math.min(10, Math.round(nivelActual + 1));
  stats.xp = Math.max(0, xpActual - xpMeta);
  if (typeof log === "function")
    log(
      `Delivery #${slotIndex + 1} mejorado a nivel ${stats.nivel} por RD$${costo}.`,
      "exito",
    );
  if (typeof mostrarFeedbackGameplay === "function")
    mostrarFeedbackGameplay(
      `Delivery #${slotIndex + 1} ahora nivel ${stats.nivel}.`,
      "ok",
    );
  if (typeof autoGuardarPartidaSilenciosa === "function")
    autoGuardarPartidaSilenciosa("mejora-manual-delivery");
  if (typeof renderizarGestionDelivery === "function") renderizarGestionDelivery();
  if (typeof actualizarUI === "function") actualizarUI();
  return true;
}

function abrirInfoDelivery(slotIndex) {
  var slot = Math.max(0, Math.round(slotIndex || 0));
  var stats =
    typeof obtenerStatsRepartidor === "function"
      ? obtenerStatsRepartidor(slot)
      : null;
  if (!stats) return;
  var nivel = Math.max(1, Math.round(stats.nivel || 1));
  var xp = Math.max(0, Math.round(stats.xp || 0));
  var metaXp =
    typeof xpSiguienteNivelDelivery === "function"
      ? Math.max(1, Math.round(xpSiguienteNivelDelivery(nivel)))
      : 100;
  var velocidad = Math.max(1, Math.round(stats.velocidad || 1));
  var eficiencia = Math.max(1, Math.round(stats.eficiencia || 1));
  var mensaje =
    `Delivery #${slot + 1} | Nivel ${nivel} | XP ${xp}/${metaXp} | ` +
    `Velocidad ${velocidad} | Eficiencia ${eficiencia}`;
  if (typeof mostrarFeedbackGameplay === "function") {
    mostrarFeedbackGameplay(mensaje, "info");
  } else if (typeof log === "function") {
    log(mensaje, "info");
  }
}

function renderizarGestionDelivery() {
  var lista = document.getElementById("delivery-gestion-lista");
  var resumen = document.getElementById("delivery-gestion-resumen");
  if (!lista) return;
  var total = Math.max(1, Math.round(repartidoresMax || 1));
  if (resumen) resumen.innerText = `Repartidores: ${total}/3 · Contrata perfiles y mejora su nivel hasta 10.`;
  var perfiles = [
    ["Estandar", "Ritmo equilibrado · 1 pieza", "normal"],
    ["Rayo", "Muy rapido · 1 pieza · menos resistencia", "rapido"],
    ["Carga", "Lleva hasta 2 piezas · mas lento", "carga"]
  ];
  var avataresDelivery = ["img/delivery/jefry.png", "img/delivery/ludo.png", "img/delivery/bido.png"];
  lista.innerHTML = Array.from({length: total}, function(_, i) {
    var s = obtenerStatsRepartidor(i), p = perfiles[i % perfiles.length];
    var xpMeta = xpSiguienteNivelDelivery(s.nivel);
    var xpPct = Math.min(100, Math.round((s.xp / xpMeta) * 100));
    var velocidadPct = p[2] === "rapido" ? 92 : (p[2] === "carga" ? 62 : 76);
    var capacidadPct = p[2] === "carga" ? 100 : 50;
    return `<div class="mecanico-ficha delivery-management-card"><div class="delivery-management-head"><img class="delivery-management-avatar" src="${avataresDelivery[i % avataresDelivery.length]}" alt="Delivery ${i+1}"><strong>Delivery ${i+1} · ${p[0]}</strong><span class="delivery-role-badge">Nv. ${s.nivel}</span></div><small>${p[1]}</small><div class="delivery-stat"><span>XP</span><div class="delivery-stat-track"><i style="width:${xpPct}%"></i></div><b>${s.xp}/${xpMeta}</b></div><div class="delivery-stat"><span>Velocidad</span><div class="delivery-stat-track speed"><i style="width:${velocidadPct}%"></i></div><b>${velocidadPct}%</b></div><div class="delivery-stat"><span>Carga</span><div class="delivery-stat-track load"><i style="width:${capacidadPct}%"></i></div><b>${p[2] === "carga" ? "2 piezas" : "1 pieza"}</b></div><button class="btn" type="button" onclick="mejorarNivelDeliveryManual(${i})">Mejorar · RD$${obtenerCostoMejoraDelivery(s.nivel)}</button></div>`;
  }).join("");
  if (total < 3) {
    var puedeContratar = Number(saldo || 0) >= 1200;
    lista.innerHTML += `<button class="btn btn-primary ${puedeContratar ? "" : "delivery-hiring-locked"}" type="button" onclick="contratarRepartidorDelivery()">${puedeContratar ? "Contratar" : "🔒 BLOQUEADO"} ${perfiles[total % perfiles.length][0]} · RD$1200</button><small class="delivery-hiring-feedback">${puedeContratar ? "Cupo disponible." : "No puedes contratar: necesitas RD$1200 en caja."}</small>`;
  } else {
    lista.innerHTML += `<div class="delivery-hiring-feedback delivery-hiring-max">Máximo de 3 repartidores alcanzado.</div>`;
  }
}

function contratarRepartidorDelivery() {
  var costo = 1200;
  if (repartidoresMax >= 3) return mostrarFeedbackGameplay("Ya tienes el maximo de repartidores.", "info");
  if (saldo < costo) return mostrarFeedbackGameplay("Necesitas RD$1200 para contratar un repartidor.", "warn");
  saldo -= costo; repartidoresMax += 1; asegurarStatsRepartidores();
  mostrarFeedbackGameplay("Nuevo repartidor contratado. Revisa su perfil en Gestion de Delivery.", "ok");
  autoGuardarPartidaSilenciosa("contratar-delivery");
  renderizarGestionDelivery(); actualizarUI();
}

function normalizarRutaImagenRapida(valor, tipo) {
  let raw = String(valor || "").trim();
  if (!raw) return "";

  // Normalize path separators and recover relative asset paths from absolute exports.
  if (raw.includes("\\")) raw = raw.replace(/\\+/g, "/");
  if (/^[a-zA-Z]:\//.test(raw) || raw.startsWith("file:///")) {
    const idxImg = raw.toLowerCase().indexOf("/img/");
    if (idxImg >= 0) raw = raw.slice(idxImg + 1);
  }

  const archivoNumerico = /^\d+\.(png|jpg|jpeg|webp|gif)$/i;
  if (archivoNumerico.test(raw)) {
    return tipo === "fondo" ? `img/bg/taller/${raw}` : "";
  }
  return raw;
}

function construirAvatarConFallback(nombre, foto, claseImg, clasePlaceholder) {
  const nombreSeguro = String(nombre || "Mecanico");
  const inicial = nombreSeguro.charAt(0).toUpperCase() || "M";
  const alt = nombreSeguro.replace(/"/g, "&quot;");
  const src = normalizarRutaImagenRapida(foto, "foto");
  if (!src) return `<div class="${clasePlaceholder}">${inicial}</div>`;
  return `<img src="${src}" alt="${alt}" class="${claseImg}" onerror="this.style.display='none';var ph=this.nextElementSibling;if(ph){ph.style.display='flex';}"><div class="${clasePlaceholder}" style="display:none;">${inicial}</div>`;
}

function obtenerHoraDelDiaTexto() {
  return "";
}

function esModoCasosPuro() {
  if (typeof modoCasosPuroActivo === "function") {
    return !!modoCasosPuroActivo();
  }
  return !!(
    window.TallerApp &&
    window.TallerApp.mode &&
    window.TallerApp.mode.modoCasosPuro
  );
}

function modoNivelesActivo() {
  if (esModoCasosPuro()) return false;
  return !!(
    window.TallerApp &&
    window.TallerApp.mode &&
    window.TallerApp.mode.nivelesActivos
  );
}

function usaEstadosFisicosJugador() {
  return !esModoCasosPuro();
}

if (typeof window !== "undefined") {
  window.esModoCasosPuro = esModoCasosPuro;
  window.modoNivelesActivo = modoNivelesActivo;
  window.usaEstadosFisicosJugador = usaEstadosFisicosJugador;
}

// Desactivar el panel de diagnóstico (DX)
function cambiarPanelLateral(panel) {
  const permitidos = {
    queue: true,
    // "pending-dx": true, // DX desactivado
    events: true,
  };
  panelLateralActivo = permitidos[panel] ? panel : "queue";
  aplicarPanelLateral();
}

function aplicarPanelLateral() {
  const paneles = document.querySelectorAll("[data-lane-panel]");
  const btnQueue = document.getElementById("lane-tab-queue");
  const btnPendingDx = document.getElementById("lane-tab-pending-dx");
  const btnEvents = document.getElementById("lane-tab-events");

  paneles.forEach((panel) => {
    const activo = panel.dataset.lanePanel === panelLateralActivo;
    panel.classList.toggle("active", activo);
  });

  if (btnQueue)
    btnQueue.classList.toggle("active", panelLateralActivo === "queue");
  if (btnPendingDx) {
    btnPendingDx.style.display = "none";
  }
  if (btnEvents)
    btnEvents.classList.toggle("active", panelLateralActivo === "events");
}

function actualizarVisibilidadTabsPanelLateral() {
  const btnPendingDx = document.getElementById("lane-tab-pending-dx");
  const btnEvents = document.getElementById("lane-tab-events");

  const pendientesDx = Array.isArray(casosPendientesDiagnostico)
    ? casosPendientesDiagnostico.length
    : 0;
  const aprobadosPendientes =
    typeof obtenerCasosAprobadosPendientes === "function"
      ? obtenerCasosAprobadosPendientes().length
      : 0;
  const trabajosActivos = Array.isArray(reparacionesActivas)
    ? reparacionesActivas.length
    : 0;

  // Forzar ocultar DX
  const mostrarPendDx = false;
  const mostrarEvents =
    aprobadosPendientes + trabajosActivos > 0 ||
    panelLateralActivo === "events";

  if (btnPendingDx) btnPendingDx.style.display = "none";
  if (btnEvents) btnEvents.classList.toggle("hidden", !mostrarEvents);

  if (panelLateralActivo === "pending-dx")
    panelLateralActivo = "queue";
  if (panelLateralActivo === "events" && !mostrarEvents)
    panelLateralActivo = "queue";
}


// Alterna entre las tres vistas operativas del taller.
function seleccionarPuestoTaller(panel) {
  const panelesPermitidos = {
    cola: true,
    "mi-puesto": true,
    trabajos: true,
  };
  tallerPuestoActivo = panelesPermitidos[panel] ? panel : "cola";
  aplicarPuestoTaller();
  if (typeof renderizarWorkspaceCasoActivo === "function") renderizarWorkspaceCasoActivo();
}

function aplicarPuestoTaller() {
  var workbench = document.getElementById("panel-taller");
  var laneCola = workbench ? workbench.querySelector(".lane-cola") : null;
  var laneCaso = workbench ? workbench.querySelector(".lane-caso") : null;
  var laneTrabajos = workbench ? workbench.querySelector(".lane-trabajos") : null;
  var btnCola = document.getElementById("taller-tab-cola");
  var btnMiPuesto = document.getElementById("taller-tab-mi-puesto");
  // Desactivar el botón/tab de "mi puesto"
  var btnTrabajos = document.getElementById("taller-tab-trabajos");
  var esCola = tallerPuestoActivo === "cola";
  var esMiPuesto = tallerPuestoActivo === "mi-puesto";
  var esTrabajos = tallerPuestoActivo === "trabajos";

  if (workbench) {
    workbench.classList.toggle("modo-mi-puesto", esMiPuesto);
    workbench.classList.toggle("modo-cola", esCola);
    workbench.classList.toggle("modo-trabajos", esTrabajos);
  }
  if (btnCola) {
    btnCola.classList.toggle("active", esCola);
    btnCola.setAttribute("aria-selected", esCola ? "true" : "false");
  }
  if (btnMiPuesto) {
    btnMiPuesto.classList.toggle("active", esMiPuesto);
    btnMiPuesto.setAttribute("aria-selected", esMiPuesto ? "true" : "false");
  }
  if (btnTrabajos) {
    btnTrabajos.classList.toggle("active", esTrabajos);
    btnTrabajos.setAttribute("aria-selected", esTrabajos ? "true" : "false");
  }
  if (laneCola) {
    laneCola.style.display = esCola ? "" : "none";
    laneCola.setAttribute("aria-hidden", esCola ? "false" : "true");
  }
  if (laneCaso) {
    laneCaso.style.display = esMiPuesto ? "" : "none";
    laneCaso.setAttribute("aria-hidden", esMiPuesto ? "false" : "true");
  }
  if (laneTrabajos) {
    laneTrabajos.style.display = esTrabajos ? "" : "none";
    laneTrabajos.setAttribute("aria-hidden", esTrabajos ? "false" : "true");
  }
  actualizarEstadoColaMovil();
}

if (typeof window !== "undefined") {
  window.seleccionarPuestoTaller = seleccionarPuestoTaller;
}

function actualizarEstadoColaMovil() {
  var laneCola = document.querySelector("#screen-taller.active .lane-cola");
  var queueCard = document.getElementById("queue-card");
  var toggleBtn = document.getElementById("queue-mobile-toggle");
  var lista = document.getElementById("lista-cola-espera");
  var esMovil = typeof esInteraccionMovil === "function" && esInteraccionMovil();
  var totalCasos =
    (Array.isArray(clientesEnEspera) ? clientesEnEspera.length : 0) +
    (Array.isArray(casosPendientesDiagnostico)
      ? casosPendientesDiagnostico.length
      : 0);

  if (laneCola) laneCola.classList.toggle("is-collapsed", !!(esMovil && colaMovilContraida));
  if (queueCard)
    queueCard.classList.toggle("is-collapsed", !!(esMovil && colaMovilContraida));
  if (lista) lista.setAttribute("aria-hidden", esMovil && colaMovilContraida ? "true" : "false");
  if (toggleBtn) {
    toggleBtn.classList.toggle("is-collapsed", !!(esMovil && colaMovilContraida));
    toggleBtn.setAttribute("aria-expanded", esMovil && colaMovilContraida ? "false" : "true");
    toggleBtn.innerText = (esMovil && colaMovilContraida ? "Mostrar" : "Plegar") + " cola" + (totalCasos > 0 ? ` (${totalCasos})` : "");
  }
}

var hudQueueAlertSnoozeUntil = 0;

function abrirColaDesdeAlerta(event) {
  if (event && event.stopPropagation) event.stopPropagation();
  if (typeof window.navegarPantalla === "function") window.navegarPantalla("taller");
  if (typeof window.seleccionarPuestoTaller === "function") window.seleccionarPuestoTaller("cola");
  hudQueueAlertSnoozeUntil = Date.now() + (3 * 60 * 1000);
  var alerta = document.getElementById("hud-queue-alert");
  if (alerta) alerta.classList.add("hidden");
  return false;
}

if (typeof document !== "undefined") {
  document.addEventListener("click", function (event) {
    var alerta = event.target && event.target.closest ? event.target.closest("#hud-queue-alert") : null;
    if (!alerta) return;
    abrirColaDesdeAlerta(event);
  }, true);
}

function cerrarAlertaCola(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  var alerta = document.getElementById("hud-queue-alert");
  if (alerta) {
    alerta.classList.add("hidden");
    alerta.setAttribute("aria-hidden", "true");
  }
  return false;
}

function toggleColaMovil() {
  if (!(typeof esInteraccionMovil === "function" && esInteraccionMovil())) {
    colaMovilContraida = false;
  } else {
    colaMovilContraida = !colaMovilContraida;
  }
  actualizarEstadoColaMovil();
  return colaMovilContraida;
}

function cerrarColaCasos() {
  var lane = document.querySelector('#screen-taller.active .lane-cola');
  if (lane) lane.style.display = 'none';
  var card = document.getElementById('queue-card');
  if (card) card.setAttribute('aria-hidden', 'true');
  mostrarFeedbackGameplay('Cola de casos cerrada. Puedes volver a abrirla desde el panel Taller.', 'info');
}

if (typeof window !== "undefined") {
  window.toggleColaMovil = toggleColaMovil;
}

function actualizarFondoJuego() {
  const gc = document.querySelector(".game-container");
  if (!gc) return;

  function resolverAsset(rutaRelativa) {
    return new URL(rutaRelativa, window.location.href).href;
  }

  let url = "";
  if (lugarActual === "Exterior") {
    url = resolverAsset("img/bg/exterior/exterior.jpg");
  } else if (lugarActual === "Oficina") {
    url = resolverAsset("img/bg/oficina/oficina.png");
  } else {
    const idx = Math.min(Math.max((tallerNivel || 1) - 1, 0), 5);
    url = resolverAsset(`img/bg/taller/${idx}.png`);
  }
  gc.style.setProperty("--bg-ubicacion", `url("${url}")`);
  const lugarEl = document.getElementById("lugar-actual");
  if (lugarEl) lugarEl.innerText = lugarActual;
}

function asegurarEstadoNivel() {
  if (typeof nivelJugador !== "number" || nivelJugador < 1) {
    nivelJugador = 1;
  }
  if (typeof progresoNivelMeta !== "number" || progresoNivelMeta <= 0) {
    progresoNivelMeta =
      typeof calcularMetaNivel === "function"
        ? calcularMetaNivel(nivelJugador)
        : 100;
  }
  if (typeof progresoNivel !== "number" || progresoNivel < 0) {
    progresoNivel = 0;
  }
  if (progresoNivel > progresoNivelMeta) {
    progresoNivel = Math.max(0, Math.round(progresoNivel));
  }
  if (typeof ahorroAcumulado !== "number" || ahorroAcumulado < 0) {
    ahorroAcumulado = 0;
  }
  if (!competenciaBarrioEstado || typeof competenciaBarrioEstado !== "object") {
    competenciaBarrioEstado = null;
  }
  if (!telefonoOpcionesEstado || typeof telefonoOpcionesEstado !== "object") {
    telefonoOpcionesEstado = {};
  }
}

function abrirPerfilDueno() {
  var modal = document.getElementById("modal-dueno");
  if (!modal) return false;
  var set = function(id, value) { var el = document.getElementById(id); if (el) el.innerText = value; };
  var nombre = (document.getElementById("hud-dueno-nombre") || {}).innerText || "Dueño";
  var taller = (document.getElementById("hud-taller-nombre") || {}).innerText || "Taller World";
  set("dueno-modal-nombre", nombre); set("dueno-modal-taller", taller);
  set("dueno-modal-nivel", Math.max(1, Math.round(nivelJugador || 1)));
  set("dueno-modal-xp", `${Math.round(progresoNivel || 0)}/${Math.round(progresoNivelMeta || 120)}`);
  set("dueno-modal-reputacion", Math.round(reputacion || 0));
  var casosDueno = typeof obtenerCasosCompletadosNarrativa === "function"
    ? obtenerCasosCompletadosNarrativa()
    : 0;
  set("dueno-modal-casos", Math.round(casosDueno || 0));
  var nivelDueno = Math.max(1, Math.round(nivelJugador || 1));
  var puntosGanados = Math.max(3, nivelDueno + 2);
  mejorasDueno.puntos = Math.max(0, puntosGanados - mejorasDueno.diagnostico - mejorasDueno.negociacion - mejorasDueno.energia);
  set("dueno-modal-puntos", mejorasDueno.puntos);
  var skills = document.getElementById("dueno-modal-skills");
  if (skills) skills.innerHTML = [["diagnostico", "Diagnóstico", "+8% precisión"], ["negociacion", "Negociación", "+8% éxito"], ["energia", "Energía", "-1 fatiga"]].map(function(s) { var nivelSkill = Math.max(0, Number(mejorasDueno[s[0]]) || 0); var efecto = s[0] === "energia" ? `-${nivelSkill} fatiga` : `+${nivelSkill * 8}%`; var hayPuntos = mejorasDueno.puntos > 0; return `<div class="dueno-skill-row"><span><strong>${s[1]} · Nv.${nivelSkill} · ${efecto}</strong><small>${s[2]}</small></span><button class="btn ${hayPuntos ? "" : "is-disabled"}" type="button" onclick="comprarMejoraDueno('${s[0]}')" ${hayPuntos ? "" : "disabled title=\"Sin puntos de mejora disponibles\""}>${hayPuntos ? "Mejorar" : "Sin puntos"}</button></div>`; }).join("");
  var habilidades = ["Diagnóstico", "Negociación", "Gestión del taller"];
  if (mejoras && mejoras.maquinaDiagnosis) habilidades.push("Lectura OBD");
  set("dueno-modal-habilidades", habilidades.join(" · "));
  var activas = [];
  if (mejoras) { if (mejoras.herramientas) activas.push(`Herramientas Nv.${mejoras.herramientas}`); if (mejoras.capacitacion) activas.push(`Capacitación Nv.${mejoras.capacitacion}`); if (mejoras.maquinaDiagnosis) activas.push("Máquina DX"); }
  if (mejorasTacticas) { if (mejorasTacticas.flujoReparacion) activas.push("Flujo de reparación"); if (mejorasTacticas.manualHablar) activas.push("Manual de entrevista"); if (mejorasTacticas.scannerDx) activas.push("Scanner DX"); }
  set("dueno-modal-mejoras", activas.length ? activas.join(" · ") : "Sin mejoras activas.");
  var avatar = document.getElementById("dueno-modal-avatar"); var hudAvatar = document.getElementById("hud-dueno-avatar");
  if (avatar && hudAvatar) avatar.src = hudAvatar.src;
  var necesidades = document.getElementById("dueno-modal-necesidades");
  if (necesidades) necesidades.innerHTML = [["Hambre", hambre], ["Sueño", sueno], ["Estrés", estres]].map(function (s) { var valor = Math.max(0, Math.min(100, Math.round(Number(s[1]) || 0))); return `<div class="dueno-state-row"><span>${s[0]}</span><div class="dueno-state-track"><i style="width:${valor}%"></i></div><b>${valor}%</b></div>`; }).join("");
  abrirModal("dueno");
  return true;
}

function comprarMejoraDueno(tipo) {
  if (!mejorasDueno || !Object.prototype.hasOwnProperty.call(mejorasDueno, tipo)) return false;
  if (mejorasDueno.puntos <= 0) {
    mostrarFeedbackGameplay("No tienes puntos de mejora disponibles.", "warn");
    return false;
  }
  mejorasDueno[tipo] += 1; mejorasDueno.puntos -= 1;
  try { localStorage.setItem('taller_world_mejoras_dueno', JSON.stringify(mejorasDueno)); } catch (e) {}
  mostrarFeedbackGameplay(`Mejora del dueño activada: ${tipo}.`, "ok");
  abrirPerfilDueno();
  if (typeof autoGuardarPartidaSilenciosa === "function") autoGuardarPartidaSilenciosa("mejora-dueno");
  return true;
}

function actualizarUI() {
  if (typeof refrescarBotonesCuidado === "function") refrescarBotonesCuidado();
  if (!mejorasDuenoCargadas) {
    mejorasDuenoCargadas = true;
    try { var guardadas = JSON.parse(localStorage.getItem('taller_world_mejoras_dueno') || 'null'); if (guardadas) mejorasDueno = Object.assign(mejorasDueno, guardadas); } catch (e) {}
  }
  if (typeof saldo !== "number" || !Number.isFinite(saldo)) {
    saldo = Math.max(0, Math.round(ECONOMY_DATA.saldoInicial || 2000));
  }
  if (!mejorasTacticas || typeof mejorasTacticas !== "object") {
    mejorasTacticas = { ...(ECONOMY_DATA.mejorasTacticasIniciales || {}) };
  }
  if (!mejoras || typeof mejoras !== "object") {
    mejoras = { ...(ECONOMY_DATA.mejorasIniciales || {}) };
  }
  mejoras.herramientas = Math.max(0, Math.round(Number(mejoras.herramientas) || 0));
  mejoras.publicidad = Math.max(0, Math.round(Number(mejoras.publicidad) || 0));
  mejoras.capacitacion = Math.max(0, Math.round(Number(mejoras.capacitacion) || 0));
  mejoras.maquinaDiagnosis = Math.max(0, Math.min(10, mejoras.maquinaDiagnosis === true ? 1 : Math.round(Number(mejoras.maquinaDiagnosis) || 0)));
  mejoras.autolavado = !!mejoras.autolavado;
  mejorasTacticas.bateria = Number.isFinite(Number(mejorasTacticas.bateria))
    ? Math.max(0, Math.round(Number(mejorasTacticas.bateria)))
    : 0;
  mejorasTacticas.manualHablar = !!mejorasTacticas.manualHablar;
  mejorasTacticas.scannerDx = !!mejorasTacticas.scannerDx;
  mejorasTacticas.flujoReparacion = !!mejorasTacticas.flujoReparacion;
  mejorasTacticas.organizadorCola = Math.max(0, Math.min(10, Math.round(Number(mejorasTacticas.organizadorCola) || 0)));
  mejorasTacticas.controlCalidad = Math.max(0, Math.min(10, Math.round(Number(mejorasTacticas.controlCalidad) || 0)));
  mejorasTacticas.fidelidadClientes = Math.max(0, Math.min(10, Math.round(Number(mejorasTacticas.fidelidadClientes) || 0)));
  mejorasTacticas.ahorroOperativo = Math.max(0, Math.min(10, Math.round(Number(mejorasTacticas.ahorroOperativo) || 0)));
  const modoSinCierre = (typeof estaModoSinCierreDia === 'function' && estaModoSinCierreDia());
  normalizarReputacionGlobal();
  asegurarNavPantallasInferior();
  actualizarEstadoColaMovil();

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.innerText = value;
  };
  const btnAvanceRapido = document.getElementById("btn-avance-rapido");
  if (btnAvanceRapido) {
    const puedeAcelerar = saldo >= 150;
    btnAvanceRapido.disabled = !puedeAcelerar;
    btnAvanceRapido.title = puedeAcelerar
      ? "Avanza 30 minutos por RD$150; existe 20% de riesgo de perder 2 de reputacion"
      : `Necesitas RD$${Math.max(0, 150 - Math.round(saldo || 0))} adicionales`;
  }
  const btnEsperarGratis = document.getElementById("btn-esperar-gratis");
  if (btnEsperarGratis) {
    const hayOperacionActiva = (reparacionesActivas || []).some(function(rep) {
      return rep && !rep.listoParaCobro;
    }) || (entregasPiezasActivas || []).some(function(entrega) { return !!entrega; });
    btnEsperarGratis.disabled = !hayOperacionActiva;
    btnEsperarGratis.title = hayOperacionActiva
      ? "Avanza 10 minutos gratis; protege tu caja mientras llega el delivery"
      : "Activa una reparación o delivery para poder esperar";
  }

  asegurarEstadoNivel();
  const modoNiveles = modoNivelesActivo();
  const modoCasosPuro = esModoCasosPuro();
  const casosCompletados = (typeof obtenerCasosCompletadosNarrativa === 'function') ? obtenerCasosCompletadosNarrativa() : 0;
  const contadorClientes = `${casosCompletados || 0}`;
  const rachaCasosActual = typeof obtenerRachaCasosActual === "function"
    ? obtenerRachaCasosActual()
    : typeof rachaCasosExitosos !== "undefined"
      ? Math.max(0, Math.round(rachaCasosExitosos || 0))
      : Math.max(0, Math.round((resumenCasos && resumenCasos.rachaCasosExitosos) || 0));
  const gameRoot = document.getElementById("game");
  if (gameRoot) gameRoot.classList.toggle("modo-niveles", modoNiveles);
  const bloqueoNarrativo = hayConversacionNarrativaBloqueanteActiva();
  const tallerVacio = typeof tallerSinCasosActivos === "function"
    ? tallerSinCasosActivos()
    : ((!Array.isArray(clientesEnEspera) || clientesEnEspera.length === 0) &&
      (!Array.isArray(casosPendientesDiagnostico) || casosPendientesDiagnostico.length === 0) &&
      (!Array.isArray(reparacionesActivas) || reparacionesActivas.length === 0) &&
      !clienteActual);
  const jornadaAgotada =
    !modoSinCierre &&
    typeof estaCupoDiarioCompleto === "function" &&
    estaCupoDiarioCompleto(0);
  const sincronizarNavBloqueoNarrativo = function() {
    document.querySelectorAll(".game-nav-btn").forEach(function (btn) {
      var esTelefono = btn && btn.dataset && btn.dataset.screen === "telefono";
      if (btn) {
        btn.disabled = !!(bloqueoNarrativo && !esTelefono);
        if (bloqueoNarrativo && !esTelefono) {
          btn.title = "Historia pendiente en telefono";
        } else {
          btn.title = "";
        }
      }
    });
  };
  sincronizarNavBloqueoNarrativo();

  // --- EMPTY STATE HANDLER FOR CASES ---
  if (tallerVacio) {
    // Show empty state message and button
    let emptyCont = document.getElementById("empty-cases-state");
    if (!emptyCont) {
      emptyCont = document.createElement("div");
      emptyCont.id = "empty-cases-state";
      emptyCont.style = "padding:2em;text-align:center;max-width:500px;margin:2em auto;font-size:1.2em;background:#fffbe7;border-radius:12px;box-shadow:0 2px 8px #0001;";
      const tallerScreen = document.getElementById("screen-taller");
      (tallerScreen || document.body).appendChild(emptyCont);
    }
    var emptyTitle = bloqueoNarrativo
      ? "Historia pendiente"
      : jornadaAgotada
        ? "Jornada lista para cerrar"
        : "Sin casos pendientes";
    var emptyText = bloqueoNarrativo
      ? "Responde la conversación bloqueante en Teléfono para destrabar el taller."
      : jornadaAgotada
        ? (cierrePagoResuelto
            ? "No quedan casos operativos. Puedes pasar al siguiente día."
            : "No quedan casos operativos. Cierra caja para habilitar el siguiente día.")
        : "No hay clientes en espera ni casos activos.";
    var buttonLabel = bloqueoNarrativo
      ? "Abrir teléfono y seguir historia"
      : jornadaAgotada
        ? (cierrePagoResuelto ? "Pasar al siguiente día" : "Cerrar caja del día")
        : "Recibir nuevos casos";
    emptyCont.innerHTML = `<h2>${emptyTitle}</h2><p>${emptyText}</p><button id="btn-next-day-cases" style="margin-top:1em;padding:0.7em 2em;font-size:1em;border-radius:8px;background:#ffd600;color:#222;border:none;cursor:pointer;">${buttonLabel}</button>`;
    const btn = document.getElementById("btn-next-day-cases");
    if (btn) {
      btn.onclick = function() {
        if (typeof avanzarDiaONuevosCasos === "function") {
          avanzarDiaONuevosCasos("empty-state");
        }
        // Refrescar mecánicos y UI tras generar casos
        if (typeof asegurarMecanicosGlobal === "function") {
          asegurarMecanicosGlobal();
        }
        if (typeof actualizarUI === "function") {
          setTimeout(actualizarUI, 100);
        }
      };
    }
  } else {
    // Remove empty state if present
    const emptyCont = document.getElementById("empty-cases-state");
    if (emptyCont && emptyCont.parentNode) emptyCont.parentNode.removeChild(emptyCont);
  }

  // --- END EMPTY STATE HANDLER ---

  setText("dia-indicador", "CASOS COMPLETADOS");
  var saldoElem = document.getElementById("saldo");
  if (saldoElem) saldoElem.innerText = saldo;
  var deudaElem = document.getElementById("deuda");
  if (deudaElem) deudaElem.innerText = `RD$${Math.round(deuda || 0)}`;
  var clientesDiaElem = document.getElementById("clientes-dia");
  if (clientesDiaElem) clientesDiaElem.innerText = `${casosCompletados || 0}`;
  var reputacionElem = document.getElementById("reputacion");
  if (reputacionElem) reputacionElem.innerText = reputacion;
  setText("hud-saldo", Math.round(saldo));
  setText("hud-deuda", `RD$${Math.round(deuda || 0)}`);
  setText("hud-reput", reputacion);
  setText(
    "hud-foco",
    modoCasosPuro ? `Rep ${Math.round(reputacion || 0)}` : (modoNiveles ? `Nivel ${nivelJugador}` : `${focoDiaActual}/${focoDiaMax}`),
  );
  setText("hud-turnos", "");
  setText("hud-clientes", `${casosCompletados || 0}`);
  setText("hud-dinero", `RD$${Math.round(saldo)}`);
  // Mapeo a los nuevos IDs del HUD
  setText("hud-casos", `${casosCompletados || 0}`);
  setText("hud-racha", `${rachaCasosActual}`);
  setText("hud-nivel", `${Math.max(1, Math.round(nivelJugador || 1))}`);
  var hambreHud = Math.max(0, Math.min(100, Math.round(Number(hambre) || 0)));
  var suenoHud = Math.max(0, Math.min(100, Math.round(Number(sueno) || 0)));
  var estresHud = Math.max(0, Math.min(100, Math.round(Number(estres) || 0)));
  var humorEquipoHud = Array.isArray(mecanicos) && mecanicos.length
    ? Math.round(mecanicos.reduce(function(total, m) {
        var valor = 100 - (Math.max(0, Number(m && m.enojo) || 0) * 8) - (m && m.preguntaPendiente ? 18 : 0) - (m && Number(m.bloqueoAyudaTurnos || 0) > 0 ? 28 : 0);
        return total + Math.max(0, Math.min(100, valor));
      }, 0) / mecanicos.length)
    : 100;
  var hudHambreFill = document.getElementById("hud-hambre-fill");
  var hudSuenoFill = document.getElementById("hud-sueno-fill");
  var hudEstresFill = document.getElementById("hud-estres-fill");
  var hudHumorFill = document.getElementById("hud-humor-fill");
  if (hudHambreFill) hudHambreFill.style.width = `${hambreHud}%`;
  if (hudSuenoFill) hudSuenoFill.style.width = `${suenoHud}%`;
  if (hudEstresFill) hudEstresFill.style.width = `${estresHud}%`;
  if (hudHumorFill) hudHumorFill.style.width = `${humorEquipoHud}%`;
  setText("status-nivel", `${Math.max(1, Math.round(nivelJugador || 1))}`);
  setText("status-caja", `RD$${Math.round(saldo)}`);
  setText("cases-completed", `${casosCompletados || 0}`);
  setText("cases-goal", "10"); // Meta referencial visual
  setText("streak-count", `${rachaCasosActual}`);
  var xpActualHud = Math.max(0, Math.round(progresoNivel || 0));
  var xpMetaHud = Math.max(1, Math.round(progresoNivelMeta || 1));
  var xpPctHud = Math.min(100, Math.round((xpActualHud / xpMetaHud) * 100));
  setText("hud-exp", `Nivel ${Math.max(1, Math.round(nivelJugador || 1))}`);
  setText("hud-xp", `XP: ${xpActualHud}/${xpMetaHud}`);
  setText("hud-exp-meta", `${xpPctHud}%`);
  setText("status-xp", `${xpActualHud}/${xpMetaHud}`);
  setText("progress-overview", `Nivel ${Math.max(1, Math.round(nivelJugador || 1))} | XP ${xpActualHud}/${xpMetaHud} | Casos ${casosCompletados || 0} | Reputacion ${Math.round(reputacion || 0)} | Caja RD$${Math.round(saldo || 0)}`);
  var clientesRiesgo = Array.isArray(clientesEnEspera)
    ? clientesEnEspera.filter(function(c) { return c && Number(c.pacienciaCola) <= 45; })
    : [];
  var alertaColaHud = document.getElementById("hud-queue-alert");
  if (alertaColaHud) {
    var textoAlertaCola = document.getElementById("hud-queue-alert-text");
    alertaColaHud.classList.toggle("hidden", clientesRiesgo.length === 0 || Date.now() < hudQueueAlertSnoozeUntil);
    if (textoAlertaCola) textoAlertaCola.innerText = clientesRiesgo.length
      ? `Alerta: ${clientesRiesgo.length} cliente(s) por marcharse. Abrir Cola`
      : "Cola estable";
  }
  var hudExpFill = document.getElementById("hud-exp-fill");
  if (hudExpFill) hudExpFill.style.width = xpPctHud + "%";
  var casesProgressFill = document.getElementById("cases-progress-fill");
  if (casesProgressFill) casesProgressFill.style.width = Math.min(100, (casosCompletados / 10) * 100) + "%";

  const ofDinero = document.getElementById("oficina-dinero-deuda");
  const ofNombre = document.getElementById("oficina-player-nombre");
  const ofTaller = document.getElementById("oficina-player-taller");
  const ofFoto = document.getElementById("oficina-player-foto");
  const jugadorNombreMini = document.getElementById("jugador-nombre-mini");
  const tallerNombreMini = document.getElementById("taller-nombre-mini");
  const jugadorFotoMini = document.getElementById("jugador-foto-mini");
  const deliverySlotsTop = document.getElementById("delivery-slots-top");
  const ownerBossName = document.getElementById("owner-boss-name");
  const ownerBossAvatar = document.getElementById("owner-boss-avatar");
  const hudDuenoNombre = document.getElementById("hud-dueno-nombre");
  const hudDuenoAvatar = document.getElementById("hud-dueno-avatar");
  const deliveryDisponiblesMini = document.getElementById("delivery-disponibles-mini");
  const deliveryResumenMini = document.getElementById("delivery-resumen-mini");
  const deliveryTotal = Math.max(1, parseInt(repartidoresMax || 1, 10));
  const deliveryActivos = Array.isArray(entregasPiezasActivas) ? entregasPiezasActivas.length : 0;
  const deliveryLibres = Math.max(0, deliveryTotal - deliveryActivos);

  if (deliveryDisponiblesMini) {
    deliveryDisponiblesMini.innerText = `${deliveryLibres} disponibles`;
    deliveryDisponiblesMini.classList.add("hidden");
  }
  if (deliveryResumenMini) {
    deliveryResumenMini.innerText = `${deliveryActivos} en ruta`;
    deliveryResumenMini.classList.add("hidden");
  }

  if (ofDinero) {
    ofDinero.innerText = `Caja RD$${Math.round(saldo)} | Casos completados: ${casosCompletados || 0}`;
  }
  // Eliminar ofTiempo relacionado a días
  if (ofNombre)
    ofNombre.innerText = jugadorNombreMini
      ? jugadorNombreMini.innerText
      : "Player Name";
  if (ofTaller)
    ofTaller.innerText = tallerNombreMini
      ? tallerNombreMini.innerText
      : "Taller Name";
  const fotoMiniSrc = jugadorFotoMini
    ? normalizarRutaImagenRapida(
        jugadorFotoMini.getAttribute("src") || "",
        "foto",
      )
    : "";
  if (
    ofFoto &&
    fotoMiniSrc &&
    jugadorFotoMini &&
    !jugadorFotoMini.classList.contains("hidden")
  ) {
    ofFoto.src = fotoMiniSrc;
    ofFoto.classList.remove("hidden");
  } else if (ofFoto) {
    ofFoto.src = "";
    ofFoto.classList.add("hidden");
  }
  const nombreDueno =
    jugadorNombreMini && jugadorNombreMini.innerText
      ? jugadorNombreMini.innerText
      : "Dueno";
  if (ownerBossName) ownerBossName.innerText = nombreDueno;
  if (hudDuenoNombre) hudDuenoNombre.innerText = nombreDueno;

  const avatarDueno =
    fotoMiniSrc &&
    jugadorFotoMini &&
    !jugadorFotoMini.classList.contains("hidden")
      ? fotoMiniSrc
      : "img/boss/boss.png";
  if (ownerBossAvatar) {
    if (avatarDueno !== "img/boss/boss.png") {
      ownerBossAvatar.src = avatarDueno;
      ownerBossAvatar.classList.remove("owner-boss-avatar-fallback");
    } else {
      ownerBossAvatar.src = "img/boss/boss.png";
      ownerBossAvatar.classList.add("owner-boss-avatar-fallback");
    }
  }
  if (hudDuenoAvatar) hudDuenoAvatar.src = avatarDueno;

  const estadoMalvavisco = document.getElementById("malvavisco-estado");
  const btnMalvavisco = document.getElementById("btn-malvavisco");
  const estadoMalvaviscoSec = document.getElementById("malvavisco-estado-sec");
  const btnMalvaviscoSec = document.getElementById("btn-malvavisco-sec");
  const btnMalvaviscoOf = document.getElementById("of-btn-malvavisco");
  const btnMalvaviscoOfAcariciar = document.getElementById(
    "of-btn-malvavisco-acariciar",
  );
  if (estadoMalvavisco) {
    const humor =
      malvaviscoAfinidad >= 4
        ? "Feliz"
        : malvaviscoAfinidad <= -2
          ? "Enojado"
          : "Neutro";
    estadoMalvavisco.innerText = `${humor} Malvavisco | Afinidad ${malvaviscoAfinidad}`;
    if (estadoMalvaviscoSec)
      estadoMalvaviscoSec.innerText = estadoMalvavisco.innerText;
  }
  if (btnMalvavisco) btnMalvavisco.disabled = malvaviscoAlimentadoHoy;
  if (btnMalvaviscoSec) btnMalvaviscoSec.disabled = malvaviscoAcariciadoHoy;
  if (btnMalvaviscoOf) btnMalvaviscoOf.disabled = malvaviscoAlimentadoHoy;
  if (btnMalvaviscoOfAcariciar)
    btnMalvaviscoOfAcariciar.disabled = malvaviscoAcariciadoHoy;

  if (usaEstadosFisicosJugador()) {
    const _elH = document.getElementById("hambre");
    if (_elH) _elH.innerText = hambre;
    const _elS = document.getElementById("sueno");
    if (_elS) _elS.innerText = sueno;
    const _elE = document.getElementById("estres");
    if (_elE) _elE.innerText = estres;
    const _elBH = document.getElementById("barra-hambre");
    if (_elBH) _elBH.style.width = hambre + "%";
    const _elBS = document.getElementById("barra-sueno");
    if (_elBS) _elBS.style.width = sueno + "%";
    const _elBE = document.getElementById("barra-estres");
    if (_elBE) _elBE.style.width = estres + "%";
  }
  actualizarEstadoJugadorVisual();
  actualizarPanelDueno();

  // Eliminar UI de turnos y fin de jornada

  let grid = document.getElementById("grid-mecanicos") || document.getElementById("mecanicos-grid");
  if (!grid) grid = document.createElement("div"); // fallback seguro
  const trabajosActivosPorMecanico = new Map();
  (reparacionesActivas || [])
      .filter(function (r) {
        return r && typeof r === "object" && !r.listoParaCobro;
      })
      .map(function (r) {
        return r;
      })
      .forEach(function (r) {
        var key = r && r.mecanicoNombre ? r.mecanicoNombre : "";
        if (!key) return;
        var lista = trabajosActivosPorMecanico.get(key) || [];
        lista.push(r);
        trabajosActivosPorMecanico.set(key, lista);
      });
  let mecanicosVisibles = 0;
  let recursosVisibles = 0;
  const interaccionMovil = esInteraccionMovil();
  const normalizarStatMecanico = function (valor, fallback, min, max) {
    var numero = Number(valor);
    if (!Number.isFinite(numero)) numero = fallback;
    if (typeof min === "number") numero = Math.max(min, numero);
    if (typeof max === "number") numero = Math.min(max, numero);
    return numero;
  };
  grid.innerHTML = "";
  const mecanicosEstadoActual = Array.isArray(window.mecanicos) ? window.mecanicos : mecanicos;
  mecanicosEstadoActual.forEach((m, idx) => {
    mecanicosVisibles += 1;
    recursosVisibles += 1;
    const trabajosMecanico = trabajosActivosPorMecanico.get(m.nombre) || [];
    const trabajoActivoMecanico = trabajosMecanico[0] || null;
    const capacidadMecanico = Math.max(1, Number(m.capacidadCasosSimultaneos) || 1);
    const trabajosMecanicoCount = trabajosMecanico.length;
    const ocupadoEnCasoActivo = trabajosMecanicoCount >= capacidadMecanico;
    const progresoTrabajoMecanico = trabajoActivoMecanico
      ? Math.max(0, Math.min(100, trabajoActivoMecanico.listoParaCobro ? 100 : Math.round((1 - (obtenerSegundosRestantesReparacion(trabajoActivoMecanico) / Math.max(1, Number(trabajoActivoMecanico.segundosTotalesReal || trabajoActivoMecanico.duracionRealSeg || trabajoActivoMecanico.tiempoTotal || 1)))) * 100)))
      : 0;
    const enfriamientoTurnos = normalizarStatMecanico(
      m.enfriamientoTurnos,
      0,
      0,
    );
    const enfriamientoSegundos = Math.max(0, Math.round(enfriamientoTurnos * (Number(autoTurnoCadaSeg) || 30)));
    const bloqueoAyudaTurnos = normalizarStatMecanico(
      m.bloqueoAyudaTurnos,
      0,
      0,
    );
    let btn = document.createElement("button");
    btn.className = `mecanico-btn ${Number(m.enojo || 0) >= 4 ? "enojo-alto" : ""}`;
    if (window.mecanicoTapSeleccionado === idx)
      btn.classList.add("mecanico-selected-mobile");
    btn.dataset.mecanicoIndex = String(idx);
    if (modoSinCierre && (m.bloqueadoHastaDia || 0) >= dia)
      m.bloqueadoHastaDia = 0;
    const bloqueadoHoy = !modoSinCierre && m.bloqueadoHastaDia >= dia;
    const habilidadBase = normalizarStatMecanico(m.habilidad, 0.5, 0, 1);
    const velocidadBase = normalizarStatMecanico(
      typeof calcularVelocidadEfectiva === "function"
        ? calcularVelocidadEfectiva(m)
        : m.velocidad,
      0.5,
      0,
      1,
    );
    const eficienciaBase = normalizarStatMecanico(
      typeof calcularEficienciaEfectiva === "function"
        ? calcularEficienciaEfectiva(m)
        : m.eficiencia,
      0.5,
      0,
      1,
    );
    const humorCanonico = window.mecanicos && window.mecanicos[idx]
      ? Number(window.mecanicos[idx].humor)
      : Number(m.humor);
    const humorBase = Number.isFinite(humorCanonico) ? humorCanonico : 7;
    const enojoValor = Math.round(normalizarStatMecanico(m.enojo, 0, 0, 8));
    const humorEfectivo = normalizarStatMecanico(
      typeof calcularHumorEfectivo === "function"
        ? calcularHumorEfectivo(m)
        : humorBase - (enojoValor * 1.2) - (Math.max(0, (Number(m.trabajosHoy) || 0) - 3) * 0.5),
      humorBase,
      1,
      10,
    );
    const habilidadValor = Math.round(habilidadBase * 100);
    const habilidadFill = Math.max(0, Math.min(100, habilidadValor));
    const velocidadValor = Math.round(velocidadBase * 100);
    const velocidadFill = Math.max(0, Math.min(100, velocidadValor));
    const eficienciaValor = Math.round(eficienciaBase * 100);
    const eficienciaFill = Math.max(0, Math.min(100, eficienciaValor));
    const energiaBase = Number.isFinite(Number(m.energia))
      ? Number(m.energia)
      : Math.max(45, 100 - (Math.max(0, Number(m.trabajosHoy) || 0) * 16));
    const energiaValor = Math.max(0, Math.min(100, Math.round(energiaBase)));
    const descansando = Number(m.descansoEnergiaTotal || 0) > 0 && enfriamientoTurnos > 0;
    const humorFill = Math.max(
      0,
      Math.min(100, Math.round((humorEfectivo / 10) * 100)),
    );
    const enojoFill = Math.max(
      0,
      Math.min(100, Math.round((enojoValor / 8) * 100)),
    );
    // Un solo indicador de ánimo: combina bienestar (humor) y tensión (enojo).
    const estadoAnimoFill = Math.round((humorFill + (100 - enojoFill)) / 2);
    let estadoAnimoIcono = "&#x1F604;";
    let estadoAnimoTexto = "Excelente";
    let estadoAnimoColor = "#8ee7a7";
    if (estadoAnimoFill < 25) {
      estadoAnimoIcono = "&#x1F621;";
      estadoAnimoTexto = "Furioso";
      estadoAnimoColor = "#ff5f73";
    } else if (estadoAnimoFill < 45) {
      estadoAnimoIcono = "&#x1F61F;";
      estadoAnimoTexto = "Molesto";
      estadoAnimoColor = "#ff936c";
    } else if (estadoAnimoFill < 65) {
      estadoAnimoIcono = "&#x1F610;";
      estadoAnimoTexto = "Tenso";
      estadoAnimoColor = "#f5ce72";
    } else if (estadoAnimoFill < 80) {
      estadoAnimoIcono = "&#x1F642;";
      estadoAnimoTexto = "Bien";
      estadoAnimoColor = "#a8df8b";
    }
    const estadoAnimoDetalle = `Ánimo: ${estadoAnimoTexto} · Humor ${humorEfectivo.toFixed(1)}/10 · Enojo ${enojoValor}/8`;
    const estadoNegativo = enojoValor >= 4 || humorEfectivo < 6;
    if (estadoNegativo) btn.classList.add("mecanico-estado-negativo");
    const especialidadTxt = capitalizarRotulo(m.especialidad || "general");
    const rasgoMecanico = typeof obtenerPerfilRasgosMecanico === "function" ? obtenerPerfilRasgosMecanico(m.nombre) : null;
    const habilidadEspecialTxt = rasgoMecanico && rasgoMecanico.ventaja ? rasgoMecanico.ventaja : "Sin habilidad especial definida.";
    let estadoLinea = "Disponible";
    let estadoClase = "ok";
    let estadoIcono = "&#x25CF;";

    if (trabajosMecanicoCount > 0 && !ocupadoEnCasoActivo) {
      estadoLinea = `En trabajo · ${trabajosMecanicoCount}/${capacidadMecanico}`;
      estadoClase = "warn";
      estadoIcono = "&#x1F527;";
    } else if (ocupadoEnCasoActivo) {
      if (trabajoActivoMecanico.tipoTrabajo === "diagnostico") {
        estadoLinea = "Diagnosticando caso";
        estadoClase = "cooldown";
        estadoIcono = "&#x1F50E;";
      } else if (
        trabajoActivoMecanico.pausadaPorPieza ||
        trabajoActivoMecanico.tipoTrabajo === "pedir_piezas"
      ) {
        var entregaActivaMecanico = Array.isArray(entregasPiezasActivas)
          ? entregasPiezasActivas.find(function (entrega) {
              return (
                entrega &&
                String(entrega.idCaso || "") ===
                  String((trabajoActivoMecanico && trabajoActivoMecanico.idCaso) || "")
              );
            }) || null
          : null;
        estadoLinea = entregaActivaMecanico
          ? "Esperando delivery de piezas"
          : "Esperando piezas";
        estadoClase = "warn";
        estadoIcono = "&#x1F69A;";
      } else {
        estadoLinea = "Ocupado en reparacion";
        estadoClase = "cooldown";
        estadoIcono = "&#x1F527;";
      }
    } else if (enfriamientoTurnos > 0) {
      estadoLinea = descansando
        ? `Recuperando energía · ${energiaValor}%`
        : `Enfría ${formatearDuracionSegundos(enfriamientoSegundos)}`;
      estadoClase = "cooldown";
      estadoIcono = descansando ? "&#x1F50B;" : "&#x23F3;";
    } else if (bloqueoAyudaTurnos > 0) {
      estadoLinea = `Fuera ${formatearBloqueoAyudaMecanico(bloqueoAyudaTurnos)}`;
      estadoClase = "locked";
      estadoIcono = "&#x1F6A7;";
    } else if (bloqueadoHoy) {
      estadoLinea = "Bloqueado por hoy";
      estadoClase = "locked";
      estadoIcono = "&#x26D4;";
    } else if (enojoValor >= 4) {
      estadoLinea = "Tension alta";
      estadoClase = "warn";
      estadoIcono = "&#x26A0;";
    }

    const tensionAlta = enojoValor >= 4;
    const recursoBloqueado =
      ocupadoEnCasoActivo ||
      bloqueadoHoy ||
      enfriamientoTurnos > 0 ||
      bloqueoAyudaTurnos > 0 ||
      !!m.renunciaInminente;
    const candadoMecanico = recursoBloqueado && !tensionAlta;

    // In touch/mobile mode, draggable interferes with horizontal swipe.
    btn.draggable = !interaccionMovil && !recursoBloqueado;
    // La tensión alta debe ser seleccionable para poder explicar el bloqueo;
    // deshabilitar el botón hacía que el fallo fuera completamente silencioso.
    // En móvil debe poder tocarse incluso un mecánico ocupado/bloqueado para
    // recibir el motivo exacto; disabled silencia por completo el feedback.
    const bloqueoInteractivo = candadoMecanico;
    btn.disabled = false;
    btn.setAttribute("aria-disabled", bloqueoInteractivo ? "true" : "false");
    if (interaccionMovil) btn.style.touchAction = "pan-x";

    const bioCard =
      typeof obtenerBioMecanicoSeguro === "function"
        ? obtenerBioMecanicoSeguro(m.nombre)
        : { foto: "" };
    const fotoCard = construirAvatarConFallback(
      m.nombre,
      bioCard.foto,
      "mecanico-avatar",
      "mecanico-avatar-placeholder",
    );

    const avatarConProgreso = trabajoActivoMecanico
      ? `<span class="mecanico-progress-ring" style="--progress:${progresoTrabajoMecanico}%;" title="Progreso del trabajo: ${progresoTrabajoMecanico}%"><span class="mecanico-progress-ring-value">${progresoTrabajoMecanico}%</span>${fotoCard}</span>`
      : fotoCard;
    btn.innerHTML = `<div class="mecanico-card-head">
            <span class="mecanico-avatar-wrap ${trabajoActivoMecanico ? 'has-progress' : ''}">
                ${avatarConProgreso}
                <span class="mecanico-status mecanico-status-avatar ${estadoClase}" title="${estadoLinea}" aria-label="${estadoLinea}">${estadoIcono}</span>
                ${candadoMecanico ? '<span class="mecanico-lock-avatar" title="No disponible" aria-label="No disponible">&#x1F512;</span>' : ''}
            </span>
            <div class="mecanico-card-head-info">
                <strong class="mecanico-nombre">${m.nombre}</strong>
                <div class="mecanico-especialidad ${
                  m.especialidad === 'diagnostico' ? 'especialidad-diagnostico' :
                  m.especialidad === 'delivery' ? 'especialidad-delivery' :
                  m.especialidad === 'reparacion' ? 'especialidad-reparacion' : ''
                }">
                  ${especialidadTxt}
                </div>
            </div>
        </div>
        <div class="mecanico-meter">
            <span class="mecanico-meter-label" aria-hidden="true">&#x1F527;</span>
            <div class="mecanico-meter-track"><div class="mecanico-meter-fill skill" style="width:${habilidadFill}%;"></div></div>
            <span class="mecanico-meter-value">${habilidadValor}%</span>
        </div>
        <div class="mecanico-meter">
            <span class="mecanico-meter-label" aria-hidden="true">&#x26A1;</span>
            <div class="mecanico-meter-track"><div class="mecanico-meter-fill skill" style="width:${velocidadFill}%;background:#4fc3f7;"></div></div>
            <span class="mecanico-meter-value">${velocidadValor}%</span>
        </div>
        <div class="mecanico-meter">
            <span class="mecanico-meter-label" aria-hidden="true">&#x1F4CA;</span>
            <div class="mecanico-meter-track"><div class="mecanico-meter-fill skill" style="width:${eficienciaFill}%;background:#81c784;"></div></div>
            <span class="mecanico-meter-value">${eficienciaValor}%</span>
        </div>
        <div class="mecanico-meter mecanico-meter-energia" title="${descansando ? 'Recuperando energía durante el descanso' : 'Energía disponible'}">
            <span class="mecanico-meter-label" aria-hidden="true">&#x1F50B;</span>
            <div class="mecanico-meter-track"><div class="mecanico-meter-fill" style="width:${energiaValor}%;background:${descansando ? '#72d8ff' : '#9cdb78'};"></div></div>
            <span class="mecanico-meter-value">${descansando ? 'REC.' : energiaValor + '%'}</span>
        </div>
        <div class="mecanico-meter mecanico-meter-animo" title="${estadoAnimoDetalle}">
            <span class="mecanico-meter-label" aria-hidden="true">${estadoAnimoIcono}</span>
            <div class="mecanico-meter-track"><div class="mecanico-meter-fill" style="width:${estadoAnimoFill}%;background:${estadoAnimoColor};"></div></div>
            <span class="mecanico-meter-value">${estadoAnimoTexto}</span>
        </div>`;
    const penalidadEspecialTxt = rasgoMecanico && rasgoMecanico.desventaja ? rasgoMecanico.desventaja : "Sin penalidad especial.";
    btn.insertAdjacentHTML("beforeend", '<div class="mecanico-habilidad-especial" title="Habilidad: ' + limpiarHtmlBasico(habilidadEspecialTxt) + ' | Penalidad: ' + limpiarHtmlBasico(penalidadEspecialTxt) + '"><span><strong>Habilidad:</strong> ' + limpiarHtmlBasico(habilidadEspecialTxt) + '</span><span><strong>Penalidad:</strong> ' + limpiarHtmlBasico(penalidadEspecialTxt) + '</span></div>');
    if (ocupadoEnCasoActivo || enfriamientoTurnos > 0) {
      btn.classList.add("mecanico-enfriamiento");
    }
    if (descansando) btn.classList.add("mecanico-descansando");
    if (recursoBloqueado) {
      btn.classList.add("mecanico-no-disponible");
    }
    let pressTimer = 0;
    let longPressTriggered = false;
    if (interaccionMovil) {
      btn.addEventListener("pointerdown", function () {
        longPressTriggered = false;
        pressTimer = window.setTimeout(function () {
          longPressTriggered = true;
          if (typeof abrirPanelMecanico === "function") abrirPanelMecanico(idx);
          mostrarFeedbackGameplay(`${m.nombre}: perfil del mecánico abierto.`, "info");
        }, 550);
      });
      ["pointerup", "pointercancel", "pointerleave"].forEach(function (ev) {
        btn.addEventListener(ev, function () { if (pressTimer) window.clearTimeout(pressTimer); });
      });
    }
    btn.onclick = () => {
      if (longPressTriggered) { longPressTriggered = false; return; }
      if (ocupadoEnCasoActivo) {
        mostrarFeedbackGameplay(`${m.nombre} está ocupado con ${trabajoActivoMecanico.idCaso || 'otro caso'}. Espera a que termine antes de asignarle trabajo.`, "warn");
        return;
      }
      if (enfriamientoTurnos > 0 || bloqueoAyudaTurnos > 0 || bloqueadoHoy || m.renunciaInminente) {
        mostrarFeedbackGameplay(`${m.nombre} no está disponible: ${estadoLinea}.`, "warn");
        return;
      }
      if (estadoNegativo) {
        window.mecanicoPanelSeleccionadoIdx = idx;
        if (typeof abrirModal === "function") abrirModal("mecanicos");
        const lore = document.getElementById("mecanicos-lore");
        if (lore) lore.insertAdjacentHTML("afterbegin", `<div class="mecanico-alerta-estado"><strong>⚠ ${m.nombre} no está en condiciones positivas</strong><br>Humor: ${humorEfectivo.toFixed(1)}/10 · Enojo: ${enojoValor}/8.<br>Ayúdalo antes de asignarle un caso.<div class="mecanico-alerta-actions"><button class="btn" type="button" onclick="comprarPizza()">🍕 Dar comida al equipo</button><button class="btn" type="button" onclick="apoyarMecanicoDesdePanel()">🤝 Dar apoyo · RD$180</button><button class="btn" type="button" onclick="enviarMecanicoADescansarDesdePanel()">🛌 Dar descanso</button><button class="btn" type="button" onclick="hablarConMecanicoPanel()">💬 Hablar con el mecánico</button></div></div>`);
        mostrarFeedbackGameplay(`${m.nombre} no está disponible: tiene tensión alta. Atiende primero su estado antes de asignarle otro caso.`, "warn");
        return;
      }
      if (esInteraccionMovil()) {
        sfxClick();
        seleccionarMecanicoTapMovil(idx);
        return;
      }
      if (
        window.casoAprobadoSeleccionadoMovil &&
        typeof asignarCasoAprobadoSeleccionadoAMecanico === "function"
      ) {
        sfxAssign();
        asignarCasoAprobadoSeleccionadoAMecanico(idx);
        return;
      }
      if (typeof abrirPanelMecanico === "function") {
        sfxMenuOpen();
        abrirPanelMecanico(idx);
      }
    };
    if (!interaccionMovil) {
      btn.ondragover = permitirDropCliente;
      btn.ondragenter = () => btn.classList.add("drop-target");
      btn.ondragleave = () => btn.classList.remove("drop-target");
      btn.ondragstart = (event) => iniciarArrastreMecanico(event, idx);
      btn.ondragend = finalizarArrastreCliente;
      btn.ondrop = (event) => soltarClienteEnMecanico(event, idx);
    }
    grid.appendChild(btn);
  });

  const deliveryTotalBarra = Math.max(1, parseInt(repartidoresMax || 1, 10));
  const deliveryActivosBarra = Array.isArray(entregasPiezasActivas)
    ? entregasPiezasActivas.length
    : 0;
  const trabajosCompatiblesDelivery = obtenerTrabajosCompatiblesDelivery();
  const slotsDeliveryOcupados =
    typeof obtenerSlotsDeliveryOcupados === "function"
      ? obtenerSlotsDeliveryOcupados()
      : new Set();
  const deliveryAvatares = ["img/delivery/jefry.png", "img/delivery/ludo.png", "img/delivery/bido.png"];

  let deliveryContainer = document.getElementById("delivery-slots-top");
  if (!deliveryContainer) {
      const poolMecanicos = document.getElementById("mecanicos-grid");
      if (poolMecanicos && poolMecanicos.parentElement) {
          deliveryContainer = document.createElement("div");
          deliveryContainer.id = "delivery-slots-top";
          deliveryContainer.style.display = "flex";
          deliveryContainer.style.gap = "10px";
          deliveryContainer.style.marginBottom = "15px";
          deliveryContainer.style.overflowX = "auto";
          poolMecanicos.parentElement.insertBefore(deliveryContainer, poolMecanicos);
      }
  }
  if (deliveryContainer) deliveryContainer.innerHTML = "";

  for (let slot = 0; slot < deliveryTotalBarra; slot++) {
    const deliveryBtn = document.createElement("button");
    const avatar = deliveryAvatares[slot % deliveryAvatares.length];
    const statsDelivery =
      typeof obtenerStatsRepartidor === "function"
        ? obtenerStatsRepartidor(slot)
        : { nivel: 1, xp: 0 };
    const nivelDelivery = Math.max(
      1,
      Math.round((statsDelivery && statsDelivery.nivel) || 1),
    );
    const usoDelivery = `${deliveryActivosBarra}/${deliveryTotalBarra}`;
    const disponible = !slotsDeliveryOcupados.has(slot);
    const seleccionadoTap =
      disponible && window.deliveryTapSeleccionado === slot;
    deliveryBtn.className =
      `mecanico-btn delivery-slot-card ${disponible ? "is-available" : "is-unavailable"} ${seleccionadoTap ? "delivery-selected-mobile" : ""}`.trim();
    deliveryBtn.dataset.deliverySlot = String(slot);
    deliveryBtn.draggable = !!disponible && !interaccionMovil;
    if (interaccionMovil) deliveryBtn.style.touchAction = "pan-x";
    deliveryBtn.setAttribute(
      "aria-label",
      `Delivery ${slot + 1}: ${disponible ? "disponible" : "no disponible"}, nivel ${nivelDelivery}, uso ${usoDelivery}`,
    );
    deliveryBtn.title = `Delivery ${slot + 1} ${disponible ? "disponible" : "ocupado"}`;
    deliveryBtn.innerHTML = `<div class="mecanico-card-head compact">
            <img src="${avatar}" alt="Delivery" class="mecanico-avatar" onerror="this.style.display='none'">
            <div class="mecanico-card-head-info">
                <strong class="mecanico-nombre">Delivery ${slot + 1}</strong>
                <div class="mecanico-especialidad">Niv ${nivelDelivery} | ${trabajosCompatiblesDelivery.length} compatible(s)</div>
            </div>
            <span class="delivery-status-dot ${disponible ? "is-available" : "is-unavailable"}" aria-hidden="true"></span>
        </div>`;
    if (disponible && !interaccionMovil) {
      deliveryBtn.ondragstart = (event) => iniciarArrastreDelivery(event, slot);
      deliveryBtn.ondragend = finalizarArrastreCliente;
    }
    deliveryBtn.onclick = () => {
      sfxClick();
      seleccionarDeliveryTap(slot, disponible);
    };
    if (deliveryContainer) deliveryContainer.appendChild(deliveryBtn);
  }

  actualizarToolbarRecursosUI();

  if (recursosVisibles === 0) {
    const vacio = document.createElement("div");
    vacio.className = "mecanico-ficha";
    vacio.innerText = "No hay mecanicos disponibles en barra.";
    grid.appendChild(vacio);
  }

  // On mobile keep horizontal carousel behavior always active.
  if (interaccionMovil) {
    grid.classList.add("mecanicos-carrusel");
  } else {
    grid.classList.toggle("mecanicos-carrusel", recursosVisibles > 4);
  }

  const clienteWorkerBadge = document.getElementById("cliente-worker-badge") || document.createElement("div");
  const trabajoActivoPrincipal = Array.isArray(reparacionesActivas)
    ? reparacionesActivas.find(function (r) {
        return r && !r.listoParaCobro;
      }) ||
      reparacionesActivas[0] ||
      null
    : null;

  // --- Parche: temporizador local para barra de progreso del mecánico ---
  let progresoTimer = null;
  const renderizarBadgeMecanicoCaso = function (trabajo) {
    if (!clienteWorkerBadge) return;
    if (!trabajo) {
      clienteWorkerBadge.classList.add("hidden");
      clienteWorkerBadge.innerHTML = "";
      if (progresoTimer) {
        clearInterval(progresoTimer);
        progresoTimer = null;
      }
      return;
    }
    // Limpia temporizador anterior si existe
    if (progresoTimer) {
      clearInterval(progresoTimer);
      progresoTimer = null;
    }

    function actualizarBarra() {
      trabajo = normalizarReparacionActiva(trabajo) || trabajo;
      const total = Math.max(
        1,
        Math.round(
          trabajo.segundosTotalesReal || trabajo.duracionRealSeg || 1,
        ),
      );
      const restante = obtenerSegundosRestantesReparacion(trabajo);
      const progreso = trabajo.listoParaCobro
        ? 100
        : Math.max(
            0,
            Math.min(100, Math.round(((total - restante) / total) * 100)),
          );
      const bio =
        typeof obtenerBioMecanicoSeguro === "function"
          ? obtenerBioMecanicoSeguro(trabajo.mecanicoNombre || "")
          : { foto: "" };
      const avatar = construirAvatarConFallback(
        trabajo.mecanicoNombre || "Mecanico",
        bio.foto,
        "cliente-worker-avatar",
        "cliente-worker-avatar-placeholder",
      );
      var tarea = "En reparacion";
      var entregaCaso = Array.isArray(entregasPiezasActivas)
        ? entregasPiezasActivas.find(function (e) {
            return e && e.idCaso === trabajo.idCaso;
          })
        : null;
      if (trabajo.listoParaCobro) {
        tarea = "Trabajo terminado";
      } else if (trabajo.tipoTrabajo === "diagnostico") {
        tarea = "Diagnostico en curso";
      } else if (trabajo.pausadaPorPieza) {
        if (entregaCaso) {
          tarea = `Esperando delivery (${formatearDuracionSegundos(obtenerSegundosRestantesDelivery(entregaCaso))})`;
        } else {
          tarea = "Esperando piezas para continuar";
        }
      }
      const etaTexto = trabajo.listoParaCobro
        ? "Listo"
        : `ETA ${formatearDuracionSegundos(restante)}`;
      var deliveryCardBadge = "";
      if (entregaCaso) {
        var faseEntrega = obtenerFaseDelivery(entregaCaso);
        var etaEntrega = obtenerSegundosRestantesDelivery(entregaCaso);
        var deliveryImgsBadge = [
          "img/delivery/jefry.png",
          "img/delivery/ludo.png",
        ];
        var seedBadge = String(trabajo.idCaso || "")
          .split("")
          .reduce(function (acc, ch) {
            return acc + ch.charCodeAt(0);
          }, 0);
        var avatarDeliveryBadge =
          deliveryImgsBadge[seedBadge % deliveryImgsBadge.length];
        deliveryCardBadge = `<div class="cliente-delivery-card">
                    <div class="cliente-worker-head">
                        <img src="${avatarDeliveryBadge}" alt="Delivery" class="cliente-worker-avatar" onerror="this.style.display='none'">
                        <div class="cliente-worker-info">
                            <strong>Delivery</strong>
                            <span>${faseEntrega.fase}</span>
                        </div>
                          <div class="cliente-worker-eta">ETA ${formatearDuracionSegundos(etaEntrega)}</div>
                    </div>
                    <div class="cliente-worker-track"><div class="cliente-worker-fill" style="width:${faseEntrega.progreso}%;"></div></div>
                </div>`;
      }
      clienteWorkerBadge.innerHTML = `<div class="cliente-worker-main">
            <div class="cliente-worker-head">
                ${avatar}
                <div class="cliente-worker-info">
                    <strong>${trabajo.mecanicoNombre || "Mecanico"}</strong>
                    <span>${tarea}</span>
                </div>
                <div class="cliente-worker-eta">${etaTexto}</div>
            </div>
            <div class="cliente-worker-track"><div class="cliente-worker-fill" style="width:${progreso}%;"></div></div>
            </div>
            ${deliveryCardBadge}`;
      clienteWorkerBadge.classList.remove("hidden");
    }
    // Actualiza barra inmediatamente y luego cada 1s
    actualizarBarra();
    progresoTimer = setInterval(actualizarBarra, 1000);
  };

  if (esCasoActivoMiPuesto(clienteActual)) {
    if (typeof asegurarIdCasoCliente === "function")
      asegurarIdCasoCliente(clienteActual);
    asegurarExpedienteInspeccion(clienteActual);
    const tiempoRedondeado = Math.max(0, Math.round(tiempoCliente));
    const personaNombre =
      clienteActual.personaNombre ||
      obtenerNombreVisibleCliente(clienteActual) ||
      "Cliente sin nombre";
    const idCaso = clienteActual.idCaso || "CASO-0000";
    let estadoActivo = clienteActual.diagnosticado
      ? clienteActual.diagnosticoDetectado || "Dictamen emitido"
      : "Averia no identificada";
    let accionActiva = !clienteActual.diagnosticado
      ? "Diagnosticalo tu o arrastralo a un mecanico para diagnostico"
      : !clienteActual.aprobacionCliente
        ? "Negocia o confirma por WhatsApp antes de asignar"
        : "Arrastra para asignar mecanico";

    const setTextSafe = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };

    setTextSafe("cliente-nombre", `${idCaso} | ${personaNombre}`);
    setTextSafe("active-case-id", idCaso);
    setTextSafe("active-case-client", personaNombre);
    setTextSafe("cliente-vehiculo", clienteActual.vehiculo || "Vehiculo sin ficha");
    setTextSafe("active-case-vehicle", `Vehiculo: ${clienteActual.vehiculo || "Vehiculo sin ficha"}`);
    setTextSafe("cliente-pago", obtenerPagoEstimadoTexto(clienteActual));
    setTextSafe("active-case-reward", obtenerPagoEstimadoTexto(clienteActual));
    setTextSafe("cliente-dificultad", obtenerEtiquetaRiesgoTarjeta(clienteActual.dificultad));
    setTextSafe("active-case-difficulty", obtenerEtiquetaRiesgoTarjeta(clienteActual.dificultad));
    setTextSafe("cliente-estado", estadoActivo);
    setTextSafe("active-case-status", estadoActivo);
    setTextSafe("cliente-tiempo", formatearTiempoTrabajo(tiempoRedondeado));
    setTextSafe("active-case-time", formatearTiempoTrabajo(tiempoRedondeado));
    setTextSafe("cliente-accion", accionActiva);
    setTextSafe("active-case-action", accionActiva);
    const trabajoCasoActivo = Array.isArray(reparacionesActivas)
      ? reparacionesActivas.find(function (trabajo) {
          return (
            trabajo &&
            String(trabajo.idCaso || "") === String(idCaso || "")
          );
        }) || null
      : null;
    renderizarBadgeMecanicoCaso(trabajoCasoActivo);
  } else {
    renderizarBadgeMecanicoCaso(null);
  }

  if (typeof renderizarWorkspaceCasoActivo === "function") {
    renderizarWorkspaceCasoActivo();
  }
  aplicarPuestoTaller();

  if (typeof renderizarPanelReparaciones === "function") {
    renderizarPanelReparaciones();
  }
  if (typeof actualizarToolbarCasosTrabajoUI === "function") {
    actualizarToolbarCasosTrabajoUI();
  }
  if (typeof renderizarPendientesDiagnostico === "function") {
    renderizarPendientesDiagnostico();
  }
  if (typeof renderizarColaEspera === "function") {
    renderizarColaEspera();
  }
  if (typeof actualizarVisibilidadTabsPanelLateral === "function") {
    actualizarVisibilidadTabsPanelLateral();
  }
  if (typeof aplicarPanelLateral === "function") {
    aplicarPanelLateral();
  }
  if (typeof actualizarAvisoFinJornada === "function") {
    actualizarAvisoFinJornada();
  }
  if (typeof actualizarSiguienteAccionRecomendada === "function") {
    actualizarSiguienteAccionRecomendada();
  }
  if (typeof actualizarAtajoOperacionContextual === "function") {
    actualizarAtajoOperacionContextual();
  }
  if (typeof actualizarObjetivoOnboarding === "function") {
    actualizarObjetivoOnboarding();
  }
}

function renderizarWorkspaceCasoActivo() {
  const cont = document.getElementById("active-case-card");
  if (!cont) return;
  if (clienteActual) actualizarEstadoCanonicoCaso(clienteActual);

  const enMiPuesto = tallerPuestoActivo === "mi-puesto";
  const casoParaDiagnosticar = clienteActual && !clienteActual.diagnosticado && esCasoActivoMiPuesto(clienteActual);
  const trabajoDueno = typeof obtenerTrabajoDuenoActivo === "function" ? obtenerTrabajoDuenoActivo() : null;

  if (enMiPuesto && trabajoDueno && typeof renderizarBloqueoMiPuestoDueno === "function") {
    cont.dataset.workspaceMinigame = "owner-repair";
    cont.classList.remove("active-case-dx-shell");
    cont.innerHTML = renderizarBloqueoMiPuestoDueno(trabajoDueno);
    return;
  }

  if (enMiPuesto && casoParaDiagnosticar) {
    if (!clienteActual.estadoSocial && typeof crearEstadoSocialCliente === "function") {
      clienteActual.estadoSocial = crearEstadoSocialCliente(clienteActual.personalidad, clienteActual.miniHistoriaTipo);
    }
    const fichaVehiculoActiva = clienteActual.fichaVehiculo || {
      clase: clienteActual.claseVehiculo || "particular",
      uso: "uso mixto",
      desgaste: 0,
      calidadObjetivo: "estandar",
    };
    const evidenciasActivas = Array.isArray(clienteActual.ofDxSenalesDetectadas)
      ? clienteActual.ofDxSenalesDetectadas.slice(0, 4)
      : [];
    const evidenciasSeleccionadasActivas = Array.isArray(clienteActual.ofDxSenalesSeleccionadas)
      ? clienteActual.ofDxSenalesSeleccionadas.length
      : 0;
    const evidenciaHtml = evidenciasActivas.length
      ? evidenciasActivas.map(function(e) { return `✓ ${limpiarHtmlBasico(e)}`; }).join("<br>")
      : "Aún no hay evidencia. Elige una zona del vehículo para empezar.";
    // Se re-renderiza tras cada acción para que la evidencia sea inmediata.
    if (true) {
      cont.dataset.workspaceMinigame = "rhythm-dx";
      cont.insertAdjacentHTML('afterbegin', `<div class="inspection-360-panel"><div class="inspection-360-head">INSPECCIÓN 360° <strong>${limpiarHtmlBasico(clienteActual.idCaso || 'CASO')}</strong></div><h3>${limpiarHtmlBasico(clienteActual.personaNombre || 'Cliente')}</h3><div class="inspection-vehicle">${limpiarHtmlBasico(clienteActual.vehiculo || 'Vehículo sin ficha')}</div><p class="inspection-symptom">${limpiarHtmlBasico(clienteActual.declaracionCliente || clienteActual.miniHistoriaTexto || 'Revisa síntomas y evidencia.')}</p><div class="inspection-objective">Busca la causa principal sin desperdiciar tiempo.</div><div class="inspection-360-actions"><button class="btn btn-primary" type="button" onclick="hablarConCliente(true)">Preguntar</button><button class="btn" type="button" onclick="abrirInspeccionCliente()">Inspeccionar 360°</button><button class="btn" type="button" onclick="ofDxAbrirWhatsApp()">Abrir diagnóstico</button></div></div>`);
      cont.classList.add("active-case-dx-shell");
      cont.innerHTML = `
        <div class="inspection-360-panel">
          <div class="inspection-360-head">INSPECCION 360° <strong>${limpiarHtmlBasico(clienteActual.idCaso || 'CASO')}</strong></div>
          <h3>${limpiarHtmlBasico(clienteActual.personaNombre || 'Cliente')}</h3>
          <div class="inspection-vehicle">${limpiarHtmlBasico(clienteActual.vehiculo || 'Vehiculo sin ficha')}</div>
          ${typeof construirResumenEconomicoCaso === "function" ? construirResumenEconomicoCaso(clienteActual) : ""}
          <div class="inspection-live-status">${limpiarHtmlBasico(fichaVehiculoActiva.clase)} · ${limpiarHtmlBasico(fichaVehiculoActiva.uso)} · desgaste ${Math.max(0, Math.round(Number(fichaVehiculoActiva.desgaste) || 0))}% · repuesto ${limpiarHtmlBasico(fichaVehiculoActiva.calidadObjetivo)}</div>
          <div class="inspection-live-status">Cliente: ${limpiarHtmlBasico((clienteActual.estadoSocial && clienteActual.estadoSocial.emocion) || 'neutral')} · confianza ${Math.max(0, Math.round(Number(clienteActual.estadoSocial && clienteActual.estadoSocial.confianza) || 0))}%</div>
          <p class="inspection-symptom">${limpiarHtmlBasico(clienteActual.declaracionCliente || clienteActual.miniHistoriaTexto || 'Revisa sintomas y evidencia.')}</p>
           <div class="inspection-objective">Investiga antes de emitir el diagnostico.</div>
          <div class="inspection-evidence-summary"><strong>EVIDENCIAS ${evidenciasSeleccionadasActivas}/3</strong><br>${evidenciaHtml}</div>
          ${clienteActual.ofDxUltimaPruebaFeedback ? `<div class="inspection-live-status inspection-test-feedback">${limpiarHtmlBasico(clienteActual.ofDxUltimaPruebaFeedback)}</div>` : ""}
          <div class="inspection-tools">
             <button class="btn" type="button" onclick="ejecutarPruebaMiPuesto('visual')">Bahia del motor</button>
             <button class="btn" type="button" onclick="ejecutarPruebaMiPuesto('bujias')">Bujias y bobinas</button>
             <button class="btn" type="button" onclick="ejecutarPruebaMiPuesto('inyectores')">Inyectores</button>
             <button class="btn" type="button" onclick="ejecutarPruebaMiPuesto('aceite')">Aceite y fluidos</button>
             <button class="btn" type="button" onclick="ejecutarPruebaMiPuesto('electrico')">Bateria / alternador</button>
             <button class="btn" type="button" onclick="ejecutarPruebaMiPuesto('frenos')">Frenos</button>
             <button class="btn" type="button" onclick="ejecutarPruebaMiPuesto('suspension')">Tren delantero</button>
             <button class="btn" type="button" onclick="ejecutarPruebaMiPuesto('obd')">Escaner y codigos</button>
             <button class="btn" type="button" onclick="ejecutarPruebaMiPuesto('ruta')">Prueba de manejo</button>
             <button class="btn" type="button" onclick="hablarConCliente(true); refrescarMiPuestoDespuesAccion()">Preguntar al cliente</button>
          </div>
          <div class="inspection-360-actions">
            <button class="btn" type="button" onclick="abrirManualTaller()">Manual del Taller</button>
             <button class="btn" type="button" onclick="iniciarMiniJuegoMiPuesto()">Analizar 3 señales</button>
             <button class="btn btn-primary" type="button" onclick="diagnosticarCasoMiPuesto()" ${evidenciasSeleccionadasActivas < 3 ? 'disabled' : ''}>Emitir diagnostico</button>
          </div>
          <div class="inspection-live-status">Cada prueba revela evidencia y consume tiempo. Formula una hipotesis antes de emitir el diagnostico.</div>
        </div>
        `;
      insertarSelectorHipotesisMiPuesto();
    }
    // Lógica para iniciar o actualizar el juego de ritmo iría aquí
    // if (window.TallerApp && window.TallerApp.minigames && window.TallerApp.minigames.RhythmGame) { TallerApp.minigames.RhythmGame.init(clienteActual); }
  } else if (enMiPuesto && clienteActual && clienteActual.diagnosticado) {
    var idRevision = limpiarHtmlBasico(clienteActual.idCaso || "CASO-0000");
    var dictamenRevision = limpiarHtmlBasico(clienteActual.diagnosticoDetectado || clienteActual.diagnosticoSeleccionado || "Dictamen sin detalle");
    var confianzaRevision = Math.max(0, Math.min(100, Math.round(Number(clienteActual.ofDxConfianzaPct) || 0)));
    var aprobadoRevision = !!clienteActual.aprobacionCliente;
    var resultadoRevision = clienteActual.diagnosticoCorrecto
      ? "CORRECTO"
      : clienteActual.diagnosticoNivel === "parcial"
        ? "PARCIAL"
        : "INCORRECTO";
    var fallaRealRevision = !clienteActual.diagnosticoCorrecto
      ? limpiarHtmlBasico((Array.isArray(clienteActual.fallosPrincipales) && clienteActual.fallosPrincipales.length ? clienteActual.fallosPrincipales : [clienteActual.nombre || "Sin registro"]).join(" | "))
      : "";
    var impactoRevision = clienteActual.diagnosticoCorrecto
      ? "+XP del dueno · reputacion mejorada · menor riesgo de reparacion"
      : clienteActual.diagnosticoNivel === "parcial"
        ? "+XP reducido · sistema correcto, causa incompleta · riesgo medio"
        : "Tiempo perdido · confianza reducida · complicacion y riesgo altos";
    cont.dataset.workspaceMinigame = "revision-dx";
    cont.classList.remove("active-case-dx-shell");
    cont.innerHTML = `
      <div class="workspace-review-dx">
        <div class="flow-case-kicker">CASO EN REVISION · NO ES UN CASO NUEVO</div>
        <h3>${idRevision}</h3>
        <p><strong>Diagnostico:</strong> ${dictamenRevision}</p>
        <p><strong>Confianza:</strong> ${confianzaRevision}%</p>
        <div class="inspection-evidence-summary"><strong>Resultado: ${resultadoRevision}</strong>${fallaRealRevision ? '<br>Falla real: ' + fallaRealRevision : '<br>Tu hipotesis coincide con la falla principal.'}</div>
        <div class="inspection-live-status"><strong>Consecuencias:</strong> ${impactoRevision}</div>
        <div class="inspection-evidence-summary"><strong>Evidencias encontradas</strong><br>${clienteActual.inspeccion && Array.isArray(clienteActual.inspeccion.hallazgos) && clienteActual.inspeccion.hallazgos.length ? clienteActual.inspeccion.hallazgos.map(function(h){ return '✓ ' + limpiarHtmlBasico(h); }).join('<br>') : '? Todavia no has revisado evidencias'}</div>
        <p><strong>Estado del expediente:</strong> ${aprobadoRevision ? "Presupuesto aprobado · listo para asignar" : "Dictamen emitido · pendiente de aprobacion"}</p>
        <div class="rhythm-actions">
          <button class="btn" type="button" onclick="abrirInspeccionCliente()">Revisar evidencias</button>
          ${aprobadoRevision ? '<button class="btn btn-primary" type="button" onclick="prepararAsignacionCasoRevision(\'' + String(clienteActual.idCaso || '') + '\')">Asignar trabajo</button>' : '<button class="btn" type="button" onclick="ofDxNegociarCasoActivo()">Negociar presupuesto</button><button class="btn btn-primary" type="button" onclick="confirmarPresupuestoMiPuesto()">Confirmar presupuesto</button>'}
        </div>
        ${aprobadoRevision && Array.isArray(mecanicos) ? '<div class="inspection-assignment"><strong>QUIEN HACE EL TRABAJO</strong><div class="inspection-assignment-grid"><button class="btn btn-primary" type="button" onclick="asignarCasoRevisionADueno(\'' + String(clienteActual.idCaso || '') + '\')">Lo hago yo · mas XP y margen</button>' + mecanicos.map(function(m, i) { return '<button class="btn" type="button" onclick="asignarCasoRevisionAMecanico(\'' + String(clienteActual.idCaso || '') + '\', ' + i + ')">Asignar a ' + limpiarHtmlBasico(m.nombre || ('Mecanico ' + (i + 1))) + '</button>'; }).join('') + '</div></div>' : ''}
      </div>`;
  } else {
    // No hay caso para diagnosticar en "mi puesto"
    if (cont.dataset.workspaceMinigame !== "none") {
      cont.dataset.workspaceMinigame = "none";
      cont.classList.remove("active-case-dx-shell");
      cont.innerHTML = `
        <div class="workspace-placeholder">
          <h3>Mi Puesto</h3>
          <p>Selecciona un caso de la cola o de 'Pendientes DX' para empezar a diagnosticar.</p>
          <p>Si un caso ya está diagnosticado, negocia con el cliente o asígnalo a un mecánico.</p>
        </div>`;
    }
  }
}

function refrescarMiPuestoDespuesAccion() {
  setTimeout(function () {
    if (typeof cerrarModal === "function") cerrarModal();
    tallerPuestoActivo = "mi-puesto";
    aplicarPuestoTaller();
    renderizarWorkspaceCasoActivo();
    insertarSelectorHipotesisMiPuesto();
  }, 20);
}

function ejecutarPruebaMiPuesto(tipo) {
  if (!clienteActual || clienteActual.diagnosticado) return false;
  if (!Array.isArray(clienteActual.ofDxSenalesSeleccionadas)) clienteActual.ofDxSenalesSeleccionadas = [];
  if (clienteActual.ofDxSenalesSeleccionadas.indexOf(tipo) >= 0) {
    mostrarFeedbackGameplay("Esa evidencia ya fue seleccionada. Elige otra.", "info");
    return false;
  }
  if (clienteActual.ofDxSenalesSeleccionadas.length >= 3) {
    mostrarFeedbackGameplay("Ya seleccionaste las 3 evidencias. Ahora puedes emitir el diagnóstico.", "info");
    return false;
  }
  if (typeof ofDxAccionTecnica !== "function") return false;
  var cfgAntes = ofDxCatalogoPruebas()[tipo] || null;
  var clave = cfgAntes ? cfgAntes.id : tipo;
  ofDxAccionTecnica(tipo, { soloMiPuesto: true });
  var ejecutada = !!(clienteActual.ofDxEstado && clienteActual.ofDxEstado.accionesTecnicas && clienteActual.ofDxEstado.accionesTecnicas[clave]);
  if (ejecutada) {
    clienteActual.ofDxSenalesSeleccionadas.push(tipo);
    var total = clienteActual.ofDxSenalesSeleccionadas.length;
    mostrarFeedbackGameplay(
      total === 3
        ? "Análisis completo: seleccionaste las 3 evidencias. Ya puedes emitir el diagnóstico."
        : `Evidencia ${total}/3 seleccionada. Elige ${3 - total} más.`,
      total === 3 ? "ok" : "info"
    );
    var evidenciaNueva = Array.isArray(clienteActual.ofDxSenalesDetectadas) ? clienteActual.ofDxSenalesDetectadas[0] : "";
    mostrarFeedbackGameplay("Evidencia obtenida: " + (evidenciaNueva || "prueba registrada") + ". Caso en analisis.", "ok");
  } else if (typeof hayConversacionNarrativaBloqueanteActiva === "function" && hayConversacionNarrativaBloqueanteActiva()) {
    mostrarFeedbackGameplay("Nuevo mensaje urgente: responde en Telefono para continuar el diagnostico.", "warn");
    if (typeof pushMensajeTelefono === "function") pushMensajeTelefono("sistema", "sistema", "Nuevo mensaje urgente: responde esta interrupcion para continuar el diagnostico. Puedes volver al Taller despues de contestar.", { clave: "dx-interrupcion-" + (clienteActual.idCaso || "") });
  }
  refrescarMiPuestoDespuesAccion();
  return true;
}

function diagnosticarCasoMiPuesto() {
  if (!clienteActual || clienteActual.diagnosticado) return false;
  var evidenciasSeleccionadas = Array.isArray(clienteActual.ofDxSenalesSeleccionadas) ? clienteActual.ofDxSenalesSeleccionadas.length : 0;
  if (evidenciasSeleccionadas < 3) {
    mostrarFeedbackGameplay(`Selecciona ${3 - evidenciasSeleccionadas} evidencia(s) más antes de emitir el diagnóstico.`, "warn");
    return false;
  }
  if (!clienteActual.ofDxHipotesisPrincipal) {
    mostrarFeedbackGameplay("Elige una hipótesis principal antes de emitir el diagnóstico.", "warn");
    return false;
  }
  // Nunca se rellena la respuesta real: el dictamen usa la hipótesis del dueño.
  var fallosConfirmados = [clienteActual.ofDxHipotesisPrincipal];
  if (clienteActual.ofDxHipotesisSecundaria && clienteActual.ofDxHipotesisSecundaria !== clienteActual.ofDxHipotesisPrincipal) {
    fallosConfirmados.push(clienteActual.ofDxHipotesisSecundaria);
  }
  var sugerencia = fallosConfirmados[0] || clienteActual.ofDxSugerencia || clienteActual.diagnosticoSeleccionado;
  if (!sugerencia) {
    mostrarFeedbackGameplay("Haz al menos una prueba antes de cerrar el diagnóstico.", "warn");
    return false;
  }
  clienteActual.diagnosticoSeleccionado = sugerencia;
  clienteActual.diagnosticosDetectados = fallosConfirmados.length ? fallosConfirmados : [sugerencia];
  var evidencias = Array.isArray(clienteActual.ofDxSenalesDetectadas)
    ? clienteActual.ofDxSenalesDetectadas.length
    : 0;
  var topeConfianza = evidencias >= 3 ? 95 : evidencias >= 2 ? 75 : 55;
  clienteActual.ofDxConfianzaPct = Math.min(
    topeConfianza,
    Math.max(55, Math.round(clienteActual.ofDxConfianzaElegida || 55)),
  );
  clienteActual.ofDxValidacionGuiada = false;
  if (typeof ofDxEmitirDiagnostico === "function") ofDxEmitirDiagnostico();
  refrescarMiPuestoDespuesAccion();
  return true;
}

function insertarSelectorHipotesisMiPuesto() {
  if (!clienteActual || clienteActual.diagnosticado || tallerPuestoActivo !== "mi-puesto") return;
  var cont = document.getElementById("active-case-card");
  if (!cont || cont.querySelector(".inspection-hypothesis-panel")) return;
  if (typeof asegurarDiagnosticoJugador === "function") asegurarDiagnosticoJugador(clienteActual);
  var opciones = Array.isArray(clienteActual.diagnosticoOpciones) ? clienteActual.diagnosticoOpciones.filter(Boolean).slice(0, 6) : [];
  if (!opciones.length) return;
  var esc = function(v) { return String(v || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&#39;"); };
  var principal = String(clienteActual.ofDxHipotesisPrincipal || "");
  var secundaria = String(clienteActual.ofDxHipotesisSecundaria || "");
  var evidencias = Array.isArray(clienteActual.ofDxSenalesDetectadas) ? clienteActual.ofDxSenalesDetectadas.length : 0;
  var maximo = evidencias >= 3 ? 95 : evidencias >= 2 ? 75 : 55;
  var confianza = Math.min(maximo, Math.max(55, Number(clienteActual.ofDxConfianzaElegida) || 55));
  var boton = function(nombre, tipo, activo) {
    return '<button class="inspection-hypothesis ' + (activo ? 'is-selected' : '') + '" type="button" onclick="seleccionarHipotesisMiPuesto(\'' + tipo + '\', this.dataset.dx)" data-dx="' + esc(nombre) + '">' + esc(nombre) + '</button>';
  };
  var panel = document.createElement("section");
  panel.className = "inspection-hypothesis-panel";
  panel.innerHTML = '<strong>HIPÓTESIS PRINCIPAL</strong><div class="inspection-hypothesis-grid">' + opciones.map(function(n) { return boton(n, "principal", n === principal); }).join("") + '</div><strong>FALLA SECUNDARIA <small>opcional</small></strong><div class="inspection-hypothesis-grid">' + boton("No hay segunda falla", "secundaria", !secundaria) + opciones.filter(function(n) { return n !== principal; }).slice(0, 4).map(function(n) { return boton(n, "secundaria", n === secundaria); }).join("") + '</div><strong>CONFIANZA <small>máximo ' + maximo + '% según pruebas hechas</small></strong><div class="inspection-confidence-grid">' + [55,75,95].map(function(n) { return '<button class="inspection-confidence ' + (confianza === n ? 'is-selected' : '') + '" type="button" ' + (n > maximo ? 'disabled' : '') + ' onclick="seleccionarConfianzaMiPuesto(' + n + ')">' + (n === 55 ? 'Baja' : n === 75 ? 'Media' : 'Alta') + ' · ' + n + '%</button>'; }).join("") + '</div>';
  var acciones = cont.querySelector(".inspection-360-actions");
  if (acciones) acciones.parentNode.insertBefore(panel, acciones);
}

function seleccionarHipotesisMiPuesto(tipo, nombre) {
  if (!clienteActual || clienteActual.diagnosticado) return;
  var valor = nombre === "No hay segunda falla" ? "" : String(nombre || "");
  if (tipo === "secundaria") clienteActual.ofDxHipotesisSecundaria = valor;
  else {
    clienteActual.ofDxHipotesisPrincipal = valor;
    if (clienteActual.ofDxHipotesisSecundaria === valor) clienteActual.ofDxHipotesisSecundaria = "";
  }
  var panel = document.querySelector(".inspection-hypothesis-panel");
  if (panel) panel.remove();
  insertarSelectorHipotesisMiPuesto();
}

function seleccionarConfianzaMiPuesto(nivel) {
  if (!clienteActual || clienteActual.diagnosticado) return;
  clienteActual.ofDxConfianzaElegida = Number(nivel) || 55;
  var panel = document.querySelector(".inspection-hypothesis-panel");
  if (panel) panel.remove();
  insertarSelectorHipotesisMiPuesto();
}

function iniciarMiniJuegoMiPuesto() {
  var cantidad = clienteActual && Array.isArray(clienteActual.ofDxSenalesSeleccionadas)
    ? clienteActual.ofDxSenalesSeleccionadas.length : 0;
  mostrarFeedbackGameplay(
    cantidad >= 3
      ? "Correcto: ya seleccionaste las 3 evidencias. Puedes emitir el diagnóstico."
      : `Selecciona ${3 - cantidad} evidencia(s) del vehículo para continuar.`,
    cantidad >= 3 ? "ok" : "info"
  );
  return cantidad >= 3;
}

function confirmarPresupuestoMiPuesto() {
  if (!clienteActual || !clienteActual.diagnosticado) return false;
  clienteActual.negociado = true;
  clienteActual.aprobacionCliente = true;
  clienteActual.rechazosNegociacion = 0;
  if (typeof ajustarEstadoSocialCliente === "function") ajustarEstadoSocialCliente(clienteActual, "aprobado");
  if (typeof actualizarCasoAtendido === "function") {
    actualizarCasoAtendido(clienteActual, "listo_asignacion", "Presupuesto confirmado desde Mi Puesto.");
  }
  mostrarFeedbackGameplay("Presupuesto aprobado. Elige quién realizará el trabajo.", "ok");
  refrescarMiPuestoDespuesAccion();
  return true;
}

function ofDxNegociarCasoActivo() {
  negociarCliente();
  setTimeout(function () {
    if (typeof actualizarUI === "function") actualizarUI();
  }, 20);
}

function ofDxAceptarContraofertaCasoActivo() {
  aceptarCondicionClienteWhatsApp();
  setTimeout(function () {
    if (typeof actualizarUI === "function") actualizarUI();
  }, 20);
}

function actualizarToolbarRecursosUI() {
  const esMovil = window.innerWidth < 900;
  const abierto = esMovil ? !!window.toolbarRecursosAbierto : true;
  const seleccionado =
    window.toolbarRecursosTab === "delivery" ? "delivery" : "mecanicos";
  const card =
    document.getElementById("taller-recursos-card") ||
    document.getElementById("pending-dx-card");
  const tabMecanicos = document.getElementById("toolbar-tab-mecanicos");
  const tabDelivery = document.getElementById("toolbar-tab-delivery");
  const toggleBtn = document.getElementById("resource-toolbar-toggle");
  const toggleIcon = document.getElementById("resource-toolbar-toggle-icon");
  const poolMecanicos =
    document.getElementById("mecanicos-grid") ||
    document.getElementById("grid-mecanicos");
  const poolDelivery = document.getElementById("delivery-slots-top");

  if (tabMecanicos) {
    const activo = seleccionado === "mecanicos";
    tabMecanicos.classList.toggle("active", activo);
    tabMecanicos.setAttribute("aria-selected", activo ? "true" : "false");
  }
  if (tabDelivery) {
    const activo = seleccionado === "delivery";
    tabDelivery.classList.toggle("active", activo);
    tabDelivery.setAttribute("aria-selected", activo ? "true" : "false");
  }
  if (toggleBtn) {
    toggleBtn.setAttribute("aria-expanded", abierto ? "true" : "false");
    toggleBtn.classList.toggle("is-open", abierto);
    toggleBtn.classList.toggle("hidden", !esMovil);
  }
  if (toggleIcon) {
    toggleIcon.innerHTML = abierto ? "&#9652;" : "&#9662;";
  }
  if (poolMecanicos) {
    poolMecanicos.classList.toggle(
      "hidden",
      !(abierto && seleccionado === "mecanicos"),
    );
  }
  if (poolDelivery) {
    poolDelivery.classList.toggle(
      "hidden",
      !(abierto && seleccionado === "delivery"),
    );
  }
  if (card) {
    card.classList.toggle("is-collapsed", esMovil && !abierto);
  }
}

function seleccionarToolbarRecursos(tab) {
  const seleccionado = tab === "delivery" ? "delivery" : "mecanicos";
  if (window.innerWidth >= 900) {
    window.toolbarRecursosTab = seleccionado;
  } else if (
    window.toolbarRecursosTab === seleccionado &&
    window.toolbarRecursosAbierto
  ) {
    window.toolbarRecursosAbierto = false;
  } else {
    window.toolbarRecursosTab = seleccionado;
    window.toolbarRecursosAbierto = true;
  }
  actualizarToolbarRecursosUI();
}

function toggleToolbarRecursos() {
  if (window.innerWidth >= 900) return;
  window.toolbarRecursosAbierto = !window.toolbarRecursosAbierto;
  actualizarToolbarRecursosUI();
}

function colapsarToolbarRecursos() {
  if (window.innerWidth >= 900) return;
  window.toolbarRecursosAbierto = false;
  actualizarToolbarRecursosUI();
}

if (typeof window !== "undefined") {
  window.toggleToolbarRecursos = toggleToolbarRecursos;
}

function abrirEscenaOficina() {
  navegarPantalla("oficina");
}

function cerrarEscenaOficina() {
  navegarPantalla("taller");
}

function toggleOperacionesSubmenu() {
  const submenu = document.getElementById("acciones-submenu");
  const btn = document.getElementById("btn-toggle-operaciones");
  if (!submenu) return;
  const abierto = submenu.classList.toggle("hidden") === false;
  if (btn) {
    btn.innerText = abierto ? "✕ Cerrar Menu" : "☰ Operaciones";
    btn.classList.toggle("is-open", abierto);
  }
}

function actualizarAtajoOperacionContextual() {
  var btn = document.getElementById("btn-atajo-contextual");
  if (!btn) return;

  var recomendacion =
    window.ultimaSiguienteAccionRecomendada ||
    obtenerSiguienteAccionRecomendada();
  var tieneAccion = !!(recomendacion && recomendacion.accion);
  var texto =
    recomendacion && recomendacion.ctaLabel
      ? recomendacion.ctaLabel
      : "Sin atajo";

  btn.disabled = !tieneAccion;
  btn.classList.toggle("is-idle", !tieneAccion);
  btn.innerText = `⚡ ${texto}`;
  btn.title = tieneAccion
    ? `Siguiente accion sugerida: ${texto}`
    : "No hay accion prioritaria por ahora.";
}

function ejecutarAtajoOperacionContextual() {
  var btn = document.getElementById("btn-atajo-contextual");
  if (btn && btn.disabled) return;
  if (typeof ejecutarSiguienteAccionRecomendada === "function") {
    ejecutarSiguienteAccionRecomendada();
  }
}

function cambiarTabMovil(tab) {
  if (tab !== "taller" && tab !== "gestion") {
    tab = "taller";
  }
  tabMovilActiva = tab;
  aplicarTabsMovil();
}

function aplicarTabsMovil() {
  const esMovil = window.innerWidth <= 700;
  if (tabMovilActiva !== "taller" && tabMovilActiva !== "gestion") {
    tabMovilActiva = "taller";
  }
  const paneles = {
    taller: document.getElementById("panel-taller"),
    gestion: document.getElementById("panel-gestion"),
  };
  const botones = {
    taller: document.getElementById("tab-btn-taller"),
    gestion: document.getElementById("tab-btn-gestion"),
  };

  Object.keys(paneles).forEach((k) => {
    const p = paneles[k];
    const b = botones[k];
    if (!p || !b) return;
    p.classList.remove("active");
    b.classList.remove("active");
    if (!esMovil || tabMovilActiva === k) {
      p.classList.add("active");
      if (tabMovilActiva === k || (!esMovil && k === "taller"))
        b.classList.add("active");
    }
  });
}

function obtenerEstadoBarra(valor) {
  if (valor >= 75)
    return { clase: "estado-critico", tag: "critico", texto: "Critico" };
  if (valor >= 45)
    return { clase: "estado-alerta", tag: "alerta", texto: "Alerta" };
  return { clase: "estado-estable", tag: "estable", texto: "Estable" };
}

function aplicarEstadoBarra(idBarra, idTag, valor) {
  const barra = document.getElementById(idBarra);
  const tag = document.getElementById(idTag);
  const estado = obtenerEstadoBarra(valor);
  barra.classList.remove("estado-estable", "estado-alerta", "estado-critico");
  barra.classList.add(estado.clase);
  tag.className = `estado-tag ${estado.tag}`;
  tag.innerText = estado.texto;
}

function actualizarEstadoJugadorVisual() {
  if (modoNivelesActivo() || esModoCasosPuro()) {
    const resumenNivel = document.getElementById("estado-resumen");
    if (resumenNivel) {
      const pct = Math.round(
        (progresoNivel / Math.max(1, progresoNivelMeta)) * 100,
      );
      const arcosLista =
        (window.TallerData && window.TallerData.arcoNarrativo) || [];
      const arcoActivo = arcosLista.find(function (a) {
        return a.id === arcoNarrativoActual;
      });
      const nombreArco = arcoActivo ? arcoActivo.titulo : "Operacion en curso";
      resumenNivel.innerText = `${nombreArco} — Nivel ${nivelJugador} | ${pct}% al siguiente | RD$${Math.round(ahorroAcumulado)} generados`;
    }
    return;
  }

  aplicarEstadoBarra("barra-hambre", "tag-hambre", hambre);
  aplicarEstadoBarra("barra-sueno", "tag-sueno", sueno);
  aplicarEstadoBarra("barra-estres", "tag-estres", estres);

  const resumen = document.getElementById("estado-resumen");
  const promedio = (hambre + sueno + estres) / 3;
  let texto = "Condicion general: operativa.";
  if (promedio >= 75) {
    texto = "Condicion general: en crisis. Atiende bar o descanso.";
  } else if (promedio >= 50) {
    texto = "Condicion general: tensa. El rendimiento puede caer.";
  }
  resumen.innerText = texto;
}

function actualizarPanelDueno() {
  const alerta = document.getElementById("dueno-alerta");
  if (!alerta) return;

  if (modoNivelesActivo() || esModoCasosPuro()) {
    const pct = Math.round(
      (progresoNivel / Math.max(1, progresoNivelMeta)) * 100,
    );
    const ritmo =
      typeof obtenerResumenRitmoTaller === "function"
        ? obtenerResumenRitmoTaller()
        : { combo: 0, impulso: 0 };
    const colaCritica = Array.isArray(clientesEnEspera)
      ? clientesEnEspera.filter((c) => c && c.pacienciaCola <= 35).length
      : 0;
    const deudaTexto = `Deuda RD$${Math.round(deuda || 0)}`;
    const clasePulso = ritmo.impulso >= 72 ? "warn" : "";
    alerta.className = `owner-alert ${clasePulso}`.trim();
    alerta.innerText = `Nivel ${nivelJugador} | Progreso ${pct}% | ${deudaTexto} | Combo x${ritmo.combo || 0} | Impulso ${ritmo.impulso || 0}%${colaCritica > 0 ? ` | Cola critica ${colaCritica}` : ""}`;
    return;
  }

  let texto = "Pulso controlado";
  let clase = "";

  if (estres >= 75 || focoDiaActual <= 2 || deuda > saldo + 2500) {
    clase = "danger";
    if (estres >= 75)
      texto = "Pulso critico: el estres se esta comiendo el dia";
    else if (focoDiaActual <= 2) texto = "Pulso critico: energia casi vacia";
    else texto = "Pulso critico: la deuda domina la caja";
  } else if (
    clientesEnEspera.some((c) => c.pacienciaCola <= 35) ||
    reparacionesActivas.filter(function (rep) { return rep && !rep.listoParaCobro; }).length >= espaciosReparacionMax ||
    (hambre + sueno + estres) / 3 >= 50
  ) {
    clase = "warn";
    if (clientesEnEspera.some((c) => c.pacienciaCola <= 35))
      texto = "Pulso tenso: hay clientes al borde de irse";
    else if (reparacionesActivas.filter(function (rep) { return rep && !rep.listoParaCobro; }).length >= espaciosReparacionMax)
      texto = "Pulso tenso: el taller esta al limite";
    else texto = "Pulso tenso: el dueno empieza a fallar";
  }

  alerta.className = `owner-alert ${clase}`.trim();
  alerta.innerText = texto;
}

function limpiarHtmlBasico(texto) {
  return String(texto || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^>\s*/, "")
    .trim();
}

function marcarOrigenCasoActivo(cliente, origen) {
  if (!cliente || typeof cliente !== "object") return cliente;
  cliente.origenCasoActivo = origen === "mi-puesto" ? "mi-puesto" : origen || "";
  return cliente;
}

function actualizarEstadoCanonicoCaso(caso) {
  if (!caso || typeof caso !== "object") return "sin_caso";
  var trabajo = (reparacionesActivas || []).find(function (r) { return r && r.idCaso === caso.idCaso; });
  var estado = trabajo
    ? (trabajo.listoParaCobro ? "listo_retiro_pago" : (trabajo.pausadaPorPieza ? "falta_pieza" : trabajo.tipoTrabajo === "diagnostico" ? "en_diagnostico" : "en_reparacion"))
    : caso.diagnosticado
      ? (caso.aprobacionCliente ? "listo_asignacion" : "esperando_aprobacion")
      : "en_cola";
  caso.estadoCanonico = estado;
  return estado;
}

function esCasoActivoMiPuesto(cliente) {
  return !!(
    cliente &&
    typeof cliente === "object" &&
    String(cliente.origenCasoActivo || "") === "mi-puesto"
  );
}

function construirBadgesRitmoCaso(caso) {
  return [
    caso && caso.casoCaliente
      ? '<span class="flow-case-tag hot">CALIENTE</span>'
      : "",
    caso && caso.cadenaEspecialidadActiva
      ? '<span class="flow-case-tag chain">CADENA</span>'
      : "",
    caso && caso.miniHistoriaTipo === "retorno_encadenado"
      ? '<span class="flow-case-tag accent">RETORNO</span>'
      : "",
  ]
    .filter(Boolean)
    .join("");
}

function evaluarEconomiaCaso(caso) {
  const ingreso = Math.max(0, Math.round(Number(caso && caso.pago) || 0));
  const dificultad = Math.max(0, Math.min(1, Number(caso && caso.dificultad) || 0.5));
  const catalogo = ECONOMY_DATA && Array.isArray(ECONOMY_DATA.catalogoRepuestos) ? ECONOMY_DATA.catalogoRepuestos : [];
  const piezas = catalogo.filter(function(p) { return p && p.especialidad === (caso && caso.especialidadIdeal); });
  const costoPiezas = Math.round((piezas.length ? piezas.reduce(function(s, p) { return s + (Number(p.costo) || 0); }, 0) / piezas.length : 180) * (1 + dificultad * 0.22));
  return { ingreso: ingreso, costoPiezas: costoPiezas, neto: ingreso - costoPiezas };
}

function obtenerCompensacionEstrategicaCaso(caso) {
  if (!caso) return "";
  if (caso.esVIP || caso.tipoCaso === "premium" || caso.segmento === "premium") return "Cliente premium: reputación +2 y posible referencia futura.";
  if (caso.tipoCaso === "flota") return "Unidad de flota: reputación +1 y opción de contrato futuro.";
  if (caso.urgencia === "alta") return "Urgencia resuelta: reputación +1.";
  if (caso.miniHistoriaTipo === "frecuente") return "Cliente frecuente: mejora fidelidad y futuras visitas.";
  return "Pérdida estratégica aceptada: se prioriza mantener el caso y la reputación del taller.";
}

function construirTarjetaCasoLista(config) {
  const esc =
    config && typeof config.esc === "function"
      ? config.esc
      : function (v) {
          return String(v || "");
        };
  const clases = ["flow-case-card", "flow-case-list", config.claseExtra || ""]
    .filter(Boolean)
    .join(" ");
  const atributos = (config.atributos || "").trim();
  const metaItems = [config.vehiculo, config.metaSecundaria, config.metaExtra]
    .filter(Boolean)
    .map(function (item) {
      return `<span>${esc(item)}</span>`;
    })
    .join("");
  const badgesHtml = config.badgesHtml
    ? `<div class="case-tag-row flow-case-list-tags">${config.badgesHtml}</div>`
    : "";
  const pacienciaHtml = config.pacienciaHtml || "";
  const casoEvaluado = config.caso && typeof config.caso === "object" ? config.caso : null;
  let evaluacionHtml = "";
  if (casoEvaluado) {
    const economia = evaluarEconomiaCaso(casoEvaluado);
    const ingreso = economia.ingreso;
    const dificultad = Math.max(0, Math.min(1, Number(casoEvaluado.dificultad) || 0.5));
    const costoPiezas = economia.costoPiezas;
    const beneficio = economia.neto;
    const minutos = Math.max(10, Math.round((Number(casoEvaluado.tiempo) || 4) * 6 + (Array.isArray(casoEvaluado.complicaciones) ? casoEvaluado.complicaciones.length * 5 : 0)));
    let mejor = null;
    (Array.isArray(mecanicos) ? mecanicos : []).forEach(function(m) {
      if (!m || m.ocupado) return;
      let compat = 48 + Math.round((Number(m.habilidad) || 0.5) * 28 + (Number(m.eficiencia) || 0.5) * 16 - (Number(m.enojo) || 0) * 3);
      if (m.especialidad === casoEvaluado.especialidadIdeal) compat += 18;
      compat = Math.max(1, Math.min(99, compat));
      if (!mejor || compat > mejor.compat) mejor = { nombre: m.nombre, compat: compat };
    });
    const riesgoTxt = dificultad >= 0.82 ? 'Alto' : (dificultad >= 0.62 ? 'Medio' : 'Bajo');
    if (casoEvaluado.contradiccionActiva && !casoEvaluado.contradiccionDetectada) {
      evaluacionHtml += '<span class="case-warning">Pista: el relato contiene datos que no encajan. Entrevista al cliente antes de asignar.</span>';
    }
    const riesgoClase = dificultad >= 0.82 ? 'risk-high' : (dificultad >= 0.62 ? 'risk-mid' : 'risk-low');
    const tipoCaso = casoEvaluado.etiquetaCaso || 'Servicio de taller';
    const urgencia = casoEvaluado.urgencia || 'media';
    const compensacion = obtenerCompensacionEstrategicaCaso(casoEvaluado);
    const resultadoEconomico = beneficio < 0 ? `PÉRDIDA ESTIMADA: -RD$${Math.abs(beneficio)}` : `Ganancia neta ~RD$${beneficio}`;
    evaluacionHtml = `<div class="flow-case-economy ${beneficio < 250 ? 'low-margin' : ''}"><span>Tipo: ${esc(tipoCaso)}</span><span>Urgencia: ${esc(urgencia)}</span><span>Ingreso RD$${ingreso}</span><span>Piezas ~RD$${costoPiezas}</span><strong>${resultadoEconomico}</strong>${beneficio < 0 ? `<span>Motivo estratégico: ${esc(compensacion || 'ninguno: negocia o rechaza sin penalización.')}</span>` : ''}<span>Duracion: ${minutos} min</span><span class="case-risk ${riesgoClase}">Riesgo: ${riesgoTxt}</span><span>Mejor mecanico: ${esc(mejor ? mejor.nombre : 'sin disponibilidad')} ${mejor ? mejor.compat + '%' : ''}</span></div>`;
  }
  // Expandible/contraíble para relatos largos
  let detalleHtml = "";
  if (config.detalleTexto) {
    const texto = esc(config.detalleTexto);
    const idDetalle = `detalle-caso-${Math.random().toString(36).substr(2, 8)}`;
    // Mostrar siempre el relato completo expandido
    detalleHtml = `<div class="flow-case-note flow-case-note-collapsible" id="${idDetalle}">
      <strong class="flow-case-inline-label">${esc(config.detalleLabel || "Detalle") }:</strong> 
      <span class="detalle-full">${texto}</span>
      <button class="btn-expandir-caso" type="button" aria-expanded="false" aria-controls="${idDetalle}" onclick="event.stopPropagation(); toggleExpandirRelatoCaso('${idDetalle}', this)">Ver relato</button>
    </div>`;
  }
  const notaHtml = config.nota
    ? `<div class="flow-case-footnote">${esc(config.nota)}</div>`
    : "";
  // Ocultar botones de acción en las tarjetas de casos
  const origenAccion = String(config.origen || 'cola').replace(/[^a-z-]/gi, '') || 'cola';
  const accionLabel = casoEvaluado && casoEvaluado.diagnosticado ? 'Revisar caso' : 'Diagnosticar caso';
  const economiaAccion = casoEvaluado ? evaluarEconomiaCaso(casoEvaluado) : null;
  const compensacionAccion = casoEvaluado ? obtenerCompensacionEstrategicaCaso(casoEvaluado) : "";
  const accionesHtml = config.idCaso
    ? config.origen !== 'queue' && economiaAccion && economiaAccion.neto < 0 && !casoEvaluado.perdidaAceptada
      ? `<div class="case-economic-actions"><button class="btn" type="button" onclick="event.stopPropagation(); rechazarCasoEconomico('${origenAccion}', '${esc(config.idCaso)}')">RECHAZAR CASO</button><button class="btn" type="button" onclick="event.stopPropagation(); negociarPrecioCasoEconomico('${origenAccion}', '${esc(config.idCaso)}')">NEGOCIAR PRECIO</button>${compensacionAccion ? `<button class="btn btn-primary" type="button" onclick="event.stopPropagation(); aceptarPerdidaCasoEconomico('${origenAccion}', '${esc(config.idCaso)}')">ACEPTAR PÉRDIDA</button>` : ''}</div>`
      : (config.origen === 'queue'
        ? `<div class="case-queue-actions"><button class="btn case-accept-btn" type="button" onclick="event.stopPropagation(); abrirCasoParaDiagnostico('queue', '${esc(config.idCaso)}')">DIAGNOSTICAR CASO</button><button class="btn btn-primary" type="button" onclick="event.stopPropagation(); dxRapidoCasoColaContextual('${esc(config.idCaso)}')">DX RÁPIDO</button><button class="btn btn-danger" type="button" onclick="event.stopPropagation(); rechazarCasoColaContextual('${esc(config.idCaso)}')">RECHAZAR</button></div>`
        : `<button class="btn case-accept-btn" type="button" onclick="event.stopPropagation(); abrirCasoParaDiagnostico('${origenAccion}', '${esc(config.idCaso)}')">${accionLabel}</button>`)
    : "";
  const estadoHtml = config.etiquetaEstado
    ? `<span class="flow-case-tag ${esc(config.etiquetaEstadoClase || "info")}">${esc(config.etiquetaEstado)}</span>`
    : "";
  const bloqueoAsignacionHtml = casoEvaluado && casoEvaluado.mensajeUltimaAsignacion
    ? `<div class="case-assignment-feedback case-assignment-feedback-warn">${esc(casoEvaluado.mensajeUltimaAsignacion)}</div>`
    : "";

    // Si hay mecánico seleccionado, agregar onclick para asignar
    let asignarOnClick = '';
    if (typeof window !== 'undefined' && Number.isFinite(window.mecanicoTapSeleccionado) && window.mecanicoTapSeleccionado >= 0) {
    const origenAsignacion = String(config.origen || 'cola').replace(/[^a-z-]/gi, '') || 'cola';
    asignarOnClick = ` onclick=\"sfxAssign && sfxAssign(); window.tocarCasoListaConMecanico && window.tocarCasoListaConMecanico('${origenAsignacion}', '${esc(config.idCaso || "CASO-0000")}')\" role=\"button\" style=\"cursor:pointer;\"`;
    }
    // La tarjeta nunca abre Mi Puesto por click. Solo los botones internos
    // tienen acciones explicitas; con mecanico seleccionado se agrega el
    // unico click permitido: asignacion directa a Trabajos.
    const atributosFinales = String(atributos || "")
      .replace(/\s*onclick="[^"]*"/gi, "")
      .replace(/\s*onclick='[^']*'/gi, "");
    return `<article class="${clases}"${atributosFinales ? ` ${atributosFinales}` : ""}${asignarOnClick}>
        <div class="flow-case-head flow-case-list-head">
          <div class="flow-case-list-kicker">
            <span class="flow-case-tag ${esc(config.etiquetaPrincipalClase || "info")}">${esc(config.etiquetaPrincipal || "CASO")}</span>
            <strong>${esc(config.idCaso || "CASO-0000")}</strong>
          </div>
          ${estadoHtml}
        </div>
        <div class="flow-case-name">${esc(config.nombre || "Cliente")}</div>
        ${bloqueoAsignacionHtml}
        ${badgesHtml}
        ${pacienciaHtml}
        <div class="flow-case-meta flow-case-list-meta">${metaItems}</div>
        ${evaluacionHtml}
        ${detalleHtml}
        ${notaHtml}
        ${accionesHtml}
      </article>`;
}

// Expande o contrae el relato/caso en la tarjeta
function toggleExpandirRelatoCaso(id, btn) {
  // Expande/contrae relato en mensajes de teléfono
  function toggleExpandirRelatoTelefono(bubble) {
    if (!bubble) return;
    var preview = bubble.querySelector('.tel-relato-preview');
    var full = bubble.querySelector('.tel-relato-full');
    if (!preview || !full) return;
    var expandido = full.style.display !== 'none';
    if (expandido) {
      full.style.display = 'none';
      preview.style.display = '';
      bubble.classList.remove('expandido');
    } else {
      full.style.display = '';
      preview.style.display = 'none';
      bubble.classList.add('expandido');
    }
  }
  if (typeof window !== 'undefined') {
    window.toggleExpandirRelatoTelefono = toggleExpandirRelatoTelefono;
  }
  const cont = document.getElementById(id);
  if (!cont) return;
  const full = cont.querySelector('.detalle-full');
  const btnEl = btn || cont.querySelector('.btn-expandir-caso');
  if (!full) return;
  const expandido = cont.classList.toggle('expandido');
  if (btnEl) {
    btnEl.textContent = expandido ? 'Ocultar relato' : 'Ver relato';
    btnEl.setAttribute('aria-expanded', String(expandido));
  }
}
if (typeof window !== 'undefined') {
  window.toggleExpandirRelatoCaso = toggleExpandirRelatoCaso;
}

function renderizarNotificacionesVivas() {
  const cont = document.getElementById("notificaciones-vivas");
  if (!cont) return;

  const aprobados = obtenerCasosAprobadosPendientes();
  const esc =
    typeof ofDxEscapar === "function"
      ? ofDxEscapar
      : function (v) {
          return String(v || "");
        };

  if (!aprobados.length) {
    cont.innerHTML =
      '<div class="flow-case-empty">No hay casos aprobados pendientes de asignacion.</div>';
    return;
  }

  // Limitar cantidad de casos por nivel de taller
  let maxCasos = 4;
  if (typeof nivelJugador === 'number') {
    if (nivelJugador >= 3) maxCasos = 8;
    else if (nivelJugador === 2) maxCasos = 6;
  }
  const cardsAprobados = aprobados.slice(0, maxCasos).map(function (c) {
    var puedeArrastrar = !!(c.cargable && c.asignable);
    var seleccionado =
      (window.casoAprobadoSeleccionadoMovil || "") === (c.idCaso || "");
    var idCaso = c.idCaso || "";
    var vehiculo =
      c.vehiculo || (c.snapshot && c.snapshot.vehiculo) || "Vehiculo sin ficha";
    var clienteNombre = c.personaNombre || c.clienteNombre || "Cliente";
    var estadoTxt =
      c.estado === "falta_pieza"
        ? "Aprobado, pero necesita piezas"
        : "Listo para mecanico";
    var attrsSelect =
      c.asignable && idCaso
        ? ` role="button" onclick='seleccionarCasoAprobadoMovil(${JSON.stringify(idCaso)})'`
        : "";
    var attrsDrag = puedeArrastrar
      ? ` draggable="true" ondragstart="iniciarArrastreCasoAprobado(event, '${idCaso}')" ondragend="finalizarArrastreCliente(event)"`
      : "";
    return construirTarjetaCasoLista({
      origen: 'pending-dx',
      esc: esc,
      claseExtra: `flow-case-approved${seleccionado ? " selected" : ""}`,
      atributos: `${attrsSelect}${attrsDrag}`,
      idCaso: idCaso || "CASO-0000",
      nombre: clienteNombre,
      etiquetaPrincipal: "APROBADO",
      etiquetaPrincipalClase: "ok",
      etiquetaEstado: c.estado === "falta_pieza" ? "Piezas" : "Asignable",
      etiquetaEstadoClase: c.estado === "falta_pieza" ? "warn" : "info",
      vehiculo: vehiculo,
      metaSecundaria: estadoTxt,
      detalleLabel: "Siguiente paso",
      detalleTexto:
        c.nota || "Cargalo al expediente o arrastralo al toolbar de mecanicos.",
      badgesHtml: construirBadgesRitmoCaso(c),
    });
  });
  cont.innerHTML = cardsAprobados.join("");
}

function renderizarPanelEconomia() {
  const economia = document.getElementById("economia-viva");
  const facturas = document.getElementById("facturas-dia");
  if (!economia || !facturas) return;

  const modoCasosPuro = typeof esModoCasosPuro === "function" && esModoCasosPuro();

  const helpers = window.TallerApp.helpers || {};
  const detalle = helpers.desglosarCostosOperativosDia
    ? helpers.desglosarCostosOperativosDia()
    : { total: 0, alquiler: 0, electricidad: 0, manutencion: 0, abogado: 0 };
  const costoPendiente =
    cierreCostosPendientes > 0 ? cierreCostosPendientes : detalle.total;
  const balancePrevisto = saldo - costoPendiente;
  const estadoCaja = balancePrevisto >= 0 ? "Caja respirando" : "Caja corta";
  const estadoClase = balancePrevisto >= 0 ? "ok" : "warn";
  const etiquetas = {
    piezas: "Piezas",
    comida: "Comida",
    cafe: "Cafe",
    bar: "Bar",
    compras: "Compras",
    belleza: "Salon",
    mejoras: "Mejoras",
    equipo: "Equipo",
    banco: "Banco",
    operaciones: "Operaciones",
    eventos: "Eventos",
    otros: "Otros",
    reparaciones: "Reparaciones",
    clandestino: "Clandestino",
    misiones: "Misiones",
    cobranzas: "Cobranzas",
    juegos: "Juegos",
    prestamos: "Prestamos",
  };
  const gastosDetalle =
    resumenDia &&
    resumenDia.gastosDetalle &&
    typeof resumenDia.gastosDetalle === "object"
      ? resumenDia.gastosDetalle
      : {};
  const ingresosDetalle =
    resumenDia &&
    resumenDia.ingresosDetalle &&
    typeof resumenDia.ingresosDetalle === "object"
      ? resumenDia.ingresosDetalle
      : {};
  const topGasto =
    Object.keys(gastosDetalle)
      .map(function (k) {
        return {
          key: k,
          valor: Math.max(0, Math.round(gastosDetalle[k] || 0)),
        };
      })
      .filter(function (it) {
        return it.valor > 0;
      })
      .sort(function (a, b) {
        return b.valor - a.valor;
      })[0] || null;
  const topIngreso =
    Object.keys(ingresosDetalle)
      .map(function (k) {
        return {
          key: k,
          valor: Math.max(0, Math.round(ingresosDetalle[k] || 0)),
        };
      })
      .filter(function (it) {
        return it.valor > 0;
      })
      .sort(function (a, b) {
        return b.valor - a.valor;
      })[0] || null;
  const gastoPrincipalTxt = topGasto
    ? `${etiquetas[topGasto.key] || topGasto.key}: RD$${topGasto.valor}`
    : "Sin gasto variable";
  const ingresoPrincipalTxt = topIngreso
    ? `${etiquetas[topIngreso.key] || topIngreso.key}: RD$${topIngreso.valor}`
    : "Sin ingreso variable";

  const labelIngresos = modoCasosPuro ? "Ingresos operativos" : "Ingresos hoy";
  const labelPerdidas = modoCasosPuro ? "Perdidas operativas" : "Perdidas hoy";
  const labelCosto = modoCasosPuro ? "Costo operativo proyectado" : "cierre proyectado";
  const textoCaja = modoCasosPuro
    ? `${estadoCaja}: ${labelCosto} RD$${Math.round(costoPendiente)}.`
    : `${estadoCaja}: cierre proyectado RD$${Math.round(costoPendiente)}.`;
  const textoOperacion = modoCasosPuro
    ? (balancePrevisto >= 0
        ? "Si mantienes este ritmo, sostienes la operacion sin abrir mas deuda."
        : "Si no entra mas caja, la presion operativa se va a deuda.")
    : (balancePrevisto >= 0
        ? "Si mantienes este ritmo, puedes pagar la noche."
        : "Si no entra mas caja, parte del cierre se ira a deuda.");

  economia.innerHTML = [
    `<div class="economia-row"><span>${labelIngresos}</span><strong>RD$${Math.round(resumenDia.ingresos)}</strong></div>`,
    `<div class="economia-row"><span>${labelPerdidas}</span><strong>RD$${Math.round(resumenDia.perdidas)}</strong></div>`,
    `<div class="economia-row"><span>Ingreso principal</span><strong>${ingresoPrincipalTxt}</strong></div>`,
    `<div class="economia-row"><span>Gasto principal</span><strong>${gastoPrincipalTxt}</strong></div>`,
    `<div class="economia-row"><span>Saldo actual</span><strong>RD$${Math.round(saldo)}</strong></div>`,
    `<div class="economia-row"><span>Deuda viva</span><strong>RD$${Math.round(deuda)}</strong></div>`,
    `<div class="economia-alert ${estadoClase}">${textoCaja}</div>`,
  ].join("");

  facturas.innerHTML = [
    `<div class="factura-row"><span>Alquiler del local</span><strong>RD$${detalle.alquiler}</strong></div>`,
    `<div class="factura-row"><span>Electricidad</span><strong>RD$${detalle.electricidad}</strong></div>`,
    `<div class="factura-row"><span>Manutencion</span><strong>RD$${detalle.manutencion}</strong></div>`,
    `<div class="factura-row"><span>Abogado</span><strong>RD$${detalle.abogado}</strong></div>`,
    `<div class="economia-alert ${estadoClase}">${textoOperacion}</div>`,
  ].join("");
}

function actualizarSelloManualCliente(elemento, cliente) {
  if (!elemento || !cliente || !cliente.inspeccion) return;
  const veredicto = cliente.inspeccion.veredicto || "pendiente";
  if (veredicto === "pendiente") {
    elemento.innerText = "SIN SELLO";
    elemento.className = "expediente-sello expediente-sello-sec hidden";
    return;
  }

  const mapa = {
    aprobado: { texto: "APROBADO", clase: "sello-aprobado" },
    rechazado: { texto: "RECHAZADO", clase: "sello-rechazado" },
    observado: { texto: "OBSERVADO", clase: "sello-observado" },
  };
  const sello = mapa[veredicto] || mapa.observado;
  elemento.innerText = sello.texto;
  elemento.className = `expediente-sello expediente-sello-sec ${sello.clase}`;
}

function obtenerCasosAprobadosPendientes() {
  if (!Array.isArray(casosAtendidos)) return [];
  const ocupados = new Set(
    (reparacionesActivas || []).map(function (r) {
      return r && r.idCaso ? r.idCaso : "";
    }),
  );
  const estadosCerrados = new Set([
    "cobrado_retirado",
    "pendiente_revision",
    "rechazado_cliente",
    "cerrado",
  ]);
  return casosAtendidos
    .filter(function (c) {
      if (!c || !c.idCaso || ocupados.has(c.idCaso)) return false;
      var estado = c.estado || "";
      if (estadosCerrados.has(estado)) return false;
      var snap =
        c.snapshot && typeof c.snapshot === "object" ? c.snapshot : null;
      var aprobado =
        estado === "listo_asignacion" ||
        estado === "falta_pieza" ||
        !!(snap && (snap.aprobacionCliente || snap.aprobadoCliente));
      return aprobado;
    })
    .map(function (c) {
      var snap =
        c.snapshot && typeof c.snapshot === "object" ? c.snapshot : null;
      var estado = c.estado || "";
      var asignable =
        !!snap &&
        (estado === "listo_asignacion" ||
          estado === "falta_pieza" ||
          !!(snap.aprobacionCliente || snap.aprobadoCliente));
      var piezasPendientes = [];
      if (snap && Array.isArray(snap.piezasRequeridasMecanico)) {
        var instaladas = Array.isArray(snap.piezasInstaladasMecanico)
          ? snap.piezasInstaladasMecanico
          : [];
        piezasPendientes = snap.piezasRequeridasMecanico
          .filter(function (p) {
            return p && p.id && instaladas.indexOf(p.id) < 0;
          })
          .map(function (p) {
            return p.nombre;
          });
      }
      var piezasTxt = piezasPendientes.length
        ? ` Piezas solicitadas: ${piezasPendientes.join(", ")}.`
        : "";
      var nota = asignable
        ? estado === "falta_pieza"
          ? `Trabajo pausado por piezas.${piezasTxt}`
          : "Listo para arrastrar a un mecanico"
        : snap
          ? "Aprobado, pero falta requisito previo"
          : "Aprobado, pero expediente incompleto";
      return {
        ...c,
        cargable: !!snap,
        asignable: !!asignable,
        nota: nota,
      };
    });
}

function cargarCasoAprobadoPendiente(idCaso) {
  if (!idCaso) return false;
  const entrada = obtenerCasosAprobadosPendientes().find(function (c) {
    return c.idCaso === idCaso;
  });
  if (!entrada || !entrada.snapshot) {
    log("Ese caso aprobado no tiene expediente completo para cargar.", "error");
    return false;
  }

  if (clienteActual && (clienteActual.idCaso || "") !== idCaso) {
    const idPrevio = clienteActual.idCaso || "";
    const enElevador = (reparacionesActivas || []).some(function (r) {
      return r && r.idCaso && r.idCaso === idPrevio;
    });
    if (!enElevador && typeof actualizarCasoAtendido === "function") {
      let estadoPrevio = "seguimiento";
      if (clienteActual.aprobacionCliente && clienteActual.piezaInstalada)
        estadoPrevio = "listo_asignacion";
      else if (clienteActual.aprobacionCliente) estadoPrevio = "falta_pieza";
      else if (clienteActual.diagnosticado)
        estadoPrevio = "esperando_aprobacion";
      actualizarCasoAtendido(
        clienteActual,
        estadoPrevio,
        "Caso guardado temporalmente al cambiar de expediente desde aprobados.",
      );
    }
    log(
      `Cambiando de expediente activo: ${idPrevio || "CASO-0000"} -> ${idCaso}.`,
      "info",
    );
  }

  if (typeof limpiarCasoDeColaYPendientes === "function")
    limpiarCasoDeColaYPendientes(idCaso);
  clienteActual = { ...entrada.snapshot };
  marcarOrigenCasoActivo(clienteActual, "aprobado");
  if (typeof asegurarIdCasoCliente === "function")
    asegurarIdCasoCliente(clienteActual);
  if (typeof asegurarDiagnosticoJugador === "function")
    asegurarDiagnosticoJugador(clienteActual);
  if (
    entrada.estado === "listo_asignacion" ||
    entrada.estado === "falta_pieza"
  ) {
    clienteActual.aprobacionCliente = true;
  }
  if (clienteActual.aprobadoCliente && !clienteActual.aprobacionCliente) {
    clienteActual.aprobacionCliente = true;
  }
  if (typeof clienteActual.diagnosticado !== "boolean") {
    clienteActual.diagnosticado =
      !!clienteActual.diagnosticoDetectado &&
      clienteActual.diagnosticoDetectado !== "No realizado";
  }
  if (clienteActual.aprobacionCliente) {
    clienteActual.diagnosticado = true;
  }
  tiempoCliente = Math.max(2, Math.round(clienteActual.tiempo || 6));
  log(
    `Caso aprobado cargado: ${clienteActual.idCaso || idCaso}. Ya puedes asignar mecanico.`,
    "exito",
  );
  if (typeof mostrarFeedbackGameplay === "function") {
    mostrarFeedbackGameplay(
      `Caso ${clienteActual.idCaso || idCaso} cargado para asignacion.`,
      "ok",
    );
  }
  actualizarUI();
  return true;
}

function obtenerEstadoFallbackCasoAprobado(entrada, caso) {
  if (entrada && typeof entrada.estado === "string" && entrada.estado) {
    return entrada.estado;
  }
  if (caso && caso.esVIP && (caso.etapaVIP || 1) === 2 && !caso.piezaVIPComprada) {
    return "falta_pieza";
  }
  if (caso && caso.aprobacionCliente && caso.piezaInstalada) {
    return "listo_asignacion";
  }
  return "falta_pieza";
}

function restaurarCasoTrasFalloAsignacionAprobada(casoIntentado, casoPrevio, estadoFallback) {
  if (casoIntentado && typeof actualizarCasoAtendido === "function") {
    actualizarCasoAtendido(
      casoIntentado,
      estadoFallback || "listo_asignacion",
      "Caso pendiente de asignacion. El mecanico no pudo tomarlo ahora.",
    );
  }

  if (
    clienteActual &&
    casoIntentado &&
    String(clienteActual.idCaso || "") === String(casoIntentado.idCaso || "")
  ) {
    clienteActual = null;
  }

  if (
    casoPrevio &&
    typeof casoPrevio === "object" &&
    String(casoPrevio.idCaso || "") !== String((casoIntentado && casoIntentado.idCaso) || "")
  ) {
    clienteActual = casoPrevio;
  }

  if (casoIntentado && casoIntentado.idCaso) {
    window.casoAprobadoSeleccionadoMovil = casoIntentado.idCaso;
  }

  if (typeof actualizarUI === "function") actualizarUI();
}

function intentarAsignarCasoAprobadoAMecanico(idCaso, idx) {
  var clave = String(idCaso || "").trim();
  if (!clave || typeof idx !== "number" || idx < 0) return false;

  var entrada = obtenerCasosAprobadosPendientes().find(function (c) {
    return c && c.idCaso === clave;
  });
  var casoPrevio =
    clienteActual && typeof clienteActual === "object" ? clienteActual : null;

  if (!cargarCasoAprobadoPendiente(clave)) return false;

  var casoIntentado =
    clienteActual && typeof clienteActual === "object" ? clienteActual : null;
  var estadoFallback = obtenerEstadoFallbackCasoAprobado(entrada, casoIntentado);
  var asignado = !!gestionarMecanico(idx, clave);
  var reparacionCreada =
    asignado &&
    Array.isArray(reparacionesActivas) &&
    reparacionesActivas.some(function (r) {
      return r && String(r.idCaso || "") === clave && mecanicos[idx] && r.mecanicoNombre === mecanicos[idx].nombre;
    });

  if (!reparacionCreada) {
    var motivoBloqueo = String(window.ultimoBloqueoAsignacionTaller || "").trim();
    restaurarCasoTrasFalloAsignacionAprobada(
      casoIntentado,
      casoPrevio,
      estadoFallback,
    );
    if (typeof mostrarFeedbackGameplay === "function") {
      mostrarFeedbackGameplay(
        motivoBloqueo || `No se pudo iniciar la reparacion de ${clave}. El caso sigue pendiente de asignacion.`,
        "warn",
      );
    }
    return false;
  }

  return true;
}

function leerPayloadArrastreCliente(event) {
  try {
    return JSON.parse(event.dataTransfer.getData("text/plain") || "{}");
  } catch (e) {
    return null;
  }
}

function iniciarArrastreMecanico(event, index) {
  if (typeof index !== "number" || index < 0) {
    event.preventDefault();
    return;
  }
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData(
    "text/plain",
    JSON.stringify({ tipo: "mecanico", idx: index }),
  );
  if (event.currentTarget) event.currentTarget.classList.add("dragging");
}

function iniciarArrastreDelivery(event, slotIndex) {
  event.dataTransfer.effectAllowed = "copy";
  event.dataTransfer.setData(
    "text/plain",
    JSON.stringify({ tipo: "delivery", slot: slotIndex }),
  );
  if (event.currentTarget) event.currentTarget.classList.add("dragging");
}

function iniciarArrastreClienteActivo(event) {
  if (!clienteActual) {
    event.preventDefault();
    return;
  }
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", JSON.stringify({ tipo: "activo" }));
  if (event.currentTarget) event.currentTarget.classList.add("dragging");
}

function iniciarArrastreClienteCola(event, index) {
  if (index < 0 || index >= clientesEnEspera.length) {
    event.preventDefault();
    return;
  }
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData(
    "text/plain",
    JSON.stringify({ tipo: "cola", index: index }),
  );
  if (event.currentTarget) event.currentTarget.classList.add("dragging");
}

function iniciarArrastreCasoAprobado(event, idCaso) {
  if (!idCaso) {
    event.preventDefault();
    return;
  }
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData(
    "text/plain",
    JSON.stringify({ tipo: "aprobado", idCaso: idCaso }),
  );
  window.casoAprobadoSeleccionadoMovil = idCaso;
  if (event.currentTarget) event.currentTarget.classList.add("dragging");
}

function seleccionarCasoAprobadoMovil(idCaso) {
  if (!idCaso) return;
  if ((window.casoAprobadoSeleccionadoMovil || "") === idCaso) {
    window.casoAprobadoSeleccionadoMovil = "";
    if (typeof mostrarFeedbackGameplay === "function")
      mostrarFeedbackGameplay("Seleccion de caso cancelada.", "warn");
    actualizarUI();
    return;
  }
  window.casoAprobadoSeleccionadoMovil = idCaso;
  if (typeof mostrarFeedbackGameplay === "function") {
    mostrarFeedbackGameplay(
      `Caso ${idCaso} seleccionado. Ahora toca un mecanico para asignar.`,
      "ok",
    );
  }
  actualizarUI();
}

function prepararAsignacionCasoRevision(idCaso) {
  var clave = String(idCaso || (clienteActual && clienteActual.idCaso) || "").trim();
  if (!clave) {
    mostrarFeedbackGameplay("No hay un caso aprobado seleccionado para asignar.", "warn");
    return false;
  }
  window.casoAprobadoSeleccionadoMovil = clave;
  window.mecanicoTapSeleccionado = -1;
  if (typeof seleccionarToolbarRecursos === "function") seleccionarToolbarRecursos("mecanicos");
  mostrarFeedbackGameplay(`Caso ${clave} listo. Selecciona un mecánico disponible para asignarlo.`, "ok");
  if (typeof actualizarUI === "function") actualizarUI();
  return true;
}

function asignarCasoRevisionAMecanico(idCaso, idx) {
  var clave = String(idCaso || "").trim();
  try {
    if (String(clienteActual && clienteActual.idCaso || "").trim() === clave && Array.isArray(reparacionesActivas)) {
      reparacionesActivas = reparacionesActivas.filter(function (r) {
        return !(r && String(r.idCaso || "").trim() === clave && r.tipoTrabajo === "diagnostico_completado");
      });
    }
    if (clienteActual && String(clienteActual.idCaso || "").trim() === clave) {
      clienteActual.aprobacionCliente = true;
      clienteActual.aprobadoCliente = true;
    }
    var casoActivo = !!(clienteActual && String(clienteActual.idCaso || "").trim() === clave);
    var ok = casoActivo
      ? !!gestionarMecanico(Number(idx), clave, true)
      : intentarAsignarCasoListaAMecanico("pending-dx", clave, Number(idx));
    if (!ok && typeof mostrarFeedbackGameplay === "function") {
      mostrarFeedbackGameplay(window.ultimoBloqueoAsignacionTaller || `No se pudo asignar ${clave}. Revisa el estado del mecánico.`, "warn");
    }
    return ok;
  } catch (error) {
    console.error("Error al asignar caso desde revisión", error);
    mostrarFeedbackGameplay(`No se pudo asignar ${clave}: ${error && error.message ? error.message : "error interno"}.`, "error");
    return false;
  }
}

function asignarCasoRevisionADueno(idCaso) {
  var clave = String(idCaso || "").trim();
  try {
    if (!clienteActual || String(clienteActual.idCaso || "").trim() !== clave) {
      var origen = (Array.isArray(casosPendientesDiagnostico) ? casosPendientesDiagnostico : []).find(function(c) { return c && String(c.idCaso || "").trim() === clave; });
      if (!origen) origen = (Array.isArray(clientesEnEspera) ? clientesEnEspera : []).find(function(c) { return c && String(c.idCaso || "").trim() === clave; });
      if (origen) clienteActual = origen;
    }
    if (clienteActual && String(clienteActual.idCaso || "").trim() === clave && Array.isArray(reparacionesActivas)) {
      reparacionesActivas = reparacionesActivas.filter(function (r) {
        return !(r && String(r.idCaso || "").trim() === clave && r.tipoTrabajo === "diagnostico_completado");
      });
      clienteActual.aprobacionCliente = true;
      clienteActual.aprobadoCliente = true;
    }
    var ok = !!asignarReparacionAlDueno(clave);
    if (!ok && typeof mostrarFeedbackGameplay === "function") mostrarFeedbackGameplay(window.ultimoBloqueoAsignacionTaller || "No se pudo iniciar el trabajo del dueño. Revisa foco, piezas y aprobación.", "warn");
    return ok;
  } catch (error) {
    console.error("Error al asignar caso al dueño", error);
    mostrarFeedbackGameplay(`No se pudo iniciar ${clave}: ${error && error.message ? error.message : "error interno"}.`, "error");
    return false;
  }
}

function asignarCasoAprobadoSeleccionadoAMecanico(idx) {
  var idCaso = window.casoAprobadoSeleccionadoMovil || "";
  if (!idCaso) return false;
  var ok = intentarAsignarCasoAprobadoAMecanico(idCaso, idx);
  if (ok) {
    window.casoAprobadoSeleccionadoMovil = "";
    colapsarToolbarRecursos();
    if (typeof mostrarFeedbackGameplay === "function")
      mostrarFeedbackGameplay(`Caso ${idCaso} enviado a mecanico.`, "ok");
  }
  actualizarUI();
  return true;
}

function abrirModalResultadoReparacion(rep) {
  if (!rep) return false;
  var modal = document.getElementById("modal-resultado-reparacion");
  if (!modal) return false;
  var idCaso = rep.idCaso || "CASO-0000";
  window.resultadoReparacionCasoId = idCaso;

  var titulo = document.getElementById("resultado-rep-titulo");
  var meta = document.getElementById("resultado-rep-meta");
  var detalle = document.getElementById("resultado-rep-detalle");
  var mecanicaExtra = document.getElementById("resultado-rep-mecanica-extra");
  var money = document.getElementById("resultado-rep-money");
  var breakdown = document.getElementById("resultado-rep-breakdown");
  var moneyExtra = document.getElementById("resultado-rep-money-extra");
  var estado = document.getElementById("resultado-rep-estado");
  var accion = document.getElementById("resultado-rep-accion");
  var btnWa = document.getElementById("resultado-rep-wa");
  var btnLavado = document.getElementById("resultado-rep-lavado");
  var mecAvatar = document.getElementById("resultado-rep-mec-avatar");
  var mecAvatarFallback = document.getElementById(
    "resultado-rep-mec-avatar-fallback",
  );
  var mecNombre = document.getElementById("resultado-rep-mec-nombre");

  var tipo = (rep.nivelResultado || "").toLowerCase();
  var etiqueta =
    tipo === "critico" ? "CRITICO" : tipo === "parcial" ? "PARCIAL" : "FALLIDO";
  var clase = tipo === "critico" ? "ok" : tipo === "parcial" ? "warn" : "bad";
  try {
    var clienteNombre = rep.clienteNombre || rep.personaNombre || "Cliente";
    var mecanicoNombre = rep.mecanicoNombre || "Mecanico";
    var vehiculo = rep.vehiculo ? ` | ${rep.vehiculo}` : "";
    var precioNegociado = !!(rep.negociado || rep.precioNegociado || (rep.casoRef && (rep.casoRef.negociado || rep.casoRef.precioNegociado)));
    var tiempoTxt =
      typeof formatearDuracionSegundos === "function"
        ? formatearDuracionSegundos(obtenerSegundosRestantesReparacion(rep))
        : `${Math.max(0, Math.round(rep.tiempoTotal || rep.tiempoRestante || 0))} min`;
    var piezasCount = Array.isArray(rep.piezasContinuacionEntregadas)
      ? rep.piezasContinuacionEntregadas.length
      : Array.isArray(rep.piezasContinuacionRequeridas)
        ? rep.piezasContinuacionRequeridas.length
        : 0;
    var costoPiezas = Math.max(0, Math.round(rep.costoPiezasCaso || 0));
    var pagoAcordado = Math.max(0, Math.round(rep.pagoAcordado || 0));
    var cobroTotal =
      tipo === "fallo" ? 0 : Math.max(0, Math.round(rep.ganancia || 0));
    var reputacionImpacto =
      tipo === "critico" ? 2 : tipo === "parcial" ? 0 : -3;
    if (rep.diagnosticoRiesgoAlto) {
      reputacionImpacto += tipo === "fallo" ? -2 : -1;
    }
    var reputacionTxt =
      reputacionImpacto > 0
        ? `Reputacion +${reputacionImpacto}`
        : reputacionImpacto < 0
          ? `Reputacion ${reputacionImpacto}`
          : "Reputacion sin cambio";
    var explicacionResultado = tipo === "parcial" && typeof explicarResultadoParcialReparacion === "function"
      ? explicarResultadoParcialReparacion(rep)
      : "";
    var margenPieza = Math.max(
      0,
      Math.round(rep.margenPiezaAplicado || rep.margenServicioAplicado || 0),
    );
    var servicioAplicado =
      tipo === "fallo"
        ? 0
        : Math.max(
            0,
            Math.round(
              rep.servicioBaseAplicado ||
                rep.gananciaBaseServicio ||
                Math.max(0, cobroTotal - costoPiezas - margenPieza),
            ),
          );

    if (titulo) titulo.innerText = `${idCaso} | ${clienteNombre}`;
    if (meta) meta.innerText = `${mecanicoNombre}${vehiculo}${precioNegociado ? " | PRECIO NEGOCIADO" : ""}`;
    if (mecNombre) mecNombre.innerText = mecanicoNombre;
    if (mecAvatarFallback) {
      mecAvatarFallback.innerText = String(mecanicoNombre || "M")
        .charAt(0)
        .toUpperCase();
      mecAvatarFallback.classList.remove("hidden");
    }
    if (mecAvatar) {
      var fotoMecanico = "";
      var mecFicha = Array.isArray(mecanicos)
        ? mecanicos.find(function (m) {
            return m && m.nombre === mecanicoNombre;
          })
        : null;
      if (mecFicha && mecFicha.foto) {
        fotoMecanico = mecFicha.foto;
      }
      var biosMec =
        (window.TallerData && window.TallerData.biografiasMecanicos) || {};
      if (
        !fotoMecanico &&
        biosMec[mecanicoNombre] &&
        biosMec[mecanicoNombre].foto
      ) {
        fotoMecanico = biosMec[mecanicoNombre].foto;
      }
      if (fotoMecanico && typeof normalizarRutaImagenRapida === "function") {
        fotoMecanico = normalizarRutaImagenRapida(fotoMecanico, "foto");
      }
      if (fotoMecanico) {
        mecAvatar.src = fotoMecanico;
        mecAvatar.classList.remove("hidden");
        if (mecAvatarFallback) mecAvatarFallback.classList.add("hidden");
      } else {
        mecAvatar.src = "";
        mecAvatar.classList.add("hidden");
        if (mecAvatarFallback) mecAvatarFallback.classList.remove("hidden");
      }
    }
    if (detalle)
      detalle.innerText =
        (rep.subtituloResultado || "Se completo la orden sin observaciones adicionales.") +
        (explicacionResultado ? "\n\nPOR QUÉ FUE PARCIAL: " + explicacionResultado : "");
    if (mecanicaExtra) {
      var dxTxt =
        typeof capitalizarRotulo === "function"
          ? capitalizarRotulo(rep.diagnosticoNivel || "general")
          : String(rep.diagnosticoNivel || "general");
      var xpMec = Math.max(0, Math.round(rep.xpMecanicoGanada || 0));
      var xpDel = Math.max(0, Math.round(rep.xpDeliveryGanada || 0));
      mecanicaExtra.innerText = `Dx ${dxTxt} | Tiempo ${tiempoTxt} | Piezas ${piezasCount} | ${reputacionTxt} | XP Mec +${xpMec}${xpDel > 0 ? ` | XP Del +${xpDel}` : ""}`;
    }

    if (money) {
      money.classList.remove("is-gain", "is-loss");
      if (tipo === "fallo") {
        money.classList.add("is-loss");
        money.innerText = `Impacto: -RD$${Math.round(rep.perdida || 0)}`;
      } else {
        money.classList.add("is-gain");
        money.innerText = `Cobro: RD$${cobroTotal}`;
      }
    }
    if (breakdown) {
      breakdown.innerText =
        tipo === "fallo"
          ? `Costo de piezas asumido: RD$${costoPiezas}`
          : `Pieza RD$${costoPiezas} + margen pieza RD$${margenPieza} + servicio/pluses RD$${servicioAplicado} = RD$${cobroTotal}`;
    }
    if (moneyExtra) {
      if (tipo === "fallo") {
        moneyExtra.innerText = `Pago acordado RD$${pagoAcordado} | Costo de piezas RD$${costoPiezas} | Cobro RD$0 | ${reputacionTxt}.`;
      } else {
        moneyExtra.innerText = `Pago acordado RD$${pagoAcordado} | Servicio base RD$${servicioAplicado} | Margen pieza RD$${margenPieza} | ${reputacionTxt}.`;
      }
    }
    if (estado) {
      estado.className = `resultado-rep-estado ${clase}`;
      estado.innerText = etiqueta;
    }
    if (accion) {
      accion.innerText =
        tipo === "fallo"
          ? "Registra la perdida para liberar al cliente y evitar bloquear el flujo del taller."
          : "Confirma el cobro para pasar el dinero a caja y cerrar el expediente del caso.";
    }
  } catch (e) {
    if (typeof log === "function")
      log(
        "Fallo al preparar detalle del modal de resultado. Se aplico vista de respaldo.",
        "warn",
      );
    if (titulo) titulo.innerText = `Resultado ${etiqueta} | ${idCaso}`;
    if (meta)
      meta.innerText = `${rep.mecanicoNombre || "Mecanico"} con ${rep.clienteNombre || "Cliente"}`;
    if (detalle)
      detalle.innerText =
        rep.subtituloResultado || "Sin detalle tecnico adicional.";
    if (money)
      money.innerText =
        tipo === "fallo"
          ? `Impacto: -RD$${Math.round(rep.perdida || 0)}`
          : `Cobro proyectado: RD$${Math.round(rep.ganancia || 0)}`;
    if (estado) {
      estado.className = `resultado-rep-estado ${clase}`;
      estado.innerText = etiqueta;
    }
  }

  if (btnWa) {
    btnWa.innerText =
      tipo === "fallo"
        ? "Cerrar caso y registrar perdida"
        : "Cobrar y cerrar caso";
    btnWa.onclick = function () {
      var resultado = procesarCobroReparacionDirecto(idCaso);
      if (resultado && resultado.ok) {
        cerrarModal();
      } else {
        if (typeof mostrarFeedbackGameplay === "function")
          mostrarFeedbackGameplay(
            (resultado && resultado.mensaje) || "No se pudo procesar el cobro.",
            "warn",
          );
      }
    };
  }
  if (btnLavado) {
    var lavadoActivo = !!(rep.autolavadoEnCurso);
    var autolavadoComprado = !!(mejoras && mejoras.autolavado === true);
    // El servicio no debe aparecer como acción hasta que se compre la mejora.
    btnLavado.classList.toggle("hidden", !autolavadoComprado);
    btnLavado.disabled = lavadoActivo || !rep.listoParaCobro || !autolavadoComprado;
    btnLavado.setAttribute("aria-hidden", String(!autolavadoComprado));
    btnLavado.innerText = lavadoActivo ? "Autolavado en curso" : "Enviar a autolavado";
    btnLavado.onclick = function () { enviarCasoAutolavado(idCaso); };
  }

  try {
    if (typeof abrirModal === "function") {
      abrirModal("resultado-reparacion");
      if (!modal.classList.contains("hidden")) return true;
    }
  } catch (eAbrir) {
    if (typeof log === "function")
      log(
        "No se pudo abrir modal por la ruta principal. Se forzara apertura directa.",
        "warn",
      );
  }

  modal.classList.remove("hidden");
  return !modal.classList.contains("hidden");
}

function enviarCasoAutolavado(idCaso, nivel) {
  var clave = String(idCaso || "").trim();
  var rep = Array.isArray(reparacionesActivas) ? reparacionesActivas.find(function (r) { return r && String(r.idCaso || "").trim() === clave; }) : null;
  var casos = typeof obtenerCasosCompletadosNarrativa === "function" ? obtenerCasosCompletadosNarrativa() : 0;
  if (!rep || !rep.listoParaCobro) { mostrarFeedbackGameplay("El caso debe estar listo para cobrar antes de enviarlo al autolavado.", "warn"); return false; }
  if (!(mejoras && mejoras.autolavado)) { mostrarFeedbackGameplay("Autolavado bloqueado: compra primero la mejora en Oficina > Mejoras > Servicios.", "warn"); return false; }
  var costo = nivel === "premium" ? 250 : nivel === "detalle" ? 450 : 120;
  if (Math.max(0, Math.round(saldo || 0)) < costo) { mostrarFeedbackGameplay("No hay caja suficiente para enviar este vehículo al autolavado. Costo: RD$" + costo + ".", "warn"); return false; }
  saldo -= costo;
  if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarGastoDia === "function") window.TallerApp.helpers.registrarGastoDia(costo, "operaciones");
  var bono = nivel === "premium" ? 0.10 : nivel === "detalle" ? 0.15 : 0.05;
  var segundos = nivel === "premium" ? 60 : nivel === "detalle" ? 100 : 30;
  rep.listoParaCobro = false;
  rep.autolavadoEnCurso = true;
  rep.autolavadoNivel = nivel || "basico";
  rep.autolavadoBono = bono;
  rep.autolavadoCosto = costo;
  rep.tiempoTotal = segundos;
  rep.tiempoRestante = segundos;
  rep.duracionRealSeg = segundos;
  rep.segundosPendientesReal = segundos;
  rep.ultimoTiempoSyncMs = Date.now();
  rep.estado = "autolavado";
  cerrarModal();
  mostrarFeedbackGameplay("Caso " + clave + " enviado al autolavado. Bono +" + Math.round(bono * 100) + "% al cobro en " + formatearDuracionSegundos(segundos) + ".", "ok");
  if (typeof actualizarUI === "function") actualizarUI();
  return true;
}

function comprarMejoraAutolavado() {
  var costo = 2800;
  if (mejoras && mejoras.autolavado) { mostrarFeedbackGameplay("El autolavado ya esta desbloqueado.", "info"); return false; }
  var casosParaDesbloqueo = typeof casosCompletados !== "undefined" ? casosCompletados : (Array.isArray(casosAtendidos) ? casosAtendidos.length : 0);
  if (Math.max(1, Math.round(tallerNivel || 1)) < 2 && Math.max(0, Math.round(casosParaDesbloqueo || 0)) < 8) {
    mostrarFeedbackGameplay("Requiere Taller nivel 2 o 8 casos completados.", "warn"); return false;
  }
  if (Math.max(0, Math.round(saldo || 0)) < costo) { mostrarFeedbackGameplay("Necesitas RD$" + costo + " para instalar el autolavado.", "warn"); return false; }
  mejoras = mejoras || {};
  mejoras.autolavado = true;
  saldo -= costo;
  if (typeof window !== "undefined" && window.TallerApp && window.TallerApp.helpers && window.TallerApp.helpers.registrarGastoDia) window.TallerApp.helpers.registrarGastoDia(costo, "mejoras");
  if (typeof autoGuardarPartidaSilenciosa === "function") autoGuardarPartidaSilenciosa("mejora-autolavado");
  mostrarFeedbackGameplay("Autolavado desbloqueado: ya puedes enviarlo desde el resultado de cada reparacion.", "ok");
  if (typeof actualizarUI === "function") actualizarUI();
  if (typeof cerrarModal === "function") cerrarModal();
  return true;
}

function abrirModalDiagnosticoFallido(info) {
  var modal = document.getElementById("modal-dx-fallo");
  if (!modal) return;

  var data = info && typeof info === "object" ? info : {};
  var idCaso = data.idCaso || "CASO-0000";
  var nombre = data.clienteNombre || "Cliente";
  var diagnostico = data.diagnostico || "Sin diagnostico";
  var motivos = Array.isArray(data.motivos)
    ? data.motivos.filter(function (m) {
        return !!m;
      })
    : [];
  if (!motivos.length)
    motivos = [
      "El dictamen no alcanzo el umbral minimo de confianza del taller.",
    ];

  var titulo = document.getElementById("dx-fallo-titulo");
  var meta = document.getElementById("dx-fallo-meta");
  var lista = document.getElementById("dx-fallo-lista");
  var recomendacion = document.getElementById("dx-fallo-recomendacion");

  if (titulo) titulo.innerText = `Diagnostico rechazado | ${idCaso}`;
  if (meta) meta.innerText = `${nombre} | Dictamen emitido: ${diagnostico}`;
  if (lista)
    lista.innerHTML = motivos
      .map(function (m) {
        return `<li>${escaparTextoTelefono(String(m))}</li>`;
      })
      .join("");
  if (recomendacion) {
    recomendacion.innerText =
      "Sugerencia: define una hipotesis activa, ejecuta al menos 2 rondas de analisis y usa una herramienta tecnica antes de emitir.";
  }

  modal.classList.remove("hidden");
}

function finalizarArrastreCliente(event) {
  if (event && event.currentTarget)
    event.currentTarget.classList.remove("dragging", "drop-ready");
  document
    .querySelectorAll(".mecanico-btn.drop-target")
    .forEach((el) => el.classList.remove("drop-target"));
  document
    .querySelectorAll(".flow-case-card.drop-target")
    .forEach((el) => el.classList.remove("drop-target"));
  document
    .querySelectorAll(".flow-case-repair.drop-ready-delivery")
    .forEach((el) => el.classList.remove("drop-ready-delivery"));
  const dossier = document.getElementById("cliente-card");
  if (dossier) dossier.classList.remove("drop-ready");
}

function permitirDropMecanicoEnCasoLista(event) {
  event.preventDefault();
  if (event.currentTarget) event.currentTarget.classList.add("drop-target");
}

function activarCasoDesdeLista(origen, idCaso, mantenerPantallaActual) {
  var clave = String(idCaso || "").trim();
  if (!clave) return false;

  // Buscar el caso en clientesEnEspera o casosPendientesDiagnostico.
  // Al activarlo se consume de la lista; si se cambia de expediente sin
  // terminarlo, la lógica de estacionamiento lo devuelve explícitamente.
  var idxCola = Array.isArray(clientesEnEspera)
    ? clientesEnEspera.findIndex(function (c) {
        return c && String(c.idCaso || "").trim() === clave;
      })
    : -1;
  var idxDx = Array.isArray(casosPendientesDiagnostico)
    ? casosPendientesDiagnostico.findIndex(function (c) {
        return c && String(c.idCaso || "").trim() === clave;
      })
    : -1;
  if (idxCola >= 0) {
    seleccionarClienteCola(idxCola, false, !!mantenerPantallaActual);
    return !!(
      clienteActual && String(clienteActual.idCaso || "").trim() === clave
    );
  }
  if (idxDx >= 0) {
    var expediente = casosPendientesDiagnostico.splice(idxDx, 1)[0];
    if (!expediente || String(expediente.idCaso || "").trim() !== clave)
      return false;
    if (clienteActual && String(clienteActual.idCaso || "").trim() !== clave) {
      var previo = clienteActual;
      var previoEnTrabajo = (reparacionesActivas || []).some(function (r) {
        return r && String(r.idCaso || "").trim() === String(previo.idCaso || "").trim();
      });
      if (!previoEnTrabajo && previo.idCaso) {
        casosPendientesDiagnostico = casosPendientesDiagnostico.filter(function (c) {
          return !c || String(c.idCaso || "").trim() !== String(previo.idCaso || "").trim();
        });
        casosPendientesDiagnostico.push(previo);
      }
    }
    clienteActual = expediente;
    // El origen de lista se conserva en el expediente, pero al abrirlo pasa a
    // ser el caso activo del dueño para que "Mi puesto" pueda renderizarlo.
    clienteActual.origenListaCaso = "pending-dx";
    marcarOrigenCasoActivo(clienteActual, "mi-puesto");
    tiempoCliente = Math.max(2, Math.round(clienteActual.tiempo || 6));
    return true;
  }
  return false;
}

function revisarDiagnosticoMecanicoLista(idCaso) {
  var clave = String(idCaso || '').trim();
  if (!clave) return false;
  var ok = activarCasoDesdeLista('pending-dx', clave, true);
  // Algunos guardados conservan el diagnóstico en Trabajos, pero no en el
  // buffer de pendientes. Recuperar el expediente desde casoRef evita que el
  // botón parezca no responder.
  if (!ok && Array.isArray(reparacionesActivas)) {
    var rep = reparacionesActivas.find(function (r) {
      return r && String(r.idCaso || '').trim() === clave &&
        (r.tipoTrabajo === 'diagnostico_completado' || r.diagnosticoCompletado);
    });
    if (rep && rep.casoRef && typeof rep.casoRef === 'object') {
      clienteActual = rep.casoRef;
      marcarOrigenCasoActivo(clienteActual, 'mi-puesto');
      tallerPuestoActivo = 'mi-puesto';
      aplicarPuestoTaller();
      ok = true;
    }
  }
  if (ok) {
    if (typeof mostrarFeedbackGameplay === 'function') {
      mostrarFeedbackGameplay(`Diagnóstico de ${clave} abierto. Revisa el dictamen y consigue aprobación para pedir la pieza.`, 'ok');
    }
    if (typeof actualizarUI === 'function') actualizarUI();
    if (typeof renderizarWorkspaceCasoActivo === 'function') renderizarWorkspaceCasoActivo();
  } else if (typeof mostrarFeedbackGameplay === 'function') {
    mostrarFeedbackGameplay(`No se encontró el diagnóstico ${clave} en pendientes.`, 'warn');
  }
  return ok;
}

// Punto de entrada único desde las tarjetas de la cola. Evita abrir "Mi puesto"
function obtenerCasoDesdeListaEconomica(origen, idCaso) {
  var clave = String(idCaso || "").trim();
  var lista = origen === "pending-dx" ? casosPendientesDiagnostico : clientesEnEspera;
  if (!Array.isArray(lista)) return null;
  return lista.find(function(c) { return c && String(c.idCaso || "").trim() === clave; }) || null;
}

function rechazarCasoEconomico(origen, idCaso) {
  var clave = String(idCaso || "").trim();
  var lista = origen === "pending-dx" ? casosPendientesDiagnostico : clientesEnEspera;
  if (!Array.isArray(lista)) return false;
  var antes = lista.length;
  lista = lista.filter(function(c) { return !(c && String(c.idCaso || "").trim() === clave); });
  if (origen === "pending-dx") casosPendientesDiagnostico = lista;
  else clientesEnEspera = lista;
  if (lista.length === antes) return false;
  mostrarFeedbackGameplay(`Caso ${clave} rechazado sin penalización: no cubría sus costes.`, "info");
  log(`Caso ${clave} rechazado por pérdida no compensada.`, "info");
  actualizarUI();
  return true;
}

function negociarPrecioCasoEconomico(origen, idCaso) {
  var caso = obtenerCasoDesdeListaEconomica(origen, idCaso);
  if (!caso) return false;
  var economia = evaluarEconomiaCaso(caso);
  var nuevoPago = Math.max(economia.ingreso, economia.costoPiezas + Math.max(180, Math.round(economia.costoPiezas * 0.2)));
  caso.pago = nuevoPago;
  caso.precioNegociado = true;
  caso.negociado = true;
  delete caso.mensajeUltimaAsignacion;
  caso.perdidaAceptada = false;
  mostrarFeedbackGameplay(`Precio renegociado: RD$${nuevoPago}. El trabajo ya cubre piezas y margen mínimo.`, "ok");
  actualizarUI();
  return true;
}

function aceptarPerdidaCasoEconomico(origen, idCaso) {
  var caso = obtenerCasoDesdeListaEconomica(origen, idCaso);
  var compensacion = obtenerCompensacionEstrategicaCaso(caso);
  if (!caso || !compensacion) {
    mostrarFeedbackGameplay("No hay compensación estratégica visible: negocia o rechaza este caso.", "warn");
    return false;
  }
  caso.perdidaAceptada = true;
  delete caso.mensajeUltimaAsignacion;
  mostrarFeedbackGameplay(`Pérdida aceptada por estrategia. ${compensacion}`, "warn");
  actualizarUI();
  return true;
}

// cuando el expediente no pudo convertirse en el caso activo.
function abrirCasoParaDiagnostico(origen, idCaso) {
  var clave = String(idCaso || "").trim();
  var trabajoDuenoActivo = typeof obtenerTrabajoDuenoActivo === "function" ? obtenerTrabajoDuenoActivo() : null;
  if (trabajoDuenoActivo && !trabajoDuenoActivo.listoParaCobro) {
    var confirmarCambio = window.confirm('Ya tienes un caso activo en Mi puesto. ¿Quieres abrir otro? El caso actual se guardará en la cola para retomarlo después.');
    if (confirmarCambio && clienteActual && clienteActual.idCaso) {
      if (!Array.isArray(clientesEnEspera)) clientesEnEspera = [];
      if (!clientesEnEspera.some(function(c) { return c && c.idCaso === clienteActual.idCaso; })) clientesEnEspera.unshift(clienteActual);
      clienteActual = null;
    }
    if (!confirmarCambio) {
      tallerPuestoActivo = 'mi-puesto';
      aplicarPuestoTaller();
      renderizarWorkspaceCasoActivo();
      mostrarFeedbackGameplay('Mi puesto sigue ocupado. El caso actual no fue reemplazado.', 'info');
      return false;
    }
  }
  var activado = activarCasoDesdeLista(origen, clave, true);
  if (!activado) {
    mostrarFeedbackGameplay(
      `No se pudo cargar el expediente ${clave || "seleccionado"}. Sigue en Cola para intentarlo de nuevo.`,
      "error",
    );
    seleccionarPuestoTaller("cola");
    return false;
  }
  tallerPuestoActivo = "mi-puesto";
  aplicarPuestoTaller();
  renderizarWorkspaceCasoActivo();
  mostrarFeedbackGameplay(`Expediente ${clave} listo para diagnosticar.`, "ok");
  return true;
}

function intentarAsignarCasoListaAMecanico(origen, idCaso, idx) {
  var clave = String(idCaso || "").trim();
  if (!clave || typeof idx !== "number" || idx < 0) return false;

  var lista = origen === "pending-dx" ? casosPendientesDiagnostico : clientesEnEspera;
  var indice = Array.isArray(lista) ? lista.findIndex(function(c) { return c && String(c.idCaso || "").trim() === clave; }) : -1;
  var casoAnterior = clienteActual;
  var casoActivoYaEsElMismo = !!(casoAnterior && String(casoAnterior.idCaso || "").trim() === clave);
  if (!casoActivoYaEsElMismo && indice >= 0) {
    clienteActual = lista[indice];
    marcarOrigenCasoActivo(clienteActual, "mi-puesto");
  }
  if (!clienteActual || String(clienteActual.idCaso || "").trim() !== clave) {
    mostrarFeedbackGameplay(`No se cargo el expediente ${clave}; asignacion cancelada.`, "error");
    return false;
  }
  var economiaCaso = evaluarEconomiaCaso(clienteActual);
  if (economiaCaso.neto < 0 && !clienteActual.perdidaAceptada) {
    clienteActual.mensajeUltimaAsignacion = "No se asignó: el trabajo tiene pérdida estimada. Negocia el precio o acepta la pérdida antes de asignarlo.";
    mostrarFeedbackGameplay(clienteActual.mensajeUltimaAsignacion, "warn");
    if (!casoActivoYaEsElMismo) clienteActual = casoAnterior || null;
    return false;
  }

  var mecanicoElegido = mecanicos && mecanicos[idx]
    ? String(mecanicos[idx].nombre || "").trim()
    : "";
  if (!mecanicoElegido) {
    if (!casoActivoYaEsElMismo) clienteActual = casoAnterior || null;
    return false;
  }

  var resultado = !!gestionarMecanico(idx, clave, true);
  if (!resultado) {
    if (!casoActivoYaEsElMismo) clienteActual = casoAnterior || null;
    return false;
  }

  var trabajoCreado = (reparacionesActivas || []).find(function (r) {
    return r && String(r.idCaso || "").trim() === clave;
  });
  var trabajoValido = !!(
    trabajoCreado &&
    String(trabajoCreado.mecanicoNombre || "").trim() === mecanicoElegido &&
    ["diagnostico", "reparacion"].includes(trabajoCreado.tipoTrabajo)
  );
  if (!trabajoValido) {
    reparacionesActivas = (reparacionesActivas || []).filter(function (r) {
      return !(r && String(r.idCaso || "").trim() === clave && (!r.tipoTrabajo || !r.mecanicoNombre));
    });
    log(`Asignacion de ${clave} anulada por inconsistencia de identidad.`, "error");
    mostrarFeedbackGameplay(`No se creo un trabajo valido para ${clave}.`, "error");
    if (!casoActivoYaEsElMismo) clienteActual = casoAnterior || null;
    return false;
  }
  if (!casoActivoYaEsElMismo) {
    if (origen === "pending-dx") casosPendientesDiagnostico = casosPendientesDiagnostico.filter(function(c) { return !c || String(c.idCaso || "").trim() !== clave; });
    else clientesEnEspera = clientesEnEspera.filter(function(c) { return !c || String(c.idCaso || "").trim() !== clave; });
    clienteActual = casoAnterior || null;
  }
  if (typeof actualizarUI === "function") actualizarUI();
  return true;
}

function tocarCasoListaConMecanico(origen, idCaso) {
  var clave = String(idCaso || "").trim();
  if (!clave) return false;

  var idxSeleccionado = Number.isFinite(window.mecanicoTapSeleccionado)
    ? window.mecanicoTapSeleccionado
    : -1;

  if (idxSeleccionado >= 0) {
    var asignado =
      typeof intentarAsignarCasoListaAMecanico === "function"
        ? !!intentarAsignarCasoListaAMecanico(origen, clave, idxSeleccionado)
        : false;
    if (asignado) {
      window.mecanicoTapSeleccionado = -1;
      if (typeof esInteraccionMovil === "function" && esInteraccionMovil()) {
        seleccionarPuestoTaller("trabajos");
      }
      colapsarToolbarRecursos();
      if (typeof mostrarFeedbackGameplay === "function") {
        mostrarFeedbackGameplay(
          `Caso ${clave} enviado a mecanico.`,
          "ok",
        );
      }
      if (typeof actualizarUI === "function") actualizarUI();
      return true;
    }
    // Una selección fallida no debe quedarse armada para el siguiente toque.
    window.mecanicoTapSeleccionado = -1;
    if (typeof actualizarUI === "function") actualizarUI();
  }

  // La tarjeta es informativa: nunca abre Mi Puesto por si sola.
  // Para diagnosticar se debe pulsar el boton explicito de la tarjeta;
  // para asignar, primero se selecciona un mecanico.
  if (typeof seleccionarPuestoTaller === "function") seleccionarPuestoTaller("cola");
  if (idxSeleccionado < 0 && typeof mostrarFeedbackGameplay === "function") {
    mostrarFeedbackGameplay("Selecciona un mecanico o pulsa Diagnosticar caso para abrir este expediente.", "info");
  }
  if (typeof actualizarUI === "function") actualizarUI();
  return false;
}

if (typeof window !== "undefined") {
  window.tocarCasoListaConMecanico = tocarCasoListaConMecanico;
}

function soltarMecanicoEnCasoLista(event, origen, idCaso) {
  event.preventDefault();
  const payload = leerPayloadArrastreCliente(event);
  if (event.currentTarget) event.currentTarget.classList.remove("drop-target");
  finalizarArrastreCliente(event);
  if (!payload) return;

  if (payload.tipo !== "mecanico" || typeof payload.idx !== "number") {
    log("Arrastra un mecanico sobre la tarjeta del caso para iniciar.", "info");
    return;
  }

  var asignado = intentarAsignarCasoListaAMecanico(
    origen,
    idCaso,
    payload.idx,
  );
  if (asignado) {
    window.mecanicoTapSeleccionado = -1;
    colapsarToolbarRecursos();
    if (typeof enfocarElementoUI === "function")
      enfocarElementoUI("repairs-card");
    if (typeof mostrarFeedbackGameplay === "function") {
      mostrarFeedbackGameplay(
        "Asignado. Sigue el progreso en la tarjeta de reparacion del caso.",
        "ok",
      );
    }
    if (typeof actualizarUI === "function") actualizarUI();
  }
}

function permitirDropCliente(event) {
  event.preventDefault();
  if (event.currentTarget && event.currentTarget.id === "cliente-card") {
    event.currentTarget.classList.add("drop-ready");
  }
}

function soltarClienteEnExpediente(event) {
  event.preventDefault();
  const payload = leerPayloadArrastreCliente(event);
  finalizarArrastreCliente(event);
  if (!payload) return;
  if (payload.tipo === "mecanico" && typeof payload.idx === "number") {
    var asignado = !!gestionarMecanico(payload.idx);
    if (asignado) colapsarToolbarRecursos();
    return;
  }
  if (payload.tipo === "delivery") {
    log(
      "Suelta el delivery sobre el caso pausado o usa el boton 'Pedir piezas' en la tarjeta.",
      "info",
    );
    return;
  }
  if (payload.tipo === "cola") {
    seleccionarClienteCola(payload.index);
  }
}

function soltarClienteEnMecanico(event, idx) {
  event.preventDefault();
  const payload = leerPayloadArrastreCliente(event);
  const btn = event.currentTarget;
  if (btn) btn.classList.remove("drop-target");
  finalizarArrastreCliente(event);
  if (!payload) return;
  if (payload.tipo === "aprobado" && payload.idCaso) {
    var asignadoAprobado = intentarAsignarCasoAprobadoAMecanico(
      payload.idCaso,
      idx,
    );
    if (asignadoAprobado) {
      window.casoAprobadoSeleccionadoMovil = "";
      colapsarToolbarRecursos();
      if (typeof actualizarUI === "function") actualizarUI();
    }
    return;
  }
  if (payload.tipo !== "activo") {
    log(
      "Primero arrastra el expediente a la ventana frontal y luego asignalo al mecanico.",
      "info",
    );
    return;
  }
  var asignadoActivo = !!gestionarMecanico(idx);
  if (asignadoActivo) {
    colapsarToolbarRecursos();
    if (typeof actualizarUI === "function") actualizarUI();
  }
}

function permitirDropCasoReparacion(event) {
  event.preventDefault();
  if (event.currentTarget)
    event.currentTarget.classList.add("drop-ready-delivery");
}

function soltarRecursoEnCasoReparacion(event, idCaso) {
  event.preventDefault();
  const payload = leerPayloadArrastreCliente(event);
  if (event.currentTarget)
    event.currentTarget.classList.remove("drop-ready-delivery");
  finalizarArrastreCliente(event);
  if (!payload || !idCaso) return;

  if (payload.tipo === "delivery") {
    var pedidoIniciado = !!iniciarPedidoPiezasConDelivery(
      idCaso,
      typeof payload.slot === "number" ? payload.slot : null,
    );
    if (pedidoIniciado) {
      confirmarPagarDelivery(idCaso);
      colapsarToolbarRecursos();
    }
    return;
  }

  if (payload.tipo === "mecanico") {
    log(
      "Ese caso ya esta asignado. Arrastra mecanicos al caso activo para abrir un trabajo nuevo.",
      "info",
    );
    return;
  }
}

function abrirResultadoOCobrarCaso(idCaso) {
  var clave = String(idCaso || "").trim();
  if (!clave) return false;
  var rep = Array.isArray(reparacionesActivas)
    ? reparacionesActivas.find(function (r) {
        return r && String(r.idCaso || "").trim() === clave && r.listoParaCobro;
      })
    : null;
  if (!rep) {
    if (typeof log === "function") {
      log(
        `No se encontro el caso ${clave} en LISTO para revisar/cobrar.`,
        "warn",
      );
    }
    if (typeof mostrarFeedbackGameplay === "function") {
      mostrarFeedbackGameplay(
        `Ese caso ya no esta en estado LISTO (${clave}).`,
        "warn",
      );
    }
    return false;
  }
  return !!verResultadoReparacionLista(clave);
}

function obtenerTarjetaCasoLista(idCaso) {
  var clave = String(idCaso || "").trim();
  if (!clave) return null;
  var cards = document.querySelectorAll(
    ".flow-case-repair.ready[data-id-caso]",
  );
  for (var i = 0; i < cards.length; i++) {
    var card = cards[i];
    if (String(card.getAttribute("data-id-caso") || "").trim() === clave)
      return card;
  }
  return null;
}

function animarCobroTarjetaCaso(card, rep) {
  if (!card) return;
  card.classList.add("is-cobrando");

  var previo = card.querySelector(".cobro-float-tag");
  if (previo) previo.remove();

  var badge = document.createElement("div");
  badge.className = "cobro-float-tag";
  if (rep && rep.nivelResultado === "fallo") {
    badge.classList.add("bad");
    badge.innerText = `-RD$${Math.round(rep.perdida || 0)}`;
  } else {
    badge.innerText = `+RD$${Math.round((rep && rep.ganancia) || 0)}`;
  }
  card.appendChild(badge);
}

function cobrarOCerrarCasoListo(idCaso, botonRef) {
  var clave = String(idCaso || "").trim();
  if (!clave) return false;
  var rep = Array.isArray(reparacionesActivas)
    ? reparacionesActivas.find(function (r) {
        return r && String(r.idCaso || "").trim() === clave && r.listoParaCobro;
      })
    : null;
  if (!rep) {
    if (typeof log === "function")
      log(`No se encontro el caso ${clave} para cobrar.`, "warn");
    return false;
  }
  if (!rep.resultadoVisible) {
    return !!abrirResultadoOCobrarCaso(clave);
  }

  if (rep.cobroEnProceso) return false;
  rep.cobroEnProceso = true;

  var boton = botonRef && botonRef.tagName ? botonRef : null;
  var tarjeta =
    boton && typeof boton.closest === "function"
      ? boton.closest(".flow-case-repair.ready")
      : obtenerTarjetaCasoLista(clave);
  if (!tarjeta) tarjeta = obtenerTarjetaCasoLista(clave);

  if (boton) {
    boton.disabled = true;
    boton.innerText = "Cobrando...";
  }

  animarCobroTarjetaCaso(tarjeta, rep);

  setTimeout(function () {
    var resultado =
      typeof procesarCobroReparacionDirecto === "function"
        ? procesarCobroReparacionDirecto(clave)
        : { ok: false, mensaje: "Cobro directo no disponible." };
    if (!resultado || !resultado.ok) {
      rep.cobroEnProceso = false;
      if (tarjeta) tarjeta.classList.remove("is-cobrando");
      if (boton) {
        boton.disabled = false;
        boton.innerText = "Cobrar y cerrar";
      }
      if (typeof mostrarFeedbackGameplay === "function") {
        mostrarFeedbackGameplay(
          (resultado && resultado.mensaje) || "No se pudo cobrar el caso.",
          "warn",
        );
      }
    } else {
      // Procesar retorno de inversiones cada vez que se cierra un caso
      if (typeof procesarRetornoInversionesPorCaso === "function") {
        procesarRetornoInversionesPorCaso();
      }
    }
  }, 420);
  return true;
}

if (typeof window !== "undefined") {
  window.abrirResultadoOCobrarCaso = abrirResultadoOCobrarCaso;
  window.cobrarOCerrarCasoListo = cobrarOCerrarCasoListo;
}

function obtenerFaseDelivery(entrega) {
  entrega = normalizarEntregaPiezaActiva(entrega);
  if (!entrega) return { fase: "Buscando piezas", progreso: 0 };
  var total = Math.max(
    1,
    Math.round(entrega.segundosTotalesReal || entrega.duracionRealSeg || 1),
  );
  var restante = obtenerSegundosRestantesDelivery(entrega);
  var progreso = Math.max(
    0,
    Math.min(100, Math.round(((total - restante) / total) * 100)),
  );
  return {
    fase: progreso < 50 ? "Buscando piezas" : "Trayendo piezas",
    progreso: progreso,
  };
}

function obtenerClaseCampoInspeccion(expediente, docId, fieldIndex) {
  let clase = "doc-field";
  const seleccionado = (expediente.seleccion || []).some(
    (sel) => sel.docId === docId && sel.fieldIndex === fieldIndex,
  );
  if (seleccionado) clase += " selected";
  const comparacion = (expediente.comparaciones || []).find(
    (comp) => comp.docId === docId && comp.fieldIndex === fieldIndex,
  );
  if (comparacion)
    clase += comparacion.tipo === "match" ? " match" : " mismatch";
  return clase;
}

function abrirInspeccionCliente() {
  if (!clienteActual) {
    log("No hay cliente activo para inspeccionar.", "error");
    return;
  }
  if (typeof asegurarExpedienteInspeccion === "function") {
    asegurarExpedienteInspeccion(clienteActual);
  }
  renderizarModalInspeccion();
  const modal = document.getElementById("modal-inspeccion");
  if (modal) {
    modal.classList.remove("hidden");
  }
  if (typeof sincronizarPausaJuego === "function") {
    sincronizarPausaJuego();
  }
}

function renderizarModalInspeccion() {
  const modal = document.getElementById("modal-inspeccion");
  const resumen = document.getElementById("inspeccion-resumen");
  const documentos = document.getElementById("inspeccion-documentos");
  const seleccion = document.getElementById("inspeccion-seleccion");
  const resultado = document.getElementById("inspeccion-resultado");
  const hallazgos = document.getElementById("inspeccion-hallazgos");
  if (
    !modal ||
    !resumen ||
    !documentos ||
    !seleccion ||
    !resultado ||
    !hallazgos
  )
    return;

  if (!clienteActual) {
    resumen.innerText = "Sin expediente activo.";
    documentos.innerHTML = "No hay documentos abiertos.";
    seleccion.innerText = "Selecciona dos campos para comparar.";
    resultado.innerText = "Sin comparacion todavia.";
    hallazgos.innerText = "No has detectado discrepancias.";
    return;
  }

  const expediente = asegurarExpedienteInspeccion(clienteActual);
  const totalObjetivos = Math.max(expediente.objetivos.length, 1);
  const metaHallazgos = expediente.objetivos.length
    ? `${expediente.hallazgos.length}/${totalObjetivos}`
    : `${expediente.hallazgos.length} relevantes`;
  resumen.innerHTML = `Cliente: <strong>${clienteActual.personaNombre}</strong> | Vehiculo: <strong>${clienteActual.vehiculo}</strong><br>Bonus por inspeccion: ${(expediente.bonus * 100).toFixed(0)}% | Hallazgos: ${metaHallazgos}`;
  documentos.innerHTML = expediente.docs
    .map(
      (doc) => `
        <section class="doc-card">
            <h4>${doc.titulo}</h4>
            <div class="doc-meta">${doc.meta}</div>
            <div class="doc-field-list">
                ${doc.fields
                  .map(
                    (field, fieldIndex) => `
                    <button type="button" class="${obtenerClaseCampoInspeccion(expediente, doc.id, fieldIndex)}" onclick="seleccionarCampoInspeccion('${doc.id}', ${fieldIndex})">
                        <small>${field.label}</small>
                        <span>${field.value}</span>
                    </button>
                `,
                  )
                  .join("")}
            </div>
        </section>
    `,
    )
    .join("");

  if (expediente.seleccion.length) {
    const textoSel = expediente.seleccion.map((sel) => {
      const doc = expediente.docs.find((d) => d.id === sel.docId);
      const field = doc && doc.fields[sel.fieldIndex];
      if (!doc || !field) return "Seleccion invalida";
      return `${doc.titulo}: ${field.label} = ${field.value}`;
    });
    seleccion.innerHTML = textoSel.join("<br>");
  } else {
    seleccion.innerText = "Selecciona dos campos para comparar.";
  }

  resultado.innerHTML = expediente.ultimaRevision || "Sin comparacion todavia.";
  hallazgos.innerHTML = expediente.hallazgos.length
    ? expediente.hallazgos
        .map((item) => `<span class="hallazgo-chip">${item}</span>`)
        .join("")
    : "No has detectado discrepancias.";
}

function seleccionarCampoInspeccion(docId, fieldIndex) {
  if (!clienteActual) return;
  const expediente = asegurarExpedienteInspeccion(clienteActual);
  const yaExiste = expediente.seleccion.findIndex(
    (sel) => sel.docId === docId && sel.fieldIndex === fieldIndex,
  );
  if (yaExiste >= 0) {
    expediente.seleccion.splice(yaExiste, 1);
    renderizarModalInspeccion();
    return;
  }
  expediente.seleccion.push({ docId: docId, fieldIndex: fieldIndex });
  if (expediente.seleccion.length > 2) expediente.seleccion.shift();
  if (expediente.seleccion.length === 2) compararCamposInspeccion();
  renderizarModalInspeccion();
}

function compararCamposInspeccion() {
  if (!clienteActual) return;
  const expediente = asegurarExpedienteInspeccion(clienteActual);
  if (expediente.seleccion.length < 2) return;

  const primero = expediente.seleccion[0];
  const segundo = expediente.seleccion[1];
  const docA = expediente.docs.find((doc) => doc.id === primero.docId);
  const docB = expediente.docs.find((doc) => doc.id === segundo.docId);
  const campoA = docA && docA.fields[primero.fieldIndex];
  const campoB = docB && docB.fields[segundo.fieldIndex];
  if (!docA || !docB || !campoA || !campoB) return;

  expediente.comparaciones = [
    { docId: primero.docId, fieldIndex: primero.fieldIndex, tipo: "match" },
    { docId: segundo.docId, fieldIndex: segundo.fieldIndex, tipo: "match" },
  ];

  if (campoA.key !== campoB.key) {
    expediente.ultimaRevision =
      "Campos no comparables: revisa dos datos del mismo tipo.";
    expediente.seleccion = [];
    renderizarModalInspeccion();
    return;
  }

  if (campoA.value === campoB.value) {
    expediente.ultimaRevision = `Coincidencia valida en ${campoA.label.toLowerCase()}. Los documentos se sostienen entre si.`;
    expediente.seleccion = [];
    renderizarModalInspeccion();
    return;
  }

  expediente.comparaciones = [
    { docId: primero.docId, fieldIndex: primero.fieldIndex, tipo: "mismatch" },
    { docId: segundo.docId, fieldIndex: segundo.fieldIndex, tipo: "mismatch" },
  ];

  const etiquetaHallazgo = `${campoA.label}: ${campoA.value} <> ${campoB.value}`;
  const esObjetivo = expediente.objetivos.includes(campoA.key);
  const esNuevoHallazgo = !expediente.hallazgos.includes(etiquetaHallazgo);
  if (esNuevoHallazgo) expediente.hallazgos.push(etiquetaHallazgo);
  if (!esNuevoHallazgo) {
    expediente.ultimaRevision = `Esa discrepancia ya estaba registrada en ${campoA.label.toLowerCase()}.`;
    expediente.seleccion = [];
    renderizarModalInspeccion();
    return;
  }

  if (esObjetivo) {
    expediente.bonus = Math.min(0.18, expediente.bonus + 0.05);
    if (campoA.key === "sistema" || campoA.key === "riesgo") {
      clienteActual.contradiccionDetectada = true;
      clienteActual.bonusContradiccion = Math.max(
        clienteActual.bonusContradiccion || 0,
        0.1,
      );
    }
    if (campoA.key === "plazo" || campoA.key === "prioridad") {
      clienteActual.dificultad = Math.max(0.2, clienteActual.dificultad - 0.03);
    }
    if (expediente.veredicto !== "rechazado")
      expediente.veredicto = "observado";
    expediente.ultimaRevision = `Discrepancia real en ${campoA.label.toLowerCase()}. El expediente gana claridad y reduce ruido del caso.`;
    mostrarStamp("OBSERVADO", "warn");
    log(
      `Inspeccion: detectaste discrepancia en ${campoA.label.toLowerCase()}.`,
      "exito",
    );
  } else {
    expediente.bonus = Math.min(0.12, expediente.bonus + 0.02);
    expediente.ultimaRevision = `Diferencia secundaria en ${campoA.label.toLowerCase()}. Sirve como contexto, pero no define el caso por si sola.`;
    log(
      `Inspeccion: encontraste una diferencia secundaria en ${campoA.label.toLowerCase()}.`,
      "info",
    );
  }

  expediente.seleccion = [];
  actualizarUI();
  renderizarModalInspeccion();
}

function aplicarSelloExpediente(tipo) {
  if (!clienteActual) return;
  const expediente = asegurarExpedienteInspeccion(clienteActual);
  expediente.veredicto = tipo;
  if (tipo === "aprobado" && expediente.hallazgos.length === 0) {
    expediente.bonus = Math.min(0.08, expediente.bonus + 0.02);
  }
  if (tipo === "rechazado" && expediente.hallazgos.length > 0) {
    expediente.bonus = Math.min(0.18, expediente.bonus + 0.02);
  }
  mostrarStamp(
    tipo === "aprobado"
      ? "APROBADO"
      : tipo === "rechazado"
        ? "RECHAZADO"
        : "OBSERVADO",
    tipo === "rechazado" ? "error" : tipo === "observado" ? "warn" : "ok",
  );
  renderizarModalInspeccion();
  actualizarUI();
}

function limpiarSelloExpediente() {
  if (!clienteActual) return;
  const expediente = asegurarExpedienteInspeccion(clienteActual);
  expediente.veredicto = "pendiente";
  renderizarModalInspeccion();
  actualizarUI();
}

function obtenerFactorPresionJugador() {
  if (modoNivelesActivo() || esModoCasosPuro()) return 0;
  const base = (hambre + sueno + estres) / 300;
  const extraCritico =
    (hambre >= 85 ? 0.14 : 0) +
    (sueno >= 85 ? 0.16 : 0) +
    (estres >= 85 ? 0.12 : 0);
  return Math.min(1, base + extraCritico);
}

function obtenerFactorRendimientoJugador() {
  if (modoNivelesActivo() || esModoCasosPuro()) return 1;
  const penalBase = hambre / 360 + sueno / 330 + estres / 430;
  const penalCritica =
    (hambre >= 80 ? 0.08 : 0) +
    (sueno >= 80 ? 0.1 : 0) +
    (estres >= 85 ? 0.08 : 0);
  return Math.max(0.45, 1 - (penalBase + penalCritica));
}

function obtenerNivelRiesgoCaso(dificultad) {
  if (dificultad >= 0.82) return "Caso complicado";
  if (dificultad >= 0.62) return "Caso medio";
  return "Caso manejable";
}

function obtenerEtiquetaRiesgoTarjeta(dificultad) {
  if (dificultad >= 0.82) return "Riesgo alto";
  if (dificultad >= 0.62) return "Riesgo medio";
  return "Riesgo bajo";
}

function obtenerEtiquetaTiempoTarjeta(tiempo) {
  if (tiempo <= 4) return "Urgente";
  if (tiempo <= 8) return "En observacion";
  return "Estable";
}

function obtenerPagoEstimadoTexto(cliente) {
  if (!cliente) return "RD$0";
  if (cliente.diagnosticado) return `RD$${Math.round(cliente.pago)} confirmado`;
  const min = Math.max(300, Math.round(cliente.pago * 0.78));
  const max = Math.round(cliente.pago * 1.18);
  return `RD$${min} - RD$${max}`;
}

function obtenerHipotesisCaso(cliente) {
  if (!cliente) return ["Sin cliente activo."];
  if (cliente.diagnosticado) {
    if (cliente.diagnosticoCorrecto)
      return [`Diagnostico validado: ${cliente.diagnosticoDetectado}.`];
    return [
      `Diagnostico incierto: ${cliente.diagnosticoDetectado}.`,
      "Conviene reconfirmar antes de reparar.",
    ];
  }
  const base = {
    motor: [
      "Soporte de motor danado",
      "Perdida de compresion",
      "Problema en escape",
    ],
    transmision: [
      "Desgaste en transmision",
      "Soporte de caja suelto",
      "Eje con holgura",
    ],
    electricidad: [
      "Falla en sensores",
      "Conector en corto",
      "Alternador intermitente",
    ],
    frenos: [
      "Pastillas cristalizadas",
      "Disco irregular",
      "Linea de freno con aire",
    ],
    suspension: ["Buje gastado", "Amortiguador vencido", "Terminal con juego"],
  };
  return (
    base[cliente.especialidadIdeal] || [
      "Averia mecanica general",
      "Problema de ajuste",
      "Componente flojo",
    ]
  );
}

function consumirFoco(tipoAccion) {
  if (hayConversacionNarrativaBloqueanteActiva()) {
    var pendiente = obtenerConversacionNarrativaPendiente("");
    var contactoNombre = pendiente
      ? obtenerContactoNombreTelefono(pendiente.contactoId)
      : "Telefono";
    log(
      "Accion bloqueada: primero responde la historia pendiente en " +
        contactoNombre +
        ".",
      "error",
    );
    if (typeof mostrarFeedbackGameplay === "function") {
      mostrarFeedbackGameplay(
        "Historia pendiente: abre Telefono y responde para desbloquear el taller.",
        "warn",
      );
    }
    enfocarConversacionNarrativaPendiente(pendiente || null);
    return false;
  }

  if (modoNivelesActivo() || esModoCasosPuro()) return true;
  // No gastamos energia por accion, pero el estado del dueno si puede bloquear trabajo tecnico.
  const _ = tipoAccion;
  if (hambre >= 96 || sueno >= 96 || estres >= 98) {
    log(
      "Estas al limite fisico. Come, descansa o baja estres antes de seguir.",
      "error",
    );
    if (typeof mostrarFeedbackGameplay === "function") {
      mostrarFeedbackGameplay(
        "Bloqueado por agotamiento: atiende hambre/sueno/estres.",
        "error",
      );
    }
    return false;
  }
  return true;
}

function procesarEnfriamientoMecanicos() {
  var modoSinCierre =
    typeof estaModoSinCierreDia === "function" && estaModoSinCierreDia();
  mecanicos.forEach((m) => {
    if (modoSinCierre && (m.bloqueadoHastaDia || 0) >= dia) {
      m.bloqueadoHastaDia = 0;
    }
    if ((m.enfriamientoTurnos || 0) > 0) {
      var turnosAntes = Math.max(0, Math.round(Number(m.enfriamientoTurnos) || 0));
      var descansoTotal = Math.max(0, Math.round(Number(m.descansoEnergiaTotal) || 0));
      if (descansoTotal > 0) {
        var energiaInicio = Math.max(0, Math.min(100, Number(m.descansoEnergiaInicio) || 0));
        var energiaObjetivo = Math.max(energiaInicio, Math.min(100, Number(m.descansoEnergiaObjetivo) || energiaInicio));
        var avanceDescanso = Math.max(0, Math.min(1, (descansoTotal - turnosAntes + 1) / descansoTotal));
        m.energia = Math.round(energiaInicio + ((energiaObjetivo - energiaInicio) * avanceDescanso));
      }
      m.enfriamientoTurnos = Math.max(0, turnosAntes - 1);
      if (m.enfriamientoTurnos === 0 && descansoTotal > 0) {
        m.energia = Math.max(0, Math.min(100, Math.round(Number(m.descansoEnergiaObjetivo) || m.energia || 0)));
        delete m.descansoEnergiaInicio;
        delete m.descansoEnergiaObjetivo;
        delete m.descansoEnergiaTotal;
      }
    }
    if ((m.bloqueoAyudaTurnos || 0) > 0) {
      m.bloqueoAyudaTurnos -= 1;
      if (m.bloqueoAyudaTurnos < 0) m.bloqueoAyudaTurnos = 0;
    }
    if (
      modoSinCierre &&
      (m.enfriamientoTurnos || 0) === 0 &&
      m.ausenciaAnunciada
    ) {
      m.ausenciaAnunciada = false;
    }
    m.ocupado = (m.enfriamientoTurnos || 0) > 0;
  });
  if (typeof avanzarEnfriamientosCuidado === "function") avanzarEnfriamientosCuidado();
}

function actualizarTurnoActivoUI() {
  const modoNiveles = modoNivelesActivo();
  const turnoRelojEl = document.getElementById("turno-reloj");
  if (turnoRelojEl) {
    turnoRelojEl.innerText = modoNiveles
      ? "Reparaciones en tiempo real"
      : `Hora ${obtenerHoraDelDiaTexto()}`;
  }

  const alertas =
    (Array.isArray(clientesEnEspera)
      ? clientesEnEspera.filter((c) => c.pacienciaCola <= 35).length
      : 0) + (clienteActual && tiempoCliente <= 4 ? 1 : 0);
  const turnoAlertasEl = document.getElementById("turno-alertas");
  if (turnoAlertasEl) {
    turnoAlertasEl.innerText = `Alertas: ${alertas} | Eventos: ${eventosTurnoVistos}`;
  }
  const fase =
    Array.isArray(reparacionesActivas) && reparacionesActivas.length > 0
      ? "Elevadores ocupados"
      : clienteActual
        ? "Caso abierto"
        : "Mostrador estable";
  const turnoResumenEl = document.getElementById("turno-resumen");
  if (turnoResumenEl) {
    const colaLen = Array.isArray(clientesEnEspera)
      ? clientesEnEspera.length
      : 0;
    const activasLen = Array.isArray(reparacionesActivas)
      ? reparacionesActivas.length
      : 0;
    turnoResumenEl.innerText = `Cola ${colaLen} | Activas ${activasLen} | ${fase}`;
  }
  const focoPct =
    focoDiaMax > 0
      ? Math.max(
          0,
          Math.min(100, Math.round((focoDiaActual / focoDiaMax) * 100)),
        )
      : 0;
  const focoEstado =
    focoPct >= 65 ? "Alto" : focoPct >= 35 ? "Medio" : "Critico";
  const focoFill = document.getElementById("turno-foco-fill");
  if (focoFill) {
    focoFill.style.width = `${focoPct}%`;
    focoFill.classList.remove("warn", "danger");
    if (focoPct < 35) focoFill.classList.add("danger");
    else if (focoPct < 65) focoFill.classList.add("warn");
  }

  const focoLabel = document.getElementById("turno-foco-label");
  if (focoLabel)
    focoLabel.innerText = modoNiveles
      ? `Nivel ${nivelJugador}`
      : `Energia ${focoDiaActual}/${focoDiaMax}`;

  const focoEstadoEl = document.getElementById("turno-foco-estado");
  if (focoEstadoEl) {
    focoEstadoEl.innerText = modoNiveles
      ? `Progreso ${Math.round(progresoNivel)}/${Math.round(progresoNivelMeta)}`
      : `Estado: ${focoEstado}`;
  }

  const chipHablar = document.getElementById("chip-costo-hablar");
  const chipDx = document.getElementById("chip-costo-dx");
  const chipRep = document.getElementById("chip-costo-rep");
  if (chipHablar)
    chipHablar.innerHTML = modoNiveles
      ? "<strong>Economia</strong>+Ahorro"
      : `<strong>Hablar</strong>${COSTOS_FOCO.hablarCliente}E`;
  if (chipDx)
    chipDx.innerHTML = modoNiveles
      ? "<strong>Tecnica</strong>Skill + Rasgos"
      : `<strong>Diagnosticar</strong>${COSTOS_FOCO.diagnostico}E`;
  if (chipRep)
    chipRep.innerHTML = modoNiveles
      ? "<strong>Ritmo</strong>Tiempo real"
      : `<strong>Reparar</strong>${COSTOS_FOCO.reparacion}E`;
}

function iniciarDesdeMenu() {
  const storage = window.TallerApp.storage || {};
  const storageKeys = (storage && storage.keys) || {};
  if (storage && typeof storage.writeRaw === "function") {
    storage.writeRaw(storageKeys.forceNewSession || "tw_force_new", "1", "session");
  } else {
    sessionStorage.setItem("tw_force_new", "1");
  }
  if (storage && typeof storage.resetGamePersistence === "function") {
    storage.resetGamePersistence();
  } else {
    try {
      localStorage.removeItem(window.TallerApp.config.saveKey);
    } catch (e) {}
    try {
      if (typeof limpiarTrabajosActivosPersistidos === "function") {
        limpiarTrabajosActivosPersistidos();
      } else {
        localStorage.removeItem("trabajosActivos");
      }
    } catch (e) {}
  }
  // Ocultar menú de inicio antes de recargar
  var menuInicioEl = document.getElementById("menu-inicio");
  if (menuInicioEl) menuInicioEl.classList.add("hidden");
  location.reload();
}

function sincronizarPausaJuego() {
  var gameEl = document.getElementById("game");
  var menuEl = obtenerMenuInicioEl();
  var pantallaTallerEl = document.getElementById("pantalla-taller");
  var pantallaCierreEl = document.getElementById("pantalla-cierre");
  var pantallaFinalEl = document.getElementById("pantalla-final");
  var detalleCasoEl = document.getElementById("modal-detalle-caso");
  var modalesQuePausan = [
    "modal-pausa",
    "modal-tirada",
    "modal-decision",
    "modal-banco",
    "modal-historia-dia",
    "modal-resultado-reparacion",
    "modal-dx-fallo",
  ];

  var enJuego = !!(gameEl && !gameEl.classList.contains("hidden"));
  var menuVisible = !!(menuEl && !menuEl.classList.contains("hidden"));
  var tallerVisible = !!(
    pantallaTallerEl && !pantallaTallerEl.classList.contains("hidden")
  );
  var cierreVisible = !!(
    pantallaCierreEl && !pantallaCierreEl.classList.contains("hidden")
  );
  var finalVisible = !!(
    pantallaFinalEl && !pantallaFinalEl.classList.contains("hidden")
  );
  var modalBloqueanteAbierto = modalesQuePausan.some(function (id) {
    var modal = document.getElementById(id);
    return !!(modal && !modal.classList.contains("hidden"));
  });
  var cualquierModalAbierto = Array.from(document.querySelectorAll(".modal-overlay")).some(function(modal) {
    return modal && !modal.classList.contains("hidden");
  });
  var progresoAbierto = !!document.querySelector(".app-progress-tray[open]");
  var fueraDelTaller = typeof pantallaActiva === "string" && pantallaActiva !== "taller";
  var detalleCasoVisible = !!(
    detalleCasoEl && !detalleCasoEl.classList.contains("hidden")
  );
  var narrativaBloqueante =
    typeof hayConversacionNarrativaBloqueanteActiva === "function" &&
    hayConversacionNarrativaBloqueanteActiva();

  juegoPausado = !!(
    !enJuego ||
    menuVisible ||
    !tallerVisible ||
    fueraDelTaller ||
    cierreVisible ||
    finalVisible ||
    modalBloqueanteAbierto ||
    cualquierModalAbierto ||
    progresoAbierto ||
    detalleCasoVisible ||
    narrativaBloqueante ||
    tiradaEnCurso
  );

  if (typeof document !== "undefined" && document.body) {
    document.body.classList.toggle("juego-pausado", juegoPausado);
  }

  return juegoPausado;
}

function salirAlMenuInicio() {
  detenerTimer();
  if (typeof window.detenerMonitorProgreso === "function") {
    window.detenerMonitorProgreso();
  }
  var menuEl = obtenerMenuInicioEl();
  document.getElementById("game").classList.remove("modo-taller-fijo");
  document.getElementById("game").classList.remove("scene-oficina-activa");
  document.getElementById("game").classList.add("hidden");
  if (menuEl) menuEl.classList.remove("hidden");
  // Resetear pantalla activa al taller
  document
    .querySelectorAll(".game-screen")
    .forEach((s) => s.classList.remove("active"));
  const st = document.getElementById("screen-taller");
  if (st) st.classList.add("active");
  document
    .querySelectorAll(".game-nav-btn")
    .forEach((b) =>
      b.classList.toggle("active", b.dataset.screen === "taller"),
    );
  cerrarModal();
  sincronizarPausaJuego();
}

function abrirMenuPausa() {
  if (document.getElementById("pantalla-taller").classList.contains("hidden"))
    return;
  abrirModal("pausa");
}

function reanudarJuego() {
  cerrarModal();
}

function actualizarVistaOpciones() {
    const slider = document.getElementById("opcion-velocidad");
    const valor = document.getElementById("opcion-velocidad-valor");
  if (slider && valor) {
    const etiquetas = { relajado: "30s | sin abandono", gestion: "30s", crisis: "10s" };
    valor.innerText = etiquetas[slider.value] || "30s";
  }
}

function obtenerTemaPrincipalAudioLabel() {
  var fuentesMusica =
    window.TallerAudio && typeof window.TallerAudio.getMusicSources === "function"
      ? window.TallerAudio.getMusicSources()
      : [];
  return fuentesMusica.length
    ? String(fuentesMusica[0]).split("/").pop()
    : "Sin tema";
}

function sincronizarPreferenciasAudio() {
  if (
    typeof window !== "undefined" &&
    window.TallerAudio
  ) {
    if (typeof window.TallerAudio.setEnabled === "function") {
      window.TallerAudio.setEnabled(efectosSonidoActivos);
    }
    if (typeof window.TallerAudio.setMusicEnabled === "function") {
      window.TallerAudio.setMusicEnabled(musicaFondoActiva);
    }
  }
}

function cargarOpcionesEnUI() {
  const slider = document.getElementById("opcion-velocidad");
  const check = document.getElementById("opcion-autoavance");
  const checkMusica = document.getElementById("opcion-musica");
  const checkEfectos = document.getElementById("opcion-efectos");
  const checkNotificaciones = document.getElementById("opcion-notificaciones");
  const audioResumen = document.getElementById("opciones-audio-resumen");
  if (slider) slider.value = modoRitmoJuego || (autoTurnoCadaSeg <= 10 ? "crisis" : "gestion");
  if (check) check.checked = !!autoAvanceActivo;
  if (checkMusica) checkMusica.checked = !!musicaFondoActiva;
  if (checkEfectos) checkEfectos.checked = !!efectosSonidoActivos;
  if (checkNotificaciones) checkNotificaciones.checked = !!notificacionesSistemaActivas;
  if (audioResumen) {
    audioResumen.innerText = `Tema detectado: ${obtenerTemaPrincipalAudioLabel()}. Efectos ${efectosSonidoActivos ? "activos" : "en silencio"}.`;
  }
  actualizarVistaOpciones();
}

function guardarOpciones() {
  const slider = document.getElementById("opcion-velocidad");
  const check = document.getElementById("opcion-autoavance");
  const checkMusica = document.getElementById("opcion-musica");
  const checkEfectos = document.getElementById("opcion-efectos");
  const checkNotificaciones = document.getElementById("opcion-notificaciones");
  modoRitmoJuego = slider ? String(slider.value || "gestion") : modoRitmoJuego;
  // El ritmo relajado/gestionado debe respetar la etiqueta visible de 30s.
  // Crisis acelera, pero no debe quemar al equipo cada pocos segundos.
  autoTurnoCadaSeg = modoRitmoJuego === "crisis" ? 15 : 30;
  autoAvanceActivo = !!(check ? check.checked : autoAvanceActivo);
  musicaFondoActiva = !!(checkMusica ? checkMusica.checked : musicaFondoActiva);
  efectosSonidoActivos = !!(checkEfectos ? checkEfectos.checked : efectosSonidoActivos);
  notificacionesSistemaActivas = !!(
    checkNotificaciones ? checkNotificaciones.checked : notificacionesSistemaActivas
  );
  sincronizarPreferenciasAudio();
  const payload = {
    autoTurnoCadaSeg,
    modoRitmoJuego,
    autoAvanceActivo,
    musicaFondoActiva,
    efectosSonidoActivos,
    notificacionesSistemaActivas,
  };
  const storage = window.TallerApp.storage || {};
  if (storage && typeof storage.writeJSON === "function") {
    storage.writeJSON(window.TallerApp.config.optionsKey, payload, "local");
  } else {
    localStorage.setItem(
      window.TallerApp.config.optionsKey,
      JSON.stringify(payload),
    );
  }
  if (window.TallerAudio && typeof window.TallerAudio.play === "function") {
    window.TallerAudio.play(efectosSonidoActivos ? "success" : "close");
  }
  log("Opciones guardadas.", "exito");
  cerrarModal();
  actualizarUI();
  if (typeof actualizarScreenConfiguracion === "function") actualizarScreenConfiguracion();
}

function cargarOpciones() {
  const storage = window.TallerApp.storage || {};
  const data = storage && typeof storage.readJSON === "function"
    ? storage.readJSON(window.TallerApp.config.optionsKey, null, "local")
    : null;
  if (data) {
    const velocidadGuardada = parseInt(data.autoTurnoCadaSeg || 30, 10);
    modoRitmoJuego = ["relajado", "gestion", "crisis"].includes(data.modoRitmoJuego)
      ? data.modoRitmoJuego
      : (velocidadGuardada <= 10 && velocidadGuardada > 3 ? "crisis" : "gestion");
    autoTurnoCadaSeg = modoRitmoJuego === "crisis" ? 15 : 30;
    autoAvanceActivo =
      typeof data.autoAvanceActivo === "boolean" ? data.autoAvanceActivo : true;
    musicaFondoActiva =
      typeof data.musicaFondoActiva === "boolean" ? data.musicaFondoActiva : true;
    efectosSonidoActivos =
      typeof data.efectosSonidoActivos === "boolean" ? data.efectosSonidoActivos : true;
    notificacionesSistemaActivas =
      typeof data.notificacionesSistemaActivas === "boolean"
        ? data.notificacionesSistemaActivas
        : true;
    sincronizarPreferenciasAudio();
    return;
  }
  const raw = localStorage.getItem(window.TallerApp.config.optionsKey);
  if (!raw) {
    sincronizarPreferenciasAudio();
    return;
  }
  try {
    const parsed = JSON.parse(raw);
    const velocidadGuardada = parseInt(parsed.autoTurnoCadaSeg || 30, 10);
    modoRitmoJuego = ["relajado", "gestion", "crisis"].includes(parsed.modoRitmoJuego)
      ? parsed.modoRitmoJuego
      : (velocidadGuardada <= 10 && velocidadGuardada > 3 ? "crisis" : "gestion");
    autoTurnoCadaSeg = modoRitmoJuego === "crisis" ? 15 : 30;
    autoAvanceActivo =
      typeof parsed.autoAvanceActivo === "boolean" ? parsed.autoAvanceActivo : true;
    musicaFondoActiva =
      typeof parsed.musicaFondoActiva === "boolean" ? parsed.musicaFondoActiva : true;
    efectosSonidoActivos =
      typeof parsed.efectosSonidoActivos === "boolean" ? parsed.efectosSonidoActivos : true;
    notificacionesSistemaActivas =
      typeof parsed.notificacionesSistemaActivas === "boolean"
        ? parsed.notificacionesSistemaActivas
        : true;
  } catch (e) {
    autoTurnoCadaSeg = 30;
    modoRitmoJuego = "gestion";
    autoAvanceActivo = true;
    musicaFondoActiva = true;
    efectosSonidoActivos = true;
    notificacionesSistemaActivas = true;
  }
  sincronizarPreferenciasAudio();
}

// Exportar a window para compatibilidad con game.js
if (typeof window !== "undefined") {
  window.cargarOpciones = cargarOpciones;
}

function obtenerMapaMigracionVehiculosGuardado() {
  var td = window.TallerData || {};
  return td.mapaVehiculosLegacy &&
    typeof td.mapaVehiculosLegacy === "object"
    ? td.mapaVehiculosLegacy
    : {};
}

function obtenerMapaHashVehiculosGuardado() {
  var td = window.TallerData || {};
  return td.hashVehiculosLegacy &&
    typeof td.hashVehiculosLegacy === "object"
    ? td.hashVehiculosLegacy
    : {};
}

function obtenerMapaHashMarcasVehiculoGuardado() {
  var td = window.TallerData || {};
  return td.hashMarcasVehiculoLegacy &&
    typeof td.hashMarcasVehiculoLegacy === "object"
    ? td.hashMarcasVehiculoLegacy
    : {};
}

function calcularHashVehiculoLegacyGuardado(valor) {
  const texto = String(valor || "");
  let hash = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    hash ^= texto.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function normalizarNombreVehiculoGuardado(valor) {
  const limpio = String(valor || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!limpio) return limpio;
  const mapa = obtenerMapaMigracionVehiculosGuardado();
  if (mapa[limpio]) return mapa[limpio];
  const mapaHash = obtenerMapaHashVehiculosGuardado();
  const hash = calcularHashVehiculoLegacyGuardado(limpio.toLowerCase());
  return mapaHash[hash] || limpio;
}

function normalizarClaveMarcaVehiculoGuardado(valor) {
  const limpio = String(valor || "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();
  if (!limpio) return "";
  const mapa = {
    ASAHI: "KAIRO",
    MAZEL: "CHEVAL",
    FOREN: "MONTARA",
    RUGEN: "VELTOR",
    SABRIN: "NORIK",
  };
  if (mapa[limpio]) return mapa[limpio];
  const mapaHash = obtenerMapaHashMarcasVehiculoGuardado();
  const hash = calcularHashVehiculoLegacyGuardado(limpio.toLowerCase());
  return mapaHash[hash] || limpio;
}

function migrarExperienciaVehiculoDxGuardada(mapa) {
  if (!mapa || typeof mapa !== "object") return {};
  const migrado = {};
  Object.keys(mapa).forEach(function (key) {
    const clave = normalizarClaveMarcaVehiculoGuardado(key);
    if (!clave) return;
    const puntos = Math.max(0, Math.round(mapa[key] || 0));
    migrado[clave] = Math.max(
      0,
      Math.min(120, Math.round((migrado[clave] || 0) + puntos)),
    );
  });
  return migrado;
}

function migrarVehiculosEnNodoGuardado(nodo, visitados) {
  if (!nodo || typeof nodo !== "object") return nodo;
  if (visitados.has(nodo)) return nodo;
  visitados.add(nodo);

  if (Array.isArray(nodo)) {
    nodo.forEach(function (item) {
      migrarVehiculosEnNodoGuardado(item, visitados);
    });
    return nodo;
  }

  Object.keys(nodo).forEach(function (key) {
    if (key === "vehiculo" && typeof nodo[key] === "string") {
      nodo[key] = normalizarNombreVehiculoGuardado(nodo[key]);
      return;
    }
    migrarVehiculosEnNodoGuardado(nodo[key], visitados);
  });

  return nodo;
}

function migrarPartidaGuardada(data) {
  if (!data || typeof data !== "object") return data;
  migrarVehiculosEnNodoGuardado(data, new WeakSet());
  if (
    data.experienciaVehiculoDx &&
    typeof data.experienciaVehiculoDx === "object"
  ) {
    data.experienciaVehiculoDx = migrarExperienciaVehiculoDxGuardada(
      data.experienciaVehiculoDx,
    );
  }
  var BALANCE_MECANICOS_VERSION = 2;
  if ((Number(data.balanceMecanicosVersion) || 0) < BALANCE_MECANICOS_VERSION) {
    var rebalancearListaMecanicos = function (lista) {
      return (Array.isArray(lista) ? lista : []).map(function (mecanico) {
        if (!mecanico || typeof mecanico !== "object") return mecanico;
        var copia = { ...mecanico };
        var habilidad = Number(copia.habilidad);
        var velocidad = Number(copia.velocidad);
        var eficiencia = Number(copia.eficiencia);
        if (Number.isFinite(habilidad)) {
          copia.habilidad = Math.max(0.35, Math.min(1, Math.round(habilidad * 90) / 100));
        }
        if (Number.isFinite(velocidad)) {
          copia.velocidad = Math.max(0.35, Math.min(1, Math.round(velocidad * 90) / 100));
        }
        if (Number.isFinite(eficiencia)) {
          copia.eficiencia = Math.max(0.35, Math.min(1, Math.round(eficiencia * 90) / 100));
        }
        return copia;
      });
    };
    data.mecanicos = rebalancearListaMecanicos(data.mecanicos);
    data.mecanicosDisponibles = rebalancearListaMecanicos(data.mecanicosDisponibles);
    data.balanceMecanicosVersion = BALANCE_MECANICOS_VERSION;
  }
  return data;
}

function numeroSeguroGuardado(valor, fallback) {
  var numero = Number(valor);
  return Number.isFinite(numero) ? numero : fallback;
}

function inferirTiempoBaseReparacionGuardada(rep) {
  if (!rep || typeof rep !== "object") return 6;

  var casoBase =
    rep.casoRef && typeof rep.casoRef === "object"
      ? rep.casoRef
      : rep.cliente && typeof rep.cliente === "object"
        ? rep.cliente
        : null;
  var mecanicoActivo = Array.isArray(mecanicos)
    ? mecanicos.find(function (mx) {
        return mx && mx.nombre === rep.mecanicoNombre;
      }) || null
    : null;
  var candidatos = [
    rep.tiempoTotal,
    rep.tiempoRestante,
    rep.tiempoPendiente,
    rep.tiempoEstimado,
    casoBase && casoBase.tiempo,
    mecanicoActivo && mecanicoActivo.enfriamientoTurnos,
  ];

  for (var i = 0; i < candidatos.length; i++) {
    var valor = numeroSeguroGuardado(candidatos[i], 0);
    if (valor > 0) return Math.max(1, Math.round(valor));
  }

  if (rep.tipoTrabajo === "diagnostico") return 4;
  if (rep.tipoTrabajo === "pedir_piezas") return 1;
  return 6;
}

function normalizarReparacionActiva(rep) {
  if (!rep || typeof rep !== "object") return null;

  var casoBase =
    rep.casoRef && typeof rep.casoRef === "object"
      ? rep.casoRef
      : rep.cliente && typeof rep.cliente === "object"
        ? rep.cliente
        : null;

  if (casoBase && typeof asegurarIdCasoCliente === "function") {
    asegurarIdCasoCliente(casoBase);
  }
  if (typeof asegurarIdCasoCliente === "function") {
    asegurarIdCasoCliente(rep);
  }

  rep.idCaso = String(rep.idCaso || (casoBase && casoBase.idCaso) || "").trim();
  if (!rep.personaNombre && casoBase && casoBase.personaNombre) {
    rep.personaNombre = casoBase.personaNombre;
  }
  if (!rep.vehiculo && casoBase && casoBase.vehiculo) {
    rep.vehiculo = casoBase.vehiculo;
  }
  if (!rep.clienteNombre) {
    rep.clienteNombre =
      (casoBase && (casoBase.nombre || casoBase.clienteNombre || casoBase.personaNombre)) ||
      rep.personaNombre ||
      "Cliente";
  }
  if (!rep.casoRef && casoBase) {
    rep.casoRef = casoBase;
  }

  var tipoNormalizado = String(rep.tipoTrabajo || "").trim().toLowerCase();
  if (tipoNormalizado === "pedido_piezas") tipoNormalizado = "pedir_piezas";
  if (
    tipoNormalizado !== "diagnostico" &&
    tipoNormalizado !== "diagnostico_completado" &&
    tipoNormalizado !== "pedir_piezas" &&
    tipoNormalizado !== "reparacion"
  ) {
    tipoNormalizado = rep.resultadoDiagnostico
      ? "diagnostico"
      : rep.pedidoPendienteDelivery || rep.pausadaPorPieza
        ? "pedir_piezas"
        : "reparacion";
  }
  // Fase terminal del diagnóstico: no debe volver a convertirse en
  // "diagnostico" cada vez que se actualiza la interfaz.
  rep.tipoTrabajo = tipoNormalizado;

  rep.listoParaCobro = !!rep.listoParaCobro;
  rep.pausadaPorPieza = !!rep.pausadaPorPieza;
  rep.diagnosticoCompletado = !!rep.diagnosticoCompletado;
  rep.requierePiezaContinuacion = !!rep.requierePiezaContinuacion;
  rep.piezaContinuacionSolicitada = !!rep.piezaContinuacionSolicitada;
  rep.piezaContinuacionInstalada = !!rep.piezaContinuacionInstalada;
  rep.pedidoPendienteDelivery =
    rep.pedidoPendienteDelivery && typeof rep.pedidoPendienteDelivery === "object"
      ? rep.pedidoPendienteDelivery
      : null;

  var tiempoTotal = numeroSeguroGuardado(rep.tiempoTotal, 0);
  if (!(tiempoTotal > 0)) {
    tiempoTotal = inferirTiempoBaseReparacionGuardada(rep);
  }

  var tiempoRestante = numeroSeguroGuardado(rep.tiempoRestante, NaN);
  if (!Number.isFinite(tiempoRestante)) {
    tiempoRestante = numeroSeguroGuardado(rep.tiempoPendiente, NaN);
  }
  if (!Number.isFinite(tiempoRestante)) {
    tiempoRestante = rep.listoParaCobro ? 0 : tiempoTotal;
  }
  if (rep.listoParaCobro) {
    tiempoRestante = 0;
  }

  tiempoRestante = Math.max(0, Math.round(tiempoRestante));
  tiempoTotal = Math.max(1, Math.round(Math.max(tiempoTotal, tiempoRestante, 1)));

  rep.tiempoTotal = tiempoTotal;
  rep.tiempoRestante = rep.listoParaCobro ? 0 : tiempoRestante;
  sincronizarTiempoReparacionReal(rep);
  return rep;
}

function inferirEtaDeliveryGuardada(entrega) {
  if (!entrega || typeof entrega !== "object") return 3;

  var candidatos = [
    entrega.etaTotal,
    entrega.etaRestante,
    entrega.tiempoTotal,
    entrega.tiempoRestante,
  ];
  for (var i = 0; i < candidatos.length; i++) {
    var valor = numeroSeguroGuardado(candidatos[i], 0);
    if (valor > 0) return Math.max(1, Math.round(valor));
  }

  var piezas = Array.isArray(entrega.piezasCompradas)
    ? Math.max(1, entrega.piezasCompradas.length)
    : 1;
  var slot = Math.max(0, Math.round(numeroSeguroGuardado(entrega.slotDelivery, 0)));
  if (typeof calcularEtaDelivery === "function") {
    var etaCalculada = numeroSeguroGuardado(calcularEtaDelivery(piezas, slot), 0);
    if (etaCalculada > 0) return Math.max(1, Math.round(etaCalculada));
  }
  return Math.max(2, piezas + slot + 1);
}

function normalizarEntregaPiezaActiva(entrega) {
  if (!entrega || typeof entrega !== "object") return null;

  entrega.idCaso = String(entrega.idCaso || "").trim();
  var etaTotal = numeroSeguroGuardado(entrega.etaTotal, 0);
  if (!(etaTotal > 0)) {
    etaTotal = inferirEtaDeliveryGuardada(entrega);
  }

  var etaRestante = numeroSeguroGuardado(entrega.etaRestante, NaN);
  if (!Number.isFinite(etaRestante)) {
    etaRestante = etaTotal;
  }

  etaRestante = Math.max(0, Math.round(etaRestante));
  etaTotal = Math.max(1, Math.round(Math.max(etaTotal, etaRestante, 1)));

  entrega.etaTotal = etaTotal;
  entrega.etaRestante = etaRestante;
  sincronizarTiempoDeliveryReal(entrega);
  return entrega;
}

function crearSnapshotCasoGuardado(caso) {
  if (!caso || typeof caso !== "object") return null;

  var snapshot = {
    idCaso: caso.idCaso || "",
    nombre: caso.nombre,
    clienteNombre: caso.clienteNombre,
    personaNombre: caso.personaNombre,
    vehiculo: caso.vehiculo,
    fotoApariencia: caso.fotoApariencia,
    pago: caso.pago,
    dificultad: caso.dificultad,
    especialidadIdeal: caso.especialidadIdeal,
    miniHistoriaTipo: caso.miniHistoriaTipo,
    miniHistoriaTexto: caso.miniHistoriaTexto,
    personalidad: caso.personalidad,
    tiempo: caso.tiempo,
    complicaciones: Array.isArray(caso.complicaciones)
      ? caso.complicaciones.slice()
      : [],
    fallosPrincipales: Array.isArray(caso.fallosPrincipales)
      ? caso.fallosPrincipales.slice()
      : [],
    fallosAdicionalesDetectables: Array.isArray(caso.fallosAdicionalesDetectables)
      ? caso.fallosAdicionalesDetectables.slice()
      : [],
    diagnosticoOpciones: Array.isArray(caso.diagnosticoOpciones)
      ? caso.diagnosticoOpciones.slice()
      : [],
    diagnosticoSeleccionado: caso.diagnosticoSeleccionado || "",
    diagnosticosDetectados: Array.isArray(caso.diagnosticosDetectados)
      ? caso.diagnosticosDetectados.slice()
      : [],
    diagnosticoDetectado: caso.diagnosticoDetectado || "",
    diagnosticoCorrecto: !!caso.diagnosticoCorrecto,
    diagnosticoNivel: caso.diagnosticoNivel || "fallo",
    diagnosticado: !!caso.diagnosticado,
    aprobadoCliente: !!(caso.aprobadoCliente || caso.aprobacionCliente),
    aprobacionCliente: !!caso.aprobacionCliente,
    negociado: !!caso.negociado,
    piezaInstalada: caso.piezaInstalada || null,
    piezasRequeridasMecanico: Array.isArray(caso.piezasRequeridasMecanico)
      ? caso.piezasRequeridasMecanico.slice()
      : [],
    piezasInstaladasMecanico: Array.isArray(caso.piezasInstaladasMecanico)
      ? caso.piezasInstaladasMecanico.slice()
      : [],
    mecanicoPendienteIdx:
      typeof caso.mecanicoPendienteIdx === "number"
        ? caso.mecanicoPendienteIdx
        : null,
    esVIP: !!caso.esVIP,
    etapaVIP: caso.etapaVIP || 1,
    inspeccion:
      caso.inspeccion && typeof caso.inspeccion === "object"
        ? { ...caso.inspeccion }
        : null,
    contradiccionActiva: !!caso.contradiccionActiva,
    contradiccionDetectada: !!caso.contradiccionDetectada,
    bonusHablar: caso.bonusHablar || 0,
    ofDxSeleccionEnfoques: Array.isArray(caso.ofDxSeleccionEnfoques)
      ? caso.ofDxSeleccionEnfoques.slice()
      : [],
    ofDxAnalisisHecho: !!caso.ofDxAnalisisHecho,
    ofDxAciertos: caso.ofDxAciertos || 0,
    ofDxRuido: caso.ofDxRuido || 0,
    ofDxConfianzaPct: caso.ofDxConfianzaPct || 0,
    ofDxConfianzaNivel: caso.ofDxConfianzaNivel || "baja",
    ofDxModoResolucion: caso.ofDxModoResolucion || "segura",
    ofDxProbablesCausas: Array.isArray(caso.ofDxProbablesCausas)
      ? caso.ofDxProbablesCausas.slice()
      : [],
    rechazosNegociacion: caso.rechazosNegociacion || 0,
    motivoRechazoWhatsApp: caso.motivoRechazoWhatsApp || "",
    actualizadoEn:
      typeof caso.actualizadoEn === "number" ? caso.actualizadoEn : Date.now(),
  };

  if (typeof asegurarIdCasoCliente === "function") {
    asegurarIdCasoCliente(snapshot);
  }
  return snapshot;
}

function serializarReparacionActivaGuardado(rep) {
  if (!rep || typeof rep !== "object") return null;
  rep = normalizarReparacionActiva(rep);
  if (!rep || typeof rep !== "object") return null;

  var copia = { ...rep };
  var casoBase =
    rep.casoRef && typeof rep.casoRef === "object"
      ? rep.casoRef
      : rep.cliente && typeof rep.cliente === "object"
        ? rep.cliente
        : null;

  copia.cliente = crearSnapshotCasoGuardado(casoBase);
  delete copia.casoRef;

  if (
    copia.resultadoDiagnostico &&
    typeof copia.resultadoDiagnostico === "object"
  ) {
    copia.resultadoDiagnostico = {
      ...copia.resultadoDiagnostico,
      diagnosticosDetectados: Array.isArray(
        copia.resultadoDiagnostico.diagnosticosDetectados,
      )
        ? copia.resultadoDiagnostico.diagnosticosDetectados.slice()
        : [],
    };
  }

  if (
    copia.pedidoPendienteDelivery &&
    typeof copia.pedidoPendienteDelivery === "object"
  ) {
    copia.pedidoPendienteDelivery = {
      ...copia.pedidoPendienteDelivery,
      piezas: Array.isArray(copia.pedidoPendienteDelivery.piezas)
        ? copia.pedidoPendienteDelivery.piezas.map(function (pieza) {
            return pieza && typeof pieza === "object" ? { ...pieza } : pieza;
          })
        : [],
    };
  }

  if (Array.isArray(copia.piezasContinuacionRequeridas)) {
    copia.piezasContinuacionRequeridas = copia.piezasContinuacionRequeridas.map(
      function (pieza) {
        return pieza && typeof pieza === "object" ? { ...pieza } : pieza;
      },
    );
  }
  if (Array.isArray(copia.piezasContinuacionEntregadas)) {
    copia.piezasContinuacionEntregadas = copia.piezasContinuacionEntregadas.map(
      function (pieza) {
        return pieza && typeof pieza === "object" ? { ...pieza } : pieza;
      },
    );
  }

  return copia;
}

function obtenerEstadoGuardado() {
  // Parche de robustez: asegura que la variable global existe
  if (typeof clandestinoTrabajosHoy === "undefined") window.clandestinoTrabajosHoy = 0;
  if (typeof musicaFondoActiva === "undefined") window.musicaFondoActiva = true;
  var estadoCentral = window.TallerApp && typeof window.TallerApp.getState === "function"
    ? window.TallerApp.getState()
    : {};
  return Object.assign({}, estadoCentral, {
    dia,
    saldo,
    deuda,
    reputacion,
    cajaB,
    exRelacion,
    hambre,
    sueno,
    estres,
    focoDiaMax,
    focoDiaActual,
    clientesHoy,
    clienteActual,
    tiempoCliente,
    turnoSegundos,
    turnoActual,
    ultimoTickRealMs,
    resumenCasos:
      resumenCasos && typeof resumenCasos === "object" ? resumenCasos : null,
    logrosDesbloqueados:
      typeof logrosDesbloqueados !== "undefined" && Array.isArray(logrosDesbloqueados)
        ? logrosDesbloqueados.slice()
        : [],
    hitosAlcanzados:
      typeof hitosAlcanzados !== "undefined" && Array.isArray(hitosAlcanzados)
        ? hitosAlcanzados.slice()
        : [],
    mecanicos,
    mecanicosDisponibles,
    espaciosReparacionMax,
    reparacionesActivas: Array.isArray(reparacionesActivas)
      ? reparacionesActivas
          .map(function (rep) {
            return serializarReparacionActivaGuardado(rep);
          })
          .filter(function (rep) {
            return !!rep;
          })
      : [],
    repartidoresMax,
    repartidoresStats,
    entregasPiezasActivas,
    clientesEnEspera,
    casosPendientesDiagnostico,
    casosAtendidos,
    casosFirmasUsadas: Array.isArray(casosFirmasUsadas) ? casosFirmasUsadas.slice() : [],
    experienciaVehiculoDx,
    historialClientes,
    inversionesJugador: window.inversionesJugador || {},
    casosDesdeUltimoRetornoInversion:
      window.casosDesdeUltimoRetornoInversion || 0,
    historial: window.historial || [],
    ayudanteContratado,
    bonoAyudanteTiempo,
    eventoDiario,
    modificadorHabilidadDiario,
    multiplicadorPagoDiario,
    eventoPeleaHoy,
    estrategiaCliente,
    rachaExitos,
    rachaDiagnosticoPerfecto,
    bonoFocoSiguienteCaso,
    impactoHistoriaDiaAplicado,
    modPeleaImpagoEmpleadosDia,
    modFalloImpagoEmpleadosDia,
    decisionesHistoria,
    misionDia,
    resumenDia,
    clandestinoTrabajosHoy,
    clandestinoUltimoTurno,
    cajaBCuposDisponibles,
    cajaBUltimoHitoCasos,
    cajaBCalor,
    cajaBUltimoControlInspectorCasos,
    tramaEstado,
    historiaPrincipalIndice,
    arcoNarrativoActual,
    arcosCumplidos,
    narrativaUltimoCasoProcesado,
    ultimoMecanicoAsignado,
    eventosTurnoVistos,
    eventoNarrativoActivo,
    eventosTurnoHoy,
    ultimoEventoTurno,
    ultimoEventoCasos,
    bancoCasosSinPago,
    bancoMorasAplicadas,
    bancoCreditoUsado,
    cierrePagoResuelto,
    cierreCostosPendientes,
    cierreFacturasPendientes,
    penalizacionesDiaSiguiente,
    malvaviscoAlimentadoHoy,
    malvaviscoAcariciadoHoy,
    malvaviscoAfinidad,
    malvaviscoCasosCerrados,
    malvaviscoUltimoEventoCasos,
    enfoqueDiagnostico,
    mejorasTacticas,
    mejoras,
    tallerNivel,
    estadoCards,
    tabMovilActiva,
    moralEquipo,
    nivelJugador,
    progresoNivel,
    progresoNivelMeta,
    ahorroAcumulado,
    estadoProyectoMuscle:
      window.estadoProyectoMuscle && typeof window.estadoProyectoMuscle === "object"
        ? { ...window.estadoProyectoMuscle }
        : { nivel: 1 },
    balanceMecanicosVersion: 2,
    inventarioPiezas,
    descuentoPacksComprados: typeof _descuentoPacksComprados !== "undefined" ? _descuentoPacksComprados.slice() : [],
    competenciaBarrioEstado,
    telefonoMensajes,
    telefonoContactos,
    telefonoContactoActivo,
    telefonoFiltroActivo,
    telefonoBusquedaTexto,
    telefonoVista,
    telefonoOpcionesEstado,
    telefonoNarrativaMarcadores,
    telefonoNarrativaPendientes,
    estadoPantallas: {
      historia: document.getElementById("pantalla-historia")
        ? !document.getElementById("pantalla-historia").classList.contains("hidden") : false,
      taller: document.getElementById("pantalla-taller")
        ? !document.getElementById("pantalla-taller").classList.contains("hidden") : true,
      cierre: document.getElementById("pantalla-cierre")
        ? !document.getElementById("pantalla-cierre").classList.contains("hidden") : false,
    },
  });
}

function aplicarEstadoGuardado(data) {
  ({
    dia,
    saldo,
    deuda,
    reputacion,
    cajaB,
    exRelacion,
    hambre,
    sueno,
    estres,
    focoDiaMax,
    focoDiaActual,
    clientesHoy,
    clienteActual,
    tiempoCliente,
    turnoSegundos,
    turnoActual,
    ultimoTickRealMs,
    resumenCasos,
    logrosDesbloqueados,
    hitosAlcanzados,
    mecanicos,
    mecanicosDisponibles,
    espaciosReparacionMax,
    reparacionesActivas,
    repartidoresMax,
    repartidoresStats,
    entregasPiezasActivas,
    clientesEnEspera,
    casosPendientesDiagnostico,
    casosAtendidos,
    casosFirmasUsadas = [],
    experienciaVehiculoDx = {},
    historialClientes,
    inversionesJugador = {},
    casosDesdeUltimoRetornoInversion = 0,
    historial = [],
    ayudanteContratado,
    bonoAyudanteTiempo,
    eventoDiario,
    modificadorHabilidadDiario,
    multiplicadorPagoDiario,
    eventoPeleaHoy,
    estrategiaCliente,
    rachaExitos,
    rachaDiagnosticoPerfecto,
    bonoFocoSiguienteCaso,
    impactoHistoriaDiaAplicado,
    modPeleaImpagoEmpleadosDia,
    modFalloImpagoEmpleadosDia,
    decisionesHistoria,
    misionDia,
    resumenDia,
    clandestinoTrabajosHoy,
    clandestinoUltimoTurno,
    cajaBCuposDisponibles,
    cajaBUltimoHitoCasos,
    cajaBCalor,
    cajaBUltimoControlInspectorCasos,
    tramaEstado,
    historiaPrincipalIndice,
    arcoNarrativoActual,
    arcosCumplidos,
    narrativaUltimoCasoProcesado,
    ultimoMecanicoAsignado,
    eventosTurnoVistos,
    eventoNarrativoActivo,
    eventosTurnoHoy,
    ultimoEventoTurno,
    ultimoEventoCasos,
    bancoCasosSinPago,
    bancoMorasAplicadas,
    bancoCreditoUsado,
    cierrePagoResuelto,
    cierreCostosPendientes,
    cierreFacturasPendientes,
    penalizacionesDiaSiguiente,
    malvaviscoAlimentadoHoy,
    malvaviscoAcariciadoHoy,
    malvaviscoAfinidad,
    malvaviscoCasosCerrados,
    malvaviscoUltimoEventoCasos,
    enfoqueDiagnostico,
    mejorasTacticas,
    mejoras,
    tallerNivel,
    estadoCards,
    tabMovilActiva,
    moralEquipo,
    nivelJugador,
    progresoNivel,
    progresoNivelMeta,
    ahorroAcumulado = 0,
    recompensasEntregadas = {},
    estadoProyectoMuscle = { nivel: 1 },
    inventarioPiezas = [],
    competenciaBarrioEstado = null,
    telefonoMensajes = {},
    telefonoContactos = [],
    telefonoContactoActivo = null,
    telefonoFiltroActivo = "personal",
    telefonoBusquedaTexto = "",
    telefonoVista = "lista",
    telefonoOpcionesEstado = {},
    telefonoNarrativaMarcadores = {},
    telefonoNarrativaPendientes = [],
  } = data);

  if (window.TallerApp && typeof window.TallerApp.setState === "function") {
    window.TallerApp.setState({
      recompensasEntregadas: recompensasEntregadas && typeof recompensasEntregadas === "object" && !Array.isArray(recompensasEntregadas)
        ? recompensasEntregadas
        : {},
      perfilNarrativo: data.perfilNarrativo && typeof data.perfilNarrativo === "object"
        ? data.perfilNarrativo
        : undefined,
      memoriaNarrativa: data.memoriaNarrativa && typeof data.memoriaNarrativa === "object"
        ? data.memoriaNarrativa
        : undefined,
      eventosNarrativos: Array.isArray(data.eventosNarrativos)
        ? data.eventosNarrativos
        : [],
      misionNarrativa: data.misionNarrativa && typeof data.misionNarrativa === "object"
        ? data.misionNarrativa
        : null,
    });
  }

  // Restaurar inversionesJugador, casosDesdeUltimoRetornoInversion, historial
  window.inversionesJugador =
    inversionesJugador && typeof inversionesJugador === "object"
      ? inversionesJugador
      : {};
  window.casosDesdeUltimoRetornoInversion =
    typeof casosDesdeUltimoRetornoInversion === "number"
      ? casosDesdeUltimoRetornoInversion
      : 0;
  window.historial = Array.isArray(historial) ? historial : [];

  if (typeof saldo !== "number" || isNaN(saldo))
    saldo = ECONOMY_DATA.saldoInicial || 2000;
  if (typeof deuda !== "number" || isNaN(deuda))
    deuda = ECONOMY_DATA.deudaInicial || 100000;
  if (typeof hambre !== "number" || isNaN(hambre)) hambre = 20;
  if (typeof sueno !== "number" || isNaN(sueno)) sueno = 20;
  if (typeof estres !== "number" || isNaN(estres)) estres = 10;
  hambre = Math.max(0, Math.min(100, Math.round(hambre)));
  sueno = Math.max(0, Math.min(100, Math.round(sueno)));
  estres = Math.max(0, Math.min(100, Math.round(estres)));
  if (typeof exRelacion !== "number" || isNaN(exRelacion)) exRelacion = 50;
  exRelacion = Math.max(0, Math.min(100, Math.round(exRelacion)));
  if (typeof focoDiaMax !== "number") focoDiaMax = ECONOMY_DATA.focoBase || 10;
  if (typeof focoDiaActual !== "number") focoDiaActual = focoDiaMax;
  if (
    typeof ultimoTickRealMs !== "number" ||
    !isFinite(ultimoTickRealMs) ||
    ultimoTickRealMs <= 0
  ) {
    ultimoTickRealMs = Date.now();
  }
  if (!resumenCasos || typeof resumenCasos !== "object") {
    resumenCasos = typeof crearResumenCasosInicial === "function"
      ? crearResumenCasosInicial()
      : { totalCasosJugados: 0, rachaCasosExitosos: 0 };
  }
  if (!Array.isArray(logrosDesbloqueados)) logrosDesbloqueados = [];
  if (!Array.isArray(hitosAlcanzados)) {
    var totalCasosMigrado = Math.max(
      0,
      Math.round(Number(resumenCasos.totalCasosJugados || 0)),
    );
    hitosAlcanzados = [5, 10, 20, 50].filter(function (umbral) {
      return totalCasosMigrado >= umbral;
    });
  }
  if (typeof cajaB !== "number") cajaB = 0;
  if (!tramaEstado || typeof tramaEstado !== "object") {
    tramaEstado = window.TallerApp.helpers.crearTramaEstadoInicial();
  }
  if (typeof tramaEstado.exUltimoEventoCasos !== "number")
    tramaEstado.exUltimoEventoCasos = 0;
  if (typeof tramaEstado.exEventosAtendidos !== "number")
    tramaEstado.exEventosAtendidos = 0;
  if (typeof tramaEstado.exEventosIgnorados !== "number")
    tramaEstado.exEventosIgnorados = 0;
  if (typeof tramaEstado.exPresionLegal !== "number")
    tramaEstado.exPresionLegal = 0;
  if (!Array.isArray(tramaEstado.exPruebasDetalle)) tramaEstado.exPruebasDetalle = [];
  if (typeof tramaEstado.exPruebas !== "number") tramaEstado.exPruebas = tramaEstado.exPruebasDetalle.length;
  if (tramaEstado.exPruebasDetalle.length < tramaEstado.exPruebas) {
    while (tramaEstado.exPruebasDetalle.length < tramaEstado.exPruebas) {
      tramaEstado.exPruebasDetalle.push({ id: "prueba-legado-" + tramaEstado.exPruebasDetalle.length, origen: "Archivo anterior", caso: null });
    }
  }
  tramaEstado.exPruebas = tramaEstado.exPruebasDetalle.length;
  if (typeof tramaEstado.exReclamosRefutados !== "number") tramaEstado.exReclamosRefutados = 0;
  if (typeof tramaEstado.exArcoResuelto !== "boolean") tramaEstado.exArcoResuelto = false;
  if (
    !tramaEstado.exEventoPendiente ||
    typeof tramaEstado.exEventoPendiente !== "object"
  )
    tramaEstado.exEventoPendiente = null;
  if (typeof tramaEstado.eventoNarrativoUltimoCaso !== "number")
    tramaEstado.eventoNarrativoUltimoCaso = 0;
  if (typeof tramaEstado.solicitudMecanicoUltimoCaso !== "number")
    tramaEstado.solicitudMecanicoUltimoCaso = 0;
  if (typeof malvaviscoCasosCerrados !== "number") malvaviscoCasosCerrados = 0;
  if (typeof malvaviscoUltimoEventoCasos !== "number")
    malvaviscoUltimoEventoCasos = 0;
  // Migracion conservadora: partidas muy tempranas creadas con deuda inicial antigua (RD$5000)
  // se ajustan al nuevo baseline narrativo de RD$100000.
  var casosHistoricos =
    (tramaEstado.casosCriticosResueltos || 0) +
    (tramaEstado.casosParciales || 0);
  if (
    typeof deuda === "number" &&
    deuda <= 10000 &&
    casosHistoricos <= 1 &&
    (dia || 1) <= 1
  ) {
    deuda = Math.max(100000, Math.round(ECONOMY_DATA.deudaInicial || 100000));
  }
  var decisionesBase = window.TallerApp.helpers.crearDecisionesHistoriaInicial();
  if (!decisionesHistoria || typeof decisionesHistoria !== "object") {
    decisionesHistoria = decisionesBase;
  } else {
    // Migra partidas antiguas que usaban un Array con propiedades no
    // serializables y rellena cualquier contador agregado en versiones nuevas.
    decisionesHistoria = Object.assign({}, decisionesBase, decisionesHistoria);
  }
  if (!mejorasTacticas || typeof mejorasTacticas !== "object") {
    mejorasTacticas = { ...(ECONOMY_DATA.mejorasTacticasIniciales || {}) };
  }
  if (!mejoras || typeof mejoras !== "object") {
    mejoras = { ...(ECONOMY_DATA.mejorasIniciales || {}) };
  }
  if (!estadoCards || typeof estadoCards !== "object") {
    estadoCards = {
      ...(ECONOMY_DATA.estadoCardsInicial || {
        evento: false,
        mision: false,
        espacio: false,
      }),
    };
  }
  if (!misionDia || typeof misionDia !== "object") {
    if (
      window.TallerApp &&
      window.TallerApp.helpers &&
      typeof window.TallerApp.helpers.crearMisionDiaInicial === "function"
    ) {
      misionDia = window.TallerApp.helpers.crearMisionDiaInicial();
    } else if (
      window.TallerApp &&
      window.TallerApp.helpers &&
      typeof window.TallerApp.helpers.crearMisionesInicial === "function"
    ) {
      misionDia = window.TallerApp.helpers.crearMisionesInicial();
    } else {
      misionDia = { activas: [], completadas: [], misionesPorHito: [] };
    }
  }
  if (!resumenDia || typeof resumenDia !== "object") {
    if (
      window.TallerApp &&
      window.TallerApp.helpers &&
      typeof window.TallerApp.helpers.crearResumenOperativoActualInicial ===
        "function"
    ) {
      resumenDia = window.TallerApp.helpers.crearResumenOperativoActualInicial();
    } else if (
      window.TallerApp &&
      window.TallerApp.helpers &&
      typeof window.TallerApp.helpers.crearResumenCasosInicial === "function"
    ) {
      resumenDia = window.TallerApp.helpers.crearResumenCasosInicial();
    } else {
      resumenDia = {
        ingresos: 0,
        perdidas: 0,
        gastosDetalle: {},
        ingresosDetalle: {},
        reparacionesExitosas: 0,
        reparacionesParciales: 0,
        reparacionesFallidas: 0,
        clientesPerdidos: 0,
        negociacionesExitosas: 0,
        negociacionesFallidas: 0,
        diagnosticosCorrectos: 0,
        diagnosticosParciales: 0,
        diagnosticosFallidos: 0,
        prestamosDados: 0,
        peleas: 0,
        ramificaciones: [],
      };
    }
  }
  if (
    window.TallerApp &&
    window.TallerApp.helpers &&
    typeof window.TallerApp.helpers.asegurarResumenDiaContable === "function"
  ) {
    window.TallerApp.helpers.asegurarResumenDiaContable();
  }
  if (typeof cierrePagoResuelto !== "boolean") cierrePagoResuelto = true;
  if (typeof cierreCostosPendientes !== "number") cierreCostosPendientes = 0;
  if (!cierreFacturasPendientes || typeof cierreFacturasPendientes !== "object")
    cierreFacturasPendientes = null;
  if (
    !penalizacionesDiaSiguiente ||
    typeof penalizacionesDiaSiguiente !== "object"
  )
    penalizacionesDiaSiguiente = null;
  if (typeof malvaviscoAlimentadoHoy !== "boolean")
    malvaviscoAlimentadoHoy = false;
  if (typeof malvaviscoAcariciadoHoy !== "boolean")
    malvaviscoAcariciadoHoy = false;
  if (typeof malvaviscoAfinidad !== "number") malvaviscoAfinidad = 0;
  if (typeof enfoqueDiagnostico !== "string") enfoqueDiagnostico = "general";
  if (tabMovilActiva !== "taller" && tabMovilActiva !== "gestion")
    tabMovilActiva = "taller";
  if (typeof moralEquipo !== "number")
    moralEquipo = ECONOMY_DATA.moralEquipoInicial || 50;
  if (typeof rachaDiagnosticoPerfecto !== "number")
    rachaDiagnosticoPerfecto = 0;
  if (typeof bonoFocoSiguienteCaso !== "number") bonoFocoSiguienteCaso = 0;
  if (typeof impactoHistoriaDiaAplicado !== "number")
    impactoHistoriaDiaAplicado = 0;
  if (typeof modPeleaImpagoEmpleadosDia !== "number")
    modPeleaImpagoEmpleadosDia = 0;
  if (typeof modFalloImpagoEmpleadosDia !== "number")
    modFalloImpagoEmpleadosDia = 0;
  if (typeof clandestinoTrabajosHoy !== "number") clandestinoTrabajosHoy = 0;
  if (typeof clandestinoUltimoTurno !== "number") clandestinoUltimoTurno = -999;
  if (typeof cajaBCuposDisponibles !== "number") cajaBCuposDisponibles = 1;
  if (typeof cajaBUltimoHitoCasos !== "number") cajaBUltimoHitoCasos = 0;
  if (typeof cajaBCalor !== "number") cajaBCalor = 0;
  if (typeof cajaBUltimoControlInspectorCasos !== "number")
    cajaBUltimoControlInspectorCasos = 0;
  cajaBCuposDisponibles = Math.max(
    0,
    Math.min(3, Math.round(cajaBCuposDisponibles)),
  );
  cajaBUltimoHitoCasos = Math.max(0, Math.round(cajaBUltimoHitoCasos));
  cajaBCalor = Math.max(0, Math.min(100, Math.round(cajaBCalor)));
  cajaBUltimoControlInspectorCasos = Math.max(
    0,
    Math.round(cajaBUltimoControlInspectorCasos),
  );
  if (typeof mensajeriaMecanicosUltimoCaso !== "number")
    mensajeriaMecanicosUltimoCaso = 0;
  if (typeof devolucionMecanicosUltimoCaso !== "number")
    devolucionMecanicosUltimoCaso = 0;
  if (typeof narrativaUltimoCasoProcesado !== "number")
    narrativaUltimoCasoProcesado = 0;
  if (typeof arcoNarrativoActual !== "string") arcoNarrativoActual = null;
  if (!Array.isArray(arcosCumplidos)) arcosCumplidos = [];
  arcosCumplidos = arcosCumplidos
    .map(function(id) { return String(id || "").trim(); })
    .filter(function(id, index, lista) { return !!id && lista.indexOf(id) === index; });
  if (typeof disparadoresCasoUltimoHito !== "number")
    disparadoresCasoUltimoHito = 0;
  if (typeof ultimoEventoCasos !== "number") ultimoEventoCasos = 0;
  if (typeof bancoCasosSinPago !== "number") bancoCasosSinPago = 0;
  if (typeof bancoMorasAplicadas !== "number") bancoMorasAplicadas = 0;
  if (typeof bancoCreditoUsado !== "number" || bancoCreditoUsado < 0)
    bancoCreditoUsado = 0;
  if (typeof nivelJugador !== "number" || nivelJugador < 1) nivelJugador = 1;
  if (typeof progresoNivelMeta !== "number" || progresoNivelMeta <= 0)
    progresoNivelMeta = calcularMetaNivel(nivelJugador);
  if (typeof progresoNivel !== "number" || progresoNivel < 0) progresoNivel = 0;
  if (typeof ahorroAcumulado !== "number" || ahorroAcumulado < 0)
    ahorroAcumulado = 0;
  if (!estadoProyectoMuscle || typeof estadoProyectoMuscle !== "object") {
    estadoProyectoMuscle = { nivel: 1 };
  }
  if (typeof estadoProyectoMuscle.nivel !== "number" || estadoProyectoMuscle.nivel < 1) {
    estadoProyectoMuscle.nivel = 1;
  }
  window.estadoProyectoMuscle = { ...estadoProyectoMuscle };
  if (!competenciaBarrioEstado || typeof competenciaBarrioEstado !== "object")
    competenciaBarrioEstado = null;
  if (!telefonoMensajes || typeof telefonoMensajes !== "object")
    telefonoMensajes = {};
  if (!Array.isArray(telefonoContactos)) telefonoContactos = [];
  if (typeof telefonoContactoActivo !== "string") telefonoContactoActivo = null;
  if (typeof telefonoFiltroActivo !== "string") telefonoFiltroActivo = "personal";
  if (typeof telefonoBusquedaTexto !== "string") telefonoBusquedaTexto = "";
  if (telefonoVista !== "chat" && telefonoVista !== "lista") telefonoVista = "lista";
  if (!telefonoOpcionesEstado || typeof telefonoOpcionesEstado !== "object")
    telefonoOpcionesEstado = {};
  if (
    !telefonoNarrativaMarcadores ||
    typeof telefonoNarrativaMarcadores !== "object"
  ) {
    telefonoNarrativaMarcadores = {};
  }
  if (!Array.isArray(telefonoNarrativaPendientes)) {
    telefonoNarrativaPendientes = [];
  }
  telefonoNarrativaPendientes = telefonoNarrativaPendientes.filter(function (p) {
    return !!(p && typeof p === "object" && !p.resuelta && p.contactoId);
  });
  if (typeof repartidoresMax !== "number" || repartidoresMax < 1)
    repartidoresMax = 1;
  if (typeof espaciosReparacionMax !== "number" || espaciosReparacionMax < 1) {
    espaciosReparacionMax =
      (ECONOMY_DATA && ECONOMY_DATA.espaciosReparacionInicial) || 2;
  }
  if (!Array.isArray(entregasPiezasActivas)) entregasPiezasActivas = [];
  if (!Array.isArray(inventarioPiezas)) inventarioPiezas = [];
  if (typeof _descuentoPacksComprados !== "undefined") {
    _descuentoPacksComprados = Array.isArray(data.descuentoPacksComprados)
      ? data.descuentoPacksComprados.slice()
      : [];
  }
  if (!Array.isArray(casosPendientesDiagnostico))
    casosPendientesDiagnostico = [];
  if (!Array.isArray(casosAtendidos)) casosAtendidos = [];
  // Normaliza el expediente al restaurar partidas antiguas o inconsistentes.
  // Un caso solo puede estar en una bandeja operativa a la vez.
  var idsNoDisponibles = new Set();
  (reparacionesActivas || []).forEach(function (trabajo) {
    if (trabajo && trabajo.idCaso) idsNoDisponibles.add(String(trabajo.idCaso));
  });
  if (clienteActual && clienteActual.idCaso && idsNoDisponibles.has(String(clienteActual.idCaso)) &&
      (reparacionesActivas || []).some(function (trabajo) {
        return trabajo && String(trabajo.idCaso || "") === String(clienteActual.idCaso);
      })) {
    clienteActual = null;
  }
  if (clienteActual && clienteActual.idCaso)
    idsNoDisponibles.add(String(clienteActual.idCaso));
  clientesEnEspera = (clientesEnEspera || []).filter(function (caso) {
    return caso && !idsNoDisponibles.has(String(caso.idCaso || ""));
  });
  casosPendientesDiagnostico = (casosPendientesDiagnostico || []).filter(function (caso) {
    return caso && !idsNoDisponibles.has(String(caso.idCaso || ""));
  });
  var idsCola = new Set();
  clientesEnEspera = clientesEnEspera.filter(function (caso) {
    var id = String(caso.idCaso || "");
    if (!id || idsCola.has(id)) return false;
    idsCola.add(id);
    return true;
  });
  casosPendientesDiagnostico = casosPendientesDiagnostico.filter(function (caso) {
    var id = String(caso.idCaso || "");
    if (!id || idsCola.has(id)) return false;
    idsCola.add(id);
    return true;
  });
  if (!Array.isArray(casosFirmasUsadas)) casosFirmasUsadas = [];
  [clienteActual].concat(clientesEnEspera || [], casosPendientesDiagnostico || [], reparacionesActivas || [], casosAtendidos || [])
    .forEach(function(caso) {
      var firma = caso && (caso.firmaProcedural || (caso.snapshot && caso.snapshot.firmaProcedural));
      if (firma && casosFirmasUsadas.indexOf(firma) < 0) casosFirmasUsadas.push(firma);
    });
  if (!Array.isArray(reparacionesActivas)) reparacionesActivas = [];
  if (!experienciaVehiculoDx || typeof experienciaVehiculoDx !== "object")
    experienciaVehiculoDx = {};
  if (!historialClientes || typeof historialClientes !== "object")
    historialClientes = {};
  casosAtendidos = casosAtendidos
    .filter((c) => c && typeof c === "object")
    .slice(0, 30)
    .map((c) => {
      c.idCaso = typeof c.idCaso === "string" ? c.idCaso : "";
      c.personaNombre =
        typeof c.personaNombre === "string" ? c.personaNombre : "Cliente";
      c.vehiculo =
        typeof c.vehiculo === "string" ? c.vehiculo : "Vehiculo sin ficha";
      c.estado = typeof c.estado === "string" ? c.estado : "seguimiento";
      c.detalle = typeof c.detalle === "string" ? c.detalle : "";
      c.actualizadoEn =
        typeof c.actualizadoEn === "number" ? c.actualizadoEn : Date.now();
      if (typeof asegurarIdCasoCliente === "function") asegurarIdCasoCliente(c);
      return c;
    });
  if (clienteActual && typeof clienteActual === "object") {
    if (typeof asegurarIdCasoCliente === "function")
      asegurarIdCasoCliente(clienteActual);
    clienteActual.fotoApariencia = normalizarRutaImagenRapida(
      clienteActual.fotoApariencia,
      "foto",
    );
  }
  if (Array.isArray(entregasPiezasActivas)) {
    entregasPiezasActivas = entregasPiezasActivas
      .map(function (entrega) {
        return normalizarEntregaPiezaActiva(entrega);
      })
      .filter(function (entrega) {
        return !!entrega;
      });
  }
  if (Array.isArray(clientesEnEspera)) {
    clientesEnEspera = clientesEnEspera.map((c) => {
      if (!c || typeof c !== "object") return c;
      if (typeof asegurarIdCasoCliente === "function") asegurarIdCasoCliente(c);
      c.fotoApariencia = normalizarRutaImagenRapida(c.fotoApariencia, "foto");
      return c;
    });
  }
  if (Array.isArray(casosPendientesDiagnostico)) {
    casosPendientesDiagnostico = casosPendientesDiagnostico.map((c) => {
      if (!c || typeof c !== "object") return c;
      if (typeof asegurarIdCasoCliente === "function") asegurarIdCasoCliente(c);
      c.fotoApariencia = normalizarRutaImagenRapida(c.fotoApariencia, "foto");
      return c;
    });
  }
  if (Array.isArray(reparacionesActivas)) {
    reparacionesActivas = reparacionesActivas
      .map(function (r) {
        return normalizarReparacionActiva(r);
      })
      .filter(function (r) {
        return !!r;
      })
      .map((r) => {
        if (!r || typeof r !== "object") return r;
        r.fotoApariencia = normalizarRutaImagenRapida(r.fotoApariencia, "foto");
        if (r.cliente && typeof r.cliente === "object") {
          if (typeof asegurarIdCasoCliente === "function")
            asegurarIdCasoCliente(r.cliente);
          r.cliente.fotoApariencia = normalizarRutaImagenRapida(
            r.cliente.fotoApariencia,
            "foto",
          );
        }
        return r;
      });
  }

  const normalizarNombreMecanicoGuardado = function (nombre) {
    const txt = String(nombre || "").trim();
    if (!txt) return txt;
    return txt.toLowerCase() === "moreni" ? "Morenai" : txt;
  };
  const normalizarListaMecanicosGuardado = function (lista) {
    return (Array.isArray(lista) ? lista : [])
      .filter(function (m) {
        return !!(m && typeof m === "object");
      })
      .map(function (m) {
        var copia = { ...m };
        copia.nombre = normalizarNombreMecanicoGuardado(copia.nombre);
        return copia;
      });
  };

  var td = window.TallerData || {};
  if (!Array.isArray(mecanicos)) {
    mecanicos = (td.mecanicosIniciales || []).map(function (m) {
      return { ...m };
    });
  }
  if (!Array.isArray(mecanicosDisponibles)) {
    mecanicosDisponibles = (td.mecanicosDisponiblesBase || []).map(
      function (m) {
        return { ...m };
      },
    );
  }

  mecanicos = normalizarListaMecanicosGuardado(mecanicos);
  mecanicosDisponibles = normalizarListaMecanicosGuardado(mecanicosDisponibles);

  if (Array.isArray(reparacionesActivas)) {
    var nombresMecanicosValidos = new Set(mecanicos.map(function(m) { return m && m.nombre; }).filter(Boolean));
    reparacionesActivas = reparacionesActivas.filter(function(rep) {
      if (rep && rep.mecanicoNombre && nombresMecanicosValidos.has(rep.mecanicoNombre)) return true;
      var casoRecuperado = rep && rep.casoRef && typeof rep.casoRef === "object"
        ? rep.casoRef
        : (rep && rep.idCaso ? { ...rep } : null);
      if (casoRecuperado) {
        delete casoRecuperado.mecanicoNombre;
        delete casoRecuperado.tipoTrabajo;
        delete casoRecuperado.tiempoRestante;
        delete casoRecuperado.tiempoTotal;
        delete casoRecuperado.listoParaCobro;
        if (!Array.isArray(casosPendientesDiagnostico)) casosPendientesDiagnostico = [];
        casosPendientesDiagnostico = casosPendientesDiagnostico.filter(function(c) {
          return !(c && c.idCaso === casoRecuperado.idCaso);
        });
        casosPendientesDiagnostico.push(casoRecuperado);
      }
      return false;
    });
  }

  var activosSet = new Set(
    mecanicos
      .map(function (m) {
        return m.nombre;
      })
      .filter(function (n) {
        return !!n;
      }),
  );
  var disponiblesSet = new Set(
    mecanicosDisponibles
      .map(function (m) {
        return m.nombre;
      })
      .filter(function (n) {
        return !!n;
      }),
  );
  var baseDisponibles = normalizarListaMecanicosGuardado(
    (td.mecanicosDisponiblesBase || []).map(function (m) {
      return { ...m };
    }),
  );
  baseDisponibles.forEach(function (baseMec) {
    if (!baseMec || !baseMec.nombre) return;
    if (activosSet.has(baseMec.nombre) || disponiblesSet.has(baseMec.nombre))
      return;
    mecanicosDisponibles.push(baseMec);
    disponiblesSet.add(baseMec.nombre);
  });

  if (typeof resumenDia.reparacionesParciales !== "number")
    resumenDia.reparacionesParciales = 0;
  if (typeof resumenDia.diagnosticosParciales !== "number")
    resumenDia.diagnosticosParciales = 0;
  recalcularCostosTacticos();
  focoDiaMax = calcularFocoMaxDia();
  focoDiaActual = Math.min(focoDiaActual, focoDiaMax);
  var mecanicosConTrabajoActivo = new Set(
    (Array.isArray(reparacionesActivas) ? reparacionesActivas : [])
      .filter(function (rep) {
        return rep && rep.mecanicoNombre && !rep.listoParaCobro;
      })
      .map(function (rep) {
        return rep.mecanicoNombre;
      }),
  );
  mecanicos.forEach((m) => {
    if (typeof m.enfriamientoTurnos !== "number") m.enfriamientoTurnos = 0;
    m.ocupado =
      m.enfriamientoTurnos > 0 || mecanicosConTrabajoActivo.has(m.nombre);
  });

  const estadoPantallas = normalizarEstadoPantallasGuardado(data);
  const menuInicioEl = obtenerMenuInicioEl();
  if (menuInicioEl) menuInicioEl.classList.add("hidden");
  const gameEl = document.getElementById("game");
  if (gameEl) {
    gameEl.classList.remove("hidden");
    gameEl.classList.toggle("modo-taller-fijo", !!estadoPantallas.taller);
  }
  const elHistoria = document.getElementById("pantalla-historia");
  if (elHistoria) elHistoria.classList.toggle("hidden", !estadoPantallas.historia);
  const elTaller = document.getElementById("pantalla-taller");
  if (elTaller) elTaller.classList.toggle("hidden", !estadoPantallas.taller);
  const elCierre = document.getElementById("pantalla-cierre");
  if (elCierre) elCierre.classList.toggle("hidden", !estadoPantallas.cierre);

  if (estadoPantallas.taller) iniciarTimer();
  sincronizarPausaJuego();
  actualizarEstadoMenuInicio();
  actualizarUI();
}

function guardarPartida() {
  const storage = window.TallerApp.storage || {};
  if (storage && typeof storage.writeJSON === "function") {
    storage.writeJSON(window.TallerApp.config.saveKey, obtenerEstadoGuardado(), "local");
  } else {
    localStorage.setItem(
      window.TallerApp.config.saveKey,
      JSON.stringify(obtenerEstadoGuardado()),
    );
  }
  actualizarEstadoMenuInicio();
  log("Partida guardada correctamente.", "exito");
}

function obtenerPartidaGuardadaParseada() {
  const storage = window.TallerApp.storage || {};
  if (storage && typeof storage.readJSON === "function") {
    const parsed = storage.readJSON(window.TallerApp.config.saveKey, null, "local");
    return parsed ? migrarPartidaGuardada(parsed) : null;
  }
  const raw = localStorage.getItem(window.TallerApp.config.saveKey);
  if (!raw) return null;
  try {
    return migrarPartidaGuardada(JSON.parse(raw));
  } catch (e) {
    return null;
  }
}

function autoGuardarPartidaSilenciosa(origen) {
  try {
    const storage = window.TallerApp.storage || {};
    if (storage && typeof storage.writeJSON === "function") {
      storage.writeJSON(window.TallerApp.config.saveKey, obtenerEstadoGuardado(), "local");
      return;
    }
    localStorage.setItem(
      window.TallerApp.config.saveKey,
      JSON.stringify(obtenerEstadoGuardado()),
    );
  } catch (e) {
    if (
      typeof console !== "undefined" &&
      console &&
      typeof console.warn === "function"
    ) {
      console.warn(
        "Autosave no disponible desde",
        origen || "origen-desconocido",
        e,
      );
    }
  }
}

function aplicarRecuperacionSegundoPlano(origen) {
  if (typeof sincronizarTrabajosTiempoReal === "function") {
    sincronizarTrabajosTiempoReal(origen || "segundo-plano");
  }
  var ahora = Date.now();
  var pantallaTaller = document.getElementById("pantalla-taller");
  var enTaller = !!(
    pantallaTaller && !pantallaTaller.classList.contains("hidden")
  );
  if (!enTaller || !autoAvanceActivo) {
    ultimoTickRealMs = ahora;
    return 0;
  }

  var base =
    typeof ultimoTickRealMs === "number" &&
    isFinite(ultimoTickRealMs) &&
    ultimoTickRealMs > 0
      ? ultimoTickRealMs
      : ahora;
  var segundosTranscurridos = Math.max(0, Math.floor((ahora - base) / 1000));
  var segundosPorPaso = Math.max(1, Math.round(autoTurnoCadaSeg || 1));
  var pasosCalculados = Math.max(
    0,
    Math.floor(segundosTranscurridos / segundosPorPaso),
  );

  ultimoTickRealMs = ahora;
  if (pasosCalculados <= 0 || typeof avanzarRelojTaller !== "function")
    return 0;

  var pasosMaximos = 900;
  var pasosAplicados = Math.min(pasosCalculados, pasosMaximos);
  avanzarRelojTaller(pasosAplicados, "recuperacion segundo plano", true);

  if (pasosCalculados > pasosMaximos && typeof log === "function") {
    log(
      "Recuperacion parcial aplicada al volver a la app para evitar congelamientos.",
      "info",
    );
  }
  if (typeof mostrarFeedbackGameplay === "function") {
    mostrarFeedbackGameplay(
      `Se recupero progreso en segundo plano (+${pasosAplicados} paso(s)).`,
      "ok",
    );
  }
  return pasosAplicados;
}

function sincronizarTrabajosTiempoReal(origen) {
  if (typeof procesarEntregasPiezasActivas === "function") {
    procesarEntregasPiezasActivas();
  }
  if (typeof procesarReparacionesActivas === "function") {
    procesarReparacionesActivas();
  }
  return origen || "manual";
}

if (typeof window !== "undefined") {
  window.sincronizarTrabajosTiempoReal = sincronizarTrabajosTiempoReal;
}

function asegurarCasosInicialesTaller(origen) {
  var cola = Array.isArray(clientesEnEspera) ? clientesEnEspera.length : 0;
  var pendientesDx = Array.isArray(casosPendientesDiagnostico)
    ? casosPendientesDiagnostico.length
    : 0;
  var reparaciones = Array.isArray(reparacionesActivas)
    ? reparacionesActivas.length
    : 0;
  var tieneCasoActivo = !!(clienteActual && typeof clienteActual === "object");

  if (tieneCasoActivo || cola > 0 || pendientesDx > 0 || reparaciones > 0) {
    return 0;
  }

  var generados = 0;
  if (typeof generarClienteEnCola === "function") {
    generados += generarClienteEnCola() ? 1 : 0;
    generados += generarClienteEnCola() ? 1 : 0;
  }

  if (!generados && typeof asegurarDemandaEnColaSinActivar === "function") {
    generados += asegurarDemandaEnColaSinActivar() ? 1 : 0;
  }

  if (generados > 0 && typeof log === "function") {
    log(
      `Flujo restaurado: se generaron ${generados} caso(s) inicial(es)${origen ? " en " + origen : ""}.`,
      "info",
    );
  }
  return generados;
}

// Demanda inicial y post-cobro: el jugador siempre puede abrir un nuevo
// expediente sin pagar ni depender del reloj del taller.
function recibirSiguienteClienteTaller() {
  var yaHayDemanda = (Array.isArray(clientesEnEspera) && clientesEnEspera.length) ||
    (Array.isArray(casosPendientesDiagnostico) && casosPendientesDiagnostico.length);
  if (yaHayDemanda) {
    seleccionarPuestoTaller("cola");
    actualizarUI();
    return true;
  }
  var duenoEnTrabajo = typeof obtenerTrabajoDuenoActivo === "function" ? obtenerTrabajoDuenoActivo() : null;
  var bahiasDisponibles = Math.max(1, Math.round(typeof espaciosReparacionMax === "number" ? espaciosReparacionMax : 1));
  if (duenoEnTrabajo && bahiasDisponibles <= 1) {
    mostrarFeedbackGameplay(`No puedes recibir otro cliente: ${duenoEnTrabajo.idCaso} ocupa la unica bahia. Espera o termina la reparacion.`, "warn");
    return false;
  }
  var creado = typeof generarClienteEnCola === "function" && generarClienteEnCola();
  if (!creado && typeof crearClienteAleatorio === "function") {
    var nuevoCaso = crearClienteAleatorio();
    if (nuevoCaso) {
      if (!Array.isArray(clientesEnEspera)) clientesEnEspera = [];
      clientesEnEspera.push(nuevoCaso);
      creado = true;
    }
  }
  if (!creado) {
    mostrarFeedbackGameplay("No se pudo generar demanda ahora. Inténtalo de nuevo.", "warn");
    return false;
  }
  seleccionarPuestoTaller("cola");
  mostrarFeedbackGameplay("Llegó un nuevo cliente. Revisa la cola y decide cómo atenderlo.", "ok");
  actualizarUI();
  return true;
}

function tallerSinCasosActivos() {
  var cola = Array.isArray(clientesEnEspera) ? clientesEnEspera.length : 0;
  var pendientesDx = Array.isArray(casosPendientesDiagnostico)
    ? casosPendientesDiagnostico.length
    : 0;
  var reparaciones = Array.isArray(reparacionesActivas)
    ? reparacionesActivas.length
    : 0;
  return !clienteActual && cola === 0 && pendientesDx === 0 && reparaciones === 0;
}

function avanzarDiaONuevosCasos(origen) {
  var motivo = origen || "flujo-vacio";
  var modoContinuo =
    typeof estaModoSinCierreDia === "function" && estaModoSinCierreDia();

  // En el modo actual no existe cierre de caja ni cambio manual de día.
  // Esta salida temprana evita que estados heredados de partidas antiguas
  // (`cierrePagoResuelto`, cupo diario) bloqueen la llegada de casos.
  if (modoContinuo) {
    var bloqueadoContinuo =
      typeof hayConversacionNarrativaBloqueanteActiva === "function" &&
      hayConversacionNarrativaBloqueanteActiva();
    if (bloqueadoContinuo) {
      if (typeof enfocarConversacionNarrativaPendiente === "function")
        enfocarConversacionNarrativaPendiente();
      return "narrativa";
    }
    var generadosContinuo = asegurarCasosInicialesTaller(motivo);
    if (!generadosContinuo && typeof generarClienteEnCola === "function" &&
        Array.isArray(clientesEnEspera) && clientesEnEspera.length === 0 &&
        !clienteActual && (!reparacionesActivas || reparacionesActivas.length === 0)) {
      generarClienteEnCola();
      generadosContinuo = 1;
    }
    if (typeof actualizarUI === "function") actualizarUI();
    return generadosContinuo > 0 ? "casos" : "sin-cambios";
  }

  var bloqueoNarrativo =
    typeof hayConversacionNarrativaBloqueanteActiva === "function" &&
    hayConversacionNarrativaBloqueanteActiva();
  if (bloqueoNarrativo) {
    if (typeof enfocarConversacionNarrativaPendiente === "function") {
      enfocarConversacionNarrativaPendiente();
    }
    return "narrativa";
  }

  if (!tallerSinCasosActivos()) {
    if (typeof actualizarUI === "function") actualizarUI();
    return "activos";
  }

  var modoSinCierre = false;
  var cupoCompleto =
    !modoSinCierre &&
    typeof estaCupoDiarioCompleto === "function" &&
    estaCupoDiarioCompleto(0);

  if (cupoCompleto) {
    if (!cierrePagoResuelto && typeof cerrarDia === "function") {
      cerrarDia();
      return "cierre";
    }
    if (cierrePagoResuelto && typeof avanzarDia === "function") {
      avanzarDia();
      return "dia";
    }
  }

  var generados = asegurarCasosInicialesTaller(motivo);
  if (!generados && cupoCompleto && !cierrePagoResuelto && typeof cerrarDia === "function") {
    cerrarDia();
    return "cierre";
  }
  if (!generados && typeof actualizarUI === "function") {
    actualizarUI();
  }
  return generados > 0 ? "casos" : "sin-cambios";
}

if (typeof window !== "undefined") {
  window.asegurarCasosInicialesTaller = asegurarCasosInicialesTaller;
  window.avanzarDiaONuevosCasos = avanzarDiaONuevosCasos;
}

function cargarPartidaSilenciosaInicial() {
  const data = obtenerPartidaGuardadaParseada();
  if (!esPartidaGuardadaUtilizable(data)) {
    actualizarEstadoMenuInicio();
    return false;
  }
  try {
    aplicarEstadoGuardado(data);
    aplicarRecuperacionSegundoPlano("restore-inicial");
    asegurarCasosInicialesTaller("restore-inicial");
    if (typeof actualizarUI === "function") actualizarUI();
    return true;
  } catch (e) {
    if (
      typeof console !== "undefined" &&
      console &&
      typeof console.warn === "function"
    ) {
      console.warn("No se pudo restaurar partida automaticamente.", e);
    }
    return false;
  }
}

function debePersistirSesionActual() {
  try {
    if (
      typeof sessionStorage !== "undefined" &&
      sessionStorage.getItem("tw_force_new") === "1"
    ) {
      return false;
    }
  } catch (e) {}
  const gameEl = document.getElementById("game");
  const menuEl = obtenerMenuInicioEl();
  if (!gameEl || !menuEl) return false;
  return (
    gameEl.classList &&
    !gameEl.classList.contains("hidden") &&
    menuEl.classList.contains("hidden")
  );
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", function () {
    if (debePersistirSesionActual()) autoGuardarPartidaSilenciosa("pagehide");
  });
  window.addEventListener("beforeunload", function () {
    if (debePersistirSesionActual())
      autoGuardarPartidaSilenciosa("beforeunload");
  });
  window.addEventListener("pageshow", function () {
    if (debePersistirSesionActual())
      aplicarRecuperacionSegundoPlano("pageshow");
  });
  window.addEventListener("focus", function () {
    if (debePersistirSesionActual()) aplicarRecuperacionSegundoPlano("focus");
  });
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden" && debePersistirSesionActual()) {
      autoGuardarPartidaSilenciosa("visibilitychange");
      return;
    }
    if (document.visibilityState === "visible" && debePersistirSesionActual()) {
      aplicarRecuperacionSegundoPlano("visibilitychange-visible");
    }
  });
}

function cargarPartida() {
  const data = obtenerPartidaGuardadaParseada();
  if (!esPartidaGuardadaUtilizable(data)) {
    actualizarEstadoMenuInicio();
    log("No hay partida guardada.", "error");
    return;
  }
  try {
    aplicarEstadoGuardado(data);
    aplicarRecuperacionSegundoPlano("cargar-partida");
    asegurarCasosInicialesTaller("cargar-partida");
    if (typeof actualizarUI === "function") actualizarUI();
    log("Partida cargada.", "exito");
    cerrarModal();
  } catch (e) {
    log("Error al cargar partida guardada.", "error");
  }
}

function cargarPartidaDesdeMenu() {
  const data = obtenerPartidaGuardadaParseada();
  if (!esPartidaGuardadaUtilizable(data)) {
    actualizarEstadoMenuInicio();
    alert("No hay partida guardada disponible.");
    return;
  }
  try {
    // Ocultar menú de inicio al continuar partida
    var menuInicioEl = document.getElementById("menu-inicio");
    if (menuInicioEl) menuInicioEl.classList.add("hidden");
    var gameEl = document.getElementById("game");
    if (gameEl) gameEl.classList.remove("hidden");
    aplicarEstadoGuardado(data);
    aplicarRecuperacionSegundoPlano("cargar-menu");
    asegurarCasosInicialesTaller("cargar-menu");
    if (typeof actualizarUI === "function") actualizarUI();
  } catch (e) {
    alert("La partida guardada esta danada.");
  }
}

function actualizarAvisoFinJornada() {
  const aviso = document.getElementById("fin-jornada-aviso");
  if (!aviso) return;
  const modoSinCierre =
    typeof estaModoSinCierreDia === "function" && estaModoSinCierreDia();
  if (modoSinCierre) {
    aviso.classList.add("hidden");
    aviso.innerText = "";
    return;
  }
  const cupoCompleto =
    typeof estaCupoDiarioCompleto === "function"
      ? estaCupoDiarioCompleto(0)
      : clientesHoy >= (window.CLIENTES_POR_DIA || 10);
  const pendientesDx = Array.isArray(casosPendientesDiagnostico)
    ? casosPendientesDiagnostico.length
    : 0;
  const sinPendientesTecnicos =
    !clienteActual && reparacionesActivas.length === 0 && pendientesDx === 0;

  if (cupoCompleto && sinPendientesTecnicos) {
    aviso.classList.remove("hidden");
    aviso.innerText = `Cupo diario completado. Cierra el dia para continuar. Los clientes en cola se evaluaran manana.`;
    return;
  }
  if (cupoCompleto) {
    aviso.classList.remove("hidden");
    aviso.innerText =
      pendientesDx > 0
        ? `Cupo diario completado. Tienes ${pendientesDx} caso(s) en pendientes de diagnostico.`
        : "Cupo diario completado. Espera que terminen las reparaciones activas y luego cierra el dia.";
    return;
  }
  aviso.classList.add("hidden");
  aviso.innerText = "";
}

window.ultimaSiguienteAccionRecomendada =
  window.ultimaSiguienteAccionRecomendada || null;

function enfocarElementoUI(id) {
  var el = document.getElementById(id);
  if (!el) return false;
  try {
    el.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });
  } catch (e) {
    el.scrollIntoView();
  }
  el.classList.remove("ui-focus-pulse");
  void el.offsetWidth;
  el.classList.add("ui-focus-pulse");
  setTimeout(function () {
    if (el) el.classList.remove("ui-focus-pulse");
  }, 1800);
  return true;
}

function prepararCasoParaAsignacionDirecta(caso) {
  if (!caso || typeof caso !== "object") return null;
  if (typeof asegurarIdCasoCliente === "function") asegurarIdCasoCliente(caso);
  if (typeof asegurarDiagnosticoJugador === "function")
    asegurarDiagnosticoJugador(caso);

  var principal = "";
  if (Array.isArray(caso.fallosPrincipales) && caso.fallosPrincipales.length) {
    principal = caso.fallosPrincipales[0];
  } else if (caso.nombre) {
    principal = caso.nombre;
  } else {
    principal = "Revision general";
  }

  caso.diagnosticoSeleccionado = caso.diagnosticoSeleccionado || principal;
  if (
    !Array.isArray(caso.diagnosticosDetectados) ||
    !caso.diagnosticosDetectados.length
  ) {
    caso.diagnosticosDetectados = [caso.diagnosticoSeleccionado];
  }

  caso.diagnosticado = true;
  caso.diagnosticoCorrecto = true;
  caso.diagnosticoNivel = "critico";
  caso.diagnosticoDetectado = caso.diagnosticosDetectados.join(" | ");
  caso.aprobadoCliente = true;
  caso.aprobacionCliente = true;
  caso.negociado = true;

  if (caso.esVIP && (caso.etapaVIP || 1) < 2) {
    caso.etapaVIP = 2;
  }

  var estadoDirecto =
    caso.esVIP && caso.etapaVIP === 2 && !caso.piezaVIPComprada
      ? "falta_pieza"
      : "listo_asignacion";
  if (typeof actualizarCasoAtendido === "function") {
    actualizarCasoAtendido(
      caso,
      estadoDirecto,
      "Caso listo para asignar mecanico (flujo rapido).",
    );
  }
  return estadoDirecto;
}

function obtenerSiguienteAccionRecomendada() {
  // cupoCompleto eliminado: ya no hay límite diario ni CLIENTES_POR_DIA
  var cupoCompleto = false;
  var pendientesDx = Array.isArray(casosPendientesDiagnostico)
    ? casosPendientesDiagnostico.length
    : 0;
  var cola = Array.isArray(clientesEnEspera) ? clientesEnEspera.length : 0;
  var activas = Array.isArray(reparacionesActivas) ? reparacionesActivas : [];
  var listas = activas.filter(function (r) {
    return !!(r && r.listoParaCobro);
  });
  var listasSinRevisar = listas.filter(function (r) {
    return !r.resultadoVisible;
  });
  var listasListasCobro = listas.filter(function (r) {
    return !!r.resultadoVisible;
  });

  if (listasSinRevisar.length > 0) {
    return {
      nivel: "warn",
      texto: `Revisa resultado de ${listasSinRevisar.length} caso(s) listo(s) antes de cobrar.`,
      accion: "revisar-resultado",
      ctaLabel: "Revisar resultado",
      idCaso: listasSinRevisar[0].idCaso || "",
    };
  }
  if (listasListasCobro.length > 0) {
    return {
      nivel: "warn",
      texto: `Cobro pendiente en ${listasListasCobro.length} caso(s). Cobra desde el panel de reparaciones.`,
      accion: "cobrar-directo",
      ctaLabel: "Cobrar caso",
      idCaso: listasListasCobro[0].idCaso || "",
    };
  }

  if (!clienteActual) {
    if (pendientesDx > 0) {
      return {
        nivel: "ok",
        texto: `Toma un caso en Pend. DX (${pendientesDx}) e investigalo en el panel central.`,
        accion: "activar-pendiente-dx",
        ctaLabel: "Tomar caso",
        index: 0,
      };
    }
    if (cola > 0) {
      return {
        nivel: "ok",
        texto: `Selecciona un cliente de la cola (${cola}) y abre su diagnostico humano.`,
        accion: "tomar-cola",
        ctaLabel: "Tomar caso",
        index: 0,
      };
    }
    if (activas.length > 0) {
      return {
        nivel: "ok",
        texto:
          "No hay caso activo: deja correr el flujo o gestiona cobros/reparaciones.",
        accion: "pasar-turno",
        ctaLabel: modoNivelesActivo() ? "Dejar flujo" : "Esperar",
      };
    }
    if (!cupoCompleto) {
      return {
        nivel: "ok",
        texto:
          "Espera llegada de clientes o usa operaciones tacticas para acelerar flujo.",
        accion: "pasar-turno",
        ctaLabel: modoNivelesActivo() ? "Dejar flujo" : "Esperar",
      };
    }
  }

  if (clienteActual) {
    if (!clienteActual.diagnosticado) {
      return {
        nivel: "ok",
        texto:
          "Elige ruta: diagnosticalo tu en el panel central o arrastra el caso a un mecanico para que haga el diagnostico.",
        accion: "abrir-dx",
        ctaLabel: "Investigar caso",
      };
    }
    if (!clienteActual.aprobacionCliente) {
      return {
        nivel: "ok",
        texto:
          "Dictamen emitido: consigue aprobacion del cliente por negociacion o WhatsApp antes de asignar mecanico.",
        accion: "abrir-whatsapp-cliente",
        ctaLabel: "Negociar caso",
      };
    }
    if (
      clienteActual.esVIP &&
      clienteActual.etapaVIP === 2 &&
      !clienteActual.piezaVIPComprada
    ) {
      return {
        nivel: "warn",
        texto: "Caso VIP: compra pieza especial para continuar el flujo.",
        accion: "comprar-pieza-vip",
        ctaLabel: "Comprar pieza VIP",
      };
    }
    var pendientesPieza = Array.isArray(clienteActual.piezasRequeridasMecanico)
      ? clienteActual.piezasRequeridasMecanico.length
      : 0;
    var piezaDisponible =
      typeof obtenerPiezaDisponibleParaCaso === "function"
        ? obtenerPiezaDisponibleParaCaso()
        : null;
    if (pendientesPieza > 0) {
      if (piezaDisponible && piezaDisponible.id) {
        return {
          nivel: "warn",
          texto:
            "Mecanico solicita pieza: ya tienes una compatible lista para instalar.",
          accion: "instalar-pieza",
          ctaLabel: "Instalar pieza",
          piezaId: piezaDisponible.id,
        };
      }
      return {
        nivel: "warn",
        texto:
          "Mecanico solicita pieza: compra/instala para destrabar la reparacion.",
        accion: "abrir-repuestos",
        ctaLabel: "Abrir Repuestos",
      };
    }
    return {
      nivel: "ok",
      texto: "Arrastra/Asigna el caso aprobado a un mecanico disponible.",
      accion: "foco-mecanicos",
      ctaLabel: "Ver mecanicos",
    };
  }

  return {
    nivel: "ok",
    texto: "Sigue el flujo: tomar caso -> investigar -> aprobar -> asignar mecanico -> cobrar.",
    accion: "pasar-turno",
    ctaLabel: "Continuar",
  };
}

function ejecutarSiguienteAccionRecomendada() {
  var recomendacion =
    window.ultimaSiguienteAccionRecomendada ||
    obtenerSiguienteAccionRecomendada();
  if (!recomendacion || !recomendacion.accion) return;

  switch (recomendacion.accion) {
    case "cerrar-dia":
      if (typeof mostrarFeedbackGameplay === "function") {
        mostrarFeedbackGameplay(
          "El flujo actual va por casos: sigue con cola, reparaciones o cobros.",
          "info",
        );
      }
      return;
    case "revisar-resultado":
      if (
        recomendacion.idCaso &&
        typeof verResultadoReparacionLista === "function"
      ) {
        verResultadoReparacionLista(recomendacion.idCaso);
      }
      return;
    case "cobrar-directo":
      if (
        recomendacion.idCaso &&
        typeof procesarCobroReparacionDirecto === "function"
      ) {
        procesarCobroReparacionDirecto(recomendacion.idCaso);
      }
      return;
    case "activar-pendiente-dx":
      cambiarPanelLateral("pending-dx");
      if (typeof activarPendienteDiagnostico === "function")
        activarPendienteDiagnostico(recomendacion.index || 0, false);
      return;
    case "tomar-cola":
      cambiarPanelLateral("queue");
      if (typeof seleccionarClienteCola === "function")
        seleccionarClienteCola(recomendacion.index || 0, false);
      return;
    case "pasar-turno":
      pasarTurno();
      return;
    case "hablar-cliente":
      hablarConCliente(true);
      return;
    case "abrir-dx":
      enfocarElementoUI("active-case-card");
      if (typeof mostrarFeedbackGameplay === "function") {
        mostrarFeedbackGameplay(
          "Usa el panel central: habla con el cliente, inspecciona, analiza pistas y emite dictamen.",
          "ok",
        );
      }
      return;
    case "abrir-whatsapp-cliente":
      if (typeof ofDxAbrirWhatsApp === "function") {
        ofDxAbrirWhatsApp();
        return;
      }
      enfocarElementoUI("active-case-card");
      return;
    case "comprar-pieza-vip":
      if (typeof comprarPiezaVIP === "function") comprarPiezaVIP();
      return;
    case "abrir-repuestos":
      abrirModal("repuestos");
      return;
    case "instalar-pieza":
      if (recomendacion.piezaId && typeof instalarPiezaEnCaso === "function")
        instalarPiezaEnCaso(recomendacion.piezaId);
      return;
    case "foco-mecanicos":
      enfocarElementoUI("grid-mecanicos");
      if (typeof mostrarFeedbackGameplay === "function") {
        mostrarFeedbackGameplay(
          "Selecciona un mecanico disponible para asignar este caso.",
          "ok",
        );
      }
      return;
    default:
      return;
  }
}

function ejecutarSiguienteAccionDesdeTarjeta(event) {
  if (event && event.type === "keydown") {
    const tecla = event.key || "";
    if (tecla !== "Enter" && tecla !== " ") return;
    event.preventDefault();
  }
  ejecutarSiguienteAccionRecomendada();
}

function actualizarSiguienteAccionRecomendada() {
  var card = document.getElementById("siguiente-accion-card");
  var texto = document.getElementById("siguiente-accion-texto");
  var pista = document.getElementById("siguiente-accion-hint");
  var recomendacion = obtenerSiguienteAccionRecomendada();
  window.ultimaSiguienteAccionRecomendada = recomendacion;
  if (!card || !texto) {
    actualizarAtajoOperacionContextual();
    return;
  }
  card.classList.remove("ok", "warn", "critical");
  var nivel = recomendacion && recomendacion.nivel ? recomendacion.nivel : "ok";
  if (nivel === "error") nivel = "critical";
  card.classList.add(nivel);
  texto.innerText =
    recomendacion && recomendacion.texto
      ? recomendacion.texto
      : "Sin recomendacion por ahora.";
  var tieneAccion = !!(recomendacion && recomendacion.accion);
  card.classList.toggle("is-actionable", tieneAccion);
  card.setAttribute("aria-disabled", tieneAccion ? "false" : "true");
  card.title = tieneAccion
    ? `Siguiente paso: ${recomendacion && recomendacion.ctaLabel ? recomendacion.ctaLabel : "Abrir"}`
    : "Sin accion sugerida por ahora";
  if (pista) {
    pista.innerText = tieneAccion
      ? `Toque para: ${recomendacion && recomendacion.ctaLabel ? recomendacion.ctaLabel : "Abrir"}`
      : "Sin accion prioritaria ahora";
  }
  actualizarAtajoOperacionContextual();
}

function mostrarFeedbackGameplay(texto, tipo = "ok") {
  const el = document.getElementById("feedback-gameplay");
  if (!el) return;
  var textoBase = String(texto || "");
  // Si el jugador está en otra pantalla, el toast puede quedar fuera de vista.
  // Replica solo eventos operativos importantes en Teléfono como notificación.
  var fueraDelTaller = !document.getElementById("screen-taller.active");
  var mensajeOperativo = /caso|diagn[oó]stico|reparaci[oó]n|delivery|pieza|mec[aá]nico|trabajo/i.test(textoBase);
  if (fueraDelTaller && mensajeOperativo && (tipo === "warn" || tipo === "error" || tipo === "ok")) {
    var casoContexto = clienteActual && clienteActual.idCaso ? clienteActual.idCaso : "";
    if (!casoContexto && Array.isArray(reparacionesActivas)) {
      var repContexto = reparacionesActivas.find(function (r) { return r && !r.listoParaCobro; });
      casoContexto = repContexto && repContexto.idCaso ? repContexto.idCaso : "";
    }
    var faseContexto = "";
    if (casoContexto && Array.isArray(reparacionesActivas)) {
      var repFase = reparacionesActivas.find(function (r) { return r && r.idCaso === casoContexto; });
      if (repFase) faseContexto = repFase.tipoTrabajo === "diagnostico" ? "diagnóstico en curso" : (repFase.pausadaPorPieza ? "esperando pieza" : "reparación en curso");
    }
    var siguiente = tipo === "warn" ? "Revisa Teléfono y atiende el bloqueo." : (tipo === "error" ? "Abre Taller para revisar la causa." : "Consulta Trabajos para seguir el avance.");
    var contextoTexto = [casoContexto ? "Caso " + casoContexto : "", faseContexto, siguiente].filter(Boolean).join(" · ");
    var textoNotificacion = contextoTexto ? textoBase + " | " + contextoTexto : textoBase;
    var claveAviso = textoNotificacion.slice(0, 180);
    if (window.ultimoAvisoOperativo !== claveAviso && typeof pushMensajeTelefono === "function") {
      window.ultimoAvisoOperativo = claveAviso;
      pushMensajeTelefono("sistema_taller", "sistema_taller", textoNotificacion, { clave: "feedback-operativo-" + claveAviso });
    }
  }
  window.feedbackQueue = Array.isArray(window.feedbackQueue) ? window.feedbackQueue : [];
  var prioridad = { info: 1, ok: 2, money: 2, rep: 2, warn: 3, error: 4, fail: 4 };
  var actualTipo = el.dataset.feedbackType || "";
  if (el.classList.contains("is-visible") && (prioridad[tipo] || 2) < (prioridad[actualTipo] || 0)) {
    window.feedbackQueue.push({ texto: texto, tipo: tipo });
    return;
  }
  if (window.TallerAudio && typeof window.TallerAudio.play === "function") {
    var sonido = "info";
    if (tipo === "warn") sonido = "warn";
    else if (tipo === "error") sonido = "error";
    else if (tipo === "fail") sonido = "fail";
    else if (tipo === "money") sonido = "money";
    else if (tipo === "rep" || tipo === "ok") sonido = "success";
    window.TallerAudio.play(sonido);
  }
  window.feedbackHideDelayTimeout = window.feedbackHideDelayTimeout || null;
  el.classList.remove("hidden", "warn", "error", "is-visible");
  if (tipo === "warn") el.classList.add("warn");
  if (tipo === "error") el.classList.add("error");
  el.innerText = texto;
  el.dataset.feedbackType = tipo;
  void el.offsetWidth;
  el.classList.remove("hidden");
  el.classList.add("is-visible");
  if (feedbackTimeout) clearTimeout(feedbackTimeout);
  if (window.feedbackHideDelayTimeout) {
    clearTimeout(window.feedbackHideDelayTimeout);
    window.feedbackHideDelayTimeout = null;
  }
  if (tipo === "error") {
    feedbackTimeout = null;
    return;
  }
  var duracion = tipo === "warn" ? 4200 : 2800;
  feedbackTimeout = setTimeout(() => {
    el.classList.remove("is-visible");
    window.feedbackHideDelayTimeout = setTimeout(function () {
      el.classList.add("hidden");
      window.feedbackHideDelayTimeout = null;
      var siguiente = window.feedbackQueue.shift();
      if (siguiente) mostrarFeedbackGameplay(siguiente.texto, siguiente.tipo);
    }, 200);
  }, duracion);
}

function mostrarOpcionesDecisionTrabajo(trabajo, callback, soloDosOpciones) {
  var container = document.getElementById("active-case-actions");
  if (!container) return;

  container.innerHTML = "";

  var opciones = [
    { key: "diagnostico", label: "🔍 Diagnosticar", desc: "Lento, seguro" },
    { key: "reparar", label: "⚡ Reparar rápido", desc: "Rápido, riesgoso" },
  ];

  if (!soloDosOpciones) {
    opciones.push({
      key: "hablar",
      label: "💬 Hablar cliente",
      desc: "Medio, info parcial",
    });
  }

  opciones.forEach(function (opt) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-decision";
    btn.innerHTML =
      "<span>" + opt.label + "</span><div class='decision-desc'>" + opt.desc + "</div>";
    btn.onclick = function () {
      btn.classList.add("btn-decision-active");
      setTimeout(function () {
        btn.classList.remove("btn-decision-active");
        container.innerHTML = "";
        if (typeof callback === "function") callback(opt.key);
      }, 200);
    };
    container.appendChild(btn);
  });
}

function obtenerSelloClienteActivo() {
  if (!clienteActual) return { texto: "PENDIENTE", clase: "sello-pendiente" };
  if (tiempoCliente <= 4) return { texto: "CRITICO", clase: "sello-critico" };
  if (clienteActual.esVIP) return { texto: "VIP", clase: "sello-vip" };
  return {
    texto: clienteActual.diagnosticado ? "APROBADO" : "PENDIENTE",
    clase: "sello-pendiente",
  };
}

function mostrarStamp(texto, tipo = "ok") {
  const el = document.getElementById("stamp-note");
  if (!el) return;
  const claseExtra = tipo === "error" ? "error" : tipo === "warn" ? "warn" : "";
  el.className = `stamp-note ${claseExtra}`.trim();
  el.innerText = texto;
  void el.offsetWidth;
  el.classList.add("show");
}

function obtenerClaseUrgencia(valor) {
  if (valor > 8) return "urgencia-verde";
  if (valor > 4) return "urgencia-amarillo";
  return "urgencia-rojo";
}

function toggleEstadoCard(tipo) {
  if (!estadoCards.hasOwnProperty(tipo)) return;
  estadoCards[tipo] = !estadoCards[tipo];
  const body = document.getElementById(`estado-body-${tipo}`);
  const icon = document.getElementById(`estado-toggle-${tipo}`);
  if (!body || !icon) return;
  if (estadoCards[tipo]) {
    body.classList.add("hidden");
    icon.innerText = "+";
  } else {
    body.classList.remove("hidden");
    icon.innerText = "-";
  }
}

function clampWorkflowProgress(valor) {
  var numero = Number(valor);
  if (!Number.isFinite(numero)) numero = 0;
  return Math.max(0, Math.min(100, Math.round(numero)));
}

function obtenerEstadoWorkflowReparacion(rep) {
  rep = normalizarReparacionActiva(rep);
  var total = Math.max(
    1,
    Math.round(
      (rep && (rep.segundosTotalesReal || rep.duracionRealSeg)) || 1,
    ),
  );
  var restante = obtenerSegundosRestantesReparacion(rep);
  var progresoFase = clampWorkflowProgress(((total - restante) / total) * 100);
  var entregaActiva = Array.isArray(entregasPiezasActivas)
    ? entregasPiezasActivas.find(function (entrega) {
        return entrega && rep && entrega.idCaso === rep.idCaso;
      }) || null
    : null;
  var faseDelivery = entregaActiva ? obtenerFaseDelivery(entregaActiva) : null;
  var listo = !!(rep && rep.listoParaCobro);
  var estado = "Reparando";
  var clase = "ok";
  var faseClase = "phase-reparando";
  var progresoPrincipal = 50 + Math.round(progresoFase / 2);
  var detalleEstado = "ETA " + formatearDuracionSegundos(restante);

  if (listo) {
    estado = "Listo";
    clase = "ok";
    faseClase = "phase-listo";
    progresoPrincipal = 100;
    detalleEstado = "Trabajo completado";
  } else if (rep && rep.tipoTrabajo === "diagnostico") {
    estado = "Diagnosticando";
    clase = "info";
    faseClase = "phase-diagnosticando";
    progresoPrincipal = Math.round(progresoFase / 2);
    detalleEstado = "Diagnostico listo en " + formatearDuracionSegundos(restante);
  } else if (entregaActiva) {
    estado = faseDelivery && faseDelivery.progreso < 50 ? "Buscando piezas" : "Trayendo piezas";
    clase = "warn";
    faseClase = "phase-piezas";
    progresoPrincipal = faseDelivery ? faseDelivery.progreso : 0;
    detalleEstado = "Delivery en camino" + (faseDelivery ? ": " + formatearDuracionSegundos(obtenerSegundosRestantesDelivery(entregaActiva)) : "");
  } else if (rep && rep.pedidoPendienteDelivery) {
    estado = "Pago pendiente";
    clase = "warn";
    faseClase = "phase-piezas";
    progresoPrincipal = Math.max(10, progresoFase);
    detalleEstado = "Pedido listo para pagar";
  } else if (rep && (rep.pedidoPendienteDelivery || rep.pausadaPorPieza || rep.tipoTrabajo === "pedir_piezas")) {
    estado = "Pausado por piezas";
    clase = "warn";
    faseClase = "phase-piezas";
    progresoPrincipal = Math.max(10, progresoFase);
    detalleEstado = "En pausa hasta recibir piezas";
  }

  return {
    total: total,
    restante: restante,
    progresoFase: progresoFase,
    progresoPrincipal: clampWorkflowProgress(progresoPrincipal),
    entregaActiva: entregaActiva,
    faseDelivery: faseDelivery,
    listo: listo,
    estado: estado,
    clase: clase,
    faseClase: faseClase,
    detalleEstado: detalleEstado,
  };
}

function renderizarPanelReparaciones() {
  const cont =
    document.getElementById("lista-reparaciones-activas") ||
    document.getElementById("repairs-list");
  if (!cont) return;
  const esc =
    typeof ofDxEscapar === "function"
      ? ofDxEscapar
      : function (v) {
          return String(v || "");
        };

  const activas = Array.isArray(reparacionesActivas)
    ? reparacionesActivas.filter(function (r) {
        return r && typeof r === "object";
      })
    : [];

  if (activas.length === 0) {
    cont.innerHTML =
      '<div class="flow-case-empty">Sin reparaciones en proceso.</div>';
    return;
  }
  
  try {
    cont.innerHTML = activas
      .map(function (r, i) {
        const workflow = obtenerEstadoWorkflowReparacion(r);
        const vehiculo = r.vehiculo || "Vehiculo sin ficha";
        const tipoTag =
          r.tipoTrabajo === "diagnostico"
            ? '<span class="flow-case-tag info">DIAGNOSTICO</span>'
            : workflow.listo
              ? '<span class="flow-case-tag ok">LISTO</span>'
              : '<span class="flow-case-tag info">REPARACION</span>';
        const idCaso = String(r.idCaso || "");
        const idCasoSafe = idCaso.replace(/'/g, "\\'");
        const bioMecanico =
          typeof obtenerBioMecanicoSeguro === "function"
            ? obtenerBioMecanicoSeguro(r.mecanicoNombre || "")
            : { foto: "" };
        const avatarMecanico = construirAvatarConFallback(
          r.mecanicoNombre || "Mecanico",
          bioMecanico.foto,
          "case-worker-avatar",
          "case-worker-avatar-placeholder",
        );
        const ritmoBadges = [
          r && (r.negociado || r.precioNegociado) ? '<span class="flow-case-tag ok">PRECIO NEGOCIADO</span>' : "",
          r && r.casoCaliente ? '<span class="flow-case-tag hot">CALIENTE</span>' : "",
          r && r.cadenaEspecialidadActiva ? '<span class="flow-case-tag chain">CADENA</span>' : "",
          r && r.miniHistoriaTipo === "retorno_encadenado" ? '<span class="flow-case-tag accent">RETORNO</span>' : "",
        ]
          .filter(Boolean)
          .join("");
        const dropDeliveryAttrs = r.pausadaPorPieza
          ? `ondragover=\"permitirDropCasoReparacion(event)\" ondragleave=\"event.currentTarget.classList.remove('drop-ready-delivery')\" ondrop=\"soltarRecursoEnCasoReparacion(event, '${idCasoSafe}')\"`
          : "";
        const tapDeliveryAttrs =
          r.pausadaPorPieza && !workflow.entregaActiva && !r.pedidoPendienteDelivery
            ? `onclick=\"tocarCasoReparacionConDelivery('${idCasoSafe}')\" role=\"button\" tabindex=\"0\"`
            : "";
        const clasesTarjeta = [
          "active-case-card",
          "repair-card",
          "flow-case-repair",
          workflow.listo ? "ready ready-to-charge" : "",
          r && r.casoCaliente ? "hot-case" : "",
          r && (r.pausadaPorPieza || r.tipoTrabajo === "pedir_piezas") ? "is-paused" : "",
        ]
          .filter(Boolean)
          .join(" ");
        const barraPrincipal = `<div class="repair-progress"><div class="repair-progress-fill ${workflow.faseClase}" style="width:${workflow.progresoPrincipal}%;"></div></div>`;
        const barraMecanico = `<div class="case-worker-progress"><div class="case-worker-progress-fill" style="width:${workflow.listo ? 100 : workflow.progresoFase}%;"></div></div>`;
        const tarjetaTrabajo = `<div class="case-worker-card">\n                <div class="case-worker-head">\n                    ${avatarMecanico}\n                    <div class="case-worker-info">\n                        <strong>${esc(r.mecanicoNombre || "Mecanico")}</strong>\n                        <span>${esc(vehiculo)}</span>\n                    </div>\n                    <span class="flow-case-tag ${workflow.clase}">${workflow.estado}</span>\n                </div>\n                ${barraMecanico}\n            </div>`;

        let tarjetaDelivery = "";
        if (workflow.entregaActiva) {
          const deliveryImgsCase = [
            "img/delivery/jefry.png",
            "img/delivery/ludo.png",
          ];
          const seedDelivery = String(r.idCaso || "")
            .split("")
            .reduce(function (acc, ch) {
              return acc + ch.charCodeAt(0);
            }, 0);
          const avatarDeliveryCase =
            deliveryImgsCase[seedDelivery % deliveryImgsCase.length];
          const progresoDelivery = clampWorkflowProgress(
            workflow.faseDelivery ? workflow.faseDelivery.progreso : 0,
          );
          const deliveryLabel =
            typeof workflow.entregaActiva.slotDelivery === "number"
              ? `Delivery #${workflow.entregaActiva.slotDelivery + 1}`
              : "Delivery";
          tarjetaDelivery = `<div class="case-worker-card case-worker-delivery">\n                <div class="case-worker-head">\n                    <img src="${avatarDeliveryCase}" alt="Delivery" class="case-worker-avatar" onerror="this.style.display='none'">\n                    <div class="case-worker-info">\n                        <strong>${deliveryLabel}</strong>\n                        <span>${progresoDelivery}% completado</span>\n                    </div>\n                    <span class="flow-case-tag warn">${workflow.faseDelivery ? workflow.faseDelivery.fase : "Buscando piezas"}</span>\n                </div>\n                <div class="case-worker-progress"><div class="case-worker-progress-fill" style="width:${progresoDelivery}%;"></div></div>\n            </div>`;
        }

        let pedidoDeliveryHtml = "";
        if (r.pedidoPendienteDelivery) {
          const pdPiezas = (r.pedidoPendienteDelivery.piezas || [])
            .map(function (p) {
              return (
                '<div class="pedido-piezas-item"><span>' +
                esc(p.nombre) +
                "</span><span>RD$" +
                (p.costo || 0) +
                "</span></div>"
              );
            })
            .join("");
          const pdTotal = r.pedidoPendienteDelivery.costoTotal || 0;
          pedidoDeliveryHtml =
            '<div class="pedido-delivery-confirm">' +
            '<div class="pedido-piezas-header">Piezas requeridas</div>' +
            pdPiezas +
            '<div class="pedido-piezas-total">Total: RD$' +
            pdTotal +
            "</div>" +
            '<div style="display:flex;gap:6px;margin-top:6px;">' +
            '<button class="btn" onclick="confirmarPagarDelivery(\'' +
            idCasoSafe +
            `')" onmousedown="sfxConfirm && sfxConfirm();">Pagar RD$${pdTotal}</button>` +
            '<button class="btn" style="background:#3a3a3a;color:#ccc;" onclick="cancelarPedidoDelivery(\'' +
            idCasoSafe +
            `')" onmousedown="sfxReject && sfxReject();">Cancelar</button>` +
            "</div></div>";
        } else if (r.pausadaPorPieza && !workflow.entregaActiva) {
          const piezasPendientes =
            Array.isArray(r.piezasContinuacionRequeridas) &&
            r.piezasContinuacionRequeridas.length
              ? r.piezasContinuacionRequeridas.slice()
              : [
                  {
                    id: "",
                    nombre: r.piezaRequeridaNombre || "pieza de continuidad",
                    especialidad: r.especialidadIdeal,
                    calidad: "estandar",
                  },
                ];
          const piezasPendientesCantidad = piezasPendientes.length;
          const costoPendiente = piezasPendientes.reduce(function (acc, p) {
            let costo = Math.max(0, Math.round((p && p.costo) || 0));
            if (
              !costo &&
              p &&
              p.id &&
              typeof obtenerCostoCatalogoRepuesto === "function"
            ) {
              costo = Math.max(
                0,
                Math.round(obtenerCostoCatalogoRepuesto(p.id) || 0),
              );
            }
            if (!costo && p) {
              const item =
                ECONOMY_DATA && Array.isArray(ECONOMY_DATA.catalogoRepuestos)
                  ? ECONOMY_DATA.catalogoRepuestos.find(function (c) {
                      return (
                        c &&
                        c.especialidad ===
                          (p.especialidad || r.especialidadIdeal) &&
                        c.calidad === (p.calidad || "estandar")
                      );
                    })
                  : null;
              costo = item ? Math.max(0, Math.round(item.costo || 0)) : 400;
            }
            return acc + Math.max(0, costo);
          }, 0);
          let txtPiezasPendientes =
            piezasPendientesCantidad === 1
              ? "Se necesita 1 pieza para continuar."
              : "Se necesitan " +
                piezasPendientesCantidad +
                " piezas para continuar.";
          txtPiezasPendientes +=
            " Costo: RD$" + Math.max(0, Math.round(costoPendiente)) + ".";
          pedidoDeliveryHtml =
            '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;">' +
            '<span class="flow-case-tag warn">' +
            txtPiezasPendientes +
            "</span>" +
            "</div>";
        }

        const esDiagnosticoTerminado = r.tipoTrabajo === "diagnostico_completado";
        const accionDiagnostico = esDiagnosticoTerminado
          ? `<button class="btn btn-cobrar-caso" onclick="event.stopPropagation(); revisarDiagnosticoMecanicoLista('${idCasoSafe}')">Revisar diagnóstico</button>`
          : "";
        const accionPrincipal = !esDiagnosticoTerminado && (workflow.listo || r.listoParaCobro)
          ? `<button class=\"btn btn-cobrar-caso\" onclick=\"sfxSuccess && sfxSuccess(); ${r.resultadoVisible ? `cobrarOCerrarCasoListo('${idCasoSafe}', this)` : `abrirResultadoOCobrarCaso('${idCasoSafe}')`}\">${r.resultadoVisible ? "Cerrar caso" : "Ver resultado"}</button>`
          : "";
        const accionPiezas = r.pausadaPorPieza && !workflow.entregaActiva
          ? `<button class=\"btn\" onclick=\"sfxConfirm && sfxConfirm(); event.stopPropagation(); tocarCasoReparacionConDelivery('${idCasoSafe}')\">${r.pedidoPendienteDelivery ? "Confirmar envio" : "Pedir piezas"}</button>`
          : "";
        const accionesCaso = [accionDiagnostico, accionPrincipal, accionPiezas].filter(Boolean).join("");

        return `<article class="${clasesTarjeta}" data-id-caso="${esc(idCaso || "CASO-0000")}" style="margin-bottom: 12px; position: relative;" ${dropDeliveryAttrs} ${tapDeliveryAttrs}>
            <header class="active-case-header">
              <div class="repair-card-main">
                <span class="case-id">${esc(r.idCaso || "CASO-0000")}</span>
                <span class="case-client">${esc(r.clienteNombre || "Cliente")}</span>
              </div>
              ${tipoTag}
            </header>
            <div class="case-tag-row">${ritmoBadges}</div>
            <div class="active-case-details" style="margin-top: 8px;">
              <div class="repair-status-line">
                <span class="flow-case-tag ${workflow.clase}">${workflow.estado}</span>
                <span class="case-worker-percent">${workflow.progresoPrincipal}%</span>
              </div>
              ${barraPrincipal}
              <div class="repair-progress-meta">
                <span>${esc(vehiculo)}</span>
                <span>${esc(workflow.detalleEstado || `ETA ${formatearTemporizadorTrabajo(workflow.restante)}`)}</span>
              </div>
              ${tarjetaTrabajo}
              ${tarjetaDelivery}
              ${pedidoDeliveryHtml}
            </div>
            <div class="active-case-actions repair-card-actions" style="margin-top: 10px;">
              ${accionesCaso}
            </div>
          </article>`;
      })
      .join("");
  } catch (err) {
    console.error("Error al renderizar panel de reparaciones:", err);
  }
}
// <--- CIERRE DE LA FUNCIÓN DE RENDERIZADO DE TARJETA DE REPARACIÓN

// Mostrar modal personalizado reutilizando el sistema de modales existente
function mostrarModalPersonalizado(html) {
  let modal = document.getElementById("modal-detalle-caso");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "modal-detalle-caso";
    modal.className = "modal-overlay flow-modal";
    modal.innerHTML = `<div class='modal-content'></div>`;
    document.body.appendChild(modal);
  }
  modal.querySelector(".modal-content").innerHTML = html;
  modal.classList.remove("hidden");
  modal.style.display = "block";
  if (typeof sincronizarPausaJuego === "function") {
    sincronizarPausaJuego();
  }
  // Cerrar modal al hacer click fuera del contenido
  modal.onclick = function (e) {
    if (e.target === modal) cerrarModal();
  };
}

function abrirModalDetalleCasoReparacion(idx) {
  if (!Array.isArray(reparacionesActivas) || idx < 0 || idx >= reparacionesActivas.length) return;
  const caso = reparacionesActivas[idx];
  let html = `<div class='modal-detalle-caso'>
      <h2>Detalle del Caso en Reparacion</h2>
      <div><strong>ID Caso:</strong> ${caso.idCaso || ""}</div>
      <div><strong>Cliente:</strong> ${caso.clienteNombre || caso.personaNombre || ""}</div>
      <div><strong>Vehículo:</strong> ${caso.vehiculo || ""}</div>
      <div><strong>Mecanico:</strong> ${caso.mecanicoNombre || ""}</div>
      <div><strong>Estado:</strong> ${caso.listoParaCobro ? "Listo para cobro" : caso.pausadaPorPieza ? "Pausado por pieza" : "En proceso"}</div>
      <div style='margin-top:16px;text-align:right;'><button class='btn' onclick='cerrarModal()'>Cerrar</button></div>
  </div>`;
  mostrarModalPersonalizado(html);
}

// Cerrar modal personalizado
function cerrarModal() {
  if (pantallaActiva === "oficina" || pantallaActiva === "configuracion")
    lugarActual = "Oficina";
  else if (pantallaActiva === "exterior" || pantallaActiva === "mapa")
    lugarActual = "Exterior";
  else lugarActual = "Taller";
  if (typeof actualizarFondoJuego === "function") actualizarFondoJuego();

  [
    "modal-notificacion-capitulo",
    "modal-repuestos",
    "modal-comida",
    "modal-cajab",
    "modal-tienda",
    "modal-delivery-gestion",
    "modal-tienda-tactica",
    "modal-tirada",
    "modal-banco",
    "modal-bar",
    "modal-mecanicos",
    "modal-equipo-of",
    "modal-contratar",
    "modal-decision",
    "modal-ayuda",
    "modal-cliente",
    "modal-inspeccion",
    "modal-opciones",
    "modal-editor-ui",
    "modal-pausa",
    "modal-historial",
    "modal-oficina-dx",
    "modal-historia-dia",
    "modal-resultado-reparacion",
    "modal-dx-fallo",
    "modal-inversiones",
    "modal-proyecto-muscle",
    "modal-dueno",
    "modal-detalle-caso",
  ].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.classList.add("hidden");
    if (id === "modal-detalle-caso") {
      el.style.display = "none";
    }
  });

  if (tiradaKeyHandler) {
    document.removeEventListener("keydown", tiradaKeyHandler);
    tiradaKeyHandler = null;
  }

  if (window.bancoEventoPendiente) {
    var pendienteBanco = window.bancoEventoPendiente;
    window.bancoEventoPendiente = null;
    setTimeout(function () {
      mostrarEventoBancoModal("pendiente", pendienteBanco);
    }, 60);
  }

  if (typeof sincronizarPausaJuego === "function") {
    sincronizarPausaJuego();
  }
}

function renderizarPendientesDiagnostico() {
  const cont = document.getElementById("lista-pendientes-diagnostico");
  if (!cont) return;
  if (!Array.isArray(casosPendientesDiagnostico))
    casosPendientesDiagnostico = [];
  const esc =
    typeof ofDxEscapar === "function"
      ? ofDxEscapar
      : function (v) {
          return String(v || "");
        };

  if (!casosPendientesDiagnostico.length) {
    cont.innerHTML =
      '<div class="flow-case-empty">Sin casos pendientes en buffer.</div>';
    return;
  }

  cont.innerHTML = casosPendientesDiagnostico
    .map(function (c, idx) {
      if (typeof asegurarIdCasoCliente === "function") asegurarIdCasoCliente(c);
      const nombreVisible =
        c && c.personaNombre ? c.personaNombre : obtenerNombreVisibleCliente(c);
      const idCaso = c && c.idCaso ? c.idCaso : "CASO-0000";
      const vehiculo = c && c.vehiculo ? c.vehiculo : "Vehiculo sin ficha";
      const pago = Math.max(0, Math.round((c && c.pago) || 0));
      const relato = esc(
        limpiarHtmlBasico(
          (c && c.declaracionCliente) || "Sin relato tecnico aun.",
        ),
      );
    return construirTarjetaCasoLista({
      origen: 'pending-dx',
        esc: esc,
        claseExtra: "queue-card flow-case-dx",
        idCaso: idCaso,
        nombre: nombreVisible,
        etiquetaPrincipal: "DX",
        etiquetaPrincipalClase: "warn",
        etiquetaEstado: "Pendiente",
        etiquetaEstadoClase: "warn",
        vehiculo: vehiculo,
        metaSecundaria: `RD$${pago}`,
        detalleLabel: "Relato",
        detalleTexto: relato,
        nota: "Expediente listo para tomarlo o revisarlo antes de abrir mesa.",
        badgesHtml: construirBadgesRitmoCaso(c),
        accionesHtml:
          `<button class="btn btn-compact-queue" onclick="abrirModalInfoExpandidaCaso(casosPendientesDiagnostico[${idx}], 'Detalle del Caso Pendiente')">Expandir</button>`,
      });
    })
    .join("");
}
// Modal de detalle para casos pendientes de diagnóstico
function abrirModalDetalleCasoPendienteDx(idx) {
  if (
    !Array.isArray(casosPendientesDiagnostico) ||
    idx < 0 ||
    idx >= casosPendientesDiagnostico.length
  )
    return;
  const caso = casosPendientesDiagnostico[idx];
  let sugerencia = "";
  if (typeof obtenerSugerenciaCaso === "function") {
    sugerencia = obtenerSugerenciaCaso(caso);
  } else {
    sugerencia = "No hay sugerencia disponible.";
  }
  let html = `<div class='modal-detalle-caso'>
        <h2>Detalle del Caso Pendiente</h2>
        <div><strong>ID Caso:</strong> ${caso.idCaso || ""}</div>
        <div><strong>Cliente:</strong> ${caso.personaNombre || obtenerNombreVisibleCliente(caso) || ""}</div>
        <div><strong>Vehículo:</strong> ${caso.vehiculo || ""}</div>
        <div><strong>Pago:</strong> RD$${Math.max(0, Math.round((caso && caso.pago) || 0))}</div>
        <div><strong>Relato:</strong> ${limpiarHtmlBasico((caso && caso.declaracionCliente) || "Sin relato tecnico aun.")}</div>
        <div style='margin-top:10px;'><strong>Sugerencia:</strong> <span>${sugerencia}</span></div>
        <div style='margin-top:16px;text-align:right;'><button class='btn' onclick='sfxMenuClose && sfxMenuClose(); cerrarModal()'>Cerrar</button></div>
    </div>`;
  mostrarModalPersonalizado(html);
}

function enviarClienteAPendientesDiagnostico(index) {
  if (!Array.isArray(clientesEnEspera) || index < 0 || index >= clientesEnEspera.length)
    return false;
  const caso = clientesEnEspera.splice(index, 1)[0];
  if (!caso) return false;
  if (typeof asegurarIdCasoCliente === "function") asegurarIdCasoCliente(caso);
  if (typeof asegurarDiagnosticoJugador === "function")
    asegurarDiagnosticoJugador(caso);
  asegurarExpedienteInspeccion(caso);

  if (!Array.isArray(casosPendientesDiagnostico))
    casosPendientesDiagnostico = [];
  casosPendientesDiagnostico = casosPendientesDiagnostico.filter(function (c) {
    return !!c && c.idCaso !== caso.idCaso;
  });
  casosPendientesDiagnostico.push(caso);
  panelLateralActivo = "pending-dx";

  log(`Caso ${caso.idCaso || "CASO-0000"} enviado al buffer de casos.`, "info");
  if (typeof mostrarFeedbackGameplay === "function") {
    mostrarFeedbackGameplay(
      `Caso ${caso.idCaso || "CASO-0000"} movido a buffer de casos.`,
      "ok",
    );
  }
  actualizarUI();
  return true;
}

function activarPendienteDiagnostico(
  index,
  abrirDxModal = false,
  mantenerPantallaActual = false,
) {
  if (
    !Array.isArray(casosPendientesDiagnostico) ||
    index < 0 ||
    index >= casosPendientesDiagnostico.length
  )
    return false;
  if (
    typeof estaCupoDiarioCompleto === "function"
      ? estaCupoDiarioCompleto(reparacionesActivas.length)
      : clientesHoy + reparacionesActivas.length >= (window.CLIENTES_POR_DIA || 10)
  ) {
    log(
      "Capacidad operativa llena. Finaliza o cobra un caso para continuar.",
      "error",
    );
    return false;
  }

  if (clienteActual) {
    const idActivo = clienteActual.idCaso || "CASO-0000";
    const enElevador = (reparacionesActivas || []).some(function (r) {
      return r && r.idCaso === idActivo;
    });

    if (!enElevador) {
      // Si el caso no está aprobado aún (en diagnóstico), lo parqueamos de vuelta a pendientes
      if (!clienteActual.aprobacionCliente) {
        if (!Array.isArray(casosPendientesDiagnostico))
          casosPendientesDiagnostico = [];
        casosPendientesDiagnostico = casosPendientesDiagnostico.filter(
          function (c) {
            return !(c && c.idCaso === idActivo);
          },
        );
        casosPendientesDiagnostico.push(clienteActual);
        log(`Caso ${idActivo} parqueado de vuelta a Pendientes DX.`, "info");
      } else {
        const estadoActivo =
          clienteActual.esVIP && !clienteActual.piezaInstalada
            ? "falta_pieza"
            : "listo_asignacion";
        if (typeof actualizarCasoAtendido === "function") {
          actualizarCasoAtendido(
            clienteActual,
            estadoActivo,
            "Caso estacionado por cambio de atencion a otro cliente.",
          );
        }
      }
    }

    if (typeof cerrarModal === "function") cerrarModal();
    clienteActual = null;
  }

  if (!consumirFoco("gestionarCola")) return false;

  clienteActual = casosPendientesDiagnostico.splice(index, 1)[0];
  if (!clienteActual) return false;
  marcarOrigenCasoActivo(clienteActual, "mi-puesto");
  if (typeof asegurarIdCasoCliente === "function")
    asegurarIdCasoCliente(clienteActual);
  if (typeof limpiarCasoDeColaYPendientes === "function")
    limpiarCasoDeColaYPendientes(clienteActual.idCaso || "");
  if (typeof aplicarBonoDiagnosticoSiguienteCaso === "function")
    aplicarBonoDiagnosticoSiguienteCaso(clienteActual);
  if (typeof asegurarDiagnosticoJugador === "function")
    asegurarDiagnosticoJugador(clienteActual);
  if (typeof asegurarExpedienteInspeccion === "function") {
    asegurarExpedienteInspeccion(clienteActual);
  }
  if (typeof ofDxAsegurarEstadoCaso === "function") {
    ofDxAsegurarEstadoCaso(clienteActual);
  }

  tiempoCliente = Math.max(
    4,
    Math.round(12 * (clienteActual.pacienciaCola / 100)),
  );
  estrategiaCliente = "balanceado";

  const idCaso = clienteActual.idCaso || "CASO-0000";
  log(`Caso ${idCaso} activo en mesa de diagnostico.`, "info");
  if (typeof mostrarFeedbackGameplay === "function") {
    mostrarFeedbackGameplay(
      `Caso ${idCaso} abierto en el panel de diagnostico personal.`,
      "ok",
    );
  }

  mostrarStamp("EN ANALISIS", "ok");
  consumirTurno("gestion de cola", COSTOS_TURNO.gestionarCola);
  if (!mantenerPantallaActual && typeof navegarPantalla === "function")
    navegarPantalla("taller");
  if (!mantenerPantallaActual) {
    seleccionarPuestoTaller("mi-puesto");
    setTimeout(function () {
      if (typeof enfocarElementoUI === "function") {
        enfocarElementoUI("active-case-card");
      }
    }, 40);
  }
  return true;
}

function devolverPendienteDiagnosticoACola(index) {
  if (
    !Array.isArray(casosPendientesDiagnostico) ||
    index < 0 ||
    index >= casosPendientesDiagnostico.length
  )
    return false;
  const caso = casosPendientesDiagnostico.splice(index, 1)[0];
  if (!caso) return false;
  if (!window.clientesEnEspera) window.clientesEnEspera = [];
  window.clientesEnEspera.push(caso);
  log(`Caso ${caso.idCaso || "CASO-0000"} devuelto a cola de espera.`, "info");
  if (typeof mostrarFeedbackGameplay === "function") {
    mostrarFeedbackGameplay(
      `Caso ${caso.idCaso || "CASO-0000"} regreso a cola.`,
      "warn",
    );
  }
  actualizarUI();
  return true;
}

function rechazarCasoColaContextual(idCaso) {
  var idx = Array.isArray(clientesEnEspera) ? clientesEnEspera.findIndex(function(c){ return c && String(c.idCaso) === String(idCaso); }) : -1;
  if (idx < 0) return false;
  clientesEnEspera.splice(idx, 1); cerrarModal(); mostrarFeedbackGameplay("Caso " + idCaso + " retirado de la cola.", "warn"); actualizarUI(); return true;
}
function diagnosticarCasoColaContextual(idCaso) { cerrarModal(); return abrirCasoParaDiagnostico("queue", idCaso); }
function dxRapidoCasoColaContextual(idCaso) {
  var mejor = -1, score = -Infinity;
  (mecanicos || []).forEach(function(m, i) { var activos = (reparacionesActivas || []).filter(function(r){ return r && r.mecanicoNombre === m.nombre && !r.listoParaCobro; }).length; var cap = Math.max(1, Number(m.capacidadCasosSimultaneos)||1); if (activos < cap && !(m.enfriamientoTurnos > 0) && !(m.bloqueoAyudaTurnos > 0)) { var s=(Number(m.habilidad)||0)+(Number(m.velocidad)||0)+(Number(m.eficiencia)||0); if(s>score){score=s;mejor=i;} } });
  if (mejor < 0) { cerrarModal(); mostrarFeedbackGameplay("No hay mecanicos disponibles para DX rapido.", "warn"); return false; }
  cerrarModal(); return intentarAsignarCasoListaAMecanico("queue", idCaso, mejor);
}
function renderizarColaEspera() {
  const cont = document.getElementById("lista-cola-espera") || document.getElementById("queue-list");
  if (!cont) return;
  if (!Array.isArray(casosPendientesDiagnostico))
    casosPendientesDiagnostico = [];
  // cupoCompleto eliminado: ya no hay límite diario ni CLIENTES_POR_DIA
  const cupoCompleto = false;
  const esc =
    typeof ofDxEscapar === "function"
      ? ofDxEscapar
      : function (v) {
          return String(v || "");
        };

  const idsEnTrabajo = new Set(
    Array.isArray(reparacionesActivas)
      ? reparacionesActivas
          .map(function (r) {
            return r && r.idCaso ? String(r.idCaso) : "";
          })
          .filter(Boolean)
      : []
  );
  const idCasoActivo = clienteActual && clienteActual.idCaso
    ? String(clienteActual.idCaso)
    : "";
  if (Array.isArray(casosPendientesDiagnostico)) {
    casosPendientesDiagnostico = casosPendientesDiagnostico.filter(function (c) {
      return !(c && c.idCaso && idsEnTrabajo.has(String(c.idCaso)));
    });
  }
  if (Array.isArray(clientesEnEspera)) {
    clientesEnEspera = clientesEnEspera.filter(function (c) {
      return !(c && c.idCaso && idsEnTrabajo.has(String(c.idCaso)));
    });
  }
  const pendientesVisibles = Array.isArray(casosPendientesDiagnostico)
    ? casosPendientesDiagnostico
        .map(function (c, idx) {
          return { c: c, idx: idx };
        })
        .filter(function (item) {
          return !(
            item &&
            item.c &&
            item.c.idCaso &&
            (idsEnTrabajo.has(String(item.c.idCaso)) ||
              (idCasoActivo && String(item.c.idCaso) === idCasoActivo))
          );
        })
    : [];
  const colaVisible = Array.isArray(clientesEnEspera)
    ? clientesEnEspera
        .map(function (c, idx) {
          return { c: c, idx: idx };
        })
        .filter(function (item) {
          return !(
            item &&
            item.c &&
            item.c.idCaso &&
            (idsEnTrabajo.has(String(item.c.idCaso)) ||
              (idCasoActivo && String(item.c.idCaso) === idCasoActivo))
          );
        })
    : [];

  if (!colaVisible.length && !pendientesVisibles.length) {
    cont.innerHTML = `<div class="flow-case-empty">${cupoCompleto ? "Capacidad operativa llena por ahora. Sin clientes en cola." : "No hay clientes en cola."}<button class="btn btn-primary case-accept-btn" type="button" onclick="recibirSiguienteClienteTaller()">RECIBIR SIGUIENTE CLIENTE</button><small>Sin coste. Genera una nueva solicitud para continuar el taller.</small></div>`;
    return;
  }

  const pendientesHtml = pendientesVisibles
    .map(function (item) {
      const c = item.c;
      const idx = item.idx;
      if (typeof asegurarIdCasoCliente === "function") asegurarIdCasoCliente(c);
      const nombreVisible =
        c && c.personaNombre ? c.personaNombre : obtenerNombreVisibleCliente(c);
      const idCaso = c && c.idCaso ? c.idCaso : "CASO-0000";
      const idCasoSafe = String(idCaso).replace(/'/g, "\\'");
      const vehiculo = c && c.vehiculo ? c.vehiculo : "Vehiculo sin ficha";
      const pago = Math.max(0, Math.round((c && c.pago) || 0));
      const relato = esc(
        limpiarHtmlBasico(
          (c && c.declaracionCliente) || "Sin relato tecnico aun.",
        ),
      );
      return construirTarjetaCasoLista({
        origen: 'pending-dx',
        caso: c,
        esc: esc,
        claseExtra: "active-case-card queue-card flow-case-dx",
        atributos:
          `onclick="tocarCasoListaConMecanico('pending-dx','${idCasoSafe}')" ondragover="permitirDropMecanicoEnCasoLista(event)" ondragleave="event.currentTarget.classList.remove('drop-target')" ondrop="soltarMecanicoEnCasoLista(event, 'pending-dx', '${idCasoSafe}')" style="margin-bottom: 12px; cursor: pointer; border-left: 3px solid #e67e22;"`,
        idCaso: idCaso,
        nombre: nombreVisible,
        etiquetaPrincipal: "DX",
        etiquetaPrincipalClase: "warn",
        etiquetaEstado: "Pendiente",
        etiquetaEstadoClase: "warn",
        vehiculo: vehiculo,
        metaSecundaria: `RD$${pago}`,
        detalleLabel: "Relato",
        detalleTexto: relato,
        nota: "Toma el expediente o devuelvelo a la cola si todavia no quieres abrirlo.",
        badgesHtml: construirBadgesRitmoCaso(c),
        accionesHtml:
          ``,
      });
    })
    .join("");

  const colaHtml = colaVisible
    .map((item, pos) => {
      const c = item.c;
      const idx = item.idx;
      if (typeof asegurarIdCasoCliente === "function") asegurarIdCasoCliente(c);
      asegurarExpedienteInspeccion(c);
      const prioridadTxt = Math.max(0, Math.ceil(c.pacienciaCola / 10));
      const paciencia = Math.max(0, Math.min(100, Math.round(Number(c.pacienciaCola) || 0)));
      const nivelEspera = paciencia > 60 ? '🟢 Estable' : (paciencia > 30 ? '🟡 En espera' : '🔴 Por irse');
      const pacienciaHtml = `<div class="case-patience" aria-label="Paciencia del cliente: ${paciencia}%"><div class="case-patience-head"><strong>${nivelEspera}</strong><span>${paciencia}%</span></div><div class="case-patience-track"><span style="width:${paciencia}%"></span></div></div>`;
      const urgenciaClase = obtenerClaseUrgencia(c.pacienciaCola);
      const nombreVisible = obtenerNombreVisibleCliente(c);
      const idCaso = c.idCaso || "CASO-0000";
      const idCasoSafe = String(idCaso).replace(/'/g, "\\'");
      const vehiculo = c.vehiculo || "Vehiculo sin ficha";
      const relato = limpiarHtmlBasico(
        c.declaracionCliente || c.miniHistoriaTexto || "Sin relato de averia.",
      );
      const btnAtender = cupoCompleto
      ? `<button class="btn expand-case-btn" disabled>Tomar</button>`
      : `<button class="btn expand-case-btn" disabled>Tomar</button>`;
      const btnUp =
        pos > 0
        ? `<button class=\"btn expand-case-btn\" onclick=\"sfxClick && sfxClick(); event.stopPropagation();moverClienteCola(${idx}, -1)\">Subir</button>`
          : "";
      const btnDown =
        pos < colaVisible.length - 1
        ? `<button class=\"btn expand-case-btn\" onclick=\"sfxClick && sfxClick(); event.stopPropagation();moverClienteCola(${idx}, 1)\">Bajar</button>`
          : "";
      const btnExpandir = `<button class=\"btn expand-case-btn\" onclick=\"sfxMenuOpen && sfxMenuOpen(); event.stopPropagation();abrirModalDetalleCasoCola(${idx})\">Expandir</button>`;
      const claseUrgenciaTag =
        urgenciaClase === "urgencia-rojo"
          ? "warn"
          : urgenciaClase === "urgencia-amarillo"
            ? "info"
            : "ok";
      return construirTarjetaCasoLista({
        origen: 'queue',
        caso: c,
        esc: esc,
        claseExtra: `active-case-card queue-card flow-case-queue ${urgenciaClase}`,
        atributos:
          `draggable="true" onclick="tocarCasoListaConMecanico('queue','${idCasoSafe}')" ondragstart="iniciarArrastreClienteCola(event, ${idx})" ondragend="finalizarArrastreCliente(event)" ondragover="permitirDropMecanicoEnCasoLista(event)" ondragleave="event.currentTarget.classList.remove('drop-target')" ondrop="soltarMecanicoEnCasoLista(event, 'queue', '${idCasoSafe}')" style="margin-bottom: 12px; cursor: pointer;"`,
        idCaso: idCaso,
        nombre: nombreVisible,
        etiquetaPrincipal: "COLA",
        etiquetaPrincipalClase: "info",
        etiquetaEstado: `Prioridad ${prioridadTxt}`,
        etiquetaEstadoClase: claseUrgenciaTag,
        vehiculo: vehiculo,
        metaSecundaria: `RD$${Math.max(0, Math.round(c.pago || 0))}`,
        metaExtra: cupoCompleto
          ? "Sin cupo"
          : (evaluarEconomiaCaso(c).neto < 0 && !c.perdidaAceptada
            ? "Negociar antes de asignar"
            : "Disponible"),
        detalleLabel: "Relato",
        detalleTexto: relato,
        nota: "Reordena la fila, abre detalle o toma el caso directo al puesto.",
        badgesHtml: construirBadgesRitmoCaso(c),
        pacienciaHtml: pacienciaHtml,
        accionesHtml: `${btnAtender}${btnUp}${btnDown}${btnExpandir}`,
      });
    })
    .join("");
  // Modal de detalle para casos en cola de clientes
  function abrirModalDetalleCasoCola(idx) {
// Exportar globalmente fuera de la función para evitar redefinición y asegurar disponibilidad
if (typeof window !== 'undefined') {
  window.abrirModalDetalleCasoCola = abrirModalDetalleCasoCola;
}

var colaLongPressTimer = 0;
var colaLongPressTarget = null;
function abrirMenuCasoColaDesdeGesto(idCaso) {
  var caso = Array.isArray(clientesEnEspera) ? clientesEnEspera.find(function(c){ return c && String(c.idCaso) === String(idCaso); }) : null;
  if (!caso) return;
  var safe = String(idCaso).replace(/'/g, "\\'");
  mostrarModalPersonalizado(`<div class="modal-content caso-contextual-modal"><h3>ACCIONES · ${limpiarHtmlBasico(idCaso)}</h3><p><strong>${limpiarHtmlBasico(obtenerNombreVisibleCliente(caso))}</strong><br>${limpiarHtmlBasico(caso.vehiculo || "Vehiculo sin ficha")}</p><div class="caso-contextual-actions"><button class="btn btn-danger" onclick="rechazarCasoColaContextual('${safe}')">Rechazar caso</button><button class="btn" onclick="diagnosticarCasoColaContextual('${safe}')">Diagnosticar caso</button><button class="btn btn-primary" onclick="dxRapidoCasoColaContextual('${safe}')">DX rapido</button><button class="btn" onclick="cerrarModal()">Cancelar</button></div></div>`);
}
function rechazarCasoColaContextual(idCaso) {
  var idx = Array.isArray(clientesEnEspera) ? clientesEnEspera.findIndex(function(c){ return c && String(c.idCaso) === String(idCaso); }) : -1;
  if (idx < 0) return false;
  clientesEnEspera.splice(idx, 1);
  cerrarModal(); mostrarFeedbackGameplay("Caso " + idCaso + " rechazado y retirado de la cola.", "warn"); actualizarUI(); return true;
}
function diagnosticarCasoColaContextual(idCaso) {
  cerrarModal(); return abrirCasoParaDiagnostico("queue", idCaso);
}
function dxRapidoCasoColaContextual(idCaso) {
  var mejor = -1, mejorPuntaje = -Infinity;
  (mecanicos || []).forEach(function(m, idx) {
    var ocupado = typeof obtenerTrabajoAsignadoMecanico === "function" ? obtenerTrabajoAsignadoMecanico(m.nombre) : null;
    var capacidad = Math.max(1, Number(m.capacidadCasosSimultaneos) || 1);
    var activos = Array.isArray(reparacionesActivas) ? reparacionesActivas.filter(function(r){ return r && r.mecanicoNombre === m.nombre && !r.listoParaCobro; }).length : (ocupado ? 1 : 0);
    // DX rápido solo considera mecánicos realmente aptos: sin carga, sin
    // enfriamiento y con estado suficiente para aceptar otro diagnóstico.
    var humorApto = typeof calcularHumorEfectivo === "function"
      ? Number(calcularHumorEfectivo(m)) >= 6
      : Number(m.enojo || 0) < 4;
    if (activos >= capacidad || Number(m.enfriamientoTurnos || 0) > 0 || Number(m.bloqueoAyudaTurnos || 0) > 0 || Number(m.enojo || 0) >= 4 || !humorApto) return;
    var puntaje = (Number(m.habilidad)||0) + (Number(m.velocidad)||0) + (Number(m.eficiencia)||0) - ((Number(m.enojo)||0)*.08);
    if (puntaje > mejorPuntaje) { mejorPuntaje = puntaje; mejor = idx; }
  });
  if (mejor < 0) { cerrarModal(); mostrarFeedbackGameplay("NO HAY MECÁNICOS DISPONIBLES para DX rápido. Todos están ocupados, en enfriamiento o necesitan atención.", "warn"); return false; }
  cerrarModal();
  var resultado = intentarAsignarCasoListaAMecanico("queue", idCaso, mejor);
  if (resultado) {
    var trabajoDxRapido = (reparacionesActivas || []).find(function(r) {
      return r && String(r.idCaso || "").trim() === String(idCaso || "").trim();
    });
    if (trabajoDxRapido) trabajoDxRapido.dxRapido = true;
  }
  if (!resultado) mostrarFeedbackGameplay("NO HAY MECÁNICOS DISPONIBLES para completar DX rápido.", "warn");
  return resultado;
}

function mostrarNotificacionCapitulo(entrada) {
  var data = entrada && typeof entrada === 'object' ? entrada : {};
  capituloNotificacionPendiente = {
    tipo: String(data.tipo || 'capitulo'),
    id: String(data.id || 'entrada-' + Date.now()),
    titulo: String(data.titulo || 'Nueva entrada del diario'),
    texto: String(data.texto || 'El taller acaba de entrar en una nueva etapa.'),
    meta: String(data.meta || 'Diario del taller')
  };
  var titulo = document.getElementById('capitulo-notificacion-titulo');
  var meta = document.getElementById('capitulo-notificacion-meta');
  var texto = document.getElementById('capitulo-notificacion-texto');
  if (titulo) titulo.textContent = capituloNotificacionPendiente.titulo;
  if (meta) meta.textContent = capituloNotificacionPendiente.meta;
  if (texto) texto.textContent = capituloNotificacionPendiente.texto;
  var modal = document.getElementById('modal-notificacion-capitulo');
  if (modal) modal.classList.remove('hidden');
  if (typeof sincronizarPausaJuego === 'function') sincronizarPausaJuego();
  return true;
}

function aceptarCapituloNotificacion() {
  var entrada = capituloNotificacionPendiente;
  if (!entrada) return false;
  if (typeof tramaEstado === 'object' && tramaEstado) {
    if (!Array.isArray(tramaEstado.capitulosAsumidos)) tramaEstado.capitulosAsumidos = [];
    if (tramaEstado.capitulosAsumidos.indexOf(entrada.id) < 0) tramaEstado.capitulosAsumidos.push(entrada.id);
  }
  var modal = document.getElementById('modal-notificacion-capitulo');
  if (modal) modal.classList.add('hidden');
  capituloNotificacionPendiente = null;
  if (typeof log === 'function') log('Capítulo asumido: ' + entrada.titulo, 'info');
  if (typeof mostrarFeedbackGameplay === 'function') mostrarFeedbackGameplay('Capítulo asumido. Sus consecuencias quedan activas en el taller.', 'ok');
  if (typeof autoGuardarPartidaSilenciosa === 'function') autoGuardarPartidaSilenciosa('capitulo-asumido');
  if (typeof sincronizarPausaJuego === 'function') sincronizarPausaJuego();
  return true;
}

if (typeof window !== "undefined") {
  window.mostrarNotificacionCapitulo = mostrarNotificacionCapitulo;
  window.aceptarCapituloNotificacion = aceptarCapituloNotificacion;
}
if (typeof window !== "undefined") {
  window.abrirMenuCasoColaDesdeGesto = abrirMenuCasoColaDesdeGesto;
  window.rechazarCasoColaContextual = rechazarCasoColaContextual;
  window.diagnosticarCasoColaContextual = diagnosticarCasoColaContextual;
  window.dxRapidoCasoColaContextual = dxRapidoCasoColaContextual;
}

if (typeof document !== "undefined") {
  document.addEventListener("click", function(e) {
    var card = e.target && e.target.closest ? e.target.closest("#lista-cola-espera .flow-case-queue") : null;
    if (card && card.dataset.longPressed === "true") { e.preventDefault(); e.stopImmediatePropagation(); card.dataset.longPressed = "false"; }
  }, true);
  document.addEventListener("pointerdown", function(e) {
    if (typeof esInteraccionMovil === "function" && !esInteraccionMovil()) return;
    var card = e.target && e.target.closest ? e.target.closest("#lista-cola-espera .flow-case-queue") : null;
    if (!card) return;
    colaLongPressTarget = card; var id = card.dataset.caseId || (card.querySelector("[data-case-id]") || {}).dataset?.caseId;
    if (!id) { var m = card.innerText.match(/CASO-\d+/i); id = m ? m[0] : ""; }
    colaLongPressTimer = window.setTimeout(function(){ card.dataset.longPressed="true"; abrirMenuCasoColaDesdeGesto(id); }, 600);
  }, {passive:true});
  ["pointerup","pointercancel","pointerleave"].forEach(function(ev){ document.addEventListener(ev, function(){ if (colaLongPressTimer) window.clearTimeout(colaLongPressTimer); }); });
}
    if (
      !Array.isArray(clientesEnEspera) ||
      idx < 0 ||
      idx >= clientesEnEspera.length
    )
      return;
    const caso = clientesEnEspera[idx];
    let sugerencia = "";
    if (typeof obtenerSugerenciaCaso === "function") {
      sugerencia = obtenerSugerenciaCaso(caso);
    } else {
      sugerencia = "No hay sugerencia disponible.";
    }
    let html = `<div class='modal-detalle-caso'>
        <h2>Detalle del Caso en Cola</h2>
        <div><strong>ID Caso:</strong> ${caso.idCaso || ""}</div>
        <div><strong>Cliente:</strong> ${caso.personaNombre || caso.clienteNombre || ""}</div>
        <div><strong>Vehículo:</strong> ${caso.vehiculo || ""}</div>
        <div><strong>Pago:</strong> RD$${Math.max(0, Math.round((caso && caso.pago) || 0))}</div>
        <div><strong>Estado:</strong> ${caso.estado || ""}</div>
        <div><strong>Relato:</strong> ${caso.declaracionCliente || caso.miniHistoriaTexto || "Sin relato técnico."}</div>
        <div style='margin-top:10px;'><strong>Sugerencia:</strong> <span>${sugerencia}</span></div>
        <div style='margin-top:16px;text-align:right;'><button class='btn' onclick='cerrarModal()'>Cerrar</button></div>
    </div>`;
    mostrarModalPersonalizado(html);
  }

  cont.innerHTML = `${pendientesHtml}${colaHtml}`;
}

function seleccionarClienteCola(
  index,
  abrirDxModal = false,
  mantenerPantallaActual = false,
) {
  if (clienteActual) {
    const idActivo = clienteActual.idCaso || "CASO-0000";
    const enElevador = (reparacionesActivas || []).some(function (r) {
      return r && r.idCaso === idActivo;
    });

    if (!enElevador) {
      // Si el caso no está aprobado (en diagnóstico), lo parqueamos a pendientes DX
      if (!clienteActual.aprobacionCliente) {
        if (!Array.isArray(casosPendientesDiagnostico))
          casosPendientesDiagnostico = [];
        casosPendientesDiagnostico = casosPendientesDiagnostico.filter(
          function (c) {
            return !(c && c.idCaso === idActivo);
          },
        );
        casosPendientesDiagnostico.push(clienteActual);
        log(
          `Caso ${idActivo} parqueado en Pendientes DX para poder atender otro.`,
          "info",
        );
      } else {
        const estadoActivo =
          clienteActual.esVIP && !clienteActual.piezaInstalada
            ? "falta_pieza"
            : "listo_asignacion";
        if (typeof actualizarCasoAtendido === "function") {
          actualizarCasoAtendido(
            clienteActual,
            estadoActivo,
            "Caso estacionado por cambio de atencion a otro cliente en cola.",
          );
        }
      }
    }

    log(
      `Cambiando atencion: ${idActivo} queda estacionado y tomas otro caso.`,
      "info",
    );
    if (typeof cerrarModal === "function") cerrarModal();
    clienteActual = null;
  }
  if (
    typeof estaCupoDiarioCompleto === "function"
      ? estaCupoDiarioCompleto(0)
      : clientesHoy >= (window.CLIENTES_POR_DIA || 10)
  ) {
    log("Capacidad operativa llena. Espera a liberar casos activos.", "error");
    mostrarStamp("RECHAZADO", "error");
    return;
  }
  if (!window.clientesEnEspera) window.clientesEnEspera = [];
  if (index < 0 || index >= window.clientesEnEspera.length) return;
  if (
    typeof estaCupoDiarioCompleto === "function"
      ? estaCupoDiarioCompleto((window.reparacionesActivas || []).length)
      : clientesHoy + (window.reparacionesActivas || []).length >= (window.CLIENTES_POR_DIA || 10)
  ) {
    log(
      "Capacidad operativa llena. Finaliza o cobra un caso para continuar.",
      "error",
    );
    return;
  }
  clienteActual = window.clientesEnEspera.splice(index, 1)[0];
  marcarOrigenCasoActivo(clienteActual, "mi-puesto");
  if (typeof asegurarIdCasoCliente === "function")
    asegurarIdCasoCliente(clienteActual);
  if (typeof limpiarCasoDeColaYPendientes === "function")
    limpiarCasoDeColaYPendientes(clienteActual.idCaso || "");
  if (typeof aplicarBonoDiagnosticoSiguienteCaso === "function")
    aplicarBonoDiagnosticoSiguienteCaso(clienteActual);
  if (typeof asegurarDiagnosticoJugador === "function")
    asegurarDiagnosticoJugador(clienteActual);
  if (typeof asegurarExpedienteInspeccion === "function")
    asegurarExpedienteInspeccion(clienteActual);
  if (typeof ofDxAsegurarEstadoCaso === "function")
    ofDxAsegurarEstadoCaso(clienteActual);
  tiempoCliente = Math.max(
    4,
    Math.round(12 * (clienteActual.pacienciaCola / 100)),
  );
  estrategiaCliente = "balanceado";
  const nombreVisible = obtenerNombreVisibleCliente(clienteActual);
  const idCaso = clienteActual.idCaso || "CASO-0000";
  log(
    `Seleccionaste ${idCaso}: ${nombreVisible}${clienteActual.esVIP ? " (VIP)" : ""}.`,
    "info",
  );
  mostrarFeedbackGameplay(
    `Caso ${idCaso} seleccionado. Ya puedes diagnosticarlo personalmente en el panel central.`,
    "ok",
  );
  mostrarStamp("EN ANALISIS", "ok");
  consumirTurno("gestion de cola", COSTOS_TURNO.gestionarCola);
  if (!mantenerPantallaActual && typeof navegarPantalla === "function")
    navegarPantalla("taller");
  if (!mantenerPantallaActual) {
    seleccionarPuestoTaller("mi-puesto");
    setTimeout(function () {
      if (typeof enfocarElementoUI === "function") {
        enfocarElementoUI("active-case-card");
      }
    }, 40);
  }
  return true;
}

function seleccionarClienteColaYDiagnosticar(index) {
  seleccionarClienteCola(index, false);
}

function moverClienteCola(index, direccion) {
  const nuevo = index + direccion;
  if (!window.clientesEnEspera) window.clientesEnEspera = [];
  if (index < 0 || index >= window.clientesEnEspera.length) return;
  if (nuevo < 0 || nuevo >= window.clientesEnEspera.length) return;
  if (!consumirFoco("gestionarCola")) return;
  const temp = window.clientesEnEspera[index];
  window.clientesEnEspera[index] = window.clientesEnEspera[nuevo];
  window.clientesEnEspera[nuevo] = temp;
  const nombreVisible = obtenerNombreVisibleCliente(window.clientesEnEspera[nuevo]);
  log(`Cola actualizada: ${nombreVisible} cambia prioridad.`, "info");
  mostrarFeedbackGameplay(
    `Prioridad cambiada en cola: ${nombreVisible}.`,
    "warn",
  );
  consumirTurno("reordenar cola", COSTOS_TURNO.gestionarCola);
}

// Log de mensajes global para la UI
var logMensajes = [];
function log(msg, tipo = "info") {
  let color =
    tipo === "exito" ? "#aaf0a7" : tipo === "error" ? "#ff9999" : "#e0d3b8";
  logMensajes.unshift(`<span style="color:${color}">> ${msg}</span>`);
  if (logMensajes.length > 30) logMensajes.pop();
  document.getElementById("log").innerHTML = logMensajes.join("<br>");
  renderizarNotificacionesVivas();
}
// ================================================================
//  SISTEMA DE 4 PANTALLAS
// ================================================================

let pantallaActiva = "taller";
window.casoAprobadoSeleccionadoMovil =
  window.casoAprobadoSeleccionadoMovil || "";
window.resultadoReparacionCasoId = window.resultadoReparacionCasoId || "";

// Estado del telefono
let telefonoContactoActivo = null;
let telefonoMensajes = {};
let telefonoContactos = [];
let telefonoFiltroActivo = "todos";
let telefonoBusquedaTexto = "";
let telefonoVista = "lista";
const LIMITE_CHAT_CLIENTE_DIA = 4;
const TEL_CONTACTO_CRONICA_ID = "cronica_barrio";
const TEL_CONTACTO_GRUPO_PREFIJO = "grupo_historia_";
const TELEFONO_SOLO_HISTORIAS = false;
let telefonoOpcionesEstado = {};
let telefonoNarrativaMarcadores = {};
let telefonoNarrativaPendientes = [];
let telefonoNarrativaFocusTimer = 0;

function valorDiaActualTelefono() {
  return typeof dia === "number" && dia > 0 ? dia : 1;
}

function obtenerHoraMensajeTelefono() {
  if (typeof obtenerHoraDelDiaTexto === "function")
    return obtenerHoraDelDiaTexto();
  return "09:00";
}

function normalizarTextoNarrativaTelefono(texto, limite) {
  var limpio = String(texto || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!limpio) return "";
  var max = Math.max(40, Math.round(limite || 320));
  if (limpio.length <= max) return limpio;
  return limpio.slice(0, max - 3) + "...";
}

function asegurarNarrativaTelefonoEstado() {
  if (
    !telefonoNarrativaMarcadores ||
    typeof telefonoNarrativaMarcadores !== "object"
  ) {
    telefonoNarrativaMarcadores = {};
  }
  return telefonoNarrativaMarcadores;
}

function normalizarClaveNarrativaTelefono(clave) {
  var raw = String(clave || "").trim();
  if (!raw) return "";
  return raw.replace(/[^a-zA-Z0-9:_-]/g, "_").slice(0, 140);
}

function asegurarEstadoOpcionesTelefono() {
  if (!telefonoOpcionesEstado || typeof telefonoOpcionesEstado !== "object") {
    telefonoOpcionesEstado = {};
  }
  return telefonoOpcionesEstado;
}

function obtenerEstadoOpcionesContactoTelefono(contactoId) {
  var contactoKey = String(contactoId || "").trim();
  if (!contactoKey) return { dia: valorDiaActualTelefono(), usadas: {} };
  var store = asegurarEstadoOpcionesTelefono();
  var actual = store[contactoKey];
  var diaActual = valorDiaActualTelefono();
  if (!actual || typeof actual !== "object") {
    actual = { dia: diaActual, usadas: {} };
    store[contactoKey] = actual;
  }
  if (actual.dia !== diaActual) {
    actual.dia = diaActual;
    actual.usadas = {};
  }
  if (!actual.usadas || typeof actual.usadas !== "object") actual.usadas = {};
  return actual;
}

function construirClaveOpcionTelefono(contactoId, opcion, indice) {
  var parteContacto = normalizarClaveNarrativaTelefono(
    contactoId || "contacto",
  );
  var parteAccion = normalizarClaveNarrativaTelefono(
    (opcion && opcion.accion) || "normal",
  );
  var parteTexto = normalizarClaveNarrativaTelefono(
    (opcion && opcion.texto) || "opcion_" + indice,
  );
  return normalizarClaveNarrativaTelefono(
    "opt:" +
      parteContacto +
      ":" +
      parteAccion +
      ":" +
      parteTexto +
      ":" +
      String(indice || 0),
  );
}

function aplicarEstadoOpcionesTelefono(
  contactoId,
  opciones,
  usarEstadoGenerico,
) {
  var lista = Array.isArray(opciones) ? opciones : [];
  var estado = usarEstadoGenerico
    ? obtenerEstadoOpcionesContactoTelefono(contactoId)
    : null;
  return lista.map(function (opcion, indice) {
        var clave = construirClaveOpcionTelefono(contactoId, opcion, indice);
        var bloqueada = !!(estado && estado.usadas && estado.usadas[clave]);
        return Object.assign({}, opcion, {
            claveOpcion: clave,
            bloqueada: bloqueada || opcion.bloqueada,
            motivoBloqueo: bloqueada ? 'Ya usaste esta opcion hoy' : (opcion.motivoBloqueo || '')
        });
  });
}

function marcarOpcionUsadaTelefono(contactoId, claveOpcion) {
  var clave = String(claveOpcion || "").trim();
  if (!contactoId || !clave) return;
  var estado = obtenerEstadoOpcionesContactoTelefono(contactoId);
  estado.usadas[clave] = true;
}

function asegurarContactoNarrativaTelefono() {
  upsertContactoTelefono({
    id: TEL_CONTACTO_CRONICA_ID,
    nombre: "Cronica Del Barrio",
    avatar: "📰",
    tipo: "personal",
  });
}

function normalizarIdSeguroTelefono(valor) {
  var raw = String(valor || "")
    .trim()
    .toLowerCase();
  if (!raw) return "";
  return raw.replace(/[^a-z0-9_-]/g, "_").slice(0, 72);
}

function limpiarParticipantesNarrativaTelefono(participantes) {
  if (!Array.isArray(participantes)) return [];
  var unicos = [];
  participantes.forEach(function (p) {
    var limpio = normalizarTextoNarrativaTelefono(p, 36);
    if (!limpio) return;
    if (unicos.indexOf(limpio) >= 0) return;
    unicos.push(limpio);
  });
  return unicos.slice(0, 5);
}

function obtenerParticipantesNarrativaPorDefecto(data) {
  var tipo = String((data && data.tipo) || "").toLowerCase();
  var evento = String((data && data.eventoId) || "").toLowerCase();
  if (tipo === "evento_turno") {
    var mapaEventos = {
      rivalidadinterna: ["Jefe", "Frandy", "Maicol"],
      inspector: ["Inspector Diaz", "Cronica Del Barrio"],
      proveedor: ["Flaca Parts", "Cronica Del Barrio"],
      cajarota: ["Banco Confianza", "Lic. Montero"],
      vipnervioso: ["Cliente VIP", "Jefe"],
      clientefiel: ["Cliente Fiel", "Cronica Del Barrio"],
    };
    if (mapaEventos[evento]) return mapaEventos[evento];
  }
  if (String(evento).indexOf("stewart") >= 0)
    return ["Stewart", "Cronica Del Barrio"];
  return [];
}

function construirGrupoNarrativoIdTelefono(data, participantes) {
  var base =
    normalizarIdSeguroTelefono((data && data.grupoId) || "") ||
    normalizarIdSeguroTelefono((data && data.eventoId) || "") ||
    normalizarIdSeguroTelefono((data && data.tipo) || "narrativa");
  if (!base) {
    base =
      normalizarIdSeguroTelefono((participantes || []).join("_")) || "historia";
  }
  return TEL_CONTACTO_GRUPO_PREFIJO + base;
}

function asegurarContactoGrupoNarrativoTelefono(
  data,
  participantes,
  fallbackNombre,
) {
  var miembros = limpiarParticipantesNarrativaTelefono(participantes);
  if (miembros.length <= 1)
    return String((data && data.contactoId) || TEL_CONTACTO_CRONICA_ID);

  var contactoId = construirGrupoNarrativoIdTelefono(data, miembros);
  var nombreBase = normalizarTextoNarrativaTelefono(
    (data && data.grupoNombre) || "",
    38,
  );
  if (!nombreBase) {
    var semilla =
      normalizarTextoNarrativaTelefono((data && data.titulo) || "", 26) ||
      normalizarTextoNarrativaTelefono((data && data.eventoId) || "", 26) ||
      normalizarTextoNarrativaTelefono(fallbackNombre || "", 26) ||
      "Historia";
    nombreBase = "Grupo " + semilla;
  }
  upsertContactoTelefono({
    id: contactoId,
    nombre: nombreBase,
    avatar: "👥",
    tipo: "grupo",
    participantes: miembros,
  });
  return contactoId;
}

function obtenerPendientesNarrativaTelefono() {
  if (!Array.isArray(telefonoNarrativaPendientes))
    telefonoNarrativaPendientes = [];
  return telefonoNarrativaPendientes;
}

function limpiarPendientesNarrativaTelefono() {
  telefonoNarrativaPendientes = obtenerPendientesNarrativaTelefono().filter(
    function (p) {
      return !!(p && !p.resuelta);
    },
  );
}

function obtenerConversacionNarrativaPendiente(contactoId) {
  limpiarPendientesNarrativaTelefono();
  var lista = obtenerPendientesNarrativaTelefono();
  for (var i = 0; i < lista.length; i++) {
    var p = lista[i];
    if (!p || p.resuelta) continue;
    if (contactoId && p.contactoId !== contactoId) continue;
    if (!p.bloqueante) continue;
    return p;
  }
  return null;
}

function obtenerContactoNombreTelefono(contactoId) {
  var contacto = (telefonoContactos || []).find(function (c) {
    return c && c.id === contactoId;
  });
  return contacto && contacto.nombre ? contacto.nombre : "Telefono";
}

function hayConversacionNarrativaBloqueanteActiva() {
  var pendiente = obtenerConversacionNarrativaPendiente("");
  if (!pendiente) return false;
  // Una historia sin respuestas disponibles es solo lectura y nunca debe
  // congelar el taller ni obligar al jugador a entrar al telefono.
  if (typeof obtenerOpcionesRespuestaNarrativaTelefono === "function") {
    return obtenerOpcionesRespuestaNarrativaTelefono(pendiente.contactoId).length > 0;
  }
  return false;
}

function programarFocoNarrativaPendiente(pendiente) {
  var objetivo = pendiente || obtenerConversacionNarrativaPendiente("");
  if (!objetivo || !objetivo.contactoId) return;
  if (
    pantallaActiva === "telefono" &&
    telefonoVista === "chat" &&
    telefonoContactoActivo === objetivo.contactoId
  ) {
    return;
  }
  if (telefonoNarrativaFocusTimer) {
    clearTimeout(telefonoNarrativaFocusTimer);
  }
  telefonoNarrativaFocusTimer = setTimeout(function () {
    telefonoNarrativaFocusTimer = 0;
    enfocarConversacionNarrativaPendiente(objetivo);
  }, 30);
}

function enfocarConversacionNarrativaPendiente(pendiente) {
  var objetivo = pendiente || obtenerConversacionNarrativaPendiente("");
  if (!objetivo || !objetivo.contactoId) return;
  if (telefonoNarrativaFocusTimer) {
    clearTimeout(telefonoNarrativaFocusTimer);
    telefonoNarrativaFocusTimer = 0;
  }
  telefonoFiltroActivo = "personal";
  telefonoBusquedaTexto = "";
  if (pantallaActiva !== "telefono" && typeof navegarPantalla === "function") {
    navegarPantalla("telefono");
  }
  setTimeout(function () {
    abrirChatTelefono(objetivo.contactoId);
  }, 30);
}

function registrarPendienteNarrativaTelefono(contactoId, clave, cfg) {
  var meta =
    cfg && cfg.metaNarrativa && typeof cfg.metaNarrativa === "object"
      ? cfg.metaNarrativa
      : {};
  var bloqueante = !!(cfg && cfg.bloqueante);
  if (!bloqueante) return;
  var pendientes = obtenerPendientesNarrativaTelefono();
  var yaHabiaBloqueante = pendientes.some(function (p) {
    return !!(p && !p.resuelta && p.bloqueante);
  });
  var existe = pendientes.some(function (p) {
    return !!(p && !p.resuelta && p.clave === clave);
  });
  if (existe) return;
  // Un contacto no debe encadenar dos bloqueos simultaneos. El mensaje nuevo
  // permanece en el chat, pero una sola respuesta destraba todo ese frente.
  var pendienteMismoContacto = pendientes.some(function (p) {
    return !!(p && !p.resuelta && p.bloqueante && p.contactoId === contactoId);
  });
  if (pendienteMismoContacto) return;
  pendientes.push({
    clave: clave || "narrativa:" + Date.now(),
    contactoId: contactoId,
    bloqueante: true,
    tipo: String(meta.tipo || "narrativa"),
    eventoId: String(meta.eventoId || ""),
    fase: String(meta.fase || ""),
    dia: Math.max(1, Math.round(meta.dia || valorDiaActualTelefono())),
    participantes: limpiarParticipantesNarrativaTelefono(
      meta.participantes || [],
    ),
    autorNombre: normalizarTextoNarrativaTelefono(meta.autorNombre || "", 36),
    resuelta: false,
    createdAt: Date.now(),
  });

  if (typeof sincronizarPausaJuego === "function") sincronizarPausaJuego();
  if (!yaHabiaBloqueante) {
    programarFocoNarrativaPendiente();
  }
}

function construirPanelHistoriaTelefono() {
  var panel = document.getElementById("tel-story-panel");
  if (!panel) return;

  var pendiente = obtenerConversacionNarrativaPendiente("");
  var snapshot =
    typeof obtenerHistoriaPrincipalSnapshot === "function"
      ? obtenerHistoriaPrincipalSnapshot()
      : null;

  if (!pendiente && !snapshot) {
    panel.classList.add("hidden");
    panel.innerHTML = "";
    return;
  }

  var chips = [];
  if (snapshot && Array.isArray(snapshot.meta)) {
    chips = snapshot.meta.slice(0, 2);
  }
  if (pendiente) {
    chips.unshift(
      "Respuesta requerida: " + obtenerContactoNombreTelefono(pendiente.contactoId),
    );
  }

  var resumen = snapshot
    ? [snapshot.objetivo, snapshot.riesgo].filter(Boolean).join(" ") || snapshot.trama || snapshot.frenteTexto || snapshot.progresoTexto
    : "Historia pendiente por responder.";
  var accionHtml = pendiente
    ? '<button class="btn tel-story-action" type="button" onclick="enfocarConversacionNarrativaPendiente()">Abrir historia pendiente</button>'
    : '<button class="btn tel-story-action" type="button" onclick="mostrarHistoriaPrincipalModal()">Ver resumen del arco</button>';

  panel.innerHTML =
    '<div class="tel-story-kicker"><span>' +
    escaparTextoTelefono((snapshot && snapshot.etiqueta) || "Historia activa") +
    '</span><span class="tel-story-status">' +
    escaparTextoTelefono(pendiente ? "Bloquea el flujo" : "Sin bloqueo") +
    '</span></div>' +
    '<h4 class="tel-story-title">' +
    escaparTextoTelefono((snapshot && snapshot.titulo) || "Historia principal") +
    '</h4>' +
    '<button class="tel-story-toggle" type="button" aria-expanded="false" onclick="toggleResumenHistoriaTelefono(this)">Ver contexto</button>' +
    '<div class="tel-story-copy">' +
    escaparTextoTelefono(String(resumen || "").slice(0, 180)) +
    '</div>' +
    '<div class="tel-story-meta">' +
    chips
      .slice(0, 3)
      .map(function (chip, idx) {
        return (
          '<span class="tel-story-chip' +
          (pendiente && idx === 0 ? " is-alert" : "") +
          '">' +
          escaparTextoTelefono(chip) +
          '</span>'
        );
      })
      .join("") +
    '</div>' +
    accionHtml;
  panel.classList.remove("hidden");
}

function toggleResumenHistoriaTelefono(btn) {
  var panel = document.getElementById("tel-story-panel");
  if (!panel) return;
  var abierto = panel.classList.toggle("is-expanded");
  if (btn) {
    btn.textContent = abierto ? "Ocultar contexto" : "Ver contexto";
    btn.setAttribute("aria-expanded", String(abierto));
  }
}
if (typeof window !== "undefined") {
  window.toggleResumenHistoriaTelefono = toggleResumenHistoriaTelefono;
}

function obtenerOpcionesRespuestaNarrativaTelefono(contactoId) {
  var pendiente = obtenerConversacionNarrativaPendiente(contactoId);
  if (!pendiente) return [];

  var tipo = String(pendiente.tipo || "").toLowerCase();
  var fase = String(pendiente.fase || "").toLowerCase();
  if (tipo === "evento_turno" && fase === "aparece") {
    return [
      { texto: "Lo atiendo ahora, abre el plan.", accion: "story_evento_plan" },
      {
        texto: "Dame contexto corto y riesgo real.",
        accion: "story_evento_contexto",
      },
      {
        texto: "Activa al grupo y coordinamos ya.",
        accion: "story_evento_grupo",
      },
    ];
  }
  if (tipo === "evento_turno" && fase === "resuelto") {
    return [
      {
        texto: "Recibido, asumo la consecuencia.",
        accion: "story_resultado_asumir",
      },
      {
        texto: "Documentalo en la cronica.",
        accion: "story_resultado_documentar",
      },
      {
        texto: "Que sigue en la siguiente jugada?",
        accion: "story_resultado_siguiente",
      },
    ];
  }
  if (tipo === "inicio_dia") {
    return [
      {
        texto: "Arranco jornada. Que prioridad va primero?",
        accion: "story_inicio_prioridad",
      },
      { texto: "Que riesgo debo vigilar hoy?", accion: "story_inicio_riesgo" },
      {
        texto: "Equipo listo. Mantenme alerta.",
        accion: "story_inicio_alerta",
      },
    ];
  }
  if (tipo === "cierre_dia") {
    return [
      { texto: "Cierro caja. Resumen final?", accion: "story_cierre_resumen" },
      {
        texto: "Que pendiente se vuelve urgente manana?",
        accion: "story_cierre_pendiente",
      },
      {
        texto: "Necesito plan de recuperacion para el proximo dia.",
        accion: "story_cierre_plan",
      },
    ];
  }
  if (tipo === "subida_nivel") {
    return [
      { texto: "Recibido, seguimos operando.", accion: "story_nivel_ok" },
      { texto: "Prioridad: mantener calidad.", accion: "story_nivel_calidad" },
      { texto: "Gracias por el update.", accion: "story_nivel_update" },
    ];
  }
  if (tipo === "arco_narrativo" || tipo === "hito_narrativo") {
    return [
      { texto: "Recibido. Asumo el capitulo.", accion: "story_arco_asumir" },
      {
        texto: "Quiero leer las consecuencias directas.",
        accion: "story_arco_consecuencia",
      },
      {
        texto: "Arma grupo para decisiones rapidas.",
        accion: "story_arco_grupo",
      },
    ];
  }
  return [
    { texto: "Recibido, seguimos.", accion: "story_ok" },
    { texto: "Dame el contexto minimo.", accion: "story_contexto" },
    { texto: "Activo al equipo.", accion: "story_equipo" },
  ];
}

function generarRespuestaContextualNarrativaTelefono(accion, pendiente) {
  var tipo = String((pendiente && pendiente.tipo) || "").toLowerCase();
  if (String(accion).indexOf("story_evento_") === 0) {
    var mapaEvento = {
      story_evento_plan:
        "Plan cargado. El evento queda en prioridad alta hasta que tomes accion en piso.",
      story_evento_contexto:
        "Contexto breve: riesgo medio-alto, impacto directo en reputacion y caja.",
      story_evento_grupo:
        "Grupo activado. Cada actor enviara update corto cuando cambie el frente.",
    };
    return (
      mapaEvento[accion] || "Evento en seguimiento. No sueltes este frente."
    );
  }
  if (String(accion).indexOf("story_resultado_") === 0) {
    return escogerPlantillaTelefono([
      "Consecuencia registrada. El barrio ya reacciono a tu decision.",
      "Queda asentado en cronica. Esta ramificacion afecta los siguientes casos.",
      "Perfecto. El resultado entra como precedente para el proximo bloque.",
    ]);
  }
  if (tipo === "inicio_dia") {
    return escogerPlantillaTelefono([
      "Prioridad fijada: proteger reputacion antes de forzar velocidad.",
      "Riesgo clave de hoy: decisiones rapidas sin contexto tecnico.",
      "Listo. Te notifico si aparece un evento critico en el turno.",
    ]);
  }
  if (tipo === "cierre_dia") {
    return escogerPlantillaTelefono([
      "Pendiente principal marcado. Mañana abre con ese frente primero.",
      "Resumen cerrado. Lo que no pagaste hoy vuelve como presion mañana.",
      "Plan de recuperacion cargado. Mantener caja positiva sera prioridad.",
    ]);
  }
  if (tipo === "subida_nivel") {
    return escogerPlantillaTelefono([
      "Update recibido. Se mantiene la operacion normal en taller.",
      "Nivel actualizado. No cambia el flujo de trabajo de hoy.",
      "Perfecto, seguimos con los casos en curso.",
    ]);
  }
  return escogerPlantillaTelefono([
    "Recibido. Narrativa actualizada en cronica del barrio.",
    "Queda registrado. Este hilo sigue abierto para proximos giros.",
    "Mensaje procesado. Puedes volver a operar con normalidad.",
  ]);
}

function procesarRespuestaNarrativaTelefono(contactoId, accion, hora) {
  var pendiente = obtenerConversacionNarrativaPendiente(contactoId);
  if (!pendiente) return false;

  var respuesta = generarRespuestaContextualNarrativaTelefono(
    accion,
    pendiente,
  );
  if (!respuesta) return false;

  if (!telefonoMensajes[contactoId]) telefonoMensajes[contactoId] = [];
  telefonoMensajes[contactoId].push({
    autor: contactoId,
    texto: respuesta,
    hora: hora,
    leido: true,
    metaClave: normalizarClaveNarrativaTelefono(
      "resp:" + (pendiente.clave || Date.now()),
    ),
    metaAutorNombre: pendiente.autorNombre || "",
  });

  pendiente.resuelta = true;
  limpiarPendientesNarrativaTelefono();

  if (typeof sincronizarPausaJuego === "function") sincronizarPausaJuego();
  if (hayConversacionNarrativaBloqueanteActiva()) {
    var siguiente = obtenerConversacionNarrativaPendiente("");
    if (siguiente && siguiente.contactoId !== contactoId) {
      enfocarConversacionNarrativaPendiente(siguiente);
    }
  }
  return true;
}

function debeBloquearNarrativaTelefono(config) {
  var data = config || {};
  if (typeof data.bloqueante === "boolean") return data.bloqueante;
  var tipo = String(data.tipo || "").toLowerCase();
  var tiposBloqueantes = {
    inicio_dia: true,
    cierre_dia: true,
    evento_turno: true,
    arco_narrativo: true,
    hito_narrativo: true,
  };
  return !!tiposBloqueantes[tipo];
}

function existeClaveNarrativaTelefono(contactoId, clave) {
  if (!clave) return false;
  var lista = telefonoMensajes[contactoId] || [];
  return lista.some(function (m) {
    return !!(m && m.metaClave === clave);
  });
}

function pushMensajeTelefono(contactoId, autor, texto, opciones) {
  if (!contactoId) return false;
  var cfg = opciones || {};
  var limpio = normalizarTextoNarrativaTelefono(texto, 420);
  if (!limpio) return false;

  if (!telefonoMensajes || typeof telefonoMensajes !== "object")
    telefonoMensajes = {};
  if (!telefonoMensajes[contactoId]) telefonoMensajes[contactoId] = [];

  var clave = normalizarClaveNarrativaTelefono(cfg.clave || "");
  if (clave && existeClaveNarrativaTelefono(contactoId, clave)) return false;

  var visible =
    pantallaActiva === "telefono" &&
    telefonoVista === "chat" &&
    telefonoContactoActivo === contactoId;
  var payload = {
    autor: autor || contactoId,
    texto: limpio,
    hora: obtenerHoraMensajeTelefono(),
    leido: !!visible,
  };
  if (clave) payload.metaClave = clave;
  if (cfg.metaNarrativa && typeof cfg.metaNarrativa === "object")
    payload.metaNarrativa = { ...cfg.metaNarrativa };
  if (cfg.autorNombre)
    payload.metaAutorNombre = normalizarTextoNarrativaTelefono(
      cfg.autorNombre,
      36,
    );

  telefonoMensajes[contactoId].push(payload);
  if (clave) {
    asegurarNarrativaTelefonoEstado()[clave] = true;
  }
  registrarPendienteNarrativaTelefono(contactoId, clave, cfg);

  if (visible) {
    renderizarMensajesTelefono(contactoId);
    renderizarOpcionesRespuestaTelefono(contactoId);
  }
  renderizarContactosTelefono();
  actualizarBadgeNavTelefono();
  return true;
}

function obtenerContactoNarrativoEventoTurno(eventoId) {
  var mapa = {
    inspector: "inspector",
    proveedor: "proveedor",
    cajaRota: "abogado",
  };
  return mapa[eventoId] || TEL_CONTACTO_CRONICA_ID;
}

function registrarNarrativaTelefono(config) {
  var data = config || {};
  var textoBase = normalizarTextoNarrativaTelefono(data.texto || "", 360);
  if (!textoBase) return false;

  if (!Array.isArray(telefonoContactos)) telefonoContactos = [];
  if (!telefonoMensajes || typeof telefonoMensajes !== "object")
    telefonoMensajes = {};

  asegurarContactoNarrativaTelefono();

  var contactoId = String(data.contactoId || TEL_CONTACTO_CRONICA_ID);
  var participantes = limpiarParticipantesNarrativaTelefono(
    data.participantes || obtenerParticipantesNarrativaPorDefecto(data),
  );
  contactoId = asegurarContactoGrupoNarrativoTelefono(
    data,
    participantes,
    data.contactoId || TEL_CONTACTO_CRONICA_ID,
  );

  var titulo = normalizarTextoNarrativaTelefono(data.titulo || "", 64);
  var textoFinal = titulo ? `${titulo}: ${textoBase}` : textoBase;

  var diaClave =
    typeof data.dia === "number" && data.dia > 0
      ? data.dia
      : valorDiaActualTelefono();
  var clave = normalizarClaveNarrativaTelefono(
    data.clave ||
      [
        data.tipo || "narrativa",
        data.eventoId || "",
        data.fase || "",
        `d${diaClave}`,
      ]
        .filter(function (x) {
          return !!x;
        })
        .join(":"),
  );

  var autorNombre = normalizarTextoNarrativaTelefono(
    data.autorNombre || participantes[0] || "",
    36,
  );
  return pushMensajeTelefono(contactoId, contactoId, textoFinal, {
    clave: clave,
    autorNombre: autorNombre,
    bloqueante: debeBloquearNarrativaTelefono(data),
    metaNarrativa: {
      tipo: String(data.tipo || "narrativa"),
      eventoId: String(data.eventoId || ""),
      fase: String(data.fase || ""),
      dia: diaClave,
      participantes: participantes,
      autorNombre: autorNombre,
    },
  });
}

function hidratarNarrativaTelefonoDiaActual() {
  var diaActual = valorDiaActualTelefono();
  var hInicio = window.TallerData && window.TallerData.historiasInicio ? window.TallerData.historiasInicio : {};
  var intro =
    hInicio[diaActual]
      ? hInicio[diaActual]
      : "";
  var trama =
    typeof obtenerTramaDinamicaDia === "function"
      ? obtenerTramaDinamicaDia()
      : "";
  var texto = [intro, trama]
    .filter(function (x) {
      return !!String(x || "").trim();
    })
    .join(" ");
  if (!texto) return;

  registrarNarrativaTelefono({
    tipo: "inicio_dia",
    dia: diaActual,
    contactoId: TEL_CONTACTO_CRONICA_ID,
    titulo: `Dia ${diaActual}`,
    texto: texto,
    clave: `inicio-dia-${diaActual}`,
  });
}

function obtenerContactoIdCasoCliente(cliente) {
  if (!cliente || !cliente.idCaso) return "cliente_sin_caso";
  return "cliente_" + String(cliente.idCaso).replace(/[^a-zA-Z0-9_-]/g, "_");
}

function obtenerIdCasoDesdeContacto(contactoId) {
  if (!esContactoCasoCliente(contactoId)) return "";
  return String(contactoId || "").replace(/^cliente_/, "");
}

function esContactoCasoCliente(contactoId) {
  return (
    typeof contactoId === "string" && contactoId.indexOf("cliente_CASO-") === 0
  );
}

function obtenerIdsCasosActivosTelefono() {
  var ids = new Set();

  function registrar(idCaso) {
    if (!idCaso) return;
    ids.add(String(idCaso));
  }

  if (clienteActual && clienteActual.idCaso) registrar(clienteActual.idCaso);

  if (Array.isArray(clientesEnEspera)) {
    clientesEnEspera.forEach(function (c) {
      if (c && c.idCaso) registrar(c.idCaso);
    });
  }

  if (Array.isArray(reparacionesActivas)) {
    reparacionesActivas.forEach(function (r) {
      if (r && r.idCaso) registrar(r.idCaso);
    });
  }

  return ids;
}

function sincronizarContactosClienteTelefono() {
  if (!Array.isArray(telefonoContactos)) telefonoContactos = [];
  if (!telefonoMensajes || typeof telefonoMensajes !== "object")
    telefonoMensajes = {};

  var idsActivos = obtenerIdsCasosActivosTelefono();
  var contactosEliminados = [];

  telefonoContactos = telefonoContactos.filter(function (c) {
    if (!c || !c.id) return false;
    if (!esContactoCasoCliente(c.id)) return true;
    var idCaso = obtenerIdCasoDesdeContacto(c.id);
    var mantener = !!idCaso && idsActivos.has(idCaso);
    if (!mantener) contactosEliminados.push(c.id);
    return mantener;
  });

  contactosEliminados.forEach(function (cid) {
    if (telefonoMensajes[cid]) delete telefonoMensajes[cid];
  });

  if (
    telefonoContactoActivo &&
    contactosEliminados.indexOf(telefonoContactoActivo) >= 0
  ) {
    telefonoContactoActivo = null;
    telefonoVista = "lista";
  }
}

function obtenerClienteActivoPorContacto(contactoId) {
  if (!esContactoCasoCliente(contactoId)) return null;
  var idCaso = obtenerIdCasoDesdeContacto(contactoId);
  if (!idCaso) return null;

  if (
    clienteActual &&
    obtenerContactoIdCasoCliente(clienteActual) === contactoId
  )
    return clienteActual;
  if (Array.isArray(clientesEnEspera)) {
    var enCola = clientesEnEspera.find(function (c) {
      return c && c.idCaso === idCaso;
    });
    if (enCola) return enCola;
  }
  if (Array.isArray(reparacionesActivas)) {
    var enPiso = reparacionesActivas.find(function (r) {
      return r && r.idCaso === idCaso;
    });
    if (enPiso) return enPiso;
  }
  if (Array.isArray(casosAtendidos)) {
    var caso = casosAtendidos.find(function (c) {
      return c && c.idCaso === idCaso;
    });
    if (caso && caso.snapshot) {
      // Importante: devolver la misma referencia para conservar whatsappEstado entre mensajes.
      if (!caso.snapshot.idCaso) caso.snapshot.idCaso = idCaso;
      return caso.snapshot;
    }
  }
  return null;
}

function obtenerContextoCasoChat(contactoId, cliente) {
  var idCaso =
    cliente && cliente.idCaso
      ? cliente.idCaso
      : obtenerIdCasoDesdeContacto(contactoId);
  var repCaso =
    Array.isArray(reparacionesActivas) && idCaso
      ? reparacionesActivas.find(function (r) {
          return r && r.idCaso === idCaso;
        })
      : null;
  var registro =
    Array.isArray(casosAtendidos) && idCaso
      ? casosAtendidos.find(function (c) {
          return c && c.idCaso === idCaso;
        })
      : null;
  var estado = registro && registro.estado ? registro.estado : "";
  if (repCaso && repCaso.listoParaCobro) estado = "listo_retiro_pago";
  else if (repCaso)
    estado =
      repCaso.tipoTrabajo === "diagnostico"
        ? "en_diagnostico"
        : "en_reparacion";
  return {
    idCaso: idCaso,
    repCaso: repCaso,
    registro: registro,
    estado: estado,
  };
}

function obtenerNombreContactoCaso(cliente) {
  var nombre =
    cliente && cliente.personaNombre ? cliente.personaNombre : "Cliente";
  var idCaso = cliente && cliente.idCaso ? cliente.idCaso : "CASO-0000";
  return nombre + " · " + idCaso;
}

function obtenerEstadoWhatsAppCliente(cliente) {
  if (!cliente || typeof cliente !== "object") return null;
  if (!cliente.whatsappEstado || typeof cliente.whatsappEstado !== "object") {
    cliente.whatsappEstado = {
      dia: -1,
      accionesDia: {},
      turnosDia: 0,
      bloqueadoDia: false,
    };
  }
  var estado = cliente.whatsappEstado;
  var diaActual = valorDiaActualTelefono();
  if (estado.dia !== diaActual) {
    estado.dia = diaActual;
    estado.accionesDia = {};
    estado.turnosDia = 0;
    estado.bloqueadoDia = false;
  }
  if (!estado.accionesDia || typeof estado.accionesDia !== "object")
    estado.accionesDia = {};
  return estado;
}

function escogerPlantillaTelefono(lista) {
  if (!Array.isArray(lista) || !lista.length) return "";
  return lista[Math.floor(Math.random() * lista.length)];
}

function contextualizarRespuestaClienteTelefono(texto, contactoId) {
  var cliente = obtenerClienteActivoPorContacto(contactoId);
  if (!texto || !cliente) return texto;
  var contexto = obtenerContextoCasoChat(contactoId, cliente);
  var estadoTexto = {
    en_diagnostico: "diagnostico en curso",
    en_reparacion: "reparacion en curso",
    listo_retiro_pago: "listo para cobro",
    cobrado_retirado: "caso cerrado",
    pendiente_revision: "revision pendiente",
  }[contexto.estado] || (cliente.diagnosticado ? "pendiente de decision" : "pendiente de diagnostico");
  var tonoSocial = typeof obtenerTonoSocialCliente === "function"
    ? obtenerTonoSocialCliente(cliente)
    : "";
  var estadoSocial = cliente.estadoSocial || {};
  var urgencia = String(cliente.urgencia || "media");
  var presion = urgencia === "alta"
    ? " Es un caso urgente y necesito tiempos claros."
    : (estadoTexto === "reparacion en curso" ? " Avísame cuando cambie de etapa." : "");
  var mecanico = contexto.repCaso && contexto.repCaso.mecanicoNombre
    ? ` ${contexto.repCaso.mecanicoNombre} figura asignado al caso.`
    : "";
  var confianza = estadoSocial.confianza != null && estadoSocial.confianza < 35
    ? " Necesito más detalle para sentirme seguro con la decisión."
    : "";
  var matizPersonalidad = {
    ansioso: " Perdone si insisto, pero me preocupa quedarme sin el carro.",
    desconfiado: " Solo necesito que me expliquen bien antes de autorizar algo.",
    metodico: " Si hay un cambio importante, por favor dígame qué encontraron.",
    impulsivo: " Dígame directo si se puede resolver hoy.",
    tecnico: " Si tienen una lectura o evidencia, compártanmela para entenderla.",
    regateador: " Si el alcance cambia, conversemos el monto antes de seguir.",
    despistado: " Si necesita que aclare algo, pregúnteme y le cuento lo que recuerde.",
    confiado: " Quedo pendiente de su recomendación."
  }[cliente.personalidad] || "";
  return texto + (tonoSocial ? " " + tonoSocial : "") + matizPersonalidad + presion + mecanico + confianza;
}

function construirTextoJugadorCliente(cliente, accion) {
  var nombre =
    cliente && cliente.personaNombre ? cliente.personaNombre : "cliente";
  var vehiculo = cliente && cliente.vehiculo ? cliente.vehiculo : "vehiculo";
  var pago = Math.max(0, Math.round((cliente && cliente.pago) || 0));
  var referenciaCaso = cliente && cliente.idCaso ? " Caso " + cliente.idCaso + "." : "";

  if (String(accion || "").indexOf("cliente_asignar_dx_") === 0) {
    var idxDx = parseInt(String(accion).split("_").pop(), 10);
    var mecanicoDx =
      Array.isArray(mecanicos) && Number.isInteger(idxDx) && mecanicos[idxDx]
        ? mecanicos[idxDx]
        : null;
    var nombreMec =
      mecanicoDx && mecanicoDx.nombre ? mecanicoDx.nombre : "un mecanico";
    return `Voy a pasar tu ${vehiculo} (${cliente.idCaso || "caso activo"}) con ${nombreMec} para diagnostico ahora mismo.`;
  }

  var plantillas = {
    cliente_espera_dx: [
      `Estoy cerrando diagnostico de tu ${vehiculo}.${referenciaCaso} Te escribo en breve.`,
      `Ya tengo el caso avanzado, ${nombre}.${referenciaCaso} Dame un momento para afinar el dictamen.`,
      `Estoy cruzando hallazgos para evitar retrabajo en tu ${vehiculo}.${referenciaCaso}`,
    ],
    cliente_pedir_contexto: [
      `Para no fallar, cuentame cuando empezo la falla y en que momento pega mas.`,
      `Necesito un detalle extra de manejo para cerrar el reporte de hoy.${referenciaCaso}`,
      `Ayudame con el contexto: frio, trafico, subida o frenado, donde lo notas mas?`,
    ],
    cliente_cotizar: [
      `Diagnostico listo para ${vehiculo}.${referenciaCaso} El servicio queda en RD$${pago} con garantia del taller.`,
      `Ya tengo dictamen final: RD$${pago} por el trabajo completo.`,
      `Te envio cierre tecnico y monto final: RD$${pago}. Si apruebas, lo paso directo al elevador.`,
    ],
    cliente_descuento: [
      `Si lo aprobamos hoy te ajusto una parte para destrabar el caso.`,
      `Te propongo ajuste por cierre inmediato y dejamos todo documentado.`,
      `Puedo mejorar condiciones hoy para que no sigas perdiendo tiempo con ese vehiculo parado.`,
    ],
    cliente_confirmar: [
      `Confirmame por aqui y lo paso directo a reparacion.`,
      `Necesito tu OK por WhatsApp para meterlo al elevador.`,
      `Con tu confirmacion cierro orden, asigno mecanico y te reporto avance por tramos.`,
    ],
    cliente_aceptar_condiciones: [
      `Acepto tus condiciones para cerrarlo hoy.`,
      `Vamos con tu contraoferta para no atrasar el trabajo.`,
      `Te confirmo ajuste y cerramos ahora, asi evitamos mas desgaste del caso.`,
    ],
    cliente_pedir_motivo_rechazo: [
      `Antes de cerrar, explicame por que no apruebas el caso.`,
      `Necesito el motivo exacto para ajustarte una contraoferta real.`,
      `Dime que parte te frena: tiempo, precio o alcance tecnico, y lo aterrizamos.`,
    ],
    cliente_estado_reparacion: [
      `Caso aprobado. Te mantengo al tanto del avance del mecanico.`,
      `Ya esta autorizado; te mando update apenas salga de revision.`,
      `Estamos en piso con tu unidad. Te aviso cuando pase de fase tecnica.`,
    ],
    cliente_cobrar_retiro: [
      `Tu vehiculo ya esta listo. Confirmame por WhatsApp para cerrar cobro y retiro ahora.`,
      `Trabajo finalizado y revisado. Si estas conforme, cierro cobro y retiro del caso hoy.`,
      `Resultado listo y validado. Cuando confirmes, cerramos caja y entrega del vehiculo.`,
    ],
    cliente_post_cierre: [
      `Gracias por confiar en el taller. Cualquier ajuste, me escribes.`,
      `Caso cerrado y retirado. Quedo atento para proximo mantenimiento.`,
      `Gracias por la confianza. Te guardo historial para que el proximo servicio sea mas rapido.`,
    ],
    cliente_post_fallo: [
      `Lamento el resultado. Si quieres, abrimos revision en una nueva orden.`,
      `Este caso quedo observado. Podemos replantearlo con otra estrategia.`,
      `No quiero venderte humo: prefiero cerrar este caso y relanzarlo bien documentado.`,
    ],
  };

  return escogerPlantillaTelefono(
    plantillas[accion] || ["Recibido, seguimos en contacto hoy."],
  );
}

function obtenerOpcionesAsignacionDiagnosticoCliente(cliente) {
  if (!cliente || cliente.diagnosticado) return [];
  var especialidad = String(cliente.especialidadIdeal || "general");
  var disponibles =
    typeof ofDxObtenerMecanicosDisponibles === "function"
      ? ofDxObtenerMecanicosDisponibles()
      : [];
  return disponibles
    .slice()
    .sort(function (a, b) {
      var mecA = a && a.mecanico ? a.mecanico : {};
      var mecB = b && b.mecanico ? b.mecanico : {};
      var specA = mecA.especialidad === especialidad ? 1 : 0;
      var specB = mecB.especialidad === especialidad ? 1 : 0;
      if (specA !== specB) return specB - specA;
      return (mecB.habilidad || 0) - (mecA.habilidad || 0);
    })
    .slice(0, 3)
    .map(function (entry) {
      return "cliente_asignar_dx_" + entry.idx;
    });
}

function obtenerIndiceMecanicoDesdeAccionCliente(accion) {
  var match = String(accion || "").match(/^cliente_asignar_dx_(\d+)$/);
  if (!match) return null;
  var idx = parseInt(match[1], 10);
  return Number.isInteger(idx) ? idx : null;
}

function activarCasoDesdeChatCliente(contactoId, cliente) {
  if (!cliente) return false;
  var idCaso = cliente.idCaso || obtenerIdCasoDesdeContacto(contactoId);
  if (!idCaso) return false;
  if (clienteActual && clienteActual.idCaso === idCaso) return true;

  if (Array.isArray(casosPendientesDiagnostico)) {
    var idxPendiente = casosPendientesDiagnostico.findIndex(function (c) {
      return c && c.idCaso === idCaso;
    });
    if (idxPendiente >= 0)
      return activarPendienteDiagnostico(idxPendiente, false, true);
  }

  if (Array.isArray(clientesEnEspera)) {
    var idxCola = clientesEnEspera.findIndex(function (c) {
      return c && c.idCaso === idCaso;
    });
    if (idxCola >= 0) {
      seleccionarClienteCola(idxCola, false, true);
      return !!(clienteActual && clienteActual.idCaso === idCaso);
    }
  }

  return !!(clienteActual && clienteActual.idCaso === idCaso);
}

function construirOpcionesDinamicasCasoCliente(cliente, contactoId) {
  var clienteEnChat = obtenerClienteActivoPorContacto(contactoId);
  if (!cliente || !clienteEnChat) return [];

  var estado = obtenerEstadoWhatsAppCliente(cliente);
  if (!estado) return [];

  var base = [];
  var contexto = obtenerContextoCasoChat(contactoId, cliente);
  var repCaso = contexto.repCaso;
  var estadoCaso = contexto.estado;
  if (estadoCaso === "cobrado_retirado") {
    base = ["cliente_post_cierre"];
  } else if (estadoCaso === "pendiente_revision") {
    base = ["cliente_post_fallo"];
  } else if (repCaso) {
    if (repCaso.tipoTrabajo === "diagnostico") {
      base = ["cliente_espera_dx"];
    } else if (repCaso.listoParaCobro) {
      if (!repCaso.resultadoVisible) base = ["cliente_estado_reparacion"];
      else base = ["cliente_cobrar_retiro"];
    } else {
      base = ["cliente_estado_reparacion"];
    }
  } else if (!cliente.diagnosticado) {
    var opcionesDx = obtenerOpcionesAsignacionDiagnosticoCliente(cliente);
    base = ["cliente_espera_dx", "cliente_pedir_contexto"];
    if (opcionesDx.length) base.push(opcionesDx[0]);
  } else if (!cliente.negociado) {
    base = ["cliente_cotizar", "cliente_descuento"];
  } else if (!cliente.aprobacionCliente) {
    base = ["cliente_pedir_motivo_rechazo", "cliente_aceptar_condiciones"];
  } else {
    base = ["cliente_estado_reparacion"];
  }

  var candidatas = base
    .filter(function (accion, idx, arr) {
      return arr.indexOf(accion) === idx;
    })
    .slice(0, 3);

  if (!candidatas.length) {
    estado.bloqueadoDia = true;
    return [];
  }

  var limiteDia = estado.turnosDia >= LIMITE_CHAT_CLIENTE_DIA;
  var opciones = candidatas.map(function (accion) {
    var bloqueada = false;
    var motivoBloqueo = "";
    if (limiteDia) {
      bloqueada = true;
      motivoBloqueo = "Limite diario alcanzado";
    } else if (estado.accionesDia[accion]) {
      bloqueada = true;
      motivoBloqueo = "Ya usada hoy";
    }
    return {
      texto: construirTextoJugadorCliente(cliente, accion),
      accion: accion,
      claveOpcion: normalizarClaveNarrativaTelefono("cli:" + accion),
      bloqueada: bloqueada,
      motivoBloqueo: motivoBloqueo,
    };
  });

  estado.bloqueadoDia = !opciones.some(function (op) {
    return !op.bloqueada;
  });
  return opciones;
}

function asegurarContactoCasoTelefono(cliente, forzarMensajeApertura) {
  if (TELEFONO_SOLO_HISTORIAS) return null;
  if (!cliente || !cliente.idCaso) return null;
  var contactoId = obtenerContactoIdCasoCliente(cliente);
  upsertContactoTelefono({
    id: contactoId,
    nombre: obtenerNombreContactoCaso(cliente),
    avatar: "🚗",
    tipo: "cliente",
  });
  if (!telefonoMensajes[contactoId]) telefonoMensajes[contactoId] = [];

  if (forzarMensajeApertura && !telefonoMensajes[contactoId].length) {
    var historia = String(
      cliente.miniHistoriaTexto || "Estoy atento al diagnostico.",
    )
      .replace(/\s+/g, " ")
      .trim();
    var historiaCorta =
      historia.length > 140 ? historia.slice(0, 140) + "..." : historia;
    telefonoMensajes[contactoId].push({
      autor: contactoId,
      texto: `Hola, soy ${cliente.personaNombre || "cliente"}. Traje mi ${cliente.vehiculo || "vehiculo"}. ${historiaCorta}`,
      hora: "09:00",
      leido: false,
    });
  }
  return contactoId;
}

function obtenerContactosBaseTelefono() {
  var contactos = [
    {
      id: TEL_CONTACTO_CRONICA_ID,
      nombre: "Cronica Del Barrio",
      avatar: "📰",
      tipo: "personal",
    },
    { id: "ex", nombre: "Valeria (Ex)", avatar: "💔", tipo: "personal" },
    { id: "abogado", nombre: "Lic. Montero", avatar: "⚖️", tipo: "personal" },
    { id: "proveedor", nombre: "Flaca Parts", avatar: "🔩", tipo: "personal" },
    {
      id: "inspector",
      nombre: "Inspector Diaz",
      avatar: "🕵️",
      tipo: "personal",
    },
    {
      id: "banco",
      nombre: "Sr. Abreu B.N. | Banco Confianza",
      avatar: "🏦",
      tipo: "personal",
    },
  ];
  var casosNarrativos = typeof obtenerCasosCompletadosNarrativa === "function" ? obtenerCasosCompletadosNarrativa() : 0;
  if (casosNarrativos >= 8) contactos.push({ id: "autofix", nombre: "AutoFix Express", avatar: "⚡", tipo: "personal" });
  return contactos;
}

function upsertContactoTelefono(contacto) {
  if (!contacto || !contacto.id) return;
  var payload = { ...contacto };
  if (typeof payload.avatar === "string") {
    payload.avatar = normalizarAvatarTelefono(payload.avatar);
  }
  var idx = telefonoContactos.findIndex(function (c) {
    return c.id === contacto.id;
  });
  if (idx >= 0) {
    telefonoContactos[idx] = { ...telefonoContactos[idx], ...payload };
  } else {
    telefonoContactos.push(payload);
  }
}

function normalizarAvatarTelefono(valor) {
  var raw = String(valor || "").trim();
  if (!raw) return "";
  raw = raw
    .replace(/\s+\./g, ".")
    .replace(/\.\s+/g, ".")
    .replace(/\s{2,}/g, " ");
  return normalizarRutaImagenRapida(raw, "foto") || raw;
}

function avatarTelefonoEsImagen(valor) {
  var v = String(valor || "")
    .trim()
    .toLowerCase();
  if (!v) return false;
  return (
    /^data:image\//.test(v) ||
    /^https?:\/\//.test(v) ||
    /^img\//.test(v) ||
    /^\/img\//.test(v) ||
    /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/.test(v)
  );
}

function renderAvatarContactoTelefono(contacto) {
  var nombre = escaparTextoTelefono(
    (contacto && contacto.nombre) || "Contacto",
  );
  var inicial = escaparTextoTelefono(
    String((contacto && contacto.nombre) || "?")
      .charAt(0)
      .toUpperCase() || "?",
  );
  var avatar = normalizarAvatarTelefono((contacto && contacto.avatar) || "");
  if (avatarTelefonoEsImagen(avatar)) {
    var src = escaparTextoTelefono(avatar);
    return (
      '<span class="tel-avatar tel-avatar-img-wrap">' +
      '<img src="' +
      src +
      '" alt="' +
      nombre +
      '" class="tel-avatar-img" onerror="this.style.display=\'none\';var ph=this.nextElementSibling;if(ph){ph.style.display=\'flex\';}">' +
      '<span class="tel-avatar-fallback" style="display:none;">' +
      inicial +
      "</span>" +
      "</span>"
    );
  }
  return (
    '<span class="tel-avatar">' +
    escaparTextoTelefono(avatar || "💬") +
    "</span>"
  );
}

function contarNoLeidosContactoTelefono(contactoId) {
  var msgs = telefonoMensajes[contactoId] || [];
  return msgs.filter(function (m) {
    return !m.leido && m.autor !== "jugador";
  }).length;
}

function contarCobrosPendientesTelefono() {
  if (!Array.isArray(reparacionesActivas)) return 0;
  return reparacionesActivas.filter(function (r) {
    return r && r.idCaso && r.listoParaCobro && r.resultadoVisible;
  }).length;
}

function esContactoUrgenteTelefono(contacto) {
  if (!contacto || !contacto.id) return false;
  var pendiente = obtenerConversacionNarrativaPendiente(contacto.id);
  if (pendiente) return true;
  if (!esContactoCasoCliente(contacto.id)) return false;

  var cliente = obtenerClienteActivoPorContacto(contacto.id);
  if (!cliente) return false;
  var contexto = obtenerContextoCasoChat(contacto.id, cliente);
  if (
    contexto.repCaso &&
    contexto.repCaso.listoParaCobro &&
    contexto.repCaso.resultadoVisible
  )
    return true;
  if (!cliente.diagnosticado) return true;
  if (cliente.diagnosticado && !cliente.aprobacionCliente && !contexto.repCaso)
    return true;
  return false;
}

function contactoCoincideBusquedaTelefono(contacto) {
  var q = String(telefonoBusquedaTexto || "")
    .trim()
    .toLowerCase();
  if (!q) return true;
  if (!contacto) return false;

  var nombre = String(contacto.nombre || "").toLowerCase();
  var id = String(contacto.id || "").toLowerCase();
  var msgs = telefonoMensajes[contacto.id] || [];
  var ultimo = msgs.length
    ? String(msgs[msgs.length - 1].texto || "").toLowerCase()
    : "";
  return nombre.indexOf(q) >= 0 || id.indexOf(q) >= 0 || ultimo.indexOf(q) >= 0;
}

function actualizarResumenSidebarTelefono(contactosVisibles) {
  var resumen = document.getElementById("tel-sidebar-stats");
  var pill = document.getElementById("tel-meta-pill");
  var lista = Array.isArray(contactosVisibles) ? contactosVisibles : [];
  var noLeidos = lista.reduce(function (acc, c) {
    return acc + contarNoLeidosContactoTelefono(c.id);
  }, 0);
  var urgentes = lista.filter(esContactoUrgenteTelefono).length;
  var cobros = contarCobrosPendientesTelefono();

  if (pill) pill.innerText = `${lista.length} activos`;
  if (!resumen) return;
  var mision = typeof obtenerMisionNarrativaActual === "function" ? obtenerMisionNarrativaActual() : null;
  var misionTexto = mision ? ` | Mision: ${mision.titulo}` : "";
  resumen.innerText = `Visibles: ${lista.length} | No leidos: ${noLeidos} | Urgentes: ${urgentes} | Cobros: ${cobros}${misionTexto}`;
}

function actualizarHeaderChatTelefono(contacto) {
  var nombreEl = document.getElementById("tel-chat-nombre");
  var tipoEl = document.getElementById("tel-chat-tipo");
  if (!nombreEl || !tipoEl) return;

  if (!contacto) {
    nombreEl.innerText = "Selecciona un contacto";
    tipoEl.innerText = "";
    return;
  }

  nombreEl.innerText = `${contacto.nombre || "Contacto"}`;
  tipoEl.innerText = contacto.tipo || "";
}

function actualizarPanelSocialTelefono(contacto) {
  var panel = document.getElementById("tel-social-panel");
  if (!panel) return;
  if (!contacto) { panel.classList.add("hidden"); panel.innerHTML = ""; return; }
  var mecanico = typeof obtenerMecanicoPorContacto === "function" ? obtenerMecanicoPorContacto(contacto.id) : null;
  var relacion = 58, estado = "Disponible", detalle = "Conversación abierta";
  if (mecanico) {
    relacion = Math.max(0, Math.min(100, 45 + (Number(mecanico.lealtad) || 0) * 0.55 - (Number(mecanico.enojo) || 0) * 7));
    var deudaMecanico = Math.max(0, Math.round(Number(mecanico.deudaConTaller) || 0));
    if (mecanico.preguntaPendiente) {
      estado = "Solicitud pendiente";
      detalle = "Decide en las respuestas";
    } else if (deudaMecanico > 0) detalle = "Deuda con taller: RD$" + deudaMecanico;
    if ((Number(mecanico.bloqueoAyudaTurnos) || 0) > 0) estado = "No disponible";
    else if ((Array.isArray(reparacionesActivas) ? reparacionesActivas : []).some(function(rep) { return rep && rep.mecanicoNombre === mecanico.nombre && !rep.listoParaCobro; })) estado = "En trabajo";
  } else if (contacto.tipo === "cliente") { relacion = 65; detalle = "Seguimiento del caso"; }
  else detalle = contacto.tipo || "Contacto";
  panel.innerHTML = '<span class="tel-social-label">Relación</span><div class="tel-social-bar"><i style="width:' + relacion + '%"></i></div><strong>' + relacion + '%</strong><span class="tel-social-state">' + escaparTextoTelefono(estado) + ' · ' + escaparTextoTelefono(detalle) + '</span>';
  panel.classList.remove("hidden");
}

function actualizarPuenteLoopTelefono(contacto) {
  var puente = document.getElementById("tel-loop-context");
  if (!puente) return;
  if (!contacto) {
    puente.classList.add("hidden");
    puente.innerHTML = "";
    return;
  }

  var mecanico = typeof obtenerMecanicoPorContacto === "function" ? obtenerMecanicoPorContacto(contacto.id) : null;
  if (mecanico) {
    var deudaMecanico = Math.max(0, Math.round(Number(mecanico.deudaConTaller) || 0));
    var salarioMecanico = Math.max(0, Math.round(Number(mecanico.salarioBase) || 0));
    var planMecanico = typeof obtenerPlanDeudaMecanico === "function"
      ? obtenerPlanDeudaMecanico(mecanico)
      : { etiqueta: "Estándar", tasa: 0.20 };
    var cuotaMecanico = Math.min(deudaMecanico, Math.max(0, Math.round(salarioMecanico * planMecanico.tasa)));
    var casosDeudaMecanico = typeof estimarCasosParaSaldarDeudaMecanico === "function"
      ? estimarCasosParaSaldarDeudaMecanico(mecanico)
      : 0;
    var estadoMecanico = mecanico.preguntaPendiente
      ? "Solicitud pendiente: responde en este chat"
      : (deudaMecanico > 0
        ? "Deuda: RD$" + deudaMecanico + " | " + planMecanico.etiqueta + " " + Math.round(planMecanico.tasa * 100) + "% | Próximo abono ~RD$" + cuotaMecanico + " | ~" + casosDeudaMecanico + " caso(s)"
        : "Sin deuda interna | Pago por caso: RD$" + salarioMecanico);
    var indiceMecanico = (Array.isArray(mecanicos) ? mecanicos : []).indexOf(mecanico);
    puente.innerHTML =
      '<span class="tel-loop-label">Situacion del equipo</span>' +
      '<strong>' + escaparTextoTelefono(estadoMecanico) + '</strong>' +
      '<button class="btn tel-loop-btn" type="button" onclick="abrirPanelMecanicoDesdeChat(' + indiceMecanico + ')">Ver perfil</button>';
    puente.classList.remove("hidden");
    return;
  }

  if (!esContactoCasoCliente(contacto.id)) {
    puente.classList.add("hidden");
    puente.innerHTML = "";
    return;
  }

  var cliente = obtenerClienteActivoPorContacto(contacto.id);
  var contexto = obtenerContextoCasoChat(contacto.id, cliente);
  var accion = "Revisar este caso en el taller";
  var puesto = "cola";
  if (contexto.repCaso && contexto.repCaso.listoParaCobro) {
    accion = "Abrir cobro y entrega";
    puesto = "trabajos";
  } else if (contexto.repCaso) {
    accion = "Ver reparacion en curso";
    puesto = "trabajos";
  } else if (cliente && !cliente.diagnosticado) {
    accion = "Asignar diagnostico en el taller";
    puesto = "cola";
  } else if (cliente && !cliente.aprobacionCliente) {
    accion = "Revisar negociacion del caso";
    puesto = "cola";
  }

  puente.innerHTML =
    '<span class="tel-loop-label">Siguiente paso</span>' +
    '<strong>' + escaparTextoTelefono(accion) + '</strong>' +
    '<button class="btn tel-loop-btn" type="button" onclick="volverAlTallerDesdeTelefono(\'' +
    escaparTextoTelefono(puesto) + '\')">Ir al taller</button>';
  puente.classList.remove("hidden");
}

function volverAlTallerDesdeTelefono(puesto) {
  navegarPantalla("taller");
  if (typeof seleccionarPuestoTaller === "function") {
    setTimeout(function () {
      seleccionarPuestoTaller(puesto || "cola");
    }, 30);
  }
}

function abrirPanelMecanicoDesdeChat(idx) {
  var indice = Math.max(0, Math.round(Number(idx) || 0));
  if (!Array.isArray(mecanicos) || !mecanicos[indice]) return;
  if (typeof abrirPanelMecanico === "function") {
    abrirPanelMecanico(indice);
    return;
  }
  window.mecanicoPanelSeleccionadoIdx = indice;
  if (typeof abrirModal === "function") abrirModal("mecanicos");
}

function contactoCoincideFiltroTelefono(contacto) {
  if (!contacto) return false;
  if (TELEFONO_SOLO_HISTORIAS) return contacto.tipo !== "cliente";
  if (telefonoFiltroActivo === "todos") return true;
  if (telefonoFiltroActivo === "clientes") return contacto.tipo === "cliente";
  if (telefonoFiltroActivo === "personal") return contacto.tipo !== "cliente";
  if (telefonoFiltroActivo === "urgente")
    return esContactoUrgenteTelefono(contacto);
  return contacto.tipo === "cliente";
}

function actualizarVistaTelefono() {
  var screen = document.getElementById("screen-telefono");
  if (screen)
    screen.classList.toggle("tel-chat-open", telefonoVista === "chat");

  var backBtn = document.getElementById("tel-back-btn");
  if (backBtn) backBtn.classList.toggle("hidden", telefonoVista !== "chat");

  var btnTodos = document.getElementById("tel-filtro-todos");
  var btnClientes = document.getElementById("tel-filtro-clientes");
  var btnPersonal = document.getElementById("tel-filtro-personal");
  var btnUrgente = document.getElementById("tel-filtro-urgente");
  if (btnTodos)
    btnTodos.classList.toggle("active", telefonoFiltroActivo === "todos");
  if (btnClientes)
    btnClientes.classList.toggle("active", telefonoFiltroActivo === "clientes");
  if (btnPersonal)
    btnPersonal.classList.toggle("active", telefonoFiltroActivo === "personal");
  if (btnUrgente)
    btnUrgente.classList.toggle("active", telefonoFiltroActivo === "urgente");

  var buscador = document.getElementById("tel-search-input");
  if (buscador && buscador.value !== telefonoBusquedaTexto)
    buscador.value = telefonoBusquedaTexto;

  var contactoActivo =
    telefonoContactos.find(function (c) {
      return c && c.id === telefonoContactoActivo;
    }) || null;
  if (telefonoVista === "chat" && contactoActivo)
    actualizarHeaderChatTelefono(contactoActivo);
  else actualizarHeaderChatTelefono(null);
  actualizarPanelSocialTelefono(telefonoVista === "chat" ? contactoActivo : null);
  actualizarPuenteLoopTelefono(telefonoVista === "chat" ? contactoActivo : null);
}

function cambiarFiltroTelefono(filtro) {
  var permitidos = {
    todos: true,
    clientes: true,
    personal: true,
    urgente: true,
  };
  telefonoFiltroActivo = permitidos[filtro] ? filtro : "personal";
  if (TELEFONO_SOLO_HISTORIAS && telefonoFiltroActivo === "clientes")
    telefonoFiltroActivo = "personal";
  var contactoActivo = telefonoContactos.find(function (c) {
    return c.id === telefonoContactoActivo;
  });
  if (
    telefonoVista === "chat" &&
    contactoActivo &&
    !contactoCoincideFiltroTelefono(contactoActivo)
  ) {
    telefonoVista = "lista";
    telefonoContactoActivo = null;
  }
  renderizarContactosTelefono();
  actualizarVistaTelefono();
}

function buscarTelefono(texto) {
  telefonoBusquedaTexto = String(texto || "").slice(0, 80);
  renderizarContactosTelefono();
  actualizarVistaTelefono();
}

function volverListaTelefono() {
  telefonoVista = "lista";
  telefonoContactoActivo = null;
  actualizarHeaderChatTelefono(null);
  renderizarContactosTelefono();
  actualizarVistaTelefono();
  if (window.matchMedia && window.matchMedia("(max-width: 700px)").matches) {
    var game = document.getElementById("game");
    if (game) game.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function actualizarModoVisualPantalla() {
  var game = document.getElementById("game");
  if (!game) return;
  game.classList.toggle(
    "modo-oficina",
    pantallaActiva === "oficina" || pantallaActiva === "configuracion",
  );
}

function configurarNavAutoOcultableMovil() {
  if (window.__navMovilConfigurada) return;
  window.__navMovilConfigurada = true;
  window.mostrarNavMovil = function () { var nav = document.getElementById('game-nav'); if (nav) nav.classList.remove('nav-hidden-mobile'); };
  var targets = [document.getElementById('game')].concat(Array.from(document.querySelectorAll('#game .game-screen, #game .game-flow-layer'))).filter(Boolean);
  targets.forEach(function (target) { var anterior = target.scrollTop || 0; target.addEventListener('scroll', function () {
    if (window.matchMedia && !window.matchMedia('(max-width: 700px)').matches) return;
    var actual = target.scrollTop || 0, maximo = Math.max(0, target.scrollHeight - target.clientHeight), nav = document.getElementById('game-nav');
    if (!nav) return;
    if (maximo > 8 && maximo - actual <= 8) nav.classList.add('nav-hidden-mobile');
    else if (actual < anterior - 3) nav.classList.remove('nav-hidden-mobile');
    anterior = actual;
  }, { passive: true }); });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', configurarNavAutoOcultableMovil); else setTimeout(configurarNavAutoOcultableMovil, 0);

function navegarPantalla(pantalla) {
  var pantallaAnterior = pantallaActiva;
  if (pantalla !== "telefono" && hayConversacionNarrativaBloqueanteActiva()) {
    if (typeof mostrarFeedbackGameplay === "function") {
      mostrarFeedbackGameplay(
        "Juego bloqueado por historia activa: responde en Telefono para continuar.",
        "warn",
      );
    }
    pantalla = "telefono";
  }

  pantallaActiva = pantalla;
  if (typeof mostrarNavMovil === 'function') mostrarNavMovil();
  actualizarModoVisualPantalla();

  // Actualizar fondo segun pantalla
  if (pantalla === "oficina" || pantalla === "configuracion")
    lugarActual = "Oficina";
  else if (pantalla === "exterior" || pantalla === "mapa")
    lugarActual = "Exterior";
  else lugarActual = "Taller";
  actualizarFondoJuego();

  // Activar pantalla correcta
  document.querySelectorAll(".game-screen").forEach(function (s) {
    s.classList.remove("active");
  });
  var target = document.getElementById("screen-" + pantalla);
  if (target) target.classList.add("active");

  // Actualizar botones de nav
  document.querySelectorAll(".game-nav-btn").forEach(function (btn) {
    btn.classList.toggle("active", btn.dataset.screen === pantalla);
  });

  if (
    pantallaAnterior !== pantalla &&
    window.TallerAudio &&
    typeof window.TallerAudio.play === "function"
  ) {
    window.TallerAudio.play("nav");
  }

  // Cerrar submenu de operaciones si esta abierto
  var submenu = document.getElementById("acciones-submenu");
  var btnOp = document.getElementById("btn-toggle-operaciones");
  if (submenu && !submenu.classList.contains("hidden")) {
    submenu.classList.add("hidden");
    if (btnOp) {
      btnOp.innerText = "☰ Operaciones";
      btnOp.classList.remove("is-open");
    }
  }

  // Actualizar contenido especifico de la pantalla
  if (pantalla === "oficina") actualizarScreenOficina();
  else if (pantalla === "exterior") actualizarScreenExterior();
  else if (pantalla === "mapa") actualizarScreenMapa();
  else if (pantalla === "configuracion") actualizarScreenConfiguracion();
  else if (pantalla === "telefono") {
    inicializarTelefono();
    renderizarContactosTelefono();
    if (telefonoContactoActivo) {
      renderizarMensajesTelefono(telefonoContactoActivo);
      renderizarOpcionesRespuestaTelefono(telefonoContactoActivo);
    }
    actualizarVistaTelefono();
  }
  if (typeof sincronizarPausaJuego === "function") sincronizarPausaJuego();
}

function abrirNegociacionClienteTelefono() {
  if (TELEFONO_SOLO_HISTORIAS) {
    if (typeof mostrarFeedbackGameplay === "function")
      mostrarFeedbackGameplay(
        "Chat de clientes desactivado. Solo historias activas.",
        "warn",
      );
    return;
  }
  if (!clienteActual) {
    log("No hay cliente activo para negociar por WhatsApp.", "error");
    return;
  }
  var contactoId = actualizarContactoClienteTelefono();
  telefonoFiltroActivo = "clientes";
  telefonoBusquedaTexto = "";
  navegarPantalla("telefono");
  setTimeout(function () {
    if (contactoId) abrirChatTelefono(contactoId);
  }, 40);
}

function abrirWhatsAppCobroCaso(idCaso) {
  if (TELEFONO_SOLO_HISTORIAS) return;
  if (!idCaso) return;
  telefonoFiltroActivo = "clientes";
  telefonoBusquedaTexto = "";
  navegarPantalla("telefono");
  setTimeout(function () {
    abrirChatTelefono(
      "cliente_" + String(idCaso).replace(/[^a-zA-Z0-9_-]/g, "_"),
    );
  }, 40);
}

function abrirClienteActivoTelefono() {
  if (TELEFONO_SOLO_HISTORIAS) {
    if (typeof mostrarFeedbackGameplay === "function")
      mostrarFeedbackGameplay(
        "Chat de clientes desactivado. Solo historias activas.",
        "warn",
      );
    return;
  }
  var objetivo = null;
  if (clienteActual && clienteActual.idCaso) {
    objetivo = clienteActual;
  } else if (Array.isArray(clientesEnEspera) && clientesEnEspera.length) {
    objetivo = clientesEnEspera[0];
  }

  if (!objetivo) {
    if (typeof mostrarFeedbackGameplay === "function") {
      mostrarFeedbackGameplay(
        "No hay cliente activo para abrir por chat.",
        "warn",
      );
    }
    return;
  }

  var contactoId = asegurarContactoCasoTelefono(objetivo, true);
  telefonoFiltroActivo = "clientes";
  telefonoBusquedaTexto = "";
  renderizarContactosTelefono();
  if (contactoId) abrirChatTelefono(contactoId);
}

function abrirPrimerCobroPendienteTelefono() {
  if (TELEFONO_SOLO_HISTORIAS) {
    if (typeof mostrarFeedbackGameplay === "function")
      mostrarFeedbackGameplay(
        "Cobro por telefono desactivado. Usa el panel del taller.",
        "warn",
      );
    return;
  }
  if (!Array.isArray(reparacionesActivas)) {
    if (typeof mostrarFeedbackGameplay === "function") {
      mostrarFeedbackGameplay(
        "No hay reparaciones activas por cobrar.",
        "warn",
      );
    }
    return;
  }

  var cobro = reparacionesActivas.find(function (r) {
    return r && r.idCaso && r.listoParaCobro && r.resultadoVisible;
  });
  if (!cobro) {
    if (typeof mostrarFeedbackGameplay === "function") {
      mostrarFeedbackGameplay(
        "No hay cobros listos por WhatsApp ahora mismo.",
        "warn",
      );
    }
    return;
  }

  var contactoId = asegurarContactoCasoTelefono(cobro, false);
  telefonoFiltroActivo = "urgente";
  telefonoBusquedaTexto = "";
  renderizarContactosTelefono();
  if (contactoId) abrirChatTelefono(contactoId);
}

function actualizarScreenOficina() {
  var set = function (id, val, html = false) {
    var el = document.getElementById(id);
    if (el) {
      if (html) {
        el.innerHTML = val;
      } else {
        el.innerText = val;
      }
    }
  };
  var setW = function (id, pct) {
    var el = document.getElementById(id);
    if (el) el.style.width = Math.min(100, Math.max(0, pct)) + "%";
  };

  set(
    "of-estado-flujo",
    modoNivelesActivo() ? "NIVEL " + (nivelJugador || 1) : "CONTINUO",
  );
  set("of-saldo", "RD$" + Math.round(saldo));
  set("of-deuda", "RD$" + Math.round(deuda));
  set("of-reput", reputacion);
  var riesgoOficina = Array.isArray(clientesEnEspera)
    ? clientesEnEspera.filter(function(c) { return c && Number(c.pacienciaCola) <= 45; })
    : [];
  set("of-alertas-of", riesgoOficina.length
    ? `ALERTA: ${riesgoOficina.length} cliente(s) con paciencia critica. Vuelve a Taller > Cola.`
    : "Sin alertas operativas.");

  set("of-v-hambre", hambre + "%");
  set("of-v-sueno", sueno + "%");
  set("of-v-estres", estres + "%");
  setW("of-b-hambre", hambre);
  setW("of-b-sueno", sueno);
  setW("of-b-estres", estres);

  // Progreso del Negocio (modo niveles)
  var _nivelAct = typeof nivelJugador !== "undefined" ? nivelJugador || 1 : 1;
  var _pctNivel = modoNivelesActivo()
    ? Math.min(
        100,
        Math.round(
          ((progresoNivel || 0) / Math.max(1, progresoNivelMeta || 1)) * 100,
        ),
      )
    : Math.min(100, Math.round((_nivelAct / 6) * 100));
  var _repAct = typeof reputacion !== "undefined" ? reputacion || 0 : 0;
  var _pctRep = Math.min(100, _repAct);
  var _moralTotal = 0;
  var _moralCount = 0;
  if (typeof mecanicos !== "undefined" && Array.isArray(mecanicos)) {
    mecanicos.forEach(function (m) {
      if (m) {
        var _humorMec = 100 - (Math.max(0, Number(m.enojo || 0)) * 8) - (m.preguntaPendiente ? 18 : 0) - (Number(m.bloqueoAyudaTurnos || 0) > 0 ? 28 : 0);
        _moralTotal += Math.max(0, Math.min(100, _humorMec));
        _moralCount++;
      }
    });
  }
  var _pctMoral =
    _moralCount > 0 ? Math.min(100, Math.round(_moralTotal / _moralCount)) : 50;
  set("of-v-nivel", "Nv." + _nivelAct + " (" + _pctNivel + "%)");
  set("of-xp", _pctNivel + "%");
  setW("of-b-nivel", _pctNivel);
  var _xpActualOf = Math.max(0, Math.round(progresoNivel || 0));
  var _xpMetaOf = Math.max(1, Math.round(progresoNivelMeta || 1));
  var _xpPctOf = Math.min(100, Math.round((_xpActualOf / _xpMetaOf) * 100));
  set("of-v-xp", _xpActualOf + "/" + _xpMetaOf);
  setW("of-b-xp", _xpPctOf);
  set("of-v-reput", _repAct + "/100");
  setW("of-b-reput", _pctRep);
  set("of-v-moral", _pctMoral + "%");
  setW("of-b-moral", _pctMoral);

  var saldoDia = Math.round(
    (resumenDia && resumenDia.ingresos ? resumenDia.ingresos : 0) -
      (resumenDia && resumenDia.perdidas ? resumenDia.perdidas : 0),
  );
  var cajaActual = Math.max(0, Math.round(saldo || 0));
  var deudaActual = Math.max(0, Math.round(deuda || 0));
  var solidezPct = Math.min(
    100,
    Math.round((cajaActual / Math.max(1, cajaActual + deudaActual)) * 100),
  );
  var flujoPct = Math.max(
    0,
    Math.min(100, 50 + Math.round((saldoDia / 2200) * 50)),
  );
  setW("of-b-solidez", solidezPct);
  set("of-v-solidez", solidezPct + "% de respaldo");
  setW("of-b-flujo", flujoPct);
  set("of-v-flujo", (saldoDia >= 0 ? "+" : "") + "RD$" + saldoDia);

  // Oficina v2: convierte las cifras en una decisión legible.
  var costoOperativoReferencia = Math.max(250, Math.round(180 + ((mecanicos || []).length * 120)));
  var diasCobertura = Math.max(0, Math.floor(cajaActual / costoOperativoReferencia));
  var saludFinanciera = solidezPct < 4 || diasCobertura < 1
    ? "FRÁGIL"
    : solidezPct < 10 || diasCobertura < 3
      ? "EN VIGILANCIA"
      : "ESTABLE";
  set("of-salud-financiera", "SALUD FINANCIERA: " + saludFinanciera);
  set("of-cobertura-caja", "Puedes cubrir aproximadamente " + diasCobertura + " día(s) de operación básica.");

  var bancoOficina = typeof obtenerMetricasBancoActuales === "function"
    ? obtenerMetricasBancoActuales()
    : {
        cuota: typeof calcularCuotaBancoCierre === "function" ? calcularCuotaBancoCierre(deudaActual) : Math.round(deudaActual * 0.03),
        faltanMora: 4,
        moraRatio: 0,
        casosSinPago: 0
      };
  var presionFinanciera = bancoOficina.moraRatio >= 0.75 || cajaActual < Math.round((bancoOficina.cuota || 0) * 0.6)
    ? "ALTA"
    : bancoOficina.moraRatio >= 0.4 || cajaActual < (bancoOficina.cuota || 0)
      ? "MEDIA"
      : "CONTROLADA";
  set("of-deuda-riesgo", "RD$" + deudaActual.toLocaleString("es-DO"));
  set("of-cuota-proxima", "RD$" + Math.max(0, Math.round(bancoOficina.cuota || 0)).toLocaleString("es-DO"));
  set("of-margen-mora", Math.max(0, Math.round(bancoOficina.faltanMora || 0)) + " caso(s)");
  set("of-presion-financiera", presionFinanciera);
  set("of-flujo-explicacion", saldoDia >= 0
    ? "El día está financiando la operación. Protege la caja para piezas y cuota."
    : "El día va en negativo: evita compras no esenciales antes del próximo cobro.");

  var colaOficina = Array.isArray(clientesEnEspera) ? clientesEnEspera.length : 0;
  var pendientesOficina = Array.isArray(casosPendientesDiagnostico) ? casosPendientesDiagnostico.length : 0;
  var reparacionesOficina = Array.isArray(reparacionesActivas) ? reparacionesActivas : [];
  var accionTitulo = "COMPLETA 1 CASO RENTABLE";
  var accionDetalle = "Prioriza trabajos que cubran piezas y dejen caja para operar.";
  var accionDestino = "taller";
  if (presionFinanciera === "ALTA" && cajaActual >= Math.round(bancoOficina.cuota || 0)) {
    accionTitulo = "PAGA O RENEGOCIA LA CUOTA";
    accionDetalle = "La presión bancaria está alta; resolverla evita intereses y pérdida de reputación.";
    accionDestino = "exterior";
  } else if (cajaActual < 450) {
    accionTitulo = "PROTEGE LA CAJA";
    accionDetalle = "No compres mejoras: prioriza un caso con anticipo, negociación o espera gratuita.";
  } else if (reparacionesOficina.length > 0) {
    accionTitulo = "CIERRA EL TRABAJO ACTIVO";
    accionDetalle = "Tienes " + reparacionesOficina.length + " reparación(es) en curso: cobrar libera caja y capacidad.";
  } else if (colaOficina + pendientesOficina === 0) {
    accionTitulo = "RECIBE EL SIGUIENTE CLIENTE";
    accionDetalle = "La cola está vacía. Genera demanda gratuita desde Taller para mantener el flujo.";
  }
  set("of-objetivo-dia", accionTitulo);
  set("of-proxima-decision", accionDetalle);
  set("of-accion-recomendada", accionTitulo);
  set("of-accion-detalle", accionDetalle);
  var botonAccionOficina = document.getElementById("of-accion-boton");
  if (botonAccionOficina) {
    botonAccionOficina.innerText = accionDestino === "exterior" ? "IR AL BANCO" : "IR AL TALLER";
    botonAccionOficina.onclick = function () { navegarPantalla(accionDestino); };
  }
  // Panel de economía con HTML estructurado
  var ingresosVal = resumenDia ? resumenDia.ingresos || 0 : 0;
  var perdidasVal = resumenDia ? resumenDia.perdidas || 0 : 0;
  var balanceVal = saldoDia;
  var balanceClase =
    "of-finanzas-balance " +
    (balanceVal >= 0 ? "is-success" : "is-danger");
  var economiaHTML = `
    <div class="of-card of-card-finanzas">
      <div class="of-card-header">Finanzas del Día</div>
      <div class="of-card-body">
        <ul class="of-finanzas-list">
          <li><span class="of-finanzas-label">Ingresos:</span> <span class="of-finanzas-ingreso">RD$ ${ingresosVal.toLocaleString("es-DO")}</span></li>
          <li><span class="of-finanzas-label">Pérdidas:</span> <span class="of-finanzas-gasto">RD$ ${perdidasVal.toLocaleString("es-DO")}</span></li>
          <li><span class="of-finanzas-label">Balance:</span> <span class="${balanceClase}">${balanceVal >= 0 ? "+" : "-"}RD$ ${Math.abs(balanceVal).toLocaleString("es-DO")}</span></li>
        </ul>
      </div>
    </div>
  `;
  set("of-economia", economiaHTML, true);

  var ultimoCasoOficina = resumenCasos && resumenCasos.ultimoCaso && typeof resumenCasos.ultimoCaso === "object"
    ? resumenCasos.ultimoCaso
    : null;
  if (ultimoCasoOficina && (ultimoCasoOficina.cliente || ultimoCasoOficina.ingresos || ultimoCasoOficina.perdidas)) {
    var ultimoIngreso = Math.max(0, Math.round(ultimoCasoOficina.ingresos || 0));
    var ultimoGasto = Math.max(0, Math.round(ultimoCasoOficina.perdidas || 0));
    var ultimoNeto = ultimoIngreso - ultimoGasto;
    set("of-ultimo-caso", "<strong>" + (ultimoCasoOficina.cliente || "Último expediente") + "</strong><span>Cobro: +RD$" + ultimoIngreso.toLocaleString("es-DO") + " · Costes: -RD$" + ultimoGasto.toLocaleString("es-DO") + "</span><b class=\"" + (ultimoNeto >= 0 ? "is-success" : "is-danger") + "\">Ganancia real: " + (ultimoNeto >= 0 ? "+" : "-") + "RD$" + Math.abs(ultimoNeto).toLocaleString("es-DO") + "</b>", true);
  } else {
    set("of-ultimo-caso", "Cierra un caso para ver aquí cobro, costes y ganancia real.");
  }

  var etiquetasGasto = {
    piezas: "Piezas",
    comida: "Comida",
    cafe: "Cafe",
    bar: "Bar",
    compras: "Compras",
    belleza: "Salon",
    mejoras: "Mejoras",
    equipo: "Equipo",
    banco: "Banco",
    operaciones: "Operaciones",
    eventos: "Eventos",
    otros: "Otros",
  };
  var etiquetasIngreso = {
    reparaciones: "Reparaciones",
    clandestino: "Clandestino",
    eventos: "Eventos",
    misiones: "Misiones",
    cobranzas: "Cobranzas",
    juegos: "Juegos",
    prestamos: "Prestamos",
    otros: "Otros",
  };
  var gastosDetalle =
    resumenDia &&
    resumenDia.gastosDetalle &&
    typeof resumenDia.gastosDetalle === "object"
      ? resumenDia.gastosDetalle
      : {};
  var ingresosDetalle =
    resumenDia &&
    resumenDia.ingresosDetalle &&
    typeof resumenDia.ingresosDetalle === "object"
      ? resumenDia.ingresosDetalle
      : {};
  var topGastos = Object.keys(gastosDetalle)
    .map(function (k) {
      return {
        key: k,
        label: etiquetasGasto[k] || k,
        valor: Math.max(0, Math.round(gastosDetalle[k] || 0)),
      };
    })
    .filter(function (it) {
      return it.valor > 0;
    })
    .sort(function (a, b) {
      return b.valor - a.valor;
    })
    .slice(0, 4);
  var topIngresos = Object.keys(ingresosDetalle)
    .map(function (k) {
      return {
        key: k,
        label: etiquetasIngreso[k] || k,
        valor: Math.max(0, Math.round(ingresosDetalle[k] || 0)),
      };
    })
    .filter(function (it) {
      return it.valor > 0;
    })
    .sort(function (a, b) {
      return b.valor - a.valor;
    })
    .slice(0, 4);
  var renderListaMovimientos = function (items, amountClass) {
    if (!items.length) {
      return '<div class="of-factura-vacio">Sin movimientos registrados.</div>';
    }
    return `<ul class="of-facturas-list">${items
      .map(function (item) {
        return `<li class="of-factura-row"><span class="of-factura-label">${item.label}</span><strong class="${amountClass}">RD$${item.valor}</strong></li>`;
      })
      .join('')}</ul>`;
  };
  var detalleGastosHTML = topGastos.length
    ? renderListaMovimientos(topGastos, 'of-finanzas-gasto')
    : '<div class="of-factura-vacio">Sin gastos variables registrados.</div>';
  var detalleIngresosHTML = topIngresos.length
    ? renderListaMovimientos(topIngresos, 'of-finanzas-ingreso')
    : '<div class="of-factura-vacio">Sin ingresos variables registrados.</div>';
  var equipoResumenHTML = '';
  if (
    typeof mecanicos !== "undefined" &&
    Array.isArray(mecanicos) &&
    mecanicos.length > 0
  ) {
    var tarjetasEquipo = mecanicos.map(function (m) {
      var sal = 0;
      if (
        typeof cierreFacturasPendientes !== "undefined" &&
        cierreFacturasPendientes &&
        cierreFacturasPendientes.empleados
      ) {
        sal = Math.round(
          (cierreFacturasPendientes.empleados || 0) /
            Math.max(1, mecanicos.length),
        );
      } else {
        sal = Math.round(800 + (m.habilidad || 0.5) * 600);
      }
      var humorValor =
        typeof calcularHumorEfectivo === "function"
          ? Number(calcularHumorEfectivo(m))
          : Number(m.humor);
      if (!Number.isFinite(humorValor)) humorValor = 7;
      humorValor = Math.max(1, Math.min(10, humorValor));
      var humorClass =
        humorValor >= 7 ? 'is-good' : humorValor >= 5 ? 'is-mid' : 'is-low';
      return `
        <article class="of-team-salary-card">
          <div class="of-team-salary-top">
            <strong class="of-team-name">${m.nombre}</strong>
            <span class="of-team-level">Nv.${m.nivel || 1}</span>
          </div>
          <div class="of-team-salary-pay">RD$${sal}</div>
          <div class="of-team-meta-row">
            <span class="of-team-meta-label">Humor</span>
            <span class="of-team-mood ${humorClass}">${humorValor.toFixed(1)}/10</span>
          </div>
        </article>
      `;
    });
    equipoResumenHTML = `
      <div class="of-card of-card-equipo-resumen">
        <div class="of-card-header">Equipo</div>
        <div class="of-card-body">
          <div class="of-team-salary-grid">${tarjetasEquipo.join('')}</div>
        </div>
      </div>
    `;
    var tarjetasDecisionEquipo = mecanicos.map(function (m) {
      var habilidad = Math.max(0, Math.min(1, Number(m.habilidad) || 0.5));
      var humorEquipo = typeof calcularHumorEfectivo === "function" ? Number(calcularHumorEfectivo(m)) : Number(m.humor);
      if (!Number.isFinite(humorEquipo)) humorEquipo = 7;
      var trabajoActivo = (reparacionesActivas || []).some(function (rep) { return rep && rep.mecanicoNombre === m.nombre && !rep.listoParaCobro; });
      var casosMec = Math.max(0, Math.round(m.casosCompletados || m.trabajosCompletados || 0));
      var costeCaso = Math.max(80, Math.round(80 + habilidad * 70));
      return `<article class="of-team-decision"><div class="of-team-decision-head"><strong>${limpiarHtmlBasico(m.nombre || "Mecánico")}</strong><span>${limpiarHtmlBasico(m.especialidad || "general")}</span></div><div class="of-team-decision-meta"><span>Precisión <b>${Math.round(habilidad * 100)}%</b></span><span>Humor <b>${Math.max(1, Math.min(10, humorEquipo)).toFixed(1)}/10</b></span><span>Coste/caso <b>RD$${costeCaso}</b></span><span>${trabajoActivo ? "Estado <b>OCUPADO</b>" : "Estado <b>DISPONIBLE</b>"}</span><span>Casos <b>${casosMec}</b></span><span>Bonus <b>+10% ${limpiarHtmlBasico(m.especialidad || "general")}</b></span></div></article>`;
    });
    set("of-equipo-decisiones", tarjetasDecisionEquipo.join(""), true);
  } else {
    set("of-equipo-decisiones", "No hay mecánicos disponibles. Revisa candidatos para restaurar capacidad.");
  }
  var facturasHTML = `
    <div class="of-card of-card-facturas">
      <div class="of-facturas-panels">
        <section class="of-factura-panel is-gastos">
          <div class="of-card-header">Detalle de Gastos</div>
          <div class="of-card-body">${detalleGastosHTML}</div>
        </section>
        <section class="of-factura-panel is-ingresos">
          <div class="of-card-header">Detalle de Ingresos</div>
          <div class="of-card-body">${detalleIngresosHTML}</div>
        </section>
      </div>
      ${equipoResumenHTML}
    </div>
  `;
  set("of-facturas", facturasHTML, true);

  var estadoDueno = "Estado operable: sin penalizacion relevante.";
  if (modoNivelesActivo()) {
    var pctNivel = Math.round(
      (progresoNivel / Math.max(1, progresoNivelMeta)) * 100,
    );
    estadoDueno = `Modo niveles activo: Nivel ${nivelJugador} (${pctNivel}%) | ahorro acumulado RD$${Math.round(ahorroAcumulado)}.`;
  } else {
    var rendimiento =
      typeof obtenerFactorRendimientoJugador === "function"
        ? obtenerFactorRendimientoJugador()
        : 1;
    var penalizacionPct = Math.max(0, Math.round((1 - rendimiento) * 100));
    if (hambre >= 96 || sueno >= 96 || estres >= 98) {
      estadoDueno =
        "Estado critico: acciones tecnicas bloqueadas hasta comer/descansar/bajar estres.";
    } else if (penalizacionPct >= 35) {
      estadoDueno = `Estado pesado: rendimiento ${Math.round(rendimiento * 100)}%, penalizacion alta (${penalizacionPct}%).`;
    } else if (penalizacionPct >= 18) {
      estadoDueno = `Estado tenso: rendimiento ${Math.round(rendimiento * 100)}%, el taller pierde precision.`;
    }
  }
  set("of-estado-resumen", estadoDueno);

  // Copiar valores de mejoras del panel original
  var copy = function (ofId, srcId) {
    var src = document.getElementById(srcId);
    var dst = document.getElementById(ofId);
    if (src && dst) dst.innerText = src.innerText;
  };
  copy("of-mej-h", "mej-herramientas");
  copy("of-mej-t", "mej-taller");
  copy("of-mej-p", "mej-publicidad");
  copy("of-mej-e", "espacios-max");
  copy("of-mej-m", "mej-maquina");
  copy("of-mej-ea", "equipo-activo");
  copy("of-mej-ay", "ayudante-estado");
  copy("of-mej-cb", "mej-caja-b");

  // Barras de estado del taller con escala legible para cada eje
  var pct = function (v, max) {
    var n = Math.max(0, Number(v) || 0);
    var m = Math.max(1, Number(max) || 1);
    return Math.max(0, Math.min(100, Math.round((n / m) * 100)));
  };
  var setBar = function (id, valorPct) {
    var el = document.getElementById(id);
    if (!el) return;
    el.style.width =
      Math.max(0, Math.min(100, Math.round(valorPct || 0))) + "%";
  };
  var setMeta = function (id, texto) {
    var el = document.getElementById(id);
    if (el) el.innerText = texto;
  };
  var parseNum = function (texto, fallback) {
    var n = parseInt(String(texto || "").replace(/[^0-9-]/g, ""), 10);
    return Number.isFinite(n) ? n : fallback;
  };

  var herramientasTxt = String(
    (document.getElementById("of-mej-h") || {}).innerText || "",
  ).toLowerCase();
  var nivelHerr = herramientasTxt.includes("avanz")
    ? 3
    : herramientasTxt.includes("prof")
      ? 2
      : 1;
  var maxHerr = Math.max(
    1,
    (((ECONOMY_DATA.requisitosMejora || {}).herramientas || {}).max || 2) + 1,
  );
  setBar("of-mej-bar-h", pct(nivelHerr, maxHerr));
  setMeta(
    "of-mej-h-meta",
    `Nivel ${nivelHerr}/${maxHerr}: mejora precision y reduce retrabajo.`,
  );

  var nivelTallerVal = parseNum(
    (document.getElementById("of-mej-t") || {}).innerText,
    1,
  );
  var nivelTallerMax = Math.max(
    1,
    (ECONOMY_DATA.mejoraTaller || {}).nivelMax || 6,
  );
  setBar("of-mej-bar-t", pct(nivelTallerVal, nivelTallerMax));
  setMeta(
    "of-mej-t-meta",
    `Nivel ${nivelTallerVal}/${nivelTallerMax}: desbloquea mejoras y capacidad.`,
  );

  var publicidadVal = parseNum(
    (document.getElementById("of-mej-p") || {}).innerText,
    0,
  );
  var publicidadMax = Math.max(
    1,
    ((ECONOMY_DATA.requisitosMejora || {}).publicidad || {}).max || 4,
  );
  setBar("of-mej-bar-p", pct(publicidadVal, publicidadMax));
  setMeta(
    "of-mej-p-meta",
    `Nivel ${publicidadVal}/${publicidadMax}: empuja flujo de clientes.`,
  );

  var espaciosVal = parseNum(
    (document.getElementById("of-mej-e") || {}).innerText,
    1,
  );
  var espaciosBase = Math.max(
    1,
    Math.round(ECONOMY_DATA.espaciosReparacionInicial || 2),
  );
  var espaciosMaxTeorico = Math.max(
    espaciosBase,
    espaciosBase + Math.max(0, nivelTallerMax - 1),
  );
  setBar("of-mej-bar-e", pct(espaciosVal, espaciosMaxTeorico));
  setMeta("of-mej-e-meta", `${espaciosVal} elevadores operativos.`);

  var equipoVal = parseNum(
    (document.getElementById("of-mej-ea") || {}).innerText,
    0,
  );
  var equipoMax = Math.max(
    1,
    ((window.TallerData || {}).mecanicosIniciales || []).length +
      ((window.TallerData || {}).mecanicosDisponiblesBase || []).length,
  );
  setBar("of-mej-bar-ea", pct(equipoVal, equipoMax));
  setMeta(
    "of-mej-ea-meta",
    `${equipoVal}/${equipoMax} mecanicos en plantilla.`,
  );

  var cajaBVal = parseNum(
    (document.getElementById("of-mej-cb") || {}).innerText,
    0,
  );
  var calorCajaB = Math.max(0, Math.min(100, Math.round(cajaBCalor || 0)));
  var cajaBRiesgoPct = Math.max(
    0,
    Math.min(100, Math.round(Math.max((cajaBVal / 3000) * 100, calorCajaB))),
  );
  setBar("of-mej-bar-cb", cajaBRiesgoPct);
  var barraCajaB = document.getElementById("of-mej-bar-cb");
  if (barraCajaB) {
    barraCajaB.classList.remove("is-warn", "is-danger");
    if (cajaBRiesgoPct >= 70) barraCajaB.classList.add("is-danger");
    else if (cajaBRiesgoPct >= 40) barraCajaB.classList.add("is-warn");
  }
  var etiquetaRiesgo =
    cajaBRiesgoPct >= 70
      ? "Riesgo alto"
      : cajaBRiesgoPct >= 40
        ? "Riesgo medio"
        : "Riesgo bajo";
  setMeta(
    "of-mej-cb-meta",
    `${etiquetaRiesgo}: RD$${Math.max(0, cajaBVal)} | calor ${calorCajaB}/100 | cupos ${Math.max(0, Math.round(cajaBCuposDisponibles || 0))}/3.`,
  );

  var maqEl = document.getElementById("of-mej-m");
  if (maqEl) maqEl.innerText = mejoras && mejoras.maquinaDiagnosis ? "Activa" : "No instalada";
  var ayEl = document.getElementById("of-mej-ay");
  if (ayEl)
    ayEl.innerText = /si/i.test(ayEl.innerText)
      ? "Contratado"
      : "No contratado";

  // Barra de prestigio del taller hacia el siguiente nivel
  var nivelActualOf = typeof tallerNivel !== "undefined" ? tallerNivel || 1 : 1;
  var nivelMaxOf =
    (ECONOMY_DATA &&
      ECONOMY_DATA.mejoraTaller &&
      ECONOMY_DATA.mejoraTaller.nivelMax) ||
    6;
  var repRequerida = (ECONOMY_DATA && ECONOMY_DATA.mejoraTaller) || {};
  var repSigNivel = Math.min(
    100,
    (repRequerida.repBase || 52) +
      nivelActualOf * (repRequerida.repPorNivel || 5),
  );
  var repActual = typeof reputacion !== "undefined" ? reputacion || 0 : 0;
  var prestigioPct =
    nivelActualOf >= nivelMaxOf
      ? 100
      : Math.min(100, Math.round((repActual / Math.max(1, repSigNivel)) * 100));
  var prestigioEl = document.getElementById("of-prestigio-bar");
  if (prestigioEl) {
    prestigioEl.style.width = prestigioPct + "%";
    var textoEl =
      document.getElementById("of-prestigio-label") ||
      (prestigioEl.parentElement &&
        prestigioEl.parentElement.previousElementSibling);
    if (textoEl)
      textoEl.textContent =
        "Prestigio Nv." +
        nivelActualOf +
        " \u2192 " +
        (nivelActualOf >= nivelMaxOf ? "MAX" : "Nv." + (nivelActualOf + 1)) +
        " (Rep. " +
        repActual +
        "/" +
        repSigNivel +
        ")";
  }

  // Datos del jugador
  var jn = document.getElementById("jugador-nombre-mini");
  var tn = document.getElementById("taller-nombre-mini");
  var jf = document.getElementById("jugador-foto-mini");
  if (jn) set("of-player-nombre", jn.innerText);
  if (tn) set("of-player-taller", tn.innerText);
  if (
    jf &&
    !jf.classList.contains("hidden") &&
    jf.src &&
    jf.src !== window.location.href
  ) {
    var foto = document.getElementById("of-player-foto");
    if (foto) {
      foto.src = jf.src;
      foto.classList.remove("hidden");
    }
  }

  // Malvavisco
  var mv = document.getElementById("malvavisco-estado");
  if (mv) set("of-malvavisco", mv.innerText);

  var muscleResumen = document.getElementById("of-muscle-resumen");
  if (muscleResumen) {
    var muscleData = (window.TallerData && window.TallerData.proyectoMuscleCar) || {};
    var muscleEstado = window.estadoProyectoMuscle || {};
    var muscleNivel = Math.max(1, Math.round(muscleEstado.nivel || 1));
    var muscleEtapa = Array.isArray(muscleData.niveles) ? muscleData.niveles[muscleNivel - 1] : null;
    var musclePct = Math.max(0, Math.min(100, Math.round((Number(muscleEstado.progreso) || 0) * 100)));
    if (muscleNivel >= 5) {
      muscleResumen.innerText = "Restaurado: listo para vender o atraer clientes premium.";
    } else if (muscleEstado.enProgreso) {
      muscleResumen.innerText = "Progreso " + musclePct + "% · la mejora ya está en marcha.";
    } else if (muscleEtapa) {
      muscleResumen.innerText = "Progreso " + musclePct + "% · próxima inversión RD$" + Math.max(0, Math.round(muscleEtapa.precio || 0)).toLocaleString("es-DO") + ".";
    } else {
      muscleResumen.innerText = "Proyecto disponible cuando tengas caja libre.";
    }
  }
}

function actualizarScreenExterior() {
  var set = function (id, val, asHtml = false) {
    var el = document.getElementById(id);
    if (el) {
      if (asHtml) el.innerHTML = val;
      else el.innerText = val;
    }
  };
  var formatMoneda = function(monto) {
    return Math.max(0, Math.round(monto || 0)).toLocaleString('es-DO');
  };

  var setBar = function (fillId, labelId, ratio, label, warnAt, dangerAt) {
    var fill = document.getElementById(fillId);
    var tag = document.getElementById(labelId);
    var pct = Math.max(0, Math.min(100, Math.round((ratio || 0) * 100)));
    if (fill) {
      // Añadir transición suave
      fill.style.transition = "width 0.4s ease-out, background-color 0.4s ease";
      fill.style.width = pct + "%";
      fill.classList.toggle(
        "warn",
        pct >= Math.round((warnAt || 0.55) * 100) &&
          pct < Math.round((dangerAt || 0.82) * 100),
      );
      fill.classList.toggle(
        "danger",
        pct >= Math.round((dangerAt || 0.82) * 100),
      );
    }
    if (tag) tag.innerText = label;
  };
  var deudaSegura = Math.max(0, Math.round(deuda || 0));
  var limite =
    typeof calcularLimiteCreditoBanco === "function"
      ? Math.max(0, Math.round(calcularLimiteCreditoBanco()))
      : Math.max(0, Math.round(deudaSegura + 5000));
  var disponible =
    typeof obtenerCreditoDisponibleBanco === "function"
      ? Math.max(0, Math.round(obtenerCreditoDisponibleBanco()))
      : Math.max(0, limite - deudaSegura);
  var umbral =
    window.TallerApp &&
    window.TallerApp.config &&
    window.TallerApp.config.bancoMoraCasosUmbral
      ? Math.max(2, Math.round(window.TallerApp.config.bancoMoraCasosUmbral))
      : 4;
  var casosSinPago = Math.max(0, Math.round(bancoCasosSinPago || 0));
  var faltan = Math.max(0, umbral - casosSinPago);
  var diaActual = typeof dia === "number" ? dia : 1;
  var cuotaSugerida =
    typeof calcularCuotaBancoCierre === "function"
      ? Math.max(
          0,
          Math.round(calcularCuotaBancoCierre(deudaSegura, diaActual)),
        )
      : Math.max(0, Math.round(deudaSegura * 0.03));
  var moraEstimada =
    typeof calcularMoraBancoPendiente === "function"
      ? Math.max(
          0,
          Math.round(calcularMoraBancoPendiente(deudaSegura, diaActual)),
        )
      : Math.max(0, Math.round(deudaSegura * 0.016));
  var costoRefi = Math.max(350, Math.round(deudaSegura * 0.022));
  var creditoUsado = Math.max(0, limite - disponible);
  var ratioCredito = limite > 0 ? creditoUsado / limite : 0;
  var ratioMora = umbral > 0 ? casosSinPago / umbral : 0;
  var deudaSaldada = deudaSegura <= 0;
  var cuotaStat = document.getElementById("ext-cuota-hoy");
  var moraFillEl = document.getElementById("ext-mora-fill");
  var refiInfo = document.getElementById("ext-refi-info");
  var btnPagar500 = document.getElementById("ext-bank-pay-500");
  var btnPagar1000 = document.getElementById("ext-bank-pay-1000");
  var btnPagar2000 = document.getElementById("ext-bank-pay-2000");
  var btnPrestamo = document.getElementById("ext-bank-loan-1000");
  var btnGerente = document.getElementById("ext-bank-talk");
  var btnRefi = document.getElementById("ext-bank-refi");

  var alternarContenedor = function (elemento, selector, oculto) {
    if (!elemento || !elemento.closest) return;
    var contenedor = elemento.closest(selector);
    if (contenedor) contenedor.classList.toggle("hidden", !!oculto);
  };

  set("ext-deuda", deudaSaldada ? "Deuda saldada" : "RD$ " + formatMoneda(deudaSegura));
  set("ext-deuda-top", deudaSaldada ? "Deuda saldada" : "RD$ " + formatMoneda(deudaSegura));
  set("ext-credito-disponible", "RD$ " + formatMoneda(disponible));
  set("ext-cuota-hoy", "RD$ " + formatMoneda(cuotaSugerida));
  setBar(
    "ext-credito-uso-fill",
    "ext-credito-uso-label",
    ratioCredito,
    "Usado RD$ " + formatMoneda(creditoUsado) + " / Limite RD$ " + formatMoneda(limite),
    0.55,
    0.82,
  );
  if (!deudaSaldada) {
    setBar(
      "ext-mora-fill",
      "ext-mora-label",
      ratioMora,
      casosSinPago + " / " + umbral + " casos",
      0.5,
      1,
    );
    set(
      "ext-refi-info",
      `<strong>&#x26A0; Aviso:</strong> Mora estimada: RD$ ${formatMoneda(moraEstimada)}. Refinanciar suma aprox. RD$ ${formatMoneda(costoRefi)} a la deuda total.`,
      true
    );
  } else {
    set(
      "ext-refi-info",
      `Linea disponible: RD$ ${formatMoneda(disponible)}. Usa credito solo para movimientos que aceleren ingresos.`,
      true
    );
  }
  set("ext-saldo", "RD$ " + formatMoneda(saldo));
  set("ext-estres", estres + "%");
  set("ext-hambre", hambre + "%");
  set("ext-reput", reputacion);

  var recomendacionBanco = "Estado financiero estable.";
  var colorRecomendacion = "#a3c2a4"; // Verde suave
  if (deudaSaldada) {
    recomendacionBanco = "Deuda saldada. Si necesitas capital, solicita credito desde una linea disponible.";
  } else if (saldo >= cuotaSugerida && faltan <= 1) {
    recomendacionBanco =
      "Riesgo de mora cercano: paga cuota para evitar recargo.";
    colorRecomendacion = "#e8b273"; // Amarillo
  } else if (saldo < Math.round(cuotaSugerida * 0.6)) {
    recomendacionBanco =
      "Caja limitada: refinanciar puede evitar mora inmediata.";
    colorRecomendacion = "#e88073"; // Rojo
  } else {
    recomendacionBanco = "Mantener pagos parciales reduce presion de deuda.";
  }
  
  var recHtml = deudaSaldada
    ? `<div style="padding:8px; border-radius:6px; background:rgba(0,0,0,0.3); border-left:3px solid ${colorRecomendacion}">
    <strong style="color:${colorRecomendacion}">Recomendacion:</strong> ${recomendacionBanco} <br>
    <small style="color:#8a9c9f">Linea disponible actual: RD$ ${formatMoneda(disponible)}.</small>
  </div>`
    : `<div style="padding:8px; border-radius:6px; background:rgba(0,0,0,0.3); border-left:3px solid ${colorRecomendacion}">
    <strong style="color:${colorRecomendacion}">Recomendacion:</strong> ${recomendacionBanco} <br>
    <small style="color:#8a9c9f">Faltan ${faltan} caso(s) sin pago para aplicar mora.</small>
  </div>`;
  set(
    "ext-banco-recomendacion",
    recHtml,
    true
  );

  alternarContenedor(cuotaStat, ".ext-bank-stat", deudaSaldada);
  alternarContenedor(moraFillEl, ".ext-bank-bar-box", deudaSaldada);
  if (refiInfo && refiInfo.parentElement) {
    refiInfo.parentElement.classList.toggle("ext-bank-tip-alert", !deudaSaldada);
    refiInfo.parentElement.classList.toggle("hidden", false);
  }
  [btnPagar500, btnPagar1000, btnPagar2000, btnRefi].forEach(function (btn) {
    if (btn) btn.classList.toggle("hidden", deudaSaldada);
  });
  if (btnPrestamo) {
    btnPrestamo.innerText = deudaSaldada ? "Solicitar credito" : "Prestamo +RD$1000";
  }
  if (btnGerente) {
    btnGerente.innerText = deudaSaldada ? "Linea disponible" : "Hablar con el gerente";
  }

  var cuposCajaB = Math.max(
    0,
    Math.min(3, Math.round(cajaBCuposDisponibles || 0)),
  );
  var calorCajaB = Math.max(0, Math.min(100, Math.round(cajaBCalor || 0)));
  var montoCajaB = Math.max(0, Math.round(cajaB || 0));
  var casosTotales = Math.max(
    0,
    Math.round(
      ((tramaEstado && tramaEstado.casosCriticosResueltos) || 0) +
        ((tramaEstado && tramaEstado.casosParciales) || 0),
    ),
  );
  var faltanParaCupo = 3 - (casosTotales % 3);
  if (faltanParaCupo === 3) faltanParaCupo = 0;

  set("ext-cajab-monto", "RD$ " + formatMoneda(montoCajaB));
  set("ext-cajab-cupos", cuposCajaB + "/3");
  set("ext-cajab-calor", calorCajaB + "/100");
  set("modal-cajab-monto", "RD$ " + formatMoneda(montoCajaB));
  set("modal-cajab-cupos", cuposCajaB + "/3");
  set("modal-cajab-calor", calorCajaB + "/100");
  var modalCuposFill = document.getElementById("modal-cajab-cupos-fill");
  var modalCalorFill = document.getElementById("modal-cajab-calor-fill");
  if (modalCuposFill) modalCuposFill.style.width = Math.round((cuposCajaB / 3) * 100) + "%";
  if (modalCalorFill) modalCalorFill.style.width = calorCajaB + "%";
  
  var nivelCalorText = calorCajaB >= 70 ? "<span style='color:#e05050'>Alto</span>" : calorCajaB >= 40 ? "<span style='color:#e0b050'>Medio</span>" : "<span style='color:#6fcf97'>Bajo</span>";
  var metaHtml = cuposCajaB > 0
      ? `<div style="padding:6px; background:rgba(20,10,10,0.5); border-radius:4px; border:1px solid #5a3232;">
          Tienes <strong>${cuposCajaB}</strong> movida(s) disponible(s).<br>
          Nivel de rastreo (Calor): ${nivelCalorText}.
         </div>`
      : `<div style="padding:6px; background:rgba(30,30,30,0.5); border-radius:4px; color:#888;">
          Sin cupos. Cierra <strong>${faltanParaCupo}</strong> caso(s) mas para recuperar 1 movida.
         </div>`;
         
  set(
    "ext-cajab-meta",
    metaHtml,
    true
  );

  var btnPicoteo = document.getElementById("btn-cajab-picoteo");
  var btnRescate = document.getElementById("btn-cajab-rescate");
  var btnCuadre = document.getElementById("btn-cajab-cuadre");
  if (btnPicoteo) btnPicoteo.disabled = cuposCajaB <= 0;
  if (btnRescate) btnRescate.disabled = cuposCajaB <= 0;
  if (btnCuadre) btnCuadre.disabled = cuposCajaB <= 0 || montoCajaB < 210;
}

function actualizarIndicadoresCajaBUI() {
  if (typeof actualizarScreenExterior === "function") {
    actualizarScreenExterior();
  }
}

function limitarValorMapa(valor, minimo, maximo) {
  var numero = Number(valor);
  if (!Number.isFinite(numero)) numero = minimo;
  return Math.max(minimo, Math.min(maximo, numero));
}

function obtenerCantidadCasosCompetenciaBarrio() {
  if (typeof obtenerCasosCompletadosNarrativa === "function") {
    return Math.max(0, Math.round(obtenerCasosCompletadosNarrativa() || 0));
  }
  if (resumenCasos && Number.isFinite(Number(resumenCasos.totalCasosJugados))) {
    return Math.max(0, Math.round(Number(resumenCasos.totalCasosJugados) || 0));
  }
  return 0;
}

function obtenerIndiceCompetenciaBarrioJugador() {
  var nivelTallerActual = Math.max(1, Math.round(tallerNivel || 1));
  var nivelPerfil = Math.max(1, Math.round(nivelJugador || 1));
  var reputacionActual = Math.max(0, Math.round(reputacion || 0));
  var ahorroActual = Math.max(0, Math.round(ahorroAcumulado || 0));
  var casosActuales = obtenerCantidadCasosCompetenciaBarrio();
  var progresoMeta = Math.max(1, Number(progresoNivelMeta || 1));
  var progresoActual = limitarValorMapa(
    Number(progresoNivel || 0) / progresoMeta,
    0,
    1.2,
  );
  return (
    nivelTallerActual * 19 +
    nivelPerfil * 8 +
    reputacionActual * 0.48 +
    casosActuales * 0.82 +
    ahorroActual / 1700 +
    progresoActual * 9
  );
}

function obtenerPulsoCompetenciaRivalBarrio(rivalId, diaReferencia) {
  var texto = String(rivalId || "rival");
  var codigo = 0;
  for (var i = 0; i < texto.length; i++) codigo += texto.charCodeAt(i);
  var fase = (codigo % 11) / 3;
  return (
    Math.sin((diaReferencia + fase) * 0.86) +
    Math.cos(diaReferencia * 0.47 + fase) * 0.45
  );
}

function obtenerPerfilCompetenciaRivalBarrio(rival) {
  var perfil = {
    reaccion: 1,
    disciplina: 1,
    arrastre: 1,
    ambicion: 1,
    foco: "estable",
  };

  if (!rival) return perfil;

  switch (rival.id) {
    case "autofix":
      perfil.reaccion = 1.38;
      perfil.disciplina = 0.98;
      perfil.arrastre = 1.12;
      perfil.ambicion = 1.3;
      perfil.foco = "velocidad";
      break;
    case "elchino":
      perfil.reaccion = 0.92;
      perfil.disciplina = 1.22;
      perfil.arrastre = 1.05;
      perfil.ambicion = 0.88;
      perfil.foco = "constancia";
      break;
    case "garajevip":
      perfil.reaccion = 1.08;
      perfil.disciplina = 1.12;
      perfil.arrastre = 1.28;
      perfil.ambicion = 1.18;
      perfil.foco = "premium";
      break;
    case "tallerpepe":
      perfil.reaccion = 0.84;
      perfil.disciplina = 0.96;
      perfil.arrastre = 1.32;
      perfil.ambicion = 0.82;
      perfil.foco = "barrio";
      break;
    case "lareina":
      perfil.reaccion = 1.02;
      perfil.disciplina = 1.16;
      perfil.arrastre = 1.24;
      perfil.ambicion = 0.96;
      perfil.foco = "comunidad";
      break;
    case "gruasos":
      perfil.reaccion = 1.2;
      perfil.disciplina = 0.9;
      perfil.arrastre = 0.94;
      perfil.ambicion = 1.08;
      perfil.foco = "oportunidad";
      break;
    default:
      break;
  }

  return perfil;
}

function crearEstadoRivalCompetenciaBarrio(rival) {
  var texto = String((rival && rival.id) || "rival");
  var codigo = 0;
  for (var i = 0; i < texto.length; i++) codigo += texto.charCodeAt(i);
  return {
    nivelExtra: ((codigo % 5) - 2) * 0.08,
    repExtra: ((codigo % 7) - 3) * 0.9,
    forma: ((codigo % 9) - 4) * 0.18,
    presion: 0,
    ultimoEmpuje: 0,
  };
}

function normalizarEstadoRivalCompetenciaBarrio(estadoRival) {
  var base = estadoRival && typeof estadoRival === "object" ? estadoRival : {};
  return {
    nivelExtra: limitarValorMapa(base.nivelExtra, -1.2, 5.2),
    repExtra: limitarValorMapa(base.repExtra, -20, 140),
    forma: limitarValorMapa(base.forma, -6, 8),
    presion: limitarValorMapa(base.presion, 0, 40),
    ultimoEmpuje: limitarValorMapa(base.ultimoEmpuje, 0, 24),
  };
}

function asegurarCompetenciaBarrioEstado() {
  var rivales = Array.isArray(window.RIVALES_BARRIO)
    ? window.RIVALES_BARRIO
    : [];
  var diaActual = Math.max(1, Math.round(dia || 1));
  var indiceActual = obtenerIndiceCompetenciaBarrioJugador();

  if (!competenciaBarrioEstado || typeof competenciaBarrioEstado !== "object") {
    competenciaBarrioEstado = {
      version: 2,
      ultimoDia: diaActual,
      ultimoIndiceJugador: indiceActual,
      rivales: {},
    };
  }

  if (
    !competenciaBarrioEstado.rivales ||
    typeof competenciaBarrioEstado.rivales !== "object"
  ) {
    competenciaBarrioEstado.rivales = {};
  }
  if (!Number.isFinite(competenciaBarrioEstado.ultimoDia))
    competenciaBarrioEstado.ultimoDia = diaActual;
  if (!Number.isFinite(competenciaBarrioEstado.ultimoIndiceJugador)) {
    competenciaBarrioEstado.ultimoIndiceJugador = indiceActual;
  }

  for (var i = 0; i < rivales.length; i++) {
    var rival = rivales[i];
    if (!competenciaBarrioEstado.rivales[rival.id]) {
      competenciaBarrioEstado.rivales[rival.id] =
        crearEstadoRivalCompetenciaBarrio(rival);
    }
    competenciaBarrioEstado.rivales[rival.id] =
      normalizarEstadoRivalCompetenciaBarrio(
        competenciaBarrioEstado.rivales[rival.id],
      );
  }

  // Migracion: partidas con estado viejo podian dejar rivales demasiado por debajo.
  if (
    !Number.isFinite(competenciaBarrioEstado.version) ||
    competenciaBarrioEstado.version < 2
  ) {
    var repJugador = Math.max(0, Math.round(reputacion || 0));
    var nivelJugadorLocal = Math.max(1, Math.round(tallerNivel || 1));
    for (var m = 0; m < rivales.length; m++) {
      var rivalMig = rivales[m];
      var mig = normalizarEstadoRivalCompetenciaBarrio(
        competenciaBarrioEstado.rivales[rivalMig.id],
      );
      mig.repExtra = limitarValorMapa(
        Math.max(
          mig.repExtra,
          (repJugador -
            Math.max(10, Math.round(rivalMig.reputacionBase || 35))) *
            0.4,
        ),
        -20,
        140,
      );
      mig.nivelExtra = limitarValorMapa(
        Math.max(
          mig.nivelExtra,
          (nivelJugadorLocal -
            Math.max(1, Math.round(rivalMig.nivelBase || 1))) *
            0.28,
        ),
        -1.2,
        5.2,
      );
      competenciaBarrioEstado.rivales[rivalMig.id] = mig;
    }
    competenciaBarrioEstado.version = 2;
  }

  if (competenciaBarrioEstado.ultimoDia > diaActual)
    competenciaBarrioEstado.ultimoDia = diaActual;
  return competenciaBarrioEstado;
}

function sincronizarCompetenciaBarrioEstado() {
  var estado = asegurarCompetenciaBarrioEstado();
  var rivales = Array.isArray(window.RIVALES_BARRIO)
    ? window.RIVALES_BARRIO
    : [];
  var diaActual = Math.max(1, Math.round(dia || 1));
  var indiceActual = obtenerIndiceCompetenciaBarrioJugador();
  var indicePrevio = Number(estado.ultimoIndiceJugador || indiceActual);

  while (estado.ultimoDia < diaActual) {
    var diaPaso = estado.ultimoDia + 1;
    for (var i = 0; i < rivales.length; i++) {
      var rival = rivales[i];
      var perfil = obtenerPerfilCompetenciaRivalBarrio(rival);
      var rivalEstado =
        estado.rivales[rival.id] || crearEstadoRivalCompetenciaBarrio(rival);
      var pulso = obtenerPulsoCompetenciaRivalBarrio(rival.id, diaPaso);
      var presionJugador = Math.max(
        0,
        indicePrevio -
          (rival.nivelBase * 18 +
            rival.reputacionBase * 0.42 +
            rivalEstado.repExtra * 0.35),
      );
      rivalEstado.nivelExtra = limitarValorMapa(
        rivalEstado.nivelExtra +
          rival.crecimientoPorDia * (0.2 + perfil.disciplina * 0.08) +
          pulso * 0.06 +
          presionJugador * 0.0032 * perfil.ambicion,
        -0.6,
        3.5,
      );
      rivalEstado.repExtra = limitarValorMapa(
        rivalEstado.repExtra +
          1.15 +
          perfil.arrastre * 0.72 +
          pulso * 0.55 +
          presionJugador * 0.014,
        -10,
        45,
      );
      rivalEstado.forma = limitarValorMapa(
        rivalEstado.forma * 0.48 + pulso * perfil.disciplina,
        -4.5,
        6.5,
      );
      rivalEstado.presion = limitarValorMapa(
        rivalEstado.presion * 0.66 + presionJugador * 0.042,
        0,
        30,
      );
      rivalEstado.ultimoEmpuje = limitarValorMapa(
        (rivalEstado.ultimoEmpuje || 0) * 0.5,
        0,
        18,
      );
      estado.rivales[rival.id] = rivalEstado;
    }
    estado.ultimoDia = diaPaso;
  }

  if (indiceActual > indicePrevio + 0.25) {
    var deltaJugador = indiceActual - indicePrevio;
    for (var j = 0; j < rivales.length; j++) {
      var rivalActual = rivales[j];
      var perfilActual = obtenerPerfilCompetenciaRivalBarrio(rivalActual);
      var estadoRival =
        estado.rivales[rivalActual.id] ||
        crearEstadoRivalCompetenciaBarrio(rivalActual);
      var reaccion = deltaJugador * perfilActual.reaccion;
      estadoRival.repExtra = limitarValorMapa(
        estadoRival.repExtra +
          reaccion * (0.065 + perfilActual.arrastre * 0.024),
        -10,
        45,
      );
      estadoRival.nivelExtra = limitarValorMapa(
        estadoRival.nivelExtra +
          Math.max(0, reaccion - 8) * 0.015 * perfilActual.ambicion,
        -0.6,
        3.5,
      );
      estadoRival.presion = limitarValorMapa(
        estadoRival.presion + reaccion * 0.07,
        0,
        30,
      );
      estadoRival.forma = limitarValorMapa(
        estadoRival.forma + Math.min(2.4, reaccion * 0.03) - 0.18,
        -4.5,
        6.5,
      );
      estadoRival.ultimoEmpuje = limitarValorMapa(reaccion, 0, 18);
      estado.rivales[rivalActual.id] = estadoRival;
    }
    estado.ultimoIndiceJugador = indiceActual;
  }

  if (estado.ultimoIndiceJugador < indiceActual)
    estado.ultimoIndiceJugador = indiceActual;
  return estado;
}

function obtenerTonoCompetenciaRivalBarrio(brechaIndice, empuje, presion) {
  if (brechaIndice <= -18 && empuje < 2.5) {
    return { tendencia: "Controlando", presion: "Te saca ventaja" };
  }
  if (empuje >= 9 || presion >= 11) {
    return { tendencia: "Acechando", presion: "Te siente crecer" };
  }
  if (presion >= 6 || brechaIndice >= 10) {
    return { tendencia: "Reaccionando", presion: "Bajo presion" };
  }
  if (empuje <= 1.2 && brechaIndice < 4) {
    return { tendencia: "Constante", presion: "Pulso parejo" };
  }
  return {
    tendencia: "Moviendose",
    presion: brechaIndice >= 6 ? "No quiere soltarte" : "Midiendo el barrio",
  };
}

function obtenerRivalesCompetitivosBarrio() {
  var estado = sincronizarCompetenciaBarrioEstado();
  var rivales = Array.isArray(window.RIVALES_BARRIO)
    ? window.RIVALES_BARRIO
    : [];
  var diaActual = Math.max(1, Math.round(dia || 1));
  var indiceActual = obtenerIndiceCompetenciaBarrioJugador();
  var repJugador = Math.max(0, Math.round(reputacion || 0));
  var nivelJugadorLocal = Math.max(1, Math.round(tallerNivel || 1));
  var casosJugador = obtenerCantidadCasosCompetenciaBarrio();
  var progresoMeta = Math.max(1, Number(progresoNivelMeta || 1));
  var progresoPct = limitarValorMapa(
    (Number(progresoNivel || 0) / progresoMeta) * 100,
    0,
    140,
  );
  var empujeJugador =
    repJugador * 0.62 +
    nivelJugadorLocal * 10.5 +
    casosJugador * 0.35 +
    progresoPct * 0.24;

  return rivales.map(function (rival) {
    var perfil = obtenerPerfilCompetenciaRivalBarrio(rival);
    var rivalEstado = normalizarEstadoRivalCompetenciaBarrio(
      estado.rivales[rival.id] || crearEstadoRivalCompetenciaBarrio(rival),
    );
    var baseNivel = rival.nivelBase + diaActual * rival.crecimientoPorDia;
    var baseRep = rival.reputacionBase + diaActual * 1.5;
    var umbralRival =
      Math.max(10, Number(rival.reputacionBase || 35)) * 0.58 +
      Math.max(1, Number(rival.nivelBase || 1)) * 7.8 +
      diaActual * 1.35;
    var presionEscalada = Math.max(0, empujeJugador - umbralRival);
    var indiceRivalBase =
      baseNivel * 19 + baseRep * 0.43 + rivalEstado.repExtra * 0.28;
    var brechaIndice = indiceActual - indiceRivalBase;
    var empujeDirecto =
      Math.max(0, brechaIndice) * 0.014 * perfil.reaccion +
      presionEscalada * 0.0075 * perfil.reaccion;
    var pisoNivelCompetitivo = limitarValorMapa(
      nivelJugadorLocal - 1.8 + perfil.ambicion * 0.25,
      1,
      6,
    );
    var nivelActual = Math.round(
      limitarValorMapa(
        baseNivel +
          rivalEstado.nivelExtra +
          rivalEstado.forma * 0.08 +
          empujeDirecto +
          presionEscalada * 0.0038 * perfil.ambicion,
        1,
        6,
      ),
    );
    nivelActual = Math.max(nivelActual, Math.round(pisoNivelCompetitivo));
    var pisoRepCompetitivo = limitarValorMapa(
      repJugador * 0.55 + 12 + perfil.arrastre * 2.2,
      18,
      92,
    );
    var repActual = Math.round(
      limitarValorMapa(
        baseRep +
          rivalEstado.repExtra +
          rivalEstado.forma * 0.72 +
          rivalEstado.presion * 0.38 +
          empujeDirecto * 3.8 +
          presionEscalada * 0.095 * perfil.arrastre,
        pisoRepCompetitivo,
        100,
      ),
    );
    var tono = obtenerTonoCompetenciaRivalBarrio(
      brechaIndice,
      rivalEstado.ultimoEmpuje || 0,
      rivalEstado.presion || 0,
    );

    return {
      id: rival.id,
      nombre: rival.nombre,
      icono: rival.icono,
      especialidad: rival.especialidad,
      descripcion: rival.descripcion,
      color: rival.color,
      nivelActual: nivelActual,
      repActual: repActual,
      tendencia: tono.tendencia,
      presionTexto: tono.presion,
      foco: perfil.foco,
      empuje: rivalEstado.ultimoEmpuje || 0,
      presion: rivalEstado.presion || 0,
      brechaIndice: brechaIndice,
    };
  });
}

function actualizarScreenMapa() {
  var set = function (id, val) {
    var el = document.getElementById(id);
    if (el) el.innerText = val;
  };
  var setHTML = function (id, html) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = html;
  };

  var nivelTaller = Math.max(1, Math.round(tallerNivel || 1));
  var rep = Math.round(reputacion || 0);
  var diaActual = Math.max(1, Math.round(dia || 1));
  var indiceJugador = obtenerIndiceCompetenciaBarrioJugador();

  set("mapa-mi-nivel", "Nv." + nivelTaller);
  set("mapa-mi-rep", rep + " pts");
  set("mapa-dia-actual", "Dia " + diaActual);

  // Arco narrativo actual
  var arcoId = arcoNarrativoActual || null;
  var arcoData = null;
  var arcos = (window.TallerData && window.TallerData.arcoNarrativo) || [];
  for (var ai = 0; ai < arcos.length; ai++) {
    if (arcos[ai].id === arcoId) {
      arcoData = arcos[ai];
      break;
    }
  }
  set(
    "mapa-arco-actual",
    arcoData ? arcoData.titulo.replace("Arco ", "Arco ") : "Arco 1",
  );

  var zonasBarrio = (window.TallerData && Array.isArray(window.TallerData.zonasBarrio))
    ? window.TallerData.zonasBarrio
    : [];
  var casosZona = Math.max(0, Math.round((resumenCasos && resumenCasos.totalCasosJugados) || 0));
  setHTML("mapa-zonas", zonasBarrio.map(function(zona) {
    var desbloqueada = casosZona >= (zona.requisitoCasos || 0) && nivelTaller >= (zona.requisitoNivel || 1);
    var memoriaNarrativa = window.obtenerMemoriaNarrativa ? window.obtenerMemoriaNarrativa() : {};
    var zonasDesbloqueadas = Array.isArray(memoriaNarrativa.zonasDesbloqueadas) ? memoriaNarrativa.zonasDesbloqueadas : [];
    if (desbloqueada && zona.id !== 'taller' && zona.id !== 'corredor-comercial' && zona.id !== 'centro-gestion' && zonasDesbloqueadas.indexOf(zona.id) < 0 && typeof registrarEventoNarrativo === 'function') {
      registrarEventoNarrativo('zona_desbloqueada', { zona: zona.id, nivel: nivelTaller, casos: casosZona });
    }
    var requisito = desbloqueada
      ? (zona.estado || 'Disponible')
      : 'Desbloquea con ' + (zona.requisitoCasos || 0) + ' casos y nivel ' + (zona.requisitoNivel || 1);
    var accion = desbloqueada ? "navegarPantalla('" + zona.accion + "')" : "mostrarFeedbackGameplay('Zona bloqueada: completa el requisito indicado.', 'warn')";
    return '<button class="mapa-zona-card' + (desbloqueada ? '' : ' is-locked') + '" onclick="' + accion + '"><b>' + zona.icono + ' ' + zona.nombre + '</b><span>' + zona.descripcion + '</span><strong>' + requisito + '</strong></button>';
  }).join(''));

  // Calcular metricas del jugador para el ranking
  var miReputacion = rep;
  var miNivel = nivelTaller;

  var rivales = obtenerRivalesCompetitivosBarrio();

  // Construir lista del ranking con el jugador incluido
  var todos = rivales.concat([
    {
      id: "jugador",
      nombre: "Tu Taller &#x2605;",
      icono: "&#x1F528;",
      especialidad: "Tu especialidad — Barrio propio",
      descripcion:
        "Tu taller. Cada decision que tomas aqui define tu posicion en el barrio.",
      color: "rival-jugador",
      nivelActual: miNivel,
      repActual: miReputacion,
      tendencia: "Tu ritmo",
      presionTexto: "Todos te estan leyendo",
      empuje: 0,
      presion: 0,
      brechaIndice: 0,
    },
  ]);

  // Ordenar por reputacion descendente
  todos.sort(function (a, b) {
    if (b.nivelActual !== a.nivelActual) return b.nivelActual - a.nivelActual;
    return b.repActual - a.repActual;
  });

  var rankingHTML = "";
  todos.forEach(function (t, idx) {
    var posicion = idx + 1;
    var esJugador = t.id === "jugador";
    var medallon =
      posicion === 1
        ? "&#x1F947;"
        : posicion === 2
          ? "&#x1F948;"
          : posicion === 3
            ? "&#x1F949;"
            : "#" + posicion;
    var nivelesEstrellas = "";
    for (var s = 0; s < 6; s++) {
      nivelesEstrellas += s < t.nivelActual ? "&#x2B50;" : "&#x2606;";
    }
    rankingHTML +=
      '<div class="mapa-rival-card' +
      (esJugador ? " mapa-rival-jugador" : "") +
      " " +
      (t.color || "") +
      '">';
    rankingHTML += '<div class="mapa-rival-pos">' + medallon + "</div>";
    rankingHTML += t.avatar
      ? '<img class="mapa-rival-avatar" src="' + t.avatar + '" alt="' + t.nombre + '" onerror="this.style.display=\'none\'">'
      : '<div class="mapa-rival-icono">' + t.icono + "</div>";
    rankingHTML += '<div class="mapa-rival-info">';
    rankingHTML += '<div class="mapa-rival-nombre">' + t.nombre + "</div>";
    rankingHTML += '<div class="mapa-rival-espec">' + t.especialidad + "</div>";
    rankingHTML +=
      '<div class="mapa-rival-nivel">' +
      nivelesEstrellas +
      " Rep: " +
      t.repActual +
      "</div>";
    rankingHTML +=
      '<div class="mapa-rival-estado"><span class="mapa-rival-chip">' +
      (t.tendencia || "Activo") +
      '</span><span class="mapa-rival-chip mapa-rival-chip-soft">' +
      (t.presionTexto || "Moviendose") +
      "</span></div>";
    rankingHTML += '<div class="mapa-rival-desc">' + t.descripcion + "</div>";
    if (!esJugador) {
      var intelUsadaHoy = competenciaBarrioEstado && competenciaBarrioEstado.intelDia === diaActual;
      rankingHTML += '<button class="btn mapa-intel-btn" type="button" onclick="investigarRivalBarrio(\'' +
        String(t.id).replace(/[^a-z0-9_-]/gi, "") +
        '\')"' + (intelUsadaHoy ? ' disabled title="Ya realizaste inteligencia hoy"' : '') +
        '>Investigar · RD$120 · riesgo 18%</button>';
    }
    rankingHTML += "</div></div>";
  });
  setHTML("mapa-ranking-lista", rankingHTML);

  var posicionJugador = 0;
  for (var ti = 0; ti < todos.length; ti++) {
    if (todos[ti].id === "jugador") {
      posicionJugador = ti;
      break;
    }
  }
  var rivalArriba = posicionJugador > 0 ? todos[posicionJugador - 1] : null;
  var rivalAbajo =
    posicionJugador < todos.length - 1 ? todos[posicionJugador + 1] : null;
  var rivalMasActivo =
    rivales.slice().sort(function (a, b) {
      return b.empuje + b.presion - (a.empuje + a.presion);
    })[0] || null;

  var contextoTexto = "";
  if (posicionJugador === 0) {
    contextoTexto =
      "Vas liderando el barrio. Ahora la tension real es sostener la punta sin bajar el ritmo, porque el resto ya esta copiando lo que te funciona.";
  } else if (rivalArriba) {
    contextoTexto =
      rivalArriba.nombre +
      " va por delante. La brecha ya no depende solo del dia: cada mejora tuya empuja a los rivales a responder.";
  } else {
    contextoTexto =
      "El barrio esta apretado. No hay posiciones fijas y cada avance tuyo mueve la tabla.";
  }
  if (rivalMasActivo && rivalMasActivo.id !== "jugador") {
    contextoTexto +=
      " Ahora mismo " +
      rivalMasActivo.nombre +
      " es quien mas esta reaccionando a tu crecimiento.";
  }
  if (rivalAbajo && rivalAbajo.id !== "jugador") {
    contextoTexto +=
      " Justo detras viene " +
      rivalAbajo.nombre +
      ", con pulso " +
      rivalAbajo.tendencia.toLowerCase() +
      ".";
  }
  if (indiceJugador >= 120) {
    contextoTexto +=
      " Tu taller ya entro en zona seria: los clientes premium y los casos delicados hacen que cada punto de reputacion pese mas.";
  } else if (diaActual <= 4) {
    contextoTexto +=
      " Todavia estas sembrando nombre; en estos primeros dias las respuestas de los otros talleres son mas sutiles, pero ya empezaron.";
  }
  setHTML("mapa-contexto", "<p>" + contextoTexto + "</p>");

  var intelHtml = "<p>Selecciona un rival para descubrir una oportunidad competitiva. Solo puedes investigar una vez por dia.</p>";
  if (competenciaBarrioEstado && competenciaBarrioEstado.intelDia === diaActual && competenciaBarrioEstado.intelTexto) {
    intelHtml = '<p><strong>Informe del dia:</strong> ' +
      escaparTextoTelefono(competenciaBarrioEstado.intelTexto) + "</p>";
  }
  setHTML("mapa-inteligencia", intelHtml);

  // Mostrar arco activo con descripcion
  var arcoHTML = "";
  var misionTrilogia = typeof obtenerMisionTrilogiaActual === "function"
    ? obtenerMisionTrilogiaActual()
    : null;
  if (misionTrilogia) {
    var pctMision = Math.max(0, Math.min(100, Math.round((misionTrilogia.progreso / Math.max(1, misionTrilogia.meta)) * 100)));
    arcoHTML += '<div class="mapa-arco-titulo">Misión: ' + escaparTextoTelefono(misionTrilogia.titulo) + '</div>';
    arcoHTML += '<div class="mapa-arco-desc">' + escaparTextoTelefono(misionTrilogia.objetivo) + '</div>';
    arcoHTML += '<div class="mapa-arco-rango">Progreso ' + misionTrilogia.progreso + '/' + misionTrilogia.meta + ' · ' + escaparTextoTelefono(misionTrilogia.detalle) + '</div>';
    arcoHTML += '<div class="mapa-arco-progress"><span style="width:' + pctMision + '%"></span></div>';
  }
  if (arcoData) {
    var casosArco = obtenerCantidadCasosCompetenciaBarrio();
    var siguienteArco = arcos.find(function(item) {
      return item && Number(item.casosMin || 0) > casosArco;
    });
    arcoHTML += '<div class="mapa-arco-titulo">' + arcoData.titulo + "</div>";
    arcoHTML +=
      '<div class="mapa-arco-desc">' + arcoData.descripcion + "</div>";
    arcoHTML +=
      '<div class="mapa-arco-rango">Desde ' +
      Math.max(0, Math.round(arcoData.casosMin || 0)) +
      " casos cerrados &mdash; Taller nivel " +
      Math.max(1, Math.round(arcoData.nivelMin || 1)) +
      "+" +
      (siguienteArco ? " &mdash; Proximo capitulo en " + Math.max(0, Math.round(siguienteArco.casosMin - casosArco)) + " caso(s)" : "") +
      "</div>";
  } else {
    var casosCerradosMapa = obtenerCantidadCasosCompetenciaBarrio();
    var arcoPendiente = arcos.find(function(item) {
      return item && Number(item.casosMin || 0) > casosCerradosMapa;
    }) || null;
    if (arcoPendiente && miNivel < arcoPendiente.nivelMin) {
      arcoHTML +=
        '<div class="mapa-arco-titulo">&#x1F512; ' +
        arcoPendiente.titulo +
        "</div>";
      arcoHTML +=
        '<div class="mapa-arco-desc">Requiere taller nivel ' +
        arcoPendiente.nivelMin +
        " para desbloquear este capitulo.</div>";
    } else {
      arcoHTML +=
        '<div class="mapa-arco-desc">La historia se esta desarrollando. Cierra mas casos para abrir el siguiente capitulo.</div>';
    }
  }
  setHTML("mapa-historia-arco", arcoHTML);
}

function obtenerConsejoIntelRivalBarrio(rival) {
  var foco = obtenerPerfilCompetenciaRivalBarrio(rival).foco;
  var consejos = {
    velocidad: "Compite con velocidad. La oportunidad esta en prometer tiempos realistas y cerrar sin retrabajos.",
    constancia: "Su fuerza es la confianza acumulada. Superalo encadenando casos perfectos y cuidando reputacion.",
    premium: "Domina clientes de alto valor. Sube diagnostico y taller antes de disputar ese segmento.",
    comunidad: "Su red comunitaria sostiene la demanda. Buen servicio y comunicacion pesan mas que bajar precios.",
    barrio: "Vive del precio y la urgencia. Sus retrabajos pueden convertirse en tus mejores casos de recuperacion."
  };
  return consejos[foco] || "Mantiene un pulso estable. Mejora reputacion y capacidad antes de enfrentarlo directamente.";
}

function investigarRivalBarrio(rivalId) {
  var costo = 120;
  var riesgo = 0.18;
  var estado = asegurarCompetenciaBarrioEstado();
  var diaActual = Math.max(1, Math.round(dia || 1));
  if (estado.intelDia === diaActual) {
    mostrarFeedbackGameplay("Ya realizaste inteligencia competitiva hoy.", "warn");
    return false;
  }
  if (saldo < costo) {
    mostrarFeedbackGameplay(`Investigar requiere RD$${costo}.`, "warn");
    return false;
  }
  var rival = (window.RIVALES_BARRIO || []).find(function(item) {
    return item && item.id === rivalId;
  });
  if (!rival) return false;

  saldo -= costo;
  if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarGastoDia === "function") {
    window.TallerApp.helpers.registrarGastoDia(costo, "operaciones");
  }
  estado.intelDia = diaActual;
  estado.intelRivalId = rival.id;
  estado.intelTexto = rival.nombre + ": " + obtenerConsejoIntelRivalBarrio(rival);

  if (Math.random() < riesgo) {
    reputacion = Math.max(0, Math.round(reputacion || 0) - 1);
    var estadoRival = estado.rivales[rival.id] || crearEstadoRivalCompetenciaBarrio(rival);
    estadoRival.presion = limitarValorMapa((estadoRival.presion || 0) + 3, 0, 30);
    estado.rivales[rival.id] = estadoRival;
    estado.intelTexto += " Detectaron el movimiento: -1 reputacion y el rival aumenta su presion.";
    mostrarFeedbackGameplay("Investigacion detectada: -1 reputacion.", "warn");
  } else {
    mostrarFeedbackGameplay("Informe competitivo desbloqueado.", "ok");
  }
  actualizarUI();
  actualizarScreenMapa();
  return true;
}

function actualizarScreenConfiguracion() {
  var set = function (id, val) {
    var el = document.getElementById(id);
    if (el) el.innerText = val;
  };
  var temaPrincipal = obtenerTemaPrincipalAudioLabel();

  set("cfg-estado", modoNivelesActivo() ? `Nivel ${nivelJugador}` : "Continuo");
  set(
    "cfg-hora",
    modoNivelesActivo() ? "Tiempo real" : obtenerHoraDelDiaTexto(),
  );
  set("cfg-saldo", `RD$${Math.round(saldo)}`);
  set("cfg-saldo-atajo", `RD$${Math.round(saldo)}`);
  set(
    "cfg-deuda",
    modoNivelesActivo() ? `Nivel ${nivelJugador}` : `RD$${Math.round(deuda)}`,
  );
  set("cfg-deuda-atajo", `RD$${Math.round(deuda)}`);
  set(
    "cfg-foco",
    modoNivelesActivo()
      ? `${Math.round(progresoNivel)}/${Math.round(progresoNivelMeta)}`
      : `${focoDiaActual}/${focoDiaMax}`,
  );
  set(
    "cfg-cola",
    Array.isArray(clientesEnEspera) ? clientesEnEspera.length : 0,
  );
  set(
    "cfg-pdx",
    Array.isArray(casosPendientesDiagnostico)
      ? casosPendientesDiagnostico.length
      : 0,
  );
  set(
    "cfg-rep",
    Array.isArray(reparacionesActivas) ? reparacionesActivas.length : 0,
  );
  set(
    "cfg-casos-cerrados",
    `${typeof obtenerCasosCompletadosNarrativa === "function" ? obtenerCasosCompletadosNarrativa() : ((resumenCasos && resumenCasos.totalCasosJugados) || 0)}`,
  );
  set("cfg-auto", autoAvanceActivo ? "Activo" : "Inactivo");
  var etiquetaRitmo = modoRitmoJuego === "relajado" ? "Relajado" : (modoRitmoJuego === "crisis" ? "Crisis" : "Gestion");
  set("cfg-auto-vel", `${autoTurnoCadaSeg}s (${etiquetaRitmo})`);
  set("cfg-musica", musicaFondoActiva ? "Activa" : "Pausada");
  set("cfg-efectos", efectosSonidoActivos ? "Activos" : "Silencio");
  set("cfg-tema", temaPrincipal);

  var flujo = document.getElementById("cfg-resumen-flujo");
  if (flujo) {
    var pendientesDx = Array.isArray(casosPendientesDiagnostico)
      ? casosPendientesDiagnostico.length
      : 0;
    flujo.innerText = `Flujo actual: Cola ${Array.isArray(clientesEnEspera) ? clientesEnEspera.length : 0} | Pendientes DX ${pendientesDx} | Reparaciones ${Array.isArray(reparacionesActivas) ? reparacionesActivas.length : 0} | Intervalo ${autoTurnoCadaSeg}s.`;
  }

  var audioResumen = document.getElementById("cfg-audio-resumen");
  if (audioResumen) {
    audioResumen.innerText = musicaFondoActiva
      ? `Tema principal listo: ${temaPrincipal}. La musica arranca tras la primera interaccion permitida por el navegador.`
      : `Musica en pausa. Puedes reactivarla desde Opciones generales. Tema detectado: ${temaPrincipal}.`;
  }

  var opcionesAudioResumen = document.getElementById("opciones-audio-resumen");
  if (opcionesAudioResumen) {
    opcionesAudioResumen.innerText = `Tema detectado: ${temaPrincipal}. Efectos ${efectosSonidoActivos ? "activos" : "en silencio"}.`;
  }

  var guardado = document.getElementById("cfg-resumen-guardado");
  if (guardado) {
    guardado.innerText = modoNivelesActivo()
      ? `Estado actual: Nivel ${nivelJugador}, progreso ${Math.round(progresoNivel)}/${Math.round(progresoNivelMeta)} y caja RD$${Math.round(saldo)}.`
      : `Estado operativo: flujo continuo, caja RD$${Math.round(saldo)} y deuda RD$${Math.round(deuda)}.`;
  }

  var estadoNotificaciones =
    typeof window.obtenerEstadoNotificacionesSistema === "function"
      ? window.obtenerEstadoNotificacionesSistema()
      : "unsupported";
  var btnNotificaciones = document.getElementById("btn-notificaciones-sistema");
  if (btnNotificaciones) {
    if (estadoNotificaciones === "granted") {
      btnNotificaciones.innerText = "Notificaciones activas";
      btnNotificaciones.disabled = true;
      set("cfg-notif-estado", "Activas");
    } else if (estadoNotificaciones === "denied") {
      btnNotificaciones.innerText = "Notificaciones bloqueadas";
      btnNotificaciones.disabled = true;
      set("cfg-notif-estado", "Bloq.");
    } else {
      btnNotificaciones.innerText = "Activar notificaciones";
      btnNotificaciones.disabled = false;
      set("cfg-notif-estado", estadoNotificaciones === "default" ? "Pend." : "No disp.");
    }
  }

  var resumenNotificaciones = document.getElementById("cfg-notificaciones");
  if (resumenNotificaciones) {
    if (estadoNotificaciones === "granted") {
      resumenNotificaciones.innerText =
        "Notificaciones del sistema activas para trabajos terminados.";
    } else if (estadoNotificaciones === "denied") {
      resumenNotificaciones.innerText =
        "El navegador bloqueo notificaciones. Debes habilitarlas manualmente en ajustes del sitio.";
    } else if (estadoNotificaciones === "default") {
      resumenNotificaciones.innerText =
        "Aun no has dado permiso para notificaciones del sistema.";
    } else {
      resumenNotificaciones.innerText =
        "Este navegador no soporta notificaciones push para esta app.";
    }
  }

  var riesgo = document.getElementById("cfg-resumen-riesgo");
  if (riesgo) {
    if (modoNivelesActivo()) {
      riesgo.innerText = `Ruta de crecimiento: sube nivel, ahorra caja y desbloquea mejoras del taller.`;
    } else if (estres >= 75 || hambre >= 85 || sueno >= 85) {
      riesgo.innerText = "Alerta: condiciones del dueno en nivel critico.";
    } else if (
      Array.isArray(casosPendientesDiagnostico) &&
      casosPendientesDiagnostico.length >= 3
    ) {
      riesgo.innerText =
        "Alerta: acumulacion de casos pendientes de diagnostico.";
    } else {
      riesgo.innerText = "Operacion estable.";
    }
  }
}

function ofDxEscapar(valor) {
  return String(valor || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function ofDxObtenerCatalogoDiagnosticos() {
  if (
    window.TallerData &&
    Array.isArray(window.TallerData.diagnosticos)
  ) {
    return window.TallerData.diagnosticos;
  }
  return [];
}

let ofDxEnfoqueActivo = "motor";
let ofDxMiniResultado =
  "Define una hipotesis activa y corre rondas de analisis para acumular evidencia.";

function ofDxAsegurarEstadoCaso(cliente) {
  if (!cliente || typeof cliente !== "object") return null;
  if (!cliente.ofDxEstado || typeof cliente.ofDxEstado !== "object") {
    cliente.ofDxEstado = {
      accionesTecnicas: {
        obd: false,
        ruta: false,
        historial: false,
        audio: false,
        aceite: false,
        visual: false,
        compresion: false,
      },
      tecnicasExito: 0,
      tecnicasRuido: 0,
    };
  }
  if (!cliente.ofDxEstado.accionesTecnicas) {
    cliente.ofDxEstado.accionesTecnicas = {
      obd: false,
      ruta: false,
      historial: false,
      audio: false,
      aceite: false,
      visual: false,
      compresion: false,
    };
  }
  if (!Array.isArray(cliente.ofDxSeleccionEnfoques))
    cliente.ofDxSeleccionEnfoques = [];
  if (
    !cliente.ofDxPuntajeSistemas ||
    typeof cliente.ofDxPuntajeSistemas !== "object"
  ) {
    cliente.ofDxPuntajeSistemas = {
      motor: 0,
      transmision: 0,
      escape: 0,
      electricidad: 0,
      frenos: 0,
      suspension: 0,
    };
  }
  if (!Array.isArray(cliente.ofDxSenalesDetectadas))
    cliente.ofDxSenalesDetectadas = [];
  if (!Array.isArray(cliente.ofDxSenalesSeleccionadas))
    cliente.ofDxSenalesSeleccionadas = [];
  if (typeof cliente.ofDxUltimaPruebaFeedback !== "string") cliente.ofDxUltimaPruebaFeedback = "";
  if (typeof cliente.ofDxHipotesisPrincipal !== "string") cliente.ofDxHipotesisPrincipal = "";
  if (typeof cliente.ofDxHipotesisSecundaria !== "string") cliente.ofDxHipotesisSecundaria = "";
  if (typeof cliente.ofDxConfianzaElegida !== "number") cliente.ofDxConfianzaElegida = 55;
  if (
    cliente.ofDxModoResolucion !== "rapida" &&
    cliente.ofDxModoResolucion !== "segura"
  )
    cliente.ofDxModoResolucion = "segura";
  if (!Array.isArray(cliente.ofDxProbablesCausas))
    cliente.ofDxProbablesCausas = [];
  if (typeof cliente.ofDxRondasAnalisis !== "number")
    cliente.ofDxRondasAnalisis = 0;
  if (typeof cliente.ofDxAnalisisHecho !== "boolean")
    cliente.ofDxAnalisisHecho = false;
  if (typeof cliente.ofDxForzarFallo !== "boolean")
    cliente.ofDxForzarFallo = false;
  return cliente.ofDxEstado;
}

function ofDxTopSistemas(cliente, limite) {
  if (!cliente || !cliente.ofDxPuntajeSistemas) return [];
  var max = Math.max(1, limite || 3);
  return Object.keys(cliente.ofDxPuntajeSistemas)
    .map(function (key) {
      return {
        key: key,
        score: Math.max(0, Math.round(cliente.ofDxPuntajeSistemas[key] || 0)),
      };
    })
    .sort(function (a, b) {
      return b.score - a.score;
    })
    .slice(0, max);
}

function ofDxNivelScannerObd() {
  var nivel = 0;
  if (mejorasTacticas && mejorasTacticas.scannerDx) nivel += 1;
  if (mejoras && mejoras.maquinaDiagnosis) nivel += 1;
  nivel += Math.max(0, (tallerNivel || 1) - 1);
  nivel += Math.max(0, (mejoras && mejoras.herramientas) || 0);
  nivel += Math.floor(Math.max(0, (mejoras && mejoras.capacitacion) || 0) / 2);
  return Math.max(0, Math.min(9, nivel));
}

function ofDxPerfilScannerObd() {
  var nivel = ofDxNivelScannerObd();
  return {
    nivel: nivel,
    probBonus: Math.min(0.24, nivel * 0.03),
    riesgoReduccion: Math.min(0.2, nivel * 0.02),
    bonusConfianza: Math.min(16, nivel * 2),
    bonusInspeccion: Math.min(0.08, nivel * 0.01),
    rescateRuido: Math.min(0.45, Math.max(0, (nivel - 2) * 0.06)),
  };
}

function ofDxRiesgoErrorHumano(confianzaPct, cliente) {
  var pct = Math.max(0, Math.min(100, Math.round(confianzaPct || 0)));
  var base = Math.max(0.03, Math.min(0.42, (55 - pct) / 100));
  if (!cliente) return base;
  var perfil = ofDxPerfilScannerObd();
  return Math.max(0.01, base - perfil.riesgoReduccion);
}

function ofDxNarrativaTecnica(especialidad, tecnica, exito) {
  var tabla = {
    motor: {
      obd_ok: [
        "OBD marca misfire en cilindro y recorte de mezcla en carga.",
        "Lectura OBD confirma detonacion bajo aceleracion sostenida.",
      ],
      obd_fail: [
        "OBD trae codigos historicos mezclados y ruido de sensores.",
        "Lectura OBD inconsistente; hay datos congelados poco fiables.",
      ],
      ruta_ok: [
        "En ruta, la perdida de fuerza aparece justo al subir rpm.",
        "Prueba de ruta confirma tirones bajo carga en tercera.",
      ],
      ruta_fail: [
        "En ruta no replica igual; condiciones variables confunden lectura.",
        "La falla aparece intermitente y no deja patron claro en carretera.",
      ],
      historial_ok: [
        "Historial muestra mantenimientos tardios del sistema de admision.",
        "Patron previo coincide con desgaste progresivo en motor.",
      ],
      historial_fail: [
        "Historial incompleto: no hay trazabilidad tecnica suficiente.",
        "Bitacora vieja contradice sintomas actuales.",
      ],
    },
    transmision: {
      obd_ok: [
        "OBD detecta deslizamiento en cambio bajo torque.",
        "Modulo reporta tiempos de acople fuera de rango.",
      ],
      obd_fail: [
        "OBD sin codigos activos; lectura pobre para transmision mecanica.",
        "Datos de caja sin calibracion reciente, senal ambigua.",
      ],
      ruta_ok: [
        "En ruta se siente patinamiento al pasar a segunda.",
        "Prueba dinamica confirma golpe al acoplar reversa.",
      ],
      ruta_fail: [
        "En ruta el sintoma no aparece constante.",
        "Cambio responde distinto segun temperatura; falta claridad.",
      ],
      historial_ok: [
        "Historial muestra sobrecarga y aceite de caja vencido.",
        "Registro previo repite quejas de acople tardio.",
      ],
      historial_fail: [
        "No hay historial de servicio de caja disponible.",
        "Facturas previas no detallan reparaciones de transmision.",
      ],
    },
    electricidad: {
      obd_ok: [
        "OBD captura fluctuacion de voltaje en red principal.",
        "Lectura confirma fallo intermitente de sensor critico.",
      ],
      obd_fail: [
        "Voltajes estables en banco, pero sin carga real los datos enganan.",
        "OBD arroja codigos pasivos sin correlacion fuerte.",
      ],
      ruta_ok: [
        "En ruta parpadea tablero al exigir consumo electrico.",
        "Prueba en carga confirma caida de voltaje al acelerar.",
      ],
      ruta_fail: [
        "En ruta no falla con suficientes consumidores activos.",
        "Sintoma electrico desaparece durante la prueba.",
      ],
      historial_ok: [
        "Historial revela bateria fuera de especificacion repetidas veces.",
        "Bitacora indica alternador revisado sin resolver causa raiz.",
      ],
      historial_fail: [
        "No hay registro de cambios electricos recientes.",
        "Historial contradictorio de sensores reemplazados sin criterio.",
      ],
    },
    frenos: {
      obd_ok: [
        "OBD confirma variacion anomala en modulo ABS.",
        "Sensores de rueda reportan lectura desigual en frenada.",
      ],
      obd_fail: [
        "ABS sin codigos activos pese a sintomas del cliente.",
        "Lectura OBD no discrimina entre desgaste y falla real.",
      ],
      ruta_ok: [
        "En ruta vibra el pedal al frenar progresivo.",
        "Prueba confirma deriva lateral al frenado fuerte.",
      ],
      ruta_fail: [
        "Prueba en seco no reproduce vibracion esperada.",
        "Sin carga suficiente, la respuesta de freno parece normal.",
      ],
      historial_ok: [
        "Historial muestra cambio parcial de componentes de freno.",
        "Registro previo indica desgaste irregular repetido.",
      ],
      historial_fail: [
        "No hay historial de purgas ni cambios de liquido.",
        "Bitacora sin datos de mantenimiento de frenos.",
      ],
    },
    suspension: {
      obd_ok: [
        "OBD detecta anomalia de estabilidad asociada a chasis.",
        "Modulo de estabilidad registra evento por oscilacion.",
      ],
      obd_fail: [
        "OBD casi ciego para suspension mecanica; lectura limitada.",
        "No hay datos electronicos suficientes para cerrar causa.",
      ],
      ruta_ok: [
        "En ruta el chasis rebota de mas tras bache corto.",
        "Prueba confirma golpe seco en apoyo lateral.",
      ],
      ruta_fail: [
        "Ruta urbana no replica el golpe bajo carga.",
        "La oscilacion aparece tarde y sin patron fijo.",
      ],
      historial_ok: [
        "Historial muestra bujes cambiados fuera de especificacion.",
        "Registro previo coincide con desgaste progresivo de amortiguacion.",
      ],
      historial_fail: [
        "No existe trazabilidad de piezas de suspension.",
        "Historial incompleto para inferir fallo estructural.",
      ],
    },
  };

  var esp = tabla[especialidad] ? especialidad : "motor";
  var key = tecnica + "_" + (exito ? "ok" : "fail");
  var lista = tabla[esp][key] || ["Lectura sin datos concluyentes."];
  return lista[Math.floor(Math.random() * lista.length)];
}

function ofDxPistasPorEnfoque(enfoque) {
  var mapa = {
    motor: [
      "vibracion en ralenti",
      "olor a combustible",
      "golpe seco al acelerar",
    ],
    transmision: [
      "tiron al cambiar",
      "patinamiento en segunda",
      "clack al meter reversa",
    ],
    escape: [
      "resonancia en bajo",
      "soplido metalico",
      "humo irregular en salida",
    ],
    electricidad: [
      "tablero parpadea con carga",
      "caida de voltaje en marcha",
      "sensor intermitente sin patron fijo",
    ],
    frenos: [
      "vibracion de pedal en frenada",
      "desvio lateral al frenar",
      "ruido metalico en disco caliente",
    ],
    suspension: [
      "rebote excesivo en bache",
      "golpe seco en apoyo lateral",
      "desgaste irregular de neumaticos",
    ],
  };
  return mapa[enfoque] || ["lectura general sin patron claro"];
}

function ofDxSistemasMatriz() {
  return [
    { key: "motor", label: "Motor" },
    { key: "transmision", label: "Trans" },
    { key: "electricidad", label: "Elect" },
    { key: "frenos", label: "Frenos" },
    { key: "suspension", label: "Susp" },
    { key: "escape", label: "Escape" },
  ];
}

function ofDxSintomasMatriz(cliente) {
  var declaracion = String(
    (cliente && cliente.declaracionCliente) || "",
  ).toLowerCase();
  var base = [
    {
      key: "potencia",
      label: "Perdida de potencia",
      sistemas: ["motor", "transmision", "escape"],
    },
    {
      key: "ruido",
      label: "Ruido metalico",
      sistemas: ["motor", "transmision", "suspension"],
    },
    {
      key: "tablero",
      label: "Fallo electrico/tablero",
      sistemas: ["electricidad"],
    },
    {
      key: "frenado",
      label: "Frenado inestable",
      sistemas: ["frenos", "suspension"],
    },
    { key: "humo", label: "Humo/olor anormal", sistemas: ["motor", "escape"] },
  ];

  if (
    declaracion.indexOf("parpade") >= 0 ||
    declaracion.indexOf("tablero") >= 0
  ) {
    base[2].sistemas = ["electricidad", "motor"];
  }
  if (declaracion.indexOf("vibra") >= 0 || declaracion.indexOf("rebota") >= 0) {
    base[3].sistemas = ["suspension", "frenos"];
  }
  if (declaracion.indexOf("humo") >= 0 || declaracion.indexOf("quemado") >= 0) {
    base[4].sistemas = ["escape", "motor"];
  }
  return base;
}

function ofDxValorCeldaMatriz(cliente, sintoma, sistema) {
  if (!cliente) return 0;
  var catalogoDiagnosticos = ofDxObtenerCatalogoDiagnosticos();
  var valor = 0;
  var especialidad = cliente.especialidadIdeal || "motor";
  var hallazgos =
    cliente.inspeccion && Array.isArray(cliente.inspeccion.hallazgos)
      ? cliente.inspeccion.hallazgos.length
      : 0;
  var puntajes =
    cliente.ofDxPuntajeSistemas &&
    typeof cliente.ofDxPuntajeSistemas === "object"
      ? cliente.ofDxPuntajeSistemas
      : {};
  var scoreSistema = Math.max(0, Math.round(puntajes[sistema] || 0));

  if (sintoma.sistemas.indexOf(sistema) >= 0) valor += 2;
  if (sistema === especialidad) valor += 1;
  valor += Math.min(2, Math.floor(scoreSistema / 2));
  if (ofDxEnfoqueActivo === sistema) valor += 1;
  if (cliente.ofDxAnalisisHecho && scoreSistema >= 3) valor += 1;
  if (hallazgos >= 2 && scoreSistema >= 2) valor += 1;

  var sugerido = cliente.ofDxSugerencia || "";
  if (sugerido) {
    var dx = catalogoDiagnosticos.find(function (d) {
      return d.nombre === sugerido;
    });
    if (dx && dx.especialidad === sistema) valor += 1;
  }

  return Math.max(0, Math.min(5, valor));
}

function ofDxClaseCeldaMatriz(valor) {
  if (valor >= 4) return "alto";
  if (valor >= 2) return "medio";
  return "bajo";
}

function ofDxRenderizarMatriz(cliente) {
  var cont = document.getElementById("ofdx-matriz");
  if (!cont) return;
  if (!cliente) {
    cont.innerHTML =
      '<div class="ofdx-matriz-vacio">Matriz de diagnostico no disponible.</div>';
    return;
  }

  var sistemas = ofDxSistemasMatriz();
  var sintomas = ofDxSintomasMatriz(cliente);
  var head = `<thead><tr><th>Sintoma \\ Sistema</th>${sistemas
    .map(function (s) {
      return `<th>${s.label}</th>`;
    })
    .join("")}</tr></thead>`;
  var body = sintomas
    .map(function (si) {
      var cells = sistemas
        .map(function (sys) {
          var v = ofDxValorCeldaMatriz(cliente, si, sys.key);
          var cls = ofDxClaseCeldaMatriz(v);
          return `<td><span class="ofdx-dot ${cls}">${v}</span></td>`;
        })
        .join("");
      return `<tr><td class="ofdx-sintoma">${si.label}</td>${cells}</tr>`;
    })
    .join("");

  cont.innerHTML = `<div class="ofdx-matriz-head">Matriz de diagnostico (evidencia 0-5)</div><table class="ofdx-matriz-tabla">${head}<tbody>${body}</tbody></table>`;
}

function ofDxTipoPista(enfoque) {
  var tipos = {
    motor: "tren_motriz",
    transmision: "tren_motriz",
    escape: "combustion_escape",
    electricidad: "electrico_control",
    frenos: "chasis_seguridad",
    suspension: "chasis_seguridad",
  };
  return tipos[enfoque] || "general";
}

function ofDxDiagnosticoSugeridoPorEnfoque(cliente, enfoque) {
  if (!cliente) return "";
  var catalogoDiagnosticos = ofDxObtenerCatalogoDiagnosticos();
  var opciones = Array.isArray(cliente.diagnosticoOpciones)
    ? cliente.diagnosticoOpciones.slice()
    : [];
  if (!opciones.length) return "";

  var preferidas = [];
  var equivalencias = {
    motor: ["motor"],
    transmision: ["transmision"],
    escape: ["motor", "suspension"],
    electricidad: ["electricidad", "motor"],
    frenos: ["frenos", "suspension"],
    suspension: ["suspension", "frenos"],
  };
  var permitidas = equivalencias[enfoque] || ["motor"];
  preferidas = opciones.filter(function (nombreDx) {
    var d = catalogoDiagnosticos.find(function (item) {
      return item.nombre === nombreDx;
    });
    return d && permitidas.indexOf(d.especialidad) >= 0;
  });

  var pool = preferidas.length ? preferidas : opciones;
  return pool[Math.floor(Math.random() * pool.length)] || "";
}

function ofDxDiagnosticoSugeridoPorSeleccion(cliente, seleccion) {
  if (!cliente) return "";
  var catalogoDiagnosticos = ofDxObtenerCatalogoDiagnosticos();
  var opciones = Array.isArray(cliente.diagnosticoOpciones)
    ? cliente.diagnosticoOpciones.slice()
    : [];
  if (!opciones.length) return "";
  var listaSeleccion = Array.isArray(seleccion) ? seleccion.slice(0, 2) : [];
  if (!listaSeleccion.length)
    return ofDxDiagnosticoSugeridoPorEnfoque(cliente, "motor");

  var equivalencias = {
    motor: ["motor"],
    transmision: ["transmision"],
    escape: ["motor", "suspension"],
    electricidad: ["electricidad", "motor"],
    frenos: ["frenos", "suspension"],
    suspension: ["suspension", "frenos"],
  };

  var puntajes = opciones.map(function (nombreDx) {
    var d = catalogoDiagnosticos.find(function (item) {
      return item.nombre === nombreDx;
    });
    var esp = d ? d.especialidad : "general";
    var score = 0;

    listaSeleccion.forEach(function (enf, idx) {
      var permitidas = equivalencias[enf] || [];
      if (permitidas.indexOf(esp) >= 0) score += idx === 0 ? 2 : 3;
    });

    if (esp === (cliente.especialidadIdeal || "motor")) score += 3;
    if (nombreDx === cliente.nombre) score += 2;

    return { nombre: nombreDx, score: score };
  });

  puntajes.sort(function (a, b) {
    return b.score - a.score;
  });
  var mejor = puntajes.length ? puntajes[0].score : -1;
  var top = puntajes.filter(function (p) {
    return p.score === mejor;
  });
  if (!top.length) return opciones[0] || "";
  return top[Math.floor(Math.random() * top.length)].nombre;
}

function ofDxCalcularConfianza(cliente) {
  if (!cliente) return { pct: 0, nivel: "baja", texto: "Confianza baja" };
  var estadoCaso = ofDxAsegurarEstadoCaso(cliente);
  var entrevistas = Math.max(0, cliente.entrevistasHechas || 0);
  var aciertos = Math.max(0, cliente.ofDxAciertos || 0);
  var ruido = Math.max(0, cliente.ofDxRuido || 0);
  var tecnicasExito = Math.max(
    0,
    (estadoCaso && estadoCaso.tecnicasExito) || 0,
  );
  var tecnicasRuido = Math.max(
    0,
    (estadoCaso && estadoCaso.tecnicasRuido) || 0,
  );
  var bonusHablar = Math.max(0, Math.round((cliente.bonusHablar || 0) * 100));
  var perfilObd = ofDxPerfilScannerObd();
  var bonusInfra =
    Math.max(0, ((tallerNivel || 1) - 1) * 3) +
    Math.max(0, ((mejoras && mejoras.capacitacion) || 0) * 4) +
    Math.max(0, ((mejoras && mejoras.herramientas) || 0) * 2);
  var bonusObdActivo =
    estadoCaso && estadoCaso.accionesTecnicas && estadoCaso.accionesTecnicas.obd
      ? perfilObd.bonusConfianza
      : 0;
  var bonusExperiencia = 0;
  if (typeof obtenerNivelExperienciaVehiculo === "function") {
    bonusExperiencia = Math.min(
      14,
      obtenerNivelExperienciaVehiculo(cliente.vehiculo || "") * 2,
    );
  }

  var bruto =
    20 +
    entrevistas * 18 +
    aciertos * 22 -
    ruido * 10 +
    tecnicasExito * 12 -
    tecnicasRuido * 7 +
    bonusHablar +
    bonusInfra +
    bonusObdActivo +
    bonusExperiencia;
  var pct = Math.max(5, Math.min(98, Math.round(bruto)));
  var nivel = pct >= 75 ? "alta" : pct >= 45 ? "media" : "baja";
  return {
    pct: pct,
    nivel: nivel,
    texto: `Confianza ${nivel.toUpperCase()} (${pct}%)`,
  };
}

function ofDxCalcularProbablesCausas(cliente) {
  if (!cliente) return [];
  if (typeof asegurarDiagnosticoJugador === "function")
    asegurarDiagnosticoJugador(cliente);
  ofDxAsegurarEstadoCaso(cliente);
  var catalogoDiagnosticos = ofDxObtenerCatalogoDiagnosticos();

  var opciones = Array.isArray(cliente.diagnosticoOpciones)
    ? cliente.diagnosticoOpciones.slice()
    : [];
  if (!opciones.length) return [];

  var puntajes = cliente.ofDxPuntajeSistemas || {};
  var entrevistas = Math.max(0, cliente.entrevistasHechas || 0);
  var hallazgos =
    cliente.inspeccion && Array.isArray(cliente.inspeccion.hallazgos)
      ? cliente.inspeccion.hallazgos.length
      : 0;
  var seleccionados = Array.isArray(cliente.diagnosticosDetectados)
    ? cliente.diagnosticosDetectados
    : [];
  var sugerencia = cliente.ofDxSugerencia || "";

  var lista = opciones.map(function (nombreDx) {
    var d =
      catalogoDiagnosticos.find(function (item) {
        return item.nombre === nombreDx;
      }) || null;
    var esp = d ? d.especialidad : "general";
    var evidenciaSistema = Math.max(0, Math.round(puntajes[esp] || 0));
    var base =
      18 +
      evidenciaSistema * 11 +
      entrevistas * 4 +
      Math.min(10, hallazgos * 2);

    if (seleccionados.indexOf(nombreDx) >= 0) base += 12;
    if (sugerencia && sugerencia === nombreDx) base += 10;
    if (esp === (cliente.especialidadIdeal || "motor")) base += 8;

    var prob = Math.max(5, Math.min(95, Math.round(base)));
    return {
      nombre: nombreDx,
      causa: nombreDx,
      especialidad: esp,
      prob: prob,
      pct: prob,
    };
  });

  lista.sort(function (a, b) {
    return b.prob - a.prob;
  });
  var top = lista.slice(0, 4);
  cliente.ofDxProbablesCausas = top.slice();
  return top;
}

function ofDxEvaluarEnfoque(enfoque, cliente) {
  if (!cliente) return { acierto: false, texto: "No hay caso activo." };
  var especialidad = cliente.especialidadIdeal || "motor";
  var mapaCompatibilidad = {
    motor: ["motor"],
    transmision: ["transmision"],
    escape: ["motor", "suspension"],
    electricidad: ["electricidad", "motor"],
    frenos: ["frenos", "suspension"],
    suspension: ["suspension", "frenos"],
  };
  var compatibles = mapaCompatibilidad[enfoque] || [];
  var acierto = compatibles.indexOf(especialidad) >= 0;

  var pistas = ofDxPistasPorEnfoque(enfoque);
  var pista = pistas[Math.floor(Math.random() * pistas.length)];
  if (acierto) {
    return {
      acierto: true,
      texto: `Pista util: ${pista}. El enfoque ${enfoque} coincide con el patron del caso.`,
    };
  }
  return {
    acierto: false,
    texto: `Lectura parcial: ${pista}. El enfoque ${enfoque} no termina de cerrar el caso.`,
  };
}

function ofDxElegirEnfoque(enfoque) {
  if (!clienteActual) {
    ofDxMiniResultado = "No hay caso activo para seleccionar hipotesis.";
    renderizarModalDiagnosticoOficina();
    return;
  }
  ofDxAsegurarEstadoCaso(clienteActual);
  var permitidos = {
    motor: true,
    transmision: true,
    escape: true,
    electricidad: true,
    frenos: true,
    suspension: true,
  };
  var normalizado = permitidos[enfoque] ? enfoque : "motor";
  ofDxEnfoqueActivo = normalizado;

  var seleccion = clienteActual.ofDxSeleccionEnfoques;
  var filtrada = seleccion.filter(function (item) {
    return item !== normalizado;
  });
  filtrada.unshift(normalizado);
  clienteActual.ofDxSeleccionEnfoques = filtrada.slice(0, 3);

  var score = Math.max(
    0,
    Math.round(
      (clienteActual.ofDxPuntajeSistemas &&
        clienteActual.ofDxPuntajeSistemas[normalizado]) ||
        0,
    ),
  );
  ofDxMiniResultado = `Hipotesis activa: ${normalizado}. Evidencia acumulada: ${score}. Ejecuta "Analizar pista" para sumar confirmaciones.`;

  if (typeof seleccionarEnfoqueDiagnostico === "function")
    seleccionarEnfoqueDiagnostico(ofDxEnfoqueActivo);
  renderizarModalDiagnosticoOficina();
}

function ofDxCatalogoPruebas() {
  return {
    audio: {
      id: "audio",
      etiqueta: "Escuchar motor",
      base: 0.56,
      costoTurno: 1,
      costoFoco: "diagnostico",
      sistemas: ["motor", "transmision", "escape"],
      narrativa: "ruta",
    },
    ruta: {
      id: "ruta",
      etiqueta: "Prueba de manejo",
      base: 0.58,
      costoTurno: 1,
      costoFoco: "diagnostico",
      sistemas: ["motor", "transmision", "frenos", "suspension"],
      narrativa: "ruta",
    },
    obd: {
      id: "obd",
      etiqueta: "Escaner electronico",
      base: 0.62,
      costoTurno: 1,
      costoFoco: "diagnostico",
      sistemas: ["electricidad", "motor", "transmision"],
      narrativa: "obd",
    },
    aceite: {
      id: "aceite",
      etiqueta: "Revisar aceite",
      base: 0.6,
      costoTurno: 1,
      costoFoco: "diagnostico",
      sistemas: ["motor", "escape"],
      narrativa: "historial",
    },
    visual: {
      id: "visual",
      etiqueta: "Revision visual motor",
      base: 0.57,
      costoTurno: 1,
      costoFoco: "diagnostico",
      sistemas: ["motor", "escape", "suspension"],
      narrativa: "historial",
    },
    bujias: {
      id: "bujias",
      etiqueta: "Bujias y bobinas",
      base: 0.63,
      costoTurno: 1,
      costoFoco: "diagnostico",
      sistemas: ["motor", "electricidad"],
      narrativa: "obd",
    },
    inyectores: {
      id: "inyectores",
      etiqueta: "Prueba de inyectores",
      base: 0.59,
      costoTurno: 1,
      costoFoco: "diagnostico",
      sistemas: ["motor"],
      narrativa: "ruta",
    },
    electrico: {
      id: "electrico",
      etiqueta: "Bateria y alternador",
      base: 0.64,
      costoTurno: 1,
      costoFoco: "diagnostico",
      sistemas: ["electricidad"],
      narrativa: "obd",
    },
    frenos: {
      id: "frenos",
      etiqueta: "Inspeccion de frenos",
      base: 0.62,
      costoTurno: 1,
      costoFoco: "diagnostico",
      sistemas: ["frenos"],
      narrativa: "ruta",
    },
    suspension: {
      id: "suspension",
      etiqueta: "Tren delantero",
      base: 0.6,
      costoTurno: 1,
      costoFoco: "diagnostico",
      sistemas: ["suspension"],
      narrativa: "ruta",
    },
    compresion: {
      id: "compresion",
      etiqueta: "Prueba de compresion",
      base: 0.66,
      costoTurno: 2,
      costoFoco: "diagnostico",
      sistemas: ["motor", "transmision"],
      narrativa: "obd",
    },
    historial: {
      id: "historial",
      etiqueta: "Historial del vehiculo",
      base: 0.61,
      costoTurno: 1,
      costoFoco: "diagnostico",
      sistemas: [
        "motor",
        "electricidad",
        "suspension",
        "frenos",
        "transmision",
      ],
      narrativa: "historial",
    },
  };
}

function ofDxSeleccionarModoResolucion(modo) {
  if (!clienteActual) {
    ofDxMiniResultado = "No hay caso activo para definir modo de reparacion.";
    renderizarModalDiagnosticoOficina();
    return;
  }
  ofDxAsegurarEstadoCaso(clienteActual);
  clienteActual.ofDxModoResolucion = modo === "rapida" ? "rapida" : "segura";
  if (clienteActual.ofDxModoResolucion === "rapida") {
    ofDxMiniResultado =
      "Modo RAPIDO activo: menos validaciones, mayor riesgo de error y retorno.";
  } else {
    ofDxMiniResultado =
      "Modo SEGURO activo: mas validacion, menor riesgo al emitir.";
  }
  renderizarModalDiagnosticoOficina();
}

function ofDxEjecutarPrueba(tipo) {
  ofDxAccionTecnica(tipo);
}

function ofDxAccionTecnica(tipo, opciones) {
  opciones = opciones || {};
  if (!clienteActual) {
    ofDxMiniResultado = "No hay caso activo para usar herramientas.";
    if (!opciones.soloMiPuesto) renderizarModalDiagnosticoOficina();
    return;
  }
  if (clienteActual.diagnosticado) {
    ofDxMiniResultado = "Este caso ya tiene dictamen emitido.";
    if (!opciones.soloMiPuesto) renderizarModalDiagnosticoOficina();
    return;
  }

  var pruebas = ofDxCatalogoPruebas();
  var cfg = pruebas[tipo] || pruebas.obd;
  var estadoCaso = ofDxAsegurarEstadoCaso(clienteActual);
  if (!estadoCaso) return;
  var clave = cfg.id;

  if (estadoCaso.accionesTecnicas[clave]) {
    ofDxMiniResultado = `Ya ejecutaste ${cfg.etiqueta} en este caso.`;
    if (!opciones.soloMiPuesto) renderizarModalDiagnosticoOficina();
    return;
  }

  if (!consumirFoco(cfg.costoFoco || "diagnostico")) return;

  var perfilObd = ofDxPerfilScannerObd();
  var ajuste =
    (clienteActual.ofDxAciertos || 0) * 0.05 -
    (clienteActual.ofDxRuido || 0) * 0.04 -
    estres / 500;
  var bonusExperiencia =
    typeof obtenerNivelExperienciaVehiculo === "function"
      ? Math.min(
          0.12,
          obtenerNivelExperienciaVehiculo(clienteActual.vehiculo || "") * 0.02,
        )
      : 0;
  var prob = Math.max(
    0.16,
    Math.min(
      0.94,
      cfg.base +
        ajuste +
        bonusExperiencia +
        (cfg.id === "obd" ? perfilObd.probBonus : 0),
    ),
  );
  var exito = Math.random() < prob;

  if (
    !exito &&
    cfg.id === "obd" &&
    perfilObd.rescateRuido > 0 &&
    Math.random() < perfilObd.rescateRuido
  ) {
    exito = true;
  }

  estadoCaso.accionesTecnicas[clave] = true;
  if (exito) estadoCaso.tecnicasExito += 1;
  else estadoCaso.tecnicasRuido += 1;

  if (typeof asegurarExpedienteInspeccion === "function")
    asegurarExpedienteInspeccion(clienteActual);
  if (
    clienteActual.inspeccion &&
    !Array.isArray(clienteActual.inspeccion.hallazgos)
  ) {
    clienteActual.inspeccion.hallazgos = [];
  }

  var especialidadCaso = clienteActual.especialidadIdeal || "motor";
  var narrativa = ofDxNarrativaTecnica(especialidadCaso, cfg.narrativa, exito);

  var senalesPorPrueba = {
    audio_ok: [
      "Golpeteo metalico detectado",
      "Tac irregular en ralenti",
      "Silbido de admision bajo carga",
    ],
    audio_fail: [
      "Ritmo inestable sin patron claro",
      "Ruido ambiente tapa frecuencias del motor",
    ],
    ruta_ok: [
      "Temperatura irregular en subida",
      "Fallo bajo carga confirmado",
      "Respuesta tardia al acelerar",
    ],
    ruta_fail: [
      "En ruta no replica igual",
      "La falla aparece intermitente sin consistencia",
    ],
    obd_ok: ["Codigo error P0302", "Codigo error P0171", "Codigo error P0420"],
    obd_fail: [
      "Scanner sin codigos activos",
      "Lectura OBD inconclusa por datos mezclados",
    ],
    aceite_ok: [
      "Aceite con residuo quemado",
      "Viscosidad fuera de rango",
      "Nivel bajo con olor a combustible",
    ],
    aceite_fail: [
      "Muestra de aceite sin señal concluyente",
      "Calidad visual normal pese al sintoma",
    ],
    bujias_ok: ["Chispa debil en un cilindro", "Bobina con respuesta intermitente", "Bujia con desgaste fuera de patron"],
    bujias_fail: ["Chispa uniforme en todos los cilindros", "Bujias y bobinas dentro de rango"],
    inyectores_ok: ["Caudal desigual entre inyectores", "Correccion de combustible fuera de rango", "Pulso irregular bajo carga"],
    inyectores_fail: ["Caudal estable sin obstruccion visible", "Presion y pulso de inyeccion normales"],
    electrico_ok: ["Voltaje de carga inestable", "Caida de tension en circuito principal", "Rizado excesivo del alternador"],
    electrico_fail: ["Bateria y carga dentro de rango", "Sin caidas de tension relevantes"],
    frenos_ok: ["Disco con alabeo medible", "Pastillas con desgaste desigual", "Temperatura irregular entre ruedas"],
    frenos_fail: ["Discos y pastillas dentro de tolerancia", "Frenado uniforme durante la prueba"],
    suspension_ok: ["Holgura detectada en rotula", "Link con juego bajo carga", "Amortiguacion desigual en el eje"],
    suspension_fail: ["Tren delantero sin holguras medibles", "Amortiguadores responden de forma uniforme"],
    visual_ok: [
      "Fuga visible en zona caliente",
      "Manguera fatigada detectada",
      "Conector sulfatado a simple vista",
    ],
    visual_fail: [
      "Sin fugas evidentes en inspeccion visual",
      "Componentes externos dentro de rango visual",
    ],
    compresion_ok: [
      "Compresion dispareja en cilindros",
      "Presion baja en banco 2",
      "Caida de compresion en frio",
    ],
    compresion_fail: [
      "Compresion estable, no confirma hipotesis inicial",
      "Prueba dentro de rango sin evidencia fuerte",
    ],
    historial_ok: [
      "Historial revela choque leve reciente",
      "Mantenimiento atrasado en sistema critico",
      "Patron repetido en visitas anteriores",
    ],
    historial_fail: [
      "Historial incompleto o contradictorio",
      "No hay trazabilidad suficiente en bitacora",
    ],
  };

  var keySenal = `${cfg.id}_${exito ? "ok" : "fail"}`;
  var poolSenales = senalesPorPrueba[keySenal] || ["Lectura sin senal util"];
  var senal = poolSenales[Math.floor(Math.random() * poolSenales.length)];

  cfg.sistemas.forEach(function (sys) {
    var actual = Math.max(
      0,
      Math.round(
        (clienteActual.ofDxPuntajeSistemas &&
          clienteActual.ofDxPuntajeSistemas[sys]) ||
          0,
      ),
    );
    var delta = exito
      ? sys === especialidadCaso
        ? 2
        : 1
      : sys === especialidadCaso
        ? 0
        : -1;
    clienteActual.ofDxPuntajeSistemas[sys] = Math.max(0, actual + delta);
  });

  if (!Array.isArray(clienteActual.ofDxSenalesDetectadas))
    clienteActual.ofDxSenalesDetectadas = [];
  clienteActual.ofDxSenalesDetectadas.unshift(`${cfg.etiqueta}: ${senal}`);
  clienteActual.ofDxSenalesDetectadas =
    clienteActual.ofDxSenalesDetectadas.slice(0, 8);

  if (exito) {
    var topEvidencia = ofDxTopSistemas(clienteActual, 1);
    var enfoqueBase = topEvidencia[0] ? topEvidencia[0].key : ofDxEnfoqueActivo;
    var sugerido = ofDxDiagnosticoSugeridoPorEnfoque(
      clienteActual,
      enfoqueBase,
    );
    if (sugerido) {
      // La evidencia se registra internamente; no se marca una falla al jugador.
    }
    if (clienteActual.inspeccion) {
      var extraBonus = cfg.id === "obd" ? perfilObd.bonusInspeccion : 0;
      clienteActual.inspeccion.bonus = Math.min(
        0.24,
        (clienteActual.inspeccion.bonus || 0) + 0.03 + extraBonus,
      );
      clienteActual.inspeccion.hallazgos.push(`${cfg.etiqueta}: ${senal}`);
    }
    log(`Prueba ${cfg.etiqueta}: pista util (${senal}).`, "exito");
    clienteActual.ofDxUltimaPruebaFeedback = `Lo lograste: ${cfg.etiqueta} encontró una señal compatible (${senal}). ${narrativa}`;
    mostrarFeedbackGameplay(`Lo lograste: ${cfg.etiqueta} encontró una señal compatible (${senal}). ${narrativa}`, "ok");
  } else {
    if (clienteActual.inspeccion) {
      clienteActual.inspeccion.bonus = Math.min(
        0.24,
        (clienteActual.inspeccion.bonus || 0) + 0.01,
      );
      clienteActual.inspeccion.hallazgos.push(
        `${cfg.etiqueta}: ruido o lectura ambigua`,
      );
    }
    log(`Prueba ${cfg.etiqueta}: lectura ambigua.`, "warn");
    clienteActual.ofDxUltimaPruebaFeedback = `Fallaste esta prueba: ${cfg.etiqueta} no confirmó la falla (${senal}). ${narrativa}`;
    mostrarFeedbackGameplay(`Fallaste esta prueba: ${cfg.etiqueta} no confirmó la falla (${senal}). ${narrativa}`, "warn");
  }

  if (typeof ajustarEstadoSocialCliente === "function") {
    ajustarEstadoSocialCliente(clienteActual, exito ? "evidencia" : "espera");
  }

  ofDxCalcularProbablesCausas(clienteActual);
  consumirTurno(
    `prueba ${cfg.id}`,
    Math.max(1, cfg.costoTurno || COSTOS_TURNO.diagnostico || 1),
  );
  ofDxMiniResultado = `${cfg.etiqueta}: ${senal}. ${narrativa}`;
  if (!opciones.soloMiPuesto) renderizarModalDiagnosticoOficina();
}

function ofDxEtiquetaEstado(estado) {
  var etiquetas = {
    en_diagnostico: "En diagnostico",
    esperando_aprobacion: "Esperando aprobacion",
    falta_pieza: "Faltan piezas",
    pieza_instalada: "Pieza instalada",
    listo_asignacion: "Listo para asignar",
    en_reparacion: "En reparacion",
    listo_retiro_pago: "Listo para retiro y pago",
    cobrado_retirado: "Cobrado y retirado",
    pendiente_revision: "Pendiente de revision",
  };
  return etiquetas[estado] || "En seguimiento";
}

function ofDxClaseEstado(estado) {
  if (estado === "listo_retiro_pago" || estado === "cobrado_retirado")
    return "ok";
  if (
    estado === "en_diagnostico" ||
    estado === "en_reparacion" ||
    estado === "pieza_instalada" ||
    estado === "listo_asignacion"
  )
    return "mid";
  if (estado === "falta_pieza" || estado === "pendiente_revision")
    return "warn";
  return "neutral";
}

function ofDxClaseConfianza(nivel) {
  if (nivel === "alta") return "ok";
  if (nivel === "media") return "mid";
  return "warn";
}

function ofDxFormatearMiniResultado(texto) {
  var piezas = String(texto || "")
    .split(/\s*\|\s*|\.\s+/)
    .map(function (p) {
      return p.trim();
    })
    .filter(function (p) {
      return p.length > 0;
    });
  if (!piezas.length) piezas = ["Sin novedades de analisis."];
  return piezas.slice(0, 5);
}

function ofDxEstadoFase(cliente) {
  if (!cliente) return "sin_caso";
  if (!cliente.diagnosticado) return "analizando";
  if (cliente.diagnosticado && !cliente.diagnosticoCorrecto)
    return "fallo_dictamen";
  if (cliente.aprobacionCliente && cliente.piezaInstalada)
    return "listo_asignar";
  if (cliente.aprobacionCliente && !cliente.piezaInstalada)
    return "aprobado_sin_pieza";
  return "pendiente_aprobacion";
}

function ofDxRenderizarFaseRail(cliente) {
  var rail = document.getElementById("ofdx-fase-rail");
  if (!rail) return;
  var estado = ofDxEstadoFase(cliente);
  var fases = [
    { key: "analizando", label: "Analizando", cls: "mid" },
    { key: "pendiente_aprobacion", label: "Pendiente aprobacion", cls: "warn" },
    { key: "aprobado_sin_pieza", label: "Aprobado sin pieza", cls: "warn" },
    { key: "listo_asignar", label: "Listo para asignar", cls: "ok" },
    { key: "fallo_dictamen", label: "Dictamen fallido", cls: "bad" },
  ];

  if (estado === "sin_caso") {
    rail.innerHTML =
      '<div class="ofdx-fase-chip neutral active">Sin caso activo</div>';
    return;
  }

  rail.innerHTML = fases
    .map(function (f) {
      var active = f.key === estado;
      return `<div class="ofdx-fase-chip ${f.cls}${active ? " active" : ""}">${ofDxEscapar(f.label)}</div>`;
    })
    .join("");
}

function ofDxConstruirCasosAtendidos() {
  var mapa = {};
  var ahora = Date.now();

  function insertar(caso) {
    if (!caso || typeof caso !== "object") return;
    var id = caso.idCaso || "";
    if (!id) return;
    var existente = mapa[id] || null;
    if (
      !existente ||
      (caso.actualizadoEn || 0) >= (existente.actualizadoEn || 0)
    ) {
      mapa[id] = caso;
    }
  }

  if (Array.isArray(casosAtendidos)) {
    casosAtendidos.forEach(function (c) {
      insertar({
        idCaso: c.idCaso,
        personaNombre: c.personaNombre,
        vehiculo: c.vehiculo,
        estado: c.estado,
        detalle: c.detalle,
        actualizadoEn:
          typeof c.actualizadoEn === "number" ? c.actualizadoEn : ahora - 100,
      });
    });
  }

  if (Array.isArray(reparacionesActivas)) {
    reparacionesActivas.forEach(function (rep) {
      if (typeof asegurarIdCasoCliente === "function")
        asegurarIdCasoCliente(rep);
      var detalle = `Mecanico: ${rep.mecanicoNombre || "sin asignar"} | Restante: ${formatearDuracionSegundos(obtenerSegundosRestantesReparacion(rep))}`;
      var estadoRep = rep.listoParaCobro
        ? "listo_retiro_pago"
        : "en_reparacion";
      if (rep.listoParaCobro) {
        detalle = `Mecanico: ${rep.mecanicoNombre || "sin asignar"} | LISTO para revisar y cobrar`;
      }
      insertar({
        idCaso: rep.idCaso || "",
        personaNombre: rep.personaNombre || rep.clienteNombre || "Cliente",
        vehiculo: rep.vehiculo || "Vehiculo sin ficha",
        estado: estadoRep,
        detalle: detalle,
        actualizadoEn: ahora,
      });
    });
  }

  if (clienteActual && clienteActual.diagnosticado) {
    if (typeof asegurarIdCasoCliente === "function")
      asegurarIdCasoCliente(clienteActual);
    var estadoActivo = "esperando_aprobacion";
    if (clienteActual.aprobacionCliente && clienteActual.piezaInstalada)
      estadoActivo = "listo_asignacion";
    else if (clienteActual.aprobacionCliente && !clienteActual.piezaInstalada)
      estadoActivo = "falta_pieza";
    else if (!clienteActual.aprobacionCliente)
      estadoActivo = "esperando_aprobacion";
    insertar({
      idCaso: clienteActual.idCaso || "",
      personaNombre: clienteActual.personaNombre || "Cliente",
      vehiculo: clienteActual.vehiculo || "Vehiculo sin ficha",
      estado: estadoActivo,
      detalle: clienteActual.aprobacionCliente
        ? clienteActual.piezaInstalada
          ? "Aprobado por cliente y listo para asignar mecanico."
          : "Aprobado por cliente; falta instalar pieza."
        : "Esperando confirmacion por WhatsApp.",
      actualizadoEn: ahora + 1,
    });
  }

  return Object.values(mapa)
    .sort(function (a, b) {
      return (b.actualizadoEn || 0) - (a.actualizadoEn || 0);
    })
    .slice(0, 12);
}

// ================================================================
//  WIZARD — Step-by-step guided diagnostic flow
// ================================================================

function ofDxDetectarPasoWizard(cliente) {
  if (!esCasoActivoMiPuesto(cliente)) return 0;
  if (cliente.diagnosticado) return 4;
  var tieneEntrevista = (cliente.entrevistasHechas || 0) >= 1;
  var tieneEnfoque = Array.isArray(cliente.ofDxSeleccionEnfoques) && cliente.ofDxSeleccionEnfoques.length > 0;
  var tieneSugerencia = !!(cliente.ofDxSugerencia || cliente.diagnosticoSeleccionado);
  if (!tieneEntrevista) return 1;
  if (!tieneEnfoque || !tieneSugerencia) return 2;
  return 3;
}

function ofDxActualizarWizardUI(cliente) {
  var paso = ofDxDetectarPasoWizard(cliente);
  var nav = document.getElementById("ofdx-wizard-nav");
  if (nav) {
    nav.querySelectorAll(".ofdx-wiz-dot").forEach(function (dot) {
      var s = parseInt(dot.getAttribute("data-wstep") || "0");
      dot.classList.remove("done", "active", "pending");
      if (s < paso) dot.classList.add("done");
      else if (s === paso) dot.classList.add("active");
      else dot.classList.add("pending");
    });
    nav.querySelectorAll(".ofdx-wiz-line").forEach(function (line, idx) {
      line.classList.toggle("done", idx + 1 < paso);
    });
  }
  for (var i = 1; i <= 4; i++) {
    var el = document.getElementById("ofdx-wstep-" + i);
    if (el) el.style.display = i === paso ? "" : "none";
  }
  var hintEl = document.getElementById("ofdx-wizard-hint");
  if (hintEl) {
    var hints = {
      0: "\uD83D\uDC46 Elige un caso de la lista para empezar tu investigacion.",
      1: "\uD83C\uDFA4 Habla con el cliente para entender los sintomas del vehiculo.",
      2: "\uD83D\uDD0D Elige un sistema sospechoso, cruza pistas y corre pruebas.",
      3: "\u26A1 Tienes evidencia suficiente. Elige una teoria y cierra el diagnostico!",
      4: "\uD83D\uDCF1 El diagnostico esta listo. Negocia con el cliente.",
    };
    hintEl.textContent = hints[paso] || "";
    hintEl.className = "ofdx-wizard-hint ofdx-wizard-hint-step" + paso;
  }
}

function renderizarModalDiagnosticoOficina() {
  var head = document.getElementById("ofdx-caso-head");
  var detalle = document.getElementById("ofdx-caso-detalle");
  var relato = document.getElementById("ofdx-caso-relato");
  var casoKpis = document.getElementById("ofdx-caso-kpis");
  var hiloInvestigacion = document.getElementById("ofdx-hilo-investigacion");
  var resumen = document.getElementById("ofdx-dx-resumen");
  var progreso = document.getElementById("ofdx-dx-progreso");
  var mini = document.getElementById("ofdx-mini-resultado");
  var matriz = document.getElementById("ofdx-matriz");
  var enfoques = document.getElementById("ofdx-enfoques");
  var modoPruebas = document.getElementById("ofdx-modo-pruebas");
  var probablesBox = document.getElementById("ofdx-probables");
  var opciones = document.getElementById("ofdx-dx-opciones");
  var selector = document.getElementById("ofdx-selector-clientes");
  var candidatos = document.getElementById("ofdx-dx-candidatos");
  var accionesPrincipales = document.getElementById(
    "ofdx-dx-acciones-principales",
  );
  if (!head || !detalle || !resumen || !opciones) return;

  var rotulosSistema = {
    motor: "Motor",
    transmision: "Transmision",
    electricidad: "Electricidad",
    frenos: "Frenos",
    suspension: "Suspension",
    escape: "Escape",
  };

  function rotuloSistema(key) {
    return rotulosSistema[key] || capitalizarRotulo(key || "general");
  }

  function claseRiesgoPct(valor) {
    if (valor <= 20) return "ok";
    if (valor <= 40) return "mid";
    return "warn";
  }

  if (esCasoActivoMiPuesto(clienteActual)) {
    if (selector) {
      selector.classList.remove("show");
      selector.classList.add("hidden");
    }
    if (typeof asegurarIdCasoCliente === "function")
      asegurarIdCasoCliente(clienteActual);
    if (typeof asegurarDiagnosticoJugador === "function")
      asegurarDiagnosticoJugador(clienteActual);
    var idCaso = clienteActual.idCaso || "CASO-0000";
    var nombre = clienteActual.personaNombre || "Cliente";
    var vehiculo = clienteActual.vehiculo || "Vehiculo sin ficha";
    var estado = clienteActual.diagnosticado
      ? `Diagnostico: ${clienteActual.diagnosticoDetectado || "emitido"}`
      : "Diagnostico pendiente";
    head.innerHTML = `<span class="ofdx-case-id">${ofDxEscapar(idCaso)}</span><strong>${ofDxEscapar(nombre)}</strong>`;
    detalle.innerHTML = `<span>${ofDxEscapar(vehiculo)}</span><span>${ofDxEscapar(estado)}</span>`;
    if (relato) {
      var textoRelato =
        clienteActual.habloConCliente && clienteActual.declaracionCliente
          ? `Cliente dice: "${clienteActual.declaracionCliente}"`
          : "Cliente: aun no has hecho entrevista en este caso.";
      relato.innerHTML = `<div class="ofdx-story-blurb">${ofDxEscapar(textoRelato)}</div>`;
    }

    if (accionesPrincipales) {
      var acciones = [];
      var contextoAcciones = "";
      var _tieneEnfoque = Array.isArray(clienteActual.ofDxSeleccionEnfoques) && clienteActual.ofDxSeleccionEnfoques.length > 0;
      var _tieneEntrevista = (clienteActual.entrevistasHechas || 0) >= 1;
      var _tieneSugerencia = !!(clienteActual.ofDxSugerencia || clienteActual.diagnosticoSeleccionado);
      if (!clienteActual.diagnosticado) {
        if (!_tieneEntrevista) {
          acciones.push('<button class="btn btn-primary ofdx-btn-pulse" type="button" onclick="ofDxHablarCliente()">Entrevistar cliente</button>');
          acciones.push('<button class="btn" type="button" onclick="abrirInspeccionCliente()">Inspeccion visual</button>');
          contextoAcciones = "Paso 1 de 4 — Escucha al cliente para entender los sintomas.";
        } else if (!_tieneEnfoque) {
          acciones.push('<button class="btn" type="button" onclick="ofDxHablarCliente()">Hablar otra vez</button>');
          acciones.push('<button class="btn" type="button" onclick="abrirInspeccionCliente()">Inspeccion visual</button>');
          contextoAcciones = "Paso 2 de 4 — Elige un sistema sospechoso arriba para investigar.";
        } else if (!_tieneSugerencia) {
          acciones.push('<button class="btn btn-primary ofdx-btn-pulse" type="button" onclick="ofDxInspeccion()">Cruzar pista</button>');
          acciones.push('<button class="btn" type="button" onclick="ofDxHablarCliente()">Re-entrevistar</button>');
          acciones.push('<button class="btn" type="button" onclick="abrirInspeccionCliente()">Inspeccion visual</button>');
          contextoAcciones = "Paso 2 de 4 — Cruza pistas y corre pruebas hasta que surja una teoria.";
        } else {
          acciones.push('<button class="btn btn-primary ofdx-btn-pulse ofdx-btn-big" type="button" onclick="ofDxEmitirDiagnostico()">Cerrar dictamen</button>');
          acciones.push('<button class="btn" type="button" onclick="ofDxInspeccion()">Seguir investigando</button>');
          contextoAcciones = "Paso 3 de 4 — Tienes una teoria. Cierra o sigue investigando.";
        }
      } else if (!clienteActual.aprobacionCliente) {
        acciones.push('<button class="btn btn-primary ofdx-btn-pulse" type="button" onclick="ofDxAbrirWhatsApp()">Abrir WhatsApp</button>');
        acciones.push('<button class="btn" type="button" onclick="ofDxNegociarCasoActivo()">Negociar salida</button>');
        if (clienteActual.motivoRechazoWhatsApp) {
          acciones.push('<button class="btn btn-primary" type="button" onclick="ofDxAceptarContraofertaCasoActivo()">Aceptar contraoferta</button>');
        }
        contextoAcciones = "Paso 4 de 4 — Defiende tu diagnostico ante el cliente.";
      } else {
        acciones.push('<button class="btn" type="button" onclick="ofDxAbrirWhatsApp()">Abrir chat</button>');
        if (!clienteActual.piezaInstalada) {
          acciones.push('<button class="btn btn-primary ofdx-btn-pulse" type="button" onclick="ofDxIrRepuestos()">Ir a repuestos</button>');
        }
        contextoAcciones = "Caso aprobado. Prepara la ejecucion tecnica.";
      }
      accionesPrincipales.innerHTML = '<div class="ofdx-action-note">' + ofDxEscapar(contextoAcciones) + '</div><div class="ofdx-action-deck">' + acciones.join("") + '</div>';
    }
    ofDxRenderizarFaseRail(clienteActual);

    var entrevistas = clienteActual.entrevistasHechas || 0;
    var hallazgos =
      clienteActual.inspeccion && clienteActual.inspeccion.hallazgos
        ? clienteActual.inspeccion.hallazgos.length
        : 0;
    var estadoCaso = ofDxAsegurarEstadoCaso(clienteActual);
    var tecnicas = estadoCaso ? estadoCaso.accionesTecnicas : {};
    var pruebasCatalogo = ofDxCatalogoPruebas();
    var pruebasLista = Object.keys(pruebasCatalogo).map(function (key) {
      return pruebasCatalogo[key];
    });
    var pruebasHechas = pruebasLista.reduce(function (acc, cfg) {
      return acc + (tecnicas[cfg.id] ? 1 : 0);
    }, 0);

    var seleccion = Array.isArray(clienteActual.ofDxSeleccionEnfoques)
      ? clienteActual.ofDxSeleccionEnfoques
      : [];
    var rondas = Math.max(0, Math.round(clienteActual.ofDxRondasAnalisis || 0));
    var pasosTotal = 5;
    var pasosHechos =
      (entrevistas >= 1 ? 1 : 0) +
      (seleccion.length >= 1 ? 1 : 0) +
      Math.min(2, rondas) +
      (pruebasHechas >= 1 ? 1 : 0);
    var pasosCompletados = Math.max(0, Math.min(pasosTotal, pasosHechos));
    var progresoPct = Math.round((pasosCompletados / pasosTotal) * 100);
    var confianza = ofDxCalcularConfianza(clienteActual);
    var riesgo = Math.round(
      ofDxRiesgoErrorHumano(confianza.pct, clienteActual) * 100,
    );
    var perfilObd = ofDxPerfilScannerObd();
    var modoResolucion =
      clienteActual.ofDxModoResolucion === "rapida" ? "rapida" : "segura";

    var checklist = [
      {
        ok: entrevistas >= 1,
        opcional: true,
        texto: "Entrevista (recomendada)",
      },
      {
        ok: seleccion.length >= 1,
        opcional: false,
        texto: "Definir hipotesis activa",
      },
      {
        ok: rondas >= 2,
        opcional: false,
        texto: "Completar 2 rondas de analisis",
      },
      {
        ok: pruebasHechas >= 1,
        opcional: false,
        texto: "Ejecutar al menos 1 prueba tecnica",
      },
      {
        ok: hallazgos >= 1,
        opcional: false,
        texto: "Tener al menos 1 hallazgo tecnico",
      },
    ];

    clienteActual.ofDxConfianzaPct = confianza.pct;
    clienteActual.ofDxConfianzaNivel = confianza.nivel;
    var topEvidencia = ofDxTopSistemas(clienteActual, 2);
    var principal = topEvidencia[0] ? topEvidencia[0].key : "-";
    var scorePrincipal = topEvidencia[0] ? topEvidencia[0].score : 0;
    var confirmacion = topEvidencia[1] ? topEvidencia[1].key : "-";
    var scoreConfirmacion = topEvidencia[1] ? topEvidencia[1].score : 0;
    var brechaEvidencia = Math.max(0, scorePrincipal - scoreConfirmacion);
    var resumenTopSistema = topEvidencia[0]
      ? rotuloSistema(topEvidencia[0].key)
      : "Sin lider";

    if (typeof ofDxCalcularProbablesCausas === "function") {
      ofDxCalcularProbablesCausas(clienteActual);
    }
    var probables = Array.isArray(clienteActual.ofDxProbablesCausas)
      ? clienteActual.ofDxProbablesCausas
      : [];
    var senales = Array.isArray(clienteActual.ofDxSenalesDetectadas)
      ? clienteActual.ofDxSenalesDetectadas
      : [];
    var opcionesDx = Array.isArray(clienteActual.diagnosticoOpciones)
      ? clienteActual.diagnosticoOpciones
      : [];
    var seleccionadas = Array.isArray(clienteActual.diagnosticosDetectados)
      ? clienteActual.diagnosticosDetectados
      : [];
    var probablesPorNombre = {};
    probables.forEach(function (item) {
      var clave = item && (item.nombre || item.causa);
      if (clave) probablesPorNombre[clave] = item;
    });

    if (casoKpis) {
      casoKpis.innerHTML = `
        <div class="ofdx-case-kpi ${entrevistas >= 1 ? "ok" : "warn"}">
          <span>Entrevistas</span>
          <strong>${entrevistas}</strong>
        </div>
        <div class="ofdx-case-kpi ${hallazgos >= 1 ? "ok" : "warn"}">
          <span>Hallazgos</span>
          <strong>${hallazgos}</strong>
        </div>
        <div class="ofdx-case-kpi ${pruebasHechas >= 1 ? "ok" : "mid"}">
          <span>Pruebas</span>
          <strong>${pruebasHechas}/${pruebasLista.length}</strong>
        </div>
        <div class="ofdx-case-kpi ${scorePrincipal >= 2 ? "ok" : "mid"}">
          <span>Sistema lider</span>
          <strong>${ofDxEscapar(resumenTopSistema)}</strong>
        </div>`;
    }

    if (hiloInvestigacion) {
      var hitos = [
        {
          titulo: "Entrevista",
          detalle:
            entrevistas >= 1
              ? `${entrevistas} ronda(s) con el cliente.`
              : "Aun no abriste la declaracion del cliente.",
          clase: entrevistas >= 1 ? "ok" : "warn",
        },
        {
          titulo: "Hipotesis",
          detalle: seleccion.length
            ? `Activas: ${seleccion.map(rotuloSistema).join(" / ")}`
            : "Todavia no fijaste una linea de investigacion.",
          clase: seleccion.length ? "ok" : "warn",
        },
        {
          titulo: "Laboratorio",
          detalle:
            pruebasHechas >= 1
              ? `${pruebasHechas} prueba(s) ejecutadas con OBD nivel ${perfilObd.nivel}.`
              : "Sin herramientas usadas en este caso.",
          clase: pruebasHechas >= 1 ? "ok" : "mid",
        },
        {
          titulo: "Cierre",
          detalle:
            clienteActual.diagnosticado
              ? `Dictamen emitido: ${clienteActual.diagnosticoDetectado || "sin registro"}.`
              : `Confianza ${confianza.pct}% y riesgo ${riesgo}%.`,
          clase: clienteActual.diagnosticado
            ? clienteActual.diagnosticoCorrecto
              ? "ok"
              : "warn"
            : claseRiesgoPct(riesgo),
        },
      ];
      hiloInvestigacion.innerHTML = hitos
        .map(function (hito, idx) {
          return `<div class="ofdx-thread-card ${hito.clase}"><span class="ofdx-thread-step">0${idx + 1}</span><div><strong>${ofDxEscapar(hito.titulo)}</strong><p>${ofDxEscapar(hito.detalle)}</p></div></div>`;
        })
        .join("");
    }

    if (candidatos) {
      if (opcionesDx.length) {
        candidatos.innerHTML = `<div class="ofdx-feed-title">Teorias de fallo</div><div class="ofdx-candidate-grid">${opcionesDx
          .map(function (nombreDx) {
            var activa = seleccionadas.indexOf(nombreDx) >= 0;
            var disabled = clienteActual.diagnosticado ? "disabled" : "";
            var nombreSafe = String(nombreDx || "")
              .replace(/\\/g, "\\\\")
              .replace(/'/g, "\\'");
            var probable = probablesPorNombre[nombreDx] || null;
            var pctProbable = probable
              ? Math.max(
                  0,
                  Math.round((typeof probable.pct === "number" ? probable.pct : probable.prob) || 0),
                )
              : 0;
            var clase = activa
              ? "selected"
              : pctProbable >= 55
                ? "hot"
                : pctProbable >= 35
                  ? "mid"
                  : "cold";
            var sugerida = clienteActual.ofDxSugerencia === nombreDx;
            return `<button class="ofdx-candidate-card ${clase} ${sugerida ? "suggested" : ""}" type="button" ${disabled} onclick="ofDxSeleccionarDiagnostico('${nombreSafe}')"><span class="ofdx-candidate-name">${ofDxEscapar(nombreDx)}</span><span class="ofdx-candidate-meta">${pctProbable}% de afinidad ${sugerida ? "| sugerida" : activa ? "| marcada" : "| abierta"}</span></button>`;
          })
          .join("")}</div>`;
      } else {
        candidatos.innerHTML =
          '<div class="ofdx-callout">Aun no hay teorias de fallo disponibles para este caso.</div>';
      }
    }

    var checklistHtml = checklist
      .map(function (it) {
        var clase = it.ok ? "ok" : it.opcional ? "opc" : "no";
        var tag = it.ok ? "OK" : it.opcional ? "OPC" : "NO";
        return `<div class="ofdx-check ${clase}"><span class="ofdx-check-tag">${tag}</span><span>${ofDxEscapar(it.texto)}</span></div>`;
      })
      .join("");

    resumen.innerHTML = `
            <div class="ofdx-kpis ofdx-kpis-wide">
                <div class="ofdx-kpi ${ofDxClaseConfianza(confianza.nivel)}"><span>Confianza del dueno</span><strong>${confianza.pct}%</strong></div>
                <div class="ofdx-kpi ${claseRiesgoPct(riesgo)}"><span>Riesgo de precipitarse</span><strong>${riesgo}%</strong></div>
                <div class="ofdx-kpi ${perfilObd.nivel >= 4 ? "ok" : perfilObd.nivel >= 2 ? "mid" : "warn"}"><span>Scanner / OBD</span><strong>Nivel ${perfilObd.nivel}</strong></div>
                <div class="ofdx-kpi ${brechaEvidencia >= 2 ? "ok" : brechaEvidencia >= 1 ? "mid" : "warn"}"><span>Pista dominante</span><strong>${ofDxEscapar(resumenTopSistema)} ${scorePrincipal}</strong></div>
            </div>
            <div class="ofdx-investigation-summary">
                <div class="ofdx-feed-title">Checklist de cierre</div>
                <div class="ofdx-checklist">${checklistHtml}</div>
            </div>
            <div class="ofdx-note-warn">Linea activa: ${ofDxEscapar(rotuloSistema(ofDxEnfoqueActivo))} | Modo: ${modoResolucion.toUpperCase()} | Confirmacion rival: ${ofDxEscapar(rotuloSistema(confirmacion))} ${scoreConfirmacion}</div>
        `;

    if (progreso) {
      progreso.innerHTML = `<div class="ofdx-progress-line"><strong>Reconstruccion del caso</strong><span>${pasosCompletados}/${pasosTotal}</span></div><div class="ofdx-progress-bar"><span style="width:${progresoPct}%;"></span></div><div class="ofdx-progress-hint">Pruebas tecnicas: ${pruebasHechas}/${pruebasLista.length} | Rondas de cruce: ${rondas}/4 | Hallazgos: ${hallazgos}</div>`;
    }

    if (modoPruebas) {
      var botonesPrueba = pruebasLista
        .map(function (cfg) {
          var usada = !!tecnicas[cfg.id];
          var disabled = usada || clienteActual.diagnosticado ? "disabled" : "";
          var sufijo = usada ? " (hecha)" : "";
          return `<button class="btn ofdx-tool-btn" type="button" ${disabled} onclick="ofDxEjecutarPrueba('${cfg.id}')">${ofDxEscapar(cfg.etiqueta + sufijo)}</button>`;
        })
        .join("");
      modoPruebas.innerHTML = `
                <div class="ofdx-subsection-grid">
                    <div class="ofdx-callout ${modoResolucion === "rapida" ? "warn" : "ok"}">
                        <div class="ofdx-feed-title">Ritmo de investigacion</div>
                        <strong>${modoResolucion === "rapida" ? "Modo rapido" : "Modo seguro"}</strong>
                        <div class="ofdx-actions ofdx-actions-dual" style="margin-top:6px;">
                            <button class="btn ${modoResolucion === "rapida" ? "btn-primary" : ""}" type="button" onclick="ofDxSeleccionarModoResolucion('rapida')">Rapida</button>
                            <button class="btn ${modoResolucion === "segura" ? "btn-primary" : ""}" type="button" onclick="ofDxSeleccionarModoResolucion('segura')">Segura</button>
                        </div>
                        <div class="ofdx-callout-note">Rapida acelera la salida; Segura exige mas respaldo pero baja el golpe de error.</div>
                    </div>
                    <div class="ofdx-callout">
                        <div class="ofdx-feed-title">Banco de herramientas</div>
                        <div class="ofdx-tool-grid">${botonesPrueba}</div>
                    </div>
                </div>
            `;
    }

    if (probablesBox) {
      var probablesHtml = probables.length
        ? `<div class="ofdx-suspect-list">${probables
            .map(function (p, idx) {
              var pct = Math.max(
                0,
                Math.round((typeof p.pct === "number" ? p.pct : p.prob) || 0),
              );
              var clase = pct >= 55 ? "ok" : pct >= 35 ? "opc" : "no";
              return `<div class="ofdx-suspect-card ${clase}"><span class="ofdx-suspect-rank">#${idx + 1}</span><div><strong>${ofDxEscapar(p.causa || p.nombre || "Causa sin nombre")}</strong><p>${ofDxEscapar(rotuloSistema(p.especialidad || "general"))} | ${pct}% de respaldo</p></div></div>`;
            })
            .join("")}</div>`
        : '<div class="ofdx-callout">Aun no hay sospechosos consistentes: abre inspeccion, habla con el cliente o corre pruebas tecnicas.</div>';
      var senalesHtml = senales.length
        ? `<ul class="ofdx-feed-list ofdx-feed-list-signals">${senales
            .slice(0, 6)
            .map(function (s) {
              return `<li>${ofDxEscapar(s)}</li>`;
            })
            .join("")}</ul>`
        : '<div class="ofdx-callout">Sin senales registradas en este caso.</div>';
      probablesBox.innerHTML = `
                <div class="ofdx-feed-title">Sospechosos del caso</div>
                ${probablesHtml}
                <div class="ofdx-feed-title" style="margin-top:8px;">Senales fijadas en el muro</div>
                ${senalesHtml}
            `;
    }

    if (mini) {
      var eventos = ofDxFormatearMiniResultado(ofDxMiniResultado);
      mini.innerHTML = `<div class="ofdx-feed-title">Bitacora de laboratorio</div><ul class="ofdx-feed-list ofdx-logbook-list">${eventos
        .map(function (e) {
          return `<li>${ofDxEscapar(e)}</li>`;
        })
        .join("")}</ul>`;
    }
    if (matriz) ofDxRenderizarMatriz(clienteActual);
    if (enfoques) {
      enfoques.querySelectorAll("button").forEach(function (btn) {
        if (!btn) return;
        var enfoqueBtn = btn.getAttribute("data-enfoque") || "";
        var isFocus = enfoqueBtn === ofDxEnfoqueActivo;
        btn.classList.toggle("btn-primary", isFocus);
      });
    }

    var mecanicosDx = ofDxObtenerMecanicosDisponibles();
    var bloqueMecanicosDx = "";
    if (mecanicosDx.length) {
      bloqueMecanicosDx = `<div class="ofdx-callout"><strong>Mecanicos disponibles:</strong><div class="ofdx-actions" style="margin-top:6px;">${mecanicosDx
        .map(function (entry) {
          var m = entry.mecanico;
          return `<button class="btn" type="button" onclick="ofDxPedirVeredictoMecanico(${entry.idx})">${ofDxEscapar(m.nombre || "Mecanico")} (${Math.round(((m && m.habilidad) || 0) * 100)}%)</button>`;
        })
        .join("")}</div></div>`;
    } else {
      bloqueMecanicosDx =
        '<div class="ofdx-callout warn">No hay mecanicos disponibles ahora (ocupados, bloqueados o en enfriamiento).</div>';
    }

    var sugerido =
      clienteActual.ofDxSugerencia ||
      clienteActual.diagnosticoSeleccionado ||
      "";
    var veredictoMec = clienteActual.ofDxVeredictoMecanico || null;
    if (clienteActual.diagnosticado) {
      opciones.innerHTML = `${bloqueMecanicosDx}<div class="diagnostico-jugador-vacio"><div class="ofdx-callout ok"><strong>Dictamen emitido:</strong> ${ofDxEscapar(clienteActual.diagnosticoDetectado || "sin registro")}</div></div>`;
    } else if (sugerido) {
      var bloqueVeredicto = "";
      if (veredictoMec && veredictoMec.diagnostico) {
        bloqueVeredicto = `<div class="ofdx-callout"><strong>Veredicto de ${ofDxEscapar(veredictoMec.mecanico || "Mecanico")}:</strong> ${ofDxEscapar(veredictoMec.diagnostico)} (${Math.max(0, Math.round(veredictoMec.confianzaPct || 0))}% confianza) <button class="btn" style="margin-left:8px; padding:2px 8px; font-size:0.72rem;" onclick="ofDxUsarVeredictoMecanico()">Usar veredicto</button></div>`;
      }
      opciones.innerHTML = `${bloqueMecanicosDx}<div class="diagnostico-jugador-vacio"><div class="ofdx-callout ok"><strong>Teoria lider:</strong> ${ofDxEscapar(sugerido)}</div>${bloqueVeredicto}<div class="ofdx-callout warn">Si cierras ahora, el riesgo humano esta en ${riesgo}%.</div></div>`;
    } else {
      var bloqueSoloMec = "";
      if (veredictoMec && veredictoMec.diagnostico) {
        bloqueSoloMec = `<div class="ofdx-callout"><strong>Veredicto de ${ofDxEscapar(veredictoMec.mecanico || "Mecanico")}:</strong> ${ofDxEscapar(veredictoMec.diagnostico)} (${Math.max(0, Math.round(veredictoMec.confianzaPct || 0))}% confianza) <button class="btn" style="margin-left:8px; padding:2px 8px; font-size:0.72rem;" onclick="ofDxUsarVeredictoMecanico()">Usar veredicto</button></div>`;
      }
      opciones.innerHTML = `${bloqueMecanicosDx}<div class="diagnostico-jugador-vacio"><div class="ofdx-callout">Aun no hay una teoria dominante. Empuja evidencia en una linea y vuelve a mirar el muro.</div>${bloqueSoloMec}</div>`;
    }
  } else {
    head.innerHTML = '<span class="ofdx-case-id">Sin expediente</span><strong>Selecciona un caso</strong>';
    detalle.innerHTML = "<span>Elige de la cola de espera.</span><span>Abre un expediente para empezar la investigacion.</span>";
    if (relato)
      relato.innerHTML =
        '<div class="ofdx-story-blurb">Cliente: ningun caso activo.</div>';
    if (casoKpis) {
      casoKpis.innerHTML =
        '<div class="ofdx-case-kpi warn"><span>Entrevistas</span><strong>0</strong></div><div class="ofdx-case-kpi warn"><span>Hallazgos</span><strong>0</strong></div><div class="ofdx-case-kpi mid"><span>Pruebas</span><strong>0</strong></div><div class="ofdx-case-kpi mid"><span>Sistema lider</span><strong>-</strong></div>';
    }
    if (hiloInvestigacion) {
      hiloInvestigacion.innerHTML =
        '<div class="ofdx-thread-card warn"><span class="ofdx-thread-step">01</span><div><strong>Sin caso abierto</strong><p>Toma un cliente de cola o pendientes para arrancar la mesa de investigacion.</p></div></div>';
    }
    if (candidatos) candidatos.innerHTML = "";
    if (accionesPrincipales) accionesPrincipales.innerHTML = "";
    ofDxRenderizarFaseRail(null);
    resumen.innerHTML =
      '<div class="ofdx-callout">Esperando seleccion de caso. Cuando abras un expediente, aqui apareceran confianza, riesgo y checklist de cierre.</div>';
    if (progreso)
      progreso.innerHTML =
        '<div class="ofdx-progress-line"><strong>Reconstruccion del caso</strong><span>0/5</span></div><div class="ofdx-progress-bar"><span style="width:0%;"></span></div><div class="ofdx-progress-hint">Sin pruebas ni rondas activas.</div>';
    if (modoPruebas)
      modoPruebas.innerHTML =
        '<div class="ofdx-callout">Selecciona un caso para habilitar ritmo de investigacion y banco de herramientas.</div>';
    if (probablesBox)
      probablesBox.innerHTML =
        '<div class="ofdx-callout">Sin caso activo para levantar sospechosos y fijar senales en el muro.</div>';
    if (mini)
      mini.innerHTML =
        '<div class="ofdx-callout">Sin caso activo para registrar lecturas de laboratorio.</div>';
    if (matriz) ofDxRenderizarMatriz(null);
    opciones.innerHTML = "";
    ofDxMostrarSelectorCasos();
  }
  ofDxActualizarWizardUI(clienteActual);
}

function ofDxTomarCaso(index, origen) {
  if (origen === "pendiente") activarPendienteDiagnostico(index, false);
  else seleccionarClienteCola(index, false);
  setTimeout(function () {
    renderizarModalDiagnosticoOficina();
    var casoCard = document.getElementById("ofdx-caso-card");
    if (!casoCard) return;
    casoCard.classList.remove("ofdx-highlight");
    void casoCard.offsetWidth;
    casoCard.classList.add("ofdx-highlight");
    setTimeout(function () {
      casoCard.classList.remove("ofdx-highlight");
    }, 1300);
  }, 20);
}

function ofDxMostrarSelectorCasos() {
  var selector = document.getElementById("ofdx-selector-clientes");
  var lista = document.getElementById("ofdx-lista-clientes-diagnostico");
  if (!selector || !lista) return;

  var pendientesDx = Array.isArray(casosPendientesDiagnostico)
    ? casosPendientesDiagnostico
    : [];
  var cola = Array.isArray(clientesEnEspera) ? clientesEnEspera : [];

  if (!pendientesDx.length && !cola.length) {
    selector.classList.remove("show");
    selector.classList.add("hidden");
    lista.innerHTML =
      '<div style="color: #b09f88; font-size: 0.78rem;">Sin casos en cola ni pendientes de diagnostico.</div>';
    return;
  }

  var html = '<div class="ofdx-selector-list">';

  if (pendientesDx.length) {
    html +=
      '<div style="color:#f0d4a2; font-size:0.72rem; letter-spacing:0.06em; margin:4px 0;">PENDIENTES DE DIAGNOSTICO</div>';
    pendientesDx.forEach(function (cliente, index) {
      if (!cliente) return;
      var nombre = cliente.personaNombre || "Cliente sin nombre";
      var vehiculo = cliente.vehiculo || "Vehiculo sin ficha";
      var problema =
        cliente.declaracionCliente || "Sin descripcion de problema";
      html += `
                <div class="ofdx-selector-item" onclick="ofDxTomarCaso(${index}, 'pendiente')">
                    <div class="ofdx-selector-item-name">${ofDxEscapar(nombre)}</div>
                    <div class="ofdx-selector-item-issue">${ofDxEscapar(vehiculo)} | ${ofDxEscapar(problema)}</div>
                </div>
            `;
    });
  }

  if (cola.length) {
    html +=
      '<div style="color:#b7c8cf; font-size:0.72rem; letter-spacing:0.06em; margin:8px 0 4px;">COLA DE ESPERA</div>';
  }

  cola.forEach(function (cliente, index) {
    if (!cliente) return;
    var nombre = cliente.personaNombre || "Cliente sin nombre";
    var vehiculo = cliente.vehiculo || "Vehiculo sin ficha";
    var problema = cliente.declaracionCliente || "Sin descripcion de problema";

    html += `
            <div class="ofdx-selector-item" onclick="ofDxTomarCaso(${index}, 'cola')">
                <div class="ofdx-selector-item-name">${ofDxEscapar(nombre)}</div>
                <div class="ofdx-selector-item-issue">${ofDxEscapar(vehiculo)} | ${ofDxEscapar(problema)}</div>
            </div>
        `;
  });

  html += "</div>";
  lista.innerHTML = html;
  selector.classList.remove("hidden");
  selector.classList.add("show");
}

function ofDxSeleccionarDiagnostico(nombre) {
  seleccionarDiagnosticoJugador(nombre);
  setTimeout(renderizarModalDiagnosticoOficina, 20);
}

function ofDxObtenerMecanicosDisponibles() {
  var modoSinCierre =
    typeof estaModoSinCierreDia === "function" && estaModoSinCierreDia();
  var ocupados = new Set(
    (reparacionesActivas || []).map(function (r) {
      return r && r.mecanicoNombre ? r.mecanicoNombre : "";
    }),
  );
  return (Array.isArray(mecanicos) ? mecanicos : [])
    .map(function (m, idx) {
      return { mecanico: m, idx: idx };
    })
    .filter(function (entry) {
      var m = entry.mecanico;
      if (!m) return false;
      if (ocupados.has(m.nombre)) return false;
      if (modoSinCierre && (m.bloqueadoHastaDia || 0) >= dia)
        m.bloqueadoHastaDia = 0;
      if (!modoSinCierre && (m.bloqueadoHastaDia || 0) >= dia) return false;
      if ((m.enfriamientoTurnos || 0) > 0) return false;
      return true;
    });
}

function ofDxResolverMecanicoConsultor(idxPreferido) {
  var disponibles = ofDxObtenerMecanicosDisponibles();
  if (typeof idxPreferido === "number") {
    var elegido = disponibles.find(function (entry) {
      return entry.idx === idxPreferido;
    });
    if (elegido) return elegido.mecanico;
    return null;
  }
  if (!disponibles.length) return null;

  disponibles.sort(function (a, b) {
    var habA =
      a.mecanico && typeof a.mecanico.habilidad === "number"
        ? a.mecanico.habilidad
        : 0;
    var habB =
      b.mecanico && typeof b.mecanico.habilidad === "number"
        ? b.mecanico.habilidad
        : 0;
    return habB - habA;
  });
  return disponibles[0].mecanico || null;
}

function ofDxPedirVeredictoMecanico(idxMecanico) {
  if (!clienteActual) {
    ofDxMiniResultado = "No hay caso activo para pedir veredicto.";
    renderizarModalDiagnosticoOficina();
    return;
  }
  if (clienteActual.diagnosticado) {
    ofDxMiniResultado =
      "Este caso ya tiene dictamen emitido. No procede nueva consulta.";
    renderizarModalDiagnosticoOficina();
    return;
  }
  if (!consumirFoco("diagnostico")) return;

  var mecanico =
    typeof idxMecanico === "number"
      ? ofDxResolverMecanicoConsultor(idxMecanico)
      : ofDxResolverMecanicoConsultor();
  if (!mecanico) {
    ofDxMiniResultado =
      "Ese mecanico no esta disponible ahora. Elige otro de la lista.";
    renderizarModalDiagnosticoOficina();
    return;
  }

  var opciones = Array.isArray(clienteActual.diagnosticoOpciones)
    ? clienteActual.diagnosticoOpciones.slice()
    : [];
  var real = clienteActual.nombre || "";
  var confianzaCaso = Math.max(
    0,
    Math.min(100, Math.round(clienteActual.ofDxConfianzaPct || 0)),
  );
  var base =
    0.42 +
    (mecanico.habilidad || 0) * 0.45 +
    confianzaCaso / 350 -
    (clienteActual.dificultad || 0) * 0.24;
  if ((mecanico.especialidad || "") === (clienteActual.especialidadIdeal || ""))
    base += 0.1;
  if ((mecanico.enojo || 0) >= 4) base -= 0.08;
  if ((clienteActual.entrevistasHechas || 0) >= 1) base += 0.05;
  if (clienteActual.ofDxAnalisisHecho) base += 0.05;
  if (
    clienteActual.inspeccion &&
    Array.isArray(clienteActual.inspeccion.hallazgos) &&
    clienteActual.inspeccion.hallazgos.length > 0
  )
    base += 0.04;
  var probAcertar = Math.max(0.15, Math.min(0.92, base));

  var sugerido = "";
  var acierta = Math.random() < probAcertar;
  if (acierta && real) {
    sugerido = real;
  } else {
    var poolError = opciones.filter(function (o) {
      return o && o !== real;
    });
    sugerido =
      poolError[Math.floor(Math.random() * poolError.length)] ||
      opciones[0] ||
      real;
  }

  if (sugerido) {
    clienteActual.ofDxVeredictoMecanico = {
      mecanico: mecanico.nombre || "Mecanico",
      diagnostico: sugerido,
      acierta: !!(sugerido && real && sugerido === real),
      confianzaPct: Math.round(probAcertar * 100),
      timestamp: Date.now(),
    };
    ofDxMiniResultado = `${mecanico.nombre} sugiere: ${sugerido}. Puedes usar ese veredicto o emitir el tuyo.`;
    log(`Segunda opinion de ${mecanico.nombre}: ${sugerido}.`, "info");
  } else {
    ofDxMiniResultado = `${mecanico.nombre} no logro cerrar un veredicto util en este caso.`;
    log(`${mecanico.nombre} no pudo emitir segunda opinion clara.`, "warn");
  }

  consumirTurno(
    `segunda opinion ${mecanico.nombre}`,
    Math.max(1, COSTOS_TURNO.diagnostico || 1),
  );
  renderizarModalDiagnosticoOficina();
}

function ofDxUsarVeredictoMecanico() {
  if (!clienteActual || clienteActual.diagnosticado) return;
  var veredicto = clienteActual.ofDxVeredictoMecanico;
  if (!veredicto || !veredicto.diagnostico) {
    ofDxMiniResultado = "No hay veredicto mecanico disponible para aplicar.";
    renderizarModalDiagnosticoOficina();
    return;
  }
  seleccionarDiagnosticoJugador(veredicto.diagnostico);
  ofDxMiniResultado = `Aplicaste el veredicto de ${veredicto.mecanico}: ${veredicto.diagnostico}.`;
  renderizarModalDiagnosticoOficina();
}

function ofDxEmitirDiagnostico() {
  var idCasoPrevio = clienteActual ? clienteActual.idCaso || "" : "";
  if (clienteActual) ofDxAsegurarEstadoCaso(clienteActual);
  if (
    clienteActual &&
    !clienteActual.diagnosticoSeleccionado &&
    clienteActual.ofDxSugerencia
  ) {
    clienteActual.diagnosticoSeleccionado = clienteActual.ofDxSugerencia;
  }
  emitirDiagnosticoJugador();

  if (!clienteActual && idCasoPrevio) {
    if (typeof cerrarModal === "function") cerrarModal();
    if (typeof mostrarFeedbackGameplay === "function") {
      mostrarFeedbackGameplay(
        `Caso ${idCasoPrevio} cerrado por fallo de diagnostico.`,
        "warn",
      );
    }
    return;
  }

  // Si ya emitiste dictamen, cerramos modal y te llevamos al siguiente paso logico.
  if (clienteActual && clienteActual.diagnosticado) {
    if (typeof cerrarModal === "function") cerrarModal();
    if (clienteActual.diagnosticoCorrecto) {
      if (typeof mostrarFeedbackGameplay === "function") {
        mostrarFeedbackGameplay(
          "Diagnostico emitido. Ahora negocia o confirma por WhatsApp antes de asignar un mecanico.",
          "ok",
        );
      }
      actualizarUI();
    } else {
      if (typeof mostrarFeedbackGameplay === "function") {
        mostrarFeedbackGameplay(
          "Diagnostico rechazado. Gestiona el cierre del caso desde el panel.",
          "warn",
        );
      }
    }
    return;
  }

  setTimeout(renderizarModalDiagnosticoOficina, 20);
}

function ofDxHablarCliente() {
  hablarConCliente(false);
  if (clienteActual && clienteActual.declaracionCliente) {
    ofDxMiniResultado = `Cliente: "${clienteActual.declaracionCliente}"`;
  }
  setTimeout(renderizarModalDiagnosticoOficina, 20);
}

function ofDxCambiarEstrategia() {
  cambiarEstrategiaCliente();
  setTimeout(renderizarModalDiagnosticoOficina, 20);
}

function ofDxInspeccion() {
  if (!clienteActual) {
    ofDxMiniResultado = "No hay caso activo para inspeccionar.";
    renderizarModalDiagnosticoOficina();
    return;
  }
  if (typeof asegurarExpedienteInspeccion === "function")
    asegurarExpedienteInspeccion(clienteActual);
  ofDxAsegurarEstadoCaso(clienteActual);

  if (!ofDxEnfoqueActivo) {
    ofDxMiniResultado = "Define primero una hipotesis activa para analizar.";
    renderizarModalDiagnosticoOficina();
    return;
  }

  if ((clienteActual.ofDxRondasAnalisis || 0) >= 4) {
    ofDxMiniResultado =
      "Ya completaste 4 rondas de analisis en este caso. Emite o consulta veredicto mecanico.";
    renderizarModalDiagnosticoOficina();
    return;
  }

  var resultado = ofDxEvaluarEnfoque(ofDxEnfoqueActivo, clienteActual);
  var puntajes = clienteActual.ofDxPuntajeSistemas || {};
  var scorePrevio = Math.max(0, Math.round(puntajes[ofDxEnfoqueActivo] || 0));
  var delta = resultado.acierto ? 2 : -1;
  puntajes[ofDxEnfoqueActivo] = Math.max(0, scorePrevio + delta);

  clienteActual.ofDxAciertos =
    (clienteActual.ofDxAciertos || 0) + (resultado.acierto ? 1 : 0);
  clienteActual.ofDxRuido =
    (clienteActual.ofDxRuido || 0) + (resultado.acierto ? 0 : 1);
  clienteActual.ofDxRondasAnalisis =
    Math.max(0, Math.round(clienteActual.ofDxRondasAnalisis || 0)) + 1;
  clienteActual.ofDxAnalisisHecho = clienteActual.ofDxRondasAnalisis >= 2;

  var top = ofDxTopSistemas(clienteActual, 2);
  var principal = top[0] ? top[0].key : ofDxEnfoqueActivo;
  var sugerido = ofDxDiagnosticoSugeridoPorEnfoque(clienteActual, principal);
  if (sugerido) {
    // La ronda suma evidencia, pero el jugador conserva la decision final.
  }

  if (clienteActual.inspeccion) {
    if (!Array.isArray(clienteActual.inspeccion.hallazgos))
      clienteActual.inspeccion.hallazgos = [];
    clienteActual.inspeccion.hallazgos.push(
      `Ronda ${clienteActual.ofDxRondasAnalisis} (${ofDxEnfoqueActivo}): ${resultado.acierto ? "confirmacion fuerte" : "lectura ruidosa"} | evidencia ${puntajes[ofDxEnfoqueActivo]}`,
    );
    clienteActual.inspeccion.bonus = Math.min(
      0.22,
      (clienteActual.inspeccion.bonus || 0) + (resultado.acierto ? 0.03 : 0.01),
    );
  }

  var topTxt = top
    .map(function (item) {
      return `${item.key} ${item.score}`;
    })
    .join(" | ");
  ofDxMiniResultado = `Ronda ${clienteActual.ofDxRondasAnalisis}/4: ${resultado.texto} Evidencia: ${topTxt || "sin datos"}${sugerido ? `. Sugerido: ${sugerido}.` : ""}`;
  log(
    `Analisis de ${ofDxEnfoqueActivo}: ${resultado.acierto ? "acierto" : "ruido"} | ronda ${clienteActual.ofDxRondasAnalisis}/4.`,
    resultado.acierto ? "exito" : "warn",
  );
  renderizarModalDiagnosticoOficina();
}

function ofDxAbrirWhatsApp() {
  abrirNegociacionClienteTelefono();
}

function ofDxIrRepuestos() {
  abrirModal("repuestos");
}

// ================================================================
//  TELEFONO / CHAT
// ================================================================

function inicializarTelefono() {
  // Solo asegurar mecánicos si no existen
  if (!Array.isArray(window.mecanicos) || window.mecanicos.length === 0) {
    asegurarMecanicosGlobal();
  }
  if (!Array.isArray(telefonoContactos)) telefonoContactos = [];
  if (!telefonoMensajes || typeof telefonoMensajes !== "object")
    telefonoMensajes = {};
  limpiarPendientesNarrativaTelefono();
  normalizarEstadoNarrativaEx();

  // Compatibilidad: elimina el contacto unico legacy para usar chats por caso.
  telefonoContactos = telefonoContactos.filter(function (c) {
    return c && c.id !== "cliente_actual";
  });
  if (telefonoContactoActivo === "cliente_actual")
    telefonoContactoActivo = null;
  if (telefonoMensajes["cliente_actual"])
    delete telefonoMensajes["cliente_actual"];

  obtenerContactosBaseTelefono().forEach(function (c) {
    upsertContactoTelefono(c);
  });

  // Agregar mecanicos como contactos y asegurar mensaje inicial
  if (typeof mecanicos !== "undefined") {
    mecanicos.forEach(function (m) {
      var bioTel =
        typeof obtenerBioMecanicoSeguro === "function"
          ? obtenerBioMecanicoSeguro(m.nombre)
          : { foto: "" };
      var contactoId = "mec_" + m.nombre;
      upsertContactoTelefono({
        id: contactoId,
        nombre: m.nombre,
        avatar: bioTel.foto || "🔧",
        tipo: "personal",
      });
      // Mensaje inicial si no existe
      if (!telefonoMensajes[contactoId] || telefonoMensajes[contactoId].length === 0) {
        telefonoMensajes[contactoId] = [
          {
            autor: contactoId,
            texto: `Hola, soy ${m.nombre}, tu mecánico de confianza. Escríbeme si necesitas ayuda con tu vehículo.`,
            hora: "08:00",
            leido: true,
          },
        ];
      }
    });
  }

  // Cada caso activo tiene su propio chat para seguimiento y negociacion.
  if (typeof clienteActual !== "undefined" && clienteActual) {
    if (typeof asegurarIdCasoCliente === "function")
      asegurarIdCasoCliente(clienteActual);
    asegurarContactoCasoTelefono(clienteActual, true);
  }
  if (Array.isArray(clientesEnEspera)) {
    clientesEnEspera.forEach(function (c) {
      if (typeof asegurarIdCasoCliente === "function") asegurarIdCasoCliente(c);
      asegurarContactoCasoTelefono(c, false);
    });
  }
  if (Array.isArray(reparacionesActivas)) {
    reparacionesActivas.forEach(function (rep) {
      if (rep && rep.idCaso) asegurarContactoCasoTelefono(rep, false);
    });
  }

  // Limpia chats de clientes que ya no estan en cola, expediente activo ni reparacion.
  sincronizarContactosClienteTelefono();

  // Mensajes iniciales predeterminados
  if (!telefonoMensajes["ex"]) {
    telefonoMensajes["ex"] = [
      {
        autor: "ex",
        texto: "El reclamo ya esta en manos de mis abogados. Si quieres proponer algo, hazlo por escrito.",
        hora: "08:14",
        leido: false,
      },
      {
        autor: "ex",
        texto: "El dia 14 nos vemos ante el juez. Tus cuentas, la deuda y el estado del taller van a pesar.",
        hora: "08:15",
        leido: true,
      },
    ];
  }
  if (!telefonoMensajes["abogado"]) {
    telefonoMensajes["abogado"] = [
      {
        autor: "abogado",
        texto:
          "Buenos dias. La audiencia es el dia 14. Antes de entonces necesitamos caja ordenada, registros de trabajos y buena reputacion.",
        hora: "09:02",
        leido: false,
      },
    ];
  }
  if (!telefonoMensajes["proveedor"]) {
    telefonoMensajes["proveedor"] = [
      {
        autor: "proveedor",
        texto:
          "Buenas! Tenemos motor, transmision, frenos y suspension. Delivery disponible hoy.",
        hora: "07:45",
        leido: true,
      },
    ];
  }
  if (!telefonoMensajes["banco"]) {
    var deudaActual = typeof deuda === "number" ? Math.round(deuda) : 5000;
    var tasaHoy =
      typeof obtenerTasaCuotaBancoDia === "function"
        ? Math.round(
            obtenerTasaCuotaBancoDia(typeof dia === "number" ? dia : 1) * 1000,
          ) / 10
        : 3.5;
    telefonoMensajes["banco"] = [
      {
        autor: "banco",
        texto:
          "Buenos dias. Su deuda actual es RD$" +
          deudaActual +
          ". Tasa diaria: " +
          tasaHoy +
          "%. Escribanos para gestionar su cuenta.",
        hora: "07:30",
        leido: true,
      },
    ];
  }
  if (!telefonoMensajes["autofix"] && (typeof obtenerCasosCompletadosNarrativa === "function" && obtenerCasosCompletadosNarrativa() >= 8)) {
    telefonoMensajes["autofix"] = [{ autor: "autofix", texto: "AutoFix Express informa: abrimos con agenda rápida, diagnóstico digital y precios de entrada.", hora: "10:20", leido: false }];
  }
  if (telefonoMensajes["resenas"]) delete telefonoMensajes["resenas"];
  if (!telefonoMensajes["inspector"]) {
    telefonoMensajes["inspector"] = [
      {
        autor: "inspector",
        texto: "Aviso preventivo: mantenga permisos, cuentas y area de trabajo en orden. Una inspeccion puede ocurrir sin previo aviso.",
        hora: "06:00",
        leido: true,
      },
    ];
  }

  // Actualiza mensajes introductorios de partidas anteriores sin tocar respuestas del jugador.
  Object.keys(telefonoMensajes).forEach(function (contactoId) {
    (telefonoMensajes[contactoId] || []).forEach(function (mensaje) {
      if (!mensaje || typeof mensaje.texto !== "string") return;
      if (mensaje.texto === "Mira lo que hiciste. No te pienso contestar.") {
        mensaje.texto = "El reclamo ya esta en manos de mis abogados. Si quieres proponer algo, hazlo por escrito.";
      } else if (mensaje.texto === "Tengo abogado. Cualquier cosa que hagas me la cuentan.") {
        mensaje.texto = "El dia 14 nos vemos ante el juez. Tus cuentas, la deuda y el estado del taller van a pesar.";
        mensaje.leido = true;
      } else if (mensaje.texto === "Buenos dias. El juicio esta programado para fin de mes. Necesito un adelanto de honorarios.") {
        mensaje.texto = "Buenos dias. La audiencia es el dia 14. Antes de entonces necesitamos caja ordenada, registros de trabajos y buena reputacion.";
      } else if (mensaje.texto === "We are watching.") {
        mensaje.texto = "Aviso preventivo: mantenga permisos, cuentas y area de trabajo en orden. Una inspeccion puede ocurrir sin previo aviso.";
        mensaje.leido = true;
      }
      if (contactoId === "proveedor" || contactoId === "banco" || contactoId.indexOf("mec_") === 0) {
        mensaje.leido = true;
      }
    });
  });

  var eventoExPendiente = obtenerEventoExPendienteActual();
  if (eventoExPendiente && typeof pushMensajeTelefono === "function") {
    pushMensajeTelefono("ex", "ex", eventoExPendiente.mensaje, {
      clave:
        eventoExPendiente.claveMensaje ||
        "ex-evento-" +
          eventoExPendiente.id +
          "-" +
          eventoExPendiente.casoLanzado,
      autorNombre: "Valeria",
    });
  }

  hidratarNarrativaTelefonoDiaActual();

  if (telefonoContactoActivo) {
    var existeActivo = telefonoContactos.some(function (c) {
      return c.id === telefonoContactoActivo;
    });
    if (!existeActivo) telefonoContactoActivo = null;
  }

  renderizarContactosTelefono();
  actualizarBadgeNavTelefono();
  if (hayConversacionNarrativaBloqueanteActiva()) {
    enfocarConversacionNarrativaPendiente();
  }
}

function renderizarContactosTelefono() {
  var lista = document.getElementById("tel-contacts");
  if (!lista) return;
  sincronizarContactosClienteTelefono();
  construirPanelHistoriaTelefono();
  var contactosFiltrados = telefonoContactos
    .filter(function (c) {
      return (
        contactoCoincideFiltroTelefono(c) && contactoCoincideBusquedaTelefono(c)
      );
    })
    .map(function (contacto) {
      var msgs = telefonoMensajes[contacto.id] || [];
      var ultimo = msgs.length ? msgs[msgs.length - 1].texto : "Sin mensajes";
      if (ultimo.length > 38) ultimo = ultimo.substring(0, 38) + "...";
      return {
        contacto: contacto,
        msgs: msgs,
        ultimo: ultimo,
        unread: contarNoLeidosContactoTelefono(contacto.id),
        urgente: esContactoUrgenteTelefono(contacto),
        largo: msgs.length,
      };
    })
    .sort(function (a, b) {
      if (a.unread !== b.unread) return b.unread - a.unread;
      if (a.urgente !== b.urgente) return Number(b.urgente) - Number(a.urgente);
      return b.largo - a.largo;
    });

  actualizarResumenSidebarTelefono(
    contactosFiltrados.map(function (item) {
      return item.contacto;
    }),
  );
  if (!contactosFiltrados.length) {
    lista.innerHTML =
      '<div class="tel-empty-contacts">Sin contactos para este filtro.</div>';
    actualizarBadgeNavTelefono();
    return;
  }
  lista.innerHTML = contactosFiltrados
    .map(function (item) {
      var c = item.contacto;
      var activo = telefonoContactoActivo === c.id ? " active" : "";
      var urgTag = item.urgente
        ? '<span class="tel-contact-flag">Urgente</span>'
        : "";
      var badge =
        item.unread > 0
          ? '<span class="tel-badge">' + item.unread + "</span>"
          : "";
      return (
        '<div class="tel-contact' +
        activo +
        '" onclick="abrirChatTelefono(\'' +
        c.id +
        "')\">" +
        renderAvatarContactoTelefono(c) +
        '<div class="tel-contact-info"><strong>' +
        escaparTextoTelefono(c.nombre) +
        '</strong><div class="tel-contact-preview-row"><span class="tel-contact-preview">' +
        escaparTextoTelefono(item.ultimo) +
        "</span>" +
        urgTag +
        "</div></div>" +
        badge +
        "</div>"
      );
    })
    .join("");
  actualizarBadgeNavTelefono();
    var contactoActivo = telefonoContactos.find(function (c) {
      return c && c.id === telefonoContactoActivo;
    });
    actualizarPuenteLoopTelefono(
      telefonoVista === "chat" ? contactoActivo : null,
    );
}

function abrirChatTelefono(contactoId) {
  var contacto = telefonoContactos.find(function (c) {
    return c.id === contactoId;
  });
  if (!contacto) return;
  telefonoContactoActivo = contactoId;
  telefonoVista = "chat";

  // Marcar mensajes como leidos
  var msgs = telefonoMensajes[contactoId] || [];
  msgs.forEach(function (m) {
    m.leido = true;
  });

  actualizarHeaderChatTelefono(contacto);

  renderizarMensajesTelefono(contactoId);
  renderizarOpcionesRespuestaTelefono(contactoId);
  renderizarContactosTelefono();
  actualizarVistaTelefono();
  enfocarCabeceraChatTelefonoMovil();
}

function enfocarCabeceraChatTelefonoMovil() {
  if (!window.matchMedia || !window.matchMedia("(max-width: 700px)").matches) return;
  window.requestAnimationFrame(function () {
    var game = document.getElementById("game");
    var cabecera = document.getElementById("tel-chat-header");
    var hud = document.getElementById("hud-header-fixed");
    if (!game || !cabecera) return;
    var desplazamiento = cabecera.getBoundingClientRect().top - game.getBoundingClientRect().top - (hud ? hud.offsetHeight + 6 : 0);
    if (Math.abs(desplazamiento) > 4) {
      game.scrollTo({ top: Math.max(0, game.scrollTop + desplazamiento), behavior: "auto" });
    }
  });
}

function renderizarMensajesTelefono(contactoId) {
  var msgs = telefonoMensajes[contactoId] || [];
  var container = document.getElementById("tel-messages");
  if (!container) return;
  if (!msgs.length) {
    container.innerHTML =
      '<div class="tel-empty">Sin mensajes. Escribe algo.</div>';
    return;
  }
  var contacto =
    (telefonoContactos || []).find(function (c) {
      return c && c.id === contactoId;
    }) || null;
  var esGrupo = !!(contacto && contacto.tipo === "grupo");
  container.innerHTML = msgs
    .map(function (m, idx) {
      var esJugador = m.autor === "jugador";
      var dir = esJugador ? "tel-msg-out" : "tel-msg-in";
      var autorVisible =
        m.metaAutorNombre || (esGrupo && !esJugador ? m.autor || "" : "");
      var autorHtml =
        !esJugador && autorVisible
          ? '<div class="tel-msg-autor">' +
            escaparTextoTelefono(autorVisible) +
            "</div>"
          : "";
      // Si el mensaje es un relato/caso largo, hacerlo expandible
      var texto = escaparTextoTelefono(m.texto);
      var esRelato = (m.esRelato || false) || (m.tipo === 'relato');
      var esLargo = texto.length > 120;
      var preview = esLargo ? texto.slice(0, 120) + "..." : texto;
      var expandHtml = "";
      if (esRelato && esLargo) {
        expandHtml = `<span class="tel-relato-preview">${preview}</span><span class="tel-relato-full" style="display:none;">${texto}</span>`;
      }
      var contenido = esRelato && esLargo
        ? expandHtml
        : texto.replace(/\n/g, "<br>");
      var extraAttrs = esRelato && esLargo ? ' onclick="toggleExpandirRelatoTelefono(this)" style="cursor:pointer;"' : '';
      // Definir delay correctamente
      var delay = Math.max(0, msgs.length - idx <= 10 ? (10 - (msgs.length - idx)) * 0.04 : 0);
      return (
        '<div class="tel-msg ' +
        dir +
        ' msg-animate" style="animation-delay: ' + delay + 's">' +
        '<div class="tel-msg-bubble"' + extraAttrs + '>' +
        autorHtml +
        contenido +
        '<span class="tel-msg-hora">' + m.hora + '</span>' +
        "</div>" +
        "</div>"
      );
    })
    .join("");
  container.scrollTop = container.scrollHeight;
}

function escaparTextoTelefono(texto) {
  return String(texto || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function obtenerMecanicoPorContacto(contactoId) {
  if (typeof contactoId !== "string" || contactoId.indexOf("mec_") !== 0)
    return null;
  var listaMecanicos = Array.isArray(mecanicos) ? mecanicos : [];
  return (
    listaMecanicos.find(function (m) {
      return m && "mec_" + m.nombre === contactoId;
    }) || null
  );
}

function construirOpcionesMecanicoWhatsApp(mec) {
  if (!mec || !mec.nombre) return [];
  var repActiva =
    (Array.isArray(reparacionesActivas) ? reparacionesActivas : []).find(
      function (r) {
        return r && r.mecanicoNombre === mec.nombre && !r.listoParaCobro;
      },
    ) || null;
  var key = String(mec.nombre || "").toLowerCase();
  var mapa = {
    frandy: [
      {
        texto: "Te recuerdo prioridad del caso top.",
        accion: "mec_recordatorio",
      },
      { texto: "Dame estado exacto del elevador.", accion: "mec_estado" },
      { texto: "Baja ritmo, sin errores por favor.", accion: "mec_calma" },
    ],
    maicol: [
      { texto: "Quiero lectura electrica ahora.", accion: "mec_estado" },
      { texto: "No fuerces piezas, ve con precision.", accion: "mec_calidad" },
      { texto: "Priorizo velocidad, cierralo ya.", accion: "mec_presion" },
    ],
    ridalvi: [
      { texto: "Caso urgente, dame ETA corto.", accion: "mec_urgencia" },
      { texto: "Reportame avance real del trabajo.", accion: "mec_estado" },
      { texto: "Si te trabas, pide piezas de una.", accion: "mec_piezas" },
    ],
    jeral: [
      { texto: "Checklist primero, luego entrega.", accion: "mec_calidad" },
      { texto: "Confirmame punto tecnico critico.", accion: "mec_estado" },
      {
        texto: "Si necesitas, toma una pausa corta y retoma.",
        accion: "mec_descanso",
      },
    ],
    edwin: [
      { texto: "Nada de pieza basica, quiero calidad.", accion: "mec_calidad" },
      { texto: "Reporta calibracion y riesgo final.", accion: "mec_estado" },
      {
        texto: "Te libero pausa corta y luego cierras.",
        accion: "mec_descanso",
      },
    ],
    stewart: [
      { texto: "Te asigno los casos de mayor dificultad.", accion: "mec_calidad" },
      { texto: "Dame un ETA de carrera sin saltarte el checklist.", accion: "mec_estado" },
      { texto: "Avísame cuánto capital te falta para tu box.", accion: "mec_estado" },
    ],
    morenai: [
      { texto: "Te apoyo con un bono estable si mantienes calidad.", accion: "mec_bono" },
      { texto: "Dame estado del caso y del próximo pago.", accion: "mec_estado" },
      { texto: "Trabaja con calma y cierra limpio.", accion: "mec_calidad" },
    ],
    martin: [
      { texto: "Te mantengo en la rotación para darte estabilidad.", accion: "mec_estado" },
      { texto: "Dime cómo vas con tus gastos médicos.", accion: "mec_estado" },
      { texto: "Tómate una pausa si la carga está alta.", accion: "mec_descanso" },
    ],
    diego: [
      { texto: "Te apoyo con la certificación cuando cierres este bloque.", accion: "mec_estado" },
      { texto: "Reporta la calibración antes de entregar.", accion: "mec_calidad" },
      { texto: "Dame el estado exacto de la transmisión.", accion: "mec_estado" },
    ],
    miguel: [
      { texto: "Miguel, te busco un caso largo y mejor pagado.", accion: "mec_turnos_largos" },
      { texto: "Dime cuánto necesitas y cómo va tu deuda.", accion: "mec_estado" },
      { texto: "Baja la presión; cuida la calidad del trabajo.", accion: "mec_calidad" },
    ],
  };
  var opcionesBase = mapa[key] || [
    { texto: "Dame estado del caso en curso.", accion: "mec_estado" },
    { texto: "Calidad: +15% exito, +20% tiempo.", accion: "mec_calidad" },
    { texto: "Respira y retoma con foco.", accion: "mec_descanso" },
  ];

  var opciones = [];

  var crisisStewart = typeof asegurarTrilogiaNarrativa === "function" ? asegurarTrilogiaNarrativa().stewart : null;
  if (key === "stewart" && crisisStewart && (crisisStewart.fase === "alerta" || crisisStewart.fase === "alerta_contenida")) {
    return aplicarEstadoOpcionesTelefono(contactoId, [
      { texto: "Formalizar continuidad y bono de retención (RD$700)", accion: "stewart_contrato", bloqueada: saldo < 700, motivoBloqueo: "Necesitas RD$700 en caja" },
      { texto: "Auditar accesos y reasignar su cartera", accion: "stewart_auditar" },
      { texto: "Habla claro: ¿qué necesitas para quedarte?", accion: "stewart_hablar" }
    ], false);
  }

  if (repActiva) {
    var casoRef = repActiva.idCaso || "CASO-0000";
    opciones.push(
      {
        texto: "Ve mas preciso en " + casoRef + ".",
        accion: "mec_contexto_preciso",
      },
      {
        texto: "Ve mas rapido en " + casoRef + ".",
        accion: "mec_contexto_rapido",
      },
    );
    opciones.push({
      texto: "Dame estado exacto de " + casoRef + ".",
      accion: "mec_estado",
    });
    if (repActiva.pausadaPorPieza) {
      opciones.push({
        texto: "Si te trabas, pide piezas de una.",
        accion: "mec_piezas",
      });
    }
  } else {
    // Sin caso activo, la conversación debe priorizar la necesidad propia
    // del mecánico. Antes se agregaban primero opciones genéricas y el corte
    // a tres botones ocultaba el contexto de favores, permisos o deudas.
    opciones = opcionesBase.slice(0, 3);
  }

  // Solicitudes pendientes del dia: prestamo, favor o ausencia
  if (mec.preguntaPendiente) {
    var pend = mec.preguntaPendiente;
    if (pend.tipo === "prestamo") {
      var etiquetaPrestamo = pend.etiquetaCorta || "prestamo";
      return [
        {
          texto: "Aprobar " + etiquetaPrestamo + " RD$" + (pend.monto || "?"),
          accion: "mec_aprobar_prestamo",
        },
        {
          texto: "No puedo con " + etiquetaPrestamo,
          accion: "mec_negar_prestamo",
        },
        { texto: "Dime cómo estás y qué pasa con el caso.", accion: "mec_estado" },
      ];
    } else if (pend.tipo === "favor") {
      return [
        { texto: "Le cubro ese favor", accion: "mec_aprobar_favor" },
        { texto: "No puedo cubrirte", accion: "mec_negar_favor" },
        { texto: "Dame el estado del taller antes de decidir.", accion: "mec_estado" },
      ];
    } else if (pend.tipo === "ausencia") {
      return [
        { texto: "Entendido, descansa hoy", accion: "mec_cubrir_ausencia" },
        { texto: "Te necesito hoy, ven", accion: "mec_exigir_presencia" },
      ];
    }
  }

  if ((mec.enojo || 0) >= 5 && (typeof saldo === "number" ? saldo : 0) >= 400) {
    opciones.push({
      texto: "Darle bono de calma (RD$400)",
      accion: "mec_bono",
    });
  }

  opcionesBase.forEach(function (opcion) {
    if (!opcion || !opcion.accion) return;
    if (
      opciones.some(function (actual) {
        return actual && actual.accion === opcion.accion;
      })
    )
      return;
    opciones.push(opcion);
  });

  return opciones.slice(0, 3);
}

function registrarPrestamoMecanico(mecanico, monto, origen) {
  if (!mecanico) return { monto: 0, deudaAnterior: 0, deudaActual: 0 };
  var valor = Math.max(0, Math.round(Number(monto) || 0));
  var deudaAnterior = Math.max(0, Math.round(Number(mecanico.deudaConTaller) || 0));
  mecanico.deudaConTaller = deudaAnterior + valor;
  mecanico.prestamosRecibidos = Math.max(0, Math.round(Number(mecanico.prestamosRecibidos) || 0)) + valor;
  mecanico.ultimoPrestamoTaller = {
    monto: valor,
    origen: String(origen || "equipo"),
    dia: typeof dia === "number" ? dia : 0,
    deudaPosterior: mecanico.deudaConTaller,
  };
  return { monto: valor, deudaAnterior: deudaAnterior, deudaActual: mecanico.deudaConTaller };
}

function resolverAccionWhatsAppMecanico(accion, contactoId) {
  var mec = obtenerMecanicoPorContacto(contactoId);
  if (!mec) return null;

  var rep =
    (Array.isArray(reparacionesActivas) ? reparacionesActivas : []).find(
      function (r) {
        return r && r.mecanicoNombre === mec.nombre;
      },
    ) || null;
  var key = String(mec.nombre || "").toLowerCase();

  if (key === "stewart" && (accion === "stewart_contrato" || accion === "stewart_auditar" || accion === "stewart_hablar")) {
    var crisis = typeof asegurarTrilogiaNarrativa === "function" ? asegurarTrilogiaNarrativa().stewart : null;
    if (!crisis || (crisis.fase !== "alerta" && crisis.fase !== "alerta_contenida")) return "Ese tema ya no puede resolverse por chat.";
    if (accion === "stewart_contrato") {
      if (saldo < 700) return "Sin RD$700 no puedo aceptar un acuerdo serio.";
      saldo -= 700;
      crisis.proteccion = "contrato";
      crisis.fase = "alerta_contenida";
      mec.enojo = Math.max(0, (mec.enojo || 0) - 2);
      return "Firmemos. No te prometo quedarme para siempre, pero no voy a llevarme tu cartera ni tus accesos.";
    }
    if (accion === "stewart_auditar") {
      crisis.proteccion = "auditoria";
      crisis.fase = "alerta_contenida";
      mec.enojo = Math.min(8, (mec.enojo || 0) + 1);
      return "Entiendo la auditoría. No me gusta, pero separa mi acceso de los clientes y protege al taller.";
    }
    return "Necesito claridad: un camino para crecer sin tener que construirlo a escondidas. Decide antes de dos casos.";
  }

  if (accion === "mec_recordatorio") {
    mec.recordatorioTrabajoDia = dia;
    mec.enojo = Math.max(0, (mec.enojo || 0) - 1);
    if ((mec.enojo || 0) < 5) {
      mec.enojoBloqueos = 0;
      mec.renunciaInminente = false;
    }
    if (key === "frandy")
      return "Recibido jefe. Con recordatorio me enfoco y salgo mas rapido.";
    return "Recibido. Tomo prioridad del caso ahora mismo.";
  }

  if (accion === "mec_descanso") {
    if (rep && !rep.listoParaCobro) {
      return "Ahora mismo no puedo parar, estoy en elevador. Te aviso al salir.";
    }
    mec.enojo = Math.max(0, (mec.enojo || 0) - 1);
    if ((mec.enojo || 0) < 5) {
      mec.enojoBloqueos = 0;
      mec.renunciaInminente = false;
    }
    return escogerPlantillaTelefono([
      "Gracias jefe, tomo aire y regreso fino.",
      "Me viene bien ese respiro, retomo con cabeza fria.",
    ]);
  }

  if (accion === "mec_presion") {
    mec.enojo = Math.min(8, (mec.enojo || 0) + 1);
    if (key === "maicol")
      return "Entendido, acelero, pero si la pieza es floja puede salir caro.";
    return "Voy rapido, pero recuerda que subir presion aumenta riesgo.";
  }

  if (accion === "mec_calma") {
    mec.enojo = Math.max(0, (mec.enojo || 0) - 1);
    if ((mec.enojo || 0) < 5) {
      mec.enojoBloqueos = 0;
      mec.renunciaInminente = false;
    }
    return "Copiado. Bajo revoluciones y cierro limpio.";
  }

  if (accion === "mec_calidad") {
    mec.recordatorioTrabajoDia = dia;
    if (rep && !rep.listoParaCobro) {
      rep.ordenCalidadActiva = true;
      rep.bonusExitoOrdenCalidad = 0.15;
      var extraCalidadSeg = Math.max(1, Math.round((rep.segundosPendientesReal || rep.duracionRealSeg || 5) * 0.2));
      rep.penalTiempoOrdenCalidadSeg = extraCalidadSeg;
      rep.segundosPendientesReal = Math.max(0, Math.round((rep.segundosPendientesReal || 0) + extraCalidadSeg));
      rep.duracionRealSeg = Math.max(rep.segundosPendientesReal, Math.round((rep.duracionRealSeg || 0) + extraCalidadSeg));
      if (rep.resultadoOculto === "fallo") {
        rep.resultadoOculto = "parcial";
        rep.nivelResultado = "parcial";
        rep.exito = true;
        rep.ganancia = Math.max(240, Math.round((rep.pagoAcordado || 900) * 0.56));
        rep.perdida = 0;
      }
    }
    if (key === "edwin")
      return "Asi mismo: con pieza buena la calibracion queda fina.";
    if (key === "maicol")
      return "Perfecto. Sin invento en cableado, vamos estable.";
    return rep && !rep.listoParaCobro
      ? "Orden aplicada a " + (rep.idCaso || "CASO-0000") + ": Calidad +15% exito, +20% tiempo."
      : "No tengo un caso activo donde aplicar la orden. Asigname uno y vuelve a enviarla.";
  }

  if (accion === "mec_urgencia") {
    if (rep && !rep.pausadaPorPieza && !rep.listoParaCobro) {
      ajustarTrabajoActivoSegundos(
        rep,
        -convertirDuracionTrabajoATiempoRealSeg(
          1,
          typeof modoNivelesActivo === "function" && modoNivelesActivo(),
        ),
      );
    }
    return "Voy con modo urgencia. Te mando update corto en breve.";
  }

  if (accion === "mec_contexto_preciso") {
    if (!rep || rep.listoParaCobro) {
      return "Ahora mismo no tengo caso abierto en elevador para cambiar enfoque.";
    }
    ajustarTrabajoActivoSegundos(
      rep,
      convertirDuracionTrabajoATiempoRealSeg(
        1,
        typeof modoNivelesActivo === "function" && modoNivelesActivo(),
      ),
    );
    if (rep.resultadoOculto === "fallo" && Math.random() < 0.45) {
      rep.resultadoOculto = "parcial";
      rep.nivelResultado = "parcial";
      rep.exito = true;
      rep.ganancia = Math.max(
        rep.ganancia || 0,
        Math.round((rep.pagoAcordado || rep.ganancia || 900) * 0.56),
      );
      rep.perdida = Math.max(0, Math.round(rep.perdida || 0));
    }
    mec.enojo = Math.max(0, (mec.enojo || 0) - 1);
    return "Copiado. Bajo velocidad y subo precision tecnica en este caso para evitar retrabajo.";
  }

  if (accion === "mec_contexto_rapido") {
    if (!rep || rep.listoParaCobro) {
      return "Sin caso activo en este momento para meter modo rapido.";
    }
    ajustarTrabajoActivoSegundos(
      rep,
      -convertirDuracionTrabajoATiempoRealSeg(
        2,
        typeof modoNivelesActivo === "function" && modoNivelesActivo(),
      ),
    );
    if (rep.resultadoOculto === "critico" && Math.random() < 0.22) {
      rep.resultadoOculto = "parcial";
      rep.nivelResultado = "parcial";
      rep.ganancia = Math.max(
        260,
        Math.round((rep.ganancia || rep.pagoAcordado || 1200) * 0.82),
      );
    } else if (rep.resultadoOculto === "parcial" && Math.random() < 0.18) {
      rep.resultadoOculto = "fallo";
      rep.nivelResultado = "fallo";
      rep.exito = false;
      rep.ganancia = 0;
      rep.perdida = Math.max(160, Math.round((rep.pagoAcordado || 900) * 0.3));
    }
    mec.enojo = Math.min(8, (mec.enojo || 0) + 1);
    return "Entendido. Acelero cierre del caso, pero sube el riesgo de detalle fino.";
  }

  if (accion === "mec_piezas") {
    if (rep && rep.pausadaPorPieza) {
      var req =
        Array.isArray(rep.piezasContinuacionRequeridas) &&
        rep.piezasContinuacionRequeridas.length
          ? rep.piezasContinuacionRequeridas
              .map(function (p) {
                return p.nombre;
              })
              .join(", ")
          : rep.piezaRequeridaNombre || "pieza de continuidad";
      return `Estoy trancado por piezas: ${req}. Sin eso no cierro.`;
    }
    return "Por ahora no necesito piezas extras. Sigo en proceso.";
  }

  if (accion === "mec_estado") {
    var modoSinCierreEstado =
      typeof estaModoSinCierreDia === "function" && estaModoSinCierreDia();
    if (rep) {
      if (rep.listoParaCobro)
        return `Caso ${rep.idCaso || "CASO-0000"} listo. Falta revisar resultado y cobrar.`;
      if (rep.pausadaPorPieza) {
        var req2 =
          Array.isArray(rep.piezasContinuacionRequeridas) &&
          rep.piezasContinuacionRequeridas.length
            ? rep.piezasContinuacionRequeridas
                .map(function (p) {
                  return p.nombre;
                })
                .join(", ")
            : rep.piezaRequeridaNombre || "pieza de continuidad";
        return `Trabajo pausado. Necesito ${req2}.`;
      }
      return `Voy con ${rep.idCaso || "CASO-0000"} | ETA ${formatearDuracionSegundos(obtenerSegundosRestantesReparacion(rep))}.`;
    }
    if ((mec.bloqueoAyudaTurnos || 0) > 0) {
      return `Estoy fuera resolviendo un asunto personal por ${typeof formatearBloqueoAyudaMecanico === "function" ? formatearBloqueoAyudaMecanico(mec.bloqueoAyudaTurnos) : (mec.bloqueoAyudaTurnos || 0) * 10 + " min"}.`;
    }
    if ((mec.enfriamientoTurnos || 0) > 0)
      return `Estoy enfriando ${formatearTiempoTrabajo(mec.enfriamientoTurnos)} y luego vuelvo.`;
    if (key === "miguel") {
      var deudaMiguel = Math.max(0, Math.round(mec.deudaConTaller || 0));
      return deudaMiguel > 0
        ? `Estoy libre por ahora. Mi deuda con el taller va en RD$${deudaMiguel}; necesito turnos largos para ponerme al día con la deuda familiar.`
        : "Estoy libre por ahora. Necesito turnos largos y casos de buen cobro para resolver una deuda familiar.";
    }
    if (modoSinCierreEstado && (mec.bloqueadoHastaDia || 0) >= dia)
      mec.bloqueadoHastaDia = 0;
    if (!modoSinCierreEstado && mec.bloqueadoHastaDia >= dia)
      return "Hoy sigo bloqueado por conflicto de piso.";
    return escogerPlantillaTelefono([
      "Estoy libre y listo para el siguiente caso.",
      "Barajando en piso, esperando asignacion.",
    ]);
  }

  if (accion === "mec_turnos_largos") {
    mec.bonoTurnosLargos = true;
    mec.enojo = Math.max(0, (mec.enojo || 0) - 1);
    if (typeof actualizarUI === "function") actualizarUI();
    return "Entendido jefe. Cuando quede libre, priorízame para trabajos largos: necesito levantar ingresos sin descuidar el taller.";
  }

  if (accion === "mec_bono") {
    const costoBono = 400;
    if ((typeof saldo === "number" ? saldo : 0) < costoBono) {
      return "No tengo nada en contra jefe, pero ahora mismo la caja no da para el bono.";
    }
    saldo -= costoBono;
    mec.enojo = Math.max(0, (mec.enojo || 0) - 2);
    mec.enojoBloqueos = 0;
    mec.renunciaInminente = false;
    if (
      window.TallerApp &&
      window.TallerApp.helpers &&
      typeof window.TallerApp.helpers.registrarGastoDia === "function"
    ) {
      window.TallerApp.helpers.registrarGastoDia(costoBono, "nomina");
    }
    if (typeof actualizarUI === "function") actualizarUI();
    return escogerPlantillaTelefono([
      "Gracias jefe, eso me llega de verdad. Volvemos al trabajo limpio.",
      "Buen gesto. Me bajo las revoluciones, entrego calidad y ya no pienso en irme.",
    ]);
  }

  // ── PRÉSTAMO VÍA WHATSAPP ──────────────────────────────────────────────
  if (accion === "mec_aprobar_prestamo") {
    var pend = mec.preguntaPendiente;
    if (!pend || pend.tipo !== "prestamo")
      return "No hay solicitud de prestamo activa.";
    var montoPrestamo = pend.monto || 600;
    if ((typeof saldo === "number" ? saldo : 0) < montoPrestamo) {
      var turnosCaja =
        typeof aplicarBloqueoAyudaMecanico === "function"
          ? aplicarBloqueoAyudaMecanico(mec, pend.penalizacionTurnos || 3)
          : 0;
      mec.preguntaPendiente = null;
      if (typeof actualizarUI === "function") actualizarUI();
      return escogerPlantillaTelefono([
        "Jefe, entiendo... si no hay caja para " +
          (pend.motivoTexto || "eso") +
          ", me toca salir a resolver. No me cuentes por " +
          (typeof formatearBloqueoAyudaMecanico === "function"
            ? formatearBloqueoAyudaMecanico(turnosCaja)
            : "un rato") +
          ".",
        "No hay problema jefe, busco como resolver " +
          (pend.motivoTexto || "eso") +
          " por mi cuenta. Vuelvo en " +
          (typeof formatearBloqueoAyudaMecanico === "function"
            ? formatearBloqueoAyudaMecanico(turnosCaja)
            : "un rato") +
          ".",
      ]);
    }
    saldo -= montoPrestamo;
    if (
      window.TallerApp &&
      window.TallerApp.helpers &&
      typeof window.TallerApp.helpers.registrarGastoDia === "function"
    ) {
      window.TallerApp.helpers.registrarGastoDia(montoPrestamo, "equipo");
    }
    var registroPrestamo = registrarPrestamoMecanico(mec, montoPrestamo, "whatsapp");
    mec.lealtad = Math.min(100, (mec.lealtad || 0) + 2);
    mec.enojo = Math.max(0, (mec.enojo || 0) - 1);
    mec.bloqueoAyudaTurnos = 0;
    mec.preguntaPendiente = null;
    if (typeof resumenDia !== "undefined" && resumenDia)
      resumenDia.prestamosDados =
        (resumenDia.prestamosDados || 0) + montoPrestamo;
    if (typeof decisionesHistoria !== "undefined")
      decisionesHistoria.prestamosAprobados =
        (decisionesHistoria.prestamosAprobados || 0) + 1;
    if (typeof tramaEstado !== "undefined")
      tramaEstado.historiasMecanicosAtendidas =
        (tramaEstado.historiasMecanicosAtendidas || 0) + 1;
    if (typeof actualizarUI === "function") actualizarUI();
    return escogerPlantillaTelefono([
      "Gracias jefe, de verdad. Eso me saca del aprieto. Mi deuda con el taller queda en RD$" + registroPrestamo.deudaActual + ".",
      "Jefe, te lo devuelvo pronto. Eso me da tranquilidad para trabajar limpio hoy. Quedo debiendo RD$" + registroPrestamo.deudaActual + ".",
    ]);
  }

  if (accion === "mec_negar_prestamo") {
    var pendNegado = mec.preguntaPendiente;
    mec.preguntaPendiente = null;
    mec.enojo = Math.min(8, (mec.enojo || 0) + 1);
    mec.lealtad = Math.max(0, (mec.lealtad || 0) - 5);
    var turnosNegado =
      typeof aplicarBloqueoAyudaMecanico === "function"
        ? aplicarBloqueoAyudaMecanico(
            mec,
            pendNegado && pendNegado.penalizacionTurnos
              ? pendNegado.penalizacionTurnos
              : 3,
          )
        : 0;
    if (typeof decisionesHistoria !== "undefined")
      decisionesHistoria.prestamosNegados =
        (decisionesHistoria.prestamosNegados || 0) + 1;
    if (typeof incrementarBloqueoEnojo === "function" && (mec.enojo || 0) >= 5)
      incrementarBloqueoEnojo(mec);
    if (typeof actualizarUI === "function") actualizarUI();
    if (key === "ridalvi")
      return (
        "Entendido jefe. Voy a resolver solo " +
        ((pendNegado && pendNegado.motivoTexto) || "eso") +
        ", pero esto no se me olvida. No me pongas casos por " +
        (typeof formatearBloqueoAyudaMecanico === "function"
          ? formatearBloqueoAyudaMecanico(turnosNegado)
          : "un rato") +
        "."
      );
    if (key === "edwin")
      return (
        "Ok jefe. El Riva sigue roto y yo sigo aqui, pero primero resuelvo " +
        ((pendNegado && pendNegado.motivoTexto) || "eso") +
        ". Vuelvo en " +
        (typeof formatearBloqueoAyudaMecanico === "function"
          ? formatearBloqueoAyudaMecanico(turnosNegado)
          : "un rato") +
        "."
      );
    return escogerPlantillaTelefono([
      "Entendido. Voy a resolver " +
        ((pendNegado && pendNegado.motivoTexto) || "eso") +
        " por mi cuenta. No me pongas trabajo por " +
        (typeof formatearBloqueoAyudaMecanico === "function"
          ? formatearBloqueoAyudaMecanico(turnosNegado)
          : "un rato") +
        ".",
      "Ok jefe. Resuelvo " +
        ((pendNegado && pendNegado.motivoTexto) || "eso") +
        " afuera y luego vuelvo. Dame " +
        (typeof formatearBloqueoAyudaMecanico === "function"
          ? formatearBloqueoAyudaMecanico(turnosNegado)
          : "un rato") +
        ".",
    ]);
  }

  // ── FAVOR ─────────────────────────────────────────────────────────────
  if (accion === "mec_aprobar_favor") {
    mec.preguntaPendiente = null;
    mec.lealtad = Math.min(100, (mec.lealtad || 0) + 5);
    mec.bloqueoAyudaTurnos = 0;
    // Cubrir favores genera ambiguedad ante clientes: pequena penalizacion de reputacion
    if (typeof reputacion !== "undefined")
      reputacion = Math.max(0, reputacion - 1);
    if (typeof moralEquipo !== "undefined")
      moralEquipo = Math.min(100, (moralEquipo || 50) + 6);
    if (typeof tramaEstado !== "undefined")
      tramaEstado.historiasMecanicosAtendidas =
        (tramaEstado.historiasMecanicosAtendidas || 0) + 1;
    if (typeof actualizarUI === "function") actualizarUI();
    return escogerPlantillaTelefono([
      "Jefe, eso vale mas que un bono. Cuenta conmigo para lo que necesites.",
      "Gracias jefe. No se me va a olvidar. Eso va en la cuenta buena.",
    ]);
  }

  if (accion === "mec_negar_favor") {
    var pendFavor = mec.preguntaPendiente;
    mec.preguntaPendiente = null;
    mec.enojo = Math.min(8, (mec.enojo || 0) + 1);
    var turnosFavor =
      typeof aplicarBloqueoAyudaMecanico === "function"
        ? aplicarBloqueoAyudaMecanico(
            mec,
            pendFavor && pendFavor.penalizacionTurnos
              ? pendFavor.penalizacionTurnos
              : 2,
          )
        : 0;
    if (typeof actualizarUI === "function") actualizarUI();
    return escogerPlantillaTelefono([
      "Ok jefe, entendido. Entonces resuelvo eso por mi lado y no me cuentes por " +
        (typeof formatearBloqueoAyudaMecanico === "function"
          ? formatearBloqueoAyudaMecanico(turnosFavor)
          : "un rato") +
        ".",
      "Copiado. No era obligatorio, pero ahora me toca salir a resolver. Vuelvo en " +
        (typeof formatearBloqueoAyudaMecanico === "function"
          ? formatearBloqueoAyudaMecanico(turnosFavor)
          : "un rato") +
        ".",
    ]);
  }

  // ── AUSENCIA ──────────────────────────────────────────────────────────
  if (accion === "mec_cubrir_ausencia") {
    mec.preguntaPendiente = null;
    mec.ausenciaAnunciada = true;
    var modoSinCierreAus =
      typeof estaModoSinCierreDia === "function" && estaModoSinCierreDia();
    if (modoSinCierreAus) {
      mec.enfriamientoTurnos = Math.max(
        Math.round(mec.enfriamientoTurnos || 0),
        6,
      );
    } else {
      mec.bloqueadoHastaDia = Math.max(
        mec.bloqueadoHastaDia || 0,
        typeof dia === "number" ? dia : 1,
      );
    }
    mec.lealtad = Math.min(100, (mec.lealtad || 0) + 2);
    if (typeof actualizarUI === "function") actualizarUI();
    return escogerPlantillaTelefono([
      modoSinCierreAus
        ? "Gracias jefe. Tomo esos turnos para resolver y regreso con foco."
        : "Gracias jefe. Manana entro al dia y trabajo doble para ponerme al corriente.",
      modoSinCierreAus
        ? "Ok jefe, cierro eso rapido y vuelvo al elevador en unos turnos."
        : "Ok jefe, te lo agradezco. Manana estoy fijo y sin excusas.",
    ]);
  }

  if (accion === "mec_exigir_presencia") {
    mec.preguntaPendiente = null;
    var enojoExig = mec.enojo || 0;
    if (enojoExig < 5) {
      mec.ausenciaAnunciada = false;
      var modoSinCierreExig =
        typeof estaModoSinCierreDia === "function" && estaModoSinCierreDia();
      if (modoSinCierreExig) {
        mec.enfriamientoTurnos = 0;
      } else {
        mec.bloqueadoHastaDia = Math.max(0, (mec.bloqueadoHastaDia || 0) - 1);
      }
      return escogerPlantillaTelefono([
        "Ok jefe, voy en camino. Resuelvo el tema en el trayecto.",
        "Entendido. Llego en media hora. Disculpa el retraso.",
      ]);
    } else {
      mec.enojo = Math.min(8, enojoExig + 1);
      if (typeof incrementarBloqueoEnojo === "function")
        incrementarBloqueoEnojo(mec);
      return escogerPlantillaTelefono([
        "Jefe, ya te dije que no puedo. No me presiones o esto se complica mas.",
        "No puedo y no voy. Si eso es problema, lo hablamos cuando llegue, si llego.",
      ]);
    }
  }

  return generarRespuestaContacto(contactoId);
}

function normalizarEstadoNarrativaEx() {
  if (!tramaEstado || typeof tramaEstado !== "object") {
    tramaEstado =
      window.TallerApp &&
      window.TallerApp.helpers &&
      typeof window.TallerApp.helpers.crearTramaEstadoInicial === "function"
        ? window.TallerApp.helpers.crearTramaEstadoInicial()
        : {};
  }
  if (typeof exRelacion !== "number" || isNaN(exRelacion)) exRelacion = 50;
  exRelacion = Math.max(0, Math.min(100, Math.round(exRelacion)));
  if (typeof tramaEstado.exUltimoEventoCasos !== "number")
    tramaEstado.exUltimoEventoCasos = 0;
  if (typeof tramaEstado.exEventosAtendidos !== "number")
    tramaEstado.exEventosAtendidos = 0;
  if (typeof tramaEstado.exEventosIgnorados !== "number")
    tramaEstado.exEventosIgnorados = 0;
  if (typeof tramaEstado.exPresionLegal !== "number")
    tramaEstado.exPresionLegal = 0;
  if (
    !tramaEstado.exEventoPendiente ||
    typeof tramaEstado.exEventoPendiente !== "object"
  ) {
    tramaEstado.exEventoPendiente = null;
  } else {
    var pendiente = tramaEstado.exEventoPendiente;
    pendiente.id = String(pendiente.id || "ex_evento").trim() || "ex_evento";
    pendiente.tipo =
      String(pendiente.tipo || pendiente.id || "reclamo").trim() || "reclamo";
    pendiente.categoria =
      String(pendiente.categoria || "eventos").trim() || "eventos";
    pendiente.casoLanzado = Math.max(0, Math.round(pendiente.casoLanzado || 0));
    pendiente.montoPago = Math.max(0, Math.round(pendiente.montoPago || 0));
    pendiente.montoNegociado = Math.max(
      0,
      Math.round(pendiente.montoNegociado || 0),
    );
    pendiente.multaIgnorar = Math.max(
      0,
      Math.round(pendiente.multaIgnorar || 0),
    );
    pendiente.mensaje = normalizarTextoNarrativaTelefono(
      pendiente.mensaje || "",
      420,
    );
    pendiente.accionPagarTexto = normalizarTextoNarrativaTelefono(
      pendiente.accionPagarTexto || "Resolver cargo ahora",
      80,
    );
    pendiente.accionNegociarTexto = normalizarTextoNarrativaTelefono(
      pendiente.accionNegociarTexto || "Negociar parcial",
      80,
    );
    pendiente.accionIgnorarTexto = normalizarTextoNarrativaTelefono(
      pendiente.accionIgnorarTexto || "Ignorar reclamo",
      80,
    );
    pendiente.motivoPago = normalizarTextoNarrativaTelefono(
      pendiente.motivoPago || "Pago a Valeria",
      80,
    );
    pendiente.motivoNegociado = normalizarTextoNarrativaTelefono(
      pendiente.motivoNegociado ||
        pendiente.motivoPago ||
        "Pago parcial a Valeria",
      80,
    );
    pendiente.claveMensaje = normalizarClaveNarrativaTelefono(
      pendiente.claveMensaje ||
        "ex-evento-" + pendiente.id + "-" + pendiente.casoLanzado,
    );
    pendiente.respuestas =
      pendiente.respuestas && typeof pendiente.respuestas === "object"
        ? pendiente.respuestas
        : {};
  }
  return tramaEstado;
}

function obtenerEventoExPendienteActual() {
  normalizarEstadoNarrativaEx();
  return tramaEstado &&
    tramaEstado.exEventoPendiente &&
    typeof tramaEstado.exEventoPendiente === "object"
    ? tramaEstado.exEventoPendiente
    : null;
}

function crearEventoExPorCasos(hitoCasoActual) {
  normalizarEstadoNarrativaEx();
  var hito = Math.max(4, Math.round(hitoCasoActual || 4));
  var rotacion = Math.max(
    0,
    Math.round(
      (tramaEstado.exEventosAtendidos || 0) +
        (tramaEstado.exEventosIgnorados || 0),
    ),
  );
  var eventos = [
    {
      id: "compras_plaza",
      categoria: "compras",
      base: 540,
      escala: 24,
      apertura:
        "Te toca cubrir unas compras que hice hoy. Si resuelves esto por chat, no llevo el tema al abogado.",
      motivo: "Compras de Valeria",
    },
    {
      id: "salon_belleza",
      categoria: "belleza",
      base: 690,
      escala: 20,
      apertura:
        "Tengo cuenta abierta en el salon y ya puse tu nombre para cerrarla hoy. Resuelvelo por aqui y no escalo nada.",
      motivo: "Salon de belleza de Valeria",
    },
    {
      id: "pedido_ultimo_minuto",
      categoria: "compras",
      base: 860,
      escala: 26,
      apertura:
        "Hay un pedido personal que no pienso absorber sola. Deposita ahora y dejamos este frente quieto por unos casos.",
      motivo: "Pedido personal de Valeria",
    },
  ];
  var modelo = eventos[rotacion % eventos.length];
  var presion = Math.max(0, Math.round(tramaEstado.exPresionLegal || 0));
  var friccion = Math.max(0, 50 - Math.round(exRelacion || 0));
  var montoPago = Math.round(
    modelo.base + hito * modelo.escala + friccion * 6 + presion * 95,
  );
  var montoNegociado = Math.max(
    220,
    Math.round(montoPago * (presion >= 2 ? 0.76 : 0.64)),
  );
  var multaIgnorar = Math.max(180, Math.round(montoPago * 0.34) + presion * 70);
  var mensaje = `${modelo.apertura} Son RD$${montoPago}.`;
  if (presion >= 2) mensaje += " Ya no estoy con paciencia para otra excusa.";

  return {
    id: modelo.id,
    tipo: modelo.id,
    categoria: modelo.categoria,
    casoLanzado: hito,
    montoPago: montoPago,
    montoNegociado: montoNegociado,
    multaIgnorar: multaIgnorar,
    pruebaNecesaria: 1,
    evidencia: "documentos que contradicen el cargo",
    mensaje: mensaje,
    motivoPago: modelo.motivo,
    motivoNegociado: `${modelo.motivo} (pago parcial)`,
    accionPagarTexto: `Cubrir ${modelo.categoria === "belleza" ? "salon" : "compras"} RD$${montoPago}`,
    accionNegociarTexto: `Depositar parcial RD$${montoNegociado}`,
    accionIgnorarTexto: "No voy a pagar eso",
    claveMensaje: `ex-evento-${modelo.id}-${hito}`,
    respuestas: {
      pagar: "Recibido. Bajo el tono por ahora, pero no vuelvas a desaparecer.",
      negociar:
        "No es lo que pedi, pero lo tomo por esta vez. La proxima no negocio tan facil.",
      ignorar: "Perfecto. Entonces esto sube de tono y te llega por otra via.",
    },
  };
}

function registrarGastoExTelefono(monto, categoria, motivo) {
  var valor = Math.max(0, Math.round(monto || 0));
  if (valor <= 0) return 0;
  if ((typeof saldo === "number" ? saldo : 0) >= valor) {
    saldo -= valor;
  } else {
    var faltante = valor - Math.max(0, Math.round(saldo || 0));
    saldo = 0;
    deuda = Math.max(0, Math.round(deuda || 0)) + faltante;
  }
  if (
    window.TallerApp &&
    window.TallerApp.helpers &&
    typeof window.TallerApp.helpers.registrarGastoDia === "function"
  ) {
    window.TallerApp.helpers.registrarGastoDia(valor, categoria || "eventos");
  } else if (resumenDia && typeof resumenDia === "object") {
    resumenDia.perdidas =
      Math.max(0, Math.round(resumenDia.perdidas || 0)) + valor;
  }
  if (resumenDia && Array.isArray(resumenDia.ramificaciones)) {
    resumenDia.ramificaciones.push(`${motivo}: -RD$${valor}`);
  }
  return valor;
}

function aplicarEscaladaLegalEx(pendiente, porSilencio) {
  normalizarEstadoNarrativaEx();
  var base =
    pendiente && pendiente.multaIgnorar
      ? Math.round(pendiente.multaIgnorar)
      : 240;
  var recargo = Math.max(180, base + (porSilencio ? 120 : 0));
  deuda = Math.max(0, Math.round(deuda || 0)) + recargo;
  reputacion = Math.max(0, Math.round(reputacion || 0) - (porSilencio ? 2 : 1));
  estres = Math.min(100, Math.round(estres || 0) + (porSilencio ? 5 : 4));
  tramaEstado.exEventosIgnorados =
    Math.max(0, Math.round(tramaEstado.exEventosIgnorados || 0)) + 1;
  tramaEstado.exPresionLegal =
    Math.max(0, Math.round(tramaEstado.exPresionLegal || 0)) + 1;
  exRelacion = Math.max(
    0,
    Math.round(exRelacion || 0) - (porSilencio ? 10 : 8),
  );
  if (resumenDia && Array.isArray(resumenDia.ramificaciones)) {
    resumenDia.ramificaciones.push(
      `Presion legal de Valeria: deuda +RD$${recargo}`,
    );
  }
  if (typeof pushMensajeTelefono === "function") {
    pushMensajeTelefono(
      "abogado",
      "abogado",
      `Valeria activo un reclamo adicional por RD$${recargo}. Si no ordenas caja y pruebas, esto pesa en el expediente.`,
      {
        clave: `abogado-ex-${pendiente && pendiente.id ? pendiente.id : "reclamo"}-${tramaEstado.exEventosIgnorados}`,
        autorNombre: "Lic. Montero",
      },
    );
  }
  return recargo;
}

function resolverDecisionEventoEx(decision, porSilencio) {
  normalizarEstadoNarrativaEx();
  var pendiente = obtenerEventoExPendienteActual();
  if (!pendiente) {
    return {
      ok: false,
      texto: "No hay reclamo activo de Valeria ahora mismo.",
    };
  }

  var respuesta = "";
  if (decision === "pagar") {
    var pagado = registrarGastoExTelefono(
      pendiente.montoPago,
      pendiente.categoria,
      pendiente.motivoPago || "Pago a Valeria",
    );
    exRelacion = Math.min(100, Math.round(exRelacion || 0) + 8);
    estres = Math.max(0, Math.round(estres || 0) - 2);
    tramaEstado.exEventosAtendidos =
      Math.max(0, Math.round(tramaEstado.exEventosAtendidos || 0)) + 1;
    tramaEstado.exPresionLegal = Math.max(
      0,
      Math.round(tramaEstado.exPresionLegal || 0) - 1,
    );
    respuesta = `${pendiente.respuestas.pagar || "Recibido."} Transferencia registrada por RD$${pagado}.`;
  } else if (decision === "negociar") {
    var negociado = registrarGastoExTelefono(
      pendiente.montoNegociado,
      pendiente.categoria,
      pendiente.motivoNegociado || "Pago parcial a Valeria",
    );
    exRelacion = Math.min(100, Math.round(exRelacion || 0) + 2);
    estres = Math.min(100, Math.round(estres || 0) + 1);
    tramaEstado.exEventosAtendidos =
      Math.max(0, Math.round(tramaEstado.exEventosAtendidos || 0)) + 1;
    respuesta = `${pendiente.respuestas.negociar || "Lo tomo por esta vez."} Entraron RD$${negociado} de forma parcial.`;
  } else if (decision === "rebatir") {
    if (Math.max(0, Math.round(tramaEstado.exPruebas || 0)) < 1) return { ok: false, texto: "Aún no tienes pruebas suficientes. Reúne documentos con el abogado." };
    if (Array.isArray(tramaEstado.exPruebasDetalle) && tramaEstado.exPruebasDetalle.length) tramaEstado.exPruebasDetalle.shift();
    tramaEstado.exPruebas = Array.isArray(tramaEstado.exPruebasDetalle) ? tramaEstado.exPruebasDetalle.length : Math.max(0, Math.round(tramaEstado.exPruebas || 0) - 1);
    tramaEstado.exReclamosRefutados = Math.max(0, Math.round(tramaEstado.exReclamosRefutados || 0) + 1);
    tramaEstado.exPresionLegal = Math.max(0, Math.round(tramaEstado.exPresionLegal || 0) - 2);
    reputacion = Math.min(100, Math.round(reputacion || 0) + 3);
    respuesta = `Adjuntaste ${pendiente.evidencia || "documentos válidos"}. El reclamo queda sin sustento: presión legal -2 y reputación +3.`;
    if (tramaEstado.exReclamosRefutados >= 3) {
      tramaEstado.exArcoResuelto = true;
      tramaEstado.exPresionLegal = 0;
      respuesta += " Valeria retira los reclamos recurrentes: ganaste este frente legal.";
    }
  } else {
    var recargo = aplicarEscaladaLegalEx(pendiente, !!porSilencio);
    respuesta = porSilencio
      ? `Como ni respondiste, movi esto por abogado. Desde ahora te pesa RD$${recargo} mas en el frente legal.`
      : `${pendiente.respuestas.ignorar || "Entonces esto escala."} Ya te subi presion legal por RD$${recargo}.`;
  }

  tramaEstado.exEventoPendiente = null;
  if (typeof actualizarUI === "function") actualizarUI();
  if (typeof autoGuardarPartidaSilenciosa === "function")
    autoGuardarPartidaSilenciosa(
      porSilencio ? "evento-ex-silencio" : "evento-ex-resuelto",
    );
  return { ok: true, texto: respuesta };
}

function resolverEventoExPendientePorSilencio(hitoCasoActual) {
  var pendiente = obtenerEventoExPendienteActual();
  if (!pendiente) return false;
  var resultado = resolverDecisionEventoEx("ignorar", true);
  if (!resultado.ok) return false;
  if (typeof pushMensajeTelefono === "function") {
    pushMensajeTelefono("ex", "ex", resultado.texto, {
      clave: `ex-silencio-${pendiente.id}-${Math.max(0, Math.round(hitoCasoActual || pendiente.casoLanzado || 0))}`,
      autorNombre: "Valeria",
    });
  }
  return true;
}

function dispararEventoExPorCasos(hitoCasoForzado) {
  if (typeof pushMensajeTelefono !== "function") return false;
  normalizarEstadoNarrativaEx();
  if (tramaEstado.exArcoResuelto) return false;

  var casosTotales =
    typeof obtenerCasosCompletadosNarrativa === "function"
      ? obtenerCasosCompletadosNarrativa()
      : Math.max(
          0,
          Math.round(
            ((tramaEstado && tramaEstado.casosCriticosResueltos) || 0) +
              ((tramaEstado && tramaEstado.casosParciales) || 0),
          ),
        );
  var cadenciaCasos = 4;
  var hitoCasoActual =
    typeof hitoCasoForzado === "number" && hitoCasoForzado > 0
      ? Math.max(0, Math.round(hitoCasoForzado))
      : Math.floor(casosTotales / cadenciaCasos) * cadenciaCasos;
  if (hitoCasoActual < cadenciaCasos) return false;

  var pendiente = obtenerEventoExPendienteActual();
  if (pendiente) {
    if (
      hitoCasoActual - Math.max(0, Math.round(pendiente.casoLanzado || 0)) >=
      cadenciaCasos
    ) {
      return resolverEventoExPendientePorSilencio(hitoCasoActual);
    }
    return false;
  }

  var ultimo = Math.max(0, Math.round(tramaEstado.exUltimoEventoCasos || 0));
  if (hitoCasoActual - ultimo < cadenciaCasos) return false;

  var evento = crearEventoExPorCasos(hitoCasoActual);
  tramaEstado.exUltimoEventoCasos = hitoCasoActual;
  tramaEstado.exEventoPendiente = evento;
  upsertContactoTelefono({
    id: "ex",
    nombre: "Valeria (Ex)",
    avatar: "💔",
    tipo: "personal",
  });
  pushMensajeTelefono("ex", "ex", evento.mensaje, {
    clave: evento.claveMensaje,
    autorNombre: "Valeria",
  });
  if (resumenDia && Array.isArray(resumenDia.ramificaciones)) {
    resumenDia.ramificaciones.push(
      `Valeria reactivo un reclamo por chat tras el caso ${hitoCasoActual}.`,
    );
  }
  if (typeof autoGuardarPartidaSilenciosa === "function")
    autoGuardarPartidaSilenciosa("evento-ex-disparado");
  return true;
}

function construirOpcionesExWhatsApp() {
  normalizarEstadoNarrativaEx();
  var pendiente = obtenerEventoExPendienteActual();
  if (pendiente) {
    return [
      { texto: pendiente.accionPagarTexto, accion: "ex_pagar" },
      { texto: pendiente.accionNegociarTexto, accion: "ex_negociar" },
      { texto: `Rebatir con pruebas (${Math.round(tramaEstado.exPruebas || 0)}/1)`, accion: "ex_rebatir", bloqueada: Math.round(tramaEstado.exPruebas || 0) < 1, motivoBloqueo: "Reúne prueba con el abogado" },
      { texto: "Ver expediente de pruebas", accion: "ex_expediente" },
      { texto: pendiente.accionIgnorarTexto, accion: "ex_ignorar" },
    ];
  }
  return [
    { texto: "Como va ese reclamo ahora mismo?", accion: "ex_estado" },
    { texto: "Mandame soporte del ultimo cargo.", accion: "ex_soporte" },
    { texto: "Reunir documentos y consultar al abogado — RD$450", accion: "ex_defensa" },
    { texto: "Ver expediente de pruebas", accion: "ex_expediente" },
    { texto: "No voy a discutir por chat.", accion: "ex_cerrar" },
  ];
}

function resolverAccionWhatsAppEx(accion) {
  normalizarEstadoNarrativaEx();
  var pendiente = obtenerEventoExPendienteActual();
  var presion = Math.max(0, Math.round(tramaEstado.exPresionLegal || 0));

  if (accion === "ex_estado") {
    if (pendiente) {
      return `Tienes un reclamo activo por ${pendiente.categoria === "belleza" ? "salon" : pendiente.categoria} de RD$${pendiente.montoPago}. Relacion actual ${Math.round(exRelacion || 0)}/100 | presion legal ${presion}.`;
    }
    return `No hay reclamo activo en este momento. Relacion ${Math.round(exRelacion || 0)}/100 | presion legal ${presion}. Si vuelves a dejar esto correr, reabre por otro frente.`;
  }

  if (accion === "ex_soporte") {
    if (!pendiente)
      return "Cuando haya un cargo nuevo te mando el detalle. Por ahora solo sigo tomando nota.";
    return `Te mande el soporte: ${pendiente.motivoPago}. Total RD$${pendiente.montoPago}. Si quieres evitar abogado, resuelvelo en este mismo chat.`;
  }

  if (accion === "ex_expediente") {
    var pruebas = Array.isArray(tramaEstado.exPruebasDetalle) ? tramaEstado.exPruebasDetalle : [];
    if (!pruebas.length) return "Expediente vacío. Un cierre crítico documentado o la consulta con el abogado añade una prueba utilizable.";
    return "EXPEDIENTE VALERIA · " + pruebas.length + " prueba(s): " + pruebas.map(function(p, i) { return (i + 1) + ". " + (p.origen || "Documento") + (p.caso ? " · " + p.caso : ""); }).join(" | ");
  }

  if (accion === "ex_defensa") {
    var costoDefensa = 450;
    if (Math.max(0, Math.round(saldo || 0)) < costoDefensa) {
      return "No tienes RD$450 para reunir documentos y consultar al abogado. Sin pruebas, la presion legal de Valeria se mantiene.";
    }
    saldo -= costoDefensa;
    if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarGastoDia === "function") {
      window.TallerApp.helpers.registrarGastoDia(costoDefensa, "eventos");
    }
    tramaEstado.exPresionLegal = Math.max(0, presion - 1);
    if (!Array.isArray(tramaEstado.exPruebasDetalle)) tramaEstado.exPruebasDetalle = [];
    if (tramaEstado.exPruebasDetalle.length < 3) tramaEstado.exPruebasDetalle.push({ id: 'abogado-' + Date.now(), origen: 'Abogado', caso: null, detalle: 'Documentación verificada por defensa.' });
    tramaEstado.exPruebas = tramaEstado.exPruebasDetalle.length;
    exRelacion = Math.max(0, Math.round(exRelacion || 0) - 1);
    reputacion = Math.min(100, Math.round((reputacion || 0) + 1));
    if (resumenDia && Array.isArray(resumenDia.ramificaciones)) resumenDia.ramificaciones.push("Defensa documental contra Valeria: -RD$450, presion legal -1.");
    if (typeof pushMensajeTelefono === "function") pushMensajeTelefono("abogado", "abogado", "Revisamos documentos del taller. La defensa queda preparada y la presion de Valeria baja un nivel.", { clave: "defensa-ex-" + Date.now(), autorNombre: "Lic. Montero" });
    if (typeof autoGuardarPartidaSilenciosa === "function") autoGuardarPartidaSilenciosa("defensa-ex");
    return "Reunimos recibos, pagos y conversaciones. La defensa queda lista: -RD$450, presion legal -1 y reputacion +1.";
  }

  if (accion === "ex_cerrar") {
    return escogerPlantillaTelefono([
      "No cierro nada. Cuando quieras resolver de verdad, escribe con dinero o pruebas.",
      "Perfecto, no peleamos. Pero el problema sigue abierto.",
      "Haz lo que quieras, pero esto no desaparece solo.",
    ]);
  }

  if (
    accion === "ex_pagar" ||
    accion === "ex_negociar" ||
    accion === "ex_rebatir" ||
    accion === "ex_ignorar"
  ) {
    var decision =
      accion === "ex_pagar"
        ? "pagar"
        : accion === "ex_negociar"
          ? "negociar"
          : accion === "ex_rebatir" ? "rebatir" : "ignorar";
    var resultado = resolverDecisionEventoEx(decision, false);
    return resultado.texto;
  }

  return generarRespuestaContacto("ex");
}

function resolverAccionWhatsAppBanco(accion) {
  var deudaActual = typeof deuda === "number" ? deuda : 0;
  var saldoActual = typeof saldo === "number" ? saldo : 0;
  var diaActual = typeof dia === "number" ? dia : 1;
  var limiteCredito =
    typeof calcularLimiteCreditoBanco === "function"
      ? calcularLimiteCreditoBanco()
      : Math.round(deudaActual) + 5000;
  var disponibleCredito =
    typeof obtenerCreditoDisponibleBanco === "function"
      ? obtenerCreditoDisponibleBanco()
      : Math.max(0, limiteCredito - deudaActual);
  var umbralMora =
    window.TallerApp &&
    window.TallerApp.config &&
    window.TallerApp.config.bancoMoraCasosUmbral
      ? Math.max(2, Math.round(window.TallerApp.config.bancoMoraCasosUmbral))
      : 4;
  var faltanMora = Math.max(
    0,
    umbralMora - Math.max(0, Math.round(bancoCasosSinPago || 0)),
  );

  if (accion === "banco_estado") {
    if (Math.max(0, Math.round(deudaActual || 0)) <= 0) {
      return (
        "Deuda saldada. Linea disponible: RD$" +
        Math.round(disponibleCredito) +
        ". Si necesitas capital, puedes solicitar credito sin presion de mora activa."
      );
    }
    var mora =
      typeof calcularMoraBancoPendiente === "function"
        ? calcularMoraBancoPendiente(deudaActual, diaActual)
        : 0;
    var cuota =
      typeof calcularCuotaBancoCierre === "function"
        ? calcularCuotaBancoCierre(deudaActual, diaActual)
        : Math.round(deudaActual * 0.03);
    return (
      "Deuda actual: RD$" +
      Math.round(deudaActual) +
      ". Limite de credito: RD$" +
      Math.round(limiteCredito) +
      ". Disponible: RD$" +
      Math.round(disponibleCredito) +
      ". Cuota sugerida: RD$" +
      Math.round(cuota) +
      ". Posible mora: RD$" +
      Math.round(mora) +
      ". Faltan " +
      faltanMora +
      " caso(s) sin pago para recargo por flujo."
    );
  }
  if (accion === "banco_pagar_cuota") {
    if (Math.max(0, Math.round(deudaActual || 0)) <= 0) {
      return (
        "Tu deuda ya esta saldada. Linea disponible: RD$" +
        Math.round(disponibleCredito) +
        "."
      );
    }
    var cuotaPago =
      typeof calcularCuotaBancoCierre === "function"
        ? calcularCuotaBancoCierre(deudaActual, diaActual)
        : Math.round(deudaActual * 0.03);
    if (saldoActual < cuotaPago) {
      return (
        "Fondos insuficientes para pagar la cuota de RD$" +
        Math.round(cuotaPago) +
        ". Caja actual: RD$" +
        Math.round(saldoActual) +
        "."
      );
    }
    if (typeof deuda !== "undefined") {
      saldo = Math.max(0, saldoActual - cuotaPago);
      deuda = Math.max(0, deudaActual - cuotaPago);
      if (typeof registrarPagoBanco === "function")
        registrarPagoBanco(cuotaPago);
      if (deuda <= 0) {
        bancoCasosSinPago = 0;
        bancoMorasAplicadas = 0;
        bancoCreditoUsado = 0;
      }
      if (
        window.TallerApp &&
        window.TallerApp.helpers &&
        typeof window.TallerApp.helpers.registrarGastoDia === "function"
      ) {
        window.TallerApp.helpers.registrarGastoDia(cuotaPago, "banco");
      }
      if (typeof actualizarUI === "function") actualizarUI();
      if (typeof actualizarIndicadoresBancoUI === "function") actualizarIndicadoresBancoUI();
      return (
        "Pago de RD$" +
        Math.round(cuotaPago) +
        " procesado. Nueva deuda: RD$" +
        Math.round(deuda) +
        ". Gracias por su puntualidad."
      );
    }
    return "No se pudo procesar el pago en este momento.";
  }
  if (accion === "banco_prestamo") {
    var monto = Math.min(
      Math.max(500, Math.round(reputacion * 45)),
      Math.round(disponibleCredito),
    );
    if (disponibleCredito <= 0)
      return "Lo sentimos, ya alcanzo su limite de credito. Debe amortizar deuda antes de tomar otro prestamo.";
    if (typeof deuda !== "undefined" && typeof saldo !== "undefined") {
      var interes =
        window.TallerApp &&
        window.TallerApp.config &&
        window.TallerApp.config.bancoInteresPrestamoRapido
          ? Number(window.TallerApp.config.bancoInteresPrestamoRapido)
          : 0.12;
      saldo += monto;
      deuda += Math.round(monto * (1 + interes));
      if (
        window.TallerApp &&
        window.TallerApp.helpers &&
        typeof window.TallerApp.helpers.registrarIngresoDia === "function"
      ) {
        window.TallerApp.helpers.registrarIngresoDia(monto, "prestamos");
      }
      if (typeof actualizarUI === "function") actualizarUI();
      var disponibleRestante =
        typeof obtenerCreditoDisponibleBanco === "function"
          ? Math.round(Math.max(0, obtenerCreditoDisponibleBanco()))
          : Math.round(Math.max(0, limiteCredito - deuda));
      return (
        "Prestamo de RD$" +
        monto +
        " acreditado. Deuda actualizada a RD$" +
        Math.round(deuda) +
        " (interes " +
        Math.round(interes * 100) +
        "%). Disponible restante: RD$" +
        disponibleRestante +
        "."
      );
    }
    return "No se pudo procesar el prestamo ahora.";
  }
  return "Gracias por contactar Banco Confianza. En que le podemos ayudar?";
}

function publicarResenaCliente(rep) {
  if (TELEFONO_SOLO_HISTORIAS) return;
  if (!rep) return;
  var estrellas, comentario;
  var nombre = rep.personaNombre || rep.clienteNombre || "Cliente";
  var vehiculo = rep.vehiculo || "vehiculo";
  var nivel = String(rep.nivelResultado || "").toLowerCase();
  var esVip = !!(
    rep.esVIP ||
    (rep.idCaso && String(rep.idCaso).includes("VIP"))
  );

  if (nivel === "critico") {
    estrellas = esVip ? "⭐⭐⭐⭐⭐" : "⭐⭐⭐⭐";
    var elogios = [
      "Excelente trabajo, el auto quedo perfecto.",
      "Rapido, limpio y justo en precio. Vuelvo sin dudas.",
      "Me explico todo. Confianza total.",
      "El mejor taller del barrio. Lo recomiendo.",
    ];
    comentario = elogios[Math.floor(Math.random() * elogios.length)];
  } else if (nivel === "parcial") {
    estrellas = "⭐⭐⭐";
    var normales = [
      "Resolvio el problema principal pero quedo un ruido raro.",
      "Bien en general, pero tardo mas de lo prometido.",
      "Precio razonable. Podria mejorar la comunicacion.",
      "El carro corre mejor, aunque espere mucho en la cola.",
    ];
    comentario = normales[Math.floor(Math.random() * normales.length)];
  } else {
    estrellas = "⭐";
    var malos = [
      "Peor experiencia del ano. El auto salio peor que entro.",
      "Me cobraron y el problema sigue. Voy a denunciar.",
      "No vuelvo jamas. Da pena.",
      "Esto no es un taller, es un casino.",
    ];
    comentario = malos[Math.floor(Math.random() * malos.length)];
  }
  var texto =
    nombre + " | " + vehiculo + " | " + estrellas + " — " + comentario;
  pushMensajeTelefono("resenas", "resenas", texto, {
    clave: "resena-" + (rep.idCaso || String(Date.now())),
  });
}

function obtenerOpcionesRespuestaTelefono(contactoId) {
  var opcionesNarrativa = obtenerOpcionesRespuestaNarrativaTelefono(contactoId);
  if (opcionesNarrativa.length) return opcionesNarrativa;

  var bloqueoGlobal = obtenerConversacionNarrativaPendiente("");
  if (bloqueoGlobal && bloqueoGlobal.contactoId !== contactoId) return [];

  var deudaBancoActual = Math.max(0, Math.round(deuda || 0));
  if (contactoId === "proveedor") {
    var reqMaquina = typeof requisitosMejora === "function"
      ? requisitosMejora("maquina")
      : { costo: 4200, nivelMin: 4, repMin: 68, tallerMin: 3 };
    var tiendaTac = (ECONOMY_DATA && ECONOMY_DATA.tiendaTactica) || {};
    var bateriaCfg = tiendaTac.bateria || { costoBase: 600, costoPorNivel: 250, max: 3 };
    var nivelBateria = Math.max(0, Math.round(Number((mejorasTacticas && mejorasTacticas.bateria) || 0)));
    var maxBateria = typeof obtenerMaxBateriaDinamica === "function"
      ? obtenerMaxBateriaDinamica()
      : bateriaCfg.max;
    var costoBateria = bateriaCfg.costoBase + nivelBateria * bateriaCfg.costoPorNivel;
    var progresoActual = typeof obtenerProgresoOperativoActual === "function"
      ? obtenerProgresoOperativoActual()
      : Math.max(1, Math.round(nivelJugador || 1));
    var maquinaBloqueada = progresoActual < reqMaquina.nivelMin || reputacion < reqMaquina.repMin || tallerNivel < reqMaquina.tallerMin;
    return aplicarEstadoOpcionesTelefono(contactoId, [
      {
        texto: mejoras && mejoras.maquinaDiagnosis
          ? "Maquina DX instalada"
          : "Comprar Maquina DX | RD$" + reqMaquina.costo,
        accion: "proveedor_maquina",
        bloqueada: !!(mejoras && mejoras.maquinaDiagnosis) || maquinaBloqueada || saldo < reqMaquina.costo,
        motivoBloqueo: mejoras && mejoras.maquinaDiagnosis
          ? "Ya instalada"
          : "Requiere Progreso " + reqMaquina.nivelMin + ", Reputacion " + reqMaquina.repMin + " y Taller " + reqMaquina.tallerMin
      },
      {
        texto: "Comprar Estabilizador " + nivelBateria + "/" + maxBateria + " | RD$" + costoBateria,
        accion: "proveedor_estabilizador",
        bloqueada: nivelBateria >= maxBateria || saldo < costoBateria,
        motivoBloqueo: nivelBateria >= maxBateria ? "Nivel maximo instalado" : "Caja insuficiente"
      },
      { texto: "Explicame para que sirven", accion: "proveedor_info" }
    ], false);
  }
  var mapa = {
    autofix: [
      { texto: "¿Cuál es su oferta real?", accion: "autofix_oferta" },
      { texto: "El barrio decide por calidad, no por anuncios.", accion: "autofix_reto" },
      { texto: "Ver pulso competitivo.", accion: "autofix_estado" }
    ],
    banco: deudaBancoActual <= 0
      ? [
          { texto: "Linea disponible.", accion: "banco_estado" },
          { texto: "Solicitar credito.", accion: "banco_prestamo" },
        ]
      : [
          { texto: "Estado de mi cuenta.", accion: "banco_estado" },
          { texto: "Pagar cuota de hoy.", accion: "banco_pagar_cuota" },
          { texto: "Necesito un prestamo rapido.", accion: "banco_prestamo" },
        ],
    resenas: [{ texto: "Ver resumen de reputacion.", accion: "normal" }],
  };

  if (esContactoCasoCliente(contactoId)) {
    var clienteEnChat = obtenerClienteActivoPorContacto(contactoId);
    if (!clienteEnChat) return [];
    return aplicarEstadoOpcionesTelefono(
      contactoId,
      construirOpcionesDinamicasCasoCliente(clienteEnChat, contactoId),
      false,
    );
  }

  if (contactoId === "ex") {
    return aplicarEstadoOpcionesTelefono(
      contactoId,
      construirOpcionesExWhatsApp(),
      false,
    );
  }

  if (mapa[contactoId]) {
    return aplicarEstadoOpcionesTelefono(
      contactoId,
      mapa[contactoId].map(function (item) {
        if (typeof item === "object" && item !== null) return item;
        return { texto: item, accion: "normal" };
      }),
      true,
    );
  }

  if (typeof contactoId === "string" && contactoId.indexOf("mec_") === 0) {
    var mec = obtenerMecanicoPorContacto(contactoId);
    return aplicarEstadoOpcionesTelefono(
      contactoId,
      construirOpcionesMecanicoWhatsApp(mec),
      false,
    );
  }

  return [];
}

function renderizarOpcionesRespuestaTelefono(contactoId) {
  var wrap = document.getElementById("tel-reply-options");
  if (!wrap) return;
  if (!contactoId) {
    wrap.innerHTML =
      '<div class="tel-empty">Selecciona un contacto para ver respuestas.</div>';
    return;
  }

  var opciones = obtenerOpcionesRespuestaTelefono(contactoId);
  if (!opciones.length) {
    var pendiente = obtenerConversacionNarrativaPendiente("");
    if (pendiente && pendiente.contactoId !== contactoId) {
      wrap.innerHTML =
        '<button class="btn tel-reply-btn" type="button" onclick="enfocarConversacionNarrativaPendiente()">Abrir historia pendiente en ' +
        escaparTextoTelefono(
          obtenerContactoNombreTelefono(pendiente.contactoId),
        ) +
        "</button>";
      return;
    }
    wrap.innerHTML =
      '<button class="btn tel-reply-btn" type="button" disabled>Sin acciones contextuales disponibles en este chat</button>';
    return;
  }
  var grupos = { solicitud: [], caso: [], gestion: [], charla: [] };
  opciones.forEach(function (opcion) {
    var accion = String(opcion.accion || "");
    var grupo = /aprobar_|negar_|cubrir_/.test(accion) ? "solicitud" :
      (accion === "mec_estado" || /caso|piezas/.test(accion)) ? "caso" :
      (/calidad|presion|descanso|turnos|bono/.test(accion) ? "gestion" : "charla");
    grupos[grupo].push(opcion);
  });
  var titulos = { solicitud: "Solicitud pendiente", caso: "Caso y estado", gestion: "Gestión del equipo", charla: "Conversación" };
  wrap.innerHTML = Object.keys(grupos).filter(function (k) { return grupos[k].length; }).map(function (grupo, indice) {
    return '<details class="tel-option-group"' + (indice === 0 ? ' open' : '') + '><summary>' + titulos[grupo] + '<span>' + grupos[grupo].length + '</span></summary><div class="tel-option-group-body">' + grupos[grupo].map(function (opcion) {
      var textoSeguro = escaparTextoTelefono(opcion.texto);
      var accionSegura = escaparTextoTelefono(opcion.accion || "normal");
      var claveSegura = escaparTextoTelefono(opcion.claveOpcion || "");
      var bloqueada = !!(opcion && (opcion.bloqueada || opcion.disabled));
      var motivo = escaparTextoTelefono(
        opcion.motivoBloqueo || opcion.motivo || "No disponible ahora",
      );
      if (bloqueada) {
        return (
          '<button class="btn tel-reply-btn is-locked" type="button" disabled title="' +
          motivo +
          '"><span class="tel-reply-main">' +
          textoSeguro +
          '</span><span class="tel-reply-lock-note">' +
          motivo +
          "</span></button>"
        );
      }
      return (
        '<button class="btn tel-reply-btn" data-msg="' +
        textoSeguro +
        '" data-action="' +
        accionSegura +
        '" data-option-key="' +
        claveSegura +
        '" onclick="enviarMensajeTelefono(this.dataset.msg, this.dataset.action, this.dataset.optionKey)">' +
        textoSeguro +
        "</button>"
      );
    }).join("") + '</div></details>';
  }).join("");
}

function obtenerOpcionRespuestaActivaTelefono(contactoId, accion, claveOpcion) {
  var accionTxt = String(accion || "").trim();
  var claveTxt = String(claveOpcion || "").trim();
  if (!contactoId || (!accionTxt && !claveTxt)) return null;
  var opciones = obtenerOpcionesRespuestaTelefono(contactoId);
  if (!Array.isArray(opciones) || !opciones.length) return null;
  return (
    opciones.find(function (opcion) {
      if (!opcion || opcion.bloqueada || opcion.disabled) return false;
      if (claveTxt) return String(opcion.claveOpcion || "").trim() === claveTxt;
      return String(opcion.accion || "").trim() === accionTxt;
    }) || null
  );
}

function enviarMensajeTelefono(
  textoForzado,
  accionForzada,
  claveOpcionForzada,
) {
  if (!telefonoContactoActivo) return;
  var bloqueoNarrativo = obtenerConversacionNarrativaPendiente("");
  if (
    bloqueoNarrativo &&
    bloqueoNarrativo.contactoId !== telefonoContactoActivo
  ) {
    if (typeof mostrarFeedbackGameplay === "function") {
      mostrarFeedbackGameplay(
        "Historia pendiente: responde primero en " +
          obtenerContactoNombreTelefono(bloqueoNarrativo.contactoId) +
          ".",
        "warn",
      );
    }
    enfocarConversacionNarrativaPendiente(bloqueoNarrativo);
    return;
  }

  var input = document.getElementById("tel-input");
  var accionValidada = null;
  var accionTexto =
    typeof accionForzada === "string" ? accionForzada.trim() : "";
  var claveOpcionTexto =
    typeof claveOpcionForzada === "string" ? claveOpcionForzada.trim() : "";
  var texto = typeof textoForzado === "string" ? textoForzado.trim() : "";
  if (!texto && input) texto = input.value.trim();

  if (accionTexto) {
    accionValidada = obtenerOpcionRespuestaActivaTelefono(
      telefonoContactoActivo,
      accionTexto,
      claveOpcionTexto,
    );
    if (!accionValidada) {
      if (typeof mostrarFeedbackGameplay === "function") {
        mostrarFeedbackGameplay(
          "Esa respuesta ya no esta disponible para este chat.",
          "warn",
        );
      }
      renderizarOpcionesRespuestaTelefono(telefonoContactoActivo);
      return;
    }
    texto = accionValidada.texto;
  } else if (esContactoCasoCliente(telefonoContactoActivo)) {
    if (typeof mostrarFeedbackGameplay === "function") {
      mostrarFeedbackGameplay(
        "Usa una de las respuestas disponibles del chat.",
        "warn",
      );
    }
    renderizarOpcionesRespuestaTelefono(telefonoContactoActivo);
    return;
  }

  if (!texto) return;

  if (!telefonoMensajes[telefonoContactoActivo])
    telefonoMensajes[telefonoContactoActivo] = [];

  var hora = obtenerHoraDelDiaTexto();

  telefonoMensajes[telefonoContactoActivo].push({
    autor: "jugador",
    texto: texto,
    hora: hora,
    leido: true,
  });
  if (input) input.value = "";
  renderizarMensajesTelefono(telefonoContactoActivo);

  if (
    procesarRespuestaNarrativaTelefono(
      telefonoContactoActivo,
      accionForzada || "story_ok",
      hora,
    )
  ) {
    renderizarMensajesTelefono(telefonoContactoActivo);
    renderizarContactosTelefono();
    renderizarOpcionesRespuestaTelefono(telefonoContactoActivo);
    if (typeof actualizarUI === "function") actualizarUI();
    return;
  }

  if (accionValidada && !esContactoCasoCliente(telefonoContactoActivo)) {
    marcarOpcionUsadaTelefono(
      telefonoContactoActivo,
      accionValidada.claveOpcion || claveOpcionTexto,
    );
  }

  if (esContactoCasoCliente(telefonoContactoActivo)) {
    var contactoCaso = telefonoContactoActivo;
    const respuestaCliente = resolverAccionWhatsAppCliente(
      (accionValidada && accionValidada.accion) || accionTexto || "normal",
      contactoCaso,
    );
    if (respuestaCliente) {
      telefonoMensajes[contactoCaso].push({
        autor: contactoCaso,
        texto: contextualizarRespuestaClienteTelefono(
          respuestaCliente,
          contactoCaso,
        ),
        hora: hora,
        leido: true,
      });
      renderizarMensajesTelefono(contactoCaso);
      renderizarContactosTelefono();
      renderizarOpcionesRespuestaTelefono(contactoCaso);
    }
    return;
  }

  if (
    typeof telefonoContactoActivo === "string" &&
    telefonoContactoActivo.indexOf("mec_") === 0
  ) {
    var contactoMec = telefonoContactoActivo;
    var respuestaMec = null;
    try {
      respuestaMec = resolverAccionWhatsAppMecanico(
        accionForzada || "mec_estado",
        contactoMec,
      );
    } catch (err) {
      console.warn("WhatsApp mecanico fallo al resolver accion:", err);
      respuestaMec =
        "No pude procesar ese mensaje ahora. Reintenta en unos segundos.";
    }
    if (respuestaMec) {
      telefonoMensajes[contactoMec].push({
        autor: contactoMec,
        texto: respuestaMec,
        hora: hora,
        leido: true,
      });
      renderizarMensajesTelefono(contactoMec);
      renderizarContactosTelefono();
      renderizarOpcionesRespuestaTelefono(contactoMec);
      if (typeof actualizarUI === "function") actualizarUI();
    }
    return;
  }

  if (telefonoContactoActivo === "ex") {
    var respuestaEx = resolverAccionWhatsAppEx(
      (accionValidada && accionValidada.accion) || accionForzada || "ex_estado",
    );
    if (respuestaEx) {
      telefonoMensajes["ex"].push({
        autor: "ex",
        texto: respuestaEx,
        hora: hora,
        leido: true,
      });
      renderizarMensajesTelefono("ex");
      renderizarContactosTelefono();
      renderizarOpcionesRespuestaTelefono("ex");
      if (typeof actualizarUI === "function") actualizarUI();
    }
    return;
  }

  if (telefonoContactoActivo === "proveedor") {
    var accionProveedor = (accionValidada && accionValidada.accion) || accionTexto || "proveedor_info";
    var saldoAntesProveedor = saldo;
    var respuestaProveedor = "La Maquina DX mejora el nivel OBD y la precision del diagnostico. El Estabilizador refuerza las recargas y la estabilidad operativa.";
    if (accionProveedor === "proveedor_maquina" && typeof comprarMejora === "function") {
      comprarMejora("maquina");
      respuestaProveedor = saldo < saldoAntesProveedor
        ? "Listo. Maquina DX instalada y registrada en Oficina. El proximo diagnostico mostrara el nivel OBD adicional."
        : "No pude completar la instalacion. Revisa caja, progreso, reputacion y nivel del taller.";
    } else if (accionProveedor === "proveedor_estabilizador" && typeof comprarMejoraTactica === "function") {
      comprarMejoraTactica("bateria");
      respuestaProveedor = saldo < saldoAntesProveedor
        ? "Estabilizador instalado. Ferreteria, Oficina, Exterior y HUD ya comparten el nuevo saldo."
        : "No pude completar la compra. Revisa caja y nivel actual del estabilizador.";
    }
    pushMensajeTelefono("proveedor", "proveedor", respuestaProveedor, {
      clave: "respuesta-proveedor-" + Date.now()
    });
    renderizarMensajesTelefono("proveedor");
    renderizarContactosTelefono();
    renderizarOpcionesRespuestaTelefono("proveedor");
    if (typeof actualizarUI === "function") actualizarUI();
    return;
  }

  if (telefonoContactoActivo === "autofix") {
    var estadoAutoFix = typeof asegurarCompetenciaBarrioEstado === "function" ? asegurarCompetenciaBarrioEstado().rivales.autofix : null;
    var accionAutoFix = (accionValidada && accionValidada.accion) || accionForzada || "autofix_estado";
    var respuestaAutoFix = accionAutoFix === "autofix_oferta"
      ? "Paquetes de apertura, diagnóstico digital y entrega rápida. Lo que el cliente quiere es certeza, no discursos."
      : accionAutoFix === "autofix_reto"
        ? "Entonces demuéstralo en cada cierre. Nosotros ya estamos ganando la conversación de la calle."
        : "Pulso actual: presión " + Math.round((estadoAutoFix && estadoAutoFix.presion) || 0) + "/30. Cada cierre crítico tuyo nos frena; cada fallo nos da aire.";
    telefonoMensajes["autofix"].push({ autor: "autofix", texto: respuestaAutoFix, hora: hora, leido: true });
    renderizarMensajesTelefono("autofix");
    renderizarContactosTelefono();
    renderizarOpcionesRespuestaTelefono("autofix");
    return;
  }

  if (telefonoContactoActivo === "banco") {
    var respuestaBanco =
      typeof resolverAccionWhatsAppBanco === "function"
        ? resolverAccionWhatsAppBanco(accionForzada || "banco_estado")
        : "En que le podemos ayudar?";
    telefonoMensajes["banco"].push({
      autor: "banco",
      texto: respuestaBanco,
      hora: hora,
      leido: true,
    });
    renderizarMensajesTelefono("banco");
    renderizarContactosTelefono();
    renderizarOpcionesRespuestaTelefono("banco");
    if (typeof actualizarUI === "function") actualizarUI();
    return;
  }

  if (telefonoContactoActivo === "resenas") {
    var totalResenas = (telefonoMensajes["resenas"] || []).filter(function (m) {
      return m.autor === "resenas" && m.texto.includes("\u2b50");
    }).length;
    var respReseñas =
      totalResenas > 0
        ? "Total de resenas recibidas: " +
          totalResenas +
          ". Reputacion actual: " +
          (typeof reputacion !== "undefined" ? reputacion : 0) +
          "/100."
        : "Aun no hay resenas. Cada caso cerrado genera una valoracion automatica.";
    telefonoMensajes["resenas"].push({
      autor: "resenas",
      texto: respReseñas,
      hora: hora,
      leido: true,
    });
    renderizarMensajesTelefono("resenas");
    return;
  }

  // Respuesta automatica
  var cid = telefonoContactoActivo;
  setTimeout(
    function () {
      var respuesta = generarRespuestaContacto(cid);
      if (!respuesta) return;
      if (!telefonoMensajes[cid]) telefonoMensajes[cid] = [];
      telefonoMensajes[cid].push({
        autor: cid,
        texto: respuesta,
        hora: hora,
        leido: cid === telefonoContactoActivo,
      });
      if (cid === telefonoContactoActivo) renderizarMensajesTelefono(cid);
      renderizarContactosTelefono();
    },
    800 + Math.random() * 1400,
  );
}

function resolverAccionWhatsAppCliente(accion, contactoId) {
  var clienteEnChat = obtenerClienteActivoPorContacto(contactoId);
  if (!clienteEnChat) return "Este caso no tiene novedades nuevas por hoy.";
  var contextoCaso = obtenerContextoCasoChat(contactoId, clienteEnChat);
  var idCasoChat = contextoCaso.idCaso;
  var repCasoChat = contextoCaso.repCaso;
  var estadoCasoChat = contextoCaso.estado;
  if (repCasoChat) {
    clienteEnChat.diagnosticado = true;
    clienteEnChat.aprobacionCliente = true;
  }
  var negociableActivo = !!(
    clienteActual &&
    idCasoChat &&
    clienteActual.idCaso === idCasoChat &&
    !repCasoChat &&
    estadoCasoChat !== "cobrado_retirado" &&
    estadoCasoChat !== "pendiente_revision"
  );
  var estado = obtenerEstadoWhatsAppCliente(clienteEnChat);
  if (!estado) return "No pude abrir el estado de este caso.";
  if (estado.turnosDia >= LIMITE_CHAT_CLIENTE_DIA) {
    estado.bloqueadoDia = true;
    return "Por hoy no hay mas novedades. Te escribo manana con avances.";
  }

  if (accion === "cliente_espera_dx") {
    estado.accionesDia[accion] = true;
    estado.turnosDia += 1;
    return escogerPlantillaTelefono([
      "Perfecto, quedo pendiente del diagnostico.",
      "Entendido, espero tu dictamen final hoy.",
      "Dale, quedo atento a tu reporte tecnico.",
      "Ok, pero por favor no lo alargues mucho que necesito ese carro operativo.",
    ]);
  }

  if (accion === "cliente_pedir_contexto") {
    estado.accionesDia[accion] = true;
    estado.turnosDia += 1;
    return escogerPlantillaTelefono([
      "Cuando arranco en frio vibra, y en carretera se siente mas fuerte.",
      "Empezo esta semana, sobre todo en tapones largos.",
      "Lo senti despues de caer en un hoyo grande cerca de la avenida.",
      "En subidas largas pierde fuerza y luego recupera de golpe.",
      "Con aire encendido y en semaforo se vuelve inestable.",
    ]);
  }

  var idxMecanicoDx = obtenerIndiceMecanicoDesdeAccionCliente(accion);
  if (idxMecanicoDx !== null) {
    estado.accionesDia[accion] = true;
    estado.turnosDia += 1;
    if (repCasoChat) {
      return "Ese caso ya salio del area de diagnostico. Revisa su estado actual en el taller.";
    }
    if (!activarCasoDesdeChatCliente(contactoId, clienteEnChat)) {
      return "No pude subir este caso al expediente tecnico ahora mismo. Revisa la cola del taller.";
    }
    var mecanicoDx =
      Array.isArray(mecanicos) && mecanicos[idxMecanicoDx]
        ? mecanicos[idxMecanicoDx]
        : null;
    if (!mecanicoDx || typeof diagnosticarConMecanico !== "function") {
      return "No hay mecanico disponible para tomar ese diagnostico ahora mismo.";
    }
    var asignadoOk = diagnosticarConMecanico(idxMecanicoDx);
    if (!asignadoOk) {
      return `${mecanicoDx.nombre} no pudo tomar ese caso ahora mismo. Prueba con otro mecanico o espera enfriamiento.`;
    }
    return escogerPlantillaTelefono([
      `Perfecto, quedo atento al diagnostico de ${mecanicoDx.nombre}.`,
      `Dale, revisalo con ${mecanicoDx.nombre} y me escribes apenas tengan el reporte.`,
      `Ok, espero el dictamen de ${mecanicoDx.nombre} antes de aprobar el trabajo.`,
    ]);
  }

  if (
    accion === "cliente_post_cierre" ||
    estadoCasoChat === "cobrado_retirado"
  ) {
    var clavePostCierre = "cliente_post_cierre";
    if (estado.accionesDia[clavePostCierre]) {
      return "Caso ya cerrado. No hay novedades nuevas por hoy en este chat.";
    }
    estado.accionesDia[clavePostCierre] = true;
    estado.turnosDia += 1;
    return escogerPlantillaTelefono([
      "Todo correcto, gracias por el servicio. Nos vemos en el proximo mantenimiento.",
      "Caso cerrado. Te escribo cuando me toque el proximo chequeo.",
    ]);
  }

  if (
    accion === "cliente_post_fallo" ||
    estadoCasoChat === "pendiente_revision"
  ) {
    var clavePostFallo = "cliente_post_fallo";
    if (estado.accionesDia[clavePostFallo]) {
      return "Caso observado y pausado por hoy. Si abres nueva orden, retomamos por ahi.";
    }
    estado.accionesDia[clavePostFallo] = true;
    estado.turnosDia += 1;
    return escogerPlantillaTelefono([
      "Entiendo. Dejemos este caso cerrado por hoy y lo revisamos luego.",
      "Por ahora no sigo con este trabajo. Si abres nueva orden, me avisas.",
    ]);
  }

  if (
    !clienteEnChat.diagnosticado &&
    !clienteEnChat.aprobacionCliente &&
    !repCasoChat
  ) {
    estado.turnosDia += 1;
    return escogerPlantillaTelefono([
      "Avisa cuando tengas el diagnostico y precio final.",
      "Sin diagnostico no puedo aprobar nada todavia.",
    ]);
  }

  if (accion === "cliente_pedir_motivo_rechazo") {
    estado.accionesDia[accion] = true;
    estado.turnosDia += 1;
    var motivo = String(clienteEnChat.motivoRechazoWhatsApp || "").trim();
    if (motivo) {
      return `No apruebo por esto: ${motivo} Si ajustas esa parte, lo reconsidero hoy.`;
    }
    return escogerPlantillaTelefono([
      "Todavia no me cierra la propuesta completa. Si ajustas condiciones, lo reviso.",
      "Necesito mejor balance entre costo, tiempo y garantia para aprobar.",
    ]);
  }

  if (accion === "cliente_descuento" && !clienteEnChat.negociado) {
    clienteEnChat.pago = Math.max(300, Math.round(clienteEnChat.pago * 0.92));
  }

  if (
    (accion === "cliente_cotizar" ||
      accion === "cliente_descuento" ||
      accion === "cliente_confirmar") &&
    !clienteEnChat.negociado
  ) {
    if (!negociableActivo) {
      estado.accionesDia[accion] = true;
      estado.turnosDia += 1;
      return "Ese caso ya no esta en etapa de negociacion activa. Revisa el estado en Taller/WhatsApp.";
    }
    negociarCliente();
    estado.accionesDia[accion] = true;
    estado.turnosDia += 1;
    if (!clienteActual || clienteEnChat.casoCerradoPorRechazo) {
      return escogerPlantillaTelefono([
        "No acepto la cotizacion. Retiro el vehiculo por ahora.",
        "Asi no me conviene; me llevo el carro y luego vemos.",
        "Gracias, pero no cierro ese trabajo hoy. Me retiro.",
      ]);
    }
    if (clienteEnChat.aprobacionCliente) {
      return escogerPlantillaTelefono([
        "Dale, aprobado. Procede con la reparacion.",
        "Ok, autorizo el trabajo. Mete mano al vehiculo.",
        "Aprobado por aqui. Deja eso listo hoy.",
      ]);
    }
    var motivoPendiente = String(
      clienteEnChat.motivoRechazoWhatsApp || "",
    ).trim();
    if (motivoPendiente) {
      return `Aun no apruebo. Motivo: ${motivoPendiente} Si mejoras esa parte, podemos cerrar.`;
    }
    return escogerPlantillaTelefono([
      "No me convence ese precio. Si ajustas, te confirmo.",
      "Necesito un mejor numero para aprobar hoy.",
      "Asi no cierro. Tirame otra opcion y vemos.",
    ]);
  }

  if (accion === "cliente_aceptar_condiciones") {
    if (!negociableActivo) {
      estado.accionesDia[accion] = true;
      estado.turnosDia += 1;
      return "Ese caso ya no acepta contraofertas. Debe gestionarse segun su estado actual.";
    }
    const ok = aceptarCondicionClienteWhatsApp();
    estado.accionesDia[accion] = true;
    estado.turnosDia += 1;
    if (ok)
      return escogerPlantillaTelefono([
        "Listo, con ese ajuste si autorizo. Mete mano al vehiculo.",
        "Con ese trato si te doy luz verde.",
        "Cerrado. Dale para adelante con la reparacion.",
      ]);
    return escogerPlantillaTelefono([
      "Todavia no puedo aprobar asi.",
      "Aun no me da para cerrar ese monto.",
    ]);
  }

  if (accion === "cliente_cobrar_retiro") {
    estado.accionesDia[accion] = true;
    estado.turnosDia += 1;
    if (typeof procesarCobroReparacionPorWhatsApp !== "function") {
      return "No pude cerrar el cobro ahora. Intenta de nuevo en unos minutos.";
    }
    var idCasoCobro =
      clienteEnChat.idCaso || obtenerIdCasoDesdeContacto(contactoId);
    var cobro = procesarCobroReparacionPorWhatsApp(idCasoCobro);
    if (!cobro || !cobro.ok) {
      return cobro && cobro.mensaje
        ? cobro.mensaje
        : "No se pudo cerrar el cobro de este caso.";
    }
    return escogerPlantillaTelefono([
      "Pago confirmado. Gracias, retiro el vehiculo ahora mismo.",
      "Listo, te transferi. Paso a buscar el carro.",
      "Quedamos saldados. Retiro en este momento.",
    ]);
  }

  if (
    clienteEnChat.aprobacionCliente ||
    accion === "cliente_estado_reparacion"
  ) {
    estado.accionesDia[accion] = true;
    estado.turnosDia += 1;
    var idCasoEstado =
      clienteEnChat.idCaso || obtenerIdCasoDesdeContacto(contactoId);
    var repEstado =
      Array.isArray(reparacionesActivas) && idCasoEstado
        ? reparacionesActivas.find(function (r) {
            return r && r.idCaso === idCasoEstado;
          })
        : null;
    if (repEstado && repEstado.listoParaCobro && !repEstado.resultadoVisible) {
      return "Tu vehiculo ya esta listo en taller. Solo falta revisar resultado y te cierro cobro por aqui.";
    }
    if (repEstado && repEstado.listoParaCobro && repEstado.resultadoVisible) {
      return "Vi el resultado. Estoy listo para confirmar pago y retiro por este chat.";
    }
    return escogerPlantillaTelefono([
      "Perfecto. Quedo atento a los avances del taller.",
      "Gracias por el update. Avisame apenas este listo.",
      "Recibido. Espero el cierre del trabajo hoy.",
    ]);
  }

  estado.turnosDia += 1;
  return "Sin acuerdo aun. Confirmame condiciones para aprobar.";
}

function generarRespuestaContacto(contactoId) {
  var respuestas = {
    ex: [
      "No te pienso contestar.",
      "...",
      "Deja de escribirme.",
      "Pagas o demando.",
      "Ya contrate otro abogado.",
      "No se te olvide lo que hiciste.",
    ],
    abogado: [
      "Recibido. Cuando puedes adelantar el pago?",
      "El expediente avanza. Sea paciente.",
      "Necesito los documentos del taller.",
      "Eso no cambia nada legalmente.",
    ],
    proveedor: [
      "Que necesitas? Tengo motor, transmision, frenos en stock.",
      "Te puedo hacer precio si compras 3 o mas.",
      "Delivery disponible hoy.",
      "Eso lo tengo pero viene de afuera, tarda 2 dias.",
    ],
    inspector: [
      "Seguimos mirando.",
      "Todo en orden... por ahora.",
      "Un colega mio paso por tu calle esta manana.",
      "...",
    ],
  };
  var lista = respuestas[contactoId];
  if (lista) return lista[Math.floor(Math.random() * lista.length)];

  // Mecanico
  var mec = null;
  var listaMecanicos = Array.isArray(mecanicos) ? mecanicos : [];
  mec =
    listaMecanicos.find(function (m) {
      return m && "mec_" + m.nombre === contactoId;
    }) || null;
  if (mec) {
    var enPausa = (mec.enfriamientoTurnos || 0) > 0;
    var opciones = [
      "Jefe, " +
        (enPausa ? "estoy cerrando un trabajo y vuelvo" : "todo bajo control") +
        ".",
      "Ok.",
      mec.enojo > 4 ? "Esto no es justo jefe." : "Listo para el proximo caso.",
      "Entendido.",
      "Cuanto pagan ese caso?",
    ];
    return opciones[Math.floor(Math.random() * opciones.length)];
  }

  // Cliente
  if (esContactoCasoCliente(contactoId)) {
    var cOps = [
      "Y mi carro cuando esta?",
      "Ok espero.",
      "No tarden mucho por favor.",
      "Esta costando mucho eso?",
      "Mantenme al dia por aqui.",
    ];
    return cOps[Math.floor(Math.random() * cOps.length)];
  }
  return null;
}

function actualizarBadgeNavTelefono() {
  var total = 0;
  var contactosConNoLeidos = new Set();
  telefonoContactos.forEach(function (c) {
    var msgs = telefonoMensajes[c.id] || [];
    var unread = msgs.filter(function (m) {
      return !m.leido && m.autor !== "jugador";
    }).length;
    if (unread > 0) contactosConNoLeidos.add(c.id);
    total += unread;
  });
  obtenerPendientesNarrativaTelefono().forEach(function (pendiente) {
    if (
      pendiente &&
      !pendiente.resuelta &&
      pendiente.contactoId &&
      !contactosConNoLeidos.has(pendiente.contactoId)
    ) {
      total += 1;
    }
  });
  var badge = document.getElementById("tel-notif-nav");
  if (!badge) return;
  if (total > 0) {
    badge.innerText = total > 99 ? "99+" : total;
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

function obtenerConteoEstadosTallerNav() {
  var activas = Array.isArray(reparacionesActivas) ? reparacionesActivas : [];
  var entregas = Array.isArray(entregasPiezasActivas)
    ? entregasPiezasActivas
    : [];
  var diagnostico = 0;
  var delivery = 0;
  var reparando = 0;
  var listo = 0;

  activas.forEach(function (r) {
    if (!r) return;
    if (r.listoParaCobro) {
      listo += 1;
      return;
    }
    if (r.tipoTrabajo === "diagnostico") {
      diagnostico += 1;
      return;
    }
    if (r.pausadaPorPieza || r.tipoTrabajo === "pedir_piezas") {
      var entregaActiva = entregas.some(function (e) {
        return (
          e &&
          String(e.idCaso || "").trim() === String(r.idCaso || "").trim() &&
          Math.max(0, Math.round(e.etaRestante || 0)) > 0
        );
      });
      if (entregaActiva) {
        delivery += 1;
      }
      return;
    }
    reparando += 1;
  });

  return {
    diagnostico: diagnostico,
    delivery: delivery,
    reparando: reparando,
    listo: listo,
    total: diagnostico + delivery + reparando + listo,
  };
}

function actualizarBadgeNavTaller() {
  var badge = document.getElementById("taller-notif-nav");
  if (!badge) return;
  var c = obtenerConteoEstadosTallerNav();
  if (c.total > 0) {
    badge.innerText = c.total > 99 ? "99+" : String(c.total);
    badge.title = `Dx ${c.diagnostico} | Delivery ${c.delivery} | Reparando ${c.reparando} | Listo ${c.listo}`;
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
    badge.title = "";
  }
}

// Las tarjetas se renderizan con handlers HTML. Expone explícitamente el flujo
// del taller porque este archivo puede ejecutarse dentro de un scope aislado.
if (typeof window !== "undefined") {
  window.abrirCasoParaDiagnostico = abrirCasoParaDiagnostico;
  window.activarCasoDesdeLista = activarCasoDesdeLista;
  window.intentarAsignarCasoListaAMecanico = intentarAsignarCasoListaAMecanico;
  window.prepararAsignacionCasoRevision = prepararAsignacionCasoRevision;
  window.asignarCasoRevisionAMecanico = asignarCasoRevisionAMecanico;
  window.asignarCasoRevisionADueno = asignarCasoRevisionADueno;
  window.ofDxAccionTecnica = ofDxAccionTecnica;
  window.ofDxEmitirDiagnostico = ofDxEmitirDiagnostico;
  window.abrirInspeccionCliente = abrirInspeccionCliente;
  window.ejecutarPruebaMiPuesto = ejecutarPruebaMiPuesto;
  window.diagnosticarCasoMiPuesto = diagnosticarCasoMiPuesto;
  window.seleccionarHipotesisMiPuesto = seleccionarHipotesisMiPuesto;
  window.seleccionarConfianzaMiPuesto = seleccionarConfianzaMiPuesto;
  window.confirmarPresupuestoMiPuesto = confirmarPresupuestoMiPuesto;
  window.recibirSiguienteClienteTaller = recibirSiguienteClienteTaller;
  window.rechazarCasoEconomico = rechazarCasoEconomico;
  window.negociarPrecioCasoEconomico = negociarPrecioCasoEconomico;
  window.aceptarPerdidaCasoEconomico = aceptarPerdidaCasoEconomico;
}
