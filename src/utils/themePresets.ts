import { SchoolThemeId } from '../types';

export interface ThemeDefinition {
  id: SchoolThemeId;
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  // Tailwind class combinations for dynamic components
  navGradient: string;
  headerGradient: string;
  subHeaderBg: string;
  accentBadge: string;
  accentText: string;
  accentBorder: string;
  accentButton: string;
  accentButtonHover: string;
  cardHighlight: string;
  printHeaderBg: string;
}

export const THEME_PRESETS: Record<SchoolThemeId, ThemeDefinition> = {
  'crimson-gold': {
    id: 'crimson-gold',
    name: 'Crimson & Gold (St. Paul Heritage)',
    description: 'Traditional academic crest palette with rich crimson and royal amber gold',
    primaryColor: '#7f1d1d',
    secondaryColor: '#991b1b',
    accentColor: '#f59e0b',
    navGradient: 'from-[#690707] via-[#540808] to-[#3a0303]',
    headerGradient: 'from-red-950 via-red-900 to-red-800',
    subHeaderBg: 'bg-red-950',
    accentBadge: 'bg-amber-400 text-red-950',
    accentText: 'text-amber-300',
    accentBorder: 'border-amber-400',
    accentButton: 'bg-amber-400 hover:bg-amber-300 text-red-950',
    accentButtonHover: 'hover:bg-amber-300',
    cardHighlight: 'border-red-200 bg-red-50/50',
    printHeaderBg: '#7f1d1d',
  },
  'navy-gold': {
    id: 'navy-gold',
    name: 'Navy Blue & Imperial Gold',
    description: 'Distinguished, authoritative deep maritime navy with rich warm gold accents',
    primaryColor: '#0f172a',
    secondaryColor: '#1e293b',
    accentColor: '#eab308',
    navGradient: 'from-[#071326] via-[#0b1d3a] to-[#040b17]',
    headerGradient: 'from-slate-950 via-blue-950 to-slate-900',
    subHeaderBg: 'bg-slate-950',
    accentBadge: 'bg-amber-400 text-slate-950',
    accentText: 'text-amber-300',
    accentBorder: 'border-amber-400',
    accentButton: 'bg-amber-400 hover:bg-amber-300 text-slate-950',
    accentButtonHover: 'hover:bg-amber-300',
    cardHighlight: 'border-blue-200 bg-blue-50/50',
    printHeaderBg: '#0f172a',
  },
  'royal-silver': {
    id: 'royal-silver',
    name: 'Royal Blue & Platinum Silver',
    description: 'Modern, high-contrast academic blue with crisp silver and sky blue elements',
    primaryColor: '#1e3a8a',
    secondaryColor: '#1d4ed8',
    accentColor: '#38bdf8',
    navGradient: 'from-[#0e2456] via-[#163884] to-[#091738]',
    headerGradient: 'from-blue-950 via-blue-900 to-indigo-950',
    subHeaderBg: 'bg-blue-950',
    accentBadge: 'bg-sky-400 text-slate-950',
    accentText: 'text-sky-300',
    accentBorder: 'border-sky-400',
    accentButton: 'bg-sky-400 hover:bg-sky-300 text-slate-950',
    accentButtonHover: 'hover:bg-sky-300',
    cardHighlight: 'border-sky-200 bg-sky-50/50',
    printHeaderBg: '#1e3a8a',
  },
  'emerald-gold': {
    id: 'emerald-gold',
    name: 'Emerald Green & Gold',
    description: 'Prestigious scholar green evoking wisdom, growth and gold honor medals',
    primaryColor: '#064e3b',
    secondaryColor: '#047857',
    accentColor: '#fbbf24',
    navGradient: 'from-[#042f24] via-[#064e3b] to-[#021f18]',
    headerGradient: 'from-emerald-950 via-emerald-900 to-teal-950',
    subHeaderBg: 'bg-emerald-950',
    accentBadge: 'bg-amber-400 text-emerald-950',
    accentText: 'text-amber-300',
    accentBorder: 'border-amber-400',
    accentButton: 'bg-amber-400 hover:bg-amber-300 text-emerald-950',
    accentButtonHover: 'hover:bg-amber-300',
    cardHighlight: 'border-emerald-200 bg-emerald-50/50',
    printHeaderBg: '#064e3b',
  },
  'purple-gold': {
    id: 'purple-gold',
    name: 'Regal Purple & Amber Gold',
    description: 'Majestic collegiate purple symbolizing excellence, leadership and distinction',
    primaryColor: '#581c87',
    secondaryColor: '#6b21a8',
    accentColor: '#f59e0b',
    navGradient: 'from-[#320e4f] via-[#4c1477] to-[#1e0730]',
    headerGradient: 'from-purple-950 via-purple-900 to-fuchsia-950',
    subHeaderBg: 'bg-purple-950',
    accentBadge: 'bg-amber-400 text-purple-950',
    accentText: 'text-amber-300',
    accentBorder: 'border-amber-400',
    accentButton: 'bg-amber-400 hover:bg-amber-300 text-purple-950',
    accentButtonHover: 'hover:bg-amber-300',
    cardHighlight: 'border-purple-200 bg-purple-50/50',
    printHeaderBg: '#581c87',
  },
  'maroon-bronze': {
    id: 'maroon-bronze',
    name: 'Deep Maroon & Bronze',
    description: 'Rich vintage Ivy-league maroon with refined metallic bronze warmth',
    primaryColor: '#831843',
    secondaryColor: '#9d174d',
    accentColor: '#fb923c',
    navGradient: 'from-[#4c0521] via-[#6e0d34] to-[#2d0213]',
    headerGradient: 'from-pink-950 via-rose-950 to-red-950',
    subHeaderBg: 'bg-pink-950',
    accentBadge: 'bg-orange-400 text-rose-950',
    accentText: 'text-orange-300',
    accentBorder: 'border-orange-400',
    accentButton: 'bg-orange-400 hover:bg-orange-300 text-rose-950',
    accentButtonHover: 'hover:bg-orange-300',
    cardHighlight: 'border-rose-200 bg-rose-50/50',
    printHeaderBg: '#831843',
  },
  'slate-coral': {
    id: 'slate-coral',
    name: 'Modern Slate & Warm Coral',
    description: 'Clean high-tech contemporary aesthetic with slate graphite and vibrant coral',
    primaryColor: '#1e293b',
    secondaryColor: '#334155',
    accentColor: '#fb7185',
    navGradient: 'from-[#0f172a] via-[#1e293b] to-[#020617]',
    headerGradient: 'from-slate-950 via-slate-900 to-zinc-900',
    subHeaderBg: 'bg-slate-950',
    accentBadge: 'bg-rose-500 text-white',
    accentText: 'text-rose-300',
    accentBorder: 'border-rose-400',
    accentButton: 'bg-rose-500 hover:bg-rose-600 text-white',
    accentButtonHover: 'hover:bg-rose-600',
    cardHighlight: 'border-slate-200 bg-slate-50/50',
    printHeaderBg: '#1e293b',
  },
};

export function getTheme(themeId?: string): ThemeDefinition {
  if (themeId && themeId in THEME_PRESETS) {
    return THEME_PRESETS[themeId as SchoolThemeId];
  }
  return THEME_PRESETS['crimson-gold'];
}
