// ============================================
// SISTEMA DE CONTABILIDAD POR CASOS
// ============================================
var TALLER_DATA = window.TallerData || {};
var ECONOMY_DATA = TALLER_DATA.economy || {};

// FUNCIONES DE INICIALIZACIÓN
function crearDetalleGastosCasoInicial() {
    return {
        piezas: 0,
        salarios: 0,
        comida: 0,
        cafe: 0,
        bar: 0,
        compras: 0,
        mejoras: 0,
        equipo: 0,
        banco: 0,
        operaciones: 0,
        eventos: 0,
        otros: 0,
        prestamos: 0,
        sobornos: 0
    };
}

function crearDetalleIngresosCasoInicial() {
    return {
        reparaciones: 0,
        clandestino: 0,
        eventos: 0,
        misiones: 0,
        cobranzas: 0,
        prestamos: 0,
        ventaPiezas: 0,
        otros: 0
    };
}

function crearResumenCasosInicial() {
    return {
        // Contadores generales
        totalCasosJugados: 0,
        rachaCasosExitosos: 0,
        mejorRachaHistorica: 0,
        
        // Finanzas acumuladas
        ingresosAcumulados: 0,
        gastosAcumulados: 0,
        beneficioNetoAcumulado: 0,
        
        // Detalle del último caso
        ultimoCaso: {
            ingresos: 0,
            perdidas: 0,
            gastosDetalle: crearDetalleGastosCasoInicial(),
            ingresosDetalle: crearDetalleIngresosCasoInicial(),
            diagnostico: null,
            resultado: null,
            cliente: null
        },
        
        // Estadísticas globales
        estadisticas: {
            reparacionesExitosas: 0,
            reparacionesParciales: 0,
            reparacionesFallidas: 0,
            clientesPerdidos: 0,
            negociacionesExitosas: 0,
            negociacionesFallidas: 0,
            diagnosticosCorrectos: 0,
            diagnosticosParciales: 0,
            diagnosticosFallidos: 0,
            prestamosDadosAEmpleados: 0,
            peleasEntreMecanicos: 0,
            conflictosResueltos: 0
        },
        
        // Historial de eventos narrativos
        ramificaciones: [],
        
        // Log de casos recientes (últimos 10)
        casosRecientes: []
    };
}

function asegurarResumenCasosContable() {
    if (!resumenCasos || typeof resumenCasos !== 'object') {
        resumenCasos = crearResumenCasosInicial();
        return;
    }
    
    // Asegurar campos principales
    if (typeof resumenCasos.totalCasosJugados !== 'number') resumenCasos.totalCasosJugados = 0;
    if (typeof resumenCasos.rachaCasosExitosos !== 'number') resumenCasos.rachaCasosExitosos = 0;
    if (typeof resumenCasos.ingresosAcumulados !== 'number') resumenCasos.ingresosAcumulados = 0;
    if (typeof resumenCasos.gastosAcumulados !== 'number') resumenCasos.gastosAcumulados = 0;
    
    // Asegurar último caso
    if (!resumenCasos.ultimoCaso || typeof resumenCasos.ultimoCaso !== 'object') {
        resumenCasos.ultimoCaso = {
            ingresos: 0,
            perdidas: 0,
            gastosDetalle: crearDetalleGastosCasoInicial(),
            ingresosDetalle: crearDetalleIngresosCasoInicial()
        };
    }
    
    // Asegurar detalles de gastos del último caso
    if (!resumenCasos.ultimoCaso.gastosDetalle || typeof resumenCasos.ultimoCaso.gastosDetalle !== 'object') {
        resumenCasos.ultimoCaso.gastosDetalle = crearDetalleGastosCasoInicial();
    } else {
        var gastosBase = crearDetalleGastosCasoInicial();
        Object.keys(gastosBase).forEach(function(k) {
            if (typeof resumenCasos.ultimoCaso.gastosDetalle[k] !== 'number') 
                resumenCasos.ultimoCaso.gastosDetalle[k] = 0;
        });
    }
    
    // Asegurar detalles de ingresos del último caso
    if (!resumenCasos.ultimoCaso.ingresosDetalle || typeof resumenCasos.ultimoCaso.ingresosDetalle !== 'object') {
        resumenCasos.ultimoCaso.ingresosDetalle = crearDetalleIngresosCasoInicial();
    } else {
        var ingresosBase = crearDetalleIngresosCasoInicial();
        Object.keys(ingresosBase).forEach(function(k) {
            if (typeof resumenCasos.ultimoCaso.ingresosDetalle[k] !== 'number') 
                resumenCasos.ultimoCaso.ingresosDetalle[k] = 0;
        });
    }
    
    // Asegurar estadísticas
    if (!resumenCasos.estadisticas || typeof resumenCasos.estadisticas !== 'object') {
        resumenCasos.estadisticas = {
            reparacionesExitosas: 0,
            reparacionesParciales: 0,
            reparacionesFallidas: 0,
            clientesPerdidos: 0,
            negociacionesExitosas: 0,
            negociacionesFallidas: 0,
            diagnosticosCorrectos: 0,
            diagnosticosParciales: 0,
            diagnosticosFallidos: 0,
            prestamosDadosAEmpleados: 0,
            peleasEntreMecanicos: 0,
            conflictosResueltos: 0
        };
    }
    
    if (!Array.isArray(resumenCasos.ramificaciones)) resumenCasos.ramificaciones = [];
    if (!Array.isArray(resumenCasos.casosRecientes)) resumenCasos.casosRecientes = [];
}

