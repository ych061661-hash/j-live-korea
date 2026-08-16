"use strict";

(() => {
  const calendarRoot = `${location.origin}/calendar/`;

  if (/\/calendar\/events\//.test(location.pathname)) {
    const calendarBack = document.querySelector("header .ghost-button");
    if (calendarBack) {
      calendarBack.textContent = "\u2190 \uB2EC\uB825\uC73C\uB85C";
      calendarBack.setAttribute("aria-label", "\uB2EC\uB825\uC73C\uB85C \uB3CC\uC544\uAC00\uAE30");
      calendarBack.addEventListener("click", event => {
        if (!document.referrer) return;
        const previous = new URL(document.referrer);
        const cameFromCalendar = previous.origin === location.origin
          && previous.pathname.startsWith("/calendar/")
          && !previous.pathname.startsWith("/calendar/events/");
        if (!cameFromCalendar) return;
        event.preventDefault();
        history.back();
      });
    }
  }

  const ensureHeadLink = (rel, href, attrs = {}) => {
    if (document.head.querySelector(`link[rel="${rel}"][href="${href}"]`)) return;
    const link = document.createElement("link");
    link.rel = rel;
    link.href = href;
    Object.entries(attrs).forEach(([key, value]) => link.setAttribute(key, value));
    document.head.append(link);
  };

  ensureHeadLink("apple-touch-icon", `${calendarRoot}assets/brand/j-live-app-logo.png`);

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register(`${calendarRoot}service-worker.js`, { scope: "/calendar/" })
        .catch(() => {});
    });
  }

})();

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
    : "";

  const fallbackUrl = () => `${location.pathname.includes("/calendar/events/") ? "../" : "./"}assets/brand/j-live-app-logo.png`;

  const preload = events => {
    [...new Set(events.map(localUrl).filter(Boolean))].forEach(url => {
      const image = new Image();
      image.src = url;
    });
  };

  return { localUrl, remoteUrl, fallbackUrl, preload };
})();

document.addEventListener("click", async event => {
  const vendorLink = event.target.closest("[data-track-vendor]");
  if (vendorLink) window.JLIVE_ANALYTICS?.track("ticket_click", { vendor: vendorLink.dataset.trackVendor || "미정" });

  const shareButton = event.target.closest("[data-share-page]");
  if (!shareButton) return;
  const shareData = { title: document.title, text: document.querySelector('meta[name="description"]')?.content || "", url: location.href };
  try {
    if (navigator.share) await navigator.share(shareData);
    else await navigator.clipboard.writeText(location.href);
    shareButton.textContent = navigator.share ? "공유 완료" : "주소 복사 완료";
  } catch (error) {
    shareButton.textContent = error.name === "AbortError" ? "공유 취소됨" : "주소창에서 복사해 주세요";
  }
  setTimeout(() => { shareButton.textContent = "이번 주 일정 공유"; }, 1800);
});

document.addEventListener("submit", event => {
  const form = event.target.closest?.("[data-track-submit]");
  if (form) window.JLIVE_ANALYTICS?.track(form.dataset.trackSubmit, { form_name: form.dataset.trackSubmit });
});

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

})();
