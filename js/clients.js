const nombresFallbackCliente = [
    'Rafael Cruz',
    'Marta Rosario',
    'Julio Pimentel',
    'Carla Nunez',
    'Victor Almanzar',
    'Luz Herrera',
    'Ramon Batista',
    'Yadira Gomez',
    'Edgar Martinez',
    'Patricia Paulino',
    'Kelvin Rosario',
    'Nathaly Mendez',
    'Dario Estrella'
];

const nombresBaseCliente = [
    'Jose', 'Marcos', 'Elena', 'Daniela', 'Luis', 'Tatiana', 'Erick', 'Mabel',
    'Arturo', 'Samira', 'Brayan', 'Lorena', 'Gabriel', 'Rosalba', 'Joel', 'Amelia'
];

const apellidosBaseCliente = [
    'Sanchez', 'Delgado', 'Peguero', 'Cabrera', 'Mora', 'Reyes', 'Valera', 'Santos',
    'Taveras', 'Brito', 'Hernandez', 'Rosario', 'Quezada', 'Mena', 'Polanco', 'Acosta'
];

let correlativoCasoCliente = 1;

const MAX_CASOS_ATENDIDOS = 30;

// Asegurar variables y funciones globales
if (typeof window !== 'undefined') {
    window.generarClienteEnCola = generarClienteEnCola;
    window.asegurarDemandaEnColaSinActivar = asegurarDemandaEnColaSinActivar;
    // Utilidad de desarrollo: el panel QA local puede crear expedientes sin
    // duplicar el generador procedural. No se usa como mecanismo de juego.
    window.crearClienteAleatorio = crearClienteAleatorio;
}

function asegurarHistorialClientes() {
    if (!historialClientes || typeof historialClientes !== 'object') historialClientes = {};
    return historialClientes;
}

function obtenerClaveHistorialCliente(cliente) {
    if (!cliente || typeof cliente !== 'object') return '';
    const nombre = String(cliente.personaNombre || cliente.clienteNombre || '').trim().toLowerCase();
    if (!nombre) return '';
    return nombre;
}

function obtenerRegistroHistorialCliente(cliente, crearSiNoExiste = true) {
    const key = obtenerClaveHistorialCliente(cliente);
    if (!key) return null;
    const mapa = asegurarHistorialClientes();
    if (!mapa[key] && crearSiNoExiste) {
        mapa[key] = {
            key: key,
            nombre: cliente.personaNombre || cliente.clienteNombre || 'Cliente',
            visitas: 0,
            ordenesCompletadas: 0,
            ordenesFallidas: 0,
            rechazos: 0,
            casosGarantia: 0,
            ultimaVisitaDia: 0,
            ultimoResultado: 'sin_historial'
        };
    }
    return mapa[key] || null;
}

function calcularEstrellasFidelidadCliente(registro) {
    if (!registro) return 1;
    const visitas = Math.max(0, registro.visitas || 0);
    const completadas = Math.max(0, registro.ordenesCompletadas || 0);
    const fallidas = Math.max(0, registro.ordenesFallidas || 0);
    const rechazos = Math.max(0, registro.rechazos || 0);
    const score = (completadas * 2.2) + (visitas * 0.35) - (fallidas * 1.5) - (rechazos * 0.9);
    return Math.max(1, Math.min(5, Math.round(2.2 + (score / 4.5))));
}

function obtenerEtiquetaPerfilCliente(registro) {
    if (!registro) return 'nuevo';
    const visitas = Math.max(0, registro.visitas || 0);
    const problematico = (registro.rechazos || 0) >= 2 || (registro.ordenesFallidas || 0) >= 2;
    if (problematico) return 'problematico';
    if (visitas <= 1) return 'nuevo';
    return 'conocido';
}

function formatearEstrellas(valor) {
    const n = Math.max(1, Math.min(5, Math.round(valor || 1)));
    return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);
}

function obtenerClaveVehiculoExperiencia(vehiculo) {
    const limpio = String(vehiculo || '').trim();
    if (!limpio) return 'GEN';
    const clave = limpio.split(/\s+/)[0] || limpio;
    return clave.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || 'GEN';
}

function obtenerNivelExperienciaVehiculo(vehiculo) {
    const mapa = (experienciaVehiculoDx && typeof experienciaVehiculoDx === 'object') ? experienciaVehiculoDx : {};
    const key = obtenerClaveVehiculoExperiencia(vehiculo);
    return Math.max(0, Math.round(mapa[key] || 0));
}

function registrarExperienciaVehiculo(vehiculo, puntos) {
    if (!experienciaVehiculoDx || typeof experienciaVehiculoDx !== 'object') experienciaVehiculoDx = {};
    const key = obtenerClaveVehiculoExperiencia(vehiculo);
    const actual = Math.max(0, Math.round(experienciaVehiculoDx[key] || 0));
    experienciaVehiculoDx[key] = Math.max(0, Math.min(120, actual + Math.max(0, Math.round(puntos || 0))));
    return experienciaVehiculoDx[key];
}

function construirFichaHistorialCliente(cliente) {
    const reg = obtenerRegistroHistorialCliente(cliente, false);
    if (!reg) {
        return {
            etiqueta: 'nuevo',
            estrellas: 1,
            estrellasTexto: '★☆☆☆☆',
            visitas: 0,
            garantias: 0,
            rechazos: 0,
            resumen: 'Cliente nuevo sin historial previo en el taller.'
        };
    }
    const estrellas = calcularEstrellasFidelidadCliente(reg);
    const etiqueta = obtenerEtiquetaPerfilCliente(reg);
    const resumen = etiqueta === 'problematico'
        ? 'Cliente con historial sensible: revisa alcance, evidencia y condiciones antes de cerrar garantia.'
        : (etiqueta === 'conocido'
            ? 'Cliente conocido del taller: hay historial de visitas para comparar sintomas y decisiones previas.'
            : 'Cliente nuevo: aun no hay suficientes datos historicos para predecir comportamiento.');
    return {
        etiqueta,
        estrellas,
        estrellasTexto: formatearEstrellas(estrellas),
        visitas: Math.max(0, reg.visitas || 0),
        garantias: Math.max(0, reg.casosGarantia || 0),
        rechazos: Math.max(0, reg.rechazos || 0),
        resumen
    };
}

function registrarVisitaCliente(cliente) {
    const reg = obtenerRegistroHistorialCliente(cliente, true);
    if (!reg) return null;
    reg.nombre = cliente.personaNombre || reg.nombre || 'Cliente';
    reg.visitas = Math.max(0, reg.visitas || 0) + 1;
    reg.ultimaVisitaDia = Math.max(0, dia || 0);
    if (cliente && cliente.miniHistoriaTipo === 'garantia_falsa') {
        reg.casosGarantia = Math.max(0, reg.casosGarantia || 0) + 1;
    }
    return reg;
}

function registrarResultadoVisitaCliente(cliente, resultado, extras) {
    const reg = obtenerRegistroHistorialCliente(cliente, true);
    if (!reg) return null;
    const r = String(resultado || '').toLowerCase();
    if (r === 'completado') {
        reg.ordenesCompletadas = Math.max(0, reg.ordenesCompletadas || 0) + 1;
    } else if (r === 'fallido') {
        reg.ordenesFallidas = Math.max(0, reg.ordenesFallidas || 0) + 1;
    } else if (r === 'rechazado') {
        reg.rechazos = Math.max(0, reg.rechazos || 0) + 1;
    }
    if (extras && extras.esGarantia) {
        reg.casosGarantia = Math.max(0, reg.casosGarantia || 0) + 1;
    }
    reg.ultimoResultado = r || reg.ultimoResultado || 'seguimiento';
    reg.ultimaVisitaDia = Math.max(0, dia || reg.ultimaVisitaDia || 0);
    return reg;
}

function formatearIdCasoCliente(numero) {
    return `CASO-${String(numero).padStart(4, '0')}`;
}

function extraerCorrelativoCaso(idCaso) {
    const m = String(idCaso || '').match(/CASO-(\d{1,6})$/);
    return m ? parseInt(m[1], 10) : 0;
}

function actualizarCorrelativoDesdeCliente(cliente) {
    if (!cliente || typeof cliente !== 'object') return;
    const valor = extraerCorrelativoCaso(cliente.idCaso);
    if (valor >= correlativoCasoCliente) correlativoCasoCliente = valor + 1;
}

function generarIdCasoCliente() {
    const id = formatearIdCasoCliente(correlativoCasoCliente);
    correlativoCasoCliente += 1;
    return id;
}

function asegurarIdCasoCliente(cliente) {
    if (!cliente || typeof cliente !== 'object') return '';
    if (typeof cliente.idCaso === 'string' && cliente.idCaso.trim()) {
        actualizarCorrelativoDesdeCliente(cliente);
        return cliente.idCaso;
    }
    cliente.idCaso = generarIdCasoCliente();
    return cliente.idCaso;
}

function limpiarCasoDeColaYPendientes(idCaso) {
    var id = String(idCaso || '').trim();
    if (!id) return;
    if (Array.isArray(clientesEnEspera)) {
        clientesEnEspera = clientesEnEspera.filter(function(c) {
            return !(c && c.idCaso === id);
        });
    }
    if (Array.isArray(casosPendientesDiagnostico)) {
        casosPendientesDiagnostico = casosPendientesDiagnostico.filter(function(c) {
            return !(c && c.idCaso === id);
        });
    }
}

function actualizarCasoAtendido(cliente, estado, detalle, extras) {
    if (!cliente || typeof cliente !== 'object') return;
    if (!Array.isArray(casosAtendidos)) casosAtendidos = [];

    const idCaso = asegurarIdCasoCliente(cliente);
    if (!idCaso) return;

    const base = {
        idCaso,
        personaNombre: cliente.personaNombre || cliente.clienteNombre || 'Cliente',
        vehiculo: cliente.vehiculo || 'Vehiculo sin ficha',
        estado: estado || 'seguimiento',
        detalle: detalle || '',
        actualizadoEn: Date.now(),
        snapshot: {
            idCaso: cliente.idCaso || idCaso,
            nombre: cliente.nombre,
            personaNombre: cliente.personaNombre,
            vehiculo: cliente.vehiculo,
            fotoApariencia: cliente.fotoApariencia,
            pago: cliente.pago,
            dificultad: cliente.dificultad,
            especialidadIdeal: cliente.especialidadIdeal,
            miniHistoriaTipo: cliente.miniHistoriaTipo,
            miniHistoriaTexto: cliente.miniHistoriaTexto,
            personalidad: cliente.personalidad,
            tiempo: cliente.tiempo,
            complicaciones: Array.isArray(cliente.complicaciones) ? cliente.complicaciones.slice() : [],
            fallosPrincipales: Array.isArray(cliente.fallosPrincipales) ? cliente.fallosPrincipales.slice() : [],
            fallosAdicionalesDetectables: Array.isArray(cliente.fallosAdicionalesDetectables) ? cliente.fallosAdicionalesDetectables.slice() : [],
            diagnosticoOpciones: Array.isArray(cliente.diagnosticoOpciones) ? cliente.diagnosticoOpciones.slice() : [],
            diagnosticoSeleccionado: cliente.diagnosticoSeleccionado || '',
            diagnosticosDetectados: Array.isArray(cliente.diagnosticosDetectados) ? cliente.diagnosticosDetectados.slice() : [],
            diagnosticoDetectado: cliente.diagnosticoDetectado || '',
            diagnosticoCorrecto: !!cliente.diagnosticoCorrecto,
            diagnosticoNivel: cliente.diagnosticoNivel || 'fallo',
            diagnosticado: !!cliente.diagnosticado,
            aprobadoCliente: !!cliente.aprobacionCliente,
            aprobacionCliente: !!cliente.aprobacionCliente,
            negociado: !!cliente.negociado,
            piezaInstalada: cliente.piezaInstalada || null,
            piezasRequeridasMecanico: Array.isArray(cliente.piezasRequeridasMecanico) ? cliente.piezasRequeridasMecanico.slice() : [],
            piezasInstaladasMecanico: Array.isArray(cliente.piezasInstaladasMecanico) ? cliente.piezasInstaladasMecanico.slice() : [],
            mecanicoPendienteIdx: (typeof cliente.mecanicoPendienteIdx === 'number') ? cliente.mecanicoPendienteIdx : null,
            esVIP: !!cliente.esVIP,
            etapaVIP: cliente.etapaVIP || 1,
            inspeccion: cliente.inspeccion ? { ...cliente.inspeccion } : null,
            contradiccionActiva: !!cliente.contradiccionActiva,
            contradiccionDetectada: !!cliente.contradiccionDetectada,
            bonusHablar: cliente.bonusHablar || 0,
            ofDxSeleccionEnfoques: Array.isArray(cliente.ofDxSeleccionEnfoques) ? cliente.ofDxSeleccionEnfoques.slice() : [],
            ofDxAnalisisHecho: !!cliente.ofDxAnalisisHecho,
            ofDxAciertos: cliente.ofDxAciertos || 0,
            ofDxRuido: cliente.ofDxRuido || 0,
            ofDxConfianzaPct: cliente.ofDxConfianzaPct || 0,
            ofDxConfianzaNivel: cliente.ofDxConfianzaNivel || 'baja',
            ofDxModoResolucion: cliente.ofDxModoResolucion || 'segura',
            ofDxProbablesCausas: Array.isArray(cliente.ofDxProbablesCausas) ? cliente.ofDxProbablesCausas.slice() : [],
            ofDxSenalesDetectadas: Array.isArray(cliente.ofDxSenalesDetectadas) ? cliente.ofDxSenalesDetectadas.slice() : [],
            ofDxSenalesSeleccionadas: Array.isArray(cliente.ofDxSenalesSeleccionadas) ? cliente.ofDxSenalesSeleccionadas.slice() : [],
            ofDxUltimaPruebaFeedback: cliente.ofDxUltimaPruebaFeedback || '',
            ofDxHipotesisPrincipal: cliente.ofDxHipotesisPrincipal || '',
            ofDxHipotesisSecundaria: cliente.ofDxHipotesisSecundaria || '',
            ofDxConfianzaElegida: typeof cliente.ofDxConfianzaElegida === 'number' ? cliente.ofDxConfianzaElegida : 55,
            ofDxEstado: cliente.ofDxEstado ? JSON.parse(JSON.stringify(cliente.ofDxEstado)) : null,
            rechazosNegociacion: cliente.rechazosNegociacion || 0,
            motivoRechazoWhatsApp: cliente.motivoRechazoWhatsApp || ''
        }
    };

    if (extras && typeof extras === 'object') {
        Object.keys(extras).forEach(function(k) {
            base[k] = extras[k];
        });
    }

    const idx = casosAtendidos.findIndex(c => c && c.idCaso === idCaso);
    if (idx >= 0) {
        casosAtendidos[idx] = { ...casosAtendidos[idx], ...base };
    } else {
        casosAtendidos.unshift(base);
    }

    casosAtendidos.sort((a, b) => (b.actualizadoEn || 0) - (a.actualizadoEn || 0));
    if (casosAtendidos.length > MAX_CASOS_ATENDIDOS) {
        casosAtendidos = casosAtendidos.slice(0, MAX_CASOS_ATENDIDOS);
    }
}

