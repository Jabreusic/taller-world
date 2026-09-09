function verificarDesbloqueoArcoNarrativo() {
    var arcos = (window.TallerData && window.TallerData.arcoNarrativo) || [];
        var total = (tramaEstado && tramaEstado.casosCriticosResueltos || 0) + (tramaEstado && tramaEstado.casosParciales || 0);
    var arcoActivo = null;
    for (var i = arcos.length - 1; i >= 0; i--) {
        var a = arcos[i];
        if (total >= (a.casosMin || 0) && (!a.nivelMin || tallerNivel >= a.nivelMin)) {
            arcoActivo = a;
            break;
        }
    }
    if (!arcoActivo) return false;

    var yaNotificado = (arcosCumplidos || []).indexOf(arcoActivo.id) !== -1;
    if (arcoNarrativoActual === arcoActivo.id && yaNotificado) return false;

    if (arcoNarrativoActual !== arcoActivo.id) {
        eventosTurnoHoy = [];
    }
    arcoNarrativoActual = arcoActivo.id;
    if (!yaNotificado) {
        arcosCumplidos = (arcosCumplidos || []).concat([arcoActivo.id]);
        if (typeof mostrarNotificacionCapitulo === 'function') {
            mostrarNotificacionCapitulo({
                tipo: 'arco_narrativo',
                id: arcoActivo.id,
                titulo: arcoActivo.titulo,
                texto: arcoActivo.descripcion,
                meta: 'Capítulo desbloqueado · ' + (typeof dia === 'number' ? 'Día ' + dia : 'Nueva etapa')
            });
        }
        log('Nuevo capitulo desbloqueado: ' + arcoActivo.titulo, 'exito');
        return true;
    }
    return false;
}

function verificarHitosNarrativos(maxActivaciones) {
    var hitos = (window.TallerData && window.TallerData.hitosNarrativos) || [];
    if (!hitos.length) return 0;
    if (!tramaEstado.hitosNarrativosActivados) tramaEstado.hitosNarrativosActivados = [];
    var activados = tramaEstado.hitosNarrativosActivados;
        var total = (tramaEstado && tramaEstado.casosCriticosResueltos || 0) + (tramaEstado && tramaEstado.casosParciales || 0);
    var limite = Number.isFinite(maxActivaciones) ? Math.max(1, Math.round(maxActivaciones)) : Number.MAX_SAFE_INTEGER;
    var activaciones = 0;
    for (var i = 0; i < hitos.length; i++) {
        var h = hitos[i];
        if (activados.indexOf(h.id) !== -1) continue;
        if (total < (h.casosMin || 0)) continue;
        activados.push(h.id);
        try { h.resolver(); } catch(e) { /* silencio */ }
        if (typeof mostrarNotificacionCapitulo === 'function') {
            mostrarNotificacionCapitulo({
                tipo: 'hito_narrativo',
                id: h.id,
                titulo: 'Nuevo hito de la crónica',
                texto: h.texto,
                meta: 'Entrada del diario · Caso ' + total
            });
        }
        log('[Narrativa] ' + h.texto, 'info');
        activaciones += 1;
        if (activaciones >= limite) break;
    }
    if (verificarDesbloqueoArcoNarrativo()) activaciones += 1;
    return activaciones;
}

function evaluarArcoStewartPorCasos() {
    // La antigua tirada aleatoria fue sustituida por el arco jugable de ruptura.
    return false;
    /*
    if (!(typeof modoNivelesActivo === 'function' && modoNivelesActivo())) return false;
    if (String(stewartStatus || 'ninguno') !== 'contratado') return false;
    if (!tramaEstado || typeof tramaEstado !== 'object') return false;

    var total = (tramaEstado.casosCriticosResueltos || 0) + (tramaEstado.casosParciales || 0);
    var cadenciaCasos = 4;
    var ultimoEvaluado = Math.max(0, Math.round(tramaEstado.stewartCasosEvaluados || 0));
    if (total < cadenciaCasos || (total - ultimoEvaluado) < cadenciaCasos) return false;

    tramaEstado.stewartCasosEvaluados = total;
    var rep = Math.max(0, Math.round(reputacion || 0));
    var chanceTraicion = 0.18;
    var chanceApoyo = 0.12;

    if (rep <= 42) {
        chanceTraicion = 0.45;
        chanceApoyo = 0.06;
    } else if (rep < 60) {
        chanceTraicion = 0.28;
        chanceApoyo = 0.11;
    } else if (rep < 75) {
        chanceTraicion = 0.16;
        chanceApoyo = 0.18;
    } else {
        chanceTraicion = 0.08;
        chanceApoyo = 0.24;
    }

    var roll = Math.random();
    if (roll < chanceTraicion) {
        var robo = 1000;
        var falta = Math.max(0, robo - Math.max(0, saldo || 0));
        if (falta > 0) deuda = (deuda || 0) + falta;
        saldo = Math.max(0, (saldo || 0) - robo);
        stewartStatus = 'traidor';
        tramaEstado.stewartEventosRiesgo = Math.max(0, Math.round(tramaEstado.stewartEventosRiesgo || 0)) + 1;

        if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarGastoDia === 'function') {
            window.TallerApp.helpers.registrarGastoDia(robo, 'eventos');
        }
        if (typeof pushMensajeTelefono === 'function') {
            pushMensajeTelefono(
                'cronica_barrio',
                'cronica_barrio',
                'Alerta interna: Stewart desaparecio con RD$1000 despues del caso ' + total + '. La confianza del equipo quedo rota.',
                {
                    clave: 'stewart-traicion-caso-' + total,
                    bloqueante: true,
                    autorNombre: 'Stewart',
                    metaNarrativa: {
                        tipo: 'evento_turno',
                        eventoId: 'stewart_traicion',
                        fase: 'resuelto',
                        dia: (typeof dia === 'number' ? dia : 1),
                        participantes: ['Stewart', 'Cronica Del Barrio']
                    }
                }
            );
        }
        log('Stewart traiciono al taller por baja confianza. -RD$1000 y posible deuda adicional.', 'error');
        return true;
    }

    if (roll < (chanceTraicion + chanceApoyo)) {
        var bono = 800;
        saldo += bono;
        tramaEstado.stewartEventosFavor = Math.max(0, Math.round(tramaEstado.stewartEventosFavor || 0)) + 1;

        if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarIngresoDia === 'function') {
            window.TallerApp.helpers.registrarIngresoDia(bono, 'eventos');
        }

        var texto = 'Stewart cerro horas extra tras el caso ' + total + ' y dejo RD$800 para caja.';
        if (rep >= 82 && (tramaEstado.stewartEventosFavor || 0) >= 2) {
            stewartStatus = 'aliado';
            texto += ' Lealtad consolidada: ya no opera en zona de traicion.';
        }
        if (typeof pushMensajeTelefono === 'function') {
            pushMensajeTelefono(
                'cronica_barrio',
                'cronica_barrio',
                texto,
                {
                    clave: 'stewart-apoyo-caso-' + total,
                    bloqueante: true,
                    autorNombre: 'Stewart',
                    metaNarrativa: {
                        tipo: 'evento_turno',
                        eventoId: 'stewart_apoyo',
                        fase: 'resuelto',
                        dia: (typeof dia === 'number' ? dia : 1),
                        participantes: ['Stewart', 'Cronica Del Barrio']
                    }
                }
            );
        }
        log('Stewart respondio bien al clima del taller: +RD$800.', 'exito');
        return true;
    }
    return false;
    */
}

function asegurarTrilogiaNarrativa() {
    if (!tramaEstado || typeof tramaEstado !== 'object') tramaEstado = {};
    if (!tramaEstado.trilogia || typeof tramaEstado.trilogia !== 'object') tramaEstado.trilogia = {};
    var t = tramaEstado.trilogia;
    if (!t.rival || typeof t.rival !== 'object') t.rival = { activo: false, resuelto: false, victorias: 0, amenaza: 0 };
    if (!t.stewart || typeof t.stewart !== 'object') t.stewart = { fase: 'latente', resuelto: false, recuperaciones: 0, mejorasComprometidas: 0, clientesPerdidos: 0, proteccion: '' };
    return t;
}

function notificarTrilogia(titulo, texto, clave) {
    if (typeof pushMensajeTelefono === 'function') pushMensajeTelefono('cronica_barrio', 'cronica_barrio', texto, { clave: clave, autorNombre: 'Crónica del Barrio', bloqueante: true });
    if (typeof mostrarNotificacionCapitulo === 'function') mostrarNotificacionCapitulo({ tipo: 'arco_narrativo', id: clave, titulo: titulo, texto: texto, meta: 'Misión activa' });
    log('[Arco] ' + texto, 'info');
}

function ajustarPulsoAutoFixEnMapa(deltaReputacion, deltaPresion) {
    if (typeof asegurarCompetenciaBarrioEstado !== 'function') return;
    var estado = asegurarCompetenciaBarrioEstado();
    if (!estado || !estado.rivales) return;
    var rival = estado.rivales.autofix || {};
    rival.repExtra = Math.max(-20, Math.min(45, Number(rival.repExtra || 0) + Number(deltaReputacion || 0)));
    rival.presion = Math.max(0, Math.min(30, Number(rival.presion || 0) + Number(deltaPresion || 0)));
    rival.forma = Math.max(-4.5, Math.min(6.5, Number(rival.forma || 0) + (Number(deltaReputacion || 0) * 0.12)));
    estado.rivales.autofix = rival;
}

function robarClientesEnEsperaPorStewart(t, maximo) {
    if (!Array.isArray(clientesEnEspera)) return [];
    var intentos = 0;
    var objetivo = Math.max(0, Math.min(2, Math.round(maximo || 2)));
    while (clientesEnEspera.length < objetivo && intentos < objetivo && typeof generarClienteEnCola === 'function') {
        if (!generarClienteEnCola()) break;
        intentos += 1;
    }
    var robados = clientesEnEspera.splice(0, Math.min(objetivo, clientesEnEspera.length));
    t.stewart.clientesRobados = robados.map(function(caso) {
        return { idCaso: caso && caso.idCaso || null, nombre: caso && (caso.nombre || caso.nombreCliente) || 'Cliente sin identificar' };
    });
    t.stewart.clientesPerdidos = t.stewart.clientesRobados.length;
    return t.stewart.clientesRobados;
}

function registrarPruebaExDesdeCaso(rep) {
    if (!tramaEstado || tramaEstado.exArcoResuelto || !rep || rep.nivelResultado !== 'critico') return false;
    if (!Array.isArray(tramaEstado.exPruebasDetalle)) tramaEstado.exPruebasDetalle = [];
    if (tramaEstado.exPruebasDetalle.length >= 3) return false;
    tramaEstado.exPruebasDetalle.push({ id: 'expediente-caso-' + String(rep.idCaso || Date.now()), origen: 'Cierre crítico de expediente', caso: rep.idCaso || null, detalle: 'Orden de trabajo, fotos y firma del cliente.' });
    tramaEstado.exPruebas = tramaEstado.exPruebasDetalle.length;
    if (typeof mostrarFeedbackGameplay === 'function') mostrarFeedbackGameplay('Prueba archivada: cierre crítico documentado para el caso Valeria.', 'ok');
    return true;
}

function obtenerMisionTrilogiaActual() {
    var t = asegurarTrilogiaNarrativa();
    var total = Math.max(0, Math.round((tramaEstado.casosCriticosResueltos || 0) + (tramaEstado.casosParciales || 0)));
    if (total < 8 && !tramaEstado.exArcoResuelto) return { titulo: 'Valeria: el expediente', objetivo: 'Rebate reclamos con pruebas documentadas.', progreso: Math.max(0, Math.round(tramaEstado.exReclamosRefutados || 0)), meta: 3, detalle: Math.max(0, Math.round(tramaEstado.exPruebas || 0)) + ' prueba(s) disponible(s)' };
    if (total < 16 && t.rival.activo && !t.rival.resuelto) return { titulo: 'AutoFix Express', objetivo: 'Gana cierres críticos para recuperar el barrio.', progreso: t.rival.victorias, meta: 3, detalle: 'Amenaza rival: ' + t.rival.amenaza };
    if (t.stewart.fase === 'alerta') return { titulo: 'Stewart: confianza en riesgo', objetivo: 'Prepara al equipo antes de la ruptura.', progreso: 0, meta: 2, detalle: 'La crisis se activa en el caso 18.' };
    if (t.stewart.fase === 'ruptura' && !t.stewart.resuelto) return { titulo: 'Stewart: recuperar el taller', objetivo: 'Completa cierres críticos para recalibrar las mejoras.', progreso: t.stewart.recuperaciones, meta: 3, detalle: t.stewart.clientesPerdidos + ' cliente(s) perdido(s)' };
    if (!tramaEstado.exArcoResuelto) return { titulo: 'Valeria: el expediente', objetivo: 'Rebate reclamos con pruebas documentadas.', progreso: Math.max(0, Math.round(tramaEstado.exReclamosRefutados || 0)), meta: 3, detalle: Math.max(0, Math.round(tramaEstado.exPruebas || 0)) + ' prueba(s) disponible(s)' };
    return null;
}

