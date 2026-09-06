function notificarSistemaTaller(titulo, cuerpo, tag, dataExtra) {
    var appEnSegundoPlano = typeof document !== 'undefined' && document.visibilityState === 'hidden';
    if (!appEnSegundoPlano) return;
    if (typeof window === 'undefined' || typeof window.enviarNotificacionSistema !== 'function') return;

    window.enviarNotificacionSistema(String(titulo || 'Taller World'), {
        body: String(cuerpo || ''),
        tag: String(tag || 'tw-notificacion'),
        data: Object.assign({ url: './', screen: 'taller' }, dataExtra || {})
    }).catch(function() {});
}

function asegurarEstadoLogisticaPiezas() {
    if (typeof repartidoresMax !== 'number' || repartidoresMax < 1) repartidoresMax = 1;
    if (!Array.isArray(entregasPiezasActivas)) entregasPiezasActivas = [];
}

function contarRepartidoresOcupados() {
    asegurarEstadoLogisticaPiezas();
    return entregasPiezasActivas.filter(function(entrega) {
        return entrega && typeof entrega.etaRestante === 'number' && entrega.etaRestante > 0;
    }).length;
}

function obtenerRepartidoresDisponibles() {
    asegurarEstadoLogisticaPiezas();
    return Math.max(0, repartidoresMax - contarRepartidoresOcupados());
}

function asegurarStatsRepartidores() {
    if (!Array.isArray(repartidoresStats)) repartidoresStats = [];
    var total = Math.max(1, Math.round(repartidoresMax || 1));
    for (var i = 0; i < total; i++) {
        if (!repartidoresStats[i] || typeof repartidoresStats[i] !== 'object') {
            repartidoresStats[i] = { nivel: 1, xp: 0 };
        }
        if (typeof repartidoresStats[i].nivel !== 'number') repartidoresStats[i].nivel = 1;
        if (typeof repartidoresStats[i].xp !== 'number') repartidoresStats[i].xp = 0;
        repartidoresStats[i].nivel = Math.max(1, Math.round(repartidoresStats[i].nivel));
        repartidoresStats[i].xp = Math.max(0, Math.round(repartidoresStats[i].xp));
    }
}

function xpSiguienteNivelDelivery(nivelActual) {
    var nivel = Math.max(1, Math.round(nivelActual || 1));
    return Math.max(3, Math.round(3 + ((nivel - 1) * 3)));
}

function obtenerStatsRepartidor(slotIndex) {
    asegurarStatsRepartidores();
    var total = Math.max(1, Math.round(repartidoresMax || 1));
    var idx = Math.max(0, Math.min(total - 1, Math.round(slotIndex || 0)));
    return repartidoresStats[idx];
}

function obtenerSlotsDeliveryOcupados() {
    asegurarEstadoLogisticaPiezas();
    var ocupados = new Set();
    (entregasPiezasActivas || []).forEach(function(entrega) {
        if (!entrega || typeof entrega.slotDelivery !== 'number') return;
        if (typeof entrega.etaRestante === 'number' && entrega.etaRestante > 0) {
            ocupados.add(Math.max(0, Math.round(entrega.slotDelivery)));
        }
    });
    return ocupados;
}

function resolverSlotDeliveryDisponible(slotPreferido) {
    var total = Math.max(1, Math.round(repartidoresMax || 1));
    var ocupados = obtenerSlotsDeliveryOcupados();
    if (typeof slotPreferido === 'number') {
        var idxPreferido = Math.max(0, Math.min(total - 1, Math.round(slotPreferido)));
        if (!ocupados.has(idxPreferido)) return idxPreferido;
    }
    for (var i = 0; i < total; i++) {
        if (!ocupados.has(i)) return i;
    }
    return -1;
}

function ganarXpDelivery(slotIndex, cantidad) {
    if (typeof slotIndex !== 'number' || slotIndex < 0 || cantidad <= 0) return false;
    var stats = obtenerStatsRepartidor(slotIndex);
    if (!stats) return false;
    stats.xp = Math.max(0, Math.round((stats.xp || 0) + cantidad));
    var subioNivel = false;
    while ((stats.nivel || 1) < 10) {
        var meta = xpSiguienteNivelDelivery(stats.nivel || 1);
        if ((stats.xp || 0) < meta) break;
        stats.xp -= meta;
        stats.nivel = Math.min(10, (stats.nivel || 1) + 1);
        subioNivel = true;
    }
    if (subioNivel) {
        log('Delivery ' + (slotIndex + 1) + ' subio a nivel ' + stats.nivel + '.', 'ok');
    }
    return true;
}

function obtenerEntregaPiezasActivaPorCaso(idCaso) {
    asegurarEstadoLogisticaPiezas();
    var clave = String(idCaso || '').trim();
    if (!clave) return null;
    return entregasPiezasActivas.find(function(entrega) {
        return entrega && entrega.idCaso === clave;
    }) || null;
}

function obtenerFactorVelocidadDelivery(slotIndex) {
    var bonusFlujo = (mejorasTacticas && mejorasTacticas.flujoReparacion) ? 0.1 : 0;
    var bonusNivelTaller = Math.max(0, (Math.max(1, Math.round(tallerNivel || 1)) - 1) * 0.02);
    var bonusNivelDelivery = 0;
    if (typeof slotIndex === 'number' && slotIndex >= 0) {
        var stats = obtenerStatsRepartidor(slotIndex);
        bonusNivelDelivery = Math.max(0, ((stats && stats.nivel) ? (stats.nivel - 1) : 0) * 0.035);
    }
    var factor = 1 - bonusFlujo - bonusNivelTaller - bonusNivelDelivery;
    return Math.max(0.65, Math.min(1, factor));
}

function calcularEtaDelivery(totalPiezas, slotIndex) {
    var piezas = Math.max(1, Math.round(totalPiezas || 1));
    var base = Math.max(7, Math.round(7 + (piezas * 2.4) + (Math.random() * 4)));
    base = escalarTiempoBaseOperacion(base, 'delivery');
    var eta = Math.max(4, Math.round(base * obtenerFactorVelocidadDelivery(slotIndex)));
    return eta;
}

function obtenerDuracionTrabajoTiempoRealSeg(unidades, usarUnidadDirecta) {
    if (typeof convertirDuracionTrabajoATiempoRealSeg === 'function') {
        return Math.max(1, Math.round(convertirDuracionTrabajoATiempoRealSeg(unidades, usarUnidadDirecta)));
    }
    var total = Math.max(0, Math.round(Number(unidades) || 0));
    if (usarUnidadDirecta) return Math.max(1, total);
    return Math.max(1, total * Math.max(1, Math.round(autoTurnoCadaSeg || 1)));
}

function formatearEstimadoTrabajoTiempoReal(unidades, usarUnidadDirecta) {
    var totalSeg = obtenerDuracionTrabajoTiempoRealSeg(unidades, usarUnidadDirecta);
    if (typeof formatearDuracionSegundos === 'function') {
        return formatearDuracionSegundos(totalSeg);
    }
    return formatearTiempoTrabajo(unidades);
}

function escalarTiempoBaseOperacion(base, tipo) {
    var numero = Math.max(1, Number(base) || 1);
    var clave = String(tipo || 'reparacion').toLowerCase();
    var factor = 1.55;
    if (clave === 'diagnostico') factor = 1.65;
    if (clave === 'delivery') factor = 1.75;
    return Math.max(1, Math.round(numero * factor));
}

function programarEntregaPiezasReparacion(idCaso) {
    asegurarEstadoLogisticaPiezas();
    var clave = String(idCaso || '').trim();
    if (!clave) {
        log('No se pudo programar delivery: caso invalido.', 'error');
        return false;
    }

    var rep = (reparacionesActivas || []).find(function(r) {
        return r && r.idCaso === clave;
    });
    if (!rep || !rep.pausadaPorPieza) {
        log('Ese caso no esta esperando piezas para delivery.', 'error');
        return false;
    }

    var entregaExistente = obtenerEntregaPiezasActivaPorCaso(clave);
    if (entregaExistente) {
        log(`Ya hay un delivery en camino para ${clave}. ETA ${formatearEstimadoTrabajoTiempoReal(Math.max(0, entregaExistente.etaRestante || 0), false)}.`, 'info');
        return false;
    }

    if (obtenerRepartidoresDisponibles() <= 0) {
        log('Todos los repartidores estan ocupados. Contrata otro o espera una entrega.', 'error');
        if (typeof mostrarFeedbackGameplay === 'function') {
            mostrarFeedbackGameplay('Sin repartidores libres para ese delivery.', 'warn');
        }
        return false;
    }

    var requeridas = Array.isArray(rep.piezasContinuacionRequeridas) && rep.piezasContinuacionRequeridas.length
        ? rep.piezasContinuacionRequeridas.slice()
        : [{ id: '', nombre: rep.piezaRequeridaNombre || `pieza de ${rep.especialidadIdeal}`, especialidad: rep.especialidadIdeal, calidad: 'estandar' }];
    var usadas = [];
    var faltantes = [];

    requeridas.forEach(function(req) {
        var idxInv = -1;
        if (req.id) {
            idxInv = inventarioPiezas.findIndex(function(p, i) {
                return p && !p.instalada && p.id === req.id && usadas.indexOf(i) < 0;
            });
        }
        if (idxInv < 0) {
            idxInv = inventarioPiezas.findIndex(function(p, i) {
                return p && !p.instalada && p.especialidad === req.especialidad && usadas.indexOf(i) < 0;
            });
        }
        if (idxInv < 0) {
            faltantes.push(req.nombre || `pieza de ${req.especialidad || rep.especialidadIdeal}`);
            return;
        }
        usadas.push(idxInv);
    });

    if (faltantes.length) {
        log(`No puedes pedir delivery: faltan ${faltantes.join(', ')} en inventario.`, 'error');
        if (typeof mostrarFeedbackGameplay === 'function') {
            mostrarFeedbackGameplay(`Faltan piezas: ${faltantes.join(', ')}.`, 'error');
        }
        return false;
    }

    var etaBase = calcularEtaDelivery(requeridas.length);
    var etaRealSeg = obtenerDuracionTrabajoTiempoRealSeg(etaBase, false);
    var entrega = {
        idEntrega: `DEL-${Date.now()}-${Math.floor(Math.random() * 900) + 100}`,
        idCaso: clave,
        mecanicoNombre: rep.mecanicoNombre || 'Mecanico',
        piezasTexto: requeridas.map(function(p) { return p.nombre; }).join(', '),
        etaRestante: etaBase,
        etaTotal: etaBase,
        duracionRealSeg: etaRealSeg,
        segundosPendientesReal: etaRealSeg,
        ultimoTiempoSyncMs: Date.now()
    };
    entregasPiezasActivas.push(entrega);

    actualizarCasoAtendido(rep, 'esperando_entrega', `Delivery en camino para ${rep.mecanicoNombre}: ${entrega.piezasTexto} (ETA ${formatearEstimadoTrabajoTiempoReal(etaBase, false)}).`);
    log(`Delivery solicitado para ${clave}: ${entrega.piezasTexto}. ETA ${formatearEstimadoTrabajoTiempoReal(etaBase, false)}.`, 'info');
    if (typeof mostrarFeedbackGameplay === 'function') {
        mostrarFeedbackGameplay(`Delivery en camino para ${rep.mecanicoNombre}.`, 'ok');
    }
    if (typeof registrarEventoNarrativo === 'function') {
        registrarEventoNarrativo('delivery_usado', {
            idCaso: clave,
            piezas: requeridas.length,
            especialidad: rep.especialidadIdeal || ''
        });
    }
    if (typeof actualizarUI === 'function') actualizarUI();
    return true;
}

function procesarEntregasPiezasActivas() {
    asegurarEstadoLogisticaPiezas();
    if (!entregasPiezasActivas.length) return;

    var pendientes = [];
    entregasPiezasActivas.forEach(function(entrega) {
        if (typeof normalizarEntregaPiezaActiva === 'function') {
            entrega = normalizarEntregaPiezaActiva(entrega);
        }
        if (!entrega || !entrega.idCaso) return;
        var rep = (reparacionesActivas || []).find(function(r) {
            return r && r.idCaso === entrega.idCaso;
        });
        if (typeof normalizarReparacionActiva === 'function' && rep) {
            rep = normalizarReparacionActiva(rep);
        }
        if (!rep || !rep.pausadaPorPieza) {
            return;
        }
        if (typeof sincronizarTiempoDeliveryReal === 'function') {
            entrega = sincronizarTiempoDeliveryReal(entrega);
        }

        if (entrega.etaRestante <= 0) {
            var entregaCompletada = false;
            if (Array.isArray(entrega.piezasCompradas) && entrega.piezasCompradas.length) {
                entregaCompletada = !!completarEntregaConPiezasCompradas(rep, entrega);
            } else {
                var okInstalada = instalarPiezaContinuacionReparacion(entrega.idCaso, true);
                if (okInstalada) {
                    entregaCompletada = true;
                    log(`Delivery completado para ${entrega.idCaso}. ${rep.mecanicoNombre || 'Mecanico'} retoma el caso.`, 'exito');
                    if (typeof mostrarFeedbackGameplay === 'function') {
                        mostrarFeedbackGameplay(`Delivery completado: ${entrega.idCaso}.`, 'ok');
                    }
                    notificarSistemaTaller(
                        'Delivery completado',
                        `${entrega.idCaso || 'CASO'} recibio piezas y ${rep.mecanicoNombre || 'mecanico'} retoma el trabajo.`,
                        `tw-delivery-${entrega.idCaso || ''}`,
                        { caseId: entrega.idCaso || '', mechanic: rep.mecanicoNombre || '' }
                    );
                }
            }
            if (entregaCompletada && typeof entrega.slotDelivery === 'number') {
                var xpDelivery = (entrega.piezasCompradas && entrega.piezasCompradas.length > 1) ? 2 : 1;
                ganarXpDelivery(entrega.slotDelivery, xpDelivery);
                rep.xpDeliveryGanada = Math.max(0, Math.round((rep.xpDeliveryGanada || 0) + xpDelivery));
            }
            return;
        }
        pendientes.push(entrega);
    });

    entregasPiezasActivas = pendientes;
}

function completarEntregaConPiezasCompradas(rep, entrega) {
    if (!rep || !entrega || !Array.isArray(entrega.piezasCompradas)) return false;
    var piezasEntregadas = entrega.piezasCompradas.map(function(p) {
        return { id: p.id || '', nombre: p.nombre, calidad: p.calidad || 'estandar', especialidad: p.especialidad, costo: p.costo || 0 };
    });
    rep.piezasContinuacionEntregadas = piezasEntregadas;
    rep.piezaContinuacionInstalada = true;


    // Rama post-diagnostico: piezas compradas desde la tienda y se arranca reparacion automatica
    if (rep.tipoTrabajo === 'pedir_piezas') {
        var casoRef = rep.casoRef || null;
        var mecAuto = (mecanicos || []).find(function(mx) {
            return mx && mx.nombre === rep.mecanicoNombre;
        }) || null;

        var casoPago = Math.max(0, Math.round((casoRef && casoRef.pago) || rep.pagoAcordado || 900));
        var dificultad = Math.max(0, Math.min(1, (casoRef && casoRef.dificultad) || 0.55));
        var bonusEspecialidad = (casoRef && mecAuto && casoRef.especialidadIdeal === mecAuto.especialidad) ? 0.12 : 0;
        var bonusEficiencia = (mecAuto && typeof calcularEficienciaEfectiva === 'function')
            ? ((calcularEficienciaEfectiva(mecAuto) - 0.5) * 0.18)
            : 0;
        var penalEnojo = Math.max(0, (((mecAuto && mecAuto.enojo) || 0) * 0.06));
        var bonusDx = (casoRef && casoRef.diagnosticoNivel === 'critico') ? 0.1 : (casoRef && casoRef.diagnosticoNivel === 'parcial' ? 0.04 : -0.08);
        var bonusCalidadPiezas = piezasEntregadas.reduce(function(acc, p) {
            if (!p) return acc;
            if (p.calidad === 'premium') return acc + 0.05;
            if (p.calidad === 'estandar') return acc + 0.02;
            return acc - 0.01;
        }, 0);
        var prob = ((mecAuto && mecAuto.habilidad) || 0.5)
            + bonusEspecialidad
            + bonusEficiencia
            + bonusDx
            + bonusCalidadPiezas
            - penalEnojo
            - (dificultad * 0.22);
        prob = Math.max(0.08, Math.min(0.95, prob));
        var resultadoOculto = resolverTiradaOcultaReparacion(prob);
        var nivelResultado = (resultadoOculto === 'fallo_total') ? 'fallo' : resultadoOculto;
        var exito = nivelResultado !== 'fallo';

        var bonusFlujoTiempo = (mejorasTacticas && mejorasTacticas.flujoReparacion) ? (1 + (tallerNivel >= 3 ? 1 : 0)) : 0;
        var bonusPiezaTiempo = Math.max(0, piezasEntregadas.filter(function(p) { return p && p.calidad === 'premium'; }).length);
        var tiempoReparacion = (typeof modoNivelesActivo === 'function' && modoNivelesActivo())
            ? calcularTiempoTrabajoReal(casoRef || rep, mecAuto || { habilidad: 0.5, enojo: 0, especialidad: '' }, 0, bonusPiezaTiempo, bonusFlujoTiempo, 0.92)
            : Math.max(3, Math.round(escalarTiempoBaseOperacion((((casoRef && casoRef.tiempo) || rep.tiempoTotal || 6) * 1.2) + (dificultad * 2.4), 'reparacion') - bonusPiezaTiempo - bonusFlujoTiempo));

        var ganancia = 0;
        var perdida = 0;
        if (nivelResultado === 'critico') {
            ganancia = Math.max(240, Math.round(casoPago * (1.12 + (bonusCalidadPiezas * 0.35))));
        } else if (nivelResultado === 'parcial') {
            ganancia = Math.max(200, Math.round(casoPago * (0.58 + (bonusCalidadPiezas * 0.2))));
        } else {
            perdida = Math.max(160, Math.round(casoPago * 0.34));
        }

        if (casoRef) {
            casoRef.piezasPreCompradas = piezasEntregadas;
            casoRef.piezasPreCompradasCosto = piezasEntregadas.reduce(function(a, p) { return a + (p.costo || 0); }, 0);
            casoRef.aprobacionCliente = true;
            casoRef.aprobadoCliente = true;
            casoRef.negociado = true;
        }

        rep.tipoTrabajo = 'reparacion';
        rep.pausadaPorPieza = false;
        rep.requierePiezaContinuacion = false;
        rep.piezaContinuacionSolicitada = true;
        rep.piezaContinuacionInstalada = true;
        rep.listoParaCobro = false;
        rep.resultadoVisible = false;
        rep.cobroProcesado = false;
        rep.tiempoTotal = tiempoReparacion;
        rep.tiempoRestante = tiempoReparacion;
        rep.duracionRealSeg = obtenerDuracionTrabajoTiempoRealSeg(
            tiempoReparacion,
            typeof modoNivelesActivo === 'function' && modoNivelesActivo(),
        );
        rep.segundosPendientesReal = rep.duracionRealSeg;
        rep.segundosTotalesReal = rep.duracionRealSeg;
        rep.ultimoTiempoSyncMs = Date.now();
        rep.resultadoOculto = (nivelResultado === 'fallo') ? 'fallo' : nivelResultado;
        rep.nivelResultado = nivelResultado;
        rep.exito = exito;
        rep.ganancia = ganancia;
        rep.perdida = perdida;
        rep.subtituloResultado = 'Reparacion iniciada tras entrega de piezas de tienda.';
        rep.pagoAcordado = casoPago;

        if (mecAuto) {
            mecAuto.ocupado = true;
            mecAuto.enfriamientoTurnos = tiempoReparacion;
        }

        actualizarCasoAtendido(casoRef || rep, 'en_reparacion',
            'Delivery completado: ' + piezasEntregadas.map(function(p) { return p.nombre; }).join(', ') + '. ' + (rep.mecanicoNombre || 'Mecanico') + ' reinicia y entra a reparar (' + formatearTiempoTrabajo(tiempoReparacion) + ').');
        log('Delivery completado para ' + (rep.idCaso || 'CASO-0000') + '. ' + (rep.mecanicoNombre || 'Mecanico') + ' reinicio y arranco reparacion.', 'exito');
        if (typeof mostrarFeedbackGameplay === 'function') {
            mostrarFeedbackGameplay('Delivery listo: ' + (rep.mecanicoNombre || 'Mecanico') + ' ya esta reparando ' + (rep.idCaso || 'CASO-0000') + '.', 'ok');
        }
        if (typeof actualizarUI === 'function') actualizarUI();
        return true;
    }

    rep.pausadaPorPieza = false;
    if (typeof ajustarTrabajoActivoSegundos === 'function') {
        ajustarTrabajoActivoSegundos(rep, -obtenerDuracionTrabajoTiempoRealSeg(1, typeof modoNivelesActivo === 'function' && modoNivelesActivo()));
    } else {
        rep.tiempoRestante = Math.max(1, (rep.tiempoRestante || 1) - 1);
    }

    var totalCalidad = Math.max(1, piezasEntregadas.length);
    var premium = piezasEntregadas.filter(function(p) { return p.calidad === 'premium'; }).length;
    var estandar = piezasEntregadas.filter(function(p) { return p.calidad === 'estandar'; }).length;
    var basica = piezasEntregadas.filter(function(p) { return p.calidad === 'basica'; }).length;
    var scoreCalidad = ((premium * 2) + estandar - (basica * 0.5)) / totalCalidad;
    var chanceFalloParcial = Math.max(0.12, Math.min(0.78, 0.28 + (scoreCalidad * 0.18)));
    var chanceParcialCritico = Math.max(0.08, Math.min(0.62, 0.18 + (scoreCalidad * 0.14)));

    if (rep.resultadoOculto === 'fallo' && Math.random() < chanceFalloParcial) {
        rep.resultadoOculto = 'parcial';
        rep.nivelResultado = 'parcial';
        rep.exito = true;
        rep.ganancia = Math.max(240, Math.round((rep.perdida || 0) * 0.6));
        rep.perdida = 0;
    } else if (rep.resultadoOculto === 'parcial' && Math.random() < chanceParcialCritico) {
        rep.resultadoOculto = 'critico';
        rep.nivelResultado = 'critico';
        rep.exito = true;
        rep.ganancia = Math.max(rep.ganancia || 0, Math.round((rep.ganancia || 800) * 1.22));
    }
    aplicarBalanceEconomicoReparacion(rep);
    var nombPiezas = piezasEntregadas.map(function(p) { return p.nombre; }).join(', ');
    actualizarCasoAtendido(rep, 'en_reparacion', 'Piezas entregadas (' + nombPiezas + '). ' + (rep.mecanicoNombre || 'Mecanico') + ' retoma el trabajo.');
    log('Delivery completado para ' + rep.idCaso + ': ' + nombPiezas + '. ' + (rep.mecanicoNombre || 'Mecanico') + ' continua.', 'exito');
    if (typeof mostrarFeedbackGameplay === 'function') {
        mostrarFeedbackGameplay('Piezas llegaron para ' + (rep.mecanicoNombre || 'el mecanico') + '. Reparacion reanudada.', 'ok');
    }
    if (typeof actualizarUI === 'function') actualizarUI();
    return true;
}

function iniciarPedidoPiezasConDelivery(idCaso, slotDelivery) {
    asegurarEstadoLogisticaPiezas();
    var clave = String(idCaso || '').trim();
    if (!clave) { log('Caso invalido para pedido de piezas.', 'error'); return false; }
    var rep = (reparacionesActivas || []).find(function(r) { return r && r.idCaso === clave; });
    if (!rep || !rep.pausadaPorPieza) {
        log('Ese caso no esta esperando piezas.', 'error');
        return false;
    }
    if (rep.tipoTrabajo === 'pedir_piezas') {
        var casoPedido = rep.casoRef && typeof rep.casoRef === 'object' ? rep.casoRef : null;
        if (!casoPedido || !casoPedido.diagnosticado || !casoPedido.aprobacionCliente) {
            log('El caso debe tener diagnostico revisado y aprobacion antes de pedir piezas.', 'error');
            if (typeof mostrarFeedbackGameplay === 'function') {
                mostrarFeedbackGameplay('Pedido bloqueado: falta revisar el diagnostico o conseguir aprobacion.', 'warn');
            }
            return false;
        }
    }
    if (obtenerEntregaPiezasActivaPorCaso(clave)) {
        log('Ya hay un delivery en camino para ese caso.', 'info');
        if (typeof mostrarFeedbackGameplay === 'function') mostrarFeedbackGameplay('No hay delivery disponible para otro pedido: ya tienes uno en camino.', 'warn');
        return false;
    }
    if (rep.pedidoPendienteDelivery) {
        if (typeof mostrarFeedbackGameplay === 'function') mostrarFeedbackGameplay('Ya hay un pedido pendiente. Confirma el pago o cancela primero.', 'info');
        return true;
    }
    if (obtenerRepartidoresDisponibles() <= 0) {
        log('Sin repartidores disponibles.', 'error');
        if (typeof mostrarFeedbackGameplay === 'function') mostrarFeedbackGameplay('Sin repartidores libres.', 'warn');
        return false;
    }
    var requeridas = Array.isArray(rep.piezasContinuacionRequeridas) && rep.piezasContinuacionRequeridas.length
        ? rep.piezasContinuacionRequeridas
        : [{ id: '', nombre: rep.piezaRequeridaNombre || ('pieza de ' + (rep.especialidadIdeal || 'general')), especialidad: rep.especialidadIdeal, calidad: 'estandar' }];
    var piezasConCosto = requeridas.map(function(p) {
        var costo = p.id ? obtenerCostoCatalogoRepuesto(p.id) : 0;
        if (!costo) {
            var item = (ECONOMY_DATA.catalogoRepuestos || []).find(function(c) {
                return c && c.especialidad === (p.especialidad || rep.especialidadIdeal) && c.calidad === (p.calidad || 'estandar');
            });
            costo = item ? item.costo : 400;
        }
        return { id: p.id || '', nombre: p.nombre, especialidad: p.especialidad || rep.especialidadIdeal, calidad: p.calidad || 'estandar', costo: costo };
    });
    var costoTotal = piezasConCosto.reduce(function(acc, p) { return acc + (p.costo || 0); }, 0);
    rep.pedidoPendienteDelivery = {
        piezas: piezasConCosto,
        costoTotal: costoTotal,
        slotDelivery: (typeof slotDelivery === 'number' ? Math.max(0, Math.round(slotDelivery)) : null)
    };
    if (typeof actualizarUI === 'function') actualizarUI();
    var listaNombres = piezasConCosto.map(function(p) { return p.nombre; }).join(', ');
    log('Pedido preparado para ' + clave + ': ' + listaNombres + ' = RD$' + costoTotal + '. Confirma el pago para enviar delivery.', 'info');
    if (typeof mostrarFeedbackGameplay === 'function') {
        mostrarFeedbackGameplay('Pedido listo: RD$' + costoTotal + '. Confirma para enviar delivery.', 'warn');
    }
    return true;
}

function confirmarPagarDelivery(idCaso) {
    asegurarEstadoLogisticaPiezas();
    var clave = String(idCaso || '').trim();
    var rep = (reparacionesActivas || []).find(function(r) { return r && r.idCaso === clave; });
    if (!rep || !rep.pedidoPendienteDelivery) {
        log('No hay pedido pendiente para ese caso.', 'error');
        return false;
    }
    var pedido = rep.pedidoPendienteDelivery;
    var costoTotal = pedido.costoTotal || 0;
    if ((typeof saldo !== 'number' ? 0 : saldo) < costoTotal) {
        log('Fondos insuficientes: necesitas RD$' + costoTotal + '.', 'error');
        if (typeof mostrarFeedbackGameplay === 'function') mostrarFeedbackGameplay('Fondos insuficientes (RD$' + costoTotal + ').', 'warn');
        return false;
    }
    if (obtenerRepartidoresDisponibles() <= 0) {
        log('Sin repartidores disponibles.', 'error');
        if (typeof mostrarFeedbackGameplay === 'function') mostrarFeedbackGameplay('Sin repartidores libres.', 'warn');
        rep.pedidoPendienteDelivery = null;
        if (typeof actualizarUI === 'function') actualizarUI();
        return false;
    }
    saldo -= costoTotal;
    if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarGastoDia === 'function') {
        window.TallerApp.helpers.registrarGastoDia(costoTotal, 'piezas');
    }
    var slotAsignado = resolverSlotDeliveryDisponible(pedido.slotDelivery);
    if (slotAsignado < 0) {
        log('No hay slot de delivery libre para despachar ahora mismo.', 'error');
        if (typeof mostrarFeedbackGameplay === 'function') mostrarFeedbackGameplay('Sin delivery libre para despachar.', 'warn');
        return false;
    }

    var etaBase = calcularEtaDelivery(pedido.piezas.length, slotAsignado);
    var etaRealSeg = obtenerDuracionTrabajoTiempoRealSeg(etaBase, false);
    var entrega = {
        idEntrega: 'DEL-' + Date.now() + '-' + (Math.floor(Math.random() * 900) + 100),
        idCaso: clave,
        slotDelivery: slotAsignado,
        mecanicoNombre: rep.mecanicoNombre || 'Mecanico',
        piezasTexto: pedido.piezas.map(function(p) { return p.nombre; }).join(', '),
        piezasCompradas: pedido.piezas.slice(),
        costoAbonado: costoTotal,
        etaRestante: etaBase,
        etaTotal: etaBase,
        duracionRealSeg: etaRealSeg,
        segundosPendientesReal: etaRealSeg,
        ultimoTiempoSyncMs: Date.now()
    };
    entregasPiezasActivas.push(entrega);
    rep.pedidoPendienteDelivery = null;
    actualizarCasoAtendido(rep, 'esperando_entrega', 'Delivery en camino: ' + entrega.piezasTexto + ' (RD$' + costoTotal + ', ETA ' + formatearEstimadoTrabajoTiempoReal(etaBase, false) + ').');
    log('Pago RD$' + costoTotal + ' realizado. Delivery en camino para ' + clave + '.', 'exito');
    if (typeof mostrarFeedbackGameplay === 'function') mostrarFeedbackGameplay('Pago RD$' + costoTotal + '. Delivery en camino para ' + (rep.mecanicoNombre || 'el mecanico') + '.', 'ok');
    if (typeof autoGuardarPartidaSilenciosa === 'function') autoGuardarPartidaSilenciosa('pedido-piezas-delivery');
    if (typeof actualizarUI === 'function') actualizarUI();
    return true;
}