// FUNCIONES DE REGISTRO FINANCIERO
function registrarGastoCaso(monto, categoria, acumularGlobal = true) {
    var valor = Math.max(0, Math.round(monto || 0));
    if (valor <= 0) return 0;
    
    asegurarResumenCasosContable();
    
    var clave = (typeof categoria === 'string' && categoria.trim()) ? categoria.trim() : 'otros';
    if (typeof resumenCasos.ultimoCaso.gastosDetalle[clave] !== 'number') clave = 'otros';
    
    // Registrar en el último caso
    resumenCasos.ultimoCaso.perdidas += valor;
    resumenCasos.ultimoCaso.gastosDetalle[clave] += valor;
    
    // Registrar en acumulados globales
    if (acumularGlobal) {
        resumenCasos.gastosAcumulados += valor;
    }
    
    return valor;
}

function registrarIngresoCaso(monto, categoria, acumularGlobal = true) {
    var valor = Math.max(0, Math.round(monto || 0));
    if (valor <= 0) return 0;
    
    asegurarResumenCasosContable();
    
    var clave = (typeof categoria === 'string' && categoria.trim()) ? categoria.trim() : 'otros';
    if (typeof resumenCasos.ultimoCaso.ingresosDetalle[clave] !== 'number') clave = 'otros';
    
    // Registrar en el último caso
    resumenCasos.ultimoCaso.ingresos += valor;
    resumenCasos.ultimoCaso.ingresosDetalle[clave] += valor;
    
    // Registrar en acumulados globales
    if (acumularGlobal) {
        resumenCasos.ingresosAcumulados += valor;
        resumenCasos.beneficioNetoAcumulado = resumenCasos.ingresosAcumulados - resumenCasos.gastosAcumulados;
    }
    
    return valor;
}

function finalizarCaso(resultado, diagnostico, cliente) {
    asegurarResumenCasosContable();
    
    // Incrementar contador de casos
    resumenCasos.totalCasosJugados++;
    
    // Actualizar racha según resultado
    if (resultado === 'exitoso') {
        resumenCasos.rachaCasosExitosos++;
        resumenCasos.estadisticas.reparacionesExitosas++;
        
        if (resumenCasos.rachaCasosExitosos > resumenCasos.mejorRachaHistorica) {
            resumenCasos.mejorRachaHistorica = resumenCasos.rachaCasosExitosos;
        }
    } else if (resultado === 'parcial') {
        resumenCasos.rachaCasosExitosos = 0;
        resumenCasos.estadisticas.reparacionesParciales++;
    } else if (resultado === 'fallido') {
        resumenCasos.rachaCasosExitosos = 0;
        resumenCasos.estadisticas.reparacionesFallidas++;
    }
    
    // Guardar información del caso actual
    resumenCasos.ultimoCaso.diagnostico = diagnostico;
    resumenCasos.ultimoCaso.resultado = resultado;
    resumenCasos.ultimoCaso.cliente = cliente;
    resumenCasos.ultimoCaso.fecha = new Date().toISOString();
    resumenCasos.ultimoCaso.numeroCaso = resumenCasos.totalCasosJugados;
    
    // Calcular beneficio del caso
    resumenCasos.ultimoCaso.beneficioNeto = resumenCasos.ultimoCaso.ingresos - resumenCasos.ultimoCaso.perdidas;
    
    // Guardar en historial de casos recientes (mantener últimos 10)
    resumenCasos.casosRecientes.unshift({ ...resumenCasos.ultimoCaso });
    if (resumenCasos.casosRecientes.length > 10) {
        resumenCasos.casosRecientes.pop();
    }
    
    // Actualizar beneficio acumulado
    resumenCasos.beneficioNetoAcumulado = resumenCasos.ingresosAcumulados - resumenCasos.gastosAcumulados;
    
    return resumenCasos.ultimoCaso;
}

function obtenerRachaCasosActual() {
    asegurarResumenCasosContable();
    return Math.max(0, Math.round((resumenCasos && resumenCasos.rachaCasosExitosos) || 0));
}

function calcularMetaNivel(nivel) {
    var seguro = Math.max(1, Math.round(Number(nivel) || 1));
    return Math.max(120, Math.round(120 + ((seguro - 1) * 60)));
}

function sincronizarEstadoProgresoJugador() {
    if (typeof nivelJugador !== 'number' || nivelJugador < 1) nivelJugador = 1;
    if (typeof progresoNivelMeta !== 'number' || progresoNivelMeta <= 0) {
        progresoNivelMeta = calcularMetaNivel(nivelJugador);
    }
    if (typeof progresoNivel !== 'number' || progresoNivel < 0) progresoNivel = 0;
    if (typeof experienciaAcumulada !== 'number' || experienciaAcumulada < 0) {
        experienciaAcumulada = 0;
    }
    if (typeof ahorroAcumulado !== 'number' || ahorroAcumulado < 0) {
        ahorroAcumulado = 0;
    }

    window.jugadorNivel = nivelJugador;
    window.jugadorXP = progresoNivel;
    window.jugadorXPMeta = progresoNivelMeta;

    if (window.XP_HUD && typeof window.XP_HUD.init === 'function') {
        window.XP_HUD.init(
            nivelJugador,
            progresoNivel,
            Math.min(25, obtenerRachaCasosActual() * 5),
        );
    }
}

function registrarProgresoNivel(montoBase, resultado) {
    sincronizarEstadoProgresoJugador();

    var monto = Math.max(0, Math.round(Number(montoBase) || 0));
    var estado = String(resultado || 'parcial').toLowerCase();
    var xpBase = 18;

    if (estado === 'critico' || estado === 'exitoso') xpBase = 34;
    else if (estado === 'parcial') xpBase = 22;
    else if (estado === 'fallo' || estado === 'fallido' || estado === 'fallo_total') xpBase = 10;

    var bonusMonto = Math.min(70, Math.round(monto / 180));
    var bonusRacha = Math.min(15, Math.max(0, obtenerRachaCasosActual() - 1) * 3);
    var xpGanada = Math.max(1, xpBase + bonusMonto + bonusRacha);
    var subidas = 0;

    progresoNivel = Math.max(0, Math.round(progresoNivel || 0) + xpGanada);
    experienciaAcumulada = Math.max(0, Math.round(experienciaAcumulada || 0) + xpGanada);
    ahorroAcumulado = Math.max(0, Math.round(ahorroAcumulado || 0) + monto);

    while (progresoNivel >= progresoNivelMeta) {
        progresoNivel -= progresoNivelMeta;
        nivelJugador = Math.max(1, Math.round(nivelJugador || 1) + 1);
        progresoNivelMeta = calcularMetaNivel(nivelJugador);
        subidas += 1;
    }

    sincronizarEstadoProgresoJugador();

    return {
        xpGanada: xpGanada,
        subidasNivel: subidas,
        nivelActual: nivelJugador,
        progresoActual: progresoNivel,
        progresoMeta: progresoNivelMeta,
    };
}

