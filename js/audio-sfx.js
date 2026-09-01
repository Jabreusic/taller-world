// audio-sfx.js
// Reproduce efectos de sonido usando archivos mp3 en audio/sfx/ui/

const SFX_PATH = "audio/sfx/ui/";
const SFX_FILES = {
  click: "click.mp3",
  // El asset distribuido es WAV; mantener MP3 provocaba un 404 y una
  // promesa de audio rechazada al asignar un caso.
  assign: "assign.wav",
  case_accepted: "case_accepted.mp3",
  case_success: "case_success.mp3",
  case_fail: "case_fail.mp3",
  progress: "progress.mp3",
  level_up: "level_up.mp3",
  notify: "notify.mp3",
  confirm: "confirm.mp3",
  reject: "reject.mp3",
  menu_open: "menu_open.mp3",
  menu_close: "menu_close.mp3",
  client_arrive: "client_arrive.mp3",
  car_delivered: "car_delivered.mp3",
  bonus: "bonus.mp3",
  warning: "warning.mp3"
};

function playSfx(name) {
  if (!window.efectosSonidoActivos) return;
  const file = SFX_FILES[name];
  if (!file) return;
  const audio = new Audio(SFX_PATH + file);
  audio.volume = 0.5;
  var reproduccion = audio.play();
  if (reproduccion && typeof reproduccion.catch === "function") {
    reproduccion.catch(function () {
      // El sonido nunca debe interrumpir una accion del juego.
    });
  }
}

window.playSfx = playSfx;
