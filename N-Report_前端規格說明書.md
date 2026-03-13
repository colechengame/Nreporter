# N-Report 前端規格說明書 (Frontend Specification)

## 1. 專案概述 (Project Overview)

**N-Report 權限中控台** 是一個用於管理企業報表權限、門市人員配置與自動化派送設定的單頁應用程式 (SPA)。本系統旨在解決跨體系（星辰集團/中醫體系）的報表分派與權限控管問題，提供直觀的操作介面供管理人員使用。

### 1.1 技術堆疊 (Tech Stack)
*   **核心架構**: Vanilla HTML5 / JavaScript (ES6+)
*   **樣式框架**: Tailwind CSS (CDN引入)
*   **圖標庫**: FontAwesome 6 (CDN引入)
*   **Markdown 解析**: Marked.js (用於文檔渲染)
*   **響應式設計**: 支援 Desktop (主視圖) 與 Mobile (Compact View)

---

## 2. 系統架構與全域功能 (Architecture & Global Features)

### 2.1 體系視角切換 (System Context Switcher)
系統支援多集團/體系架構，透過頂部導航列的下拉選單切換全域視角。

*   **選項**:
    1.  **全部體系 (All Systems)**: 顯示所有門市與人員（最高管理員視角）。
    2.  **星辰集團 (Guangze)**: 僅顯示醫美、岩盤浴相關門市與人員。
    3.  **中醫體系 (TCM)**: 僅顯示中醫診所、養生館相關門市與人員。
*   **連動影響**:
    *   **門市列表**: 自動過濾非當前體系的門市。
    *   **統計數據**: 頂部 Dashboard 數字重新計算。
    *   **人員選單**: 執行指派/加人操作時，下拉選單僅顯示該體系員工。

### 2.2 AI 智慧助手 (AI Assistant)
*   **功能**: 透過自然語言指令執行系統操作。
*   **支援指令範例**:
    *   "把板橋醫美的店長換成 Tina" (權限移轉)
    *   "修改板橋醫美的 Email 為 bz_med.new@company.com" (資料更新)
    *   "讓 David 可以看忠孝岩盤浴的營收報表" (細部權限)
*   **實作**: 呼叫 Google Gemini API 解析意圖並回傳 JSON Action 執行。

### 2.3 響應式佈局 (RWD)
*   **Desktop**: 完整表格視圖、側邊/頂部完整導航。
*   **Mobile**: 卡片式列表 (Card List)、底部固定導航列 (Bottom Nav)、簡化操作按鈕。

---

## 3. 功能模組詳解 (Functional Modules)

### 3.1 門市與權限管理 (Store & Permission Management)
**路徑**: `Tab: 門市與細部權限`

#### 3.1.1 門市列表
*   **顯示資訊**: 門市名稱、代碼、分類圖示（醫美/養生/中醫）、主要店經理、Role Email、額外授權人數。
*   **篩選器**: 
    *   依體系自動切換分類按鈕（如：切換至中醫時，隱藏「養生」按鈕）。
    *   文字搜尋：支援搜尋門市名稱、代碼、經理姓名。

#### 3.1.2 編輯門市 (Edit Store Modal)
*   **功能**: 修改門市基本資料。
*   **欄位**: 門市名稱、Role Email (連動 Google Drive 權限)。
*   **限制**: 門市代碼 (Code) 不可修改。

#### 3.1.3 權限移轉 (Primary Manager Assignment)
*   **功能**: 指派或更換門市的主要負責人（店長）。
*   **邏輯**: 下拉選單根據「當前體系」過濾員工名單。

#### 3.1.4 細部權限設定 (Granular Permission)
*   **功能**: 在主要店長之外，授權其他人員（如區督導、顧問）存取特定報表。
*   **操作**: 
    1.  選擇人員（依體系過濾）。
    2.  勾選可存取的報表（支援「報表組合」快速套用）。

### 3.2 報表組合管理 (Report Templates)
**路徑**: `Tab: 報表組合`

*   **目的**: 定義一組常用的報表集合（如：店長專用包、財務專用包），簡化授權流程。
*   **功能**:
    *   新增/編輯/刪除組合。
    *   搜尋組合。
    *   列表顯示組合包含的報表數量與摘要。

### 3.3 系統設定 (Settings)
**路徑**: `Tab: 系統設定`

#### 3.3.1 新展店精靈 (New Store Wizard)
分步驟引導使用者建立新門市：
1.  **基本資料**: 選擇類型（醫美/岩盤浴/中醫）、輸入代碼與名稱、自動生成 Email。
2.  **人員指派**: 預先指派店經理（名單依類型過濾）。
3.  **Drive 設定**: 設定是否自動建立資料夾、授權 Role Email、通知 n8n。
4.  **確認**: 預覽並送出。

#### 3.3.2 報表管理
*   管理系統內所有可用的報表清單（代碼、名稱、分類）。

#### 3.3.3 Google Drive 同步狀態
*   顯示各門市資料夾與權限的同步狀態（成功/待同步/失敗）。
*   提供「全部同步」按鈕觸發 n8n 流程。

---

## 4. 資料模型 (Data Models)

### 4.1 門市 (Store)
```javascript
{
    code: "BZ_MED",           // 唯一代碼
    name: "板橋光澤醫美",      // 顯示名稱
    roleEmail: "...",         // Google Drive 授權信箱
    businessSystem: "guangze",// 所屬體系 (guangze/tcm)
    primaryManager: { ... },  // 主要負責人
    authorizedUsers: [ ... ]  // 額外授權列表
}
```

### 4.2 人員 (Staff)
```javascript
{
    id: "S001",
    name: "員工A",
    nickname: "Alice",
    role: "區經理",
    businessSystem: "guangze" // 所屬體系 (用於下拉選單過濾)
}
```

### 4.3 報表 (Report)
```javascript
{
    code: "R001",
    name: "護理部消耗報表",
    category: "營運" // 用於顏色標籤與篩選
}
```

---

## 5. 待開發項目 (Future Work)

依據 `前後端整合待辦事項.md`，前端後續需擴充：

1.  **報表訂閱管理介面**:
    *   實作各門市的訂閱清單勾選介面。
    *   新增訂閱頻率設定（每日/週/月）。
2.  **派送記錄查詢**:
    *   新增「派送日誌」頁面，串接後端 API 顯示 n8n 執行結果。
3.  **真實 API 串接**:
    *   將目前的 `stores`, `staffList` 等假資料替換為 `fetch()` 呼叫後端 API。

---

## 6. 檔案結構 (File Structure)

*   `index.html`: 主程式入口，包含所有視圖 (Views)、模態框 (Modals) 與核心邏輯。
*   `index1.html` / `index2.html`: 舊版備份或實驗性 UI。
*   `store-report-gdrive.html`: 獨立的設定頁面（可選）。
