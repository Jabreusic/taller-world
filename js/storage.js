(function () {
    window.TallerApp = window.TallerApp || {};

    var storage = window.TallerApp.storage || {};
    var keys = Object.assign(
        {
            save: 'taller_casos_world_save_v2',
            options: 'taller_casos_world_options_v2',
            activeJobs: 'trabajosActivos',
            muscleProject: 'estadoProyectoMuscle',
            forceNewSession: 'tw_force_new',
            uiEditor: 'tw_ui_editor_v1',
            creatorProfile: 'tw_character_studio_v2',
            creatorProfileLegacy: 'tw_character_studio_v1',
            creatorBackup: 'tw_character_studio_backup_v2'
        },
        storage.keys || {}
    );

    function getStorageArea(area) {
        return area === 'session' ? window.sessionStorage : window.localStorage;
    }

    function warn(action, key, error) {
        if (
            typeof console !== 'undefined' &&
            console &&
            typeof console.warn === 'function'
        ) {
            console.warn('[persistencia] ' + action + ' fallo para ' + key + '.', error);
        }
    }

    function readRaw(key, area) {
        try {
            return getStorageArea(area).getItem(key);
        } catch (error) {
            warn('leer', key, error);
            return null;
        }
    }

    function writeRaw(key, value, area) {
        try {
            getStorageArea(area).setItem(key, value);
            return true;
        } catch (error) {
            warn('guardar', key, error);
            return false;
        }
    }

    function remove(key, area) {
        try {
            getStorageArea(area).removeItem(key);
            return true;
        } catch (error) {
            warn('eliminar', key, error);
            return false;
        }
    }

    function readJSON(key, fallbackValue, area) {
        var raw = readRaw(key, area);
        if (!raw) return fallbackValue;
        try {
            return JSON.parse(raw);
        } catch (error) {
            warn('parsear', key, error);
            return fallbackValue;
        }
    }

    function writeJSON(key, value, area) {
        try {
            return writeRaw(key, JSON.stringify(value), area);
        } catch (error) {
            warn('serializar', key, error);
            return false;
        }
    }

    function resetGamePersistence() {
        remove(keys.save, 'local');
        remove(keys.activeJobs, 'local');
        remove(keys.muscleProject, 'local');
    }

    storage.keys = keys;
    storage.warn = warn;
    storage.readRaw = readRaw;
    storage.writeRaw = writeRaw;
    storage.readJSON = readJSON;
    storage.writeJSON = writeJSON;
    storage.remove = remove;
    storage.resetGamePersistence = resetGamePersistence;

    window.TallerApp.storage = storage;
})();