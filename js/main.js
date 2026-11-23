// Número do WhatsApp só com dígitos: DDI + DDD + número (ex.: 5521999999999).
// Enquanto estiver vazio, os botões abrem o direct do Instagram.
const WHATSAPP_NUMBER = '';
const INSTAGRAM_DM = 'https://ig.me/m/carolsousasc';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Cada [data-whatsapp] leva a própria mensagem pronta
document.querySelectorAll('[data-whatsapp]').forEach((link) => {
  link.href = WHATSAPP_NUMBER
    ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(link.dataset.whatsapp)}`
    : INSTAGRAM_DM;
  link.target = '_blank';
  link.rel = 'noopener';
});

// Frase que acende palavra por palavra
const splitWords = (el) => {
  [...el.childNodes].forEach((node) => {
    if (node.nodeType !== Node.TEXT_NODE) {
      splitWords(node);
      return;
    }
    const fragment = document.createDocumentFragment();
    node.textContent.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) {
        fragment.append(part);
        return;
      }
      const word = document.createElement('span');
      word.className = 'word';
      word.textContent = part;
      fragment.append(word);
    });
    node.replaceWith(fragment);
  });
};

const wordBlocks = reduceMotion ? [] : [...document.querySelectorAll('[data-words]')].map((el) => {
  splitWords(el);
  return { el, words: [...el.querySelectorAll('.word')], lit: -1 };
});

const updateWords = () => {
  const viewport = window.innerHeight;
  wordBlocks.forEach((block) => {
    const { top } = block.el.getBoundingClientRect();
    const progress = Math.min(Math.max((viewport * 0.85 - top) / (viewport * 0.45), 0), 1);
    const lit = Math.round(progress * block.words.length);
    if (lit === block.lit) return;
    block.lit = lit;
    block.words.forEach((word, i) => word.classList.toggle('is-lit', i < lit));
  });
};

// Header com fundo e botão flutuante aparecem depois do topo
const header = document.querySelector('[data-header]');
const fab = document.querySelector('[data-fab]');
const hero = document.querySelector('.hero');
let bubbleShown = false;

const onScroll = () => {
  const y = window.scrollY;
  header.classList.toggle('is-scrolled', y > 24);

  const showFab = y > hero.offsetHeight * 0.6;
  fab.classList.toggle('is-visible', showFab);
  if (showFab && !bubbleShown) {
    bubbleShown = true;
    setTimeout(() => fab.classList.add('show-bubble'), 1200);
    setTimeout(() => fab.classList.remove('show-bubble'), 6000);
  }

  updateWords();
};

let ticking = false;
window.addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    onScroll();
    ticking = false;
  });
}, { passive: true });
onScroll();

// Contador sobe de 0 até o número
const numberFormat = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const countUp = (el) => {
  const target = parseFloat(el.dataset.count);
  const start = performance.now();
  const duration = 1400;
  const step = (now) => {
    const t = Math.min((now - start) / duration, 1);
    el.textContent = numberFormat.format(target * (1 - (1 - t) ** 3));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};

// Blocos entram ao aparecer na tela
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    const counter = entry.target.querySelector('[data-count]');
    if (counter && !reduceMotion) countUp(counter);
    observer.unobserve(entry.target);
  });
}, { threshold: 0.15 });

document.querySelectorAll('[data-reveal]').forEach((el) => observer.observe(el));

// Carrossel: bolinhas indicam o card atual
document.querySelectorAll('[data-carousel]').forEach((carousel) => {
  const track = carousel.querySelector('.carousel__track');
  const items = [...track.children];
  const dots = carousel.querySelector('.carousel__dots');

  const buttons = items.map((item, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', `Ir para o card ${i + 1}`);
    button.addEventListener('click', () => item.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' }));
    dots.append(button);
    return button;
  });

  const update = () => {
    const step = items[1].offsetLeft - items[0].offsetLeft;
    const index = Math.round(track.scrollLeft / step);
    buttons.forEach((button, i) => button.classList.toggle('is-active', i === index));
  };

  track.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
  update();
});

// Cupom: copia e avisa
const toast = document.querySelector('[data-toast]');
let toastTimer;

const showToast = (message) => {
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2200);
};

document.querySelectorAll('[data-copy]').forEach((button) => {
  button.addEventListener('click', async () => {
    const code = button.dataset.copy;
    try {
      await navigator.clipboard.writeText(code);
      navigator.vibrate?.(15);
      showToast(`Cupom ${code} copiado!`);
    } catch {
      showToast(`Seu cupom: ${code}`);
    }
  });
});

document.querySelectorAll('[data-year]').forEach((el) => {
  el.textContent = new Date().getFullYear();
});
