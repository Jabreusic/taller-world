window.TallerData = window.TallerData || {};

// ─────────────────────────────────────────────────────────────────────────────
// HISTORIA PRINCIPAL — frases de carga/pantitulo (8 entradas, tono variado)
// ─────────────────────────────────────────────────────────────────────────────
window.TallerData.historiaPrincipal = [
    'El barrio no olvida. Cada reparacion documentada demuestra que el taller funciona; cada reclamo sin resolver fortalece el caso de Valeria.',
    'Valeria tiene abogados y tiempo. Tu tienes el taller, el equipo y la calle. Haz que sea suficiente.',
    'La deuda no es un numero en papel. Es el ruido de fondo que no deja dormir. Trabajas para silenciarlo, caso a caso.',
    'Stewart aparece y desaparece. El cliente sin placa no da nombres. El barrio habla bajo. Sigue atendiendo.',
    'Cada mecanico que llega tranquilo al turno es una carga menos antes del juicio. Cuida a tu equipo como el equipo te cuida a ti.',
    'AutoFix Express promete precios bajos. Pero la confianza del barrio no se compra con descuentos de apertura ni con equipo brillante.',
    'El proceso legal es real. Pero un taller solido, con clientes que vuelven y mecanicos que creen, es el mejor argumento en sala.',
    'Caja. Equipo. Reputacion. Tres frentes para un solo dueno. Cada turno que cierra bien es una victoria que Valeria no puede quitarte.'
];

// ─────────────────────────────────────────────────────────────────────────────
// TEXTOS DE INTRO POR PROGRESO DE CASOS (modo continuo sin dias)
// Se selecciona el umbral mas alto alcanzado por casosCompletados.
// ─────────────────────────────────────────────────────────────────────────────
window.TallerData.historiasProgreso = {
    0:  'El taller arranca sin respiro. La deuda pesa, el equipo desconfia y la calle te observa. Cada caso que cierras es un paso concreto hacia el otro lado.',
    2:  'Los primeros recibos ya cuentan una historia: el taller trabaja y responde. Sigue cerrando casos sin descuidar la caja.',
    4:  'El barrio empieza a notar que el taller sigue vivo. Valeria escala la presion legal. Tu tambien escalas: caso a caso, peso a peso.',
    6:  'Ya tienes actividad demostrable, pero un error costoso puede borrar el avance. Protege la reputacion y registra cada gasto.',
    8:  'AutoFix Express ya opera a tres cuadras con equipo moderno. Tu ventaja no es el hardware, es la cara conocida. Eso no se compra en catalogo.',
    10: 'Los clientes empiezan a volver por confianza, no por urgencia. Esa recurrencia fortalece el taller frente al banco y ante el juez.',
    12: 'El equipo empieza a creer en el proyecto. La deuda cede un poco. El juicio se acerca y Valeria no va a aflojar. Tampoco tu.',
    14: 'La defensa toma forma: trabajos cerrados, clientes atendidos y un equipo que puede respaldarte. Ahora evita decisiones desesperadas.',
    16: 'Las piezas encajan: cliente misterioso, inspector, la ex y el taller rival. Todo converge al mismo punto. Mantente enfocado.',
    18: 'Queda poco margen. Revisa deuda, reputacion y moral del equipo; cualquiera de esos frentes puede inclinar el veredicto.',
    20: 'Ultimo tramo antes del veredicto. Cada caso cerrado es un testigo. Cada mecanico leal es un voto. Llega parado y llega con pruebas.'
};

