// ═══════════════════════════════════════════════════════════════════════════════
// WHISPERING WISHES — data/banners.fr.js
// French overlay for banners.js. ONLY covers fields that are purely
// display text with no functional/parsing consumers:
//   - CURRENT_BANNERS.characters[].title / CURRENT_BANNERS.weapons[].title
//     (rendered as-is in shared/components/BannerCard.jsx)
//   - EVENTS[key].name / .subtitle / .description
//     (rendered as-is in features/events/EventCard.jsx and EventsTab.jsx)
//
// Explicitly NOT translated (documented functional-risk gaps, consistent with
// the pattern used in echoes.js/weapons.js/achievements.js/characters.js):
//   - EVENTS[key].resetType — parsed by a regex in EventCard.jsx
//     (`/^~?\d+\s*(days?|d|h|m)?$/i`) to detect recurring events and drive
//     countdown-timer logic (getRecurringEventEnd). Translating "28 days" to
//     "28 jours" would silently break that regex and the countdown feature.
//   - EVENTS[key].rewards — free-form text (e.g. "60 Astrite", "Boss
//     Materials") read via parseInt() in EventsTab.jsx, which only consumes
//     the leading digits, but is also displayed as a raw badge; left in
//     English to avoid any risk to the numeric parsing path.
//   - .color / .gradient / .accentColor — Tailwind class fragments, not text.
//   - Character/weapon/version proper nouns everywhere in this file (banner
//     history entries, character/weapon theme names, version splash-screen
//     titles like "Reverbs From The End of Galaxies", arena codenames) are
//     kept as official English names, matching the convention already
//     established for CHARACTER_DATA/WEAPON_DATA keys — these are titles,
//     not translatable prose, and would require per-item verification against
//     Kuro's official French naming that is out of scope here.
// ═══════════════════════════════════════════════════════════════════════════════

// Only the CURRENT (v3.6-p2) banner's characters[].title values belong here.
export const CURRENT_BANNER_TITLES_FR = {
  'Where Santu Beckons': 'Là où Santu appelle',
  'Thousand Futures Mirrored in Snow': 'Mille futurs reflétés dans la neige',
  'Distant May the Starlights Be': 'Aussi lointaines soit les étoiles',
};

// Standard (permanent) banner titles — TrackerTab.jsx.
export const STANDARD_BANNER_TITLES_FR = {
  'Tidal Chorus': 'Chorale des vagues',
  'Winter Brume': "Brume d'hiver",
};

