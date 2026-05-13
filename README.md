# 🧪 InfoSpread Lab

**Simulateur scientifique de propagation d'information**

InfoSpread Lab est une simulation interactive qui modélise comment une information (vraie ou fausse) se propage dans une population. Le projet explore les dynamiques sociales, l'effet des personnalités, des bulles sociales et de la déformation de l'information.

![Version](https://img.shields.io/badge/version-1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 🎯 Objectifs scientifiques

Ce simulateur permet d'explorer plusieurs questions de recherche :

- **Viralité** : Quel seuil de viralité rend une info virale ?
- **Scepticisme** : Les sceptiques peuvent-ils bloquer les fake news ?
- **Bulles sociales** : Les groupes isolés ralentissent-ils la diffusion ?
- **Influenceurs** : Quel impact a un super-diffuseur ?
- **Vérité vs Fake** : Une info vraie se propage-t-elle différemment ?

---

## 🚀 Installation

1. **Cloner ou télécharger** le projet
2. **Ouvrir** `index.html` dans un navigateur moderne
3. C'est tout ! Aucune dépendance externe requise.

```bash
# Structure du projet
infospread/
├── index.html          # Page principale
├── README.md           # Ce fichier
└── src/
    ├── main.js         # Point d'entrée
    ├── config.js       # Configuration et paramètres
    ├── App.js          # Orchestrateur principal
    ├── Simulation.js   # Logique de propagation
    ├── Agent.js        # Classe des agents
    ├── Renderer.js     # Rendu graphique (Canvas)
    ├── UI.js           # Interface utilisateur
    └── style.css       # Styles
```

---

## 🎮 Utilisation

### Démarrage rapide

1. **Choisir une expérience** dans le menu déroulant (ou rester en Mode Libre)
2. **Ajuster les paramètres** : viralité, vérité, population, portée
3. **Cliquer sur un agent** pour démarrer la propagation
4. **Observer** la diffusion et les statistiques en temps réel
5. **Analyser** les conclusions automatiques à la fin

### Contrôles

| Touche/Bouton | Action |
|---------------|--------|
| `Espace` | Play/Pause |
| `▶️` | Lancer/Pause |
| `🔄` | Reset |
| `1x/2x/4x` | Vitesse de simulation |
| `🔁 Relancer` | Même paramètres |
| `🎲 Variante` | Paramètres légèrement modifiés |

---

## 🧠 Concepts clés

### États des agents

| État | Couleur | Description |
|------|---------|-------------|
| **Ignorant** | Gris | N'a pas reçu l'information |
| **Informé** | Jaune | A reçu l'info, ne diffuse pas encore |
| **Diffuseur** | Rouge | Diffuse activement l'information |
| **Saturé** | Gris-brun | Lassé, ne diffuse plus |

### Personnalités

| Type | Bordure | Comportement |
|------|---------|--------------|
| **Réceptif** | Verte | Accepte facilement, peu sceptique |
| **Sceptique** | Bleue | Difficile à convaincre, détecte les fakes |
| **Bavard** | Orange | Diffuse beaucoup, grande portée |
| **Introverti** | Grise | Diffuse peu même s'il sait |

### Indicateurs

| Indicateur | Description |
|------------|-------------|
| **🌡️ Chaleur** | Intérêt pour l'info (diminue avec le temps) |
| **✅ Vérité** | Niveau de véracité (0% = fake, 100% = vrai) |
| **🔀 Déformation** | Transformation de l'info en circulant |
| **💪 Conviction** | Niveau moyen de croyance des informés |

### Groupes sociaux

La population est divisée en 3 groupes (A, B, C) visualisés par des zones colorées :
- **Intra-groupe** : Transmission facilitée (×2.5)
- **Inter-groupes** : Transmission difficile (×0.25)
- **Agents "ponts"** : Connectent les groupes (bordure pointillée)

---

## 🔬 Expériences prédéfinies

| Expérience | Question de recherche |
|------------|----------------------|
| 🔥 **Viralité explosive** | Quel seuil déclenche une propagation massive ? |
| 🧐 **Société sceptique** | Les sceptiques bloquent-ils les fake news ? |
| 🫧 **Bulles sociales** | Les groupes isolés ralentissent-ils la diffusion ? |
| 🎤 **Influenceurs** | Quel impact a un super-diffuseur ? |
| ✅ **Vérité vs Fake** | Une info vraie se propage-t-elle moins vite ? |
| ⚖️ **Comparaison A/B** | Comparer deux scénarios côte à côte |

---

## 📊 Mécanique de propagation

### Formule de transmission

```
probabilité = base 
  × viralité 
  × chaleur 
  × (1 - distance/portée)^1.5
  × réceptivité_cible 
  × (1 - scepticisme × 0.8)
  × puissance_source
  × bonus_groupe
  × bonus_répétition
  × multiplicateur_événement
```

### Effet de la déformation

Quand l'info est déformée (>30%) :
- **Viralité** : +50% (sensationnalisme)
- **Crédibilité** : -40% (moins fiable)
- **Sceptiques** : Détectent mieux l'info déformée

### Événements aléatoires

| Événement | Effet |
|-----------|-------|
| 📰 Média en parle | Viralité ×2.5, chaleur +40% |
| 🔇 Censure | Viralité ×0.3, chaleur -15% |
| 🎤 Influenceur | Un agent devient super-diffuseur |
| 😴 Fatigue médiatique | Accélère la saturation |
| 🔥 Scandale | Viralité ×3.5, chaleur +50% |
| ✅ Fact-check | Réduit conviction des non-convaincus |

---

## 📈 Conclusions automatiques

À la fin de chaque simulation, le système génère des conclusions basées sur :

- **Pourcentage touché** (basé sur le pic, pas l'état final)
- **Vitesse de propagation**
- **Niveau de déformation**
- **Efficacité vérité/fake**
- **Effet des bulles sociales**

Exemple de conclusion :
```
📈 Propagation massive : 78% de la population a été touchée
⚡ Vitesse explosive : 50% atteint en 12s
🔀 Forte déformation : l'info s'est beaucoup transformée
⚠️ Fake news efficace : une info peu fiable a largement circulé

→ Une info virale mais peu crédible se déforme rapidement.
```

---

## ⚙️ Configuration

Les paramètres sont modifiables dans `src/config.js` :

```javascript
// Propagation
BASE_TRANSMISSION_CHANCE: 0.025,
DEFAULT_VIRALITY: 0.5,
DEFAULT_RANGE: 60,

// Temps (en frames, 60fps)
TIME_TO_SPREAD: 90,      // ~1.5s pour devenir diffuseur
TIME_TO_SATURATED: 900,  // ~15s avant saturation
TIME_TO_FORGOTTEN: 1800, // ~30s avant oubli

// Groupes
SAME_GROUP_BONUS: 2.5,
DIFF_GROUP_PENALTY: 0.25,

// Déformation
INFO_DISTORTION_RATE: 0.08,
DISTORTION_VIRALITY_BOOST: 0.3,
```

---

## 🛠️ Technologies

- **Vanilla JavaScript** (ES6 modules)
- **Canvas API** pour le rendu
- **CSS3** pour l'interface
- Aucune dépendance externe

---

## 📚 Inspirations théoriques

- Modèles épidémiologiques (SIR, SIS)
- Théorie des réseaux sociaux
- Dynamique des rumeurs
- Économie comportementale
- Études sur la désinformation

---

## 🤝 Contribution

Les contributions sont bienvenues ! Idées d'amélioration :

- [ ] Export des données en CSV
- [ ] Graphiques d'évolution détaillés
- [ ] Mode "multi-infos" (plusieurs sources concurrentes)
- [ ] Sauvegarde/chargement de scénarios
- [ ] Réseau social configurable (pas seulement spatial)

---

## 📄 Licence

MIT License - Libre d'utilisation, modification et distribution.

---

## 👤 Auteur

Projet développé dans le cadre d'une exploration des dynamiques de propagation d'information.

---

*InfoSpread Lab v1.0 - Simulateur scientifique de propagation d'information*