// ─────────────────────────────────────────────────────────────────────────────
// EVENTOS NARRATIVOS DE TURNO
// CORREGIDO: guards de typeof en resolvers, logica de caja B/saldo mas clara,
// rivalidadInterna con proteccion contra empate de habilidad.
// EXPANDIDO: 4 nuevos eventos (stewartRegresa, clienteMisterioso2,
//            malvavisco, rumoresBarrio).
// ─────────────────────────────────────────────────────────────────────────────
window.TallerData.eventosNarrativosTurno = [
    {
        id: 'inspector',
        titulo: 'Inspeccion Sorpresa',
        texto: 'Un inspector municipal aparece sin avisar justo cuando el taller esta creciendo. Revisara inconsistencias y dinero no declarado. Tienes segundos para decidir.',
        opcionA: 'Mostrar cuentas reales (transparencia total)',
        opcionB: 'Pagar gestion rapida (RD$450)',
        resolver: function(opcion) {
            var _cajaB   = (typeof cajaB   !== 'undefined') ? cajaB   : 0;
            var _saldo   = (typeof saldo   !== 'undefined') ? saldo   : 0;
            var _rep     = (typeof reputacion !== 'undefined') ? reputacion : 50;
            var _estres  = (typeof estres  !== 'undefined') ? estres  : 0;
            var _casosN  = (typeof casosCriticosResueltos !== 'undefined') ? casosCriticosResueltos : 0;

            if (opcion === 'A') {
                if (_cajaB > 0) {
                    // Hay caja B: el inspector la detecta. El monto escala con el progreso del taller.
                    var incautado = Math.min(_cajaB, 300 + (_casosN * 25));
                    cajaB = Math.max(0, _cajaB - incautado);
                    if (typeof tramaEstado !== 'undefined') tramaEstado.inspectorGolpes = (tramaEstado.inspectorGolpes || 0) + 1;
                    reputacion = Math.max(0, _rep - 2);
                    estres = Math.min(100, _estres + 6);
                    if (resumenDia && Array.isArray(resumenDia.ramificaciones))
                        resumenDia.ramificaciones.push('Transparencia parcial: el inspector detecto caja B y confisco RD$' + incautado + '.');
                    log('Inspector detecto irregularidades. Confisco RD$' + incautado + ' de caja B.', 'error');
                } else {
                    // Sin caja B: transparencia plena, el inspector queda satisfecho.
                    reputacion = Math.min(100, _rep + 3);
                    if (typeof decisionesHistoria !== 'undefined') decisionesHistoria.acuerdosBarrio = (decisionesHistoria.acuerdosBarrio || 0) + 1;
                    if (resumenDia && Array.isArray(resumenDia.ramificaciones))
                        resumenDia.ramificaciones.push('Cuentas limpias: el inspector se fue sin multa. El barrio lo supo.');
                    log('Inspeccion aprobada por transparencia total. +3 reputacion.', 'exito');
                }
            } else {
                // Opcion B: pagar gestion rapida. Se prioriza caja B para no dejar rastro.
                if (_cajaB >= 450) {
                    cajaB -= 450;
                    if (typeof tramaEstado !== 'undefined') tramaEstado.inspectorSobornos = (tramaEstado.inspectorSobornos || 0) + 1;
                    estres = Math.max(0, _estres - 6);
                    if (typeof decisionesHistoria !== 'undefined') decisionesHistoria.atajosOscuros = (decisionesHistoria.atajosOscuros || 0) + 1;
                    if (resumenDia && Array.isArray(resumenDia.ramificaciones))
                        resumenDia.ramificaciones.push('Gestion rapida pagada con caja B. Sin rastro visible, pero el inspector ya te conoce la cara.');
                    log('Gestion rapida pagada con caja B. -RD$450 (sin registro). Menos estres hoy.', 'info');
                } else if (_saldo >= 450) {
                    saldo -= 450;
                    if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarGastoDia === 'function')
                        window.TallerApp.helpers.registrarGastoDia(450, 'eventos');
                    if (typeof tramaEstado !== 'undefined') tramaEstado.inspectorSobornos = (tramaEstado.inspectorSobornos || 0) + 1;
                    estres = Math.max(0, _estres - 5);
                    if (typeof decisionesHistoria !== 'undefined') decisionesHistoria.atajosOscuros = (decisionesHistoria.atajosOscuros || 0) + 1;
                    if (resumenDia && Array.isArray(resumenDia.ramificaciones))
                        resumenDia.ramificaciones.push('Gestion rapida pagada con caja principal. Queda registro contable: riesgo futuro.');
                    log('Gestion rapida con caja principal. -RD$450 (queda registro). Baja estres inmediato.', 'info');
                } else {
                    // Sin fondos: el inspector se molesta y actua.
                    var decomiso = Math.min(_cajaB, 220);
                    cajaB = Math.max(0, _cajaB - decomiso);
                    if (typeof tramaEstado !== 'undefined') tramaEstado.inspectorGolpes = (tramaEstado.inspectorGolpes || 0) + 1;
                    reputacion = Math.max(0, _rep - 4);
                    estres = Math.min(100, _estres + 10);
                    if (resumenDia && Array.isArray(resumenDia.ramificaciones))
                        resumenDia.ramificaciones.push('Intentaste el atajo sin dinero y quedaste expuesto. El inspector se fue molesto y con pruebas.');
                    log('Sin fondos para la gestion: inspector se molesto. -RD$' + decomiso + ' de caja B, -4 reputacion.', 'error');
                }
            }
        }
    },

    {
        id: 'clienteFiel',
        titulo: 'Cliente Fiel Con Urgencia',
        texto: 'Una clienta de anos, Dona Marta, pide prioridad inmediata por una emergencia familiar. Pero rompe el orden de cola y hay tres clientes esperando que lo vieron llegar despues.',
        opcionA: 'Dar prioridad y explicarle al resto con honestidad',
        opcionB: 'Mantener el orden estricto y ofrecerle el siguiente turno disponible',
        resolver: function(opcion) {
            if (opcion === 'A') {
                reputacion = Math.min(100, (typeof reputacion !== 'undefined' ? reputacion : 50) + 3);
                if (typeof clientesEnEspera !== 'undefined' && clientesEnEspera.length > 0) {
                    var primero = clientesEnEspera.pop();
                    clientesEnEspera.unshift(primero);
                }
                if (resumenDia && Array.isArray(resumenDia.ramificaciones))
                    resumenDia.ramificaciones.push('Priorizaste la emergencia de Dona Marta. El barrio lo recordara.');
                log('Emergencia atendida. El barrio sabe que eres de los que entienden. +3 reputacion.', 'exito');
            } else {
                // Opcion B: eficiencia operativa, costo social moderado pero caja compensa.
                saldo = (typeof saldo !== 'undefined' ? saldo : 0) + 250;
                if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarIngresoDia === 'function')
                    window.TallerApp.helpers.registrarIngresoDia(250, 'eventos');
                reputacion = Math.max(0, (typeof reputacion !== 'undefined' ? reputacion : 50) - 1);
                if (typeof decisionesHistoria !== 'undefined') decisionesHistoria.atajosOscuros = (decisionesHistoria.atajosOscuros || 0) + 1;
                if (resumenDia && Array.isArray(resumenDia.ramificaciones))
                    resumenDia.ramificaciones.push('Mantuviste el orden. Justo, pero frio. El barrio tambien registra eso.');
                log('Orden mantenido. +RD$250 caja (flujo limpio), -1 reputacion social.', 'info');
            }
        }
    },

    {
        id: 'proveedor',
        titulo: 'Proveedor Con Oferta Doble',
        texto: 'Tu proveedor habitual llega con dos propuestas: piezas premium a credito (pagas despues, calidad garantizada) o un lote economico de calidad incierta que libera caja ahora.',
        opcionA: 'Credito premium — calidad garantizada, deuda aumenta',
        opcionB: 'Lote economico — caja rapida, riesgo de fallas tecnicas',
        resolver: function(opcion) {
            if (opcion === 'A') {
                deuda = (typeof deuda !== 'undefined' ? deuda : 0) + 280;
                modificadorHabilidadDiario = (typeof modificadorHabilidadDiario !== 'undefined' ? modificadorHabilidadDiario : 0) + 0.04;
                if (typeof decisionesHistoria !== 'undefined') decisionesHistoria.acuerdosBarrio = (decisionesHistoria.acuerdosBarrio || 0) + 1;
                if (resumenDia && Array.isArray(resumenDia.ramificaciones))
                    resumenDia.ramificaciones.push('Piezas premium a credito. La calidad del taller sube hoy, la deuda tambien.');
                log('Credito premium aceptado. +calidad tecnica del turno. +RD$280 deuda.', 'info');
            } else {
                saldo = (typeof saldo !== 'undefined' ? saldo : 0) + 320;
                if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarIngresoDia === 'function')
                    window.TallerApp.helpers.registrarIngresoDia(320, 'eventos');
                modificadorHabilidadDiario = (typeof modificadorHabilidadDiario !== 'undefined' ? modificadorHabilidadDiario : 0) - 0.05;
                if (typeof decisionesHistoria !== 'undefined') decisionesHistoria.atajosOscuros = (decisionesHistoria.atajosOscuros || 0) + 1;
                if (resumenDia && Array.isArray(resumenDia.ramificaciones))
                    resumenDia.ramificaciones.push('Lote economico: entra caja, pero la precision del taller baja. Un fallo en el momento equivocado puede costar mas que RD$320.');
                log('Lote economico. +RD$320 caja. -precision del taller este turno.', 'error');
            }
        }
    },

    {
        id: 'vipNervioso',
        titulo: 'VIP Al Limite',
        texto: 'El cliente VIP amenaza con irse si no siente prioridad total. Paga bien, pero exige de mas. Ceder puede tranquilizarlo hoy y costarte al equipo manana.',
        opcionA: 'Prioridad absoluta al VIP — calma al cliente, tensa al equipo',
        opcionB: 'Flujo normal con explicacion directa — pierdes quiza el cliente, ganas respeto interno',
        resolver: function(opcion) {
            if (opcion === 'A') {
                tiempoCliente = Math.min(12, (typeof tiempoCliente !== 'undefined' ? tiempoCliente : 6) + 2);
                estres = Math.min(100, (typeof estres !== 'undefined' ? estres : 0) + 5);
                if (typeof mecanicos !== 'undefined') {
                    mecanicos.forEach(function(m) { if (m) m.enojo = Math.min(8, (m.enojo || 0) + 1); });
                }
                if (resumenDia && Array.isArray(resumenDia.ramificaciones))
                    resumenDia.ramificaciones.push('VIP calmado, equipo resentido. El dinero entra, la moral sale.');
                log('VIP satisfecho. +tiempo de servicio cliente. El equipo lo nota: +estres, +enojo mecanicos.', 'info');
            } else {
                reputacion = Math.max(0, (typeof reputacion !== 'undefined' ? reputacion : 50) - 1);
                saldo = (typeof saldo !== 'undefined' ? saldo : 0) + 200;
                if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarIngresoDia === 'function')
                    window.TallerApp.helpers.registrarIngresoDia(200, 'eventos');
                estres = Math.max(0, (typeof estres !== 'undefined' ? estres : 0) - 3);
                if (resumenDia && Array.isArray(resumenDia.ramificaciones))
                    resumenDia.ramificaciones.push('Le dijiste la verdad al VIP. Se molesto, pero el equipo trabajo sin presion extra.');
                log('VIP inconforme. -1 reputacion, +RD$200 caja (pago igual). -3 estres del equipo.', 'info');
            }
        }
    },

    {
        id: 'cajaRota',
        titulo: 'Caja En Rojo',
        texto: 'La caja no aguanta el ritmo. Puedes recortar gastos hoy con sacrificio interno o tomar oxigeno financiero caro y seguir operando a plena potencia.',
        opcionA: 'Recorte severo del turno — baja deuda, sube tension',
        opcionB: 'Microprestamo de emergencia (+RD$600, +RD$760 deuda futura)',
        resolver: function(opcion) {
            if (opcion === 'A') {
                estres = Math.min(100, (typeof estres !== 'undefined' ? estres : 0) + 7);
                deuda = Math.max(0, (typeof deuda !== 'undefined' ? deuda : 0) - 120);
                if (typeof mecanicos !== 'undefined') {
                    mecanicos.forEach(function(m) { if (m) m.enojo = Math.min(8, (m.enojo || 0) + 1); });
                }
                if (typeof decisionesHistoria !== 'undefined') decisionesHistoria.acuerdosBarrio = (decisionesHistoria.acuerdosBarrio || 0) + 1;
                if (resumenDia && Array.isArray(resumenDia.ramificaciones))
                    resumenDia.ramificaciones.push('Recorte aplicado. -RD$120 deuda. El equipo lo siente en la piel.');
                log('Recorte severo. -RD$120 deuda. +estres equipo. Es lo correcto aunque duela.', 'info');
            } else {
                saldo = (typeof saldo !== 'undefined' ? saldo : 0) + 600;
                if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarIngresoDia === 'function')
                    window.TallerApp.helpers.registrarIngresoDia(600, 'eventos');
                deuda = (typeof deuda !== 'undefined' ? deuda : 0) + 760;
                if (typeof decisionesHistoria !== 'undefined') decisionesHistoria.atajosOscuros = (decisionesHistoria.atajosOscuros || 0) + 1;
                if (resumenDia && Array.isArray(resumenDia.ramificaciones))
                    resumenDia.ramificaciones.push('Microprestamo tomado. Operaciones sostenidas, deuda futura mas pesada.');
                log('Microprestamo: +RD$600 ahora. +RD$760 deuda futura. El reloj sigue corriendo.', 'error');
            }
        }
    },

    {
        id: 'rivalidadInterna',
        titulo: 'Choque Interno De Liderazgo',
        texto: 'Dos mecanicos discuten delante de clientes sobre como resolver un caso complejo. Uno apuesta por la tecnica. El otro, por la velocidad. El taller espera tu palabra.',
        opcionA: 'Respaldar al mas tecnico — precision sobre velocidad',
        opcionB: 'Respaldar al mas rapido — flujo sobre perfeccion',
        resolver: function(opcion) {
            if (typeof mecanicos === 'undefined' || !Array.isArray(mecanicos)) return;
            var activos = mecanicos.filter(function(m) { return m && typeof m.nombre === 'string'; });
            if (activos.length < 2) return;

            // CORREGIDO: sort estable + proteccion contra empate (diferentes indices).
            var ordenados = activos.slice().sort(function(a, b) { return b.habilidad - a.habilidad; });
            var tecnico = ordenados[0];
            // El mas rapido es el de menor habilidad tecnica (diferente objeto garantizado por slice).
            var rapido = ordenados[ordenados.length - 1];
            // Guardia: si son el mismo objeto (un solo mecanico activo), salir.
            if (tecnico === rapido) return;

            if (opcion === 'A') {
                tecnico.lealtad = Math.min(100, (tecnico.lealtad || 50) + 5);
                tecnico.habilidad = Math.min(1.2, tecnico.habilidad + 0.02);
                estres = Math.max(0, (typeof estres !== 'undefined' ? estres : 0) - 3);
                if (resumenDia && Array.isArray(resumenDia.ramificaciones))
                    resumenDia.ramificaciones.push('Respaldaste el enfoque tecnico de ' + tecnico.nombre + '. El taller gana precision, el equipo gana claridad.');
                log('Linea tecnica adoptada con ' + tecnico.nombre + '. +habilidad, -estres.', 'exito');
            } else {
                rapido.lealtad = Math.min(100, (rapido.lealtad || 50) + 5);
                rapido.enojo = Math.max(0, (rapido.enojo || 0) - 1);
                tiempoCliente = Math.max(2, (typeof tiempoCliente !== 'undefined' ? tiempoCliente : 6) - 1);
                if (resumenDia && Array.isArray(resumenDia.ramificaciones))
                    resumenDia.ramificaciones.push('Respaldaste la velocidad de ' + rapido.nombre + '. El flujo mejora. La calidad se juega en los detalles.');
                log('Flujo acelerado con ' + rapido.nombre + '. -tiempo cliente, -enojo mecanico.', 'info');
            }
        }
    },

    // ─── NUEVO: Regreso de Stewart ───────────────────────────────────────────
    {
        id: 'stewartRegresa',
        titulo: 'Stewart Pide Una Oportunidad',
        texto: 'Stewart aparece en la puerta con ropa de trabajo limpia. Dice que cambio, que necesita el trabajo y que sabe cosas del taller que podrian ayudarte en el juicio. Sus ojos no mienten, pero tampoco te lo dicen todo.',
        opcionA: 'Darle otra oportunidad — a prueba, sin garantias',
        opcionB: 'Rechazarlo con firmeza — el taller no puede arriesgar ahora',
        resolver: function(opcion) {
            if (opcion === 'A') {
                if (typeof mecanicos !== 'undefined' && Array.isArray(mecanicos)) {
                    // Stewart entra como mecanico con lealtad baja pero recuperable.
                    var stewartExiste = mecanicos.some(function(m) { return m && m.nombre === 'Stewart'; });
                    if (!stewartExiste) {
                        mecanicos.push({ nombre: 'Stewart', habilidad: 0.75, lealtad: 4, enojo: 1, turnosActivo: 0 });
                    } else {
                        var s = mecanicos.find(function(m) { return m && m.nombre === 'Stewart'; });
                        if (s) { s.lealtad = Math.min(100, (s.lealtad || 0) + 10); s.enojo = Math.max(0, (s.enojo || 0) - 1); }
                    }
                }
                reputacion = Math.min(100, (typeof reputacion !== 'undefined' ? reputacion : 50) + 1);
                if (typeof tramaEstado !== 'undefined') tramaEstado.stewartActivo = true;
                if (resumenDia && Array.isArray(resumenDia.ramificaciones))
                    resumenDia.ramificaciones.push('Stewart esta de vuelta a prueba. Sabe cosas. Cuanto comparta depende de como lo trates.');
                log('Stewart reintegrado a prueba. Lealtad baja pero creciente. Puede ser clave en el juicio.', 'info');
            } else {
                reputacion = Math.min(100, (typeof reputacion !== 'undefined' ? reputacion : 50) + 2);
                estres = Math.max(0, (typeof estres !== 'undefined' ? estres : 0) - 2);
                if (typeof tramaEstado !== 'undefined') tramaEstado.stewartActivo = false;
                if (resumenDia && Array.isArray(resumenDia.ramificaciones))
                    resumenDia.ramificaciones.push('Rechazaste a Stewart. El equipo lo vio. Algunos lo aprueban, otros no tanto.');
                log('Stewart rechazado. +2 reputacion interna. No sabras lo que sabe. -2 estres.', 'info');
            }
        }
    },

    // ─── NUEVO: Cliente misterioso regresa ───────────────────────────────────
    {
        id: 'clienteMisterioso2',
        titulo: 'El Sin Placa Vuelve De Noche',
        texto: 'El vehiculo sin placa llego de nuevo, esta vez despues del cierre. El conductor habla poco. Paga en efectivo. Pide discrecion absoluta y deja una bolsa pequena "para gastos". Su cara dice que no es una peticion.',
        opcionA: 'Aceptar el trabajo y la bolsa — sin hacer preguntas',
        opcionB: 'Rechazar el encargo — el taller no necesita ese tipo de dinero',
        resolver: function(opcion) {
            if (opcion === 'A') {
                var bonus = 800 + Math.round(Math.random() * 400);
                cajaB = (typeof cajaB !== 'undefined' ? cajaB : 0) + bonus;
                if (typeof tramaEstado !== 'undefined') tramaEstado.clienteMisteriosoRelacion = (tramaEstado.clienteMisteriosoRelacion || 0) + 1;
                if (typeof decisionesHistoria !== 'undefined') decisionesHistoria.atajosOscuros = (decisionesHistoria.atajosOscuros || 0) + 1;
                reputacion = Math.max(0, (typeof reputacion !== 'undefined' ? reputacion : 50) - 2);
                if (resumenDia && Array.isArray(resumenDia.ramificaciones))
                    resumenDia.ramificaciones.push('Aceptaste el encargo nocturno. La bolsa tenia RD$' + bonus + '. El rastro queda en caja B.');
                log('Trabajo nocturno aceptado. +RD$' + bonus + ' caja B. -2 reputacion. Las conexiones crecen en ambas direcciones.', 'info');
            } else {
                reputacion = Math.min(100, (typeof reputacion !== 'undefined' ? reputacion : 50) + 3);
                estres = Math.min(100, (typeof estres !== 'undefined' ? estres : 0) + 4);
                if (typeof decisionesHistoria !== 'undefined') decisionesHistoria.acuerdosBarrio = (decisionesHistoria.acuerdosBarrio || 0) + 1;
                if (resumenDia && Array.isArray(resumenDia.ramificaciones))
                    resumenDia.ramificaciones.push('Rechazaste el encargo. El conductor no dijo nada. Tampoco volvio. Por ahora.');
                log('Encargo nocturno rechazado. +3 reputacion. +estres: no sabes si fue la decision correcta.', 'exito');
            }
        }
    },

    // ─── NUEVO: Malvavisco como comodin narrativo ────────────────────────────
    {
        id: 'malvavisco',
        titulo: 'Malvavisco Decide El Dia',
        texto: 'Malvavisco encontro algo debajo de un coche a reparar: un sobre sellado con el logo de un bufete de abogados. Podria ser de Valeria. Podria no ser para ti. El perro te mira como si supiera mas que tu.',
        opcionA: 'Abrir el sobre y leer el contenido',
        opcionB: 'Sellarlo de nuevo y devolverlo con el vehiculo — sin comentarios',
        resolver: function(opcion) {
            if (opcion === 'A') {
                // Abrir el sobre: informacion valiosa pero riesgo legal.
                reputacion = Math.max(0, (typeof reputacion !== 'undefined' ? reputacion : 50) - 1);
                if (typeof tramaEstado !== 'undefined') tramaEstado.sobreAbierto = true;
                if (typeof decisionesHistoria !== 'undefined') decisionesHistoria.atajosOscuros = (decisionesHistoria.atajosOscuros || 0) + 1;
                estres = Math.max(0, (typeof estres !== 'undefined' ? estres : 0) - 5);
                if (resumenDia && Array.isArray(resumenDia.ramificaciones))
                    resumenDia.ramificaciones.push('Leiste el sobre. Era de Valeria. Ahora sabes su siguiente movimiento. Ese conocimiento tiene precio.');
                log('Sobre abierto. Informacion estrategica obtenida. -1 reputacion, -5 estres. Malvavisco te mira sin juzgarte.', 'info');
            } else {
                reputacion = Math.min(100, (typeof reputacion !== 'undefined' ? reputacion : 50) + 2);
                if (typeof tramaEstado !== 'undefined') tramaEstado.sobreAbierto = false;
                if (resumenDia && Array.isArray(resumenDia.ramificaciones))
                    resumenDia.ramificaciones.push('Devolviste el sobre intacto. El cliente no supo que lo viste. Malvavisco obtuvo una galletita.');
                log('Sobre devuelto intacto. +2 reputacion. Malvavisco recibio su merecida galletita.', 'exito');
            }
        }
    },

    // ─── NUEVO: Rumores del barrio ───────────────────────────────────────────
    {
        id: 'rumoresBarrio',
        titulo: 'El Barrio Habla',
        texto: 'Tres clientes distintos te mencionan lo mismo en el dia: corre el rumor de que el taller va a cerrar antes del juicio. Alguien lo esta regando. Puedes ignorarlo o salir a cortarlo de raiz.',
        opcionA: 'Salir al barrio y desmentirlo en persona — tiempo y energia',
        opcionB: 'Ignorarlo y dejar que el trabajo hable por si mismo',
        resolver: function(opcion) {
            if (opcion === 'A') {
                reputacion = Math.min(100, (typeof reputacion !== 'undefined' ? reputacion : 50) + 5);
                estres = Math.min(100, (typeof estres !== 'undefined' ? estres : 0) + 4);
                saldo = Math.max(0, (typeof saldo !== 'undefined' ? saldo : 0) - 100);
                if (window.TallerApp && window.TallerApp.helpers && typeof window.TallerApp.helpers.registrarGastoDia === 'function')
                    window.TallerApp.helpers.registrarGastoDia(100, 'eventos');
                if (typeof decisionesHistoria !== 'undefined') decisionesHistoria.acuerdosBarrio = (decisionesHistoria.acuerdosBarrio || 0) + 1;
                if (resumenDia && Array.isArray(resumenDia.ramificaciones))
                    resumenDia.ramificaciones.push('Saliste al barrio y cortaste el rumor en persona. Costo tiempo y plata, pero el efecto fue inmediato.');
                log('Rumor cortado en persona. +5 reputacion, -RD$100 (cafe y tiempo). +estres.', 'exito');
            } else {
                // El rumor puede quedarse o disiparse solo — dado narrativo.
                var dado = Math.random();
                if (dado > 0.55) {
                    reputacion = Math.max(0, (typeof reputacion !== 'undefined' ? reputacion : 50) - 3);
                    if (resumenDia && Array.isArray(resumenDia.ramificaciones))
                        resumenDia.ramificaciones.push('El rumor crecio sin control. Tres clientes cancelaron citas esta semana.');
                    log('Ignoraste el rumor. Crecio. -3 reputacion. A veces el silencio no es dignidad, es costo.', 'error');
                } else {
                    if (resumenDia && Array.isArray(resumenDia.ramificaciones))
                        resumenDia.ramificaciones.push('El rumor se disipo solo. El trabajo diario lo desmintio sin palabras.');
                    log('El rumor se apago solo. El trabajo hablo. Esta vez.', 'exito');
                }
            }
        }
    }
];

