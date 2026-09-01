// Proyecto especial: Vulcan Stallion 1972 (Muscle Car)
window.TallerData.proyectoMuscleCar = {
    nombre: 'Vulcan Stallion 1972',
    niveles: [
        {
            nivel: 1,
            nombre: 'Desbaratado',
            descripcion: 'Carrocería oxidada, pintura descascarada, abolladuras, sin llantas o con llantas pinchadas. Cristales rotos o faltantes, interior sucio y desarmado, motor fuera o incompleto.',
            precio: 12000,
            requisitos: 'Disponible desde el inicio',
            imagen: 'img/car/muscle_lvl1.png'
        },
        {
            nivel: 2,
            nombre: 'Estructura Básica',
            descripcion: 'Carrocería enderezada, aún sin pintura nueva, partes de metal expuestas. Motor colocado pero sin funcionar, piezas sueltas alrededor. Llantas puestas pero viejas, interior aún sin restaurar.',
            precio: 22000,
            requisitos: 'Completar nivel 1',
            imagen: 'img/car/muscle_lvl2.png'
        },
        {
            nivel: 3,
            nombre: 'En Proceso',
            descripcion: 'Carrocería ya pintada (color base, sin detalles), sin óxido. Motor armado, pero con cables y mangueras visibles. Llantas nuevas o restauradas, interior parcialmente montado.',
            precio: 34000,
            requisitos: 'Completar nivel 2',
            imagen: 'img/car/muscle_lvl3.png'
        },
        {
            nivel: 4,
            nombre: 'Casi Listo',
            descripcion: 'Pintura brillante, detalles cromados instalados. Motor limpio y funcional, capó abierto mostrando el motor. Interior completo pero con herramientas o piezas pequeñas aún visibles.',
            precio: 48000,
            requisitos: 'Completar nivel 3',
            imagen: 'img/car/muscle_lvl4.png'
        },
        {
            nivel: 5,
            nombre: 'Restaurado',
            descripcion: 'Carrocería impecable, pintura brillante con franjas deportivas. Motor pulido, todo en su lugar. Interior restaurado a nuevo, tapicería de cuero, tablero clásico. Llantas deportivas, detalles cromados.',
            precio: 0,
            requisitos: 'Completar nivel 4',
            imagen: 'img/car/muscle_lvl5.png'
        }
    ],
    precioVenta: 120000,
    descripcion: 'Restaura el legendario Vulcan Stallion 1972 desde cero. Cada nivel requiere inversión y trabajo. Al completar el proyecto puedes venderlo por una gran ganancia.',
    imagenMini: 'img/car/muscle_lvl5.png'
};
window.TallerData = window.TallerData || {};

