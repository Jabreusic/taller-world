window.TallerData = window.TallerData || {};

// ============================================
// MECÁNICOS INICIALES (corregido)
// ============================================
// velocidad  : rapidez de diagnostico y reparacion (0.0-1.0)
// eficiencia : probabilidad de menos errores y menos piezas consumidas (0.0-1.0)
// humor      : estado emocional base (1-10); se degrada por sobrecarga y celos
// lealtad    : 0-100, probabilidad de quedarse en el taller cuando hay ofertas externas
// xp         : experiencia acumulada; sube con cada trabajo completado
// nivel      : nivel del mecanico (1-5); sube al alcanzar umbral de xp
// puntosHabilidad : puntos libres para invertir en velocidad / eficiencia / humor
window.TallerData.mecanicosIniciales = [
    { 
        nombre: 'Frandy',  
        enojo: 0, 
        habilidad: 0.63,  
        velocidad: 0.59, 
        eficiencia: 0.65, 
        humor: 7, 
        xp: 0, 
        nivel: 1, 
        puntosHabilidad: 0, 
        especialidad: 'motor',       
        casosCompletados: 0, 
        casosMaximosAntesDescanso: 3, // Máximo de casos antes de necesitar descanso
        casosActualesRacha: 0,
        lealtad: 65, 
        deudaConTaller: 0, 
        ocupado: false,
        descansoNecesario: false,
        salarioBase: 800,              // Por caso completado
        bonosPorDesempeno: 0
    },
    { 
        nombre: 'Maicol',  
        enojo: 0, 
        habilidad: 0.72,  
        velocidad: 0.70, 
        eficiencia: 0.74, 
        humor: 8, 
        xp: 0, 
        nivel: 1, 
        puntosHabilidad: 0, 
        especialidad: 'electricidad', 
        casosCompletados: 0, 
        casosMaximosAntesDescanso: 4,
        casosActualesRacha: 0,
        lealtad: 70, 
        deudaConTaller: 0, 
        ocupado: false,
        descansoNecesario: false,
        salarioBase: 850,
        bonosPorDesempeno: 0
    }
];

