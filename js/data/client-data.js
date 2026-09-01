window.TallerData = window.TallerData || {};

// ============================================
// SUBCATEGORÍAS POR ESPECIALIDAD (Sin cambios)
// ============================================
window.TallerData.subcategorias = {
    motor: [
        'Culata / Cabeza',
        'Compresion / Aros',
        'Ciguenal / Muñones',
        'Bielas / Pistones',
        'Cadena / Correa',
        'Turbo / Sobrealimentacion',
        'Sistema de enfriamiento',
        'Distribucion / Sincronizacion', // Añadida
        'Multiple de admision / Escape'   // Añadida
    ],
    transmision: [
        'Caja mecanica',
        'Caja automatica',
        'Embrague / Disco',
        'Sincronizadores',
        'Aceite / Fluido',
        'Selector de cambios',
        'Soportes de caja',
        'Diferencial (integrado)',        // Añadida
        'Convertidor de par'               // Añadida
    ],
    frenos: [
        'Cilindro maestro',
        'Pastillas / Frenos',
        'Discos / Tambores',
        'Lineas / Mangueras',
        'Liquido de freno',
        'Sistemas ABS',
        'Distribuidores de presion',
        'Freno de mano / Estacionamiento' // Añadida
    ],
    tredelantero: [ // Nota: La clave 'tredelantero' se usa en subcategorias, pero en diagnosticos a veces se usa 'suspension'
        'Palieres / Acoples',
        'Rotulas / Puntas',
        'Amortiguadores delanteros',
        'Barras estabilizadoras',
        'Suspensión delantera',
        'Alineacion / Convergencia',
        'Rodamientos de rueda',
        'Manguetas / Mesas',               // Añadida
        'Brazos de control / Suspension'    // Añadida
    ],
    tretrasero: [
        'Palieres posterior',
        'Diferencial',
        'Suspensión trasera',
        'Amortiguadores traseros',
        'Bujes / Apoyos',
        'Barra de torsion',
        'Soportes de cojinete',
        'Eje trasero'                        // Añadida
    ],
    electrico: [
        'Alternador / Generador',
        'Motor de arranque',
        'Bateria / Acumulador',
        'Sensores (Oxígeno, MAF, TPS)',
        'Modulos de control (ECU)',
        'Bobina de encendido',
        'Sistema de iluminación',
        'Cableado / Conectores',
        'Relés / Fusibles',
        'Sistema de climatizacion',          // Añadida
        'Sistema de infoentretenimiento',    // Añadida
        'Sistema de airbags (SRS)'           // Añadida
    ],
    escape: [
        'Catalizador',
        'Silenciador / Escape',
        'Colector de escape',
        'Sensor lambda',
        'Valvula de drenaje',
        'Sistema de remanufactura',
        'Filtro de particulas (DPF/GPF)',    // Añadida
        'Sistema EGR'                         // Añadida
    ]
};

