# N-Report 權限中控台 - 全端開發架構規範

## 一、系統概述

將現有的單頁前端應用轉換為完整的全端架構，實現資料持久化、API 服務化、權限驗證等企業級功能。

---

## 二、技術棧建議

### 後端 (Backend)
```
框架：Node.js + Express.js 或 NestJS
資料庫：PostgreSQL (主資料) + Redis (快取/Session)
ORM：Prisma 或 TypeORM
驗證：JWT + Passport.js
API 規範：RESTful API
```

### 前端 (Frontend)
```
框架：React 18+ 或 Vue 3+
狀態管理：Zustand / Pinia
HTTP Client：Axios + React Query / TanStack Query
UI 框架：保留 TailwindCSS
建置工具：Vite
```

### 基礎設施
```
容器化：Docker + Docker Compose
CI/CD：GitHub Actions
部署：Nginx (反向代理) + PM2 (Node 進程管理)
```

---

## 三、資料庫 Schema 設計

### 3.1 ER 圖關係

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Staff     │────<│StoreManager │>────│   Store     │
└─────────────┘     └─────────────┘     └─────────────┘
      │                                        │
      │             ┌─────────────┐            │
      └────────────<│StoreAuthUser│>───────────┘
                    └─────────────┘
                          │
                          ▼
                    ┌─────────────┐
                    │   Report    │
                    └─────────────┘
                          ▲
                          │
┌─────────────┐     ┌─────────────┐
│ReportTemplate├────<│TemplateReport│
└─────────────┘     └─────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Group     │────<│ GroupStore  │>────│   Store     │
└─────────────┘     └─────────────┘     └─────────────┘
      │
      │             ┌─────────────┐
      └────────────<│GroupManager │
                    └─────────────┘
