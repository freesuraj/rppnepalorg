(async function () {
  const siteApi = window.NTP_SITE || {};
  if (siteApi.ready && typeof siteApi.ready.then === "function") {
    await siteApi.ready;
  }

  const form = document.getElementById("join-form");
  const statusElement = document.getElementById("form-status");

  if (!form || !statusElement) {
    return;
  }

  const supabaseConfig = (window.NTP_CONFIG && window.NTP_CONFIG.supabase) || {};
  const tableName = supabaseConfig.table || "movement_signups";
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
      supabaseConfig.url.trim().length > 0 &&
      supabaseConfig.anonKey.trim().length > 0 &&
      !/replace with/i.test(supabaseConfig.url) &&
      !/replace with/i.test(supabaseConfig.anonKey)
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
    const website = String(formData.get("website") || "").trim();
    const consent = formData.get("consent") === "on";

    if (website) {
      setStatus("formMessages.spam", "error");
      return;
    }

    if (!fullName || !email || !phone) {
      setStatus("formMessages.validation", "error");
      return;
    }

    if (!consent) {
      setStatus("formMessages.consent", "error");
      return;
    }

    if (!isConfigured()) {
      setStatus("formMessages.configMissing", "error");
      return;
    }

    const payload = {
      full_name: fullName,
      email,
      phone,
      tiktok: normalizeOptional(String(formData.get("tiktok") || "")),
      instagram: normalizeOptional(String(formData.get("instagram") || "")),
      facebook: normalizeOptional(String(formData.get("facebook") || "")),
      x_profile: normalizeOptional(String(formData.get("x_profile") || "")),
      consent: true,
      source_language:
        typeof siteApi.getCurrentLanguage === "function"
          ? siteApi.getCurrentLanguage()
          : "ne"
    };

    setStatus("formMessages.submitting", "loading");

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
      setStatus("formMessages.success", "success");
    } catch (error) {
      console.error(error);
      setStatus("formMessages.error", "error");
    }
  }

  document.addEventListener("ntp:languagechange", () => {
    if (lastStatusKey) {
      statusElement.textContent = translate(lastStatusKey);
    }
  });

  form.addEventListener("submit", submitForm);
})();
