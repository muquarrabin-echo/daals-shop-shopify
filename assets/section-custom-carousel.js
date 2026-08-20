(function () {
  function getScrollAmount(track) {
    var card = track.querySelector('.carousel-card');
    return card ? card.offsetWidth + 16 : 300;
  }

  function updateEdgeInset(root, track) {
    var rect = root.getBoundingClientRect();
    var inset = Math.max(rect.left, 0);
    track.style.setProperty('--carousel-edge-inset', inset + 'px');
  }

  function updateArrows(track, prev, next) {
    var maxScroll = track.scrollWidth - track.clientWidth;
    var hasOverflow = maxScroll > 2;

    track.classList.toggle('is-not-overflowing', !hasOverflow);

    if (!hasOverflow) {
      prev.disabled = true;
      next.disabled = true;
      return;
    }

    var atStart = track.scrollLeft <= 2;
    var atEnd = track.scrollLeft >= maxScroll - 2;

    prev.disabled = atStart;
    next.disabled = atEnd;
  }

  function initCarousel(root) {
    if (root.dataset.carouselInitialized === 'true') return;

    var track = root.querySelector('.carousel-track');
    var prev = root.querySelector('.carousel-arrow--prev');
    var next = root.querySelector('.carousel-arrow--next');
    if (!track || !prev || !next) return;

    prev.addEventListener('click', function () {
      track.scrollBy({ left: -getScrollAmount(track), behavior: 'smooth' });
    });

    next.addEventListener('click', function () {
      track.scrollBy({ left: getScrollAmount(track), behavior: 'smooth' });
    });

    track.addEventListener('scroll', function () {
      updateArrows(track, prev, next);
    });

    window.addEventListener('resize', function () {
      updateEdgeInset(root, track);
      updateArrows(track, prev, next);
    });

    updateEdgeInset(root, track);
    updateArrows(track, prev, next);

    root.dataset.carouselInitialized = 'true';
  }

  function initAll(context) {
    (context || document)
      .querySelectorAll('.carousel-section[id^="carousel-"]')
      .forEach(initCarousel);
  }

  document.addEventListener('DOMContentLoaded', function () {
    initAll(document);
  });

  document.addEventListener('shopify:section:load', function (event) {
    initAll(event.target);
  });
})();