// ─────────────────────────────────────────────────────────────────────────────
// HISTORIAS DE INICIO POR DIA (modo compatible con dias)
// CORREGIDO: dia 14 sin mayusculas agresivas, cierre expandido.
// ─────────────────────────────────────────────────────────────────────────────
window.TallerData.historiasInicio = {
    1:  'Dia 1: Tu ex vacio la cuenta del taller en Zara. Debes RD$100,000. El equipo te mira con desconfianza. Malvavisco tiene hambre. Empieza.',
    2:  'Dia 2: Dos mecanicos discutieron por una llave inglesa hasta que uno amenazo con irse. La tension crece. Llego una factura de la luz de RD$800. El taller no descansa.',
    3:  'Dia 3: Stewart, el ex-empleado que despediste, aparece en la puerta con ropa limpia. Dice que cambio. El equipo lo mira. Tu decides.',
    4:  'Dia 4: Valeria mando abogados. Con reputacion baja, el taller paga multas. Con reputacion alta, la amenaza se debilita. Los vecinos ya rumorean sobre quiebra.',
    5:  'Dia 5: Tres coches de lujo con problemas electronicos. Clientes impacientes. El barrio observa cada decision que tomas. No hay espacio para el error.',
    6:  'Dia 6: Vence el pago parcial de la deuda. Si no tienes RD$3,500, Valeria puede embargar. El equipo lo siente antes de que digas nada.',
    7:  'Dia 7: Un vehiculo sin placa llega sin cita. El conductor habla lo minimo y paga en efectivo. Stewart lo mira fijo desde el fondo del taller.',
    8:  'Dia 8: El rumor tiene nombre: AutoFix Express. Tres cuadras. Equipo moderno, precios bajos. Tus mecanicos hacen preguntas que no quieren respuesta.',
    9:  'Dia 9: Los mecanicos piden un aumento. No es capricho: llevan semanas sin garantia real. Si los pierdes ahora, no es el taller lo que se muere primero.',
    10: 'Dia 10: El cliente sin placa regresa. Esta vez pide una reparacion de madrugada. Sus ojos no cuentan toda la historia. La bolsa que deja tampoco.',
    11: 'Dia 11: Corte electrico parcial en la cuadra. El taller funciona a media potencia. Valeria usa cada debilidad como argumento en el expediente legal.',
    12: 'Dia 12: Valeria aparece con documentos nuevos. Alega que el taller usa su dinero sin permiso. Su acompanante es abogado. El reloj corre mas rapido que ayer.',
    13: 'Dia 13: Ultimo dia antes del veredicto. Cada cliente atendido es un testigo potencial. Cada mecanico contento es un voto a tu favor. Cierra fuerte.',
    14: 'Dia 14: El juicio. Todo lo que construiste entra hoy a una sala. Los registros, los mecanicos, la reputacion del barrio. O te hundes o te conviertes en leyenda.'
};

