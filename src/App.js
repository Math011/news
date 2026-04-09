import { CONFIG } from './config.js';
import { Simulation } from './Simulation.js';
import { Renderer } from './Renderer.js';
import { UI } from './UI.js';

/**
 * App - Orchestrateur avec comparaison et conclusions
 */
export class App {
  constructor() {
    this.canvas = document.getElementById('canvas');
    
    this.simulation = new Simulation();
    this.renderer = new Renderer(this.canvas);
    this.ui = new UI();
    
    this.speed = 1;
    this.animationId = null;
    this.hasStarted = false;
    this.lastEventId = null;
    this.currentExperiment = 'freeplay';
    
    // Détection de stabilisation
    this.stabilizationCounter = 0;
    this.lastPercentReached = 0;
    this.hasShownResults = false;
    
    // Mode comparaison
    this.compareMode = false;
    this.simA = null;
    this.simB = null;
    this.rendererA = null;
    this.rendererB = null;
    
    this.init();
  }

  init() {
    this.ui.init({
      onViralityChange: (v) => this.simulation.setVirality(v),
      onTruthChange: (v) => { this.simulation.truth = v; },
      onPopulationChange: (v) => this.resetSimulation(v),
      onRangeChange: (v) => this.simulation.setRange(v),
      onReset: () => this.reset(),
      onPlayPause: () => this.togglePlayPause(),
      onSpeedChange: (s) => this.speed = s,
      onExperimentChange: (id) => this.loadExperiment(id),
      onRelaunch: () => this.relaunch(),
      onVariant: () => this.variant(),
      onStartCompare: () => this.startComparison(),
    });
    
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleHover(e));
    this.canvas.addEventListener('mouseleave', () => this.renderer.setHover(null));
    