// ============================================
// DIAGNÓSTICOS AMPLIADOS (se añaden 22 nuevos)
// ============================================
window.TallerData.diagnosticos = [
    // ... (Diagnósticos originales) ...
    // MOTOR
    { nombre: 'Culata agrietada / Fuga de agua', dificultad: 0.85, pagoBase: 1500, tiempo: 4, especialidad: 'motor', subcategoria: 'Culata / Cabeza' },
    { nombre: 'Perdida de compresion', dificultad: 0.8, pagoBase: 1400, tiempo: 3, especialidad: 'motor', subcategoria: 'Compresion / Aros' },
    { nombre: 'Anillos / Aros danados', dificultad: 0.75, pagoBase: 1200, tiempo: 3, especialidad: 'motor', subcategoria: 'Compresion / Aros' },
    { nombre: 'Quema de aceite excesiva', dificultad: 0.7, pagoBase: 1000, tiempo: 2, especialidad: 'motor', subcategoria: 'Compresion / Aros' },
    { nombre: 'Muñones del ciguenal desgastados', dificultad: 0.9, pagoBase: 2000, tiempo: 5, especialidad: 'motor', subcategoria: 'Ciguenal / Muñones' },
    { nombre: 'Juego excesivo en bielas', dificultad: 0.85, pagoBase: 1800, tiempo: 4, especialidad: 'motor', subcategoria: 'Bielas / Pistones' },
    { nombre: 'Cadena / Correa desgastada', dificultad: 0.65, pagoBase: 900, tiempo: 2, especialidad: 'motor', subcategoria: 'Cadena / Correa' },
    { nombre: 'Turbo dañado / Turbo lag', dificultad: 0.8, pagoBase: 2200, tiempo: 3, especialidad: 'motor', subcategoria: 'Turbo / Sobrealimentacion' },
    { nombre: 'Termostato averiado', dificultad: 0.55, pagoBase: 700, tiempo: 1, especialidad: 'motor', subcategoria: 'Sistema de enfriamiento' },
    { nombre: 'Bomba de agua defectuosa', dificultad: 0.6, pagoBase: 850, tiempo: 2, especialidad: 'motor', subcategoria: 'Sistema de enfriamiento' },
    { nombre: 'Sobrecalentamiento del motor', dificultad: 0.7, pagoBase: 1300, tiempo: 2, especialidad: 'motor', subcategoria: 'Sistema de enfriamiento' },
    // NUEVOS MOTOR
    { nombre: 'Fuga en multiple de admision', dificultad: 0.6, pagoBase: 800, tiempo: 2, especialidad: 'motor', subcategoria: 'Multiple de admision / Escape' },
    { nombre: 'Sincronizacion de valvulas desajustada', dificultad: 0.7, pagoBase: 1100, tiempo: 2, especialidad: 'motor', subcategoria: 'Distribucion / Sincronizacion' },
    { nombre: 'Valvula PCV obstruida', dificultad: 0.45, pagoBase: 500, tiempo: 1, especialidad: 'motor', subcategoria: 'Sistema de enfriamiento' }, // Asociada a respiraderos

    // TRANSMISIÓN
    { nombre: 'Caja mecanica patina', dificultad: 0.8, pagoBase: 1800, tiempo: 3, especialidad: 'transmision', subcategoria: 'Caja mecanica' },
    { nombre: 'Caja automatica patina', dificultad: 0.85, pagoBase: 2200, tiempo: 4, especialidad: 'transmision', subcategoria: 'Caja automatica' },
    { nombre: 'Embrague deslizante', dificultad: 0.75, pagoBase: 1400, tiempo: 2, especialidad: 'transmision', subcategoria: 'Embrague / Disco' },
    { nombre: 'Disco de embrague quemado', dificultad: 0.7, pagoBase: 1200, tiempo: 2, especialidad: 'transmision', subcategoria: 'Embrague / Disco' },
    { nombre: 'Sincronizadores gastados', dificultad: 0.8, pagoBase: 1600, tiempo: 3, especialidad: 'transmision', subcategoria: 'Sincronizadores' },
    { nombre: 'Fuga de aceite de caja', dificultad: 0.55, pagoBase: 700, tiempo: 1, especialidad: 'transmision', subcategoria: 'Aceite / Fluido' },
    { nombre: 'Bajo nivel de fluido ATF', dificultad: 0.5, pagoBase: 500, tiempo: 1, especialidad: 'transmision', subcategoria: 'Aceite / Fluido' },
    { nombre: 'Selector de cambios trabado', dificultad: 0.65, pagoBase: 950, tiempo: 2, especialidad: 'transmision', subcategoria: 'Selector de cambios' },
    { nombre: 'Soportes de motor /caja rotos', dificultad: 0.6, pagoBase: 900, tiempo: 2, especialidad: 'transmision', subcategoria: 'Soportes de caja' },
    // NUEVOS TRANSMISIÓN
    { nombre: 'Convertidor de par no acopla', dificultad: 0.82, pagoBase: 2000, tiempo: 4, especialidad: 'transmision', subcategoria: 'Convertidor de par' },
    { nombre: 'Golpeteo en el diferencial trasero', dificultad: 0.72, pagoBase: 1300, tiempo: 3, especialidad: 'transmision', subcategoria: 'Diferencial (integrado)' },

    // FRENOS
    { nombre: 'Cilindro maestro averiado', dificultad: 0.75, pagoBase: 1300, tiempo: 2, especialidad: 'frenos', subcategoria: 'Cilindro maestro' },
    { nombre: 'Pastillas desgastadas', dificultad: 0.5, pagoBase: 600, tiempo: 1, especialidad: 'frenos', subcategoria: 'Pastillas / Frenos' },
    { nombre: 'Pastillas cristalizadas', dificultad: 0.65, pagoBase: 900, tiempo: 2, especialidad: 'frenos', subcategoria: 'Pastillas / Frenos' },
    { nombre: 'Discos de freno irregular', dificultad: 0.6, pagoBase: 850, tiempo: 2, especialidad: 'frenos', subcategoria: 'Discos / Tambores' },
    { nombre: 'Discos alabeados', dificultad: 0.65, pagoBase: 950, tiempo: 2, especialidad: 'frenos', subcategoria: 'Discos / Tambores' },
    { nombre: 'Linea de freno rota / Air', dificultad: 0.65, pagoBase: 900, tiempo: 2, especialidad: 'frenos', subcategoria: 'Lineas / Mangueras' },
    { nombre: 'Liquido de freno contaminado', dificultad: 0.6, pagoBase: 800, tiempo: 1, especialidad: 'frenos', subcategoria: 'Liquido de freno' },
    { nombre: 'Modulo ABS defectuoso', dificultad: 0.8, pagoBase: 1600, tiempo: 3, especialidad: 'frenos', subcategoria: 'Sistemas ABS' },
    { nombre: 'Sensores ABS danados', dificultad: 0.6, pagoBase: 900, tiempo: 2, especialidad: 'frenos', subcategoria: 'Sistemas ABS' },
    // NUEVOS FRENOS
    { nombre: 'Freno de mano no retiene', dificultad: 0.5, pagoBase: 600, tiempo: 1, especialidad: 'frenos', subcategoria: 'Freno de mano / Estacionamiento' },
    { nombre: 'Calibrador (bomba) de freno trabado', dificultad: 0.68, pagoBase: 1100, tiempo: 2, especialidad: 'frenos', subcategoria: 'Pastillas / Frenos' }, // Se asocia a la pinza

    // TREN DELANTERO (Especialidad 'suspension' en diagnosticos)
    { nombre: 'Palieres desgastados', dificultad: 0.65, pagoBase: 1000, tiempo: 2, especialidad: 'suspension', subcategoria: 'Palieres / Acoples' },
    { nombre: 'Acoples rotos', dificultad: 0.6, pagoBase: 900, tiempo: 2, especialidad: 'suspension', subcategoria: 'Palieres / Acoples' },
    { nombre: 'Rotulas desgastadas', dificultad: 0.7, pagoBase: 1200, tiempo: 2, especialidad: 'suspension', subcategoria: 'Rotulas / Puntas' },
    { nombre: 'Puntas de direccion danadas', dificultad: 0.65, pagoBase: 1000, tiempo: 2, especialidad: 'suspension', subcategoria: 'Rotulas / Puntas' },
    { nombre: 'Amortiguadores desgastados', dificultad: 0.6, pagoBase: 900, tiempo: 2, especialidad: 'suspension', subcategoria: 'Amortiguadores delanteros' },
    { nombre: 'Barra estabilizadora rota', dificultad: 0.55, pagoBase: 850, tiempo: 2, especialidad: 'suspension', subcategoria: 'Barras estabilizadoras' },
    { nombre: 'Desalineacion de ruedas', dificultad: 0.5, pagoBase: 700, tiempo: 1, especialidad: 'suspension', subcategoria: 'Alineacion / Convergencia' },
    { nombre: 'Rodamientos desgastados', dificultad: 0.65, pagoBase: 1000, tiempo: 2, especialidad: 'suspension', subcategoria: 'Rodamientos de rueda' },
    // NUEVOS TREN DELANTERO
    { nombre: 'Brazos de control con bujes rotos', dificultad: 0.7, pagoBase: 1250, tiempo: 3, especialidad: 'suspension', subcategoria: 'Brazos de control / Suspension' },
    { nombre: 'Mangueta (munon) danada por golpe', dificultad: 0.75, pagoBase: 1400, tiempo: 3, especialidad: 'suspension', subcategoria: 'Manguetas / Mesas' },

    // TREN TRASERO
    { nombre: 'Palier trasero danado', dificultad: 0.7, pagoBase: 1200, tiempo: 2, especialidad: 'suspension', subcategoria: 'Palieres posterior' },
    { nombre: 'Diferencial averiado', dificultad: 0.8, pagoBase: 1600, tiempo: 3, especialidad: 'suspension', subcategoria: 'Diferencial' },
    { nombre: 'Fuga del diferencial', dificultad: 0.55, pagoBase: 750, tiempo: 1, especialidad: 'suspension', subcategoria: 'Diferencial' },
    { nombre: 'Amortiguadores traseros gastados', dificultad: 0.6, pagoBase: 900, tiempo: 2, especialidad: 'suspension', subcategoria: 'Amortiguadores traseros' },
    { nombre: 'Bujes rotos', dificultad: 0.6, pagoBase: 900, tiempo: 2, especialidad: 'suspension', subcategoria: 'Bujes / Apoyos' },
    // NUEVOS TREN TRASERO
    { nombre: 'Resortes de suspension rotos', dificultad: 0.62, pagoBase: 950, tiempo: 2, especialidad: 'suspension', subcategoria: 'Suspensión trasera' },
    { nombre: 'Crucetas del cardan desgastadas', dificultad: 0.58, pagoBase: 850, tiempo: 2, especialidad: 'suspension', subcategoria: 'Palieres posterior' }, // Relacionado con eje de transmisión

    // ELECTRICIDAD
    { nombre: 'Alternador defectuoso', dificultad: 0.65, pagoBase: 1100, tiempo: 2, especialidad: 'electricidad', subcategoria: 'Alternador / Generador' },
    { nombre: 'Motor de arranque averiado', dificultad: 0.6, pagoBase: 1000, tiempo: 2, especialidad: 'electricidad', subcategoria: 'Motor de arranque' },
    { nombre: 'Bateria descargada', dificultad: 0.4, pagoBase: 400, tiempo: 0.5, especialidad: 'electricidad', subcategoria: 'Bateria / Acumulador' },
    { nombre: 'Bateria sulfatada', dificultad: 0.5, pagoBase: 600, tiempo: 1, especialidad: 'electricidad', subcategoria: 'Bateria / Acumulador' },
    { nombre: 'Sensor de oxigeno defectuoso', dificultad: 0.6, pagoBase: 900, tiempo: 2, especialidad: 'electricidad', subcategoria: 'Sensores (Oxigeno, MAF, TPS)' },
    { nombre: 'Sensor MAF danado', dificultad: 0.65, pagoBase: 1000, tiempo: 2, especialidad: 'electricidad', subcategoria: 'Sensores (Oxigeno, MAF, TPS)' },
    { nombre: 'Sensor TPS fuera de rango', dificultad: 0.6, pagoBase: 900, tiempo: 1, especialidad: 'electricidad', subcategoria: 'Sensores (Oxigeno, MAF, TPS)' },
    { nombre: 'ECU danada / Falla electronica', dificultad: 0.9, pagoBase: 2000, tiempo: 4, especialidad: 'electricidad', subcategoria: 'Modulos de control (ECU)' },
    { nombre: 'Bobina de encendido averiada', dificultad: 0.6, pagoBase: 900, tiempo: 1, especialidad: 'electricidad', subcategoria: 'Bobina de encendido' },
    { nombre: 'Sistema de iluminacion fallo', dificultad: 0.5, pagoBase: 700, tiempo: 1, especialidad: 'electricidad', subcategoria: 'Sistema de iluminacion' },
    { nombre: 'Cableado quemado / Cortocircuito', dificultad: 0.65, pagoBase: 1000, tiempo: 2, especialidad: 'electricidad', subcategoria: 'Cableado / Conectores' },
    { nombre: 'Conectores corrosivos', dificultad: 0.55, pagoBase: 800, tiempo: 1, especialidad: 'electricidad', subcategoria: 'Cableado / Conectores' },
    { nombre: 'Falla en rele / fusible quemado', dificultad: 0.5, pagoBase: 600, tiempo: 1, especialidad: 'electricidad', subcategoria: 'Reles / Fusibles' },
    // NUEVOS ELECTRICIDAD
    { nombre: 'Aire acondicionado no enfria (carga gas)', dificultad: 0.55, pagoBase: 900, tiempo: 1.5, especialidad: 'electricidad', subcategoria: 'Sistema de climatizacion' },
    { nombre: 'Compresor de A/C no emboca', dificultad: 0.7, pagoBase: 1400, tiempo: 3, especialidad: 'electricidad', subcategoria: 'Sistema de climatizacion' },
    { nombre: 'Luz de airbag (SRS) encendida', dificultad: 0.6, pagoBase: 800, tiempo: 1.5, especialidad: 'electricidad', subcategoria: 'Sistema de airbags (SRS)' },
    { nombre: 'Radio / Pantalla no enciende', dificultad: 0.5, pagoBase: 700, tiempo: 1, especialidad: 'electricidad', subcategoria: 'Sistema de infoentretenimiento' },

    // ESCAPE
    { nombre: 'Catalizador obstruido', dificultad: 0.7, pagoBase: 1300, tiempo: 2, especialidad: 'escape', subcategoria: 'Catalizador' },
    { nombre: 'Catalizador quemado', dificultad: 0.75, pagoBase: 1500, tiempo: 3, especialidad: 'escape', subcategoria: 'Catalizador' },
    { nombre: 'Fuga en escape', dificultad: 0.5, pagoBase: 700, tiempo: 1, especialidad: 'escape', subcategoria: 'Silenciador / Escape' },
    { nombre: 'Silenciador perforado', dificultad: 0.55, pagoBase: 800, tiempo: 1, especialidad: 'escape', subcategoria: 'Silenciador / Escape' },
    { nombre: 'Colector agrietado', dificultad: 0.65, pagoBase: 1000, tiempo: 2, especialidad: 'escape', subcategoria: 'Colector de escape' },
    { nombre: 'Sensor lambda defectuoso', dificultad: 0.6, pagoBase: 900, tiempo: 1, especialidad: 'escape', subcategoria: 'Sensor lambda' },
    // NUEVOS ESCAPE
    { nombre: 'Filtro DPF obstruido (regeneracion)', dificultad: 0.68, pagoBase: 1500, tiempo: 2, especialidad: 'escape', subcategoria: 'Filtro de particulas (DPF/GPF)' },
    { nombre: 'Valvula EGR sucia / pegada', dificultad: 0.6, pagoBase: 1000, tiempo: 2, especialidad: 'escape', subcategoria: 'Sistema EGR' },

    // ... (Casos TOP sin cambios) ...
    // CASOS TOP (alto pago)
    { nombre: 'Motor fundido por perdida de lubricacion', dificultad: 0.96, pagoBase: 4200, tiempo: 6, especialidad: 'motor', subcategoria: 'Ciguenal / Muñones' },
    { nombre: 'Reconstruccion parcial de culata premium', dificultad: 0.92, pagoBase: 3600, tiempo: 5, especialidad: 'motor', subcategoria: 'Culata / Cabeza' },
    { nombre: 'Caja automatica con modulo TCM inestable', dificultad: 0.91, pagoBase: 3400, tiempo: 5, especialidad: 'transmision', subcategoria: 'Caja automatica' },
    { nombre: 'Calibracion completa de transmision CVT', dificultad: 0.89, pagoBase: 3100, tiempo: 4, especialidad: 'transmision', subcategoria: 'Sincronizadores' },
    { nombre: 'ECU premium con falla intermitente compleja', dificultad: 0.93, pagoBase: 3900, tiempo: 5, especialidad: 'electricidad', subcategoria: 'Modulos de control (ECU)' },
    { nombre: 'Sistema ABS integral con bloque hidraulico', dificultad: 0.9, pagoBase: 3200, tiempo: 4, especialidad: 'frenos', subcategoria: 'Sistemas ABS' },
    { nombre: 'Direccion y suspension de alto rendimiento', dificultad: 0.88, pagoBase: 2950, tiempo: 4, especialidad: 'suspension', subcategoria: 'Alineacion / Convergencia' },
    { nombre: 'Catalizador doble de especificacion OEM', dificultad: 0.87, pagoBase: 2800, tiempo: 4, especialidad: 'escape', subcategoria: 'Catalizador' }
];

