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

    // 🧠 Spoof browser headers
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36"
    );
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9"
    });

    // 🕒 Go to Facebook Ads Library with increased timeout
    await page.goto("https://www.facebook.com/ads/library/", {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    const title = await page.title();
    await browser.close();

    res.json({ status: "success", title });
  } catch (err) {
    console.error("💥 Puppeteer error:", err);
    res.status(500).json({ error: "Puppeteer failed", details: err.toString() });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