// ============================================
// MECÁNICOS DISPONIBLES PARA CONTRATAR (adaptado a casos)
// ============================================
window.TallerData.mecanicosDisponiblesBase = [
    { 
        nombre: 'Ridalvi', 
        enojo: 0, 
        habilidad: 0.54,  
        velocidad: 0.72, 
        eficiencia: 0.50, 
        humor: 6, 
        xp: 0, 
        nivel: 1, 
        puntosHabilidad: 0, 
        especialidad: 'frenos',       
        casosCompletados: 0, 
        casosMaximosAntesDescanso: 3,
        casosActualesRacha: 0,
        lealtad: 50, 
        deudaConTaller: 0, 
        ocupado: false, 
        descansoNecesario: false,
        costo: 1500, 
        casosMinimosRequeridos: 5,     // Mínimo de casos del taller para contratar
        repMin: 48,
        salarioBase: 750
    },
    { 
        nombre: 'Jeral',   
        enojo: 0, 
        habilidad: 0.68, 
        velocidad: 0.52, 
        eficiencia: 0.70, 
        humor: 9, 
        xp: 0, 
        nivel: 1, 
        puntosHabilidad: 0, 
        especialidad: 'suspension',    
        casosCompletados: 0, 
        casosMaximosAntesDescanso: 4,
        casosActualesRacha: 0,
        lealtad: 75, 
        deudaConTaller: 0, 
        ocupado: false, 
        descansoNecesario: false,
        costo: 2200, 
        casosMinimosRequeridos: 10, 
        repMin: 58,
        salarioBase: 820
    },
    { 
        nombre: 'Edwin',   
        enojo: 0, 
        habilidad: 0.59, 
        velocidad: 0.56, 
        eficiencia: 0.79, 
        humor: 7, 
        xp: 0, 
        nivel: 1, 
        puntosHabilidad: 0, 
        especialidad: 'transmision',   
        casosCompletados: 0, 
        casosMaximosAntesDescanso: 3,
        casosActualesRacha: 0,
        lealtad: 68, 
        deudaConTaller: 0, 
        ocupado: false, 
        descansoNecesario: false,
        costo: 2800, 
        casosMinimosRequeridos: 15, 
        repMin: 62,
        salarioBase: 900
    },
    { 
        nombre: 'Stewart', 
        enojo: 0, 
        habilidad: 0.81,  
        velocidad: 0.83, 
        eficiencia: 0.77, 
        humor: 6, 
        xp: 0, 
        nivel: 1, 
        puntosHabilidad: 0, 
        especialidad: 'motor',        
        casosCompletados: 0, 
        casosMaximosAntesDescanso: 5,
        casosActualesRacha: 0,
        lealtad: 45, 
        deudaConTaller: 0, 
        ocupado: false, 
        descansoNecesario: false,
        costo: 4300, 
        casosMinimosRequeridos: 25, 
        repMin: 70,
        salarioBase: 1100
    },
    { 
        nombre: 'Cristofer',
        enojo: 0, 
        habilidad: 0.67, 
        velocidad: 0.61, 
        eficiencia: 0.76, 
        humor: 8, 
        xp: 0, 
        nivel: 1, 
        puntosHabilidad: 0, 
        especialidad: 'electricidad', 
        casosCompletados: 0, 
        casosMaximosAntesDescanso: 4,
        casosActualesRacha: 0,
        lealtad: 82, 
        deudaConTaller: 0, 
        ocupado: false, 
        descansoNecesario: false,
        costo: 3600, 
        casosMinimosRequeridos: 20, 
        repMin: 66,
        salarioBase: 950
    },
    { 
        nombre: 'Martin',  
        enojo: 0, 
        habilidad: 0.61, 
        velocidad: 0.63, 
        eficiencia: 0.67, 
        humor: 8, 
        xp: 0, 
        nivel: 1, 
        puntosHabilidad: 0, 
        especialidad: 'general',      
        casosCompletados: 0, 
        casosMaximosAntesDescanso: 6, // Puede con más casos por ser todoterreno
        casosActualesRacha: 0,
        lealtad: 90, 
        deudaConTaller: 0, 
        ocupado: false, 
        descansoNecesario: false,
        costo: 3200, 
        casosMinimosRequeridos: 12, 
        repMin: 60,
        salarioBase: 880
    },
    { 
        nombre: 'Miguel',  
        enojo: 0, 
        habilidad: 0.69, 
        velocidad: 0.82, 
        eficiencia: 0.62, 
        humor: 6, 
        xp: 0, 
        nivel: 1, 
        puntosHabilidad: 0, 
        especialidad: 'general',      
        casosCompletados: 0, 
        casosMaximosAntesDescanso: 4,
        casosActualesRacha: 0,
        lealtad: 55, 
        deudaConTaller: 0, 
        ocupado: false, 
        descansoNecesario: false,
        costo: 3900, 
        casosMinimosRequeridos: 18, 
        repMin: 68,
        salarioBase: 1000
    },
    {
        nombre: 'Diego',
        enojo: 0,
        habilidad: 0.66,
        velocidad: 0.64,
        eficiencia: 0.78,
        humor: 8,
        xp: 0,
        nivel: 1,
        puntosHabilidad: 0,
        especialidad: 'transmision',
        casosCompletados: 0,
        casosMaximosAntesDescanso: 4,
        casosActualesRacha: 0,
        lealtad: 72,
        deudaConTaller: 0,
        ocupado: false,
        descansoNecesario: false,
        costo: 3000,
        casosMinimosRequeridos: 14,
        repMin: 62,
        salarioBase: 900,
        capacidadCasosSimultaneos: 2
    }
];

