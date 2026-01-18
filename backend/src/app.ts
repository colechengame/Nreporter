import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';

// 路由引入
import reportRoutes from './modules/reports/report.routes';
import staffRoutes from './modules/staff/staff.routes';
import storeRoutes from './modules/stores/store.routes';
import groupRoutes from './modules/groups/group.routes';
import templateRoutes from './modules/templates/template.routes';
import aiRoutes from './modules/ai/ai.routes';

const app = express();

// ==================== 基礎中間件 ====================

// 安全性
app.use(helmet());

// CORS
app.use(cors({
  origin: env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 請求限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  max: 100, // 每個 IP 最多 100 次請求
  message: { success: false, error: { code: 'RATE_LIMIT', message: '請求過於頻繁，請稍後再試' } },
});
app.use('/api', limiter);

// 解析 JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 請求日誌
app.use(requestLogger);

// ==================== API 路由 ====================

const API_PREFIX = env.API_PREFIX || '/api';

app.use(`${API_PREFIX}/reports`, reportRoutes);
app.use(`${API_PREFIX}/staff`, staffRoutes);
app.use(`${API_PREFIX}/stores`, storeRoutes);
app.use(`${API_PREFIX}/groups`, groupRoutes);
app.use(`${API_PREFIX}/templates`, templateRoutes);
app.use(`${API_PREFIX}/ai`, aiRoutes);

// 健康檢查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API 根路徑
app.get(API_PREFIX, (req, res) => {
  res.json({
    name: 'N-Report API',
    version: '1.0.0',
    endpoints: {
      reports: `${API_PREFIX}/reports`,
      staff: `${API_PREFIX}/staff`,
      stores: `${API_PREFIX}/stores`,
      groups: `${API_PREFIX}/groups`,
      templates: `${API_PREFIX}/templates`,
      ai: `${API_PREFIX}/ai`,
    },
  });
});

// ==================== 錯誤處理 ====================

// 404 處理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.url} not found`,
    },
  });
});

// 全域錯誤處理
app.use(errorHandler);

export default app;
