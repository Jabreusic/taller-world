(function () {
    window.TallerData = window.TallerData || {};

    var data = window.TallerData;
    data.subcategorias = data.subcategorias || {};
    data.subcategorias.hibrido = [
        'Bateria de alta tension',
        'Inversor y convertidor',
        'Sistema de regeneracion',
        'Gestion termica hibrida'
    ];
    data.subcategorias.diagnostico_avanzado = [
        'Red CAN y modulos',
        'Telemetria y sensores',
        'Calibracion avanzada'
    ];

    data.diagnosticos = data.diagnosticos || [];
    data.diagnosticos.push(
        { nombre: 'Bateria hibrida con celdas desbalanceadas', dificultad: 0.82, pagoBase: 2400, tiempo: 4, especialidad: 'hibrido', subcategoria: 'Bateria de alta tension' },
        { nombre: 'Inversor hibrido con perdida intermitente', dificultad: 0.9, pagoBase: 3200, tiempo: 5, especialidad: 'hibrido', subcategoria: 'Inversor y convertidor' },
        { nombre: 'Frenado regenerativo fuera de calibracion', dificultad: 0.76, pagoBase: 1900, tiempo: 3, especialidad: 'hibrido', subcategoria: 'Sistema de regeneracion' },
        { nombre: 'Red CAN con modulos fuera de linea', dificultad: 0.92, pagoBase: 3500, tiempo: 5, especialidad: 'diagnostico_avanzado', subcategoria: 'Red CAN y modulos' },
        { nombre: 'Telemetria contradictoria en unidad premium', dificultad: 0.86, pagoBase: 2800, tiempo: 4, especialidad: 'diagnostico_avanzado', subcategoria: 'Telemetria y sensores' },
        { nombre: 'Calibracion avanzada de asistencia', dificultad: 0.88, pagoBase: 3000, tiempo: 4, especialidad: 'diagnostico_avanzado', subcategoria: 'Calibracion avanzada' }
    );

    data.mecanicosDisponiblesBase = data.mecanicosDisponiblesBase || [];
    data.mecanicosDisponiblesBase.push(
        {
            nombre: 'Nayeli', habilidad: 0.75, velocidad: 0.58, eficiencia: 0.82, humor: 8,
            xp: 0, nivel: 1, puntosHabilidad: 0, especialidad: 'hibrido',
            casosCompletados: 0, casosMaximosAntesDescanso: 4, casosActualesRacha: 0,
            lealtad: 76, deudaConTaller: 0, ocupado: false, descansoNecesario: false,
            costo: 5200, casosMinimosRequeridos: 30, repMin: 72, salarioBase: 1150
        },
        {
            nombre: 'Dario', habilidad: 0.86, velocidad: 0.62, eficiencia: 0.78, humor: 7,
            xp: 0, nivel: 1, puntosHabilidad: 0, especialidad: 'diagnostico_avanzado',
            casosCompletados: 0, casosMaximosAntesDescanso: 3, casosActualesRacha: 0,
            lealtad: 62, deudaConTaller: 0, ocupado: false, descansoNecesario: false,
            costo: 6800, casosMinimosRequeridos: 40, repMin: 78, salarioBase: 1350
        }
    );

    data.arcoNarrativo = data.arcoNarrativo || [];
    data.arcoNarrativo.push(
        {
            id: 'arco7',
            capitulo: 7,
            titulo: 'Capitulo 7: La Segunda Llave',
            casosMin: 35,
            nivelMin: 5,
            textoInicio: 'El veredicto abrio una puerta inesperada: los talleres del distrito industrial necesitan diagnosticos que nadie mas sabe hacer. La tecnologia hibrida llega con clientes exigentes y fallas que no perdonan improvisaciones.',
            textoCierre: 'La primera bateria de alta tension quedo registrada. El taller ya no solo repara autos: empieza a interpretar el futuro del barrio.',
            descripcion: 'Nuevos vehiculos, nuevas herramientas y una especializacion que puede convertir al taller en referencia del distrito industrial.'
        },
        {
            id: 'arco8',
            capitulo: 8,
            titulo: 'Capitulo 8: La Red Invisible',
            casosMin: 45,
            nivelMin: 6,
            textoInicio: 'Los casos avanzados revelan una red de datos compartida entre talleres, aseguradoras y flotas. Cada diagnostico preciso abre una alianza; cada error deja una marca que viaja mas rapido que cualquier rumor.',
            textoCierre: 'La red ya conoce tu nombre. Ahora debes decidir si seras el taller que la controla o el taller que aprende a vivir dentro de ella.',
            descripcion: 'La especializacion avanzada convierte la reputacion en contratos, alianzas y riesgos que superan las calles conocidas.'
        }
    );

    data.zonasBarrio = [
        { id: 'taller', icono: '&#x1F527;', nombre: 'Tu taller', descripcion: 'Nuevos casos y reparaciones', requisitoCasos: 0, requisitoNivel: 1, accion: 'taller', estado: 'operativa' },
        { id: 'corredor-comercial', icono: '&#x1F3EA;', nombre: 'Corredor comercial', descripcion: 'Banco, repuestos y cafetin', requisitoCasos: 0, requisitoNivel: 1, accion: 'exterior', estado: 'operativa' },
        { id: 'centro-gestion', icono: '&#x1F3E2;', nombre: 'Centro de gestion', descripcion: 'Contrataciones y mejoras', requisitoCasos: 0, requisitoNivel: 1, accion: 'oficina', estado: 'operativa' },
        { id: 'zona-premium', icono: '&#x1F3C1;', nombre: 'Zona premium', descripcion: 'Clientes de alto valor y rivales fuertes', requisitoCasos: 12, requisitoNivel: 3, accion: 'mapa', estado: 'riesgo alto' },
        { id: 'distrito-industrial', icono: '&#x2699;', nombre: 'Distrito industrial', descripcion: 'Casos hibridos y contratos de flota', requisitoCasos: 35, requisitoNivel: 5, accion: 'taller', estado: 'especializacion hibrida' },
        { id: 'nodo-tecnologico', icono: '&#x1F4E1;', nombre: 'Nodo tecnologico', descripcion: 'Diagnostico avanzado y alianzas', requisitoCasos: 45, requisitoNivel: 6, accion: 'oficina', estado: 'red profesional' }
    ];
})();
