(() => {
  const filter = document.querySelector("[data-tag-filter]");
  const list = document.querySelector("[data-filter-list]");

  if (!filter || !list) return;

  const buttons = [...filter.querySelectorAll("[data-filter]")];
  const items = [...list.querySelectorAll("[data-tags]")];
  const empty = document.querySelector("[data-filter-empty]");

  const applyFilter = (tag) => {
    let visibleCount = 0;

    items.forEach((item) => {
      const tags = item.dataset.tags.split(",").filter(Boolean);
      const visible = tag === "all" || tags.includes(tag);
      item.hidden = !visible;
      if (visible) visibleCount += 1;
    });

    buttons.forEach((button) => {
      const active = button.dataset.filter === tag;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    if (empty) empty.hidden = visibleCount !== 0;
  };

  filter.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;
    applyFilter(button.dataset.filter);
  });
})();
