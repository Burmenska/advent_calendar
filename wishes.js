/** General, warm Christmas wishes. A calendar keeps 24 of these, chosen once. */
export const WISHES = [
  "May your days be slow in the best way, with warm light in the evenings and something sweet nearby.",
  "Wishing you a December that feels soft around the edges.",
  "May you find a small reason to smile before the day asks anything of you.",
  "Hoping this month brings you closer to the people who feel like home.",
  "May your home be warm, your mornings unhurried, and your cup always full.",
  "Wishing you music in the background, a good coat, and streets that sparkle a little.",
  "May you be looked after this month, in ordinary and quiet ways.",
  "Hope you get at least one evening with nowhere to be.",
  "Wishing you laughter that arrives before you expect it.",
  "May the dark come early and the light inside stay on.",
  "Hoping this month leaves you feeling held.",
  "May you taste something wonderful and think of someone you love.",
  "Wishing you patience, a good story, and time to finish it.",
  "May kindness find you in line, in traffic, and at the table.",
  "Hope your December has room for both rest and a little magic.",
  "Wishing you windows fogged from cooking and people you are glad to see.",
  "May you be proud of the year you carried, and gentle with what you could not.",
  "Hoping a familiar song catches you at the right moment.",
  "May you wake up one morning and feel simply glad.",
  "Wishing you warm hands, cold air, and a walk that clears your head.",
  "May someone save you the best seat, the best bite, or the last biscuit.",
  "Hope you let yourself want something lovely this month.",
  "Wishing you peace where you need it, and noise and joy where you don't.",
  "May the year close softly, with you in it, exactly as you are.",
  "Wishing you a table with room to stay a little longer.",
  "May small lights be enough.",
  "Hope you receive one message that makes the whole day kinder.",
  "Wishing you unplanned joy, the kind you don't have to dress up for.",
  "May you feel at home somewhere this December.",
  "Hope the season gives you back more than it asks.",
  "Wishing you good sleep, good news, and a pocket of ordinary luck.",
  "May you be surrounded by warmth you don't have to earn."
];

export function pickWishes(random = Math.random) {
  const pool = [...WISHES];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 24);
}