function nuevoCaso() {
    asegurarResumenCasosContable();
    
    // Reiniciar el detalle del último caso para el nuevo caso
    resumenCasos.ultimoCaso = {
        ingresos: 0,
        perdidas: 0,
        gastosDetalle: crearDetalleGastosCasoInicial(),
        ingresosDetalle: crearDetalleIngresosCasoInicial(),
        diagnostico: null,
        resultado: null,
        cliente: null
    };
    
    return resumenCasos.ultimoCaso;
}

function crearRitmoTallerInicial() {
    return {
        combo: 0,
        impulso: 0,
        multiplicadorPago: 1,
        bonusProbabilidad: 0,
        bonusTiempo: 0,
        ultimaEspecialidad: '',
        cadenaEspecialidad: 0,
        ultimoResultado: '',
        ultimoCasoId: '',
        casosCalientesGenerados: 0,
        casosCadenaGenerados: 0,
        retornosEncadenados: 0,
        resumen: 'Sin impulso'
    };
}

function asegurarRitmoTaller() {
    if (!ritmoTaller || typeof ritmoTaller !== 'object') {
        ritmoTaller = crearRitmoTallerInicial();
    }

    if (typeof ritmoTaller.combo !== 'number') ritmoTaller.combo = 0;
    if (typeof ritmoTaller.impulso !== 'number') ritmoTaller.impulso = 0;
    if (typeof ritmoTaller.multiplicadorPago !== 'number') ritmoTaller.multiplicadorPago = 1;
    if (typeof ritmoTaller.bonusProbabilidad !== 'number') ritmoTaller.bonusProbabilidad = 0;
    if (typeof ritmoTaller.bonusTiempo !== 'number') ritmoTaller.bonusTiempo = 0;
    if (typeof ritmoTaller.ultimaEspecialidad !== 'string') ritmoTaller.ultimaEspecialidad = '';
    if (typeof ritmoTaller.cadenaEspecialidad !== 'number') ritmoTaller.cadenaEspecialidad = 0;
    if (typeof ritmoTaller.ultimoResultado !== 'string') ritmoTaller.ultimoResultado = '';
    if (typeof ritmoTaller.ultimoCasoId !== 'string') ritmoTaller.ultimoCasoId = '';
    if (typeof ritmoTaller.casosCalientesGenerados !== 'number') ritmoTaller.casosCalientesGenerados = 0;
    if (typeof ritmoTaller.casosCadenaGenerados !== 'number') ritmoTaller.casosCadenaGenerados = 0;
    if (typeof ritmoTaller.retornosEncadenados !== 'number') ritmoTaller.retornosEncadenados = 0;
    if (typeof ritmoTaller.resumen !== 'string') ritmoTaller.resumen = 'Sin impulso';

    ritmoTaller.combo = Math.max(0, Math.round(ritmoTaller.combo));
    ritmoTaller.impulso = Math.max(0, Math.min(100, Math.round(ritmoTaller.impulso)));
    ritmoTaller.cadenaEspecialidad = Math.max(0, Math.round(ritmoTaller.cadenaEspecialidad));

    recalcularRitmoTaller();
    return ritmoTaller;
}

function obtenerPresionDeudaRitmoTaller() {
    var deudaActual = Math.max(0, Math.round(deuda || 0));
    var saldoActual = Math.max(0, Math.round(saldo || 0));
    if (deudaActual <= 0) return 0;
    var relacion = deudaActual / Math.max(1, saldoActual + 1500);
    return Math.max(0, Math.min(1.4, relacion - 0.45));
}

function recalcularRitmoTaller() {
    if (!ritmoTaller || typeof ritmoTaller !== 'object') return null;
    var combo = Math.max(0, Math.round(ritmoTaller.combo || 0));
    var impulso = Math.max(0, Math.min(100, Math.round(ritmoTaller.impulso || 0)));
    var cadena = Math.max(0, Math.round(ritmoTaller.cadenaEspecialidad || 0));

    ritmoTaller.multiplicadorPago = 1 + Math.min(0.16, (combo * 0.018) + (cadena * 0.01) + (impulso * 0.0006));
    ritmoTaller.bonusProbabilidad = Math.min(0.055, (combo * 0.0075) + (impulso * 0.00022));
    ritmoTaller.bonusTiempo = (combo >= 3 || cadena >= 2) ? 1 : 0;

    if (combo <= 0) {
        ritmoTaller.resumen = deuda > saldo ? 'Sin impulso. Hace falta caja ya.' : 'Sin impulso';
    } else {
        var foco = cadena >= 2 && ritmoTaller.ultimaEspecialidad
            ? ' | Cadena ' + ritmoTaller.ultimaEspecialidad
            : '';
        ritmoTaller.resumen = 'Combo x' + combo + ' | Impulso ' + impulso + '%' + foco;
    }

    return ritmoTaller;
}

