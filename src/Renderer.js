import { CONFIG } from './config.js';

// Polyfill pour roundRect si non supporté
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
  };
}

/**
 * Renderer - Rendu visuel enrichi avec groupes, personnalités, chaleur
 */
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    canvas.width = CONFIG.CANVAS_WIDTH;
    canvas.height = CONFIG.CANVAS_HEIGHT;
    
    // Pour afficher la portée au survol
    this.hoverAgent = null;
    this.showRange = false;
    
    // Effet d'événement
    this.eventFlash = 0;
    this.eventColor = null;
  }

  /**
   * Rendu principal
   */
  render(simulation) {
    const ctx = this.ctx;
    
    // Fond
    this.drawBackground(ctx, simulation);
    
    // Zones de groupes
    this.drawGroupZones(ctx, simulation);
    
    // Grille subtile
    this.drawGrid(ctx);
    
    // Connexions entre agents proches
    this.drawConnections(ctx, simulation.agents, simulation.range);
    
    // Ondes de propagation
    this.drawWaves(ctx, simulation.agents, simulation.range);
    
    // Agents
    this.drawAgents(ctx, simulation.agents, simulation);
    
    // Indicateur de chaleur
    this.drawHeatIndicator(ctx, simulation);
    
    // Effet d'événement
    if (this.eventFlash > 0) {
      this.drawEventFlash(ctx);
      this.eventFlash -= 0.02;
    }
    
    // Afficher la portée si demandé
    if (this.showRange && this.hoverAgent) {
      this.drawRangeIndicator(ctx, this.hoverAgent, simulation.range);
    }
  }

  /**
   * Fond avec effet selon la chaleur
   */
  drawBackground(ctx, simulation) {
    const heat = simulation.info ? simulation.info.heat : 0;
    
    // Dégradé de base
    const gradient = ctx.createRadialGradient(
      CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2, 0,
      CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2, CONFIG.CANVAS_WIDTH / 2
    );
    
    // Couleur varie selon la chaleur
    const r = Math.round(15 + heat * 20);
    const g = Math.round(15 + heat * 5);
    const b = Math.round(26 - heat * 10);
    
    gradient.addColorStop(0, `rgb(${r + 10}, ${g + 10}, ${b + 10})`);
    gradient.addColorStop(1, `rgb(${r - 5}, ${g - 5}, ${b})`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
  }

  /**
   * Zones de groupes (en arrière-plan)
   */
  drawGroupZones(ctx, simulation) {
    const margin = 30;
    const zoneWidth = (CONFIG.CANVAS_WIDTH - margin * 2) / CONFIG.GROUP_COUNT;
    const height = CONFIG.CANVAS_HEIGHT - margin * 2;
    
    for (let i = 0; i < CONFIG.GROUP_COUNT; i++) {
      const x = margin + i * zoneWidth;
      
      // Zone colorée
      ctx.fillStyle = CONFIG.COLORS.groups[i];
      ctx.beginPath();
      ctx.roundRect(x + 5, margin + 5, zoneWidth - 10, height - 10, 15);
      ctx.fill();
      
      // Bordure subtile
      ctx.strokeStyle = CONFIG.COLORS.groupBorders[i];
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.2;
      ctx.stroke();
      ctx.globalAlpha = 1;
      
      // Label du groupe
      ctx.fillStyle = CONFIG.COLORS.groupBorders[i];
      ctx.globalAlpha = 0.4;
      ctx.font = '12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(`Groupe ${String.fromCharCode(65 + i)}`, x + zoneWidth / 2, margin + 20);
      ctx.globalAlpha = 1;
    }
  }

  /**
   * Grille de fond
   */
  drawGrid(ctx) {
    ctx.strokeStyle = CONFIG.COLORS.grid;
    ctx.lineWidth = 1;
    
    const gridSize = 50;
    
    for (let x = 0; x <= CONFIG.CANVAS_WIDTH; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CONFIG.CANVAS_HEIGHT);
      ctx.stroke();
    }
    
    for (let y = 0; y <= CONFIG.CANVAS_HEIGHT; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CONFIG.CANVAS_WIDTH, y);
      ctx.stroke();
    }
  }

  /**
   * Connexions entre agents proches
   */
  drawConnections(ctx, agents, range) {
    ctx.lineWidth = 1;
    
    for (let i = 0; i < agents.length; i++) {
      const a1 = agents[i];
      if (a1.state === 'ignorant' || a1.state === 'forgotten') continue;
      
      for (let j = i + 1; j < agents.length; j++) {
        const a2 = agents[j];
        
        const dist = a1.distanceTo(a2);
        
        if (dist < range * 0.8) {
          const alpha = (1 - dist / range) * 0.12;
          
          // Couleur selon les états
          if (a1.state === 'spreading' && a2.state === 'spreading') {
            ctx.strokeStyle = `rgba(239, 68, 68, ${alpha * 1.5})`;
          } else if (a1.state === 'spreading' || a2.state === 'spreading') {
            ctx.strokeStyle = `rgba(251, 191, 36, ${alpha})`;
          } else {
            ctx.strokeStyle = `rgba(156, 163, 175, ${alpha * 0.5})`;
          }
          
          ctx.beginPath();
          ctx.moveTo(a1.x, a1.y);
          ctx.lineTo(a2.x, a2.y);
          ctx.stroke();
        }
      }
    }
  }

  /**
   * Ondes de propagation
   */
  drawWaves(ctx, agents, range) {
    for (const agent of agents) {
      if (agent.state !== 'spreading') continue;
      
      // Onde de transmission
      if (agent.waveRadius > 0) {
        const alpha = (1 - agent.waveRadius / (range * 1.2)) * 0.4;
        if (alpha > 0) {
          // Couleur selon conviction
          const intensity = agent.convictionLevel;
          ctx.strokeStyle = `rgba(239, ${Math.round(68 + (1 - intensity) * 100)}, 68, ${alpha})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(agent.x, agent.y, agent.waveRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      
      // Zone d'influence (très subtile)
      const gradient = ctx.createRadialGradient(
        agent.x, agent.y, 0,
        agent.x, agent.y, range
      );
      gradient.addColorStop(0, `rgba(239, 68, 68, ${0.08 * agent.convictionLevel})`);
      gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(agent.x, agent.y, range, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Dessiner tous les agents
   */
  drawAgents(ctx, agents, simulation) {
    // Trier par Y pour l'effet de profondeur
    const sorted = [...agents].sort((a, b) => a.y - b.y);
    
    for (const agent of sorted) {
      this.drawAgent(ctx, agent, simulation);
    }
  }

  /**
   * Dessiner un agent
   */
  drawAgent(ctx, agent, simulation) {
    const x = agent.x;
    const y = agent.y;
    const radius = agent.getRadius();
    const color = agent.getColor();
    const personalityColor = agent.getPersonalityColor();
    
    // Ombre
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.arc(x + 2, y + 2, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Halo d'influenceur
    if (agent.isInfluencer) {
      const gradient = ctx.createRadialGradient(x, y, radius, x, y, radius * 4);
      gradient.addColorStop(0, 'rgba(255, 215, 0, 0.5)');
      gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.2)');
      gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius * 4, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Halo selon l'état
    if (agent.state === 'spreading') {
      const gradient = ctx.createRadialGradient(x, y, radius, x, y, radius * 2.5);
      gradient.addColorStop(0, `rgba(239, 68, 68, ${0.4 * agent.convictionLevel})`);
      gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius * 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (agent.state === 'informed') {
      const gradient = ctx.createRadialGradient(x, y, radius, x, y, radius * 1.8);
      gradient.addColorStop(0, `rgba(251, 191, 36, ${0.3 * agent.convictionLevel})`);
      gradient.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius * 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Corps principal
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Bordure selon personnalité
    ctx.strokeStyle = personalityColor;
    ctx.lineWidth = agent.personality === 'skeptic' ? 2.5 : 1.5;
    ctx.stroke();
    
    // Indicateur de pont (agent qui relie les groupes)
    if (agent.isBridge) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // Point central (conviction)
    if (agent.state !== 'ignorant') {
      const centerRadius = radius * 0.35 * agent.convictionLevel;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.arc(x, y, centerRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Badge d'expositions (si plusieurs)
    if (agent.exposures >= CONFIG.EXPOSURES_TO_CONVINCED) {
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 8px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('★', x, y - radius - 4);
    }
  }

  /**
   * Indicateur de chaleur de l'info
   */
  drawHeatIndicator(ctx, simulation) {
    if (!simulation.info) return;
    
    const heat = simulation.info.heat;
    const x = 15;
    const y = CONFIG.CANVAS_HEIGHT - 100;
    const width = 8;
    const height = 80;
    
    // Fond
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.roundRect(x - 2, y - 2, width + 4, height + 4, 5);
    ctx.fill();
    
    // Barre vide
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 3);
    ctx.fill();
    
    // Barre de chaleur
    const fillHeight = height * heat;
    const gradient = ctx.createLinearGradient(x, y + height, x, y);
    gradient.addColorStop(0, CONFIG.COLORS.cold);
    gradient.addColorStop(0.3, CONFIG.COLORS.cool);
    gradient.addColorStop(0.6, CONFIG.COLORS.warm);
    gradient.addColorStop(1, CONFIG.COLORS.hot);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(x, y + height - fillHeight, width, fillHeight, 3);
    ctx.fill();
    
    // Label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '9px system-ui';
    ctx.textAlign = 'center';
    ctx.save();
    ctx.translate(x + width / 2, y - 8);
    ctx.fillText('🌡️', 0, 0);
    ctx.restore();
  }

  /**
   * Flash d'événement
   */
  drawEventFlash(ctx) {
    if (!this.eventColor) return;
    
    ctx.fillStyle = this.eventColor;
    ctx.globalAlpha = this.eventFlash * 0.3;
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    ctx.globalAlpha = 1;
  }

  /**
   * Déclencher un flash d'événement
   */
  triggerEventFlash(eventType) {
    this.eventFlash = 1;
    
    switch (eventType) {
      case 'positive':
        this.eventColor = 'rgba(34, 197, 94, 1)';
        break;
      case 'negative':
        this.eventColor = 'rgba(239, 68, 68, 1)';
        break;
      default:
        this.eventColor = 'rgba(59, 130, 246, 1)';
    }
  }

  /**
   * Indicateur de portée au survol
   */
  drawRangeIndicator(ctx, agent, range) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(agent.x, agent.y, range, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Traduction des personnalités
    const personalityNames = {
      receptive: 'Réceptif',
      skeptic: 'Sceptique',
      social: 'Bavard',
      introvert: 'Introverti',
    };
    
    // Traduction des états
    const stateNames = {
      ignorant: 'Ignorant',
      informed: 'Informé',
      spreading: 'Diffuseur',
      saturated: 'Saturé',
      forgotten: 'Oublié',
    };
    
    // Info sur l'agent
    const info = [
      `${personalityNames[agent.personality]} • ${stateNames[agent.state]}`,
      `Réceptivité: ${Math.round(agent.receptivity * 100)}%`,
      `Scepticisme: ${Math.round(agent.skepticism * 100)}%`,
      `Sociabilité: ${Math.round(agent.socialness * 100)}%`,
      `Crédibilité: ${Math.round(agent.credibility * 100)}%`,
      agent.convictionLevel > 0 ? `Conviction: ${Math.round(agent.convictionLevel * 100)}%` : '',
    ].filter(Boolean);
    
    const boxHeight = 15 + info.length * 15;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.beginPath();
    ctx.roundRect(agent.x + 15, agent.y - 55, 145, boxHeight, 5);
    ctx.fill();
    
    ctx.fillStyle = '#fff';
    ctx.font = '10px system-ui';
    ctx.textAlign = 'left';
    info.forEach((text, i) => {
      ctx.fillText(text, agent.x + 22, agent.y - 40 + i * 15);
    });
  }

  /**
   * Trouver l'agent sous la souris
   */
  getAgentAt(x, y, agents) {
    for (const agent of agents) {
      const dist = Math.sqrt((agent.x - x) ** 2 + (agent.y - y) ** 2);
      if (dist < 15) {
        return agent;
      }
    }
    return null;
  }

  /**
   * Mettre à jour la position de survol
   */
  setHover(agent) {
    this.hoverAgent = agent;
    this.showRange = agent !== null;
  }
}