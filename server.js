const express = require('express');
const { Client, middleware } = require('@line/bot-sdk');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new Client(config);

app.get('/', (req, res) => {
  res.send('LINE Bot is running.');
});

app.post('/webhook', middleware(config), async (req, res) => {
  try {
    const events = req.body.events || [];

    const results = await Promise.all(
      events.map(async (event) => {
        if (event.type !== 'message' || event.message.type !== 'text') {
          return null;
        }

        const userText = event.message.text;
        let replyText = `你說了：${userText}`;

        if (userText.includes('幫助') || userText.includes('help')) {
          replyText = '可用指令：\n1. 你好\n2. 幫助\n3. 時間\n4. 版本';
        } else if (userText.includes('時間') || userText.includes('time')) {
          replyText = `現在時間：${new Date().toLocaleString('zh-TW')}`;
        } else if (userText.includes('版本') || userText.includes('version')) {
          replyText = 'LINE Bot v1.0.0';
        }

        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: replyText,
        });
      })
    );

    res.json(results);
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).end();
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