function registrarRitmoTallerPorCierre(rep) {
    asegurarRitmoTaller();
    var resultado = rep && rep.nivelResultado ? String(rep.nivelResultado).toLowerCase() : 'fallo';
    var especialidad = rep && rep.especialidadIdeal ? String(rep.especialidadIdeal) : '';
    var fueCritico = resultado === 'critico';
    var fueParcial = resultado === 'parcial';

    if (fueCritico || fueParcial) {
        if (fueCritico) {
            ritmoTaller.combo = Math.min(6, ritmoTaller.combo + 1);
            ritmoTaller.impulso = Math.min(
                100,
                ritmoTaller.impulso + 14 + (rep && rep.casoCaliente ? 4 : 0) + ((rep && rep.miniHistoriaTipo === 'trabajo_urgente') ? 3 : 0)
            );
        } else {
            ritmoTaller.combo = Math.min(5, ritmoTaller.combo + (ritmoTaller.combo === 0 ? 1 : 0));
            ritmoTaller.impulso = Math.min(
                100,
                ritmoTaller.impulso + 7 + (rep && rep.casoCaliente ? 2 : 0)
            );
        }
        if (especialidad) {
            ritmoTaller.cadenaEspecialidad = ritmoTaller.ultimaEspecialidad === especialidad
                ? Math.min(4, ritmoTaller.cadenaEspecialidad + 1)
                : 1;
            ritmoTaller.ultimaEspecialidad = especialidad;
        }
    } else {
        ritmoTaller.combo = Math.max(0, ritmoTaller.combo - 2);
        ritmoTaller.impulso = Math.max(0, ritmoTaller.impulso - 26);
        ritmoTaller.cadenaEspecialidad = 0;
        if (especialidad) ritmoTaller.ultimaEspecialidad = especialidad;
    }

    ritmoTaller.ultimoResultado = resultado;
    ritmoTaller.ultimoCasoId = rep && rep.idCaso ? String(rep.idCaso) : '';
    return recalcularRitmoTaller();
}

function aplicarRitmoTallerACliente(cliente) {
    if (!cliente || typeof cliente !== 'object') return cliente;
    var estado = asegurarRitmoTaller();
    var combo = Math.max(0, Math.round(estado.combo || 0));
    var impulso = Math.max(0, Math.round(estado.impulso || 0));
    var presionDeuda = obtenerPresionDeudaRitmoTaller();

    cliente.casoCaliente = false;
    cliente.cadenaEspecialidadActiva = false;
    cliente.ofertaRitmo = {
        combo: combo,
        impulso: impulso,
        presionDeuda: presionDeuda
    };

    var elegibleCaliente = !cliente.esVIP && cliente.miniHistoriaTipo !== 'retorno_encadenado';
    var chanceCaliente = Math.min(0.34, 0.03 + (combo * 0.028) + (impulso * 0.0008) + (presionDeuda * 0.06));
    if (elegibleCaliente && Math.random() < chanceCaliente) {
        cliente.casoCaliente = true;
        cliente.pago = Math.max(650, Math.round(cliente.pago * (1.07 + (combo * 0.008))));
        cliente.dificultad = Math.min(0.95, Math.max(0.2, (cliente.dificultad || 0.45) + 0.045));
        cliente.pacienciaCola = Math.min(Math.max(58, 84 - combo), Math.max(52, Math.round(cliente.pacienciaCola || 100)));
        cliente.miniHistoriaTexto = 'Caso caliente: entra con prisa por salir rapido. ' + String(cliente.miniHistoriaTexto || '').trim();
        ritmoTaller.casosCalientesGenerados += 1;
    }

    if (estado.ultimaEspecialidad && cliente.especialidadIdeal === estado.ultimaEspecialidad && combo >= 1) {
        cliente.cadenaEspecialidadActiva = true;
        cliente.pago = Math.max(650, Math.round(cliente.pago * (1.05 + Math.min(0.05, estado.cadenaEspecialidad * 0.015))));
        cliente.tiempo = Math.max(2, Math.round((cliente.tiempo || 4) - 1));
        cliente.miniHistoriaTexto = String(cliente.miniHistoriaTexto || '').trim() + ' Cadena abierta en ' + cliente.especialidadIdeal + ': si lo cierras bien sostienes el impulso.';
        ritmoTaller.casosCadenaGenerados += 1;
    }

    recalcularRitmoTaller();
    return cliente;
}

function obtenerBonosRitmoTaller(cliente, mecanico) {
    var estado = asegurarRitmoTaller();
    var bonus = {
        bonusProbabilidad: 0,
        bonusGananciaPct: 0,
        bonusTiempo: 0,
        etiquetas: []
    };

    if (estado.combo >= 2) {
        bonus.bonusProbabilidad += estado.bonusProbabilidad;
        bonus.bonusGananciaPct += Math.max(0, (estado.multiplicadorPago - 1) * 0.42);
        bonus.etiquetas.push('ritmo x' + estado.combo);
    }

    if (cliente && cliente.casoCaliente) {
        bonus.bonusGananciaPct += 0.08;
        bonus.bonusProbabilidad -= 0.02;
        bonus.etiquetas.push('caso caliente');
    }

    if (cliente && cliente.cadenaEspecialidadActiva) {
        var matchEspecialidad = !!(
            mecanico &&
            (mecanico.especialidad === cliente.especialidadIdeal || mecanico.especialidad === 'general')
        );
        if (matchEspecialidad) {
            bonus.bonusProbabilidad += 0.035;
            bonus.bonusGananciaPct += 0.05;
            bonus.bonusTiempo += 1;
            bonus.etiquetas.push('cadena ' + cliente.especialidadIdeal);
        } else {
            bonus.bonusProbabilidad += 0.015;
            bonus.etiquetas.push('cadena abierta');
        }
    }

    if (cliente && cliente.casoCaliente && obtenerPresionDeudaRitmoTaller() > 0.55) {
        bonus.bonusGananciaPct += 0.03;
        bonus.etiquetas.push('caja presionada');
    }

    bonus.bonusProbabilidad = Math.max(-0.06, Math.min(0.1, bonus.bonusProbabilidad));
    bonus.bonusGananciaPct = Math.max(0, Math.min(0.22, bonus.bonusGananciaPct));
    bonus.bonusTiempo = Math.max(0, Math.min(1, Math.round(bonus.bonusTiempo)));
    return bonus;
}

