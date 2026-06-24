/**
 * Prebuild script: downloads images that are missing from R2 directly from
 * the live Squarespace site at dadachi.com, then saves them to public/images/
 * so they are served as static assets from Cloudflare Pages.
 * Runs during Cloudflare Pages build where full internet access is available.
 */
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public', 'images');

if (!existsSync(PUBLIC_DIR)) mkdirSync(PUBLIC_DIR, { recursive: true });

const R2 = 'https://pub-ba018632258942529034e3ab490a6167.r2.dev';

// All images used in the site: { localName, r2Key, squarespaceHint }
// squarespaceHint: partial filename to search for in Squarespace HTML
const IMAGES = [
  {
    local: 'logo-header.png',
    r2: `${R2}/adbb76e3-8361-4f10-82ea-3e5d7da38d94_Logo_Dada_Chi-2%EF%B9%96format=300w.png`,
    hint: 'Logo_Dada_Chi',
  },
  {
    local: 'logo-footer.png',
    r2: `${R2}/a485a9ae-e6de-461b-99d4-d092f488f944_Dada%2BChi%2BLogo%EF%B9%96format=300w.png`,
    hint: 'Dada+Chi+Logo',
  },
  {
    local: 'chi-tribe-logo.png',
    r2: `${R2}/426f145d-582c-4353-83a9-a1568586012b_Chi_Tribe_Logo%EF%B9%96format=750w.png`,
    hint: 'Chi_Tribe_Logo',
  },
  {
    local: 'book-cover.png',
    r2: `${R2}/471eb76d-2255-4fe8-9f01-45ace5693da4_Menschsein-1-EN.png%EF%B9%96format=750w.png`,
    hint: 'Menschsein',
  },
  {
    local: 'flow-sessions.png',
    r2: `${R2}/85e20d7b-590c-4689-98e7-b335d3f381bc_Water%EF%B9%96format=500w.png`,
    hint: 'Water',
  },
];

async function tryFetch(url, label) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DadaChiBuild/1.0)' },
      redirect: 'follow',
    });
    if (res.ok) {
      console.log(`  ✓ Got ${label} from ${url.substring(0, 60)}...`);
      return Buffer.from(await res.arrayBuffer());
    }
    console.log(`  ✗ ${res.status} for ${label}`);
  } catch (e) {
    console.log(`  ✗ Error for ${label}: ${e.message}`);
  }
  return null;
}

async function getSquarespaceImageUrl(hint) {
  // Fetch dadachi.com homepage and extract image URLs matching the hint
  const pages = ['https://dadachi.com/en', 'https://dadachi.com'];
  for (const page of pages) {
    try {
      const res = await fetch(page, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        },
      });
      if (!res.ok) continue;
      const html = await res.text();
      // Find image URLs containing our hint
      const regex = new RegExp(`https://[^"'\\s]*${hint.replace(/[+]/g, '[+]').replace(/[.]/g, '[.]')}[^"'\\s]*`, 'gi');
      const matches = html.match(regex);
      if (matches && matches.length > 0) {
        console.log(`  Found ${matches.length} Squarespace URL(s) for hint "${hint}"`);
        return matches[0];
      }
    } catch (e) {
      console.log(`  Could not fetch ${page}: ${e.message}`);
    }
  }
  return null;
}

async function main() {
  console.log('Fetching missing images for dadachi.com...\n');

  for (const img of IMAGES) {
    const dest = join(PUBLIC_DIR, img.local);
    if (existsSync(dest)) {
      console.log(`Skip ${img.local} (already exists)`);
      continue;
    }

    console.log(`Processing ${img.local}...`);

    // Try R2 first
    let data = await tryFetch(img.r2, `R2/${img.local}`);

    // Fall back to Squarespace CDN
    if (!data) {
      const squarespaceUrl = await getSquarespaceImageUrl(img.hint);
      if (squarespaceUrl) {
        data = await tryFetch(squarespaceUrl, `Squarespace/${img.local}`);
      }
    }

    if (data) {
      writeFileSync(dest, data);
      console.log(`  Saved → public/images/${img.local} (${data.length} bytes)\n`);
    } else {
      console.log(`  WARN: Could not download ${img.local} – will show placeholder\n`);
    }
  }

  console.log('Done.\n');
}

main().catch(e => {
  console.error('fetch-missing-images error:', e);
  // Don't fail the build if images can't be fetched
  process.exit(0);
});
