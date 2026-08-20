(function () {
  function scrollAmount(track) {
    var card = track.querySelector('.dcc-card');
    return card ? card.offsetWidth + 16 : 300;
  }

  function updateArrows(track, prev, next) {
    var maxScroll = track.scrollWidth - track.clientWidth;
    var hasOverflow = maxScroll > 2;

    // Few cards: nothing to scroll, so center them and disable both
    // arrows instead of leaving them left-aligned with dead space and
    // inert buttons.
    track.classList.toggle('is-not-overflowing', !hasOverflow);

    if (!prev || !next) return;

    if (!hasOverflow) {
      prev.disabled = true;
      next.disabled = true;
      return;
    }

    // small tolerance for sub-pixel rounding
    var atStart = track.scrollLeft <= 2;
    var atEnd = track.scrollLeft >= maxScroll - 2;

    prev.disabled = atStart;
    next.disabled = atEnd;
  }

  function initCarousel(root) {
    if (root.dataset.dccInitialized === 'true') return;

    var track = root.querySelector('.dcc-track');
    var prev = root.querySelector('.dcc-arrow--prev');
    var next = root.querySelector('.dcc-arrow--next');
    if (!track) return;

    if (prev) {
      prev.addEventListener('click', function () {
        track.scrollBy({ left: -scrollAmount(track), behavior: 'smooth' });
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        track.scrollBy({ left: scrollAmount(track), behavior: 'smooth' });
      });
    }

    track.addEventListener('scroll', function () {
      updateArrows(track, prev, next);
    });

    window.addEventListener('resize', function () {
      updateArrows(track, prev, next);
    });

    // Initial state
    updateArrows(track, prev, next);

    root.dataset.dccInitialized = 'true';
  }

  function initAll(context) {
    (context || document)
      .querySelectorAll('.dcc-section[id^="dcc-"]')
      .forEach(initCarousel);
  }

  document.addEventListener('DOMContentLoaded', function () {
    initAll(document);
  });

  // Re-init when a section is added/re-rendered in the theme editor
  document.addEventListener('shopify:section:load', function (event) {
    initAll(event.target);
  });
})();