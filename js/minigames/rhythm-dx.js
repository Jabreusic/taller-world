(function(window) {
    'use strict';
    var partida = null;

    function terminar() {
        if (!partida) return;
        var caso = window.clienteActual;
        var mismaFicha = caso && String(caso.idCaso || '') === partida.idCaso;
        var bonus = partida.aciertos >= 4 ? 12 : (partida.aciertos >= 2 ? 7 : 3);
        if (mismaFicha) {
            caso.bonusRitmoDx = Math.max(Number(caso.bonusRitmoDx) || 0, bonus / 100);
            caso.ofDxConfianzaPct = Math.min(100, Math.max(0, Math.round(Number(caso.ofDxConfianzaPct) || 0)) + bonus);
        }
        var feedback = document.getElementById('rhythm-feedback');
        if (feedback) feedback.innerText = mismaFicha ? 'Completado: ' + partida.aciertos + '/5 | Confianza +' + bonus + '%' : 'Caso cambiado: resultado descartado.';
        var btn = document.getElementById('rhythm-start-btn');
        if (btn) { btn.disabled = false; btn.innerText = 'Repetir'; }
        if (mismaFicha && typeof window.mostrarFeedbackGameplay === 'function') {
            window.mostrarFeedbackGameplay('Diagnostico ritmico ' + partida.idCaso + ': confianza +' + bonus + '%.', 'ok');
        }
        partida = null;
    }

    function siguientePulso() {
        if (!partida) return;
        var track = document.getElementById('rhythm-track-container');
        if (!track) { partida = null; return; }
        if (partida.ronda >= 5) { terminar(); return; }
        partida.ronda += 1;
        track.innerHTML = '';
        var objetivo = document.createElement('button');
        objetivo.type = 'button';
        objetivo.className = 'rhythm-target';
        objetivo.style.left = (10 + Math.floor(Math.random() * 76)) + '%';
        objetivo.innerText = String(partida.ronda);
        var resuelto = false;
        objetivo.onclick = function() {
            if (resuelto || !partida) return;
            resuelto = true;
            partida.aciertos += 1;
            objetivo.classList.add('hit');
            var score = document.getElementById('rhythm-score');
            if (score) score.innerText = 'Aciertos: ' + partida.aciertos + '/5';
            setTimeout(siguientePulso, 180);
        };
        track.appendChild(objetivo);
        setTimeout(function() {
            if (resuelto || !partida) return;
            resuelto = true;
            objetivo.classList.add('miss');
            setTimeout(siguientePulso, 180);
        }, 1100);
    }

    function RhythmGame() {}
    RhythmGame.start = function() {
        var caso = window.clienteActual;
        if (!caso || caso.diagnosticado || partida) return false;
        partida = { idCaso: String(caso.idCaso || ''), ronda: 0, aciertos: 0 };
        var btn = document.getElementById('rhythm-start-btn');
        if (btn) { btn.disabled = true; btn.innerText = 'En curso'; }
        var feedback = document.getElementById('rhythm-feedback');
        if (feedback) feedback.innerText = 'Pulsa cada objetivo antes de que desaparezca.';
        siguientePulso();
        return true;
    };

    window.TallerApp = window.TallerApp || {};
    window.TallerApp.minigames = window.TallerApp.minigames || {};
    window.TallerApp.minigames.RhythmGame = RhythmGame;
})(window);
