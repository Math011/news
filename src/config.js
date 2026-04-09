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
  BASE_TRANSMISSION_CHANCE: 0.025,
  
  // Temps (en frames, 60fps)
  TIME_TO_SPREAD: 90,
  TIME_TO_SATURATED: 900,
  TIME_TO_FORGOTTEN: 1800,
  
  // Conviction
  EXPOSURES_TO_BELIEVE: 2,
  EXPOSURES_TO_CONVINCED: 4,
  CONVICTION_DECAY: 0.0003,
  
  // Température de l'info
  INFO_INITIAL_HEAT: 1.0,
  INFO_HEAT_DECAY: 0.0002,
  INFO_MIN_HEAT: 0.05,
  
  // === NOUVEAU : Déformation de l'info ===
  INFO_DISTORTION_RATE: 0.08,      // Chance de déformation par transmission
  INFO_DISTORTION_AMOUNT: 0.12,    // Quantité de déformation
  DISTORTION_VIRALITY_BOOST: 1.3,  // L'info déformée peut être plus virale
  DISTORTION_CREDIBILITY_PENALTY: 0.15, // Mais moins crédible
  
  // === NOUVEAU : Vérité de l'info ===
  DEFAULT_TRUTH: 0.5,              // 0 = fake news, 1 = vérité
  SKEPTIC_TRUTH_DETECTION: 0.6,    // Les sceptiques détectent mieux le faux
  
  // Vitesse des agents
  AGENT_SPEED: 0.35,
  WANDER_CHANGE_CHANCE: 0.012,
  
  // Groupes sociaux
  GROUP_COUNT: 3,
  SAME_GROUP_BONUS: 2.5,
  DIFF_GROUP_PENALTY: 0.25,
  BRIDGE_AGENT_CHANCE: 0.12,
  
  // Personnalités (distribution)
  PERSONALITY_DISTRIBUTION: {
    receptive: 0.25,
    skeptic: 0.20,
    social: 0.25,
    introvert: 0.30,
  },
  
  // Événements
  EVENT_CHANCE: 0.0008,
  EVENT_DURATION: 480,
  EVENT_COOLDOWN: 300,
  
  // === NOUVEAU : Expériences prédéfinies ===
  EXPERIMENTS: {
    freeplay: {
      id: 'freeplay',
      name: '🎮 Mode Libre',
      description: 'Explorez librement la propagation',
      params: {},
    },
    viral: {
      id: 'viral',
      name: '🔥 Viralité explosive',
      description: 'Pourquoi certaines infos deviennent virales ?',
      question: 'Quel seuil de viralité déclenche une propagation massive ?',
      params: {
        virality: 0.9,
        truth: 0.3,
        population: 100,
      },
    },
    skeptics: {
      id: 'skeptics',
      name: '🧐 Société sceptique',
      description: 'Impact d\'une population sceptique',
      question: 'Les sceptiques peuvent-ils bloquer une fake news ?',
      params: {
        virality: 0.7,
        truth: 0.2,
        skepticRatio: 0.5,
        population: 80,
      },
    },
    bubbles: {
      id: 'bubbles',
      name: '🫧 Bulles sociales',
      description: 'L\'info reste-t-elle dans sa bulle ?',
      question: 'Les groupes isolés ralentissent-ils la diffusion ?',
      params: {
        virality: 0.6,
        sameGroupBonus: 4.0,
        diffGroupPenalty: 0.1,
        population: 90,
      },
    },
    influencer: {
      id: 'influencer',
      name: '🎤 Pouvoir des influenceurs',
      description: 'Un influenceur change-t-il tout ?',
      question: 'Quel est l\'impact d\'un super-diffuseur ?',
      params: {
        virality: 0.4,
        forceInfluencer: true,
        population: 80,
      },
    },
    truth: {
      id: 'truth',
      name: '✅ Vérité vs Fake News',
      description: 'La vérité se propage-t-elle moins vite ?',
      question: 'Une info vraie est-elle désavantagée ?',
      params: {
        virality: 0.5,
        compareTruth: true,
        population: 80,
      },
    },
  },
  
  // Couleurs
  COLORS: {
    ignorant: '#6b7280',
    informed: '#fbbf24',
    spreading: '#ef4444',
    saturated: '#78716c',
    forgotten: '#4b5563',
    
    receptive: '#34d399',
    skeptic: '#60a5fa',
    social: '#f97316',
    introvert: '#1f2937',
    
    groups: [
      'rgba(239, 68, 68, 0.12)',
      'rgba(59, 130, 246, 0.12)',
      'rgba(34, 197, 94, 0.12)',
    ],
    groupBorders: [
      '#ef4444',
      '#3b82f6', 
      '#22c55e',
    ],
    
    // Info selon vérité
    truthHigh: '#22c55e',    // Vérité = vert
    truthMid: '#f59e0b',     // Mixte = orange
    truthLow: '#ef4444',     // Fake = rouge
    
    hot: '#ef4444',
    warm: '#f97316',
    cool: '#60a5fa',
    cold: '#6b7280',
    
    background: '#0f0f1a',
    grid: 'rgba(255,255,255,0.02)',
  },
  
  // Événements
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
      effect: 'factcheck',
      multiplier: 0.5,
      heatBoost: -0.1,
      truthReveal: true,  // Révèle la vérité
      type: 'neutral',
    },
  },
  
  SAVE_KEY: 'infospread_v3',
};