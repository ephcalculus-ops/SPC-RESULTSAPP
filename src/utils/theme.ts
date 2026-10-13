import { SchoolThemeId } from '../types';

export interface ThemeConfig {
  id: SchoolThemeId;
  name: string;
  primaryColor: string;
  accentColor: string;
  gradientBg: string;
  sidebarGradient: string;
  heroGradient: string;
  headerStrip: string;
  cardBorder: string;
  badgeBg: string;
  badgeText: string;
  buttonGradient: string;
  buttonText: string;
  accentBorder: string;
  textAccent: string;
}

export const SCHOOL_THEMES: Record<SchoolThemeId, ThemeConfig> = {
  'crimson-gold': {
    id: 'crimson-gold',
    name: 'Crimson & Gold (St. Paul Heritage)',
    primaryColor: '#7f1d1d',
    accentColor: '#f59e0b',
    gradientBg: 'from-slate-950 via-[#260505] to-slate-950',
    sidebarGradient: 'from-[#690707] via-[#540808] to-[#3a0303]',
    heroGradient: 'from-black via-[#3d0606] to-slate-950',
    headerStrip: 'from-red-950 via-[#7a0c0c] to-red-950',
    cardBorder: 'border-amber-400/70',
    badgeBg: 'bg-amber-400',
    badgeText: 'text-red-950',
    buttonGradient: 'from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300',
    buttonText: 'text-red-950',
    accentBorder: 'border-amber-400',
    textAccent: 'text-amber-300',
  },
  'navy-gold': {
    id: 'navy-gold',
    name: 'Royal Navy & Imperial Gold',
    primaryColor: '#0f244a',
    accentColor: '#f59e0b',
    gradientBg: 'from-slate-950 via-[#09152b] to-slate-950',
    sidebarGradient: 'from-[#0b1c3a] via-[#08152c] to-[#040b17]',
    heroGradient: 'from-black via-[#09152b] to-slate-950',
    headerStrip: 'from-blue-950 via-[#102a54] to-blue-950',
    cardBorder: 'border-amber-400/70',
    badgeBg: 'bg-amber-400',
    badgeText: 'text-blue-950',
    buttonGradient: 'from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300',
    buttonText: 'text-blue-950',
    accentBorder: 'border-amber-400',
    textAccent: 'text-amber-300',
  },
  'emerald-gold': {
    id: 'emerald-gold',
    name: 'Emerald Green & Gold Prestige',
    primaryColor: '#064e3b',
    accentColor: '#f59e0b',
    gradientBg: 'from-slate-950 via-[#03261d] to-slate-950',
    sidebarGradient: 'from-[#063e30] via-[#043025] to-[#021c15]',
    heroGradient: 'from-black via-[#032b20] to-slate-950',
    headerStrip: 'from-emerald-950 via-[#064e3b] to-emerald-950',
    cardBorder: 'border-amber-400/70',
    badgeBg: 'bg-amber-400',
    badgeText: 'text-emerald-950',
    buttonGradient: 'from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300',
    buttonText: 'text-emerald-950',
    accentBorder: 'border-amber-400',
    textAccent: 'text-amber-300',
  },
  'purple-gold': {
    id: 'purple-gold',
    name: 'Royal Purple & Sovereign Gold',
    primaryColor: '#4c1d95',
    accentColor: '#f59e0b',
    gradientBg: 'from-slate-950 via-[#210947] to-slate-950',
    sidebarGradient: 'from-[#3b127a] via-[#2d0e5c] to-[#1a0636]',
    heroGradient: 'from-black via-[#230949] to-slate-950',
    headerStrip: 'from-purple-950 via-[#4c1d95] to-purple-950',
    cardBorder: 'border-amber-400/70',
    badgeBg: 'bg-amber-400',
    badgeText: 'text-purple-950',
    buttonGradient: 'from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300',
    buttonText: 'text-purple-950',
    accentBorder: 'border-amber-400',
    textAccent: 'text-amber-300',
  },
  'maroon-bronze': {
    id: 'maroon-bronze',
    name: 'Maroon & Classical Bronze',
    primaryColor: '#581c87',
    accentColor: '#d97706',
    gradientBg: 'from-slate-950 via-[#250d18] to-slate-950',
    sidebarGradient: 'from-[#4a1226] via-[#380e1d] to-[#200710]',
    heroGradient: 'from-black via-[#2b0c1b] to-slate-950',
    headerStrip: 'from-stone-950 via-[#4a1226] to-stone-950',
    cardBorder: 'border-amber-500/70',
    badgeBg: 'bg-amber-500',
    badgeText: 'text-amber-950',
    buttonGradient: 'from-amber-500 to-orange-400 hover:from-amber-400 hover:to-orange-300',
    buttonText: 'text-stone-950',
    accentBorder: 'border-amber-500',
    textAccent: 'text-amber-400',
  },
  'royal-silver': {
    id: 'royal-silver',
    name: 'Royal Sapphire & Platinum Silver',
    primaryColor: '#1e3a8a',
    accentColor: '#e2e8f0',
    gradientBg: 'from-slate-950 via-[#0e1c45] to-slate-950',
    sidebarGradient: 'from-[#172e6d] via-[#112252] to-[#0a1433]',
    heroGradient: 'from-black via-[#112252] to-slate-950',
    headerStrip: 'from-slate-950 via-[#172e6d] to-slate-950',
    cardBorder: 'border-slate-300/70',
    badgeBg: 'bg-slate-200',
    badgeText: 'text-blue-950',
    buttonGradient: 'from-sky-400 to-blue-500 hover:from-sky-300 hover:to-blue-400',
    buttonText: 'text-slate-950',
    accentBorder: 'border-slate-300',
    textAccent: 'text-sky-300',
  },
  'slate-coral': {
    id: 'slate-coral',
    name: 'Modern Charcoal & Coral Amber',
    primaryColor: '#0f172a',
    accentColor: '#f97316',
    gradientBg: 'from-slate-950 via-[#131b2e] to-slate-950',
    sidebarGradient: 'from-[#1e293b] via-[#0f172a] to-[#020617]',
    heroGradient: 'from-black via-[#131b2e] to-slate-950',
    headerStrip: 'from-slate-950 via-[#1e293b] to-slate-950',
    cardBorder: 'border-orange-400/70',
    badgeBg: 'bg-orange-500',
    badgeText: 'text-slate-950',
    buttonGradient: 'from-orange-500 to-amber-400 hover:from-orange-400 hover:to-amber-300',
    buttonText: 'text-slate-950',
    accentBorder: 'border-orange-400',
    textAccent: 'text-orange-300',
  },
};

export function getThemeConfig(themeId?: SchoolThemeId): ThemeConfig {
  if (themeId && SCHOOL_THEMES[themeId]) {
    return SCHOOL_THEMES[themeId];
  }
  return SCHOOL_THEMES['crimson-gold'];
}
