(() => {
  window.createImageFocus = (dialog, options = {}) => {
    const fitScaleCap = options.fitScaleCap ?? Infinity;
    const maxZoom = options.maxZoom ?? 2.5;
    const stage = dialog.querySelector("[data-photo-focus-stage]");
    const image = dialog.querySelector("[data-photo-focus-image]");
    const loading = dialog.querySelector("[data-photo-focus-loading]");
    const caption = dialog.querySelector("[data-photo-focus-caption]");
    const closeButton = dialog.querySelector("[data-photo-focus-close]");
    let scale = 1;
    let x = 0;
    let y = 0;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragOriginX = 0;
    let dragOriginY = 0;
    let dragging = false;
    let moved = false;
    let request = 0;
    let opener = null;

    const setLoading = (isLoading) => {
      dialog.classList.toggle("is-loading", isLoading);
      stage.setAttribute("aria-busy", String(isLoading));
      loading.hidden = !isLoading;
    };

    const clampPan = () => {
      const maxX = Math.max(0, (image.offsetWidth * scale - stage.clientWidth) / 2);
      const maxY = Math.max(0, (image.offsetHeight * scale - stage.clientHeight) / 2);
      x = Math.max(-maxX, Math.min(maxX, x));
      y = Math.max(-maxY, Math.min(maxY, y));
    };

    const render = () => {
      clampPan();
      image.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
      image.classList.toggle("is-zoomed", scale > 1);
      image.setAttribute("aria-label", scale > 1 ? "Fit image to viewer" : "Magnify image");
    };

    const fit = () => {
      if (!image.naturalWidth || !image.naturalHeight) return;
      const ratio = Math.min(
        stage.clientWidth / image.naturalWidth,
        stage.clientHeight / image.naturalHeight,
        fitScaleCap
      );
      image.style.width = `${Math.floor(image.naturalWidth * ratio)}px`;
      image.style.height = `${Math.floor(image.naturalHeight * ratio)}px`;
      render();
    };

    const reset = () => {
      scale = 1;
      x = 0;
      y = 0;
      dragging = false;
      moved = false;
      image.classList.remove("is-dragging");
      render();
    };

    const toggleZoom = (event) => {
      if (moved) {
        moved = false;
        return;
      }
      if (scale > 1) {
        reset();
        return;
      }
      scale = Math.min(maxZoom, image.naturalWidth / image.offsetWidth, image.naturalHeight / image.offsetHeight);
      const rect = stage.getBoundingClientRect();
      const clickX = event.clientX || rect.left + rect.width / 2;
      const clickY = event.clientY || rect.top + rect.height / 2;
      x = -(clickX - rect.left - rect.width / 2) * scale;
      y = -(clickY - rect.top - rect.height / 2) * scale;
      render();
    };

    const open = ({ src, alt = "", caption: captionText = "", opener: source = null }) => {
      const currentRequest = ++request;
      opener = source;
      image.removeAttribute("src");
      image.style.removeProperty("width");
      image.style.removeProperty("height");
      image.alt = alt;
      caption.textContent = captionText;
      caption.hidden = !captionText;
      setLoading(true);
      dialog.showModal();
      reset();
      requestAnimationFrame(() => {
        if (currentRequest === request && dialog.open) image.src = src;
      });
    };

    closeButton.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog || event.target === stage) dialog.close();
    });
    dialog.addEventListener("close", () => {
      request += 1;
      image.removeAttribute("src");
      setLoading(false);
      reset();
      opener?.focus();
      opener = null;
    });

    image.addEventListener("click", toggleZoom);
    image.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      toggleZoom(event);
    });
    image.addEventListener("pointerdown", (event) => {
      if (scale === 1 || event.button !== 0) return;
      event.preventDefault();
      dragging = true;
      moved = false;
      dragStartX = event.clientX;
      dragStartY = event.clientY;
      dragOriginX = x;
      dragOriginY = y;
      image.classList.add("is-dragging");
      image.setPointerCapture(event.pointerId);
    });
    image.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      const deltaX = event.clientX - dragStartX;
      const deltaY = event.clientY - dragStartY;
      if (Math.abs(deltaX) + Math.abs(deltaY) > 4) moved = true;
      x = dragOriginX + deltaX;
      y = dragOriginY + deltaY;
      render();
    });
    const endDrag = (event) => {
      if (!dragging) return;
      dragging = false;
      image.classList.remove("is-dragging");
      if (image.hasPointerCapture(event.pointerId)) image.releasePointerCapture(event.pointerId);
    };
    image.addEventListener("pointerup", endDrag);
    image.addEventListener("pointercancel", endDrag);
    image.addEventListener("load", () => {
      if (!dialog.open) return;
      setLoading(false);
      reset();
      fit();
      image.focus();
    });
    image.addEventListener("error", () => {
      if (dialog.open) setLoading(false);
    });
    window.addEventListener("resize", () => {
      if (!dialog.open) return;
      reset();
      fit();
    });

    return { open, close: () => dialog.close() };
  };
})();
