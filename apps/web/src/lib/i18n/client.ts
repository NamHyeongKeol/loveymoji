import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import common from "@/locales/en/common.json";

const resources = {
  en: {
    translation: common,
  },
} as const;

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    defaultNS: "translation",
  });
}

export default i18n;
