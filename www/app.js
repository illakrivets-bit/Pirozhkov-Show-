(() => {
  const $ = (id) => document.getElementById(id);
  const photoInput = $('photoInput');
  const audioInput = $('audioInput');
  const audio = $('audioPlayer');
  const stage = $('stage');
  const intro = $('intro');
  const photoArea = $('photoArea');
  const fallback = $('fallbackPortrait');
  const caption = $('captionPop');
  const progress = $('progressFill');
  const timeLabel = $('timeLabel');
  const pauseButton = $('pauseButton');
  const captions = [
    'THE PARTY HAS ARRIVED!',
    'TOO MUCH STYLE ✨',
    'DANCE MODE: ACTIVATED',
    'MAIN CHARACTER ENERGY',
    'SOMEONE CALL THE DISCO 🪩',
    'ABSOLUTELY ICONIC',
    'THE FLOOR IS YOURS!',
    'WHAT A LEGEND 😎',
    'ONE MORE DANCE!',
    'SHOWTIME FOREVER!'
  ];
  let photos = [];
  let photoUrls = [];
  let photoIndex = 0;
  let startedAt = 0;
  let elapsedBeforePause = 0;
  let frame = 0;
  let photoTimer = 0;
  let captionTimer = 0;
  let running = false;
  let paused = false;

  for (let i = 0; i < 22; i++) {
    const bar = document.createElement('i');
    $('equalizer').appendChild(bar);
  }

  photoInput.addEventListener('change', () => {
    photos = Array.from(photoInput.files || []).filter(file => file.type.startsWith('image/'));
    $('photoLabel').textContent = photos.length ? photos.length + ' photo(s) ready' : 'Choose pictures from your device';
    photoUrls.forEach(URL.revokeObjectURL);
    photoUrls = photos.map(file => URL.createObjectURL(file));
  });

  audioInput.addEventListener('change', () => {
    const file = audioInput.files && audioInput.files[0];
    if (!file) {
      audio.removeAttribute('src');
      $('audioLabel').textContent = 'Optional · choose an audio file';
      return;
    }
    audio.src = URL.createObjectURL(file);
    $('audioLabel').textContent = file.name;
    audio.load();
  });

  function showPhoto() {
    if (!running || paused) return;
    if (!photoUrls.length) {
      fallback.classList.remove('hidden');
      return;
    }
    fallback.classList.add('hidden');
    const old = photoArea.querySelector('img');
    if (old) old.remove();
    const img = document.createElement('img');
    img.alt = 'User-selected party photo';
    img.src = photoUrls[photoIndex % photoUrls.length];
    photoArea.appendChild(img);
    photoIndex++;
  }

  function showCaption(index) {
    caption.textContent = captions[index % captions.length];
    caption.style.animation = 'none';
    void caption.offsetWidth;
    caption.style.animation = '';
  }

  function render(now) {
    if (!running || paused) return;
    const elapsed = Math.min(30, (now - startedAt) / 1000);
    const seconds = Math.floor(elapsed);
    const remaining = Math.max(0, 30 - seconds);
    timeLabel.textContent = '00:' + String(remaining).padStart(2, '0');
    progress.style.width = (elapsed / 30 * 100) + '%';

    const captionStep = seconds < 5 ? 0 : seconds < 10 ? 1 : seconds < 20 ? 2 : 3;
    if (captionStep !== render.lastCaptionStep) {
      render.lastCaptionStep = captionStep;
      showCaption(captionStep);
    }
    if (seconds >= 30) {
      stopShow();
      return;
    }
    frame = requestAnimationFrame(render);
  }

  function startShow() {
    if (running) return;
    intro.classList.add('hidden');
    stage.classList.remove('hidden', 'paused');
    stage.classList.remove('ending');
    running = true;
    paused = false;
    elapsedBeforePause = 0;
    startedAt = performance.now();
    render.lastCaptionStep = -1;
    photoIndex = 0;
    showPhoto();
    showCaption(0);
    photoTimer = window.setInterval(showPhoto, photos.length > 1 ? 2200 : 5000);
    captionTimer = window.setInterval(() => {
      if (running && !paused) showCaption(Math.floor((performance.now() - startedAt) / 3000));
    }, 3000);
    if (audio.src) {
      audio.currentTime = 0;
      audio.play().catch(() => {
        $('audioLabel').textContent = 'Tap play again if your browser blocked audio';
      });
    }
    frame = requestAnimationFrame(render);
  }

  function pauseShow() {
    if (!running) return;
    if (!paused) {
      elapsedBeforePause = performance.now() - startedAt;
      paused = true;
      stage.classList.add('paused');
      pauseButton.textContent = '▶ RESUME';
      audio.pause();
      cancelAnimationFrame(frame);
    } else {
      startedAt = performance.now() - elapsedBeforePause;
      paused = false;
      stage.classList.remove('paused');
      pauseButton.textContent = 'Ⅱ PAUSE';
      if (audio.src) audio.play().catch(() => {});
      frame = requestAnimationFrame(render);
    }
  }

  function stopShow() {
    running = false;
    paused = false;
    cancelAnimationFrame(frame);
    clearInterval(photoTimer);
    clearInterval(captionTimer);
    audio.pause();
    if (audio.src) audio.currentTime = 0;
    stage.classList.add('hidden');
    stage.classList.remove('paused');
    intro.classList.remove('hidden');
    progress.style.width = '0%';
    timeLabel.textContent = '00:30';
    pauseButton.textContent = 'Ⅱ PAUSE';
  }

  $('startButton').addEventListener('click', startShow);
  pauseButton.addEventListener('click', pauseShow);
  $('stopButton').addEventListener('click', stopShow);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && running && !paused) pauseShow();
  });

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }
})();