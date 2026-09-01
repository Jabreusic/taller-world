// ui/utils/ui-utils.js
// Utilidades generales para la UI

function esInteraccionMovil() {
    return window.matchMedia('(max-width: 980px)').matches || ('ontouchstart' in window);
}

function leerPaddingBottomCssPx(el) {
    if (!el) return 0;
    var inlineValue = el.style.getPropertyValue('padding-bottom');
    var inlinePriority = el.style.getPropertyPriority('padding-bottom');

    if (inlineValue) {
        el.style.removeProperty('padding-bottom');
    }

    var valor = parseFloat(window.getComputedStyle(el).paddingBottom) || 0;

    if (inlineValue) {
        el.style.setProperty('padding-bottom', inlineValue, inlinePriority);
    }

    return valor;
}

if (typeof window !== 'undefined') {
    window.esInteraccionMovil = esInteraccionMovil;
}
