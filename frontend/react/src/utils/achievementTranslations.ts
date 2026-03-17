/**
 * Achievement Translations
 * Maps achievement API names to Portuguese translations (title and description)
 * Falls back to English if translation not found
 */

interface AchievementTranslation {
  name: string;
  description: string;
}

type AchievementTranslationMap = Record<string, AchievementTranslation>;

export const achievementTranslations: AchievementTranslationMap = {
  // ============ GENERIC/COMMON ACHIEVEMENTS ============

  // First Steps
  "FIRST_ACHIEVEMENT": {
    name: "Primeira Conquista",
    description: "Desbloqueie sua primeira conquista",
  },

  "WELCOME": {
    name: "Bem-vindo",
    description: "Comece o jogo",
  },

  "GETTING_STARTED": {
    name: "Começando",
    description: "Conclua o primeiro objetivo",
  },

  // Progression
  "HALFWAY": {
    name: "Meio do Caminho",
    description: "Complete 50% do jogo",
  },

  "ALMOST_THERE": {
    name: "Quase Lá",
    description: "Complete 75% do jogo",
  },

  "COMPLETION": {
    name: "Conclusão",
    description: "Complete o jogo",
  },

  // Difficulty
  "EASY_MODE": {
    name: "Aprendiz",
    description: "Complete o jogo no modo fácil",
  },

  "NORMAL_MODE": {
    name: "Guerreiro",
    description: "Complete o jogo no modo normal",
  },

  "HARD_MODE": {
    name: "Desafiador",
    description: "Complete o jogo no modo difícil",
  },

  "NIGHTMARE_MODE": {
    name: "Pesadelo",
    description: "Complete o jogo no modo pesadelo",
  },

  "IMPOSSIBLE_MODE": {
    name: "Impossível",
    description: "Complete o jogo no modo impossível",
  },

  // Boss Fights
  "FIRST_BOSS": {
    name: "Primeira Vitória",
    description: "Derrote o primeiro chefe",
  },

  "DEFEAT_BOSS": {
    name: "Exterminador de Chefes",
    description: "Derrote um chefe",
  },

  "ALL_BOSSES": {
    name: "Destruidor de Chefes",
    description: "Derrote todos os chefes",
  },

  "BOSS_SPEEDRUN": {
    name: "Rápido Demais",
    description: "Derrote um chefe rapidamente",
  },

  // Collectibles
  "COLLECTOR": {
    name: "Colecionador",
    description: "Colete 10 itens secretos",
  },

  "PACK_RAT": {
    name: "Acumulador",
    description: "Colete todos os itens secretos",
  },

  "FIND_TREASURE": {
    name: "Tesouro Encontrado",
    description: "Encontre um tesouro oculto",
  },

  "ALL_SECRETS": {
    name: "Segredos Revelados",
    description: "Encontre todos os segredos",
  },

  // Exploration
  "EXPLORER": {
    name: "Explorador",
    description: "Explore todas as áreas",
  },

  "MAP_COMPLETE": {
    name: "Cartógrafo",
    description: "Revele todo o mapa",
  },

  "ISOLATED": {
    name: "Isolado",
    description: "Encontre um local secreto",
  },

  // Combat
  "FIRST_KILL": {
    name: "Primeiro Sangue",
    description: "Derrote seu primeiro inimigo",
  },

  "KILLS_100": {
    name: "Campeão",
    description: "Derrote 100 inimigos",
  },

  "KILLS_500": {
    name: "Aniquilador",
    description: "Derrote 500 inimigos",
  },

  "KILLS_1000": {
    name: "Máquina de Morte",
    description: "Derrote 1000 inimigos",
  },

  "NO_DAMAGE": {
    name: "Intocável",
    description: "Derrote um inimigo sem sofrer danos",
  },

  "DOUBLE_KILL": {
    name: "Duplo Golpe",
    description: "Derrote 2 inimigos rapidamente",
  },

  // Speed Challenges
  "SPEEDRUNNER": {
    name: "Velocista",
    description: "Complete o jogo em tempo recorde",
  },

  "UNDER_TIME": {
    name: "Contra o Tempo",
    description: "Complete uma seção rapidamente",
  },

  // Character/Story
  "MASTER": {
    name: "Mestre",
    description: "Domine todas as habilidades",
  },

  "SURVIVOR": {
    name: "Sobrevivente",
    description: "Sobreviva até o final",
  },

  "CHAMPION": {
    name: "Campeão",
    description: "Vença todos os desafios",
  },

  "LEGEND": {
    name: "Lenda",
    description: "Se torne uma lenda",
  },

  // Stealth
  "GHOST": {
    name: "Fantasma",
    description: "Complete uma seção sem ser detectado",
  },

  "SILENT_KILLER": {
    name: "Assassino Silencioso",
    description: "Derrote inimigos sem alertar outros",
  },

  // Puzzle/Logic
  "PUZZLE_MASTER": {
    name: "Mestre dos Quebra-cabeças",
    description: "Resolva todos os quebra-cabeças",
  },

  "QUICK_THINKER": {
    name: "Pensador Rápido",
    description: "Resolva um quebra-cabeça rapidamente",
  },

  // Wealth/Currency
  "RICH": {
    name: "Rico",
    description: "Acumule uma quantidade significativa de moeda",
  },

  "WEALTHY": {
    name: "Milionário",
    description: "Acumule uma grande riqueza",
  },

  "PAUPER": {
    name: "Mendigo",
    description: "Comece o jogo sem recursos",
  },

  // Miscellaneous
  "SLACKER": {
    name: "Preguiçoso",
    description: "Não faça nada por um tempo",
  },

  "COMPLETIONIST": {
    name: "Completista",
    description: "Desbloqueie todas as conquistas",
  },

  "100_PERCENT": {
    name: "Perfeição",
    description: "Complete o jogo a 100%",
  },

  "HIDDEN_TREASURE": {
    name: "Tesouro Escondido",
    description: "Desbloqueie um achievement oculto",
  },

  // Platform-specific (often used)
  "ACHIEVEMENT_25": {
    name: "Já Vencemos",
    description: "Desbloqueie 25 achievements",
  },

  "ACHIEVEMENT_50": {
    name: "Meia Vitória",
    description: "Desbloqueie 50 achievements",
  },

  "ACHIEVEMENT_75": {
    name: "Quase Completo",
    description: "Desbloqueie 75 achievements",
  },

  // Multiplayer (if applicable)
  "FIRST_ONLINE": {
    name: "Conectado",
    description: "Jogue sua primeira partida online",
  },

  "MATCHMAKER": {
    name: "Encontrador de Jogos",
    description: "Vença uma partida online",
  },

  // Add game-specific translations below in organized sections
  // Remember to document which game each section is for using comments
};

