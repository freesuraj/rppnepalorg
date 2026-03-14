(function () {
  const defaultLanguage = "ne";
  const languageStorageKey = "ntp-language";
  const runtimeConfig = window.NTP_CONFIG || {};
  const pageKey = document.body.dataset.page;
  let translations = {};
  let publicSettings = {};
  let resolveReady;
  const ready = new Promise((resolve) => {
    resolveReady = resolve;
  });

  function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
  }

  function isPlainObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function getByPath(object, path) {
    return path.split(".").reduce((current, segment) => {
      if (current && hasOwn(current, segment)) {
        return current[segment];
      }
      return undefined;
    }, object);
  }

  function isLocalizedValue(value) {
    return (
      isPlainObject(value) &&
      hasOwn(value, "ne") &&
      hasOwn(value, "en") &&
      Object.keys(value).every((key) => key === "ne" || key === "en")
    );
  }

  function extractLanguageValue(value, language) {
    if (isLocalizedValue(value)) {
      return value[language];
    }

    if (Array.isArray(value)) {
      return value.map((entry) => extractLanguageValue(entry, language));
    }

    if (!isPlainObject(value)) {
      return value;
    }

    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        extractLanguageValue(entry, language)
      ])
    );
  }

  async function fetchJson(filePath) {
    const response = await window.fetch(filePath, {
      headers: { Accept: "application/json" }
    });

    if (!response.ok) {
      throw new Error(`Failed to load ${filePath}: ${response.status}`);
    }

    return response.json();
  }

  async function loadContent() {
    const [siteContent, pageContent, settings] = await Promise.all([
      fetchJson("content/site.json"),
      fetchJson(`content/pages/${pageKey}.json`),
      fetchJson("content/settings.json")
    ]);

    translations = {
      ne: {
        ...extractLanguageValue(siteContent, "ne"),
        [pageKey]: extractLanguageValue(pageContent, "ne")
      },
      en: {
        ...extractLanguageValue(siteContent, "en"),
        [pageKey]: extractLanguageValue(pageContent, "en")
      }
    };

    publicSettings = settings;
  }

  function translate(path, language) {
    const activeLanguage = language || getCurrentLanguage();
    return (
      getByPath(translations[activeLanguage] || {}, path) ||
      getByPath(translations[defaultLanguage] || {}, path) ||
      path
    );
  }

  function getCurrentLanguage() {
    const stored = window.localStorage.getItem(languageStorageKey);
    return stored && hasOwn(translations, stored) ? stored : defaultLanguage;
  }

  function getMergedConfig() {
    return {
      ...publicSettings,
      supabase: runtimeConfig.supabase || {}
    };
  }

  function setCurrentLanguage(language) {
    const nextLanguage = hasOwn(translations, language) ? language : defaultLanguage;
    window.localStorage.setItem(languageStorageKey, nextLanguage);
    applyTranslations(nextLanguage);
    renderConfigValues(nextLanguage);
  }

  function updateDocumentTitle(language) {
    const pageTitleKey = document.body.dataset.pageTitle;
    const siteName = translate("brand.long", language);

    if (!pageTitleKey || pageTitleKey === "pages.home") {
      document.title = siteName;
      return;
    }

    document.title = `${translate(pageTitleKey, language)} | ${siteName}`;
  }

  function applyTranslations(language) {
    document.documentElement.lang = language;

    document.querySelectorAll("[data-i18n]").forEach((element) => {
      element.textContent = translate(element.dataset.i18n, language);
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
      element.setAttribute(
        "placeholder",
        translate(element.dataset.i18nPlaceholder, language)
      );
    });

    document.querySelectorAll("[data-lang-switch]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.langSwitch === language);
    });

    updateDocumentTitle(language);

    document.dispatchEvent(
      new CustomEvent("ntp:languagechange", {
        detail: { language }
      })
    );
  }

  function isPlaceholderValue(value) {
    return !value || /replace with|example\.com|0000000000/i.test(value);
  }

  function renderConfigValues(language) {
    document.querySelectorAll("[data-config]").forEach((element) => {
      const path = element.dataset.config;
      const rawValue = getByPath(getMergedConfig(), path);
      const stringValue =
        typeof rawValue === "string" && rawValue.trim() ? rawValue.trim() : "";
      const type = element.dataset.configType || "";
      const keepLabel =
        type === "url" && element.textContent && element.textContent.trim().length > 0;
      const valueForText = stringValue || translate("common.pending", language);

      if (!keepLabel) {
        element.textContent = valueForText;
      }

      element.classList.toggle("placeholder-value", isPlaceholderValue(stringValue));

      if (element.tagName !== "A") {
        return;
      }

      element.classList.remove("is-disabled-link");

      if (!stringValue || stringValue === "#" || isPlaceholderValue(stringValue)) {
        element.setAttribute("href", "#");
        element.classList.add("is-disabled-link");
        return;
      }

      if (type === "email") {
        element.setAttribute("href", `mailto:${stringValue}`);
        return;
      }

      if (type === "tel") {
        element.setAttribute("href", `tel:${stringValue}`);
        return;
      }

      if (type === "url") {
        element.setAttribute("href", stringValue);
        element.setAttribute("target", "_blank");
        element.setAttribute("rel", "noreferrer");
      }
    });
  }

  function setupNavigation() {
    const toggle = document.querySelector("[data-nav-toggle]");
    const nav = document.getElementById("site-nav");
    const page = document.body.dataset.page;

    document.querySelectorAll(".site-nav a").forEach((link) => {
      const href = link.getAttribute("href");
      const targetPage = href === "index.html" ? "home" : href.replace(".html", "");
      link.classList.toggle("is-current", targetPage === page);
    });

    if (!toggle || !nav) {
      return;
    }

    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
      document.body.classList.toggle("nav-open", !expanded);
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        toggle.setAttribute("aria-expanded", "false");
        document.body.classList.remove("nav-open");
      });
    });
  }

  function setupLanguageSwitch() {
    document.querySelectorAll("[data-lang-switch]").forEach((button) => {
      button.addEventListener("click", () => {
        setCurrentLanguage(button.dataset.langSwitch);
      });
    });
  }

  window.NTP_SITE = {
    translate,
    getCurrentLanguage,
    ready,
    getConfig(path) {
      return getByPath(getMergedConfig(), path);
    }
  };

  setupNavigation();
  setupLanguageSwitch();

  (async function init() {
    try {
      await loadContent();
      applyTranslations(getCurrentLanguage());
      renderConfigValues(getCurrentLanguage());
    } catch (error) {
      console.error("Failed to load site content", error);
    } finally {
      resolveReady();
      document.dispatchEvent(new CustomEvent("ntp:ready"));
    }
  })();
})();