function cerrarCasoPorNegociacionRechazada(motivoRechazo) {
    if (!clienteActual) return;
    if (typeof asegurarIdCasoCliente === 'function') asegurarIdCasoCliente(clienteActual);
    const idCaso = clienteActual.idCaso || 'CASO-0000';
    const nombre = clienteActual.personaNombre || 'Cliente';
    const motivo = String(motivoRechazo || clienteActual.motivoRechazoWhatsApp || 'No acepto el presupuesto final ni la contraoferta.').trim();
    if (typeof registrarResultadoVisitaCliente === 'function') {
        registrarResultadoVisitaCliente(clienteActual, 'rechazado', { esGarantia: clienteActual.miniHistoriaTipo === 'garantia_falsa' });
    }
    clienteActual.casoCerradoPorRechazo = true;

    actualizarCasoAtendido(
        clienteActual,
        'pendiente_revision',
        `Cliente rechazo cotizacion y retiro el vehiculo. Motivo: ${motivo}`
    );

    resumenDia.clientesPerdidos++;
    clientesHoy = Math.min((window.CLIENTES_POR_DIA || 10), (clientesHoy || 0) + 1);
    reputacion = Math.max(0, reputacion - 1);
    log(`Cliente retiro su vehiculo tras rechazar cotizacion: ${idCaso} | ${nombre}. Motivo: ${motivo}`, 'error');
    mostrarFeedbackGameplay(`Caso ${idCaso} perdido: cliente rechazo la cotizacion y se fue.`, 'warn');
    mostrarStamp('RECHAZADO', 'error');
    limpiarCasoDeColaYPendientes(idCaso);

    clienteActual = null;
    tiempoCliente = 0;
    estrategiaCliente = 'balanceado';
    if (clientesHoy < (window.CLIENTES_POR_DIA || 10)) asegurarDemandaEnColaSinActivar();
    if (typeof actualizarUI === 'function') actualizarUI();
}

function generarMotivoRechazoNegociacion(cliente) {
    if (!cliente || typeof cliente !== 'object') return 'No vio valor suficiente en el trabajo propuesto.';

    var personalidad = String(cliente.personalidad || 'normal').toLowerCase();
    var candidatos = [
        'El monto no le cuadra con su presupuesto actual.',
        'Dice que el riesgo todavia se ve alto para aprobar.',
        'Pide un ajuste adicional antes de dar luz verde.',
        'Siente que el trabajo esta bien planteado, pero el precio final le pega demasiado hoy.',
        'Quiere revisar otra opcion porque no ve claro el balance entre costo y beneficio.'
    ];

    if (personalidad === 'ansioso') {
        candidatos = [
            'Se siente inseguro por el tiempo de entrega y prefiere esperar.',
            'Teme quedarse sin vehiculo mas dias y no quiere cerrar aun.',
            'Dice que necesita una confirmacion mas clara antes de aprobar.',
            'Se le nota apurado: necesita una fecha firme y una ruta de trabajo simple para confiar.',
            'Le preocupa que aparezca un gasto oculto a mitad del proceso y prefiere pausar.'
        ];
    } else if (personalidad === 'desconfiado') {
        candidatos = [
            'No confia en la relacion costo/resultado del dictamen actual.',
            'Pide evidencia tecnica adicional para aceptar el presupuesto.',
            'Siente que el precio no justifica el riesgo del trabajo.',
            'Dice que sin una explicacion tecnica paso a paso no firmara la aprobacion.',
            'Entiende la falla, pero no cree que el alcance actual garantice un cierre limpio.'
        ];
    } else if (personalidad === 'confiado') {
        candidatos = [
            'Quiere un ajuste menor para cerrar de inmediato.',
            'Entiende el trabajo, pero espera una mejora en condiciones.',
            'Le falta un incentivo final para aprobar ahora.',
            'Dice que va contigo, pero pide un gesto comercial para cerrar hoy mismo.',
            'Le gusta la propuesta, aunque espera una garantia mas clara para quedarse tranquilo.'
        ];
    }

    if (cliente.miniHistoriaTipo === 'garantia_falsa') {
        candidatos.push('Insiste en garantia extendida sin costo adicional.');
        candidatos.push('Quiere incluir cobertura total de mano de obra futura sin aumento de precio.');
    }

    return candidatos[Math.floor(Math.random() * candidatos.length)] || 'No vio valor suficiente en el trabajo propuesto.';
}

function cerrarCasoPorDiagnosticoFallido() {
    if (!clienteActual) return;
    if (typeof asegurarIdCasoCliente === 'function') asegurarIdCasoCliente(clienteActual);
    const idCaso = clienteActual.idCaso || 'CASO-0000';
    const nombre = clienteActual.personaNombre || 'Cliente';
    if (typeof registrarResultadoVisitaCliente === 'function') {
        registrarResultadoVisitaCliente(clienteActual, 'fallido', { esGarantia: clienteActual.miniHistoriaTipo === 'garantia_falsa' });
    }

    actualizarCasoAtendido(
        clienteActual,
        'pendiente_revision',
        'Diagnostico fallido: cliente no aprobo y retiro el vehiculo. Caso cerrado.'
    );

    resumenDia.clientesPerdidos++;
    clientesHoy = Math.min((window.CLIENTES_POR_DIA || 10), (clientesHoy || 0) + 1);
    reputacion = Math.max(0, reputacion - 1);
    log(`Caso ${idCaso} cerrado por fallo de diagnostico. ${nombre} retiro el vehiculo.`, 'error');
    mostrarFeedbackGameplay(`CASO PERDIDO: ${idCaso}. El diagnóstico no coincidió con la falla real y el cliente retiró el vehículo. Revisa las evidencias y la causa principal antes de emitir otro dictamen.`, 'warn');
    mostrarStamp('RECHAZADO', 'error');
    limpiarCasoDeColaYPendientes(idCaso);

    clienteActual = null;
    tiempoCliente = 0;
    estrategiaCliente = 'balanceado';
    if (clientesHoy < (window.CLIENTES_POR_DIA || 10)) asegurarDemandaEnColaSinActivar();
    if (typeof actualizarUI === 'function') actualizarUI();
}

function obtenerEtiquetaSistemaInspeccion(especialidad) {
    const mapa = {
        motor: 'Motor',
        electricidad: 'Electricidad',
        transmision: 'Transmision',
        frenos: 'Frenos',
        suspension: 'Suspension'
    };
    return mapa[especialidad] || 'General';
}

function obtenerSistemaInspeccionAlterno(especialidad) {
    const alternos = {
        motor: 'Transmision',
        electricidad: 'Motor',
        transmision: 'Suspension',
        frenos: 'Suspension',
        suspension: 'Frenos'
    };
    return alternos[especialidad] || 'General';
}

function construirExpedienteInspeccion(cliente, previo) {
    const sistemaReal = obtenerEtiquetaSistemaInspeccion(cliente.especialidadIdeal);
    const sistemaDeclarado = cliente.contradiccionActiva ? obtenerSistemaInspeccionAlterno(cliente.especialidadIdeal) : sistemaReal;
    const plazoRecepcion = `${Math.max(1, Math.round(cliente.tiempo - (cliente.complicaciones.length > 1 ? 1 : 0)))}T`;
    const plazoTecnico = `${Math.max(1, Math.round(cliente.tiempo + (cliente.complicaciones.length * 0.8) + (cliente.esVIP ? 1 : 0)))}T`;
    const prioridadRecepcion = cliente.miniHistoriaTipo === 'trabajo_urgente'
        ? 'Alta'
        : (cliente.personalidad === 'ansioso' ? 'Alta' : 'Media');
    const prioridadTecnica = (cliente.esVIP || cliente.complicaciones.length > 1 || cliente.miniHistoriaTipo === 'trabajo_urgente')
        ? 'Alta'
        : 'Media';
    const riesgoRecepcion = cliente.esVIP ? 'Auditado' : (cliente.personalidad === 'desconfiado' ? 'Sensitivo' : 'Normal');
    const riesgoTecnico = cliente.complicaciones.length > 1 ? 'Compuesto' : 'Controlado';
    const objetivos = [];

    if (sistemaDeclarado !== sistemaReal) objetivos.push('sistema');
    if (plazoRecepcion !== plazoTecnico) objetivos.push('plazo');
    if (prioridadRecepcion !== prioridadTecnica) objetivos.push('prioridad');
    if (riesgoRecepcion !== riesgoTecnico) objetivos.push('riesgo');

    const docs = [
        {
            id: 'recepcion',
            titulo: 'Recepcion del cliente',
            meta: `${cliente.personaNombre} | Frente de mostrador`,
            fields: [
                { key: 'vehiculo', label: 'Vehiculo', value: cliente.vehiculo },
                { key: 'sistema', label: 'Sistema reportado', value: sistemaDeclarado },
                { key: 'plazo', label: 'Plazo prometido', value: plazoRecepcion },
                { key: 'prioridad', label: 'Prioridad hablada', value: prioridadRecepcion }
            ]
        },
        {
            id: 'orden',
            titulo: 'Orden interna',
            meta: `Caso ${cliente.esVIP ? 'VIP' : 'normal'} | Caja del taller`,
            fields: [
                { key: 'vehiculo', label: 'Vehiculo anotado', value: cliente.vehiculo },
                { key: 'sistema', label: 'Sistema anotado', value: sistemaDeclarado },
                { key: 'riesgo', label: 'Nivel de riesgo', value: riesgoRecepcion },
                { key: 'prioridad', label: 'Prioridad administrativa', value: prioridadRecepcion }
            ]
        },
        {
            id: 'escaneo',
            titulo: 'Escaneo rapido',
            meta: `Lectura de cabina | ${cliente.complicaciones.length} complicacion(es)`,
            fields: [
                { key: 'vehiculo', label: 'Vehiculo detectado', value: cliente.vehiculo },
                { key: 'sistema', label: 'Sistema tecnico', value: sistemaReal },
                { key: 'plazo', label: 'Plazo tecnico', value: plazoTecnico },
                { key: 'riesgo', label: 'Riesgo tecnico', value: riesgoTecnico },
                { key: 'prioridad', label: 'Prioridad tecnica', value: prioridadTecnica }
            ]
        }
    ];

    return {
        docs: docs,
        objetivos: objetivos,
        hallazgos: (previo && Array.isArray(previo.hallazgos)) ? previo.hallazgos : [],
        comparaciones: (previo && Array.isArray(previo.comparaciones)) ? previo.comparaciones : [],
        seleccion: (previo && Array.isArray(previo.seleccion)) ? previo.seleccion : [],
        bonus: (previo && typeof previo.bonus === 'number') ? previo.bonus : 0,
        ultimaRevision: (previo && previo.ultimaRevision) ? previo.ultimaRevision : '',
        veredicto: (previo && previo.veredicto) ? previo.veredicto : 'pendiente'
    };
}