function cancelarPedidoDelivery(idCaso) {
    var clave = String(idCaso || '').trim();
    var rep = (reparacionesActivas || []).find(function(r) { return r && r.idCaso === clave; });
    if (rep) rep.pedidoPendienteDelivery = null;
    if (typeof actualizarUI === 'function') actualizarUI();
}

function aplicarBalanceEconomicoReparacion(rep) {
    if (!rep || typeof rep !== 'object') return false;
    if (!rep.exito || rep.nivelResultado === 'fallo') return false;

    var costoPiezas = obtenerCostoPiezasReparacion(rep);
    rep.costoPiezasCaso = costoPiezas;
    if (costoPiezas <= 0) return false;

    var cobroActual = Math.max(0, Math.round(rep.ganancia || 0));
    var nivel = String(rep.nivelResultado || '').toLowerCase();
    var margenPct = nivel === 'critico' ? 0.20 : 0.15;
    var margenPieza = Math.max(0, Math.round(costoPiezas * margenPct));

    // El valor base del servicio (mano de obra + pluses) se conserva la primera vez.
    // A ese valor se le suma SIEMPRE el costo real de pieza mas su margen comercial.
    if (typeof rep.gananciaBaseServicio !== 'number' || isNaN(rep.gananciaBaseServicio) || rep.gananciaBaseServicio < 0) {
        rep.gananciaBaseServicio = cobroActual;
    }

    var servicioBase = Math.max(0, Math.round(rep.gananciaBaseServicio || 0));
    var cobroTotal = servicioBase + costoPiezas + margenPieza;

    rep.gananciaMinimaAplicada = cobroTotal;
    rep.margenServicioAplicado = margenPieza;
    rep.margenPctAplicado = margenPct;
    rep.margenPiezaAplicado = margenPieza;
    rep.servicioBaseAplicado = servicioBase;
    rep.cobroTotalCalculado = cobroTotal;

    if (Math.round(rep.ganancia || 0) === cobroTotal) return false;

    rep.ganancia = cobroTotal;
    rep.ajusteEconomicoAplicado = true;
    return true;
}

function procesarReparacionesActivas() {
    if (!Array.isArray(reparacionesActivas) || reparacionesActivas.length === 0) return;
    const terminadas = [];
    reparacionesActivas.forEach((rep, i) => {
        if (typeof normalizarReparacionActiva === 'function') {
            rep = normalizarReparacionActiva(rep);
        }
        if (!rep || typeof rep !== 'object') return;
        if (rep.listoParaCobro) return;
        if (typeof sincronizarTiempoReparacionReal === 'function') {
            rep = sincronizarTiempoReparacionReal(rep);
        }

        if (rep.tipoTrabajo === 'diagnostico') {
            if (rep.tiempoRestante <= 0) {
                rep.tiempoRestante = 0;
                rep.diagnosticoCompletado = true;
            }
            return;
        }

        if (rep.autolavadoEnCurso) {
            if (rep.tiempoRestante <= 0 || rep.segundosPendientesReal <= 0) {
                rep.tiempoRestante = 0;
                rep.segundosPendientesReal = 0;
                rep.autolavadoEnCurso = false;
                rep.listoParaCobro = true;
                rep.estado = 'listoParaCobro';
                var bonoLavado = Math.max(0, Number(rep.autolavadoBono || 0));
                rep.ganancia = Math.max(0, Math.round((rep.ganancia || 0) * (1 + bonoLavado)));
                rep.subtituloResultado = 'Autolavado completado: acabado entregable y bono aplicado al cobro.';
                actualizarCasoAtendido(rep, 'listo_retiro_pago', 'Autolavado completado. Caso listo para cobrar.');
                if (typeof pushMensajeTelefono === 'function') pushMensajeTelefono('autolavado', 'autolavado', rep.idCaso + ' termino el lavado. Bono +' + Math.round(bonoLavado * 100) + '%. Ya puedes cobrar.', { clave: 'autolavado-listo-' + rep.idCaso });
                if (typeof mostrarFeedbackGameplay === 'function') mostrarFeedbackGameplay(rep.idCaso + ' listo: autolavado completado. Bono +' + Math.round(bonoLavado * 100) + '% aplicado.', 'ok');
            }
            return;
        }

        if (rep.pausadaPorPieza || rep.pausadaManualDueno) return;

        const rasgoTrabajo = typeof obtenerPerfilRasgosMecanico === 'function' ? obtenerPerfilRasgosMecanico(rep.mecanicoNombre) : {};
        if (rep.requierePiezaContinuacion && !rasgoTrabajo.ignoraPiezasReparacion && !rep.piezaContinuacionSolicitada && !rep.piezaContinuacionInstalada) {
            const umbral = Math.max(1, Math.ceil((rep.tiempoTotal || 1) * 0.55));
            if (rep.tiempoRestante <= umbral) {
                rep.piezaContinuacionSolicitada = true;
                rep.pausadaPorPieza = true;
                rep.tiempoRestante = Math.max(1, Math.round(rep.tiempoRestante || 1));
                actualizarCasoAtendido(
                    rep,
                    'falta_pieza',
                    `Trabajo pausado con ${rep.mecanicoNombre}. Requiere ${rep.piezaRequeridaNombre} para continuar.`
                );
                log(`${rep.mecanicoNombre} detuvo ${rep.clienteNombre}: necesita ${rep.piezaRequeridaNombre} para continuar.`, 'warn');
                if (typeof mostrarFeedbackGameplay === 'function') {
                    mostrarFeedbackGameplay(`${rep.mecanicoNombre} pauso el caso por piezas. Compra y entrega para continuar.`, 'warn');
                }
                return;
            }
        }

        if (rep.tiempoRestante <= 0) terminadas.push(i);
    });

    for (let i = terminadas.length - 1; i >= 0; i--) {
        const idx = terminadas[i];
        const rep = reparacionesActivas[idx];
        rep.tiempoRestante = 0;
        rep.listoParaCobro = true;
        rep.resultadoVisible = !!rep.resultadoVisible;
        rep.cobroProcesado = false;
        aplicarBalanceEconomicoReparacion(rep);
        // Otorgar XP al mecánico que completó el trabajo
        const mecXp = (mecanicos || []).find(function(mx) { return mx && mx.nombre === rep.mecanicoNombre; });
        rep.xpMecanicoGanada = Math.max(0, xpPorResultado(rep.nivelResultado));
        rep.xpDeliveryGanada = Math.max(0, Math.round(rep.xpDeliveryGanada || 0));
        if (mecXp) {
            ganarXpMecanico(mecXp, rep.xpMecanicoGanada);
            // Al terminar vuelve a su area sin esperar cobro.
            const rasgosFinTrabajo = (typeof obtenerPerfilRasgosMecanico === 'function')
                ? obtenerPerfilRasgosMecanico(mecXp.nombre)
                : {};
            // Todo caso deja un turno de recuperacion; algunos rasgos lo amplian.
            const enfriamientoBase = Math.max(1, Math.round(Number(rasgosFinTrabajo.enfriamientoBasePostTrabajo || 1)));
            const extraCooldown = Math.max(enfriamientoBase, Math.round(enfriamientoBase + Number(rasgosFinTrabajo.enfriamientoExtraPostTrabajo || 0)));
            // Enfermedad sorpresa (Martin): probabilidad de quedar fuera al terminar
            const chanceEnf = Number(rasgosFinTrabajo.chanceSorpresaEnfermedad || 0);
            const turnosEnf = Math.max(0, Math.round(Number(rasgosFinTrabajo.turnosEnfermedadSorpresa || 0)));
            const seEnfermo = chanceEnf > 0 && turnosEnf > 0 && Math.random() < chanceEnf;
            if (seEnfermo) {
                mecXp.enfriamientoTurnos = turnosEnf;
                mecXp.ocupado = true;
                log(`${mecXp.nombre} se enfermo al salir del trabajo. Fuera ${formatearTiempoTrabajo(turnosEnf)}.`, 'warn');
                if (typeof mostrarFeedbackGameplay === 'function') {
                    mostrarFeedbackGameplay(`${mecXp.nombre} se enfermo sorpresivamente. Estara fuera ${formatearTiempoTrabajo(turnosEnf)}.`, 'warn');
                }
            } else {
                mecXp.enfriamientoTurnos = extraCooldown;
                mecXp.ocupado = extraCooldown > 0;
                if (extraCooldown > 0) {
                    log(`${mecXp.nombre} entra en enfriamiento extendido (${formatearTiempoTrabajo(extraCooldown)}).`, 'warn');
                }
            }
        }
        const estimado = rep.nivelResultado === 'fallo' ? `RD$0 (impacto -RD$${rep.perdida || 0})` : `RD$${rep.ganancia || 0}`;
        actualizarCasoAtendido(
            rep,
            'listo_retiro_pago',
            `${rep.mecanicoNombre} reporta reparacion terminada. Click en el caso para mas info. Estimado: ${estimado}.`
        );
        log(`${rep.mecanicoNombre} dejo ${rep.idCaso || 'CASO-0000'} en LISTO. Click en el caso para ver resultado.`, 'info');
        if (typeof mostrarFeedbackGameplay === 'function') {
            mostrarFeedbackGameplay(`LISTO: ${rep.idCaso || 'CASO-0000'} reparacion terminada. Click aqui para mas info. Estimado ${estimado}.`, 'ok');
        }
        notificarSistemaTaller(
            'Caso listo para cobrar',
            `${rep.idCaso || 'CASO-0000'} con ${rep.mecanicoNombre || 'Mecanico'} ya termino.`,
            `tw-caso-listo-${rep.idCaso || idx}`,
            { caseId: rep.idCaso || '', mechanic: rep.mecanicoNombre || '' }
        );
    }

    var diagnosticosCerrados = 0;
    for (let i = reparacionesActivas.length - 1; i >= 0; i--) {
        const rep = reparacionesActivas[i];
        if (!rep || rep.tipoTrabajo !== 'diagnostico' || !rep.diagnosticoCompletado) continue;
        var dxFase = completarDiagnosticoMecanico(rep);
        // Si dxFase === 'pedir_piezas' el caso queda en el panel; no remover todavia
        if (dxFase !== 'pedir_piezas') {
            // Conservamos el trabajo en Trabajos como historial visible. Antes
            // se eliminaba y solo quedaba el expediente en la cola, dando la
            // impresión de que el caso había vuelto a empezar.
            if (dxFase === 'diagnostico_completado') {
                reparacionesActivas[i].tipoTrabajo = 'diagnostico_completado';
                // Un diagnostico terminado no es una reparacion terminada.
                // No debe aparecer como "Ver resultado" ni permitir cobro:
                // primero hay que revisar/aprobar, pedir la pieza y reparar.
                reparacionesActivas[i].listoParaCobro = false;
                // El diagnóstico aún no es un cierre: primero debe revisarse,
                // aprobarse y pasar a pedido de piezas/reparación.
                reparacionesActivas[i].resultadoVisible = false;
            }
            diagnosticosCerrados += 1;
        }
    }
    if (diagnosticosCerrados > 0 && typeof autoGuardarPartidaSilenciosa === 'function') {
        autoGuardarPartidaSilenciosa('diagnostico-mecanico-completado');
    }

}

function instalarPiezaContinuacionReparacion(idCaso, silencioso) {
    var modoSilencioso = !!silencioso;
    const rep = (reparacionesActivas || []).find(function(r) {
        return r && r.idCaso === idCaso && r.pausadaPorPieza;
    });
    if (!rep) {
        if (!modoSilencioso) {
            log('Ese trabajo no esta pausado por pieza.', 'error');
            if (typeof mostrarFeedbackGameplay === 'function') mostrarFeedbackGameplay('No se puede instalar: el trabajo no está pausado esperando esa pieza.', 'warn');
        }
        return false;
    }

    const requeridas = Array.isArray(rep.piezasContinuacionRequeridas) && rep.piezasContinuacionRequeridas.length
        ? rep.piezasContinuacionRequeridas.slice()
        : [{ id: '', nombre: rep.piezaRequeridaNombre || `pieza de ${rep.especialidadIdeal}`, especialidad: rep.especialidadIdeal, calidad: 'estandar' }];

    const usadas = [];
    const faltantes = [];

    requeridas.forEach(function(req) {
        let idxInv = -1;
        if (req.id) {
            idxInv = inventarioPiezas.findIndex(function(p, i) { return p && !p.instalada && p.id === req.id && usadas.indexOf(i) < 0; });
        }
        if (idxInv < 0) {
            idxInv = inventarioPiezas.findIndex(function(p, i) {
                return p && !p.instalada && p.especialidad === req.especialidad && usadas.indexOf(i) < 0;
            });
        }
        if (idxInv < 0) {
            faltantes.push(req.nombre || `pieza de ${req.especialidad || rep.especialidadIdeal}`);
            return;
        }
        usadas.push(idxInv);
    });

    if (faltantes.length) {
        if (!modoSilencioso) log(`Aun faltan piezas: ${faltantes.join(', ')}. Compra y vuelve a entregar.`, 'error');
        if (!modoSilencioso && typeof mostrarFeedbackGameplay === 'function') {
            mostrarFeedbackGameplay(`Bloqueado: faltan ${faltantes.join(', ')}.`, 'error');
        }
        return false;
    }

    const piezasEntregadas = usadas.map(function(idx) { return { ...inventarioPiezas[idx] }; });
    usadas
        .slice()
        .sort(function(a, b) { return b - a; })
        .forEach(function(idx) {
            inventarioPiezas.splice(idx, 1);
        });

    // Cuando el caso viene de diagnostico (pedir_piezas), la entrega debe iniciar
    // una reparacion real con nuevo tiempo total/restante, no retomar un timer agotado.
    if (rep.tipoTrabajo === 'pedir_piezas') {
        if (Array.isArray(entregasPiezasActivas)) {
            entregasPiezasActivas = entregasPiezasActivas.filter(function(entrega) {
                return !(entrega && entrega.idCaso === rep.idCaso);
            });
        }
        return completarEntregaConPiezasCompradas(rep, {
            idCaso: rep.idCaso,
            piezasCompradas: piezasEntregadas
        });
    }

    rep.piezasContinuacionEntregadas = piezasEntregadas.map(function(p) {
        return {
            id: p.id,
            nombre: p.nombre,
            calidad: p.calidad || 'estandar',
            especialidad: p.especialidad,
            costo: Math.max(0, Math.round(p.costo || 0))
        };
    });
    rep.piezaContinuacionInstalada = true;
    rep.pausadaPorPieza = false;
    if (typeof ajustarTrabajoActivoSegundos === 'function') {
        ajustarTrabajoActivoSegundos(rep, -obtenerDuracionTrabajoTiempoRealSeg(1, typeof modoNivelesActivo === 'function' && modoNivelesActivo()));
    } else {
        rep.tiempoRestante = Math.max(1, rep.tiempoRestante - 1);
    }
    if (Array.isArray(entregasPiezasActivas)) {
        entregasPiezasActivas = entregasPiezasActivas.filter(function(entrega) {
            return !(entrega && entrega.idCaso === rep.idCaso);
        });
    }

    const totalCalidad = Math.max(1, piezasEntregadas.length);
    const premium = piezasEntregadas.filter(function(p) { return p.calidad === 'premium'; }).length;
    const estandar = piezasEntregadas.filter(function(p) { return p.calidad === 'estandar'; }).length;
    const basica = piezasEntregadas.filter(function(p) { return p.calidad === 'basica'; }).length;
    const scoreCalidad = ((premium * 2) + estandar - (basica * 0.5)) / totalCalidad;
    const chanceFalloParcial = Math.max(0.12, Math.min(0.78, 0.28 + (scoreCalidad * 0.18)));
    const chanceParcialCritico = Math.max(0.08, Math.min(0.62, 0.18 + (scoreCalidad * 0.14)));

    if (rep.resultadoOculto === 'fallo' && Math.random() < chanceFalloParcial) {
        rep.resultadoOculto = 'parcial';
        rep.nivelResultado = 'parcial';
        rep.exito = true;
        rep.ganancia = Math.max(240, Math.round((rep.perdida || 0) * 0.6));
        rep.perdida = 0;
    } else if (rep.resultadoOculto === 'parcial' && Math.random() < chanceParcialCritico) {
        rep.resultadoOculto = 'critico';
        rep.nivelResultado = 'critico';
        rep.exito = true;
        rep.ganancia = Math.max(rep.ganancia || 0, Math.round((rep.ganancia || 800) * 1.22));
    }

    aplicarBalanceEconomicoReparacion(rep);

    actualizarCasoAtendido(
        rep,
        'en_reparacion',
        `Piezas entregadas (${piezasEntregadas.map(function(p) { return p.nombre; }).join(', ')}). ${rep.mecanicoNombre} retoma el trabajo.`
    );
    if (!modoSilencioso) log(`Entregaste piezas para ${rep.idCaso}: ${piezasEntregadas.map(function(p) { return p.nombre; }).join(', ')}. ${rep.mecanicoNombre} continua.`, 'exito');
    if (!modoSilencioso && typeof mostrarFeedbackGameplay === 'function') {
        mostrarFeedbackGameplay(`Piezas entregadas a ${rep.mecanicoNombre}. Reparacion en curso.`, 'ok');
    }
    if (typeof renderizarTiendaRepuestos === 'function') renderizarTiendaRepuestos(_repuestosFiltroActivo || 'todos');
    actualizarUI();
    return true;
}

function obtenerRivalidadesEquipo() {
    if (typeof window === 'undefined' || !window.TallerData || typeof window.TallerData.rivalidades !== 'object') {
        return {};
    }
    return window.TallerData.rivalidades;
}

function aplicarCelos(nombreAsignado) {
    const rivalidadesEquipo = obtenerRivalidadesEquipo();
    mecanicos.forEach(m => {
        if (m.nombre === nombreAsignado) return;
        const esRival = (rivalidadesEquipo[m.nombre] || []).includes(nombreAsignado);
        const usaSiempreMismo = ultimoMecanicoAsignado === nombreAsignado;
        if (esRival && (usaSiempreMismo || Math.random() < 0.4)) {
            m.enojo = Math.min(8, m.enojo + 1);
            log(`Celos en el equipo: ${m.nombre} se molesto porque ${nombreAsignado} tomo otro trabajo.`, 'info');
        }
    });
}

function revisarPeleaRivales(mecanicoActual) {
    if (!mecanicoActual || eventoPeleaHoy) return;

    const rivalidadesEquipo = obtenerRivalidadesEquipo();

    const keyActual = String(mecanicoActual.nombre || '').toLowerCase();
    const umbralActual = keyActual === 'miguel' ? 3 : 4;
    if ((mecanicoActual.enojo || 0) < umbralActual) return;

    const nombresRivales = Array.isArray(rivalidadesEquipo[mecanicoActual.nombre])
        ? rivalidadesEquipo[mecanicoActual.nombre]
        : [];
    if (!nombresRivales.length) return;

    const rivalesEnEquipo = (mecanicos || []).filter(function(x) {
        return x && x.nombre !== mecanicoActual.nombre && nombresRivales.includes(x.nombre);
    });
    if (!rivalesEnEquipo.length) return;

    const rivalesCalientes = rivalesEnEquipo.filter(function(rivalTmp) {
        const keyRivalTmp = String(rivalTmp.nombre || '').toLowerCase();
        const umbralRival = (keyActual === 'miguel' || keyRivalTmp === 'miguel') ? 3 : 4;
        return (rivalTmp.enojo || 0) >= umbralRival;
    });
    if (!rivalesCalientes.length) return;

    const rival = rivalesCalientes[Math.floor(Math.random() * rivalesCalientes.length)];
    if (!rival) return;
    const keyRival = String(rival.nombre || '').toLowerCase();

    let chance = 0.2 + ((mecanicoActual.enojo + rival.enojo) / 25) + Math.max(0, modPeleaImpagoEmpleadosDia || 0);
    if (keyActual === 'miguel' || keyRival === 'miguel') chance += 0.16;
    chance = Math.max(0.12, Math.min(0.95, chance));

    if (Math.random() >= chance) {
        decisionesHistoria.peleasEvitadas++;
        return;
    }

    const turnosPelea = 6;
    mecanicoActual.enfriamientoTurnos = Math.max(Math.round(mecanicoActual.enfriamientoTurnos || 0), turnosPelea);
    rival.enfriamientoTurnos = Math.max(Math.round(rival.enfriamientoTurnos || 0), turnosPelea);
    mecanicoActual.ocupado = true;
    rival.ocupado = true;

    const modoSinCierre = (typeof estaModoSinCierreDia === 'function' && estaModoSinCierreDia());
    if (!modoSinCierre) {
        mecanicoActual.bloqueadoHastaDia = dia;
        rival.bloqueadoHastaDia = dia;
    } else {
        mecanicoActual.bloqueadoHastaDia = 0;
        rival.bloqueadoHastaDia = 0;
    }

    eventoPeleaHoy = true;
    resumenDia.peleas++;
    decisionesHistoria.peleasOcurridas++;
    reputacion = Math.max(0, reputacion - 3);
    const txtBloqueo = modoSinCierre ? 'salen del piso por 6 turnos' : 'quedan fuera por hoy y en enfriamiento';
    log(`Pelea en el taller: ${mecanicoActual.nombre} y ${rival.nombre} ${txtBloqueo}.`, 'error');
}

// Incrementa el contador de bloqueos por enojo del mecanico.
// 2 bloqueos -> queja por WhatsApp; 3+ bloqueos -> renunciaInminente.
function incrementarBloqueoEnojo(m) {
    if (!m) return;
    m.enojoBloqueos = Math.min(4, (m.enojoBloqueos || 0) + 1);
    const cId = 'mec_' + m.nombre;
    if (m.enojoBloqueos === 2 && typeof pushMensajeTelefono === 'function') {
        pushMensajeTelefono(cId, cId,
            `Jefe, estoy pensando si esto vale la pena. Asi no puedo seguir trabajando.`,
            { clave: `queja-enojo-${cId}-b2` }
        );
    }
    if (m.enojoBloqueos >= 3 && !m.renunciaInminente) {
        m.renunciaInminente = true;
        if (typeof pushMensajeTelefono === 'function') {
            pushMensajeTelefono(cId, cId,
                `Jefe, ya tuve suficiente. Si no resolvemos esto, no cuentes conmigo. Dame ese bono o algo, porque asi no sigo.`,
                { clave: `renuncia-${cId}-b3` }
            );
        }
    }
}

function escogerItemAleatorioEquipo(lista) {
    if (!Array.isArray(lista) || !lista.length) return null;
    return lista[Math.floor(Math.random() * lista.length)] || null;
}

function esMecanicoVapeador(nombre) {
    var key = String(nombre || '').toLowerCase();
    return key === 'frandy' || key === 'miguel' || key === 'morenai' || key === 'moreni' || key === 'martin';
}

function obtenerTiempoBloqueoAyudaMecanico(m) {
    if (!m) return 0;
    return Math.max(0, Math.round(m.bloqueoAyudaTurnos || 0));
}

function formatearBloqueoAyudaMecanico(turnos) {
    var total = Math.max(0, Math.round(turnos || 0));
    if (typeof formatearTiempoTrabajo === 'function') return formatearTiempoTrabajo(total);
    return (total * 10) + ' min';
}

function aplicarBloqueoAyudaMecanico(m, turnosBase) {
    if (!m) return 0;
    var penalizacion = Math.max(2, Math.round(turnosBase || (3 + Math.round(Math.random() * 3))));
    m.bloqueoAyudaTurnos = Math.max(obtenerTiempoBloqueoAyudaMecanico(m), penalizacion);
    return m.bloqueoAyudaTurnos;
}

function construirSolicitudPrestamoMecanico(m, hitoCasoActual) {
    if (esMecanicoVapeador(m && m.nombre)) {
        var montoFijoVape = 100;
        var textoVape = escogerItemAleatorioEquipo([
            'Jefe, tirame RD$100 para el liquido del vape y no salgo del taller.',
            'Jefe, necesito RD$100 para liquido de vape. Lo resuelvo y sigo al hilo en el piso.'
        ]) || 'Jefe, necesito RD$100 para el liquido del vape.';
        return {
            tipo: 'prestamo',
            subtipo: 'vape',
            etiquetaCorta: 'liquido vape',
            motivoTexto: 'lo del liquido del vape',
            monto: montoFijoVape,
            texto: textoVape,
            penalizacionTurnos: 2,
            casoLanzado: hitoCasoActual
        };
    }

    var catalogo = [
        {
            id: 'vape',
            etiquetaCorta: 'liquido vape',
            motivoTexto: 'lo del liquido del vape',
            montoMin: 180,
            montoMax: 320,
            bloqueoMin: 2,
            bloqueoMax: 3,
            textos: [
                'Jefe, estoy seco. Con RD${monto} resuelvo lo del liquido del vape y no salgo del taller a buscar eso.',
                'Jefe, tirame un prestamo de RD${monto} para el vape. Me organizo y te respondo con trabajo.'
            ]
        },
        {
            id: 'almuerzo',
            etiquetaCorta: 'almuerzo',
            motivoTexto: 'el almuerzo',
            montoMin: 220,
            montoMax: 420,
            bloqueoMin: 2,
            bloqueoMax: 4,
            textos: [
                'Jefe, ando corto. Con RD${monto} resuelvo el almuerzo y no me desconecto del piso.',
                'Jefe, me ayudas con RD${monto} para el almuerzo? Hoy vine sin margen y quiero rendir bien.'
            ]
        },
        {
            id: 'gasolina',
            etiquetaCorta: 'gasolina',
            motivoTexto: 'la gasolina',
            montoMin: 320,
            montoMax: 680,
            bloqueoMin: 3,
            bloqueoMax: 5,
            textos: [
                'Jefe, si me prestas RD${monto} resuelvo la gasolina y no pierdo medio turno dando vueltas.',
                'Jefe, estoy seco de gasolina. Con RD${monto} llego y sigo full en el taller.'
            ]
        },
        {
            id: 'emergencia_medica',
            etiquetaCorta: 'emergencia medica',
            motivoTexto: 'la emergencia medica',
            montoMin: 950,
            montoMax: 1850,
            bloqueoMin: 5,
            bloqueoMax: 7,
            textos: [
                'Jefe, tengo una emergencia medica en casa. Necesito RD${monto} y te respondo apenas me estabilice.',
                'Jefe, me salio una emergencia medica. Si me prestas RD${monto}, cierro eso y vuelvo enfocado.'
            ]
        },
        {
            id: 'cafe',
            etiquetaCorta: 'cafe',
            motivoTexto: 'el cafe',
            montoMin: 120,
            montoMax: 240,
            bloqueoMin: 1,
            bloqueoMax: 2,
            textos: [
                'Jefe, tirame RD${monto} para comprar cafe y no caerme en este turno.',
                'Jefe, ando fundido. Con RD${monto} compro cafe y sigo derecho con los casos.'
            ]
        },
        {
            id: 'pasaje',
            etiquetaCorta: 'pasaje',
            motivoTexto: 'el pasaje',
            montoMin: 180,
            montoMax: 340,
            bloqueoMin: 2,
            bloqueoMax: 4,
            textos: [
                'Jefe, me quede corto de pasaje. Con RD${monto} no me salgo del ritmo hoy.',
                'Jefe, si me prestas RD${monto} cubro el pasaje y me quedo metido aqui sin desaparecerme.'
            ]
        }
    ];
    var necesidad = escogerItemAleatorioEquipo(catalogo) || catalogo[0];
    var monto = necesidad.montoMin + Math.round(Math.random() * Math.max(0, necesidad.montoMax - necesidad.montoMin));
    var penalizacionTurnos = necesidad.bloqueoMin + Math.round(Math.random() * Math.max(0, necesidad.bloqueoMax - necesidad.bloqueoMin));
    var plantilla = escogerItemAleatorioEquipo(necesidad.textos) || 'Jefe, necesito un apoyo economico de RD${monto} para resolver un asunto personal.';
    var texto = String(plantilla).replace(/\$\{monto\}/g, monto);
    return {
        tipo: 'prestamo',
        subtipo: necesidad.id,
        etiquetaCorta: necesidad.etiquetaCorta,
        motivoTexto: necesidad.motivoTexto,
        monto: monto,
        texto: texto,
        penalizacionTurnos: penalizacionTurnos,
        casoLanzado: hitoCasoActual
    };
}