```

### 3.2 資料表定義 (Prisma Schema)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== 基礎資料表 ====================

// 報表分類
enum ReportCategory {
  OPERATION   // 營運
  HR          // 人資
  FINANCE     // 財務
  MARKETING   // 行銷
  MEMBER      // 會員
  SYSTEM      // 系統
}

// 門市類型
enum StoreType {
  MED         // 醫美
  SPA         // 岩盤浴
  OTHER       // 其他
}

// 人員職位
enum StaffRole {
  STORE_MANAGER     // 店長
  AREA_MANAGER      // 區經理
  SUPERVISOR        // 主管
  SENIOR_EXECUTIVE  // 高階主管
  SPECIALIST        // 專員
  OTHER             // 其他
}

// ==================== 核心資料表 ====================

// 報表定義
model Report {
  id          String         @id @default(cuid())
  code        String         @unique        // R001, R002...
  name        String                        // 報表名稱
  category    ReportCategory                // 報表分類
  description String?                       // 報表說明
  isActive    Boolean        @default(true)
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  // 關聯
  templateReports   TemplateReport[]
  storeAuthScopes   StoreAuthScope[]
  groupManagerScopes GroupManagerScope[]

  @@index([category])
  @@index([code])
}

// 人員
model Staff {
  id        String    @id @default(cuid())
  staffCode String    @unique              // S001, S002...
  name      String                         // 正式姓名
  nickname  String?                        // 暱稱
  email     String?   @unique              // 個人 Email
  role      StaffRole                      // 職位
  isActive  Boolean   @default(true)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  // 關聯
  managedStores    StoreManager[]
  authorizedStores StoreAuthUser[]
  groupManagers    GroupManager[]

  @@index([role])
  @@index([name])
}

// 門市
model Store {
  id            String    @id @default(cuid())
  code          String    @unique           // BZ_MED, ZX_GZ...
  name          String                      // 門市名稱
  type          StoreType                   // 門市類型
  roleEmail     String                      // Role Email
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // 關聯
  managers       StoreManager[]
  authorizedUsers StoreAuthUser[]
  groupStores    GroupStore[]

  @@index([type])
  @@index([code])
}

// 門市主要負責人 (店經理)
model StoreManager {
  id        String   @id @default(cuid())
  storeId   String
  staffId   String
  isPrimary Boolean  @default(true)        // 是否為主要負責人
  startDate DateTime @default(now())
  endDate   DateTime?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // 關聯
  store Store @relation(fields: [storeId], references: [id], onDelete: Cascade)
  staff Staff @relation(fields: [staffId], references: [id], onDelete: Cascade)

  @@unique([storeId, staffId, isPrimary])
  @@index([storeId])
  @@index([staffId])
}

// 門市授權人員 (細部權限)
model StoreAuthUser {
  id        String   @id @default(cuid())
  storeId   String
  staffId   String
  roleDesc  String?                        // 角色描述：多店管理、顧問等
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // 關聯
  store  Store            @relation(fields: [storeId], references: [id], onDelete: Cascade)
  staff  Staff            @relation(fields: [staffId], references: [id], onDelete: Cascade)
  scopes StoreAuthScope[]

  @@unique([storeId, staffId])
  @@index([storeId])
  @@index([staffId])
}

// 門市授權人員的報表權限
model StoreAuthScope {
  id              String @id @default(cuid())
  storeAuthUserId String
  reportId        String

  // 關聯
  storeAuthUser StoreAuthUser @relation(fields: [storeAuthUserId], references: [id], onDelete: Cascade)
  report        Report        @relation(fields: [reportId], references: [id], onDelete: Cascade)

  @@unique([storeAuthUserId, reportId])
}

// ==================== 群組管理 ====================

// 管理群組
model Group {
  id          String   @id @default(cuid())
  name        String                        // 群組名稱
  description String?                       // 群組說明
  isAllStores Boolean  @default(false)      // 是否包含所有門市
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // 關聯
  stores   GroupStore[]
  managers GroupManager[]

  @@index([name])
}

// 群組包含的門市
model GroupStore {
  id       String @id @default(cuid())
  groupId  String
  storeId  String

  // 關聯
  group Group @relation(fields: [groupId], references: [id], onDelete: Cascade)
  store Store @relation(fields: [storeId], references: [id], onDelete: Cascade)

  @@unique([groupId, storeId])
}

// 群組管理者
model GroupManager {
  id        String   @id @default(cuid())
  groupId   String
  staffId   String
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // 關聯
  group  Group               @relation(fields: [groupId], references: [id], onDelete: Cascade)
  staff  Staff               @relation(fields: [staffId], references: [id], onDelete: Cascade)
  scopes GroupManagerScope[]

  @@unique([groupId, staffId])
  @@index([groupId])
  @@index([staffId])
}

// 群組管理者的報表權限
model GroupManagerScope {
  id             String @id @default(cuid())
  groupManagerId String
  reportId       String

  // 關聯
  groupManager GroupManager @relation(fields: [groupManagerId], references: [id], onDelete: Cascade)
  report       Report       @relation(fields: [reportId], references: [id], onDelete: Cascade)

  @@unique([groupManagerId, reportId])
}

// ==================== 報表組合 ====================

// 報表組合 (Template)
model ReportTemplate {
  id          String   @id @default(cuid())
  templateCode String  @unique              // RT001, RT002...
  name        String                        // 組合名稱
  description String?                       // 適用說明
  isAllReports Boolean @default(false)      // 是否包含全部報表
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // 關聯
  reports TemplateReport[]

  @@index([name])
}

// 報表組合包含的報表
model TemplateReport {
  id         String @id @default(cuid())
  templateId String
  reportId   String

  // 關聯
  template ReportTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)
  report   Report         @relation(fields: [reportId], references: [id], onDelete: Cascade)

  @@unique([templateId, reportId])
}

// ==================== 系統/日誌 ====================

// 操作日誌
model AuditLog {
  id         String   @id @default(cuid())
  userId     String?                        // 操作者 ID
  action     String                         // 操作類型
  entityType String                         // 實體類型
  entityId   String                         // 實體 ID
  oldValue   Json?                          // 舊值
  newValue   Json?                          // 新值
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime @default(now())

  @@index([entityType, entityId])
  @@index([createdAt])
}

// AI 指令日誌
model AICommandLog {
  id          String   @id @default(cuid())
  userId      String?
  inputText   String                        // 使用者輸入
  parsedAction Json?                        // 解析後的動作
  isSuccess   Boolean                       // 是否執行成功
  errorMessage String?                      // 錯誤訊息
  executionTime Int?                        // 執行時間 (ms)
  createdAt   DateTime @default(now())

  @@index([createdAt])
}
```

