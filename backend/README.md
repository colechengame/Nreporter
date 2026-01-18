# N-Report Backend

N-Report 權限中控台的後端 API 服務。

## 技術棧

- **框架**: Express.js + TypeScript
- **資料庫**: PostgreSQL + Prisma ORM
- **驗證**: Zod
- **安全性**: Helmet, CORS, Rate Limiting

## 快速開始

### 1. 安裝相依套件

```bash
cd backend
npm install
```

### 2. 設定環境變數

```bash
cp .env.example .env
# 編輯 .env 檔案，設定資料庫連線等資訊
```

### 3. 初始化資料庫

```bash
# 產生 Prisma Client
npm run db:generate

# 執行資料庫遷移
npm run db:migrate

# 填入種子資料
npm run db:seed
```

### 4. 啟動開發伺服器

```bash
npm run dev
```

伺服器將在 `http://localhost:3000` 啟動。

## API 端點

| 模組 | 端點 | 說明 |
|------|------|------|
| Reports | `/api/reports` | 報表管理 |
| Staff | `/api/staff` | 人員管理 |
| Stores | `/api/stores` | 門市管理 |
| Groups | `/api/groups` | 群組管理 |
| Templates | `/api/templates` | 報表組合管理 |
| AI | `/api/ai` | AI 指令 |

## 專案結構

```
backend/
├── prisma/
│   ├── schema.prisma      # 資料庫模型
│   └── seed.ts            # 種子資料
├── src/
│   ├── app.ts             # Express 應用
│   ├── server.ts          # 伺服器入口
│   ├── config/            # 配置檔
│   ├── middleware/        # 中間件
│   ├── modules/           # 業務模組
│   │   ├── stores/        # 門市模組 (完整範例)
│   │   ├── staff/         # 人員模組
│   │   ├── reports/       # 報表模組
│   │   ├── groups/        # 群組模組
│   │   ├── templates/     # 報表組合模組
│   │   └── ai/            # AI 模組
│   └── shared/            # 共用工具
└── package.json
```

## 開發指令

```bash
# 開發模式
npm run dev

# 建置
npm run build

# 執行
npm start

# 資料庫操作
npm run db:generate   # 產生 Prisma Client
npm run db:migrate    # 執行遷移
npm run db:push       # 同步 Schema (開發用)
npm run db:seed       # 填入種子資料
npm run db:studio     # 開啟 Prisma Studio
```

## 模組開發指南

每個模組包含以下檔案：

- `*.dto.ts` - 資料傳輸物件 (Zod Schema)
- `*.service.ts` - 業務邏輯層
- `*.controller.ts` - 控制器層
- `*.routes.ts` - 路由定義

請參考 `src/modules/stores/` 作為完整範例。
