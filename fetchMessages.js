const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const port = 3000;

app.get('/fetch-messages', async (req, res) => {
  const { email, password } = req.query;
  const messages = await fetchMessages('https://www.etsy.com/messages', email, password);
  res.json(messages);
});

async function fetchMessages(shopUrl, email, password) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://www.etsy.com/signin');
  await page.type('#join_neu_email_field', email);
  await page.type('#join_neu_password_field', password);
  await page.click('button[data-id="join-neu-form-submit"]');
  await page.waitForNavigation();
  
  await page.goto(shopUrl);
  await page.waitForSelector('.messages-list');
  
  const messages = await page.evaluate(() => {
    const messageElements = document.querySelectorAll('.message-item');
    const messages = [];
    messageElements.forEach(msg => {
      const sender = msg.querySelector('.message-sender')?.innerText;
      const content = msg.querySelector('.message-content')?.innerText;
      if (sender && content) {
        messages.push({ sender, content });
      }
    });
    return messages;
  });

  await browser.close();
  return messages;
}

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
