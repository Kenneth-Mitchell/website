(function () {
  const galleryLinks = document.querySelectorAll('[data-gallery-open]');
  const galleryDialogs = document.querySelectorAll('[data-gallery-dialog]');
  const focusDialog = document.querySelector('[data-photo-focus-dialog]');
  const focusStage = focusDialog.querySelector('[data-photo-focus-stage]');
  const focusImage = focusDialog.querySelector('[data-photo-focus-image]');
  const focusCaption = focusDialog.querySelector('[data-photo-focus-caption]');
  const focusButtons = document.querySelectorAll('[data-photo-focus]');
  let focusScale = 1;
  let focusX = 0;
  let focusY = 0;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragOriginX = 0;
  let dragOriginY = 0;
  let focusDragging = false;
  let focusMoved = false;

  function clampFocusPan() {
    const maxX = Math.max(0, (focusImage.offsetWidth * focusScale - focusStage.clientWidth) / 2);
    const maxY = Math.max(0, (focusImage.offsetHeight * focusScale - focusStage.clientHeight) / 2);
    focusX = Math.max(-maxX, Math.min(maxX, focusX));
    focusY = Math.max(-maxY, Math.min(maxY, focusY));
  }

  function renderFocus() {
    clampFocusPan();
    focusImage.style.transform = `translate(${focusX}px, ${focusY}px) scale(${focusScale})`;
    focusImage.classList.toggle('is-zoomed', focusScale > 1);
    focusImage.setAttribute('aria-label', focusScale > 1 ? 'Fit photograph to viewer' : 'Magnify photograph');
  }

  function resetFocus() {
    focusScale = 1;
    focusX = 0;
    focusY = 0;
    focusDragging = false;
    focusMoved = false;
    focusImage.classList.remove('is-dragging');
    renderFocus();
  }

  function toggleFocusZoom(event) {
    if (focusMoved) {
      focusMoved = false;
      return;
    }
    if (focusScale > 1) {
      resetFocus();
      return;
    }
    focusScale = 2.5;
    const stageRect = focusStage.getBoundingClientRect();
    const clickX = event.clientX || stageRect.left + stageRect.width / 2;
    const clickY = event.clientY || stageRect.top + stageRect.height / 2;
    focusX = -(clickX - stageRect.left - stageRect.width / 2) * focusScale;
    focusY = -(clickY - stageRect.top - stageRect.height / 2) * focusScale;
    renderFocus();
  }

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
      resetFocus();
      focusImage.focus();
    });
  });

  focusDialog.querySelector('[data-photo-focus-close]').addEventListener('click', () => focusDialog.close());
  focusDialog.addEventListener('click', (event) => {
    if (event.target === focusDialog || event.target === focusStage) focusDialog.close();
  });
  focusDialog.addEventListener('close', resetFocus);

  focusImage.addEventListener('click', toggleFocusZoom);
  focusImage.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    toggleFocusZoom(event);
  });
  focusImage.addEventListener('pointerdown', (event) => {
    if (focusScale === 1 || event.button !== 0) return;
    event.preventDefault();
    focusDragging = true;
    focusMoved = false;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    dragOriginX = focusX;
    dragOriginY = focusY;
    focusImage.classList.add('is-dragging');
    focusImage.setPointerCapture(event.pointerId);
  });
  focusImage.addEventListener('pointermove', (event) => {
    if (!focusDragging) return;
    const deltaX = event.clientX - dragStartX;
    const deltaY = event.clientY - dragStartY;
    if (Math.abs(deltaX) + Math.abs(deltaY) > 4) focusMoved = true;
    focusX = dragOriginX + deltaX;
    focusY = dragOriginY + deltaY;
    renderFocus();
  });
  function endFocusDrag(event) {
    if (!focusDragging) return;
    focusDragging = false;
    focusImage.classList.remove('is-dragging');
    if (focusImage.hasPointerCapture(event.pointerId)) focusImage.releasePointerCapture(event.pointerId);
  }
  focusImage.addEventListener('pointerup', endFocusDrag);
  focusImage.addEventListener('pointercancel', endFocusDrag);
  window.addEventListener('resize', renderFocus);
})();