function procesarArcosTrilogiaPorCaso(casosTotales) {
    var t = asegurarTrilogiaNarrativa();
    var total = Math.max(0, Math.round(casosTotales || 0));
    if (total >= 8 && !t.rival.activo && !t.rival.resuelto) {
        t.rival.activo = true;
        t.rival.amenaza = 2;
        ajustarPulsoAutoFixEnMapa(8, 5);
        if (typeof upsertContactoTelefono === 'function') upsertContactoTelefono({ id: 'autofix', nombre: 'AutoFix Express', avatar: '⚡', tipo: 'personal' });
        if (typeof pushMensajeTelefono === 'function') pushMensajeTelefono('autofix', 'autofix', 'Abrimos con agenda rápida y precios de lanzamiento. Nos vemos en la calle.', { clave: 'autofix-apertura-chat', autorNombre: 'AutoFix Express' });
        notificarTrilogia('AutoFix Express abre', 'El avatar de AutoFix Express lanza precios agresivos. Gana 3 cierres críticos para recuperar la conversación del barrio.', 'arco-rival-inicio');
    }
    var contratado = String(stewartStatus || '') === 'contratado' || String(stewartStatus || '') === 'aliado';
    if (total >= 16 && contratado && t.stewart.fase === 'latente') {
        t.stewart.fase = 'alerta';
        if (typeof pushMensajeTelefono === 'function') pushMensajeTelefono('mec_Stewart', 'mec_Stewart', 'Jefe, quiero hablar de mi futuro y de los clientes que manejo. No me gusta sentir que todo esto depende de promesas.', { clave: 'stewart-alerta-chat', autorNombre: 'Stewart' });
        notificarTrilogia('Stewart conoce demasiado', 'Stewart ya conoce clientes, rutinas y mejoras. Dos casos más decidirán si el taller conserva esa confianza.', 'arco-stewart-alerta');
    }
    if (total >= 18 && (t.stewart.fase === 'alerta' || t.stewart.fase === 'alerta_contenida')) {
        t.stewart.fase = 'ruptura';
        var protegida = t.stewart.proteccion === 'contrato' || t.stewart.proteccion === 'auditoria';
        t.stewart.mejorasComprometidas = protegida ? 1 : 2;
        var clientesRobados = robarClientesEnEsperaPorStewart(t, protegida ? 1 : 2);
        stewartStatus = 'traidor';
        reputacion = Math.max(0, Math.round(reputacion || 0) - 5);
        (mecanicos || []).forEach(function(m) { if (m) m.enojo = Math.min(8, Math.round(m.enojo || 0) + 1); });
        notificarTrilogia('Ruptura: Stewart se fue', 'Stewart se llevó ' + clientesRobados.length + ' cliente(s) de tu cola y conoce los puntos débiles de tus mejoras. Recupera 3 cierres críticos para recalibrar el taller.', 'arco-stewart-ruptura');
    }
    return t;
}

function registrarResultadoArcosTrilogia(rep) {
    if (!rep || rep.esTrabajoDueno) return;
    var total = Math.max(0, Math.round((tramaEstado && tramaEstado.casosCriticosResueltos || 0) + (tramaEstado && tramaEstado.casosParciales || 0)));
    var t = procesarArcosTrilogiaPorCaso(total);
    if (t.rival.activo && !t.rival.resuelto) {
        if (rep.nivelResultado === 'critico') { t.rival.victorias += 1; t.rival.amenaza = Math.max(0, t.rival.amenaza - 1); ajustarPulsoAutoFixEnMapa(-3, -2); }
        else if (rep.nivelResultado === 'fallo') { t.rival.amenaza += 2; reputacion = Math.max(0, Math.round(reputacion || 0) - 1); ajustarPulsoAutoFixEnMapa(4, 3); }
        if (t.rival.victorias >= 3) {
            t.rival.resuelto = true; t.rival.activo = false; reputacion = Math.min(100, Math.round(reputacion || 0) + 4); ajustarPulsoAutoFixEnMapa(-9, -8);
            notificarTrilogia('AutoFix retrocede', 'Tres cierres críticos dejaron al rival sin discurso. El barrio vuelve a recomendarte: reputación +4.', 'arco-rival-resuelto');
        }
    }
    registrarPruebaExDesdeCaso(rep);
    if (t.stewart.fase === 'ruptura' && !t.stewart.resuelto && rep.nivelResultado === 'critico') {
        t.stewart.recuperaciones += 1;
        if (t.stewart.recuperaciones >= 3) {
            t.stewart.resuelto = true; t.stewart.mejorasComprometidas = 0; reputacion = Math.min(100, Math.round(reputacion || 0) + 5);
            notificarTrilogia('El taller se recompone', 'Recuperaste tres cierres críticos. Las mejoras quedan recalibradas y el barrio entiende que Stewart no era el taller: reputación +5.', 'arco-stewart-resuelto');
        }
    }
}

function verificarNarrativaPorCasoCompletado() {
    var casosTotales = Math.max(0, Math.round((tramaEstado && tramaEstado.casosCriticosResueltos || 0) + (tramaEstado && tramaEstado.casosParciales || 0)));
    if (typeof narrativaUltimoCasoProcesado !== 'number') narrativaUltimoCasoProcesado = 0;
    if (casosTotales <= narrativaUltimoCasoProcesado) return;
    narrativaUltimoCasoProcesado = casosTotales;

    // El modo actual no tiene cierre de día: los hitos que antes dependían
    // de cerrar jornada deben avanzar por casos completados. Seis casos
    // equivalen aproximadamente a una jornada narrativa para conservar la
    // progresión económica y dar tiempo a recuperarse entre eventos.
    if (typeof estaModoSinCierreDia === 'function' && estaModoSinCierreDia() && typeof aplicarImpactoHistoriaEconomicaDia === 'function') {
        var diaReal = dia;
        var diaPorCasos = Math.min(typeof DIAS_TOTALES === 'number' ? DIAS_TOTALES : 14, Math.max(1, Math.ceil(casosTotales / 6)));
        if (impactoHistoriaDiaAplicado !== diaPorCasos) {
            dia = diaPorCasos;
            aplicarImpactoHistoriaEconomicaDia();
            dia = diaReal;
        }
    }

    var cadenciaGlobal = 4;
    var hitoGlobal = Math.floor(casosTotales / cadenciaGlobal) * cadenciaGlobal;

    evaluarMoraBancoPorFlujo();
    procesarArcosTrilogiaPorCaso(casosTotales);
    procesarCadenciaCajaBPorCasos(casosTotales, false);
    procesarPresionInspectorCajaB(casosTotales);
    if (typeof dispararEventoBancoPorCasos === 'function') {
        dispararEventoBancoPorCasos(casosTotales);
    }

    var disparoHitoEnEsteCaso = false;

    if (hitoGlobal >= cadenciaGlobal) {
        if (typeof disparadoresCasoUltimoHito !== 'number') disparadoresCasoUltimoHito = 0;
        if (hitoGlobal > disparadoresCasoUltimoHito) {
            disparadoresCasoUltimoHito = hitoGlobal;
            disparoHitoEnEsteCaso = true;

            // Evitar doble disparo en cascada: si ya hubo paquete por hito,
            // empuja el cooldown del evento narrativo general al caso actual.
            if (tramaEstado && typeof tramaEstado === 'object') {
                var ultimoNarrativoCaso = Math.max(0, Math.round(tramaEstado.eventoNarrativoUltimoCaso || 0));
                if (hitoGlobal > ultimoNarrativoCaso) {
                    tramaEstado.eventoNarrativoUltimoCaso = hitoGlobal;
                }
            }

            // Anti-saturacion: un solo paquete narrativo por hito de casos.
            var paqueteDisparado = false;

            var activacionesNarrativas = verificarHitosNarrativos(1);
            if (activacionesNarrativas > 0) paqueteDisparado = true;

            if (!paqueteDisparado && evaluarArcoStewartPorCasos()) {
                paqueteDisparado = true;
            }

            if (!paqueteDisparado && typeof dispararEventoExPorCasos === 'function') {
                paqueteDisparado = !!dispararEventoExPorCasos(hitoGlobal);
            }

            if (!paqueteDisparado && typeof lanzarMensajesAutonomosMecanicos === 'function') {
                paqueteDisparado = !!lanzarMensajesAutonomosMecanicos(hitoGlobal);
            }

            if (!paqueteDisparado) {
                var resumenCobranza = (typeof procesarDevolucionDeudasMecanicosPorCasos === 'function')
                    ? procesarDevolucionDeudasMecanicosPorCasos(hitoGlobal)
                    : '';
                if (resumenCobranza) {
                    log('Cobranzas internas: ' + resumenCobranza, 'info');
                }
            }
        }
    }

    // Solicitudes de mecanicos tambien en modo por casos, pero sin montarse con el hito global.
    if (!disparoHitoEnEsteCaso && typeof lanzarSolicitudMecanico === 'function') {
        lanzarSolicitudMecanico();
    }
}

function agregarClasePantallaSiExiste(id, clase) {
    var el = typeof document !== 'undefined' ? document.getElementById(id) : null;
    if (el && el.classList) el.classList.add(clase);
    return el;
}

function quitarClasePantallaSiExiste(id, clase) {
    var el = typeof document !== 'undefined' ? document.getElementById(id) : null;
    if (el && el.classList) el.classList.remove(clase);
    return el;
}

function actualizarTextoPantallaSiExiste(id, valor) {
    var el = typeof document !== 'undefined' ? document.getElementById(id) : null;
    if (el) el.innerText = valor;
    return el;
}

function actualizarHtmlPantallaSiExiste(id, valor) {
    var el = typeof document !== 'undefined' ? document.getElementById(id) : null;
    if (el) el.innerHTML = valor;
    return el;
}

function empezarJornada() {
    agregarClasePantallaSiExiste('pantalla-historia', 'hidden');
    quitarClasePantallaSiExiste('pantalla-taller', 'hidden');
    agregarClasePantallaSiExiste('game', 'modo-taller-fijo');
    if (typeof navegarPantalla === 'function') navegarPantalla('taller');
    // Lógica dinámica: todo depende de casos/niveles/requisitos
        verificarNarrativaPorCasoCompletado(); // Comprobación de narrativa
        verificarDesbloqueoArcoNarrativo(); // Comprobación de desbloqueo de arco narrativo
    if (typeof generarClienteEnCola === 'function') {
        generarClienteEnCola();
    }
    actualizarUI && actualizarUI();
    if (typeof iniciarTimer === 'function') iniciarTimer();
}

function normalizarTextoHistoriaPrincipal(texto) {
    return String(texto || '')
        .replace(/\s+/g, ' ')
        .trim();
}