function obtenerResumenRitmoTaller() {
    var estado = asegurarRitmoTaller();
    return {
        combo: Math.max(0, Math.round(estado.combo || 0)),
        impulso: Math.max(0, Math.round(estado.impulso || 0)),
        multiplicadorPago: Number(estado.multiplicadorPago || 1),
        cadenaEspecialidad: Math.max(0, Math.round(estado.cadenaEspecialidad || 0)),
        ultimaEspecialidad: estado.ultimaEspecialidad || '',
        texto: estado.resumen || 'Sin impulso'
    };
}

// ============================================
// SISTEMA DE DECISIONES E HISTORIA
// ============================================
function crearDecisionesHistoriaInicial() {
    return {
        prestamosAprobados: 0,
        prestamosNegados: 0,
        peleasOcurridas: 0,
        peleasEvitadas: 0,
        favoresCobrados: 0,
        favoresPerdidos: 0,
        acuerdosBarrio: 0,
        atajosOscuros: 0,
        sobornosRealizados: 0,
        clientesReferidos: 0
    };
}

function crearTramaEstadoInicial() {
    return {
        // Relaciones con clientes
        clientesFrecuentesGanados: 0,
        conflictosGarantia: 0,
        urgenciasResueltas: 0,
        primerizosGuiados: 0,
        
        // Relaciones con mecánicos
        historiasMecanicosAtendidas: 0,
        prestamosAEmpleados: 0,
        
        // Presión externa
        inspectorGolpes: 0,        // Inspecciones recibidas
        inspectorSobornos: 0,      // Sobornos pagados
        presionLegal: 0,           // Nivel de presión legal (0-100)
        
        // Calidad de trabajo
        casosCriticosResueltos: 0,
        casosParciales: 0,
        
        // Stewart (narrativa específica)
        stewartCasosEvaluados: 0,
        stewartEventosFavor: 0,
        stewartEventosRiesgo: 0,
        
        // Ex pareja (narrativa)
        exRelacion: 50,             // 0-100, relación con ex
        exPresionLegal: 0,
        exEventosAtendidos: 0,
        exEventosIgnorados: 0,
        exEventoPendiente: null,
        
        // Eventos narrativos
        eventoNarrativoUltimoCaso: 0,
        solicitudMecanicoUltimoCaso: 0,
        hitosNarrativosActivados: []
    };
}

// ============================================
// SISTEMA DE MISIONES (basadas en casos)
// ============================================
function crearMisionesInicial() {
    return {
        activas: [],
        completadas: [],
        misionesPorHito: [
            {
                id: 'primer_caso',
                titulo: 'Primer Caso',
                descripcion: 'Completa tu primer caso con éxito',
                objetivo: 1,
                tipo: 'casos_completados',
                recompensaDinero: 500,
                recompensaReputacion: 5,
                completada: false,
                cobrada: false
            },
            {
                id: 'racha_3',
                titulo: 'Buena Racha',
                descripcion: 'Completa 3 casos seguidos sin fallos',
                objetivo: 3,
                tipo: 'racha_casos',
                recompensaDinero: 800,
                recompensaReputacion: 8,
                completada: false,
                cobrada: false
            },
            {
                id: 'diez_casos',
                titulo: 'Taller Activo',
                descripcion: 'Acumula 10 casos completados',
                objetivo: 10,
                tipo: 'casos_acumulados',
                recompensaDinero: 1500,
                recompensaReputacion: 12,
                completada: false,
                cobrada: false
            },
            {
                id: 'diagnosticos_precisos',
                titulo: 'Diagnóstico Fino',
                descripcion: 'Realiza 5 diagnósticos correctos',
                objetivo: 5,
                tipo: 'diagnosticos_correctos',
                recompensaDinero: 1200,
                recompensaReputacion: 10,
                completada: false,
                cobrada: false
            },
            {
                id: 'especialista_motor',
                titulo: 'Especialista en Motores',
                descripcion: 'Completa 8 reparaciones de motor',
                objetivo: 8,
                tipo: 'especialidad',
                especialidad: 'motor',
                recompensaDinero: 1800,
                recompensaReputacion: 15,
                completada: false,
                cobrada: false
            },
            {
                id: 'especialista_electronica',
                titulo: 'Experto en Electrónica',
                descripcion: 'Completa 8 reparaciones eléctricas',
                objetivo: 8,
                tipo: 'especialidad',
                especialidad: 'electricidad',
                recompensaDinero: 2000,
                recompensaReputacion: 15,
                completada: false,
                cobrada: false
            },
            {
                id: 'veinticinco_casos',
                titulo: 'Taller Consolidado',
                descripcion: 'Alcanza 25 casos completados',
                objetivo: 25,
                tipo: 'casos_acumulados',
                recompensaDinero: 2500,
                recompensaReputacion: 20,
                completada: false,
                cobrada: false
            },
            {
                id: 'cincuenta_casos',
                titulo: 'Referencia en el Barrio',
                descripcion: 'Alcanza 50 casos completados',
                objetivo: 50,
                tipo: 'casos_acumulados',
                recompensaDinero: 4000,
                recompensaReputacion: 30,
                completada: false,
                cobrada: false
            },
            {
                id: 'cien_casos',
                titulo: 'Leyenda del Taller',
                descripcion: 'Alcanza 100 casos completados',
                objetivo: 100,
                tipo: 'casos_acumulados',
                recompensaDinero: 8000,
                recompensaReputacion: 50,
                completada: false,
                cobrada: false
            }
        ]
    };
}

function crearMisionDiaInicial() {
    return crearMisionesInicial();
}

// ============================================
// CÁLCULOS OPERATIVOS
// ============================================
function calcularCostosOperativosPorCaso() {
    // Costos fijos que se prorratean por caso
    var costosBase = 200 + ((window.mecanicos && window.mecanicos.length) ? window.mecanicos.length * 40 : 80);
    
    // Ajuste por nivel de taller (mayor nivel = más eficiencia)
    var nivelTaller = window.tallerNivel || 1;
    var factorEficiencia = 1 - ((nivelTaller - 1) * 0.05); // 5% menos costo por nivel
    
    return Math.max(80, Math.round(costosBase * factorEficiencia));
}

