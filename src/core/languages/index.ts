import { I18n } from 'i18n-js';

import en_US from './en_US.json';
import es_419 from './es_419.json';
import fr_FR from './fr_FR.json';
import hi_IN from './hi_IN.json';
import ja_JP from './ja_JP.json';
import pt_BR from './pt_BR.json';
import ru_RU from './ru_RU.json';
import tr_TR from './tr_TR.json';
import zh_CN from './zh_CN.json';

export enum Language {
  EN_US = 'en_US',
  ES_419 = 'es_419',
  FR_FR = 'fr_FR',
  JA_JP = 'ja_JP',
  PT_BR = 'pt_BR',
  ZH_CN = 'zh_CN',
  HI_IN = 'hi_IN',
  TR_TR = 'tr_TR',
  RU_RU = 'ru_RU',
}

export const i18n = new I18n({
  en_US,
  es_419,
  fr_FR,
  ja_JP,
  pt_BR,
  zh_CN,
  hi_IN,
  tr_TR,
  ru_RU,
});

// Configure languages
i18n.defaultLocale = Language.EN_US;
i18n.locale = Language.EN_US;
i18n.enableFallback = true;

export const changeI18nLanguage = (locale: Language) => {
  i18n.locale = locale;
};

export const supportedLanguages = {
  [Language.EN_US]: {
    label: 'English',
  },
  [Language.ES_419]: {
    label: 'Español',
  },
  [Language.FR_FR]: {
    label: 'Français',
  },
  [Language.JA_JP]: {
    label: '日本語',
  },
  [Language.PT_BR]: {
    label: 'Português',
  },
  [Language.ZH_CN]: {
    label: '中文',
  },
  [Language.HI_IN]: {
    label: 'हिंदी',
  },
  [Language.TR_TR]: {
    label: 'Türkçe',
  },
  [Language.RU_RU]: {
    label: 'Русский',
  },
};

export type SupportedLanguage = typeof supportedLanguages;
export type SupportedLanguageKey = keyof SupportedLanguage;