function asegurarExpedienteInspeccion(cliente) {
    if (!cliente) return null;
    cliente.inspeccion = construirExpedienteInspeccion(cliente, cliente.inspeccion || null);
    return cliente.inspeccion;
}

function construirOpcionesDiagnosticoCliente(cliente) {
    const fallosPrincipales = Array.isArray(cliente.fallosPrincipales) ? cliente.fallosPrincipales : [cliente.nombre];
    const fallosAdicionalesDetectables = Array.isArray(cliente.fallosAdicionalesDetectables) ? cliente.fallosAdicionalesDetectables : [];
    const todosLosFallos = [...fallosPrincipales, ...fallosAdicionalesDetectables];
    const opciones = [];
    const visto = new Set();
    const diagnosticos = (window.TallerData && window.TallerData.diagnosticos) || [];

    // Agregar todos los fallos reales del cliente
    todosLosFallos.forEach(nombreFallo => {
        if (!visto.has(nombreFallo)) {
            visto.add(nombreFallo);
            opciones.push(nombreFallo);
        }
    });

    // Agregar diagnósticos del mismo sistema que los fallos principales
    const sistemas = fallosPrincipales
        .map(nombre => diagnosticos.find(d => d.nombre === nombre))
        .filter(d => d)
        .map(d => d.especialidad);
    
    const mismoSistema = diagnosticos.filter(d => 
        !visto.has(d.nombre) && 
        sistemas.includes(d.especialidad)
    );
    mismoSistema.sort(() => Math.random() - 0.5).slice(0, 2).forEach(d => {
        if (!visto.has(d.nombre)) {
            visto.add(d.nombre);
            opciones.push(d.nombre);
        }
    });

    // Agregar algunos diagnósticos aleatorios
    const resto = diagnosticos.filter(d => !visto.has(d.nombre));
    resto.sort(() => Math.random() - 0.5).slice(0, 2).forEach(d => {
        if (!visto.has(d.nombre)) {
            visto.add(d.nombre);
            opciones.push(d.nombre);
        }
    });

    return opciones.slice(0, 6);
}

function asegurarDiagnosticoJugador(cliente) {
    if (!cliente) return null;
    if (!Array.isArray(cliente.diagnosticoOpciones) || !cliente.diagnosticoOpciones.length) {
        cliente.diagnosticoOpciones = construirOpcionesDiagnosticoCliente(cliente);
    }
    if (typeof cliente.diagnosticoSeleccionado !== 'string') {
        cliente.diagnosticoSeleccionado = '';
    }
    if (!Array.isArray(cliente.diagnosticosDetectados)) {
        cliente.diagnosticosDetectados = [];
    }
    if (typeof cliente.diagnosticoNivel !== 'string') {
        cliente.diagnosticoNivel = 'pendiente';
    }
    if (cliente.ofDxModoResolucion !== 'rapida' && cliente.ofDxModoResolucion !== 'segura') {
        cliente.ofDxModoResolucion = 'segura';
    }
    if (!Array.isArray(cliente.ofDxProbablesCausas)) {
        cliente.ofDxProbablesCausas = [];
    }
    return cliente;
}

function obtenerPersonalidadCliente() {
    const personalidadesCliente = (window.TallerData && window.TallerData.personalidadesCliente) || [];
    const pool = Array.isArray(personalidadesCliente) && personalidadesCliente.length
        ? personalidadesCliente.slice()
        : ['ansioso', 'confiado', 'desconfiado'];
    if (!pool.length) return 'confiado';

    // Conserva frecuencia de perfiles clasicos sin bloquear nuevos perfiles.
    const tirada = Math.random();
    if (pool.indexOf('ansioso') >= 0 && tirada < 0.24) return 'ansioso';
    if (pool.indexOf('confiado') >= 0 && tirada < 0.47) return 'confiado';
    if (pool.indexOf('desconfiado') >= 0 && tirada < 0.69) return 'desconfiado';

    return pool[Math.floor(Math.random() * pool.length)];
}

const perfilesSocialesCliente = {
    ansioso: { confianza: 42, paciencia: 38, emocion: 'preocupado', sensibilidadPrecio: 0.35, sensibilidadTiempo: 0.92 },
    confiado: { confianza: 66, paciencia: 72, emocion: 'tranquilo', sensibilidadPrecio: 0.38, sensibilidadTiempo: 0.45 },
    desconfiado: { confianza: 30, paciencia: 54, emocion: 'alerta', sensibilidadPrecio: 0.68, sensibilidadTiempo: 0.62 },
    metodico: { confianza: 54, paciencia: 70, emocion: 'analitico', sensibilidadPrecio: 0.48, sensibilidadTiempo: 0.58 },
    impulsivo: { confianza: 45, paciencia: 32, emocion: 'impaciente', sensibilidadPrecio: 0.40, sensibilidadTiempo: 0.95 },
    tecnico: { confianza: 52, paciencia: 64, emocion: 'analitico', sensibilidadPrecio: 0.42, sensibilidadTiempo: 0.52 },
    regateador: { confianza: 40, paciencia: 58, emocion: 'cauto', sensibilidadPrecio: 0.94, sensibilidadTiempo: 0.45 },
    despistado: { confianza: 48, paciencia: 60, emocion: 'confundido', sensibilidadPrecio: 0.46, sensibilidadTiempo: 0.48 }
};

function crearEstadoSocialCliente(personalidad, historia) {
    const base = perfilesSocialesCliente[personalidad] || perfilesSocialesCliente.confiado;
    const ajusteHistoria = historia === 'frecuente' ? 12 : (historia === 'primerizo' ? -10 : 0);
    return {
        confianza: Math.max(8, Math.min(96, base.confianza + ajusteHistoria + Math.round(Math.random() * 12 - 6))),
        paciencia: Math.max(8, Math.min(96, base.paciencia + Math.round(Math.random() * 14 - 7))),
        emocion: base.emocion,
        sensibilidadPrecio: base.sensibilidadPrecio,
        sensibilidadTiempo: base.sensibilidadTiempo,
        eventos: []
    };
}

function ajustarEstadoSocialCliente(cliente, evento) {
    if (!cliente) return null;
    if (!cliente.estadoSocial) cliente.estadoSocial = crearEstadoSocialCliente(cliente.personalidad, cliente.miniHistoriaTipo);
    const social = cliente.estadoSocial;
    const cambios = {
        escucha: { confianza: 8, paciencia: 3, emocion: 'escuchado' },
        evidencia: { confianza: 7, paciencia: 0, emocion: 'informado' },
        espera: { confianza: -2, paciencia: -10, emocion: 'impaciente' },
        presupuesto: { confianza: 2, paciencia: -2, emocion: 'evaluando' },
        descuento: { confianza: 4, paciencia: 2, emocion: 'considerando' },
        aprobado: { confianza: 6, paciencia: 0, emocion: 'confiado' },
        rechazo: { confianza: -10, paciencia: -12, emocion: 'molesto' },
        entrega: { confianza: 10, paciencia: 0, emocion: 'aliviado' }
    };
    const cambio = cambios[evento] || cambios.espera;
    social.confianza = Math.max(0, Math.min(100, Math.round(social.confianza + cambio.confianza)));
    social.paciencia = Math.max(0, Math.min(100, Math.round(social.paciencia + cambio.paciencia)));
    social.emocion = cambio.emocion;
    social.eventos.push({ tipo: evento, turno: typeof turno !== 'undefined' ? turno : 0 });
    if (social.eventos.length > 6) social.eventos.shift();
    return social;
}

function obtenerTonoSocialCliente(cliente) {
    const social = cliente && cliente.estadoSocial;
    if (!social) return '';
    const mapa = {
        preocupado: 'Estoy preocupado por el carro.', alerta: 'Quiero claridad antes de seguir.',
        tranquilo: 'Confío en que lo están manejando.', analitico: 'Necesito datos para decidir.',
        impaciente: 'Necesito una respuesta concreta hoy.', cauto: 'Quiero revisar bien las condiciones.',
        confundido: 'Explícame eso de forma sencilla.', escuchado: 'Gracias por tomar en cuenta lo que noté.',
        informado: 'Con esas evidencias entiendo mejor el problema.', evaluando: 'Estoy revisando el presupuesto.',
        considerando: 'Así la propuesta se ve más razonable.', confiado: 'Perfecto, procedan con el trabajo.',
        molesto: 'No me siento cómodo con esta propuesta.', aliviado: 'Qué bueno saber que ya quedó resuelto.'
    };
    return mapa[social.emocion] || '';
}

function obtenerHistoriaCliente() {
    const arquetiposHistoriaCliente = (window.TallerData && window.TallerData.arquetiposHistoriaCliente) || [];
    if (!Array.isArray(arquetiposHistoriaCliente) || !arquetiposHistoriaCliente.length) {
        return { tipo: 'normal', texto: 'Cliente del barrio con requerimiento estandar.', ajustePago: 1 };
    }
    const principal = arquetiposHistoriaCliente[Math.floor(Math.random() * arquetiposHistoriaCliente.length)];
    if (!principal || typeof principal !== 'object') {
        return { tipo: 'normal', texto: 'Cliente del barrio con requerimiento estandar.', ajustePago: 1 };
    }
    if (arquetiposHistoriaCliente.length < 2 || Math.random() >= 0.28) return principal;

    const secundarios = arquetiposHistoriaCliente.filter(function(a) {
        return a && a !== principal && a.tipo !== principal.tipo;
    });
    if (!secundarios.length) return principal;

    const secundaria = secundarios[Math.floor(Math.random() * secundarios.length)];
    const ajusteCombinado = Math.max(0.82, Math.min(1.3, Number(principal.ajustePago || 1) * Number(secundaria.ajustePago || 1) * 0.92));
    return {
        tipo: `${principal.tipo}_mix_${secundaria.tipo}`,
        texto: `${principal.texto} Adicionalmente: ${secundaria.texto}`,
        ajustePago: ajusteCombinado
    };
}

function obtenerPerfilClientePersonalizado() {
    const clientesPersonalizados = (window.TallerData && window.TallerData.clientesPersonalizados) || [];
    if (!clientesPersonalizados.length) return null;
    return clientesPersonalizados[Math.floor(Math.random() * clientesPersonalizados.length)];
}

function obtenerNombrePersonaAleatoriaCliente() {
    if (Math.random() < 0.56 && nombresBaseCliente.length && apellidosBaseCliente.length) {
        const nombre = nombresBaseCliente[Math.floor(Math.random() * nombresBaseCliente.length)];
        const apellido = apellidosBaseCliente[Math.floor(Math.random() * apellidosBaseCliente.length)];
        return `${nombre} ${apellido}`;
    }
    return nombresFallbackCliente[Math.floor(Math.random() * nombresFallbackCliente.length)];
}

function obtenerVehiculoAleatorioCliente(preferirPremium) {
    const vehiculosCliente = (window.TallerData && window.TallerData.vehiculosCliente) || [];
    if (!Array.isArray(vehiculosCliente) || !vehiculosCliente.length) return 'Vehiculo sin ficha';
    const premium = vehiculosCliente.filter(function(v) {
        var t = String(v || '').toLowerCase();
        return t.indexOf('aegis') >= 0
            || t.indexOf('c-line') >= 0
            || t.indexOf('aster') >= 0
            || t.indexOf('atlas') >= 0
            || t.indexOf('hightrail') >= 0
            || t.indexOf('radian') >= 0
            || t.indexOf('caiman') >= 0
            || t.indexOf('summit') >= 0;
    });
    if (preferirPremium && premium.length && Math.random() < 0.7) {
        return premium[Math.floor(Math.random() * premium.length)];
    }
    return vehiculosCliente[Math.floor(Math.random() * vehiculosCliente.length)];
}

