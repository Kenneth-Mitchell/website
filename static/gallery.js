(function () {
  const galleryLinks = document.querySelectorAll('[data-gallery-open]');
  const galleryDialogs = document.querySelectorAll('[data-gallery-dialog]');
  const catalogStage = document.querySelector('[data-photo-catalog-stage]');
  const catalogLoading = document.querySelector('[data-photo-catalog-loading]');
  const focusDialog = document.querySelector('[data-photo-focus-dialog]');
  const focusStage = focusDialog.querySelector('[data-photo-focus-stage]');
  const focusImage = focusDialog.querySelector('[data-photo-focus-image]');
  const focusLoading = focusDialog.querySelector('[data-photo-focus-loading]');
  const focusCaption = focusDialog.querySelector('[data-photo-focus-caption]');
  const focusButtons = document.querySelectorAll('[data-photo-focus]');
  const catalogPath = window.location.pathname;
  const galleryEntries = [];
  let focusScale = 1;
  let focusX = 0;
  let focusY = 0;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragOriginX = 0;
  let dragOriginY = 0;
  let focusDragging = false;
  let focusMoved = false;
  let focusRequest = 0;

  function waitForImage(image) {
    const loaded = image.complete
      ? Promise.resolve()
      : new Promise((resolve) => {
          image.addEventListener('load', resolve, { once: true });
          image.addEventListener('error', resolve, { once: true });
        });
    return loaded.then(() => (
      image.naturalWidth && image.decode
        ? image.decode().catch(() => {})
        : undefined
    ));
  }

  function waitForImages(images) {
    return Promise.race([
      Promise.all(images.map(waitForImage)),
      new Promise((resolve) => setTimeout(resolve, 8000))
    ]);
  }

  function nextPaint() {
    return new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });
  }

  async function revealCatalog() {
    const covers = Array.from(document.querySelectorAll('[data-photo-groups] .photo-cover img'));
    await waitForImages(covers);
    await nextPaint();
    catalogStage.classList.remove('is-loading');
    catalogStage.setAttribute('aria-busy', 'false');
    catalogLoading.hidden = true;
  }

  revealCatalog();

  function setFocusLoading(isLoading) {
    focusDialog.classList.toggle('is-loading', isLoading);
    focusStage.setAttribute('aria-busy', String(isLoading));
    focusLoading.hidden = !isLoading;
  }

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

  function fitFocusImage() {
    if (!focusImage.naturalWidth || !focusImage.naturalHeight) return;
    const fitRatio = Math.min(
      focusStage.clientWidth / focusImage.naturalWidth,
      focusStage.clientHeight / focusImage.naturalHeight
    );
    focusImage.style.width = `${Math.floor(focusImage.naturalWidth * fitRatio)}px`;
    focusImage.style.height = `${Math.floor(focusImage.naturalHeight * fitRatio)}px`;
    renderFocus();
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
    focusScale = Math.min(
      2.5,
      focusImage.naturalWidth / focusImage.offsetWidth,
      focusImage.naturalHeight / focusImage.offsetHeight
    );
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

  function requestGalleryClose(dialog) {
    if (!dialog.open) return;
    if (history.state?.photoGalleryDirect) {
      history.replaceState({}, '', catalogPath);
      closeGallery(dialog);
      return;
    }
    if (history.state?.photoGallery) {
      history.back();
      return;
    }
    closeGallery(dialog);
  }

  galleryLinks.forEach((link, index) => {
    const dialog = galleryDialogs[index];
    const galleryPath = link.dataset.galleryPath;
    const strip = dialog.querySelector('[data-gallery-strip]');
    const items = Array.from(strip.querySelectorAll('.gallery-strip-item'));
    const stripImages = Array.from(strip.querySelectorAll('img'));
    const progress = dialog.querySelector('[data-gallery-progress]');
    const dots = Array.from(progress.querySelectorAll('[data-gallery-dot]'));

    function loadGalleryImages() {
      stripImages.forEach((image) => {
        image.loading = 'eager';
        waitForImage(image).then(async () => {
          image.classList.add('is-loaded');
          await nextPaint();
          if (dialog.open) updatePosition();
        });
      });
    }

    function updatePosition() {
      const currentIndex = items.reduce((closestIndex, item, itemIndex) => (
        Math.abs(item.offsetLeft - strip.scrollLeft) <
        Math.abs(items[closestIndex].offsetLeft - strip.scrollLeft)
          ? itemIndex
          : closestIndex
      ), 0);
      dots.forEach((dot, dotIndex) => dot.classList.toggle('is-active', dotIndex === currentIndex));
      progress.setAttribute('aria-label', `Image ${currentIndex + 1} of ${items.length}`);
      if (window.matchMedia('(max-width: 900px)').matches) {
        const activeImage = items[currentIndex].querySelector('img');
        if (!activeImage.complete || !activeImage.naturalWidth) {
          progress.classList.remove('is-positioned');
          return;
        }
        const imageRect = activeImage.getBoundingClientRect();
        const innerRect = dialog.querySelector('.gallery-overlay-inner').getBoundingClientRect();
        const dotsTop = Math.min(imageRect.bottom - innerRect.top + 10, innerRect.height - 20);
        progress.style.setProperty('--gallery-dots-top', `${dotsTop}px`);
        progress.classList.add('is-positioned');
      } else {
        progress.classList.remove('is-positioned');
        progress.style.removeProperty('--gallery-dots-top');
      }
    }

    function openGallery(historyMode = 'none') {
      if (dialog.open) return;
      dialog.showModal();
      document.documentElement.classList.add('gallery-is-open');
      strip.scrollLeft = 0;
      updatePosition();
      strip.focus();
      loadGalleryImages();
      if (historyMode === 'push') {
        history.pushState({ photoGallery: true }, '', galleryPath);
      } else if (historyMode === 'replace') {
        history.replaceState({ photoGallery: true, photoGalleryDirect: true }, '', galleryPath);
      }
    }

    galleryEntries.push({ dialog, galleryPath, openGallery });

    link.addEventListener('click', (event) => {
      event.preventDefault();
      openGallery('push');
    });

    dialog.querySelector('[data-gallery-close]').addEventListener('click', () => requestGalleryClose(dialog));
    dialog.addEventListener('click', (event) => {
      if (event.target.closest('.gallery-strip-item, [data-gallery-close]')) return;
      requestGalleryClose(dialog);
    });
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      requestGalleryClose(dialog);
    });
    dialog.addEventListener('close', () => {
      progress.classList.remove('is-positioned');
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
    window.addEventListener('resize', updatePosition);

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

  function syncGalleryToLocation() {
    const entry = galleryEntries.find(({ galleryPath }) => galleryPath === window.location.pathname);
    galleryEntries.forEach(({ dialog }) => {
      if (dialog.open && dialog !== entry?.dialog) closeGallery(dialog);
    });
    if (entry && !entry.dialog.open) entry.openGallery('none');
  }

  window.addEventListener('popstate', syncGalleryToLocation);

  const directGallery = new URLSearchParams(window.location.search).get('group');
  if (directGallery) {
    const entry = galleryEntries.find(({ galleryPath }) => (
      galleryPath.split('/').filter(Boolean).pop() === directGallery
    ));
    if (entry) entry.openGallery('replace');
  }

  focusButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const request = ++focusRequest;
      focusImage.removeAttribute('src');
      focusImage.style.removeProperty('width');
      focusImage.style.removeProperty('height');
      focusImage.alt = button.dataset.alt;
      focusCaption.textContent = button.dataset.caption;
      focusCaption.hidden = !button.dataset.caption;
      setFocusLoading(true);
      focusDialog.showModal();
      resetFocus();
      requestAnimationFrame(() => {
        if (request !== focusRequest || !focusDialog.open) return;
        focusImage.src = button.dataset.full;
      });
    });
  });

  focusDialog.querySelector('[data-photo-focus-close]').addEventListener('click', () => focusDialog.close());
  focusDialog.addEventListener('click', (event) => {
    if (event.target === focusDialog || event.target === focusStage) focusDialog.close();
  });
  focusDialog.addEventListener('close', () => {
    focusRequest += 1;
    focusImage.removeAttribute('src');
    setFocusLoading(false);
    resetFocus();
  });

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
  focusImage.addEventListener('load', () => {
    if (!focusDialog.open) return;
    setFocusLoading(false);
    resetFocus();
    fitFocusImage();
    focusImage.focus();
  });
  focusImage.addEventListener('error', () => {
    if (!focusDialog.open) return;
    setFocusLoading(false);
  });
  window.addEventListener('resize', () => {
    if (!focusDialog.open) return;
    resetFocus();
    fitFocusImage();
  });
})();
