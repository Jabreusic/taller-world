(function () {
  "use strict";

  var MANUAL_TALLER = [
    { sintoma: "Motor tiembla en ralenti", sistema: "Encendido / combustible", prueba: "Bujias, bobinas e inyectores", pieza: "Bujia, bobina o inyector", resultado: "Chispa debil, correccion irregular o caudal fuera de rango" },
    { sintoma: "Tablero parpadea", sistema: "Electricidad", prueba: "Bateria, alternador y cableado", pieza: "Bateria, alternador o conector", resultado: "Voltaje inestable o caida de tension" },
    { sintoma: "Vibra al frenar", sistema: "Frenos", prueba: "Discos y pastillas", pieza: "Disco o pastilla", resultado: "Alabeo, desgaste desigual o espesor bajo" },
    { sintoma: "Golpe en baches", sistema: "Tren delantero", prueba: "Links, rotulas, bujes y amortiguadores", pieza: "Link, rotula o buje", resultado: "Holgura o amortiguacion deficiente" },
    { sintoma: "Pierde potencia", sistema: "Admision / combustible / escape", prueba: "MAF, presion y escaner", pieza: "MAF, bomba, filtro o catalizador", resultado: "Flujo o presion fuera de rango" },
    { sintoma: "Humo azul", sistema: "Lubricacion / motor", prueba: "Aceite y compresion", pieza: "Retenes, aros o componente interno", resultado: "Consumo de aceite o compresion desigual" },
    { sintoma: "Se calienta", sistema: "Refrigeracion", prueba: "Fluidos y bahia del motor", pieza: "Termostato, bomba o manguera", resultado: "Fuga, circulacion pobre o temperatura irregular" },
  ];

  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function obtenerTrabajoDuenoActivo() {
    return (Array.isArray(reparacionesActivas) ? reparacionesActivas : []).find(function (rep) {
      return rep && rep.esTrabajoDueno && !rep.cobroProcesado;
    }) || null;
  }

  function retoPorEspecialidad(especialidad) {
    var retos = {
      electricidad: { titulo: "Interpretar lectura de carga", pregunta: "El motor esta encendido. ¿Que lectura confirma carga normal?", opciones: ["11.2 V", "13.8 V", "16.9 V"], correcta: "13.8 V" },
      frenos: { titulo: "Ordenar servicio de frenos", pregunta: "Selecciona la secuencia segura.", opciones: ["Montar → limpiar → purgar", "Limpiar → montar → purgar", "Purgar → montar → limpiar"], correcta: "Limpiar → montar → purgar" },
      suspension: { titulo: "Confirmar tren delantero", pregunta: "¿Que debe hacerse antes de entregar?", opciones: ["Alinear y verificar torque", "Solo inflar neumaticos", "Borrar codigos OBD"], correcta: "Alinear y verificar torque" },
      transmision: { titulo: "Ajustar transmision", pregunta: "¿Que verificas antes de cerrar?", opciones: ["Nivel y temperatura del fluido", "Color de las luces", "Presion de neumaticos"], correcta: "Nivel y temperatura del fluido" },
      escape: { titulo: "Comprobar escape", pregunta: "¿Que lectura valida el cierre?", opciones: ["Fuga y contrapresion", "Torque de rueda", "Voltaje de bateria"], correcta: "Fuga y contrapresion" },
      motor: { titulo: "Confirmar montaje", pregunta: "¿Como cierras un componente critico?", opciones: ["Al tacto", "Con torque especificado", "Con el motor acelerado"], correcta: "Con torque especificado" },
      general: { titulo: "Control final", pregunta: "Selecciona el cierre profesional.", opciones: ["Montar y entregar", "Verificar pieza, torque y lectura", "Borrar evidencia"], correcta: "Verificar pieza, torque y lectura" },
    };
    return retos[especialidad] || retos.general;
  }

  function abrirManualTaller() {
    var filas = MANUAL_TALLER.map(function (item) {
      return '<article class="manual-taller-row"><strong>' + esc(item.sintoma) + '</strong><span>' + esc(item.sistema) + '</span><span>Prueba: ' + esc(item.prueba) + '</span><span>Pieza posible: ' + esc(item.pieza) + '</span><small>Busca: ' + esc(item.resultado) + '</small></article>';
    }).join("");
    var html = '<div class="manual-taller-modal"><div class="flow-case-kicker">CONSULTA TECNICA</div><h2>Manual del Taller</h2><p>Relaciona sintomas con sistemas y pruebas. El manual orienta, pero no revela la falla del caso.</p><div class="manual-taller-list">' + filas + '</div><button class="btn" type="button" onclick="cerrarModal()">Volver a la inspeccion</button></div>';
    if (typeof mostrarModalPersonalizado === "function") mostrarModalPersonalizado(html);
  }

  function construirResumenEconomicoCaso(caso) {
    var eco = typeof evaluarEconomiaCaso === "function"
      ? evaluarEconomiaCaso(caso)
      : { ingreso: Math.max(0, Math.round(caso && caso.pago || 0)), costoPiezas: 0, neto: Math.max(0, Math.round(caso && caso.pago || 0)) };
    var clase = eco.neto >= 0 ? "is-profit" : "is-loss";
    var etiqueta = eco.neto >= 0 ? "GANANCIA NETA" : "PERDIDA ESTIMADA";
    return '<div class="inspection-economy"><span>Urgencia <strong>' + esc(caso.urgencia || (caso.paciencia ? "Media" : "Alta")) + '</strong></span><span>Ingreso <strong>RD$' + eco.ingreso + '</strong></span><span>Piezas <strong>RD$' + eco.costoPiezas + '</strong></span><span class="' + clase + '">' + etiqueta + ' <strong>' + (eco.neto < 0 ? "-" : "+") + 'RD$' + Math.abs(eco.neto) + '</strong></span></div>';
  }

  function renderizarBloqueoMiPuestoDueno(rep) {
    if (!rep) return "";
    if (typeof sincronizarTiempoReparacionReal === "function") sincronizarTiempoReparacionReal(rep);
    var total = Math.max(1, Math.round(rep.segundosTotalesReal || rep.duracionRealSeg || 1));
    var restante = typeof obtenerSegundosRestantesReparacion === "function" ? obtenerSegundosRestantesReparacion(rep) : Math.max(0, Math.round(rep.segundosPendientesReal || 0));
    var progreso = rep.listoParaCobro ? 100 : Math.max(0, Math.min(100, Math.round(((total - restante) / total) * 100)));
    var estado = rep.pausadaManualDueno ? "Esperando tu intervencion" : rep.pausadaPorPieza ? "Esperando piezas" : rep.listoParaCobro ? "Listo para resultado" : "Reparando";
    return '<section class="owner-workbench-lock"><div class="flow-case-kicker">MI PUESTO OCUPADO</div><h3>Estas trabajando personalmente en ' + esc(rep.idCaso) + '</h3><p>' + esc(rep.vehiculo || "Vehiculo") + ' · ' + esc(rep.clienteNombre || "Cliente") + '</p><div class="owner-work-status"><strong>' + esc(estado) + '</strong><span>' + progreso + '% · ETA ' + (typeof formatearDuracionSegundos === "function" ? formatearDuracionSegundos(restante) : restante + " s") + '</span></div><div class="repair-progress"><div class="repair-progress-fill" style="width:' + progreso + '%"></div></div><p class="inspection-live-status">Mi puesto queda bloqueado hasta terminar. Oficina, Exterior, Mapa y Telefono siguen disponibles; tus mecanicos pueden trabajar en paralelo si hay bahia.</p><div class="owner-work-actions">' + (rep.pausadaManualDueno ? '<button class="btn btn-primary" type="button" onclick="abrirMinijuegoReparacionDueno()">Continuar reparacion</button>' : '') + (rep.listoParaCobro ? '<button class="btn btn-primary" type="button" onclick="seleccionarPuestoTaller(\'trabajos\')">Ver resultado en Trabajos</button>' : '') + '</div></section>';
  }

  function asignarReparacionAlDueno(idCaso) {
    var clave = String(idCaso || "").trim();
    if (!clienteActual || String(clienteActual.idCaso || "").trim() !== clave) {
      mostrarFeedbackGameplay("No se encontró el expediente seleccionado. Vuelve a abrir el caso desde Mi puesto.", "warn");
      return false;
    }
    if (obtenerTrabajoDuenoActivo()) {
      mostrarFeedbackGameplay("Ya estas trabajando personalmente en otro caso.", "warn");
      return false;
    }
    if (!clienteActual.diagnosticado || !clienteActual.aprobacionCliente) {
      mostrarFeedbackGameplay("Emite el diagnostico y confirma el presupuesto antes de reparar.", "warn");
      return false;
    }
    if (!Array.isArray(reparacionesActivas)) reparacionesActivas = [];
    var capacidad = Math.max(1, Math.round(typeof espaciosReparacionMax === "number" ? espaciosReparacionMax : 2));
    if (reparacionesActivas.length >= capacidad) {
      mostrarFeedbackGameplay("No hay bahia libre. Termina o cobra un trabajo antes de ocupar Mi puesto.", "warn");
      return false;
    }
    var economia = typeof evaluarEconomiaCaso === "function" ? evaluarEconomiaCaso(clienteActual) : { neto: clienteActual.pago || 0 };
    if (economia.neto < 0 && !clienteActual.perdidaAceptada) {
      mostrarFeedbackGameplay("La reparacion tiene perdida estimada. Negocia o acepta la perdida antes de continuar.", "warn");
      return false;
    }
    var caso = clienteActual;
    var tiempo = Math.max(3, Math.round(Number(caso.tiempo) || 5));
    var duracion = typeof obtenerDuracionTrabajoTiempoRealSeg === "function" ? obtenerDuracionTrabajoTiempoRealSeg(tiempo, typeof modoNivelesActivo === "function" && modoNivelesActivo()) : tiempo;
    var piezas = typeof seleccionarRepuestosCompatibles === "function" ? seleccionarRepuestosCompatibles(caso, caso.especialidadIdeal || "general", 1) : [];
    var piezaInstalada = caso.piezaInstalada ? Object.assign({}, caso.piezaInstalada) : null;
    var rep = {
      idCaso: caso.idCaso,
      personaNombre: caso.personaNombre,
      vehiculo: caso.vehiculo,
      clienteNombre: caso.nombre || caso.personaNombre,
      mecanicoNombre: "Dueno",
      responsableTipo: "dueno",
      esTrabajoDueno: true,
      casoRef: caso,
      tiempoRestante: tiempo,
      tiempoTotal: tiempo,
      duracionRealSeg: duracion,
      segundosTotalesReal: duracion,
      segundosPendientesReal: duracion,
      ultimoTiempoSyncMs: Date.now(),
      tipoTrabajo: "reparacion",
      pausadaManualDueno: true,
      pausadaPorPieza: false,
      requierePiezaContinuacion: !piezaInstalada && piezas.length > 0,
      piezaContinuacionSolicitada: false,
      piezaContinuacionInstalada: !!piezaInstalada,
      piezasContinuacionRequeridas: piezas.map(function (p) { return { id: p.id, nombre: p.nombre, especialidad: p.especialidad, calidad: p.calidad, costo: p.costo }; }),
      piezasContinuacionEntregadas: [],
      piezaRequeridaNombre: piezas[0] ? piezas[0].nombre : "",
      piezaInstalada: piezaInstalada,
      pagoAcordado: Math.max(0, Math.round(caso.pago || 0)),
      ganancia: Math.max(220, Math.round((caso.pago || 0) * 1.12)),
      perdida: 0,
      exito: true,
      nivelResultado: "critico",
      resultadoOculto: "critico",
      diagnosticoNivel: caso.diagnosticoNivel || "parcial",
      diagnosticoRiesgoAlto: !caso.diagnosticoCorrecto,
      especialidadIdeal: caso.especialidadIdeal || "general",
      miniHistoriaTipo: caso.miniHistoriaTipo,
      casoCaliente: !!caso.casoCaliente,
      cadenaEspecialidadActiva: !!caso.cadenaEspecialidadActiva,
      xpDuenoBonus: 180,
      minijuegoDuenoCompletado: false,
    };
    reparacionesActivas.push(rep);
    if (typeof actualizarCasoAtendido === "function") actualizarCasoAtendido(caso, "en_reparacion", "El dueno inicio la reparacion personalmente.");
    clienteActual = null;
    window.toolbarCasosTrabajoAbierto = true;
    if (typeof consumirTurno === "function") consumirTurno("reparacion del dueno", 1);
    if (typeof actualizarUI === "function") actualizarUI();
    if (typeof autoGuardarPartidaSilenciosa === "function") autoGuardarPartidaSilenciosa("reparacion-dueno-iniciada");
    mostrarFeedbackGameplay("Mi puesto ocupado: completa la intervencion manual para iniciar el progreso.", "ok");
    setTimeout(abrirMinijuegoReparacionDueno, 30);
    return true;
  }

  function abrirMinijuegoReparacionDueno() {
    var rep = obtenerTrabajoDuenoActivo();
    if (!rep || rep.listoParaCobro) return false;
    if (!rep.pausadaManualDueno) {
      mostrarFeedbackGameplay("La intervencion manual ya fue completada. Puedes esperar mientras avanza.", "info");
      return false;
    }
    var reto = retoPorEspecialidad(rep.especialidadIdeal);
    rep.retoDueno = reto;
    var opciones = reto.opciones.map(function (opcion) {
      return '<button class="btn owner-challenge-option" type="button" data-answer="' + esc(opcion) + '" onclick="resolverMinijuegoReparacionDueno(this.dataset.answer)">' + esc(opcion) + '</button>';
    }).join("");
    var pieza = rep.piezasContinuacionRequeridas && rep.piezasContinuacionRequeridas[0];
    var html = '<div class="owner-challenge"><div class="flow-case-kicker">REPARACION MANUAL · ' + esc(rep.idCaso) + '</div><h2>' + esc(reto.titulo) + '</h2><p>' + esc(reto.pregunta) + '</p>' + (pieza ? '<div class="inspection-evidence-summary"><strong>Pieza prevista:</strong> ' + esc(pieza.nombre) + '<br>Compatibilidad: ' + esc(rep.vehiculo || "vehiculo del caso") + '</div>' : '') + '<div class="owner-challenge-options">' + opciones + '</div><small>Una ejecucion incorrecta agrega tiempo, costo y riesgo de resultado parcial.</small></div>';
    if (typeof mostrarModalPersonalizado === "function") mostrarModalPersonalizado(html);
    return true;
  }

  function resolverMinijuegoReparacionDueno(respuesta) {
    var rep = obtenerTrabajoDuenoActivo();
    if (!rep || !rep.pausadaManualDueno || !rep.retoDueno) return false;
    var acierto = String(respuesta || "") === String(rep.retoDueno.correcta || "");
    rep.minijuegoDuenoCompletado = true;
    rep.minijuegoDuenoCorrecto = acierto;
    rep.pausadaManualDueno = false;
    rep.ultimoTiempoSyncMs = Date.now();
    if (acierto) {
      rep.nivelResultado = rep.diagnosticoRiesgoAlto ? "parcial" : "critico";
      rep.resultadoOculto = rep.nivelResultado;
      rep.exito = true;
      rep.ganancia = Math.max(rep.ganancia || 0, Math.round((rep.pagoAcordado || 0) * 1.15));
      rep.xpDuenoBonus = 220;
      rep.subtituloResultado = "Intervencion manual precisa · mayor margen · menor riesgo de retorno";
      reputacion = Math.min(100, Math.max(0, Number(reputacion) || 0) + 1);
      mostrarFeedbackGameplay("Ejecucion correcta: +XP del dueno, mejor margen y reputacion +1.", "ok");
    } else {
      var extra = Math.max(1, Math.round((rep.tiempoTotal || 3) * 0.35));
      var extraSeg = typeof obtenerDuracionTrabajoTiempoRealSeg === "function" ? obtenerDuracionTrabajoTiempoRealSeg(extra, typeof modoNivelesActivo === "function" && modoNivelesActivo()) : extra;
      if (typeof ajustarTrabajoActivoSegundos === "function") ajustarTrabajoActivoSegundos(rep, extraSeg);
      rep.nivelResultado = rep.diagnosticoRiesgoAlto ? "fallo" : "parcial";
      rep.resultadoOculto = rep.nivelResultado;
      rep.exito = rep.nivelResultado !== "fallo";
      rep.ganancia = rep.exito ? Math.max(180, Math.round((rep.pagoAcordado || 0) * 0.68)) : 0;
      rep.perdida = rep.exito ? 0 : Math.max(120, Math.round((rep.pagoAcordado || 0) * 0.22));
      rep.xpDuenoBonus = 70;
      rep.subtituloResultado = "Error manual · tiempo extra · confianza reducida · posible retorno";
      reputacion = Math.max(0, (Number(reputacion) || 0) - 1);
      mostrarFeedbackGameplay("Ejecucion incorrecta: se agrego tiempo y el resultado queda en riesgo.", "warn");
    }
    if (typeof cerrarModal === "function") cerrarModal();
    if (typeof actualizarUI === "function") actualizarUI();
    return true;
  }

  function esperarTrabajoDueno() {
    var rep = obtenerTrabajoDuenoActivo();
    if (!rep) return false;
    if (rep.pausadaManualDueno) {
      mostrarFeedbackGameplay("Completa primero la intervencion manual para iniciar la reparacion.", "warn");
      return false;
    }
    if (typeof esperarSinCostoTaller === "function") return esperarSinCostoTaller();
    return false;
  }

  window.obtenerTrabajoDuenoActivo = obtenerTrabajoDuenoActivo;
  window.renderizarBloqueoMiPuestoDueno = renderizarBloqueoMiPuestoDueno;
  window.construirResumenEconomicoCaso = construirResumenEconomicoCaso;
  window.abrirManualTaller = abrirManualTaller;
  window.asignarReparacionAlDueno = asignarReparacionAlDueno;
  window.abrirMinijuegoReparacionDueno = abrirMinijuegoReparacionDueno;
  window.resolverMinijuegoReparacionDueno = resolverMinijuegoReparacionDueno;
  window.esperarTrabajoDueno = esperarTrabajoDueno;
})();
