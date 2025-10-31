import express from "express";
import axios from "axios";
import cors from "cors";
import puppeteer from "puppeteer-extra";
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
puppeteer.use(StealthPlugin)

const app = express();
app.use(cors());
const PORT = 3000;
const ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"

async function getCookie() {
  const browser = await puppeteer.launch({
    headless: true
  });
  const page = await browser.newPage();
  page.setUserAgent(ua);
  page.setBypassCSP(true);
  await page.goto(
    "https://www.nseindia.com/get-quotes/equity?symbol=TEAMLEASE"
  );

  // now authenticated, extract cookies
  const cookies = await page.cookies();
  const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

  console.log(cookieHeader)

  return cookieHeader;
}

// Function to create axios instance with headers
const createAxiosInstance = async () => {
  const headers = {
    "User-Agent": ua,
    Accept: "application/json, text/plain, */*",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "en-US,en;q=0.9",
    Connection: "keep-alive",
    Referer: "https://www.nseindia.com/get-quotes/equity?symbol=TCS",
    Cookie: await getCookie(),
  };

  console.log(headers)

  const instance = axios.create({
    headers,
    withCredentials: true,
  });

  return instance;
};

// Endpoint: /api/announcements/:symbol
app.get("/api/announcements/:symbol", async (req, res) => {
  const { symbol } = req.params;
  try {
    const instance = await createAxiosInstance();
    const response = await instance.get(
      `https://www.nseindia.com/api/corporate-disclosure-getquote?symbol=${symbol.toUpperCase()}&corpType=announcement&market=equities&reqXbrl=false&from_date=30-04-2025&to_date=30-10-2025`
    );

    res.json(response.data);
  } catch (err) {
    console.error("❌ Error fetching NSE data:", err.message);
    res.status(500).json({ error: "Failed to fetch announcements" });
  }
});

// Test route
app.get("/", (req, res) => {
  res.send("✅ NSE Proxy Server Running!");
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
