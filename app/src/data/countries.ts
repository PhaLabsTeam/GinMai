export interface Country {
  code: string; // dial code, e.g. "+66"
  country: string;
  flag: string;
}

// Where people in Chiang Mai tend to be from, shown before the full list
export const COMMON_COUNTRIES: Country[] = [
  { code: "+66", country: "Thailand", flag: "🇹🇭" },
  { code: "+1", country: "USA / Canada", flag: "🇺🇸" },
  { code: "+44", country: "United Kingdom", flag: "🇬🇧" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+31", country: "Netherlands", flag: "🇳🇱" },
  { code: "+7", country: "Russia", flag: "🇷🇺" },
  { code: "+86", country: "China", flag: "🇨🇳" },
  { code: "+81", country: "Japan", flag: "🇯🇵" },
  { code: "+82", country: "South Korea", flag: "🇰🇷" },
  { code: "+65", country: "Singapore", flag: "🇸🇬" },
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+972", country: "Israel", flag: "🇮🇱" },
];

const OTHER_COUNTRIES: Country[] = [
  { code: "+54", country: "Argentina", flag: "🇦🇷" },
  { code: "+43", country: "Austria", flag: "🇦🇹" },
  { code: "+880", country: "Bangladesh", flag: "🇧🇩" },
  { code: "+32", country: "Belgium", flag: "🇧🇪" },
  { code: "+55", country: "Brazil", flag: "🇧🇷" },
  { code: "+359", country: "Bulgaria", flag: "🇧🇬" },
  { code: "+855", country: "Cambodia", flag: "🇰🇭" },
  { code: "+56", country: "Chile", flag: "🇨🇱" },
  { code: "+57", country: "Colombia", flag: "🇨🇴" },
  { code: "+385", country: "Croatia", flag: "🇭🇷" },
  { code: "+420", country: "Czechia", flag: "🇨🇿" },
  { code: "+45", country: "Denmark", flag: "🇩🇰" },
  { code: "+20", country: "Egypt", flag: "🇪🇬" },
  { code: "+372", country: "Estonia", flag: "🇪🇪" },
  { code: "+358", country: "Finland", flag: "🇫🇮" },
  { code: "+995", country: "Georgia", flag: "🇬🇪" },
  { code: "+30", country: "Greece", flag: "🇬🇷" },
  { code: "+852", country: "Hong Kong", flag: "🇭🇰" },
  { code: "+36", country: "Hungary", flag: "🇭🇺" },
  { code: "+354", country: "Iceland", flag: "🇮🇸" },
  { code: "+62", country: "Indonesia", flag: "🇮🇩" },
  { code: "+353", country: "Ireland", flag: "🇮🇪" },
  { code: "+39", country: "Italy", flag: "🇮🇹" },
  { code: "+7", country: "Kazakhstan", flag: "🇰🇿" },
  { code: "+856", country: "Laos", flag: "🇱🇦" },
  { code: "+371", country: "Latvia", flag: "🇱🇻" },
  { code: "+370", country: "Lithuania", flag: "🇱🇹" },
  { code: "+352", country: "Luxembourg", flag: "🇱🇺" },
  { code: "+60", country: "Malaysia", flag: "🇲🇾" },
  { code: "+52", country: "Mexico", flag: "🇲🇽" },
  { code: "+95", country: "Myanmar", flag: "🇲🇲" },
  { code: "+977", country: "Nepal", flag: "🇳🇵" },
  { code: "+64", country: "New Zealand", flag: "🇳🇿" },
  { code: "+234", country: "Nigeria", flag: "🇳🇬" },
  { code: "+47", country: "Norway", flag: "🇳🇴" },
  { code: "+92", country: "Pakistan", flag: "🇵🇰" },
  { code: "+51", country: "Peru", flag: "🇵🇪" },
  { code: "+63", country: "Philippines", flag: "🇵🇭" },
  { code: "+48", country: "Poland", flag: "🇵🇱" },
  { code: "+351", country: "Portugal", flag: "🇵🇹" },
  { code: "+40", country: "Romania", flag: "🇷🇴" },
  { code: "+966", country: "Saudi Arabia", flag: "🇸🇦" },
  { code: "+381", country: "Serbia", flag: "🇷🇸" },
  { code: "+421", country: "Slovakia", flag: "🇸🇰" },
  { code: "+386", country: "Slovenia", flag: "🇸🇮" },
  { code: "+27", country: "South Africa", flag: "🇿🇦" },
  { code: "+34", country: "Spain", flag: "🇪🇸" },
  { code: "+94", country: "Sri Lanka", flag: "🇱🇰" },
  { code: "+46", country: "Sweden", flag: "🇸🇪" },
  { code: "+41", country: "Switzerland", flag: "🇨🇭" },
  { code: "+886", country: "Taiwan", flag: "🇹🇼" },
  { code: "+90", country: "Turkey", flag: "🇹🇷" },
  { code: "+380", country: "Ukraine", flag: "🇺🇦" },
  { code: "+971", country: "United Arab Emirates", flag: "🇦🇪" },
  { code: "+598", country: "Uruguay", flag: "🇺🇾" },
  { code: "+84", country: "Vietnam", flag: "🇻🇳" },
];

export const ALL_COUNTRIES: Country[] = [...COMMON_COUNTRIES, ...OTHER_COUNTRIES];

/**
 * Matches the start of any word in the name, or the dial code ("ger", "korea",
 * "+49", "49"). Word starts, so "ger" finds Germany and not Nigeria.
 */
export function searchCountries(query: string): Country[] {
  const q = query.trim().toLowerCase().replace(/^\+/, "");
  if (!q) return ALL_COUNTRIES;
  return ALL_COUNTRIES.filter(
    (c) =>
      c.country.toLowerCase().split(/[\s/]+/).some((word) => word.startsWith(q)) ||
      c.code.slice(1).startsWith(q)
  );
}

/** The country whose dial code starts an E.164 number, preferring the longest code. */
export function countryForNumber(e164: string): Country | undefined {
  return [...ALL_COUNTRIES]
    .sort((a, b) => b.code.length - a.code.length)
    .find((c) => e164.startsWith(c.code));
}
