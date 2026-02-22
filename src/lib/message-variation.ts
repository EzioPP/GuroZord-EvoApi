//To avoid getting banned
const greetings = ['Olá', 'Oi', 'Eae', 'Boa'];
const emojis = ['😊', '✅', '👋', '🙌', '😄', '👍', '🎉'];

const random = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const randomVariation = (message: string): string => {
  const greeting = random(greetings);
  const emoji = random(emojis);
  return `${greeting}, ${message}\n${emoji}`;
};
