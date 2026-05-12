import { CONFIG } from './config.js';

/**
 * UI - Interface avec graphiques et conclusions
 */
export class UI {
  constructor() {
    this.elements = this.getElements();
    this.callbacks = {};
    this.speed = 1;
    this.chartCtx = null;
    this.resultsChartCtx = null;
  }

  getElements() {
    return {
      // Stats
      statTime: document.getElementById('stat-time'),
      statIgnorant: document.getElementById('stat-ignorant'),
      statInformed: document.getElementById('stat-informed'),
      statSpreading: document.getElementById('stat-spreading'),
      statSaturated: document.getElementById('stat-saturated'),
      statRate: document.getElementById('stat-rate'),
      quickPercent: document.getElementById('quick-percent'),
      
      // Barres
      barIgnorant: document.getElementById('bar-ignorant'),
      barInformed: document.getElementById('bar-informed'),
      barSpreading: document.getElementById('bar-spreading'),
      barSaturated: document.getElementById('bar-saturated'),
      
      // Indicateurs
      statHeat: document.getElementById('stat-heat'),
      statTruth: document.getElementById('stat-truth'),
      statDistortion: document.getElementById('stat-distortion'),
      statConviction: document.getElementById('stat-conviction'),
      heatFill: document.getElementById('heat-fill'),
      truthFill: document.getElementById('truth-fill'),
      distortionFill: document.getElementById('distortion-fill'),
      convictionFill: document.getElementById('conviction-fill'),
      
      // Groupes
      groupA: document.getElementById('group-a'),
      groupB: document.getElementById('group-b'),
      groupC: document.getElementById('group-c'),
      
      // Personnalités
      countReceptive: document.getElementById('count-receptive'),
      countSkeptic: document.getElementById('count-skeptic'),
      countSocial: document.getElementById('count-social'),
      countIntrovert: document.getElementById('count-introvert'),
      
      // Contrôles
      sliderVirality: document.getElementById('slider-virality'),
      sliderTruth: document.getElementById('slider-truth'),
      sliderPopulation: document.getElementById('slider-population'),
      sliderRange: document.getElementById('slider-range'),
      valueVirality: document.getElementById('value-virality'),
      valueTruth: document.getElementById('value-truth'),
      valuePopulation: document.getElementById('value-population'),
      valueRange: document.getElementById('value-range'),
      
      // Boutons
      btnPlayPause: document.getElementById('btn-play-pause'),
      btnSpeed: document.getElementById('btn-speed'),
      btnReset: document.getElementById('btn-reset'),
      btnRelaunch: document.getElementById('btn-relaunch'),
      btnVariant: document.getElementById('btn-variant'),
      
      // Expérience
      experimentSelect: document.getElementById('experiment-select'),
      experimentBadge: document.getElementById('experiment-badge'),
      experimentName: document.getElementById('experiment-name'),
      
      // Canvas & instructions
      instructions: document.getElementById('instructions'),
      scienceQuestion: document.getElementById('science-question'),
      questionText: document.getElementById('question-text'),
      eventBanner: document.getElementById('event-banner'),
      eventIcon: document.getElementById('event-icon'),
      eventName: document.getElementById('event-name'),
      eventDesc: document.getElementById('event-desc'),
      eventTimer: document.getElementById('event-timer'),
      
      // Mini chart
      chartCanvas: document.getElementById('chart-canvas'),
      
      // Modal résultats
      resultsModal: document.getElementById('results-modal'),
      resultsStats: document.getElementById('results-stats'),
      resultsConclusion: document.getElementById('results-conclusion'),
      resultsChartCanvas: document.getElementById('results-chart-canvas'),
      btnCloseResults: document.getElementById('btn-close-results'),
      btnRelaunchModal: document.getElementById('btn-relaunch-modal'),
      btnVariantModal: document.getElementById('btn-variant-modal'),
      btnCloseModal: document.getElementById('btn-close-modal'),
      
      // Modal comparaison
      compareModal: document.getElementById('compare-modal'),
      compareTruthA: document.getElementById('compare-truth-a'),
      compareTruthB: document.getElementById('compare-truth-b'),
      compareTruthAVal: document.getElementById('compare-truth-a-val'),
      compareTruthBVal: document.getElementById('compare-truth-b-val'),
      compareStatsA: document.getElementById('compare-stats-a'),
      compareStatsB: document.getElementById('compare-stats-b'),
      compareConclusion: document.getElementById('compare-conclusion'),
      btnStartCompare: document.getElementById('btn-start-compare'),
      btnCloseCompare: document.getElementById('btn-close-compare'),
      btnCloseCompareFooter: document.getElementById('btn-close-compare-footer'),
    };
  }