---

## 四、後端 API 規範

### 4.1 API 端點總覽

| 模組 | 方法 | 端點 | 說明 |
|------|------|------|------|
| **Reports** | GET | `/api/reports` | 取得所有報表 |
| | GET | `/api/reports/:id` | 取得單一報表 |
| | POST | `/api/reports` | 新增報表 |
| | PUT | `/api/reports/:id` | 更新報表 |
| | DELETE | `/api/reports/:id` | 刪除報表 |
| **Staff** | GET | `/api/staff` | 取得所有人員 |
| | GET | `/api/staff/:id` | 取得單一人員 |
| | POST | `/api/staff` | 新增人員 |
| | PUT | `/api/staff/:id` | 更新人員 |
| | DELETE | `/api/staff/:id` | 刪除人員 |
| **Stores** | GET | `/api/stores` | 取得所有門市 |
| | GET | `/api/stores/:id` | 取得單一門市 (含負責人) |
| | POST | `/api/stores` | 新增門市 |
| | PUT | `/api/stores/:id` | 更新門市 |
| | DELETE | `/api/stores/:id` | 刪除門市 |
| | PUT | `/api/stores/:id/manager` | 指派/更換店經理 |
| | POST | `/api/stores/:id/auth-users` | 新增授權人員 |
| | DELETE | `/api/stores/:id/auth-users/:authUserId` | 移除授權人員 |
| **Groups** | GET | `/api/groups` | 取得所有群組 |
| | GET | `/api/groups/:id` | 取得單一群組 |
| | POST | `/api/groups` | 新增群組 |
| | PUT | `/api/groups/:id` | 更新群組 |
| | DELETE | `/api/groups/:id` | 刪除群組 |
| | POST | `/api/groups/:id/managers` | 新增群組管理者 |
| | DELETE | `/api/groups/:id/managers/:managerId` | 移除群組管理者 |
| **Templates** | GET | `/api/templates` | 取得所有報表組合 |
| | GET | `/api/templates/:id` | 取得單一報表組合 |
| | POST | `/api/templates` | 新增報表組合 |
| | PUT | `/api/templates/:id` | 更新報表組合 |
| | DELETE | `/api/templates/:id` | 刪除報表組合 |
| **AI** | POST | `/api/ai/command` | AI 自然語言指令 |
| **Dashboard** | GET | `/api/dashboard/stats` | 儀表板統計資料 |

### 4.2 API 請求/回應格式

#### 統一回應格式
```typescript
// 成功回應
interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

// 錯誤回應
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
```

#### 範例：取得門市列表
```http
GET /api/stores?type=MED&search=板橋&page=1&limit=20

Response:
{
  "success": true,
  "data": [
    {
      "id": "clx123...",
      "code": "BZ_MED",
      "name": "板橋光澤醫美",
      "type": "MED",
      "roleEmail": "dr.shine.manager1@gmail.com",
      "isActive": true,
      "primaryManager": {
        "id": "clx456...",
        "name": "吳佳蓉",
        "nickname": "Tina",
        "role": "AREA_MANAGER"
      },
      "authorizedUsers": [
        {
          "id": "clx789...",
          "staff": { "name": "洪綵霙", "role": "STORE_MANAGER" },
          "roleDesc": "店長",
          "scopes": ["R001", "R006"]
        }
      ]
    }
  ],
  "meta": { "total": 32, "page": 1, "limit": 20 }
}
```

#### 範例：新增門市
```http
POST /api/stores
Content-Type: application/json

{
  "code": "QP_MED",
  "name": "青埔醫美",
  "type": "MED",
  "roleEmail": "qp_med.manager@company.com"
}

Response:
{
  "success": true,
  "data": {
    "id": "clxnew...",
    "code": "QP_MED",
    "name": "青埔醫美",
    "type": "MED",
    "roleEmail": "qp_med.manager@company.com",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "message": "門市建立成功"
}
```

