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
  // El archivo real se llama menu_closed.mp3; evita silencio al cerrar modales.
  menu_close: "menu_closed.mp3",
  client_arrive: "client_arrive.mp3",
  car_delivered: "car_delivered.mp3",
  bonus: "bonus.mp3",
  warning: "warning.mp3",
  money: "add_money.mp3"
};

function playSfx(name) {
  if (!window.efectosSonidoActivos) return;
  const file = SFX_FILES[name];
  if (!file) return;
  const audio = new Audio(SFX_PATH + file);
  // Mezcla más suave para móvil: los avisos destacan sin dominar la música.
  audio.volume = name === "click" || name === "progress" ? 0.28 : 0.44;
  var reproduccion = audio.play();
  if (reproduccion && typeof reproduccion.catch === "function") {
    reproduccion.catch(function () {
      // El sonido nunca debe interrumpir una accion del juego.
    });
  }
}

// Cobertura global: botones creados dinámicamente también tienen respuesta sonora.
// Se omiten los controles que ya invocan un SFX para no duplicar el sonido.
document.addEventListener("pointerdown", function (event) {
  var control = event.target && event.target.closest
    ? event.target.closest("button, summary, [role='button'], .game-nav-item")
    : null;
  if (!control || control.disabled) return;
  var efecto = String(control.getAttribute("data-sfx") || "").trim().toLowerCase();
  if (efecto === "silent") return;
  playSfx(efecto || "click");
}, { passive: true });

window.playSfx = playSfx;