// ============================================
// RIVALIDADES ENTRE MECÁNICOS (expandido)
// ============================================
window.TallerData.rivalidades = {
    Frandy: ['Ridalvi', 'Miguel'],
    Maicol: ['Edwin', 'Jeral', 'Miguel'],
    Ridalvi: ['Frandy', 'Stewart'],
    Jeral: ['Maicol', 'Miguel', 'Cristofer'],
    Edwin: ['Maicol', 'Miguel', 'Stewart'],
    Stewart: ['Maicol', 'Miguel', 'Edwin'],
    Cristofer: ['Jeral', 'Martin'],
    Martin: ['Cristofer', 'Miguel'],
    Miguel: ['Frandy', 'Maicol', 'Jeral', 'Edwin', 'Stewart', 'Martin'],
    Diego: ['Edwin', 'Maicol']
};

// ============================================
// SISTEMA DE DESCANSO POR CASOS (NUEVO)
// ============================================
window.TallerData.sistemaDescanso = {
    // Después de N casos, el mecánico necesita descansar
    casosPorDefectoAntesDescanso: 4,
    // Penalizaciones por trabajar sin descanso
    penalizacionVelocidadPorFatiga: 0.15,    // -15% velocidad
    penalizacionEficienciaPorFatiga: 0.10,   // -10% eficiencia
    penalizacionHumorPorFatiga: 2,           // -2 puntos de humor
    // Recuperación después de descansar
    casosNecesariosParaDescansoCompleto: 1,   // Descansar equivale a saltarse 1 caso
    recuperacionHumorPorDescanso: 3,
    // Probabilidad de conflicto cuando varios mecánicos están fatigados
    probabilidadConflictoBaseFatiga: 0.3
};

// ============================================
// EVENTOS DE FATIGA Y CONFLICTOS (NUEVO)
// ============================================
window.TallerData.eventosFatiga = [
    {
        nivelFatiga: 'leve', // 1 caso extra sin descanso
        mensajes: [
            '{nombre} bosteza mientras trabaja.',
            '{nombre} se toma un café rapidito.',
            '{nombre} pregunta cuándo termina su turno.'
        ],
        efectoHumor: -1,
        efectoVelocidad: -0.05
    },
    {
        nivelFatiga: 'moderada', // 2 casos extra sin descanso
        mensajes: [
            '{nombre} comete un error tonto y tiene que repetir.',
            '{nombre} se queja del ruido del taller.',
            '{nombre} discute con un compañero por una herramienta.'
        ],
        efectoHumor: -2,
        efectoVelocidad: -0.10,
        efectoEficiencia: -0.05
    },
    {
        nivelFatiga: 'severa', // 3+ casos extra sin descanso
        mensajes: [
            '{nombre} casi causa un accidente por no prestar atención.',
            '{nombre} tira una herramienta al suelo frustrado.',
            '{nombre} amenaza con renunciar si no le dan descanso.'
        ],
        efectoHumor: -3,
        efectoVelocidad: -0.20,
        efectoEficiencia: -0.10,
        riesgoRenuncia: 0.1
    }
];

// ============================================
// SISTEMA DE LEALTAD Y RETENCIÓN (NUEVO)
// ============================================
window.TallerData.sistemaLealtad = {
    factoresIncremento: {
        bonoPorDesempeno: 2,        // +2 lealtad por cada bono recibido
        resolucionConflicto: 3,      // +3 lealtad si el jefe media en conflictos
        casosConExito: 0.2,          // +0.2 lealtad por caso exitoso
        tratoJusto: 5,               // +5 por eventos de trato justo
        prestamoTaller: 1,           // +1 lealtad por cada 100 prestados
        descansoRespetado: 2         // +2 cuando se respeta su descanso
    },
    factoresDecremento: {
        sobrecargaPorCaso: -0.3,     // -0.3 por caso extra sin descanso
        conflictoNoResuelto: -4,      // -4 si hay conflicto y no se media
        salarioBajo: -1,              // -1 si el salario es bajo comparado con mercado
        favoritismo: -3               // -3 si percibe favoritismo hacia otros
    },
    umbralesRenuncia: {
        lealtadBaja: 20,              // Por debajo de 20, riesgo de renuncia
        probabilidadBaseRenuncia: 0.05,
        probabilidadPorConflicto: 0.15
    }
};

