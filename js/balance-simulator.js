(function () {
  "use strict";

  function rand(min, max) { return min + Math.random() * (max - min); }
  function simularBalanceTaller(objetivo, opciones) {
    var cfg = opciones || {};
    var meta = Math.max(5000, Number(objetivo) || 50000);
    var caja = Number.isFinite(Number(cfg.cajaInicial)) ? Number(cfg.cajaInicial) : 2000;
    var casos = 0, exitos = 0, parciales = 0, fallos = 0, negociaciones = 0;
    var gastoPiezas = 0, gastoComida = 0, gastoMejoras = 0, ingresosTotales = 0, necesidades = 0;
    var puntos = cfg.usarMejoras === false ? 0 : 3;
    var bonusDx = 0, bonusNeg = 0, bonusEnergia = 0, hambre = 20, sueno = 20, estres = 0;
    var maxCasos = Math.max(20, Number(cfg.maxCasos) || 500);
    var detalle = [];

    while (caja < meta && casos < maxCasos) {
      casos++;
      // Curva tycoon: el taller empieza con trabajos simples y buen margen;
      // luego desbloquea trabajos profundos con mayor cobro, coste y riesgo.
      var progreso = Math.min(1, casos / 80);
      var habilidad = rand(0.68, 0.86) + bonusDx * 0.15;
      var dificultad = rand(0.16, 0.48) + progreso * 0.28;
      var pago = Math.round(rand(1050, 2100) + progreso * rand(500, 1900));
      var piezas = Math.round(rand(170, 480) + progreso * rand(120, 430));
      var puedeNegociar = pago < piezas + 500;
      var negociado = puedeNegociar && Math.random() < Math.min(0.95, 0.68 + bonusNeg);
      if (negociado) { pago += Math.round(piezas * 0.24); negociaciones++; }
      if (caja >= 5000 && puntos > 0 && cfg.usarMejoras !== false) {
        if (!bonusDx) { bonusDx = 0.08; puntos--; gastoMejoras += 500; }
        else if (!bonusNeg) { bonusNeg = 0.08; puntos--; gastoMejoras += 500; }
        else if (!bonusEnergia) { bonusEnergia = 1; puntos--; gastoMejoras += 500; }
      }
      var probDx = Math.max(0.42, Math.min(0.98, 0.60 + habilidad * 0.32 - dificultad * 0.10 - estres / 650 + bonusDx));
      var dx = Math.random() < probDx;
      var probRep = Math.max(0.30, Math.min(0.98, 0.56 + habilidad * 0.48 - dificultad * 0.18 - estres / 520 + (negociado ? 0.05 : 0)));
      var resultado = dx ? (Math.random() < probRep ? "exito" : "parcial") : "fallo";
      var ingreso = resultado === "exito" ? Math.round(pago * 0.88) : resultado === "parcial" ? Math.round(pago * 0.54) : 0;
      var comida = (casos % 8 === 0) ? 180 : 0;
      caja += ingreso - piezas - comida;
      ingresosTotales += ingreso;
      gastoPiezas += piezas; gastoComida += comida;
      if (resultado === "exito") exitos++; else if (resultado === "parcial") parciales++; else fallos++;
      hambre += 1; sueno += 1; estres += resultado === "fallo" ? 4 : 1;
      if (hambre >= 70 || sueno >= 70) { necesidades++; hambre = Math.max(20, hambre - 35); sueno = Math.max(20, sueno - 25); }
      if (casos % 3 === 0) estres = Math.max(0, estres - 8 - bonusEnergia * 3);
      if (cfg.registrarDetalle) detalle.push({ caso: casos, resultado: resultado, negociado: negociado, ingreso: ingreso, piezas: piezas, caja: Math.round(caja) });
      if (caja < -50000) break;
    }
    var ingresos = ingresosTotales;
    var gastos = gastoPiezas + gastoComida + gastoMejoras;
    var beneficioNeto = ingresos - gastos;
    var reporte = { objetivo: meta, cajaInicial: Number(cfg.cajaInicial) || 2000, cajaFinal: Math.round(caja), alcanzado: caja >= meta, casos: casos, exitos: exitos, parciales: parciales, fallos: fallos, tasaExito: casos ? Number((exitos / casos).toFixed(4)) : 0, tasaParcial: casos ? Number((parciales / casos).toFixed(4)) : 0, tasaFallo: casos ? Number((fallos / casos).toFixed(4)) : 0, negociaciones: negociaciones, gastoPiezas: gastoPiezas, gastoComida: gastoComida, gastoMejoras: gastoMejoras, gastosTotales: gastos, ingresosEstimados: ingresos, beneficioNeto: beneficioNeto, margenNeto: ingresos ? Number((beneficioNeto / ingresos).toFixed(4)) : 0, beneficioPromedioCaso: casos ? Math.round(beneficioNeto / casos) : 0, necesidadesAtendidas: necesidades, mejoras: { diagnostico: bonusDx, negociacion: bonusNeg, energia: bonusEnergia }, detalle: detalle };
    console.table(reporte); return reporte;
  }
  window.simularBalanceTaller = simularBalanceTaller;
})();
