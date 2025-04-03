const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("✅ Hello from Puppeteer app!");
});

app.post("/scrape", async (req, res) => {
  const { businessName } = req.body;

  if (!businessName) {
    return res.status(400).json({ error: "Missing businessName" });
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: "/usr/bin/google-chrome",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
      });

    const page = await browser.newPage();
    await page.goto("https://www.facebook.com/ads/library/", { waitUntil: "networkidle2" });

    // Just test basic functionality
    const pageTitle = await page.title();
    await browser.close();

    res.json({ status: "success", title: pageTitle });
  } catch (err) {
    console.error("💥 Puppeteer error:", err.message);
    res.status(500).json({ error: "Puppeteer failed", details: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
