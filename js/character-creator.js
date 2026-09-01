(function () {
    const STORAGE_KEYS =
        (window.TallerApp && window.TallerApp.storage && window.TallerApp.storage.keys) || {};
    const CREATOR_KEY = STORAGE_KEYS.creatorProfile || 'tw_character_studio_v2';
    const CREATOR_BACKUP_KEY = STORAGE_KEYS.creatorBackup || 'tw_character_studio_backup_v2';
    
    // ============================================
    // CONFIGURACIÓN BASE
    // ============================================
    const MECANICOS_BASE = [
        { id: 'Frandy', nombre: 'Frandy', especialidad: 'Motor' },
        { id: 'Maicol', nombre: 'Maicol', especialidad: 'Electricidad' },
        { id: 'Ridalvi', nombre: 'Ridalvi', especialidad: 'Frenos' },
        { id: 'Jeral', nombre: 'Jeral', especialidad: 'Suspensión' },
        { id: 'Edwin', nombre: 'Edwin', especialidad: 'Transmisión' },
        { id: 'Stewart', nombre: 'Stewart', especialidad: 'Alto Rendimiento' },
        { id: 'Morenai', nombre: 'Morenai', especialidad: 'Electricidad' },
        { id: 'Martin', nombre: 'Martin', especialidad: 'General' },
        { id: 'Miguel', nombre: 'Miguel', especialidad: 'Comodín' }
    ];

    const CLIENTES_BASE = [
        { nombre: 'Yolanda Perez', historia: 'Madre de familia que usa el carro para llevar a sus hijos a la escuela.', personalidad: 'metodico' },
        { nombre: 'Manuel Gomez', historia: 'Chofer de concho; cada hora sin vehiculo le cuesta dinero.', personalidad: 'ansioso' },
        { nombre: 'Rosa Lora', historia: 'Emprendedora que reparte pedidos en su propio carro.', personalidad: 'impulsivo' },
        { nombre: 'Pedro Jimenez', historia: 'Cliente desconfiado que siempre compara presupuestos.', personalidad: 'desconfiado' },
        { nombre: 'Luisa Ventura', historia: 'Cliente frecuente que llega con urgencias de ultimo minuto.', personalidad: 'urgente' },
        { nombre: 'Andres Ruiz', historia: 'Primerizo en el taller, pregunta todo antes de aprobar una reparacion.', personalidad: 'primerizo' },
        { nombre: 'Carlos Medina', historia: 'Mecanico jubilado que quiere ver como trabajan los nuevos.', personalidad: 'tecnico' },
        { nombre: 'Sofia Reyes', historia: 'Influencer local que busca contenido para sus redes.', personalidad: 'exigente' }
    ];

    const PERSONALIDADES_CLIENTE = [
        'ansioso', 'confiado', 'desconfiado', 'metodico', 
        'impulsivo', 'tecnico', 'regateador', 'urgente', 'primerizo'
    ];

    // ============================================
    // Exponer MECANICOS_BASE globalmente
    if (typeof window !== 'undefined') {
        window.MECANICOS_BASE = MECANICOS_BASE;
    }
    // FUNCIONES DE UTILIDAD
    // ============================================
    function limpiarTexto(valor, maxLen) {
        if (!valor) return '';
        const txt = String(valor || '').trim();
        if (!txt) return '';
        return txt.slice(0, maxLen);
    }

    function normalizarUrlImagen(valor, tipo) {
        const raw = String(valor || '').trim();
        if (!raw) return '';
        
        // Prevenir path traversal
        if (raw.includes('\\') || raw.includes('..')) return '';
        
        // URLs válidas
        const urlPattern = /^(https?:\/\/|data:image\/)/i;
        if (urlPattern.test(raw)) return raw;
        
        // Archivos locales permitidos
        const archivoNumerico = /^\d+\.(png|jpg|jpeg|webp|gif)$/i;
        if (archivoNumerico.test(raw)) {
            return tipo === 'fondo' ? `img/bg/taller/${raw}` : `img/personajes/${raw}`;
        }
        
        return '';
    }

    function escaparHTML(valor) {
        if (!valor) return '';
        return String(valor)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function generarIdUnico(prefix = 'item') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // ============================================
    // GESTIÓN DE PERFIL
    // ============================================
    function leerPerfil() {
        try {
            const raw = localStorage.getItem(CREATOR_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            return (parsed && typeof parsed === 'object') ? parsed : null;
        } catch (e) {
            console.error('Error leyendo perfil:', e);
            return null;
        }
    }

    function crearBackupPerfil() {
        try {
            const perfil = leerPerfil();
            if (perfil) {
                localStorage.setItem(CREATOR_BACKUP_KEY, JSON.stringify(perfil));
            }
        } catch (e) {
            console.error('Error creando backup:', e);
        }
    }

    function restaurarBackupPerfil() {
        try {
            const backup = localStorage.getItem(CREATOR_BACKUP_KEY);
            if (backup) {
                localStorage.setItem(CREATOR_KEY, backup);
                return JSON.parse(backup);
            }
        } catch (e) {
            console.error('Error restaurando backup:', e);
        }
        return null;
    }

    function obtenerFallbackHistoriaMecanico(id) {
        const data = window.TallerData || {};
        const bio = (data.biografiasMecanicos || {})[id];
        return bio?.historia || '';
    }

    function obtenerFallbackRivalidadMecanico(id) {
        const data = window.TallerData || {};
        const bio = (data.biografiasMecanicos || {})[id];
        return bio?.rivalidad || '';
    }

    function obtenerFallbackNecesidadMecanico(id) {
        const data = window.TallerData || {};
        const bio = (data.biografiasMecanicos || {})[id];
        return bio?.necesidad || '';
    }

    // ============================================
    // CARGA DE IMÁGENES
    // ============================================
    function cargarImagenEnCampo(fileInputId, targetInputId, previewId) {
        const fileInput = document.getElementById(fileInputId);
        const targetInput = document.getElementById(targetInputId);
        const preview = document.getElementById(previewId);
        
        if (!fileInput || !targetInput || !preview) {
            console.error('Elementos no encontrados');
            return;
        }
        
        const file = fileInput.files && fileInput.files[0];
        if (!file) return;

        // Validar tipo de archivo
        if (!file.type.startsWith('image/')) {
            alert('Por favor selecciona un archivo de imagen válido');
            return;
        }

        // Validar tamaño (máx 2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert('La imagen no debe superar los 2MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = function (ev) {
            const url = ev.target?.result;
            if (url) {
                targetInput.value = url;
                preview.src = url;
                preview.classList.remove('hidden');
                preview.style.display = 'block';
            }
        };
        reader.onerror = function () {
            alert('Error al cargar la imagen');
        };
        reader.readAsDataURL(file);
    }

    // ============================================
    // CONSTRUCCIÓN DE TARJETAS
    // ============================================
    function construirTarjetasMecanicos(perfil) {
        const cont = document.getElementById('cp-mecanicos-wrap');
        if (!cont) return;
        
        const existentes = Array.isArray(perfil?.mechanics) ? perfil.mechanics : [];
        const porId = {};
        existentes.forEach(m => {
            if (m && m.id) porId[m.id] = m;
        });

        let html = '<div class="mecanicos-grid">';
        
        MECANICOS_BASE.forEach((base, idx) => {
            const custom = porId[base.id] || {};
            const nombre = limpiarTexto(custom.nombre, 30) || base.nombre;
            const historia = limpiarTexto(custom.historia, 300) || obtenerFallbackHistoriaMecanico(base.id);
            const rivalidad = limpiarTexto(custom.rivalidad, 200) || obtenerFallbackRivalidadMecanico(base.id);
            const necesidad = limpiarTexto(custom.necesidad, 200) || obtenerFallbackNecesidadMecanico(base.id);
            const foto = normalizarUrlImagen(custom.foto, 'mecanico');
            const especialidad = custom.especialidad || base.especialidad;
            
            html += `
                <div class="creator-card mecanico-card" data-mec-id="${escaparHTML(base.id)}">
                    <div class="mecanico-header">
                        <strong>${escaparHTML(base.id)}</strong>
                        <span class="mecanico-especialidad">${escaparHTML(especialidad)}</span>
                    </div>
                    
                    <div class="mecanico-foto-container">
                        <img id="cp-mec-preview-${idx}" class="creator-preview ${foto ? '' : 'hidden'}" 
                             src="${escaparHTML(foto)}" alt="Foto ${escaparHTML(base.id)}" 
                             onerror="this.classList.add('hidden'); document.getElementById('cp-mec-preview-fallback-${idx}').classList.remove('hidden');">
                        <div id="cp-mec-preview-fallback-${idx}" class="creator-preview-fallback ${foto ? 'hidden' : ''}">
                            ${escaparHTML(base.id.charAt(0))}
                        </div>
                    </div>
                    
                    <div class="mecanico-campos">
                        <label>Nombre visible</label>
                        <input id="cp-mec-nombre-${idx}" type="text" maxlength="30" 
                               value="${escaparHTML(nombre)}" placeholder="Ej: Francisco" />
                        
                        <label>Especialidad</label>
                        <input id="cp-mec-especialidad-${idx}" type="text" maxlength="20" 
                               value="${escaparHTML(especialidad)}" placeholder="Ej: Motor" />
                        
                        <label>Historia personal</label>
                        <textarea id="cp-mec-historia-${idx}" maxlength="300" rows="2" 
                                  placeholder="Historia del mecánico...">${escaparHTML(historia)}</textarea>
                        
                        <label>Rivalidades</label>
                        <textarea id="cp-mec-rivalidad-${idx}" maxlength="200" rows="2" 
                                  placeholder="Con quién se lleva mal...">${escaparHTML(rivalidad)}</textarea>
                        
                        <label>Necesidad actual</label>
                        <textarea id="cp-mec-necesidad-${idx}" maxlength="200" rows="2" 
                                  placeholder="Qué necesita (dinero, tiempo, etc.)">${escaparHTML(necesidad)}</textarea>
                        
                        <label>Foto (URL)</label>
                        <input id="cp-mec-foto-${idx}" type="text" value="${escaparHTML(foto)}" 
                               placeholder="https://... o nombre.jpg" />
                        
                        <label>Subir foto</label>
                        <input id="cp-mec-file-${idx}" type="file" accept="image/*" 
                               onchange="cargarImagenEnCampo('cp-mec-file-${idx}','cp-mec-foto-${idx}','cp-mec-preview-${idx}')" />
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        cont.innerHTML = html;
    }

    function construirTarjetasClientes(perfil) {
        const cont = document.getElementById('cp-clientes-wrap');
        if (!cont) return;

        const existentes = Array.isArray(perfil?.clients) ? perfil.clients : [];
        
        let html = '<div class="clientes-grid">';
        
        CLIENTES_BASE.forEach((base, idx) => {
            const custom = existentes[idx] || {};
            const nombre = limpiarTexto(custom.nombre, 28) || base.nombre;
            const historia = limpiarTexto(custom.historia, 250) || base.historia;
            const personalidad = custom.personalidad || base.personalidad || 'metodico';
            const foto = normalizarUrlImagen(custom.foto, 'cliente');
            
            // Generar opciones de personalidad
            let personalidadOptions = '';
            PERSONALIDADES_CLIENTE.forEach(pers => {
                const selected = pers === personalidad ? 'selected' : '';
                personalidadOptions += `<option value="${pers}" ${selected}>${pers.charAt(0).toUpperCase() + pers.slice(1)}</option>`;
            });
            
            html += `
                <div class="creator-card cliente-card" data-cliente-idx="${idx}">
                    <div class="cliente-header">
                        <strong>Cliente ${idx + 1}</strong>
                    </div>
                    
                    <div class="cliente-foto-container">
                        <img id="cp-cli-preview-${idx}" class="creator-preview ${foto ? '' : 'hidden'}" 
                             src="${escaparHTML(foto)}" alt="Foto cliente ${idx + 1}"
                             onerror="this.classList.add('hidden'); document.getElementById('cp-cli-preview-fallback-${idx}').classList.remove('hidden');">
                        <div id="cp-cli-preview-fallback-${idx}" class="creator-preview-fallback ${foto ? 'hidden' : ''}">
                            ${escaparHTML((nombre || 'C').charAt(0))}
                        </div>
                    </div>
                    
                    <div class="cliente-campos">
                        <label>Nombre</label>
                        <input id="cp-cli-nombre-${idx}" type="text" maxlength="28" 
                               value="${escaparHTML(nombre)}" placeholder="Ej: María González" />
                        
                        <label>Personalidad</label>
                        <select id="cp-cli-personalidad-${idx}" class="cliente-personalidad-select">
                            ${personalidadOptions}
                        </select>
                        
                        <label>Historia</label>
                        <textarea id="cp-cli-historia-${idx}" maxlength="250" rows="3" 
                                  placeholder="Historia del cliente...">${escaparHTML(historia)}</textarea>
                        
                        <label>Foto (URL)</label>
                        <input id="cp-cli-foto-${idx}" type="text" value="${escaparHTML(foto)}" 
                               placeholder="https://... o nombre.jpg" />
                        
                        <label>Subir foto</label>
                        <input id="cp-cli-file-${idx}" type="file" accept="image/*" 
                               onchange="cargarImagenEnCampo('cp-cli-file-${idx}','cp-cli-foto-${idx}','cp-cli-preview-${idx}')" />
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        cont.innerHTML = html;
    }

    // ============================================
    // APLICAR PERFIL VISUAL
    // ============================================
    function aplicarPerfilVisual(perfil) {
        if (!perfil || typeof perfil !== 'object') return;
        
        const player = perfil.player || {};
        const workshop = perfil.workshop || {};

        // Actualizar títulos
        const titulos = document.querySelectorAll('.menu-inicio h2, .game-container h2');
        titulos.forEach(el => {
            if (el) el.innerText = limpiarTexto(player.tallerNombre, 40) || 'TALLER WORLD';
        });

        // Actualizar nombre del dueño en HUD
        const hudNombre = document.getElementById('hud-dueno-nombre');
        if (hudNombre) hudNombre.innerText = limpiarTexto(player.nombre, 30) || 'Dueño';

        const ownerName = document.getElementById('owner-boss-name');
        if (ownerName) ownerName.innerText = limpiarTexto(player.nombre, 30) || 'Dueño';

        // Actualizar avatar del dueño
        const foto = normalizarUrlImagen(player.foto, 'foto');
        const avatares = [
            document.getElementById('hud-dueno-avatar'),
            document.getElementById('owner-boss-avatar')
        ];
        
        avatares.forEach(avatar => {
            if (!avatar) return;
            if (foto) {
                avatar.src = foto;
                avatar.onerror = function() {
                    this.src = 'img/boss/boss.png';
                    this.onerror = null;
                };
            } else {
                avatar.src = 'img/boss/boss.png';
            }
        });

        // Actualizar fondo del taller
        const fondo = normalizarUrlImagen(workshop.fondoUrl, 'fondo');
        const game = document.getElementById('game');
        
        if (fondo) {
            // Aplicar fondo al body con overlay
            document.body.style.backgroundImage = 
                `linear-gradient(180deg, rgba(10, 12, 10, 0.85), rgba(15, 15, 12, 0.92)), url('${fondo}')`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundAttachment = 'fixed';

            // Aplicar fondo al contenedor del juego
            if (game) {
                game.style.background = 'transparent';
            }
        } else {
            // Restaurar fondo por defecto
            document.body.style.removeProperty('background-image');
            document.body.style.removeProperty('background-size');
            document.body.style.removeProperty('background-position');
            document.body.style.removeProperty('background-attachment');

            if (game) {
                game.style.removeProperty('background');
            }
        }

        // Actualizar descripción del taller si existe
        const estadoResumen = document.getElementById('estado-resumen');
        if (estadoResumen && workshop.descripcion) {
            estadoResumen.innerHTML = `<span class="taller-descripcion">${escaparHTML(limpiarTexto(workshop.descripcion, 180))}</span>`;
        }
    }

    // ============================================
    // CARGAR EDITOR
    // ============================================
    function cargarEditorPersonajes() {
        const perfil = leerPerfil() || {};

        // Cargar datos del jugador
        const player = perfil.player || {};
        const workshop = perfil.workshop || {};

        const inputJugadorNombre = document.getElementById('cp-jugador-nombre');
        const inputTallerNombre = document.getElementById('cp-taller-nombre');
        const inputJugadorHistoria = document.getElementById('cp-jugador-historia');
        const inputJugadorFoto = document.getElementById('cp-jugador-foto');
        const previewJugador = document.getElementById('cp-jugador-preview');

        if (inputJugadorNombre) inputJugadorNombre.value = limpiarTexto(player.nombre, 30);
        if (inputTallerNombre) inputTallerNombre.value = limpiarTexto(player.tallerNombre, 40);
        if (inputJugadorHistoria) inputJugadorHistoria.value = limpiarTexto(player.historia, 320);
        if (inputJugadorFoto) inputJugadorFoto.value = normalizarUrlImagen(player.foto, 'foto');

        if (previewJugador) {
            const fotoJugadorPreview = inputJugadorFoto?.value 
                ? normalizarUrlImagen(inputJugadorFoto.value, 'foto') 
                : '';
            if (fotoJugadorPreview) {
                previewJugador.src = fotoJugadorPreview;
                previewJugador.classList.remove('hidden');
                previewJugador.style.display = 'block';
            } else {
                previewJugador.src = '';
                previewJugador.classList.add('hidden');
            }
        }

        // Cargar datos del taller
        const inputFondoUrl = document.getElementById('cp-fondo-url');
        const inputFondoDesc = document.getElementById('cp-fondo-desc');
        const previewFondo = document.getElementById('cp-fondo-preview');
        
        if (inputFondoUrl) inputFondoUrl.value = normalizarUrlImagen(workshop.fondoUrl, 'fondo');
        if (inputFondoDesc) inputFondoDesc.value = limpiarTexto(workshop.descripcion, 180);

        if (previewFondo) {
            const fondoPreview = inputFondoUrl?.value 
                ? normalizarUrlImagen(inputFondoUrl.value, 'fondo') 
                : '';
            if (fondoPreview) {
                previewFondo.src = fondoPreview;
                previewFondo.classList.remove('hidden');
                previewFondo.style.display = 'block';
            } else {
                previewFondo.src = '';
                previewFondo.classList.add('hidden');
            }
        }

        // Construir tarjetas de mecánicos y clientes
        construirTarjetasMecanicos(perfil);
        construirTarjetasClientes(perfil);
    }

    // ============================================
    // GUARDAR PERFIL
    // ============================================
    function guardarPerfilPersonajes() {
        try {
            // Recolectar datos del jugador
            const perfil = {
                player: {
                    nombre: limpiarTexto(document.getElementById('cp-jugador-nombre')?.value, 30),
                    tallerNombre: limpiarTexto(document.getElementById('cp-taller-nombre')?.value, 40),
                    historia: limpiarTexto(document.getElementById('cp-jugador-historia')?.value, 320),
                    foto: normalizarUrlImagen(document.getElementById('cp-jugador-foto')?.value, 'foto')
                },
                workshop: {
                    fondoUrl: normalizarUrlImagen(document.getElementById('cp-fondo-url')?.value, 'fondo'),
                    descripcion: limpiarTexto(document.getElementById('cp-fondo-desc')?.value, 180)
                },
                mechanics: [],
                clients: []
            };

            // Recolectar datos de mecánicos
            MECANICOS_BASE.forEach((base, idx) => {
                const mecanico = {
                    id: base.id,
                    nombre: limpiarTexto(document.getElementById(`cp-mec-nombre-${idx}`)?.value, 30),
                    especialidad: limpiarTexto(document.getElementById(`cp-mec-especialidad-${idx}`)?.value, 20) || base.especialidad,
                    historia: limpiarTexto(document.getElementById(`cp-mec-historia-${idx}`)?.value, 300),
                    rivalidad: limpiarTexto(document.getElementById(`cp-mec-rivalidad-${idx}`)?.value, 200),
                    necesidad: limpiarTexto(document.getElementById(`cp-mec-necesidad-${idx}`)?.value, 200),
                    foto: normalizarUrlImagen(document.getElementById(`cp-mec-foto-${idx}`)?.value, 'mecanico')
                };
                perfil.mechanics.push(mecanico);
            });

            // Recolectar datos de clientes
            CLIENTES_BASE.forEach((_, idx) => {
                const cliente = {
                    nombre: limpiarTexto(document.getElementById(`cp-cli-nombre-${idx}`)?.value, 28),
                    personalidad: document.getElementById(`cp-cli-personalidad-${idx}`)?.value || 'metodico',
                    historia: limpiarTexto(document.getElementById(`cp-cli-historia-${idx}`)?.value, 250),
                    foto: normalizarUrlImagen(document.getElementById(`cp-cli-foto-${idx}`)?.value, 'cliente')
                };
                perfil.clients.push(cliente);
            });

            // Crear backup antes de guardar
            crearBackupPerfil();

            // Guardar perfil
            localStorage.setItem(CREATOR_KEY, JSON.stringify(perfil));
            
            // Actualizar datos globales
            if (window.TallerData) {
                window.TallerData.perfilPersonalizado = perfil;
                
                // Actualizar mecánicos en TallerData si existen
                if (window.TallerData.mecanicosIniciales) {
                    window.TallerData.mecanicosIniciales = perfil.mechanics.map(m => ({
                        ...m,
                        enojo: 0,
                        habilidad: 0.63,
                        velocidad: 0.59,
                        eficiencia: 0.65,
                        humor: 7,
                        xp: 0,
                        nivel: 1,
                        lealtad: 65
                    }));
                }
            }

            // Aplicar cambios visuales
            aplicarPerfilVisual(perfil);

            // Mostrar mensaje de éxito
            const msg = '✅ Perfil guardado correctamente.\n\n' +
                       'Los cambios visuales se aplicarán inmediatamente.\n' +
                       'Los cambios narrativos se aplicarán en los próximos casos.';
            alert(msg);

        } catch (e) {
            console.error('Error guardando perfil:', e);
            alert('❌ No se pudo guardar el perfil. Intenta de nuevo.');
        }
    }

    // ============================================
    // EXPORTAR/IMPORTAR PERFIL
    // ============================================
    function exportarPerfil() {
        const perfil = leerPerfil();
        if (!perfil) {
            alert('No hay perfil para exportar');
            return;
        }

        const dataStr = JSON.stringify(perfil, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `taller_world_perfil_${Date.now()}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    function importarPerfil() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(ev) {
                try {
                    const perfil = JSON.parse(ev.target.result);
                    localStorage.setItem(CREATOR_KEY, JSON.stringify(perfil));
                    cargarEditorPersonajes();
                    alert('✅ Perfil importado correctamente');
                } catch (err) {
                    alert('❌ Error al importar: archivo inválido');
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }

    // ============================================
    // FUNCIONES DE INTERFAZ
    // ============================================
    function abrirEditorPersonajes() {
        cargarEditorPersonajes();
        
        const menu = typeof obtenerMenuInicioEl === 'function'
            ? obtenerMenuInicioEl()
            : document.getElementById('menu-inicio');
        const editor = document.getElementById('editor-personajes');
        const game = document.getElementById('game');
        
        if (menu) menu.classList.add('hidden');
        if (game) game.classList.add('hidden');
        if (editor) {
            editor.classList.remove('hidden');
            editor.scrollIntoView({ behavior: 'smooth' });
        }
    }

    function cerrarEditorPersonajes() {
        const menu = typeof obtenerMenuInicioEl === 'function'
            ? obtenerMenuInicioEl()
            : document.getElementById('menu-inicio');
        const editor = document.getElementById('editor-personajes');
        
        if (editor) editor.classList.add('hidden');
        if (menu) menu.classList.remove('hidden');
    }

    function restablecerPerfilPersonajes() {
        const ok = confirm('⚠️ ¿Estás seguro?\n\nSe borrará todo el perfil personalizado y se restaurarán los valores por defecto.\n\nEsta acción no se puede deshacer.');
        
        if (!ok) return;
        
        localStorage.removeItem(CREATOR_KEY);
        location.reload();
    }

    function mostrarAyudaEditor() {
        alert('📝 GUÍA DEL EDITOR\n\n' +
              '• Completa los campos de cada personaje\n' +
              '• Puedes subir fotos o usar URLs\n' +
              '• Las historias aparecerán en los casos\n' +
              '• Las personalidades afectan el comportamiento\n\n' +
              '💾 Guarda antes de salir\n' +
              '📤 Exporta para compartir tu perfil\n' +
              '📥 Importa perfiles de otros jugadores');
    }

    // ============================================
    // INICIALIZACIÓN
    // ============================================
    function init() {
        // Aplicar perfil guardado al cargar
        const perfilInicial = leerPerfil();
        if (perfilInicial) {
            aplicarPerfilVisual(perfilInicial);
            
            // Si existe TallerData, integrar perfil
            if (window.TallerData) {
                window.TallerData.perfilPersonalizado = perfilInicial;
            }
        }

        // Exponer funciones globalmente
        window.cargarImagenEnCampo = cargarImagenEnCampo;
        window.guardarPerfilPersonajes = guardarPerfilPersonajes;
        window.abrirEditorPersonajes = abrirEditorPersonajes;
        window.cerrarEditorPersonajes = cerrarEditorPersonajes;
        window.restablecerPerfilPersonajes = restablecerPerfilPersonajes;
        window.aplicarPerfilVisual = aplicarPerfilVisual;
        window.exportarPerfil = exportarPerfil;
        window.importarPerfil = importarPerfil;
        window.mostrarAyudaEditor = mostrarAyudaEditor;
    }

    // Ejecutar inicialización cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();