function desglosarCostosOperativosPorCaso(total) {
    var costoTotal = typeof total === 'number' ? total : calcularCostosOperativosPorCaso();
    
    return {
        total: costoTotal,
        alquiler: Math.round(costoTotal * 0.35),
        electricidad: Math.round(costoTotal * 0.15),
        herramientas: Math.round(costoTotal * 0.20),
        administrativo: Math.round(costoTotal * 0.20),
        imprevistos: Math.round(costoTotal * 0.10)
    };
}

function crearResumenOperativoActualInicial() {
    return {
        ingresos: 0,
        perdidas: 0,
        gastosDetalle: crearDetalleGastosCasoInicial(),
        ingresosDetalle: crearDetalleIngresosCasoInicial(),
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
        ramificaciones: []
    };
}

function asegurarResumenDiaContable() {
    if (!window.resumenDia || typeof window.resumenDia !== 'object') {
        window.resumenDia = crearResumenOperativoActualInicial();
        return window.resumenDia;
    }

    var base = crearResumenOperativoActualInicial();
    Object.keys(base).forEach(function(key) {
        var baseVal = base[key];
        if (Array.isArray(baseVal)) {
            if (!Array.isArray(window.resumenDia[key])) window.resumenDia[key] = [];
            return;
        }
        if (baseVal && typeof baseVal === 'object') {
            if (!window.resumenDia[key] || typeof window.resumenDia[key] !== 'object') {
                window.resumenDia[key] = { ...baseVal };
                return;
            }
            Object.keys(baseVal).forEach(function(innerKey) {
                if (typeof window.resumenDia[key][innerKey] !== 'number') {
                    window.resumenDia[key][innerKey] = 0;
                }
            });
            return;
        }
        if (typeof window.resumenDia[key] !== typeof baseVal) {
            window.resumenDia[key] = baseVal;
        }
    });

    return window.resumenDia;
}

function modoCasosPuroActivo() {
    return !!(
        window.TallerApp &&
        window.TallerApp.mode &&
        window.TallerApp.mode.modoCasosPuro
    );
}

function estaModoSinCierreDia() {
    return modoCasosPuroActivo();
}

function estaCupoDiarioCompleto(casosEnProceso) {
    if (modoCasosPuroActivo()) return false;
    var activos = Math.max(0, Math.round(casosEnProceso || 0));
    var limite = Math.max(1, Math.round(window.CLIENTES_POR_DIA || 10));
    return Math.max(0, Math.round(window.clientesHoy || 0)) + activos >= limite;
}

function registrarIngresoDia(monto, categoria) {
    var valor = Math.max(0, Math.round(monto || 0));
    if (valor <= 0) return 0;

    var resumen = asegurarResumenDiaContable();
    var clave = (typeof categoria === 'string' && categoria.trim()) ? categoria.trim() : 'otros';
    if (typeof resumen.ingresosDetalle[clave] !== 'number') clave = 'otros';
    resumen.ingresos += valor;
    resumen.ingresosDetalle[clave] += valor;

    return valor;
}

function registrarGastoDia(monto, categoria) {
    var valor = Math.max(0, Math.round(monto || 0));
    if (valor <= 0) return 0;

    var resumen = asegurarResumenDiaContable();
    var clave = (typeof categoria === 'string' && categoria.trim()) ? categoria.trim() : 'otros';
    if (typeof resumen.gastosDetalle[clave] !== 'number') clave = 'otros';
    resumen.perdidas += valor;
    resumen.gastosDetalle[clave] += valor;

    return valor;
}

// ============================================
// ESTADO GLOBAL DE LA APLICACIÓN
// ============================================
window.TallerApp = window.TallerApp || {};
window.TallerApp.storage = window.TallerApp.storage || {};
window.TallerApp.storage.keys = window.TallerApp.storage.keys || {};

window.TallerApp.mode = {
    nivelesActivos: true,
    tiempoRealReparaciones: true,
    modoCasosPuro: true,           // Nuevo flag para modo basado solo en casos
    eventosEmergentesActivos: true
};