/**
 * Translates an achievement to Portuguese
 * If translation not found, returns the original English text
 * @param apiName - The API name/ID of the achievement
 * @param englishName - The original English name from Steam API
 * @param englishDescription - The original English description from Steam API
 * @returns Object with translated name and description, or originals if not found
 */
export function translateAchievement(
  apiName: string,
  englishName: string,
  englishDescription: string
): { name: string; description: string } {
  const translation = achievementTranslations[apiName];

  if (translation) {
    return {
      name: translation.name,
      description: translation.description,
    };
  }

  // If no translation found, return originals
  return {
    name: englishName,
    description: englishDescription,
  };
}

/**
 * Get translation or original text for achievement name
 */
export function getAchievementName(
  apiName: string,
  englishName: string
): string {
  const translation = achievementTranslations[apiName];
  return translation?.name || englishName;
}

/**
 * Get translation or original text for achievement description
 */
export function getAchievementDescription(
  apiName: string,
  englishDescription: string
): string {
  const translation = achievementTranslations[apiName];
  return translation?.description || englishDescription;
}

/**
 * Batch translate multiple achievements
 */
export function translateAchievements(
  achievements: Array<{
    id: string;
    name: string;
    description: string;
  }>
): Array<{
  id: string;
  name: string;
  description: string;
}> {
  return achievements.map((achievement) => ({
    ...achievement,
    ...translateAchievement(
      achievement.id,
      achievement.name,
      achievement.description
    ),
  }));
}