function generarDeclaracionCliente(cliente) {
    const r = Math.random();
    const claridad = r < 0.35 ? 'vago' : (r < 0.82 ? 'normal' : 'claro');
    const pistasPorEspecialidad = {
        motor: {
            principales: [
                'pierde potencia en subida y deja olor a quemado',
                'en ralenti vibra y al acelerar suena metalico',
                'cuando calienta aparece humo fino y responde tarde'
            ],
            cruces: [
                'el pedal vibra despues de exigirlo',
                'el tablero parpadea cuando cae el ralenti',
                'en segunda da un tiron corto'
            ]
        },
        electricidad: {
            principales: [
                'el tablero parpadea con carga y se cae el voltaje',
                'a veces no enciende y luego arranca sin razon clara',
                'se apagan accesorios al ralenti y vuelve de golpe'
            ],
            cruces: [
                'cuando falla deja olor a quemado',
                'en frenada larga aparece alerta de frenos',
                'al cambiar se siente un tiron que confunde con caja'
            ]
        },
        transmision: {
            principales: [
                'da tiron al pasar de primera a segunda',
                'patina en segunda cuando va con carga',
                'hace clack al meter reversa y tarda en enganchar'
            ],
            cruces: [
                'en salida vibra como si fuera motor',
                'el tablero parpadea cuando el cambio entra brusco',
                'en curva cerrada se oye golpe seco de suspension'
            ]
        },
        frenos: {
            principales: [
                'frena largo y vibra el pedal en baja',
                'desvia lateral al frenar en mojado',
                'aparece ruido metalico con discos calientes'
            ],
            cruces: [
                'despues de dos frenadas huele a quemado',
                'al soltar el freno pega tiron como si patinara',
                'en baches rebota y se siente inestable'
            ]
        },
        suspension: {
            principales: [
                'rebota excesivo en baches seguidos',
                'golpe seco en apoyo lateral y curva',
                'desgaste irregular y deriva hacia un lado'
            ],
            cruces: [
                'si frena de golpe vibra el pedal',
                'a veces suena metalico y parece motor',
                'en salida mojada parece patinar en segunda'
            ]
        },
        escape: {
            principales: [
                'sale humo irregular y se siente resonancia abajo',
                'aparece soplido metalico al acelerar en vacio',
                'huele fuerte a gases en semaforo'
            ],
            cruces: [
                'con carga pierde potencia como si fuera transmision',
                'si calienta vibra en piso y pedal',
                'a ratos el tablero marca mezcla rara'
            ]
        },
        general: {
            principales: [
                'suena raro y se pone pesado',
                'se siente inestable sin patron fijo',
                'falla por momentos y luego parece normal'
            ],
            cruces: [
                'deja olor leve a quemado',
                'en curva se siente tiron corto',
                'en frenada vibra un poco'
            ]
        }
    };
    const bloque = pistasPorEspecialidad[cliente.especialidadIdeal] || pistasPorEspecialidad.general;
    const principal = bloque.principales[Math.floor(Math.random() * bloque.principales.length)];
    const cruce = bloque.cruces[Math.floor(Math.random() * bloque.cruces.length)];
    const conectoresCruce = [
        'aunque tambien noto que',
        'pero de vez en cuando',
        'y en otra condicion'
    ];
    const conector = conectoresCruce[Math.floor(Math.random() * conectoresCruce.length)];
    const contextoAvanzado = [
        'con el motor caliente',
        'despues de 15 minutos en ruta',
        'con carga y en curva cerrada'
    ];
    const contexto = contextoAvanzado[Math.floor(Math.random() * contextoAvanzado.length)];

    let sintoma = principal;
    if (claridad === 'vago') {
        if (Math.random() < 0.45) sintoma += `, ${conector} ${cruce}`;
    } else if (claridad === 'normal') {
        sintoma += `; ${conector} ${cruce}`;
    } else {
        sintoma += `; ${contexto} ${cruce}`;
    }

    let texto = '';
    let bonus = 0;
    let prefijoPersonalidad = '';
    if (cliente.personalidad === 'ansioso') prefijoPersonalidad = 'Habla rapido, interrumpe y gesticula mucho. ';
    if (cliente.personalidad === 'confiado') prefijoPersonalidad = 'Habla tranquilo y asume que lo resolveras. ';
    if (cliente.personalidad === 'desconfiado') prefijoPersonalidad = 'Habla a la defensiva y cuestiona todo. ';
    if (cliente.personalidad === 'metodico') prefijoPersonalidad = 'Habla por pasos y te da una secuencia muy clara de sintomas. ';
    if (cliente.personalidad === 'impulsivo') prefijoPersonalidad = 'Habla acelerado y exige solucion inmediata. ';
    if (cliente.personalidad === 'tecnico') prefijoPersonalidad = 'Usa terminos tecnicos y compara lecturas del tablero. ';
    if (cliente.personalidad === 'regateador') prefijoPersonalidad = 'Habla directo y desde el inicio busca bajar el costo. ';
    if (cliente.personalidad === 'despistado') prefijoPersonalidad = 'Habla confuso y mezcla varios eventos en el tiempo. ';
    if (claridad === 'vago') {
        const vagos = [
            'Mira jefe, eso tiene algo raro... como que pfff no se explicar.',
            'Yo no se de mecanica, pero suena feo, como boom o clack por ahi.',
            'El carro ta loco, a veces bien, a veces mal, usted sabe.',
            'No tengo palabras tecnicas, pero se siente inestable y me da mala espina.',
            'A ratos responde normal y de golpe se pone pesado, como si se frenara solo.'
        ];
        texto = `${prefijoPersonalidad}${vagos[Math.floor(Math.random() * vagos.length)]} Solo te digo que ${sintoma}.`;
        bonus = -0.06;
    } else if (claridad === 'normal') {
        const normales = [
            'Te explico rapido: desde ayer empezo el problema.',
            'No soy experto, pero puedo darte los detalles basicos.',
            'Le puse atencion y note el patron.',
            'No tengo scanner, pero ya identifique en que momentos se repite la falla.',
            'El comportamiento no es constante, pero hay un patron claro cuando se calienta.'
        ];
        texto = `${prefijoPersonalidad}${normales[Math.floor(Math.random() * normales.length)]} Principalmente ${sintoma}.`;
        bonus = 0.03;
    } else {
        const claros = [
            'Te traje notas porque quiero resolverlo bien.',
            'Te dire exactamente cuando pasa para que no pierdas tiempo.',
            'Mire: hice pruebas cortas antes de venir.',
            'Anote hora, trayecto y sintomas para que el dictamen salga mas limpio.',
            'Compare dos recorridos y el fallo se repite bajo la misma carga.'
        ];
        texto = `${prefijoPersonalidad}${claros[Math.floor(Math.random() * claros.length)]} Ocurre cuando ${sintoma} y empeora con calor.`;
        bonus = 0.09;
    }

    if (cliente.contradiccionActiva) {
        texto += ' Tambien jura que nunca falla en frio, pero luego menciona que en las mananas es peor.';
    }
    texto += ` ${cliente.miniHistoriaTexto}`;

    return { claridad, texto: construirRelatoHumanoCliente(cliente, sintoma, claridad), bonus };
}

function construirRelatoHumanoCliente(cliente, sintoma, claridad) {
    const personalidad = String(cliente && cliente.personalidad || 'confiado');
    const vehiculo = String(cliente && cliente.vehiculo || 'el carro');
    const urgencia = String(cliente && cliente.urgencia || 'media');
    const historia = String(cliente && cliente.miniHistoriaTipo || 'normal');
    const aperturas = {
        ansioso: ['Jefe, disculpe que insista, pero este carro me tiene preocupado.', 'Mire, yo no quiero dejarlo asi porque me da miedo quedarme varado.'],
        confiado: ['Buenas, me lo recomendaron y por eso vine directo.', 'Yo confio en que ustedes lo pueden revisar bien.'],
        desconfiado: ['Antes de autorizar nada quiero entender que tiene y por que.', 'Vengo de otro taller y no quiero que me cambien piezas por probar.'],
        metodico: ['Le cuento el orden exacto en que me paso para que no pierdan tiempo.', 'Anote dos momentos en que se repite la falla.'],
        impulsivo: ['Necesito que me hablen claro porque no puedo dejar el carro parado mucho tiempo.', 'Vine sin cita porque esto me agarro de golpe.'],
        tecnico: ['Traje lo que pude observar para que crucen los sintomas con el diagnostico.', 'No quiero adivinar: prefiero que midan y me expliquen el resultado.'],
        regateador: ['Quiero resolverlo, pero primero digame que es imprescindible y que puede esperar.', 'Hableme claro con el costo antes de que desmonten nada.'],
        despistado: ['No se explicarlo perfecto, pero le voy a decir lo que recuerdo.', 'Puede que mezcle los momentos, pero el cambio se nota bastante.']
    };
    const razones = {
        frecuente: 'Ya he venido antes y me gustaria seguir trayendolo aqui.',
        garantia_falsa: 'Lo unico que no quiero es pagar dos veces por el mismo problema.',
        trabajo_urgente: 'Lo uso para trabajar, asi que cada hora parado me complica el dia.',
        primerizo: 'Es la primera vez que lo traigo y quiero salir de aqui tranquilo.',
        docente_escuela_mecanica: 'Lo necesito confiable porque lo usa mas de una persona.',
        normal: 'Prefiero resolverlo antes de que se convierta en algo mas caro.'
    };
    const detalle = claridad === 'claro'
        ? `Lo que tengo claro es esto: ${sintoma}.`
        : (claridad === 'vago' ? `No se si se relaciona, pero siento que ${sintoma}.` : `He notado que ${sintoma}.`);
    const cierre = urgencia === 'alta'
        ? 'Si pueden, denme un estimado de tiempo antes de que avance el dia.'
        : (personalidad === 'regateador' ? 'Si me explican el alcance, vemos como lo resolvemos.' : 'Avíseme primero que encontraron y decidimos el siguiente paso.');
    const apertura = (aperturas[personalidad] || aperturas.confiado);
    let relato = `${apertura[Math.floor(Math.random() * apertura.length)]} Es mi ${vehiculo}. ${detalle} ${(razones[historia] || razones.normal)} ${cierre}`;
    if (cliente && cliente.contradiccionActiva) {
        relato += ' Ah, y ahora que lo pienso, una manana tambien lo hizo en frio; no se si eso ayude.';
    }
    return relato.replace(/\s+/g, ' ').trim();
}

// Plantillas de demanda: cada caso tiene un propósito de juego reconocible.
const plantillasCasoProcedural = [
    { id: 'express', etiqueta: 'Servicio express', peso: 28, fallos: [1, 1], extras: [0, 1], complicaciones: [1, 1], pago: 1.04, urgencia: 'baja', paciencia: 0.84 },
    { id: 'mantenimiento', etiqueta: 'Mantenimiento preventivo', peso: 24, fallos: [1, 2], extras: [0, 1], complicaciones: [1, 2], pago: 1.10, urgencia: 'media', paciencia: 0.76 },
    { id: 'diagnostico', etiqueta: 'Avería intermitente', peso: 22, fallos: [1, 2], extras: [1, 2], complicaciones: [2, 2], pago: 1.18, urgencia: 'media', paciencia: 0.66 },
    { id: 'urgente', etiqueta: 'Emergencia de carretera', peso: 16, fallos: [1, 2], extras: [0, 1], complicaciones: [2, 3], pago: 1.32, urgencia: 'alta', paciencia: 0.48 },
    { id: 'flota', etiqueta: 'Unidad de trabajo', peso: 7, fallos: [2, 3], extras: [1, 2], complicaciones: [2, 3], pago: 1.28, urgencia: 'alta', paciencia: 0.58 },
    { id: 'premium', etiqueta: 'Cliente premium', peso: 3, fallos: [2, 3], extras: [1, 3], complicaciones: [2, 3], pago: 1.55, urgencia: 'media', paciencia: 0.72 }
];

function elegirEnteroProcedural(rango) {
    const min = Math.max(0, Math.round((rango && rango[0]) || 0));
    const max = Math.max(min, Math.round((rango && rango[1]) || min));
    return min + Math.floor(Math.random() * (max - min + 1));
}

function seleccionarPlantillaCasoProcedural(nivel, diaActual) {
    const pesos = plantillasCasoProcedural.map(function(plantilla) {
        let peso = plantilla.peso;
        if (plantilla.id === 'express' && nivel <= 2) peso += 16;
        if (plantilla.id === 'urgente' && (nivel >= 3 || diaActual >= 3)) peso += 6;
        if (plantilla.id === 'flota' && (nivel >= 4 || diaActual >= 5)) peso += 5;
        if (plantilla.id === 'premium' && (nivel >= 5 || diaActual >= 8)) peso += 7;
        return { plantilla: plantilla, peso: peso };
    });
    let tiro = Math.random() * pesos.reduce(function(suma, item) { return suma + item.peso; }, 0);
    for (let i = 0; i < pesos.length; i++) {
        tiro -= pesos[i].peso;
        if (tiro <= 0) return pesos[i].plantilla;
    }
    return plantillasCasoProcedural[0];
}