function escaparHtmlHistoriaPrincipal(texto) {
    return String(texto || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function obtenerHistoriaPrincipalSnapshot() {
    var data = window.TallerData || {};
    var casos = typeof obtenerCasosCompletadosNarrativa === 'function'
        ? Math.max(0, Math.round(obtenerCasosCompletadosNarrativa() || 0))
        : 0;
    var progresoMap = data && typeof data.historiasProgreso === 'object'
        ? data.historiasProgreso
        : {};
    var hitos = Object.keys(progresoMap)
        .map(function(key) { return parseInt(key, 10); })
        .filter(function(valor) { return Number.isFinite(valor); })
        .sort(function(a, b) { return a - b; });
    var umbralActivo = hitos.length ? hitos[0] : 0;

    hitos.forEach(function(hito) {
        if (casos >= hito) umbralActivo = hito;
    });

    var progresoTexto = normalizarTextoHistoriaPrincipal(progresoMap[umbralActivo]);
    var historiaBase = Array.isArray(data.historiaPrincipal)
        ? data.historiaPrincipal
        : [];
    var indiceBase = typeof historiaPrincipalIndice === 'number'
        ? Math.max(0, Math.round(historiaPrincipalIndice || 0))
        : 0;
    var frenteTexto = historiaBase.length
        ? normalizarTextoHistoriaPrincipal(historiaBase[indiceBase % historiaBase.length])
        : '';
    var arcos = Array.isArray(data.arcoNarrativo) ? data.arcoNarrativo : [];
    var arcoObj = arcos.find(function(a) {
        return a && a.id === arcoNarrativoActual;
    }) || null;
    var titulo = normalizarTextoHistoriaPrincipal(
        (arcoObj && arcoObj.titulo) || 'Historia principal'
    );
    var introArco = normalizarTextoHistoriaPrincipal(
        (arcoObj && arcoObj.textoInicio) || ''
    );
    if (arcoObj && typeof obtenerVarianteCapitulo === 'function') {
        introArco = normalizarTextoHistoriaPrincipal(introArco + ' ' + obtenerVarianteCapitulo(arcoObj));
    }
    var trama = typeof obtenerTramaDinamicaDia === 'function'
        ? normalizarTextoHistoriaPrincipal(obtenerTramaDinamicaDia())
        : '';
    var meta = [];

    meta.push('Casos cerrados: ' + casos);
    if (hitos.length) {
        var siguienteHito = hitos.find(function(hito) {
            return hito > casos;
        });
        meta.push(
            siguienteHito
                ? 'Siguiente hito: ' + siguienteHito
                : 'Arco en tramo final'
        );
    }

    var objetivo = siguienteHito
        ? 'Cierra ' + Math.max(1, siguienteHito - casos) + ' caso' + (siguienteHito - casos === 1 ? '' : 's') + ' para alcanzar el siguiente hito.'
        : 'Consolida caja, reputacion y equipo antes del veredicto.';
    var riesgos = [];
    if (typeof saldo === 'number' && saldo < 500) riesgos.push('caja critica');
    if (typeof deuda === 'number' && deuda > 50000) riesgos.push('deuda alta');
    if (typeof reputacion === 'number' && reputacion < 35) riesgos.push('reputacion fragil');
    if (typeof moralEquipo === 'number' && moralEquipo < 40) riesgos.push('equipo tenso');
    var riesgo = riesgos.length
        ? 'Riesgo actual: ' + riesgos.slice(0, 2).join(' y ') + '.'
        : 'Riesgo actual: estable; evita errores y gastos innecesarios.';

    meta.push('Objetivo: ' + objetivo);
    meta.push(riesgo);

    return {
        titulo: titulo,
        progresoTexto: progresoTexto || 'El taller sigue en pie. Cada caso empuja el juicio en una direccion distinta.',
        frenteTexto: frenteTexto,
        introArco: introArco,
        trama: trama,
        objetivo: objetivo,
        riesgo: riesgo,
        misionNarrativa: typeof obtenerMisionTrilogiaActual === 'function'
            ? obtenerMisionTrilogiaActual()
            : (typeof obtenerMisionNarrativaActual === 'function' ? obtenerMisionNarrativaActual() : null),
        casos: casos,
        meta: meta,
        etiqueta: arcoObj ? 'Arco activo' : 'Panorama actual'
    };
}

if (typeof window !== 'undefined') {
    window.obtenerHistoriaPrincipalSnapshot = obtenerHistoriaPrincipalSnapshot;
}

function mostrarHistoriaPrincipalModal() {
    const titulo = document.getElementById('historia-dia-titulo');
    const meta = document.getElementById('historia-dia-meta');
    const texto = document.getElementById('historia-dia-texto');
    if (!titulo || !texto) return;

    const snapshot = obtenerHistoriaPrincipalSnapshot();
    const bloques = [
        snapshot.progresoTexto,
        snapshot.introArco,
        snapshot.frenteTexto,
        snapshot.trama,
    ].filter(function(parrafo, idx, arr) {
        return !!parrafo && arr.indexOf(parrafo) === idx;
    });

    titulo.innerText = snapshot.titulo;
    if (meta) {
        meta.innerText = snapshot.meta.join(' | ');
    }
    var mision = snapshot.misionNarrativa;
    var expediente = tramaEstado && Array.isArray(tramaEstado.exPruebasDetalle)
        ? tramaEstado.exPruebasDetalle
        : [];
    var panelMision = mision
        ? '<section class="historia-mision-panel"><strong>MISIÓN · ' + escaparHtmlHistoriaPrincipal(mision.titulo) + '</strong><p>' + escaparHtmlHistoriaPrincipal(mision.objetivo) + ' (' + mision.progreso + '/' + mision.meta + ')</p><small>' + escaparHtmlHistoriaPrincipal(mision.detalle || '') + '</small></section>'
        : '';
    var panelExpediente = expediente.length
        ? '<section class="historia-expediente"><strong>EXPEDIENTE VALERIA</strong><ul>' + expediente.map(function(prueba) { return '<li>' + escaparHtmlHistoriaPrincipal((prueba.origen || 'Documento') + (prueba.caso ? ' · ' + prueba.caso : '')) + '</li>'; }).join('') + '</ul></section>'
        : '';
    texto.innerHTML = panelMision + panelExpediente + bloques
        .map(function(parrafo) {
            return '<p>' + escaparHtmlHistoriaPrincipal(parrafo) + '</p>';
        })
        .join('');
    if (typeof abrirModal === 'function') abrirModal('historia-dia');
}

function obtenerCasosCompletadosNarrativa() {
    return Math.max(0, Math.round((resumenCasos && resumenCasos.totalCasosJugados) || 0));
}

function calcularLimiteCreditoBanco() {
    var cfg = (window.TallerApp && window.TallerApp.config) || {};
    var cfgMin = Math.round(cfg.bancoLimiteCreditoMin || 6000);
    var cfgMax = Math.round(cfg.bancoLimiteCreditoMax || 6000);
    var min = Math.max(1000, Math.min(cfgMin, cfgMax));
    var max = Math.max(min, cfgMax);
    var base = Math.max(min, Math.round(cfg.bancoLimiteCreditoBase || max));
    var rep = Math.max(0, Math.round(reputacion || 0));
    var nivel = Math.max(1, Math.round(tallerNivel || 1));
    var deudaActual = Math.max(0, Math.round(deuda || 0));
    // Una deuda totalmente saldada debe devolver al taller su linea plena;
    // no se puede seguir penalizando el credito por el saldo historico.
    if (deudaActual <= 0) return max;
    var ajusteRep = Math.round((rep - 50) * 35);
    var ajusteNivel = (nivel - 1) * 120;
    var ajusteRiesgo = -Math.min(1800, Math.round(deudaActual * 0.015));
    return Math.max(min, Math.min(max, base + ajusteRep + ajusteNivel + ajusteRiesgo));
}

function obtenerCreditoDisponibleBanco() {
    var limite = calcularLimiteCreditoBanco();
    var usado = Math.max(0, Math.round(bancoCreditoUsado || 0));
    return Math.max(0, limite - usado);
}

function registrarPagoBanco(montoPagado) {
    var pagado = Math.max(0, Math.round(montoPagado || 0));
    if (pagado <= 0) return;
    bancoCasosSinPago = 0;
    if (Math.max(0, Math.round(deuda || 0)) <= 0) {
        bancoMorasAplicadas = 0;
        bancoCasosSinPago = 0;
    }
    bancoCreditoUsado = Math.max(0, Math.round((bancoCreditoUsado || 0) - pagado));
}

function evaluarMoraBancoPorFlujo() {
    // La presion bancaria pertenece al flujo por casos actual, no al antiguo
    // cierre diario ni exclusivamente al modo de niveles.
    var modoActualValido = (typeof estaModoSinCierreDia === 'function' && estaModoSinCierreDia()) ||
        (typeof modoNivelesActivo === 'function' && modoNivelesActivo());
    if (!modoActualValido) return;
    if (Math.max(0, Math.round(deuda || 0)) <= 0) {
        bancoCasosSinPago = 0;
        return;
    }
    bancoCasosSinPago = Math.max(0, Math.round(bancoCasosSinPago || 0)) + 1;

    var cfg = (window.TallerApp && window.TallerApp.config) || {};
    var umbral = Math.max(2, Math.round(cfg.bancoMoraCasosUmbral || 4));
    if (bancoCasosSinPago < umbral) return;

    bancoCasosSinPago = 0;
    bancoMorasAplicadas = Math.max(0, Math.round(bancoMorasAplicadas || 0)) + 1;

    var deudaActual = Math.max(0, Math.round(deuda || 0));
    var tasaBase = Math.max(0.004, Number(cfg.bancoTasaMoraFlujo || 0.012));
    var tasa = Math.min(0.03, tasaBase + (bancoMorasAplicadas * 0.001));
    var moraMin = Math.max(150, Math.round(cfg.bancoMoraMinimaFlujo || 450));
    var mora = Math.max(moraMin, Math.round(deudaActual * tasa));
    deuda += mora;
    reputacion = Math.max(0, (reputacion || 0) - 1);
    estres = Math.min(100, (estres || 0) + 3);
    if ((bancoMorasAplicadas % 2) === 0) {
        (mecanicos || []).forEach(function(m) {
            m.enojo = Math.min(8, (m.enojo || 0) + 1);
        });
    }
    log('Mora bancaria por retraso acumulado: +RD$' + mora + '. Reputacion -1.', 'error');
    if (deuda > 0 && typeof mostrarFeedbackGameplay === 'function') {
        mostrarFeedbackGameplay('El banco exige pago: llevas varios casos sin amortizar. La mora aumenta tu deuda y reduce tu reputación.', 'warn');
    }
    if (typeof pushMensajeTelefono === 'function') {
        pushMensajeTelefono(
            'banco',
            'banco',
            'Aviso de mora: se aplico recargo de RD$' + mora + ' por atrasos acumulados en el flujo operativo.',
            { clave: 'mora-flujo-' + bancoMorasAplicadas }
        );
    }
}

function obtenerTasaCuotaBancoDia(diaActual) {
    if (typeof modoNivelesActivo === 'function' && modoNivelesActivo()) {
        var casos = obtenerCasosCompletadosNarrativa();
        return Math.min(0.038, 0.02 + (casos * 0.00055));
    }
    var d = Math.max(1, Math.round(diaActual || 1));
    if (d <= 5) {
        return 0.014 + (d * 0.0016);
    }
    return Math.min(0.03, 0.022 + ((d - 5) * 0.0012));
}

function obtenerMinimoCuotaBancoDia(diaActual) {
    if (typeof modoNivelesActivo === 'function' && modoNivelesActivo()) {
        var casos = obtenerCasosCompletadosNarrativa();
        return Math.min(2200, 900 + (casos * 35));
    }
    var d = Math.max(1, Math.round(diaActual || 1));
    if (d <= 5) {
        return 350 + (d * 70);
    }
    return Math.min(1300, 700 + ((d - 5) * 45));
}

function calcularCuotaBancoCierre(deudaActual, diaActual) {
    var deudaSegura = Math.max(0, Math.round(deudaActual || 0));
    if (deudaSegura <= 0) return 0;
    var tasa = obtenerTasaCuotaBancoDia(diaActual);
    var minimo = obtenerMinimoCuotaBancoDia(diaActual);
    return Math.max(minimo, Math.round(deudaSegura * tasa));
}

function calcularMoraBancoPendiente(deudaActual, diaActual) {
    var deudaSegura = Math.max(0, Math.round(deudaActual || 0));
    if (deudaSegura <= 0) return 0;
    var tasaBase = obtenerTasaCuotaBancoDia(diaActual);
    var tasaMora = Math.max(0.006, tasaBase * 0.55);
    var minimoMora = Math.max(180, Math.round(obtenerMinimoCuotaBancoDia(diaActual) * 0.45));
    return Math.max(minimoMora, Math.round(deudaSegura * tasaMora));
}

function aplicarPenalizacionesPendientesDia() {
    if (typeof modoNivelesActivo === 'function' && modoNivelesActivo()) {
        penalizacionesDiaSiguiente = null;
        return;
    }
    if (!penalizacionesDiaSiguiente || typeof penalizacionesDiaSiguiente !== 'object') return;
    const p = penalizacionesDiaSiguiente;

    if (p.electricidad) {
        focoDiaMax = Math.max(4, focoDiaMax - 2);
        focoDiaActual = Math.min(focoDiaActual, focoDiaMax);
        log('Penalizacion: electricidad impaga, energia operativa reducida hoy (-2 max).', 'error');
    }
    if (p.local) {
        reputacion = Math.max(0, reputacion - 2);
        log('Penalizacion: alquiler impago, reputacion -2 por presion del casero.', 'error');
    }
    if (p.empleados) {
        moralEquipo = Math.max(0, (moralEquipo || 50) - 8);
        (mecanicos || []).forEach(function(m) {
            m.enojo = Math.min(8, (m.enojo || 0) + 1);
        });
        modPeleaImpagoEmpleadosDia = 0.2;
        modFalloImpagoEmpleadosDia = 0.08;
        log('Penalizacion: nomina impaga, el equipo arranca tenso.', 'error');
    }
    if (p.banco) {
        // Una deuda ya saldada no debe generar mora ni penalizacion residual.
        if (Math.max(0, Math.round(deuda || 0)) <= 0) {
            p.banco = false;
            bancoCasosSinPago = 0;
            bancoMorasAplicadas = 0;
        }
    }
    if (p.banco && Math.max(0, Math.round(deuda || 0)) > 0) {
        const mora = calcularMoraBancoPendiente(deuda || 0, dia || 1);
        deuda += mora;
        reputacion = Math.max(0, reputacion - 1);
        const pctMora = Math.round(Math.max(0, Math.min(100, (obtenerTasaCuotaBancoDia(dia || 1) * 0.55) * 1000))) / 10;
        log(`Penalizacion: cuota bancaria impaga, mora +RD$${mora} (${pctMora}%).`, 'error');
    }

    penalizacionesDiaSiguiente = null;
}

function aplicarCostoHistoriaDia(costo, motivo, reputDelta) {
    const costoSeguro = Math.max(0, Math.round(costo || 0));
    if (costoSeguro <= 0) return;

    if (saldo >= costoSeguro) {
        saldo -= costoSeguro;
    } else {
        const faltante = costoSeguro - saldo;
        saldo = 0;
        deuda += faltante;
    }

    if (typeof reputDelta === 'number' && reputDelta !== 0) {
        reputacion = Math.max(0, reputacion + reputDelta);
    }
    if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarGastoDia === 'function') {
        window.TallerApp.helpers.registrarGastoDia(costoSeguro, 'eventos');
    } else {
        resumenDia.perdidas += costoSeguro;
    }
    resumenDia.ramificaciones.push(`${motivo}: -RD$${costoSeguro}`);
    log(`${motivo}: impacto economico -RD$${costoSeguro}.`, reputDelta < 0 ? 'error' : 'info');
}

function aplicarImpactoHistoriaEconomicaDia() {
    if (impactoHistoriaDiaAplicado === dia) return;

    // Arco 1 - Supervivencia (dias 1-3)
    if (dia === 2) {
        const luzExtra = 700 + Math.round(Math.random() * 350);
        aplicarCostoHistoriaDia(luzExtra, 'Recargo de electricidad por arranque de semana', -1);
    } else if (dia === 3) {
        // Stewart vuelve: si el jugador tiene baja reputacion, genera tension
        if ((reputacion || 0) < 45) {
            const tensionStewart = 200 + Math.round(Math.random() * 200);
            aplicarCostoHistoriaDia(tensionStewart, 'Tension por reincorporacion de Stewart, bono de mediacion', -1);
        }
    // Arco 2 - Presion legal (dias 4-6)
    } else if (dia === 5) {
        const presionLegal = 400 + Math.round(Math.random() * 300);
        aplicarCostoHistoriaDia(presionLegal, 'Honorarios de abogado por primer aviso de Valeria', -1);
    } else if (dia === 6) {
        const recargoProveedor = 1400 + Math.round(Math.random() * 500);
        aplicarCostoHistoriaDia(recargoProveedor, 'Proveedor cobro piezas atrasadas', 0);
    // Arco 3 - Sombras en el barrio (dias 7-9)
    } else if (dia === 7) {
        // AutoFix Express roba un cliente potencial
        if ((reputacion || 0) < 60) {
            reputacion = Math.max(0, (reputacion || 0) - 2);
            log('AutoFix Express capto dos clientes del barrio con precios de apertura. -2 reputacion.', 'error');
        }
    } else if (dia === 8) {
        const suministroExtra = 350 + Math.round(Math.random() * 300);
        aplicarCostoHistoriaDia(suministroExtra, 'Costo extra por cliente misterioso: piezas especiales preliminares', 0);
    } else if (dia === 9) {
        const piezaRota = 650 + Math.round(Math.random() * 450);
        aplicarCostoHistoriaDia(piezaRota, 'Se rompio una pieza durante maniobra interna', -1);
        // Mecanicos tensos por pedido de aumento no resuelto
        (mecanicos || []).forEach(function(m) {
            m.enojo = Math.min(8, (m.enojo || 0) + 1);
        });
    // Arco 4 - El juicio se acerca (dias 10-12)
    } else if (dia === 10) {
        const citacion = 600 + Math.round(Math.random() * 400);
        aplicarCostoHistoriaDia(citacion, 'Honorarios preparacion defensa legal para el juicio', -1);
    } else if (dia === 11) {
        // Corte electrico segun arco narrativo
        const corteElectrico = 300 + Math.round(Math.random() * 350);
        aplicarCostoHistoriaDia(corteElectrico, 'Multa y reparacion por corte electrico parcial en la cuadra', -1);
    } else if (dia === 12) {
        const cargoTarjeta = 500 + Math.round(Math.random() * 900);
        aplicarCostoHistoriaDia(cargoTarjeta, 'Cargo inesperado de tarjeta de la ex — documentos nuevos del abogado', -2);
    // Arco 5 - El veredicto (dias 13-14)
    } else if (dia === 13) {
        // Presion final: si la reputacion es alta, recibe bono de clientes leales
        if ((reputacion || 0) >= 70) {
            const bonoLealtad = 400 + Math.round(Math.random() * 400);
            saldo += bonoLealtad;
            if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarIngresoDia === 'function') {
                window.TallerApp.helpers.registrarIngresoDia(bonoLealtad, 'eventos');
            }
            log('Clientes del barrio mandaron adelanto de confianza para el juicio. +RD$' + bonoLealtad + '.', 'exito');
        } else {
            const ultimaPresion = 350 + Math.round(Math.random() * 350);
            aplicarCostoHistoriaDia(ultimaPresion, 'Presion final de Valeria: costos legales de ultimo momento', -2);
        }
    }

    impactoHistoriaDiaAplicado = dia;
}