function construirMensajeDevolucionMecanico(m, pago) {
    var restante = Math.max(0, Math.round((m && m.deudaConTaller) || 0));
    if (restante <= 0) {
        return escogerItemAleatorioEquipo([
            'Jefe, te mande RD$' + pago + '. Ya quedamos a mano contigo.',
            'Jefe, ahi van RD$' + pago + '. Con eso salde lo que te debia.'
        ]) || ('Jefe, te mande RD$' + pago + '. Ya quedamos a mano.');
    }
    return escogerItemAleatorioEquipo([
        'Jefe, te abone RD$' + pago + ' de lo que me prestaste. Todavia te debo RD$' + restante + '.',
        'Jefe, pude juntarte RD$' + pago + '. Me faltan RD$' + restante + ' y sigo respondiendo.'
    ]) || ('Jefe, te abone RD$' + pago + '. Me faltan RD$' + restante + '.');
}

// ─── MENSAJES AUTÓNOMOS DE MECÁNICOS ─────────────────────────────────────────
// Cada mecanico puede enviar una solicitud (prestamo, favor o ausencia).
// Cadencia por casos cerrados: se evalua cada N casos completados.
function lanzarMensajesAutonomosMecanicos(hitoCasoForzado) {
    if (typeof pushMensajeTelefono !== 'function') return false;
    if (!Array.isArray(mecanicos)) return false;
    var casosTotales = Math.max(0, Math.round((tramaEstado && tramaEstado.casosCriticosResueltos || 0) + (tramaEstado && tramaEstado.casosParciales || 0)));
    var cadenciaCasos = 3;
    var hitoCasoActual = (typeof hitoCasoForzado === 'number' && hitoCasoForzado > 0)
        ? Math.max(0, Math.round(hitoCasoForzado))
        : Math.floor(casosTotales / cadenciaCasos) * cadenciaCasos;
    if (hitoCasoActual < cadenciaCasos) return false;
    if (typeof mensajeriaMecanicosUltimoCaso !== 'number') mensajeriaMecanicosUltimoCaso = 0;
    if (hitoCasoActual <= mensajeriaMecanicosUltimoCaso) return false;
    mensajeriaMecanicosUltimoCaso = hitoCasoActual;
    var envio = false;

    var periodoClave = 'c' + hitoCasoActual;
    var vapeadoresCadencia = (mecanicos || []).filter(function(mx) {
        return mx && mx.nombre && esMecanicoVapeador(mx.nombre);
    });
    var nombreVapeObjetivo = '';
    if (vapeadoresCadencia.length > 0) {
        var cicloVape = Math.max(0, Math.floor(hitoCasoActual / cadenciaCasos));
        nombreVapeObjetivo = vapeadoresCadencia[cicloVape % vapeadoresCadencia.length].nombre;
    }

    var textosFavor = {
        Frandy:  'Jefe, si el cliente de la manana pregunta quien cerro el caso anterior, dile que fui yo. Es un tema de confianza con ese cliente.',
        Maicol:  'Jefe, un compadre me necesita esta tarde para revisar un carro. Me dejas salir 30min antes y termino mi caso rapido?',
        Ridalvi: 'Jefe, necesito cubrir unas horas de manana. Tengo que llevar mi mama al medico. No te pido dia libre, solo la manana.',
        Jeral:   'Jefe, si el cliente del caso de suspension llama y pregunta, dile que yo lo revise directamente. Hay un detalle de garantia que quiero manejar.',
        Edwin:   'Jefe, el proveedor del barrio me debe un favor en piezas. Dejame gestionar esa compra y te consigo descuento, pero la diferencia queda entre nosotros.',
        Stewart: 'Jefe, llego un poco tarde esta manana por algo importante. Si alguien pregunta di que estaba en entrega.',
        Morenai: 'Jefe, tengo un caso afuera esta tarde. Son 2 horas nada mas. Si llaman di que estoy en recepcion de vehiculo.',
        Martin:  'Jefe, hay un vecino del barrio que me encargo trabajo en su casa. Puedo ir rapido si me cubres con el siguiente en cola?',
        Miguel:  'Jefe, me salio un trabajo flash de calle para hoy. Si me cubres una vuelta, vuelvo prendido para cerrar cola.'
    };

    var textosAusencia = {
        Frandy:  'Jefe, lo siento pero hoy no voy a poder. Problema en casa que no puede esperar. Avanzame con lo que puedas.',
        Maicol:  'Jefe, hoy no puedo ir. Tengo que resolver lo de las herramientas. Si no aparezco ya saben el motivo.',
        Ridalvi: 'Jefe, mi mama empeoro. Hoy no llego. No te dejo mal en lo urgente, pero no puedo estar alla.',
        Jeral:   'Jefe, hoy no puedo. Problemas con el arrendador. Estoy resolviendo. Manana estoy fijo.',
        Edwin:   'Jefe, el mecanico del Riva me cito de urgencia. Hoy llego a mediodia como mucho.',
        Stewart: 'Jefe, hoy no cuenten conmigo. Tengo asunto importante y no me es posible estar.',
        Morenai: 'Jefe, situacion familiar, hoy no llego. Te aviso cuando pueda resolver.',
        Martin:  'Jefe, hoy no voy. Prometo ponerme al dia manana con doble esfuerzo.',
        Miguel:  'Jefe, hoy no llego temprano. Si el ambiente sigue caliente, mejor entro luego para no explotar con nadie.'
    };

    mecanicos.forEach(function(m) {
        if (!m || !m.nombre) return;
        normalizarStatsMecanico(m);
        var cId = 'mec_' + m.nombre;
        var enojoActual  = m.enojo || 0;
        var lealtadActual = m.lealtad || 0;
        var deudaActual  = m.deudaConTaller || 0;
        // Solicitudes viejas no respondidas se vencen por casos y suben tension.
        if (m.preguntaPendiente) {
            var preguntaVencida = m.preguntaPendiente;
            var casoPendiente = Math.max(0, Math.round(m.preguntaPendiente.casoLanzado || 0));
            if (casoPendiente > 0 && (hitoCasoActual - casoPendiente) >= cadenciaCasos) {
                m.preguntaPendiente = null;
                m.enojo = Math.min(8, (m.enojo || 0) + 1);
                if (preguntaVencida.tipo === 'prestamo' || preguntaVencida.tipo === 'favor') {
                    var turnosFuera = aplicarBloqueoAyudaMecanico(m, preguntaVencida.penalizacionTurnos || 3);
                    pushMensajeTelefono(cId, cId, 'Jefe, como no respondiste ' + (preguntaVencida.motivoTexto || 'lo mio') + ', salgo a resolver por mi lado. No me cuentes por ' + formatearBloqueoAyudaMecanico(turnosFuera) + '.', {
                        clave: 'pendiente-vencido-' + cId + '-' + periodoClave
                    });
                    envio = true;
                } else if (Math.random() < 0.45) {
                    pushMensajeTelefono(cId, cId, 'Jefe, como no respondiste lo mio, sigo resolviendo solo. Seguimos trabajando.', {
                        clave: 'pendiente-vencido-' + cId + '-' + periodoClave
                    });
                    envio = true;
                }
            } else {
                return;
            }
        }

        // AUSENCIA — enojo critico (siempre) o moderado (probabilistico)
        if (!m.ausenciaAnunciada && !m.renunciaInminente) {
            if (enojoActual >= 6 || (enojoActual >= 4 && Math.random() < 0.20)) {
                var textoAus = textosAusencia[m.nombre] || 'Jefe, hoy no me es posible. Problemas personales, no llego.';
                m.ausenciaAnunciada = true;
                m.preguntaPendiente = { tipo: 'ausencia', texto: textoAus, casoLanzado: hitoCasoActual };
                pushMensajeTelefono(cId, cId, textoAus, { clave: 'ausencia-' + cId + '-' + periodoClave });
                envio = true;
                return;
            }
        }

        // PRÉSTAMO — vapeadores objetivo: fijo cada 3 casos por RD$100.
        // El resto mantiene la lógica probabilistica original.
        var esVapeObjetivo = !!nombreVapeObjetivo && m.nombre === nombreVapeObjetivo;
        var puedePrestamoGeneral = (deudaActual < 1800 && lealtadActual >= -1 && Math.random() < 0.22);
        // --- Nueva lógica: si el mecánico tiene necesidad biográfica, también la convierte en solicitud de préstamo ---
        var tieneNecesidadBio = window.TallerData && window.TallerData.biografiasMecanicos && window.TallerData.biografiasMecanicos[m.nombre] && window.TallerData.biografiasMecanicos[m.nombre].necesidad;
        if (!m.preguntaPendiente && (esVapeObjetivo || puedePrestamoGeneral || tieneNecesidadBio)) {
            var cfgP = construirSolicitudPrestamoMecanico(m, hitoCasoActual);
            // Si tiene necesidad biográfica, personaliza el texto
            if (tieneNecesidadBio) {
                cfgP.texto = 'Jefe, necesito un apoyo económico de RD$' + cfgP.monto + ' para resolver: ' + window.TallerData.biografiasMecanicos[m.nombre].necesidad;
                cfgP.motivoTexto = window.TallerData.biografiasMecanicos[m.nombre].necesidad;
            }
            m.preguntaPendiente = cfgP;
            pushMensajeTelefono(cId, cId, cfgP.texto, { clave: 'prestamo-' + cId + '-' + periodoClave });
            envio = true;
            return;
        }

        // FAVOR — lealtad positiva, sin pendiente activo
        if (lealtadActual >= 1 && !m.preguntaPendiente && Math.random() < 0.14) {
            var textoFav = textosFavor[m.nombre] || 'Jefe, necesito un favor personal. Si puedes ayudarme te lo agradezco.';
            m.preguntaPendiente = { tipo: 'favor', texto: textoFav, casoLanzado: hitoCasoActual };
            pushMensajeTelefono(cId, cId, textoFav, { clave: 'favor-' + cId + '-' + periodoClave });
            envio = true;
        }
    });

    return envio;
}

function limpiarTiradaVisual() {
    const lane = document.getElementById('tirada-lane');
    if (!lane) return;
    Array.from(lane.querySelectorAll('.tirada-barrier,.tirada-label')).forEach(el => el.remove());
    const ball = document.getElementById('tirada-ball');
    if (ball) {
        ball.style.left = '8px';
        ball.style.top = '78px';
    }
    const out = document.getElementById('tirada-resultado');
    if (out) out.innerText = 'Preparando...';
    const btnContinuar = document.getElementById('tirada-btn-continuar');
    if (btnContinuar) btnContinuar.disabled = true;
    tiradaImpulsoFrames = 0;
}

function clamp01(v) {
    const numero = Number(v);
    return Math.max(0, Math.min(1, Number.isFinite(numero) ? numero : 0.5));
}

// ─── SISTEMA DE STATS EXPANDIDOS POR MECÁNICO ───────────────────────────────
// Garantiza retrocompatibilidad: si el mecánico no tiene los campos nuevos
// (partida guardada antigua) los genera a partir de `habilidad`.
function normalizarStatsMecanico(m) {
    if (!m) return;
    m.habilidad = clamp01(m.habilidad);
    m.velocidad = Number.isFinite(Number(m.velocidad)) ? clamp01(m.velocidad) : clamp01(m.habilidad * 0.9 + 0.05);
    m.eficiencia = Number.isFinite(Number(m.eficiencia)) ? clamp01(m.eficiencia) : clamp01(m.habilidad * 0.9 + 0.05);
    m.humor = Number.isFinite(Number(m.humor)) ? Math.max(1, Math.min(10, Number(m.humor))) : 7;
    m.xp = Number.isFinite(Number(m.xp)) ? Math.max(0, Number(m.xp)) : 0;
    m.nivel = Number.isFinite(Number(m.nivel)) ? Math.max(1, Math.min(5, Math.round(Number(m.nivel)))) : 1;
    m.puntosHabilidad = Number.isFinite(Number(m.puntosHabilidad)) ? Math.max(0, Math.round(Number(m.puntosHabilidad))) : 0;
    m.puntosBloqueados = Number.isFinite(Number(m.puntosBloqueados)) ? Math.max(0, Math.round(Number(m.puntosBloqueados))) : 0;
    m.enojoBloqueos = Number.isFinite(Number(m.enojoBloqueos)) ? Math.max(0, Math.round(Number(m.enojoBloqueos))) : 0;
    if (typeof m.renunciaInminente !== 'boolean') m.renunciaInminente  = false;
    if (typeof m.bloqueoAyudaTurnos !== 'number') m.bloqueoAyudaTurnos = 0;
    if (!('preguntaPendiente' in m))              m.preguntaPendiente  = null;
    if (typeof m.ausenciaAnunciada !== 'boolean') m.ausenciaAnunciada  = false;
}

// XP necesario para subir del nivel actual al siguiente (escala cuadrática).
const XP_POR_NIVEL = [0, 3, 7, 13, 20]; // índice = nivel actual (1-4); nivel 5 es el máximo
const COSTO_DESBLOQUEO_PUNTO_POR_NIVEL = {
    1: 300,
    2: 600,
    3: 1200,
    4: 2000,
    5: 3000
};

function xpParaSiguienteNivel(nivelActual) {
    const nivel = Math.max(1, Math.min(5, Math.round(Number(nivelActual) || 1)));
    return nivel >= 5 ? 0 : XP_POR_NIVEL[nivel];
}

function obtenerCostoDesbloqueoPuntoMecanico(nivelActual) {
    var nivel = Math.max(1, Math.round(nivelActual || 1));
    if (COSTO_DESBLOQUEO_PUNTO_POR_NIVEL[nivel]) return COSTO_DESBLOQUEO_PUNTO_POR_NIVEL[nivel];
    var extra = nivel - 5;
    return Math.round(COSTO_DESBLOQUEO_PUNTO_POR_NIVEL[5] + (extra * 900));
}

function xpPorResultado(nivelResultado) {
    switch (String(nivelResultado || '').toLowerCase()) {
        case 'critico':    return 2;
        case 'parcial':    return 1;
        case 'fallo_total':
        case 'fallo':      return 0;
        default:           return 1;
    }
}

// Otorga XP al mecánico y dispara subida de nivel si corresponde.
function ganarXpMecanico(m, cantidad) {
    if (!m || cantidad <= 0) return;
    normalizarStatsMecanico(m);
    m.xp = (m.xp || 0) + cantidad;
    verificarSubidaNivel(m);
}

function verificarSubidaNivel(m) {
    if (!m || m.nivel >= 5) return;
    const umbral = xpParaSiguienteNivel(m.nivel);
    if (m.xp >= umbral) {
        m.xp = Math.max(0, m.xp - umbral);
        m.nivel = Math.min(5, (m.nivel || 1) + 1);
        m.puntosBloqueados = (m.puntosBloqueados || 0) + 1;
        // Mejora pasiva de habilidad base al subir nivel
        m.habilidad = clamp01((m.habilidad || 0.5) + 0.03);

        const costo = obtenerCostoDesbloqueoPuntoMecanico(m.nivel || 1);
        const msg = `${m.nombre} subio al nivel ${m.nivel}. Punto bloqueado listo para desbloquear por RD$${costo}.`;
        log(msg, 'ok');
        if (typeof mostrarFeedbackGameplay === 'function') mostrarFeedbackGameplay(msg, 'ok');
        if (typeof registrarNarrativaTelefono === 'function') {
            registrarNarrativaTelefono({
                tipo: 'actualizacion_nivel',
                eventoId: 'subida_nivel_' + m.nombre,
                dia: (typeof dia === 'number' ? dia : 1),
                contactoId: 'cronica_barrio',
                titulo: `Update tecnico: ${m.nombre}`,
                texto: msg,
                clave: `nivel-${m.nombre}-${m.nivel}-d${typeof dia === 'number' ? dia : 1}`
            });
        }
        // Re-verificar por si acumuló suficiente XP para otro nivel
        verificarSubidaNivel(m);
    }
}

function desbloquearPuntoHabilidadMecanico(mecNombre) {
    const m = (mecanicos || []).find(function(x) { return x && x.nombre === mecNombre; });
    if (!m) {
        log('Mecanico no encontrado: ' + mecNombre, 'error');
        return false;
    }
    normalizarStatsMecanico(m);
    if ((m.puntosBloqueados || 0) <= 0) {
        log(m.nombre + ' no tiene puntos bloqueados por desbloquear.', 'warn');
        return false;
    }

    const costo = obtenerCostoDesbloqueoPuntoMecanico(m.nivel || 1);
    if ((typeof saldo !== 'number' ? 0 : saldo) < costo) {
        log(`No tienes RD$${costo} para desbloquear el punto de ${m.nombre}.`, 'error');
        if (typeof mostrarFeedbackGameplay === 'function') {
            mostrarFeedbackGameplay(`Fondos insuficientes para desbloquear punto (${m.nombre}).`, 'warn');
        }
        return false;
    }

    saldo -= costo;
    if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarGastoDia === 'function') {
        window.TallerApp.helpers.registrarGastoDia(costo, 'equipo');
    }
    m.puntosBloqueados = Math.max(0, (m.puntosBloqueados || 0) - 1);
    m.puntosHabilidad = (m.puntosHabilidad || 0) + 1;

    const msg = `${m.nombre} desbloqueo 1 punto de habilidad por RD$${costo}.`;
    log(msg, 'ok');
    if (typeof mostrarFeedbackGameplay === 'function') mostrarFeedbackGameplay(msg, 'ok');
    if (typeof actualizarUI === 'function') actualizarUI();
    if (typeof autoGuardarPartidaSilenciosa === 'function') {
        autoGuardarPartidaSilenciosa('desbloqueo-punto-mecanico');
    }
    return true;
}

// Invierte un punto de habilidad en una stat: 'velocidad', 'eficiencia' o 'humor'
function invertirPuntoHabilidad(mecNombre, stat) {
    const m = (mecanicos || []).find(function(x) { return x && x.nombre === mecNombre; });
    if (!m) { log('Mecanico no encontrado: ' + mecNombre, 'error'); return false; }
    normalizarStatsMecanico(m);
    if ((m.puntosHabilidad || 0) <= 0) { log(m.nombre + ' no tiene puntos disponibles.', 'warn'); return false; }

    const incrementos = { velocidad: 0.06, eficiencia: 0.06, humor: 1 };
    const max = { velocidad: 1.0, eficiencia: 1.0, humor: 10 };
    if (!(stat in incrementos)) { log('Stat invalida: ' + stat, 'error'); return false; }
    if ((m[stat] || 0) >= max[stat]) { log(m.nombre + ' ya tiene ' + stat + ' al maximo.', 'warn'); return false; }

    m.puntosHabilidad -= 1;
    m[stat] = Math.min(max[stat], (m[stat] || 0) + incrementos[stat]);
    if (stat !== 'humor') m[stat] = Math.round(m[stat] * 100) / 100;

    const msg = `${m.nombre}: +${incrementos[stat]} ${stat} (ahora ${typeof m[stat] === 'number' ? (stat === 'humor' ? m[stat] : Math.round(m[stat]*100)+'%') : m[stat]}).`;
    log(msg, 'ok');
    if (typeof mostrarFeedbackGameplay === 'function') mostrarFeedbackGameplay(msg, 'ok');
    if (typeof actualizarUI === 'function') actualizarUI();
    return true;
}

// Stats efectivos (incluyen nivel, sobrecarga y enojo)
function calcularVelocidadEfectiva(m) {
    normalizarStatsMecanico(m);
    const bonusNivel  = (m.nivel - 1) * 0.04;
    const penalCarga  = Math.max(0, (m.trabajosHoy - 3)) * 0.06;
    return clamp01((m.velocidad || 0.5) + bonusNivel - penalCarga);
}

function calcularEficienciaEfectiva(m) {
    normalizarStatsMecanico(m);
    const bonusNivel  = (m.nivel - 1) * 0.04;
    const penalEnojo  = (m.enojo || 0) * 0.04;
    return clamp01((m.eficiencia || 0.5) + bonusNivel - penalEnojo);
}

function calcularHumorEfectivo(m) {
    normalizarStatsMecanico(m);
    const penalEnojo  = (m.enojo || 0) * 1.2;
    const penalCarga  = Math.max(0, (m.trabajosHoy - 3)) * 0.5;
    return Math.max(1, Math.min(10, (m.humor || 7) - penalEnojo - penalCarga));
}

// Aplica degradación de humor por sobrecarga (llamar al asignar trabajo)
function mecanicoIgnoraEstadosFisicos(m) {
    var rasgo = typeof obtenerPerfilRasgosMecanico === 'function' ? obtenerPerfilRasgosMecanico(m && m.nombre) : {};
    return !!(rasgo && rasgo.inmuneEstadosFisicos);
}

function aplicarSobrecargaMecanico(m) {
    if (!m) return;
    normalizarStatsMecanico(m);
    if (mecanicoIgnoraEstadosFisicos(m)) return;
    if (m.trabajosHoy >= 3) {
        const exceso = m.trabajosHoy - 2;
        m.humor = Math.max(1, (m.humor || 7) - exceso * 0.5);
        if (m.trabajosHoy >= 5) {
            m.enojo = Math.min(8, (m.enojo || 0) + 1);
            const aviso = `${m.nombre} esta sobrecargado (${m.trabajosHoy} trabajos hoy). Humor en ${m.humor}.`;
            log(aviso, 'warn');
            if (typeof mostrarFeedbackGameplay === 'function') mostrarFeedbackGameplay(aviso, 'warn');
        }
    }
}
// ─────────────────────────────────────────────────────────────────────────────

function ejecutarTiradaVisual(config, onFinish) {
    if (tiradaEnCurso) {
        log('Ya hay una tirada visual en curso.', 'error');
        return;
    }
    tiradaEnCurso = true;
    if (tiradaInterval) {
        clearInterval(tiradaInterval);
        tiradaInterval = null;
    }

    const modal = document.getElementById('modal-tirada');
    const lane = document.getElementById('tirada-lane');
    const ball = document.getElementById('tirada-ball');
    const titulo = document.getElementById('tirada-titulo');
    const subtitulo = document.getElementById('tirada-subtitulo');
    const objetivoEl = document.getElementById('tirada-objetivo');
    const out = document.getElementById('tirada-resultado');
    const btnImpulso = document.getElementById('tirada-btn-impulso');
    const btnContinuar = document.getElementById('tirada-btn-continuar');
    const elPer = document.getElementById('tirada-stat-percepcion');
    const elPul = document.getElementById('tirada-stat-pulso');
    const elFue = document.getElementById('tirada-stat-fuerza');
    const elSue = document.getElementById('tirada-stat-suerte');
    if (!modal || !lane || !ball || !titulo || !subtitulo || !objetivoEl || !out || !btnImpulso || !btnContinuar || !elPer || !elPul || !elFue || !elSue) {
        tiradaEnCurso = false;
        sincronizarPausaJuego();
        if (onFinish) onFinish({ resultado: 'fallo_total', pasadas: 0, total: 3, rompioBarrera: false });
        return;
    }

    limpiarTiradaVisual();
    titulo.innerText = config.titulo || 'Tirada de metricas';
    subtitulo.innerText = config.subtitulo || 'Penalizaciones activas del caso.';
    objetivoEl.innerText = config.objetivo || 'Objetivo: completar diagnostico/reparacion con precision.';
    modal.classList.remove('hidden');
    sincronizarPausaJuego();

    const laneH = lane.clientHeight || 170;
    const laneW = lane.clientWidth || 420;
    const totalBarreras = 3;
    const xs = [0.34, 0.58, 0.8].map(p => Math.round(laneW * p));
    const nombres = config.nombresMetricas || ['Sintoma ambiguo', 'Interferencia tecnica', 'Riesgo de error'];
    const habilidad = clamp01(config.habilidad || 0.5);
    const precision = clamp01(config.precision || habilidad);
    const dificultad = Math.max(0, Math.min(1, config.dificultad || 0.5));
    const puedeRomper = !!config.puedeRomper;
    const atributos = {
        percepcion: clamp01((config.atributos && config.atributos.percepcion) || habilidad),
        pulso: clamp01((config.atributos && config.atributos.pulso) || precision),
        fuerza: clamp01((config.atributos && config.atributos.fuerza) || habilidad),
        suerte: clamp01((config.atributos && config.atributos.suerte) || 0.5)
    };
    elPer.innerText = `${Math.round(atributos.percepcion * 100)}%`;
    elPul.innerText = `${Math.round(atributos.pulso * 100)}%`;
    elFue.innerText = `${Math.round(atributos.fuerza * 100)}%`;
    elSue.innerText = `${Math.round(atributos.suerte * 100)}%`;

    const barreras = xs.map((x, i) => {
        const aberturaBase = 34 + (atributos.percepcion * 50) + (atributos.suerte * 12) - (dificultad * 32) + ((Math.random() - 0.5) * 8);
        const abertura = Math.max(24, Math.min(110, Math.round(aberturaBase)));
        const centro = Math.max(22, Math.min(laneH - 22, Math.round((laneH * (0.25 + Math.random() * 0.5)) + ((atributos.pulso - 0.5) * 22))));

        const bar = document.createElement('div');
        bar.className = 'tirada-barrier';
        bar.style.left = `${x}px`;

        const gap = document.createElement('div');
        gap.className = 'tirada-gap';
        gap.style.top = `${centro - (abertura / 2)}px`;
        gap.style.height = `${abertura}px`;
        bar.appendChild(gap);

        const lbl = document.createElement('div');
        lbl.className = 'tirada-label';
        lbl.style.left = `${x + 9}px`;
        lbl.innerText = nombres[i] || `M${i + 1}`;

        lane.appendChild(bar);
        lane.appendChild(lbl);
        return { x, centro, abertura, node: bar, rota: false, nombre: nombres[i] || `M${i + 1}` };
    });

    let y = Math.max(10, Math.min(laneH - 10, (laneH / 2) + ((Math.random() - 0.5) * (58 - (atributos.pulso * 30)))));
    let x = 8;
    let vx = 1.55 + (habilidad * 1.25);
    let pasadas = 0;
    let idxBarrera = 0;
    let rompio = false;
    let drift = (Math.random() - 0.5) * (1.15 - (atributos.pulso * 0.75));
    let finalizado = false;

    function finalizar(resultado) {
        if (finalizado) return;
        finalizado = true;
        if (tiradaInterval) {
            clearInterval(tiradaInterval);
            tiradaInterval = null;
        }
        const textos = {
            fallo_total: 'Fallo total: te frenaron las penalizaciones iniciales del caso.',
            parcial: 'Exito parcial: superaste algunos obstaculos tecnicos, pero no todos.',
            critico: 'Exito critico: superaste todos los obstaculos y alcanzaste el objetivo tecnico.'
        };
        out.classList.remove('tirada-result-ok', 'tirada-result-warn');
        out.classList.add(resultado === 'critico' ? 'tirada-result-ok' : 'tirada-result-warn');
        out.innerText = textos[resultado] || 'Resultado resuelto.';
        btnContinuar.disabled = false;
        btnContinuar.onclick = () => {
            modal.classList.add('hidden');
            tiradaEnCurso = false;
            if (tiradaKeyHandler) {
                document.removeEventListener('keydown', tiradaKeyHandler);
                tiradaKeyHandler = null;
            }
            sincronizarPausaJuego();
            if (onFinish) onFinish({ resultado, pasadas, total: totalBarreras, rompioBarrera: rompio });
        };
    }

    function registrarImpulso() {
        if (finalizado) return;
        out.innerText = 'Impulso aplicado. Ajustando pulso tecnico.';
        tiradaImpulsoFrames = Math.min(16, tiradaImpulsoFrames + 7);
    }

    btnImpulso.onclick = registrarImpulso;
    tiradaKeyHandler = (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            registrarImpulso();
        }
    };
    document.addEventListener('keydown', tiradaKeyHandler);

    out.innerText = 'Lanzando... usa impulso para ajustar la pelota.';
    tiradaInterval = setInterval(() => {
        x += vx;
        if (idxBarrera < barreras.length && tiradaImpulsoFrames > 0) {
            const objetivo = barreras[idxBarrera].centro;
            y += (objetivo - y) * 0.12;
            drift *= 0.96;
            tiradaImpulsoFrames -= 1;
        } else {
            y += drift;
        }
        y += (Math.random() - 0.5) * (0.65 - (atributos.pulso * 0.4));
        y = Math.max(7, Math.min(laneH - 7, y));
        ball.style.left = `${x}px`;
        ball.style.top = `${y - 7}px`;

        if (idxBarrera < barreras.length && x >= barreras[idxBarrera].x) {
            const b = barreras[idxBarrera];
            const minY = b.centro - (b.abertura / 2);
            const maxY = b.centro + (b.abertura / 2);
            const paso = y >= minY && y <= maxY;

            if (paso) {
                pasadas += 1;
                out.classList.remove('tirada-result-ok', 'tirada-result-warn');
                out.classList.add('tirada-result-ok');
                out.innerText = `Correcto: obstáculo superado (${b.nombre}).`;
                idxBarrera += 1;
            } else if (Math.random() < (0.08 + (atributos.suerte * 0.22))) {
                pasadas += 1;
                out.classList.remove('tirada-result-ok', 'tirada-result-warn');
                out.classList.add('tirada-result-ok');
                out.innerText = `Correcto por suerte: superaste ${b.nombre} por poco.`;
                idxBarrera += 1;
            } else if (puedeRomper && !rompio && Math.random() < (0.2 + (atributos.fuerza * 0.42))) {
                rompio = true;
                b.rota = true;
                b.node.classList.add('broken');
                pasadas += 1;
                out.classList.remove('tirada-result-ok', 'tirada-result-warn');
                out.classList.add('tirada-result-ok');
                out.innerText = `Correcto por fuerza: neutralizaste ${b.nombre}.`;
                idxBarrera += 1;
            } else {
                vx = 0;
                out.classList.remove('tirada-result-ok', 'tirada-result-warn');
                out.classList.add('tirada-result-warn');
                out.innerText = `Incorrecto: fallaste ${b.nombre}. Ajusta el pulso y vuelve a intentarlo.`;
                const res = pasadas === 0 ? 'fallo_total' : 'parcial';
                finalizar(res);
            }
        }

        if (x >= (laneW - 18)) {
            finalizar(pasadas >= totalBarreras ? 'critico' : (pasadas > 0 ? 'parcial' : 'fallo_total'));
        }
    }, 24);
}

