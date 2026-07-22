/* =====================================================
   ОБЩИЕ УТИЛИТЫ
===================================================== */
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function showScreen(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

/* =====================================================
   МУЗЫКА
===================================================== */
const musicBtn = document.getElementById('music-toggle');
const bgMusic = document.getElementById('bg-music');
let musicStarted = false;

musicBtn.addEventListener('click', () => {
  if (bgMusic.paused) {
    bgMusic.play().catch(() => {
      /* Файл assets/music.mp3 может отсутствовать — тогда просто игнорируем */
    });
    musicBtn.classList.add('playing');
  } else {
    bgMusic.pause();
    musicBtn.classList.remove('playing');
  }
  musicStarted = true;
});

/* Пытаемся мягко запустить музыку при первом клике пользователя по сайту
   (браузеры блокируют автозапуск со звуком до взаимодействия) */
function tryAutoStartMusic() {
  if (musicStarted) return;
  musicStarted = true;
  bgMusic.play()
    .then(() => musicBtn.classList.add('playing'))
    .catch(() => { /* тихо игнорируем, пользователь включит вручную */ });
}
document.body.addEventListener('click', tryAutoStartMusic, { once: true });

/* =====================================================
   ЭКРАН 1 — РОЗОВЫЙ ЦИФРОВОЙ ДОЖДЬ (CANVAS)
===================================================== */
const canvas = document.getElementById('rain-canvas');
const ctx = canvas.getContext('2d');
let rainDrops = [];
let rainAnimationId = null;
const rainChars = '01アリアナ愛❤ARIANA'.split('');

function setupCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const fontSize = 16;
  const columns = Math.floor(canvas.width / fontSize);
  rainDrops = new Array(columns).fill(0).map(() => Math.random() * -canvas.height);
}

function drawRain() {
  const fontSize = 16;
  ctx.fillStyle = 'rgba(6, 1, 4, 0.15)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = `${fontSize}px monospace`;

  for (let i = 0; i < rainDrops.length; i++) {
    const char = rainChars[Math.floor(Math.random() * rainChars.length)];
    const x = i * fontSize;
    const y = rainDrops[i];

    /* Головная (яркая) точка капли + светящийся розовый хвост */
    const gradient = ctx.createLinearGradient(x, y - fontSize, x, y);
    gradient.addColorStop(0, 'rgba(255, 79, 163, 0)');
    gradient.addColorStop(1, '#ff9fd0');
    ctx.fillStyle = gradient;
    ctx.shadowColor = '#ff4fa3';
    ctx.shadowBlur = 8;
    ctx.fillText(char, x, y);
    ctx.shadowBlur = 0;

    if (y > canvas.height && Math.random() > 0.975) {
      rainDrops[i] = 0;
    }
    rainDrops[i] += fontSize * 0.6;
  }

  rainAnimationId = requestAnimationFrame(drawRain);
}

function startRain() {
  setupCanvas();
  cancelAnimationFrame(rainAnimationId);
  drawRain();
}

function stopRain() {
  cancelAnimationFrame(rainAnimationId);
}

window.addEventListener('resize', () => {
  if (document.getElementById('screen-intro').classList.contains('active')) {
    setupCanvas();
  }
});

/* =====================================================
   ЭКРАН 1 — ОТСЧЁТ + СЛОВА + СЕРДЦЕ
===================================================== */
const countdownEl = document.getElementById('countdown');
const introWordsEl = document.getElementById('intro-words');
const pixelHeartEl = document.getElementById('pixel-heart');
let introSkipped = false;

async function playCountdown() {
  const numbers = ['3', '2', '1'];
  for (const n of numbers) {
    if (introSkipped) return;
    countdownEl.textContent = n;
    countdownEl.classList.remove('show');
    void countdownEl.offsetWidth; /* перезапуск анимации */
    countdownEl.classList.add('show');
    await wait(900);
  }
  countdownEl.classList.remove('show');
  countdownEl.textContent = '';
}

async function playIntroWords() {
  const words = ['HAPPY', 'BIRTHDAY', 'TO', 'ARIANA'];
  for (const word of words) {
    if (introSkipped) return;
    introWordsEl.textContent = word;
    introWordsEl.classList.remove('show');
    void introWordsEl.offsetWidth;
    introWordsEl.classList.add('show');
    await wait(1300);
  }
  introWordsEl.classList.remove('show');
  introWordsEl.textContent = '';
}

