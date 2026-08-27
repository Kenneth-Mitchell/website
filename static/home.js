(function () {
  const groups = document.querySelectorAll('[data-accordion-group]');

  function setOpen(item, open) {
    const trigger = item.querySelector(':scope > [data-accordion-trigger]');
    const panel = item.querySelector(':scope > [data-accordion-panel]');
    if (!trigger || !panel) return;

    trigger.setAttribute('aria-expanded', String(open));
    panel.setAttribute('aria-hidden', String(!open));
    panel.toggleAttribute('inert', !open);
    panel.classList.toggle('is-open', open);
  }

  groups.forEach((group) => {
    const items = Array.from(group.children).filter((child) =>
      child.matches('[data-accordion-item]')
    );
    const triggers = items
      .map((item) => item.querySelector(':scope > [data-accordion-trigger]'))
      .filter(Boolean);

    items.forEach((item) => {
      const trigger = item.querySelector(':scope > [data-accordion-trigger]');
      if (!trigger) return;

      trigger.addEventListener('click', () => {
        const opening = trigger.getAttribute('aria-expanded') !== 'true';
        items.forEach((sibling) => setOpen(sibling, sibling === item && opening));
      });

      trigger.addEventListener('keydown', (event) => {
        const index = triggers.indexOf(trigger);
        let nextIndex;

        if (event.key === 'ArrowDown') nextIndex = (index + 1) % triggers.length;
        if (event.key === 'ArrowUp') nextIndex = (index - 1 + triggers.length) % triggers.length;
        if (event.key === 'Home') nextIndex = 0;
        if (event.key === 'End') nextIndex = triggers.length - 1;
        if (nextIndex === undefined) return;

        event.preventDefault();
        triggers[nextIndex].focus();
      });
    });
  });
})();