(function aplicarContenidoPersonalizado() {
    const STORAGE_KEYS =
        (window.TallerApp && window.TallerApp.storage && window.TallerApp.storage.keys) || {};
    const CREATOR_KEY = STORAGE_KEYS.creatorProfile || 'tw_character_studio_v2';
    const CREATOR_KEY_LEGACY = STORAGE_KEYS.creatorProfileLegacy || 'tw_character_studio_v1';

    function limpiarTexto(valor, maxLen) {
        const txt = String(valor || '').trim();
        if (!txt) return '';
        return txt.slice(0, maxLen);
    }

    function normalizarUrlAsset(valor, tipo) {
        const raw = String(valor || '').trim();
        if (!raw) return '';
        if (raw.includes('\\')) return '';

        const archivoNumerico = /^\d+\.(png|jpg|jpeg|webp|gif)$/i;
        if (archivoNumerico.test(raw)) {
            return tipo === 'fondo' ? `img/bg/taller/${raw}` : '';
        }
        return raw;
    }

    function leerPerfil() {
        try {
            const raw = localStorage.getItem(CREATOR_KEY) || localStorage.getItem(CREATOR_KEY_LEGACY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            return (parsed && typeof parsed === 'object') ? parsed : null;
        } catch (e) {
            return null;
        }
    }

    function mapearMecanicos(lista, customPorId, mapaNombres) {
        return (lista || []).map(base => {
            const id = base.nombre;
            const custom = customPorId[id] || null;
            const copia = { ...base };
            if (custom && custom.nombre) {
                copia.nombre = custom.nombre;
                mapaNombres[id] = custom.nombre;
            }
            if (custom && custom.foto) {
                const fotoNormalizada = normalizarUrlAsset(custom.foto, 'foto');
                if (fotoNormalizada) copia.foto = fotoNormalizada;
            }
            return copia;
        });
    }

    const perfil = leerPerfil();
    window.TallerData.perfilPersonalizado = perfil || null;
    if (!perfil) return;

    const playerRaw = perfil.player || {};
    const workshopRaw = perfil.workshop || {};

    const player = {
        nombre: limpiarTexto(playerRaw.nombre, 30) || 'Dueno',
        tallerNombre: limpiarTexto(playerRaw.tallerNombre, 40) || 'Taller World',
        historia: limpiarTexto(playerRaw.historia, 320),
        foto: normalizarUrlAsset(playerRaw.foto, 'foto')
    };

    const workshop = {
        fondoUrl: normalizarUrlAsset(workshopRaw.fondoUrl, 'fondo'),
        descripcion: limpiarTexto(workshopRaw.descripcion, 180)
    };

    window.TallerData.playerPreset = player;
    window.TallerData.workshopPreset = workshop;

    if (window.TallerData.historiasInicio && window.TallerData.historiasInicio[1]) {
        const extras = [];
        if (player.historia) extras.push(`Historia de ${player.nombre}: ${player.historia}`);
        if (workshop.descripcion) extras.push(`Ambiente del taller: ${workshop.descripcion}.`);
        if (extras.length) {
            window.TallerData.historiasInicio[1] = `${window.TallerData.historiasInicio[1]} ${extras.join(' ')}`;
        }
    }

    const mechanicsCustom = Array.isArray(perfil.mechanics) ? perfil.mechanics : [];
    const customPorId = {};
    mechanicsCustom.forEach(m => {
        const id = limpiarTexto(m.id, 40);
        if (!id) return;
        customPorId[id] = {
            nombre: limpiarTexto(m.nombre, 30),
            historia: limpiarTexto(m.historia, 220),
            foto: normalizarUrlAsset(m.foto, 'foto')
        };
    });

    const mapaNombres = {};
    const biografiasBase = window.TallerData.biografiasMecanicos || {};
    Object.keys(biografiasBase).forEach(nombre => {
        mapaNombres[nombre] = nombre;
    });

    window.TallerData.mecanicosIniciales = mapearMecanicos(window.TallerData.mecanicosIniciales, customPorId, mapaNombres);
    window.TallerData.mecanicosDisponiblesBase = mapearMecanicos(window.TallerData.mecanicosDisponiblesBase, customPorId, mapaNombres);

    const biografiasNuevas = {};
    Object.keys(biografiasBase).forEach(nombreOriginal => {
        const nombreFinal = mapaNombres[nombreOriginal] || nombreOriginal;
        const custom = customPorId[nombreOriginal] || null;
        // Fusionar: si falta algún campo en custom, usar el de la base
        const baseBio = biografiasBase[nombreOriginal] || {};
        biografiasNuevas[nombreFinal] = {
            historia: (custom && custom.historia) ? custom.historia : baseBio.historia,
            habilidadTexto: baseBio.habilidadTexto,
            rivalidad: baseBio.rivalidad,
            necesidad: baseBio.necesidad,
            fraseCelebre: baseBio.fraseCelebre,
            foto: (custom && custom.foto) ? normalizarUrlAsset(custom.foto, 'foto') : baseBio.foto
        };
    });
    window.TallerData.biografiasMecanicos = biografiasNuevas;

    const rivalidadesBase = window.TallerData.rivalidades || {};
    const rivalidadesNuevas = {};
    Object.keys(rivalidadesBase).forEach(nombreOriginal => {
        const nombreFinal = mapaNombres[nombreOriginal] || nombreOriginal;
        rivalidadesNuevas[nombreFinal] = (rivalidadesBase[nombreOriginal] || []).map(rival => mapaNombres[rival] || rival);
    });
    window.TallerData.rivalidades = rivalidadesNuevas;

    const clientesCustom = Array.isArray(perfil.clients) ? perfil.clients : [];
    window.TallerData.clientesPersonalizados = clientesCustom
        .map(c => ({
            nombre: limpiarTexto(c.nombre, 28),
            historia: limpiarTexto(c.historia, 180),
            foto: normalizarUrlAsset(c.foto, 'foto')
        }))
        .filter(c => c.nombre);
})();