function gestionarMecanico(idx, idCasoEsperado, asignacionDirecta) {
    function bloquearAsignacion(razon) {
        const texto = `Bloqueado: ${razon}`;
        window.ultimoBloqueoAsignacionTaller = texto;
        log(texto, 'error');
        if (typeof mostrarFeedbackGameplay === 'function') {
            mostrarFeedbackGameplay(texto, 'error');
        }
    }

    if (!clienteActual) {
        bloquearAsignacion('no hay cliente activo para asignar.');
        return false;
    }
    const claveEsperada = String(idCasoEsperado || '').trim();
    const claveActiva = String(clienteActual.idCaso || '').trim();
    if (claveEsperada && claveActiva !== claveEsperada) {
        bloquearAsignacion(`identidad invalida: seleccionaste ${claveEsperada}, pero esta activo ${claveActiva || 'ningun caso'}.`);
        return false;
    }
    const m = mecanicos[idx];
    const reparacionActivaMecanico = obtenerTrabajoAsignadoMecanico(m && m.nombre);
    if (reparacionActivaMecanico) {
        bloquearAsignacion(`${m.nombre} sigue ocupado con ${reparacionActivaMecanico.idCaso || 'un caso activo'}.`);
        return false;
    }
    const reparacionExistenteCaso = obtenerReparacionTallerPorCaso(clienteActual && clienteActual.idCaso);
    if (reparacionExistenteCaso) {
        bloquearAsignacion(`el caso ${reparacionExistenteCaso.idCaso || 'activo'} ya esta en reparaciones.`);
        return false;
    }
    const modoSinCierre = (typeof estaModoSinCierreDia === 'function' && estaModoSinCierreDia());
    if (modoSinCierre && (m.bloqueadoHastaDia || 0) >= dia) m.bloqueadoHastaDia = 0;
    if (!modoSinCierre && m.bloqueadoHastaDia >= dia) {
        bloquearAsignacion(`${m.nombre} esta bloqueado por pelea hoy.`);
        return false;
    }
    if ((m.enfriamientoTurnos || 0) > 0) {
        bloquearAsignacion(`${m.nombre} en enfriamiento (${formatearTiempoTrabajo(m.enfriamientoTurnos)}).`);
        return false;
    }
    if ((m.bloqueoAyudaTurnos || 0) > 0) {
        bloquearAsignacion(`${m.nombre} esta resolviendo un asunto personal (${formatearBloqueoAyudaMecanico(m.bloqueoAyudaTurnos)}).`);
        return false;
    }

    if (!clienteActual.diagnosticado) {
        if (!asignacionDirecta && (!clienteActual.habloConCliente || (clienteActual.entrevistasHechas || 0) < 1)) {
            bloquearAsignacion(`entrevista primero a ${clienteActual.personaNombre || clienteActual.nombre || 'este cliente'} desde Mi puesto.`);
            return false;
        }
        log(`Caso ${clienteActual.idCaso || 'CASO-0000'} sin dictamen humano: ${m.nombre} iniciara diagnostico por encargo del jugador.`, 'info');
        return !!diagnosticarConMecanico(idx, claveEsperada || claveActiva);
    }

    if (!clienteActual.aprobacionCliente) {
        bloquearAsignacion('primero consigue aprobacion del cliente por negociacion o WhatsApp antes de arrancar reparacion.');
        return false;
    }

    if (clienteActual.esVIP && clienteActual.etapaVIP === 2) {
        bloquearAsignacion('cliente VIP en etapa 2: instala Pieza VIP y luego asigna reparacion final.');
        return false;
    }

    log(`Paso final: ${m.nombre} entrara a reparar con estrategia ${estrategiaCliente}.`, 'info');
    return !!asignarMecanico(idx, claveEsperada || claveActiva);
}

function obtenerPerfilRasgosMecanico(nombre) {
    const key = String(nombre || '').toLowerCase();
    const perfilMoreni = {
        ventaja: 'Consistente: evita fallos totales y deja mejor cobro.',
        desventaja: 'Ritmo normal, sin picos fuertes de velocidad.',
        bonusProbEstable: 0.04,
        bonusGananciaPct: 0.12,
        evitarFalloTotalDx: true,
        evitarFalloTotalReparacion: true,
        controlCalidadPerfecto: true,
        // Contrapeso de su control de calidad: exige supervision y energia.
        costoHambreTrabajo: 5
    };
    const mapa = {
        frandy: {
            ventaja: 'Rapido cuando le recuerdas la prioridad del caso.',
            desventaja: 'Si no lo supervisas, se distrae y alarga el trabajo.',
            necesitaRecordatorio: true,
            bonusProbConRecordatorio: 0.05,
            bonusTiempoConRecordatorio: -1,
            penalProbSinRecordatorio: -0.06,
            penalTiempoSinRecordatorio: 2
        },
        maicol: {
            ventaja: 'Brilla en averias electricas y de sensores.',
            desventaja: 'Fuera de electricidad puede romper piezas instaladas.',
            bonusProbEspecialidad: 0.14,
            bonusTiempoEspecialidad: -1,
            penalProbFueraEspecialidad: -0.07,
            chanceRomperPiezaEspecialidad: 0.12,
            chanceRomperPiezaGeneral: 0.22
        },
        diego: {
            ventaja: 'Especialista en transmision: mejora la precision de cajas y cambios.',
            desventaja: 'Fuera de transmision trabaja con menos velocidad.',
            bonusProbEspecialidad: 0.12,
            bonusTiempoEspecialidad: -1,
            penalProbFueraEspecialidad: -0.06,
            penalTiempoFueraEspecialidad: 1
        },
        ridalvi: {
            ventaja: 'Puede continuar la reparacion sin esperar piezas de continuacion.',
            desventaja: 'Nunca queda conforme con el dueño: pierde lealtad poco a poco y exige reconocimiento.',
            bonusProbUrgencia: 0.07,
            bonusTiempoUrgencia: -1,
            penalProbSinUrgencia: -0.03,
            ignoraPiezasReparacion: true,
            penalLealtadDuenoPorTrabajo: 1
        },
        jeral: {
            ventaja: 'Muy estable: reduce errores por tension del equipo.',
            desventaja: 'Puede equivocarse en un diagnostico, pero no pierde rendimiento por hambre, sueno, estres o humor.',
            bonusProbEstable: 0.06,
            penalTiempoLento: 1,
            inmuneEstadosFisicos: true
        },
        edwin: {
            ventaja: 'Top en transmision y calibracion fina.',
            desventaja: 'Si la pieza es basica se pone estricto y pierde ritmo.',
            bonusProbEspecialidad: 0.12,
            bonusTiempoEspecialidad: -1,
            penalProbPiezaBasica: -0.08,
            penalTiempoPiezaBasica: 1
        },
        stewart: {
            ventaja: 'Muy rapido y preciso en casos exigentes.',
            desventaja: 'Tras cerrar un caso necesita enfriamiento prolongado.',
            bonusProbRitmoAlto: 0.11,
            bonusTiempoRitmoAlto: -2,
            bonusTiempoDiagnostico: -1,
            enfriamientoBasePostTrabajo: 2,
            enfriamientoExtraPostTrabajo: 3
        },
        morenai: perfilMoreni,
        moreni: perfilMoreni,
        miguel: {
            ventaja: 'Comodin rapido: puede entrar casi en cualquier tipo de caso y acelerar cierre.',
            desventaja: 'Temperamental: en clima tenso tiene mas riesgo de pelea de piso.',
            especialidadComodin: true,
            bonusProbRitmoAlto: 0.09,
            bonusTiempoRitmoAlto: -1,
            bonusTiempoDiagnostico: -1
        },
        martin: {
            ventaja: 'Comodin: acepta cualquier tipo de caso sin penalizacion de especialidad.',
            desventaja: 'Se enferma con frecuencia; al terminar un trabajo puede quedar fuera de servicio sin aviso.',
            especialidadComodin: true,
            chanceSorpresaEnfermedad: 0.30,
            turnosEnfermedadSorpresa: 3
        }
    };
    return mapa[key] || {
        ventaja: 'Tecnico generalista del taller.',
        desventaja: 'Sin rasgo especial definido.',
        bonusProbEstable: 0,
        penalTiempoLento: 0
    };
}

function obtenerPiezasPendientesMecanico(cliente) {
    if (!cliente || !Array.isArray(cliente.piezasRequeridasMecanico)) return [];
    const instaladas = Array.isArray(cliente.piezasInstaladasMecanico) ? cliente.piezasInstaladasMecanico : [];
    return cliente.piezasRequeridasMecanico.filter(function(p) {
        return p && p.id && instaladas.indexOf(p.id) < 0;
    });
}

function solicitarPiezasInicialesMecanico(cliente, mecanico) {
    if (!cliente) return [];
    if (obtenerPiezasPendientesMecanico(cliente).length) return obtenerPiezasPendientesMecanico(cliente);

    const pool = seleccionarRepuestosCompatibles(cliente, cliente.especialidadIdeal, 99);
    if (!pool.length) return [];

    const requiereDos = (cliente.complicaciones || []).length >= 2 || (cliente.dificultad || 0) >= 0.95;
    const total = (requiereDos && Math.random() < 0.5) ? 2 : 1;
    const elegibles = pool.slice();

    const piezas = [];
    for (let i = 0; i < total && i < elegibles.length; i++) {
        const p = elegibles[i];
        piezas.push({ id: p.id, nombre: p.nombre, especialidad: p.especialidad });
    }

    cliente.piezasRequeridasMecanico = piezas;
    cliente.piezasInstaladasMecanico = [];
    cliente.mecanicoPendienteIdx = typeof mecanico === 'number' ? mecanico : null;
    return piezas;
}

function resolverTiradaOcultaReparacion(probabilidad) {
    const roll = Math.random();
    const probBase = Number(probabilidad);
    const prob = Number.isFinite(probBase)
        ? Math.max(0.05, Math.min(0.96, probBase))
        : 0.5;
    if (roll <= prob) return 'critico';
    if (roll <= Math.min(0.98, prob + 0.2)) return 'parcial';
    return 'fallo_total';
}

function calcularTiempoDiagnosticoMecanico(cliente, mecanico) {
    const rasgosMecanico = (typeof obtenerPerfilRasgosMecanico === 'function')
        ? obtenerPerfilRasgosMecanico(mecanico && mecanico.nombre)
        : {};
    const bonusTiempoDiagRasgo = Math.round(Number(rasgosMecanico.bonusTiempoDiagnostico || 0));


    // Null safety for mejoras
    const safeMejoras = (typeof mejoras === 'object' && mejoras !== null) ? mejoras : {};

    if (typeof modoNivelesActivo === 'function' && modoNivelesActivo()) {
        const bonusMaquina = safeMejoras.maquinaDiagnosis ? 1 : 0;
        return Math.max(32, Math.min(210, Math.round(calcularTiempoTrabajoReal(cliente, mecanico, 0, 0, bonusMaquina, 0.68) + bonusTiempoDiagRasgo)));
    }

    const complicacionesCaso = Array.isArray(cliente && cliente.complicaciones) ? cliente.complicaciones.length : 0;
    const base = escalarTiempoBaseOperacion(
        3
        + Math.round((((cliente && cliente.tiempo) || 5) * 0.55))
        + Math.round(complicacionesCaso * 0.8)
        + (((cliente && cliente.esVIP) || false) ? 1 : 0),
        'diagnostico');
    const bonusEspecialidad = (cliente && mecanico && cliente.especialidadIdeal === mecanico.especialidad) ? -1 : 0;
    const bonusVelocidad = ((typeof calcularVelocidadEfectiva === 'function' ? calcularVelocidadEfectiva(mecanico) : (mecanico && mecanico.velocidad) || 0.5) >= 0.74) ? -1 : 0;
    const bonusMaquina = safeMejoras.maquinaDiagnosis ? -1 : 0;
    const penalEnojo = Math.max(0, Math.round((((mecanico && mecanico.enojo) || 0) - 2) / 2));
    return Math.max(3, Math.min(14, base + bonusEspecialidad + bonusVelocidad + bonusMaquina + penalEnojo + bonusTiempoDiagRasgo));
}

function resolverDiagnosticoMecanicoOculto(cliente, mecanico) {
    asegurarExpedienteInspeccion(cliente);
    // Null safety for mejoras
    const safeMejoras = (typeof mejoras === 'object' && mejoras !== null) ? mejoras : {};
    const habilidadMecanico = Number.isFinite(Number(mecanico && mecanico.habilidad)) ? Number(mecanico.habilidad) : 0.5;
    const estresSeguro = Number.isFinite(Number(estres)) ? Number(estres) : 0;
    const nivelTallerSeguro = Number.isFinite(Number(tallerNivel)) ? Number(tallerNivel) : 1;
    const bonusInspeccion = Number.isFinite(Number(cliente.inspeccion && cliente.inspeccion.bonus)) ? Number(cliente.inspeccion && cliente.inspeccion.bonus) : 0;

    let bonusEnfoque = 0;
    if (enfoqueDiagnostico === 'motor') {
        bonusEnfoque = cliente.especialidadIdeal === 'motor' ? 0.12 : -0.06;
    } else if (enfoqueDiagnostico === 'transmision') {
        bonusEnfoque = cliente.especialidadIdeal === 'transmision' ? 0.12 : -0.06;
    } else if (enfoqueDiagnostico === 'escape') {
        const aciertaEscape = cliente.especialidadIdeal === 'motor' || cliente.especialidadIdeal === 'suspension';
        bonusEnfoque = aciertaEscape ? 0.09 : -0.04;
    } else if (enfoqueDiagnostico === 'electricidad') {
        const aciertaElectricidad = cliente.especialidadIdeal === 'electricidad' || cliente.especialidadIdeal === 'motor';
        bonusEnfoque = aciertaElectricidad ? 0.11 : -0.05;
    } else if (enfoqueDiagnostico === 'frenos') {
        const aciertaFrenos = cliente.especialidadIdeal === 'frenos' || cliente.especialidadIdeal === 'suspension';
        bonusEnfoque = aciertaFrenos ? 0.11 : -0.05;
    } else if (enfoqueDiagnostico === 'suspension') {
        const aciertaSuspension = cliente.especialidadIdeal === 'suspension' || cliente.especialidadIdeal === 'frenos';
        bonusEnfoque = aciertaSuspension ? 0.1 : -0.04;
    }

    // Este es el diagnóstico automático del mecánico: no depende de que el
    // dueño haya entrevistado al cliente. La desconfianza social pertenece al
    // flujo manual/negociación, no al trabajo técnico del mecánico.
    let modHabla = 0;

    let detectoContradiccion = false;
    let contradiccionFallida = false;
    if (cliente.contradiccionActiva && !cliente.contradiccionDetectada) {
        const detectorExperto = (habilidadMecanico >= 0.8) || (safeMejoras.maquinaDiagnosis && mecanico.especialidad === cliente.especialidadIdeal);
        if (detectorExperto) {
            detectoContradiccion = true;
            modHabla += 0.08;
        } else {
            // No detectar la contradicción no debe convertir el diagnóstico
            // automático en un fallo forzado; solo reduce la precisión final.
            contradiccionFallida = true;
        }
    } else {
        modHabla += (cliente.bonusContradiccion || 0);
    }
    if (cliente.contradiccionDetectada) modHabla += 0.06;

    var jeralProtegido = mecanicoIgnoraEstadosFisicos(mecanico);
    let prob = 0.38
        + (habilidadMecanico * 0.45)
        + modHabla
        + bonusInspeccion
        + (safeMejoras.maquinaDiagnosis ? 0.2 : 0)
        + ((nivelTallerSeguro - 1) * 0.04)
        - (jeralProtegido ? 0 : (estresSeguro / 250))
        ;
    if (mecanico.especialidad === cliente.especialidadIdeal) prob += 0.18;
    prob += bonusEnfoque;
    if (!Number.isFinite(prob)) prob = 0.5;
    prob = Math.min(0.98, Math.max(0.22, prob));

    const bonusTxtDx = [];
    if (safeMejoras.maquinaDiagnosis) bonusTxtDx.push('+ maquina');
    if (detectoContradiccion) bonusTxtDx.push('+ contradiccion detectada');
    if (contradiccionFallida) bonusTxtDx.push('- relato contradictorio');
    if (bonusInspeccion > 0) bonusTxtDx.push(`+ inspeccion ${Math.round(bonusInspeccion * 100)}%`);
    if (estres > 55 && !jeralProtegido) bonusTxtDx.push('- estres alto');
    if (enfoqueDiagnostico !== 'general') bonusTxtDx.push(`enfoque ${enfoqueDiagnostico}${bonusEnfoque >= 0 ? ' +' : ' -'}`);

    const rasgosMecanico = (typeof obtenerPerfilRasgosMecanico === 'function')
        ? obtenerPerfilRasgosMecanico(mecanico && mecanico.nombre)
        : {};
    // La tirada nunca debe recibir NaN: una comparación con NaN cae siempre
    // en fallo_total y hacía que todos los diagnósticos parecieran fallidos.
    if (!Number.isFinite(prob)) prob = 0.5;
    const resultadoBase = resolverTiradaOcultaReparacion(prob);
    const resultado = rasgosMecanico.controlCalidadPerfecto
        ? 'critico'
        : ((rasgosMecanico.evitarFalloTotalDx || contradiccionFallida) && resultadoBase === 'fallo_total')
        ? 'parcial'
        : resultadoBase;
    if (resultado !== resultadoBase) bonusTxtDx.push('+ control de calidad');
    const fallosPrincipales = Array.isArray(cliente.fallosPrincipales) && cliente.fallosPrincipales.length
        ? cliente.fallosPrincipales.slice()
        : [cliente.nombre || 'Revision general'];
    const diagnosticosDetectados = resultado === 'critico'
        ? fallosPrincipales
        : (resultado === 'parcial' ? [fallosPrincipales[0]] : []);

    return {
        resultado: resultado === 'fallo_total' ? 'fallo' : resultado,
        probabilidad: prob,
        detectoContradiccion: detectoContradiccion,
        contradiccionFallida: contradiccionFallida,
        subtitulo: bonusTxtDx.length ? bonusTxtDx.join(' | ') : 'base limpia',
        diagnosticosDetectados: diagnosticosDetectados,
        diagnosticoDetectado: resultado === 'critico'
            ? fallosPrincipales.join(' | ')
            : (resultado === 'parcial' ? `Diagnostico parcial: ${fallosPrincipales[0]}` : 'Averia no confirmada'),
        diagnosticoNivel: resultado === 'fallo_total' ? 'fallo' : resultado
    };
}

function completarDiagnosticoMecanico(rep) {
    if (!rep || rep.tipoTrabajo !== 'diagnostico') return false;

    const caso = rep.casoRef && typeof rep.casoRef === 'object'
        ? rep.casoRef
        : ((clienteActual && clienteActual.idCaso === rep.idCaso) ? clienteActual : null);
    const m = (mecanicos || []).find(function(mx) {
        return mx && mx.nombre === rep.mecanicoNombre;
    }) || null;
    const resultado = rep.resultadoDiagnostico || {
        resultado: 'fallo',
        diagnosticoDetectado: 'Averia no confirmada',
        diagnosticosDetectados: [],
        diagnosticoNivel: 'fallo'
    };

    if (caso) {
        if (resultado.detectoContradiccion) {
            caso.contradiccionDetectada = true;
            caso.bonusContradiccion = 0.08;
        }
        caso.diagnosticado = true;
        caso.diagnosticoCorrecto = resultado.resultado === 'critico';
        caso.diagnosticoNivel = resultado.diagnosticoNivel || (resultado.resultado === 'fallo' ? 'fallo' : resultado.resultado);
        caso.diagnosticosDetectados = Array.isArray(resultado.diagnosticosDetectados) ? resultado.diagnosticosDetectados.slice() : [];
        caso.diagnosticoSeleccionado = caso.diagnosticosDetectados[0] || caso.diagnosticoSeleccionado || '';
        caso.diagnosticoDetectado = resultado.diagnosticoDetectado || 'Averia no confirmada';
        caso.negociado = false;
        caso.aprobacionCliente = false;
        caso.aprobadoCliente = false;
        caso.tiempo = Math.max(2, Math.round((caso.tiempo || tiempoCliente || 6) - 2));

        if (caso.esVIP) {
            caso.etapaVIP = Math.max(caso.etapaVIP || 1, 2);
        }

        if (resultado.resultado === 'critico') {
            resumenDia.diagnosticosCorrectos++;
            reputacion += 1;
            log(`${rep.mecanicoNombre} cerro un diagnostico preciso para ${rep.idCaso || 'CASO-0000'}.`, 'exito');
        } else if (resultado.resultado === 'parcial') {
            resumenDia.diagnosticosParciales++;
            estres = Math.min(100, estres + 2);
            log(`${rep.mecanicoNombre} dejo un diagnostico parcial en ${rep.idCaso || 'CASO-0000'}.`, 'info');
        } else {
            resumenDia.diagnosticosFallidos++;
            estres = Math.min(100, estres + 6);
            if (m) m.enojo = Math.min(8, (m.enojo || 0) + 1);
            log(`${rep.mecanicoNombre} no pudo confirmar la averia de ${rep.idCaso || 'CASO-0000'}.`, 'error');
        }

        const detalle = resultado.resultado === 'critico'
            ? `${rep.mecanicoNombre} completo el diagnostico. Dictamen listo para aprobacion.`
            : (resultado.resultado === 'parcial'
                ? `${rep.mecanicoNombre} completo un diagnostico parcial. Revisa el dictamen antes de aprobar.`
                : `${rep.mecanicoNombre} termino el diagnostico sin confirmar la averia. Revisa el expediente.`);
        actualizarCasoAtendido(caso, 'esperando_aprobacion', detalle);
        if (clienteActual && clienteActual.idCaso === rep.idCaso) {
            tiempoCliente = caso.tiempo;
        }
    }

    // DX rapido confirma automaticamente un dictamen correcto y deja el caso
    // esperando la pieza; no obliga al dueño a revisar lo ya resuelto.
    var dxRapidoContinua = !!(rep.dxRapido && resultado.resultado === 'critico' && caso);
    if (dxRapidoContinua) {
        caso.aprobacionCliente = true;
        caso.aprobadoCliente = true;
        rep.tipoTrabajo = 'pedir_piezas';
        rep.pausadaPorPieza = true;
        rep.pedidoPendienteDelivery = false;
        actualizarCasoAtendido(caso, 'esperando_pieza', 'DX rapido confirmado. Pide la pieza necesaria para continuar.');
        if (typeof mostrarFeedbackGameplay === 'function') mostrarFeedbackGameplay('DX rapido confirmado: pide la pieza necesaria para continuar.', 'ok');
    }

    // El diagnostico normal termina aqui. Aprobacion y reparacion son fases separadas.
    if (m) {
        m.ocupado = false;
        m.enfriamientoTurnos = 0;
    }
    if (caso && !dxRapidoContinua) {
        if (!Array.isArray(casosPendientesDiagnostico)) casosPendientesDiagnostico = [];
        casosPendientesDiagnostico = casosPendientesDiagnostico.filter(function(c) {
            return !(c && c.idCaso === caso.idCaso);
        });
        casosPendientesDiagnostico.push(caso);
    }
    log((rep.mecanicoNombre || 'Mecanico') + ' termino el diagnostico de ' + (rep.idCaso || 'CASO-0000') + '. Revisa el dictamen y consigue aprobacion antes de reparar.', 'info');
    if (m && typeof pushMensajeTelefono === 'function') {
        var bonusEquipoDx = (mejoras && mejoras.maquinaDiagnosis) ? ' La Maquina DX ayudo con una lectura OBD mas precisa.' : '';
        pushMensajeTelefono('mec_' + m.nombre, 'mec_' + m.nombre,
            'Termine el diagnostico de ' + (rep.idCaso || 'CASO-0000') + ': ' + (resultado.diagnosticoDetectado || 'dictamen pendiente de revision') + '.' + bonusEquipoDx + ' Falta tu revision y la aprobacion del cliente antes de reparar.', {
                clave: 'dx-completado-' + (rep.idCaso || Date.now())
            });
    }
    if (typeof mostrarFeedbackGameplay === 'function') {
        mostrarFeedbackGameplay('Diagnostico listo. Abre el caso, revisa el dictamen y consigue aprobacion.', 'ok');
        if (resultado.contradiccionFallida) mostrarFeedbackGameplay('El mecanico encontro un relato contradictorio: el resultado queda parcial, pero el caso no se pierde.', 'warn');
    }
    enfoqueDiagnostico = 'general';
    return dxRapidoContinua ? 'pedir_piezas' : 'diagnostico_completado';
}