// ============================================
// BIOGRAFÍAS DE MECÁNICOS (corregidas y expandidas)
// ============================================
window.TallerData.biografiasMecanicos = {
    Frandy: {
        historia: 'Jefe de piso. Aprendió con su padre en motores diesel y vive por el sonido perfecto. Su oído es tan fino que puede diagnosticar un fallo de compresión solo con el arranque.',
        habilidadTexto: 'Motor y diagnóstico de ruido. +5% velocidad en motores.',
        rivalidad: 'Choca con Ridalvi por métodos y orden del taller. Ridalvi improvisa; Frandy sigue el manual.',
        necesidad: 'Su hija necesita uniformes escolares. Aceptaría casos extras por un bono.',
        fraseCelebre: 'El motor habla, solo hay que saber escucharlo.',
        foto: 'img/mecanicos/frandy.png'
    },
    Maicol: {
        historia: 'Especialista en cableado. Puede encontrar una fuga eléctrica en minutos. Empezó arreglando radios y terminó dominando la ECU.',
        habilidadTexto: 'Electricidad y sensores. +10% eficiencia en diagnósticos eléctricos.',
        rivalidad: 'Compite con Edwin por quien resuelve primero los casos complejos. Llevan el marcador personal.',
        necesidad: 'Le robaron herramientas en una guagua. Necesita RD$4000 para reemplazarlas.',
        fraseCelebre: 'La corriente no miente, los cables sí si están mal pelados.',
        foto: 'img/mecanicos/maicol.png'
    },
    Ridalvi: {
        historia: 'Rápido con frenos y suspensión; improvisa cuando faltan repuestos. Su lema es "más vale rápido y funcional que lento y perfecto".',
        habilidadTexto: 'Frenos y ajustes urgentes. Velocidad +15% en frenos, pero -5% eficiencia.',
        rivalidad: 'No soporta la lentitud de Frandy cuando hay cola de clientes. Le grita "¡échale pierda!"',
        necesidad: 'Tiene a su madre hospitalizada y necesita efectivo rápido. Busca adelantos de salario.',
        fraseCelebre: 'Si no tienes la pieza, haz que funcione con lo que hay.',
        foto: 'img/mecanicos/ridalvi.png'
    },
    Jeral: {
        historia: 'Paciente y técnico. Es el que calma discusiones cuando todo explota. Antes fue supervisor en un taller grande.',
        habilidadTexto: 'Suspensión y alineación. +10% humor general del taller cuando está presente.',
        rivalidad: 'Tiene roces con Maicol por temas de calidad vs velocidad. Jeral prefiere hacerlo bien aunque tome tiempo.',
        necesidad: 'Debe pagar una renta atrasada esta semana. Un bono extra lo salvaría.',
        fraseCelebre: 'La suspensión es como la vida: si está desalineada, todo vibra.',
        foto: 'img/mecanicos/jeral.png'
    },
    Edwin: {
        historia: 'Obseo de cajas y transmisión. Siempre pide piezas originales. Colecciona manuales de taller de los 80s.',
        habilidadTexto: 'Transmisión y calibración fina. +15% eficiencia en cajas automáticas.',
        rivalidad: 'Se pica con Maicol por los bonos de fin de semana. Quiere demostrar que la transmisión es más compleja que la electricidad.',
        necesidad: 'Rompió el bomper de su Riva y necesita RD$1600 para repararla.',
        fraseCelebre: 'La caja es el cerebro del movimiento. Si falla, el carro no es nada.',
        foto: 'img/mecanicos/edwin.png'
    },
    Stewart: {
        historia: 'Técnico de alto rendimiento. Resuelve rápido y casi siempre clava el diagnóstico fino. Viene del mundo de la competición.',
        habilidadTexto: 'Motor y pruebas de precisión aceleradas. +10% velocidad y +5% eficiencia.',
        rivalidad: 'Se enfrenta con Maicol por quien domina los casos de alta presión. Stewart quiere montar su propio taller de preparaciones.',
        necesidad: 'Quiere reunir capital para abrir su propio box de preparaciones. Busca socios.',
        fraseCelebre: 'En carrera no hay tiempo para segundas oportunidades.',
        foto: 'img/mecanicos/stewart.png'
    },
    Cristofer: {
        historia: 'Sereno y consistente. Prefiere cerrar casos limpios sin improvisar. Los clientes lo piden porque explica bien las reparaciones.',
        habilidadTexto: 'Electricidad y control de calidad final. +10% satisfacción cliente.',
        rivalidad: 'Discute con Jeral por los tiempos de entrega cuando hay mucha cola. Ella prioriza calidad, él velocidad.',
        necesidad: 'Apoya a su familia y busca bonos estables cada semana. Es padre soltero.',
        fraseCelebre: 'Un trabajo limpio es un trabajo que no regresa.',
        foto: 'img/mecanicos/morenai.png'
    },
    Martin: {
        historia: 'Todero del taller. Aprendió de todo un poco viendo videos y preguntando hasta conseguir trabajo. Siempre dice que sí, sin importar el caso. Es el comodín perfecto.',
        habilidadTexto: 'Cualquier especialidad, sin excusas. Puede con todo, pero sin bonus específicos.',
        rivalidad: 'No tiene rivalidades declaradas; todos lo aguantan porque siempre está disponible. Es el "pulmón" del taller.',
        necesidad: 'Paga medicina y visitas médicas recurrentes. Necesita trabajo constante y estable.',
        fraseCelebre: '¿Que no has hecho eso? Yo tampoco, pero vamos a aprender.',
        foto: 'img/mecanicos/martin.png'
    },
    Miguel: {
        historia: 'Comodín de calle. Se adapta a cualquier avería y mete velocidad alta cuando hay presión en cola. Callejero y pícaro.',
        habilidadTexto: 'Comodín rápido para cierres urgentes. +20% velocidad cuando hay cola de 3+ casos.',
        rivalidad: 'Se enciende fácil con otros mecánicos y provoca choques de piso cuando hay tensión. Miguel es gasolina pura.',
        necesidad: 'Busca turnos largos para cubrir una deuda familiar. Necesita ingresos extras ya.',
        fraseCelebre: 'Dame 20 minutos y te entrego el carro andando.',
        foto: 'img/mecanicos/miguel.png'
    },
    Diego: {
        historia: 'Especialista en transmisiones y calibracion fina. Antes de desmontar una caja, escucha cada cambio y revisa el historial completo.',
        habilidadTexto: 'Transmision y precision. +10% eficiencia en diagnosticos de transmision.',
        rivalidad: 'Discute con Edwin por los metodos de calibracion y con Maicol por los limites entre sensores y transmision.',
        necesidad: 'Esta ahorrando para certificarse en cajas automaticas.',
        fraseCelebre: 'Un cambio suave empieza con una lectura precisa.',
        foto: 'img/mecanicos/diego.png'
    }
};

