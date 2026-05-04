/**
 * Priority country list for the X v2 trends + search pipeline. WOEIDs come
 * from Yahoo's well-known-locations directory (still recognised by the X
 * trends endpoint). ISO codes line up with the country-centroids JSON so
 * markers and panels resolve cleanly.
 */
export type PriorityCountry = {
  iso: string;
  name: string;
  woeid: number;
  /** Optional ISO 639-1 lang code to bias the recent-search query. */
  lang?: string;
};

export const PRIORITY_COUNTRIES: PriorityCountry[] = [
  { iso: 'US', name: 'United States', woeid: 23424977, lang: 'en' },
  { iso: 'CA', name: 'Canada', woeid: 23424775, lang: 'en' },
  { iso: 'MX', name: 'Mexico', woeid: 23424900, lang: 'es' },
  { iso: 'BR', name: 'Brazil', woeid: 23424768, lang: 'pt' },
  { iso: 'AR', name: 'Argentina', woeid: 23424747, lang: 'es' },
  { iso: 'GB', name: 'United Kingdom', woeid: 23424975, lang: 'en' },
  { iso: 'IE', name: 'Ireland', woeid: 23424803, lang: 'en' },
  { iso: 'FR', name: 'France', woeid: 23424819, lang: 'fr' },
  { iso: 'DE', name: 'Germany', woeid: 23424829, lang: 'de' },
  { iso: 'NL', name: 'Netherlands', woeid: 23424909, lang: 'nl' },
  { iso: 'CH', name: 'Switzerland', woeid: 23424957, lang: 'de' },
  { iso: 'SE', name: 'Sweden', woeid: 23424954, lang: 'sv' },
  { iso: 'IT', name: 'Italy', woeid: 23424853, lang: 'it' },
  { iso: 'ES', name: 'Spain', woeid: 23424950, lang: 'es' },
  { iso: 'PL', name: 'Poland', woeid: 23424923, lang: 'pl' },
  { iso: 'TR', name: 'Turkey', woeid: 23424969, lang: 'tr' },
  { iso: 'RU', name: 'Russia', woeid: 23424936, lang: 'ru' },
  { iso: 'UA', name: 'Ukraine', woeid: 23424976, lang: 'uk' },
  { iso: 'IL', name: 'Israel', woeid: 23424852, lang: 'he' },
  { iso: 'AE', name: 'United Arab Emirates', woeid: 23424738, lang: 'ar' },
  { iso: 'SA', name: 'Saudi Arabia', woeid: 23424938, lang: 'ar' },
  { iso: 'EG', name: 'Egypt', woeid: 23424802, lang: 'ar' },
  { iso: 'NG', name: 'Nigeria', woeid: 23424908, lang: 'en' },
  { iso: 'ZA', name: 'South Africa', woeid: 23424942, lang: 'en' },
  { iso: 'KE', name: 'Kenya', woeid: 23424863, lang: 'en' },
  { iso: 'IN', name: 'India', woeid: 23424848, lang: 'en' },
  { iso: 'PK', name: 'Pakistan', woeid: 23424922, lang: 'en' },
  { iso: 'HK', name: 'Hong Kong', woeid: 24865698, lang: 'en' },
  { iso: 'TW', name: 'Taiwan', woeid: 23424971, lang: 'zh' },
  { iso: 'JP', name: 'Japan', woeid: 23424856, lang: 'ja' },
  { iso: 'KR', name: 'South Korea', woeid: 23424868, lang: 'ko' },
  { iso: 'SG', name: 'Singapore', woeid: 23424948, lang: 'en' },
  { iso: 'MY', name: 'Malaysia', woeid: 23424901, lang: 'en' },
  { iso: 'ID', name: 'Indonesia', woeid: 23424846, lang: 'id' },
  { iso: 'PH', name: 'Philippines', woeid: 23424934, lang: 'en' },
  { iso: 'TH', name: 'Thailand', woeid: 23424960, lang: 'th' },
  { iso: 'VN', name: 'Vietnam', woeid: 23424984, lang: 'vi' },
  { iso: 'AU', name: 'Australia', woeid: 23424748, lang: 'en' },
];
