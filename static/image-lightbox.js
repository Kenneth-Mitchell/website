(() => {
  const images = [...document.querySelectorAll(".prose img")];
  if (!images.length || typeof HTMLDialogElement === "undefined" || !window.createImageFocus) return;

  const dialog = document.createElement("dialog");
  dialog.className = "photo-focus-dialog";
  dialog.setAttribute("data-photo-focus-dialog", "");
  dialog.setAttribute("aria-label", "Expanded image");
  dialog.innerHTML = `
    <button class="photo-focus-close" type="button" aria-label="Close expanded image" data-photo-focus-close>&times;</button>
    <div class="photo-focus-stage" data-photo-focus-stage aria-busy="false">
      <div class="photo-focus-loading" data-photo-focus-loading role="status" aria-label="Loading image">
        <span class="photo-loader-ring" aria-hidden="true"></span>
      </div>
      <img data-photo-focus-image alt="" role="button" tabindex="0" draggable="false" aria-label="Magnify image">
    </div>
    <p data-photo-focus-caption hidden></p>
  `;
  document.body.append(dialog);

  const viewer = window.createImageFocus(dialog, {
    fitScaleCap: 0.8,
    maxZoom: 1.4
  });

  const open = (image) => viewer.open({
    src: image.currentSrc || image.src,
    alt: image.alt || "",
    caption: image.alt || "",
    opener: image
  });

  images.forEach((image) => {
    image.tabIndex = 0;
    image.setAttribute("role", "button");
    image.setAttribute("aria-label", image.alt ? `Enlarge image: ${image.alt}` : "Enlarge image");
    image.addEventListener("click", () => open(image));
    image.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      open(image);
    });
  });
})();