// ============================================
// COMPATIBILIDAD ENTRE MECÁNICOS (NUEVO)
// ============================================
window.TallerData.compatibilidad = {
    // Pares que trabajan bien juntos
    sinergias: [
        ['Frandy', 'Maicol'],      // Motor + Electricidad = diagnóstico completo
        ['Jeral', 'Martin'],        // Paciencia + Todero = estabilidad
        ['Cristofer', 'Edwin'],     // Calidad + Transmisión = perfección
        ['Stewart', 'Miguel']       // Alto rendimiento + Velocidad = casos rápidos
    ],
    // Bonos por sinergia
    bonoSinergia: {
        velocidad: 0.08,            // +8% velocidad cuando trabajan juntos
        eficiencia: 0.05,           // +5% eficiencia
        humor: 1                     // +1 humor para ambos
    },
    // Pares que chocan
    conflictos: [
        ['Frandy', 'Ridalvi'],       // Manual vs Improvisación
        ['Maicol', 'Edwin'],          // Electricidad vs Transmisión (compiten)
        ['Jeral', 'Miguel'],          // Paciencia vs Impaciencia
        ['Stewart', 'Maicol']         // Competencia directa por liderazgo
    ],
    // Penalización por conflicto
    penalizacionConflicto: {
        velocidad: -0.10,             // -10% velocidad
        eficiencia: -0.10,            // -10% eficiencia
        humor: -2,                    // -2 humor para ambos
        probabilidadPelea: 0.2        // 20% probabilidad de pelea por caso
    }
};

