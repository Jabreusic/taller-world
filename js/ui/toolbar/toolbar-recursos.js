// ui/toolbar/toolbar-recursos.js
// Funciones para el toolbar de recursos (mecánicos y delivery)

function actualizarToolbarRecursosUI() {
    const seleccionado = window.toolbarRecursosTab === 'delivery' ? 'delivery' : 'mecanicos';
    const abierto = !!window.toolbarRecursosAbierto;

    const tabMecanicos = document.getElementById('toolbar-tab-mecanicos');
    const tabDelivery = document.getElementById('toolbar-tab-delivery');
    const poolMecanicos = document.getElementById('grid-mecanicos');
    const poolDelivery = document.getElementById('delivery-slots-top');
    const card = document.getElementById('pending-dx-card');

    if (tabMecanicos) {
        const activo = abierto && seleccionado === 'mecanicos';
        tabMecanicos.classList.toggle('active', activo);
        tabMecanicos.setAttribute('aria-selected', activo ? 'true' : 'false');
    }
    if (tabDelivery) {
        const activo = abierto && seleccionado === 'delivery';
        tabDelivery.classList.toggle('active', activo);
        tabDelivery.setAttribute('aria-selected', activo ? 'true' : 'false');
    }

    const isDesktop = window.innerWidth >= 900;
    if (poolMecanicos) {
        if (isDesktop) {
            poolMecanicos.style.display = (seleccionado === 'mecanicos') ? 'flex' : 'none';
        } else {
            poolMecanicos.classList.toggle('hidden', !(abierto && seleccionado === 'mecanicos'));
            poolMecanicos.style.display = '';
        }
    }
    if (poolDelivery) {
        if (isDesktop) {
            poolDelivery.style.display = (seleccionado === 'delivery') ? 'flex' : 'none';
        } else {
            poolDelivery.classList.toggle('hidden', !(abierto && seleccionado === 'delivery'));
            poolDelivery.style.display = '';
        }
    }
    if (card) {
        card.classList.toggle('is-collapsed', !abierto);
    }
}

function seleccionarToolbarRecursos(tab) {
    const seleccionado = tab === 'delivery' ? 'delivery' : 'mecanicos';
    if (window.toolbarRecursosTab === seleccionado && window.toolbarRecursosAbierto) {
        window.toolbarRecursosAbierto = false;
    } else {
        window.toolbarRecursosTab = seleccionado;
        window.toolbarRecursosAbierto = true;
    }
    actualizarToolbarRecursosUI();
}

function colapsarToolbarRecursos() {
    window.toolbarRecursosAbierto = false;
    actualizarToolbarRecursosUI();
}

if (typeof window !== 'undefined') {
    window.seleccionarToolbarRecursos = seleccionarToolbarRecursos;
    window.colapsarToolbarRecursos = colapsarToolbarRecursos;
}
