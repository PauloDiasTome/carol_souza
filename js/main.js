// WhatsApp da Carol só com dígitos: DDI + DDD + número
const WHATSAPP_NUMBER = '5521976431317';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Cada [data-whatsapp] abre a conversa com a própria mensagem pronta (sem emoji: a prévia do WhatsApp quebra)
document.querySelectorAll('[data-whatsapp]').forEach((link) => {
  link.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(link.dataset.whatsapp)}`;
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

// Header com fundo, barra de progresso e botão flutuante acompanham a rolagem
const header = document.querySelector('[data-header]');
const progress = document.querySelector('[data-progress]');
const fab = document.querySelector('[data-fab]');
const hero = document.querySelector('.hero');
let bubbleShown = false;

const onScroll = () => {
  const y = window.scrollY;
  header.classList.toggle('is-scrolled', y > 16);

  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.setProperty('--progress', scrollable > 0 ? y / scrollable : 0);

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

// Blocos entram e contadores disparam ao aparecer na tela
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    if (el.dataset.count) {
      if (!reduceMotion) countUp(el);
    } else {
      el.classList.add('is-visible');
    }
    observer.unobserve(el);
  });
}, { threshold: 0.15 });

document.querySelectorAll('[data-reveal], [data-count]').forEach((el) => observer.observe(el));

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
