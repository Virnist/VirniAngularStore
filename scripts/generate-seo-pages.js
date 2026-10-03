const fs = require('node:fs');
const path = require('node:path');
const { createCanvas } = require('@napi-rs/canvas');

const repositoryRoot = path.resolve(__dirname, '..');

let outputRoot = path.join(repositoryRoot, 'dist', 'VirniAngularStore', 'browser');
if (!fs.existsSync(outputRoot)) {
  outputRoot = path.join(repositoryRoot, 'dist', 'virni-angular-store', 'browser');
}

const configuredSiteUrl = process.env.SITE_URL || 'https://virnist.github.io/VirniAngularStore/';
// Переконуємося, що siteUrl завжди закінчується на /
const siteUrl = configuredSiteUrl.endsWith('/') ? configuredSiteUrl : `${configuredSiteUrl}/`;
const gscVerificationToken = process.env.GSC_VERIFICATION || '';

const baseIndexPath = path.join(outputRoot, 'index.html');
if (!fs.existsSync(baseIndexPath)) {
  console.error(`[SEO Generator Error]: File not found at ${baseIndexPath}. Make sure "ng build" runs before this script.`);
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
  // Видаляємо крапки та слеші на початку, щоб коректно поєднувати з Subpath GitHub Pages
  const relativePath = String(source).replace(/^[./]+/, '');
  return new URL(relativePath, siteUrl).href;
}

function sanitizeSlug(val) {
  return String(val).replace(/[^a-zA-Z0-9_-]/g, '');
}

function safeIsoDate(dateString) {
  if (!dateString) return new Date().toISOString();
  const parsed = new Date(dateString);
  return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

// Генерація OG PNG під час збірки
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

  const words = String(title).split(' ');
  let line = '';
  let y = 240;
  const maxWidth = 1040;

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && i > 0) {
      ctx.fillText(line.trim(), 80, y);
      line = words[i] + ' ';
      y += 64;
      if (y > 480) {
        line = ''; // Припиняємо вивід, якщо переповнили розмір
        break;
      }
    } else {
      line = testLine;
    }
  }

  if (line.trim() && y <= 480) {
    ctx.fillText(line.trim(), 80, y);
  }

  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 28px sans-serif';
  ctx.fillText('VIRNI • virni.pro', 80, 550);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, canvas.toBuffer('image/png'));
}

