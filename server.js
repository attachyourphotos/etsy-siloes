const express = require('express');
const puppeteer = require('puppeteer');
const { OpenAI } = require('openai');
const openai = new OpenAI({
  apiKey: 'your-openai-api-key'
});

const app = express();
const port = process.env.PORT || 3000;

// Scrape Etsy Messages
async function scrapeMessages() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://www.etsy.com/signin');
  await page.type('#join_neu_email_field', 'your-email@example.com');
  await page.type('#join_neu_password_field', 'your-password');
  await page.click('.btn.btn--full-width');
  await page.waitForNavigation();

  await page.goto('https://www.etsy.com/messages');
  await page.waitForSelector('.message');
  
  const messages = await page.evaluate(() => {
    const messageElements = document.querySelectorAll('.message');
    const messages = [];
    messageElements.forEach((message) => {
      const sender = message.querySelector('.message__sender').innerText;
      const content = message.querySelector('.message__content').innerText;
      messages.push({ sender, content });
    });
    return messages;
  });

  await browser.close();
  return messages;
}

// AI-generated Reply
async function generateReply(messageContent) {
  const prompt = `Reply to this Etsy message: "${messageContent}" in a helpful and friendly tone.`;
  const response = await openai.chatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
  });
  return response.choices[0].message.content.trim();
}

// Example API endpoint
app.get('/messages', async (req, res) => {
  const messages = await scrapeMessages();
  const replies = await Promise.all(messages.map(async (msg) => {
    const reply = await generateReply(msg.content);
    return { ...msg, reply };
  }));
  res.json(replies);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
