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

    // Wait extra long to give the DOM time to fully render
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Grab full HTML of page and log it to console
    const html = await page.content();
    console.log("🧠 FULL PAGE HTML:\n", html.substring(0, 5000), "\n... (truncated)");

    await browser.close();

    res.json({
      status: "success",
      message: "HTML dumped to logs — check Railway logs to find the right selector."
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
