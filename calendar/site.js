"use strict";

(() => {
  const calendarRoot = `${location.origin}/calendar/`;

  const ensureHeadLink = (rel, href, attrs = {}) => {
    if (document.head.querySelector(`link[rel="${rel}"][href="${href}"]`)) return;
    const link = document.createElement("link");
    link.rel = rel;
    link.href = href;
    Object.entries(attrs).forEach(([key, value]) => link.setAttribute(key, value));
    document.head.append(link);
  };

  ensureHeadLink("manifest", `${calendarRoot}manifest.webmanifest`);
  ensureHeadLink("apple-touch-icon", `${calendarRoot}assets/brand/j-live-app-logo.png`);

  if (!document.head.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
    const capable = document.createElement("meta");
    capable.name = "apple-mobile-web-app-capable";
    capable.content = "yes";
    document.head.append(capable);
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register(`${calendarRoot}service-worker.js`, { scope: "/calendar/" })
        .catch(() => {});
    });
  }

  let deferredInstallPrompt = null;
  const isStandalone = () => window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;

  const installButton = document.createElement("button");
  installButton.type = "button";
  installButton.className = "pwa-install-button";
  installButton.textContent = "\uC571\uC73C\uB85C \uC124\uCE58";
  installButton.hidden = true;
  installButton.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice.catch(() => null);
    deferredInstallPrompt = null;
    installButton.hidden = true;
  });

  window.addEventListener("beforeinstallprompt", event => {
    if (isStandalone()) return;
    event.preventDefault();
    deferredInstallPrompt = event;
    if (!installButton.isConnected) document.body.append(installButton);
    installButton.hidden = false;
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    installButton.hidden = true;
  });
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
