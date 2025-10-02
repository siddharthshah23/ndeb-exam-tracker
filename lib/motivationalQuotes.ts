export const motivationalQuotes = [
  "Every page you study brings you closer to your dream!",
  "Success is the sum of small efforts repeated day in and day out.",
  "You're doing amazing! Keep going!",
  "The expert in anything was once a beginner.",
  "Your hard work will pay off!",
  "Believe in yourself and all that you are.",
  "You've got this! One chapter at a time.",
  "Progress, not perfection.",
  "Your future patients are counting on you!",
  "Small steps every day lead to big results.",
  "You're stronger than you think!",
  "Knowledge is power, and you're building it every day.",
  "Don't stop when you're tired, stop when you're done!",
  "You're one day closer to becoming a dentist!",
  "Consistency is key. Keep showing up!",
];

export function getRandomQuote(): string {
  return motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
}

