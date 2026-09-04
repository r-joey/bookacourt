export const SPORTS = [
  "Badminton",
  "Basketball",
  "Pickleball",
  "Tennis",
  "Volleyball",
  "Futsal",
  "Table Tennis",
] as const;

export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const SPORT_EMOJI: Record<string, string> = {
  Badminton: "🏸",
  Basketball: "🏀",
  Pickleball: "🥒",
  Tennis: "🎾",
  Volleyball: "🏐",
  Futsal: "⚽",
  "Table Tennis": "🏓",
};