// ============================================
// NUEVA SECCIÓN: EQUIPO Y HERRAMIENTAS
// ============================================
window.TallerData.equipoHerramientas = [
    'Scanner automotriz multiplataforma',
    'Osciloscopio automotriz',
    'Compresometro',
    'Probador de inyectores',
    'Manometro de presion de combustible',
    'Equipo de carga de gas A/C',
    'Detector de fugas (UV y electronico)',
    'Gato hidraulico de 3 ton',
    'Torres de soporte (caballetes)',
    'Prensa hidraulica',
    'Extractor de rodamientos',
    'Juego de llaves de impacto (neumaticas)',
    'Juego de dados y llaves metricas/estandar',
    'Torquimetro (llave dinamometrica)',
    'Alineadora de direccion computarizada',
    'Balanceadora de ruedas',
    'Desmontadora de neumaticos',
    'Multimetro digital de alta impedancia',
    'Pinza amperimetrica',
    'Probador de baterias y alternadores',
    'Martillo de desabolladura y soportes',
    'Elevador de poste / tijera',
    'Banco de trabajo con mordaza',
    'Juego de machuelos y terrajas (roscado)',
    'Extractor de tornillos rotos (saca-tornillos)',
    'Soplete de gas / soldadura oxigas',
    'Equipo de soldadura electrica (MIG/TIG)',
    'Abrelatas de filtros',
    'Jeringa para fluidos (frenos, embrague)',
    'Maletin de herramientas electricas (taladro, amoladora)'
];

