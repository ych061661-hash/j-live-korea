"use strict";

const search = document.querySelector("#fanclubSearch");
const cards = [...document.querySelectorAll(".fanclub-card")];
const filters = [...document.querySelectorAll(".fanclub-filters button")];
const empty = document.querySelector("#fanclubEmpty");
let activeFilter = "all";

function render() {
  const query = search.value.trim().toLocaleLowerCase();
  let visible = 0;

  for (const card of cards) {
    const matchesFilter = activeFilter === "all" || card.dataset.region === activeFilter;
    const matchesQuery = !query || card.dataset.search.toLocaleLowerCase().includes(query);
    card.hidden = !(matchesFilter && matchesQuery);
    if (!card.hidden) visible += 1;
  }

  empty.hidden = visible !== 0;
}

search.addEventListener("input", render);
for (const button of filters) {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    for (const item of filters) {
      const selected = item === button;
      item.classList.toggle("active", selected);
      item.setAttribute("aria-pressed", String(selected));
    }
    render();
  });
}