window.TallerApp.state = {
    // ===== SISTEMA DE PROGRESIÓN =====
    casos: {
        totalCasosJugados: 0,
        rachaCasosExitosos: 0,
        mejorRachaHistorica: 0
    },
    
    // ===== FINANZAS =====
    saldo: ECONOMY_DATA.saldoInicial || 2000,
    deuda: ECONOMY_DATA.deudaInicial || 100000,
    reputacion: ECONOMY_DATA.reputacionInicial || 50,
    cajaB: ECONOMY_DATA.cajaBInicial || 0,
    
    // ===== SISTEMA DE CRÉDITO Y MORA =====
    banco: {
        limiteCreditoBase: ECONOMY_DATA.limiteCreditoBase || 6000,
        limiteCreditoActual: ECONOMY_DATA.limiteCreditoBase || 6000,
        interesPrestamo: ECONOMY_DATA.interesPrestamoRapido || 0.12,
        casosSinPago: 0,
        morasAplicadas: 0,
        creditoUsado: 0,
        prestamosActivos: []
    },
    
    // ===== TALLER E INFRAESTRUCTURA =====
    tallerNivel: ECONOMY_DATA.tallerNivelInicial || 1,
    espaciosReparacionMax: ECONOMY_DATA.espaciosReparacionInicial || 2,
    espaciosReparacionOcupados: 0,
    mejoras: { ...(ECONOMY_DATA.mejorasIniciales || { herramientas: 0, publicidad: 0, capacitacion: 0, maquinaDiagnosis: false, autolavado: false }) },
    mejorasTacticas: { ...(ECONOMY_DATA.mejorasTacticasIniciales || { bateria: 0, manualHablar: false, scannerDx: false, flujoReparacion: false }) },
    
    // ===== CLIENTES =====
    clienteActual: null,
    clientesEnEspera: [],
    casosPendientesDiagnostico: [],
    casosAtendidos: [],
    casosFirmasUsadas: [],
    reparacionesActivas: [],
    maxColaEspera: ECONOMY_DATA.maxColaEspera || 5,
    historialClientes: {},
    
    // ===== MECÁNICOS =====
    mecanicos: (TALLER_DATA.mecanicosIniciales || []).map(m => ({ ...m })),
    mecanicosDisponibles: (TALLER_DATA.mecanicosDisponiblesBase || []).map(m => ({ ...m })),
    ultimoMecanicoAsignado: null,
    moralEquipo: ECONOMY_DATA.moralEquipoInicial || 50,
    
    // ===== INVENTARIO =====
    inventarioPiezas: [],
    repartidoresMax: 1,
    repartidoresStats: [],
    entregasPiezasActivas: [],
    
    // ===== NARRATIVA Y ESTADO =====
    lugarActual: 'Taller',
    historiaPrincipalIndice: 0,
    arcoNarrativoActual: null,
    arcosCumplidos: [],
    nivelesNarrativaDesbloqueados: [],
    eventoNarrativoActivo: null,
    eventosNarrativosPendientes: [],
    
    // ===== ESTADÍSTICAS Y PROGRESO =====
    resumenCasos: crearResumenCasosInicial(),
    ritmoTaller: crearRitmoTallerInicial(),
    decisionesHistoria: crearDecisionesHistoriaInicial(),
    tramaEstado: crearTramaEstadoInicial(),
    misiones: crearMisionesInicial(),
    
    // ===== JUGADOR =====
    nivelJugador: 1,
    progresoNivel: 0,
    progresoNivelMeta: 120,
    experienciaAcumulada: 0,
    ahorroAcumulado: 0,
    
    // ===== ESTADO DE INTERFAZ =====
    juegoPausado: false,
    tiradaEnCurso: false,
    tiradaInterval: null,
    tabMovilActiva: 'taller',
    tutorialMostrado: false,
    
    // ===== EVENTOS ESPECIALES =====
    stewartStatus: 'ninguno',
    exRelacion: 50,
    cajaBCalor: 0,
    cajaBUltimoControlInspectorCasos: 0,
    inspectorProximoCaso: 0,
    
    // ===== SISTEMA DE GUARDADO =====
    saveKey: window.TallerApp.storage.keys.save || ECONOMY_DATA.saveKey || 'taller_casos_world_save_v2',
    optionsKey: window.TallerApp.storage.keys.options || ECONOMY_DATA.optionsKey || 'taller_casos_world_options_v2'
};

// ============================================
// HELPERS Y UTILIDADES
// ============================================
window.TallerApp.helpers = {
    // Funciones de contabilidad
    crearResumenCasosInicial,
    crearResumenOperativoActualInicial,
    crearDetalleGastosCasoInicial,
    crearDetalleIngresosCasoInicial,
    asegurarResumenCasosContable,
    asegurarResumenDiaContable,
    registrarGastoCaso,
    registrarIngresoCaso,
    registrarGastoDia,
    registrarIngresoDia,
    finalizarCaso,
    nuevoCaso,
    crearRitmoTallerInicial,
    asegurarRitmoTaller,
    registrarRitmoTallerPorCierre,
    aplicarRitmoTallerACliente,
    obtenerBonosRitmoTaller,
    obtenerResumenRitmoTaller,
    
    // Funciones de narrativa
    crearDecisionesHistoriaInicial,
    crearTramaEstadoInicial,
    crearMisionDiaInicial,
    crearMisionesInicial,
    
    // Funciones operativas
    calcularCostosOperativosPorCaso,
    desglosarCostosOperativosPorCaso,
    
    // Utilidades de estado
    obtenerTramaDinamica: function() {
        return obtenerTramaDinamicaCaso();
    },
    obtenerHistoriaCierreDinamica: function() {
        return obtenerHistoriaCierreDinamica();
    }
};

window.modoCasosPuroActivo = modoCasosPuroActivo;
window.estaModoSinCierreDia = estaModoSinCierreDia;
window.estaCupoDiarioCompleto = estaCupoDiarioCompleto;
window.asegurarRitmoTaller = asegurarRitmoTaller;
window.registrarRitmoTallerPorCierre = registrarRitmoTallerPorCierre;
window.aplicarRitmoTallerACliente = aplicarRitmoTallerACliente;
window.obtenerBonosRitmoTaller = obtenerBonosRitmoTaller;
window.obtenerResumenRitmoTaller = obtenerResumenRitmoTaller;

// ============================================
// CONFIGURACIÓN GLOBAL
// ============================================
window.TallerApp.config = {
    maxColaEspera: ECONOMY_DATA.maxColaEspera || 5,
    casosSimultaneos: ECONOMY_DATA.casosSimultaneos || 2,
    
    // Límites bancarios
    bancoLimiteCreditoBase: ECONOMY_DATA.limiteCreditoBase || 6000,
    bancoLimiteCreditoMin: ECONOMY_DATA.limiteCreditoMin || 6000,
    bancoLimiteCreditoMax: ECONOMY_DATA.limiteCreditoMax || 12000,
    bancoInteresPrestamoRapido: ECONOMY_DATA.interesPrestamoRapido || 0.12,
    
    // Mora
    bancoMoraCasosUmbral: ECONOMY_DATA.moraCasosSinPagoUmbral || 4,
    bancoMoraMinimaFlujo: ECONOMY_DATA.moraMinimaFlujo || 450,
    bancoTasaMoraFlujo: ECONOMY_DATA.tasaMoraFlujo || 0.012,
    
    // Guardado
    saveKey: window.TallerApp.storage.keys.save || ECONOMY_DATA.saveKey || 'taller_casos_world_save_v2',
    optionsKey: window.TallerApp.storage.keys.options || ECONOMY_DATA.optionsKey || 'taller_casos_world_options_v2',
    storageKeys: window.TallerApp.storage.keys
};

