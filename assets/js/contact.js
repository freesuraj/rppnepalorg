(async function () {
  const siteApi = window.NTP_SITE || {};
  if (siteApi.ready && typeof siteApi.ready.then === "function") {
    await siteApi.ready;
  }

  const form = document.getElementById("contact-form");
  const statusElement = document.getElementById("contact-form-status");

  if (!form || !statusElement) {
    return;
  }

  const supabaseConfig = (window.NTP_CONFIG && window.NTP_CONFIG.supabase) || {};
  const tableName = supabaseConfig.messageTable || "message";
  let lastStatusKey = "";

  function translate(key) {
    if (typeof siteApi.translate === "function") {
      return siteApi.translate(key);
    }
    return key;
  }

  function setStatus(key, state) {
    lastStatusKey = key || "";
    statusElement.textContent = key ? translate(key) : "";
    statusElement.dataset.state = state || "";
  }

  function isConfigured() {
    return (
      typeof supabaseConfig.url === "string" &&
      typeof supabaseConfig.anonKey === "string" &&
      typeof tableName === "string" &&
      supabaseConfig.url.trim().length > 0 &&
      supabaseConfig.anonKey.trim().length > 0 &&
      tableName.trim().length > 0 &&
      !/replace with/i.test(supabaseConfig.url) &&
      !/replace with/i.test(supabaseConfig.anonKey) &&
      !/replace with/i.test(tableName)
    );
  }

  function normalizeOptional(value) {
    const trimmed = value.trim();
    return trimmed || null;
  }

  async function submitForm(event) {
    event.preventDefault();

    const formData = new FormData(form);
    const fullName = String(formData.get("full_name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const message = String(formData.get("message") || "").trim();
    const website = String(formData.get("website") || "").trim();

    if (website) {
      setStatus("contactFormMessages.spam", "error");
      return;
    }

    if (!fullName || !email || !message) {
      setStatus("contactFormMessages.validation", "error");
      return;
    }

    if (!isConfigured()) {
      setStatus("contactFormMessages.configMissing", "error");
      return;
    }

    const payload = {
      full_name: fullName,
      email,
      phone: normalizeOptional(phone),
      message,
      source_language:
        typeof siteApi.getCurrentLanguage === "function"
          ? siteApi.getCurrentLanguage()
          : "ne"
    };

    setStatus("contactFormMessages.submitting", "loading");

    try {
      const response = await window.fetch(
        `${supabaseConfig.url.replace(/\/$/, "")}/rest/v1/${tableName}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseConfig.anonKey,
            Authorization: `Bearer ${supabaseConfig.anonKey}`,
            Prefer: "return=minimal"
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        throw new Error(`Submission failed with status ${response.status}`);
      }

      form.reset();
      setStatus("contactFormMessages.success", "success");
    } catch (error) {
      console.error(error);
      setStatus("contactFormMessages.error", "error");
    }
  }

  document.addEventListener("ntp:languagechange", () => {
    if (lastStatusKey) {
      statusElement.textContent = translate(lastStatusKey);
    }
  });

  form.addEventListener("submit", submitForm);
})();
