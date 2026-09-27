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
    body { margin: 0; line-height: 1.65; }
    header, main, footer { width: min(100% - 32px, 860px); margin-inline: auto; }
    header { padding-block: 22px; border-bottom: 1px solid #cbd5e1; }
    header a, .action { color: #1f2937; font-weight: 700; }
    main { padding-block: 38px 56px; }
    .eyebrow, time { color: #526071; font-size: .9rem; }
    h1 { max-width: 760px; margin: 8px 0 20px; font-size: clamp(2rem, 6vw, 3.4rem); line-height: 1.12; }
    .hero { display: block; width: 100%; height: auto; max-height: 560px; object-fit: cover; border-radius: 12px; }
    .description { margin-block: 24px; white-space: pre-line; }
    .price { margin-block: 22px; font-size: 1.7rem; font-weight: 800; }
    .action { display: inline-block; padding: 12px 18px; border-radius: 8px; background: #f2c75c; text-decoration: none; }
    footer { padding-block: 18px 28px; border-top: 1px solid #cbd5e1; color: #526071; }
    a:focus-visible { outline: 3px solid #765400; outline-offset: 3px; }
  </style>
</head>
<body>
  <header><a href="${siteUrl}">Virni</a></header>
  <main>${content}</main>
  <footer>© 2026 Virni</footer>
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
  const content = `<article>
    <p class="eyebrow">Virni · ${escapeHtml(product.category)}</p>
    <h1>${escapeHtml(name)}</h1>
    <img class="hero" src="${image}" alt="${escapeHtml(name)}">
    <p class="description">${escapeHtml(description)}</p>
    <p class="price">$${Number(product.price).toFixed(2)} USD</p>
    <p>${product.stock > 0 ? `В наявності: ${Number(product.stock)} шт.` : `Під замовлення · виготовлення ${Number(product.productionTime)} днів`}</p>
    <a class="action" href="${siteUrl}shop/">Переглянути магазин і замовити</a>
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