// ============================================
// NUEVA SECCIÓN: PROVEEDORES DE PIEZAS
// ============================================
window.TallerData.proveedoresPiezas = [
    { nombre: 'AutoPartes Express', tiempoEntregaHoras: 2, fiabilidad: 0.95, margenPrecio: 1.15 }, // Rapido pero caro
    { nombre: 'Refaccionaria Central', tiempoEntregaHoras: 24, fiabilidad: 0.98, margenPrecio: 1.05 }, // Confiable y precio justo
    { nombre: 'Importaciones JS', tiempoEntregaHoras: 48, fiabilidad: 0.85, margenPrecio: 0.9 }, // Barato pero lento y a veces falla
    { nombre: 'Concesionario Oficial', tiempoEntregaHoras: 72, fiabilidad: 1.0, margenPrecio: 1.4 }, // Garantia total, pero carisimo y lento
    { nombre: 'Deshuesadero El Toro', tiempoEntregaHoras: 3, fiabilidad: 0.6, margenPrecio: 0.4 }, // Pieza usada, barata, pero sin garantia
    { nombre: 'Distribuidor de Frenos Sur', tiempoEntregaHoras: 5, fiabilidad: 0.97, margenPrecio: 1.1 }, // Especialista en frenos
    { nombre: 'Casa de Partes Alemanas', tiempoEntregaHoras: 36, fiabilidad: 0.99, margenPrecio: 1.25 } // Especialista en marcas europeas
];

