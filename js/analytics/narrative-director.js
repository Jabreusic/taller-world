(function () {
    function obtenerMemoriaNarrativa() {
        var state = window.TallerApp && window.TallerApp.state;
        if (!state) return {};
        if (!state.memoriaNarrativa || typeof state.memoriaNarrativa !== 'object') state.memoriaNarrativa = {};
        return state.memoriaNarrativa;
    }

    function actualizarMemoriaNarrativaDesdeEvento(evento) {
        var memoria = obtenerMemoriaNarrativa();
        var detalles = evento.detalles || {};
        if (evento.tipo === 'caso_resuelto') {
            memoria.ultimoResultado = detalles.resultado || memoria.ultimoResultado || null;
            memoria.ultimoGranFallo = detalles.resultado === 'fallido' ? (detalles.diagnostico || detalles.especialidad || null) : memoria.ultimoGranFallo || null;
            if (detalles.especialidad) memoria.ultimaEspecialidad = detalles.especialidad;
        }
        if (evento.tipo === 'caja_b_usada') memoria.vecesCajaB = Math.max(0, Number(memoria.vecesCajaB) || 0) + 1;
        if (evento.tipo === 'control_inspector') memoria.inspectorActivo = detalles.resultado !== 'transparente';
        if (evento.tipo === 'cliente_recurrente' && detalles.nombre) memoria.primerClienteFiel = memoria.primerClienteFiel || detalles.nombre;
        if (evento.tipo === 'mecanico_contratado' && detalles.nombre) memoria.ultimoMecanicoContratado = detalles.nombre;
        if (evento.tipo === 'mecanico_ignorado' && detalles.nombre) memoria.mecanicoIgnorado = detalles.nombre;
        if (evento.tipo === 'zona_desbloqueada' && detalles.zona) {
            if (!Array.isArray(memoria.zonasDesbloqueadas)) memoria.zonasDesbloqueadas = [];
            if (memoria.zonasDesbloqueadas.indexOf(detalles.zona) < 0) memoria.zonasDesbloqueadas.push(detalles.zona);
            memoria.zonaDesbloqueada = detalles.zona;
        }
        if (typeof detalles.deuda === 'number') memoria.deudaMaxima = Math.max(Number(memoria.deudaMaxima) || 0, detalles.deuda);
        return memoria;
    }

    function seleccionarContenidoNarrativo(contexto) {
        var perfil = window.obtenerPerfilNarrativo ? window.obtenerPerfilNarrativo() : {};
        var estilo = window.obtenerEstiloNarrativoDominante ? window.obtenerEstiloNarrativoDominante() : 'tecnico';
        var memoria = obtenerMemoriaNarrativa();
        var contenido = {
            estilo: estilo,
            perfil: perfil,
            memoria: memoria,
            contexto: contexto || {},
            chat: '',
            mision: null,
            varianteCapitulo: estilo
        };
        if (estilo === 'social') contenido.chat = 'El equipo nota que escuchas antes de decidir. La confianza del barrio empieza a devolverte el favor.';
        else if (estilo === 'riesgo') contenido.chat = 'Tus atajos ya tienen memoria. Mr. Colon pregunta si el taller esta listo para una operacion mas grande.';
        else if (estilo === 'dinero') contenido.chat = 'La caja mejora, pero cada expansion abre una factura nueva. El barrio quiere saber hasta donde piensas crecer.';
        else if (estilo === 'velocidad') contenido.chat = 'El taller no se detiene. Ahora el reto es demostrar que la rapidez no sacrifica el diagnostico.';
        else if (estilo === 'legalidad') contenido.chat = 'Tus registros hablan por ti. El inspector aun observa, pero ya no encuentra el mismo taller de antes.';
        else contenido.chat = memoria.ultimoGranFallo ? 'Despues de ' + memoria.ultimoGranFallo + ', cada diagnostico empieza con una pregunta mas precisa.' : 'Cada caso deja una pista. El taller empieza a construir una forma propia de trabajar.';
        if (estilo === 'riesgo') contenido.mision = { id: 'bajar-calor', titulo: 'Baja el calor del inspector', objetivo: 'Completa tres casos sin usar Caja B.' };
        else if (estilo === 'social') contenido.mision = { id: 'cuidar-clientes', titulo: 'Haz que vuelvan', objetivo: 'Convierte dos clientes conocidos en clientes fieles.' };
        else if (estilo === 'tecnico') contenido.mision = { id: 'dominio-tecnico', titulo: 'Afina el diagnostico', objetivo: 'Completa tres casos de tu especialidad dominante.' };
        return contenido;
    }

    function seleccionarMisionNarrativa() {
        var perfil = window.obtenerPerfilNarrativo ? window.obtenerPerfilNarrativo() : {};
        var memoria = obtenerMemoriaNarrativa();
        if ((perfil.riesgo || 0) >= 5 || (memoria.vecesCajaB || 0) >= 2) {
            return { id: 'mision-calor', titulo: 'Baja el calor del inspector', objetivo: 'Completa tres casos sin usar Caja B.', tipo: 'riesgo' };
        }
        if ((perfil.social || 0) >= 5) {
            return { id: 'mision-fidelidad', titulo: 'Haz que vuelvan', objetivo: 'Convierte dos clientes conocidos en clientes fieles.', tipo: 'social' };
        }
        if ((perfil.liderazgo || 0) >= 4) {
            return { id: 'mision-equipo', titulo: 'Sostén al equipo', objetivo: 'Atiende dos solicitudes de mecánicos.', tipo: 'liderazgo' };
        }
        if ((perfil.tecnico || 0) >= 5) {
            return { id: 'mision-especialidad', titulo: 'Afina el diagnostico', objetivo: 'Completa tres casos de tu especialidad dominante.', tipo: 'tecnico' };
        }
        return { id: 'mision-primer-estilo', titulo: 'Define tu forma de trabajar', objetivo: 'Cierra dos casos y observa que tipo de taller estas construyendo.', tipo: 'descubrimiento' };
    }

    function obtenerMisionNarrativaActual() {
        var state = window.TallerApp && window.TallerApp.state;
        if (!state) return seleccionarMisionNarrativa();
        if (!state.misionNarrativa || typeof state.misionNarrativa !== 'object') state.misionNarrativa = seleccionarMisionNarrativa();
        return state.misionNarrativa;
    }

    function obtenerVarianteCapitulo(arco) {
        var estilo = window.obtenerEstiloNarrativoDominante ? window.obtenerEstiloNarrativoDominante() : 'tecnico';
        var variantes = {
            tecnico: 'La alianza llega por tu precision: el distrito necesita a alguien que sepa explicar cada fallo antes de tocar una pieza.',
            velocidad: 'La expansion te mide por tiempos: una flota ofrece volumen, pero solo si puedes mantener el flujo sin perder control.',
            dinero: 'El contrato grande parece una salida financiera, aunque sus condiciones podrian convertir el crecimiento en otra deuda.',
            social: 'La cooperativa del barrio te busca porque recuerda a quien atendio a su gente cuando nadie mas tenia tiempo.',
            riesgo: 'Un contacto de Caja B aparece con una propuesta que puede abrir la zona o hacer que el inspector entre contigo.',
            legalidad: 'El banco condiciona la expansion a registros impecables: esta vez la confianza vale tanto como la caja.',
            liderazgo: 'La expansion depende del equipo: sin mecánicos cuidados, ninguna nueva zona se sostiene.'
        };
        return variantes[estilo] || variantes.tecnico;
    }

    function actualizarMisionNarrativa() {
        var state = window.TallerApp && window.TallerApp.state;
        if (!state) return seleccionarMisionNarrativa();
        state.misionNarrativa = seleccionarMisionNarrativa();
        return state.misionNarrativa;
    }

    function emitirReaccionNarrativa(evento) {
        if (typeof pushMensajeTelefono !== 'function' || !evento) return false;
        var detalles = evento.detalles || {};
        var texto = '';
        var contacto = 'memoria_taller';
        var autor = 'Memoria del taller';
        if (evento.tipo === 'cliente_recurrente') {
            texto = 'Volvi porque la ultima vez me explicaste que tenia el carro. Espero que hoy sea igual de claro.';
            contacto = 'cliente_' + String(detalles.nombre || 'recurrente').toLowerCase().replace(/[^a-z0-9]+/g, '_');
            autor = detalles.nombre || 'Cliente recurrente';
        } else if (evento.tipo === 'mecanico_contratado') {
            texto = 'Jefe, listo para el primer caso. Si seguimos tomando ' + (detalles.especialidad || 'trabajos') + ', quiero demostrar que fue una buena contratacion.';
            contacto = 'mec_' + String(detalles.nombre || 'nuevo').replace(/\s+/g, '_');
            autor = detalles.nombre || 'Mecanico';
        } else if (evento.tipo === 'caja_b_usada') {
            texto = 'La operacion dejo rastro. Si sigues por ese camino, el inspector va a conectar los puntos.';
            autor = 'Aviso de riesgo';
        } else if (evento.tipo === 'control_inspector') {
            texto = 'El inspector ya tiene una nota sobre el taller. Conviene que los proximos movimientos queden documentados.';
            autor = 'Inspector';
        } else {
            return false;
        }
        pushMensajeTelefono(contacto, contacto, texto, {
            clave: 'reaccion-narrativa-' + evento.id,
            autorNombre: autor
        });
        return true;
    }

    window.obtenerMemoriaNarrativa = obtenerMemoriaNarrativa;
    window.actualizarMemoriaNarrativaDesdeEvento = actualizarMemoriaNarrativaDesdeEvento;
    window.seleccionarContenidoNarrativo = seleccionarContenidoNarrativo;
    window.obtenerMisionNarrativaActual = obtenerMisionNarrativaActual;
    window.obtenerVarianteCapitulo = obtenerVarianteCapitulo;
    window.actualizarMisionNarrativa = actualizarMisionNarrativa;
    window.emitirReaccionNarrativa = emitirReaccionNarrativa;
    window.TallerApp.narrativeDirector = {
        select: seleccionarContenidoNarrativo,
        memory: obtenerMemoriaNarrativa,
        mission: obtenerMisionNarrativaActual
    };
})();
