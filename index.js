const express = require("express");
const puppeteer = require("puppeteer");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("✅ Puppeteer server is live!");
});

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

    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36"
    );
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9"
    });

    await page.goto("https://www.facebook.com/ads/library/", {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    // Wait for and click on the country dropdown
    await page.waitForSelector('div[role="button"]', { timeout: 10000 });
    const countryDropdowns = await page.$$('div[role="button"]');
    if (countryDropdowns.length > 0) {
      await countryDropdowns[0].click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await page.keyboard.type("United States");
      await page.keyboard.press("Enter");
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Wait for more flexible search input selector
    await page.waitForSelector('input[type="search"], input[aria-label]', { timeout: 15000 });

    // Optional: take a screenshot for debugging
    // await page.screenshot({ path: "search-step.png", fullPage: true });

    // Type and search
    await page.type('input[type="search"], input[aria-label]', businessName);
    await page.keyboard.press("Enter");
    await new Promise(resolve => setTimeout(resolve, 6000));

    // Wait for ad cards or fallback
    await page.waitForSelector('[data-testid="ad"], ._9f9a', {
      timeout: 10000
    });

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