function cerrarDia() {
    if (typeof estaModoSinCierreDia === 'function' && estaModoSinCierreDia()) {
        log('Modo continuo activo: el taller sigue por casos, sin cierre manual.', 'info');
        if (typeof mostrarFeedbackGameplay === 'function') {
            mostrarFeedbackGameplay('Flujo por casos activo: gestiona cola, reparaciones y cobros sin cierre manual.', 'info');
        }
        return;
    }
    if (clientesHoy < (window.CLIENTES_POR_DIA || 10)) {
        log('Aun no has atendido a todos los clientes', 'error');
        return;
    }
    if (reparacionesActivas.length > 0) {
        const enProgreso = reparacionesActivas.filter(function(rep) {
            return !!(rep && !rep.listoParaCobro);
        }).length;
        if (enProgreso > 0) {
            log('Aun hay reparaciones en proceso ocupando espacio. Espera que terminen.', 'error');
            return;
        }
        // Casos listos para cobro: cobrarlos directamente desde el panel o cerrar igual
        const listasParaCobro = reparacionesActivas.filter(function(rep) {
            return !!(rep && rep.listoParaCobro);
        });
        if (listasParaCobro.length > 0) {
            // Auto-cobrar casos listos que ya tienen resultado visible
            var restantes = listasParaCobro.filter(function(rep) { return !rep.resultadoVisible; });
            if (restantes.length > 0) {
                log('Hay casos listos sin revisar resultado. Revisa resultado antes de cerrar.', 'error');
                return;
            }
            // Cobrar automaticamente todos los listos para no bloquear el cierre
            listasParaCobro.forEach(function(rep) {
                if (typeof procesarCobroReparacionDirecto === 'function') {
                    procesarCobroReparacionDirecto(rep.idCaso);
                }
            });
            if (reparacionesActivas.length > 0) {
                log('Cierra o cobra los casos pendientes en el panel de reparaciones.', 'error');
                return;
            }
        }
    }
    detenerTimer();

    agregarClasePantallaSiExiste('pantalla-taller', 'hidden');
    quitarClasePantallaSiExiste('game', 'modo-taller-fijo');
    quitarClasePantallaSiExiste('pantalla-cierre', 'hidden');
    actualizarTextoPantallaSiExiste('cierre-dia', dia);
    const historiaCierreTexto = obtenerHistoriaCierreDinamica();
    actualizarTextoPantallaSiExiste('texto-cierre', historiaCierreTexto);

    const costosDetalle = window.TallerApp.helpers.desglosarCostosOperativosDia();
    const tasaBancoDia = obtenerTasaCuotaBancoDia(dia || 1);
    const cuotaBanco = calcularCuotaBancoCierre(deuda || 0, dia || 1);
    cierreFacturasPendientes = {
        local: Math.max(0, costosDetalle.alquiler || 0),
        electricidad: Math.max(0, costosDetalle.electricidad || 0),
        empleados: Math.max(0, costosDetalle.manutencion || 0),
        banco: Math.max(0, cuotaBanco)
    };
    let costos = cierreFacturasPendientes.local + cierreFacturasPendientes.electricidad + cierreFacturasPendientes.empleados + cierreFacturasPendientes.banco;
    cierrePagoResuelto = false;
    cierreCostosPendientes = costos;
    let htmlResumen = '<p><strong>Resumen del dia</strong></p>';
    htmlResumen += `<p>Ingresos: RD$${resumenDia.ingresos} | Perdidas: RD$${resumenDia.perdidas}</p>`;
    htmlResumen += `<p>Reparaciones criticas/parciales/fallidas: ${resumenDia.reparacionesExitosas}/${resumenDia.reparacionesParciales}/${resumenDia.reparacionesFallidas}</p>`;
    htmlResumen += `<p>Diagnosticos correctos/parciales/fallidos: ${resumenDia.diagnosticosCorrectos}/${resumenDia.diagnosticosParciales}/${resumenDia.diagnosticosFallidos}</p>`;
    htmlResumen += `<p>Clientes perdidos: ${resumenDia.clientesPerdidos} | Negociaciones buenas/malas: ${resumenDia.negociacionesExitosas}/${resumenDia.negociacionesFallidas}</p>`;
    htmlResumen += `<p>Prestamos a mecanicos: RD$${resumenDia.prestamosDados} | Peleas del dia: ${resumenDia.peleas}</p>`;
    if (resumenDia.ramificaciones.length > 0) {
        htmlResumen += `<p><strong>Ramificaciones del dia:</strong> ${resumenDia.ramificaciones.join(' | ')}</p>`;
    }
    htmlResumen += `<p>Facturas de cierre: RD$${costos}</p>`;
    htmlResumen += `<p>Elige que pagar hoy: Local RD$${cierreFacturasPendientes.local} | Electricidad RD$${cierreFacturasPendientes.electricidad} | Empleados RD$${cierreFacturasPendientes.empleados} | Cuota banco RD$${cierreFacturasPendientes.banco} (${Math.round(tasaBancoDia * 1000) / 10}%)</p>`;

htmlResumen += `<p><strong>Decision de pago:</strong> Marca los rubros que quieres pagar ahora. Lo pendiente pasa a deuda y afecta el siguiente dia.</p>`;
    htmlResumen += '<div id="bloque-decision-pago" style="display:grid; gap:8px; margin:10px 0;">';
    htmlResumen += '<label><input type="checkbox" class="cierre-factura-check" value="local" checked> Local</label>';
    htmlResumen += '<label><input type="checkbox" class="cierre-factura-check" value="electricidad" checked> Electricidad</label>';
    htmlResumen += '<label><input type="checkbox" class="cierre-factura-check" value="empleados" checked> Empleados</label>';
    htmlResumen += '<label><input type="checkbox" class="cierre-factura-check" value="banco" checked> Cuota banco</label>';
    htmlResumen += '<button class="btn" onclick="pagarFacturasCierreSeleccionadas()">Pagar seleccionadas</button>';
    htmlResumen += '<button class="btn btn-danger" onclick="resolverPagoCierreFinal()">Cerrar caja y pasar pendientes a deuda</button>';
    htmlResumen += '</div>';
    htmlResumen += '<p id="resultado-pago-cierre" style="font-size:0.85rem; color:#d8cfb9;">Pendiente: marca rubros, paga seleccionadas y luego cierra caja.</p>';
    htmlResumen += '<div id="resumen-facturas-cierre" style="display:grid; gap:4px; font-size:0.85rem; color:#d8cfb9; margin-bottom:8px;"></div>';

    // Victoria anticipada: si se cumplen condiciones sobresalientes antes del dia final
    var deudaActualCierre = Math.max(0, deuda || 0);
    var repActualCierre = Math.round(reputacion || 0);
    var nivelCierre = Math.max(1, Math.round(tallerNivel || 1));
    if (repActualCierre >= 88 && nivelCierre >= 4 && deudaActualCierre <= 1500) {
        htmlResumen += '<p style="color:#f5c842; font-weight:bold;">&#x1F3C6; CONDICION VICTORIA ANTICIPADA: Reputacion, nivel y deuda en rango optimo. Puedes continuar hasta el dia 14 o cerrar aqui con victoria solida.</p>';
        htmlResumen += '<button class="btn" style="background:#2a6a2a;" onclick="finalizarJuego()">&#x2714; Declarar victoria anticipada</button>';
    } else if (repActualCierre >= 75 && nivelCierre >= 3) {
        htmlResumen += '<p style="color:#a8d8a8;">&#x2714; Buen ritmo. Si mantienes reputacion 88+, nivel 4+ y deuda bajo RD$1500 puedes lograr victoria anticipada.</p>';
    }

    let evento = eventoAleatorioNoche();
    htmlResumen += `<p>${evento}</p>`;
    htmlResumen += `<p><strong>Historia de cierre:</strong> ${historiaCierreTexto}</p>`;

    if (typeof registrarNarrativaTelefono === 'function') {
        const saldoDia = Math.round((resumenDia.ingresos || 0) - (resumenDia.perdidas || 0));
        const textoCierre = [
            `Balance del dia: ${saldoDia >= 0 ? '+' : ''}RD$${saldoDia}.`,
            historiaCierreTexto,
            evento
        ].join(' ');
        registrarNarrativaTelefono({
            tipo: 'cierre_dia',
            dia: dia,
            contactoId: 'cronica_barrio',
            titulo: `Cierre dia ${dia}`,
            texto: textoCierre,
            clave: `cierre-dia-${dia}`
        });
    }

    document.getElementById('resumen-gastos').innerHTML = htmlResumen;
    const btnSiguienteDia = document.getElementById('btn-siguiente-dia');
    if (btnSiguienteDia) btnSiguienteDia.disabled = true;
    renderizarFacturasCierre();

    aplicarEfectoMalvaviscoCierre();
    if (!(typeof modoNivelesActivo === 'function' && modoNivelesActivo())) {
        hambre = Math.min(100, hambre + 5);
        sueno = 30;
        estres = Math.max(0, estres - 20);
    }

    actualizarUI();
    sincronizarPausaJuego();
}

