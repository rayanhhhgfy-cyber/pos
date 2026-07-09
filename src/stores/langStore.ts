import { create } from 'zustand';
import { getTranslation, getDir, t, type Language, type Translations } from '../utils/i18n';

interface LangState {
  lang: Language;
  t: Translations;
  dir: 'ltr' | 'rtl';
  setLang: (lang: Language) => void;
  _t: (key: keyof Translations) => string;
}

export const useLangStore = create<LangState>((set, get) => ({
  lang: 'en',
  t: getTranslation('en'),
  dir: 'ltr',

  setLang: (lang: Language) => {
    set({ lang, t: getTranslation(lang), dir: getDir(lang) });
    document.documentElement.dir = getDir(lang);
    document.documentElement.lang = lang;
    localStorage.setItem('pos-lang', lang);
  },

  _t: (key: keyof Translations) => {
    return get().t[key] || key;
  },
}));