(function () {
  'use strict';

  const CATAAS_API = 'https://cataas.com';
  const TOTAL_CATS = 15;
  const SWIPE_THRESHOLD = 80;
  const IMAGE_WIDTH = 320;

  const CAT_NAMES = [
    'Duchess', 'Mochi', 'Biscuit', 'Cleo', 'Figaro',
    'Luna', 'Whisker', 'Pumpkin', 'Cosmo', 'Miso',
    'Toffee', 'Noodle', 'Hazel', 'Pixel', 'Chai'
  ];
  const CAT_SUBS = [
    'Connoisseur of sunbeams',
    'Professional nap taker',
    'Certified zoomies expert',
    'Dislikes Mondays, loves Mondays',
    'Part-time gravity tester',
    'Licensed biscuit maker',
    'Avid box collector',
    'Head of security (windows)',
    'Snack time enthusiast',
    'Expert at being judged',
    'Chief laser dot officer',
    'Midnight sprint specialist',
    'Student of the void',
    'Full-time chaos agent',
    'Senior loaf position holder'
  ];

  const WELCOME_KEY = 'paws-welcome-seen';
  const UNDO_DURATION = 3000;

  const state = {
    cats: [],
    liked: [],
    currentIndex: 0,
    isLoading: true,
    isSwiping: false,
    soundOn: true,
    lastSwipe: null,
    undoTimeout: null
  };

  const dom = {
    cardStack: document.getElementById('cardStack'),
    progressDots: document.getElementById('progressDots'),
    header: document.querySelector('.header'),
    swipeSection: document.getElementById('swipeSection'),
    likedCount: document.getElementById('likedCount'),
    almostDone: document.getElementById('almostDone'),
    firstCardHint: document.getElementById('firstCardHint'),
    btnSound: document.getElementById('btnSound'),
    btnUndo: document.getElementById('btnUndo'),
    loading: document.getElementById('loading'),
    error: document.getElementById('error'),
    retryBtn: document.getElementById('retryBtn'),
    btnLike: document.getElementById('btnLike'),
    btnDislike: document.getElementById('btnDislike'),
    summary: document.getElementById('summary'),
    statLiked: document.getElementById('statLiked'),
    statPassed: document.getElementById('statPassed'),
    statTotal: document.getElementById('statTotal'),
    summaryEmoji: document.getElementById('summaryEmoji'),
    summaryCelebration: document.getElementById('summaryCelebration'),
    summaryPersonality: document.getElementById('summaryPersonality'),
    likedSubtitle: document.getElementById('likedSubtitle'),
    confettiContainer: document.getElementById('confettiContainer'),
    loadingText: document.getElementById('loadingText'),
    likedGrid: document.getElementById('likedGrid'),
    btnShare: document.getElementById('btnShare'),
    btnRestart: document.getElementById('btnRestart'),
    hintLeft: document.getElementById('hintLeft'),
    hintRight: document.getElementById('hintRight'),
    welcomePopup: document.getElementById('welcome-popup'),
    welcomePopupBtn: document.getElementById('welcomePopupBtn'),
    welcomeDontShow: document.getElementById('welcomeDontShow'),
    lightbox: document.getElementById('lightbox'),
    lightboxImg: document.getElementById('lightboxImg'),
    lightboxClose: document.getElementById('lightboxClose')
  };

  function closeWelcomePopup() {
    if (dom.welcomeDontShow && dom.welcomeDontShow.checked) {
      try { sessionStorage.setItem(WELCOME_KEY, '1'); } catch (e) {}
    }
    if (dom.welcomePopup) dom.welcomePopup.classList.add('hidden');
  }

  function initWelcomePopup() {
    try {
      if (sessionStorage.getItem(WELCOME_KEY)) {
        if (dom.welcomePopup) dom.welcomePopup.classList.add('hidden');
        return;
      }
    } catch (e) {}
    if (!dom.welcomePopup || !dom.welcomePopupBtn) return;
    dom.welcomePopupBtn.addEventListener('click', closeWelcomePopup);
    var backdrop = dom.welcomePopup.querySelector('.welcome-popup-backdrop');
    if (backdrop) backdrop.addEventListener('click', closeWelcomePopup);
    // Pop in the greeting after a short delay so it feels like a welcome on land
    setTimeout(function () {
      dom.welcomePopup.classList.remove('hidden');
    }, 400);
  }

  function haptic(duration) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(duration);
    }
  }

  function playSwipeSound() {
    if (!state.soundOn) return;
    try {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return;
      var ctx = new C();
      function play() {
        var o = ctx.createOscillator();
        var g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.frequency.value = 520;
        g.gain.setValueAtTime(0.12, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
        o.start(ctx.currentTime);
        o.stop(ctx.currentTime + 0.12);
      }
      if (ctx.state === 'suspended') {
        ctx.resume().then(play).catch(function () {});
      } else {
        play();
      }
    } catch (e) {}
  }

  function initSoundToggle() {
    if (!dom.btnSound) return;
    if (state.soundOn) {
      dom.btnSound.textContent = '🔊';
      dom.btnSound.setAttribute('aria-label', 'Sound on');
      dom.btnSound.setAttribute('title', 'Sound on');
      dom.btnSound.classList.add('sound-on');
    }
    dom.btnSound.addEventListener('click', function () {
      state.soundOn = !state.soundOn;
      dom.btnSound.textContent = state.soundOn ? '🔊' : '🔇';
      dom.btnSound.setAttribute('aria-label', state.soundOn ? 'Sound on' : 'Sound off');
      dom.btnSound.setAttribute('title', state.soundOn ? 'Sound on' : 'Sound off');
      dom.btnSound.classList.toggle('sound-on', state.soundOn);
    });
  }

  function showUndo(direction, id) {
    if (state.undoTimeout) clearTimeout(state.undoTimeout);
    state.lastSwipe = { direction: direction, id: id };
    if (dom.btnUndo) {
      dom.btnUndo.hidden = false;
      state.undoTimeout = setTimeout(function () {
        state.lastSwipe = null;
        if (dom.btnUndo) dom.btnUndo.hidden = true;
        state.undoTimeout = null;
      }, UNDO_DURATION);
    }
  }

  function hideUndo() {
    if (state.undoTimeout) clearTimeout(state.undoTimeout);
    state.undoTimeout = null;
    state.lastSwipe = null;
    if (dom.btnUndo) dom.btnUndo.hidden = true;
  }

  function doUndo() {
    if (!state.lastSwipe) return;
    var ls = state.lastSwipe;
    state.currentIndex--;
    if (ls.direction === 'right') {
      for (var i = state.liked.length - 1; i >= 0; i--) {
        if (state.liked[i].id === ls.id) {
          state.liked.splice(i, 1);
          break;
        }
      }
    }
    hideUndo();
    preloadNext(state.currentIndex, 4);
    renderStack();
    updateProgress();
    var top = getTopCard();
    if (top) initCardDrag(top);
  }

  function imageUrl(id) {
    return CATAAS_API + '/cat/' + id + '?width=' + IMAGE_WIDTH;
  }

  function preloadAll() {
    for (var i = 0; i < state.cats.length; i++) {
      var img = new Image();
      img.src = imageUrl(state.cats[i].id);
    }
  }

  function preloadNext(fromIndex, count) {
    for (var i = 0; i < count; i++) {
      var idx = fromIndex + i;
      if (idx >= state.cats.length) break;
      var img = new Image();
      img.src = imageUrl(state.cats[idx].id);
    }
  }

  function buildProgressDots() {
    if (!dom.progressDots) return;
    dom.progressDots.innerHTML = '';
    for (var i = 0; i < state.cats.length; i++) {
      var dot = document.createElement('div');
      dot.className = 'dot' + (i === 0 ? ' current' : '');
      dot.id = 'dot-' + i;
      dom.progressDots.appendChild(dot);
    }
  }

  function updateDot(index, status) {
    var dot = document.getElementById('dot-' + index);
    if (!dot) return;
    dot.className = 'dot' + (status ? ' ' + status : '');
  }

  function updateProgress() {
    var total = state.cats.length;
    var done = state.currentIndex;
    for (var i = 0; i < total; i++) {
      var status = i < done
        ? (state.liked.some(function (l) { return l.id === state.cats[i].id; }) ? 'liked' : 'disliked')
        : i === done ? 'current' : '';
      updateDot(i, status);
    }
    if (dom.likedCount) {
      dom.likedCount.textContent = state.liked.length ? String(state.liked.length) : '';
      dom.likedCount.style.display = state.liked.length ? '' : 'none';
    }
    if (dom.almostDone) dom.almostDone.hidden = done !== 14;
    if (dom.firstCardHint) dom.firstCardHint.classList.toggle('hidden', done > 0);
  }

  function fetchCats() {
    state.isLoading = true;
    dom.loading.classList.remove('hidden');
    dom.error.hidden = true;

    fetch(CATAAS_API + '/api/cats?limit=' + TOTAL_CATS)
      .then(function (res) {
        if (!res.ok) throw new Error('Network error');
        return res.json();
      })
      .then(function (data) {
        state.cats = Array.isArray(data) ? data : [];
        if (state.cats.length === 0) throw new Error('No cats');
        state.currentIndex = 0;
        state.liked = [];
        state.isLoading = false;
        dom.loading.classList.add('hidden');
        preloadAll();
        buildProgressDots();
        renderStack();
        updateProgress();
      })
      .catch(function () {
        state.isLoading = false;
        dom.loading.classList.add('hidden');
        dom.error.hidden = false;
      });
  }

  function createCard(cat, index, zClass) {
    var card = document.createElement('div');
    card.className = 'card ' + zClass;
    card.dataset.id = cat.id;
    card.dataset.index = String(index);
    var url = imageUrl(cat.id);
    var isTop = zClass === 'is-top';
    var name = CAT_NAMES[index % CAT_NAMES.length];
    var sub = CAT_SUBS[index % CAT_SUBS.length];
    card.innerHTML = [
      '<div class="card-inner">',
      '  <div class="card-img-placeholder"></div>',
      '  <img src="' + url + '" alt="' + name + '" loading="' + (isTop ? 'eager' : 'lazy') + '" decoding="async" />',
      '</div>',
      '<div class="react-like" aria-hidden="true">LIKE</div>',
      '<div class="react-nope" aria-hidden="true">NOPE</div>',
      '<div class="cat-tag"><div class="cat-name">' + name + '</div><div class="cat-sub">' + sub + '</div></div>'
    ].join('');
    var img = card.querySelector('img');
    var placeholder = card.querySelector('.card-img-placeholder');
    if (img && placeholder) {
      if (img.complete) {
        placeholder.classList.add('hidden');
        img.classList.add('loaded');
      } else {
        img.addEventListener('load', function onLoad() {
          img.removeEventListener('load', onLoad);
          placeholder.classList.add('hidden');
          img.classList.add('loaded');
        });
      }
    }
    return card;
  }

  function renderStack() {
    if (!dom.cardStack) return;
    dom.cardStack.innerHTML = '';
    var start = state.currentIndex;
    if (start >= state.cats.length) return;

    var end = Math.min(start + 3, state.cats.length);
    for (var i = end - 1; i >= start; i--) {
      var offset = i - start;
      var zClass = offset === 0 ? 'is-top' : offset === 1 ? 'is-back-1' : 'is-back-2';
      var card = createCard(state.cats[i], i, zClass);
      dom.cardStack.appendChild(card);
      if (offset === 0) initCardDrag(card);
    }
  }

  function getTopCard() {
    return dom.cardStack ? dom.cardStack.querySelector('.card.is-top') : null;
  }

  function swipe(direction) {
    if (state.isSwiping) return;
    var card = getTopCard();
    var total = state.cats.length;
    if (!card || state.currentIndex >= total) return;

    state.isSwiping = true;
    var currentCat = state.cats[state.currentIndex];
    var id = currentCat ? currentCat.id : card.dataset.id;
    var idx = state.currentIndex;

    if (direction === 'right') {
      haptic(10);
      playSwipeSound();
      var inner = card.querySelector('.card-inner');
      if (inner) {
        var overlay = document.createElement('div');
        overlay.className = 'card-heart-overlay';
        overlay.innerHTML = '<span aria-hidden="true">❤️</span>';
        inner.appendChild(overlay);
      }
      var alreadyLiked = state.liked.some(function (item) { return item.id === id; });
      if (!alreadyLiked && id) {
        state.liked.push({
          id: id,
          url: imageUrl(id),
          name: CAT_NAMES[idx % CAT_NAMES.length],
          sub: CAT_SUBS[idx % CAT_SUBS.length]
        });
      }
    } else {
      haptic([10, 50, 10]);
      playSwipeSound();
    }

    showUndo(direction, id);
    card.classList.add('exit-' + direction);

    setTimeout(function () {
      state.isSwiping = false;
      state.currentIndex++;
      card.remove();

      if (state.currentIndex >= state.cats.length) {
        showSummary();
        return;
      }

      updateProgress();
      preloadNext(state.currentIndex, 4);
      renderStack();
      var next = getTopCard();
      if (next) initCardDrag(next);
    }, 380);
  }

  function personalityLine(count) {
    if (count >= 10) return "You're a certified cat enthusiast!";
    if (count >= 5) return 'You have great taste in cats.';
    if (count >= 3) return 'These kitties are lucky you liked them.';
    if (count >= 1) return 'Purr-fect picks!';
    return '';
  }

  function triggerConfetti() {
    if (!dom.confettiContainer) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    dom.confettiContainer.innerHTML = '';
    var colors = ['#E8A598', '#7A9E7E', '#D4694A', '#8A7968', '#F5E6D0'];
    var hearts = ['❤️', '💕', '🐱'];
    for (var i = 0; i < 35; i++) {
      var piece = document.createElement('div');
      piece.className = 'confetti-piece' + (Math.random() < 0.25 ? ' heart' : '');
      if (piece.classList.contains('heart')) {
        piece.textContent = hearts[Math.floor(Math.random() * hearts.length)];
      } else {
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      }
      piece.style.left = Math.random() * 100 + '%';
      piece.style.animationDelay = Math.random() * 0.8 + 's';
      piece.style.animationDuration = (2.5 + Math.random() * 1.5) + 's';
      dom.confettiContainer.appendChild(piece);
    }
    setTimeout(function () {
      if (dom.confettiContainer) dom.confettiContainer.innerHTML = '';
    }, 4500);
  }

  function showSummary() {
    hideUndo();
    if (dom.swipeSection) dom.swipeSection.style.display = 'none';
    if (dom.header) dom.header.style.display = 'none';
    dom.summary.hidden = false;

    var total = state.cats.length;
    var n = state.liked.length;
    var passed = total - n;

    if (dom.statLiked) dom.statLiked.textContent = n;
    if (dom.statPassed) dom.statPassed.textContent = passed;
    if (dom.statTotal) dom.statTotal.textContent = total;

    var ratio = total ? n / total : 0;
    var emoji = ratio >= 0.7 ? '😻' : ratio >= 0.4 ? '😸' : ratio >= 0.1 ? '🙀' : '😿';
    if (dom.summaryEmoji) dom.summaryEmoji.textContent = emoji;

    if (dom.summaryCelebration) dom.summaryCelebration.hidden = true;
    if (dom.summaryPersonality) dom.summaryPersonality.hidden = true;

    if (dom.likedGrid) {
      dom.likedGrid.innerHTML = '';
      if (n === 0) {
        dom.likedGrid.innerHTML = '<div class="no-liked"><span class="emoji">😿</span><p>No matches? That\'s okay – not every cat can be The One. Tap Meet more cats to try again.</p></div>';
        if (dom.btnShare) dom.btnShare.style.display = 'none';
      } else {
        var seenIds = {};
        var seenUrls = {};
        state.liked.forEach(function (item) {
          if (seenIds[item.id] || seenUrls[item.url]) return;
          seenIds[item.id] = true;
          seenUrls[item.url] = true;
          var thumb = document.createElement('div');
          thumb.className = 'liked-thumb';
          thumb.tabIndex = 0;
          thumb.setAttribute('role', 'button');
          var img = document.createElement('img');
          img.src = item.url;
          img.alt = item.name || 'Liked cat';
          var label = document.createElement('div');
          label.className = 'thumb-name';
          label.textContent = item.name || 'Cat';
          thumb.appendChild(img);
          thumb.appendChild(label);
          thumb.addEventListener('click', function () {
            if (dom.lightbox && dom.lightboxImg) {
              dom.lightboxImg.src = item.url;
              dom.lightbox.hidden = false;
            }
          });
          dom.likedGrid.appendChild(thumb);
        });
        if (dom.summaryCelebration) {
          dom.summaryCelebration.textContent = 'You found ' + n + ' favourite' + (n === 1 ? '' : 's') + '!';
          dom.summaryCelebration.hidden = false;
        }
        if (dom.summaryPersonality) {
          dom.summaryPersonality.textContent = personalityLine(n);
          dom.summaryPersonality.hidden = false;
        }
        triggerConfetti();
        if (dom.btnShare) dom.btnShare.style.display = '';
      }
    }

    var subtitle = n === 0
      ? 'A tough crowd — no cats made the cut!'
      : n === total
        ? 'You loved every single one! 🎉'
        : n + ' furry friend' + (n !== 1 ? 's' : '') + ' stole your heart';
    if (dom.likedSubtitle) dom.likedSubtitle.textContent = subtitle;
  }

  function closeLightbox() {
    if (dom.lightbox) dom.lightbox.hidden = true;
  }

  function initCardDrag(card) {
    var startX = 0, startY = 0, currentX = 0;
    var isTouch = false;

    function move(x) {
      currentX = x - startX;
      var rot = currentX * 0.08;
      card.style.transform = 'translate(' + currentX + 'px, 0) rotate(' + rot + 'deg)';
      var likeEl = card.querySelector('.react-like');
      var nopeEl = card.querySelector('.react-nope');
      var ratio = Math.min(Math.abs(currentX) / 80, 1);
      if (likeEl && nopeEl) {
        if (currentX > 20) {
          likeEl.style.opacity = ratio;
          nopeEl.style.opacity = 0;
        } else if (currentX < -20) {
          nopeEl.style.opacity = ratio;
          likeEl.style.opacity = 0;
        } else {
          likeEl.style.opacity = 0;
          nopeEl.style.opacity = 0;
        }
      }
      dom.hintLeft.classList.toggle('show', currentX < -40);
      dom.hintRight.classList.toggle('show', currentX > 40);
    }

    function end() {
      dom.hintLeft.classList.remove('show');
      dom.hintRight.classList.remove('show');
      card.style.transform = '';
      var likeEl = card.querySelector('.react-like');
      var nopeEl = card.querySelector('.react-nope');
      if (likeEl) likeEl.style.opacity = 0;
      if (nopeEl) nopeEl.style.opacity = 0;

      if (currentX > SWIPE_THRESHOLD) swipe('right');
      else if (currentX < -SWIPE_THRESHOLD) swipe('left');
    }

    function onPointerDown(e) {
      isTouch = !!e.touches;
      var t = isTouch ? e.touches[0] : e;
      startX = t.clientX;
      startY = t.clientY;
      currentX = 0;
      if (isTouch) {
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onUp, { once: true });
      } else {
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp, { once: true });
      }
    }

    function onMove(e) {
      var t = isTouch && e.touches && e.touches[0] ? e.touches[0] : e;
      if (!t) return;
      if (isTouch && e.cancelable) e.preventDefault();
      move(t.clientX);
    }

    function onUp() {
      if (isTouch) {
        document.removeEventListener('touchmove', onMove);
      } else {
        document.removeEventListener('mousemove', onMove);
      }
      end();
    }

    card.addEventListener('touchstart', onPointerDown, { passive: true });
    card.addEventListener('mousedown', onPointerDown);
  }

  dom.btnLike.addEventListener('click', function () { swipe('right'); });
  dom.btnDislike.addEventListener('click', function () { swipe('left'); });
  if (dom.btnUndo) dom.btnUndo.addEventListener('click', doUndo);
  dom.retryBtn.addEventListener('click', fetchCats);
  dom.btnRestart.addEventListener('click', function () {
    dom.summary.hidden = true;
    if (dom.swipeSection) dom.swipeSection.style.display = 'flex';
    if (dom.header) dom.header.style.display = 'flex';
    fetchCats();
    setTimeout(function () {
      if (dom.btnLike) dom.btnLike.focus();
    }, 100);
  });

  if (dom.btnShare) {
    dom.btnShare.addEventListener('click', function () {
      var count = state.liked.length;
      var text = 'I liked ' + count + ' cat' + (count === 1 ? '' : 's') + ' on Paws & Preferences!';
      if (navigator.share) {
        navigator.share({
          title: 'Paws & Preferences',
          text: text
        }).catch(function () {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () {
              dom.btnShare.textContent = 'Copied!';
              setTimeout(function () { dom.btnShare.textContent = 'Share my favourites'; }, 2000);
            });
          }
        });
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          dom.btnShare.textContent = 'Copied!';
          setTimeout(function () { dom.btnShare.textContent = 'Share my favourites'; }, 2000);
        });
      }
    });
  }

  if (dom.lightboxClose) dom.lightboxClose.addEventListener('click', closeLightbox);
  if (dom.lightbox) {
    dom.lightbox.addEventListener('click', function (e) {
      if (e.target === dom.lightbox) closeLightbox();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && dom.lightbox && !dom.lightbox.hidden) closeLightbox();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (dom.summary && !dom.summary.hidden) return;
    if (state.isSwiping) return;
    if (e.key === 'ArrowRight' || e.key === 'Enter') {
      e.preventDefault();
      swipe('right');
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      swipe('left');
    }
  });

  initWelcomePopup();
  initSoundToggle();
  fetchCats();
})();
