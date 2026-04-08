import { CONFIG } from './config.js';
import { Agent } from './Agent.js';

/**
 * Simulation - Logique de propagation avec tous les facteurs
 */
export class Simulation {
  constructor() {
    this.agents = [];
    this.isRunning = false;
    this.time = 0;
    
    // Paramètres ajustables
    this.virality = CONFIG.DEFAULT_VIRALITY;
    this.range = CONFIG.DEFAULT_RANGE;
    
    // Information active
    this.info = null;
    
    // Événement actif
    this.activeEvent = null;
    this.eventTimer = 0;
    this.eventCooldown = 0;
    
    // Stats
    this.stats = {
      ignorant: 0,
      informed: 0,
      spreading: 0,
      saturated: 0,
      forgotten: 0,
      totalReached: 0,
      peakReached: 0,
      spreadRate: 0,
      infoHeat: 0,
    };
    
    // Historique pour calculer la vitesse
    this.history = [];
    
    // Bounds du canvas
    this.bounds = {
      width: CONFIG.CANVAS_WIDTH,
      height: CONFIG.CANVAS_HEIGHT,
    };
  }

  /**
   * Initialiser la population
   */
  init(populationCount) {
    this.agents = [];
    this.time = 0;
    this.history = [];
    this.info = null;
    this.activeEvent = null;
    this.eventTimer = 0;
    this.eventCooldown = 0;
    
    // Créer les agents avec position dans leur zone de groupe
    for (let i = 0; i < populationCount; i++) {
      const group = Math.floor(Math.random() * CONFIG.GROUP_COUNT);
      const zone = this.getGroupZone(group);
      
      const x = zone.x + Math.random() * zone.width;
      const y = zone.y + Math.random() * zone.height;
      
      const agent = new Agent(i, x, y);
      agent.group = group; // Forcer le groupe selon la position
      this.agents.push(agent);
    }
    
    this.updateStats();
  }

  /**
   * Obtenir la zone d'un groupe
   */
  getGroupZone(group) {
    const margin = 30;
    const zoneWidth = (this.bounds.width - margin * 2) / CONFIG.GROUP_COUNT;
    
    return {
      x: margin + group * zoneWidth,
      y: margin,
      width: zoneWidth,
      height: this.bounds.height - margin * 2,
    };
  }

  /**
   * Placer une source d'information
   */
  placeInfoSource(x, y) {
    // Trouver l'agent le plus proche
    let closest = null;
    let minDist = Infinity;
    
    for (const agent of this.agents) {
      if (agent.state !== 'ignorant') continue;
      
      const dist = Math.sqrt((agent.x - x) ** 2 + (agent.y - y) ** 2);
      if (dist < minDist) {
        minDist = dist;
        closest = agent;
      }
    }
    
    if (closest && minDist < 50) {
      // Créer l'info
      this.info = {
        id: Date.now(),
        virality: this.virality,
        heat: CONFIG.INFO_INITIAL_HEAT,
        sourceId: closest.id,
        createdAt: this.time,
      };
      
      // L'agent devient source (diffuseur direct avec forte conviction)
      closest.info = { ...this.info };
      closest.state = 'spreading';
      closest.convictionLevel = 1.0;
      closest.exposures = CONFIG.EXPOSURES_TO_CONVINCED;
      closest.waveRadius = 0;
      
      // Augmenter sa crédibilité (c'est la source)
      closest.credibility = Math.min(1, closest.credibility + 0.3);
      
      this.updateStats();
      return true;
    }
    
    return false;
  }

  /**
   * Mise à jour de la simulation
   */
  update() {
    if (!this.isRunning) return;
    
    this.time++;
    
    // Mise à jour de la température de l'info
    if (this.info) {
      this.info.heat = Math.max(
        CONFIG.INFO_MIN_HEAT,
        this.info.heat - CONFIG.INFO_HEAT_DECAY
      );
    }
    
    // Mise à jour des événements
    this.updateEvents();
    
    // Mettre à jour chaque agent
    for (const agent of this.agents) {
      agent.update(this.bounds, this.time);
    }
    
    // Propager l'information
    this.propagate();
    
    // Mettre à jour les stats
    this.updateStats();
  }

