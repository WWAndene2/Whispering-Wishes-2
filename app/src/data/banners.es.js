// @ts-check
// Spanish overlay for banners.js. Covers the same display-only fields as banners.fr.js
// (banner titles, EVENTS name/subtitle/description) plus the v3.7 events banners.fr.js does not
// list yet. resetType/rewards/color/gradient/accentColor stay untouched for the same reasons
// documented in banners.fr.js (regex-parsed reset cycles, numeric reward parsing, Tailwind classes).
// Names follow the official Spanish terms: Pódcast pionero, Holograma táctico, Placa ondulada,
// Campo Tácito, Reino ilusorio, Torre de la adversidad.

export const CURRENT_BANNER_TITLES_ES = {
  'Where Santu Beckons': 'Donde Santu llama',
  'Thousand Futures Mirrored in Snow': 'Mil futuros reflejados en la nieve',
  'Distant May the Starlights Be': 'Lejanas sean las luces de las estrellas',
};

// Standard (permanent) banner titles — TrackerTab.jsx.
export const STANDARD_BANNER_TITLES_ES = {
  'Tidal Chorus': 'Coro de las mareas',
  'Winter Brume': 'Bruma invernal',
};

export const EVENTS_ES = {
  dailyReset: { name: 'Reinicio diario', subtitle: 'Actividades diarias y Campos Tácitos', description: 'Reinicio de las actividades diarias' },
  weeklyBoss: { name: 'Jefe semanal', subtitle: 'Vestigios resonantes', description: 'Reinicio de las recompensas semanales de jefes' },
  illusiveRealm: { name: 'Fantasías de las mil puertas', subtitle: 'Modo roguelike', description: 'Reinicio semanal de recompensas' },
  pioneerPodcast: { name: 'Pódcast pionero', subtitle: 'Evento', description: 'Evento por tiempo limitado' },
  tacticalHologram: { name: 'Holograma táctico: Simulación', subtitle: 'Desafío de combate', description: 'Desafío de combate permanente: Arena de simulación, añadida en la v3.6' },
  endstateMatrix: { name: 'Matriz de estado final', subtitle: 'Sucesión de jefes', description: 'Sucesión de jefes de alta dificultad: novedad de la v3.2' },
  towerOfAdversity: { name: 'Torre de la adversidad: Peligro revisitado', subtitle: 'Desafío de fin de juego', description: 'Desafío de combate de fin de juego' },
  whimperingWastes: { name: 'Yermos gimientes', subtitle: 'Aguas renacientes', description: 'Desafío de combate con sistema de fichas' },
  giftsOfDriftingMist: { name: 'Regalos de la Niebla Errante', subtitle: 'Evento de inicio de sesión de 7 días', description: 'Durante el evento, inicia sesión para reclamar las recompensas de inicio de sesión del día desde la página del evento.' },
  bountifulCrescendo: { name: 'Crescendo abundante', subtitle: 'Evento por tiempo limitado de doble botín de materiales', description: 'Gasta Placas onduladas para reclamar recompensas dobles tras completar desafíos de obtención de materiales aptos.' },
  resonanceSimRealm: { name: 'Reino de simulación de resonancia', subtitle: 'Evento de combate', description: 'Nuevo evento de combate por tiempo limitado de la v3.6.' },
  secondComingOfSolaris: { name: 'Segunda llegada de Solaris: Engaño codificado', subtitle: 'Evento de ocio', description: 'Nuevo evento de ocio por tiempo limitado de la v3.6.' },
  theStringsRemember: { name: 'Las cuerdas recuerdan', subtitle: 'Evento de ocio', description: 'Nuevo evento de ocio por tiempo limitado de la v3.6.' },
  ifDreamsStillReverberate: { name: 'Si los sueños aún resuenan', subtitle: 'Evento de combate cooperativo destacado', description: 'Nuevo evento de combate cooperativo por tiempo limitado de la v3.6.' },
  fogveilPagoda: { name: 'Evento de exploración destacado: Pagoda del Velo de Niebla', subtitle: 'Evento de exploración', description: 'Nuevo evento de exploración por tiempo limitado de la v3.6.' },
  chordCleansing: { name: 'Purificación de acordes', subtitle: 'Evento por tiempo limitado de doble botín de Ecos', description: 'Gasta Placas onduladas para reclamar recompensas dobles tras completar un desafío de supresión Tácita.' },
  giftsOfWakingMoon: { name: 'Regalos de la Luna Despierta', subtitle: 'Evento de inicio de sesión de 7 días', description: 'Durante el evento, inicia sesión para reclamar las recompensas de inicio de sesión del día desde la página del evento.' },
  backToSolaris: { name: 'De vuelta a Solaris', subtitle: 'Evento web', description: 'Evento web por tiempo limitado de la v3.7.' },
  dreamsInTheCapsuleArea: { name: 'Sueños en la zona de cápsulas', subtitle: 'Evento de exploración', description: 'Evento de exploración por tiempo limitado de la v3.7.' },
  cubieWars: { name: 'Guerra de los Cubie', subtitle: 'Evento de ocio', description: 'Evento de ocio por tiempo limitado de la v3.7.' },
  artisansSearch: { name: 'La búsqueda del artesano', subtitle: 'Evento de combate destacado', description: 'Evento de combate por tiempo limitado de la v3.7.' },
  wakingMoonFishing: { name: 'Pesca de la Luna Despierta', subtitle: 'Evento web', description: 'Evento web por tiempo limitado de la v3.7.' },
  echoErase: { name: 'Borrado de Ecos', subtitle: 'Evento de ocio', description: 'Evento de ocio por tiempo limitado de la v3.7.' },
  giftsOfSingingDrizzle: { name: 'Regalos de la Llovizna Cantora', subtitle: 'Evento de inicio de sesión por tiempo limitado', description: 'Durante el evento, inicia sesión para reclamar las recompensas de inicio de sesión del día desde la página del evento.' },
  beyondTheWavesXuanfang: { name: 'Más allá de las olas: Tierra de Xuanfang', subtitle: 'Evento de exploración destacado', description: 'Evento de exploración por tiempo limitado de la v3.7.' },
};