### 4.3 後端目錄結構

```
backend/
├── prisma/
│   ├── schema.prisma          # 資料庫模型定義
│   ├── seed.ts                # 初始資料種子
│   └── migrations/            # 資料庫遷移記錄
├── src/
│   ├── app.ts                 # Express 應用程式入口
│   ├── server.ts              # 伺服器啟動
│   ├── config/
│   │   ├── database.ts        # 資料庫配置
│   │   ├── redis.ts           # Redis 配置
│   │   └── env.ts             # 環境變數
│   ├── middleware/
│   │   ├── auth.ts            # JWT 認證
│   │   ├── errorHandler.ts    # 全域錯誤處理
│   │   ├── validator.ts       # 請求驗證
│   │   └── logger.ts          # 請求日誌
│   ├── modules/
│   │   ├── reports/
│   │   │   ├── report.controller.ts
│   │   │   ├── report.service.ts
│   │   │   ├── report.repository.ts
│   │   │   ├── report.dto.ts
│   │   │   └── report.routes.ts
│   │   ├── staff/
│   │   │   ├── staff.controller.ts
│   │   │   ├── staff.service.ts
│   │   │   ├── staff.repository.ts
│   │   │   ├── staff.dto.ts
│   │   │   └── staff.routes.ts
│   │   ├── stores/
│   │   │   ├── store.controller.ts
│   │   │   ├── store.service.ts
│   │   │   ├── store.repository.ts
│   │   │   ├── store.dto.ts
│   │   │   └── store.routes.ts
│   │   ├── groups/
│   │   │   └── ...
│   │   ├── templates/
│   │   │   └── ...
│   │   └── ai/
│   │       ├── ai.controller.ts
│   │       ├── ai.service.ts
│   │       └── ai.routes.ts
│   ├── shared/
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── response.ts    # 統一回應工具
│   │   │   └── pagination.ts  # 分頁工具
│   │   └── constants/
│   │       └── index.ts
│   └── integrations/
│       ├── google-drive/      # Google Drive 同步
│       │   └── drive.service.ts
│       └── gemini/            # Gemini AI
│           └── gemini.service.ts
├── tests/
│   ├── unit/
│   └── integration/
├── .env.example
├── package.json
├── tsconfig.json
└── Dockerfile
```

---

## 五、前端重構指南

### 5.1 前端目錄結構

```
frontend/
├── public/
├── src/
│   ├── main.tsx               # 應用入口
│   ├── App.tsx                # 根組件
│   ├── api/
│   │   ├── client.ts          # Axios 實例配置
│   │   ├── reports.ts         # 報表 API
│   │   ├── staff.ts           # 人員 API
│   │   ├── stores.ts          # 門市 API
│   │   ├── groups.ts          # 群組 API
│   │   ├── templates.ts       # 報表組合 API
│   │   └── ai.ts              # AI API
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── SearchInput.tsx
│   │   │   └── FilterTabs.tsx
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── PageContainer.tsx
│   │   ├── reports/
│   │   │   ├── ReportCheckboxGrid.tsx
│   │   │   ├── ReportBadge.tsx
│   │   │   └── TemplateSelect.tsx
│   │   ├── stores/
│   │   │   ├── StoreTable.tsx
│   │   │   ├── StoreRow.tsx
│   │   │   ├── StoreFilterBar.tsx
│   │   │   └── StoreModal.tsx
│   │   ├── staff/
│   │   │   └── ...
│   │   ├── groups/
│   │   │   └── ...
│   │   └── ai/
│   │       └── AICommandModal.tsx
│   ├── hooks/
│   │   ├── useReports.ts      # React Query hooks
│   │   ├── useStaff.ts
│   │   ├── useStores.ts
│   │   ├── useGroups.ts
│   │   ├── useTemplates.ts
│   │   └── useToast.ts
│   ├── store/
│   │   ├── index.ts           # Zustand store
│   │   ├── uiSlice.ts         # UI 狀態
│   │   └── filterSlice.ts     # 篩選狀態
│   ├── pages/
│   │   ├── StoresPage.tsx
│   │   ├── GroupsPage.tsx
│   │   ├── TemplatesPage.tsx
│   │   └── StaffPage.tsx
│   ├── types/
│   │   ├── api.types.ts
│   │   ├── store.types.ts
│   │   ├── staff.types.ts
│   │   ├── report.types.ts
│   │   └── group.types.ts
│   ├── utils/
│   │   ├── constants.ts
│   │   ├── formatters.ts
│   │   └── validators.ts
│   └── styles/
│       └── globals.css
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

### 5.2 TypeScript 型別定義

```typescript
// src/types/store.types.ts