function renderizarFacturasCierre() {
    const cont = document.getElementById('resumen-facturas-cierre');
    if (!cont || !cierreFacturasPendientes) return;
    const p = cierreFacturasPendientes;
    cierreCostosPendientes = (p.local || 0) + (p.electricidad || 0) + (p.empleados || 0) + (p.banco || 0);
    cont.innerHTML = [
        `Local pendiente: RD$${Math.round(p.local || 0)}`,
        `Electricidad pendiente: RD$${Math.round(p.electricidad || 0)}`,
        `Empleados pendiente: RD$${Math.round(p.empleados || 0)}`,
        `Cuota banco pendiente: RD$${Math.round(p.banco || 0)}`,
        `<strong>Total pendiente: RD$${Math.round(cierreCostosPendientes || 0)}</strong>`
    ].map(function(t) { return `<div>${t}</div>`; }).join('');
}

function pagarFacturaCierre(clave) {
    if (cierrePagoResuelto || !cierreFacturasPendientes || typeof cierreFacturasPendientes[clave] !== 'number') return;
    const pendiente = Math.max(0, Math.round(cierreFacturasPendientes[clave] || 0));
    if (pendiente <= 0) return;
    if (saldo <= 0) {
        log('No hay saldo para abonar esta factura.', 'error');
        return;
    }
    const abono = Math.min(Math.round(saldo), pendiente);
    saldo -= abono;
    cierreFacturasPendientes[clave] = Math.max(0, pendiente - abono);
    log(`Abonaste RD$${abono} a ${clave}.`, 'info');
    const resultado = document.getElementById('resultado-pago-cierre');
    if (resultado) {
        resultado.innerHTML = `<strong>Abono aplicado:</strong> ${clave} recibe RD$${abono}. Pendiente ${clave}: RD$${Math.round(cierreFacturasPendientes[clave])}.`;
    }
    renderizarFacturasCierre();
    actualizarUI();
}

function pagarFacturasCierreSeleccionadas() {
    if (cierrePagoResuelto || !cierreFacturasPendientes) return;
    const checks = Array.from(document.querySelectorAll('.cierre-factura-check:checked'));
    const seleccion = checks
        .map(function(el) { return el && el.value ? String(el.value) : ''; })
        .filter(function(v) { return !!v; });
    const resultado = document.getElementById('resultado-pago-cierre');

    if (!seleccion.length) {
        if (resultado) resultado.innerHTML = '<strong>Sin seleccion:</strong> marca al menos una factura para pagar.';
        return;
    }

    let pagosAplicados = 0;
    seleccion.forEach(function(clave) {
        const antes = Math.max(0, Math.round((cierreFacturasPendientes && cierreFacturasPendientes[clave]) || 0));
        pagarFacturaCierre(clave);
        const despues = Math.max(0, Math.round((cierreFacturasPendientes && cierreFacturasPendientes[clave]) || 0));
        if (despues < antes) pagosAplicados += 1;
    });

    if (resultado) {
        if (pagosAplicados > 0) {
            resultado.innerHTML = `<strong>Pago aplicado:</strong> ${pagosAplicados} rubro(s) procesado(s) segun seleccion.`;
        } else {
            resultado.innerHTML = '<strong>Sin cambios:</strong> no hubo saldo o esos rubros ya estaban cubiertos.';
        }
    }
}

function resolverPagoCierreFinal() {
    if (cierrePagoResuelto || !cierreFacturasPendientes) return;

    const resultado = document.getElementById('resultado-pago-cierre');
    const bloque = document.getElementById('bloque-decision-pago');
    const btnSiguienteDia = document.getElementById('btn-siguiente-dia');
    const pendientes = {
        local: Math.max(0, Math.round(cierreFacturasPendientes.local || 0)),
        electricidad: Math.max(0, Math.round(cierreFacturasPendientes.electricidad || 0)),
        empleados: Math.max(0, Math.round(cierreFacturasPendientes.empleados || 0)),
        banco: Math.max(0, Math.round(cierreFacturasPendientes.banco || 0))
    };
    const totalPendiente = pendientes.local + pendientes.electricidad + pendientes.empleados + pendientes.banco;

    if (totalPendiente > 0) {
        deuda += totalPendiente;
        penalizacionesDiaSiguiente = {
            local: pendientes.local > 0,
            electricidad: pendientes.electricidad > 0,
            empleados: pendientes.empleados > 0,
            banco: pendientes.banco > 0
        };
        if (resultado) {
            resultado.innerHTML = `<strong>Cierre con pendientes:</strong> RD$${totalPendiente} pasan a deuda y aplicaran penalizaciones por rubro el proximo dia.`;
        }
        log(`Cierre diario con pendientes: deuda +RD$${totalPendiente}.`, 'error');
    } else {
        penalizacionesDiaSiguiente = null;
        if (resultado) resultado.innerHTML = '<strong>Cierre limpio:</strong> todas las facturas del dia quedaron pagadas.';
        log('Cierre diario limpio: todas las facturas pagadas.', 'exito');
    }

    cierrePagoResuelto = true;
    cierreCostosPendientes = 0;
    cierreFacturasPendientes = null;
    if (bloque) bloque.style.display = 'none';
    if (btnSiguienteDia) btnSiguienteDia.disabled = false;
    if (typeof autoGuardarPartidaSilenciosa === 'function') {
        autoGuardarPartidaSilenciosa('cierre-caja-final');
    }
    actualizarUI();
}

function avanzarDia() {
    if (!cierrePagoResuelto) {
        log('Antes de avanzar debes cerrar caja del dia (facturas por rubro).', 'error');
        return;
    }

    // Verificar condicion de quiebra catastrofica antes de avanzar
    var deudaSegura = Math.max(0, deuda || 0);
    var saldoSeguro = Math.round(saldo || 0);
    if (saldoSeguro < -1500 && deudaSegura > 6000) {
        log('Quiebra catastrofica: el taller no puede sostener mas operaciones.', 'error');
        if (typeof pushMensajeTelefono === 'function') {
            pushMensajeTelefono(
                'cronica_barrio', 'cronica_barrio',
                '&#x26A0;&#xFE0F; QUIEBRA: Saldo en rojo y deuda impagable. Valeria gana por abandono. El taller cierra.',
                {
                    clave: 'quiebra-catastrofica',
                    bloqueante: true,
                    autorNombre: 'Cronica Del Barrio',
                    metaNarrativa: {
                        tipo: 'arco_narrativo',
                        eventoId: 'quiebra_catastrofica',
                        fase: 'final',
                        dia: (typeof dia === 'number' ? dia : 1),
                        participantes: ['Cronica Del Barrio', 'Jefe']
                    }
                }
            );
        }
        finalizarJuego();
        return;
    }

    // Notificar si las finanzas estan criticas (pero no en quiebra total todavia)
    if (saldoSeguro < 0 && deudaSegura > 4000) {
        log('Alerta critica: saldo negativo y deuda alta. El taller esta en zona de peligro.', 'error');
    }

    dia++;
    if (dia > DIAS_TOTALES) {
        finalizarJuego();
        return;
    }
    clientesHoy = 0;
    clienteActual = null;
    resetearEventosDelDia();
    mecanicos.forEach(m => {
        m.trabajosHoy = 0;
        m.bloqueadoHastaDia = 0;
        m.ocupado = false;
        m.enfriamientoTurnos = 0;
        m.bloqueoAyudaTurnos = 0;
        m.ausenciaAnunciada = false;
        m.preguntaPendiente = null;
    });
    reparacionesActivas = [];
    clientesEnEspera = [];
    // --- Verificador de cola vacía ---
    if (typeof generarClienteEnCola === 'function' && clientesEnEspera.length === 0) {
        generarClienteEnCola();
    }
    ultimoMecanicoAsignado = null;
    malvavaviscoAlimentadoHoy = false;
    malvaviscoAcariciadoHoy = false;
    agregarClasePantallaSiExiste('pantalla-cierre', 'hidden');
    quitarClasePantallaSiExiste('game', 'modo-taller-fijo');
    let introDia = window.TallerData.historiasInicio[dia] || `Dia ${dia}: Continua la lucha.`;
    introDia = introDia.replace(/^Dia\s+\d+\s*:\s*Dia\s+\d+\s*:\s*/i, `Dia ${dia}: `);
    const trama = obtenerTramaDinamicaDia();
    historiaPrincipalIndice++;
    actualizarHtmlPantallaSiExiste('texto-historia', `${introDia}<span class="sub-historia">${trama}</span>`);
    if (typeof empezarJornada === 'function') empezarJornada();
    mostrarHistoriaPrincipalModal();
    if (typeof autoGuardarPartidaSilenciosa === 'function') {
        autoGuardarPartidaSilenciosa('avanzar-dia');
    }
    sincronizarPausaJuego();
}

