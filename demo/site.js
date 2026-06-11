"use strict";

(() => {
  const config = window.JLIVE_CONFIG || {};
  if (config.googleSiteVerification) {
    const verification = document.createElement("meta");
    verification.name = "google-site-verification";
    verification.content = config.googleSiteVerification;
    document.head.append(verification);
  }

  if (config.googleAnalyticsId) {
    const loader = document.createElement("script");
    loader.async = true;
    loader.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(config.googleAnalyticsId)}`;
    document.head.append(loader);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", config.googleAnalyticsId, { anonymize_ip: true });
  }

  document.querySelectorAll("[data-contact-email]").forEach(element => {
    const email = config.contactEmail || "ydh061661@gmail.com";
    element.textContent = email;
    if (element.tagName === "A") element.href = `mailto:${email}`;
  });
})();