function diagnosticarConMecanico(idx, idCasoEsperado) {
    if (!clienteActual) {
        log('No hay cliente para diagnosticar', 'error');
        return false;
    }
    const claveEsperada = String(idCasoEsperado || '').trim();
    const claveActiva = String(clienteActual.idCaso || '').trim();
    if (claveEsperada && claveActiva !== claveEsperada) {
        log(`Asignacion cancelada: ${claveEsperada} no coincide con ${claveActiva || 'ningun expediente'}.`, 'error');
        return false;
    }
    if (clienteActual.diagnosticado) {
        log('Este cliente ya fue diagnosticado.', 'info');
        return false;
    }
    const m = mecanicos[idx];
    if (!m || typeof m !== 'object') {
        log('Mecanico invalido para iniciar el diagnostico.', 'error');
        if (typeof mostrarFeedbackGameplay === 'function') {
            mostrarFeedbackGameplay('No se pudo asignar: selecciona un mecanico disponible.', 'error');
        }
        return false;
    }
    const reparacionExistenteCaso = obtenerReparacionTallerPorCaso(clienteActual && clienteActual.idCaso);
    if (reparacionExistenteCaso) {
        log(`El caso ${reparacionExistenteCaso.idCaso || 'activo'} ya esta en reparaciones.`, 'error');
        return false;
    }
    const reparacionActivaMecanico = obtenerTrabajoAsignadoMecanico(m && m.nombre);
    if (reparacionActivaMecanico) {
        log(`${m.nombre} sigue ocupado con ${reparacionActivaMecanico.idCaso || 'un caso activo'}.`, 'error');
        return false;
    }
    const modoSinCierre = (typeof estaModoSinCierreDia === 'function' && estaModoSinCierreDia());
    if (modoSinCierre && (m.bloqueadoHastaDia || 0) >= dia) m.bloqueadoHastaDia = 0;
    if (!modoSinCierre && m.bloqueadoHastaDia >= dia) {
        log(`${m.nombre} no puede diagnosticar hoy.`, 'error');
        return false;
    }
    if (m.renunciaInminente) {
        log(`${m.nombre} esta considerando renunciar. Resuelve el conflicto primero con un bono de calma.`, 'error');
        return false;
    }
    if (m.enojo >= 5) {
        incrementarBloqueoEnojo(m);
        log(`${m.nombre} esta demasiado enojado para trabajar.`, 'error');
        if (typeof pushMensajeTelefono === 'function') pushMensajeTelefono('mec_' + m.nombre, 'personal', `${m.nombre} no puede diagnosticar: humor demasiado bajo y tension alta. Atiende su solicitud o mejora el animo del equipo desde Exterior > Comida.`, { clave: 'bloqueo-humor-' + m.nombre + '-' + (clienteActual.idCaso || '') });
        if (typeof mostrarFeedbackGameplay === 'function') mostrarFeedbackGameplay(`${m.nombre} no puede diagnosticar: humor ${Math.round(Number(m.humor || 0))}/10 y tension alta. Revisa su tarjeta o resuelve su solicitud en Telefono.`, 'warn');
        return false;
    }
    if ((m.enfriamientoTurnos || 0) > 0) {
        log(`${m.nombre} sigue ocupado (${formatearTiempoTrabajo(m.enfriamientoTurnos)}).`, 'error');
        if (typeof mostrarFeedbackGameplay === 'function') mostrarFeedbackGameplay(`${m.nombre} esta en enfriamiento: espera ${formatearTiempoTrabajo(m.enfriamientoTurnos)} antes de asignarle diagnostico.`, 'info');
        return false;
    }
    if ((m.bloqueoAyudaTurnos || 0) > 0) {
        log(`${m.nombre} esta fuera resolviendo un asunto personal (${formatearBloqueoAyudaMecanico(m.bloqueoAyudaTurnos)}).`, 'error');
        if (typeof mostrarFeedbackGameplay === 'function') mostrarFeedbackGameplay(`${m.nombre} no puede diagnosticar: esta atendiendo una necesidad personal. Abre Telefono > ${m.nombre} para resolverla.`, 'warn');
        return false;
    }
    if (!Array.isArray(reparacionesActivas)) reparacionesActivas = [];
    if (typeof espaciosReparacionMax !== 'number' || espaciosReparacionMax < 1) {
        espaciosReparacionMax = (ECONOMY_DATA && ECONOMY_DATA.espaciosReparacionInicial) || 2;
    }
    const trabajosEnCurso = reparacionesActivas.filter(function (rep) { return rep && !rep.listoParaCobro; }).length;
    if (trabajosEnCurso >= espaciosReparacionMax) {
        log('No hay espacio libre en el taller para abrir diagnostico.', 'error');
        return false;
    }
    if (!consumirFoco('diagnostico')) return false;
    if (typeof asegurarDiagnosticoJugador === 'function') asegurarDiagnosticoJugador(clienteActual);
    const casoAsignado = clienteActual;
    const tiempoDiagnostico = calcularTiempoDiagnosticoMecanico(casoAsignado, m);
    const usaTiempoDirecto = typeof modoNivelesActivo === 'function' && modoNivelesActivo();
    const duracionDiagnosticoSeg = obtenerDuracionTrabajoTiempoRealSeg(tiempoDiagnostico, usaTiempoDirecto);
    const resultadoDiagnostico = resolverDiagnosticoMecanicoOculto(casoAsignado, m);

    m.trabajosHoy += 1;
    m.ocupado = true;
    m.enfriamientoTurnos = tiempoDiagnostico;
    aplicarCelos(m.nombre);
    revisarPeleaRivales(m);

    reparacionesActivas.push({
        idCaso: casoAsignado.idCaso,
        personaNombre: casoAsignado.personaNombre,
        vehiculo: casoAsignado.vehiculo,
        clienteNombre: casoAsignado.nombre,
        mecanicoNombre: m.nombre,
        tiempoRestante: tiempoDiagnostico,
        tiempoTotal: tiempoDiagnostico,
        duracionRealSeg: duracionDiagnosticoSeg,
        segundosPendientesReal: duracionDiagnosticoSeg,
        ultimoTiempoSyncMs: Date.now(),
        tipoTrabajo: 'diagnostico',
        listoParaCobro: false,
        pausadaPorPieza: false,
        resultadoDiagnostico: resultadoDiagnostico,
        casoRef: casoAsignado,
        subtituloResultado: resultadoDiagnostico.subtitulo,
        especialidadIdeal: casoAsignado.especialidadIdeal
    });

    actualizarCasoAtendido(
        casoAsignado,
        'en_diagnostico',
        `${m.nombre} inicio diagnostico. Tiempo estimado ${formatearEstimadoTrabajoTiempoReal(tiempoDiagnostico, usaTiempoDirecto)}.`
    );
    log(`${m.nombre} tomo ${casoAsignado.idCaso || 'CASO-0000'} para diagnostico. ETA ${formatearEstimadoTrabajoTiempoReal(tiempoDiagnostico, usaTiempoDirecto)}.`, 'info');
    if (typeof mostrarFeedbackGameplay === 'function') {
        mostrarFeedbackGameplay(`Diagnostico en curso: ${m.nombre} -> ${casoAsignado.idCaso || 'CASO-0000'} | ETA ${formatearEstimadoTrabajoTiempoReal(tiempoDiagnostico, usaTiempoDirecto)}`, 'ok');
    }

    enfoqueDiagnostico = 'general';
    clienteActual = null;
    window.toolbarCasosTrabajoAbierto = true;
    consumirTurno('diagnostico mecanico', COSTOS_TURNO.diagnostico);
    if (typeof actualizarUI === 'function') actualizarUI();
    if (typeof autoGuardarPartidaSilenciosa === 'function') {
        autoGuardarPartidaSilenciosa('diagnostico-mecanico-iniciado');
    }

    return true;
}

// --- Necesidad: mensaje si un mecánico es usado en dos casos distintos ---
// Se guarda un registro por mecánico de los casos únicos asignados
window.mecanicoCasosAsignados = window.mecanicoCasosAsignados || {};

function obtenerReparacionTallerPorCaso(idCaso) {
    var clave = String(idCaso || '').trim();
    if (!clave || !Array.isArray(reparacionesActivas)) return null;
    return reparacionesActivas.find(function(rep) {
        return rep && String(rep.idCaso || '').trim() === clave;
    }) || null;
}

function obtenerTrabajoAsignadoMecanico(nombreMecanico) {
    var clave = String(nombreMecanico || '').trim();
    if (!clave || !Array.isArray(reparacionesActivas)) return null;
    var trabajos = reparacionesActivas.filter(function(rep) {
        return rep && String(rep.mecanicoNombre || '').trim() === clave;
    });
    var perfil = Array.isArray(mecanicos) ? mecanicos.find(function(m) { return m && String(m.nombre || '').trim() === clave; }) : null;
    var capacidad = Math.max(1, Math.round((perfil && perfil.capacidadCasosSimultaneos) || 1));
    var activos = trabajos.filter(function(rep) { return !rep.listoParaCobro; });
    return activos.length >= capacidad ? (activos[0] || null) : null;
}

function asignarMecanico(idx, idCasoEsperado) {
    function bloquearAsignacion(razon) {
        const texto = `Bloqueado: ${razon}`;
        window.ultimoBloqueoAsignacionTaller = texto;
        log(texto, 'error');
        if (typeof mostrarFeedbackGameplay === 'function') {
            mostrarFeedbackGameplay(texto, 'error');
        }
    }

    function normalizarCasoParaReparacion(caso) {
        if (!caso || typeof caso !== 'object') return caso;
        if (!Array.isArray(caso.complicaciones)) caso.complicaciones = [];
        if (!Array.isArray(caso.fallosPrincipales)) caso.fallosPrincipales = [];
        if (!Array.isArray(caso.fallosAdicionalesDetectables)) caso.fallosAdicionalesDetectables = [];
        if (!Array.isArray(caso.diagnosticosDetectados)) caso.diagnosticosDetectados = [];
        if (!Array.isArray(caso.piezasRequeridasMecanico)) caso.piezasRequeridasMecanico = [];
        if (!Array.isArray(caso.piezasInstaladasMecanico)) caso.piezasInstaladasMecanico = [];
        if (typeof caso.pago !== 'number' || !isFinite(caso.pago)) caso.pago = 0;
        if (typeof caso.tiempo !== 'number' || !isFinite(caso.tiempo)) caso.tiempo = 6;
        if (typeof caso.dificultad !== 'number' || !isFinite(caso.dificultad)) caso.dificultad = 0.5;
        if (typeof caso.especialidadIdeal !== 'string' || !caso.especialidadIdeal) caso.especialidadIdeal = 'general';
        if (typeof caso.personaNombre !== 'string' || !caso.personaNombre) caso.personaNombre = caso.clienteNombre || caso.nombre || 'Cliente';
        if (typeof caso.nombre !== 'string' || !caso.nombre) caso.nombre = caso.personaNombre || 'Cliente';
        return caso;
    }

    if (!clienteActual) {
        bloquearAsignacion('no hay cliente activo para asignar.');
        return false;
    }
    const claveEsperada = String(idCasoEsperado || '').trim();
    const claveActiva = String(clienteActual.idCaso || '').trim();
    if (claveEsperada && claveActiva !== claveEsperada) {
        bloquearAsignacion(`identidad invalida: ${claveEsperada} no coincide con ${claveActiva || 'ningun caso'}.`);
        return false;
    }
    let m = mecanicos[idx];
    if (!m || typeof m !== 'object') {
        bloquearAsignacion('mecanico invalido para esta asignacion.');
        return false;
    }
    normalizarCasoParaReparacion(clienteActual);
    if (typeof asegurarIdCasoCliente === 'function') asegurarIdCasoCliente(clienteActual);
    const reparacionExistenteCaso = obtenerReparacionTallerPorCaso(clienteActual && clienteActual.idCaso);
    if (reparacionExistenteCaso) {
        bloquearAsignacion(`el caso ${reparacionExistenteCaso.idCaso || 'activo'} ya tiene una tarjeta activa.`);
        return false;
    }
    const reparacionActivaMecanico = obtenerTrabajoAsignadoMecanico(m && m.nombre);
    if (reparacionActivaMecanico) {
        bloquearAsignacion(`${m.nombre} sigue ocupado con ${reparacionActivaMecanico.idCaso || 'un caso activo'}.`);
        return false;
    }
    if (!Array.isArray(reparacionesActivas)) reparacionesActivas = [];
    if (typeof espaciosReparacionMax !== 'number' || espaciosReparacionMax < 1) {
        espaciosReparacionMax = (ECONOMY_DATA && ECONOMY_DATA.espaciosReparacionInicial) || 2;
    }
    const trabajosEnCurso = reparacionesActivas.filter(function (rep) { return rep && !rep.listoParaCobro; }).length;
    if (trabajosEnCurso >= espaciosReparacionMax) {
        bloquearAsignacion('no hay espacio libre en el taller.');
        return false;
    }
    if (clienteActual.esVIP && clienteActual.etapaVIP < 3) {
        bloquearAsignacion('cliente VIP no esta en etapa final de reparacion.');
        return false;
    }
    if (m.renunciaInminente) {
        bloquearAsignacion(`${m.nombre} esta considerando renunciar. Usa el bono de calma para restablecer la relacion.`);
        return false;
    }
    if (m.enojo >= 5) {
        incrementarBloqueoEnojo(m);
        bloquearAsignacion(`${m.nombre} esta demasiado enojado.`);
        return false;
    }
    const modoSinCierre = (typeof estaModoSinCierreDia === 'function' && estaModoSinCierreDia());
    if (modoSinCierre && (m.bloqueadoHastaDia || 0) >= dia) m.bloqueadoHastaDia = 0;
    if (!modoSinCierre && m.bloqueadoHastaDia >= dia) {
        bloquearAsignacion(`${m.nombre} esta bloqueado por pelea.`);
        return false;
    }
    if ((m.enfriamientoTurnos || 0) > 0) {
        bloquearAsignacion(`${m.nombre} sigue en enfriamiento (${formatearTiempoTrabajo(m.enfriamientoTurnos)}).`);
        return false;
    }
    if ((m.bloqueoAyudaTurnos || 0) > 0) {
        bloquearAsignacion(`${m.nombre} esta resolviendo un asunto personal (${formatearBloqueoAyudaMecanico(m.bloqueoAyudaTurnos)}).`);
        return false;
    }
    if (!clienteActual.diagnosticado) {
        bloquearAsignacion('este caso aun no tiene dictamen humano. Investiga y emite diagnostico antes de asignarlo.');
        return false;
    }
    if (!clienteActual.aprobacionCliente) {
        bloquearAsignacion('el cliente todavia no aprueba el trabajo. Negocia o confirma por WhatsApp antes de asignar reparacion.');
        return false;
    }
    if (!consumirFoco('reparacion')) {
        bloquearAsignacion('el taller no esta en condicion operativa para asignar reparacion.');
        return false;
    }
    clienteActual.mecanicoPendienteIdx = null;
    clienteActual.piezasRequeridasMecanico = [];
    clienteActual.piezasInstaladasMecanico = [];
    const casoAsignado = clienteActual;
    // --- Lógica de mensaje de necesidad ---
    if (casoAsignado && casoAsignado.idCaso && m && m.nombre) {
        const nombre = m.nombre;
        if (!window.mecanicoCasosAsignados[nombre]) {
            window.mecanicoCasosAsignados[nombre] = new Set();
        }
        window.mecanicoCasosAsignados[nombre].add(casoAsignado.idCaso);
        // Si el mecánico ha sido asignado a 2 o más casos únicos, enviar mensaje de necesidad
        if (window.mecanicoCasosAsignados[nombre].size === 2) {
            // Obtener texto de necesidad
            let necesidad = '';
            if (window.TallerData && window.TallerData.biografiasMecanicos && window.TallerData.biografiasMecanicos[nombre]) {
                necesidad = window.TallerData.biografiasMecanicos[nombre].necesidad || '';
            }
            if (necesidad && typeof pushMensajeTelefono === 'function') {
                pushMensajeTelefono('mec_' + nombre, 'mec_' + nombre, necesidad, {
                    clave: 'necesidad-mec-' + nombre
                });
            }
        }
    }
    const rasgosMecanico = obtenerPerfilRasgosMecanico(m.nombre);
    asegurarExpedienteInspeccion(clienteActual);
    const bonusInspeccion = (clienteActual.inspeccion && clienteActual.inspeccion.bonus) || 0;
    const diagnosticoNivelCaso = String(clienteActual.diagnosticoNivel || (clienteActual.diagnosticoCorrecto ? 'critico' : 'fallo')).toLowerCase();
    const riesgoDiagnosticoFallido = !!(clienteActual.diagnosticado && diagnosticoNivelCaso === 'fallo' && clienteActual.aprobacionCliente);

    // ── Pieza instalada bonus ──
    const pieza = clienteActual.piezaInstalada || null;
    const bonusPiezaProb = pieza ? pieza.bonusProb : 0;
    const bonusPiezaTiempo = pieza ? pieza.bonusTiempo : 0;
    const bonusPiezaGanancia = pieza ? pieza.bonusGanancia : 0;
    if (pieza) {
        const especialidadMatch = pieza.especialidad === clienteActual.especialidadIdeal;
        log(`Pieza instalada: ${pieza.nombre}${especialidadMatch ? ' (especialidad exacta)' : ' (diferente sistema)'}.`, especialidadMatch ? 'exito' : 'info');

        // Maicol puede romper piezas si se acelera en casos fuera de electricidad.
        if (m.nombre === 'Maicol') {
            const chanceRomper = clienteActual.especialidadIdeal === 'electricidad'
                ? (rasgosMecanico.chanceRomperPiezaEspecialidad || 0)
                : (rasgosMecanico.chanceRomperPiezaGeneral || 0);
            if (Math.random() < chanceRomper) {
                registrarPiezaRotaPorMecanico(clienteActual, pieza, m.nombre);
                bloquearAsignacion(`${m.nombre} dano ${pieza.nombre}; debes recomprarla para continuar.`);
                actualizarUI();
                return false;
            }
        }
    }

    let bonusDiagnostico = 0;
    if (!clienteActual.diagnosticado) {
        bonusDiagnostico = -0.2;
        log('Entraste a reparar sin diagnostico. Riesgo alto.', 'error');
    } else if (diagnosticoNivelCaso === 'fallo') {
        bonusDiagnostico = -0.2;
    } else if (!clienteActual.diagnosticoCorrecto || diagnosticoNivelCaso === 'parcial') {
        bonusDiagnostico = -0.1;
    } else {
        bonusDiagnostico = 0.12;
    }

    let bonusEspecialidad = 0;
    if (clienteActual.especialidadIdeal === m.especialidad) {
        bonusEspecialidad = 0.15;
    }

    let modEstrategiaProb = 0;
    let modEstrategiaPago = 1;
    if (estrategiaCliente === 'rapido') {
        modEstrategiaProb = 0.05;
        modEstrategiaPago = 0.9;
    } else if (estrategiaCliente === 'calidad') {
        modEstrategiaProb = 0.1;
        modEstrategiaPago = 1.15;
        estres = Math.min(100, estres + 2);
    }

    let modProbRasgo = 0;
    let modTiempoRasgo = 0;
    let modGananciaRasgo = 1;
    if (m.nombre === 'Frandy') {
        const recordadoHoy = m.recordatorioTrabajoDia === dia;
        if (recordadoHoy) {
            modProbRasgo += (rasgosMecanico.bonusProbConRecordatorio || 0);
            modTiempoRasgo += (rasgosMecanico.bonusTiempoConRecordatorio || 0);
            log('Frandy recibio recordatorio hoy: entra enfocado y mas rapido.', 'exito');
        } else {
            modProbRasgo += (rasgosMecanico.penalProbSinRecordatorio || 0);
            modTiempoRasgo += (rasgosMecanico.penalTiempoSinRecordatorio || 0);
            log('Frandy no recibio seguimiento hoy: arranca mas lento hasta que lo supervises.', 'warn');
        }
    } else if (m.nombre === 'Maicol') {
        if (clienteActual.especialidadIdeal === 'electricidad') {
            modProbRasgo += (rasgosMecanico.bonusProbEspecialidad || 0);
            modTiempoRasgo += (rasgosMecanico.bonusTiempoEspecialidad || 0);
        } else {
            modProbRasgo += (rasgosMecanico.penalProbFueraEspecialidad || 0);
        }
    } else if (m.nombre === 'Ridalvi') {
        if ((tiempoCliente || 0) <= 4) {
            modProbRasgo += (rasgosMecanico.bonusProbUrgencia || 0);
            modTiempoRasgo += (rasgosMecanico.bonusTiempoUrgencia || 0);
        } else {
            modProbRasgo += (rasgosMecanico.penalProbSinUrgencia || 0);
        }
    } else if (m.nombre === 'Jeral') {
        modProbRasgo += (rasgosMecanico.bonusProbEstable || 0);
        modTiempoRasgo += (rasgosMecanico.penalTiempoLento || 0);
    } else if (m.nombre === 'Edwin') {
        if (clienteActual.especialidadIdeal === 'transmision') {
            modProbRasgo += (rasgosMecanico.bonusProbEspecialidad || 0);
            modTiempoRasgo += (rasgosMecanico.bonusTiempoEspecialidad || 0);
        }
        if (pieza && pieza.calidad === 'basica') {
            modProbRasgo += (rasgosMecanico.penalProbPiezaBasica || 0);
            modTiempoRasgo += (rasgosMecanico.penalTiempoPiezaBasica || 0);
            log('Edwin detecto pieza basica y reduce ritmo para evitar retrabajo.', 'warn');
        }
    } else if (m.nombre === 'Stewart') {
        modProbRasgo += (rasgosMecanico.bonusProbRitmoAlto || 0);
        modTiempoRasgo += (rasgosMecanico.bonusTiempoRitmoAlto || 0);
    } else if (m.nombre === 'Miguel') {
        modProbRasgo += (rasgosMecanico.bonusProbRitmoAlto || 0);
        modTiempoRasgo += (rasgosMecanico.bonusTiempoRitmoAlto || 0);
        if (rasgosMecanico.especialidadComodin) {
            bonusEspecialidad = Math.max(bonusEspecialidad, 0.15);
            if (clienteActual.especialidadIdeal !== 'general') {
                log(`Miguel toma el caso de ${clienteActual.especialidadIdeal} como comodin rapido.`, 'info');
            }
        }
    } else if (m.nombre === 'Martin') {
        // Comodin: bono de especialidad siempre activo sin importar el caso
        if (rasgosMecanico.especialidadComodin) {
            bonusEspecialidad = 0.15;
            if (clienteActual.especialidadIdeal !== 'general') {
                log(`Martin toma el caso de ${clienteActual.especialidadIdeal} como comodin. Sin penalizacion.`, 'info');
            }
        }
    } else if (m.nombre === 'Morenai' || m.nombre === 'Moreni') {
        modProbRasgo += (rasgosMecanico.bonusProbEstable || 0);
        modGananciaRasgo += Math.max(-0.2, Number(rasgosMecanico.bonusGananciaPct || 0));
    }

    const penalizacionComplicaciones = clienteActual.complicaciones.length * 0.05;
    const ritmoAsignacion = (typeof obtenerBonosRitmoTaller === 'function')
        ? obtenerBonosRitmoTaller(clienteActual, m)
        : { bonusProbabilidad: 0, bonusGananciaPct: 0, bonusTiempo: 0, etiquetas: [] };
    const bonusTiempoRitmo = Math.max(0, Math.round(ritmoAsignacion.bonusTiempo || 0));
    modGananciaRasgo *= (1 + Math.max(0, ritmoAsignacion.bonusGananciaPct || 0));
    // Bonus de eficiencia y penalización de humor sobre probabilidad de exito
    const bonusEficiencia = (calcularEficienciaEfectiva(m) - 0.5) * 0.20;
    const protegidoEstados = mecanicoIgnoraEstadosFisicos(m);
    const penalHumor = protegidoEstados ? 0 : Math.max(0, (5 - calcularHumorEfectivo(m)) * 0.03);
    const bonusTxtRep = [];
    let prob = m.habilidad + modificadorHabilidadDiario + bonusDiagnostico + bonusEspecialidad + bonusInspeccion + modEstrategiaProb + modProbRasgo + bonusPiezaProb + bonusEficiencia + Math.max(-0.08, Math.min(0.16, ritmoAsignacion.bonusProbabilidad || 0)) - penalHumor - (m.enojo * 0.1) - (clienteActual.dificultad * 0.25) - penalizacionComplicaciones + (mejoras.herramientas * 0.1) + ((tallerNivel - 1) * 0.04) - (protegidoEstados ? 0 : (estres / 200)) - Math.max(0, modFalloImpagoEmpleadosDia || 0);
    // Piso ligeramente mas amable: un mecanico preparado puede recuperarse
    // incluso en un caso dificil, sin convertir el resultado en automatico.
    prob = Math.min(0.98, Math.max(0.22, prob + 0.04));
    if (bonusEficiencia > 0.05) bonusTxtRep.push('+ eficiencia');
    if (penalHumor > 0.06) bonusTxtRep.push('- humor bajo');
    if (protegidoEstados) bonusTxtRep.push('+ estabilidad de Jeral');
    if (bonusDiagnostico > 0) bonusTxtRep.push('+ diagnostico correcto');
    if (bonusDiagnostico < 0) bonusTxtRep.push('- diagnostico pobre');
    if (bonusEspecialidad > 0) bonusTxtRep.push('+ especialidad');
    if (bonusInspeccion > 0) bonusTxtRep.push(`+ inspeccion ${Math.round(bonusInspeccion * 100)}%`);
    if (modificadorHabilidadDiario < 0) bonusTxtRep.push('- evento diario');
    if (modEstrategiaProb > 0) bonusTxtRep.push(`+ estrategia ${estrategiaCliente}`);
    if (modProbRasgo > 0) bonusTxtRep.push('+ rasgo mecanico');
    if (modProbRasgo < 0) bonusTxtRep.push('- rasgo mecanico');
    if (modGananciaRasgo > 1.01) bonusTxtRep.push('+ bono de cierre');
    if (ritmoAsignacion.bonusGananciaPct > 0.01) bonusTxtRep.push('+ impulso taller');
    if (clienteActual.complicaciones.length > 1) bonusTxtRep.push('- complicaciones');
    if (m.enojo >= 3) bonusTxtRep.push('- enojo');
    if (pieza) bonusTxtRep.push(`+ pieza ${pieza.nombre}`);
    if (riesgoDiagnosticoFallido) bonusTxtRep.push('riesgo alto por dictamen fallido');
    if (Array.isArray(ritmoAsignacion.etiquetas) && ritmoAsignacion.etiquetas.length) {
        ritmoAsignacion.etiquetas.forEach(function(tag) {
            bonusTxtRep.push(tag);
        });
    }

    const atributosRep = {
        percepcion: clamp01(m.habilidad + bonusEspecialidad + bonusInspeccion + (clienteActual.diagnosticado ? 0.1 : -0.08) + (mejoras.maquinaDiagnosis ? 0.08 : 0)),
        pulso: clamp01(0.52 + (m.habilidad * 0.36) - (m.enojo * 0.06) - (estres / 190)),
        fuerza: clamp01(0.45 + (m.habilidad * 0.38) + (estrategiaCliente === 'rapido' ? 0.06 : 0)),
        suerte: clamp01(0.28 + bonusInspeccion + (reputacion / 240) + (rachaExitos * 0.04) - (clienteActual.dificultad * 0.08) - (estres / 260))
    };
    const bonusFlujoTiempo = mejorasTacticas.flujoReparacion ? (1 + (tallerNivel >= 3 ? 1 : 0)) : 0;

    let resultadoOculto = resolverTiradaOcultaReparacion(prob);
    if (riesgoDiagnosticoFallido) {
        // Con dictamen fallido aprobado, el trabajo tiende a degradarse.
        if (resultadoOculto === 'critico' && Math.random() < 0.75) {
            resultadoOculto = 'parcial';
        }
        if (resultadoOculto === 'parcial' && Math.random() < 0.65) {
            resultadoOculto = 'fallo_total';
        }
    }
    if (rasgosMecanico.controlCalidadPerfecto) {
        resultadoOculto = 'critico';
    } else if (rasgosMecanico.evitarFalloTotalReparacion && resultadoOculto === 'fallo_total') {
        resultadoOculto = 'parcial';
    }
    if (!(typeof modoNivelesActivo === 'function' && modoNivelesActivo())) {
        const costoHambre = rasgosMecanico.costoHambreTrabajo !== undefined ? Math.max(0, Math.round(rasgosMecanico.costoHambreTrabajo)) : 2;
        hambre = Math.min(100, hambre + costoHambre);
        sueno = Math.min(100, sueno + 3);
        estres = Math.min(100, estres + 5);
    }
    aplicarCelos(m.nombre);
    revisarPeleaRivales(m);
    m.trabajosHoy += 1;
    if (rasgosMecanico.penalLealtadDuenoPorTrabajo) {
        m.lealtad = Math.max(0, Math.round((m.lealtad || 0) - rasgosMecanico.penalLealtadDuenoPorTrabajo));
        if (typeof mostrarFeedbackGameplay === 'function') {
            mostrarFeedbackGameplay(`${m.nombre} termino inconforme con la gestion del dueño. Lealtad -${rasgosMecanico.penalLealtadDuenoPorTrabajo}.`, 'warn');
        }
    }
    aplicarSobrecargaMecanico(m);
    ultimoMecanicoAsignado = m.nombre;

    if (resultadoOculto === 'critico') {
        let ganancia = Math.round((clienteActual.pago * modEstrategiaPago * (1.14 + bonusPiezaGanancia)) + (reputacion > 70 ? 220 : 0) + ((clienteActual.complicaciones.length - 1) * 150));
        ganancia = Math.max(220, Math.round(ganancia * modGananciaRasgo));
        if (riesgoDiagnosticoFallido) {
            ganancia = Math.max(180, Math.round(ganancia * 0.8));
        }
        if (rachaExitos >= 2) {
            ganancia += 90 * rachaExitos;
        }
        const tiempoTrabajo = (typeof modoNivelesActivo === 'function' && modoNivelesActivo())
            ? Math.max(1, calcularTiempoTrabajoReal(clienteActual, m, modTiempoRasgo, bonusPiezaTiempo + bonusTiempoRitmo, bonusFlujoTiempo, riesgoDiagnosticoFallido ? 1.08 : 0.88) - bonusTiempoRitmo)
            : Math.max(2, Math.round(escalarTiempoBaseOperacion((clienteActual.tiempo * 1.22) + (clienteActual.complicaciones.length * 1.15) + (clienteActual.esVIP ? 2 : 0.5), 'reparacion') - (tallerNivel >= 3 ? 1 : 0) - bonusPiezaTiempo - bonusFlujoTiempo - bonusTiempoRitmo + modTiempoRasgo));
        const usaTiempoDirecto = typeof modoNivelesActivo === 'function' && modoNivelesActivo();
        const duracionTrabajoSeg = obtenerDuracionTrabajoTiempoRealSeg(tiempoTrabajo, usaTiempoDirecto);
        m.ocupado = true;
        m.enfriamientoTurnos = tiempoTrabajo;
        
        let rep = reparacionesActivas.find(r => r && r.idCaso === casoAsignado.idCaso);
        if (!rep) {
            rep = {};
            reparacionesActivas.push(rep);
        }
        Object.assign(rep, {
            idCaso: casoAsignado.idCaso,
            personaNombre: casoAsignado.personaNombre,
            vehiculo: casoAsignado.vehiculo,
            clienteNombre: clienteActual.nombre,
            mecanicoNombre: m.nombre,
            tiempoRestante: tiempoTrabajo,
            tiempoTotal: tiempoTrabajo,
            duracionRealSeg: duracionTrabajoSeg,
            segundosPendientesReal: duracionTrabajoSeg,
            ultimoTiempoSyncMs: Date.now(),
            tipoTrabajo: 'reparacion',
            exito: true,
            nivelResultado: 'critico',
            resultadoOculto: 'critico',
            subtituloResultado: bonusTxtRep.length ? bonusTxtRep.join(' | ') : 'base limpia',
            especialidadIdeal: clienteActual.especialidadIdeal,
            requierePiezaContinuacion: false,
            piezaContinuacionSolicitada: false,
            piezaContinuacionInstalada: false,
            pausadaPorPieza: false,
            piezaInstalada: pieza ? { ...pieza } : null,
            pagoAcordado: Math.max(0, Math.round(clienteActual.pago || 0)),
            miniHistoriaTipo: clienteActual.miniHistoriaTipo,
            casoCaliente: !!clienteActual.casoCaliente,
            cadenaEspecialidadActiva: !!clienteActual.cadenaEspecialidadActiva,
            diagnosticoNivel: diagnosticoNivelCaso,
            diagnosticoRiesgoAlto: riesgoDiagnosticoFallido,
            ganancia: ganancia,
            perdida: 0
        });

        actualizarCasoAtendido(
            casoAsignado,
            'en_reparacion',
            `Mecanico asignado: ${m.nombre}. Tiempo estimado ${formatearEstimadoTrabajoTiempoReal(tiempoTrabajo, usaTiempoDirecto)}.`
        );
        mostrarFeedbackGameplay(`Asignado: ${m.nombre} -> ${casoAsignado.idCaso || 'CASO-0000'} | ETA ${formatearEstimadoTrabajoTiempoReal(tiempoTrabajo, usaTiempoDirecto)}`, 'ok');
        log(`${m.nombre} entro al elevador con ${clienteActual.nombre}. El resultado se revelara al enfriar.`, 'info');
    } else if (resultadoOculto === 'parcial') {
        const gananciaParcial = Math.max(280, Math.round(clienteActual.pago * (0.56 + bonusPiezaGanancia * 0.45)));
        const gananciaParcialAjustada = Math.max(260, Math.round(gananciaParcial * modGananciaRasgo));
        const gananciaParcialFinal = riesgoDiagnosticoFallido
            ? Math.max(180, Math.round(gananciaParcialAjustada * 0.78))
            : gananciaParcialAjustada;
        const tiempoTrabajo = (typeof modoNivelesActivo === 'function' && modoNivelesActivo())
            ? Math.max(1, calcularTiempoTrabajoReal(clienteActual, m, modTiempoRasgo, bonusPiezaTiempo + bonusTiempoRitmo, bonusFlujoTiempo, riesgoDiagnosticoFallido ? 1.14 : 1) - bonusTiempoRitmo)
            : Math.max(2, Math.round(escalarTiempoBaseOperacion((clienteActual.tiempo * 1.18) + (clienteActual.complicaciones.length * 1.1) + 0.5, 'reparacion') - bonusPiezaTiempo - bonusFlujoTiempo - bonusTiempoRitmo + modTiempoRasgo));
        const usaTiempoDirecto = typeof modoNivelesActivo === 'function' && modoNivelesActivo();
        const duracionTrabajoSeg = obtenerDuracionTrabajoTiempoRealSeg(tiempoTrabajo, usaTiempoDirecto);
        m.ocupado = true;
        m.enfriamientoTurnos = tiempoTrabajo;
        
        let rep = reparacionesActivas.find(r => r && r.idCaso === casoAsignado.idCaso);
        if (!rep) {
            rep = {};
            reparacionesActivas.push(rep);
        }
        Object.assign(rep, {
            idCaso: casoAsignado.idCaso,
            personaNombre: casoAsignado.personaNombre,
            vehiculo: casoAsignado.vehiculo,
            clienteNombre: clienteActual.nombre,
            mecanicoNombre: m.nombre,
            tiempoRestante: tiempoTrabajo,
            tiempoTotal: tiempoTrabajo,
            duracionRealSeg: duracionTrabajoSeg,
            segundosPendientesReal: duracionTrabajoSeg,
            ultimoTiempoSyncMs: Date.now(),
            tipoTrabajo: 'reparacion',
            exito: true,
            nivelResultado: 'parcial',
            resultadoOculto: 'parcial',
            subtituloResultado: bonusTxtRep.length ? bonusTxtRep.join(' | ') : 'base limpia',
            especialidadIdeal: clienteActual.especialidadIdeal,
            requierePiezaContinuacion: true,
            piezaContinuacionSolicitada: false,
            piezaContinuacionInstalada: false,
            pausadaPorPieza: false,
            piezaRequeridaNombre: '',
            piezasContinuacionRequeridas: [],
            piezasContinuacionEntregadas: [],
            piezaInstalada: pieza ? { ...pieza } : null,
            pagoAcordado: Math.max(0, Math.round(clienteActual.pago || 0)),
            miniHistoriaTipo: clienteActual.miniHistoriaTipo,
            casoCaliente: !!clienteActual.casoCaliente,
            cadenaEspecialidadActiva: !!clienteActual.cadenaEspecialidadActiva,
            diagnosticoNivel: diagnosticoNivelCaso,
            diagnosticoRiesgoAlto: riesgoDiagnosticoFallido,
            ganancia: gananciaParcialFinal,
            perdida: 0
        });
        actualizarCasoAtendido(
            casoAsignado,
            'en_reparacion',
            `Mecanico asignado: ${m.nombre}. Tiempo estimado ${formatearEstimadoTrabajoTiempoReal(tiempoTrabajo, usaTiempoDirecto)}.`
        );
        mostrarFeedbackGameplay(`Asignado: ${m.nombre} -> ${casoAsignado.idCaso || 'CASO-0000'} | ETA ${formatearEstimadoTrabajoTiempoReal(tiempoTrabajo, usaTiempoDirecto)}`, 'ok');
        log(`${m.nombre} tomo ${clienteActual.nombre}. El taller mostrara el desenlace cuando baje del elevador.`, 'info');
    } else {
        let perdida = Math.max(0, Math.round((clienteActual.pago * 0.33) + (clienteActual.complicaciones.length * 70) - (pieza ? pieza.bonusProb * 360 : 0)));
        if (riesgoDiagnosticoFallido) {
            perdida = Math.max(perdida, Math.round(perdida * 1.22));
        }
        const tiempoTrabajo = (typeof modoNivelesActivo === 'function' && modoNivelesActivo())
            ? Math.max(1, calcularTiempoTrabajoReal(clienteActual, m, modTiempoRasgo, bonusPiezaTiempo + bonusTiempoRitmo, bonusFlujoTiempo, riesgoDiagnosticoFallido ? 1.28 : 1.16) - bonusTiempoRitmo)
            : Math.max(2, Math.round(escalarTiempoBaseOperacion((clienteActual.tiempo * 1.15) + (clienteActual.complicaciones.length * 0.95) + 0.5, 'reparacion') - bonusPiezaTiempo - bonusFlujoTiempo - bonusTiempoRitmo + modTiempoRasgo));
        const usaTiempoDirecto = typeof modoNivelesActivo === 'function' && modoNivelesActivo();
        const duracionTrabajoSeg = obtenerDuracionTrabajoTiempoRealSeg(tiempoTrabajo, usaTiempoDirecto);
        m.ocupado = true;
        m.enfriamientoTurnos = tiempoTrabajo;
        
        let rep = reparacionesActivas.find(r => r && r.idCaso === casoAsignado.idCaso);
        if (!rep) {
            rep = {};
            reparacionesActivas.push(rep);
        }
        Object.assign(rep, {
            idCaso: casoAsignado.idCaso,
            personaNombre: casoAsignado.personaNombre,
            vehiculo: casoAsignado.vehiculo,
            clienteNombre: clienteActual.nombre,
            mecanicoNombre: m.nombre,
            tiempoRestante: tiempoTrabajo,
            tiempoTotal: tiempoTrabajo,
            duracionRealSeg: duracionTrabajoSeg,
            segundosPendientesReal: duracionTrabajoSeg,
            ultimoTiempoSyncMs: Date.now(),
            tipoTrabajo: 'reparacion',
            exito: false,
            nivelResultado: 'fallo',
            resultadoOculto: 'fallo',
            subtituloResultado: bonusTxtRep.length ? bonusTxtRep.join(' | ') : 'base limpia',
            especialidadIdeal: clienteActual.especialidadIdeal,
            requierePiezaContinuacion: true,
            piezaContinuacionSolicitada: false,
            piezaContinuacionInstalada: false,
            pausadaPorPieza: false,
            piezaRequeridaNombre: '',
            piezasContinuacionRequeridas: [],
            piezasContinuacionEntregadas: [],
            piezaInstalada: pieza ? { ...pieza } : null,
            pagoAcordado: Math.max(0, Math.round(clienteActual.pago || 0)),
            miniHistoriaTipo: clienteActual.miniHistoriaTipo,
            casoCaliente: !!clienteActual.casoCaliente,
            cadenaEspecialidadActiva: !!clienteActual.cadenaEspecialidadActiva,
            diagnosticoNivel: diagnosticoNivelCaso,
            diagnosticoRiesgoAlto: riesgoDiagnosticoFallido,
            ganancia: 0,
            perdida: perdida
        });
        actualizarCasoAtendido(
            casoAsignado,
            'en_reparacion',
            `Mecanico asignado: ${m.nombre}. Tiempo estimado ${formatearEstimadoTrabajoTiempoReal(tiempoTrabajo, usaTiempoDirecto)}.`
        );
        mostrarFeedbackGameplay(`Asignado: ${m.nombre} -> ${casoAsignado.idCaso || 'CASO-0000'} | ETA ${formatearEstimadoTrabajoTiempoReal(tiempoTrabajo, usaTiempoDirecto)}`, 'ok');
        log(`${m.nombre} arranco el trabajo de ${clienteActual.nombre}. El resultado sigue oculto hasta que enfrie.`, 'info');
    }

    clienteActual = null;
    window.toolbarCasosTrabajoAbierto = true;
    consumirTurno('asignacion de reparacion', COSTOS_TURNO.reparacion);
    if (typeof actualizarUI === 'function') actualizarUI();
    if (typeof autoGuardarPartidaSilenciosa === 'function') {
        autoGuardarPartidaSilenciosa('asignacion-reparacion-iniciada');
    }
    return true;
}

