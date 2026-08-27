(function () {
  const galleryLinks = document.querySelectorAll('[data-gallery-open]');
  const galleryDialogs = document.querySelectorAll('[data-gallery-dialog]');
  const focusDialog = document.querySelector('[data-photo-focus-dialog]');
  const focusImage = focusDialog.querySelector('[data-photo-focus-image]');
  const focusCaption = focusDialog.querySelector('[data-photo-focus-caption]');
  const focusButtons = document.querySelectorAll('[data-photo-focus]');

  function closeGallery(dialog) {
    dialog.close();
    document.documentElement.classList.remove('gallery-is-open');
  }

  galleryLinks.forEach((link, index) => {
    const dialog = galleryDialogs[index];
    const strip = dialog.querySelector('[data-gallery-strip]');
    const items = Array.from(strip.querySelectorAll('.gallery-strip-item'));
    const progress = dialog.querySelector('[data-gallery-progress]');
    const position = progress.querySelector('[data-gallery-position]');

    function updatePosition() {
      const currentIndex = items.reduce((closestIndex, item, itemIndex) => (
        Math.abs(item.offsetLeft - strip.scrollLeft) <
        Math.abs(items[closestIndex].offsetLeft - strip.scrollLeft)
          ? itemIndex
          : closestIndex
      ), 0);
      position.textContent = `${currentIndex + 1} / ${items.length}`;
    }

    link.addEventListener('click', (event) => {
      event.preventDefault();
      dialog.showModal();
      document.documentElement.classList.add('gallery-is-open');
      strip.scrollLeft = 0;
      updatePosition();
      strip.focus();
    });

    dialog.querySelector('[data-gallery-close]').addEventListener('click', () => closeGallery(dialog));
    dialog.addEventListener('click', (event) => {
      if (event.target.closest('.gallery-strip-item, [data-gallery-close]')) return;
      closeGallery(dialog);
    });
    dialog.addEventListener('close', () => {
      document.documentElement.classList.remove('gallery-is-open');
      link.focus();
    });

    dialog.addEventListener('wheel', (event) => {
      if (!event.deltaX && !event.deltaY) return;
      event.preventDefault();
      const rawDelta = Math.abs(event.deltaY) > Math.abs(event.deltaX)
        ? event.deltaY
        : event.deltaX;
      const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? 36
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
          ? strip.clientWidth
          : 1;
      strip.scrollBy({ left: rawDelta * unit, behavior: 'auto' });
    }, { passive: false, capture: true });

    strip.addEventListener('scroll', updatePosition, { passive: true });
    strip.addEventListener('touchstart', () => progress.classList.add('is-used'), { passive: true });

    strip.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const currentIndex = items.reduce((closestIndex, item, itemIndex) => (
        Math.abs(item.offsetLeft - strip.scrollLeft) <
        Math.abs(items[closestIndex].offsetLeft - strip.scrollLeft)
          ? itemIndex
          : closestIndex
      ), 0);
      const nextIndex = Math.max(0, Math.min(
        items.length - 1,
        currentIndex + (event.key === 'ArrowRight' ? 1 : -1)
      ));
      items[nextIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    });
  });

  focusButtons.forEach((button) => {
    button.addEventListener('click', () => {
      focusImage.src = button.dataset.full;
      focusImage.alt = button.dataset.alt;
      focusCaption.textContent = button.dataset.caption;
      focusCaption.hidden = !button.dataset.caption;
      focusDialog.showModal();
    });
  });

  focusDialog.querySelector('[data-photo-focus-close]').addEventListener('click', () => focusDialog.close());
  focusDialog.addEventListener('click', (event) => {
    if (event.target === focusDialog) focusDialog.close();
  });
})();
