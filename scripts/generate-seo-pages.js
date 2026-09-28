const fs = require('node:fs');
const path = require('node:path');

const repositoryRoot = path.resolve(__dirname, '..');
const outputRoot = path.join(repositoryRoot, 'dist', 'VirniAngularStore', 'browser');
const configuredSiteUrl = process.env.SITE_URL || 'https://virnist.github.io/VirniAngularStore/';
const siteUrl = new URL(configuredSiteUrl.endsWith('/') ? configuredSiteUrl : `${configuredSiteUrl}/`).href;
const products = JSON.parse(fs.readFileSync(path.join(repositoryRoot, 'public/assets/data/products.json'), 'utf8'));
const news = JSON.parse(fs.readFileSync(path.join(repositoryRoot, 'public/assets/data/news.json'), 'utf8'));

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function absoluteAsset(source) {
  return new URL(String(source || '').replace(/^\.\//, ''), siteUrl).href;
}

function writePage(route, { title, description, image, schema, content, type }) {
  const canonicalUrl = new URL(route, siteUrl).href;
  const outputDirectory = path.join(outputRoot, route);
  const jsonLd = JSON.stringify(schema).replaceAll('<', '\\u003c');
  
  const html = `<!doctype html>
<html lang="uk">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} | Virni</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <link rel="canonical" href="${canonicalUrl}">
  <meta property="og:type" content="${type === 'article' ? 'article' : 'website'}">
  <meta property="og:site_name" content="Virni">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="${image}">
  <script type="application/ld+json">${jsonLd}</script>
  <style>
    :root {
      color-scheme: light;
      font-family: Arial, sans-serif;
      color: #1f2937;
      background: #f8fafc;
    }
    * { box-sizing: border-box; }
    body { min-height: 100vh; margin: 0; display: flex; flex-direction: column; line-height: 1.6; }
    a { color: inherit; text-decoration: none; }
    
    /* Site Header */
    .site-header { width: 100%; background: #fff; border-bottom: 1px solid #cbd5e1; }
    .site-header-inner { width: min(calc(100% - 48px), 1400px); min-height: 82px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 28px; }
    .brand { flex: 0 0 auto; color: #1f2937; font-size: 1.5rem; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; }
    .site-nav { display: flex; align-items: center; justify-content: flex-end; flex-wrap: wrap; gap: 8px 28px; }
    .site-nav a { padding: 10px 0; color: #526071; font-size: .95rem; font-weight: 700; }
    .site-nav a:hover { color: #765400; }
    
    /* Main Layout Containers */
    main { flex: 1 0 auto; }
    .container { width: min(calc(100% - 48px), 860px); margin: 0 auto; padding-block: 36px 48px; }
    .product-container { width: min(calc(100% - 48px), 1200px); margin: 0 auto; padding-block: 36px 60px; }

    /* Product Page Layout (копія вашого Angular-компонента) */
    .product-layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); align-items: center; gap: 60px; width: 100%; }
    .product-image { width: 100%; aspect-ratio: 3 / 4; max-height: 72vh; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 24px; background: #f1f5f9; }
    .product-image img { width: 100%; height: 100%; object-fit: contain; }
    .product-info h1 { margin: 0 0 10px; font-size: 2.2rem; }
    .product-info .category { margin: 0 0 12px; color: #765400; font-size: .85rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
    .product-info .price-tag { margin: 0 0 20px; padding-bottom: 16px; border-bottom: 1px solid #cbd5e1; font-size: 2rem; font-weight: 800; }
    .product-info .description { margin-block: 20px; white-space: pre-line; color: #4b5563; }
    .product-info .stock-status { margin-bottom: 24px; font-weight: 700; }
    .stock-status .in-stock { color: #137547; }
    .stock-status .pre-order { color: #b45309; }
    .buy-btn, .btn-back { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 24px; border-radius: 8px; background: #f2c75c; color: #18212f; font-weight: 700; border: none; cursor: pointer; text-decoration: none; }
    
    /* Article Page Layout (копія вашого Angular-компонента) */
    .article-header { margin-bottom: 32px; }
    .article-header .image-hero { width: 100%; max-height: 500px; object-fit: cover; border-radius: 16px; margin-bottom: 24px; }
    .article-header .header-content .date { color: #6b7280; font-size: 0.9rem; font-weight: 600; display: block; margin-bottom: 8px; }
    .article-header h1 { margin: 0; font-size: 2.5rem; line-height: 1.2; }
    .article-body .lead-text { font-size: 1.15rem; line-height: 1.75; color: #374151; white-space: pre-line; }
    .actions-footer { margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb; }

    /* Footer */
    .site-footer { width: 100%; background: #f1f5f9; border-top: 1px solid #cbd5e1; }
    .site-footer-inner { width: min(calc(100% - 48px), 1400px); margin: 0 auto; padding: 32px 0; display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 40px; }
    .footer-heading { margin: 0 0 10px; color: #1f2937; font-size: .9rem; font-weight: 800; text-transform: uppercase; }
    .footer-copy, .footer-links { margin: 0; color: #526071; font-size: .9rem; }
    .footer-links { display: flex; flex-direction: column; align-items: flex-start; gap: 7px; }
    .footer-bottom { width: min(calc(100% - 48px), 1400px); margin: 0 auto; padding: 14px 0 20px; border-top: 1px solid #cbd5e1; color: #526071; font-size: .82rem; }

    @media (max-width: 768px) {
      .product-layout { grid-template-columns: 1fr; gap: 24px; }
      .container, .product-container { width: calc(100% - 32px); padding-block: 20px; }
      .article-header h1, .product-info h1 { font-size: 1.8rem; }
      .site-footer-inner { grid-template-columns: 1fr; gap: 24px; }
    }
  </style>
</head>
<body>
  <header class="site-header">
    <div class="site-header-inner">
      <a class="brand" href="${siteUrl}">Virni</a>
      <nav class="site-nav" aria-label="Головна навігація">
        <a href="${siteUrl}">Головна</a>
        <a href="${siteUrl}news/">Новини</a>
        <a href="${siteUrl}shop/">Магазин</a>
        <a href="${siteUrl}media/">Медіа</a>
        <a href="${siteUrl}videos/">Відео</a>
      </nav>
    </div>
  </header>
  <main>${content}</main>
  <footer class="site-footer">
    <div class="site-footer-inner">
      <section class="footer-brand">
        <a class="brand" href="${siteUrl}">Virni</a>
        <p class="footer-copy">Автентичний стиль, музика та вибрані товари.</p>
      </section>
      <section>
        <h2 class="footer-heading">Навігація</h2>
        <nav class="footer-links" aria-label="Навігація внизу сторінки">
          <a href="${siteUrl}news/">Новини</a>
          <a href="${siteUrl}shop/">Магазин</a>
          <a href="${siteUrl}media/">Медіа</a>
        </nav>
      </section>
      <section>
        <h2 class="footer-heading">Стежте за нами</h2>
        <nav class="footer-links" aria-label="Соціальні мережі">
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a>
          <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">YouTube</a>
          <a href="https://telegram.org" target="_blank" rel="noopener noreferrer">Telegram</a>
        </nav>
      </section>
    </div>
    <div class="footer-bottom"><p>© 2026 Virni. Усі права захищені.</p></div>
  </footer>
</body>
</html>
`;

  fs.mkdirSync(outputDirectory, { recursive: true });
  fs.writeFileSync(path.join(outputDirectory, 'index.html'), html);
  return canonicalUrl;
}

const sitemapUrls = [siteUrl];

for (const product of products) {
  const name = product.title_uk || product.title_en || `Товар Virni ${product.id}`;
  const description = product.description_uk || product.description_en || name;
  const image = absoluteAsset(product.image);
  const route = `product/${product.id}/`;
  const canonicalUrl = new URL(route, siteUrl).href;
  const availability = product.stock > 0 ? 'InStock' : 'PreOrder';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    image: [image],
    description,
    sku: `VIRNI-${product.id}`,
    category: product.category,
    brand: { '@type': 'Brand', name: 'Virni' },
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      priceCurrency: 'USD',
      price: Number(product.price).toFixed(2),
      availability: `https://schema.org/${availability}`,
      itemCondition: 'https://schema.org/NewCondition'
    }
  };

  // Точна HTML-копія вашого product.component.html
  const content = `
  <div class="product-container">
    <div class="product-layout">
      <div class="product-image">
        <img src="${image}" alt="${escapeHtml(name)}">
      </div>
      <div class="product-info">
        <h1>${escapeHtml(name)}</h1>
        <p class="category">${escapeHtml(product.category)}</p>
        <div class="price-tag">$${Number(product.price).toFixed(2)} USD</div>
        <div class="description">${escapeHtml(description)}</div>
        <div class="stock-status">
          ${
            product.stock > 0
              ? `<span class="in-stock">✅ В наявності: ${Number(product.stock)}</span>`
              : `<span class="pre-order">⏳ Під замовлення: ${Number(product.productionTime)} днів</span>`
          }
        </div>
        <a class="buy-btn" href="${siteUrl}shop/">
          ${product.stock > 0 ? 'Додати в кошик' : 'Замовити'}
        </a>
      </div>
    </div>
  </div>`;

  sitemapUrls.push(writePage(route, { title: name, description, image, schema, content, type: 'product' }));
}