// ============================================
// NUEVA SECCIÓN: NIVELES DE GRAVEDAD
// ============================================
window.TallerData.nivelesGravedad = [
    { nivel: 'Bajo', factorComplejidad: 0.8, factorPago: 0.9, descripcion: 'Desgaste leve, mantenimiento preventivo.' },
    { nivel: 'Medio', factorComplejidad: 1.0, factorPago: 1.0, descripcion: 'Avería común que requiere reparación.' },
    { nivel: 'Alto', factorComplejidad: 1.3, factorPago: 1.2, descripcion: 'Fallo significativo que puede afectar otros sistemas.' },
    { nivel: 'Crítico', factorComplejidad: 1.6, factorPago: 1.5, descripcion: 'Riesgo de daño mayor o inmoviliza el vehículo.' }
];

// ============================================
// NUEVA SECCIÓN: PRESUPUESTOS (Historial)
// ============================================
window.TallerData.presupuestos = window.TallerData.presupuestos || []; // Inicializar como array vacío si no existe
// Estructura esperada para un presupuesto:
// {
//     id: 'PR-001',
//     fecha: '2024-05-20',
//     clienteNombre: 'Ejemplo',
//     vehiculo: 'Kairo Veloz 2009',
//     diagnostico: 'Pastillas desgastadas',
//     pagoBase: 600,
//     ajustes: [], // Array de objetos con { concepto: 'Complicacion', valor: 50 }
//     total: 650,
//     estado: 'pendiente' // 'pendiente', 'aprobado', 'rechazado'
// }

