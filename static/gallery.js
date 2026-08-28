(function () {
  const galleryLinks = document.querySelectorAll('[data-gallery-open]');
  const galleryDialogs = document.querySelectorAll('[data-gallery-dialog]');
  const catalogStage = document.querySelector('[data-photo-catalog-stage]');
  const catalogLoading = document.querySelector('[data-photo-catalog-loading]');
  const focusDialog = document.querySelector('[data-photo-focus-dialog]');
  const focusButtons = document.querySelectorAll('[data-photo-focus]');
  const focusViewer = window.createImageFocus(focusDialog);
  const catalogPath = document.querySelector('[data-photo-catalog-path]').dataset.photoCatalogPath;
  const galleryEntries = [];

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

  function syncGalleryToLocation(historyMode = 'none') {
    const entry = galleryEntries.find(({ galleryPath }) => galleryPath === window.location.pathname);
    galleryEntries.forEach(({ dialog }) => {
      if (dialog.open && dialog !== entry?.dialog) closeGallery(dialog);
    });
    if (entry && !entry.dialog.open) entry.openGallery(historyMode);
  }

  window.addEventListener('popstate', () => syncGalleryToLocation());
  syncGalleryToLocation(window.location.pathname === catalogPath ? 'none' : 'replace');

  focusButtons.forEach((button) => {
    button.addEventListener('click', () => {
      focusViewer.open({
        src: button.dataset.full,
        alt: button.dataset.alt,
        caption: button.dataset.caption,
        opener: button
      });
    });
  });
})();