function renderizarContrataciones() {
    const cont = document.getElementById('lista-contrataciones');
    if (!cont) return;
    const modoNiveles = (typeof modoNivelesActivo === 'function' && modoNivelesActivo());
    const avanceActual = modoNiveles
        ? Math.max(1, Math.round(nivelJugador || 1))
        : Math.max(1, Math.round(dia || 1));
    const esc = function(v) {
        return String(v || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    };
    const obtenerBio = function(nombre) {
        var base = (window.TallerData && window.TallerData.biografiasMecanicos && window.TallerData.biografiasMecanicos[nombre])
            ? window.TallerData.biografiasMecanicos[nombre]
            : {};
        return {
            historia: base.historia || 'Sin historia registrada.',
            habilidadTexto: base.habilidadTexto || 'Generalista',
            rivalidad: base.rivalidad || 'Sin rivalidad destacada.',
            necesidad: base.necesidad || 'Sin necesidad urgente reportada.',
            foto: base.foto || ''
        };
    };
    const renderAvatar = function(nombre, foto) {
        var inicial = esc(String(nombre || '?').charAt(0).toUpperCase());
        if (!foto) return `<div class="mecanico-avatar-placeholder">${inicial}</div>`;
        return `<img src="${esc(foto)}" alt="${esc(nombre)}" class="mecanico-avatar" onerror="this.style.display='none'; if(this.nextElementSibling){ this.nextElementSibling.style.display='flex'; }"><div class="mecanico-avatar-placeholder" style="display:none;">${inicial}</div>`;
    };

    let html = '';
    if (!ayudanteContratado) {
        const costoAyudante = (ECONOMY_DATA.ayudante && ECONOMY_DATA.ayudante.costo) || 900;
        const repAyudante = (ECONOMY_DATA.ayudante && ECONOMY_DATA.ayudante.repMin) || 40;
        const avanceAyudante = modoNiveles ? Math.max(1, nivelJugador || 1) : Math.max(1, dia || 1);
        const puedeAyudante = avanceAyudante >= 1 && reputacion >= repAyudante && saldo >= costoAyudante;
        const reqAyudante = modoNiveles
            ? `Requiere Nivel 1 y Rep ${repAyudante}`
            : `Requiere Dia 1 y Rep ${repAyudante}`;
        html += `<div class="mecanico-ficha"><strong>Ayudante de piso</strong><br>Costo: RD$${costoAyudante} | ${reqAyudante}<br><em>Efecto:</em> acelera reparaciones activas.<br><button class="btn" style="margin-top:6px;" onclick="contratarAyudante()" ${puedeAyudante ? '' : 'disabled title="Faltan requisitos o dinero"'}>Contratar ayudante</button></div>`;
    } else {
        html += '<div class="mecanico-ficha"><strong>Ayudante de piso</strong><br>Ya contratado. Bonus activo de tiempo.</div>';
    }

    if (!Array.isArray(mecanicosDisponibles)) mecanicosDisponibles = [];
    if (window.TallerData && Array.isArray(window.TallerData.mecanicosDisponiblesBase)) {
        const activosSet = new Set((mecanicos || []).map(x => x && x.nombre).filter(Boolean));
        const dispSet = new Set((mecanicosDisponibles || []).map(x => x && x.nombre).filter(Boolean));
        window.TallerData.mecanicosDisponiblesBase.forEach(baseMec => {
            if (!baseMec || !baseMec.nombre) return;
            if (!activosSet.has(baseMec.nombre) && !dispSet.has(baseMec.nombre)) {
                mecanicosDisponibles.push({ ...baseMec });
                dispSet.add(baseMec.nombre);
            }
        });
    }

    if (!mecanicosDisponibles || !mecanicosDisponibles.length) {
        html += '<p>Ya contrataste a todo el equipo disponible.</p>';
        cont.innerHTML = html;
        return;
    }
    (mecanicosDisponibles || []).forEach(m => {
        if (typeof normalizarStatsMecanico === 'function') normalizarStatsMecanico(m);
        const bio = obtenerBio(m.nombre);
        const rasgo = (typeof obtenerPerfilRasgosMecanico === 'function')
            ? obtenerPerfilRasgosMecanico(m.nombre)
            : { ventaja: 'Sin rasgo especial.', desventaja: 'Sin penalizacion registrada.' };
        const nivel = Math.max(1, Math.round(m.nivel || 1));
        const xpActual = Math.max(0, Math.round(m.xp || 0));
        const xpMeta = (typeof xpParaSiguienteNivel === 'function') ? Math.max(0, Math.round(xpParaSiguienteNivel(nivel))) : 0;
        const xpTexto = (nivel >= 5 || xpMeta <= 0) ? 'MAX' : `${xpActual}/${xpMeta}`;
        const xpPct = (nivel >= 5 || xpMeta <= 0) ? 100 : Math.max(0, Math.min(100, Math.round((xpActual / xpMeta) * 100)));
        const vel = Math.max(0, Math.min(100, Math.round(((typeof calcularVelocidadEfectiva === 'function' ? calcularVelocidadEfectiva(m) : (m.velocidad || 0.5)) * 100))));
        const efi = Math.max(0, Math.min(100, Math.round(((typeof calcularEficienciaEfectiva === 'function' ? calcularEficienciaEfectiva(m) : (m.eficiencia || 0.5)) * 100))));
        
        let reqCumplidos = false;
        let reqTxt = '';
        if (m.casosMinimosRequeridos) {
            const casosTotales = typeof obtenerCasosCompletadosNarrativa === 'function' ? obtenerCasosCompletadosNarrativa() : 0;
            reqCumplidos = casosTotales >= m.casosMinimosRequeridos && reputacion >= (m.repMin || 0);
            reqTxt = `Requiere ${m.casosMinimosRequeridos} casos y Rep ${m.repMin}`;
        } else {
            reqCumplidos = avanceActual >= Math.max(1, m.diaMin || 1) && reputacion >= (m.repMin || 0);
            reqTxt = modoNiveles
                ? `Requiere Nivel ${Math.max(1, m.diaMin || 1)} y Rep ${m.repMin}`
                : `Requiere Dia ${m.diaMin || 1} y Rep ${m.repMin}`;
        }
        
        const costo = Number.isFinite(Number(m.costo)) ? Math.max(0, Number(m.costo)) : 0;
        const puedeContratar = reqCumplidos && saldo >= costo;
        const nombreJs = JSON.stringify(String(m.nombre || ''));
        html += `<div class="mecanico-ficha contratacion-card">
            <div class="mecanico-card-head">
                ${renderAvatar(m.nombre, bio.foto)}
                <div class="mecanico-card-head-info">
                    <strong class="mecanico-nombre">${esc(m.nombre)}</strong>
                    <div class="mecanico-especialidad">${esc(m.especialidad || 'general')} | Nivel ${nivel}</div>
                </div>
            </div>
            <div class="xp-info" style="margin-top:6px;">XP: ${xpTexto}</div>
            <div class="xp-barra"><div class="xp-fill" style="width:${xpPct}%;"></div></div>
            <div class="contratacion-stats" style="margin-top:6px; font-size:0.78rem; color:#d8dfdf;">Velocidad ${vel}% | Eficiencia ${efi}%</div>
            <div class="contratacion-desc" style="margin-top:8px; font-size:0.78rem; line-height:1.4; color:#d7c8aa;">${esc(bio.historia)}</div>
            <div class="contratacion-desc" style="margin-top:6px; font-size:0.76rem; color:#e2d8bf;"><em>Fortaleza:</em> ${esc(bio.habilidadTexto)}</div>
            <div class="contratacion-desc" style="margin-top:4px; font-size:0.74rem; color:#c8d5d8;"><em>Ventaja:</em> ${esc(rasgo.ventaja || 'Sin ventaja registrada.')}</div>
            <div class="contratacion-desc" style="margin-top:4px; font-size:0.74rem; color:#c8d5d8;"><em>Desventaja:</em> ${esc(rasgo.desventaja || 'Sin desventaja registrada.')}</div>
            <div class="contratacion-desc" style="margin-top:4px; font-size:0.74rem; color:#c8d5d8;"><em>Rivalidad:</em> ${esc(bio.rivalidad)}</div>
            <div class="contratacion-desc" style="margin-top:4px; font-size:0.74rem; color:#c8d5d8;"><em>Necesidad:</em> ${esc(bio.necesidad)}</div>
            <div class="contratacion-meta" style="margin-top:8px; font-size:0.78rem; color:#f1d6ad;">Costo: RD$${Math.round(costo)} | ${esc(reqTxt)}</div>
            <button class="btn" style="margin-top:8px;" onclick='contratarMecanico(${nombreJs})' ${puedeContratar ? '' : 'disabled title="Faltan requisitos o dinero"'}>Contratar</button>
        </div>`;
    });
    cont.innerHTML = html;
}

function contratarAyudante() {
    const dataAyudante = ECONOMY_DATA.ayudante || { costo: 900, repMin: 40, bonoTiempo: 0.25 };
    const modoNiveles = (typeof modoNivelesActivo === 'function' && modoNivelesActivo());
    const nivelActual = modoNiveles ? Math.max(1, Math.round(nivelJugador || 1)) : Math.max(1, Math.round(dia || 1));
    if (ayudanteContratado) {
        log('Ya tienes ayudante contratado.', 'info');
        return;
    }
    if (nivelActual < 1 || reputacion < dataAyudante.repMin) {
        const reqTxt = modoNiveles
            ? `Requiere nivel 1 y reputacion ${dataAyudante.repMin} para contratar ayudante.`
            : `Requiere reputacion ${dataAyudante.repMin} para contratar ayudante.`;
        log(reqTxt, 'error');
        return;
    }
    if (saldo < dataAyudante.costo) {
        log(`No tienes RD$${dataAyudante.costo} para contratar ayudante.`, 'error');
        return;
    }
    if (!consumirFoco('contratar')) return;
    saldo -= dataAyudante.costo;
    if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarGastoDia === 'function') {
        window.TallerApp.helpers.registrarGastoDia(dataAyudante.costo, 'equipo');
    }
    ayudanteContratado = true;
    bonoAyudanteTiempo = dataAyudante.bonoTiempo;
    log('Ayudante contratado: las reparaciones activas avanzan mas rapido.', 'exito');
    mostrarStamp('APROBADO', 'ok');
    renderizarContrataciones();
    consumirTurno('contratar ayudante', COSTOS_TURNO.contratar);
}

function contratarMecanico(nombre) {
    const idx = mecanicosDisponibles.findIndex(m => m.nombre === nombre);
    if (idx === -1) return;
    const candidato = mecanicosDisponibles[idx];
    const modoNiveles = (typeof modoNivelesActivo === 'function' && modoNivelesActivo());
    const nivelActual = modoNiveles ? Math.max(1, Math.round(nivelJugador || 1)) : Math.max(1, Math.round(dia || 1));
    
    let reqCumplidos = false;
    let reqTxt = '';
    if (candidato.casosMinimosRequeridos) {
        const casosTotales = typeof obtenerCasosCompletadosNarrativa === 'function' ? obtenerCasosCompletadosNarrativa() : 0;
        reqCumplidos = casosTotales >= candidato.casosMinimosRequeridos && reputacion >= (candidato.repMin || 0);
        reqTxt = `No puedes contratar a ${nombre} aun. Requiere ${candidato.casosMinimosRequeridos} casos y Rep ${candidato.repMin}.`;
    } else {
        reqCumplidos = nivelActual >= (candidato.diaMin || 1) && reputacion >= (candidato.repMin || 0);
        reqTxt = modoNiveles
            ? `No puedes contratar a ${nombre} aun. Requiere Nivel ${candidato.diaMin || 1} y Rep ${candidato.repMin}.`
            : `No puedes contratar a ${nombre} aun. Requiere Dia ${candidato.diaMin || 1} y Rep ${candidato.repMin}.`;
    }

    if (!reqCumplidos) {
        log(reqTxt, 'error');
        return;
    }
    if (saldo < candidato.costo) {
        log(`No tienes RD$${candidato.costo} para contratar a ${nombre}.`, 'error');
        return;
    }
    if (!consumirFoco('contratar')) return;
    saldo -= candidato.costo;
    if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarGastoDia === 'function') {
        window.TallerApp.helpers.registrarGastoDia(candidato.costo, 'equipo');
    }
    mecanicos.push(candidato);
    mecanicosDisponibles.splice(idx, 1);
    if (typeof registrarEventoNarrativo === 'function') {
        registrarEventoNarrativo('mecanico_contratado', {
            nombre: candidato.nombre,
            especialidad: candidato.especialidad,
            costo: candidato.costo
        });
    }
    log(`Contrataste a ${nombre} por RD$${candidato.costo}.`, 'exito');
    if (String(nombre || '').toLowerCase() === 'stewart' && typeof stewartStatus !== 'undefined') {
        stewartStatus = 'contratado';
        if (tramaEstado && typeof tramaEstado === 'object') {
            tramaEstado.stewartCasosEvaluados = Math.max(
                0,
                Math.round((tramaEstado.casosCriticosResueltos || 0) + (tramaEstado.casosParciales || 0))
            );
            tramaEstado.stewartEventosFavor = Math.max(0, Math.round(tramaEstado.stewartEventosFavor || 0));
            tramaEstado.stewartEventosRiesgo = Math.max(0, Math.round(tramaEstado.stewartEventosRiesgo || 0));
        }
    }
    mostrarStamp('APROBADO', 'ok');
    renderizarContrataciones();
    consumirTurno('contratar mecanico', COSTOS_TURNO.contratar);
    if (typeof autoGuardarPartidaSilenciosa === 'function') {
        autoGuardarPartidaSilenciosa('contratar-mecanico');
    }
}

function despedirMecanico(nombre) {
    const idx = mecanicos.findIndex(function(m) { return m.nombre === nombre; });
    if (idx === -1) {
        log('Mecanico no encontrado.', 'error');
        return;
    }
    const enReparacion = (reparacionesActivas || []).some(function(r) { return r && r.mecanicoNombre === nombre; });
    if (enReparacion) {
        log(`No puedes despedir a ${nombre} mientras tiene un trabajo en progreso. Espera que termine.`, 'error');
        if (typeof mostrarFeedbackGameplay === 'function') {
            mostrarFeedbackGameplay(`${nombre} tiene un caso activo. Termina primero.`, 'warn');
        }
        return;
    }
    const m = mecanicos[idx];
    mecanicos.splice(idx, 1);
    window.mecanicoPanelSeleccionadoIdx = -1;

    const mecDeVuelta = Object.assign({}, m, {
        costo: m.costo || 2000,
        diaMin: m.diaMin || 1,
        repMin: m.repMin || 0,
        casosMinimosRequeridos: m.casosMinimosRequeridos,
        ocupado: false,
        enojo: 0,
        trabajosHoy: 0,
        enfriamientoTurnos: 0
    });
    mecanicosDisponibles.push(mecDeVuelta);

    const penalizacion = 5;
    reputacion = Math.max(0, reputacion - penalizacion);

    log(`Despediste a ${nombre}. Reputacion -${penalizacion}. Puede volver a contratarse.`, 'error');
    if (typeof mostrarFeedbackGameplay === 'function') {
        mostrarFeedbackGameplay(`${nombre} despedido. Reputacion -${penalizacion}.`, 'warn');
    }
    if (typeof renderizarContrataciones === 'function') renderizarContrataciones();
    if (typeof renderizarLoreMecanicos === 'function') renderizarLoreMecanicos();
    if (typeof actualizarUI === 'function') actualizarUI();
}

function comprarPiezaVIP() {
    if (!clienteActual || !clienteActual.esVIP) {
        log('No hay cliente VIP esperando pieza.', 'error');
        return;
    }
    if (clienteActual.etapaVIP !== 2) {
        log('La pieza VIP solo aplica en etapa 2.', 'error');
        return;
    }
    if (clienteActual.piezaVIPComprada) {
        log('La pieza VIP ya fue comprada.', 'info');
        return;
    }
    if (!consumirFoco('piezaVip')) return;

    const costo = 500 + Math.round(clienteActual.dificultad * 700);
    if (saldo < costo) {
        log(`No alcanza para la pieza VIP (RD$${costo}).`, 'error');
        clienteActual.pago = Math.round(clienteActual.pago * 0.92);
        reputacion = Math.max(0, reputacion - 1);
        actualizarUI();
        return;
    }

    saldo -= costo;
    if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarGastoDia === 'function') {
        window.TallerApp.helpers.registrarGastoDia(costo, 'piezas');
    }
    clienteActual.piezaVIPComprada = true;
    clienteActual.etapaVIP = 3;
    clienteActual.pago += Math.round(costo * 0.55);
    log(`Pieza VIP comprada por RD$${costo}. Cliente en etapa 3/3: reparacion final.`, 'exito');
    consumirTurno('compra de pieza VIP', COSTOS_TURNO.piezaVip);
}

function aplicarImpulsoHumorEquipo(rebajaEnojo, bonusHumor) {
    let mecanicosCalmados = 0;
    let mecanicosAnimados = 0;
    (mecanicos || []).forEach(function(m) {
        if (!m) return;

        const enojoAntes = Number(m.enojo || 0);
        const enojoDespues = Math.max(0, enojoAntes - (rebajaEnojo || 0));
        if (enojoDespues < enojoAntes) mecanicosCalmados += 1;
        m.enojo = enojoDespues;

        const humorAntes = Number(typeof m.humor === 'number' ? m.humor : 7);
        const humorDespues = Math.max(0, Math.min(10, humorAntes + (bonusHumor || 0)));
        if (humorDespues > humorAntes) mecanicosAnimados += 1;
        m.humor = humorDespues;
    });
    return { mecanicosCalmados, mecanicosAnimados };
}

