"use strict";

window.JLIVE_ARTIST_IMAGES = (() => {
  const fileNameForChannel = channel => String(channel || "")
    .replace(/^@/, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const basePath = () => location.pathname.includes("/calendar/events/")
    ? "../assets/artists/"
    : "./assets/artists/";

  const localUrl = event => {
    if (event.youtubeProfileImage && !/^https?:\/\//i.test(event.youtubeProfileImage)) {
      return event.youtubeProfileImage;
    }
    const fileName = fileNameForChannel(event.youtubeChannel);
    return fileName ? `${basePath()}${fileName}.jpg` : "";
  };

  const remoteUrl = event => event.youtubeProfileImage && /^https?:\/\//i.test(event.youtubeProfileImage)
    ? event.youtubeProfileImage
    : event.youtubeChannel
      ? `https://unavatar.io/youtube/${encodeURIComponent(event.youtubeChannel)}?fallback=false`
      : "";

  const preload = events => {
    [...new Set(events.map(localUrl).filter(Boolean))].forEach(url => {
      const image = new Image();
      image.src = url;
    });
  };

  return { localUrl, remoteUrl, preload };
})();

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