export enum StoreType {
  MED = 'MED',
  SPA = 'SPA',
  OTHER = 'OTHER'
}

export interface Staff {
  id: string;
  staffCode: string;
  name: string;
  nickname?: string;
  email?: string;
  role: StaffRole;
  isActive: boolean;
}

export interface Store {
  id: string;
  code: string;
  name: string;
  type: StoreType;
  roleEmail: string;
  isActive: boolean;
  primaryManager?: StoreManager;
  authorizedUsers: StoreAuthUser[];
}

export interface StoreManager {
  id: string;
  staff: Staff;
  isPrimary: boolean;
  startDate: string;
}

export interface StoreAuthUser {
  id: string;
  staff: Staff;
  roleDesc?: string;
  scopes: string[];  // Report codes
}

// API Request/Response types
export interface CreateStoreRequest {
  code: string;
  name: string;
  type: StoreType;
  roleEmail: string;
}

export interface UpdateStoreRequest {
  name?: string;
  roleEmail?: string;
  isActive?: boolean;
}

export interface AssignManagerRequest {
  staffId: string;
  isPrimary: boolean;
}

export interface AddAuthUserRequest {
  staffId: string;
  roleDesc?: string;
  reportCodes: string[];
}
```

### 5.3 API Client 範例

```typescript
// src/api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error?.message || '發生錯誤';
    // Handle error globally
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
```

```typescript
// src/api/stores.ts
import apiClient from './client';
import type {
  Store,
  CreateStoreRequest,
  UpdateStoreRequest,
  AssignManagerRequest,
  AddAuthUserRequest
} from '@/types/store.types';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';

export const storesApi = {
  // 取得所有門市
  getAll: (params?: { type?: string; search?: string; page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<Store>>('/stores', { params }),

  // 取得單一門市
  getById: (id: string) =>
    apiClient.get<ApiResponse<Store>>(`/stores/${id}`),

  // 新增門市
  create: (data: CreateStoreRequest) =>
    apiClient.post<ApiResponse<Store>>('/stores', data),

  // 更新門市
  update: (id: string, data: UpdateStoreRequest) =>
    apiClient.put<ApiResponse<Store>>(`/stores/${id}`, data),

  // 刪除門市
  delete: (id: string) =>
    apiClient.delete<ApiResponse<void>>(`/stores/${id}`),

  // 指派店經理
  assignManager: (storeId: string, data: AssignManagerRequest) =>
    apiClient.put<ApiResponse<Store>>(`/stores/${storeId}/manager`, data),

  // 新增授權人員
  addAuthUser: (storeId: string, data: AddAuthUserRequest) =>
    apiClient.post<ApiResponse<Store>>(`/stores/${storeId}/auth-users`, data),

  // 移除授權人員
  removeAuthUser: (storeId: string, authUserId: string) =>
    apiClient.delete<ApiResponse<void>>(`/stores/${storeId}/auth-users/${authUserId}`),
};
```

### 5.4 React Query Hooks 範例

```typescript
// src/hooks/useStores.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storesApi } from '@/api/stores';
import type { CreateStoreRequest, UpdateStoreRequest } from '@/types/store.types';

const QUERY_KEY = 'stores';

export function useStores(params?: { type?: string; search?: string }) {
  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => storesApi.getAll(params),
  });
}

export function useStore(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => storesApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStoreRequest) => storesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useUpdateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStoreRequest }) =>
      storesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useAssignManager() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storeId, data }: { storeId: string; data: { staffId: string; isPrimary: boolean } }) =>
      storesApi.assignManager(storeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}