// ─────────────────────────────────────────────────────────────────────────────
// HISTORIAS DE CIERRE POR DIA
// CORREGIDO: dia 14 expandido con peso narrativo real.
// ─────────────────────────────────────────────────────────────────────────────
window.TallerData.historiasCierre = {
    1:  'Noche 1: El taller huele a gasolina y a comienzo. Malvavisco duerme en el capot de un Corolla abollado. Manana es otro dia. Tiene que serlo.',
    2:  'Noche 2: Suena el celular. Es Valeria: Ya tienes mi dinero, fracasado? Cuelgas sin responder. El equipo sigue trabajando callado. Eso tambien es un mensaje.',
    3:  'Noche 3: Stewart trabaja hasta tarde sin que nadie se lo pida. Demasiado callado. No sabes si confiar en el todavia. Pero el taller necesita manos.',
    4:  'Noche 4: Los vecinos golpean la puerta. Quieren saber si el taller cierra. Les dices que no. En voz alta y sin dudar. Aun no sabes si es del todo verdad.',
    5:  'Noche 5: Encontraste fotos viejas de ti y Valeria en una gaveta del escritorio. Las miras un segundo. Las guardas. El taller existia antes que ella y existira despues.',
    6:  'Noche 6: Pagaste o postergaste. Sea como sea, sobreviviste una semana completa. Eso no es poco. Eso es la base.',
    7:  'Noche 7: El vehiculo sin placa no regreso. Malvavisco ladro hacia la calle oscura toda la noche como si supiera algo que tu no.',
    8:  'Noche 8: AutoFix Express tiene nombre, tiene local y tiene precios. Pero sus mecanicos no conocen al barrio. Esa diferencia es tuya, por ahora.',
    9:  'Noche 9: Los mecanicos estan en silencio. Esperan tu respuesta al pedido de aumento. Cada hora sin respuesta es tension que se acumula.',
    10: 'Noche 10: El cliente misterioso dejo algo en el taller. Una bolsa pequena detras de una llanta. No la abres. No todavia. Malvavisco la huele y no gruñe.',
    11: 'Noche 11: Funcionaste a media potencia y resististe. Valeria va a usar cada debilidad como argumento. Tienes que conocerlas antes que ella.',
    12: 'Noche 12: La amenaza legal es real. Pero los registros del taller cuentan otra historia. Una mejor. Solo falta que alguien la defienda con conviccion.',
    13: 'Noche 13: Ultima noche antes del veredicto. Cada mecanico que duerme tranquilo es un peso menos sobre tus hombros. Cuenta cuantos lo hacen.',
    14: 'Noche 14: Se acabo. El barrio recuerda lo que hiciste en estas semanas. No el papel del juicio: las decisiones que tomaste cuando nadie te veia. Esas son las que pesan.'
};

