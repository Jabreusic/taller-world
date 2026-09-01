/* =============================================================
   PANTALLA: MAPA DE COMPETENCIA
   Ranking de talleres del barrio y estado de la competencia
   ============================================================= */
window.SCREEN_HTML = window.SCREEN_HTML || {};
window.SCREEN_HTML.mapa = `
<div class="mapa-layout">
    <div class="mapa-title">&#x1F5FA;&#xFE0F; Mapa del Barrio</div>

    <div class="mapa-status-bar">
        <div class="mapa-status-chip">
            <small>TU NIVEL</small>
            <strong id="mapa-mi-nivel">-</strong>
        </div>
        <div class="mapa-status-chip">
            <small>REPUTACION</small>
            <strong id="mapa-mi-rep">-</strong>
        </div>
        <div class="mapa-status-chip">
            <small>DIA</small>
            <strong id="mapa-dia-actual">-</strong>
        </div>
        <div class="mapa-status-chip">
            <small>ARCO</small>
            <strong id="mapa-arco-actual">-</strong>
        </div>
    </div>

    <div class="mapa-seccion-titulo">&#x1F3D8;&#xFE0F; Zonas del barrio</div>
    <div id="mapa-zonas" class="mapa-zonas-grid"></div>

    <div class="mapa-seccion-titulo">&#x1F3C6; Ranking de Talleres</div>
    <div id="mapa-ranking-lista" class="mapa-ranking-lista">
        <!-- Se rellena por actualizarScreenMapa() -->
    </div>

    <div class="mapa-seccion-titulo">&#x1F4CA; Contexto Competitivo</div>
    <div id="mapa-contexto" class="mapa-contexto-texto">
        <!-- Se rellena por actualizarScreenMapa() -->
    </div>

    <div class="mapa-seccion-titulo">&#x1F50E; Inteligencia del Barrio</div>
    <div id="mapa-inteligencia" class="mapa-contexto-texto">
        <!-- Se rellena por actualizarScreenMapa() -->
    </div>

    <div class="mapa-seccion-titulo">&#x1F4D6; Capitulo Activo</div>
    <div id="mapa-historia-arco" class="mapa-arco-card">
        <!-- Se rellena por actualizarScreenMapa() -->
    </div>
</div>
`;

// Datos estaticos de rivales (el nivel dinamico se calcula al renderizar)
window.RIVALES_BARRIO = [
    {
        id: 'autofix',
        nombre: 'AutoFix Express',
        icono: '&#x26A1;',
        avatar: 'img/personajes/Sr-trinidad-jefetallerrival',
        especialidad: 'Velocidad — Motor y frenos',
        descripcion: 'Nuevo en el barrio. Precios bajos, equipo moderno pero sin experiencia de calle. Su punto debil es la calidad a largo plazo.',
        nivelBase: 1,
        crecimientoPorDia: 0.4,
        reputacionBase: 38,
        color: 'rival-agresivo'
    },
    {
        id: 'elchino',
        nombre: 'Mecanica El Chino',
        icono: '&#x1F527;',
        especialidad: 'Todo terreno — Diagnostico amplio',
        descripcion: 'Veterano del barrio. Lleva 15 anos. No crece rapido pero tampoco colapsa. Su reputacion es solida aunque sus precios no son los mejores.',
        nivelBase: 3,
        crecimientoPorDia: 0.1,
        reputacionBase: 64,
        color: 'rival-veterano'
    },
    {
        id: 'garajevip',
        nombre: 'Garaje VIP',
        icono: '&#x1F31F;',
        especialidad: 'Premium — Electricidad y lujo',
        descripcion: 'Solo acepta clientes premium. Equipo de punta. No compite directamente contigo, pero si subes de nivel, sus clientes te buscaran.',
        nivelBase: 4,
        crecimientoPorDia: 0.08,
        reputacionBase: 80,
        color: 'rival-premium'
    },
    {
        id: 'lareina',
        nombre: 'Taller La Reina',
        icono: '&#x1F451;',
        especialidad: 'Comunidad — Transmision y suspension',
        descripcion: 'Taller comunitario con mucho apoyo del barrio femenino. Si la comunidad te apoya a ti, La Reina pierde influencia, y viceversa.',
        nivelBase: 2,
        crecimientoPorDia: 0.15,
        reputacionBase: 55,
        color: 'rival-comunidad'
    },
    {
        id: 'tallerpepe',
        nombre: 'Taller Pepe',
        icono: '&#x1F44A;',
        especialidad: 'Oportunista — Cualquier cosa rapido',
        descripcion: 'El viejo rival. Recorta en todo. Sus clientes eventuales llegan despues a tu taller a arreglar los danos. Eso te da oportunidades.',
        nivelBase: 2,
        crecimientoPorDia: 0.05,
        reputacionBase: 42,
        color: 'rival-oportunista'
    }
];