function writePage(route, { title, description, image, ogImage, schema, content, type, keywords = '' }) {
  const canonicalUrl = new URL(route, siteUrl).href;
  const outputDirectory = path.join(outputRoot, route);
  const jsonLd = JSON.stringify(schema).replaceAll('<', '\\u003c');

  let pageHtml = baseIndexHtml;

  // Видаляємо стандартний title та наявні OG/Description мета-теги, щоб уникнути дублювання
  pageHtml = pageHtml.replace(/<title>.*?<\/title>/i, '');
  pageHtml = pageHtml.replace(/<meta\s+name="(description|keywords|robots|google-site-verification)"[^>]*>/gi, '');
  pageHtml = pageHtml.replace(/<meta\s+property="og:[^"]+"[^>]*>/gi, '');
  pageHtml = pageHtml.replace(/<link\s+rel="canonical"[^>]*>/gi, '');

  const seoMetaData = `
    <title>${escapeHtml(title)} | Virni</title>
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

  // 1. Генерація сторінок товарів
  for (const product of products) {
    const productId = sanitizeSlug(product.id);
    const name = product.title_uk || product.title_en || `Товар Virni ${productId}`;
    const description = product.description_uk || product.description_en || product.description || name;
    
    const primaryImage = absoluteAsset(product.image);
    const galleryImages = Array.isArray(product.images) ? product.images.map(img => absoluteAsset(img)) : [];
    const variantImages = Array.isArray(product.variants) 
      ? product.variants.filter(v => v.image).map(v => absoluteAsset(v.image)) 
      : [];

    const allImages = Array.from(new Set([primaryImage, ...galleryImages, ...variantImages])).filter(Boolean);

    const route = `product/${productId}/`;
    const canonicalUrl = new URL(route, siteUrl).href;
    const availability = product.stock > 0 ? 'InStock' : 'PreOrder';

    const currentPrice = Number(product.discountPrice || product.price || 0).toFixed(2);
    const originalPrice = product.discountPrice ? Number(product.price).toFixed(2) : null;

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name,
      image: allImages,
      description,
      sku: `VIRNI-${productId}`,
      category: product.category,
      brand: { '@type': 'Brand', name: 'Virni' },
      offers: {
        '@type': 'Offer',
        url: canonicalUrl,
        priceCurrency: 'USD',
        price: currentPrice,
        availability: `https://schema.org/${availability}`,
        itemCondition: 'https://schema.org/NewCondition'
      }
    };

    const variantsHtml = Array.isArray(product.variants) && product.variants.length > 0
      ? `<div class="product-variants">
          <span>Варіанти:</span>
          <div class="variants-list">
            ${product.variants.map(v => `
              <span class="variant-item" title="${escapeHtml(v.name_uk || v.name_en || '')}">
                ${v.colorHex ? `<span class="color-dot" style="background-color: ${escapeHtml(v.colorHex)}"></span>` : ''}
                ${escapeHtml(v.name_uk || v.name_en || '')}
              </span>
            `).join('')}
          </div>
         </div>`
      : '';

    const sizesHtml = Array.isArray(product.sizes) && product.sizes.length > 0
      ? `<div class="product-sizes">
          <span>Розміри:</span>
          <div class="sizes-list">
            ${product.sizes.map(s => `<span class="size-badge">${escapeHtml(s)}</span>`).join('')}
          </div>
         </div>`
      : '';

    const badges = [];
    if (product.isNew) badges.push('<span class="badge badge-new">Новинка</span>');
    if (product.isBestseller) badges.push('<span class="badge badge-bestseller">Бестселер</span>');
    if (product.discountPercent) badges.push(`<span class="badge badge-discount">-${escapeHtml(product.discountPercent)}%</span>`);
    const badgesHtml = badges.length > 0 ? `<div class="product-badges">${badges.join(' ')}</div>` : '';

    const content = `
    <div class="product-container">
      <div class="product-layout">
        <div class="product-gallery">
          <div class="main-image"><img src="${primaryImage}" alt="${escapeHtml(name)}"></div>
          ${galleryImages.length > 0 ? `
            <div class="thumbnails">
              ${galleryImages.map(img => `<img src="${img}" alt="${escapeHtml(name)}">`).join('')}
            </div>
          ` : ''}
        </div>
        <div class="product-info">
          ${badgesHtml}
          <h1>${escapeHtml(name)}</h1>
          <p class="category">${escapeHtml(product.category || '')}</p>
          <div class="price-box">
            <span class="price-tag">$${currentPrice} USD</span>
            ${originalPrice ? `<span class="original-price-tag">$${originalPrice} USD</span>` : ''}
          </div>
          ${variantsHtml}
          ${sizesHtml}
          <div class="description">${description}</div>
        </div>
      </div>
    </div>`;

    sitemapItems.push({
      url: writePage(route, { 
        title: name, 
        description, 
        image: primaryImage, 
        schema, 
        content, 
        type: 'product',
        keywords: [product.category, ...(product.sizes || [])].filter(Boolean).join(', ')
      }),
      lastmod: new Date().toISOString()
    });
  }

  // 2. Генерація сторінок новин
  for (const article of news) {
    const articleId = sanitizeSlug(article.id);
    const headline = article.title_uk || article.title_en || `Новини Virni ${articleId}`;
    const description = article.text_uk || article.text_en || headline;
    const category = article.category || 'Fashion';
    const tags = Array.isArray(article.tags) ? article.tags : [];
    const route = `news/${articleId}/`;
    const canonicalUrl = new URL(route, siteUrl).href;

    const ogFileName = `og-${articleId}.png`;
    const ogFilePath = path.join(outputRoot, 'assets', 'og', ogFileName);
    const ogImageUrl = absoluteAsset(`assets/og/${ogFileName}`);

    await generateOgImage({
      title: headline,
      category,
      outputPath: ogFilePath
    });

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Головна', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: 'Новини', item: new URL('news/', siteUrl).href },
        { '@type': 'ListItem', position: 3, name: headline, item: canonicalUrl }
      ]
    };

    const articleSchema = {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline,
      description,
      image: [ogImageUrl, absoluteAsset(article.image)],
      datePublished: safeIsoDate(article.date),
      dateModified: safeIsoDate(article.updated_at || article.date),
      author: { '@type': 'Person', name: article.author || 'Virni Editorial' },
      publisher: { 
        '@type': 'Organization', 
        name: 'Virni', 
        logo: { '@type': 'ImageObject', url: absoluteAsset('assets/icons/favicon.ico') } 
      }
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
        type: 'article',
        keywords: tags.join(', ')
      }),
      lastmod: safeIsoDate(article.updated_at || article.date)
    });
  }

  // 3. Генерація sitemap.xml та robots.txt
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

  // 4. Створення App Shells та фолбеку 404
  const appRoutes = ['shop', 'news', 'media', 'videos', 'cart'];
  for (const route of appRoutes) {
    const routeDirectory = path.join(outputRoot, route);
    fs.mkdirSync(routeDirectory, { recursive: true });
    fs.copyFileSync(baseIndexPath, path.join(routeDirectory, 'index.html'));
  }

  fs.copyFileSync(baseIndexPath, path.join(outputRoot, '404.html'));

  console.log(`✅ Успішно згенеровано ${products.length} товарів, ${news.length} новин, OG-зображення, Sitemap та 404.html!`);
})();