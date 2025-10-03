export const motivationalQuotes = [
  "Like a butterfly, you're transforming into something beautiful 🦋",
  "Bloom where you are planted, and grow stronger every day 🌸",
  "Small steps every day - just like flowers grow petal by petal 🌺",
  "You are capable of amazing things, like a butterfly emerging from its cocoon 🦋",
  "Progress, not perfection - every flower blooms at its own pace 🌼",
  "Your hard work will blossom into beautiful results 🌷",
  "Like nature, you're constantly growing and evolving 🌿",
  "Success blooms from the seeds you plant today 🌻",
  "Dream big, work hard - watch your garden of knowledge grow 🌱",
  "You are stronger than you think, like a flower pushing through concrete 💪🌸",
  "Believe in your journey - every butterfly was once a caterpillar 🐛➡️🦋",
  "Keep blooming, even on cloudy days ☁️🌺",
  "Your dedication will blossom into success 🌷",
  "Like a garden, nurture your mind with knowledge every day 🌿",
  "Spread your wings and fly towards your dreams 🦋✨",
];

export function getRandomQuote(): string {
  return motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
}