function comprarCafe() {
    const usaEstadosFisicos = typeof usaEstadosFisicosJugador === 'function' ? usaEstadosFisicosJugador() : true;
    if (saldo < 150) {
        log('No tienes dinero', 'error');
        return;
    }
    if (!consumirFoco('cafe')) return;
    saldo -= 150;
    if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarGastoDia === 'function') {
        window.TallerApp.helpers.registrarGastoDia(150, 'cafe');
    }

    const impactoEquipo = aplicarImpulsoHumorEquipo(1, 0.35);
    const mecanicosCalmados = impactoEquipo.mecanicosCalmados;
    const mecanicosAnimados = impactoEquipo.mecanicosAnimados;

    if (usaEstadosFisicos) {
        estres = Math.max(0, estres - 10);
        sueno = Math.min(100, sueno + 5);
    }

    // Mensaje variado segun estado real del equipo
    var mecEnojadosAhora = (mecanicos || []).filter(function(m) { return m && (m.enojo || 0) >= 4; }).length;
    var frasesCafe;
    if (!usaEstadosFisicos) {
        frasesCafe = [
            'Ronda de cafe. El equipo vuelve a entrar fino y el taller sostiene el ritmo.',
            'Cafe operativo. ' + mecanicosAnimados + ' mecanico(s) afinan el pulso del taller.',
            'Cafe de box. Menos friccion, mejor ritmo para los siguientes casos.'
        ];
    } else if (mecEnojadosAhora >= 2) {
        frasesCafe = [
            'El cafe llego justo antes de que el equipo explotara. ' + mecanicosCalmados + ' mecanico(s) bajan la guardia.',
            'Ronda de cafe de emergencia. Sin esto el taller perdia el dia.',
            'Cafe de crisis. El equipo respira un segundo. Aprovechalo.'
        ];
    } else if (mecanicosCalmados === 0 && mecanicosAnimados > 0) {
        frasesCafe = [
            'El equipo estaba bien, el cafe los pone mejor. ' + mecanicosAnimados + ' mas enfocados.',
            'Pausa breve. Todo en orden, sigue asi.',
            'Cafe tranquilo. La maquinaria humana bien engrasada.'
        ];
    } else {
        frasesCafe = [
            'Ronda de cafe. ' + (mecanicosCalmados || mecanicosAnimados) + ' mecanico(s) bajan tension.',
            'El cafe no arregla la deuda, pero el equipo vuelve a respirar.',
            'Pausa rapida. ' + mecanicosAnimados + ' mecanico(s) encienden de nuevo.',
            'Cafe para el equipo. El ruido del barrio afuera, la calma adentro por un momento.'
        ];
    }
    var fraseFinal = frasesCafe[Math.floor(Math.random() * frasesCafe.length)];
    log(fraseFinal, 'exito');
    if (typeof mostrarFeedbackGameplay === 'function') {
        mostrarFeedbackGameplay(fraseFinal, 'ok');
    }
    consumirTurno('pausa cafe', COSTOS_TURNO.cafe);
    if (typeof actualizarUI === 'function') actualizarUI();
    if (typeof actualizarScreenOficina === 'function') actualizarScreenOficina();
    if (typeof actualizarScreenExterior === 'function') actualizarScreenExterior();
    if (typeof cerrarModal === 'function') cerrarModal();
}

function comprarPizza() {
    const usaEstadosFisicos = typeof usaEstadosFisicosJugador === 'function' ? usaEstadosFisicosJugador() : true;
    if (saldo < 320) {
        log('No tienes dinero para la pizza del equipo.', 'error');
        return;
    }
    if (!consumirFoco('comida')) return;

    saldo -= 320;
    if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarGastoDia === 'function') {
        window.TallerApp.helpers.registrarGastoDia(320, 'comida');
    }

    const impactoEquipo = aplicarImpulsoHumorEquipo(1, 0.6);
    if (usaEstadosFisicos) {
        hambre = Math.max(0, hambre - 18);
        estres = Math.max(0, estres - 6);
    }

    const frase = usaEstadosFisicos
        ? `Pizza compartida en el taller. ${impactoEquipo.mecanicosAnimados} mecanico(s) suben el humor y ${impactoEquipo.mecanicosCalmados} bajan tension.`
        : `Pizza compartida en el taller. ${impactoEquipo.mecanicosAnimados} mecanico(s) mejoran el humor y ${impactoEquipo.mecanicosCalmados} ayudan a sostener el ritmo.`;
    log(frase, 'exito');
    if (typeof mostrarFeedbackGameplay === 'function') {
        mostrarFeedbackGameplay(frase, 'ok');
    }
    consumirTurno('pizza para el equipo', COSTOS_TURNO.comida);
    if (typeof actualizarUI === 'function') actualizarUI();
    if (typeof actualizarScreenOficina === 'function') actualizarScreenOficina();
    if (typeof actualizarScreenExterior === 'function') actualizarScreenExterior();
    if (typeof autoGuardarPartidaSilenciosa === 'function') autoGuardarPartidaSilenciosa('pizza');
    if (typeof cerrarModal === 'function') cerrarModal();
}

function explicarResultadoParcialReparacion(rep) {
    if (!rep) return 'La reparación resolvió la falla principal, pero quedó una observación pendiente.';
    const causas = [];
    if (rep.diagnosticoNivel === 'parcial' || rep.diagnosticoRiesgoAlto) {
        causas.push('el diagnóstico llegó con incertidumbre');
    }
    const piezas = Array.isArray(rep.piezasContinuacionEntregadas) ? rep.piezasContinuacionEntregadas : [];
    if (piezas.some(function(p) { return p && p.calidad === 'basica'; })) {
        causas.push('se usó una pieza económica');
    }
    const mecanico = Array.isArray(mecanicos) ? mecanicos.find(function(m) { return m && m.nombre === rep.mecanicoNombre; }) : null;
    if (mecanico && rep.especialidadIdeal && mecanico.especialidad && mecanico.especialidad !== rep.especialidadIdeal) {
        causas.push('la especialidad del mecánico no era la ideal');
    }
    if (Number(rep.dificultad || 0) >= 0.72) {
        causas.push('la avería tenía complejidad alta');
    }
    if (!causas.length) causas.push('quedó una calibración o validación final pendiente');
    return `Se resolvió la falla principal, pero ${causas.join(', ')}. El cliente recibe el vehículo con observación y el cobro se reduce.`;
}

function comerDuenoDesdeOficina() {
    const costo = 180;
    if (saldo < costo) {
        log('Necesitas RD$180 para comer.', 'error');
        return;
    }
    saldo -= costo;
    hambre = Math.max(0, (Number(hambre) || 0) - 35);
    estres = Math.max(0, (Number(estres) || 0) - 8);
    if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarGastoDia === 'function') {
        window.TallerApp.helpers.registrarGastoDia(costo, 'comida');
    }
    log('Comiste y recuperaste energia. Hambre -35, estres -8.', 'exito');
    if (typeof actualizarUI === 'function') actualizarUI();
    if (typeof actualizarScreenOficina === 'function') actualizarScreenOficina();
    if (typeof actualizarScreenExterior === 'function') actualizarScreenExterior();
    if (typeof autoGuardarPartidaSilenciosa === 'function') autoGuardarPartidaSilenciosa('comer-dueno');
}

function descansarDuenoDesdeOficina() {
    sueno = Math.max(0, (Number(sueno) || 0) - 35);
    estres = Math.max(0, (Number(estres) || 0) - 15);
    log('Tomaste un descanso. Sueno -35, estres -15.', 'exito');
    if (typeof actualizarUI === 'function') actualizarUI();
    if (typeof actualizarScreenOficina === 'function') actualizarScreenOficina();
    if (typeof autoGuardarPartidaSilenciosa === 'function') autoGuardarPartidaSilenciosa('descanso-dueno');
}

function comprarLicuado() {
    const usaEstadosFisicos = typeof usaEstadosFisicosJugador === 'function' ? usaEstadosFisicosJugador() : true;
    if (saldo < 180) {
        log('No tienes dinero para los licuados del equipo.', 'error');
        return;
    }
    if (!consumirFoco('comida')) return;

    saldo -= 180;
    if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarGastoDia === 'function') {
        window.TallerApp.helpers.registrarGastoDia(180, 'comida');
    }

    const impactoEquipo = aplicarImpulsoHumorEquipo(1, 0.4);
    if (usaEstadosFisicos) {
        hambre = Math.max(0, hambre - 10);
        estres = Math.max(0, estres - 8);
    }

    const frase = usaEstadosFisicos
        ? `Licuados frios para el calor del barrio. ${impactoEquipo.mecanicosAnimados} mecanico(s) recuperan foco y ${impactoEquipo.mecanicosCalmados} bajan el enojo.`
        : `Licuados frios para el calor del barrio. ${impactoEquipo.mecanicosAnimados} mecanico(s) recuperan ritmo y ${impactoEquipo.mecanicosCalmados} bajan el enojo.`;
    log(frase, 'exito');
    if (typeof mostrarFeedbackGameplay === 'function') {
        mostrarFeedbackGameplay(frase, 'ok');
    }
    consumirTurno('licuado para el equipo', COSTOS_TURNO.comida);
    if (typeof actualizarUI === 'function') actualizarUI();
    if (typeof actualizarScreenOficina === 'function') actualizarScreenOficina();
    if (typeof actualizarScreenExterior === 'function') actualizarScreenExterior();
    if (typeof cerrarModal === 'function') cerrarModal();
}

function comer() {
    if (typeof usaEstadosFisicosJugador === 'function' && !usaEstadosFisicosJugador()) {
        log('La comida del dueno no afecta el loop por casos. Usa cafe, pizza o mejoras tacticas.', 'info');
        if (typeof mostrarFeedbackGameplay === 'function') {
            mostrarFeedbackGameplay('Accion omitida: la comida del dueno no impacta el modo por casos.', 'info');
        }
        return;
    }
    if (saldo < 200) {
        log('No tienes dinero', 'error');
        return;
    }
    if (!consumirFoco('comida')) return;
    saldo -= 200;
    if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarGastoDia === 'function') {
        window.TallerApp.helpers.registrarGastoDia(200, 'comida');
    }
    hambre = Math.max(0, hambre - 20);
    log('Comida comprada. Hambre -20', 'exito');
    consumirTurno('comida', COSTOS_TURNO.comida);
}

function alimentarMalvavisco() {
    if (malvaviscoAlimentadoHoy) {
        log('Malvavisco ya comio hoy.', 'info');
        return;
    }
    if (saldo < 120) {
        log('No tienes dinero para alimentar a Malvavisco.', 'error');
        return;
    }
    if (!consumirFoco('comida')) return;

    saldo -= 120;
    if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarGastoDia === 'function') {
        window.TallerApp.helpers.registrarGastoDia(120, 'comida');
    }
    malvaviscoAlimentadoHoy = true;
    malvaviscoAfinidad = Math.min(8, malvaviscoAfinidad + 1);
    mostrarFeedbackGameplay('Malvavisco alimentado: bono de cierre activado.', 'ok');
    consumirTurno('alimentar a Malvavisco', COSTOS_TURNO.comida);
    const usaEstadosFisicos = typeof usaEstadosFisicosJugador === 'function' ? usaEstadosFisicosJugador() : true;
    if (usaEstadosFisicos) {
        estres = Math.max(0, estres - 2);
        log('Malvavisco comio y se acosto en la caja de herramientas. -2 estres.', 'exito');
    } else {
        log('Malvavisco comio y se acomodo en la caja de herramientas. Afinidad +1.', 'exito');
    }

}

function acariciarMalvavisco() {
    if (malvaviscoAcariciadoHoy) {
        log('Ya le diste atencion a Malvavisco hoy.', 'info');
        return;
    }
    if (!consumirFoco('acariciar a Malvavisco')) return;

    malvaviscoAcariciadoHoy = true;
    malvaviscoAfinidad = Math.min(8, malvaviscoAfinidad + 1);
    const usaEstadosFisicos = typeof usaEstadosFisicosJugador === 'function' ? usaEstadosFisicosJugador() : true;
    if (usaEstadosFisicos) {
        estres = Math.max(0, estres - 1);
        log('Le dedicaste un momento a Malvavisco. Afinidad +1, estres -1.', 'exito');
    } else {
        log('Le dedicaste un momento a Malvavisco. Afinidad +1.', 'exito');
    }
}

function aplicarEfectoMalvaviscoCierre() {
    if (malvaviscoAlimentadoHoy) {
        const roll = Math.random();
        if (roll < 0.5) {
            reputacion = Math.min(100, reputacion + 1);
            log('Malvavisco estuvo manso todo el dia. +1 reputacion por ambiente amigable.', 'exito');
        } else {
            if (typeof usaEstadosFisicosJugador === 'function' && !usaEstadosFisicosJugador()) {
                if (typeof asegurarRitmoTaller === 'function') asegurarRitmoTaller();
                if (typeof ritmoTaller === 'object' && ritmoTaller) {
                    ritmoTaller.impulso = Math.min(100, Math.round((ritmoTaller.impulso || 0) + 6));
                }
                if (typeof obtenerResumenRitmoTaller === 'function') obtenerResumenRitmoTaller();
                log('Malvavisco deja el taller mas sereno. +6% de impulso operativo.', 'exito');
            } else {
                estres = Math.max(0, estres - 4);
                log('Malvavisco ronroneo en el cierre. -4 estres.', 'exito');
            }
        }
    } else {
        hambre = Math.min(100, hambre + 12);
        estres = Math.min(100, estres + 6);
        reputacion = Math.max(0, reputacion - 1);
        log('Malvavisco te robo comida del mostrador por no alimentarlo. +hambre, +estres, -1 reputacion.', 'error');
        mostrarFeedbackGameplay('Malvavisco robo comida por descuido. Penalizacion aplicada.', 'warn');
        malvaviscoAfinidad = Math.max(-5, malvaviscoAfinidad - 1);
    }
}

function aplicarEventoMalvaviscoPorAfinidad() {
    const afinidad = Math.max(-5, Math.min(8, Math.round(malvaviscoAfinidad || 0)));
    const tirada = Math.random();
    let deltaSaldo = 0;
    let deltaRep = 0;
    let deltaEstres = 0;
    let deltaAfinidad = 0;
    let mensaje = '';
    let tono = 'ok';

    if (afinidad >= 5) {
        if (tirada < 0.72) {
            deltaSaldo = 700 + Math.round(Math.random() * 900);
            deltaRep = 1;
            deltaEstres = -2;
            mensaje = `Malvavisco trajo un objeto valioso para vender. +RD$${deltaSaldo} y +1 reputacion.`;
        } else {
            deltaSaldo = -(200 + Math.round(Math.random() * 220));
            deltaEstres = 2;
            mensaje = `Malvavisco tiro una herramienta premium y se dano. -RD$${Math.abs(deltaSaldo)}.`;
            tono = 'warn';
        }
    } else if (afinidad >= 2) {
        if (tirada < 0.55) {
            deltaSaldo = 300 + Math.round(Math.random() * 500);
            deltaEstres = -1;
            mensaje = `Malvavisco encontro una pieza reutilizable. +RD$${deltaSaldo}.`;
        } else {
            deltaSaldo = -(180 + Math.round(Math.random() * 260));
            deltaEstres = 2;
            mensaje = `Malvavisco escondio un repuesto y se perdio tiempo. -RD$${Math.abs(deltaSaldo)}.`;
            tono = 'warn';
        }
    } else if (afinidad >= 0) {
        if (tirada < 0.45) {
            deltaSaldo = 180 + Math.round(Math.random() * 320);
            mensaje = `Malvavisco aparecio con accesorios vendibles del patio. +RD$${deltaSaldo}.`;
        } else {
            deltaSaldo = -(220 + Math.round(Math.random() * 260));
            deltaEstres = 3;
            deltaAfinidad = -1;
            mensaje = `Malvavisco mordio cableado de una lampara del taller. -RD$${Math.abs(deltaSaldo)} y afinidad -1.`;
            tono = 'warn';
        }
    } else {
        if (tirada < 0.28) {
            deltaSaldo = 140 + Math.round(Math.random() * 240);
            deltaAfinidad = 1;
            mensaje = `Malvavisco se calmo y dejo una pieza menor recuperable. +RD$${deltaSaldo}, afinidad +1.`;
        } else {
            deltaSaldo = -(320 + Math.round(Math.random() * 380));
            deltaRep = -1;
            deltaEstres = 4;
            deltaAfinidad = -1;
            mensaje = `Malvavisco hizo un desastre en recepcion frente a clientes. -RD$${Math.abs(deltaSaldo)}, reputacion -1 y afinidad -1.`;
            tono = 'warn';
        }
    }

    if (deltaSaldo >= 0) {
        saldo += deltaSaldo;
        if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarIngresoDia === 'function') {
            window.TallerApp.helpers.registrarIngresoDia(deltaSaldo, 'eventos');
        }
    } else {
        const perdida = Math.abs(deltaSaldo);
        const descontadoCaja = Math.min(Math.max(0, saldo), perdida);
        saldo = Math.max(0, saldo - perdida);
        if (descontadoCaja < perdida) {
            deuda += (perdida - descontadoCaja);
        }
        if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarGastoDia === 'function') {
            window.TallerApp.helpers.registrarGastoDia(perdida, 'eventos');
        }
    }

    if (deltaRep) reputacion = Math.max(0, Math.min(100, reputacion + deltaRep));
    if (deltaEstres) estres = Math.max(0, Math.min(100, estres + deltaEstres));
    if (deltaAfinidad) malvaviscoAfinidad = Math.max(-5, Math.min(8, malvaviscoAfinidad + deltaAfinidad));

    log(mensaje, tono === 'ok' ? 'exito' : 'warn');
    if (typeof mostrarFeedbackGameplay === 'function') {
        mostrarFeedbackGameplay(mensaje, tono);
    }
}

function registrarCasoCerradoMalvavisco() {
    malvaviscoCasosCerrados = Math.max(0, Math.round(malvaviscoCasosCerrados || 0)) + 1;
    const hitoActual = Math.floor(malvaviscoCasosCerrados / 5) * 5;
    if (hitoActual < 5) return;
    if (hitoActual <= Math.max(0, Math.round(malvaviscoUltimoEventoCasos || 0))) return;
    malvaviscoUltimoEventoCasos = hitoActual;
    aplicarEventoMalvaviscoPorAfinidad();
}

function mejorarTaller() {
    const dataMejora = ECONOMY_DATA.mejoraTaller || { costoBase: 1400, costoPorNivel: 900, diaBase: 2, repBase: 52, repPorNivel: 4, nivelMax: 6 };
    const nivelBase = Math.max(1, Math.round(nivelJugador || 1));
    const casosBase = 1 + Math.floor(Math.max(0, Math.round(clientesHoy || 0)) / 4);
    const progresoOperativo = Math.max(nivelBase, casosBase);
    const costo = dataMejora.costoBase + ((tallerNivel - 1) * dataMejora.costoPorNivel);
    if (tallerNivel >= dataMejora.nivelMax) {
        log('El taller ya esta al maximo nivel.', 'info');
        return;
    }
    const progresoRequerido = (dataMejora.nivelBase || dataMejora.diaBase || 2) + tallerNivel;
    const repRequerida = dataMejora.repBase + (tallerNivel * dataMejora.repPorNivel);
    if (progresoOperativo < progresoRequerido || reputacion < repRequerida) {
        const reqTxt = `Mejora bloqueada: requiere Progreso ${progresoRequerido} y Reputacion ${repRequerida}.`;
        log(reqTxt, 'error');
        return;
    }
    if (saldo < costo) {
        log(`Necesitas RD$${costo} para mejorar el taller.`, 'error');
        return;
    }
    if (!consumirFoco('mejorar')) return;
    saldo -= costo;
    if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarGastoDia === 'function') {
        window.TallerApp.helpers.registrarGastoDia(costo, 'mejoras');
    }
    tallerNivel += 1;
    if (tallerNivel >= 2) espaciosReparacionMax = 3;
    if (tallerNivel >= 4) espaciosReparacionMax = 4;
    if (tallerNivel >= 5) espaciosReparacionMax = 5;
    if (tallerNivel >= 6) espaciosReparacionMax = 6;
    reputacion += 3;
    estres = Math.max(0, estres - 5);
    log(`Taller mejorado a nivel ${tallerNivel}. Mejor flujo y menor costo operativo.`, 'exito');

    // Desbloquear fragmento narrativo por nivel
    var nivelesDesbloqueados = nivelesNarrativaDesbloqueados || [];
    if (nivelesDesbloqueados.indexOf(tallerNivel) === -1) {
        nivelesNarrativaDesbloqueados = nivelesDesbloqueados.concat([tallerNivel]);
        var fragNivel = window.TallerData && window.TallerData.historiasDesbloqueoNivel && window.TallerData.historiasDesbloqueoNivel[tallerNivel];
        if (fragNivel && typeof pushMensajeTelefono === 'function') {
            pushMensajeTelefono(
                'cronica_barrio',
                'cronica_barrio',
                fragNivel.titulo + '\n' + fragNivel.texto,
                {
                    clave: 'nivel-taller-' + tallerNivel,
                    bloqueante: true,
                    autorNombre: 'Cronica Del Barrio',
                    metaNarrativa: {
                        tipo: 'arco_narrativo',
                        eventoId: 'nivel_taller_' + tallerNivel,
                        fase: 'desbloqueo',
                        dia: (typeof dia === 'number' ? dia : 1),
                        participantes: ['Cronica Del Barrio', 'Jefe']
                    }
                }
            );
        }
        // Re-verificar arcos ya que el nivel cambio
        if (typeof verificarDesbloqueoArcoNarrativo === 'function') {
            verificarDesbloqueoArcoNarrativo();
        }
    }

    consumirTurno('mejora de taller', COSTOS_TURNO.mejorar);
    if (typeof autoGuardarPartidaSilenciosa === 'function') {
        autoGuardarPartidaSilenciosa('mejorar-taller');
    }
}

function mediarConflicto() {
    if (saldo < 180) {
        log('Necesitas RD$180 para mediar conflicto.', 'error');
        return;
    }
    if (!consumirFoco('mediar')) return;
    saldo -= 180;
    if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarGastoDia === 'function') {
        window.TallerApp.helpers.registrarGastoDia(180, 'equipo');
    }

    mecanicos.forEach(m => {
        m.enojo = Math.max(0, m.enojo - 1);
    });

    const modoSinCierreMediar = (typeof estaModoSinCierreDia === 'function' && estaModoSinCierreDia());
    const bloqueados = modoSinCierreMediar
        ? mecanicos.filter(function(m) { return (m.enfriamientoTurnos || 0) > 0; })
        : mecanicos.filter(function(m) { return m.bloqueadoHastaDia >= dia; });
    if (bloqueados.length > 0 && Math.random() < 0.65) {
        const elegido = bloqueados[Math.floor(Math.random() * bloqueados.length)];
        if (modoSinCierreMediar) {
            elegido.enfriamientoTurnos = 0;
            log(`Mediacion exitosa: ${elegido.nombre} vuelve al trabajo de inmediato.`, 'exito');
        } else {
            elegido.bloqueadoHastaDia = 0;
            log(`Mediacion exitosa: ${elegido.nombre} vuelve al trabajo hoy.`, 'exito');
        }
    } else {
        log('Mediacion parcial: baja el enojo general del equipo.', 'info');
    }

    estres = Math.max(0, estres - 8);
    consumirTurno('mediacion', COSTOS_TURNO.mediar);
}

// ═══════════════════════════════════════════════════════
//  TIENDA DE REPUESTOS
// ═══════════════════════════════════════════════════════


// --- NUEVO: Packs de Descuento en Repuestos ---
var _repuestosFiltroActivo = 'todos';
var _descuentoPacksComprados = [];

// Configuración de packs de descuento
var DESCUENTO_REPUESTOS_PACKS = [
    {
        id: 'pack10',
        nombre: 'Pack Descuento Básico',
        descripcion: '10% de descuento en todas las piezas. Se desbloquea tras 10 casos completados.',
        descuento: 0.10,
        casosRequeridos: 10,
        costo: 1200,
        duracion: 0 // 0 = permanente
    },
    {
        id: 'pack25',
        nombre: 'Pack Descuento Avanzado',
        descripcion: '20% de descuento en todas las piezas. Se desbloquea tras 25 casos completados.',
        descuento: 0.20,
        casosRequeridos: 25,
        costo: 2200,
        duracion: 0
    },
    {
        id: 'pack50',
        nombre: 'Pack Descuento Élite',
        descripcion: '30% de descuento en todas las piezas. Se desbloquea tras 50 casos completados.',
        descuento: 0.30,
        casosRequeridos: 50,
        costo: 3500,
        duracion: 0
    }
];

function obtenerCasosCompletadosParaDescuentos() {
    // Intenta usar función global, si no, variable global
    if (typeof obtenerCasosCompletadosNarrativa === 'function') {
        return obtenerCasosCompletadosNarrativa();
    }
    return (typeof casosAtendidos === 'object' && Array.isArray(casosAtendidos)) ? casosAtendidos.length : 0;
}

function obtenerDescuentoActivo() {
    // Devuelve el mayor descuento comprado
    if (!_descuentoPacksComprados.length) return 0;
    let max = 0;
    for (const id of _descuentoPacksComprados) {
        const pack = DESCUENTO_REPUESTOS_PACKS.find(p => p.id === id);
        if (pack && pack.descuento > max) max = pack.descuento;
    }
    return max;
}

function comprarPackDescuento(id) {
    const pack = DESCUENTO_REPUESTOS_PACKS.find(p => p.id === id);
    if (!pack) return;
    if (_descuentoPacksComprados.includes(id)) {
        log(`Ya tienes el ${pack.nombre}.`, 'info');
        return;
    }
    if (saldo < pack.costo) {
        log(`No alcanza para ${pack.nombre} (RD$${pack.costo}).`, 'error');
        return;
    }
    if (obtenerCasosCompletadosParaDescuentos() < pack.casosRequeridos) {
        log(`Aún no has completado suficientes casos para este pack.`, 'warn');
        return;
    }
    saldo -= pack.costo;
    _descuentoPacksComprados.push(id);
    mostrarFeedbackGameplay(`${pack.nombre} activado. ¡Ahora tienes ${Math.round(pack.descuento*100)}% de descuento en piezas!`, 'ok');
    mostrarStamp('DESCUENTO', 'ok');
    log(`Compraste ${pack.nombre} por RD$${pack.costo}.`, 'exito');
    renderizarTiendaRepuestos();
    actualizarUI && actualizarUI();
    if (typeof autoGuardarPartidaSilenciosa === 'function') autoGuardarPartidaSilenciosa('pack-repuestos');
}

// --- FIN NUEVO ---


function renderizarTiendaRepuestos(filtro) {
    const cont = document.getElementById('repuestos-catalogo');
    if (!cont) return;
    _repuestosFiltroActivo = filtro || _repuestosFiltroActivo || 'todos';
    const casosCompletados = obtenerCasosCompletadosParaDescuentos();
    const descuento = obtenerDescuentoActivo();
    const fichaActiva = clienteActual ? obtenerFichaVehiculoParaRepuesto(clienteActual) : null;
    const piezas = (ECONOMY_DATA.catalogoRepuestos || []).filter(p =>
        _repuestosFiltroActivo === 'todos' || p.especialidad === _repuestosFiltroActivo
    );
    const piezasHtml = piezas.map(pieza => {
        const costoFinal = Math.round((pieza.costo || 0) * (1 - descuento));
        const enInventario = inventarioPiezas.some(p => p.id === pieza.id && !p.instalada);
        const puedeComprar = !enInventario && saldo >= costoFinal;
        const calidad = pieza.calidad === 'premium' ? 'Original' : (pieza.calidad === 'estandar' ? 'Estandar' : 'Economica');
        const compatible = !clienteActual || esRepuestoCompatibleConVehiculo(pieza, clienteActual);
        const ajusteVehiculo = fichaActiva && compatible
            ? ` | Compatible con ${fichaActiva.clase}`
            : (fichaActiva ? ` | No apto para ${fichaActiva.clase}` : '');
        const riesgo = Math.round((pieza.bonusProb || 0) * 100);
        const tiempo = Math.max(0, Math.round(pieza.bonusTiempo || 0));
        const duracionPieza = pieza.calidad === 'premium' ? 'Alta' : (pieza.calidad === 'estandar' ? 'Media' : 'Corta');
        const riesgoRetorno = Math.max(3, 24 - riesgo - (pieza.calidad === 'premium' ? 8 : pieza.calidad === 'estandar' ? 3 : 0));
        const especialistas = (mecanicos || []).filter(function(m) { return m && m.especialidad === pieza.especialidad; }).map(function(m) { return m.nombre; }).slice(0, 2).join(', ') || 'Sin especialista asignado';
        const economiaPieza = clienteActual && typeof evaluarEconomiaCaso === 'function' ? evaluarEconomiaCaso(clienteActual) : null;
        const netoPieza = economiaPieza ? economiaPieza.ingreso - costoFinal : null;
        return `<div class="repuesto-card calidad-${pieza.calidad || 'basica'}">
            <span class="rep-nombre">${pieza.nombre}</span>
            <span class="rep-meta">${capitalizarEspecialidad(pieza.especialidad)} | ${calidad}${ajusteVehiculo}</span>
            <span class="rep-efecto">+${riesgo}% exito${tiempo ? ` | -${tiempo} turno(s)` : ''}${pieza.bonusGanancia ? ` | +${Math.round(pieza.bonusGanancia * 100)}% cobro` : ''}</span>
            <span class="rep-efecto">Duracion ${duracionPieza} | Retorno ${riesgoRetorno}% | Especialista: ${especialistas}</span>
            ${netoPieza === null ? '' : `<span class="rep-efecto">${netoPieza >= 0 ? 'Ganancia neta' : 'Perdida estimada'}: ${netoPieza >= 0 ? '+' : '-'}RD$${Math.abs(netoPieza)}</span>`}
            <button class="btn" onclick="comprarRepuesto('${pieza.id}')" ${puedeComprar ? '' : 'disabled'}>${enInventario ? 'En inventario' : (puedeComprar ? `Comprar RD$${costoFinal}` : `Faltan RD$${Math.max(0, costoFinal - saldo)}`)}</button>
        </div>`;
    }).join('');
    const packsHtml = DESCUENTO_REPUESTOS_PACKS.map(pack => {
        const yaComprado = _descuentoPacksComprados.includes(pack.id);
        const desbloqueado = casosCompletados >= pack.casosRequeridos;
        const puedeComprar = saldo >= pack.costo && desbloqueado && !yaComprado;
        return `<div class="repuesto-card calidad-pack${yaComprado ? ' ya-comprada' : ''}">
            <span class="rep-nombre">${pack.nombre}</span>
            <span class="rep-meta">${pack.descripcion}</span>
            <span class="rep-efecto">Descuento: <strong>${Math.round(pack.descuento*100)}%</strong> ${pack.duracion > 0 ? `| ${pack.duracion} días` : '| Permanente'}</span>
            <button class="btn" style="margin-top:4px; font-size:0.78rem;" onclick="comprarPackDescuento('${pack.id}')" ${(!puedeComprar) ? 'disabled' : ''}>
                ${yaComprado ? 'Activo' : (desbloqueado ? `Comprar RD$${pack.costo}` : `Requiere ${pack.casosRequeridos} casos`)}
            </button>
        </div>`;
    }).join('');
    cont.innerHTML = `<div class="repuestos-catalogo-piezas">${piezasHtml || '<p>No hay piezas en esta categoria.</p>'}</div><div class="repuestos-pack-seccion"><strong>Packs por volumen</strong>${packsHtml}</div>`;

    // Mostrar inventario y el descuento activo
    const info = document.getElementById('repuestos-descuento-info');
    if (info) {
        info.innerHTML = descuento > 0 ? `<span class="descuento-activo">Descuento activo en piezas: <strong>${Math.round(descuento*100)}%</strong></span>` : '';
    }
    renderizarInventarioRepuestos();
}