async function playPixelHeart() {
  if (introSkipped) return;
  pixelHeartEl.classList.add('show');
  await wait(500);
  pixelHeartEl.classList.add('beat');
  await wait(2400); /* несколько ударов сердца */
}

async function runIntroSequence() {
  introSkipped = false;
  startRain();

  /* Пауза перед началом отсчёта, чтобы дождь успел "накопиться" */
  await wait(1800);
  await playCountdown();
  if (introSkipped) return;

  await wait(300);
  await playIntroWords();
  if (introSkipped) return;

  await wait(200);
  await playPixelHeart();
  if (introSkipped) return;

  await wait(400);
  goToMessageScreen();
}

document.getElementById('skip-intro').addEventListener('click', () => {
  introSkipped = true;
  goToMessageScreen();
});

function goToMessageScreen() {
  stopRain();
  showScreen('screen-message');
  spawnFallingHearts('falling-hearts-message', 18);
  playTypedMessage();
}

/* =====================================================
   ПАДАЮЩИЕ СЕРДЕЧКИ / ЛЕПЕСТКИ (ЭКРАНЫ 2 и 4)
===================================================== */
const heartSymbols = ['❤', '💕', '🌸'];

function spawnFallingHearts(containerId, count) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const el = document.createElement('span');
    el.className = 'fall-heart';
    el.textContent = heartSymbols[Math.floor(Math.random() * heartSymbols.length)];
    const size = 10 + Math.random() * 18;
    el.style.left = `${Math.random() * 100}%`;
    el.style.fontSize = `${size}px`;
    el.style.animationDuration = `${8 + Math.random() * 10}s`;
    el.style.animationDelay = `${Math.random() * 8}s`;
    container.appendChild(el);
  }
}

/* =====================================================
   ЭКРАН 2 — АНИМАЦИЯ ПЕЧАТИ ТЕКСТА
===================================================== */
async function typeLine(el, text, speed = 32) {
  el.style.opacity = '1';
  const cursor = document.createElement('span');
  cursor.className = 'cursor';
  el.appendChild(cursor);

  for (const char of text) {
    const charNode = document.createTextNode(char);
    el.insertBefore(charNode, cursor);
    await wait(speed);
  }
  await wait(250);
  cursor.remove();
}

async function playTypedMessage() {
  const lines = document.querySelectorAll('#screen-message .typed-line');
  const continueBtn = document.getElementById('continue-btn');
  continueBtn.classList.add('hidden');

  for (const line of lines) {
    line.textContent = '';
    await typeLine(line, line.dataset.text);
    await wait(280);
  }

  await wait(400);
  continueBtn.classList.remove('hidden');
}

document.getElementById('continue-btn').addEventListener('click', () => {
  showScreen('screen-gallery');
  loadGallery();
});

/* =====================================================
   ЭКРАН 3 — АВТОЗАГРУЗКА ГАЛЕРЕИ ИЗ /assets/
===================================================== */
/*
  Галерея автоматически подхватывает фотографии из папки /assets/.
  Чтобы добавить свои фото — просто положи файлы в /assets/ с именами:

      photo1.jpg, photo2.jpg, photo3.jpg, ...

  (подходят расширения .jpg, .jpeg, .png, .webp — можно смешивать).
  Скрипт сам найдёт все файлы по порядку и остановится, когда фото закончатся.
*/
const GALLERY_MAX = 60; /* максимальное количество проверяемых фото */
const GALLERY_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
let galleryLoaded = false;

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function findPhotoForIndex(index) {
  for (const ext of GALLERY_EXTENSIONS) {
    const src = `assets/photo${index}.${ext}`;
    const found = await loadImage(src);
    if (found) return found;
  }
  return null;
}

async function autoDiscoverPhotos() {
  const found = [];
  let missesInARow = 0;

  for (let i = 1; i <= GALLERY_MAX; i++) {
    const src = await findPhotoForIndex(i);
    if (src) {
      found.push(src);
      missesInARow = 0;
    } else {
      missesInARow++;
      /* допускаем пару "дырок" в нумерации, но останавливаемся,
         если подряд не нашлось несколько фото */
      if (missesInARow >= 3) break;
    }
  }
  return found;
}

