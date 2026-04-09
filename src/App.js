import { CONFIG } from './config.js';
import { Simulation } from './Simulation.js';
import { Renderer } from './Renderer.js';
import { UI } from './UI.js';

/**
 * App - Orchestrateur principal avec mode expériences
 */
export class App {
  constructor() {
    this.canvas = document.getElementById('canvas');
    
    // Systèmes
    this.simulation = new Simulation();
    this.renderer = new Renderer(this.canvas);
    this.ui = new UI();
    
    // État
    this.speed = 1;
    this.animationId = null;
    this.hasStarted = false;
    this.lastEventId = null;
    this.currentExperiment = 'freeplay';
    
    this.init();
  }

  /**
   * Initialisation
   */
  init() {
    // Initialiser l'UI
    this.ui.init({
      onViralityChange: (value) => this.simulation.setVirality(value),
      onTruthChange: (value) => {
        this.simulation.truth = value;
      },
      onPopulationChange: (value) => this.resetSimulation(value),
      onRangeChange: (value) => this.simulation.setRange(value),
      onReset: () => this.reset(),
      onPlayPause: () => this.togglePlayPause(),
      onSpeedChange: (speed) => this.speed = speed,
      onExperimentChange: (experimentId) => this.loadExperiment(experimentId),
    });
    
    // Événements canvas
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleHover(e));
    this.canvas.addEventListener('mouseleave', () => this.renderer.setHover(null));
    
    // Initialiser la simulation
    this.resetSimulation(CONFIG.DEFAULT_POPULATION);
    
    // Démarrer la boucle de rendu
    this.loop();
  }

  /**
   * Charger une expérience
   */
  loadExperiment(experimentId) {
    this.currentExperiment = experimentId;
    const experiment = CONFIG.EXPERIMENTS[experimentId];
    
    if (!experiment) return;
    
    // Réinitialiser avec les paramètres de l'expérience
    this.simulation.startExperiment(experimentId, this.ui.getPopulation());
    
    this.hasStarted = false;
    this.lastEventId = null;
    this.ui.showInstructions(true);
    this.ui.updatePlayButton(false);
    this.ui.updateStats(this.simulation.stats, 0);
    this.ui.hideEvent();
    this.ui.hideResults();
    
    // Mettre à jour les compteurs de personnalités
    const personalities = this.simulation.countPersonalities();
    this.ui.updatePersonalityCounts(personalities);
  }

  /**
   * Réinitialiser la simulation
   */
  resetSimulation(population) {
    if (this.currentExperiment !== 'freeplay') {
      this.loadExperiment(this.currentExperiment);
      return;
    }
    
    this.simulation.reset(population);
    this.hasStarted = false;
    this.lastEventId = null;
    this.ui.showInstructions(true);
    this.ui.updatePlayButton(false);
    this.ui.updateStats(this.simulation.stats, 0);
    this.ui.hideEvent();
    this.ui.hideResults();
    
    // Appliquer le slider de vérité
    this.simulation.truth = this.ui.getTruth();
    
    // Mettre à jour les compteurs de personnalités
    const personalities = this.simulation.countPersonalities();
    this.ui.updatePersonalityCounts(personalities);
  }

  /**
   * Reset complet
   */
  reset() {
    this.simulation.stop();
    this.resetSimulation(this.ui.getPopulation());
  }

  /**
   * Basculer Play/Pause
   */
  togglePlayPause() {
    if (!this.hasStarted) return;
    
    this.simulation.toggle();
    this.ui.updatePlayButton(this.simulation.isRunning);
  }

  /**
   * Clic sur le canvas
   */
  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
    
    // Placer une source d'information
    const sourceAgent = this.simulation.placeInfoSource(x, y);
    
    if (sourceAgent) {
      this.hasStarted = true;
      this.simulation.start();
      this.ui.showInstructions(false);
      this.ui.updatePlayButton(true);
      
      // Si l'expérience demande un influenceur, le rendre influenceur
      const experiment = CONFIG.EXPERIMENTS[this.currentExperiment];
      if (experiment?.params?.forceInfluencer && !sourceAgent.isInfluencer) {
        // L'agent source devient l'influenceur
        sourceAgent.personality = 'social';
        sourceAgent.socialness = 1.0;
        sourceAgent.credibility = 1.0;
        sourceAgent.isInfluencer = true;
      }
    }
  }

  /**
   * Survol du canvas
   */
  handleHover(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
    
    const agent = this.renderer.getAgentAt(x, y, this.simulation.agents);
    this.renderer.setHover(agent);
    
    // Changer le curseur
    if (!this.hasStarted) {
      this.canvas.style.cursor = agent ? 'pointer' : 'crosshair';
    } else {
      this.canvas.style.cursor = agent ? 'help' : 'default';
    }
  }

  /**
   * Boucle principale
   */
  loop() {
    // Mise à jour (selon la vitesse)
    for (let i = 0; i < this.speed; i++) {
      this.simulation.update();
      
      // Vérifier les nouveaux événements
      if (this.simulation.activeEvent && this.simulation.activeEvent.id !== this.lastEventId) {
        this.lastEventId = this.simulation.activeEvent.id;
        this.ui.showEvent(this.simulation.activeEvent, CONFIG.EVENT_DURATION);
        this.renderer.triggerEventFlash(this.simulation.activeEvent.type);
      }
      
      // Cacher l'événement s'il est terminé
      if (!this.simulation.activeEvent && this.lastEventId) {
        this.lastEventId = null;
        this.ui.hideEvent();
      }
    }
    
    // Rendu
    this.renderer.render(this.simulation);
    
    // UI
    this.ui.updateStats(this.simulation.stats, this.simulation.time);
    
    // Continuer la boucle
    this.animationId = requestAnimationFrame(() => this.loop());
  }
}