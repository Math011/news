import { CONFIG } from './config.js';

/**
 * UI - Interface utilisateur avec mode expériences
 */
export class UI {
  constructor() {
    this.elements = {
      // Stats principales
      statIgnorant: document.getElementById('stat-ignorant'),
      statInformed: document.getElementById('stat-informed'),
      statSpreading: document.getElementById('stat-spreading'),
      statSaturated: document.getElementById('stat-saturated'),
      statPercent: document.getElementById('stat-percent'),
      statRate: document.getElementById('stat-rate'),
      statTime: document.getElementById('stat-time'),
      
      // Indicateurs scientifiques
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
      
      // Barres de progression
      barIgnorant: document.getElementById('bar-ignorant'),
      barInformed: document.getElementById('bar-informed'),
      barSpreading: document.getElementById('bar-spreading'),
      barSaturated: document.getElementById('bar-saturated'),
      
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
      btnReset: document.getElementById('btn-reset'),
      btnPlayPause: document.getElementById('btn-play-pause'),
      btnSpeed: document.getElementById('btn-speed'),
      btnCloseResults: document.getElementById('btn-close-results'),
      
      // Expérience
      experimentSelect: document.getElementById('experiment-select'),
      experimentDesc: document.getElementById('experiment-desc'),
      experimentBadge: document.getElementById('experiment-badge'),
      experimentName: document.getElementById('experiment-name'),
      
      // Instructions et question
      instructions: document.getElementById('instructions'),
      scienceQuestion: document.getElementById('science-question'),
      questionText: document.getElementById('question-text'),
      
      // Événement
      eventBanner: document.getElementById('event-banner'),
      eventName: document.getElementById('event-name'),
      eventDesc: document.getElementById('event-desc'),
      eventTimer: document.getElementById('event-timer'),
      
      // Légende personnalités
      legendReceptive: document.getElementById('legend-receptive'),
      legendSkeptic: document.getElementById('legend-skeptic'),
      legendSocial: document.getElementById('legend-social'),
      legendIntrovert: document.getElementById('legend-introvert'),
      
      // Résultats
      resultsPanel: document.getElementById('results-panel'),
      resultsGrid: document.getElementById('results-grid'),
    };
    
    this.callbacks = {};
    this.speed = 1;
  }

