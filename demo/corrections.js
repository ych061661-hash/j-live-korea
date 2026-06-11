"use strict";

const correctionParams = new URLSearchParams(location.search);
const correctionArtist = document.querySelector("#correctionArtist");
correctionArtist.value = correctionParams.get("artist") || "";

document.querySelector("#correctionForm").addEventListener("submit", event => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(event.currentTarget));
  const email = (window.JLIVE_CONFIG || {}).contactEmail || "ydh061661@gmail.com";
  const subject = `[정보 수정 요청] ${values.artist}`;
  const body = [
    `아티스트/공연: ${values.artist}`,
    `공연 ID: ${correctionParams.get("event") || "없음"}`,
    "",
    "수정 내용:",
    values.message,
    "",
    `공식 출처: ${values.source}`
  ].join("\n");
  location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});
