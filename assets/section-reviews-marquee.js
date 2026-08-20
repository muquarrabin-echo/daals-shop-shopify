(function () {
  function scrollAmount(track) {
    var card = track.querySelector('.rvm-card');
    return card ? card.offsetWidth + 24 : 320;
  }

  function updateArrows(track, prev, next) {
    var maxScroll = track.scrollWidth - track.clientWidth;
    var hasOverflow = maxScroll > 2;

    // Few review cards: nothing to scroll, so center them and disable
    // both arrows instead of leaving them left-aligned with dead space
    // and inert buttons.
    track.classList.toggle('is-not-overflowing', !hasOverflow);

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

  function initReviewsMarquee(root) {
    if (root.dataset.rvmInitialized === 'true') return;

    var track = root.querySelector('.rvm-track');
    var prev = root.querySelector('.rvm-arrow--prev');
    var next = root.querySelector('.rvm-arrow--next');
    if (!track || !prev || !next) return;

    prev.addEventListener('click', function () {
      track.scrollBy({ left: -scrollAmount(track), behavior: 'smooth' });
    });

    next.addEventListener('click', function () {
      track.scrollBy({ left: scrollAmount(track), behavior: 'smooth' });
    });

    track.addEventListener('scroll', function () {
      updateArrows(track, prev, next);
    });

    window.addEventListener('resize', function () {
      updateArrows(track, prev, next);
    });

    // Initial state
    updateArrows(track, prev, next);

    root.dataset.rvmInitialized = 'true';
  }

  function initAll(context) {
    (context || document)
      .querySelectorAll('.rvm-section[id^="rvm-"]')
      .forEach(initReviewsMarquee);
  }

  document.addEventListener('DOMContentLoaded', function () {
    initAll(document);
  });

  // Re-init when a section is added/re-rendered in the theme editor
  document.addEventListener('shopify:section:load', function (event) {
    initAll(event.target);
  });
})();