// ─────────────────────────────────────────────────────────────────────────────
// ARCOS NARRATIVOS
// CORREGIDO: arco3 descripcion unica, arco5 gap cubierto (casosMin ajustado).
// EXPANDIDO: arco6 post-veredicto para campañas largas.
// ─────────────────────────────────────────────────────────────────────────────
window.TallerData.arcoNarrativo = [
    {
        id: 'arco1',
        titulo: 'Arco 1: Supervivencia',
        casosMin: 0,
        nivelMin: 1,
        textoInicio: 'Tu ex vacio la cuenta del taller. Debes RD$100,000. El equipo desconfia. Malvavisco tiene hambre. Cada peso que entra es oxigeno. Cada caso que cierras es tiempo ganado.',
        textoCierre: 'El taller huele a gasolina y a comienzo dificil. Sigue trabajando. Malvavisco ya encontro su rincon.',
        descripcion: 'El taller esta al borde. La deuda es real, el equipo desconfia y Valeria ya maniobra. Cada peso que entra es oxigeno puro.'
    },
    {
        id: 'arco2',
        titulo: 'Arco 2: La Presion Legal',
        casosMin: 4,
        nivelMin: 1,
        textoInicio: 'Valeria mando abogados. Con reputacion baja, el taller paga multas. Con reputacion alta, la amenaza se debilita. La reputacion del taller es tu escudo legal: cuida cada decision.',
        textoCierre: 'La presion legal es real. Pero los registros del taller cuentan otra historia. Una mejor. Solo falta defenderla con pruebas y voces.',
        descripcion: 'Valeria escala. Abogados, inspectores y rumores de embargo. La reputacion no es orgullo: es tu escudo en sala.'
    },
    {
        id: 'arco3',
        titulo: 'Arco 3: Sombras en el Barrio',
        casosMin: 9,
        nivelMin: 2,
        textoInicio: 'Algo se mueve entre bastidores. Un vehiculo sin placa con un conductor que no da nombres. AutoFix Express crece a tres cuadras con precios que no entiendes como sostienes. Tus mecanicos hacen preguntas incomodas sobre su futuro aqui.',
        textoCierre: 'AutoFix Express tiene local, equipo y marketing. Pero no tiene tu historial en el barrio. Esa brecha es tu unico margen y tienes que ampliarla.',
        descripcion: 'Un cliente sin historia, un taller rival que crece rapido y un equipo que empieza a dudar. Todo a la vez, sin margen de error.'
    },
    {
        id: 'arco4',
        titulo: 'Arco 4: El Juicio se Acerca',
        casosMin: 15,
        nivelMin: 3,
        textoInicio: 'Las piezas del rompecabezas encajan: el cliente misterioso tiene conexiones, Valeria tiene un plan y el barrio elige su bando. Cada decision cuenta doble ahora.',
        textoCierre: 'No hay margen de error. Cada mecanico que trabaja tranquilo es un peso menos sobre tus hombros. Cada cliente que vuelve es un testigo mas.',
        descripcion: 'El cliente misterioso tiene conexiones. Valeria tiene un plan. El barrio elige su bando. Todo converge al mismo punto.'
    },
    {
        id: 'arco5',
        titulo: 'Arco 5: El Veredicto',
        casosMin: 20,
        nivelMin: 1,
        textoInicio: 'No hay margen de error. Cada reparacion completada es un testigo. Cada mecanico leal es un voto. Todo lo que construiste entra hoy a una sala y habla por ti.',
        textoCierre: 'Se acabo. El barrio recuerda lo que hiciste cuando nadie te miraba. Esas son las decisiones que pesaron.',
        descripcion: 'No hay vuelta atras. Cada reparacion es un testigo. Cada mecanico leal es un voto. Hoy se decide todo.'
    },
    // ─── NUEVO: Arco post-veredicto para campañas largas ────────────────────
    {
        id: 'arco6',
        titulo: 'Arco 6: Despues del Ruido',
        casosMin: 28,
        nivelMin: 4,
        textoInicio: 'El juicio paso. El barrio sigue. Ahora el taller no pelea por sobrevivir: pelea por definir que clase de negocio quiere ser. La presion cambio de forma, no de intensidad.',
        textoCierre: 'El barrio te vio construir algo en las peores condiciones. Eso no se olvida. Lo que hagas ahora con eso es la historia que queda.',
        descripcion: 'El veredicto quedo atras. Ahora viene la reconstruccion real: reputacion, equipo, expansion. Y nuevas amenazas que el exito atrae.'
    }
];

