const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
app.use(express.json());

app.post('/scrape', async (req, res) => {
  const { businessName } = req.body;

  if (!businessName) {
    return res.status(400).json({ error: 'Missing businessName' });
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.goto('https://www.facebook.com/ads/library/', { waitUntil: 'networkidle2' });

    // Accept cookies
    try {
      await page.click('button[data-cookiebanner="accept_button"]', { timeout: 5000 });
    } catch {}

    // Search
    await page.type('input[placeholder="Search Ads Library"]', businessName);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(5000);

    const ads = await page.evaluate(() => {
      const adElements = document.querySelectorAll('[data-testid="ad"]');
      if (!adElements.length) return [];

      return Array.from(adElements).slice(0, 3).map(ad => {
        const text = ad.innerText;
        const link = ad.querySelector('a[href*="facebook.com/ads/library"]')?.href;
        const image = ad.querySelector('img')?.src;
        return { text, link, image };
      });
    });

    res.json({
      businessName,
      found: ads.length > 0,
      ads
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Scraping failed', details: err.message });
  } finally {
    await browser.close();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