function capitalizarEspecialidad(esp) {
    const mapa = { motor: 'Motor', transmision: 'Transmision', electricidad: 'Electrico', frenos: 'Frenos', suspension: 'Suspension', escape: 'Escape' };
    return mapa[esp] || esp;
}

function filtrarRepuestos(filtro) {
    renderizarTiendaRepuestos(filtro);
    document.querySelectorAll('.repuesto-tab').forEach(function(btn) {
        var accion = btn.getAttribute('onclick') || '';
        btn.classList.toggle('active', accion.indexOf("'" + filtro + "'") >= 0);
    });
}

function estimarReservaOperativaMinima() {
    const hayDelivery = Array.isArray(entregasPiezasActivas) && entregasPiezasActivas.some(function(e) { return !!e; });
    const hayReparacion = Array.isArray(reparacionesActivas) && reparacionesActivas.some(function(r) { return r && !r.listoParaCobro; });
    // Tres avances rápidos son una reserva razonable; la espera gratis sigue
    // disponible si el jugador decide preservar efectivo.
    return (hayDelivery || hayReparacion) ? 450 : 0;
}

// La compra de piezas ahora usa el descuento activo
function comprarRepuesto(id) {
    const data = (ECONOMY_DATA.catalogoRepuestos || []).find(p => p.id === id);
    if (!data) return;
    if (inventarioPiezas.some(p => p.id === id && !p.instalada)) {
        log(`Ya tienes ${data.nombre} en inventario.`, 'info');
        return;
    }
    // Aplicar descuento activo
    const descuento = obtenerDescuentoActivo();
    const costoFinal = Math.round((data.costo || 0) * (1 - descuento));
    if (saldo < costoFinal) {
        log(`No alcanza para ${data.nombre} (RD$${costoFinal}).`, 'error');
        return;
    }
    const cajaLuego = Math.max(0, Math.round(saldo - costoFinal));
    const reserva = estimarReservaOperativaMinima();
    if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
        const faltanteReserva = Math.max(0, reserva - cajaLuego);
        const casoCompra = clienteActual || (reparacionesActivas || []).find(function(rep) {
            return rep && rep.pausadaPorPieza && rep.especialidadIdeal === data.especialidad;
        }) || null;
        const ingresoCaso = Math.max(0, Math.round((casoCompra && (casoCompra.pagoAcordado || casoCompra.pago || casoCompra.ganancia)) || 0));
        const netoCaso = ingresoCaso ? ingresoCaso - costoFinal : null;
        const riesgoBloqueo = cajaLuego < reserva ? 'ALTO' : (cajaLuego < reserva + 300 ? 'MEDIO' : 'BAJO');
        const mensajeCompraSeguro = [
            data.nombre,
            '',
            `Caja actual: RD$${Math.round(saldo)}`,
            `Coste de pieza: RD$${costoFinal}`,
            `Caja restante: RD$${cajaLuego}`,
            'Entrega estimada: 10-30 min',
            netoCaso === null ? '' : `${netoCaso >= 0 ? 'Ganancia neta' : 'Perdida estimada'}: ${netoCaso >= 0 ? '+' : '-'}RD$${Math.abs(netoCaso)}`,
            `Riesgo de bloqueo: ${riesgoBloqueo}`,
            `Reserva operativa: RD$${reserva}`,
            faltanteReserva ? `Faltante para reserva: RD$${faltanteReserva}` : '',
            '',
            'Alternativas: pieza economica, credito, anticipo, cancelar o ESPERAR GRATIS. Confirmar compra?'
        ].filter(function(linea, indice, lista) { return linea !== '' || (indice > 0 && lista[indice - 1] !== ''); }).join('\n');
        const confirmarSeguro = window.confirm(mensajeCompraSeguro);
        const confirmar = confirmarSeguro;
        String(
            `${data.nombre} cuesta RD$${costoFinal}.\n\n` +
            `Tu caja quedará en RD$${cajaLuego}.\n` +
            `Reserva recomendada para acelerar operaciones: RD$${reserva}.\n` +
            (faltanteReserva ? `Te faltarán RD$${faltanteReserva} para esa reserva.\n\n` : '\n') +
            'Puedes comprar y usar ESPERAR GRATIS mientras llega el delivery. ¿Confirmar compra?'
        );
        if (!confirmar) {
            mostrarFeedbackGameplay('Compra cancelada. Puedes buscar una pieza económica o esperar caja.', 'info');
            return false;
        }
    }
    if (!consumirFoco('comprarPieza')) return;
    saldo -= costoFinal;
    if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarGastoDia === 'function') {
        window.TallerApp.helpers.registrarGastoDia(costoFinal, 'piezas');
    }
    inventarioPiezas.push({
        id: data.id,
        nombre: data.nombre,
        especialidad: data.especialidad,
        calidad: data.calidad,
        bonusProb: data.bonusProb,
        bonusTiempo: data.bonusTiempo,
        bonusGanancia: data.bonusGanancia,
        costo: costoFinal,
        instalada: false
    });
    mostrarFeedbackGameplay(`${data.nombre} comprada y en inventario.`, 'ok');
    mostrarStamp('APROBADO', 'ok');
    log(`Compraste ${data.nombre} por RD$${costoFinal}.`, 'exito');
    consumirTurno('compra de pieza', COSTOS_TURNO.comprarPieza);
    renderizarTiendaRepuestos(_repuestosFiltroActivo || 'todos');
    actualizarUI && actualizarUI();
    if (typeof actualizarScreenExterior === 'function') actualizarScreenExterior();
    if (typeof autoGuardarPartidaSilenciosa === 'function') autoGuardarPartidaSilenciosa('compra-repuesto');
}

function renderizarInventarioRepuestos() {
    const cont = document.getElementById('repuestos-inventario');
    if (!cont) return;
    if (!inventarioPiezas.length) {
        cont.innerHTML = 'Sin piezas en inventario.';
        return;
    }
    cont.innerHTML = inventarioPiezas.map(p =>
        `<span class="inv-pieza-chip${p.instalada ? ' instalada' : ''}">${p.nombre}${p.instalada ? ' ✓' : ''}</span>`
    ).join('');
}

function obtenerPiezaDisponibleParaCaso() {
    if (!clienteActual) return null;
    const pendientes = obtenerPiezasPendientesMecanico(clienteActual);
    if (pendientes.length) {
        const requerida = pendientes[0];
        return inventarioPiezas.find(function(p) { return !p.instalada && p.id === requerida.id; }) || null;
    }
    return inventarioPiezas.find(p => !p.instalada && p.especialidad === clienteActual.especialidadIdeal) || null;
}

function instalarPiezaEnCaso(piezaId) {
    if (!clienteActual) {
        log('No hay caso activo donde instalar la pieza.', 'error');
        return;
    }
    const pendientesAntes = obtenerPiezasPendientesMecanico(clienteActual);
    if (pendientesAntes.length && piezaId !== pendientesAntes[0].id) {
        log(`El mecanico necesita primero ${pendientesAntes[0].nombre}.`, 'error');
        return;
    }

    const idx = inventarioPiezas.findIndex(p => p.id === piezaId && !p.instalada);
    if (idx === -1) {
        log('Esa pieza no esta disponible o ya fue instalada.', 'error');
        return;
    }
    const piezaConsumida = { ...inventarioPiezas[idx] };
    inventarioPiezas.splice(idx, 1);
    if (!Array.isArray(clienteActual.piezasInstaladasMecanico)) clienteActual.piezasInstaladasMecanico = [];
    if (clienteActual.piezasInstaladasMecanico.indexOf(piezaConsumida.id) < 0) {
        clienteActual.piezasInstaladasMecanico.push(piezaConsumida.id);
    }
    if (!clienteActual.piezaInstalada) {
        clienteActual.piezaInstalada = { ...piezaConsumida };
    }
    const data = piezaConsumida;

    const pendientesDespues = obtenerPiezasPendientesMecanico(clienteActual);
    if (pendientesDespues.length) {
        actualizarCasoAtendido(
            clienteActual,
            'falta_pieza',
            `Pieza instalada (${data.nombre}). Faltan: ${pendientesDespues.map(function(p) { return p.nombre; }).join(', ')}.`
        );
        log(`${data.nombre} instalada. Aun faltan: ${pendientesDespues.map(function(p) { return p.nombre; }).join(', ')}.`, 'info');
        mostrarFeedbackGameplay(`Instalada ${data.nombre}. Falta(n): ${pendientesDespues.map(function(p) { return p.nombre; }).join(', ')}.`, 'warn');
        actualizarUI();
        return;
    }

    actualizarCasoAtendido(
        clienteActual,
        clienteActual.aprobacionCliente ? 'listo_asignacion' : 'pieza_instalada',
        clienteActual.aprobacionCliente
            ? `Pieza instalada (${data.nombre}). Ya puedes asignar mecanico.`
            : `Pieza instalada (${data.nombre}). Falta aprobacion del cliente.`
    );
    log(`${data.nombre} instalada en el caso de ${clienteActual.personaNombre}. Bonus activo.`, 'exito');
    mostrarFeedbackGameplay(`Pieza instalada: ${data.nombre}. La reparacion mejora.`, 'ok');

    const idxPendiente = typeof clienteActual.mecanicoPendienteIdx === 'number' ? clienteActual.mecanicoPendienteIdx : null;
    if (idxPendiente !== null && clienteActual.aprobacionCliente) {
        const nombreMec = (mecanicos[idxPendiente] && mecanicos[idxPendiente].nombre) ? mecanicos[idxPendiente].nombre : 'mecanico asignado';
        log(`Piezas completas. ${nombreMec} arranca la reparacion.`, 'info');
        const idxAuto = idxPendiente;
        clienteActual.mecanicoPendienteIdx = null;
        asignarMecanico(idxAuto);
        return;
    }

    actualizarUI();
}

function registrarPiezaRotaPorMecanico(cliente, pieza, mecanicoNombre) {
    if (!cliente || !pieza) return;
    if (!Array.isArray(cliente.piezasRequeridasMecanico)) cliente.piezasRequeridasMecanico = [];
    if (!Array.isArray(cliente.piezasInstaladasMecanico)) cliente.piezasInstaladasMecanico = [];

    if (cliente.piezasInstaladasMecanico.indexOf(pieza.id) >= 0) {
        cliente.piezasInstaladasMecanico = cliente.piezasInstaladasMecanico.filter(function(id) { return id !== pieza.id; });
    }
    if (!cliente.piezasRequeridasMecanico.some(function(p) { return p && p.id === pieza.id; })) {
        cliente.piezasRequeridasMecanico.unshift({ id: pieza.id, nombre: pieza.nombre, especialidad: pieza.especialidad });
    }

    cliente.piezaInstalada = null;
    actualizarCasoAtendido(
        cliente,
        'falta_pieza',
        `${mecanicoNombre} reporta pieza danada (${pieza.nombre}). Debes comprarla de nuevo.`
    );
}

function verResultadoReparacionLista(idCaso, opciones) {
    var cfg = opciones || {};
    var clave = String(idCaso || '').trim();
    if (!clave) {
        log('Ese caso no es valido para mostrar resultado.', 'error');
        return false;
    }
    const rep = (reparacionesActivas || []).find(function(r) {
        return r && String(r.idCaso || '').trim() === clave && r.listoParaCobro;
    });
    if (!rep) {
        log('Ese caso no esta listo para mostrar resultado.', 'error');
        return false;
    }

    aplicarBalanceEconomicoReparacion(rep);

    var modalResultadoAbierto = false;
    rep.resultadoVisible = true;
    let resumen = '';
    if (rep.nivelResultado === 'critico') {
        resumen = `Resultado CRITICO: trabajo limpio y cobro proyectado RD$${rep.ganancia || 0}.`;
    } else if (rep.nivelResultado === 'parcial') {
        resumen = `Resultado PARCIAL: se resuelve con observaciones. Cobro proyectado RD$${rep.ganancia || 0}.`;
    } else {
        resumen = `Resultado FALLIDO: no se pudo cerrar bien. Impacto estimado RD$${rep.perdida || 0}.`;
    }
    if (rep.diagnosticoRiesgoAlto) {
        resumen += ' Caso de alto riesgo por dictamen fallido previo.';
    }
    log(`${rep.mecanicoNombre} en ${rep.idCaso}: ${resumen}`, rep.nivelResultado === 'fallo' ? 'error' : 'exito');
    if (!cfg.sinModal && typeof abrirModalResultadoReparacion === 'function') {
        modalResultadoAbierto = !!abrirModalResultadoReparacion(rep);
        if (!modalResultadoAbierto) {
            rep.resultadoVisible = false;
            if (typeof log === 'function') {
                log('No se pudo abrir el modal de resultado. Intenta de nuevo.', 'warn');
            }
        }
    }
    if (typeof mostrarFeedbackGameplay === 'function') {
        mostrarFeedbackGameplay(`${rep.idCaso}: ${resumen} Usa el boton "Cobrar y cerrar" en el panel de reparaciones.`, rep.nivelResultado === 'fallo' ? 'warn' : 'ok');
    }
    actualizarUI();
    return true;
}

function procesarCobroReparacionPorWhatsApp(idCaso) {
    var clave = String(idCaso || '').trim();
    if (!clave) {
        return { ok: false, mensaje: 'Caso invalido para cobro.' };
    }
    const idxRep = (reparacionesActivas || []).findIndex(function(r) {
        return r && String(r.idCaso || '').trim() === clave;
    });
    if (idxRep < 0) {
        return { ok: false, mensaje: 'No encuentro ese caso en taller para cobrar.' };
    }
    const rep = reparacionesActivas[idxRep];
    const riesgoDx = !!rep.diagnosticoRiesgoAlto;
    if (!rep.listoParaCobro) {
        return { ok: false, mensaje: 'Ese caso aun no esta listo para cobro.' };
    }
    if (!rep.resultadoVisible) {
        return { ok: false, mensaje: 'Primero revisa el resultado del mecanico (Ver resultado).'};
    }
    if (rep.cobroProcesado) {
        return { ok: false, mensaje: 'Ese caso ya fue cobrado y retirado.' };
    }

    aplicarBalanceEconomicoReparacion(rep);

    const mec = mecanicos.find(function(m) { return m && m.nombre === rep.mecanicoNombre; }) || null;
    if (rep.nivelResultado === 'parcial') {
        saldo += rep.ganancia;
        if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarIngresoDia === 'function') {
            window.TallerApp.helpers.registrarIngresoDia(rep.ganancia, 'reparaciones');
        } else {
            resumenDia.ingresos += rep.ganancia;
        }
        resumenDia.reparacionesParciales++;
        tramaEstado.casosParciales += 1;
        if (rep.miniHistoriaTipo === 'primerizo') tramaEstado.primerizosGuiados += 1;
        if (typeof registrarResultadoVisitaCliente === 'function') {
            registrarResultadoVisitaCliente(rep, 'completado', { esGarantia: rep.miniHistoriaTipo === 'garantia_falsa' });
        }
        if (riesgoDx) reputacion -= 1;
        rachaExitos = 0;
    } else if (rep.exito) {
        saldo += rep.ganancia;
        if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarIngresoDia === 'function') {
            window.TallerApp.helpers.registrarIngresoDia(rep.ganancia, 'reparaciones');
        } else {
            resumenDia.ingresos += rep.ganancia;
        }
        resumenDia.reparacionesExitosas++;
        tramaEstado.casosCriticosResueltos += 1;
        if (rep.miniHistoriaTipo === 'trabajo_urgente') tramaEstado.urgenciasResueltas += 1;
        if (rep.miniHistoriaTipo === 'frecuente') tramaEstado.clientesFrecuentesGanados += 1;
        if (typeof registrarResultadoVisitaCliente === 'function') {
            registrarResultadoVisitaCliente(rep, 'completado', { esGarantia: rep.miniHistoriaTipo === 'garantia_falsa' });
        }
        reputacion += 2;
        if (riesgoDx) reputacion -= 1;
        if (mec) mec.enojo = Math.max(0, mec.enojo - 1);
        rachaExitos = Math.min(5, rachaExitos + 1);
    } else {
        const _perdidaFalta = Math.max(0, rep.perdida - saldo);
        if (_perdidaFalta > 0) { deuda = (deuda || 0) + _perdidaFalta; }
        saldo = Math.max(0, saldo - rep.perdida);
        if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarGastoDia === 'function') {
            window.TallerApp.helpers.registrarGastoDia(rep.perdida, 'operaciones');
        } else {
            resumenDia.perdidas += rep.perdida;
        }
        resumenDia.reparacionesFallidas++;
        if (rep.miniHistoriaTipo === 'garantia_falsa') tramaEstado.conflictosGarantia += 1;
        if (typeof registrarResultadoVisitaCliente === 'function') {
            registrarResultadoVisitaCliente(rep, 'fallido', { esGarantia: rep.miniHistoriaTipo === 'garantia_falsa' });
        }
        reputacion -= 3;
        if (mec) mec.enojo = Math.min(8, mec.enojo + 2);
        rachaExitos = 0;
    }

    if (typeof registrarProgresoNivel === 'function') {
        registrarProgresoNivel(Math.max(0, Math.round(rep.ganancia || 0)), rep.nivelResultado || 'parcial');
        if (rep.esTrabajoDueno) {
            registrarProgresoNivel(Math.max(0, Math.round(rep.xpDuenoBonus || 0)), rep.nivelResultado || 'parcial');
        }
    }

    reputacion = Math.max(0, reputacion);

    // Flujo simplificado: sin clientes por telefono.

    var xpGanada = 1;
    if (rep.nivelResultado === 'critico') xpGanada = 3;
    else if (rep.nivelResultado === 'parcial') xpGanada = 2;
    else if (rep.nivelResultado === 'fallo') xpGanada = 1;
    if (typeof registrarExperienciaVehiculo === 'function' && rep.vehiculo) {
        registrarExperienciaVehiculo(rep.vehiculo, xpGanada);
    }

    var casoRetorno = null;
    var ritmoCierre = (typeof registrarRitmoTallerPorCierre === 'function')
        ? registrarRitmoTallerPorCierre(rep)
        : null;

    if (rep.nivelResultado !== 'fallo' && typeof crearClienteRetornoEncadenadoDesdeReparacion === 'function') {
        var chanceRetorno = (rep.nivelResultado === 'critico' ? 0.05 : 0.015)
            + ((ritmoCierre && ritmoCierre.combo) ? (ritmoCierre.combo * 0.015) : 0)
            + (rep.casoCaliente ? 0.03 : 0)
            + (rep.cadenaEspecialidadActiva ? 0.02 : 0)
            + (rep.miniHistoriaTipo === 'trabajo_urgente' ? 0.025 : 0);
        if (Math.random() < Math.min(0.22, chanceRetorno)) {
            casoRetorno = crearClienteRetornoEncadenadoDesdeReparacion(rep);
        }
    }

    if (mec) {
        mec.ocupado = false;
        mec.enfriamientoTurnos = 0;
    }
    rep.cobroProcesado = true;
    clientesHoy += 1;
    if (typeof finalizarCaso === 'function') {
        var resultadoContable = rep.nivelResultado === 'critico'
            ? 'exitoso'
            : (rep.nivelResultado === 'parcial' ? 'parcial' : 'fallido');
        finalizarCaso(resultadoContable, rep.diagnosticoNivel || rep.nivelResultado || '', rep.idCaso || '');
        if (resumenCasos && resumenCasos.totalCasosJugados === 1 &&
            (typeof reservarRecompensa !== 'function' || reservarRecompensa('primer-caso'))) {
            var bonoPrimerCaso = 750;
            saldo += bonoPrimerCaso;
            reputacion = Math.min(100, reputacion + 3);
            if (typeof registrarProgresoNivel === 'function') registrarProgresoNivel(500, 'critico');
            if (typeof pushMensajeTelefono === 'function') {
                pushMensajeTelefono('cronica_barrio', 'cronica_barrio',
                    'Primer caso cerrado. Bono RD$750, reputacion +3 y XP adicional. Ya puedes recibir el siguiente cliente.', {
                        clave: 'primer-caso-recompensa'
                    });
            }
            if (typeof mostrarFeedbackGameplay === 'function') {
                mostrarFeedbackGameplay('PRIMER CASO: +RD$750 | +3 reputacion | XP adicional.', 'ok');
            }
        }
    }
    registrarCasoCerradoMalvavisco();

    const detalle = rep.nivelResultado === 'fallo'
        ? `Caso retirado tras resultado fallido. Impacto final RD$${rep.perdida || 0}.`
        : rep.nivelResultado === 'parcial'
            ? `Cobro parcial confirmado por RD$${rep.ganancia || 0}. ${explicarResultadoParcialReparacion(rep)} Reputación: ${riesgoDx ? '-1 por riesgo de diagnóstico previo.' : 'sin cambio.'}`
            : `Cobro confirmado. Retiro cerrado por RD$${rep.ganancia || 0}. Reputación +2.`;
    actualizarCasoAtendido(rep, rep.nivelResultado === 'fallo' ? 'pendiente_revision' : 'cobrado_retirado', detalle);
    reparacionesActivas.splice(idxRep, 1);

    // Defensive cleanup in case this case was duplicated in queue/pending arrays.
    if (typeof limpiarCasoDeColaYPendientes === 'function') {
        limpiarCasoDeColaYPendientes(rep.idCaso);
    } else {
        var _idCasoCobrado = String(rep.idCaso || '').trim();
        if (_idCasoCobrado) {
            if (Array.isArray(clientesEnEspera)) {
                clientesEnEspera = clientesEnEspera.filter(function(c) {
                    return !(c && c.idCaso === _idCasoCobrado);
                });
            }
            if (Array.isArray(casosPendientesDiagnostico)) {
                casosPendientesDiagnostico = casosPendientesDiagnostico.filter(function(c) {
                    return !(c && c.idCaso === _idCasoCobrado);
                });
            }
        }
    }

    var mensajeRetorno = '';
    if (casoRetorno && Array.isArray(clientesEnEspera) && clientesEnEspera.length < (window.maxColaEspera || 5)) {
        clientesEnEspera.unshift(casoRetorno);
        if (ritmoTaller && typeof ritmoTaller.retornosEncadenados === 'number') {
            ritmoTaller.retornosEncadenados += 1;
        }
        mensajeRetorno = ` Retorno encadenado activo: ${casoRetorno.idCaso || 'CASO-0000'} entro a la cola.`;
        log(`Retorno encadenado: ${casoRetorno.idCaso || 'CASO-0000'} entra a cola tras cerrar ${rep.idCaso || 'CASO-0000'}.`, 'info');
    }

    if (typeof mostrarFeedbackGameplay === 'function') {
        var xpMecTxt = Math.max(0, Math.round(rep.xpMecanicoGanada || 0));
        var xpDelTxt = Math.max(0, Math.round(rep.xpDeliveryGanada || 0));
        var comboTxt = ritmoCierre && ritmoCierre.combo > 0 ? ` | Combo x${ritmoCierre.combo}` : '';
        if (rep.nivelResultado === 'fallo') {
            mostrarFeedbackGameplay(`Caso ${rep.idCaso || 'CASO-0000'} cerrado. Impacto -RD$${Math.round(rep.perdida || 0)} | XP mecanico +${xpMecTxt}${xpDelTxt > 0 ? ` | XP delivery +${xpDelTxt}` : ''}${comboTxt}.`, 'warn');
        } else {
            mostrarFeedbackGameplay(`Caso ${rep.idCaso || 'CASO-0000'} cobrado: +RD$${Math.round(rep.ganancia || 0)} | XP mecanico +${xpMecTxt}${xpDelTxt > 0 ? ` | XP delivery +${xpDelTxt}` : ''}${comboTxt}.${mensajeRetorno}`, 'ok');
        }
    }

    if (typeof actualizarUI === 'function') actualizarUI();
    if (typeof verificarNarrativaPorCasoCompletado === 'function') verificarNarrativaPorCasoCompletado();
    if (typeof autoGuardarPartidaSilenciosa === 'function') {
        autoGuardarPartidaSilenciosa('cobro-reparacion-whatsapp');
    }

    return {
        ok: true,
        mensaje: rep.nivelResultado === 'fallo'
            ? `Cliente retiro ${rep.idCaso} tras fallo. Se registro impacto negativo.${mensajeRetorno}`
            : `Cobro confirmado. ${rep.idCaso} cerrado por RD$${rep.ganancia || 0}.${mensajeRetorno}`
    };
}

// Alias directo: cobro desde panel Taller sin necesidad del telefono.
function procesarCobroReparacionDirecto(idCaso) {
    return procesarCobroReparacionPorWhatsApp(idCaso);
}

function obtenerPasoReparacionPorTick() {
    if (typeof modoNivelesActivo === 'function' && modoNivelesActivo()) {
        return Math.max(1, Math.round(autoTurnoCadaSeg || 1));
    }
    return 1;
}

function calcularTiempoTrabajoReal(cliente, mecanico, modTiempoRasgo, bonusPiezaTiempo, bonusFlujoTiempo, factorResultado) {
    var dificultad = Math.max(0, Math.min(1, (cliente && cliente.dificultad) || 0.55));
    var baseSeg = 72
        + Math.round(((cliente && cliente.tiempo) || 3) * 22)
        + Math.round((Array.isArray(cliente && cliente.complicaciones) ? cliente.complicaciones.length : 0) * 28)
        + Math.round(dificultad * 88)
        + ((cliente && cliente.esVIP) ? 18 : 0);
    baseSeg = escalarTiempoBaseOperacion(baseSeg, 'reparacion');

    var skill = Math.max(0.35, Math.min(1.2, (mecanico && mecanico.habilidad) || 0.6));
    baseSeg += Math.round((1 - Math.min(1, skill)) * 38);
    if (cliente && mecanico && cliente.especialidadIdeal === mecanico.especialidad) baseSeg -= 12;
    baseSeg += Math.max(0, Math.round(((mecanico && mecanico.enojo) || 0) * 4));
    // Velocidad reduce tiempo: a mas velocidad, menos segundos
    var velEfectiva = (typeof calcularVelocidadEfectiva === 'function') ? calcularVelocidadEfectiva(mecanico) : 0.5;
    baseSeg = Math.round(baseSeg * (1 - (velEfectiva - 0.5) * 0.35));
    baseSeg += Math.max(0, Math.round((modTiempoRasgo || 0) * 10));
    baseSeg -= Math.max(0, Math.round((bonusPiezaTiempo || 0) * 6));
    baseSeg -= Math.max(0, Math.round((bonusFlujoTiempo || 0) * 4));

    var factor = Number.isFinite(factorResultado) ? factorResultado : 1;
    var finalSeg = Math.round(baseSeg * factor);
    return Math.max(60, Math.min(520, finalSeg));
}