```

---

## 六、資料遷移計畫

### 6.1 從靜態資料遷移到資料庫

```typescript
// prisma/seed.ts

import { PrismaClient, ReportCategory, StoreType, StaffRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. 種子報表資料
  const reports = [
    { code: 'R001', name: '護理部消耗報表', category: 'OPERATION' as ReportCategory },
    { code: 'R006', name: '進銷貨明細', category: 'OPERATION' as ReportCategory },
    // ... 其他報表
  ];

  for (const report of reports) {
    await prisma.report.upsert({
      where: { code: report.code },
      update: {},
      create: report,
    });
  }

  // 2. 種子人員資料
  const staffMembers = [
    { staffCode: 'S001', name: '吳佳蓉', nickname: 'Tina', role: 'AREA_MANAGER' as StaffRole },
    { staffCode: 'S002', name: '謝嫚珈', nickname: null, role: 'AREA_MANAGER' as StaffRole },
    // ... 其他人員
  ];

  for (const staff of staffMembers) {
    await prisma.staff.upsert({
      where: { staffCode: staff.staffCode },
      update: {},
      create: staff,
    });
  }

  // 3. 種子門市資料
  const stores = [
    { code: 'BZ_MED', name: '板橋光澤醫美', type: 'MED' as StoreType, roleEmail: 'dr.shine.manager1@gmail.com' },
    // ... 其他門市
  ];

  for (const store of stores) {
    await prisma.store.upsert({
      where: { code: store.code },
      update: {},
      create: store,
    });
  }

  // 4. 建立門市與負責人關聯
  // ...

  console.log('Seed data inserted successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## 七、環境配置

### 7.1 環境變數

```env
# .env.example

# 資料庫
DATABASE_URL="postgresql://user:password@localhost:5432/nreport?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-key"
JWT_EXPIRES_IN="7d"

# API
API_PORT=3000
API_PREFIX="/api"

# Gemini AI
GEMINI_API_KEY="your-gemini-api-key"

# Google Drive (可選)
GOOGLE_DRIVE_ENABLED=false
GOOGLE_SERVICE_ACCOUNT_KEY=""

# 環境
NODE_ENV="development"
```

### 7.2 Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: nreport
      POSTGRES_PASSWORD: nreport_password
      POSTGRES_DB: nreport
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://nreport:nreport_password@postgres:5432/nreport
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "5173:80"
    depends_on:
      - backend

volumes:
  postgres_data:
  redis_data:
```

---

## 八、開發階段建議

### Phase 1: 基礎建設 (1-2 週)
- [x] 專案初始化 (前後端)
- [ ] 資料庫 Schema 建立
- [ ] 基礎 CRUD API 實作
- [ ] 前端 API Client 整合

### Phase 2: 核心功能 (2-3 週)
- [ ] 門市管理完整功能
- [ ] 人員管理完整功能
- [ ] 群組管理完整功能
- [ ] 報表組合管理完整功能

### Phase 3: 進階功能 (1-2 週)
- [ ] AI 指令功能整合
- [ ] 操作日誌記錄
- [ ] 搜尋與篩選優化

### Phase 4: 部署與優化 (1 週)
- [ ] Docker 容器化
- [ ] CI/CD 配置
- [ ] 效能優化
- [ ] 安全性檢查

---

## 九、安全性考量

1. **API 認證**: 實作 JWT Token 機制
2. **輸入驗證**: 使用 Zod 或 Joi 驗證所有輸入
3. **SQL Injection**: Prisma ORM 已內建防護
4. **XSS**: React 預設已轉義 HTML
5. **CORS**: 配置正確的跨域策略
6. **Rate Limiting**: 限制 API 請求頻率
7. **環境變數**: 敏感資訊不進版控

---

## 十、總結

此架構將現有的靜態前端應用轉換為：
- **可擴展**: 模組化設計，易於新增功能
- **可維護**: 清晰的分層架構
- **可測試**: 獨立的業務邏輯層
- **高效能**: Redis 快取 + 資料庫索引
- **安全性**: 完整的認證與授權機制

現有 index.html 中的所有功能（門市管理、群組管理、報表組合、人員管理、AI 助手）都可以無縫遷移到新架構。
