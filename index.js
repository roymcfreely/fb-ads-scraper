const express = require("express");
const puppeteer = require("puppeteer");

const app = express();
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("✅ Puppeteer server is live!");
});

// Scrape route
app.post("/scrape", async (req, res) => {
  const { businessName } = req.body;

  if (!businessName) {
    return res.status(400).json({ error: "Missing businessName" });
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    // Fake headers
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36"
    );
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9"
    });

    // Go to Facebook Ads Library
    await page.goto("https://www.facebook.com/ads/library/", {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    // Type in the business name and search
    await page.type('input[placeholder="Search Ads Library"]', businessName);
    await page.keyboard.press("Enter");

    await page.waitForTimeout(5000); // Let the results load a bit

    // Wait for ad elements or "no ads" message
    await page.waitForSelector('[data-testid="ad"], ._9f9a', {
      timeout: 10000
    });

    // Scrape ad data
    const ads = await page.evaluate(() => {
      const adElements = document.querySelectorAll('[data-testid="ad"]');
      return Array.from(adElements).slice(0, 3).map(ad => {
        const text = ad.innerText.trim();
        const link = ad.querySelector('a[href*="facebook.com/ads/library"]')?.href || null;
        const image = ad.querySelector("img")?.src || null;
        return { text, link, image };
      });
    });

    await browser.close();

    res.json({
      businessName,
      found: ads.length > 0,
      ads
    });
  } catch (err) {
    console.error("💥 Puppeteer error:", err);
    res.status(500).json({ error: "Puppeteer failed", details: err.toString() });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