  /**
   * Gestion des événements
   */
  updateEvents() {
    // Pas d'événements sans info
    if (!this.info) {
      this.activeEvent = null;
      return;
    }
    
    // Réduire le cooldown
    if (this.eventCooldown > 0) {
      this.eventCooldown--;
    }
    
    // Événement actif ?
    if (this.activeEvent) {
      this.eventTimer--;
      
      if (this.eventTimer <= 0) {
        this.activeEvent = null;
      }
    }
    
    // Tenter de déclencher un nouvel événement seulement si:
    // - Pas d'événement en cours
    // - Cooldown terminé
    // - Info existe
    // - Il y a au moins quelques agents informés
    const informedCount = this.agents.filter(a => 
      a.state === 'informed' || a.state === 'spreading'
    ).length;
    
    if (!this.activeEvent && this.eventCooldown <= 0 && informedCount >= 3) {
      if (Math.random() < CONFIG.EVENT_CHANCE) {
        this.triggerRandomEvent();
      }
    }
  }

  /**
   * Déclencher un événement aléatoire
   */
  triggerRandomEvent() {
    const eventKeys = Object.keys(CONFIG.EVENTS);
    const eventKey = eventKeys[Math.floor(Math.random() * eventKeys.length)];
    const event = CONFIG.EVENTS[eventKey];
    
    this.activeEvent = { 
      ...event,
      id: Date.now() + Math.random(), // ID unique
    };
    this.eventTimer = CONFIG.EVENT_DURATION;
    this.eventCooldown = CONFIG.EVENT_COOLDOWN;
    
    // Appliquer les effets immédiats
    this.applyEventEffect(event);
    
    return this.activeEvent;
  }

  /**
   * Appliquer l'effet d'un événement
   */
  applyEventEffect(event) {
    // Modifier la température de l'info
    if (this.info && event.heatBoost) {
      this.info.heat = Math.max(
        CONFIG.INFO_MIN_HEAT,
        Math.min(1, this.info.heat + event.heatBoost)
      );
    }
    
    // Effets spéciaux
    if (event.effect === 'superSpreader') {
      // Un agent random devient super-diffuseur
      const candidates = this.agents.filter(a => 
        a.state === 'informed' || a.state === 'spreading'
      );
      if (candidates.length > 0) {
        const chosen = candidates[Math.floor(Math.random() * candidates.length)];
        chosen.socialness = 1.0;
        chosen.credibility = 1.0;
        chosen.convictionLevel = 1.0;
        chosen.state = 'spreading';
        chosen.isInfluencer = true;
      }
    }
    
    if (event.effect === 'fatigueBoost') {
      // Accélérer la saturation de tout le monde
      for (const agent of this.agents) {
        if (agent.state === 'spreading' || agent.state === 'informed') {
          agent.timeInformed += 200;
        }
      }
    }
    
    if (event.effect === 'credibilityDrop') {
      // Réduire la conviction de ceux qui ne sont pas convaincus
      for (const agent of this.agents) {
        if (agent.state === 'informed' && agent.convictionLevel < 0.7) {
          agent.convictionLevel *= 0.5;
          if (agent.convictionLevel < 0.2) {
            agent.state = 'ignorant';
            agent.info = null;
          }
        }
      }
    }
  }

  /**
   * Obtenir le multiplicateur d'événement actuel
   */
  getEventMultiplier() {
    if (!this.activeEvent) return 1;
    return this.activeEvent.multiplier || 1;
  }

  /**
   * Logique de propagation probabiliste
   */
  propagate() {
    if (!this.info) return;
    
    const newExposures = [];
    const eventMultiplier = this.getEventMultiplier();
    
    // Pour chaque diffuseur
    for (const spreader of this.agents) {
      if (!spreader.canTransmit()) continue;
      
      const transmissionPower = spreader.getTransmissionPower();
      const transmissionReach = spreader.getTransmissionReach();
      const effectiveRange = this.range * transmissionReach;
      
      // Vérifier les agents proches
      for (const target of this.agents) {
        if (target.state !== 'ignorant' && target.state !== 'forgotten') continue;
        
        const dist = spreader.distanceTo(target);
        
        if (dist < effectiveRange) {
          // Calcul de probabilité complexe
          const probability = this.calculateTransmissionProbability(
            spreader, target, dist, effectiveRange, transmissionPower, eventMultiplier
          );
          
          if (Math.random() < probability) {
            newExposures.push({
              target,
              sourceCredibility: spreader.credibility,
            });
          }
        }
      }
    }
    
    // Appliquer les nouvelles expositions
    for (const { target, sourceCredibility } of newExposures) {
      target.expose(this.info, sourceCredibility, this.time);
    }
  }