function clasificarVehiculoProcedural(vehiculo) {
    const texto = String(vehiculo || '').toLowerCase();
    if (texto.includes('stallion') || texto.includes('proyecto')) return 'proyecto';
    if (texto.includes('combi') || texto.includes('t-200') || texto.includes('mesa') || texto.includes('hightrail')) return 'trabajo';
    if (texto.includes('aegis') || texto.includes('c-line') || texto.includes('aster') || texto.includes('atlas') || texto.includes('radian') || texto.includes('caiman') || texto.includes('summit')) return 'premium';
    return 'particular';
}

function construirFichaVehiculoProcedural(vehiculo) {
    const texto = String(vehiculo || 'Vehiculo sin ficha');
    const anioMatch = texto.match(/(19|20)\d{2}/);
    const anio = anioMatch ? Number(anioMatch[0]) : 2014;
    const antiguedad = Math.max(1, new Date().getFullYear() - anio);
    const clase = clasificarVehiculoProcedural(texto);
    const usoPorClase = {
        particular: 'uso familiar',
        trabajo: 'uso comercial',
        premium: 'uso ejecutivo',
        proyecto: 'restauracion'
    };
    const desgasteBase = clase === 'trabajo' ? 18 : (clase === 'proyecto' ? 24 : 10);
    const desgaste = Math.max(8, Math.min(94, Math.round(desgasteBase + antiguedad * 2.2 + Math.random() * 16)));
    const calidadObjetivo = clase === 'premium' || clase === 'proyecto'
        ? 'premium'
        : (desgaste >= 60 ? 'estandar' : 'basica');
    return {
        modelo: texto,
        anio: anio,
        antiguedad: antiguedad,
        clase: clase,
        uso: usoPorClase[clase] || 'uso mixto',
        desgaste: desgaste,
        calidadObjetivo: calidadObjetivo,
        factorRepuesto: clase === 'premium' ? 1.24 : (clase === 'proyecto' ? 1.34 : (clase === 'trabajo' ? 1.12 : 1))
    };
}

function crearClienteAleatorio() {

        const td = window.TallerData || {};
        const diagnosticos = td.diagnosticos || [];
        const complicaciones = td.complicaciones || [];
        const arquetiposHistoriaCliente = td.arquetiposHistoriaCliente || [];
        const vehiculosCliente = td.vehiculosCliente || [];
        const personalidadesCliente = td.personalidadesCliente || [];
        const clientesPersonalizados = td.clientesPersonalizados || [];

        // Validación de datos esenciales
        if (!Array.isArray(diagnosticos) || diagnosticos.length === 0) {
            mostrarErrorGeneracionCliente('No hay diagnósticos cargados. Revisa client-data.js.');
            return null;
        }
        if (!Array.isArray(complicaciones)) {
            mostrarErrorGeneracionCliente('No hay complicaciones cargadas.');
            return null;
        }
        if (!Array.isArray(personalidadesCliente) || personalidadesCliente.length === 0) {
            mostrarErrorGeneracionCliente('No hay personalidades de cliente cargadas.');
            return null;
        }

        function mostrarErrorGeneracionCliente(msg) {
            let debugDiv = document.createElement('div');
            debugDiv.className = 'debug-error-generar-cliente';
            debugDiv.style.position = 'fixed';
            debugDiv.style.top = '60px';
            debugDiv.style.left = '16px';
            debugDiv.style.background = 'rgba(180,0,0,0.92)';
            debugDiv.style.color = '#fff';
            debugDiv.style.padding = '12px 18px';
            debugDiv.style.zIndex = '9999';
            debugDiv.style.fontSize = '1.1em';
            debugDiv.style.borderRadius = '8px';
            debugDiv.innerText = 'ERROR generando cliente: ' + msg;
            document.body.appendChild(debugDiv);
            setTimeout(function(){
                if(debugDiv && debugDiv.parentNode) debugDiv.parentNode.removeChild(debugDiv);
            }, 6000);
        }

    // Valores por defecto seguros para variables globales si aún no han inicializado
    const _reputacion = typeof reputacion !== 'undefined' ? reputacion : 50;
    const _mejoras = (typeof mejoras !== 'undefined' && mejoras !== null) ? mejoras : { publicidad: 0, maquinaDiagnosis: false, capacitacion: 0 };
    const _tallerNivel = typeof tallerNivel !== 'undefined' ? tallerNivel : 1;
    const _multiplicadorPagoDiario = typeof multiplicadorPagoDiario !== 'undefined' ? multiplicadorPagoDiario : 1;
    const _dia = typeof dia !== 'undefined' ? dia : 1;

    // Obtener nivel actual del jugador
    let nivel = (typeof obtenerNivelProgresionActual === 'function') ? obtenerNivelProgresionActual() : 1;

    // Usar la función dinámica para el caso principal
    let base = (typeof seleccionarDiagnosticoPorNivel === 'function')
        ? seleccionarDiagnosticoPorNivel(nivel)
        : (diagnosticos[Math.floor(Math.random() * diagnosticos.length)] || {});

    // Generar 1-3 fallos principales (el primero siempre el dinámico por nivel)
    const plantillaCaso = seleccionarPlantillaCasoProcedural(nivel, _dia);
    // La interfaz permite principal + secundaria; nunca generes un tercer
    // fallo obligatorio que el jugador no pueda declarar.
    const numFallosPrincipales = Math.min(2, elegirEnteroProcedural(plantillaCaso.fallos));
    const fallosPrincipales = [base.nombre];
    const visto = new Set([base.nombre]);
    for (let i = 1; i < numFallosPrincipales; i++) {
        let fallo = (typeof seleccionarDiagnosticoPorNivel === 'function')
            ? seleccionarDiagnosticoPorNivel(nivel)
            : diagnosticos[Math.floor(Math.random() * diagnosticos.length)];
        let intentos = 0;
        while (fallo && visto.has(fallo.nombre) && intentos < 20) {
            fallo = diagnosticos[Math.floor(Math.random() * diagnosticos.length)];
            intentos += 1;
        }
        if (!fallo) continue;
        visto.add(fallo.nombre);
        fallosPrincipales.push(fallo.nombre);
    }

    // Generar 0-2 fallos adicionales detectables (por profundidad de diagnóstico)
    const numFallosAdicionales = elegirEnteroProcedural(plantillaCaso.extras);
    const fallosAdicionalesDetectables = [];
    for (let i = 0; i < numFallosAdicionales; i++) {
        let fallo = (typeof seleccionarDiagnosticoPorNivel === 'function')
            ? seleccionarDiagnosticoPorNivel(nivel)
            : diagnosticos[Math.floor(Math.random() * diagnosticos.length)];
        while (fallo && visto.has(fallo.nombre)) {
            fallo = diagnosticos[Math.floor(Math.random() * diagnosticos.length)];
        }
        if (!fallo) continue;
        visto.add(fallo.nombre);
        fallosAdicionalesDetectables.push(fallo.nombre);
    }

    // Curva de progresión tycoon: los primeros días enseñan con trabajos
    // accesibles; después aparecen reparaciones profundas y mejor pagadas.
    const progresoTaller = Math.min(1, Math.max(0, ((_dia - 1) / 24) + ((_tallerNivel - 1) * 0.08)));
    const complejidadDia = Math.min(0.35, _dia * 0.02) + (progresoTaller * 0.08);
    const dificultadExtra = Math.random() * complejidadDia;
    const complicacionCount = Math.min(
        complicaciones.length,
        elegirEnteroProcedural(plantillaCaso.complicaciones) + (Math.random() < complejidadDia ? 1 : 0)
    );
    const listaComplicaciones = [...complicaciones].sort(() => Math.random() - 0.5).slice(0, complicacionCount);
    const factorDiaDinero = Math.min(1.30, 0.88 + (_dia * 0.025) + (progresoTaller * 0.16));
    let pago = (base.pagoBase + (_reputacion * 2.2) + (((_mejoras && _mejoras.publicidad) || 0) * 70)) * _multiplicadorPagoDiario * factorDiaDinero;
    const esVIP = plantillaCaso.id === 'premium' || (_dia >= 8 && Math.random() < (0.12 + progresoTaller * 0.20));
    const personalidad = obtenerPersonalidadCliente();
    const historia = obtenerHistoriaCliente();
    const perfilPersonalizado = obtenerPerfilClientePersonalizado();
    const esCasoTop = plantillaCaso.id === 'premium' || ((base.pagoBase || 0) >= 2600);
    const vehiculoElegido = obtenerVehiculoAleatorioCliente(esCasoTop || esVIP || plantillaCaso.id === 'flota');
    let pagoFinal = Math.max(750, Math.round(pago * plantillaCaso.pago * (esVIP ? 1.42 : 1) * (esCasoTop ? 1.16 : 1) * historia.ajustePago));
    const contradiccionActiva = Math.random() < (personalidad === 'ansioso' ? 0.35 : 0.22);
    const cliente = {
        idCaso: generarIdCasoCliente(),
        nombre: base.nombre,
        fallosPrincipales: fallosPrincipales,
        fallosAdicionalesDetectables: fallosAdicionalesDetectables,
        personaNombre: (perfilPersonalizado && perfilPersonalizado.nombre) || obtenerNombrePersonaAleatoriaCliente(),
        vehiculo: vehiculoElegido,
        claseVehiculo: clasificarVehiculoProcedural(vehiculoElegido),
        fichaVehiculo: construirFichaVehiculoProcedural(vehiculoElegido),
        tipoCaso: plantillaCaso.id,
        etiquetaCaso: plantillaCaso.etiqueta,
        urgencia: plantillaCaso.urgencia,
        semillaProcedural: `${plantillaCaso.id}-${_dia}-${Date.now().toString(36)}-${Math.floor(Math.random() * 999)}`,
        especialidadIdeal: base.especialidad,
        dificultad: Math.max(0.20, Math.min(0.98, base.dificultad + dificultadExtra + (progresoTaller * 0.06) - (_mejoras.maquinaDiagnosis ? 0.1 : 0) - ((_mejoras.capacitacion || 0) * 0.05) - ((_tallerNivel - 1) * 0.03))),
        pago: pagoFinal,
        tiempo: base.tiempo,
        paciencia: Math.random() < plantillaCaso.paciencia && Math.random() > (0.16 + (dificultadExtra * 0.22)),
        complicaciones: listaComplicaciones,
        diagnosticado: false,
        diagnosticoCorrecto: false,
        diagnosticoDetectado: 'No realizado',
        negociado: false,
        aprobacionCliente: false,
        esVIP: esVIP,
        esCasoTop: esCasoTop,
        etapaVIP: 1,
        piezaVIPComprada: false,
        pacienciaCola: 100,
        ticksEnCola: 0,
        penalizacionAplicada: false,
        habloConCliente: false,
        entrevistasHechas: 0,
        claridadExplicacion: 'normal',
        declaracionCliente: '',
        bonusHablar: 0,
        rechazosNegociacion: 0,
        motivoRechazoWhatsApp: '',
        fotoApariencia: (perfilPersonalizado && perfilPersonalizado.foto) ? perfilPersonalizado.foto : '',
        personalidad: personalidad,
        miniHistoriaTipo: historia.tipo,
        miniHistoriaTexto: (perfilPersonalizado && perfilPersonalizado.historia)
            ? `${perfilPersonalizado.historia} ${historia.texto}`
            : historia.texto,
        contradiccionActiva: contradiccionActiva,
        contradiccionDetectada: false,
        bonusContradiccion: 0,
        ofDxModoResolucion: 'segura',
        ofDxProbablesCausas: []
    };
    // Firma estable del problema, independiente del ID y de la hora de creación.
    // Evita repetir la misma combinación narrativa/técnica durante la partida.
    const firmaCaso = [
        cliente.tipoCaso,
        cliente.especialidadIdeal,
        cliente.fallosPrincipales.slice().sort().join('|'),
        cliente.fallosAdicionalesDetectables.slice().sort().join('|'),
        cliente.vehiculo,
        cliente.personalidad,
        cliente.miniHistoriaTipo
    ].map(function(v) { return String(v || '').trim().toLowerCase(); }).join('::');
    if (!Array.isArray(casosFirmasUsadas)) casosFirmasUsadas = [];
    if (casosFirmasUsadas.indexOf(firmaCaso) >= 0) {
        return crearClienteAleatorio();
    }
    cliente.firmaProcedural = firmaCaso;
    casosFirmasUsadas.push(firmaCaso);
    if (casosFirmasUsadas.length > 500) casosFirmasUsadas = casosFirmasUsadas.slice(-500);
    cliente.estadoSocial = crearEstadoSocialCliente(personalidad, historia.tipo);
    const declaracion = generarDeclaracionCliente(cliente);
    cliente.claridadExplicacion = declaracion.claridad;
    cliente.declaracionCliente = declaracion.texto;
    cliente.bonusHablar = declaracion.bonus;
    if (esVIP) cliente.complicaciones.push('Protocolo VIP con auditoria final');
    if (esCasoTop) cliente.complicaciones.push('Caso top de alto valor con tolerancia tecnica minima');
    registrarVisitaCliente(cliente);
    cliente.historialCliente = construirFichaHistorialCliente(cliente);
    asegurarExpedienteInspeccion(cliente);
    asegurarDiagnosticoJugador(cliente);

    // Segmentación de cliente y complejidad del trabajo (usados en UI y teléfono)
    cliente.segmento = (esVIP || esCasoTop || pagoFinal >= 2500) ? 'premium' : (pagoFinal >= 1400 ? 'medio' : 'bajo');
    cliente.complejidad = (listaComplicaciones.length >= 2 || cliente.dificultad >= 0.65)
        ? 'complejo'
        : (cliente.dificultad >= 0.42 ? 'medio' : 'simple');

    if (typeof aplicarRitmoTallerACliente === 'function') {
        aplicarRitmoTallerACliente(cliente);
    }

    return cliente;
}

