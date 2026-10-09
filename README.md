# 🤖 LINE Bot 生活與待辦助手 (v2.0 改善版)

[![Node.js](https://img.shields.io/badge/Node.js-v24.21.0-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-v4.18.2-blue.svg)](https://expressjs.com/)
[![LINE Messaging API](https://img.shields.io/badge/LINE%20SDK-v10.8.0-00C300.svg)](https://developers.line.biz/)
[![Deploy on Render](https://img.shields.io/badge/Deploy-Render-black.svg)](https://render.com/)

> 本專案為大學「LINE Bot 專題開發」課後作業之改善版本。以第一版基礎架構為起點，透過 AI Agent 協作完成核心功能升級、Render 伺服器時區校正、完善防呆引導機制及資安強化。

---

## 📌 專案目錄與文件

- 📄 [原本的專題計畫書 (REPORT.md)](./REPORT.md)
- 📄 [第一版繳交成果摘要 (SUBMISSION.md)](./SUBMISSION.md)
- 🌐 [開發紀錄網頁原始碼 (index.html)](./index.html)
- 💻 [後端核心伺服器原始碼 (server.js)](./server.js)
- ⚙️ [環境變數範本 (.env.example)](./.env.example)

---

## 🚀 改善重點與前後差異 (v1.0 vs v2.0)

| 比較項目 | 第一版 (v1.0) | 第二版改善版 (v2.0) | 改善說明 |
| :--- | :--- | :--- | :--- |
| **核心功能** | 基礎鸚鵡回覆與 3 個固定關鍵字 | **個人待辦備忘清單系統** | 支援每位使用者專屬的待辦事項新增、查詢、完成與清空 |
| **時間功能 (Bug 修正)** | 時間慢 8 小時 (預設 UTC 伺服器時區) | **正確台灣時間 (UTC+8)** | 明確指定 `Asia/Taipei` 時區，徹底解決 Render 雲端伺服器時差 |
| **輸入不完整處理** | 無防呆，直接當成一般文字覆讀 | **清楚提示缺漏參數與示範** | 輸入「新增」未填內容或「完成」未給編號時，主動提示標準範例格式 |
| **不支援的指令** | 單純覆讀「你說了：XXX」 | **引導提示與可用清單** | 辨識失敗時提供友善指引與常用指令快捷選單，避免使用者迷航 |
| **資安管理** | `.env` 真實金鑰曾被追蹤進版控 | **金鑰抽離，提供 `.env.example`** | 真實金鑰透過雲端平台環境變數注入，程式碼庫僅保留範本佔位文字 |

---

## 🛠️ 功能與指令說明

本機器人提供多項實用生活與待辦管理指令，支援大小寫容錯與多種同義詞：

| 類別 | 輸入指令 | 說明 | 範例 |
| :--- | :--- | :--- | :--- |
| **時間查詢** | `時間` / `time` | 查詢精準的台灣標準時間 (UTC+8) | `時間` |
| **新增待辦** | `新增 [事項]` / `add [事項]` | 將工作加入個人專屬清單 | `新增 買牛奶` |
| **查看清單** | `清單` / `查看` / `list` | 檢視當前未完成待辦事項與流水編號 | `清單` |
| **完成項目** | `完成 [編號]` / `刪除 [編號]` | 劃掉已完成的工作項目 | `完成 1` |
| **清空清單** | `清空` / `clear` | 清除該使用者所有待辦事項 | `清空` |
| **使用說明** | `幫助` / `help` / `指令` | 顯示所有支援指令清單 | `幫助` |
| **版本資訊** | `版本` / `version` | 檢視 Bot 當前版本與更新日誌 | `版本` |

---

## 🧪 實測驗證（三種情境測試）

依照評分規範，本機器人完成下列情境驗證測試：

### 1. 正常使用測試 (Normal Scenario)
- **測試 1-1（時間校正）**：
  - 輸入內容：`時間`
  - 預期結果：回覆包含當前正確台灣時間（格式：`YYYY/MM/DD HH:mm:ss`，時區 UTC+8）。
  - 實際結果：✅ 成功顯示台灣標準時間，不再慢 8 小時。
- **測試 1-2（待辦新增與查詢）**：
  - 輸入內容：`新增 買牛奶` ➔ `清單`
  - 預期結果：成功新增並回覆「已成功新增」，隨後輸入清單可見「1. 買牛奶」。
  - 實際結果：✅ 成功記錄並正確條列項目。

### 2. 輸入不完整測試 (Incomplete Input Scenario)
- **測試 2-1（缺少事項內容）**：
  - 輸入內容：`新增`
  - 預期結果：提示缺少內容，並提供範例（如：`新增 買牛奶`）。
  - 實際結果：✅ 回覆「⚠️ 【輸入不完整】請在「新增」後面填寫要記錄的事項！👉 正確範例：新增 買牛奶」。
- **測試 2-2（缺少項目編號）**：
  - 輸入內容：`完成`
  - 預期結果：提示需提供數字編號。
  - 實際結果：✅ 回覆「⚠️ 【輸入不完整】請提供要完成或刪除的項目編號！👉 正確範例：完成 1」。
- **測試 2-3（空白訊息）**：
  - 輸入內容：`   `（純空白字元）
  - 預期結果：提示輸入不完整，提醒輸入有效指令。
  - 實際結果：✅ 回覆「⚠️ 【輸入不完整】你傳送了空白訊息！請輸入有效文字或指令。」。

### 3. 不支援的輸入測試 (Unsupported Scenario)
- **測試 3-1（不支援的指令文字）**：
  - 輸入內容：`我想喝珍奶`
  - 預期結果：提示無法辨識該指令，並列出支援的功能與「幫助」指引。
  - 實際結果：✅ 回覆「❓ 【不支援的指令】很抱歉，我無法辨識「我想喝珍奶」。👉 常用支援指令：時間、新增、清單、完成、幫助」。
- **測試 3-2（多媒體訊息/貼圖）**：
  - 輸入內容：傳送貼圖或圖片
  - 預期結果：提示目前僅支援文字指令操作。
  - 實際結果：✅ 回覆「📷 目前本機器人僅支援文字指令操作喔！請輸入「幫助」查看可用功能。」。

---

## ⚙️ 安裝與本機設定方式

### 1. 複製專案
```bash
git clone https://github.com/411512015-jpg/linebot.git
cd linebot
```

### 2. 安裝依賴套件
```bash
npm install
# 或使用 yarn
yarn install
```

### 3. 設定環境變數
複製 `.env.example` 並建立 `.env` 檔案：
```bash
cp .env.example .env
```
填寫你的 LINE Channel 金鑰：
```env
LINE_CHANNEL_SECRET=your_channel_secret_here
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token_here
PORT=3000
```
> ⚠️ **注意**：`.env` 已列入 `.gitignore`，切勿將真實金鑰 Commit 至版本庫中！

### 4. 啟動伺服器
```bash
npm start
# 服務將在 http://localhost:3000 運行
```

---

## ☁️ 雲端部署設定 (Render)

1. 在 [Render Dashboard](https://dashboard.render.com/) 建立 **Web Service**，連結本 GitHub 倉庫。
2. 填寫部署設定：
   - **Environment**: `Node`
   - **Build Command**: `yarn` 或 `npm install`
   - **Start Command**: `node server.js`（⚠️ 切勿填寫 `0`）
3. 在 **Environment Variables** 填入金鑰：
   - `LINE_CHANNEL_SECRET` = `[你的 Channel Secret]`
   - `LINE_CHANNEL_ACCESS_TOKEN` = `[你的 Channel Access Token]`
   - `PORT` = `3000`
4. 將產生的 Webhook 網址（例如 `https://your-service.onrender.com/webhook`）貼回 LINE Developers 後台並啟用 Webhook。

---

## ⚠️ 已知限制 (Known Limitations)

1. **記憶體儲存限制**：目前待辦事項暫存於 Node.js 執行階段記憶體（In-Memory Map），當 Render 雲端伺服器重啟或休眠喚醒時，清單將會重設。未來可升級銜接 MongoDB 或 PostgreSQL 進行資料持久化。
2. **免費方案冷啟動延遲**：Render 免費版在閒置 15 分鐘後會自動休眠，首次喚醒需要 30~50 秒，可能導致首次發送訊息稍有延遲。可利用 `/health` 端點搭配定時監控（如 UptimeRobot）保持伺服器活躍。
