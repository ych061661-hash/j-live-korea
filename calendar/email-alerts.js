"use strict";

(function exposeEmailAlerts(root) {
  const STORAGE_KEY = "j-live-email-alerts-v1";
  const empty = () => ({ email: "", kinds: ["announcement", "presale", "ticket", "extra-seat"], manageToken: "", verified: false });
  const read = () => {
    try { return { ...empty(), ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") }; }
    catch { return empty(); }
  };
  const write = value => {
    const next = { ...empty(), ...value };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  };
  const endpoint = path => `${root.JLIVE_CONFIG?.emailAlertsApi || "/api/alerts"}${path}`;
  let settings = read();

  async function request(path, options) {
    const response = await fetch(endpoint(path), { ...options, headers: { "Content-Type": "application/json" } });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "이메일 알림 요청에 실패했습니다.");
    return body;
  }

  function favorites() {
    return root.JLIVE_FAVORITES?.read() || { artists: [], events: [] };
  }

  async function sync(saved = favorites()) {
    if (!settings.manageToken) return false;
    await request("/subscriptions", { method: "PUT", body: JSON.stringify({ manageToken: settings.manageToken, artists: saved.artists, events: saved.events, kinds: settings.kinds }) });
    return true;
  }

  function setup() {
    const form = document.querySelector("#emailAlertForm");
    if (!form) return;
    const status = document.querySelector("#emailAlertStatus");
    const unsubscribeButton = document.querySelector("#emailAlertUnsubscribe");
    form.elements.email.value = settings.email;
    form.querySelectorAll("[name=kind]").forEach(input => { input.checked = settings.kinds.includes(input.value); });
    unsubscribeButton.hidden = !settings.manageToken;

    const query = new URLSearchParams(location.search).get("email-alert");
    const fragment = new URLSearchParams(location.hash.slice(1));
    const recovered = fragment.get("email-alert") === "recovered" ? fragment.get("manage-token") : "";
    if (recovered) {
      settings = write({ ...settings, manageToken: recovered, verified: true });
      status.textContent = "이 브라우저에서 이메일 알림을 관리할 수 있습니다. 관심 목록을 동기화하는 중입니다.";
      unsubscribeButton.hidden = false;
      history.replaceState({}, "", location.pathname);
      sync().then(() => { status.textContent = "관심 목록과 알림 설정을 동기화했습니다."; })
        .catch(error => { status.textContent = error.message; });
    } else
    if (query === "verified") {
      settings = write({ ...settings, verified: true });
      status.textContent = "이메일 인증이 완료되었습니다. 이제 맞춤 알림을 받을 수 있습니다.";
      history.replaceState({}, "", location.pathname);
    } else if (query === "unsubscribed") {
      settings = write(empty());
      status.textContent = "이메일 알림을 해지했습니다.";
      unsubscribeButton.hidden = true;
      history.replaceState({}, "", location.pathname);
    } else if (query === "invalid") {
      status.textContent = "인증 또는 해지 링크가 만료됐거나 올바르지 않습니다.";
      history.replaceState({}, "", location.pathname);
    } else if (settings.manageToken) {
      status.textContent = settings.verified ? "이메일 알림 사용 중" : "인증 메일에서 인증을 완료해 주세요.";
    }

    form.addEventListener("submit", async event => {
      event.preventDefault();
      const saved = favorites();
      if (!saved.artists.length && !saved.events.length) {
        status.textContent = "먼저 공연이나 관심 아티스트를 하나 이상 저장해 주세요.";
        return;
      }
      const kinds = [...form.querySelectorAll("[name=kind]:checked")].map(input => input.value);
      if (!kinds.length) {
        status.textContent = "받을 알림 종류를 하나 이상 선택해 주세요.";
        return;
      }
      status.textContent = "인증 메일을 보내는 중입니다.";
      try {
        const email = form.elements.email.value.trim().toLowerCase();
        const sameSubscription = settings.email === email && settings.manageToken;
        if (sameSubscription) {
          settings = write({ ...settings, kinds });
          await sync(saved);
          status.textContent = "관심 목록과 알림 설정을 동기화했습니다.";
          return;
        }
        const result = await request("/subscriptions", { method: "POST", body: JSON.stringify({ email, consent: form.elements.consent.checked, artists: saved.artists, events: saved.events, kinds }) });
        settings = write({
          email,
          kinds,
          manageToken: result.manageToken || "",
          verified: false
        });
        status.textContent = result.message;
        unsubscribeButton.hidden = !settings.manageToken;
      } catch (error) { status.textContent = error.message; }
    });

    form.querySelector(".email-alert-kinds").addEventListener("change", async event => {
      if (!settings.manageToken) return;
      const kinds = [...form.querySelectorAll("[name=kind]:checked")].map(input => input.value);
      if (!kinds.length) {
        event.target.checked = true;
        status.textContent = "알림 종류를 하나 이상 선택해야 합니다.";
        return;
      }
      settings = write({ ...settings, kinds });
      try { await sync(); status.textContent = "알림 종류를 변경했습니다."; }
      catch (error) { status.textContent = error.message; }
    });

    unsubscribeButton.addEventListener("click", async () => {
      try {
        await request("/unsubscribe", { method: "POST", body: JSON.stringify({ manageToken: settings.manageToken }) });
        settings = write(empty());
        status.textContent = "이메일 알림을 해지했습니다.";
        unsubscribeButton.hidden = true;
      } catch (error) { status.textContent = error.message; }
    });
  }

  root.JLIVE_EMAIL_ALERTS = { read, setup, sync };
  if (typeof module === "object" && module.exports) module.exports = root.JLIVE_EMAIL_ALERTS;
  if (typeof document === "object") document.addEventListener("DOMContentLoaded", setup);
})(typeof window === "object" ? window : globalThis);