    this.resetSimulation(70);
    this.loop();
  }

  loadExperiment(experimentId) {
    this.currentExperiment = experimentId;
    const experiment = CONFIG.EXPERIMENTS[experimentId];
    
    if (!experiment) return;
    
    // Mode comparaison ?
    if (experiment.params.isCompareMode) {
      this.ui.showCompare();
      return;
    }
    
    this.ui.updateExperimentUI(experimentId);
    this.simulation.startExperiment(experimentId, this.ui.getPopulation());
    
    this.hasStarted = false;
    this.hasShownResults = false;
    this.stabilizationCounter = 0;
    this.lastEventId = null;
    
    this.ui.showInstructions(true);
    this.ui.updatePlayButton(false);
    this.ui.updateStats(this.simulation.stats, 0);
    this.ui.hideEvent();
    
    const personalities = this.simulation.countPersonalities();
    this.ui.updatePersonalities(personalities);
  }

  resetSimulation(population) {
    if (this.currentExperiment !== 'freeplay') {
      this.loadExperiment(this.currentExperiment);
      return;
    }
    
    this.simulation.reset(population);
    this.hasStarted = false;
    this.hasShownResults = false;
    this.stabilizationCounter = 0;
    this.lastEventId = null;
    
    this.simulation.truth = this.ui.getTruth();
    
    this.ui.showInstructions(true);
    this.ui.updatePlayButton(false);
    this.ui.updateStats(this.simulation.stats, 0);
    this.ui.hideEvent();
    
    const personalities = this.simulation.countPersonalities();
    this.ui.updatePersonalities(personalities);
  }

  reset() {
    this.simulation.stop();
    this.resetSimulation(this.ui.getPopulation());
  }

  relaunch() {
    this.reset();
  }

  variant() {
    // Légère variation des paramètres
    const pop = this.ui.getPopulation();
    const variation = Math.floor(pop * 0.1);
    const newPop = pop + Math.floor(Math.random() * variation * 2) - variation;
    
    if (this.ui.elements.sliderPopulation) {
      this.ui.elements.sliderPopulation.value = newPop;
      this.ui.elements.valuePopulation.textContent = newPop;
    }
    
    // Légère variation de viralité
    const vir = parseFloat(this.ui.elements.sliderVirality?.value || 0.5);
    const newVir = Math.max(0.1, Math.min(1, vir + (Math.random() - 0.5) * 0.2));
    if (this.ui.elements.sliderVirality) {
      this.ui.elements.sliderVirality.value = newVir;
      this.ui.elements.valueVirality.textContent = Math.round(newVir * 100) + '%';
    }
    
    this.resetSimulation(newPop);
    this.simulation.setVirality(newVir);
  }

  togglePlayPause() {
    if (!this.hasStarted) return;
    this.simulation.toggle();
    this.ui.updatePlayButton(this.simulation.isRunning);
  }

  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
    
    const sourceAgent = this.simulation.placeInfoSource(x, y);
    
    if (sourceAgent) {
      this.hasStarted = true;
      this.hasShownResults = false;
      this.stabilizationCounter = 0;
      this.simulation.start();
      this.ui.showInstructions(false);
      this.ui.updatePlayButton(true);
      
      const experiment = CONFIG.EXPERIMENTS[this.currentExperiment];
      if (experiment?.params?.forceInfluencer && !sourceAgent.isInfluencer) {
        sourceAgent.personality = 'social';
        sourceAgent.socialness = 1.0;
        sourceAgent.credibility = 1.0;
        sourceAgent.isInfluencer = true;
      }
    }
  }

  handleHover(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
    
    const agent = this.renderer.getAgentAt(x, y, this.simulation.agents);
    this.renderer.setHover(agent);
    
    this.canvas.style.cursor = !this.hasStarted 
      ? (agent ? 'pointer' : 'crosshair')
      : (agent ? 'help' : 'default');
  }

  checkStabilization() {
    const current = this.simulation.stats.percentReached;
    
    // Si le pourcentage n'a pas bougé
    if (Math.abs(current - this.lastPercentReached) < 1) {
      this.stabilizationCounter++;
    } else {
      this.stabilizationCounter = 0;
    }
    
    this.lastPercentReached = current;
    
    // 5 secondes de stabilisation = afficher résultats
    if (this.stabilizationCounter > 300 && !this.hasShownResults && this.hasStarted) {
      this.showResults();
    }
  }

  showResults() {
    this.hasShownResults = true;
    this.simulation.stop();
    this.ui.updatePlayButton(false);
    
    const conclusion = this.simulation.generateConclusion();
    this.ui.showResults(
      this.simulation.stats,
      this.simulation.experimentResults,
      conclusion,
      this.simulation.fullHistory
    );
  }

  // === MODE COMPARAISON ===
  
  startComparison() {
    this.ui.hideCompare();
    this.compareMode = true;
    
    const truths = this.ui.getCompareTruth();
    const population = 50;
    
    // Créer deux simulations
    this.simA = new Simulation();
    this.simB = new Simulation();
    
    this.simA.truth = truths.a;
    this.simB.truth = truths.b;
    
    this.simA.init(population);
    this.simB.init(population);
    
    // Renderers pour les canvas de comparaison
    const canvasA = document.getElementById('canvas-a');
    const canvasB = document.getElementById('canvas-b');
    
    if (canvasA && canvasB) {
      this.rendererA = new Renderer(canvasA);
      this.rendererB = new Renderer(canvasB);
      
      // Démarrer au centre de chaque simulation
      const centerX = canvasA.width / 2;
      const centerY = canvasA.height / 2;
      
      this.simA.placeInfoSource(centerX, centerY);
      this.simB.placeInfoSource(centerX, centerY);
      
      this.simA.start();
      this.simB.start();
      
      this.ui.showCompare();
      
      // Lancer la boucle de comparaison
      this.compareLoop();
    }
  }

  compareLoop() {
    if (!this.compareMode) return;
    
    // Mise à jour des deux simulations
    for (let i = 0; i < this.speed; i++) {
      this.simA.update();
      this.simB.update();
    }
    
    // Rendu
    if (this.rendererA && this.rendererB) {
      this.rendererA.render(this.simA);
      this.rendererB.render(this.simB);
    }
    
    // Stats
    this.ui.updateCompareStats('a', this.simA.stats);
    this.ui.updateCompareStats('b', this.simB.stats);
    
    // Vérifier si les deux sont stabilisées
    const stableA = this.simA.stats.spreading === 0 && this.simA.stats.informed === 0;
    const stableB = this.simB.stats.spreading === 0 && this.simB.stats.informed === 0;
    
    if (stableA && stableB && this.simA.time > 300) {
      this.finishComparison();
      return;
    }
    
    requestAnimationFrame(() => this.compareLoop());
  }

  finishComparison() {
    this.simA.stop();
    this.simB.stop();
    
    const statsA = this.simA.stats;
    const statsB = this.simB.stats;
    
    let conclusion = '';
    
    if (statsA.percentReached > statsB.percentReached + 10) {
      conclusion = `L'info vraie (A: ${statsA.percentReached}%) s'est mieux propagée que la fake news (B: ${statsB.percentReached}%).`;
    } else if (statsB.percentReached > statsA.percentReached + 10) {
      conclusion = `La fake news (B: ${statsB.percentReached}%) s'est mieux propagée que l'info vraie (A: ${statsA.percentReached}%). Les sceptiques n'ont pas suffi à la bloquer.`;
    } else {
      conclusion = `Les deux infos ont eu une propagation similaire (A: ${statsA.percentReached}%, B: ${statsB.percentReached}%). La vérité n'est pas un facteur déterminant ici.`;
    }
    
    if (statsB.infoDistortion > statsA.infoDistortion + 15) {
      conclusion += ` La fake news s'est plus déformée en circulant.`;
    }
    
    this.ui.showCompareConclusion(conclusion);
    this.compareMode = false;
  }

  loop() {
    if (!this.compareMode) {
      // Mise à jour normale
      for (let i = 0; i < this.speed; i++) {
        this.simulation.update();
        
        // Événements
        if (this.simulation.activeEvent && this.simulation.activeEvent.id !== this.lastEventId) {
          this.lastEventId = this.simulation.activeEvent.id;
          this.ui.showEvent(this.simulation.activeEvent, CONFIG.EVENT_DURATION);
          this.renderer.triggerEventFlash(this.simulation.activeEvent.type);
        }
        
        if (!this.simulation.activeEvent && this.lastEventId) {
          this.lastEventId = null;
          this.ui.hideEvent();
        }
      }
      
      // Rendu
      this.renderer.render(this.simulation);
      
      // UI
      this.ui.updateStats(this.simulation.stats, this.simulation.time);
      this.ui.updateMiniChart(this.simulation.fullHistory);
      
      // Vérifier stabilisation
      if (this.hasStarted && this.simulation.isRunning) {
        this.checkStabilization();
      }
    }
    
    this.animationId = requestAnimationFrame(() => this.loop());
  }
}