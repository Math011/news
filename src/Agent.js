import { CONFIG } from './config.js';

/**
 * Agent - Un habitant avec personnalité, conviction et groupe social
 */
export class Agent {
  constructor(id, x, y, customDistribution = null) {
    this.id = id;
    this.x = x;
    this.y = y;
    
    // État : 'ignorant' | 'informed' | 'spreading' | 'saturated' | 'forgotten'
    this.state = 'ignorant';
    
    // Personnalité (déterminée à la création)
    this.personality = this.generatePersonality(customDistribution);
    this.receptivity = this.generateReceptivity();
    this.skepticism = this.generateSkepticism();
    this.socialness = this.generateSocialness();
    this.credibility = 0.3 + Math.random() * 0.5; // 0.3 → 0.8
    
    // Groupe social
    this.group = Math.floor(Math.random() * CONFIG.GROUP_COUNT);
    this.isBridge = Math.random() < CONFIG.BRIDGE_AGENT_CHANCE;
    if (this.isBridge) {
      this.secondGroup = (this.group + 1 + Math.floor(Math.random() * (CONFIG.GROUP_COUNT - 1))) % CONFIG.GROUP_COUNT;
    }
    
    // Info et conviction
    this.info = null;
    this.exposures = 0;
    this.convictionLevel = 0;
    this.timeInformed = 0;
    this.lastExposureTime = 0;
    this.infoDistortion = 0; // Niveau de déformation de l'info reçue
    
    // Flags spéciaux
    this.isInfluencer = false;
    
    // Mouvement
    this.targetX = x;
    this.targetY = y;
    this.speed = CONFIG.AGENT_SPEED * (0.7 + Math.random() * 0.6);
    this.homeX = x;
    this.homeY = y;
    
    // Visuel
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.waveRadius = 0;
  }

  /**
   * Générer une personnalité selon la distribution
   */
  generatePersonality(customDistribution = null) {
    const rand = Math.random();
    const dist = customDistribution || CONFIG.PERSONALITY_DISTRIBUTION;
    
    if (rand < dist.receptive) return 'receptive';
    if (rand < dist.receptive + dist.skeptic) return 'skeptic';
    if (rand < dist.receptive + dist.skeptic + dist.social) return 'social';
    return 'introvert';
  }

  /**
   * Générer la réceptivité selon la personnalité
   */
  generateReceptivity() {
    switch (this.personality) {
      case 'receptive': return 0.8 + Math.random() * 0.2;  // 0.8 → 1.0 (très réceptif)
      case 'skeptic': return 0.15 + Math.random() * 0.25;  // 0.15 → 0.4 (faible)
      case 'social': return 0.5 + Math.random() * 0.3;     // 0.5 → 0.8
      case 'introvert': return 0.3 + Math.random() * 0.3;  // 0.3 → 0.6
      default: return 0.5;
    }
  }

  /**
   * Générer le scepticisme selon la personnalité
   */
  generateSkepticism() {
    switch (this.personality) {
      case 'receptive': return 0.05 + Math.random() * 0.15; // 0.05 → 0.2 (peu sceptique)
      case 'skeptic': return 0.6 + Math.random() * 0.35;    // 0.6 → 0.95 (très sceptique)
      case 'social': return 0.1 + Math.random() * 0.25;     // 0.1 → 0.35
      case 'introvert': return 0.3 + Math.random() * 0.3;   // 0.3 → 0.6
      default: return 0.3;
    }
  }

  /**
   * Générer la sociabilité selon la personnalité
   */
  generateSocialness() {
    switch (this.personality) {
      case 'receptive': return 0.5 + Math.random() * 0.3;  // 0.5 → 0.8
      case 'skeptic': return 0.2 + Math.random() * 0.3;    // 0.2 → 0.5 (parle peu)
      case 'social': return 0.85 + Math.random() * 0.15;   // 0.85 → 1.0 (parle BEAUCOUP)
      case 'introvert': return 0.05 + Math.random() * 0.15;// 0.05 → 0.2 (parle très peu)
      default: return 0.5;
    }
  }

