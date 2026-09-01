// XP HUD Lógica para Taller World
// Modular, reutilizable y comentado

(function() {
  // Configuración de progresión XP
  function xpNeededForLevel(level) {
    // XP requerido = 100 * (nivel^1.5)
    return Math.floor(100 * Math.pow(level, 1.5));
  }

  // Estado del jugador (puede integrarse con el sistema de juego)
  let state = {
    level: 1,
    xp: 0,
    streakBonus: 0, // porcentaje extra por racha
  };
  let queuedXP = 0;
  let xpAnimationRunning = false;

  function getElements() {
    return {
      elLevelNum: document.getElementById('xp-level-num'),
      elLevelBadge: document.getElementById('xp-level-badge'),
      elProgressBar: document.getElementById('xp-progress-bar'),
      elProgressFill: document.getElementById('xp-progress-fill'),
      elProgressGlow: document.getElementById('xp-progress-glow'),
      elCurrent: document.getElementById('xp-current'),
      elNeeded: document.getElementById('xp-needed'),
      elTooltip: document.getElementById('xp-tooltip'),
      elTooltipPercent: document.getElementById('xp-tooltip-percent'),
      elTooltipRemaining: document.getElementById('xp-tooltip-remaining'),
      elTooltipStreak: document.getElementById('xp-tooltip-streak'),
      hud: document.querySelector('.xp-hud'),
    };
  }

  function hasRenderableHUD(elements) {
    return !!(
      elements &&
      elements.elLevelNum &&
      elements.elProgressBar &&
      elements.elProgressFill &&
      elements.elCurrent &&
      elements.elNeeded
    );
  }

  // Actualiza la UI del HUD
  function updateHUD(animate = true) {
    const elements = getElements();
    if (!hasRenderableHUD(elements)) return false;

    const {
      elLevelNum,
      elLevelBadge,
      elProgressBar,
      elProgressFill,
      elCurrent,
      elNeeded,
      elTooltipPercent,
      elTooltipRemaining,
      elTooltipStreak,
    } = elements;
    const xpNeeded = xpNeededForLevel(state.level);
    const percent = Math.min(100, (state.xp / xpNeeded) * 100);
    const nearLevel = percent >= 90;
    // Números
    elLevelNum.textContent = state.level;
    elCurrent.textContent = state.xp;
    elNeeded.textContent = xpNeeded;
    // Barra de progreso
    if (animate) {
      elProgressFill.style.transition = 'width 0.7s cubic-bezier(.4,1.6,.4,1)';
    } else {
      elProgressFill.style.transition = 'none';
    }
    elProgressFill.style.width = percent + '%';
    // Efecto especial cerca del nivel
    if (nearLevel) {
      elLevelBadge.classList.add('level-near');
      elProgressBar.classList.add('near-level');
    } else {
      elLevelBadge.classList.remove('level-near');
      elProgressBar.classList.remove('near-level');
    }
    // Tooltip
    if (elTooltipPercent) elTooltipPercent.textContent = percent.toFixed(1) + '%';
    if (elTooltipRemaining) elTooltipRemaining.textContent = Math.max(0, xpNeeded - state.xp);
    if (elTooltipStreak) elTooltipStreak.textContent = state.streakBonus + '%';
    return true;
  }

  // Animación suave al ganar XP
  function addXP(amount, streakBonus = 0) {
    state.streakBonus = streakBonus;
    const safeAmount = Math.max(0, Math.round(Number(amount) || 0));
    if (safeAmount <= 0) {
      updateHUD(true);
      return;
    }
    queuedXP += safeAmount;
    if (xpAnimationRunning) return;
    xpAnimationRunning = true;

    function animateXP() {
      const xpNeeded = xpNeededForLevel(state.level);
      if (state.xp >= xpNeeded) {
        state.xp -= xpNeeded;
        state.level++;
        updateHUD(false);
        setTimeout(animateXP, 500);
        return;
      }

      if (queuedXP <= 0) {
        xpAnimationRunning = false;
        updateHUD(true);
        return;
      }

      const step = Math.max(1, Math.ceil(queuedXP / 12));
      state.xp += step;
      queuedXP -= step;
      updateHUD(true);
      requestAnimationFrame(animateXP);
    }
    animateXP();
  }

  // Tooltip flotante
  function setupTooltip() {
    const elements = getElements();
    const hud = elements.hud;
    const elTooltip = elements.elTooltip;
    const elProgressBar = elements.elProgressBar;
    if (!hud || !elTooltip || !elProgressBar) return false;
    if (hud.dataset.xpHudTooltipBound === 'true') return true;

    function showTooltip() {
      elTooltip.hidden = false;
    }
    function hideTooltip() {
      elTooltip.hidden = true;
    }
    hud.addEventListener('mouseenter', showTooltip);
    hud.addEventListener('mouseleave', hideTooltip);
    hud.addEventListener('focusin', showTooltip);
    hud.addEventListener('focusout', hideTooltip);
    // Accesibilidad: mostrar con tab
    elProgressBar.tabIndex = 0;
    elProgressBar.addEventListener('focus', showTooltip);
    elProgressBar.addEventListener('blur', hideTooltip);
    hud.dataset.xpHudTooltipBound = 'true';
    return true;
  }

  // Inicialización
  function initXP_HUD(initialLevel = 1, initialXP = 0, streakBonus = 0) {
    state.level = initialLevel;
    state.xp = initialXP;
    state.streakBonus = streakBonus;
    updateHUD(false);
    setupTooltip();
  }

  // Exponer funciones globalmente para integración
  window.XP_HUD = {
    init: initXP_HUD,
    addXP: addXP,
    getState: () => ({ ...state }),
    xpNeededForLevel,
  };

  // Auto-inicializar si el HUD está presente
  if (hasRenderableHUD(getElements())) {
    initXP_HUD(1, 0, 0);
  }
})();