for (const article of news) {
  const headline = article.title_uk || article.title_en || `Новини Virni ${article.id}`;
  const description = article.text_uk || article.text_en || headline;
  const image = absoluteAsset(article.image);
  const route = `news/${article.id}/`;
  const canonicalUrl = new URL(route, siteUrl).href;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline,
    description,
    image: [image],
    datePublished: article.date,
    author: { '@type': 'Organization', name: 'Virni' },
    publisher: { '@type': 'Organization', name: 'Virni' },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl }
  };

  // Точна HTML-копія вашого article.component.html
  const content = `
  <div class="article-wrapper">
    <div class="container">
      <header class="article-header">
        <img class="image-hero" src="${image}" alt="${escapeHtml(headline)}" fetchpriority="high">
        <div class="header-content">
          <span class="date">${escapeHtml(article.date)}</span>
          <h1>${escapeHtml(headline)}</h1>
        </div>
      </header>
      <section class="article-body">
        <p class="lead-text">${escapeHtml(description)}</p>
      </section>
      <div class="actions-footer">
        <a href="${siteUrl}news/" class="btn-back">
          <span class="icon">←</span>
          <span class="text">Назад до новин</span>
        </a>
      </div>
    </div>
  </div>`;

  sitemapUrls.push(writePage(route, { title: headline, description, image, schema, content, type: 'article' }));
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(url => `  <url><loc>${escapeHtml(url)}</loc></url>`).join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(outputRoot, 'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(outputRoot, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${siteUrl}sitemap.xml\n`);

const appRoutes = ['shop', 'news', 'media', 'videos', 'cart'];
for (const route of appRoutes) {
  const routeDirectory = path.join(outputRoot, route);
  fs.mkdirSync(routeDirectory, { recursive: true });
  fs.copyFileSync(path.join(outputRoot, 'index.html'), path.join(routeDirectory, 'index.html'));
}

fs.copyFileSync(path.join(outputRoot, 'index.html'), path.join(outputRoot, '404.html'));
console.log(`Generated ${products.length} Product pages and ${news.length} NewsArticle pages.`);
console.log(`Generated app shells for ${appRoutes.length} clean routes and a GitHub Pages fallback.`);