function crearClienteRetornoEncadenadoDesdeReparacion(rep) {
    if (!rep || typeof rep !== 'object') return null;
    const diagnosticos = (window.TallerData && window.TallerData.diagnosticos) || [];
    const catalogo = (window.TallerData && window.TallerData.diagnosticos) || diagnosticos || [];
    if (!Array.isArray(catalogo) || !catalogo.length) return null;

    const especialidad = rep.especialidadIdeal || 'motor';
    const baseEspecialidad = catalogo.filter(function(d) { return d && d.especialidad === especialidad; });
    const fallback = catalogo.filter(function(d) { return !!d; });
    const pool = baseEspecialidad.length ? baseEspecialidad : fallback;
    const principal = pool[Math.floor(Math.random() * pool.length)];
    if (!principal) return null;

    const adicionales = catalogo
        .filter(function(d) { return d && d.nombre !== principal.nombre; })
        .sort(function() { return Math.random() - 0.5; })
        .slice(0, 1)
        .map(function(d) { return d.nombre; });

    const cliente = {
        idCaso: generarIdCasoCliente(),
        nombre: principal.nombre,
        fallosPrincipales: [principal.nombre],
        fallosAdicionalesDetectables: adicionales,
        personaNombre: rep.personaNombre || rep.clienteNombre || obtenerNombrePersonaAleatoriaCliente(),
        vehiculo: rep.vehiculo || obtenerVehiculoAleatorioCliente(false),
        especialidadIdeal: principal.especialidad,
        dificultad: Math.max(0.35, Math.min(0.92, (principal.dificultad || 0.55) + 0.08)),
        pago: Math.max(700, Math.round((principal.pagoBase || 1200) * 0.78)),
        tiempo: Math.max(3, Math.round((rep.tiempoTotal || 4) * 0.9)),
        paciencia: true,
        complicaciones: ['falla encadenada por desgaste previo'],
        diagnosticado: false,
        diagnosticoCorrecto: false,
        diagnosticoDetectado: 'No realizado',
        negociado: false,
        aprobacionCliente: false,
        esVIP: false,
        etapaVIP: 1,
        piezaVIPComprada: false,
        pacienciaCola: 86,
        ticksEnCola: 0,
        penalizacionAplicada: false,
        habloConCliente: false,
        entrevistasHechas: 0,
        claridadExplicacion: 'normal',
        declaracionCliente: `Volvio el vehiculo ${rep.vehiculo || ''}: ahora presenta una falla encadenada despues de la reparacion del caso ${rep.idCaso || 'previo'}.`,
        bonusHablar: 0.04,
        rechazosNegociacion: 0,
        motivoRechazoWhatsApp: '',
        fotoApariencia: '',
        personalidad: 'desconfiado',
        miniHistoriaTipo: 'retorno_encadenado',
        miniHistoriaTexto: `Cliente retorna por falla encadenada del caso ${rep.idCaso || 'previo'}.`,
        contradiccionActiva: false,
        contradiccionDetectada: false,
        bonusContradiccion: 0,
        ofDxModoResolucion: 'segura',
        ofDxProbablesCausas: []
    };

    registrarVisitaCliente(cliente);
    cliente.historialCliente = construirFichaHistorialCliente(cliente);
    asegurarExpedienteInspeccion(cliente);
    asegurarDiagnosticoJugador(cliente);
    const declaracion = generarDeclaracionCliente(cliente);
    cliente.claridadExplicacion = declaracion.claridad;
    cliente.declaracionCliente = declaracion.texto;
    cliente.bonusHablar = declaracion.bonus;
    if (typeof aplicarRitmoTallerACliente === 'function') {
        aplicarRitmoTallerACliente(cliente);
    }
    return cliente;
}

function obtenerNombreVisibleCliente(cliente, revelar = false) {
    if (!cliente) return 'Cliente';
    if (revelar || cliente.diagnosticado) return cliente.nombre;
    return 'Averia no identificada';
}

function activarClienteDesdeCola() {
    if (typeof estaCupoDiarioCompleto === 'function' && estaCupoDiarioCompleto((window.reparacionesActivas || []).length)) return false;
    if (!window.clientesEnEspera) window.clientesEnEspera = [];
    if (clienteActual || !window.clientesEnEspera.length) return false;
    clienteActual = window.clientesEnEspera.shift();
    marcarOrigenCasoActivo(clienteActual, "mi-puesto");
    asegurarIdCasoCliente(clienteActual);
    aplicarBonoDiagnosticoSiguienteCaso(clienteActual);
    asegurarDiagnosticoJugador(clienteActual);
    if (typeof asegurarExpedienteInspeccion === "function") asegurarExpedienteInspeccion(clienteActual);
    if (typeof ofDxAsegurarEstadoCaso === "function") ofDxAsegurarEstadoCaso(clienteActual);
    tiempoCliente = Math.max(4, Math.round(12 * (clienteActual.pacienciaCola / 100)));
    estrategiaCliente = 'balanceado';
    const nombreVisible = obtenerNombreVisibleCliente(clienteActual);
    log(`Cliente de cola entra al frente: ${nombreVisible}${clienteActual.esVIP ? ' (VIP)' : ''}.`, 'info');
    mostrarFeedbackGameplay(`Cliente al frente: ${nombreVisible}${clienteActual.esVIP ? ' (VIP)' : ''}.`, 'ok');
    return true;
}

function generarCliente() {
    if (typeof estaCupoDiarioCompleto === 'function' && estaCupoDiarioCompleto((window.reparacionesActivas || []).length)) {
        return false;
    }
    // Todo caso nuevo entra primero a Cola. Mi Puesto solo se activa
    // mediante una selección explícita del jugador.
    return typeof generarClienteEnCola === 'function' ? generarClienteEnCola() : false;
}

function generarClienteEnCola() {
    var trabajoDueno = typeof obtenerTrabajoDuenoActivo === 'function' ? obtenerTrabajoDuenoActivo() : null;
    var bahias = Math.max(1, Math.round(typeof espaciosReparacionMax === 'number' ? espaciosReparacionMax : 1));
    if (trabajoDueno && bahias <= 1) return false;
    var casosCerrados = (resumenCasos && Number(resumenCasos.totalCasosJugados)) || 0;
    if (casosCerrados < 1) {
        var flujoInicialOcupado = !!window.clienteActual
            || (window.clientesEnEspera || []).length >= 1
            || (window.casosPendientesDiagnostico || []).length >= 1
            || (window.reparacionesActivas || []).length >= 1;
        if (flujoInicialOcupado) return false;
    }
    if (typeof estaCupoDiarioCompleto === 'function' && estaCupoDiarioCompleto((window.reparacionesActivas || []).length)) return false;
        if ((window.clientesEnEspera || []).length >= (window.maxColaEspera || 5)) return false;

        const nuevoCliente = crearClienteAleatorio();
        if (!window.clientesEnEspera) window.clientesEnEspera = [];
        clientesEnEspera.push(nuevoCliente);
        const nombreVisible = obtenerNombreVisibleCliente(nuevoCliente);
        log(`Cliente llega a cola: ${nombreVisible}${nuevoCliente.esVIP ? ' (VIP)' : ''}${nuevoCliente.casoCaliente ? ' | caliente' : ''}${nuevoCliente.cadenaEspecialidadActiva ? ' | cadena' : ''}.`, 'info');
        // (debug visual removido)
        return true;
}

// La demanda puede llegar sola, pero el expediente solo se abre cuando el
// jugador toca una tarjeta de Cola. Evita que Mi puesto tome un caso nuevo.
function asegurarDemandaEnColaSinActivar() {
    var trabajoDueno = typeof obtenerTrabajoDuenoActivo === 'function' ? obtenerTrabajoDuenoActivo() : null;
    var bahias = Math.max(1, Math.round(typeof espaciosReparacionMax === 'number' ? espaciosReparacionMax : 1));
    if (trabajoDueno && bahias <= 1) return false;
    if (clienteActual) return false;
    if ((window.clientesEnEspera || []).length || (window.casosPendientesDiagnostico || []).length) return false;
    if (typeof estaCupoDiarioCompleto === 'function' && estaCupoDiarioCompleto((window.reparacionesActivas || []).length)) return false;
    if (generarClienteEnCola()) return true;
    var nuevoCliente = crearClienteAleatorio();
    if (!nuevoCliente) return false;
    if (!window.clientesEnEspera) window.clientesEnEspera = [];
    clientesEnEspera.push(nuevoCliente);
    log(`Nueva solicitud en cola: ${obtenerNombreVisibleCliente(nuevoCliente)}.`, 'info');
    return true;
}

function intentarLlegadaClienteEnEspera() {
    if (typeof estaCupoDiarioCompleto === 'function' && estaCupoDiarioCompleto((window.reparacionesActivas || []).length)) return;
    if ((window.clientesEnEspera || []).length >= (window.maxColaEspera || 5)) return;
    const _mejoras = (typeof mejoras !== 'undefined' && mejoras !== null) ? mejoras : { publicidad: 0, maquinaDiagnosis: false, capacitacion: 0 };
    if (Math.random() < (0.04 + (_mejoras.publicidad * 0.015))) {
        const c = crearClienteAleatorio();
        if (!window.clientesEnEspera) window.clientesEnEspera = [];
        clientesEnEspera.push(c);
        log(`Llega cliente y queda en cola: ${obtenerNombreVisibleCliente(c)}${c.esVIP ? ' (VIP)' : ''}.`, 'info');
    }
}

function hablarConCliente(mostrarModalCliente = true) {
    if (!clienteActual) {
        log('No hay cliente para hablar.', 'error');
        return;
    }
    if (clienteActual.entrevistasHechas >= 2) {
        document.getElementById('cliente-explicacion-texto').innerText = clienteActual.declaracionCliente;
        document.getElementById('cliente-explicacion-meta').innerText = `Personalidad: ${clienteActual.personalidad.toUpperCase()} | Entrevistas: 2/2`;
        if (mostrarModalCliente) abrirModal('cliente');
        return;
    }

    const segunda = clienteActual.entrevistasHechas === 1;
    if (!consumirFoco('hablarCliente')) return;
    if (segunda && !consumirFoco('hablarCliente')) return;

    clienteActual.habloConCliente = true;
    clienteActual.entrevistasHechas += 1;

    if (segunda) {
        const bonusManual = (mejorasTacticas && mejorasTacticas.manualHablar) ? 0.03 : 0;
        clienteActual.bonusHablar += (0.05 + bonusManual);
        clienteActual.declaracionCliente += ' En una segunda vuelta agrega detalles de cuando falla con carga y en curva cerrada.';
        if (bonusManual > 0) {
            clienteActual.declaracionCliente += ' Ademas especifica cuando aparece el fallo en caliente y bajo esfuerzo.';
        }
        log('Segunda entrevista completada: mas precision para el diagnostico.', 'exito');
        consumirTurno('segunda entrevista cliente', COSTOS_TURNO.hablarCliente + 1);
    } else {
        const bonusManualPrimera = (mejorasTacticas && mejorasTacticas.manualHablar) ? 0.02 : 0;
        if (bonusManualPrimera > 0) clienteActual.bonusHablar += bonusManualPrimera;
        if (clienteActual.claridadExplicacion === 'vago') {
            tiempoCliente = Math.max(0, tiempoCliente - 1);
            log('Cliente hablo, pero fue muy vago. Perdiste algo de tiempo.', 'error');
        } else if (clienteActual.claridadExplicacion === 'claro') {
            log('Cliente dio una explicacion clara. Mejor contexto para diagnostico.', 'exito');
        } else {
            log('Cliente aporto pistas utiles, aunque incompletas.', 'info');
        }
        consumirTurno('hablar con cliente', COSTOS_TURNO.hablarCliente);
    }

    const socialEntrevista = ajustarEstadoSocialCliente(clienteActual, 'escucha');
    document.getElementById('cliente-explicacion-texto').innerText = `${clienteActual.declaracionCliente} ${obtenerTonoSocialCliente(clienteActual)}`;
    document.getElementById('cliente-explicacion-meta').innerText = `Personalidad: ${clienteActual.personalidad.toUpperCase()} | Emocion: ${(socialEntrevista && socialEntrevista.emocion) || 'neutral'} | Confianza: ${(socialEntrevista && socialEntrevista.confianza) || 0}% | Entrevistas: ${clienteActual.entrevistasHechas}/2`;
    if (mostrarModalCliente) abrirModal('cliente');
}