export const EVENTS_FR = {
  dailyReset: {
    name: 'Réinitialisation quotidienne',
    subtitle: 'Activités quotidiennes et Champs Tacet',
    description: 'Réinitialisation des activités quotidiennes',
  },
  weeklyBoss: {
    name: 'Boss hebdomadaire',
    subtitle: 'Vestiges résonants',
    description: 'Réinitialisation des récompenses de boss hebdomadaires',
  },
  illusiveRealm: {
    name: 'Fantaisies des mille portes',
    subtitle: 'Mode Rogue-like',
    description: 'Réinitialisation hebdomadaire des récompenses',
  },
  pioneerPodcast: {
    name: 'Podcast du Pionnier',
    subtitle: 'Événement',
    description: 'Événement à durée limitée',
  },
  tacticalHologram: {
    name: 'Hologramme tactique : Simulation',
    subtitle: 'Défi de combat',
    description: 'Défi de combat permanent — Arène de simulation, ajoutée en v3.6',
  },
  endstateMatrix: {
    name: 'Matrice de fin d’état',
    subtitle: 'Enchaînement de boss',
    description: 'Enchaînement de boss haute difficulté — nouveau en v3.2',
  },
  towerOfAdversity: {
    name: 'Tour de l’Adversité : Péril Revisité',
    subtitle: 'Défi de fin de jeu',
    description: 'Défi de combat de fin de jeu',
  },
  whimperingWastes: {
    name: 'Landes Gémissantes',
    subtitle: 'Eaux Renaissantes',
    description: 'Défi de combat avec système de jetons',
  },
  giftsOfDriftingMist: {
    name: 'Cadeaux de la Brume Errante',
    subtitle: 'Événement de connexion sur 7 jours',
    description: 'Pendant l’événement, connectez-vous pour réclamer les récompenses de connexion du jour depuis la page de l’événement.',
  },
  bountifulCrescendo: {
    name: 'Crescendo Abondant',
    subtitle: 'Événement de double récompense de matériaux à durée limitée',
    description: 'Dépensez des Plaques d’Ondes pour réclamer des récompenses doublées après avoir terminé un défi de récolte de matériaux éligible.',
  },
  resonanceSimRealm: {
    name: 'Domaine de Simulation Résonante',
    subtitle: 'Événement de combat',
    description: 'Nouvel événement de combat à durée limitée de la v3.6.',
  },
  secondComingOfSolaris: {
    name: 'Second Avènement de Solaris : Tromperie Codée',
    subtitle: 'Événement de détente',
    description: 'Nouvel événement de détente à durée limitée de la v3.6.',
  },
  theStringsRemember: {
    name: 'Les Cordes se Souviennent',
    subtitle: 'Événement de détente',
    description: 'Nouvel événement de détente à durée limitée de la v3.6.',
  },
  ifDreamsStillReverberate: {
    name: 'Si les Rêves Résonnent Encore',
    subtitle: 'Événement de combat coopératif',
    description: 'Nouvel événement de combat coopératif à durée limitée de la v3.6.',
  },
  fogveilPagoda: {
    name: 'Événement d’exploration : Pagode de Brume',
    subtitle: 'Événement d’exploration',
    description: 'Nouvel événement d’exploration à durée limitée de la v3.6.',
  },
  chordCleansing: {
    name: 'Purification d’Accord',
    subtitle: 'Événement à durée limitée de double récompense d’Échos',
    description: 'Dépensez des Plaques d’Ondes pour réclamer des récompenses doublées après avoir terminé un défi de Suppression Tacet.',
  },  giftsOfWakingMoon: {
    name: 'Cadeaux de la Lune Éveillée',
    subtitle: 'Événement de connexion sur 7 jours',
    description: 'Pendant l’événement, connectez-vous pour réclamer les récompenses de connexion du jour depuis la page de l’événement.',
  },
  backToSolaris: {
    name: 'Retour à Solaris',
    subtitle: 'Événement web',
    description: 'Événement web à durée limitée de la v3.7.',
  },
  dreamsInTheCapsuleArea: {
    name: 'Rêves dans la Capsule',
    subtitle: 'Événement d’exploration',
    description: 'Explorez les Royaumes du Cœur de Mengzhou, refaçonnés par la Cour de Savantae et Hsin, et récoltez des Verrous chiffrés CSC.',
  },
  cubieWars: {
    name: 'Guerre des Cubie',
    subtitle: 'Événement de détente',
    description: 'Les Guerriers Cubie s’affrontent avec des objets magiques sur la Scène Laineuse bâtie par Encore et le Second Avènement de Solaris.',
  },
  moonlitPath: {
    name: 'Sentier au Clair de Lune',
    subtitle: 'Événement',
    description: 'Obtenez des Anneaux lunaires pour atteindre des paliers de récompenses, dont un Résonateur au choix.',
  },
  bloomsForTheShadow: {
    name: 'Floraisons pour l’Ombre',
    subtitle: 'Événement de détente permanent',
    description: 'Rencontrez l’Ombre du Renard du Nexus qui surplombe le Nexus du Simulacre de Mengzhou. Débloqué par la quête principale « Simulacre du Cœur ».',
  },
  pastDreamsTracedSeals: {
    name: 'Rêves passés, Sceaux retracés',
    subtitle: 'Événement de détente permanent',
    description: 'Accompagnez Suoming pour consigner les paysages du Nexus du Simulacre de Mengzhou et les souvenirs longtemps scellés du Pacte des Dix Sceaux.',
  },
  artisansSearch: {
    name: 'La Quête de l’Artisan',
    subtitle: 'Événement de combat',
    description: 'Affrontez des vagues d’ennemis dans une Sphère Sonore spéciale, contre la montre et avec des bonus uniques. Infligez des dégâts pour gagner des Pièces, perdez-en en étant touché ; chaque vague vaincue ajoute du temps.',
  },
  wakingMoonFishing: {
    name: 'Pêche de la Lune Éveillée',
    subtitle: 'Événement web',
    description: 'Relevez les niveaux et accomplissez les tâches de l’événement pour gagner de l’Astrite, des Crédits Coquillage, des Tubes scellés avancés et d’autres récompenses.',
  },
  echoErase: {
    name: 'Effacement d’Échos',
    subtitle: 'Événement de détente',
    description: 'Un nouveau niveau s’ouvre chaque jour, en Facile et Difficile : terminez le Facile pour débloquer le Difficile, et remplissez les objectifs de chaque niveau pour les récompenses.',
  },
  giftsOfSingingDrizzle: {
    name: 'Cadeaux de la Bruine Chantante',
    subtitle: 'Événement de connexion à durée limitée',
    description: 'Pendant l’événement, connectez-vous pour réclamer les récompenses de connexion du jour depuis la page de l’événement.',
  },
  beyondTheWavesXuanfang: {
    name: 'Au-delà des Vagues : Terre de Xuanfang',
    subtitle: 'Événement d’exploration',
    description: 'Accomplissez les tâches de l’événement une fois par jour pour obtenir des Journaux d’aventure et échangez-les contre des Colis d’aventure ; récupérez toutes les livraisons d’un Inventaire pour débloquer le suivant (3 au total).',
  },
};