// ============================================
// SISTEMA DE SALARIOS Y BONOS (NUEVO)
// ============================================
window.TallerData.salarios = {
    salarioBasePorNivel: {
        1: 800,
        2: 1000,
        3: 1300,
        4: 1700,
        5: 2200
    },
    bonos: {
        casoComplejo: 0.2,            // +20% sobre salario base por caso de dificultad >0.8
        clienteSatisfecho: 150,        // Bono fijo por cliente que vuelve
        sinErrores: 200,               // Bono por 5 casos sin errores
        especialidad: 0.15,            // +15% si el caso es de su especialidad
        horasExtras: 0.25              // +25% si trabaja sin descanso (pero afecta humor)
    },
    frecuenciaPago: 'porCaso'          // Se paga después de cada caso completado
};

// ============================================
// EVENTOS ESPECIALES DE MECÁNICOS (NUEVO)
// ============================================
window.TallerData.eventosMecanicos = [
    {
        nombre: 'Prestamo urgente',
        descripcion: '{nombre} necesita {cantidad} para una emergencia. ¿Se lo prestas?',
        opciones: [
            { texto: 'Prestar (gana lealtad)', efecto: { dinero: -1, lealtad: 5 } },
            { texto: 'No prestar (pierde lealtad)', efecto: { lealtad: -5, humor: -1 } }
        ]
    },
    {
        nombre: 'Conflicto entre compañeros',
        descripcion: '{nombre1} y {nombre2} están discutiendo por {motivo}.',
        opciones: [
            { texto: 'Mediar (gasta tiempo, gana respeto)', efecto: { lealtad: 3, humor: 2, tiempo: -1 } },
            { texto: 'Dejar que resuelvan', efecto: { lealtad: -2, humor: -2, probabilidadPelea: 0.3 } }
        ]
    },
    {
        nombre: 'Oferta externa',
        descripcion: '{nombre} recibió una oferta de otro taller. ¿Le mejoras el salario?',
        opciones: [
            { texto: 'Mejorar salario en 15%', efecto: { dinero: -1, lealtad: 10 } },
            { texto: 'No igualar oferta', efecto: { lealtad: -15, riesgoRenuncia: 0.4 } }
        ]
    },
    {
        nombre: 'Cumpleaños',
        descripcion: 'Es el cumpleaños de {nombre}. ¿Le haces un detalle?',
        opciones: [
            { texto: 'Comprar pastel (RD$500)', efecto: { dinero: -500, lealtad: 8, humor: 3 } },
            { texto: 'Solo felicitar', efecto: { lealtad: 2, humor: 1 } },
            { texto: 'Ignorar', efecto: { lealtad: -2 } }
        ]
    }
];
