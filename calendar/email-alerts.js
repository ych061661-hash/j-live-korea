"use strict";

(function exposeEmailAlerts(root) {
  const STORAGE_KEY = "j-live-email-alerts-v1";
  const empty = () => ({ email: "", kinds: ["announcement", "presale", "ticket", "extra-seat", "weekly"], manageToken: "", verified: false });
  const read = () => {
    try { return { ...empty(), ...JSON.parse(root.localStorage.getItem(STORAGE_KEY) || "null") }; }
    catch { return empty(); }
  };
  const write = value => {
    const next = { ...empty(), ...value };
    root.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  };
  const endpoint = path => `${root.JLIVE_CONFIG?.emailAlertsApi || "/api/alerts"}${path}`;
  let settings = read();

  async function request(path, options) {
    const response = await fetch(endpoint(path), { ...options, headers: { "Content-Type": "application/json" } });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || "이메일 알림 요청에 실패했습니다.");
    return body;
  }

  function track(name, detail = {}) {
    root.JLIVE_ANALYTICS?.track(name, { ...detail, source: "calendar_email_alerts" });
  }

  function classifyReturnState(search = "", hash = "") {
    const query = new URLSearchParams(search).get("email-alert");
    const fragment = new URLSearchParams(hash.replace(/^#/, ""));
    if (fragment.get("email-alert") === "recovered" && fragment.get("manage-token")) {
      return { type: "recovered", manageToken: fragment.get("manage-token") };
    }
    return { type: ["verified", "unsubscribed", "invalid"].includes(query) ? query : "" };
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
    const submitButton = document.querySelector("#emailAlertSubmit");
    const unsubscribeButton = document.querySelector("#emailAlertUnsubscribe");
    const consentLabel = form.querySelector(".email-alert-consent");
    const selection = document.querySelector("#emailAlertSelection");
    const steps = {
      save: document.querySelector("#emailAlertStepSave"),
      send: document.querySelector("#emailAlertStepSend"),
      verify: document.querySelector("#emailAlertStepVerify")
    };

    function setStatus(message, state = "") {
      status.textContent = message;
      if (state) status.dataset.state = state;
      else delete status.dataset.state;
    }

    function updateView(saved = favorites()) {
      const savedCount = saved.artists.length + saved.events.length;
      selection.textContent = savedCount
        ? `관심 아티스트 ${saved.artists.length}명 · 저장 공연 ${saved.events.length}개를 알림에 포함합니다.`
        : "관심 공연을 저장하면 알림을 신청할 수 있습니다.";
      steps.save.className = savedCount ? "is-complete" : "is-active";
      steps.send.className = settings.manageToken || settings.verified ? "is-complete" : savedCount ? "is-active" : "";
      steps.verify.className = settings.verified ? "is-complete" : settings.manageToken ? "is-active" : "";
      updateSubscriptionMode();
      unsubscribeButton.hidden = !settings.manageToken;
    }

    function updateSubscriptionMode() {
      const email = form.elements.email.value.trim().toLowerCase();
      const managingCurrent = Boolean(settings.manageToken && email === settings.email);
      submitButton.textContent = managingCurrent ? "알림 설정 저장" : "인증 메일 받기";
      consentLabel.hidden = managingCurrent;
      form.elements.consent.disabled = managingCurrent;
      if (managingCurrent) form.elements.consent.checked = true;
    }

    async function runPending(label, work) {
      const original = submitButton.textContent;
      submitButton.disabled = true;
      submitButton.textContent = label;
      try { return await work(); }
      finally {
        submitButton.disabled = false;
        submitButton.textContent = original;
      }
    }

    form.elements.email.value = settings.email;
    form.querySelectorAll("[name=kind]").forEach(input => { input.checked = settings.kinds.includes(input.value); });
    updateView();
    form.elements.email.addEventListener("input", updateSubscriptionMode);
    track("email_alert_form_view", { subscriber_state: settings.verified ? "verified" : settings.manageToken ? "pending" : "new" });

    const returnState = classifyReturnState(location.search, location.hash);
    if (returnState.type === "recovered") {
      settings = write({ ...settings, manageToken: returnState.manageToken, verified: true });
      setStatus("이 브라우저에서 이메일 알림을 관리할 수 있습니다. 관심 목록을 동기화하는 중입니다.", "progress");
      updateView();
      track("email_alert_recovery_success");
      history.replaceState({}, "", location.pathname);
      sync().then(() => { setStatus("관심 목록과 알림 설정을 동기화했습니다.", "success"); })
        .catch(error => { setStatus(error.message, "error"); });
    } else if (returnState.type === "verified") {
      settings = write({ ...settings, verified: true });
      setStatus("이메일 인증이 완료되었습니다. 이제 맞춤 알림을 받을 수 있습니다.", "success");
      updateView();
      track("email_alert_verified", { subscriber_state: "verified" });
      history.replaceState({}, "", location.pathname);
    } else if (returnState.type === "unsubscribed") {
      settings = write(empty());
      setStatus("이메일 알림을 해지했습니다.", "success");
      updateView();
      track("email_alert_unsubscribe", { method: "email_link" });
      history.replaceState({}, "", location.pathname);
    } else if (returnState.type === "invalid") {
      setStatus("인증 또는 해지 링크가 만료됐거나 올바르지 않습니다.", "error");
      track("email_alert_verification_error", { error_type: "invalid_or_expired_link" });
      history.replaceState({}, "", location.pathname);
    } else if (settings.manageToken) {
      setStatus(settings.verified ? "이메일 알림 사용 중" : "받은 편지함을 확인해 이메일 인증을 완료해 주세요.", settings.verified ? "success" : "progress");
    }

    root.addEventListener?.("jlive:favorites-changed", event => updateView(event.detail));

    form.addEventListener("submit", async event => {
      event.preventDefault();
      const saved = favorites();
      if (!saved.artists.length && !saved.events.length) {
        setStatus("먼저 공연이나 관심 아티스트를 하나 이상 저장해 주세요.", "error");
        track("email_alert_signup_error", { error_type: "no_favorites" });
        return;
      }
      const kinds = [...form.querySelectorAll("[name=kind]:checked")].map(input => input.value);
      if (!kinds.length) {
        setStatus("받을 알림 종류를 하나 이상 선택해 주세요.", "error");
        track("email_alert_signup_error", { error_type: "no_kinds" });
        return;
      }
      setStatus(settings.manageToken ? "알림 설정을 저장하는 중입니다." : "인증 메일을 보내는 중입니다.", "progress");
      try {
        const email = form.elements.email.value.trim().toLowerCase();
        const sameSubscription = settings.email === email && settings.manageToken;
        if (sameSubscription) {
          await runPending("저장 중", async () => {
            settings = write({ ...settings, kinds });
            await sync(saved);
          });
          setStatus("관심 목록과 알림 설정을 동기화했습니다.", "success");
          track("email_alert_preferences_update", { kind_count: kinds.length, favorite_count: saved.artists.length + saved.events.length, weekly_digest: kinds.includes("weekly") });
          return;
        }
        track("email_alert_signup_submit", { kind_count: kinds.length, favorite_count: saved.artists.length + saved.events.length, weekly_digest: kinds.includes("weekly") });
        const result = await runPending("전송 중", () => request("/subscriptions", { method: "POST", body: JSON.stringify({ email, consent: form.elements.consent.checked, artists: saved.artists, events: saved.events, kinds }) }));
        settings = write({
          email,
          kinds,
          manageToken: result.manageToken || "",
          verified: false
        });
        setStatus(`${result.message} 받은 편지함과 스팸함을 확인해 주세요.`, "success");
        updateView(saved);
        track("email_alert_signup_sent", { kind_count: kinds.length, favorite_count: saved.artists.length + saved.events.length, existing_subscriber: Boolean(result.existing), weekly_digest: kinds.includes("weekly") });
      } catch (error) {
        setStatus(error.message, "error");
        track("email_alert_signup_error", { error_type: "request_failed" });
      }
    });

    form.querySelector(".email-alert-kinds").addEventListener("change", async event => {
      if (!settings.manageToken) return;
      const kinds = [...form.querySelectorAll("[name=kind]:checked")].map(input => input.value);
      if (!kinds.length) {
        event.target.checked = true;
        setStatus("알림 종류를 하나 이상 선택해야 합니다.", "error");
        return;
      }
      settings = write({ ...settings, kinds });
      try {
        await sync();
        setStatus("알림 종류를 변경했습니다.", "success");
        track("email_alert_preferences_update", { kind_count: kinds.length, weekly_digest: kinds.includes("weekly") });
      } catch (error) { setStatus(error.message, "error"); }
    });

    unsubscribeButton.addEventListener("click", async () => {
      try {
        await request("/unsubscribe", { method: "POST", body: JSON.stringify({ manageToken: settings.manageToken }) });
        settings = write(empty());
        setStatus("이메일 알림을 해지했습니다.", "success");
        updateView();
        track("email_alert_unsubscribe", { method: "browser" });
      } catch (error) { setStatus(error.message, "error"); }
    });
  }

  root.JLIVE_EMAIL_ALERTS = { classifyReturnState, read, setup, sync };
  if (typeof module === "object" && module.exports) module.exports = root.JLIVE_EMAIL_ALERTS;
  if (typeof document === "object") document.addEventListener("DOMContentLoaded", setup);
})(typeof window === "object" ? window : globalThis);