  /**
   * Être exposé à une information
   */
  expose(info, sourceCredibility, currentTime) {
    if (this.state === 'forgotten') {
      // Peut être ré-informé
      this.state = 'ignorant';
      this.exposures = 0;
      this.convictionLevel = 0;
    }
    
    if (this.state !== 'ignorant') {
      // Déjà informé, mais augmente la conviction
      if (this.state === 'informed' || this.state === 'spreading') {
        this.exposures++;
        this.convictionLevel = Math.min(1, this.convictionLevel + 0.15 * sourceCredibility);
      }
      return false;
    }
    
    this.exposures++;
    this.lastExposureTime = currentTime;
    
    // Calcul de la conviction initiale
    const baseConviction = 0.2 + sourceCredibility * 0.3;
    this.convictionLevel = Math.min(1, this.convictionLevel + baseConviction);
    
    // Devenir informé si assez d'expositions ou conviction suffisante
    const threshold = this.skepticism * 0.5 + 0.2;
    if (this.convictionLevel >= threshold || this.exposures >= CONFIG.EXPOSURES_TO_BELIEVE) {
      this.state = 'informed';
      this.info = { ...info };
      this.timeInformed = 0;
      return true;
    }
    
    return false;
  }

  /**
   * Mise à jour de l'agent
   */
  update(bounds, currentTime) {
    // Mise à jour selon l'état
    if (this.state === 'informed') {
      this.timeInformed++;
      
      // Devient diffuseur si convaincu et temps suffisant
      const timeNeeded = CONFIG.TIME_TO_SPREAD * (1 + this.skepticism);
      if (this.timeInformed >= timeNeeded && this.convictionLevel >= 0.3) {
        this.state = 'spreading';
        this.waveRadius = 0;
      }
    } else if (this.state === 'spreading') {
      this.timeInformed++;
      
      // Animation de l'onde
      this.waveRadius += 1.2;
      if (this.waveRadius > CONFIG.DEFAULT_RANGE * 1.2) {
        this.waveRadius = 0;
      }
      
      // Devient saturé après un moment
      if (this.timeInformed >= CONFIG.TIME_TO_SATURATED) {
        this.state = 'saturated';
      }
    } else if (this.state === 'saturated') {
      this.timeInformed++;
      
      // Déclin de la conviction
      this.convictionLevel = Math.max(0, this.convictionLevel - CONFIG.CONVICTION_DECAY);
      
      // Devient oublié après un moment
      if (this.timeInformed >= CONFIG.TIME_TO_FORGOTTEN) {
        this.state = 'forgotten';
      }
    } else if (this.state === 'forgotten') {
      // Déclin continu de la conviction jusqu'à 0
      this.convictionLevel = Math.max(0, this.convictionLevel - CONFIG.CONVICTION_DECAY * 2);
      
      // Peut redevenir ignorant après un long moment
      if (this.convictionLevel <= 0) {
        this.state = 'ignorant';
        this.exposures = 0;
        this.info = null;
      }
    }
    
    // Mouvement (les introvertis bougent moins)
    const moveChance = this.personality === 'introvert' ? 0.7 : 1;
    if (Math.random() < moveChance) {
      this.move(bounds);
    }
    
    // Pulsation
    this.pulsePhase += 0.04;
  }

  /**
   * Peut transmettre ?
   */
  canTransmit() {
    if (this.state !== 'spreading') return false;
    
    // Les bavards transmettent TOUJOURS
    if (this.personality === 'social') return true;
    
    // Les introvertis transmettent rarement
    if (this.personality === 'introvert') {
      return Math.random() < this.socialness * 0.5;
    }
    
    // Les autres selon leur sociabilité
    return Math.random() < this.socialness;
  }

  /**
   * Calcul de la force de transmission
   */
  getTransmissionPower() {
    let power = this.credibility * this.convictionLevel;
    
    // GROS bonus pour les bavards
    if (this.personality === 'social') {
      power *= 2.5;
    }
    
    // Malus pour les introvertis
    if (this.personality === 'introvert') {
      power *= 0.3;
    }
    
    // Bonus si très convaincu
    if (this.exposures >= CONFIG.EXPOSURES_TO_CONVINCED) {
      power *= 1.5;
    }
    
    return power * this.socialness;
  }

  /**
   * Nombre de cibles potentielles (les bavards touchent plus de monde)
   */
  getTransmissionReach() {
    if (this.personality === 'social') return 1.8;      // +80% de portée effective
    if (this.personality === 'introvert') return 0.5;   // -50% de portée
    if (this.personality === 'receptive') return 1.2;   // +20%
    return 1.0;
  }

