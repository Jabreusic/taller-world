window.TallerData = window.TallerData || {};

window.TallerData.economy = {
    // Sistema de progresión basado en CASOS (reparaciones completadas)
    totalCasosJugados: 0,                // Casos totales en la partida
    rachaCasosExitosos: 0,               // Racha de casos completados sin fallos críticos
    reputacionInicial: 50,
    reputacionPorCasoBase: 0.5,          // Ganancia pequeña por caso bien resuelto
    reputacionPorRachaMultiplicador: 0.1, // Bonus por racha
    
    // Sistema financiero
    saldoInicial: 2000,
    deudaInicial: 100000,
    limiteCreditoBase: 6000,
    limiteCreditoMin: 6000,
    limiteCreditoMax: 12000,              // Aumenta con nivel de taller
    interesPrestamoRapido: 0.12,
    
    // Sistema de mora (ahora por casos sin pagar)
    moraCasosSinPagoUmbral: 4,
    moraMinimaFlujo: 450,
    tasaMoraFlujo: 0.012,
    
    // Sistema de energía/foco (reemplaza hambre/sueño)
    focoBase: 10,
    focoInicial: 10,
    focoMaximo: 30,                       // Aumenta con mejoras
    focoRecuperacionPorComida: 8,          // Comer recupera foco
    focoRecuperacionPorCafe: 4,            // Cafe recupera parcial
    
    // Sistema de equipo
    moralEquipoInicial: 50,
    moralPorCasoExitoso: 1,
    moralPorCasoFallido: -3,
    moralPorCapacitacion: 5,
    
    // Infraestructura
    espaciosReparacionInicial: 2,
    tallerNivelInicial: 1,
    tallerNivelMax: 6,
    mejorasIniciales: {
        herramientas: 0,
        publicidad: 0,
        capacitacion: 0,
        maquinaDiagnosis: false,
        autolavado: false
    },
    mejorasTacticasIniciales: {
        bateria: 0,
        manualHablar: false,
        scannerDx: false,
        flujoReparacion: false,
        organizadorCola: false,
        controlCalidad: false,
        fidelidadClientes: false,
        ahorroOperativo: false
    },
    
    // Límites operativos
    maxColaEspera: 5,                     // Máximo de casos en cola
    casosSimultaneos: 2,                   // Casos que se pueden atender a la vez
    
    // Guardado
    saveKey: 'taller_casos_world_save_v2',
    optionsKey: 'taller_casos_world_options_v2',
    
    mapaVehiculosLegacy: {},
    hashVehiculosLegacy: {},
    hashMarcasVehiculoLegacy: {},
    
    // ============================================
    // COSTOS DE ACCIONES (ahora por CASO)
    // ============================================
    costosPorCaso: {
        // Acciones principales
        hablarCliente: { foco: 1, moral: 0.2 },      // Gasta foco, mejora un poco la moral
        diagnostico: { foco: 2, moral: 0 },          // Gasta foco, neutro
        reparacion: { foco: 3, moral: 0.5 },         // Gasta foco, mejora moral si sale bien
        negociacion: { foco: 2, moral: -0.5 },       // Gasta foco, puede desgastar
        comprarPieza: { foco: 1, moral: 0 },          // Gasto mínimo
        
        // Acciones de gestión
        gestionarCola: { foco: 1, moral: 0.3 },       // Organizar mejora la moral
        contratar: { foco: 2, moral: 2 },             // Contratar ayuda (costo moral positivo)
        capacitar: { foco: 2, moral: 3 },              // Capacitar mejora moral significativamente
        
        // Acciones de recuperación
        comer: { foco: -8, moral: 2, costoDinero: 120 },  // Recupera foco, gasta dinero
        cafe: { foco: -4, moral: 1, costoDinero: 45 },    // Recupera foco parcial
        
        // Acciones sociales
        mediarConflicto: { foco: 2, moral: 4 },        // Media conflictos en el equipo
        irAlBar: { foco: -3, moral: 5, costoDinero: 200 }, // Mejora moral, recupera foco, gasta dinero
        
        // Estrategia
        planificarEstrategia: { foco: 1, moral: 1 },    // Planificar ayuda
        decisionHistoria: { foco: 1, moral: 1 },        // Decisiones narrativas
        
        // Espera / Inactividad
        esperaActiva: { foco: -1, moral: -0.5 },        // Esperar aburre
    },
    
    // ============================================
    // MISIONES (adaptadas a progresión por casos)
    // ============================================
    misionesLogros: [
        {
            tipo: 'primeros_pasos',
            titulo: 'Primer Caso',
            descripcion: 'Completa tu primer caso con éxito',
            objetivoCasos: 1,
            recompensa: 500,
            recompensaReputacion: 5,
            completada: false
        },
        {
            tipo: 'racha_inicial',
            titulo: 'Buena Racha',
            descripcion: 'Completa 3 casos seguidos sin fallos',
            objetivoRacha: 3,
            recompensa: 800,
            recompensaReputacion: 8,
            completada: false
        },
        {
            tipo: 'volumen',
            titulo: 'Taller Activo',
            descripcion: 'Acumula 10 casos completados',
            objetivoCasos: 10,
            recompensa: 1500,
            recompensaReputacion: 12,
            completada: false
        },
        {
            tipo: 'calidad',
            titulo: 'Diagnóstico Fino',
            descripcion: 'Completa 5 diagnósticos con éxito',
            objetivoDiagnosticos: 5,
            recompensa: 1200,
            recompensaReputacion: 10,
            completada: false
        },
        {
            tipo: 'especializacion_motor',
            titulo: 'Especialista en Motores',
            descripcion: 'Completa 8 reparaciones de motor',
            objetivoEspecialidad: 'motor',
            objetivoCantidad: 8,
            recompensa: 1800,
            recompensaReputacion: 15,
            completada: false
        },
        {
            tipo: 'especializacion_electronica',
            titulo: 'Experto en Electrónica',
            descripcion: 'Completa 8 reparaciones eléctricas',
            objetivoEspecialidad: 'electricidad',
            objetivoCantidad: 8,
            recompensa: 2000,
            recompensaReputacion: 15,
            completada: false
        },
        {
            tipo: 'cliente_dificil',
            titulo: 'Cliente Exigente',
            descripcion: 'Satisface a 3 clientes con personalidad "desconfiado" o "tecnico"',
            objetivoClientesDificiles: 3,
            recompensa: 1400,
            recompensaReputacion: 12,
            completada: false
        },
        {
            tipo: 'sin_complicaciones',
            titulo: 'Flujo Perfecto',
            descripcion: 'Completa 5 casos sin complicaciones',
            objetivoSinComplicaciones: 5,
            recompensa: 1600,
            recompensaReputacion: 14,
            completada: false
        },
        {
            tipo: 'maestro_taller',
            titulo: 'Maestro del Taller',
            descripcion: 'Alcanza nivel de taller 3',
            objetivoNivelTaller: 3,
            recompensa: 2500,
            recompensaReputacion: 20,
            completada: false
        },
        {
            tipo: 'leyenda_local',
            titulo: 'Leyenda Local',
            descripcion: 'Alcanza 85 de reputación',
            objetivoReputacion: 85,
            recompensa: 3000,
            recompensaReputacion: 25,
            completada: false
        }
    ],
    
    // ============================================
    // REQUISITOS DE MEJORA (basados en casos)
    // ============================================
    requisitosMejora: {
        // Mejoras de herramientas (3 niveles)
        herramientas: { 
            casosMin: [0, 5, 15],        // Nivel 0->1: 5 casos, 1->2: 15 casos
            nivelMin: 1, 
            repMin: [40, 50, 60], 
            tallerMin: 1, 
            costoBase: 1800, 
            costoPorNivel: 1100, 
            max: 10
        },
        // Publicidad (4 niveles)
        publicidad: { 
            casosMin: [0, 8, 20, 35],     // Desbloqueo progresivo
            nivelMin: 2, 
            repMin: [45, 55, 65, 75], 
            tallerMin: 1, 
            costoBase: 1400, 
            costoPorNivel: 700, 
            max: 10
        },
        // Capacitación (4 niveles)
        capacitacion: { 
            casosMin: [0, 12, 28, 45], 
            nivelMin: 3, 
            repMin: [50, 60, 70, 80], 
            tallerMin: 2, 
            costoBase: 1800, 
            costoPorNivel: 900, 
            max: 10
        },
        // Máquina de diagnóstico (única)
        maquinaDiagnosis: { 
            casosMin: 25, 
            nivelMin: 4, 
            repMin: 68, 
            tallerMin: 3, 
            costoBase: 4200, 
            costoPorNivel: 0, 
            max: 10
        }
    },
    
    // ============================================
    // MEJORAS TÁCTICAS (desbloqueables)
    // ============================================
    tiendaTactica: {
        // Recargas
        recarga_foco: { 
            costo: 320, 
            nombre: 'Recarga de energía',
            descripcion: 'Recupera 8 de foco instantáneamente'
        },
        // Batería de energía (aumenta foco máximo)
        bateria: { 
            costoBase: 600, 
            costoPorNivel: 250, 
            max: 3, 
            nombre: 'Batería de energía',
            descripcion: 'Aumenta el foco máximo en +5 por nivel',
            bonusFocoMax: 5
        },
        // Manual de entrevista (mejora negociación)
        manual_hablar: { 
            costo: 850, 
            nombre: 'Manual de entrevista',
            descripcion: 'Reduce costo de foco al hablar con clientes en 1',
            desbloqueado: false
        },
        // Scanner rápido (mejora diagnóstico)
        scanner_dx: { 
            costo: 1200, 
            nombre: 'Scanner rápido',
            descripcion: 'Reduce costo de foco en diagnósticos en 1',
            desbloqueado: false 
        },
        // Flujo de reparación (mejora eficiencia)
        flujo_reparacion: { 
            costo: 1650, 
            nombre: 'Flujo de reparación',
            descripcion: 'Aumenta en 0.5 la ganancia de moral por reparación',
            desbloqueado: false 
        },
        // Kit de herramientas profesional (reduce costo reparación)
        kit_herramientas_pro: {
            costo: 2200,
            nombre: 'Kit Profesional',
            descripcion: 'Reduce costo de foco en reparaciones en 1',
            desbloqueado: false
        },
        // Cliente frecuente (aumenta ingresos)
        cliente_frecuente: {
            costo: 1800,
            nombre: 'Cliente Frecuente',
            descripcion: 'Aumenta en 5% los pagos base de clientes recurrentes',
            desbloqueado: false
        }
    },
    
    // ============================================
    // MEJORA DE TALLER (niveles)
    // ============================================
    mejoraTaller: {
        costoBase: 1400,
        costoPorNivel: 1000,
        casosBase: 5,                    // Casos mínimos para nivel 2
        casosPorNivel: 10,                 // +10 casos por nivel adicional
        nivelBase: 2,
        repBase: 52,
        repPorNivel: 5,
        nivelMax: 6,
        // Beneficios por nivel
        beneficios: {
            1: { espacios: 2, focoMax: 10, moralMax: 50, limiteCredito: 6000 },
            2: { espacios: 3, focoMax: 15, moralMax: 60, limiteCredito: 7000 },
            3: { espacios: 3, focoMax: 18, moralMax: 70, limiteCredito: 8000 },
            4: { espacios: 4, focoMax: 22, moralMax: 80, limiteCredito: 9000 },
            5: { espacios: 4, focoMax: 26, moralMax: 90, limiteCredito: 10000 },
            6: { espacios: 5, focoMax: 30, moralMax: 100, limiteCredito: 12000 }
        }
    },
    
    // ============================================
    // CONTRATACIÓN DE AYUDANTE
    // ============================================
    ayudante: {
        costo: 900,
        repMin: 40,
        casosRequeridos: 8,                // Mínimo de casos para contratar
        bonoTiempo: 0.25,                   // Reduce tiempo de reparación 25%
        bonoMoral: 2,                       // Aporta moral diaria
        desbloqueado: false
    },
    
    // ============================================
    // CATÁLOGO DE REPUESTOS (sin cambios mayores)
    // ============================================
    catalogoRepuestos: [
        { id: 'motor_basica',    nombre: 'Filtro de Aceite',           especialidad: 'motor',        calidad: 'basica',    costo: 300,  bonusProb: 0.06, bonusTiempo: 0, bonusGanancia: 0 },
        { id: 'motor_estandar', nombre: 'Bujias NGK',                  especialidad: 'motor',        calidad: 'estandar',  costo: 620,  bonusProb: 0.13, bonusTiempo: 1, bonusGanancia: 0 },
        { id: 'motor_premium',  nombre: 'Sensor MAF OEM',              especialidad: 'motor',        calidad: 'premium',   costo: 1300, bonusProb: 0.22, bonusTiempo: 2, bonusGanancia: 0.14 },
        { id: 'trans_basica',   nombre: 'Filtro de ATF',               especialidad: 'transmision',  calidad: 'basica',    costo: 340,  bonusProb: 0.06, bonusTiempo: 0, bonusGanancia: 0 },
        { id: 'trans_estandar', nombre: 'Kit Bandas ATF',              especialidad: 'transmision',  calidad: 'estandar',  costo: 720,  bonusProb: 0.13, bonusTiempo: 1, bonusGanancia: 0 },
        { id: 'trans_premium',  nombre: 'Kit Sincronizadores',         especialidad: 'transmision',  calidad: 'premium',   costo: 1480, bonusProb: 0.22, bonusTiempo: 2, bonusGanancia: 0.14 },
        { id: 'elec_basica',    nombre: 'Juego de Fusibles',           especialidad: 'electricidad', calidad: 'basica',    costo: 220,  bonusProb: 0.06, bonusTiempo: 0, bonusGanancia: 0 },
        { id: 'elec_estandar',  nombre: 'Sensor O2 Universal',         especialidad: 'electricidad', calidad: 'estandar',  costo: 640,  bonusProb: 0.13, bonusTiempo: 1, bonusGanancia: 0 },
        { id: 'elec_premium',   nombre: 'Modulo ECU Remanufacturado',  especialidad: 'electricidad', calidad: 'premium',   costo: 1650, bonusProb: 0.22, bonusTiempo: 2, bonusGanancia: 0.14 },
        { id: 'frenos_basica',  nombre: 'Pastillas de Freno',          especialidad: 'frenos',       calidad: 'basica',    costo: 380,  bonusProb: 0.06, bonusTiempo: 0, bonusGanancia: 0 },
        { id: 'frenos_estandar',nombre: 'Discos de Freno',             especialidad: 'frenos',       calidad: 'estandar',  costo: 840,  bonusProb: 0.13, bonusTiempo: 1, bonusGanancia: 0 },
        { id: 'frenos_premium', nombre: 'Kit Freno Completo',          especialidad: 'frenos',       calidad: 'premium',   costo: 1420, bonusProb: 0.22, bonusTiempo: 2, bonusGanancia: 0.14 },
        { id: 'susp_basica',    nombre: 'Buje de Goma',                especialidad: 'suspension',   calidad: 'basica',    costo: 260,  bonusProb: 0.06, bonusTiempo: 0, bonusGanancia: 0 },
        { id: 'susp_estandar',  nombre: 'Amortiguador Delantero',      especialidad: 'suspension',   calidad: 'estandar',  costo: 780,  bonusProb: 0.13, bonusTiempo: 1, bonusGanancia: 0 },
        { id: 'susp_premium',   nombre: 'Terminal de Direccion OEM',   especialidad: 'suspension',   calidad: 'premium',   costo: 1180, bonusProb: 0.22, bonusTiempo: 2, bonusGanancia: 0.14 },
        { id: 'escape_basica',  nombre: 'Abrazadera de Escape',        especialidad: 'escape',       calidad: 'basica',    costo: 280,  bonusProb: 0.06, bonusTiempo: 0, bonusGanancia: 0 },
        { id: 'escape_estandar',nombre: 'Silenciador Universal',       especialidad: 'escape',       calidad: 'estandar',  costo: 760,  bonusProb: 0.13, bonusTiempo: 1, bonusGanancia: 0 },
        { id: 'escape_premium', nombre: 'Catalizador OEM',             especialidad: 'escape',       calidad: 'premium',   costo: 1520, bonusProb: 0.22, bonusTiempo: 2, bonusGanancia: 0.14 }
    ],
    
    // ============================================
    // EVENTOS POR HITOS DE CASOS (NUEVO)
    // ============================================
    eventosPorHito: [
        {
            casosRequeridos: 1,
            titulo: '¡Primer caso completado!',
            descripcion: 'Has terminado tu primera reparación. El taller empieza a sonar.',
            efecto: { reputacion: 2, moral: 3 }
        },
        {
            casosRequeridos: 5,
            titulo: 'Cliente repetido',
            descripcion: 'Un cliente de tus primeros días vuelve. Confía en tu trabajo.',
            efecto: { dinero: 300, reputacion: 3 }
        },
        {
            casosRequeridos: 10,
            titulo: 'Rumor en el barrio',
            descripcion: 'En la esquina comentan que tu taller es confiable. Llegan más clientes.',
            efecto: { reputacion: 5, desbloqueo: 'publicidad_nivel1' }
        },
        {
            casosRequeridos: 25,
            titulo: 'Proveedor mayorista',
            descripcion: 'Un distribuidor te ofrece descuentos por volumen. Piezas 10% más baratas.',
            efecto: { descuentoPiezas: 0.10 }
        },
        {
            casosRequeridos: 50,
            titulo: 'Referencia de flotilla',
            descripcion: 'Una empresa de reparto prueba tu taller. Si funciona, enviarán más unidades.',
            efecto: { desbloqueo: 'cliente_corporativo', reputacion: 10 }
        },
        {
            casosRequeridos: 100,
            titulo: '¡Taller de referencia!',
            descripcion: 'Eres el taller recomendado en la zona. La reputación lo es todo.',
            efecto: { reputacion: 20, desbloqueo: 'maestro_taller' }
        }
    ],
    
    // ============================================
    // JERGA DEL TALLER (para ambientación)
    // ============================================
    jergaTaller: [
        "¡A darle duro a esa culata!",
        "Este carro viene con sorpresa...",
        "El dueño dice que 'solo hace un ruidito'",
        "Pieza original vs. genérica: el dilema eterno",
        "¿Esto es aceite o melaza?",
        "Con paciencia y una llave de impacto...",
        "Otro que intentó arreglarlo en su casa",
        "El scanner dice una cosa, el cliente otra",
        "Tornillo barrido: el enemigo número uno",
        "Este carro ya pasó por tres talleres",
        "Fuga invisible: hay que seguir el rastro",
        "Cableado modificado sin diagrama, mi pasión",
        "El cliente: '¿para mañana está?'",
        "Repuesto 'chino' vs. repuesto de calidad",
        "La batería murió, pero el dueño no"
    ]
};
