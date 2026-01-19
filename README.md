# N-Report 權限中控台

統一管理門市報表權限、Google Drive 資料夾授權與 n8n 工作流整合的企業級解決方案。

## 功能特色

### 門市與權限管理
- **門市管理**：新展店設定、Role Email 維護、店經理指派
- **細部授權**：針對特定人員設定報表存取權限
- **群組管理**：跨門市的區域管理權限設定

### 報表系統
- **28 份標準報表**：涵蓋營運、人資、財務、行銷、會員、系統六大類
- **報表組合**：預定義報表組合，快速套用權限
- **報表管理**：新增、編輯、停用報表

### Google Drive 整合
- **自動建立資料夾**：新展店時自動建立對應的 Drive 資料夾結構
- **權限同步**：Role Email 與授權人員自動同步至 Google Drive
- **同步狀態監控**：即時查看各門市的 Drive 同步狀態

### AI 助手
- **自然語言操作**：透過 Gemini AI 解析指令，快速執行權限變更
- **支援指令**：換店長、修改 Email、授權報表等

## 專案結構

```
Nreporter/
├── index.html                    # 主控台 (單頁應用)
├── store-report-gdrive.html      # 獨立系統設定頁面
├── backend/                      # Node.js + Express 後端
│   ├── prisma/
│   │   ├── schema.prisma         # 資料庫模型
│   │   └── seed.ts               # 種子資料
│   └── src/
│       ├── modules/              # 業務模組
│       │   ├── stores/           # 門市管理
│       │   ├── staff/            # 人員管理
│       │   ├── reports/          # 報表管理
│       │   ├── groups/           # 群組管理
│       │   ├── templates/        # 報表組合
│       │   └── ai/               # AI 指令
│       └── integrations/         # 外部整合
│           └── google-drive/     # Google Drive API
├── docs/                         # 技術文檔
│   ├── DUAL_SOURCE_ARCHITECTURE.md
│   └── UNIFIED_N8N_ARCHITECTURE.md
├── FULLSTACK_ARCHITECTURE.md     # 全端架構設計
├── PERMISSION_MINDMAP.md         # 權限邏輯心智圖
└── rule.md                       # 系統規則說明
```

## 技術棧

### 前端
- Vanilla JavaScript
- Tailwind CSS
- Font Awesome 6
- Marked.js (Markdown 渲染)

### 後端
- Node.js + Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- Zod (驗證)
- JWT (認證)

### 整合服務
- Google Drive API
- Google Gemini AI
- n8n Workflow

## 快速開始

### 前端 (純靜態)

直接在瀏覽器開啟 `index.html` 即可使用前端功能。

### 後端

```bash
# 進入後端目錄
cd backend

# 安裝依賴
npm install

# 設定環境變數
cp .env.example .env
# 編輯 .env 填入資料庫連線等設定

# 資料庫遷移
npm run db:push

# 填入種子資料
npm run db:seed

# 啟動開發伺服器
npm run dev
```

## 環境變數

```env
# 資料庫
DATABASE_URL=postgresql://user:password@localhost:5432/nreport

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# API
API_PORT=3000
API_PREFIX=/api

# Google Drive
GOOGLE_SERVICE_ACCOUNT_EMAIL=service@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_KEY_FILE=./credentials/service-account.json

# AI
GEMINI_API_KEY=your-gemini-api-key

# n8n
N8N_WEBHOOK_URL=https://n8n.company.com/webhook/
```

## 主要頁籤

| 頁籤 | 說明 |
|------|------|
| 門市與細部權限 | 管理門市、店經理、授權人員 |
| 多店/區域管理 | 跨門市群組權限設定 |
| 報表組合 | 預定義報表組合管理 |
| 人員管理 | 人員暱稱與職位維護 |
| 系統設定 | 新展店精靈、報表管理、Drive 同步 |
| 技術文檔 | 內嵌架構文件查看 |

## 報表分類

| 分類 | 數量 | 範例 |
|------|------|------|
| 營運 | 9 | 護理部消耗報表、進銷貨明細 |
| 人資 | 5 | 新進人員名單、每月時數表 |
| 財務 | 6 | 員購報表、諮詢師積分 |
| 行銷 | 3 | 好友專案報表、電銷報表 |
| 會員 | 2 | 設定影片名單、會員資料異動 |
| 系統 | 3 | 報修系統報表、各體系分院代碼 |

## 門市類型

| 類型 | 數量 | 說明 |
|------|------|------|
| 醫美 | 20 | 光澤/彤顏診所 |
| 岩盤浴 | 6 | SPA 館 |
| 其他 | 6 | 辦公室、總部 |

## 架構文件

- [全端架構設計](./FULLSTACK_ARCHITECTURE.md)
- [權限邏輯心智圖](./PERMISSION_MINDMAP.md)
- [雙來源架構設計](./docs/DUAL_SOURCE_ARCHITECTURE.md)
- [統一 N8N 流程](./docs/UNIFIED_N8N_ARCHITECTURE.md)
- [系統規則說明](./rule.md)

## API 端點

### 門市 (Stores)
```
GET    /api/stores          # 取得所有門市
GET    /api/stores/:id      # 取得單一門市
POST   /api/stores          # 新增門市
PUT    /api/stores/:id      # 更新門市
DELETE /api/stores/:id      # 刪除門市
PUT    /api/stores/:id/manager      # 指派店經理
POST   /api/stores/:id/auth-users   # 新增授權人員
```

### 報表 (Reports)
```
GET    /api/reports         # 取得所有報表
GET    /api/reports/:id     # 取得單一報表
POST   /api/reports         # 新增報表
PUT    /api/reports/:id     # 更新報表
DELETE /api/reports/:id     # 刪除報表
```

### AI 指令
```
POST   /api/ai/command      # 執行 AI 指令
```

## License

Private - All rights reserved.