  init(callbacks) {
    this.callbacks = callbacks;
    
    // Chart context
    if (this.elements.chartCanvas) {
      this.chartCtx = this.elements.chartCanvas.getContext('2d');
    }
    if (this.elements.resultsChartCanvas) {
      this.resultsChartCtx = this.elements.resultsChartCanvas.getContext('2d');
    }
    
    // Sliders
    this.elements.sliderVirality?.addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      this.elements.valueVirality.textContent = Math.round(v * 100) + '%';
      callbacks.onViralityChange?.(v);
    });
    
    this.elements.sliderTruth?.addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      this.elements.valueTruth.textContent = Math.round(v * 100) + '%';
      callbacks.onTruthChange?.(v);
    });
    
    this.elements.sliderPopulation?.addEventListener('input', (e) => {
      const v = parseInt(e.target.value);
      this.elements.valuePopulation.textContent = v;
      callbacks.onPopulationChange?.(v);
    });
    
    this.elements.sliderRange?.addEventListener('input', (e) => {
      const v = parseInt(e.target.value);
      this.elements.valueRange.textContent = v;
      callbacks.onRangeChange?.(v);
    });
    
    // Boutons header
    this.elements.btnPlayPause?.addEventListener('click', () => callbacks.onPlayPause?.());
    this.elements.btnSpeed?.addEventListener('click', () => {
      this.cycleSpeed();
      callbacks.onSpeedChange?.(this.speed);
    });
    this.elements.btnReset?.addEventListener('click', () => callbacks.onReset?.());
    
    // Boutons actions
    this.elements.btnRelaunch?.addEventListener('click', () => callbacks.onRelaunch?.());
    this.elements.btnVariant?.addEventListener('click', () => callbacks.onVariant?.());
    
    // Expérience
    this.elements.experimentSelect?.addEventListener('change', (e) => {
      callbacks.onExperimentChange?.(e.target.value);
    });
    
    // Modal résultats
    this.elements.btnCloseResults?.addEventListener('click', () => this.hideResults());
    this.elements.btnCloseModal?.addEventListener('click', () => this.hideResults());
    this.elements.btnRelaunchModal?.addEventListener('click', () => {
      this.hideResults();
      callbacks.onRelaunch?.();
    });
    this.elements.btnVariantModal?.addEventListener('click', () => {
      this.hideResults();
      callbacks.onVariant?.();
    });
    
    // Modal comparaison
    this.elements.btnCloseCompare?.addEventListener('click', () => this.hideCompare());
    this.elements.btnCloseCompareFooter?.addEventListener('click', () => this.hideCompare());
    this.elements.btnStartCompare?.addEventListener('click', () => callbacks.onStartCompare?.());
    
    this.elements.compareTruthA?.addEventListener('input', (e) => {
      this.elements.compareTruthAVal.textContent = Math.round(e.target.value * 100) + '%';
    });
    this.elements.compareTruthB?.addEventListener('input', (e) => {
      this.elements.compareTruthBVal.textContent = Math.round(e.target.value * 100) + '%';
    });
    
    // Raccourci clavier
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        callbacks.onPlayPause?.();
      }
    });
    
    this.setInitialValues();
  }

  setInitialValues() {
    if (this.elements.valueVirality) this.elements.valueVirality.textContent = Math.round(CONFIG.DEFAULT_VIRALITY * 100) + '%';
    if (this.elements.valueTruth) this.elements.valueTruth.textContent = Math.round(CONFIG.DEFAULT_TRUTH * 100) + '%';
    if (this.elements.valuePopulation) this.elements.valuePopulation.textContent = '70';
    if (this.elements.valueRange) this.elements.valueRange.textContent = '60';
  }

  updateStats(stats, time) {
    const total = stats.ignorant + stats.informed + stats.spreading + (stats.saturated || 0) + (stats.forgotten || 0);
    
    // Stats
    if (this.elements.statTime) this.elements.statTime.textContent = this.formatTime(time);
    if (this.elements.statIgnorant) this.elements.statIgnorant.textContent = stats.ignorant;
    if (this.elements.statInformed) this.elements.statInformed.textContent = stats.informed;
    if (this.elements.statSpreading) this.elements.statSpreading.textContent = stats.spreading;
    if (this.elements.statSaturated) this.elements.statSaturated.textContent = (stats.saturated || 0) + (stats.forgotten || 0);
    if (this.elements.statRate) this.elements.statRate.textContent = stats.spreadRate;
    if (this.elements.quickPercent) this.elements.quickPercent.textContent = stats.percentReached + '%';
    
    // Indicateurs
    if (this.elements.statHeat) this.elements.statHeat.textContent = stats.infoHeat + '%';
    if (this.elements.heatFill) this.elements.heatFill.style.width = stats.infoHeat + '%';
    if (this.elements.statTruth) this.elements.statTruth.textContent = stats.infoTruth + '%';
    if (this.elements.truthFill) this.elements.truthFill.style.width = stats.infoTruth + '%';
    if (this.elements.statDistortion) this.elements.statDistortion.textContent = stats.infoDistortion + '%';
    if (this.elements.distortionFill) this.elements.distortionFill.style.width = Math.min(stats.infoDistortion, 100) + '%';
    if (this.elements.statConviction) this.elements.statConviction.textContent = stats.avgConviction + '%';
    if (this.elements.convictionFill) this.elements.convictionFill.style.width = stats.avgConviction + '%';
    
    // Groupes
    if (stats.groupPenetration) {
      if (this.elements.groupA) this.elements.groupA.textContent = 'A: ' + stats.groupPenetration[0] + '%';
      if (this.elements.groupB) this.elements.groupB.textContent = 'B: ' + stats.groupPenetration[1] + '%';
      if (this.elements.groupC) this.elements.groupC.textContent = 'C: ' + stats.groupPenetration[2] + '%';
    }
    
    // Barres
    if (total > 0) {
      const saturatedTotal = (stats.saturated || 0) + (stats.forgotten || 0);
      if (this.elements.barIgnorant) this.elements.barIgnorant.style.width = (stats.ignorant / total * 100) + '%';
      if (this.elements.barInformed) this.elements.barInformed.style.width = (stats.informed / total * 100) + '%';
      if (this.elements.barSpreading) this.elements.barSpreading.style.width = (stats.spreading / total * 100) + '%';
      if (this.elements.barSaturated) this.elements.barSaturated.style.width = (saturatedTotal / total * 100) + '%';
    }
  }

  updatePersonalities(counts) {
    if (this.elements.countReceptive) this.elements.countReceptive.textContent = counts.receptive;
    if (this.elements.countSkeptic) this.elements.countSkeptic.textContent = counts.skeptic;
    if (this.elements.countSocial) this.elements.countSocial.textContent = counts.social;
    if (this.elements.countIntrovert) this.elements.countIntrovert.textContent = counts.introvert;
  }

  updateMiniChart(history) {
    if (!this.chartCtx || !history.length) return;
    
    const ctx = this.chartCtx;
    const canvas = this.elements.chartCanvas;
    const w = canvas.width;
    const h = canvas.height;
    
    ctx.clearRect(0, 0, w, h);
    
    // Dessiner la courbe
    const maxPoints = 100;
    const data = history.slice(-maxPoints);
    if (data.length < 2) return;
    
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    data.forEach((point, i) => {
      const x = (i / (maxPoints - 1)) * w;
      const y = h - (point.percentReached / 100) * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    
    ctx.stroke();
    
    // Remplissage sous la courbe
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = 'rgba(245, 158, 11, 0.1)';
    ctx.fill();
  }

  showEvent(event, duration) {
    if (!this.elements.eventBanner) return;
    
    this.elements.eventIcon.textContent = event.name.split(' ')[0];
    this.elements.eventName.textContent = event.name;
    this.elements.eventDesc.textContent = event.description;
    
    this.elements.eventBanner.className = 'event-banner ' + event.type;
    
    this.elements.eventTimer.style.transition = 'none';
    this.elements.eventTimer.style.width = '100%';
    setTimeout(() => {
      this.elements.eventTimer.style.transition = `width ${duration / 60}s linear`;
      this.elements.eventTimer.style.width = '0%';
    }, 50);
  }

  hideEvent() {
    if (this.elements.eventBanner) {
      this.elements.eventBanner.classList.add('hidden');
    }
  }

  showResults(stats, results, conclusion, history) {
    if (!this.elements.resultsModal) return;
    
    // Utiliser le pourcentage de la conclusion (basé sur le pic)
    const percentTouched = conclusion.percentTouched || stats.percentReached;
    
    // Stats principales
    const statsHtml = `
      <div class="result-stat ${percentTouched >= 50 ? 'good' : 'bad'}">
        <div class="value">${percentTouched}%</div>
        <div class="label">Population touchée</div>
      </div>
      <div class="result-stat">
        <div class="value">${this.formatTime(results.peakReachedTime || 0)}</div>
        <div class="label">Temps du pic</div>
      </div>
      <div class="result-stat ${stats.infoDistortion < 30 ? 'good' : 'bad'}">
        <div class="value">${stats.infoDistortion}%</div>
        <div class="label">Déformation</div>
      </div>
    `;
    this.elements.resultsStats.innerHTML = statsHtml;
    
    // Conclusion
    const conclusionHtml = `
      <div class="conclusion-title">💡 Conclusion</div>
      <div class="conclusion-text">${conclusion.summary}</div>
      ${conclusion.bullets.map(b => `<div class="conclusion-bullet">${b}</div>`).join('')}
    `;
    this.elements.resultsConclusion.innerHTML = conclusionHtml;
    
    // Graphique
    this.drawResultsChart(history);
    
    this.elements.resultsModal.classList.remove('hidden');
  }

  drawResultsChart(history) {
    if (!this.resultsChartCtx) return;
    
    const ctx = this.resultsChartCtx;
    const canvas = this.elements.resultsChartCanvas;
    const w = canvas.width;
    const h = canvas.height;
    
    ctx.clearRect(0, 0, w, h);
    
    if (!history.length) return;
    
    // Fond
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, 0, w, h);
    
    // Grille
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = (i / 4) * h;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    
    // Courbe
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    history.forEach((point, i) => {
      const x = (i / (history.length - 1)) * w;
      const y = h - (point.percentReached / 100) * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    // Labels
    ctx.fillStyle = '#888';
    ctx.font = '10px system-ui';
    ctx.fillText('100%', 5, 12);
    ctx.fillText('0%', 5, h - 4);
    ctx.fillText('Temps →', w - 45, h - 4);
  }

  hideResults() {
    if (this.elements.resultsModal) {
      this.elements.resultsModal.classList.add('hidden');
    }
  }

  showCompare() {
    if (this.elements.compareModal) {
      this.elements.compareModal.classList.remove('hidden');
    }
  }

  hideCompare() {
    if (this.elements.compareModal) {
      this.elements.compareModal.classList.add('hidden');
    }
  }

  updateCompareStats(side, stats) {
    const el = side === 'a' ? this.elements.compareStatsA : this.elements.compareStatsB;
    if (el) {
      el.innerHTML = `
        <strong>${stats.percentReached}%</strong> touchés<br>
        Déformation: ${stats.infoDistortion}%
      `;
    }
  }

  showCompareConclusion(conclusionText) {
    if (this.elements.compareConclusion) {
      this.elements.compareConclusion.innerHTML = `<strong>💡 Conclusion :</strong> ${conclusionText}`;
      this.elements.compareConclusion.classList.remove('hidden');
    }
  }

  getCompareTruth() {
    return {
      a: parseFloat(this.elements.compareTruthA?.value || 0.9),
      b: parseFloat(this.elements.compareTruthB?.value || 0.2),
    };
  }

  updateExperimentUI(experimentId) {
    const experiment = CONFIG.EXPERIMENTS[experimentId];
    if (!experiment) return;
    
    if (experimentId !== 'freeplay') {
      this.elements.experimentBadge?.classList.remove('hidden');
      if (this.elements.experimentName) this.elements.experimentName.textContent = experiment.name;
    } else {
      this.elements.experimentBadge?.classList.add('hidden');
    }
    
    if (experiment.question) {
      this.elements.scienceQuestion?.classList.remove('hidden');
      if (this.elements.questionText) this.elements.questionText.textContent = experiment.question;
    } else {
      this.elements.scienceQuestion?.classList.add('hidden');
    }
    
    // Mettre à jour les sliders
    if (experiment.params.virality !== undefined && this.elements.sliderVirality) {
      this.elements.sliderVirality.value = experiment.params.virality;
      this.elements.valueVirality.textContent = Math.round(experiment.params.virality * 100) + '%';
    }
    if (experiment.params.truth !== undefined && this.elements.sliderTruth) {
      this.elements.sliderTruth.value = experiment.params.truth;
      this.elements.valueTruth.textContent = Math.round(experiment.params.truth * 100) + '%';
    }
    if (experiment.params.population !== undefined && this.elements.sliderPopulation) {
      this.elements.sliderPopulation.value = experiment.params.population;
      this.elements.valuePopulation.textContent = experiment.params.population;
    }
  }

  updatePlayButton(isRunning) {
    if (this.elements.btnPlayPause) {
      this.elements.btnPlayPause.textContent = isRunning ? '⏸️' : '▶️';
      this.elements.btnPlayPause.classList.toggle('playing', isRunning);
    }
  }

  cycleSpeed() {
    this.speed = this.speed === 1 ? 2 : this.speed === 2 ? 4 : 1;
    if (this.elements.btnSpeed) this.elements.btnSpeed.textContent = this.speed + 'x';
  }

  showInstructions(show) {
    if (this.elements.instructions) {
      this.elements.instructions.classList.toggle('hidden', !show);
    }
  }

  formatTime(frames) {
    const seconds = Math.floor(frames / 60);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  getPopulation() {
    return this.elements.sliderPopulation ? parseInt(this.elements.sliderPopulation.value) : 70;
  }

  getTruth() {
    return this.elements.sliderTruth ? parseFloat(this.elements.sliderTruth.value) : 0.5;
  }
}