// ============================================
// NUEVA SECCIÓN: TAREAS DE MANTENIMIENTO PREVENTIVO
// ============================================
window.TallerData.mantenimientosPreventivos = [
    { nombre: 'Cambio de aceite y filtro', periodicidadKm: 5000, especialidad: 'motor', pagoBase: 350, tiempo: 0.5 },
    { nombre: 'Rotacion de neumaticos', periodicidadKm: 10000, especialidad: 'suspension', pagoBase: 200, tiempo: 0.5 },
    { nombre: 'Cambio de filtro de aire', periodicidadKm: 10000, especialidad: 'motor', pagoBase: 150, tiempo: 0.25 },
    { nombre: 'Cambio de filtro de habitaculo', periodicidadKm: 15000, especialidad: 'electricidad', pagoBase: 180, tiempo: 0.3 },
    { nombre: 'Revision y encendido (bujias)', periodicidadKm: 20000, especialidad: 'electricidad', pagoBase: 400, tiempo: 1 },
    { nombre: 'Cambio de liquido de frenos', periodicidadKm: 20000, especialidad: 'frenos', pagoBase: 500, tiempo: 1 },
    { nombre: 'Cambio de refrigerante', periodicidadKm: 40000, especialidad: 'motor', pagoBase: 600, tiempo: 1 },
    { nombre: 'Alineacion y balanceo', periodicidadKm: 10000, especialidad: 'suspension', pagoBase: 550, tiempo: 1 },
    { nombre: 'Limpieza de inyectores', periodicidadKm: 30000, especialidad: 'motor', pagoBase: 750, tiempo: 1.5 },
    { nombre: 'Cambio de aceite de transmision', periodicidadKm: 40000, especialidad: 'transmision', pagoBase: 800, tiempo: 1 }
];

// ============================================
// SECCIONES SIN CAMBIOS (o con ligeras ampliaciones)
// ============================================

window.TallerData.complicaciones = [
    'Piezas oxidadas',
    'Conector quemado',
    'Tornillo barrido',
    'Fuga dificil de ubicar',
    'Sensor intermitente',
    'Cliente sin historial',
    'Historial de mala reparacion en otro taller',
    'Pieza anterior adaptada de forma irregular',
    'Cableado modificado sin diagrama',
    'Vehiculo con conversion de gas improvisada',
    'Golpe previo en zona de componentes',
    'Calibracion fuera de especificacion OEM',
    'Humedad interna en conectores principales',
    'Lecturas cruzadas entre dos sistemas',
    'Repuesto paralelo de baja tolerancia',
    'Cliente exige entrega en tiempo extremo',
    'Ruido aparece solo en caliente',
    'Fallo solo bajo carga alta',
    'Bateria nueva incompatible con modulo',
    'Codigo de error fantasma por software',
    // Nuevas complicaciones
    'Herramienta especial no disponible',
    'Manual de servicio ilegible/extraviado',
    'Proveedor de piezas con retraso',
    'Dano oculto al desarmar',
    'Pieza en stock nacional no localizada'
];

window.TallerData.personalidadesCliente = [
    'ansioso',
    'confiado',
    'desconfiado',
    'metodico',
    'impulsivo',
    'tecnico',
    'regateador',
    'despistado'
];

