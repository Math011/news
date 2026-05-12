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
    this.truth = CONFIG.DEFAULT_TRUTH;
    
    // Paramètres de groupe (peuvent être modifiés par expérience)
    this.sameGroupBonus = CONFIG.SAME_GROUP_BONUS;
    this.diffGroupPenalty = CONFIG.DIFF_GROUP_PENALTY;
    
    // Information active
    this.info = null;
    
    // Expérience en cours
    this.currentExperiment = null;
    
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
      everReached: 0,        // Nombre d'agents ayant été touchés AU MOINS UNE FOIS
      peakEverReached: 0,    // Pic maximum de everReached
      spreadRate: 0,
      infoHeat: 0,
      infoTruth: 0,
      infoDistortion: 0,
      avgConviction: 0,
    };
    
    // Résultats de l'expérience
    this.experimentResults = {
      timeToFirstSpread: null,
      timeTo25Percent: null,
      timeTo50Percent: null,
      timeTo75Percent: null,
      peakReachedTime: null,
      finalReached: 0,
      maxEverReached: 0,     // Maximum de personnes ayant été touchées
      avgDistortion: 0,
      groupPenetration: [0, 0, 0],
      peakGroupPenetration: [0, 0, 0], // Pic par groupe
    };
    
    // Historique pour graphiques
    this.history = [];
    this.fullHistory = []; // Historique complet pour analyse
    
    // Bounds du canvas
    this.bounds = {
      width: CONFIG.CANVAS_WIDTH,
      height: CONFIG.CANVAS_HEIGHT,
    };
  }

  /**
   * Initialiser la population
   */
  init(populationCount, experimentParams = null) {
    this.agents = [];
    this.time = 0;
    this.history = [];
    this.fullHistory = [];
    this.info = null;
    this.activeEvent = null;
    this.eventTimer = 0;
    this.eventCooldown = 0;
    
    // Reset des stats
    this.stats = {
      ignorant: 0,
      informed: 0,
      spreading: 0,
      saturated: 0,
      forgotten: 0,
      totalReached: 0,
      peakReached: 0,
      everReached: 0,
      peakEverReached: 0,
      spreadRate: 0,
      infoHeat: 0,
      infoTruth: 0,
      infoDistortion: 0,
      avgConviction: 0,
      groupPenetration: [0, 0, 0],
    };
    
    // Reset des résultats
    this.experimentResults = {
      timeToFirstSpread: null,
      timeTo25Percent: null,
      timeTo50Percent: null,
      timeTo75Percent: null,
      peakReachedTime: null,
      finalReached: 0,
      maxEverReached: 0,
      avgDistortion: 0,
      groupPenetration: [0, 0, 0],
      peakGroupPenetration: [0, 0, 0],
    };
    
    // Appliquer les paramètres d'expérience
    if (experimentParams) {
      if (experimentParams.virality !== undefined) this.virality = experimentParams.virality;
      if (experimentParams.truth !== undefined) this.truth = experimentParams.truth;
      if (experimentParams.sameGroupBonus !== undefined) this.sameGroupBonus = experimentParams.sameGroupBonus;
      if (experimentParams.diffGroupPenalty !== undefined) this.diffGroupPenalty = experimentParams.diffGroupPenalty;
    }
    
    // Distribution des personnalités (peut être modifiée par expérience)
    let distribution = { ...CONFIG.PERSONALITY_DISTRIBUTION };
    if (experimentParams?.skepticRatio !== undefined) {
      const skepticRatio = experimentParams.skepticRatio;
      const remaining = 1 - skepticRatio;
      distribution = {
        receptive: remaining * 0.33,
        skeptic: skepticRatio,
        social: remaining * 0.33,
        introvert: remaining * 0.34,
      };
    }
    
    // Créer les agents avec position dans leur zone de groupe
    for (let i = 0; i < populationCount; i++) {
      const group = Math.floor(Math.random() * CONFIG.GROUP_COUNT);
      const zone = this.getGroupZone(group);
      
      const x = zone.x + Math.random() * zone.width;
      const y = zone.y + Math.random() * zone.height;
      
      const agent = new Agent(i, x, y, distribution);
      agent.group = group;
      this.agents.push(agent);
    }
    
    // Forcer un influenceur si demandé
    if (experimentParams?.forceInfluencer) {
      const randomAgent = this.agents[Math.floor(Math.random() * this.agents.length)];
      randomAgent.personality = 'social';
      randomAgent.socialness = 1.0;
      randomAgent.credibility = 1.0;
      randomAgent.isInfluencer = true;
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
      // Créer l'info avec vérité et déformation
      this.info = {
        id: Date.now(),
        virality: this.virality,
        heat: CONFIG.INFO_INITIAL_HEAT,
        truth: this.truth,           // Niveau de vérité (0 = fake, 1 = vrai)
        distortion: 0,               // Niveau de déformation accumulée
        originalTruth: this.truth,   // Vérité originale pour comparaison
        sourceId: closest.id,
        createdAt: this.time,
      };
      
      // L'agent devient source (diffuseur direct avec forte conviction)
      closest.info = { ...this.info };
      closest.state = 'spreading';
      closest.convictionLevel = 1.0;
      closest.exposures = CONFIG.EXPOSURES_TO_CONVINCED;
      closest.waveRadius = 0;
      closest.infoDistortion = 0; // Sa version n'est pas déformée
      closest.wasEverInformed = true; // Marquer comme ayant été informé
      
      // Augmenter sa crédibilité (c'est la source)
      closest.credibility = Math.min(1, closest.credibility + 0.3);
      
      this.updateStats();
      return closest; // Retourner l'agent source
    }
    
    return null;
  }

  /**
   * Lancer une expérience prédéfinie
   */
  startExperiment(experimentId, populationCount) {
    const experiment = CONFIG.EXPERIMENTS[experimentId];
    if (!experiment) return false;
    
    this.currentExperiment = experiment;
    
    // Reset avec les paramètres de l'expérience
    this.virality = experiment.params.virality ?? CONFIG.DEFAULT_VIRALITY;
    this.truth = experiment.params.truth ?? CONFIG.DEFAULT_TRUTH;
    this.sameGroupBonus = experiment.params.sameGroupBonus ?? CONFIG.SAME_GROUP_BONUS;
    this.diffGroupPenalty = experiment.params.diffGroupPenalty ?? CONFIG.DIFF_GROUP_PENALTY;
    
    this.init(experiment.params.population ?? populationCount, experiment.params);
    
    return true;
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
    
    if (event.effect === 'factcheck') {
      // Le fact-check a plus d'impact si l'info est fausse
      if (this.info) {
        const truthImpact = 1 - this.info.truth; // Plus d'impact si fake news
        
        for (const agent of this.agents) {
          if (agent.state === 'informed' || agent.state === 'spreading') {
            // Les sceptiques réagissent plus au fact-check
            const skepticBonus = agent.personality === 'skeptic' ? 1.5 : 1;
            const convictionLoss = truthImpact * 0.4 * skepticBonus;
            
            agent.convictionLevel -= convictionLoss;
            
            // Si pas convaincu, peut abandonner l'info
            if (agent.convictionLevel < 0.15) {
              agent.state = 'ignorant';
              agent.info = null;
              agent.convictionLevel = 0;
            }
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
              spreader,
              sourceCredibility: spreader.credibility,
            });
          }
        }
      }
    }
    
    // Appliquer les nouvelles expositions avec possible déformation
    for (const { target, sourceCredibility, spreader } of newExposures) {
      // Déformation de l'info pendant la transmission
      let distortedInfo = { ...this.info };
      
      if (Math.random() < CONFIG.INFO_DISTORTION_RATE) {
        // L'info se déforme !
        distortedInfo.distortion = (spreader?.infoDistortion || 0) + CONFIG.INFO_DISTORTION_AMOUNT;
        
        // Info déformée = potentiellement plus virale mais moins crédible
        distortedInfo.virality = Math.min(1, this.info.virality * CONFIG.DISTORTION_VIRALITY_BOOST);
      } else {
        distortedInfo.distortion = spreader?.infoDistortion || 0;
      }
      
      // Les sceptiques détectent mieux les fausses infos
      let effectiveCredibility = sourceCredibility;
      if (target.personality === 'skeptic' && this.info.truth < 0.5) {
        // Réduction de la crédibilité perçue pour les fake news
        const truthPenalty = (1 - this.info.truth) * CONFIG.SKEPTIC_TRUTH_DETECTION;
        effectiveCredibility *= (1 - truthPenalty);
      }
      
      const wasInformed = target.expose(distortedInfo, effectiveCredibility, this.time);
      
      if (wasInformed) {
        target.infoDistortion = distortedInfo.distortion;
      }
    }
  }

  /**
   * Calcul de la probabilité de transmission
   */
  calculateTransmissionProbability(spreader, target, distance, effectiveRange, transmissionPower, eventMultiplier) {
    // Base plus élevée
    let probability = CONFIG.BASE_TRANSMISSION_CHANCE * 1.5;
    
    // === DÉFORMATION = VIRALITÉ BOOSTÉE ===
    const distortion = spreader.infoDistortion || 0;
    let effectiveVirality = this.info.virality;
    
    // Info déformée = plus virale (sensationnalisme)
    if (distortion > 0.3) {
      effectiveVirality *= (1 + distortion * 0.5); // Jusqu'à +50% viralité
    }
    probability *= (0.5 + effectiveVirality);
    
    // Température de l'info
    probability *= (0.3 + this.info.heat * 0.7);
    
    // Distance
    const distanceFactor = Math.pow(1 - (distance / effectiveRange), 1.5);
    probability *= distanceFactor;
    
    // Réceptivité de la cible
    probability *= (0.2 + target.receptivity * 0.8);
    
    // === SCEPTICISME + DÉTECTION DE DÉFORMATION ===
    let skepticismFactor = 1 - target.skepticism * 0.8;
    
    // Les sceptiques détectent les fake news
    if (target.personality === 'skeptic' && this.info.truth < 0.5) {
      skepticismFactor *= (0.3 + this.info.truth * 0.7);
    }
    
    // Les sceptiques détectent aussi la déformation
    if (target.personality === 'skeptic' && distortion > 0.4) {
      skepticismFactor *= (1 - distortion * 0.5);
    }
    probability *= skepticismFactor;
    
    // === CRÉDIBILITÉ RÉDUITE PAR DÉFORMATION ===
    let effectiveCredibility = spreader.credibility;
    if (distortion > 0.3) {
      effectiveCredibility *= (1 - distortion * 0.4); // Jusqu'à -40% crédibilité
    }
    
    // Puissance de transmission avec crédibilité ajustée
    const adjustedPower = transmissionPower * (0.5 + effectiveCredibility * 0.5);
    probability *= (0.3 + adjustedPower * 0.7);
    
    // Bonus même groupe
    if (spreader.isSameGroup(target)) {
      probability *= this.sameGroupBonus;
    } else {
      probability *= this.diffGroupPenalty;
    }
    
    // Bonus répétition
    if (target.exposures > 0) {
      probability *= (1 + target.exposures * 0.5);
    }
    
    // Événement
    probability *= eventMultiplier;
    
    return Math.min(probability, 0.95);
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
    let totalConviction = 0;
    let totalDistortion = 0;
    let informedCount = 0;
    let everInformedCount = 0; // Agents ayant été touchés au moins une fois
    
    // Compteurs par groupe
    const groupInformed = [0, 0, 0];
    const groupEverInformed = [0, 0, 0]; // Par groupe, ayant été touchés
    const groupTotal = [0, 0, 0];
    
    for (const agent of this.agents) {
      // Compter par groupe
      if (agent.group < CONFIG.GROUP_COUNT) {
        groupTotal[agent.group]++;
        
        // Compter ceux qui ont été touchés au moins une fois
        if (agent.wasEverInformed) {
          everInformedCount++;
          groupEverInformed[agent.group]++;
        }
      }
      
      switch (agent.state) {
        case 'ignorant': ignorant++; break;
        case 'informed': 
          informed++; 
          groupInformed[agent.group]++;
          totalConviction += agent.convictionLevel;
          totalDistortion += agent.infoDistortion || 0;
          informedCount++;
          break;
        case 'spreading': 
          spreading++; 
          groupInformed[agent.group]++;
          totalConviction += agent.convictionLevel;
          totalDistortion += agent.infoDistortion || 0;
          informedCount++;
          break;
        case 'saturated': 
          saturated++; 
          groupInformed[agent.group]++;
          break;
        case 'forgotten': forgotten++; break;
      }
    }
    
    const totalReached = informed + spreading + saturated + forgotten;
    const currentlyActive = informed + spreading;
    const percentReached = this.agents.length > 0 
      ? Math.round((totalReached / this.agents.length) * 100) 
      : 0;
    
    // Pourcentage basé sur ceux qui ont été touchés AU MOINS UNE FOIS
    const percentEverReached = this.agents.length > 0
      ? Math.round((everInformedCount / this.agents.length) * 100)
      : 0;
    
    // Calculer la vitesse de propagation
    this.history.push({ time: this.time, reached: totalReached });
    if (this.history.length > 60) {
      this.history.shift();
    }
    
    // Historique complet pour graphiques - utiliser percentEverReached
    if (this.time % 10 === 0) { // Échantillonner toutes les 10 frames
      this.fullHistory.push({
        time: this.time,
        percentReached: percentEverReached, // Utiliser le % de ceux ayant été touchés
        informed,
        spreading,
        saturated,
        heat: this.info ? this.info.heat : 0,
        avgDistortion: informedCount > 0 ? totalDistortion / informedCount : 0,
      });
    }
    
    let spreadRate = 0;
    if (this.history.length >= 2) {
      const oldest = this.history[0];
      const newest = this.history[this.history.length - 1];
      const timeDiff = (newest.time - oldest.time) / 60;
      const reachedDiff = newest.reached - oldest.reached;
      spreadRate = timeDiff > 0 ? reachedDiff / timeDiff : 0;
    }
    
    // Mettre à jour les résultats d'expérience - basés sur everReached
    if (this.experimentResults.timeToFirstSpread === null && spreading > 0) {
      this.experimentResults.timeToFirstSpread = this.time;
    }
    if (this.experimentResults.timeTo25Percent === null && percentEverReached >= 25) {
      this.experimentResults.timeTo25Percent = this.time;
    }
    if (this.experimentResults.timeTo50Percent === null && percentEverReached >= 50) {
      this.experimentResults.timeTo50Percent = this.time;
    }
    if (this.experimentResults.timeTo75Percent === null && percentEverReached >= 75) {
      this.experimentResults.timeTo75Percent = this.time;
    }
    
    // Tracker le maximum de personnes ayant été touchées
    if (everInformedCount > this.experimentResults.maxEverReached) {
      this.experimentResults.maxEverReached = everInformedCount;
      this.experimentResults.peakReachedTime = this.time;
    }
    
    // Pénétration par groupe - basée sur ceux ayant été touchés
    const currentGroupPenetration = groupTotal.map((total, i) => 
      total > 0 ? Math.round((groupEverInformed[i] / total) * 100) : 0
    );
    
    // Garder le pic par groupe
    if (this.experimentResults.peakGroupPenetration) {
      this.experimentResults.peakGroupPenetration = this.experimentResults.peakGroupPenetration.map((peak, i) =>
        Math.max(peak, currentGroupPenetration[i])
      );
    } else {
      this.experimentResults.peakGroupPenetration = [...currentGroupPenetration];
    }
    
    this.stats = {
      ignorant,
      informed,
      spreading,
      saturated,
      forgotten,
      totalReached,
      currentlyActive,
      everReached: everInformedCount,
      peakReached: Math.max((this.stats && this.stats.peakReached) || 0, totalReached),
      peakEverReached: Math.max((this.stats && this.stats.peakEverReached) || 0, everInformedCount),
      spreadRate: Math.max(0, spreadRate).toFixed(1),
      percentReached: percentEverReached,
      infoHeat: this.info ? Math.round(this.info.heat * 100) : 0,
      infoTruth: this.info ? Math.round(this.info.truth * 100) : 50,
      infoDistortion: informedCount > 0 ? Math.round((totalDistortion / informedCount) * 100) : 0,
      avgConviction: informedCount > 0 ? Math.round((totalConviction / informedCount) * 100) : 0,
      groupPenetration: currentGroupPenetration,
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

  /**
   * Générer une conclusion automatique basée sur les résultats
   */
  generateConclusion() {
    const stats = this.stats;
    const results = this.experimentResults;
    const conclusions = [];
    let mainConclusion = '';
    
    // Utiliser le pourcentage de personnes AYANT ÉTÉ touchées (pas l'état actuel)
    const percentTouched = this.agents.length > 0 
      ? Math.round((stats.peakEverReached / this.agents.length) * 100)
      : stats.percentReached;
    
    // Analyse de la propagation - basée sur le pic
    if (percentTouched >= 80) {
      conclusions.push(`📈 Propagation massive : ${percentTouched}% de la population a été touchée`);
      mainConclusion = 'virale';
    } else if (percentTouched >= 50) {
      conclusions.push(`📊 Propagation modérée : ${percentTouched}% de la population a été touchée`);
      mainConclusion = 'modérée';
    } else if (percentTouched >= 25) {
      conclusions.push(`📉 Propagation limitée : seulement ${percentTouched}% de la population touchée`);
      mainConclusion = 'limitée';
    } else {
      conclusions.push(`🛑 Propagation bloquée : ${percentTouched}% de la population touchée`);
      mainConclusion = 'bloquée';
    }
    
    // Analyse de la vitesse
    if (results.timeTo50Percent) {
      const seconds = Math.round(results.timeTo50Percent / 60);
      if (seconds < 15) {
        conclusions.push(`⚡ Vitesse explosive : 50% atteint en ${seconds}s`);
      } else if (seconds < 30) {
        conclusions.push(`🏃 Vitesse rapide : 50% atteint en ${seconds}s`);
      } else {
        conclusions.push(`🐢 Vitesse lente : 50% atteint en ${seconds}s`);
      }
    }
    
    // Analyse de la déformation
    if (stats.infoDistortion >= 50) {
      conclusions.push('🔀 Forte déformation : l\'info s\'est beaucoup transformée en circulant');
    } else if (stats.infoDistortion >= 25) {
      conclusions.push('🔀 Déformation modérée : l\'info a subi quelques modifications');
    }
    
    // Analyse vérité vs fake
    if (this.info) {
      if (this.info.truth < 0.3) {
        if (percentTouched >= 50) {
          conclusions.push('⚠️ Fake news efficace : une info peu fiable a largement circulé');
        } else {
          conclusions.push('✅ Fake news freinée : les sceptiques ont limité la désinformation');
        }
      } else if (this.info.truth > 0.7) {
        if (percentTouched >= 50) {
          conclusions.push('✅ Vérité propagée : une info fiable s\'est bien diffusée');
        } else {
          conclusions.push('😔 Vérité ignorée : une info fiable n\'a pas réussi à se propager');
        }
      }
    }
    
    // Analyse des groupes - utiliser le pic par groupe
    const peakGroups = results.peakGroupPenetration || stats.groupPenetration;
    const groupDiff = Math.max(...peakGroups) - Math.min(...peakGroups);
    if (groupDiff >= 40) {
      conclusions.push('🫧 Effet bulle fort : grande différence de pénétration entre les groupes');
    } else if (groupDiff <= 15 && percentTouched >= 30) {
      conclusions.push('🌐 Diffusion homogène : tous les groupes touchés de façon similaire');
    }
    
    // Conclusion principale formatée
    let summary = '';
    switch (mainConclusion) {
      case 'virale':
        summary = this.info && this.info.truth < 0.5 
          ? 'Une info peu fiable mais virale peut toucher massivement une population.'
          : 'Les conditions étaient favorables à une propagation massive.';
        break;
      case 'modérée':
        summary = 'La propagation a atteint un équilibre entre diffuseurs et résistances.';
        break;
      case 'limitée':
        summary = 'Des facteurs (scepticisme, bulles sociales, faible viralité) ont limité la diffusion.';
        break;
      case 'bloquée':
        summary = 'La population a résisté à cette information, probablement grâce aux sceptiques.';
        break;
    }
    
    return {
      bullets: conclusions,
      summary,
      mainConclusion,
      percentTouched, // Ajouter le pourcentage réel
    };
  }
}