function pasarTurno() {
    if (!(typeof estaModoSinCierreDia === 'function' && estaModoSinCierreDia()) && clientesHoy >= (window.CLIENTES_POR_DIA || 10) && !clienteActual && reparacionesActivas.length === 0) {
        log('Ya completaste el dia. Cierra jornada para avanzar.', 'info');
        return;
    }
    // --- Verificador de cola vacía en modo continuo ---
    if (typeof estaModoSinCierreDia === 'function' && estaModoSinCierreDia() && typeof generarClienteEnCola === 'function' && clientesEnEspera.length === 0) {
        generarClienteEnCola();
    }
    avanzarRelojTaller(Math.max(1, COSTOS_TURNO.espera), 'espera táctica'); // Corrección de acento
    log('Dejaste correr el reloj para ver avanzar el taller.', 'info');
}

function asegurarSistemaCajaBInicial() {
    if (typeof cajaBCuposDisponibles !== 'number') cajaBCuposDisponibles = 1;
    if (typeof cajaBUltimoHitoCasos !== 'number') cajaBUltimoHitoCasos = 0;
    if (typeof cajaBCalor !== 'number') cajaBCalor = 0;
    if (typeof cajaBUltimoControlInspectorCasos !== 'number') cajaBUltimoControlInspectorCasos = 0;
    cajaBCuposDisponibles = Math.max(0, Math.min(3, Math.round(cajaBCuposDisponibles)));
    cajaBUltimoHitoCasos = Math.max(0, Math.round(cajaBUltimoHitoCasos));
    cajaBCalor = Math.max(0, Math.min(100, Math.round(cajaBCalor)));
    cajaBUltimoControlInspectorCasos = Math.max(0, Math.round(cajaBUltimoControlInspectorCasos));
}

function obtenerCasosTotalesCajaB() {
    return Math.max(0, Math.round((tramaEstado && tramaEstado.casosCriticosResueltos || 0) + (tramaEstado && tramaEstado.casosParciales || 0)));
}

function procesarCadenciaCajaBPorCasos(casosTotales, silencioso) {
    asegurarSistemaCajaBInicial();
    var total = Math.max(0, Math.round(casosTotales || obtenerCasosTotalesCajaB()));
    var cadencia = 3;
    var hito = Math.floor(total / cadencia) * cadencia;
    if (hito <= cajaBUltimoHitoCasos) return false;

    var recargas = 0;
    while (cajaBUltimoHitoCasos + cadencia <= hito) {
        cajaBUltimoHitoCasos += cadencia;
        var antes = cajaBCuposDisponibles;
        cajaBCuposDisponibles = Math.min(3, cajaBCuposDisponibles + 1);
        if (cajaBCuposDisponibles > antes) recargas += 1;
        cajaBCalor = Math.max(0, cajaBCalor - 8);
    }

    if (recargas > 0 && !silencioso) {
        var txt = `Caja B: +${recargas} cupo(s) por ritmo de casos. Cupos ${cajaBCuposDisponibles}/3.`;
        log(txt, 'info');
        if (typeof mostrarFeedbackGameplay === 'function') {
            mostrarFeedbackGameplay(txt, 'ok');
        }
    }
    return recargas > 0;
}

function procesarPresionInspectorCajaB(casosTotales) {
    asegurarSistemaCajaBInicial();
    var total = Math.max(0, Math.round(casosTotales || obtenerCasosTotalesCajaB()));
    var cadenciaControl = 4;
    var hitoControl = Math.floor(total / cadenciaControl) * cadenciaControl;
    if (hitoControl < cadenciaControl) return false;
    if (hitoControl <= cajaBUltimoControlInspectorCasos) return false;
    cajaBUltimoControlInspectorCasos = hitoControl;

    var presionBase = Math.max(0, Math.round(cajaBCalor || 0));
    var montoCajaB = Math.max(0, Math.round(cajaB || 0));
    if (presionBase < 35 && montoCajaB < 600) return false;

    var chance = 0.08 + (presionBase / 210) + (Math.max(0, montoCajaB - 600) / 4200);
    chance = Math.max(0.08, Math.min(0.78, chance));
    if (Math.random() >= chance) {
        cajaBCalor = Math.max(0, cajaBCalor - 4);
        return false;
    }

    var decomiso = Math.min(montoCajaB, 160 + Math.round(Math.random() * 260) + Math.round(presionBase * 1.4));
    if (decomiso > 0) cajaB = Math.max(0, montoCajaB - decomiso);
    cajaBCalor = Math.max(0, cajaBCalor - 24);
    if (tramaEstado && typeof tramaEstado === 'object') {
        tramaEstado.inspectorGolpes = Math.max(0, Math.round(tramaEstado.inspectorGolpes || 0)) + 1;
    }
    reputacion = Math.max(0, reputacion - (presionBase >= 70 ? 2 : 1));

    var msg = `Inspector activo por rumores: decomiso RD$${Math.round(decomiso)} de Caja B.`;
    log(msg, 'error');
    if (typeof mostrarFeedbackGameplay === 'function') {
        mostrarFeedbackGameplay(msg, 'warn');
    }
    if (typeof pushMensajeTelefono === 'function') {
        pushMensajeTelefono('inspector', 'inspector', msg + ' Baja el calor o llegaran mas revisiones.', {
            clave: 'inspector-cajab-control-' + hitoControl
        });
    }
    return true;
}

function operarCajaB(tipoOperacion) {
    if (!(typeof estaModoSinCierreDia === 'function' && estaModoSinCierreDia()) && clientesHoy >= (window.CLIENTES_POR_DIA || 10) && !clienteActual && reparacionesActivas.length === 0) {
        log('Ya completaste el dia. Cierra jornada para avanzar.', 'info');
        return false;
    }

    asegurarSistemaCajaBInicial();
    procesarCadenciaCajaBPorCasos(obtenerCasosTotalesCajaB(), true);

    var tipo = String(tipoOperacion || 'picoteo').toLowerCase();
    var definiciones = {
        picoteo: {
            nombre: 'Picoteo rapido del barrio',
            ingresoMin: 220,
            ingresoMax: 420,
            rastroMin: 0.54,
            rastroMax: 0.78,
            calorMin: 8,
            calorMax: 14,
            estres: 2,
            repChance: 0.14,
            turnos: Math.max(1, COSTOS_TURNO.clandestino || 1)
        },
        rescate: {
            nombre: 'Rescate en calle sin factura',
            ingresoMin: 480,
            ingresoMax: 920,
            rastroMin: 0.7,
            rastroMax: 0.95,
            calorMin: 18,
            calorMax: 26,
            estres: 5,
            repChance: 0.34,
            turnos: Math.max(2, COSTOS_TURNO.clandestino || 1)
        },
        cuadre: {
            nombre: 'Cuadre con el equipo',
            gastoCajaMin: 210,
            gastoCajaMax: 390,
            calorBajaMin: 20, // antes 12
            calorBajaMax: 32, // antes 22
            moralMin: 7, // antes 3
            moralMax: 14, // antes 7
            turnos: Math.max(1, COSTOS_TURNO.clandestino || 1)
        }
    };
    var op = definiciones[tipo];
    if (!op) {
        log('Operacion Caja B no reconocida.', 'error');
        return false;
    }

    if (cajaBCuposDisponibles <= 0) {
        var txtBloqueo = 'Sin cupos de Caja B. Cierra 3 casos para recuperar uno.';
        log(txtBloqueo, 'error');
        if (typeof mostrarFeedbackGameplay === 'function') {
            mostrarFeedbackGameplay(txtBloqueo, 'warn');
        }
        return false;
    }

    if (tipo === 'cuadre' && Math.max(0, Math.round(cajaB || 0)) < op.gastoCajaMin) {
        var txtCaja = `Necesitas al menos RD$${op.gastoCajaMin} en Caja B para cuadrar con el equipo.`;
        log(txtCaja, 'error');
        if (typeof mostrarFeedbackGameplay === 'function') {
            mostrarFeedbackGameplay(txtCaja, 'warn');
        }
        return false;
    }

    if (!consumirFoco('clandestino')) return false;

    cajaBCuposDisponibles = Math.max(0, cajaBCuposDisponibles - 1);
    decisionesHistoria.atajosOscuros = Math.max(0, Math.round(decisionesHistoria.atajosOscuros || 0)) + 1;
    clandestinoTrabajosHoy = Math.max(0, Math.round(clandestinoTrabajosHoy || 0)) + 1;
    clandestinoUltimoTurno = Math.max(0, Math.round(turnoActual || 0));

    if (tipo === 'cuadre') {
        var gastoCaja = Math.min(Math.max(0, Math.round(cajaB || 0)), op.gastoCajaMin + Math.round(Math.random() * (op.gastoCajaMax - op.gastoCajaMin)));
        cajaB = Math.max(0, Math.round(cajaB || 0) - gastoCaja);
        var enfriamiento = op.calorBajaMin + Math.round(Math.random() * (op.calorBajaMax - op.calorBajaMin));
        cajaBCalor = Math.max(0, Math.round(cajaBCalor || 0) - enfriamiento);
        var mejoraMoral = op.moralMin + Math.round(Math.random() * (op.moralMax - op.moralMin));
        moralEquipo = Math.min(100, Math.max(0, Math.round((moralEquipo || 50) + mejoraMoral)));

        var calmados = 0;
        (mecanicos || [])
            .filter(function(m) { return !!m; })
            .sort(function(a, b) { return (b.enojo || 0) - (a.enojo || 0); })
            .slice(0, 3) // ahora afecta a 3 mecánicos
            .forEach(function(m) {
                var antes = Math.max(0, Math.round(m.enojo || 0));
                m.enojo = Math.max(0, antes - 2); // baja 2 puntos de enojo
                if (m.enojo < antes) calmados += 1;
            });

        var txtCuadre = `${op.nombre}: se movieron RD$${gastoCaja} fuera del radar. Moral +${mejoraMoral}, calor -${enfriamiento}${calmados > 0 ? `, ${calmados} mecanico(s) bajan tension` : ''}.`;
        log(txtCuadre, 'info');
        if (typeof mostrarFeedbackGameplay === 'function') {
            mostrarFeedbackGameplay(txtCuadre, 'ok');
        }
        avanzarRelojTaller(op.turnos, 'cuadre informal de caja b');
        return true;
    }

    var ingreso = op.ingresoMin + Math.round(Math.random() * (op.ingresoMax - op.ingresoMin));
    saldo += ingreso;
    if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarIngresoDia === 'function') {
        window.TallerApp.helpers.registrarIngresoDia(ingreso, 'clandestino');
    }

    var ratioRastro = op.rastroMin + (Math.random() * (op.rastroMax - op.rastroMin));
    var rastroCaja = Math.max(80, Math.round(ingreso * ratioRastro));
    cajaB = Math.max(0, Math.round(cajaB || 0) + rastroCaja);
    var subidaCalor = op.calorMin + Math.round(Math.random() * (op.calorMax - op.calorMin));
    cajaBCalor = Math.min(100, Math.max(0, Math.round(cajaBCalor || 0) + subidaCalor));
    estres = Math.min(100, Math.max(0, Math.round((estres || 0) + op.estres)));

    var tonoOperacion = 'info';
    if (Math.random() < op.repChance) {
        reputacion = Math.max(0, reputacion - 1);
        tonoOperacion = 'warn';
    }

    if (tipo === 'rescate' && Array.isArray(mecanicos) && mecanicos.length) {
        var m = mecanicos[Math.floor(Math.random() * mecanicos.length)];
        if (m) m.enojo = Math.min(8, Math.max(0, Math.round(m.enojo || 0) + 1));
    }

    var txtOp = `${op.nombre}: +RD$${ingreso} caja oficial | rastro Caja B +RD$${rastroCaja} | calor +${subidaCalor} (${cajaBCalor}/100).`;
    log(txtOp, tonoOperacion === 'warn' ? 'warn' : 'info');
    if (typeof mostrarFeedbackGameplay === 'function') {
        mostrarFeedbackGameplay(txtOp, tipo === 'rescate' ? 'warn' : 'ok');
    }

    if (typeof registrarEventoNarrativo === 'function') {
        registrarEventoNarrativo('caja_b_usada', {
            operacion: tipo,
            ingreso: ingreso,
            calor: cajaBCalor,
            saldo: saldo,
            deuda: deuda
        });
    }

    var chanceGolpe = 0.06 + (Math.max(0, cajaBCalor || 0) / 220) + (Math.max(0, (cajaB || 0) - 900) / 5000) + (tipo === 'rescate' ? 0.07 : 0);
    chanceGolpe = Math.max(0.06, Math.min(0.8, chanceGolpe));
    if (Math.random() < chanceGolpe) {
        var decomiso = Math.min(Math.max(0, Math.round(cajaB || 0)), 120 + Math.round(Math.random() * 220) + Math.round((cajaBCalor || 0) * 1.4));
        if (decomiso > 0) cajaB = Math.max(0, Math.round(cajaB || 0) - decomiso);
        var multa = (Math.random() < 0.45) ? (120 + Math.round(Math.random() * 220)) : 0;
        if (multa > 0) {
            var faltante = Math.max(0, multa - Math.max(0, Math.round(saldo || 0)));
            saldo = Math.max(0, Math.round(saldo || 0) - multa);
            if (faltante > 0) deuda = Math.max(0, Math.round(deuda || 0) + faltante);
            if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarGastoDia === 'function') {
                window.TallerApp.helpers.registrarGastoDia(multa, 'eventos');
            }
        }
        cajaBCalor = Math.max(0, Math.round(cajaBCalor || 0) - 22);
        if (tramaEstado && typeof tramaEstado === 'object') {
            tramaEstado.inspectorGolpes = Math.max(0, Math.round(tramaEstado.inspectorGolpes || 0)) + 1;
        }
        reputacion = Math.max(0, Math.round(reputacion || 0) - (tipo === 'rescate' ? 2 : 1));
        var txtGolpe = `Golpe de inspector: decomiso RD$${decomiso}${multa > 0 ? ` y multa RD$${multa}` : ''}.`;
        log(txtGolpe, 'error');
        if (typeof mostrarFeedbackGameplay === 'function') {
            mostrarFeedbackGameplay(txtGolpe, 'warn');
        }
        if (typeof registrarEventoNarrativo === 'function') {
            registrarEventoNarrativo('control_inspector', {
                resultado: 'golpe',
                decomiso: decomiso,
                multa: multa,
                calor: cajaBCalor
            });
        }
    }

    avanzarRelojTaller(op.turnos, tipo === 'rescate' ? 'rescate en calle sin factura' : 'picoteo rapido sin factura');
    if (typeof actualizarIndicadoresCajaBUI === 'function') actualizarIndicadoresCajaBUI();
    if (typeof actualizarUI === 'function') actualizarUI();
    return true;
}

