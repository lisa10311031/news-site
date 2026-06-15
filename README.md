# 環訊 · 全球新聞分類站（免費版）

一個會「每天自動」搜尋全球各地新聞、依類別整理的公開網站。
**完全免費、不需要任何 API 金鑰、不用儲值。**

架構：**GitHub Actions（每日定時，免費）→ 抓免費的 Google 新聞 RSS → 產生 `news.json` → GitHub Pages（免費託管）顯示**。

功能：
- **分類瀏覽**：電子零件、政治、科技、財經、國際、供應鏈、健康醫療，各類別有專屬配色。
- **搜尋**：在當天已載入的新聞裡即時關鍵字過濾，跨所有類別、秒出結果。
- **收藏**：點卡片右上角星號收藏，存在訪客自己的瀏覽器（localStorage），每人收藏自己的。
- **多語言**：繁體中文 / English / 日本語。每種語言各自抓該語言的新聞。

---

## 一次性設定（約 10 分鐘，全程免費）

> 不需要申請任何金鑰，也不用設定 Secret。

### 1. 建立 GitHub 儲存庫
1. 到 <https://github.com> 建一個新的 repository（例如 `news-site`），設為 **Public**。
2. 把本資料夾所有檔案上傳進去（保持資料夾結構，`.github/workflows/` 不要漏）。

### 2. 開啟 GitHub Pages
1. 進 repo 的 **Settings → Pages**。
2. **Source** 選 `Deploy from a branch`，分支選 `main`、資料夾選 `/ (root)`，儲存。
3. 稍等一兩分鐘，頁面網址會顯示在這（例 `https://你的帳號.github.io/news-site/`）。

### 3. 產生第一份新聞
1. 進 **Actions** 分頁，左側點「每日更新新聞」。
2. 右側 **Run workflow** → 執行。
3. 跑完後 repo 會多出有內容的 `news.json`，打開你的 Pages 網址就看得到新聞了。

之後系統會在**每天台灣早上 6 點**自動更新，不需要任何人動手。

---

## 綁定你自己的網域（選用）
1. 在 **Settings → Pages → Custom domain** 填入你的網域（例 `news.example.com`）。
2. 到你的網域 DNS 服務商，加一筆 `CNAME` 指向 `你的帳號.github.io`。
3. 回 Pages 頁面勾選 **Enforce HTTPS**。

---

## 想改類別、改顏色、改語言？

**類別與顏色**：打開 `scripts/generate.mjs`，編輯最上方的 `CATEGORIES`，例如新增：

```js
{ id: "semiconductor", accent: "#1F6FB2", labels: { zh: "半導體", en: "Semiconductors", ja: "半導体" } },
{ id: "ev",            accent: "#2E7D5B", labels: { zh: "電動車", en: "EVs",            ja: "EV" } },
```

`id` 是類別代碼（英數、不重複）；`labels` 同時當作各語言的「顯示名稱」與「搜尋關鍵字」；`accent` 是顏色。前端會自動套用，不必改 `index.html`。

**語言**：想增減語言要改兩處——`scripts/generate.mjs` 的 `LANGS` 與 `LOCALES`、以及 `index.html` 裡的 `UI` 文字字典。預設 `zh` / `en` / `ja`。

> `index.html` 與 `scripts/generate.mjs` 共用同一套資料格式，更新時請一起部署。

---

## 本機測試（選用）
裝好 Node 18+ 後，直接執行（不需要金鑰）：

```bash
node scripts/generate.mjs
```

會在專案根目錄產生 `news.json`。接著用任意靜態伺服器預覽 `index.html`：

```bash
npx serve .
```

---

## 檔案說明
| 檔案 | 用途 |
| --- | --- |
| `index.html` | 前端網頁，只讀 `news.json` 顯示 |
| `news.json` | 每日更新的新聞資料（自動產生） |
| `scripts/generate.mjs` | 抓免費 RSS、整理新聞的程式 |
| `.github/workflows/update-news.yml` | 每日定時 + 手動觸發的自動化設定 |

---

## 注意
- 新聞來源是 Google 新聞 RSS（免費、公開）。它是穩定的公開訂閱來源，但屬非官方介面；萬一 Google 改格式，`generate.mjs` 的解析可能需要微調。
- 免費 RSS 多半只提供標題、來源、日期、連結，摘要常會留白（這是免費新聞聚合站的常態）。若日後想要 AI 撰寫的摘要與更聰明的分類，可改接付費的 AI 版本。
- 分類是用關鍵字查詢，不是 AI 語意判斷。
- 收藏存在每位訪客自己的瀏覽器，不會跨裝置同步；清除瀏覽器資料會一併清掉。
- 搜尋是在「當天已載入的新聞」中過濾，不會即時連網。
- 新聞內容僅供快速掌握，正式引用請以原文連結的報導為準。
