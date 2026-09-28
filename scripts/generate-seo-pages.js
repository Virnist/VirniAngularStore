const fs = require('node:fs');
const path = require('node:path');

// 1. Визначаємо кореневі шляхи
const repositoryRoot = path.resolve(__dirname, '..');

// Шукаємо правильну папку збірки Angular
let outputRoot = path.join(repositoryRoot, 'dist', 'VirniAngularStore', 'browser');
if (!fs.existsSync(outputRoot)) {
  outputRoot = path.join(repositoryRoot, 'dist', 'virni-angular-store', 'browser');
}

const configuredSiteUrl = process.env.SITE_URL || 'https://virnist.github.io/VirniAngularStore/';
const siteUrl = new URL(configuredSiteUrl.endsWith('/') ? configuredSiteUrl : `${configuredSiteUrl}/`).href;

// 2. Перевіряємо та зчитуємо базовий index.html, створений командою ng build
const baseIndexPath = path.join(outputRoot, 'index.html');
if (!fs.existsSync(baseIndexPath)) {
  console.error(`[SEO Generator Error]: File not found at ${baseIndexPath}. Make sure "ng build" runs before this script.`);
  process.exit(1);
}
const baseIndexHtml = fs.readFileSync(baseIndexPath, 'utf8');

// 3. Зчитуємо дані товарів та новин
const productsPath = path.join(repositoryRoot, 'public/assets/data/products.json');
const newsPath = path.join(repositoryRoot, 'public/assets/data/news.json');

const products = fs.existsSync(productsPath) ? JSON.parse(fs.readFileSync(productsPath, 'utf8')) : [];
const news = fs.existsSync(newsPath) ? JSON.parse(fs.readFileSync(newsPath, 'utf8')) : [];

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

// 4. Функція генерації статичної сторінки
function writePage(route, { title, description, image, schema, content, type }) {
  const canonicalUrl = new URL(route, siteUrl).href;
  const outputDirectory = path.join(outputRoot, route);
  const jsonLd = JSON.stringify(schema).replaceAll('<', '\\u003c');

  let pageHtml = baseIndexHtml;

  // Оновлюємо заголовок сторінки <title>
  pageHtml = pageHtml.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(title)} | Virni</title>`);

  // Формуємо мета-теги для SEO та Open Graph
  const seoMetaData = `
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
  `;

  // Вставляємо SEO-теги у <head>
  pageHtml = pageHtml.replace('</head>', `${seoMetaData}\n</head>`);

  // Вставляємо контент усередину <app-root> або <main>
  if (pageHtml.includes('<app-root>')) {
    pageHtml = pageHtml.replace(/<app-root\b[^>]*>.*?<\/app-root>/s, `<app-root>${content}</app-root>`);
  } else if (pageHtml.includes('<main>')) {
    pageHtml = pageHtml.replace(/<main\b[^>]*>.*?<\/main>/s, `<main>${content}</main>`);
  } else {
    pageHtml = pageHtml.replace('</body>', `<main>${content}</main>\n</body>`);
  }

  // Записуємо згенерований HTML-файл
  fs.mkdirSync(outputDirectory, { recursive: true });
  fs.writeFileSync(path.join(outputDirectory, 'index.html'), pageHtml);
  return canonicalUrl;
}

const sitemapUrls = [siteUrl];

// 5. Генерація сторінок для кожного товару
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
              ? `<span class="in-stock">✅ В наявності: ${Number(product.stock)} шт.</span>`
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

// 6. Генерація сторінок для кожної новини
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

// 7. Створення sitemap.xml та robots.txt
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(url => `  <url><loc>${escapeHtml(url)}</loc></url>`).join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(outputRoot, 'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(outputRoot, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${siteUrl}sitemap.xml\n`);

// 8. Створення App Shells для маршрутів Angular SPA та фолбеку 404
const appRoutes = ['shop', 'news', 'media', 'videos', 'cart'];
for (const route of appRoutes) {
  const routeDirectory = path.join(outputRoot, route);
  fs.mkdirSync(routeDirectory, { recursive: true });
  fs.copyFileSync(baseIndexPath, path.join(routeDirectory, 'index.html'));
}

fs.copyFileSync(baseIndexPath, path.join(outputRoot, '404.html'));

console.log(`Successfully generated ${products.length} Product pages and ${news.length} NewsArticle pages.`);
console.log(`Generated app shells for ${appRoutes.length} clean routes and 404.html for GitHub Pages.`);