// AMPLIACIÓN: Se añaden 8 nuevos arquetipos de historia de cliente
window.TallerData.arquetiposHistoriaCliente = [
    // ... (Arquetipos originales) ...
    {
        tipo: 'frecuente',
        texto: 'Cliente frecuente del barrio: viene casi cada quincena y te conoce por nombre.',
        ajustePago: 1.05
    },
    {
        tipo: 'garantia_falsa',
        texto: 'Llega alegando una garantia inexistente y quiere que repares gratis.',
        ajustePago: 0.92
    },
    {
        tipo: 'trabajo_urgente',
        texto: 'Dice que usa el carro para trabajo y cada hora sin vehiculo le cuesta dinero.',
        ajustePago: 1.08
    },
    {
        tipo: 'primerizo',
        texto: 'Es primer cliente en tu taller y no confia del todo en el proceso.',
        ajustePago: 0.98
    },
    {
        tipo: 'empresa_flotilla',
        texto: 'Representa una flotilla pequena y quiere estandar de servicio para enviar mas unidades.',
        ajustePago: 1.12
    },
    {
        tipo: 'influencer_local',
        texto: 'Dice que grabara el proceso y publicara resena del taller en redes del barrio.',
        ajustePago: 1.1
    },
    {
        tipo: 'taxi_turno_largo',
        texto: 'Trabaja de taxi y no puede perder mas horas sin unidad operativa.',
        ajustePago: 1.09
    },
    {
        tipo: 'delivery_24h',
        texto: 'Usa el vehiculo para entregas nocturnas y necesita fiabilidad inmediata.',
        ajustePago: 1.06
    },
    {
        tipo: 'restauracion_clasico',
        texto: 'Trae un carro clasico con piezas dificiles y alta exigencia de detalle.',
        ajustePago: 1.14
    },
    {
        tipo: 'nuevo_residente',
        texto: 'Se mudo al barrio recientemente y esta evaluando a que taller confiarle su vehiculo.',
        ajustePago: 1.02
    },
    {
        tipo: 'cliente_corporativo',
        texto: 'Viene referido por empresa y exige tiempos pactados y reporte tecnico formal.',
        ajustePago: 1.13
    },
    // NUEVOS ARQUETIPOS
    {
        tipo: 'heredero_primer_carro',
        texto: 'Es su primer carro, heredado de un familiar. Muy emocional con la reparacion.',
        ajustePago: 1.07
    },
    {
        tipo: 'conductor_tercera_edad',
        texto: 'Persona mayor que no entiende de mecanica. Necesita explicacion muy clara y paciencia.',
        ajustePago: 1.01
    },
    {
        tipo: 'cliente_referido_taller_amigo',
        texto: 'Vino porque su amigo se lo recomendo. Hay una reputacion que mantener.',
        ajustePago: 1.04
    },
    {
        tipo: 'comprador_online',
        texto: 'Compro el carro por internet y no sabe bien que mantenimientos previos tiene.',
        ajustePago: 1.03
    },
    {
        tipo: 'club_automovilismo',
        texto: 'Pertenece a un club de autos. Si quedas bien, entras al circulo de talleres recomendados.',
        ajustePago: 1.11
    },
    {
        tipo: 'mecanico_jubilado',
        texto: 'El cliente es un mecanico retirado. Querra ver como trabajas y quizas dar sugerencias.',
        ajustePago: 0.95 // Espera descuento por "colega"
    },
    {
        tipo: 'cliente_conflictivo_historial',
        texto: 'Tiene fama en el barrio de no quedar conforme y discutir los precios.',
        ajustePago: 0.88
    },
    {
        tipo: 'docente_escuela_mecanica',
        texto: 'Trae el carro para practica, pero paga por la reparacion formal. Busca excelencia tecnica.',
        ajustePago: 1.09
    }
];

window.TallerData.vehiculosCliente = [
    'Montara Comet 2008',
    'Kairo Veloz 2009',
    'Norik Senda 2011',
    'Haldor Sorel 2010',
    'Kairo Riva 2012',
    'Cheval Trion 2007',
    'Montara Aspen 2011',
    'Cheval Prisma 2009',
    'Veltor Aegis X 2013',
    'Aurel C-Line 2014',
    'Arden Aster 2015',
    'Montara Lobo 2016',
    'Norik Terran 2017',
    'Veltor Hightrail 2014',
    'Montara Atlas 2015',
    'Kairo Crosser 2016',
    'Kairo Torq S 2017',
    'Montara Tracker 2018',
    'Cheval Mesa 2017',
    'Mitsura T-200 2016',
    'Volkrin Jetro 2014',
    'Haldor Elion 2015',
    'Norik Foresta 2016',
    'Luxor Radian 2014',
    'Porten Caiman 2013',
    'Minaro Club S 2012',
    'Cheval Summit 2015',
    // Proyecto especial: Muscle car de los 70
    'Vulcan Stallion 1972 (Proyecto Muscle)',
    // Nuevos vehiculos
    'Mitsura Spacio 2011',
    'Volkrin Combi 2014',
    'Aurel A-Class 2016',
    'Porten Levante 2018'
];

// ... (Mapas y hashes legacy sin cambios) ...
window.TallerData.mapaVehiculosLegacy = {
    'Asahi Veloz 2009': 'Kairo Veloz 2009',
    'Mazel Trion 2007': 'Cheval Trion 2007',
    'Foren Aspen 2011': 'Montara Aspen 2011',
    'Rugen Hightrail 2014': 'Veltor Hightrail 2014',
    'Asahi Crosser 2016': 'Kairo Crosser 2016',
    'Foren Tracker 2018': 'Montara Tracker 2018',
    'Sabrin Foresta 2016': 'Norik Foresta 2016'
};