  /**
   * Initialiser les événements
   */
  init(callbacks) {
    this.callbacks = callbacks;
    
    // Sélecteur d'expérience
    this.elements.experimentSelect?.addEventListener('change', (e) => {
      const experimentId = e.target.value;
      callbacks.onExperimentChange?.(experimentId);
      this.updateExperimentUI(experimentId);
    });
    
    // Sliders
    this.elements.sliderVirality?.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      this.elements.valueVirality.textContent = Math.round(value * 100) + '%';
      callbacks.onViralityChange?.(value);
    });
    
    this.elements.sliderTruth?.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      this.elements.valueTruth.textContent = Math.round(value * 100) + '%';
      callbacks.onTruthChange?.(value);
    });
    
    this.elements.sliderPopulation?.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      this.elements.valuePopulation.textContent = value;
      callbacks.onPopulationChange?.(value);
    });
    
    this.elements.sliderRange?.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      this.elements.valueRange.textContent = value + 'px';
      callbacks.onRangeChange?.(value);
    });
    
    // Boutons
    this.elements.btnReset?.addEventListener('click', () => {
      callbacks.onReset?.();
    });
    
    this.elements.btnPlayPause?.addEventListener('click', () => {
      callbacks.onPlayPause?.();
    });
    
    this.elements.btnSpeed?.addEventListener('click', () => {
      this.cycleSpeed();
      callbacks.onSpeedChange?.(this.speed);
    });
    
    this.elements.btnCloseResults?.addEventListener('click', () => {
      this.hideResults();
    });
    
    // Raccourci clavier Espace
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        callbacks.onPlayPause?.();
      }
    });
    
    // Valeurs initiales
    this.setInitialValues();
  }

  /**
   * Valeurs initiales des contrôles
   */
  setInitialValues() {
    if (this.elements.valueVirality) {
      this.elements.valueVirality.textContent = Math.round(CONFIG.DEFAULT_VIRALITY * 100) + '%';
    }
    if (this.elements.valueTruth) {
      this.elements.valueTruth.textContent = Math.round(CONFIG.DEFAULT_TRUTH * 100) + '%';
    }
    if (this.elements.valuePopulation) {
      this.elements.valuePopulation.textContent = CONFIG.DEFAULT_POPULATION;
    }
    if (this.elements.valueRange) {
      this.elements.valueRange.textContent = CONFIG.DEFAULT_RANGE + 'px';
    }
  }

  /**
   * Mettre à jour l'UI pour une expérience
   */
  updateExperimentUI(experimentId) {
    const experiment = CONFIG.EXPERIMENTS[experimentId];
    if (!experiment) return;
    
    // Description
    if (this.elements.experimentDesc) {
      this.elements.experimentDesc.textContent = experiment.description;
    }
    
    // Badge
    if (experimentId !== 'freeplay') {
      this.elements.experimentBadge?.classList.remove('hidden');
      if (this.elements.experimentName) {
        this.elements.experimentName.textContent = experiment.name;
      }
    } else {
      this.elements.experimentBadge?.classList.add('hidden');
    }
    
    // Question scientifique
    if (experiment.question) {
      this.elements.scienceQuestion?.classList.remove('hidden');
      if (this.elements.questionText) {
        this.elements.questionText.textContent = experiment.question;
      }
    } else {
      this.elements.scienceQuestion?.classList.add('hidden');
    }
    
    // Mettre à jour les sliders selon les paramètres
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

  /**
   * Mettre à jour les statistiques
   */
  updateStats(stats, time) {
    const total = stats.ignorant + stats.informed + stats.spreading + stats.saturated + stats.forgotten;
    
    // Nombres
    if (this.elements.statIgnorant) this.elements.statIgnorant.textContent = stats.ignorant;
    if (this.elements.statInformed) this.elements.statInformed.textContent = stats.informed;
    if (this.elements.statSpreading) this.elements.statSpreading.textContent = stats.spreading;
    if (this.elements.statSaturated) this.elements.statSaturated.textContent = (stats.saturated + (stats.forgotten || 0));
    if (this.elements.statPercent) this.elements.statPercent.textContent = stats.percentReached + '%';
    if (this.elements.statRate) this.elements.statRate.textContent = stats.spreadRate + '/s';
    if (this.elements.statTime) this.elements.statTime.textContent = this.formatTime(time);
    
    // Indicateurs scientifiques
    if (this.elements.statHeat) this.elements.statHeat.textContent = stats.infoHeat + '%';
    if (this.elements.heatFill) this.elements.heatFill.style.width = stats.infoHeat + '%';
    
    if (this.elements.statTruth) this.elements.statTruth.textContent = stats.infoTruth + '%';
    if (this.elements.truthFill) this.elements.truthFill.style.width = stats.infoTruth + '%';
    
    if (this.elements.statDistortion) this.elements.statDistortion.textContent = stats.infoDistortion + '%';
    if (this.elements.distortionFill) this.elements.distortionFill.style.width = Math.min(stats.infoDistortion, 100) + '%';
    
    if (this.elements.statConviction) this.elements.statConviction.textContent = stats.avgConviction + '%';
    if (this.elements.convictionFill) this.elements.convictionFill.style.width = stats.avgConviction + '%';
    
    // Pénétration par groupe
    if (stats.groupPenetration) {
      if (this.elements.groupA) this.elements.groupA.textContent = 'A: ' + stats.groupPenetration[0] + '%';
      if (this.elements.groupB) this.elements.groupB.textContent = 'B: ' + stats.groupPenetration[1] + '%';
      if (this.elements.groupC) this.elements.groupC.textContent = 'C: ' + stats.groupPenetration[2] + '%';
    }
    
    // Barres de progression
    if (total > 0) {
      if (this.elements.barIgnorant) this.elements.barIgnorant.style.width = (stats.ignorant / total * 100) + '%';
      if (this.elements.barInformed) this.elements.barInformed.style.width = (stats.informed / total * 100) + '%';
      if (this.elements.barSpreading) this.elements.barSpreading.style.width = (stats.spreading / total * 100) + '%';
      if (this.elements.barSaturated) this.elements.barSaturated.style.width = ((stats.saturated + (stats.forgotten || 0)) / total * 100) + '%';
    }
  }

  /**
   * Mettre à jour la légende des personnalités
   */
  updatePersonalityCounts(counts) {
    if (this.elements.legendReceptive) {
      this.elements.legendReceptive.querySelector('.count').textContent = counts.receptive;
    }
    if (this.elements.legendSkeptic) {
      this.elements.legendSkeptic.querySelector('.count').textContent = counts.skeptic;
    }
    if (this.elements.legendSocial) {
      this.elements.legendSocial.querySelector('.count').textContent = counts.social;
    }
    if (this.elements.legendIntrovert) {
      this.elements.legendIntrovert.querySelector('.count').textContent = counts.introvert;
    }
  }

  /**
   * Afficher un événement
   */
  showEvent(event, duration) {
    if (!this.elements.eventBanner) return;
    
    this.elements.eventName.textContent = event.name;
    this.elements.eventDesc.textContent = event.description;
    
    this.elements.eventBanner.className = 'event-banner ' + event.type;
    this.elements.eventBanner.classList.remove('hidden');
    
    this.elements.eventTimer.style.transition = 'none';
    this.elements.eventTimer.style.width = '100%';
    
    setTimeout(() => {
      this.elements.eventTimer.style.transition = `width ${duration / 60}s linear`;
      this.elements.eventTimer.style.width = '0%';
    }, 50);
  }

  /**
   * Cacher l'événement
   */
  hideEvent() {
    if (this.elements.eventBanner) {
      this.elements.eventBanner.classList.add('hidden');
    }
  }

  /**
   * Afficher les résultats d'expérience
   */
  showResults(experimentResults, stats, experiment) {
    if (!this.elements.resultsPanel || !this.elements.resultsGrid) return;
    
    const results = [];
    
    // Statistiques principales
    results.push({
      label: '% Population touchée',
      value: stats.percentReached + '%',
      good: stats.percentReached >= 50,
    });
    
    results.push({
      label: 'Pic de propagation',
      value: this.formatTime(experimentResults.peakReachedTime || 0),
      good: true,
    });
    
    if (experimentResults.timeTo50Percent) {
      results.push({
        label: 'Temps pour 50%',
        value: this.formatTime(experimentResults.timeTo50Percent),
        good: true,
      });
    }
    
    results.push({
      label: 'Déformation moyenne',
      value: stats.infoDistortion + '%',
      good: stats.infoDistortion < 30,
    });
    
    // Pénétration par groupe
    if (stats.groupPenetration) {
      results.push({
        label: 'Groupe A',
        value: stats.groupPenetration[0] + '%',
        good: stats.groupPenetration[0] >= 50,
      });
      results.push({
        label: 'Groupe B',
        value: stats.groupPenetration[1] + '%',
        good: stats.groupPenetration[1] >= 50,
      });
    }
    
    // Générer le HTML
    this.elements.resultsGrid.innerHTML = results.map(r => `
      <div class="result-item">
        <div class="result-label">${r.label}</div>
        <div class="result-value ${r.good ? 'good' : 'bad'}">${r.value}</div>
      </div>
    `).join('');
    
    this.elements.resultsPanel.classList.remove('hidden');
  }

  /**
   * Cacher les résultats
   */
  hideResults() {
    if (this.elements.resultsPanel) {
      this.elements.resultsPanel.classList.add('hidden');
    }
  }

  /**
   * Formater le temps en MM:SS
   */
  formatTime(frames) {
    const seconds = Math.floor(frames / 60);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Mettre à jour le bouton Play/Pause
   */
  updatePlayButton(isRunning) {
    if (this.elements.btnPlayPause) {
      this.elements.btnPlayPause.textContent = isRunning ? '⏸️ Pause' : '▶️ Lancer';
      this.elements.btnPlayPause.classList.toggle('running', isRunning);
    }
  }

  /**
   * Cycler la vitesse
   */
  cycleSpeed() {
    this.speed = this.speed === 1 ? 2 : this.speed === 2 ? 4 : 1;
    if (this.elements.btnSpeed) {
      this.elements.btnSpeed.textContent = this.speed + 'x';
    }
  }

  /**
   * Afficher/cacher les instructions
   */
  showInstructions(show) {
    if (this.elements.instructions) {
      this.elements.instructions.classList.toggle('hidden', !show);
    }
  }

  /**
   * Obtenir la valeur de population
   */
  getPopulation() {
    return this.elements.sliderPopulation ? parseInt(this.elements.sliderPopulation.value) : CONFIG.DEFAULT_POPULATION;
  }

  /**
   * Obtenir la valeur de vérité
   */
  getTruth() {
    return this.elements.sliderTruth ? parseFloat(this.elements.sliderTruth.value) : CONFIG.DEFAULT_TRUTH;
  }
}