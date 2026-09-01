/* =============================================================
   QA LOCAL
   Herramientas de prueba intencionalmente desactivadas fuera de localhost.
   No es un sistema de seguridad ni debe habilitarse en produccion.
   ============================================================= */
(function () {
  "use strict";

  var host = String(window.location.hostname || "").toLowerCase();
  var esLocal = host === "localhost" || host === "127.0.0.1" || host === "::1";
  if (!esLocal) return;

  var secuencia = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];
  var progreso = 0;
  var desbloqueado = window.sessionStorage.getItem("tw_qa_sequence") === "1";
  var autorizado = window.sessionStorage.getItem("tw_qa_authorized") === "1";

  var estilos = document.createElement("style");
  estilos.textContent = "#qa-local-entry{align-self:center;margin-left:auto;border:1px solid #5b7d79;border-radius:6px;background:#102a2d;color:#a7e6d6;font:700 10px/1 monospace;letter-spacing:.08em;padding:7px 8px;cursor:pointer}.qa-local-modal{position:fixed;inset:0;z-index:12000;display:grid;place-items:center;padding:18px;background:rgba(2,10,13,.76);backdrop-filter:blur(3px)}.qa-local-panel{width:min(420px,100%);border:1px solid #567f78;border-radius:12px;background:#0b1c22;box-shadow:0 20px 60px #000;padding:16px;color:#e7f4ef;font-family:monospace}.qa-local-head{display:flex;justify-content:space-between;border-bottom:1px solid #28464b;padding-bottom:12px;margin-bottom:12px}.qa-local-head strong{display:block;color:#f3c75c;letter-spacing:.12em}.qa-local-head span{display:block;margin-top:4px;color:#90aaa8;font-size:11px}.qa-local-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}.qa-local-action{min-height:38px;border:1px solid #385b61;border-radius:7px;background:#112c34;color:#e7f4ef;padding:8px;font:700 11px/1.15 monospace;cursor:pointer}.qa-local-action:hover{border-color:#7fc8b8;background:#173b43}.qa-local-action.warn{border-color:#9f773d;color:#f5cd75}.qa-local-action.danger{border-color:#9b4a4a;color:#ffaaa0;background:#351b20}.qa-local-action.secondary{width:100%;background:transparent;color:#a6c8c2}@media(max-width:420px){.qa-local-actions{grid-template-columns:1fr}.qa-local-panel{max-height:90vh;overflow:auto}}";
  document.head.appendChild(estilos);

  function avisar(texto, tipo) {
    if (typeof window.mostrarFeedbackGameplay === "function") {
      window.mostrarFeedbackGameplay(texto, tipo || "ok");
    } else if (typeof window.log === "function") {
      window.log(texto, tipo === "error" ? "error" : "info");
    }
  }

  function actualizarUI() {
    if (typeof window.actualizarUI === "function") window.actualizarUI();
  }

  function insertarAcceso() {
    if (!desbloqueado || document.getElementById("qa-local-entry")) return;
    var pantalla = document.getElementById("screen-configuracion");
    var barra = pantalla && pantalla.querySelector(".of-topbar");
    if (!barra) return;
    var boton = document.createElement("button");
    boton.id = "qa-local-entry";
    boton.type = "button";
    boton.className = "qa-local-entry";
    boton.textContent = "QA";
    boton.title = "Herramientas de prueba local";
    boton.addEventListener("click", abrirPanel);
    barra.appendChild(boton);
  }

  function asegurarCasoActivo() {
    if (window.clienteActual && window.clienteActual.idCaso) return window.clienteActual;
    var cola = Array.isArray(window.clientesEnEspera) ? window.clientesEnEspera : [];
    var pendientes = Array.isArray(window.casosPendientesDiagnostico) ? window.casosPendientesDiagnostico : [];
    var caso = cola[0] || pendientes[0];
    if (!caso) {
      avisar("QA: genera un caso antes de preparar diagnóstico.", "warn");
      return null;
    }
    if (typeof window.abrirCasoParaDiagnostico === "function") {
      window.abrirCasoParaDiagnostico(cola[0] ? "queue" : "pending-dx", caso.idCaso);
    }
    return window.clienteActual || null;
  }

  function estimarCosto(caso) {
    var economia = (window.TallerData && window.TallerData.economy) || {};
    var catalogo = Array.isArray(economia.catalogoRepuestos) ? economia.catalogoRepuestos : [];
    var piezas = catalogo.filter(function (p) {
      return p && p.especialidad === caso.especialidadIdeal;
    });
    var base = piezas.length
      ? piezas.reduce(function (suma, pieza) { return suma + (Number(pieza.costo) || 0); }, 0) / piezas.length
      : 180;
    return Math.round(base * (1 + Math.max(0, Math.min(1, Number(caso.dificultad) || 0.5)) * 0.35));
  }

  function generarCaso(tipo) {
    if (typeof window.crearClienteAleatorio !== "function") {
      avisar("QA: el generador procedural aún no está disponible.", "error");
      return;
    }
    var caso = window.crearClienteAleatorio();
    if (!caso) return;
    var costo = estimarCosto(caso);
    if (tipo === "perdida") {
      caso.tipoCaso = "premium";
      caso.etiquetaCaso = "Prueba QA · pérdida estratégica";
      caso.esVIP = true;
      caso.segmento = "premium";
      caso.urgencia = "alta";
      caso.pago = Math.max(100, costo - 117);
    } else {
      caso.etiquetaCaso = "Prueba QA · rentable";
      caso.pago = Math.max(costo + 650, Math.round((Number(caso.pago) || 0) + 650));
      caso.esVIP = false;
    }
    if (!Array.isArray(window.clientesEnEspera)) window.clientesEnEspera = [];
    window.clientesEnEspera.unshift(caso);
    avisar("QA: caso " + (tipo === "perdida" ? "con pérdida visible" : "rentable") + " añadido a la cola.", "ok");
    actualizarUI();
  }

  function diagnosticoPerfecto() {
    var caso = asegurarCasoActivo();
    if (!caso) return false;
    if (caso.diagnosticado) {
      avisar("QA: el expediente ya tiene diagnóstico.", "info");
      return true;
    }
    var fallos = Array.isArray(caso.fallosPrincipales) ? caso.fallosPrincipales.filter(Boolean) : [];
    caso.diagnosticosDetectados = fallos;
    caso.diagnosticoSeleccionado = fallos[0] || caso.diagnosticoSeleccionado;
    caso.ofDxSugerencia = caso.diagnosticoSeleccionado;
    caso.ofDxConfianzaPct = 100;
    caso.ofDxValidacionGuiada = true;
    if (typeof window.diagnosticarCasoMiPuesto !== "function" || !window.diagnosticarCasoMiPuesto()) {
      avisar("QA: no se pudo emitir el diagnóstico del dueño.", "error");
      return false;
    }
    avisar("QA: diagnóstico perfecto emitido por el dueño.", "ok");
    return true;
  }

  function asignarMecanico(indice) {
    if (!diagnosticoPerfecto()) return;
    window.setTimeout(function () {
      var caso = window.clienteActual;
      if (!caso) return;
      if (!caso.aprobacionCliente && typeof window.confirmarPresupuestoMiPuesto === "function") {
        window.confirmarPresupuestoMiPuesto();
      }
      window.setTimeout(function () {
        var idCaso = window.clienteActual && window.clienteActual.idCaso;
        if (idCaso && typeof window.intentarAsignarCasoListaAMecanico === "function") {
          var ok = window.intentarAsignarCasoListaAMecanico("pending-dx", idCaso, indice);
          avisar(ok ? "QA: trabajo asignado." : "QA: no se pudo asignar; revisa capacidad y estado del mecánico.", ok ? "ok" : "warn");
        }
        actualizarUI();
      }, 40);
    }, 40);
  }

  function piezasInstantaneas() {
    var reparaciones = Array.isArray(window.reparacionesActivas) ? window.reparacionesActivas : [];
    var afectadas = reparaciones.filter(function (rep) { return rep && rep.pausadaPorPieza; });
    afectadas.forEach(function (rep) {
      rep.pausadaPorPieza = false;
      rep.piezaContinuacionSolicitada = true;
      rep.piezaContinuacionInstalada = true;
      rep.piezasContinuacionEntregadas = rep.piezasContinuacionEntregadas || [];
      rep.ultimoTiempoSyncMs = Date.now();
    });
    if (Array.isArray(window.entregasPiezasActivas)) {
      window.entregasPiezasActivas = window.entregasPiezasActivas.filter(function (entrega) {
        return !afectadas.some(function (rep) { return rep.idCaso === entrega.idCaso; });
      });
    }
    avisar(afectadas.length ? "QA: piezas entregadas; los trabajos continúan." : "QA: no había reparaciones esperando piezas.", afectadas.length ? "ok" : "info");
    actualizarUI();
  }

  function completarReparacion() {
    var reparaciones = Array.isArray(window.reparacionesActivas) ? window.reparacionesActivas : [];
    var rep = reparaciones.find(function (item) { return item && !item.listoParaCobro; });
    if (!rep) {
      avisar("QA: no hay una reparación activa para completar.", "warn");
      return;
    }
    rep.pausadaPorPieza = false;
    rep.piezaContinuacionInstalada = true;
    rep.tiempoRestante = 0;
    rep.segundosPendientesReal = 0;
    rep.ultimoTiempoSyncMs = Date.now();
    if (typeof window.sincronizarTrabajosTiempoReal === "function") window.sincronizarTrabajosTiempoReal("qa");
    avisar("QA: reparación completada y lista para resultado/cobro.", "ok");
    actualizarUI();
  }

  function cobrarCaso() {
    var reparaciones = Array.isArray(window.reparacionesActivas) ? window.reparacionesActivas : [];
    var rep = reparaciones.find(function (item) { return item && item.listoParaCobro; });
    if (!rep) {
      avisar("QA: completa primero una reparación.", "warn");
      return;
    }
    rep.resultadoVisible = true;
    if (typeof window.procesarCobroReparacionDirecto !== "function") {
      avisar("QA: el cobro directo no está disponible.", "error");
      return;
    }
    var resultado = window.procesarCobroReparacionDirecto(rep.idCaso);
    avisar(resultado && resultado.ok ? "QA: caso cobrado y cerrado." : "QA: no se pudo cobrar el caso.", resultado && resultado.ok ? "ok" : "error");
    actualizarUI();
  }

  function crearBoton(texto, accion, clase) {
    var boton = document.createElement("button");
    boton.type = "button";
    boton.className = "qa-local-action" + (clase ? " " + clase : "");
    boton.textContent = texto;
    boton.addEventListener("click", accion);
    return boton;
  }

  function cerrarPanel() {
    var modal = document.getElementById("qa-local-modal");
    if (modal) modal.remove();
  }

  function abrirPanel() {
    if (!autorizado) {
      var codigo = window.prompt("Código QA local:");
      if (codigo !== "TALLER-360") {
        avisar("QA: código incorrecto.", "warn");
        return;
      }
      autorizado = true;
      window.sessionStorage.setItem("tw_qa_authorized", "1");
    }
    cerrarPanel();
    var modal = document.createElement("div");
    modal.id = "qa-local-modal";
    modal.className = "qa-local-modal";
    modal.addEventListener("click", function (event) { if (event.target === modal) cerrarPanel(); });
    var panel = document.createElement("section");
    panel.className = "qa-local-panel";
    panel.innerHTML = "<div class=\"qa-local-head\"><div><strong>QA LOCAL</strong><span>Solo localhost · sesión de pruebas</span></div></div>";
    var acciones = document.createElement("div");
    acciones.className = "qa-local-actions";
    acciones.appendChild(crearBoton("+ RD$10,000", function () { window.saldo = Math.max(0, Number(window.saldo) || 0) + 10000; avisar("QA: caja aumentada en RD$10,000.", "ok"); actualizarUI(); }));
    acciones.appendChild(crearBoton("Caso rentable", function () { generarCaso("rentable"); }));
    acciones.appendChild(crearBoton("Caso pérdida", function () { generarCaso("perdida"); }, "warn"));
    acciones.appendChild(crearBoton("Diagnóstico perfecto", diagnosticoPerfecto));
    acciones.appendChild(crearBoton("Dueño · diagnóstico", diagnosticoPerfecto));
    acciones.appendChild(crearBoton("Asignar Frandy", function () { asignarMecanico(0); }));
    acciones.appendChild(crearBoton("Asignar Maicol", function () { asignarMecanico(1); }));
    acciones.appendChild(crearBoton("Piezas instantáneas", piezasInstantaneas));
    acciones.appendChild(crearBoton("Completar reparación", completarReparacion));
    acciones.appendChild(crearBoton("Cobrar caso", cobrarCaso));
    acciones.appendChild(crearBoton("Reiniciar partida", function () { if (window.confirm("¿Reiniciar la partida local? Se borrará el progreso guardado de esta prueba.")) window.iniciarDesdeMenu(); }, "danger"));
    panel.appendChild(acciones);
    var cerrar = crearBoton("Cerrar", cerrarPanel, "secondary");
    panel.appendChild(cerrar);
    modal.appendChild(panel);
    document.body.appendChild(modal);
  }

  document.addEventListener("keydown", function (event) {
    var tecla = String(event.key || "").toLowerCase();
    if (tecla === secuencia[progreso]) progreso += 1;
    else progreso = tecla === secuencia[0] ? 1 : 0;
    if (progreso === secuencia.length) {
      progreso = 0;
      desbloqueado = true;
      window.sessionStorage.setItem("tw_qa_sequence", "1");
      insertarAcceso();
      avisar("QA local desbloqueado en Ajustes.", "ok");
    }
  });

  var observador = new MutationObserver(insertarAcceso);
  observador.observe(document.documentElement, { childList: true, subtree: true });
  insertarAcceso();
})();
