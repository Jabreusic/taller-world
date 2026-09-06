const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadScripts(files, context) {
    vm.createContext(context);
    files.forEach((file) => {
        vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context, { filename: file });
    });
}

const game = { console };
game.window = game;
game.TallerData = {};
game.XP_HUD = {};
loadScripts([
    'js/data/team-data.js',
    'js/data/client-data.js',
    'js/data/narrative-data.js',
    'js/data/expansion-data.js',
    'js/state.js',
    'js/analytics/events.js',
    'js/analytics/player-profile.js',
    'js/analytics/narrative-director.js'
], game);

assert.equal(game.TallerData.zonasBarrio.length, 6);
assert.ok(game.TallerData.arcoNarrativo.some((arco) => arco.id === 'arco7'));
assert.ok(game.TallerData.diagnosticos.some((caso) => caso.especialidad === 'hibrido'));
assert.ok(game.TallerData.mecanicosDisponiblesBase.some((mecanico) => mecanico.especialidad === 'diagnostico_avanzado'));
assert.equal(game.reservarRecompensa('smoke-recompensa'), true);
assert.equal(game.reservarRecompensa('smoke-recompensa'), false);
game.registrarEventoNarrativo('zona_desbloqueada', { zona: 'distrito-industrial' });
game.registrarEventoNarrativo('zona_desbloqueada', { zona: 'distrito-industrial' });
assert.equal(JSON.stringify(game.obtenerMemoriaNarrativa().zonasDesbloqueadas), '["distrito-industrial"]');
game.registrarEventoNarrativo('cliente_recurrente', { nombre: 'Cliente Smoke' });
assert.ok(game.obtenerPerfilNarrativo().social > 0);
game.registrarEventoNarrativo('caja_b_usada', { operacion: 'rescate' });
game.registrarEventoNarrativo('caja_b_usada', { operacion: 'picoteo' });
assert.equal(game.obtenerMisionNarrativaActual().tipo, 'riesgo');
assert.ok(game.obtenerVarianteCapitulo({ id: 'arco7' }).length > 20);

const elements = {
    'onboarding-objective-title': { textContent: '' },
    'onboarding-objective-detail': { textContent: '' }
};
const onboarding = { console, document: { getElementById: (id) => elements[id] } };
onboarding.window = onboarding;
onboarding.clientesEnEspera = [{ idCaso: 'CASO-1' }];
onboarding.casosPendientesDiagnostico = [];
onboarding.reparacionesActivas = [];
loadScripts(['js/onboarding.js'], onboarding);
assert.equal(onboarding.actualizarObjetivoOnboarding().titulo, 'Atiende al siguiente cliente');
assert.equal(elements['onboarding-objective-title'].textContent, 'Atiende al siguiente cliente');
const tallerScreen = fs.readFileSync(path.join(__dirname, '..', 'js/screens/screen-taller.js'), 'utf8');
assert.ok(tallerScreen.includes('id="onboarding-objective-title"'));
assert.ok(tallerScreen.includes('id="onboarding-objective-detail"'));

const serviceWorker = fs.readFileSync(path.join(__dirname, '..', 'service-worker.js'), 'utf8');
for (const asset of [
    'js/app-meta.js',
    'js/onboarding.js',
    'js/data/expansion-data.js',
    'js/modules/clients-history.js',
    'js/modules/team-parts.js',
    'js/modules/progression.js'
]) {
    assert.ok(fs.existsSync(path.join(__dirname, '..', asset)), `recurso ausente: ${asset}`);
    assert.ok(serviceWorker.includes(`'./${asset}'`), `recurso fuera del precache: ${asset}`);
}
for (const asset of [
    'js/analytics/events.js',
    'js/analytics/player-profile.js',
    'js/analytics/narrative-director.js'
]) {
    assert.ok(fs.existsSync(path.join(__dirname, '..', asset)), `analitica ausente: ${asset}`);
    assert.ok(serviceWorker.includes(`'./${asset}'`), `analitica fuera del precache: ${asset}`);
}

const audioSfx = fs.readFileSync(path.join(__dirname, '..', 'js/audio-sfx.js'), 'utf8');
assert.ok(audioSfx.includes('data-sfx'));
assert.ok(!audioSfx.includes('comprar|mejorar|pagar|instalar'));

console.log('smoke tests: ok');