// ============================================
// PROXY PARA VARIABLES GLOBALES (compatibilidad)
// ============================================
Object.keys(window.TallerApp.state).forEach(function(key) {
    Object.defineProperty(window, key, {
        configurable: true,
        enumerable: true,
        get: function() {
            return window.TallerApp.state[key];
        },
        set: function(value) {
            window.TallerApp.state[key] = value;
        }
    });
});

// ============================================
// FUNCIONES DE NARRATIVA DINÁMICA
// ============================================
function obtenerTramaDinamicaCaso() {
    var arcos = (window.TallerData && window.TallerData.arcoNarrativo) || [];
    var arcoObj = arcos.find(function(a) { return a.id === arcoNarrativoActual; });
    var casosTotal = resumenCasos.totalCasosJugados || 0;
    var historiaBase = Array.isArray(window.TallerData && window.TallerData.historiaPrincipal)
        ? window.TallerData.historiaPrincipal
        : (typeof historiaPrincipal !== 'undefined' && Array.isArray(historiaPrincipal)
            ? historiaPrincipal
            : []);
    var rachaActual = (resumenCasos && typeof resumenCasos.rachaCasosExitosos === 'number')
        ? resumenCasos.rachaCasosExitosos
        : (typeof rachaCasosExitosos !== 'undefined' ? Number(rachaCasosExitosos) || 0 : 0);
    
    // Base del arco o historia principal
    var base = (arcoObj && arcoObj.descripcion) || 
               (historiaBase.length ? historiaBase[historiaPrincipalIndice % historiaBase.length] : '') || 
               'El taller sigue funcionando. Cada caso cuenta.';
    
    var piezas = [];
    
    // Presión financiera
    if (saldo < 500 && saldo >= 0) piezas.push('La caja está justa. Un caso difícil podría ser problema.');
    else if (saldo > 8000) piezas.push('La caja respira bien. Podrías invertir en mejoras.');
    
    // Deuda
    if (deuda > 50000) piezas.push('La deuda sigue siendo pesada. El juicio no perdona.');
    else if (deuda < 10000) piezas.push('La deuda está controlada. El horizonte se ve más claro.');
    
    // Presión legal
    if (tramaEstado && tramaEstado.inspectorGolpes > 0) {
        piezas.push(`Llevas ${tramaEstado.inspectorGolpes} inspección(es) pendiente(s).`);
    }
    if (cajaBCalor >= 50) {
        piezas.push('La caja B empieza a oler. Cuidado con el inspector.');
    }
    
    // Relación con ex
    if (exRelacion < 30) {
        piezas.push('Tu ex sigue presionando. Ese frente legal no se cierra.');
    }
    
    // Estado del equipo
    var mecanicosCansados = (mecanicos || []).filter(function(m) { 
        return m.descansoNecesario === true; 
    }).length;
    
    if (mecanicosCansados >= 2) {
        piezas.push(`${mecanicosCansados} mecánico(s) necesitan descanso. La fatiga trae errores.`);
    }
    
    if (moralEquipo < 40) {
        piezas.push('El ambiente está tenso. Una chispa y estalla un conflicto.');
    }
    
    // Racha
    if (rachaActual >= 5) {
        piezas.push(`¡Vas ${rachaActual} casos seguidos! El equipo está motivado.`);
    }
    
    if (!piezas.length) return base;
    return `${base} ${piezas.slice(0, 3).join(' ')}`.trim();
}

function obtenerTramaDinamicaDia() {
    return obtenerTramaDinamicaCaso();
}

window.obtenerTramaDinamicaDia = obtenerTramaDinamicaDia;
window.obtenerTramaDinamicaCaso = obtenerTramaDinamicaCaso;

function obtenerHistoriaCierreDinamica() {
    var arcos = (window.TallerData && window.TallerData.arcoNarrativo) || [];
    var arcoObj = arcos.find(function(a) { return a.id === arcoNarrativoActual; });
    var base = (arcoObj && arcoObj.textoCierre) || 'Caso cerrado. El taller sigue.';
    var rachaActual = (resumenCasos && typeof resumenCasos.rachaCasosExitosos === 'number')
        ? resumenCasos.rachaCasosExitosos
        : (typeof rachaCasosExitosos !== 'undefined' ? Number(rachaCasosExitosos) || 0 : 0);
    
    var notas = [];
    
    if (resumenCasos.ultimoCaso.beneficioNeto > 1000) {
        notas.push('Buena ganancia en este caso.');
    } else if (resumenCasos.ultimoCaso.beneficioNeto < -200) {
        notas.push('Este caso dejó pérdidas. A recuperarse.');
    }
    
    if (resumenCasos.estadisticas.reparacionesExitosas % 10 === 0 && resumenCasos.estadisticas.reparacionesExitosas > 0) {
        notas.push(`¡${resumenCasos.estadisticas.reparacionesExitosas} reparaciones exitosas!`);
    }
    
    if (rachaActual >= 3) {
        notas.push(`Llevas ${rachaActual} casos perfectos. Sigue así.`);
    }
    
    if (!notas.length) return base;
    return `${base} ${notas.join(' ')}`.trim();
}

// ============================================
// EXPORTAR FUNCIONES GLOBALES
// ============================================
window.nuevoCaso = nuevoCaso;
window.finalizarCaso = finalizarCaso;
window.registrarGastoCaso = registrarGastoCaso;
window.registrarIngresoCaso = registrarIngresoCaso;
window.obtenerRachaCasosActual = obtenerRachaCasosActual;
window.calcularMetaNivel = calcularMetaNivel;
window.sincronizarEstadoProgresoJugador = sincronizarEstadoProgresoJugador;
window.registrarProgresoNivel = registrarProgresoNivel;