// Exponer explícitamente la acción para botones inline y controles dinámicos.
if (typeof window !== 'undefined') window.operarCajaB = operarCajaB;

function hacerTrabajoPorDetras() {
    return operarCajaB('picoteo');
}

function avanzarRelojTaller(pasos = 1, razon = 'flujo automatico', silencioso = false) {
    const pasosSeguros = Math.max(1, Math.round(pasos));
    const modoNiveles = (typeof modoNivelesActivo === 'function' && modoNivelesActivo());
    for (let i = 0; i < pasosSeguros; i++) {
        turnoActual += 1;
        // El desgaste fisiológico acompaña el ritmo del taller, pero no debe
        // castigar cada segunda acción. Tres turnos equivalen a una jornada
        // operativa corta y hacen más legible el manejo del equipo.
        if (!modoNiveles && turnoActual % 3 === 0) {
            hambre = Math.min(100, hambre + 1);
            sueno = Math.min(100, sueno + 1);
        }
        procesarEnfriamientoMecanicos();
        if (!modoNiveles && turnoActual % 2 === 0 && (clientesEnEspera.length >= 3 || (clienteActual && tiempoCliente <= 4))) {
            estres = Math.min(100, estres + 1);
        }

        // En modo por turnos, el tiempo del trabajo avanza por cada avance
        // del reloj. El temporizador visual usa segundos reales, pero si solo
        // se consulta Date.now() aquí nunca pasan 30 segundos entre turnos y
        // el diagnóstico queda congelado (normalmente en 50% / 00:00).
        if (!modoNiveles && Array.isArray(reparacionesActivas)) {
            const unidadesPorTurno = Math.max(1, Math.round(autoTurnoCadaSeg || 30));
            reparacionesActivas.forEach(function(rep) {
                if (!rep || rep.listoParaCobro || rep.pausadaPorPieza || rep.pausadaManualDueno) return;
                rep.tiempoRestante = Math.max(0, Math.round(rep.tiempoRestante || 0) - 1);
                rep.segundosPendientesReal = Math.max(0, rep.tiempoRestante * unidadesPorTurno);
                rep.ultimoTiempoSyncMs = Date.now();
            });
        }
        procesarReparacionesActivas();
        if (typeof procesarEntregasPiezasActivas === 'function') procesarEntregasPiezasActivas();
        procesarPacienciaCola();
        intentarLlegadaClienteEnEspera();

        if (turnoActual % 4 === 0 && !clienteActual && !(typeof estaCupoDiarioCompleto === 'function' && estaCupoDiarioCompleto(0))) {
            if (typeof asegurarDemandaEnColaSinActivar === 'function') asegurarDemandaEnColaSinActivar();
            else if (typeof generarClienteEnCola === 'function') generarClienteEnCola();
        }

        procesarClienteActivoPorTurno();
        intentarEventoNarrativoTurno();
    }

    if (!silencioso) {
        if (modoNiveles) {
            mostrarFeedbackGameplay(`Flujo en tiempo real activo: casos y mecanicos avanzando.`, 'ok');
        } else {
            mostrarFeedbackGameplay(`Reloj del taller: +${pasosSeguros * 10} min | Flujo operativo actualizado.`, 'ok');
        }
    }
    ultimoTickRealMs = Date.now();
    actualizarUI();
}

function avanceRapidoTaller() {
    const pasos = 3;
    const costo = 150;
    const riesgoIncidente = 0.20;

    if (juegoPausado) {
        mostrarFeedbackGameplay('Cierra el panel activo antes de acelerar el taller.', 'warn');
        return false;
    }
    const reparacionesEnCurso = (reparacionesActivas || []).some(function(rep) {
        return rep && !rep.listoParaCobro && !rep.pausadaPorPieza;
    });
    const entregasEnCurso = (entregasPiezasActivas || []).some(function(entrega) {
        return !!entrega;
    });
    if (!reparacionesEnCurso && !entregasEnCurso) {
        mostrarFeedbackGameplay('No hay reparaciones ni entregas avanzando. Asigna el caso pendiente antes de acelerar.', 'warn');
        log('Avance rapido cancelado: no habia progreso operativo disponible.', 'info');
        return false;
    }
    if (saldo < costo) {
        mostrarFeedbackGameplay(`Avance rapido requiere RD$${costo}.`, 'warn');
        log(`No hay caja suficiente para acelerar operaciones. Costo: RD$${costo}.`, 'error');
        return false;
    }

    saldo -= costo;
    if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarGastoDia === 'function') {
        window.TallerApp.helpers.registrarGastoDia(costo, 'operaciones');
    }

    const segundosReparacion = (typeof obtenerDuracionTrabajoTiempoRealSeg === 'function')
        ? obtenerDuracionTrabajoTiempoRealSeg(pasos, typeof modoNivelesActivo === 'function' && modoNivelesActivo())
        : pasos;
    const segundosDelivery = (typeof obtenerDuracionTrabajoTiempoRealSeg === 'function')
        ? obtenerDuracionTrabajoTiempoRealSeg(pasos, false)
        : pasos;
    (reparacionesActivas || []).forEach(function(rep) {
        if (!rep || rep.listoParaCobro || rep.pausadaPorPieza || rep.pausadaManualDueno) return;
        if (typeof ajustarTrabajoActivoSegundos === 'function') {
            ajustarTrabajoActivoSegundos(rep, -segundosReparacion);
        }
    });
    (entregasPiezasActivas || []).forEach(function(entrega) {
        if (!entrega) return;
        if (typeof ajustarTrabajoActivoSegundos === 'function') {
            ajustarTrabajoActivoSegundos(entrega, -segundosDelivery, { esDelivery: true });
        }
    });
    avanzarRelojTaller(pasos, 'avance rapido', true);

    if (Math.random() < riesgoIncidente) {
        reputacion = Math.max(0, reputacion - 2);
        log('La prisa provoco un reclamo operativo. -2 reputacion.', 'error');
        mostrarFeedbackGameplay(`Avanzaste 30 min por RD$${costo}, pero hubo un incidente: -2 reputacion.`, 'warn');
    } else {
        log(`Operaciones aceleradas 30 min por RD$${costo}, sin incidentes.`, 'exito');
        mostrarFeedbackGameplay(`Avance rapido: +30 min por RD$${costo}. Riesgo superado.`, 'ok');
    }
    actualizarUI();
    return true;
}

// Ruta de seguridad económica: el taller puede esperar sin quemar caja.
function esperarSinCostoTaller() {
    const pasos = 1;
    const hayOperacion = (reparacionesActivas || []).some(function(rep) {
        return rep && !rep.listoParaCobro;
    }) || (entregasPiezasActivas || []).some(function(entrega) { return !!entrega; });
    if (!hayOperacion) {
        mostrarFeedbackGameplay('No hay una entrega ni reparación activa para esperar.', 'warn');
        return false;
    }
    const segundosReparacion = (typeof obtenerDuracionTrabajoTiempoRealSeg === 'function')
        ? obtenerDuracionTrabajoTiempoRealSeg(pasos, typeof modoNivelesActivo === 'function' && modoNivelesActivo())
        : pasos;
    const segundosDelivery = (typeof obtenerDuracionTrabajoTiempoRealSeg === 'function')
        ? obtenerDuracionTrabajoTiempoRealSeg(pasos, false)
        : pasos;
    (reparacionesActivas || []).forEach(function(rep) {
        if (!rep || rep.listoParaCobro || rep.pausadaPorPieza || rep.pausadaManualDueno) return;
        if (typeof ajustarTrabajoActivoSegundos === 'function') ajustarTrabajoActivoSegundos(rep, -segundosReparacion);
    });
    (entregasPiezasActivas || []).forEach(function(entrega) {
        if (!entrega) return;
        if (typeof ajustarTrabajoActivoSegundos === 'function') ajustarTrabajoActivoSegundos(entrega, -segundosDelivery, { esDelivery: true });
    });
    avanzarRelojTaller(pasos, 'espera sin coste', true);
    log('Esperaste 10 minutos sin coste para mantener el flujo operativo.', 'info');
    mostrarFeedbackGameplay('Esperaste 10 minutos sin coste. La operación sigue avanzando.', 'ok');
    actualizarUI();
    return true;
}

var timerInterval = null;

function detenerTimer() {
    if (!timerInterval) return false;
    clearInterval(timerInterval);
    timerInterval = null;
    ultimoTickRealMs = Date.now();
    return true;
}

if (typeof window !== 'undefined') {
    window.detenerTimer = detenerTimer;
}

function iniciarTimer() {
    detenerTimer();
    ultimoTickRealMs = Date.now();
    timerInterval = setInterval(() => {
        if (typeof sincronizarPausaJuego === 'function') sincronizarPausaJuego();
        const ahora = Date.now();
        if (juegoPausado) {
            ultimoTickRealMs = ahora;
            return;
        }
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
        const baseTick = Number.isFinite(ultimoTickRealMs) ? ultimoTickRealMs : ahora;
        const segundosNuevos = Math.max(1, Math.min(60, Math.floor((ahora - baseTick) / 1000)));
        ultimoTickRealMs = ahora;
        if (typeof sincronizarTrabajosTiempoReal === 'function') {
            sincronizarTrabajosTiempoReal('timer');
        }
        const pantallaTaller = document.getElementById('pantalla-taller');
        if (!pantallaTaller || pantallaTaller.classList.contains('hidden')) {
            sincronizarPausaJuego();
            actualizarUI();
            return;
        }
        const turnoSegundosAntes = Math.max(0, Math.round(turnoSegundos || 0));
        turnoSegundos = turnoSegundosAntes + segundosNuevos;
        const jornadaCompletada = !(typeof estaModoSinCierreDia === 'function' && estaModoSinCierreDia())
            && clientesHoy >= (window.CLIENTES_POR_DIA || 10)
            && !clienteActual
            && reparacionesActivas.length === 0;
        if (jornadaCompletada) {
            actualizarUI();
            return;
        }
        if (!autoAvanceActivo) {
            actualizarUI();
            return;
        }
        const segundosPorTurno = Math.max(1, Math.round(autoTurnoCadaSeg || 1));
        const turnosPendientes = Math.floor(turnoSegundos / segundosPorTurno)
            - Math.floor(turnoSegundosAntes / segundosPorTurno);
        if (turnosPendientes > 0) {
            avanzarRelojTaller(turnosPendientes, 'flujo automatico', true);
            return;
        }
        actualizarUI();
    }, 1000);
}

