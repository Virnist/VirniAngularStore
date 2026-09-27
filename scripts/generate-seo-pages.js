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
    :root { color-scheme: light; font-family: Arial, sans-serif; color: #1f2937; background: #f8fafc; }
    * { box-sizing: border-box; }
    body { min-height: 100vh; margin: 0; display: flex; flex-direction: column; line-height: 1.6; }
    a { color: inherit; }
    a:focus-visible { outline: 3px solid #765400; outline-offset: 3px; }
    .site-header { width: 100%; background: #fff; border-bottom: 1px solid #cbd5e1; }
    .site-header-inner { width: min(calc(100% - 48px), 1400px); min-height: 82px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 28px; }
    .brand { flex: 0 0 auto; color: #1f2937; font-size: 1.5rem; font-weight: 800; letter-spacing: .04em; text-decoration: none; text-transform: uppercase; }
    .site-nav { display: flex; align-items: center; justify-content: flex-end; flex-wrap: wrap; gap: 8px 28px; }
    .site-nav a { padding: 10px 0; color: #526071; font-size: .95rem; font-weight: 700; text-decoration: none; }
    .site-nav a:hover { color: #765400; }
    .detail-main { flex: 1 0 auto; width: min(calc(100% - 48px), 860px); margin: 0 auto; padding-block: 36px 48px; }
    .product-main { width: min(calc(100% - 40px), 1200px); min-height: calc(100vh - 160px); display: flex; align-items: center; padding-block: 32px 60px; }
    .product-layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); align-items: center; gap: 60px; width: 100%; }
    .product-image { width: 100%; aspect-ratio: 3 / 4; max-height: 72vh; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 24px; background: #f1f5f9; }
    .product-image .hero { width: 100%; height: 100%; max-height: 72vh; object-fit: contain; }
    .product-info { min-width: 0; }
    .product-info h1 { margin-bottom: 14px; }
    .product-category { margin: 0 0 12px; color: #765400; font-size: .85rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
    .product-price { margin: 0 0 20px; padding-bottom: 16px; border-bottom: 1px solid #cbd5e1; font-size: 2rem; font-weight: 800; }
    .product-stock { margin: 0 0 22px; color: #137547; font-weight: 700; }
    .eyebrow, time { color: #526071; font-size: .9rem; }
    h1 { max-width: 760px; margin: 8px 0 20px; font-size: 2.5rem; line-height: 1.12; overflow-wrap: anywhere; }
    .hero { display: block; width: 100%; height: auto; max-height: 560px; object-fit: cover; border-radius: 12px; }
    .description { margin-block: 24px; white-space: pre-line; overflow-wrap: anywhere; }
    .price { margin-block: 22px; font-size: 1.7rem; font-weight: 800; }
    .action { display: inline-block; padding: 12px 18px; border-radius: 8px; background: #f2c75c; color: #18212f; font-weight: 700; text-decoration: none; }
    .site-footer { width: 100%; background: #f1f5f9; border-top: 1px solid #cbd5e1; }
    .site-footer-inner { width: min(calc(100% - 48px), 1400px); margin: 0 auto; padding: 32px 0; display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 40px; }
    .footer-heading { margin: 0 0 10px; color: #1f2937; font-size: .9rem; font-weight: 800; text-transform: uppercase; }
    .footer-copy, .footer-links { margin: 0; color: #526071; font-size: .9rem; }
    .footer-links { display: flex; flex-direction: column; align-items: flex-start; gap: 7px; }
    .footer-links a { text-decoration: none; }
    .footer-links a:hover { color: #765400; }
    .footer-bottom { width: min(calc(100% - 48px), 1400px); margin: 0 auto; padding: 14px 0 20px; border-top: 1px solid #cbd5e1; color: #526071; font-size: .82rem; }
    .footer-bottom p { margin: 0; }
    @media (max-width: 700px) {
      .site-header-inner { width: calc(100% - 32px); min-height: 0; padding: 16px 0; align-items: flex-start; flex-direction: column; gap: 10px; }
      .site-nav { width: 100%; justify-content: flex-start; gap: 4px 18px; }
      .site-nav a { padding: 7px 0; font-size: .88rem; }
      .detail-main { width: calc(100% - 32px); padding-block: 24px 36px; }
      .product-main { width: calc(100% - 32px); min-height: 0; padding-block: 24px 40px; }
      .product-layout { grid-template-columns: 1fr; gap: 24px; }
      .product-image { max-height: none; }
      .product-image .hero { max-height: none; }
      .product-info h1 { font-size: 1.8rem; }
      h1 { font-size: 1.8rem; }
      .site-footer-inner { width: calc(100% - 32px); grid-template-columns: 1fr 1fr; gap: 24px; }
      .footer-brand { grid-column: 1 / -1; }
      .footer-bottom { width: calc(100% - 32px); }
    }
    @media (min-width: 769px) and (max-height: 800px) and (orientation: landscape) {
      .site-header-inner { min-height: 72px; }
      .detail-main { padding-block: 24px 32px; }
      .hero { max-height: 42vh; }
      h1 { font-size: 2rem; }
      .description { margin-block: 16px; }
      .product-main { min-height: calc(100vh - 144px); padding-block: 24px 32px; }
      .product-layout { gap: 40px; }
      .product-image { max-height: 62vh; }
      .product-image .hero { max-height: 62vh; }
      .product-info h1 { font-size: 2rem; }
      .product-price { margin-bottom: 14px; padding-bottom: 10px; }
      .product-stock { margin-bottom: 14px; }
      .product-info .description { margin-block: 12px; line-height: 1.45; }
      .site-footer-inner { padding-block: 22px; }
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
  <main class="detail-main ${type === 'product' ? 'product-main' : 'article-main'}">${content}</main>
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
  const content = `<article class="product-layout">
    <div class="product-image"><img class="hero" src="${image}" alt="${escapeHtml(name)}"></div>
    <div class="product-info">
      <p class="product-category">${escapeHtml(product.category)}</p>
      <h1>${escapeHtml(name)}</h1>
      <p class="product-price">$${Number(product.price).toFixed(2)} USD</p>
      <p class="description">${escapeHtml(description)}</p>
      <p class="product-stock">${product.stock > 0 ? `В наявності: ${Number(product.stock)} шт.` : `Під замовлення · виготовлення ${Number(product.productionTime)} днів`}</p>
      <a class="action" href="${siteUrl}shop/">Переглянути магазин і замовити</a>
    </div>
  </article>`;

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
  const content = `<article>
    <p class="eyebrow">Новини Virni</p>
    <h1>${escapeHtml(headline)}</h1>
    <time datetime="${escapeHtml(article.date)}">${escapeHtml(article.date)}</time>
    <img class="hero" src="${image}" alt="${escapeHtml(headline)}">
    <p class="description">${escapeHtml(description)}</p>
    <a class="action" href="${siteUrl}news/">Відкрити всі новини Virni</a>
  </article>`;

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