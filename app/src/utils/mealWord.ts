export type Meal = "breakfast" | "lunch" | "dinner";

/**
 * The meal people are likely eating at a given time, so copy doesn't say
 * "lunch" at 8pm. Uses the device's local time.
 */
export function mealWord(at: Date | string = new Date()): Meal {
  const date = typeof at === "string" ? new Date(at) : at;
  const minutes = date.getHours() * 60 + date.getMinutes();

  if (minutes >= 4 * 60 && minutes < 10 * 60 + 30) return "breakfast";
  if (minutes >= 10 * 60 + 30 && minutes < 16 * 60) return "lunch";
  return "dinner";
}

export const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);
