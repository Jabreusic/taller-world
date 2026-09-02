(function () {
  var AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  var sfxEnabled = true;
  var musicEnabled = true;
  var context = null;
  var masterGain = null;
  var backgroundMusic = null;
  var backgroundMusicUnlocked = false;
  var musicIndex = 0;
  var MUSIC_SOURCES = [
    "audio/main/taller-world-theme.mp3",
    "audio/main/taller-world-theme2.mp3",
    "audio/main/taller-world-theme3.mp3",
    "audio/main/taller-world-theme4.mp3",
  ];

  function ensureContext() {
    if (!AudioContextCtor) return null;
    if (!context) {
      context = new AudioContextCtor();
      masterGain = context.createGain();
      masterGain.gain.value = 0.18;
      masterGain.connect(context.destination);
    }
    return context;
  }

  function resumeContext() {
    var ctx = ensureContext();
    if (!ctx) return Promise.resolve(false);
    if (ctx.state === "suspended") {
      return ctx
        .resume()
        .then(function () {
          return true;
        })
        .catch(function () {
          return false;
        });
    }
    return Promise.resolve(true);
  }

  function ensureBackgroundMusic() {
    if (backgroundMusic) return backgroundMusic;
    backgroundMusic = document.createElement("audio");
    backgroundMusic.preload = "auto";
    backgroundMusic.loop = false;
    backgroundMusic.volume = 0.12;
    backgroundMusic.src = MUSIC_SOURCES[musicIndex];
    backgroundMusic.addEventListener("ended", function () {
      musicIndex = (musicIndex + 1) % MUSIC_SOURCES.length;
      backgroundMusic.src = MUSIC_SOURCES[musicIndex];
      backgroundMusic.play().catch(function () {});
    });
    return backgroundMusic;
  }

  function pauseBackgroundMusic() {
    var audio = ensureBackgroundMusic();
    if (!audio) return false;
    audio.pause();
    return true;
  }

  function playBackgroundMusic() {
    var audio = ensureBackgroundMusic();
    if (!audio || !musicEnabled || !backgroundMusicUnlocked) return Promise.resolve(false);
    return audio
      .play()
      .then(function () {
        return true;
      })
      .catch(function () {
        return false;
      });
  }

  function syncBackgroundMusic() {
    if (!musicEnabled) {
      pauseBackgroundMusic();
      return Promise.resolve(false);
    }
    return playBackgroundMusic();
  }

  function bindUnlockEvents() {
    ["pointerdown", "touchstart", "keydown"].forEach(function (eventName) {
      document.addEventListener(
        eventName,
        function () {
          backgroundMusicUnlocked = true;
          resumeContext();
          syncBackgroundMusic();
        },
        { passive: true },
      );
    });
  }

  function playStep(step) {
    var ctx = ensureContext();
    if (!ctx || !masterGain || ctx.state === "suspended" || !sfxEnabled) return false;

    var startAt = ctx.currentTime + Math.max(0, Number(step.delay) || 0);
    var duration = Math.max(0.03, Number(step.duration) || 0.08);
    var attack = Math.min(0.02, duration * 0.35);
    var release = Math.min(0.08, duration * 0.7);
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    var startFreq = Math.max(80, Number(step.frequency) || 440);
    var endFreq = Math.max(80, Number(step.endFrequency) || startFreq);
    var peakGain = Math.max(0.0001, Math.min(0.28, Number(step.gain) || 0.09));

    osc.type = step.wave || "sine";
    osc.frequency.setValueAtTime(startFreq, startAt);
    osc.frequency.exponentialRampToValueAtTime(endFreq, startAt + duration);

    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(peakGain, startAt + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration + release);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(startAt);
    osc.stop(startAt + duration + release + 0.01);
    return true;
  }

  function playSequence(steps) {
    var played = false;
    steps.forEach(function (step) {
      played = playStep(step) || played;
    });
    return played;
  }

  function play(name) {
    if (!sfxEnabled) return false;

    var presets = {
      nav: [
        { wave: "triangle", frequency: 540, endFrequency: 720, duration: 0.045, gain: 0.04 },
      ],
      info: [
        { wave: "sine", frequency: 480, endFrequency: 620, duration: 0.06, gain: 0.04 },
      ],
      success: [
        { wave: "triangle", frequency: 420, endFrequency: 630, duration: 0.08, gain: 0.05 },
        { wave: "triangle", frequency: 630, endFrequency: 880, duration: 0.09, delay: 0.05, gain: 0.05 },
      ],
      money: [
        { wave: "triangle", frequency: 520, endFrequency: 780, duration: 0.05, gain: 0.05 },
        { wave: "triangle", frequency: 780, endFrequency: 1040, duration: 0.06, delay: 0.04, gain: 0.06 },
      ],
      warn: [
        { wave: "square", frequency: 420, endFrequency: 280, duration: 0.09, gain: 0.04 },
      ],
      fail: [
        { wave: "sawtooth", frequency: 340, endFrequency: 210, duration: 0.08, gain: 0.05 },
        { wave: "sawtooth", frequency: 240, endFrequency: 160, duration: 0.08, delay: 0.06, gain: 0.04 },
      ],
      error: [
        { wave: "sawtooth", frequency: 240, endFrequency: 140, duration: 0.12, gain: 0.06 },
      ],
      close: [
        { wave: "triangle", frequency: 660, endFrequency: 480, duration: 0.05, gain: 0.035 },
      ],
    };

    return playSequence(presets[name] || presets.info);
  }

  window.TallerAudio = {
    isSupported: function () {
      return !!AudioContextCtor;
    },
    setEnabled: function (nextValue) {
      sfxEnabled = nextValue !== false;
      return sfxEnabled;
    },
    isEnabled: function () {
      return sfxEnabled;
    },
    setMusicEnabled: function (nextValue) {
      musicEnabled = nextValue !== false;
      syncBackgroundMusic();
      return musicEnabled;
    },
    isMusicEnabled: function () {
      return musicEnabled;
    },
    unlock: resumeContext,
    startMusic: function () {
      backgroundMusicUnlocked = true;
      return syncBackgroundMusic();
    },
    stopMusic: pauseBackgroundMusic,
    getMusicSources: function () {
      return MUSIC_SOURCES.slice();
    },
    play: play,
  };

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", bindUnlockEvents, { once: true });
    } else {
      bindUnlockEvents();
    }
  }
})();
