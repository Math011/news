export const CONFIG = {
  // Canvas
  CANVAS_WIDTH: 900,
  CANVAS_HEIGHT: 550,
  
  // Population
  DEFAULT_POPULATION: 80,
  MIN_POPULATION: 20,
  MAX_POPULATION: 200,
  
  // Propagation de base
  DEFAULT_VIRALITY: 0.5,
  DEFAULT_RANGE: 65,
  MIN_RANGE: 30,
  MAX_RANGE: 120,
  BASE_TRANSMISSION_CHANCE: 0.025, // Augmenté pour plus de dynamisme
  
  // Temps (en frames, 60fps)
  TIME_TO_SPREAD: 90,        // Frames avant qu'un informé devienne diffuseur
  TIME_TO_SATURATED: 900,    // Frames avant saturation (lassitude) ~15s
  TIME_TO_FORGOTTEN: 1800,   // Frames avant oubli total ~30s
  
  // Conviction
  EXPOSURES_TO_BELIEVE: 2,   // Expositions pour commencer à croire
  EXPOSURES_TO_CONVINCED: 4, // Expositions pour être convaincu
  CONVICTION_DECAY: 0.0003,  // Perte de conviction par frame
  
  // Température de l'info
  INFO_INITIAL_HEAT: 1.0,
  INFO_HEAT_DECAY: 0.0002,
  INFO_MIN_HEAT: 0.05,
  
  // Vitesse des agents
  AGENT_SPEED: 0.35,
  WANDER_CHANGE_CHANCE: 0.012,
  
  // Groupes sociaux
  GROUP_COUNT: 3,
  SAME_GROUP_BONUS: 2.5,     // Multiplicateur transmission même groupe
  DIFF_GROUP_PENALTY: 0.25,  // Multiplicateur transmission groupe différent
  BRIDGE_AGENT_CHANCE: 0.12, // Chance d'être un "pont" entre groupes
  
  // Personnalités (distribution)
  PERSONALITY_DISTRIBUTION: {
    receptive: 0.25,    // Réceptifs
    skeptic: 0.20,      // Sceptiques
    social: 0.25,       // Bavards
    introvert: 0.30,    // Introvertis
  },
  
  // Événements
  EVENT_CHANCE: 0.0008,      // Chance par frame qu'un événement se produise
  EVENT_DURATION: 480,       // Durée d'un événement (8 secondes à 60fps)
  EVENT_COOLDOWN: 300,       // Temps minimum entre événements
  
  // Couleurs
  COLORS: {
    // États
    ignorant: '#6b7280',
    informed: '#fbbf24',
    spreading: '#ef4444',
    saturated: '#78716c',
    forgotten: '#4b5563',
    
    // Personnalités (bordures/halos)
    receptive: '#34d399',
    skeptic: '#60a5fa',
    social: '#f97316',
    introvert: '#1f2937',
    
    // Groupes
    groups: [
      'rgba(239, 68, 68, 0.12)',   // Rouge
      'rgba(59, 130, 246, 0.12)',  // Bleu
      'rgba(34, 197, 94, 0.12)',   // Vert
    ],
    groupBorders: [
      '#ef4444',
      '#3b82f6', 
      '#22c55e',
    ],
    
    // Chaleur
    hot: '#ef4444',
    warm: '#f97316',
    cool: '#60a5fa',
    cold: '#6b7280',
    
    // Général
    background: '#0f0f1a',
    grid: 'rgba(255,255,255,0.02)',
  },
  
  // Événements disponibles
  EVENTS: {
    media: {
      id: 'media',
      name: '📰 Média en parle',
      description: 'Un média majeur reprend l\'info !',
      effect: 'viralityBoost',
      multiplier: 2.5,
      heatBoost: 0.4,
      type: 'positive',
    },
    censorship: {
      id: 'censorship',
      name: '🔇 Censure',
      description: 'L\'info est censurée',
      effect: 'viralityPenalty',
      multiplier: 0.3,
      heatBoost: -0.15,
      type: 'negative',
    },
    influencer: {
      id: 'influencer',
      name: '🎤 Influenceur',
      description: 'Un influenceur partage l\'info !',
      effect: 'superSpreader',
      multiplier: 1,
      heatBoost: 0.35,
      type: 'positive',
    },
    fatigue: {
      id: 'fatigue',
      name: '😴 Fatigue médiatique',
      description: 'Les gens se lassent...',
      effect: 'fatigueBoost',
      multiplier: 2.0,
      heatBoost: -0.25,
      type: 'negative',
    },
    scandal: {
      id: 'scandal',
      name: '🔥 Scandale',
      description: 'Un scandale relance l\'intérêt !',
      effect: 'viralityBoost',
      multiplier: 3.5,
      heatBoost: 0.5,
      type: 'positive',
    },
    factcheck: {
      id: 'factcheck',
      name: '✅ Fact-check',
      description: 'Des experts vérifient l\'info',
      effect: 'credibilityDrop',
      multiplier: 0.5,
      heatBoost: -0.1,
      type: 'neutral',
    },
  },
  
  // Sauvegarde
  SAVE_KEY: 'infospread_v2',
};