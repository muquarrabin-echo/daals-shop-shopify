if (!customElements.get('predictive-search')) {
  customElements.define('predictive-search', class PredictiveSearch extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.input = this.querySelector('.pill-search__input');
      this.results = this.querySelector('.predictive-search-results');
      this.suggestionsEl = this.querySelector('.psr-suggestions');
      this.collectionsEl = this.querySelector('.psr-collections');
      this.pagesEl = this.querySelector('.psr-pages');
      this.productsEl = this.querySelector('.psr-products-grid');
      this.productsHeader = this.querySelector('.psr-products-header');
      this.viewAll = this.querySelector('.psr-view-all');
      this.backBtn = this.querySelector('.psr-back-btn');
      this.clearBtn = this.querySelector('.psr-clear-btn');

      if (!this.input || !this.results) return;

      this.debounceTimer = null;
      this.setupEventListeners();
    }

    setupEventListeners() {
      this.input.addEventListener('input', () => this.onInput());
      this.input.addEventListener('focus', () => this.onFocus());

      if (this.backBtn) {
        this.backBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.close();
        });
      }

      if (this.clearBtn) {
        this.clearBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.input.value = '';
          this.clearBtn.hidden = true;
          this.input.focus();
          this.showTrendingProducts();
        });
      }

      document.addEventListener('click', (e) => {
        if (!this.contains(e.target)) {
          this.close();
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') this.close();
      });
    }

    onFocus() {
      const query = this.input.value.trim();
      if (this.clearBtn) this.clearBtn.hidden = query.length === 0;

      if (query.length === 0) {
        this.showTrendingProducts();
      } else {
        this.open();
      }
    }

    onInput() {
      clearTimeout(this.debounceTimer);
      const query = this.input.value.trim();

      if (this.clearBtn) this.clearBtn.hidden = query.length === 0;

      if (query.length < 1) {
        this.showTrendingProducts();
        return;
      }

      this.debounceTimer = setTimeout(() => this.fetchResults(query), 280);
    }

    // ========== TRENDING PRODUCTS ==========
    async showTrendingProducts() {
      this.results.classList.add('is-trending');
      this.productsHeader.textContent = 'Trending products';
      this.viewAll.href = '/collections/all';
      this.viewAll.textContent = 'View all products →';

      this.suggestionsEl.innerHTML = '';
      this.collectionsEl.innerHTML = '';
      this.pagesEl.innerHTML = '';

      this.productsEl.innerHTML = `<div class="psr-loading">Loading…</div>`;
      this.open();

      try {
        let res = await fetch('/collections/trending/products.json?limit=8');
        let data = await res.json();

        if (!data.products || data.products.length === 0) {
          res = await fetch('/collections/all/products.json?limit=8');
          data = await res.json();
        }
        this.renderTrending(data.products || []);
      } catch (err) {
        this.productsEl.innerHTML = `<div class="psr-empty">No trending products</div>`;
      }
    }

    renderTrending(products) {
      const placeholder = this.dataset.placeholder || '';

      if (!products.length) {
        this.productsEl.innerHTML = `<div class="psr-empty">No trending products</div>`;
        return;
      }

      this.productsEl.innerHTML = products.map(p => {
        const img = p.featured_image || (p.images && p.images[0] && p.images[0].src) || null;
        const rawPrice = p.variants && p.variants[0] ? p.variants[0].price : p.price;
        const price = this.formatMoney(rawPrice, true);

        return `
        <a href="/products/${p.handle}" class="psr-product">
          ${img
            ? `<img src="${img}" alt="${p.title}" loading="lazy" width="70" height="70">`
            : placeholder
          }
          <div class="psr-product-info">
            <div class="psr-product-title">${p.title}</div>
            <div class="psr-product-price">${price}</div>
          </div>
        </a>
        `;
      }).join('');
    }

    // ========== SEARCH RESULTS ==========
    async fetchResults(query) {
      this.results.classList.remove('is-trending');
      this.productsHeader.textContent = 'Products';
      this.productsEl.innerHTML = `<div class="psr-loading">Searching…</div>`;
      this.open();

      const root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
      const url =
        `${root}search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product,collection,page,article,query&resources[limit]=8&resources[limit_scope]=each&resources[options][unavailable_products]=last`;

      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        this.render(data.resources?.results || {}, query);
      } catch (err) {
        this.productsEl.innerHTML = `<div class="psr-empty">Something went wrong</div>`;
      }
    }

    render(results, query) {
      if (results.queries && results.queries.length) {
        this.suggestionsEl.innerHTML = `
        <h4>Popular suggestions</h4>
        ${results.queries.map(q => `<a href="${q.url}">${q.styled_text || q.text}</a>`).join('')}
        `;
      } else {
        this.suggestionsEl.innerHTML = '';
      }

      if (results.collections && results.collections.length) {
        this.collectionsEl.innerHTML = `
        <h4>Collections</h4>
        ${results.collections.map(c => `<a href="${c.url}">${c.title}</a>`).join('')}
        `;
      } else {
        this.collectionsEl.innerHTML = '';
      }

      const pagesAndArticles = [...(results.pages || []), ...(results.articles || [])];
      if (pagesAndArticles.length) {
        this.pagesEl.innerHTML = `
        <h4>Blog & Pages</h4>
        ${pagesAndArticles.map(p => `<a href="${p.url}">${p.title}</a>`).join('')}
        `;
      } else {
        this.pagesEl.innerHTML = '';
      }

      const placeholder = this.dataset.placeholder || '';

      if (results.products && results.products.length) {
        this.productsEl.innerHTML = results.products.map(p => {
          const img = p.featured_image?.url || p.image || null;
          const price = this.formatMoney(p.price);

          return `
          <a href="${p.url}" class="psr-product">
            ${img
              ? `<img src="${img}" alt="${p.title}" loading="lazy" width="70" height="70">`
              : placeholder
            }
            <div class="psr-product-info">
              <div class="psr-product-title">${p.title}</div>
              <div class="psr-product-price">${price}</div>
            </div>
          </a>
          `;
        }).join('');
      } else {
        this.productsEl.innerHTML = `<div class="psr-empty">No products found</div>`;
      }

      this.viewAll.href = `${(window.Shopify?.routes?.root || '/')}search?q=${encodeURIComponent(query)}`;
      this.viewAll.textContent = `View all results →`;
    }

    formatMoney(cents, isAlreadyFormatted = false) {
      if (typeof cents === 'undefined' || cents === null || cents === '') return '';

      const moneyFormat = this.dataset.moneyFormat || '${{amount}}';
      const currencySymbol = this.dataset.currency || '';

      if (isAlreadyFormatted) {
        const amount = parseFloat(cents).toFixed(2);
        return currencySymbol + amount;
      }

      if (typeof Shopify !== 'undefined' && typeof Shopify.formatMoney === 'function') {
        return Shopify.formatMoney(cents, moneyFormat);
      }

      return currencySymbol + (Number(cents) / 100).toFixed(2);
    }

    open() {
      this.results.classList.add('is-open');
      this.input.setAttribute('aria-expanded', 'true');

      if (window.matchMedia('(max-width: 749px)').matches) {
        document.body.style.overflow = 'hidden';
      }
    }

    close() {
      this.results.classList.remove('is-open', 'is-trending');
      this.input.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });
}