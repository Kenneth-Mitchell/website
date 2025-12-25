# Templates

Quick copy-paste snippets for adding content.

---

## New thought (blog post)

1. Copy `thought/_template.html` to `thought/your-post-name.html`
2. Replace TITLE and YYYY.MM.DD
3. Write your content in the <article> tags
4. Add this to `thoughts.html` inside the .posts div:

```html
<div class="post-item">
  <a href="thought/your-post-name.html">Your Post Title</a>
  <div class="meta">YYYY.MM.DD</div>
</div>
```

---

## New stuff I like

Add this to `stuff.html` inside the .grid div:

```html
<div class="item">
  <div class="item-image"><img src="images/NAME.jpg" alt="NAME"></div>
  <div class="item-title">NAME</div>
  <div class="item-type">TYPE</div>
  <div class="item-details">
    <p>Why you like it.</p>
  </div>
</div>
```

Types: game, book, film, music, philosophy, show, etc.

---

## New shot

Add this to `shots.html` inside the .gallery div:

```html
<div class="gallery-item"><img src="images/FILENAME.jpg" alt="DESCRIPTION"></div>
```

---

## Images

Put images in `/images/` folder. Create it if it doesn't exist.
