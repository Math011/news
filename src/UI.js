import { CONFIG } from './config.js';

/**
 * UI - Interface utilisateur enrichie
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
      statHeat: document.getElementById('stat-heat'),
      
      // Barres de progression
      barIgnorant: document.getElementById('bar-ignorant'),
      barInformed: document.getElementById('bar-informed'),
      barSpreading: document.getElementById('bar-spreading'),
      barSaturated: document.getElementById('bar-saturated'),
      
      // Contrôles
      sliderVirality: document.getElementById('slider-virality'),
      sliderPopulation: document.getElementById('slider-population'),
      sliderRange: document.getElementById('slider-range'),
      
      valueVirality: document.getElementById('value-virality'),
      valuePopulation: document.getElementById('value-population'),
      valueRange: document.getElementById('value-range'),
      
      // Boutons
      btnReset: document.getElementById('btn-reset'),
      btnPlayPause: document.getElementById('btn-play-pause'),
      btnSpeed: document.getElementById('btn-speed'),
      
      // Instructions
      instructions: document.getElementById('instructions'),
      
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
    };
    
    this.callbacks = {};
    this.speed = 1;
  }

  /**
   * Initialiser les événements
   */
  init(callbacks) {
    this.callbacks = callbacks;
    
    // Sliders
    this.elements.sliderVirality?.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      this.elements.valueVirality.textContent = Math.round(value * 100) + '%';
      callbacks.onViralityChange?.(value);
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
    
    // Raccourci clavier Espace
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        callbacks.onPlayPause?.();
      }
    });
    
    // Valeurs initiales
    if (this.elements.valueVirality) {
      this.elements.valueVirality.textContent = Math.round(CONFIG.DEFAULT_VIRALITY * 100) + '%';
    }
    if (this.elements.valuePopulation) {
      this.elements.valuePopulation.textContent = CONFIG.DEFAULT_POPULATION;
    }
    if (this.elements.valueRange) {
      this.elements.valueRange.textContent = CONFIG.DEFAULT_RANGE + 'px';
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
    if (this.elements.statSaturated) this.elements.statSaturated.textContent = (stats.saturated + stats.forgotten);
    if (this.elements.statPercent) this.elements.statPercent.textContent = stats.percentReached + '%';
    if (this.elements.statRate) this.elements.statRate.textContent = stats.spreadRate + '/s';
    if (this.elements.statTime) this.elements.statTime.textContent = this.formatTime(time);
    if (this.elements.statHeat) {
      this.elements.statHeat.textContent = stats.infoHeat + '%';
      this.elements.statHeat.className = 'heat-value ' + this.getHeatClass(stats.infoHeat);
    }
    
    // Barre de chaleur
    const heatFill = document.getElementById('heat-fill');
    if (heatFill) {
      heatFill.style.width = stats.infoHeat + '%';
    }
    
    // Barres de progression
    if (total > 0) {
      if (this.elements.barIgnorant) this.elements.barIgnorant.style.width = (stats.ignorant / total * 100) + '%';
      if (this.elements.barInformed) this.elements.barInformed.style.width = (stats.informed / total * 100) + '%';
      if (this.elements.barSpreading) this.elements.barSpreading.style.width = (stats.spreading / total * 100) + '%';
      if (this.elements.barSaturated) this.elements.barSaturated.style.width = ((stats.saturated + stats.forgotten) / total * 100) + '%';
    }
  }

  /**
   * Obtenir la classe CSS selon la chaleur
   */
  getHeatClass(heat) {
    if (heat >= 70) return 'hot';
    if (heat >= 40) return 'warm';
    if (heat >= 20) return 'cool';
    return 'cold';
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
    
    // Animation de la barre de temps
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
}