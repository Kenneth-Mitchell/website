// ============================================================
// Text Decode Effect
// Add class="pre-decode" to body and data-decode to elements
// ============================================================

const glitchChars = '░▒▓█▀▄╔╗╚╝║═─┼┤├ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*';

function randomChar() {
  return glitchChars[Math.floor(Math.random() * glitchChars.length)];
}

// Store all cycling intervals so we can stop them
const cyclingIntervals = [];

function scrambleElement(element) {
  if (element.children.length > 0) {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    let node;
    const textNodes = [];
    while (node = walker.nextNode()) {
      if (node.textContent.trim()) {
        textNodes.push(node);
      }
    }
    textNodes.forEach(textNode => {
      const span = document.createElement('span');
      span.setAttribute('data-decode-inner', '');
      span.textContent = textNode.textContent;
      textNode.parentNode.replaceChild(span, textNode);
      scrambleSpan(span);
    });
  } else {
    scrambleSpan(element);
  }
}

function scrambleSpan(element) {
  const text = element.textContent;
  const chars = text.split('');
  
  element.innerHTML = chars.map((char, i) => {
    if (char === ' ') return ' ';
    return `<span class="decode-char" data-final="${char}" data-index="${i}">${randomChar()}</span>`;
  }).join('');
  
  // Start cycling all characters immediately
  const spans = element.querySelectorAll('.decode-char');
  spans.forEach(span => {
    const interval = setInterval(() => {
      if (!span.dataset.resolved) {
        span.textContent = randomChar();
      }
    }, 50);
    cyclingIntervals.push({ span, interval });
  });
}

function resolveElement(element, startDelay) {
  const spans = element.querySelectorAll('.decode-char');
  const numChars = spans.length;
  
  // Scale down delay for longer text (faster for long sentences)
  const baseDelay = numChars > 30 ? 15 : numChars > 15 ? 20 : 25;
  const randomRange = numChars > 30 ? 20 : 30;
  
  spans.forEach((span, i) => {
    const delay = startDelay + (i * baseDelay) + (Math.random() * randomRange);
    
    setTimeout(() => {
      // Mark as resolved and set final character
      span.dataset.resolved = 'true';
      span.textContent = span.dataset.final;
      
      // Stop the cycling interval for this span
      const found = cyclingIntervals.find(item => item.span === span);
      if (found) {
        clearInterval(found.interval);
      }
    }, delay);
  });
}

function runDecode() {
  const elements = document.querySelectorAll('[data-decode]');
  
  if (elements.length === 0) return;
  
  // Phase 1: Scramble everything and start cycling
  elements.forEach(el => scrambleElement(el));
  
  // Show content (now scrambled and cycling)
  document.body.classList.remove('pre-decode');
  
  // Phase 2: Resolve with staggered timing
  let delay = 200;
  elements.forEach(el => {
    const innerSpans = el.querySelectorAll('[data-decode-inner]');
    if (innerSpans.length > 0) {
      innerSpans.forEach(span => {
        resolveElement(span, delay);
      });
    } else {
      resolveElement(el, delay);
    }
    delay += 80;
  });
}

document.addEventListener('DOMContentLoaded', runDecode);

