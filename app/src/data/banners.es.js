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
  dreamsInTheCapsuleArea: { name: 'Sueños en la cápsula', subtitle: 'Evento de exploración destacado', description: 'Explora los Reinos del Corazón de Mengzhou, remodelados por la Corte de Savantae y Hsin, y reúne Candados cifrados CSC.' },
  cubieWars: { name: 'Guerra de los Cubie', subtitle: 'Evento de ocio destacado', description: 'Los Guerreros Cubie combaten con objetos mágicos en el Escenario Lanudo construido por Encore y la Segunda Llegada de Solaris.' },
  moonlitPath: { name: 'Sendero a la luz de la luna', subtitle: 'Evento destacado', description: 'Consigue Anillos lunares para alcanzar recompensas por hitos, incluido un Resonador a elección.' },
  bloomsForTheShadow: { name: 'Flores para la Sombra', subtitle: 'Evento de ocio permanente', description: 'Conoce a la Sombra del Zorro del Nexo que se alza sobre el Nexo del Simulacro de Mengzhou. Se desbloquea con la misión principal «Simulacro del Corazón».' },
  pastDreamsTracedSeals: { name: 'Sueños pasados, sellos trazados', subtitle: 'Evento de ocio permanente', description: 'Acompaña a Suoming a registrar los paisajes del Nexo del Simulacro de Mengzhou y los recuerdos largamente sellados del Pacto de los Diez Sellos.' },
  artisansSearch: { name: 'La búsqueda del artesano', subtitle: 'Evento de combate destacado', description: 'Combate oleadas de enemigos en una Esfera Sonora especial contra el reloj y con mejoras únicas. Inflige daño para reunir Monedas y piérdelas al recibirlo; superar una oleada da tiempo extra.' },
  wakingMoonFishing: { name: 'Pesca de la Luna Despierta', subtitle: 'Evento web', description: 'Supera fases y completa tareas del evento para ganar Astrita, Créditos de concha, Tubos sellados avanzados y otras recompensas.' },
  echoErase: { name: 'Borrado de Ecos', subtitle: 'Evento de ocio', description: 'Cada día se abre una fase nueva, en Fácil y Difícil: supera Fácil para desbloquear Difícil y cumple los objetivos de cada fase para obtener recompensas.' },
  giftsOfSingingDrizzle: { name: 'Regalos de la Llovizna Cantora', subtitle: 'Evento de inicio de sesión por tiempo limitado', description: 'Durante el evento, inicia sesión para reclamar las recompensas de inicio de sesión del día desde la página del evento.' },
  beyondTheWavesXuanfang: { name: 'Más allá de las olas: Tierra de Xuanfang', subtitle: 'Evento de exploración destacado', description: 'Completa tareas del evento una vez al día para obtener Diarios de aventura y cámbialos por Paquetes de aventura; reúne todas las entregas de un Inventario para desbloquear el siguiente (3 en total).' },
};

// Event reward wording (EventCard's reward badge), keyed by the English reward text fragment.
/** @type {Record<string, string>} */
export const EVENT_REWARD_TERMS_ES = {
  'Radiant Tide': 'Marea radiante',
  'Astrite': 'Astrita',
  'Boss Materials': 'Materiales de jefe',
  'Insider Channel': 'Canal interno',
};
