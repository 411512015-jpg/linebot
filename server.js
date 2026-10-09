const express = require('express');
const line = require('@line/bot-sdk');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.Client(config);

// 記憶體儲存各使用者的待辦清單 (Key: userId, Value: Array<string>)
const userTodos = new Map();

function getTodos(userId) {
  if (!userTodos.has(userId)) {
    userTodos.set(userId, []);
  }
  return userTodos.get(userId);
}

// 取得精準的台灣時間 (UTC+8)，解決第一版雲端伺服器 (Render) 時區慢 8 小時的問題
function getTaiwanTimeString() {
  return new Intl.DateTimeFormat('zh-TW', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date());
}

app.get('/', (req, res) => {
  res.send('LINE Bot v2.0 (改善版) is running.');
});

// 健康檢查與保持喚醒端點
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: getTaiwanTimeString() });
});

app.post('/webhook', line.middleware(config), async (req, res) => {
  try {
    const events = req.body.events || [];

    const results = await Promise.all(
      events.map(async (event) => {
        // 僅處理訊息事件
        if (event.type !== 'message') {
          return Promise.resolve(null);
        }

        // 情境處理：非文字訊息（例如貼圖、圖片、語音）
        if (event.message.type !== 'text') {
          return client.replyMessage(event.replyToken, {
            type: 'text',
            text: '📷 目前本機器人僅支援文字指令操作喔！\n請輸入「幫助」或「指令」查看可用功能。',
          });
        }

        const userId = (event.source && event.source.userId) || 'default_user';
        const rawText = event.message.text || '';
        const userText = rawText.trim();

        let replyText = '';

        // 1. 空白輸入防呆
        if (userText.length === 0) {
          replyText = '⚠️ 【輸入不完整】\n你傳送了空白訊息！請輸入有效文字或指令。\n👉 輸入「幫助」可查看所有指令。';
        }
        // 2. 時間查詢（修正第一版時區 Bug）
        else if (userText === '時間' || userText.toLowerCase() === 'time') {
          replyText = `🕒 【現在台灣時間 (UTC+8)】\n${getTaiwanTimeString()}\n（已校正 Render 伺服器時區偏差）`;
        }
        // 3. 幫助 / 指令清單
        else if (userText === '幫助' || userText.toLowerCase() === 'help' || userText === '指令') {
          replyText = `🤖 【生活與待辦助手 v2.0 指令表】
1. 🕒 時間：查詢正確台灣時間 (UTC+8)
2. ➕ 新增 [事項]：加入待辦（例：新增 買牛奶）
3. 📋 清單：查看當前所有待辦事項
4. ✅ 完成 [編號]：移除已完成事項（例：完成 1）
5. 🧹 清空：清空所有待辦事項
6. ℹ️ 版本：查看版本與改善說明

💡 請留意指令格式，避免缺少參數喔！`;
        }
        // 4. 版本資訊
        else if (userText === '版本' || userText.toLowerCase() === 'version') {
          replyText = `🤖 LINE Bot v2.0.0 (改善版)
✨ 改善項目：
1. 修正第一版 Render 伺服器時區問題 (台灣時間 UTC+8)
2. 新增個人專屬待辦清單核心功能
3. 建立完整防呆機制（空白防護、缺參數引導、不支援指令提示）`;
        }
        // 5. 新增待辦事項（含輸入不完整判斷）
        else if (userText === '新增' || userText.toLowerCase() === 'add') {
          // 輸入不完整情境
          replyText = '⚠️ 【輸入不完整】\n請在「新增」後面填寫要記錄的事項！\n👉 正確範例：\n• 新增 買牛奶\n• 新增 繳交作業報告';
        } else if (
          userText.startsWith('新增 ') ||
          userText.startsWith('新增') ||
          userText.toLowerCase().startsWith('add ') ||
          userText.toLowerCase().startsWith('add')
        ) {
          const item = userText.replace(/^(新增|add)\s*/i, '').trim();
          if (!item) {
            replyText = '⚠️ 【輸入不完整】\n請在「新增」後面填寫要記錄的事項！\n👉 正確範例：新增 買牛奶';
          } else {
            const list = getTodos(userId);
            list.push(item);
            replyText = `✅ 【已成功新增待辦】\n📌 「${item}」\n\n目前共有 ${list.length} 項待辦事項。\n（輸入「清單」可查看所有項目）`;
          }
        }
        // 6. 查詢待辦清單
        else if (userText === '清單' || userText === '查看' || userText.toLowerCase() === 'list') {
          const list = getTodos(userId);
          if (list.length === 0) {
            replyText = '📝 目前待辦清單是空的！\n\n👉 可以輸入「新增 [事項]」來加入新工作，例如：新增 買牛奶';
          } else {
            const items = list.map((item, idx) => `${idx + 1}. ${item}`).join('\n');
            replyText = `📋 【你的待辦清單】(共 ${list.length} 項)：\n${items}\n\n💡 提示：輸入「完成 [編號]」可劃掉已完成事項（例：完成 1）。`;
          }
        }
        // 7. 完成/刪除待辦事項（含輸入不完整判斷）
        else if (userText === '完成' || userText === '刪除' || userText.toLowerCase() === 'done' || userText.toLowerCase() === 'del') {
          // 輸入不完整情境
          replyText = '⚠️ 【輸入不完整】\n請提供要完成或刪除的項目編號！\n👉 正確範例：完成 1\n👉 正確範例：刪除 2\n（可先輸入「清單」查看目前項目編號）';
        } else if (userText.match(/^(完成|刪除|done|del)\s*(\d+)$/i)) {
          const match = userText.match(/^(完成|刪除|done|del)\s*(\d+)$/i);
          const index = parseInt(match[2], 10) - 1;
          const list = getTodos(userId);

          if (list.length === 0) {
            replyText = '⚠️ 目前沒有任何待辦事項可以完成！';
          } else if (index >= 0 && index < list.length) {
            const removed = list.splice(index, 1)[0];
            replyText = `🎉 【已完成並移除】\n✔ 「${removed}」\n\n目前剩餘 ${list.length} 項待辦事項。`;
          } else {
            replyText = `⚠️ 【找不到編號 ${match[2]}】\n目前只有 ${list.length} 項待辦事項，請輸入「清單」確認編號。`;
          }
        } else if (userText.startsWith('完成') || userText.startsWith('刪除')) {
          replyText = '⚠️ 【輸入格式錯誤】\n請輸入正確的數字編號！\n👉 正確範例：完成 1';
        }
        // 8. 清空待辦清單
        else if (userText === '清空' || userText.toLowerCase() === 'clear') {
          userTodos.set(userId, []);
          replyText = '🧹 【待辦清單已清空】\n所有事項均已移除！';
        }
        // 9. 不支援的指令（情境：不支援的輸入）
        else {
          replyText = `❓ 【不支援的指令】\n很抱歉，我無法辨識「${rawText}」。\n\n👉 常用支援指令：\n• 「時間」：查詢台灣時間 (UTC+8)\n• 「新增 [事項]」：加入待辦事項\n• 「清單」：查看所有待辦清單\n• 「完成 [編號]」：標記完成項目\n• 「幫助」：查看完整指令列表`;
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

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

module.exports = app;
