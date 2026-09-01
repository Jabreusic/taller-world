// Provisional bridge for legacy turn-based cost system.
// Will be replaced by the new case-based economy model.
const COSTOS_TURNO = {
    hablarCliente: 1,
    diagnostico: 2,
    reparacion: 3,
    negociacion: 2,
    comprarPieza: 1,
    comida: 1,
    gestionarCola: 1,
    contratar: 2,
    capacitar: 2,
    comer: -8,
    cafe: -4,
    mediarConflicto: 2,
    irAlBar: -3,
    planificarEstrategia: 1,
    decisionHistoria: 1,
    esperaActiva: -1,
    espera: 1,
    // Default values for actions not in costosPorCaso
    mejorar: 1,
    banco: 1,
    bar: 1,
    clandestino: 1,
    piezaVip: 1,
    estrategia: 1
};