// ─────────────────────────────────────────────────────────────────────────────
// HITOS NARRATIVOS — eventos de un solo disparo por casosCompletados
// CORREGIDO: todos los resolvers con typeof guards completos.
// EXPANDIDO: hito nuevo 'victoria_temprana' y 'traicion_posible'.
// ─────────────────────────────────────────────────────────────────────────────
window.TallerData.hitosNarrativos = [
    {
        id: 'tension_inicial',
        casosMin: 2,
        texto: 'El equipo siente la presion acumulada. Dos mecanicos discutieron esta semana y la factura de luz llego mas alta de lo esperado.',
        resolver: function() {
            estres = Math.min(100, (typeof estres !== 'undefined' ? estres : 0) + 5);
            if (typeof mecanicos !== 'undefined' && Array.isArray(mecanicos)) {
                mecanicos.forEach(function(m) { if (m) m.enojo = Math.min(8, (m.enojo || 0) + 1); });
            }
            if (typeof resumenDia !== 'undefined' && Array.isArray(resumenDia.ramificaciones))
                resumenDia.ramificaciones.push('La tension del equipo escala. El taller lo nota.');
            log('[Hito] Tension inicial del equipo. +5 estres, +1 enojo general.', 'warn');
        }
    },
    {
        id: 'presion_valeria',
        casosMin: 5,
        texto: 'Valeria mando abogados. Con reputacion baja el taller paga una multa directa. Con reputacion alta, la amenaza se debilita sola.',
        resolver: function() {
            var _rep = (typeof reputacion !== 'undefined' ? reputacion : 50);
            if (_rep < 45) {
                var multa = 400 + Math.round(Math.random() * 300);
                saldo = (typeof saldo !== 'undefined' ? saldo : 0) - multa;
                reputacion = Math.max(0, _rep - 2);
                if (typeof resumenDia !== 'undefined' && Array.isArray(resumenDia.ramificaciones))
                    resumenDia.ramificaciones.push('Presion legal de Valeria: multa de RD$' + multa + '.');
                log('[Hito] Presion legal. Multa -RD$' + multa + '. Reputacion baja fue el costo.', 'error');
            } else {
                reputacion = Math.min(100, _rep + 2);
                log('[Hito] Reputacion solida. Amenaza de Valeria se debilita. +2 reputacion.', 'exito');
            }
        }
    },
    {
        id: 'rival_autofixexpress',
        casosMin: 8,
        texto: 'AutoFix Express abrio con equipo moderno y precios de apertura agresivos. Si tu reputacion supera 50, el barrio se queda contigo. Si no, migran.',
        resolver: function() {
            var _rep = (typeof reputacion !== 'undefined' ? reputacion : 50);
            if (_rep < 50) {
                reputacion = Math.max(0, _rep - 3);
                if (typeof resumenDia !== 'undefined' && Array.isArray(resumenDia.ramificaciones))
                    resumenDia.ramificaciones.push('AutoFix Express capturo clientes del barrio. Tu reputacion no fue suficiente escudo.');
                log('[Hito] AutoFix Express gana clientes. -3 reputacion.', 'error');
            } else {
                if (typeof resumenDia !== 'undefined' && Array.isArray(resumenDia.ramificaciones))
                    resumenDia.ramificaciones.push('AutoFix Express abrio, pero el barrio no se movio. Tu reputacion aguanto el golpe.');
                log('[Hito] AutoFix Express no pudo con tu reputacion. El barrio se quedo.', 'exito');
            }
        }
    },
    {
        id: 'pedido_aumento',
        casosMin: 12,
        texto: 'Los mecanicos piden un aumento formal. No es capricho: llevan semanas sin garantia real de sueldo. El silencio de tu parte tiene un costo que se ve en los turnos.',
        resolver: function() {
            if (typeof mecanicos !== 'undefined' && Array.isArray(mecanicos)) {
                mecanicos.forEach(function(m) { if (m) m.enojo = Math.min(8, (m.enojo || 0) + 1); });
            }
            if (typeof moralEquipo !== 'undefined') moralEquipo = Math.max(0, (moralEquipo || 50) - 5);
            if (typeof resumenDia !== 'undefined' && Array.isArray(resumenDia.ramificaciones))
                resumenDia.ramificaciones.push('Los mecanicos pidieron aumento. Sin respuesta, la moral cae.');
            log('[Hito] Pedido de aumento. Enojo sube. Moral baja. Necesitas dar una respuesta pronto.', 'warn');
        }
    },
    // ─── NUEVO: Victoria temprana (recompensa narrativa) ────────────────────
    {
        id: 'victoria_temprana',
        casosMin: 10,
        texto: 'El barrio empieza a hablar bien del taller. No como rumor: como hecho. Tres clientes nuevos llegaron esta semana recomendados por vecinos que nunca te habian traido un carro.',
        resolver: function() {
            reputacion = Math.min(100, (typeof reputacion !== 'undefined' ? reputacion : 50) + 4);
            estres = Math.max(0, (typeof estres !== 'undefined' ? estres : 0) - 5);
            if (typeof resumenDia !== 'undefined' && Array.isArray(resumenDia.ramificaciones))
                resumenDia.ramificaciones.push('El boca a boca trabaja para ti. +4 reputacion organica.');
            log('[Hito] Victoria temprana. El barrio te recomienda. +4 reputacion, -5 estres.', 'exito');
        }
    },
    {
        id: 'trampa_legal',
        casosMin: 16,
        texto: 'La ex aparece con documentos nuevos. Alega que el taller usa su dinero sin permiso. Su acompanante es abogado y toma fotos del local.',
        resolver: function() {
            var costo = 500 + Math.round(Math.random() * 400);
            var _saldo = (typeof saldo !== 'undefined' ? saldo : 0);
            if (_saldo >= costo) {
                saldo -= costo;
                if (typeof resumenDia !== 'undefined' && Array.isArray(resumenDia.ramificaciones))
                    resumenDia.ramificaciones.push('Amenaza legal respondida. Abogados pagados: -RD$' + costo + '.');
                log('[Hito] Trampa legal respondida. -RD$' + costo + '. El expediente queda en tu favor.', 'info');
            } else {
                deuda = (typeof deuda !== 'undefined' ? deuda : 0) + costo;
                reputacion = Math.max(0, (typeof reputacion !== 'undefined' ? reputacion : 50) - 3);
                if (typeof resumenDia !== 'undefined' && Array.isArray(resumenDia.ramificaciones))
                    resumenDia.ramificaciones.push('Sin fondos para los abogados. Deuda +RD$' + costo + ', reputacion -3.');
                log('[Hito] Sin fondos para abogados. +RD$' + costo + ' deuda, -3 reputacion.', 'error');
            }
        }
    },
    // ─── NUEVO: Traicion posible (Stewart o equipo segun tramaEstado) ────────
    {
        id: 'traicion_posible',
        casosMin: 18,
        texto: 'Alguien del taller hablo con el equipo de Valeria. No sabes quien. El rumor llega por dos fuentes distintas. Confias en tu equipo, pero el juicio se acerca y los errores cuestan mas.',
        resolver: function() {
            var stewartPresente = typeof tramaEstado !== 'undefined' && tramaEstado.stewartActivo;
            if (stewartPresente) {
                // Stewart esta presente: la sospecha recae sobre el, pero puede no ser culpable.
                reputacion = Math.max(0, (typeof reputacion !== 'undefined' ? reputacion : 50) - 2);
                estres = Math.min(100, (typeof estres !== 'undefined' ? estres : 0) + 8);
                if (typeof resumenDia !== 'undefined' && Array.isArray(resumenDia.ramificaciones))
                    resumenDia.ramificaciones.push('La sospecha apunta a Stewart. No tienes pruebas. El juicio se acerca y no puedes permitirte un error de calculo.');
                log('[Hito] Sospecha interna. Stewart en el punto de mira. +8 estres, -2 reputacion.', 'warn');
            } else {
                // Stewart no esta: alguien mas hablo.
                var m = typeof mecanicos !== 'undefined' && Array.isArray(mecanicos) ?
                    mecanicos.find(function(x) { return x && (x.enojo || 0) >= 5; }) : null;
                reputacion = Math.max(0, (typeof reputacion !== 'undefined' ? reputacion : 50) - 3);
                estres = Math.min(100, (typeof estres !== 'undefined' ? estres : 0) + 6);
                var quien = m ? m.nombre : 'alguien del equipo';
                if (typeof resumenDia !== 'undefined' && Array.isArray(resumenDia.ramificaciones))
                    resumenDia.ramificaciones.push('La filtracion apunta a ' + quien + '. El clima interno se envenena justo antes del veredicto.');
                log('[Hito] Filtracion interna. ' + quien + ' bajo sospecha. -3 reputacion, +6 estres.', 'error');
            }
        }
    },
    {
        id: 'fragilidad_final',
        casosMin: 20,
        texto: 'El taller esta en el punto de quiebre. Lo que hagas en los proximos casos define si el barrio te recuerda como alguien que aguanto o como alguien que se doblo.',
        resolver: function() {
            if (typeof resumenDia !== 'undefined' && Array.isArray(resumenDia.ramificaciones))
                resumenDia.ramificaciones.push('Punto de quiebre narrativo. Los proximos casos son los que pesan en el veredicto.');
            log('[Hito] Punto de quiebre. Cada caso que viene es decisivo. El barrio ya eligio de que lado esta.', 'info');
        }
    }
];