  /**
   * Calcul de la probabilité de transmission
   */
  calculateTransmissionProbability(spreader, target, distance, effectiveRange, transmissionPower, eventMultiplier) {
    // Base plus élevée
    let probability = CONFIG.BASE_TRANSMISSION_CHANCE * 1.5;
    
    // Viralité de l'info
    probability *= (0.5 + this.virality);
    
    // Température de l'info (info froide = moins de transmission)
    probability *= (0.3 + this.info.heat * 0.7);
    
    // Distance (plus proche = beaucoup plus probable)
    const distanceFactor = Math.pow(1 - (distance / effectiveRange), 1.5);
    probability *= distanceFactor;
    
    // Réceptivité de la cible (TRÈS important)
    probability *= (0.2 + target.receptivity * 0.8);
    
    // Scepticisme de la cible (réduit beaucoup)
    probability *= (1 - target.skepticism * 0.8);
    
    // Puissance de transmission (inclut socialness, crédibilité, conviction)
    probability *= (0.3 + transmissionPower * 0.7);
    
    // Bonus même groupe
    if (spreader.isSameGroup(target)) {
      probability *= CONFIG.SAME_GROUP_BONUS;
    } else {
      probability *= CONFIG.DIFF_GROUP_PENALTY;
    }
    
    // Bonus si déjà exposé (répétition)
    if (target.exposures > 0) {
      probability *= (1 + target.exposures * 0.5);
    }
    
    // Événement actif
    probability *= eventMultiplier;
    
    return Math.min(probability, 0.95); // Cap à 95%
  }

  /**
   * Mettre à jour les statistiques
   */
  updateStats() {
    let ignorant = 0;
    let informed = 0;
    let spreading = 0;
    let saturated = 0;
    let forgotten = 0;
    
    for (const agent of this.agents) {
      switch (agent.state) {
        case 'ignorant': ignorant++; break;
        case 'informed': informed++; break;
        case 'spreading': spreading++; break;
        case 'saturated': saturated++; break;
        case 'forgotten': forgotten++; break;
      }
    }
    
    const totalReached = informed + spreading + saturated + forgotten;
    const currentlyActive = informed + spreading;
    
    // Calculer la vitesse de propagation
    this.history.push({ time: this.time, reached: totalReached });
    if (this.history.length > 60) {
      this.history.shift();
    }
    
    let spreadRate = 0;
    if (this.history.length >= 2) {
      const oldest = this.history[0];
      const newest = this.history[this.history.length - 1];
      const timeDiff = (newest.time - oldest.time) / 60;
      const reachedDiff = newest.reached - oldest.reached;
      spreadRate = timeDiff > 0 ? reachedDiff / timeDiff : 0;
    }
    
    this.stats = {
      ignorant,
      informed,
      spreading,
      saturated,
      forgotten,
      totalReached,
      currentlyActive,
      peakReached: Math.max(this.stats.peakReached || 0, totalReached),
      spreadRate: Math.max(0, spreadRate).toFixed(1),
      percentReached: this.agents.length > 0 
        ? Math.round((totalReached / this.agents.length) * 100) 
        : 0,
      infoHeat: this.info ? Math.round(this.info.heat * 100) : 0,
    };
  }

  /**
   * Démarrer/Arrêter
   */
  toggle() {
    this.isRunning = !this.isRunning;
  }

  start() {
    this.isRunning = true;
  }

  stop() {
    this.isRunning = false;
  }

  reset(populationCount) {
    this.isRunning = false;
    this.stats.peakReached = 0;
    this.init(populationCount);
  }

  setVirality(value) {
    this.virality = value;
  }

  setRange(value) {
    this.range = value;
  }

  /**
   * Compter les personnalités
   */
  countPersonalities() {
    const counts = { receptive: 0, skeptic: 0, social: 0, introvert: 0 };
    for (const agent of this.agents) {
      counts[agent.personality]++;
    }
    return counts;
  }

  /**
   * Compter les groupes
   */
  countGroups() {
    const counts = [];
    for (let i = 0; i < CONFIG.GROUP_COUNT; i++) {
      counts[i] = { total: 0, informed: 0 };
    }
    
    for (const agent of this.agents) {
      counts[agent.group].total++;
      if (agent.state !== 'ignorant') {
        counts[agent.group].informed++;
      }
    }
    
    return counts;
  }
}