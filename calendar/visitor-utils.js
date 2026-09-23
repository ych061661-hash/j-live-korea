"use strict";

(function exposeVisitorUtils(root) {
  function timeMinutes(value = "") {
    const match = String(value).match(/(오전|오후|낮|밤)?\s*(\d{1,2})(?::(\d{2}))?/);
    if (!match) return Number.MAX_SAFE_INTEGER;
    let hour = Number(match[2]);
    const minute = Number(match[3] || 0);
    if (["오후", "밤"].includes(match[1]) && hour < 12) hour += 12;
    if (match[1] === "오전" && hour === 12) hour = 0;
    return hour * 60 + minute;
  }

  function seoulDateParts(now = new Date()) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    }).formatToParts(now);
    const value = type => parts.find(part => part.type === type)?.value || "";
    return { date: `${value("year")}-${value("month")}-${value("day")}`, minutes: Number(value("hour")) * 60 + Number(value("minute")) };
  }

  function isVerifiedDate(event, key) {
    const field = event.verification?.[key];
    if (typeof field?.status === "string") return field.status === "confirmed";
    return event.ticketingStatus === "confirmed";
  }

  function ticketStatus(event, now = new Date()) {
    if (event.status === "cancelled") return { key: "cancelled", label: "공식 취소" };
    if (event.status === "postponed") return { key: "postponed", label: "공식 연기" };
    const current = seoulDateParts(now);
    if (event.concertDate && (event.concertDate < current.date
      || (event.concertDate === current.date && event.time && timeMinutes(event.time) <= current.minutes))) {
      return { key: "ended", label: "공연 종료" };
    }
    if (event.ticketingStatus === "conflict" || event.verification?.ticketing?.status === "conflict") return { key: "checking", label: "예매 일정 확인 중" };
    if (event.ticketingStatus === "pending_announcement" || event.verification?.ticketing?.status === "pending_announcement") return { key: "pending", label: "예매 일정 발표 대기" };

    const date = event.ticketDate || event.presaleDate;
    const time = event.ticketDate ? event.ticketTime : event.presaleTime;
    const field = event.ticketDate ? "ticketDate" : "presaleDate";
    if (!date || !isVerifiedDate(event, field)) return { key: "unknown", label: "예매 일정 미확인" };
    const type = event.ticketDate ? "예매" : "선예매";
    if (date > current.date) return { key: "upcoming", label: `${type} 오픈 예정` };
    if (date < current.date) return { key: "started", label: `${type} 시작일 지남` };
    if (!time) return { key: "today-unknown-time", label: `${type}일 오늘 · 시간 미확인` };
    if (timeMinutes(time) > current.minutes) return { key: "upcoming", label: `${type} 오픈 예정` };
    return { key: "started", label: `${type} 시작일 지남` };
  }

  function ticketAvailability(event, now = new Date()) {
    if (event.status === "cancelled") return { key: "cancelled", label: "공식 취소" };
    if (event.status === "postponed") return { key: "postponed", label: "공식 연기" };
    const current = seoulDateParts(now);
    if (event.concertDate && (event.concertDate < current.date
      || (event.concertDate === current.date && event.time && timeMinutes(event.time) <= current.minutes))) {
      return { key: "ended", label: "공연 종료" };
    }
    const dates = verificationDates(event);
    if (dates.availability) return {
      key: event.ticketAvailability,
      label: event.ticketAvailability === "sold_out" ? "매진" : "판매 중",
      note: `확인 시점 기준 ${dates.availability}`
    };
    return { key: "unknown", label: "현재 판매 상태는 공식 예매처에서 확인" };
  }

  function priceStatus(event) {
    const status = event.verification?.price?.status;
    if (status === "pending_announcement") return { key: "pending", label: "가격 발표 대기" };
    if (status === "conflict") return { key: "checking", label: "가격 확인 중" };
    return { key: "unknown", label: "가격 미확인" };
  }

  function verificationDates(event) {
    const availabilityVerified = ["sold_out", "in_stock"].includes(event.ticketAvailability)
      && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/.test(String(event.ticketStatusVerifiedAt || ""))
      && /^https:\/\//i.test(String(event.ticketStatusSource || ""));
    return {
      schedule: event.scheduleVerifiedAt || event.verification?.concertDate?.verifiedAt || event.verifiedAt || "",
      price: event.priceVerifiedAt || event.verification?.price?.verifiedAt || "",
      availability: availabilityVerified ? event.ticketStatusVerifiedAt.slice(0, 10) : "",
      article: event.articleUpdatedAt || ""
    };
  }

  root.JLIVE_VISITOR = { isVerifiedDate, priceStatus, seoulDateParts, ticketAvailability, ticketStatus, timeMinutes, verificationDates };
  if (typeof module === "object" && module.exports) module.exports = root.JLIVE_VISITOR;
})(typeof window === "object" ? window : globalThis);