function seleccionarDiagnosticoJugador(nombre) {
    if (!clienteActual) {
        log('No hay cliente activo para diagnosticar.', 'error');
        return;
    }
    if (clienteActual.diagnosticado) {
        log('Ese caso ya tiene diagnostico emitido.', 'info');
        return;
    }
    asegurarDiagnosticoJugador(clienteActual);
    
    // Toggle: si ya está en la lista, remover; si no, agregar
    const idx = clienteActual.diagnosticosDetectados.indexOf(nombre);
    if (idx >= 0) {
        clienteActual.diagnosticosDetectados.splice(idx, 1);
    } else {
        clienteActual.diagnosticosDetectados.push(nombre);
    }
    
    // Mantener diagnosticoSeleccionado para compatibilidad (el primero detectado o vacío)
    clienteActual.diagnosticoSeleccionado = clienteActual.diagnosticosDetectados.length > 0 
        ? clienteActual.diagnosticosDetectados[0] 
        : '';
    
    actualizarUI();
}

function construirMotivosDiagnosticoFallido(cliente, contexto) {
    if (!cliente || typeof cliente !== 'object') {
        return ['No se encontro contexto suficiente del caso para validar el dictamen.'];
    }

    var ctx = contexto && typeof contexto === 'object' ? contexto : {};
    var motivos = [];
    var entrevistas = Math.max(0, cliente.entrevistasHechas || 0);
    var hallazgos = (cliente.inspeccion && Array.isArray(cliente.inspeccion.hallazgos))
        ? cliente.inspeccion.hallazgos.length
        : 0;
    var enfoques = Array.isArray(cliente.ofDxSeleccionEnfoques) ? cliente.ofDxSeleccionEnfoques.length : 0;
    var rondas = Math.max(0, Math.round(cliente.ofDxRondasAnalisis || 0));

    if (entrevistas < 1) {
        motivos.push('No realizaste entrevista inicial del cliente antes de cerrar el dictamen.');
    }
    if (hallazgos < 1) {
        motivos.push('No registraste hallazgos de inspeccion para respaldar el diagnostico.');
    }
    if (enfoques < 1) {
        motivos.push('Debes definir una hipotesis tecnica activa antes de emitir.');
    }
    if (rondas < 2) {
        motivos.push('Debes completar al menos 2 rondas de analisis tecnico antes de emitir.');
    }
    if (cliente.ofDxAnalisisHecho === false) {
        motivos.push('Falto ejecutar analisis tecnico del caso (OBD, ruta o historial).');
    }
    if (ctx.falloPorErrorHumano) {
        motivos.push(`El pulso del dictamen fallo por confianza baja (${ctx.confianzaPct || 0}%).`);
    }
    if (ctx.seleccionNoCoincideSugerencia && (ctx.confianzaPct || 0) < 70) {
        motivos.push('La causa seleccionada no coincidio con la sugerencia tecnica de mayor evidencia.');
    }
    var fallosPrincipales = Array.isArray(cliente.fallosPrincipales) && cliente.fallosPrincipales.length
        ? cliente.fallosPrincipales
        : [cliente.nombre];
    var detectados = Array.isArray(cliente.diagnosticosDetectados) ? cliente.diagnosticosDetectados : [];
    if (detectados.length && !fallosPrincipales.every(function(f) { return detectados.indexOf(f) >= 0; })) {
        motivos.push('Falto cubrir una o mas fallas principales reales del vehiculo.');
    }

    if (!motivos.length) {
        motivos.push('El caso quedo en riesgo alto y fue rechazado por inconsistencia del dictamen.');
    }
    return motivos;
}

function emitirDiagnosticoJugador() {
    if (!clienteActual) {
        log('No hay cliente activo para diagnosticar.', 'error');
        return;
    }
    if (clienteActual.diagnosticado) {
        log('Ese caso ya fue diagnosticado.', 'info');
        return;
    }
    asegurarDiagnosticoJugador(clienteActual);
    let diagnosticosDetectados = Array.isArray(clienteActual.diagnosticosDetectados) ? clienteActual.diagnosticosDetectados : [];
    if (!diagnosticosDetectados.length && clienteActual.diagnosticoSeleccionado) {
        diagnosticosDetectados = [clienteActual.diagnosticoSeleccionado];
        clienteActual.diagnosticosDetectados = diagnosticosDetectados.slice();
    }
    if (!diagnosticosDetectados.length) {
        log('Selecciona al menos un diagnostico antes de emitirlo.', 'error');
        mostrarFeedbackGameplay('Marca una o mas causas probables para cerrar el diagnostico.', 'warn');
        return;
    }
    if (!clienteActual.diagnosticoSeleccionado) clienteActual.diagnosticoSeleccionado = diagnosticosDetectados[0];
    const hallazgos = (clienteActual.inspeccion && Array.isArray(clienteActual.inspeccion.hallazgos))
        ? clienteActual.inspeccion.hallazgos.length
        : 0;
    const nivelObd = (typeof ofDxNivelScannerObd === 'function') ? ofDxNivelScannerObd() : 0;
    const modoResolucion = (clienteActual.ofDxModoResolucion === 'rapida') ? 'rapida' : 'segura';
    const rondasMinimas = modoResolucion === 'rapida' ? 1 : 2;
    const hallazgosMinimos = modoResolucion === 'rapida' ? 0 : 1;

    // Flujo simplificado: sin bloqueo duro por checklist.
    // Mantiene impacto en probabilidad/riesgo, pero no fuerza fallo automaticamente.

    if (typeof ofDxCalcularProbablesCausas === 'function') {
        clienteActual.ofDxProbablesCausas = ofDxCalcularProbablesCausas(clienteActual);
    }

    if (!consumirFoco('diagnostico')) return;
    if (modoResolucion === 'segura') {
        // Validacion doble: consume un paso extra para bajar incertidumbre.
        consumirTurno('validacion segura de dictamen', 1);
    }

    const diagnosticos = (window.TallerData && window.TallerData.diagnosticos) || [];
    const elegido = diagnosticos.find(d => d.nombre === clienteActual.diagnosticoSeleccionado);
    const fallosPrincipales = Array.isArray(clienteActual.fallosPrincipales) && clienteActual.fallosPrincipales.length
        ? clienteActual.fallosPrincipales.slice()
        : [clienteActual.nombre];
    const fallosAdicionales = Array.isArray(clienteActual.fallosAdicionalesDetectables)
        ? clienteActual.fallosAdicionalesDetectables.slice()
        : [];
    const permitidos = new Set(fallosPrincipales.concat(fallosAdicionales));
    const cubrePrincipales = fallosPrincipales.every(f => diagnosticosDetectados.includes(f));
    const falsosPositivos = diagnosticosDetectados.filter(f => !permitidos.has(f));
    let correcto = cubrePrincipales && falsosPositivos.length === 0;
    let parcial = !correcto && (
        diagnosticosDetectados.some(f => fallosPrincipales.includes(f))
        || (!!elegido && elegido.especialidad === clienteActual.especialidadIdeal)
    );

    // Riesgo de fallo humano: incluso con sugerencia, baja confianza puede arruinar el dictamen.
    const confianzaPct = Math.max(0, Math.min(100, Math.round(clienteActual.ofDxConfianzaPct || 0)));
    const riesgoErrorHumano = (typeof ofDxRiesgoErrorHumano === 'function')
        ? ofDxRiesgoErrorHumano(confianzaPct, clienteActual)
        : Math.max(0.03, Math.min(0.42, (55 - confianzaPct) / 100));
    const topEvidencia = (typeof ofDxTopSistemas === 'function') ? ofDxTopSistemas(clienteActual, 2) : [];
    const brechaEvidencia = topEvidencia.length >= 2 ? Math.max(0, (topEvidencia[0].score || 0) - (topEvidencia[1].score || 0)) : (topEvidencia[0] ? topEvidencia[0].score || 0 : 0);
    const riesgoEvidenciaDebil = brechaEvidencia <= 0 ? Math.max(0.07, 0.18 - (nivelObd * 0.02)) : 0;
    const seleccionNoCoincideSugerencia = !!clienteActual.ofDxSugerencia && clienteActual.diagnosticoSeleccionado !== clienteActual.ofDxSugerencia;
    const riesgoDesalineacion = (seleccionNoCoincideSugerencia && confianzaPct < 70) ? Math.max(0.04, 0.15 - (nivelObd * 0.02)) : 0;
    const ajusteRiesgoModo = modoResolucion === 'rapida' ? 0.14 : -0.06;
    const bonoMejoraDxDueno = (typeof mejorasDueno !== 'undefined' && mejorasDueno.diagnostico) ? mejorasDueno.diagnostico * 0.08 : 0;
    const penalCondicionDueno = (typeof obtenerFactorRendimientoJugador === 'function')
        ? Math.max(0, 1 - obtenerFactorRendimientoJugador())
        : 0;
    const riesgoFatiga = penalCondicionDueno * (modoResolucion === 'rapida' ? 0.24 : 0.14);
    let riesgoTotalDictamen = Math.max(0.01, Math.min(0.9, riesgoErrorHumano + riesgoEvidenciaDebil + riesgoDesalineacion + ajusteRiesgoModo + riesgoFatiga - bonoMejoraDxDueno));
    // El flujo guiado de Mi Puesto valida todas las fallas confirmadas antes de emitir.
    if (clienteActual.ofDxValidacionGuiada && correcto) riesgoTotalDictamen = 0;
    let falloPorErrorHumano = false;
    if (correcto && Math.random() < riesgoTotalDictamen) {
        correcto = false;
        parcial = !!elegido && elegido.especialidad === clienteActual.especialidadIdeal;
        falloPorErrorHumano = true;
        log(`Fallo de dictamen: te precipitaste con confianza ${confianzaPct}% (${modoResolucion}).`, 'error');
    }
    if (!correcto && parcial && nivelObd >= 4 && clienteActual.ofDxSugerencia && clienteActual.diagnosticoSeleccionado === clienteActual.ofDxSugerencia) {
        if (Math.random() < Math.min(0.55, 0.18 + (nivelObd * 0.07))) {
            correcto = true;
            parcial = false;
            log(`El OBD mejorado ayudo a cerrar el dictamen exacto (Nivel ${nivelObd}).`, 'exito');
        }
    }
    if (clienteActual.ofDxForzarFallo) {
        clienteActual.ofDxForzarFallo = false;
    }

    clienteActual.diagnosticado = true;
    clienteActual.diagnosticoDetectado = diagnosticosDetectados.join(' | ');
    clienteActual.diagnosticoCorrecto = correcto;
    clienteActual.diagnosticoNivel = correcto ? 'critico' : (parcial ? 'parcial' : 'fallo');
    clienteActual.ofDxModoResolucion = modoResolucion;
    clienteActual.negociado = false;
    clienteActual.aprobacionCliente = false;

    if (correcto) {
        resumenDia.diagnosticosCorrectos++;
        reputacion += 1;
        clienteActual.dificultad = Math.max(0.2, clienteActual.dificultad - 0.05);
        // pieza de especialidad exacta en inventario = bonus diagnostico
        const piezaExacta = (inventarioPiezas || []).find(p => !p.instalada && p.especialidad === clienteActual.especialidadIdeal && p.calidad !== 'basica');
        if (piezaExacta) {
            clienteActual.dificultad = Math.max(0.15, clienteActual.dificultad - 0.04);
            log(`Diagnostico confirmado: ${clienteActual.diagnosticoSeleccionado}. Tienes ${piezaExacta.nombre} lista — instalaala antes de reparar.`, 'exito');
        } else {
            log(`Diagnostico confirmado: ${clienteActual.diagnosticoSeleccionado}.`, 'exito');
        }
        mostrarFeedbackGameplay(`CASO RESUELTO: acertaste el diagnóstico (${clienteActual.diagnosticoSeleccionado}). La evidencia y la hipótesis coinciden; puedes negociar y asignar la reparación.`, 'ok');

        const confianza = Math.max(0, Math.round(clienteActual.ofDxConfianzaPct || 0));
        const tecnicasOk = (clienteActual.ofDxEstado && clienteActual.ofDxEstado.tecnicasExito) ? clienteActual.ofDxEstado.tecnicasExito : 0;
        const perfecto = modoResolucion !== 'rapida'
            && confianza >= 78
            && (clienteActual.entrevistasHechas || 0) >= 1
            && (clienteActual.ofDxAnalisisHecho === true)
            && Array.isArray(clienteActual.ofDxSeleccionEnfoques)
            && clienteActual.ofDxSeleccionEnfoques.length >= 1
            && (clienteActual.ofDxRondasAnalisis || 0) >= 2
            && (brechaEvidencia >= 1)
            && ((clienteActual.ofDxAciertos || 0) >= 2 || tecnicasOk >= 1);
        if (perfecto) {
            rachaDiagnosticoPerfecto = (rachaDiagnosticoPerfecto || 0) + 1;
            const bonoRep = 1 + Math.floor(rachaDiagnosticoPerfecto / 2);
            reputacion += bonoRep;
            log(`Diagnostico PERFECTO x${rachaDiagnosticoPerfecto}: +${bonoRep} reputacion.`, 'exito');
        } else {
            rachaDiagnosticoPerfecto = 0;
        }
        mostrarStamp('APROBADO', 'ok');
    } else if (parcial) {
        rachaDiagnosticoPerfecto = 0;
        resumenDia.diagnosticosParciales++;
        estres = Math.min(100, estres + 2);
        clienteActual.dificultad = Math.max(0.22, clienteActual.dificultad - 0.02);
        log(`Diagnostico parcial: ${clienteActual.diagnosticoSeleccionado}. El sistema es correcto, pero no la causa exacta.`, 'info');
        mostrarFeedbackGameplay(`CASO PARCIAL: acertaste el sistema, pero no la causa exacta. El riesgo queda medio; revisa evidencias antes de reparar.`, 'warn');
        mostrarStamp('OBSERVADO', 'warn');
    } else {
        rachaDiagnosticoPerfecto = 0;
        resumenDia.diagnosticosFallidos++;
        estres = Math.min(100, estres + 5);
        tiempoCliente = Math.max(1, tiempoCliente - 1);
        log(`Diagnostico equivocado: ${clienteActual.diagnosticoSeleccionado}. El riesgo de reparacion sube.`, 'error');
        mostrarFeedbackGameplay(`CASO FALLIDO: el diagnóstico no coincide con la falla real. El riesgo de reparación sube y debes revisar el motivo antes de continuar.`, 'warn');
        mostrarStamp('RECHAZADO', 'error');

        var razonesFallo = construirMotivosDiagnosticoFallido(clienteActual, {
            confianzaPct: confianzaPct,
            falloPorErrorHumano: falloPorErrorHumano,
            seleccionNoCoincideSugerencia: seleccionNoCoincideSugerencia
        });
        if (typeof abrirModalDiagnosticoFallido === 'function') {
            abrirModalDiagnosticoFallido({
                idCaso: clienteActual.idCaso || 'CASO-0000',
                clienteNombre: clienteActual.personaNombre || 'Cliente',
                diagnostico: clienteActual.diagnosticoSeleccionado || 'Sin diagnostico',
                motivos: razonesFallo
            });
        }
    }

    if (clienteActual.esVIP) {
        clienteActual.etapaVIP = 2;
        log('Cliente VIP paso a etapa 2/3: ya puedes gestionar pieza especial.', 'info');
    }

    if (correcto || parcial) {
        actualizarCasoAtendido(
            clienteActual,
            'esperando_aprobacion',
            'Diagnostico emitido; falta aprobacion del cliente antes de asignar mecanico.'
        );
    } else {
        actualizarCasoAtendido(
            clienteActual,
            'esperando_aprobacion',
            'Diagnostico fallido: puedes continuar con riesgo alto y penalizacion potencial.'
        );
    }

    clienteActual.ofDxForzarFallo = false;

    consumirTurno('emitir diagnostico', COSTOS_TURNO.diagnostico);
    if (typeof autoGuardarPartidaSilenciosa === 'function') {
        autoGuardarPartidaSilenciosa('emitir-diagnostico');
    }

    // Nuevo flujo: un diagnostico fallido puede continuar a negociacion con alto riesgo.
}