window.TallerData.hashVehiculosLegacy = {
    '7677b8a3': 'Montara Comet 2008',
    '94bb7f90': 'Kairo Veloz 2009',
    'b54fe8fc': 'Norik Senda 2011',
    '3e8f5bf6': 'Haldor Sorel 2010',
    'f3fd99ab': 'Kairo Riva 2012',
    '0e0a12a8': 'Cheval Trion 2007',
    '623faac1': 'Montara Aspen 2011',
    '158cf747': 'Cheval Prisma 2009',
    '9e2bc676': 'Veltor Aegis X 2013',
    'd1b1ad5c': 'Aurel C-Line 2014',
    '43fc0127': 'Arden Aster 2015',
    '57e23d2c': 'Montara Lobo 2016',
    '7f6d4d60': 'Norik Terran 2017',
    '1f0c2530': 'Veltor Hightrail 2014',
    '2c07d055': 'Montara Atlas 2015',
    '2f6c6d35': 'Kairo Crosser 2016',
    '8b0c61ec': 'Kairo Torq S 2017',
    '5046d790': 'Montara Tracker 2018',
    'bbf374fc': 'Cheval Mesa 2017',
    '14e20569': 'Mitsura T-200 2016',
    'be8d6f71': 'Cheval Jetro 2014',
    '0ebc649a': 'Haldor Elion 2015',
    'f2dc6fae': 'Norik Foresta 2016',
    '460017e3': 'Luxor Radian 2014',
    '8f59cde4': 'Porten Caiman 2013',
    'e18e25a2': 'Minaro Club S 2012',
    'a70562fa': 'Cheval Summit 2015'
};

window.TallerData.hashMarcasVehiculoLegacy = {
    '7598eb7f': 'MONTARA',
    '156816b9': 'KAIRO',
    'fd3125e1': 'NORIK',
    'aeeccc61': 'HALDOR',
    '77f7cc88': 'KAIRO',
    '8689dbbc': 'CHEVAL',
    '3758b91c': 'MONTARA',
    '11586417': 'CHEVAL',
    '73c205bd': 'VELTOR',
    '20628bb9': 'AUREL',
    '746683cc': 'ARDEN',
    '64809865': 'VELTOR',
    '7fd2906a': 'MITSURA',
    'd18e87f6': 'CHEVAL',
    '551a7a0d': 'NORIK',
    '6cabe59e': 'LUXOR',
    '5d2040e3': 'PORTEN',
    '8a8a009a': 'MINARO'
};

// AMPLIACIÓN: Se añaden 8 nuevos clientes personalizados
window.TallerData.clientesPersonalizados = window.TallerData.clientesPersonalizados || [
    { nombre: 'Leandro Corporan', historia: 'Supervisor de flotilla de paqueteria. Si quedas bien, envia mas unidades.', foto: '' },
    { nombre: 'Ana Sofia Ruiz', historia: 'Arquitecta meticulosa; pide reporte de piezas y evidencia tecnica.', foto: '' },
    { nombre: 'Cristobal Reyes', historia: 'Chofer de plataforma, vive del carro y presiona por entregas express.', foto: '' },
    { nombre: 'Grecia Mota', historia: 'Tiene un SUV premium y no acepta ruido ni vibracion residual.', foto: '' },
    { nombre: 'Domingo Tejada', historia: 'Taxista nocturno. Vuelve seguido cuando un taller le resuelve rapido.', foto: '' },
    { nombre: 'Marlene Urena', historia: 'Viene por recomendacion del barrio y compara cada detalle de precio.', foto: '' },
    { nombre: 'Jhonattan Peralta', historia: 'Mecanico amateur; hace preguntas tecnicas y detecta contradicciones.', foto: '' },
    { nombre: 'Yolanda Lora', historia: 'Administra una pequena empresa y necesita tiempos exactos de entrega.', foto: '' },
    { nombre: 'Freddy Campusano', historia: 'Conductor de camiones livianos; exige durabilidad por encima de todo.', foto: '' },
    { nombre: 'Ninoska Valdez', historia: 'Cliente premium con historial de dos talleres anteriores fallidos.', foto: '' },
    { nombre: 'Saul de la Cruz', historia: 'Trae pickups para trabajo pesado y prioriza diagnostico certero.', foto: '' },
    { nombre: 'Ruth Encarnacion', historia: 'Referida por una influencer local; observa trato y transparencia.', foto: '' },
    // NUEVOS CLIENTES
    { nombre: 'Esteban Polanco', historia: 'Propietario de Vulcan Stallion 72. Exige autenticidad en piezas y trato especial.', foto: '' },
    { nombre: 'Luz Mercedes', historia: 'Madre soltera que necesita el carro para llevar a sus hijos al colegio. Muy justa de presupuesto.', foto: '' },
    { nombre: 'Ramon Emilio Jimenez', historia: 'Medico cirujano, perfeccionista. No pregunta el precio, solo resultados impecables.', foto: '' },
    { nombre: 'Carmen Lidia Perez', historia: 'Jubilada que usa su auto solo para ir al super. Recelosa de que le hagan trabajos innecesarios.', foto: '' },
    { nombre: 'Wilkin Pichardo', historia: 'Joven entusiasta del tuning. Quiere modificaciones y asesoria para mejorar rendimiento.', foto: '' },
    { nombre: 'Maria Altagracia', historia: 'Vendedora de cosméticos que recorre el pais. La fiabilidad es su mayor necesidad.', foto: '' },
    { nombre: 'Victor Santos', historia: 'Mecanico de motores fuera de borda que quiere aprender de autos. Hara muchas preguntas.', foto: '' },
    { nombre: 'Dulce Maria Reyes', historia: 'Instructora de autoescuela. Busca seguridad y frenos en optimas condiciones.', foto: '' }
];