function consumirTurno(razon = 'accion', costo = 1, silencioso = false) {
    const modoNiveles = (typeof modoNivelesActivo === 'function' && modoNivelesActivo());
    const focoAntes = focoDiaActual;
    const costoSeguro = Number.isFinite(costo) ? Math.max(1, Math.ceil(costo)) : 1;
    const rendimiento = modoNiveles ? 1 : ((typeof obtenerFactorRendimientoJugador === 'function') ? obtenerFactorRendimientoJugador() : 1);
    const reduccionFatigaDueno = (typeof mejorasDueno !== 'undefined' && mejorasDueno.energia) ? mejorasDueno.energia : 0;
    const sobrecostoFatigaBase = rendimiento < 0.52 ? 2 : (rendimiento < 0.72 ? 1 : 0);
    const sobrecostoFatiga = Math.max(0, sobrecostoFatigaBase - reduccionFatigaDueno);
    if (!silencioso) log(`Accion registrada: ${razon}.`, 'info');
    if (!silencioso) {
        const focoUsado = Math.max(0, focoAntes - focoDiaActual);
        if (modoNiveles) {
            mostrarFeedbackGameplay(`Accion: ${razon} | progreso operativo activo.`, 'ok');
        } else {
            mostrarFeedbackGameplay(`Accion: ${razon} | Impacto operativo ${costoSeguro}.`, 'ok');
        }
    }
    if (!modoNiveles && sobrecostoFatiga > 0 && typeof avanzarRelojTaller === 'function') {
        avanzarRelojTaller(sobrecostoFatiga, 'fatiga del dueno', true);
        if (!silencioso) {
            log(`Fatiga operativa: se agregan ${sobrecostoFatiga * 10} min por cansancio del dueno.`, 'warn');
        }
    }
    if (typeof avanzarRelojTaller === 'function') {
        avanzarRelojTaller(costoSeguro, razon, true);
    }
    actualizarUI();
}

function procesarClienteActivoPorTurno() {
    if (typeof modoNivelesActivo === 'function' && modoNivelesActivo()) return;
    if (!clienteActual) return;
    var casoEnTrabajoMecanico = Array.isArray(reparacionesActivas) && reparacionesActivas.some(function(rep) {
        return rep && String(rep.idCaso || '') === String(clienteActual.idCaso || '')
            && rep.mecanicoNombre && !rep.esTrabajoDueno;
    });
    if (casoEnTrabajoMecanico) return;
    // Durante el diagnóstico el expediente pertenece a Mi puesto. Las
    // pruebas consumen foco, pero no deben hacer que el caso desaparezca por
    // agotar el contador de espera del cliente.
    if (clienteActual.origenListaCaso === 'mi-puesto' || clienteActual.ofDxEstado) return;
    if (clienteActual.diagnosticado || clienteActual.estadoCanonico === 'esperando_aprobacion'
        || clienteActual.estado === 'esperando_aprobacion' || clienteActual.ofDxEstado === 'diagnosticado') return;

    let desgaste = clienteActual.paciencia ? 0.55 : 0.85;
    if (clienteActual.personalidad === 'ansioso') desgaste += 0.35;
    if (clienteActual.personalidad === 'confiado') desgaste -= 0.18;
    if (clienteActual.personalidad === 'desconfiado') desgaste += 0.15;
    desgaste += (obtenerFactorPresionJugador() * 0.35);
    desgaste += clienteActual.esVIP ? 0.45 : 0;
    desgaste += clienteActual.dificultad > 0.9 ? 0.25 : 0;
    desgaste -= tallerNivel >= 3 ? 0.15 : 0;
    if (estrategiaCliente === 'rapido') desgaste -= 0.18;
    if (estrategiaCliente === 'calidad') desgaste += 0.18;
    desgaste = Math.max(0.35, desgaste);
    tiempoCliente -= desgaste;

    if (tiempoCliente <= 0) {
        log('Cliente se canso y se fue. -5 reputacion', 'error');
        mostrarFeedbackGameplay('Cliente abandono por espera. -5 reputacion.', 'error');
        reputacion = Math.max(0, reputacion - 5);
        resumenDia.clientesPerdidos++;
        if (typeof estaModoSinCierreDia === 'function' && estaModoSinCierreDia()) {
            clientesHoy = Math.max(0, clientesHoy + 1);
        } else {
            clientesHoy = Math.min((window.CLIENTES_POR_DIA || 10), clientesHoy + 1);
        }
        clienteActual = null;
        if (!(typeof estaCupoDiarioCompleto === 'function' && estaCupoDiarioCompleto(0))) {
            if (typeof asegurarDemandaEnColaSinActivar === 'function') asegurarDemandaEnColaSinActivar();
            else if (typeof generarClienteEnCola === 'function') generarClienteEnCola();
        }
    }
}

function intentarEventoNarrativoTurno() {
    if (typeof eventosEmergentesActivos === 'function' && !eventosEmergentesActivos()) return;
    if (solicitudMecanicoActiva || eventoNarrativoActivo) return;

    // Modo por casos: la narrativa no depende de turno, sino de hitos de casos completados.
    const casosActuales = Math.max(0, Math.round((tramaEstado && tramaEstado.casosCriticosResueltos || 0) + (tramaEstado && tramaEstado.casosParciales || 0)));
    const cadenciaCasos = 8;
    const ultimoNarrativo = Math.max(0, Math.round((tramaEstado && tramaEstado.eventoNarrativoUltimoCaso) || 0));
    if (casosActuales < cadenciaCasos) return;
    if ((casosActuales - ultimoNarrativo) < cadenciaCasos) return;
    if (Math.random() > 0.55) return;

    const evento = seleccionarEventoNarrativoContextual();
    if (!evento) return;
    eventoNarrativoActivo = evento;

    document.getElementById('decision-titulo').innerText = `Evento: ${evento.titulo}`;
    document.getElementById('decision-texto').innerText = evento.texto;

    const btnA = document.getElementById('decision-opcion-a');
    const btnB = document.getElementById('decision-opcion-b');
    btnA.innerText = evento.opcionA;
    btnB.innerText = evento.opcionB;
    btnA.onclick = () => resolverEventoNarrativoTurno('A');
    btnB.onclick = () => resolverEventoNarrativoTurno('B');

    eventosTurnoVistos++;
    eventosTurnoHoy.push(evento.id);
    ultimoEventoTurno = turnoActual;
    ultimoEventoCasos = casosActuales;
    if (tramaEstado && typeof tramaEstado === 'object') {
        tramaEstado.eventoNarrativoUltimoCaso = casosActuales;
    }

    if (typeof registrarNarrativaTelefono === 'function') {
        const contactoNarrativo = (typeof obtenerContactoNarrativoEventoTurno === 'function')
            ? obtenerContactoNarrativoEventoTurno(evento.id)
            : 'cronica_barrio';
        registrarNarrativaTelefono({
            tipo: 'evento_turno',
            fase: 'aparece',
            eventoId: evento.id,
            dia: dia,
            contactoId: contactoNarrativo,
            titulo: `Evento ${evento.titulo}`,
            texto: evento.texto,
            clave: `evento-${dia}-${turnoActual}-${evento.id}-aparece`
        });
    }

    abrirModal('decision');
}

function seleccionarEventoNarrativoContextual() {
    const candidatos = eventosNarrativosTurno.filter(e => {
        if (eventosTurnoHoy.includes(e.id)) return false;
        return eventoNarrativoAplica(e.id);
    });
    if (!candidatos.length) return null;

    if (Math.random() < 0.72) return candidatos[0];
    return candidatos[Math.floor(Math.random() * candidatos.length)];
}

function eventoNarrativoAplica(eventoId) {
    const bloqueados = mecanicos.filter(m => m.bloqueadoHastaDia >= dia).length;
    switch (eventoId) {
        case 'vipNervioso':
            return !!clienteActual && clienteActual.esVIP;
        case 'cajaRota':
            return saldo <= 900 || deuda >= 6500;
        case 'rivalidadInterna':
            return bloqueados > 0 || mecanicos.some(m => m.enojo >= 4);
        case 'clienteFiel':
            return Array.isArray(clientesEnEspera) && clientesEnEspera.length >= 2;
        case 'proveedor':
            return turnoActual >= 8;
        case 'inspector':
            return (reputacion < 68 || decisionesHistoria.atajosOscuros >= 2 || cajaB >= 600);
        default:
            return true;
    }
}

function resolverEventoNarrativoTurno(opcion) {
    if (!eventoNarrativoActivo) {
        cerrarModal();
        return;
    }

    const eventoResuelto = eventoNarrativoActivo;
    eventoResuelto.resolver(opcion);

    if (typeof registrarNarrativaTelefono === 'function') {
        const contactoNarrativo = (typeof obtenerContactoNarrativoEventoTurno === 'function')
            ? obtenerContactoNarrativoEventoTurno(eventoResuelto.id)
            : 'cronica_barrio';
        const opcionElegida = opcion === 'A' ? eventoResuelto.opcionA : eventoResuelto.opcionB;
        const ramificacion = (resumenDia && Array.isArray(resumenDia.ramificaciones) && resumenDia.ramificaciones.length)
            ? resumenDia.ramificaciones[resumenDia.ramificaciones.length - 1]
            : '';
        const textoResultado = [
            `Elegiste: ${opcionElegida}.`,
            ramificacion ? `Consecuencia: ${ramificacion}` : ''
        ].filter(function(t) { return !!String(t || '').trim(); }).join(' ');
        registrarNarrativaTelefono({
            tipo: 'evento_turno',
            fase: 'resuelto',
            eventoId: eventoResuelto.id,
            dia: dia,
            contactoId: contactoNarrativo,
            titulo: `Resolucion ${eventoResuelto.titulo}`,
            texto: textoResultado || `Evento ${eventoResuelto.titulo} resuelto.`,
            clave: `evento-${dia}-${turnoActual}-${eventoResuelto.id}-resuelto-${opcion}`
        });
    }

    eventoNarrativoActivo = null;
    cerrarModal();
    actualizarUI();
}

function procesarPacienciaCola() {
    if (typeof modoNivelesActivo === 'function' && modoNivelesActivo()) return;
    if (typeof modoRitmoJuego !== 'undefined' && modoRitmoJuego === 'relajado') return;
    if (!Array.isArray(clientesEnEspera) || clientesEnEspera.length === 0) return;

    for (let i = clientesEnEspera.length - 1; i >= 0; i--) {
        const c = clientesEnEspera[i];
        c.ticksEnCola += 1;
        let desgaste = c.esVIP ? 0.85 : 0.6;
        if (c.personalidad === 'ansioso') desgaste += 0.2;
        if (c.personalidad === 'confiado') desgaste -= 0.1;
        if (c.personalidad === 'desconfiado') desgaste += 0.12;
        desgaste += c.dificultad > 0.9 ? 0.1 : 0;
        c.pacienciaCola -= desgaste;

        if (!c.penalizacionAplicada && c.pacienciaCola <= 45) {
            c.penalizacionAplicada = true;
            c.pago = Math.max(250, Math.round(c.pago * 0.88));
            log(`Cliente en cola exige descuento por espera: ${c.nombre}.`, 'error');
        }

        if (c.pacienciaCola <= 0) {
            clientesEnEspera.splice(i, 1);
            resumenDia.clientesPerdidos++;
            reputacion = Math.max(0, reputacion - 2);
            log(`Cliente se fue por esperar demasiado en cola: ${c.nombre}.`, 'error');
        }
    }
}