function negociarCliente() {
    if (!clienteActual) {
        log('No hay cliente', 'error');
        return;
    }
    if (clienteActual.negociado) {
        log('Ya negociaste este trabajo.', 'info');
        return;
    }
    if (!consumirFoco('negociacion')) return;

    let prob = 0.55 + (reputacion / 220) - (clienteActual.dificultad * 0.10) - (estres / 300) + ((typeof mejorasDueno !== 'undefined' && mejorasDueno.diagnostico) ? mejorasDueno.diagnostico * 0.08 : 0) + ((typeof mejorasDueno !== 'undefined' && mejorasDueno.negociacion) ? mejorasDueno.negociacion * 0.08 : 0);
    const penalCondicionDueno = (typeof obtenerFactorRendimientoJugador === 'function')
        ? Math.max(0, 1 - obtenerFactorRendimientoJugador())
        : 0;
    prob -= (penalCondicionDueno * 0.22);
    if (clienteActual.personalidad === 'ansioso') prob -= 0.05;
    if (clienteActual.personalidad === 'confiado') prob += 0.06;
    if (clienteActual.personalidad === 'desconfiado' && !(clienteActual.entrevistasHechas > 0)) prob -= 0.03;
    if (clienteActual.miniHistoriaTipo === 'frecuente') prob += 0.05;
    if (clienteActual.miniHistoriaTipo === 'garantia_falsa') prob -= 0.12;
    if (clienteActual.diagnosticado && clienteActual.diagnosticoCorrecto) prob += 0.15;
    if (clienteActual.diagnosticado && clienteActual.diagnosticoNivel === 'fallo') prob -= 0.14;
    prob = Math.min(0.95, Math.max(0.25, prob));

    if (Math.random() < prob) {
        let extra = Math.round(clienteActual.pago * (0.1 + Math.random() * 0.15));
        clienteActual.pago += extra;
        clienteActual.negociado = true;
        clienteActual.aprobacionCliente = true;
        clienteActual.motivoRechazoWhatsApp = '';
        clienteActual.rechazosNegociacion = 0;
        ajustarEstadoSocialCliente(clienteActual, 'aprobado');
        resumenDia.negociacionesExitosas++;
        if (clienteActual.miniHistoriaTipo === 'frecuente') tramaEstado.clientesFrecuentesGanados += 1;
        if (clienteActual.miniHistoriaTipo === 'trabajo_urgente') tramaEstado.urgenciasResueltas += 1;
        if (clienteActual.miniHistoriaTipo === 'primerizo') tramaEstado.primerizosGuiados += 1;
        actualizarCasoAtendido(
            clienteActual,
                (clienteActual.esVIP && !clienteActual.piezaInstalada) ? 'falta_pieza' : 'listo_asignacion',
                (clienteActual.esVIP && !clienteActual.piezaInstalada)
                    ? 'Negociacion aprobada; instala la pieza VIP para arrancar reparacion.'
                    : 'Negociacion aprobada; listo para asignar mecanico.'
        );
        log(`Negociacion exitosa: +RD$${extra} al presupuesto`, 'exito');
        mostrarStamp('APROBADO', 'ok');
    } else {
        resumenDia.negociacionesFallidas++;
        clienteActual.negociado = false;
        clienteActual.aprobacionCliente = false;
        clienteActual.rechazosNegociacion = (clienteActual.rechazosNegociacion || 0) + 1;
        clienteActual.motivoRechazoWhatsApp = generarMotivoRechazoNegociacion(clienteActual);
        ajustarEstadoSocialCliente(clienteActual, 'rechazo');
        if (clienteActual.miniHistoriaTipo === 'garantia_falsa') tramaEstado.conflictosGarantia += 1;
        if (Math.random() < 0.5) {
            reputacion -= 2;
            tiempoCliente = Math.max(0, tiempoCliente - 2);
            log('Negociacion tensa: cliente se molesta y pierde paciencia.', 'error');
            mostrarStamp('RECHAZADO', 'error');
        } else {
            reputacion -= 1;
            clienteActual.pago = Math.max(300, Math.round(clienteActual.pago * 0.9));
            log('Cliente impuso descuento tras negociacion fallida.', 'error');
            mostrarStamp('RECHAZADO', 'error');
        }
        if ((clienteActual.rechazosNegociacion || 0) < 2) {
            actualizarCasoAtendido(
                clienteActual,
                'esperando_aprobacion',
                `Cliente no aprobo aun. Motivo: ${clienteActual.motivoRechazoWhatsApp} | Aun acepta una contraoferta.`
            );
            log(`Cliente no aprobo: ${clienteActual.motivoRechazoWhatsApp}`, 'warn');
            mostrarFeedbackGameplay(`Negociacion fallida: ${clienteActual.motivoRechazoWhatsApp} El cliente aun permite una contraoferta por WhatsApp.`, 'warn');
        } else {
            cerrarCasoPorNegociacionRechazada(clienteActual.motivoRechazoWhatsApp);
        }
    }
    consumirTurno('negociacion', COSTOS_TURNO.negociacion);
}

function aceptarCondicionClienteWhatsApp() {
    if (!clienteActual) {
        log('No hay cliente activo para cerrar acuerdo.', 'error');
        return false;
    }
    if (!clienteActual.diagnosticado) {
        log('Primero emite diagnostico antes de cerrar acuerdo por WhatsApp.', 'error');
        return false;
    }
    if (clienteActual.aprobacionCliente) {
        log('El cliente ya aprobo el trabajo por WhatsApp.', 'info');
        return true;
    }
    if (!consumirFoco('negociacion')) return false;

    const descuento = Math.max(120, Math.round(clienteActual.pago * 0.1));
    clienteActual.pago = Math.max(300, clienteActual.pago - descuento);
    clienteActual.negociado = true;
    clienteActual.aprobacionCliente = true;
    clienteActual.motivoRechazoWhatsApp = '';
    clienteActual.rechazosNegociacion = 0;
    ajustarEstadoSocialCliente(clienteActual, 'descuento');
    ajustarEstadoSocialCliente(clienteActual, 'aprobado');
    resumenDia.negociacionesExitosas++;
    actualizarCasoAtendido(
        clienteActual,
            (clienteActual.esVIP && !clienteActual.piezaInstalada) ? 'falta_pieza' : 'listo_asignacion',
            (clienteActual.esVIP && !clienteActual.piezaInstalada)
                ? 'Cliente aprobo; instala la pieza VIP para arrancar reparacion.'
                : 'Cliente aprobo; ya puedes asignar mecanico.'
    );
    log(`Aceptaste la contraoferta del cliente: -RD$${descuento} al presupuesto, trabajo aprobado.`, 'info');
    consumirTurno('aceptar contraoferta por WhatsApp', COSTOS_TURNO.negociacion);
    return true;
}

function cambiarEstrategiaCliente() {
    if (!clienteActual) {
        log('No hay cliente activo para estrategia.', 'error');
        return;
    }
    if (!consumirFoco('estrategia')) return;
    if (estrategiaCliente === 'balanceado') estrategiaCliente = 'rapido';
    else if (estrategiaCliente === 'rapido') estrategiaCliente = 'calidad';
    else estrategiaCliente = 'balanceado';
    log(`Estrategia cambiada a ${estrategiaCliente}.`, 'info');
    consumirTurno('cambio de estrategia', COSTOS_TURNO.estrategia);
}

function aplicarBonoDiagnosticoSiguienteCaso(cliente) {
    if (!cliente || typeof cliente !== 'object') return;
    if (Object.prototype.hasOwnProperty.call(cliente, 'bonoFocoDiagnostico'))
        delete cliente.bonoFocoDiagnostico;
    if (Object.prototype.hasOwnProperty.call(cliente, 'bonoFocoDxConsumido'))
        delete cliente.bonoFocoDxConsumido;
    bonoFocoSiguienteCaso = 0;
}
