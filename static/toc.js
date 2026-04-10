(function () {
  const toc = document.querySelector('.toc');
  if (!toc) return;

  const toggle = document.querySelector('.toc-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const open = toc.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
    });
    toc.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        toc.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  const headings = Array.from(
    document.querySelectorAll('article h2[id], article h3[id], article h4[id]')
  );
  if (headings.length === 0) return;

  const linkMap = new Map();
  toc.querySelectorAll('a').forEach((link) => {
    const id = decodeURIComponent(link.getAttribute('href').slice(1));
    linkMap.set(id, link);
  });

  let ticking = false;
  function updateActive() {
    let current = headings[0];
    for (const h of headings) {
      if (h.getBoundingClientRect().top <= 120) {
        current = h;
      } else {
        break;
      }
    }
    toc.querySelectorAll('a.active').forEach((a) => a.classList.remove('active'));
    const link = linkMap.get(current.id);
    if (link) link.classList.add('active');
    ticking = false;
  }

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        requestAnimationFrame(updateActive);
        ticking = true;
      }
    },
    { passive: true }
  );

  updateActive();
})();
