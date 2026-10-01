const fs = require('node:fs');
const path = require('node:path');
const { createCanvas } = require('@napi-rs/canvas');

const repositoryRoot = path.resolve(__dirname, '..');

let outputRoot = path.join(repositoryRoot, 'dist', 'VirniAngularStore', 'browser');
if (!fs.existsSync(outputRoot)) {
  outputRoot = path.join(repositoryRoot, 'dist', 'virni-angular-store', 'browser');
}

const configuredSiteUrl = process.env.SITE_URL || 'https://virnist.github.io/VirniAngularStore/';
const siteUrl = new URL(configuredSiteUrl.endsWith('/') ? configuredSiteUrl : `${configuredSiteUrl}/`).href;
const gscVerificationToken = process.env.GSC_VERIFICATION || ''; // Наприклад: 'abc123xyz...'

const baseIndexPath = path.join(outputRoot, 'index.html');
if (!fs.existsSync(baseIndexPath)) {
  console.error(`[SEO Generator Error]: File not found at ${baseIndexPath}.`);
  process.exit(1);
}
const baseIndexHtml = fs.readFileSync(baseIndexPath, 'utf8');

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
  if (!source) return siteUrl;
  if (source.startsWith('http://') || source.startsWith('https://')) return source;
  const relativePath = String(source).replace(/^\.?\//, '');
  return new URL(relativePath, siteUrl).href;
}

function sanitizeSlug(val) {
  return String(val).replace(/[^a-zA-Z0-9_-]/g, '');
}

// Генерація OG PNG прямо під час збірки
async function generateOgImage({ title, category, outputPath }) {
  const width = 1200;
  const height = 630;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#0f172a');
  gradient.addColorStop(1, '#1e1b4b');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(255, 215, 0, 0.08)';
  ctx.beginPath();
  ctx.arc(1100, 100, 300, 0, Math.PI * 2);
  ctx.fill();

  if (category) {
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(category.toUpperCase(), 80, 140);
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 50px sans-serif';
  
  const words = title.split(' ');
  let line = '';
  let y = 240;
  const maxWidth = 1040;

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && i > 0) {
      ctx.fillText(line, 80, y);
      line = words[i] + ' ';
      y += 64;
      if (y > 480) break;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, 80, y);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 28px sans-serif';
  ctx.fillText('VIRNI • virni.top', 80, 550);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, canvas.toBuffer('image/png'));
}

function writePage(route, { title, description, image, ogImage, schema, content, type, keywords = '' }) {
  const canonicalUrl = new URL(route, siteUrl).href;
  const outputDirectory = path.join(outputRoot, route);
  const jsonLd = JSON.stringify(schema).replaceAll('<', '\\u003c');

  let pageHtml = baseIndexHtml;

  pageHtml = pageHtml.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(title)} | Virni</title>`);

  const seoMetaData = `
    <meta name="description" content="${escapeHtml(description)}">
    ${keywords ? `<meta name="keywords" content="${escapeHtml(keywords)}">` : ''}
    ${gscVerificationToken ? `<meta name="google-site-verification" content="${gscVerificationToken}" />` : ''}
    <meta name="robots" content="index,follow,max-image-preview:large">
    <link rel="canonical" href="${canonicalUrl}">
    <meta property="og:type" content="${type === 'article' ? 'article' : 'website'}">
    <meta property="og:site_name" content="Virni">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:image" content="${ogImage || image}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta name="twitter:card" content="summary_large_image">
    <script type="application/ld+json">${jsonLd}</script>
  `;

  pageHtml = pageHtml.replace('</head>', `${seoMetaData}\n</head>`);

  if (pageHtml.includes('<app-root>')) {
    pageHtml = pageHtml.replace(/<app-root\b[^>]*>.*?<\/app-root>/s, `<app-root>${content}</app-root>`);
  } else {
    pageHtml = pageHtml.replace('</body>', `<main>${content}</main>\n</body>`);
  }

  fs.mkdirSync(outputDirectory, { recursive: true });
  fs.writeFileSync(path.join(outputDirectory, 'index.html'), pageHtml);
  return canonicalUrl;
}

(async () => {
  const sitemapItems = [{ url: siteUrl, lastmod: new Date().toISOString() }];

  // 1. Обробка новин
  for (const article of news) {
    const articleId = sanitizeSlug(article.id);
    const headline = article.title_uk || article.title_en || `Новини Virni ${articleId}`;
    const description = article.text_uk || article.text_en || headline;
    const category = article.category || 'Fashion';
    const route = `news/${articleId}/`;
    const canonicalUrl = new URL(route, siteUrl).href;

    // Шлях до згенерованого OG зображення
    const ogFileName = `og-${articleId}.png`;
    const ogFilePath = path.join(outputRoot, 'assets', 'og', ogFileName);
    const ogImageUrl = absoluteAsset(`/assets/og/${ogFileName}`);

    await generateOgImage({
      title: headline,
      category,
      outputPath: ogFilePath
    });

    // Хлібні крихти (Breadcrumbs) для Google Search Console
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Головна', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: 'Новини', item: `${siteUrl}news/` },
        { '@type': 'ListItem', position: 3, name: headline, item: canonicalUrl }
      ]
    };

    const articleSchema = {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline,
      description,
      image: [ogImageUrl, absoluteAsset(article.image)],
      datePublished: new Date(article.date).toISOString(),
      dateModified: new Date(article.updated_at || article.date).toISOString(),
      author: { '@type': 'Person', name: article.author || 'Virni Editorial' },
      publisher: { '@type': 'Organization', name: 'Virni', logo: { '@type': 'ImageObject', url: absoluteAsset('/assets/icons/favicon.ico') } }
    };

    const content = `<div class="article-wrapper"><h1>${escapeHtml(headline)}</h1></div>`;

    sitemapItems.push({
      url: writePage(route, {
        title: headline,
        description,
        image: absoluteAsset(article.image),
        ogImage: ogImageUrl,
        schema: [articleSchema, breadcrumbSchema],
        content,
        type: 'article'
      }),
      lastmod: new Date(article.updated_at || article.date).toISOString()
    });
  }

  // 2. Генерація sitemap.xml з додатковими атрибутами
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapItems.map(item => `  <url>
    <loc>${escapeHtml(item.url)}</loc>
    <lastmod>${item.lastmod}</lastmod>
    <changefreq>weekly</changefreq>
  </url>`).join('\n')}
</urlset>`;

  fs.writeFileSync(path.join(outputRoot, 'sitemap.xml'), sitemapXml);
  fs.writeFileSync(path.join(outputRoot, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${siteUrl}sitemap.xml\n`);

  console.log(`✅ SEO Сторінки, OG-зображення та Sitemap успішно згенеровано!`);
})();