// ─────────────────────────────────────────────────────────────────────────────
// MENSAJES DE DESBLOQUEO DE NIVEL DEL TALLER
// ─────────────────────────────────────────────────────────────────────────────
window.TallerData.historiasDesbloqueoNivel = {
    2: {
        titulo: '🔧 Nivel 2: El Taller Respira',
        texto: 'La inversion empieza a dar frutos. Mas espacio, mejores herramientas, clientes que regresan. Pero el barrio tambien lo nota: ahora eres una amenaza para otros negocios.'
    },
    3: {
        titulo: '🔧 Nivel 3: Ojos en el Barrio',
        texto: 'Con tres espacios activos, ya no eres el negocio pequeno que Valeria quiere embargar con facilidad. AutoFix Express manda a alguien a preguntar precios. Cuida lo que dices y a quien se lo dices.'
    },
    4: {
        titulo: '🔧 Nivel 4: El Taller Como Referencia',
        texto: 'Cuatro bahias operativas. Tu reputacion llega a barrios que ni conocias. El juicio se complica para Valeria: ya no es un taller en quiebra. Es un negocio que da empleo, paga impuestos y tiene clientes que hablan bien.'
    },
    5: {
        titulo: '🔧 Nivel 5: Imperio en Construccion',
        texto: 'Cinco espacios. El barrio te respalda. Vecinos que antes pedian el cierre ahora traen sus carros y mandan a sus conocidos. Si llegas al juicio con esto, ganas aunque Valeria tenga el mejor abogado del pais.'
    },
    6: {
        titulo: '🏆 Nivel 6: Maestro del Barrio',
        texto: 'Seis bahias, equipo completo, reputacion que precede al taller. Valeria ya no puede argumentar incompetencia ni abandono. El taller habla por si mismo. Ahora solo queda defenderlo.'
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// FRAGMENTOS NARRATIVOS — contexto adicional con condicion de disparo
// CORREGIDO: ya no son datos huerfanos. Se incluye condicion y como usarlos.
// Uso sugerido: mostrar en panel lateral cuando tramaEstado o stats lo activan.
// ─────────────────────────────────────────────────────────────────────────────
window.TallerData.fragmentosNarrativos = [
    {
        id: 'stewartLealtad',
        condicion: function() {
            return typeof tramaEstado !== 'undefined' && tramaEstado.stewartActivo === true;
        },
        texto: 'Stewart lleva semanas callado pero presente. Si lo tratas con respeto, puede ser tu aliado mas inesperado en el juicio. Si lo presionas, puede irse al lado equivocado. No sabes lo que sabe, pero el barrio si lo sospecha.'
    },
    {
        id: 'stewartDesconfianza',
        condicion: function() {
            return typeof tramaEstado !== 'undefined' && tramaEstado.stewartActivo === false && typeof casosCriticosResueltos !== 'undefined' && casosCriticosResueltos >= 10;
        },
        texto: 'Rechazaste a Stewart cuando volvio. No sabes lo que sabe sobre el cliente sin placa ni sobre Valeria. Ese silencio tiene un costo que todavia no puedes calcular.'
    },
    {
        id: 'clienteMisterioso',
        condicion: function() {
            return typeof tramaEstado !== 'undefined' && (tramaEstado.clienteMisteriosoRelacion || 0) >= 1;
        },
        texto: 'El cliente del vehiculo sin placa no es cualquiera. Sus conexiones van mas alla del barrio. Resolver bien su trabajo puede abrirte puertas que el dinero ordinario no compra. Pero esas puertas abren en ambas direcciones.'
    },
    {
        id: 'rivalAutoFix',
        condicion: function() {
            return typeof casosCriticosResueltos !== 'undefined' && casosCriticosResueltos >= 8;
        },
        texto: 'AutoFix Express tiene equipo moderno y precios de apertura. Pero sus mecanicos no conocen al barrio ni al barrio los conoce a ellos. Tu ventaja es la confianza construida caso a caso. No la pierdas por un atajo.'
    },
    {
        id: 'valeriaAcuerdo',
        condicion: function() {
            return typeof deuda !== 'undefined' && deuda < 40000 && typeof reputacion !== 'undefined' && reputacion >= 60;
        },
        texto: 'Valeria no quiere el taller. Quiere el dinero que el taller representa. Con deuda baja y reputacion alta, un acuerdo extrajudicial es posible. Sus abogados ya hicieron los calculos. Ahora espera que tu tambien lo hagas.'
    },
    {
        id: 'equipoUnido',
        condicion: function() {
            return typeof mecanicos !== 'undefined' && Array.isArray(mecanicos) &&
                   mecanicos.filter(function(m) { return m && (m.lealtad || 0) >= 7; }).length >= 2;
        },
        texto: 'Un equipo con lealtad alta vale mas que cualquier herramienta. Si tus mecanicos llegan al veredicto con moral solida, pueden testificar. Su palabra pesa mas que los papeles de Valeria. Cuida lo que construiste.'
    },
    {
        id: 'malvaviscoGuardia',
        condicion: function() {
            return typeof tramaEstado !== 'undefined' && tramaEstado.sobreAbierto === false;
        },
        texto: 'Malvavisco sigue patrullando el taller de noche. Dos veces ladro hacia la calle oscura sin que nadie apareciera. O hay algo que no ves, o el perro sabe algo que tu todavia no. Ninguna de las dos opciones es tranquilizadora.'
    }
];