async function loadGallery() {
  if (galleryLoaded) return;
  galleryLoaded = true;

  const grid = document.getElementById('gallery-grid');
  grid.innerHTML = '';

  const photos = await autoDiscoverPhotos();

  if (photos.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'gallery-empty';
    empty.textContent =
      'Пока здесь пусто — добавь фотографии в папку /assets/ с именами photo1.jpg, photo2.jpg и так далее, и они появятся здесь автоматически.';
    grid.appendChild(empty);
    return;
  }

  photos.forEach((src, i) => {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.style.transitionDelay = `${i * 0.06}s`;

    const img = document.createElement('img');
    img.src = src;
    img.alt = `Воспоминание ${i + 1}`;
    img.loading = 'lazy';

    item.appendChild(img);
    item.addEventListener('click', () => openLightbox(src));
    grid.appendChild(item);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => item.classList.add('show'));
    });
  });
}

/* Лайтбокс */
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');

function openLightbox(src) {
  lightboxImg.src = src;
  lightbox.classList.add('open');
}

function closeLightbox() {
  lightbox.classList.remove('open');
}

document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeLightbox();
});

document.getElementById('to-final-btn').addEventListener('click', () => {
  showScreen('screen-final');
  spawnFallingHearts('falling-hearts-final', 0); /* появятся после фейерверка */
  resetFinalScreen();
});

/* =====================================================
   ЭКРАН 4 — ФИНАЛЬНОЕ СЕРДЦЕ + ФЕЙЕРВЕРК
===================================================== */
const finalHeart = document.getElementById('final-heart');
const finalHint = document.getElementById('final-hint');
const fireworksLayer = document.getElementById('fireworks-layer');
const thanksModal = document.getElementById('thanks-modal');
let finalTriggered = false;

function resetFinalScreen() {
  finalTriggered = false;
  finalHeart.classList.remove('burst');
  finalHint.classList.remove('hidden');
  fireworksLayer.innerHTML = '';
  thanksModal.classList.remove('open');
  document.getElementById('falling-hearts-final').innerHTML = '';
}

async function triggerFinale() {
  if (finalTriggered) return;
  finalTriggered = true;

  finalHint.classList.add('hidden');
  finalHeart.classList.add('burst');

  await wait(350);
  launchHeartFireworks();

  await wait(2200);
  spawnFallingHearts('falling-hearts-final', 26);

  await wait(1200);
  thanksModal.classList.add('open');
}

function launchHeartFireworks() {
  const count = 40;
  for (let i = 0; i < count; i++) {
    const heart = document.createElement('span');
    heart.className = 'fw-heart';
    heart.textContent = heartSymbols[Math.floor(Math.random() * heartSymbols.length)];

    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
    const distance = 120 + Math.random() * 260;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;
    const rotation = (Math.random() - 0.5) * 360;
    const duration = 1.1 + Math.random() * 0.8;
    const size = 14 + Math.random() * 18;

    heart.style.fontSize = `${size}px`;
    heart.style.setProperty('--dx', `${dx}px`);
    heart.style.setProperty('--dy', `${dy}px`);
    heart.style.transition = `transform ${duration}s cubic-bezier(0.2, 0.7, 0.3, 1), opacity ${duration}s ease`;

    fireworksLayer.appendChild(heart);

    requestAnimationFrame(() => {
      heart.style.transform = `translate(-50%, -50%) translate(${dx}px, ${dy}px) rotate(${rotation}deg)`;
      heart.style.opacity = '0';
    });

    setTimeout(() => heart.remove(), duration * 1000 + 200);
  }
}

finalHeart.addEventListener('click', triggerFinale);
finalHeart.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    triggerFinale();
  }
});

/* =====================================================
   ПЕРЕЗАПУСК САЙТА БЕЗ ПЕРЕЗАГРУЗКИ СТРАНИЦЫ
===================================================== */
document.getElementById('restart-btn').addEventListener('click', () => {
  thanksModal.classList.remove('open');
  resetFinalScreen();

  /* Сбрасываем состояние экрана 2 */
  document.querySelectorAll('#screen-message .typed-line').forEach((line) => {
    line.textContent = '';
    line.style.opacity = '0';
  });
  document.getElementById('continue-btn').classList.add('hidden');

  /* Сбрасываем интро */
  countdownEl.textContent = '';
  countdownEl.classList.remove('show');
  introWordsEl.textContent = '';
  introWordsEl.classList.remove('show');
  pixelHeartEl.classList.remove('show', 'beat');

  showScreen('screen-intro');
  runIntroSequence();
});

/* =====================================================
   ЗАПУСК САЙТА
===================================================== */
window.addEventListener('load', () => {
  runIntroSequence();
});