  /**
   * Déplacement avec tendance à rester près du groupe
   */
  move(bounds) {
    // Changer de direction de temps en temps
    if (Math.random() < CONFIG.WANDER_CHANGE_CHANCE) {
      this.pickNewTarget(bounds);
    }
    
    // Se déplacer vers la cible
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 2) {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    } else {
      this.pickNewTarget(bounds);
    }
    
    // Rester dans les limites
    this.x = Math.max(20, Math.min(bounds.width - 20, this.x));
    this.y = Math.max(20, Math.min(bounds.height - 20, this.y));
  }

  /**
   * Choisir une nouvelle cible (tendance vers le "quartier" du groupe)
   */
  pickNewTarget(bounds) {
    const groupZones = this.getGroupZone(bounds);
    
    // 70% de chance de rester dans sa zone
    if (Math.random() < 0.7) {
      this.targetX = groupZones.x + Math.random() * groupZones.width;
      this.targetY = groupZones.y + Math.random() * groupZones.height;
    } else {
      // Sinon, aller n'importe où
      const margin = 40;
      this.targetX = margin + Math.random() * (bounds.width - margin * 2);
      this.targetY = margin + Math.random() * (bounds.height - margin * 2);
    }
    
    // Les ponts vont plus souvent dans d'autres zones
    if (this.isBridge && Math.random() < 0.4) {
      const otherZone = this.getGroupZone(bounds, this.secondGroup);
      this.targetX = otherZone.x + Math.random() * otherZone.width;
      this.targetY = otherZone.y + Math.random() * otherZone.height;
    }
  }

  /**
   * Obtenir la zone de son groupe
   */
  getGroupZone(bounds, groupOverride = null) {
    const group = groupOverride !== null ? groupOverride : this.group;
    const margin = 30;
    const zoneWidth = (bounds.width - margin * 2) / CONFIG.GROUP_COUNT;
    
    return {
      x: margin + group * zoneWidth,
      y: margin,
      width: zoneWidth,
      height: bounds.height - margin * 2,
    };
  }

  /**
   * Appartient au même groupe ?
   */
  isSameGroup(other) {
    if (this.group === other.group) return true;
    if (this.isBridge && this.secondGroup === other.group) return true;
    if (other.isBridge && other.secondGroup === this.group) return true;
    return false;
  }

  /**
   * Distance avec un autre agent
   */
  distanceTo(other) {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Obtenir la couleur selon l'état et la conviction
   */
  getColor() {
    const baseColor = CONFIG.COLORS[this.state];
    
    // Ajuster l'intensité selon la conviction
    if (this.state === 'informed' || this.state === 'spreading') {
      return this.adjustColorIntensity(baseColor, this.convictionLevel);
    }
    
    if (this.state === 'saturated' || this.state === 'forgotten') {
      return this.adjustColorIntensity(baseColor, 0.5 + this.convictionLevel * 0.5);
    }
    
    return baseColor;
  }

  /**
   * Ajuster l'intensité d'une couleur
   */
  adjustColorIntensity(hexColor, intensity) {
    // Convertir hex en RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // Ajuster vers le gris pour faible intensité
    const gray = 100;
    const factor = 0.4 + intensity * 0.6;
    
    const newR = Math.round(gray + (r - gray) * factor);
    const newG = Math.round(gray + (g - gray) * factor);
    const newB = Math.round(gray + (b - gray) * factor);
    
    return `rgb(${newR}, ${newG}, ${newB})`;
  }

  /**
   * Obtenir la couleur de la personnalité (bordure)
   */
  getPersonalityColor() {
    return CONFIG.COLORS[this.personality];
  }

  /**
   * Obtenir le rayon selon l'état
   */
  getRadius() {
    let baseRadius = 7;
    
    // Taille selon personnalité
    if (this.personality === 'social') baseRadius += 2;
    if (this.personality === 'introvert') baseRadius -= 1;
    
    // Pulsation selon état
    if (this.state === 'informed') {
      return baseRadius + Math.sin(this.pulsePhase) * 1.5;
    }
    
    if (this.state === 'spreading') {
      return baseRadius + Math.sin(this.pulsePhase * 2) * 2.5;
    }
    
    return baseRadius;
  }
}