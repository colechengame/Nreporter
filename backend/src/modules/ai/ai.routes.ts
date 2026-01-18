import { Router } from 'express';
import prisma from '../../config/database';
import { sendSuccess } from '../../shared/utils/response';
import { AppError } from '../../middleware/errorHandler';
import { env } from '../../config/env';
import { z } from 'zod';

const router = Router();

// DTO Schemas
const aiCommandSchema = z.object({
  command: z.string().min(5).max(500),
});

// 動作類型
interface AIAction {
  type: 'ASSIGN_PRIMARY' | 'ADD_GRANULAR' | 'CREATE_STORE' | 'UPDATE_STORE_EMAIL';
  storeName?: string;
  managerName?: string;
  userName?: string;
  role?: string;
  scopes?: string[];
  name?: string;
  code?: string;
  newEmail?: string;
}

/**
 * @route   POST /api/ai/command
 * @desc    執行 AI 自然語言指令
 */
router.post('/command', async (req, res, next) => {
  try {
    const startTime = Date.now();
    const { command } = aiCommandSchema.parse(req.body);

    if (!env.GEMINI_API_KEY) {
      throw new AppError('AI 服務未配置', 503, 'AI_NOT_CONFIGURED');
    }

    // 取得所有門市名稱作為上下文
    const stores = await prisma.store.findMany({
      where: { isActive: true },
      select: { name: true, code: true },
    });
    const storeNames = stores.map((s) => s.name).join(', ');

    // 建立 Gemini 請求
    const context = `
      Current Stores: ${storeNames}
      User Command: ${command}

      You are an AI assistant for a permission system. Parse the user's natural language command into a JSON action.
      Output JSON format ONLY. No markdown, no explanation.

      Action Types:
      1. ASSIGN_PRIMARY: { "type": "ASSIGN_PRIMARY", "storeName": "Target Store Name", "managerName": "Name" }
      2. ADD_GRANULAR: { "type": "ADD_GRANULAR", "storeName": "Target Store Name", "userName": "Name", "role": "Title", "scopes": ["R001", "R002"] }
      3. CREATE_STORE: { "type": "CREATE_STORE", "name": "Store Name", "code": "CODE" }
      4. UPDATE_STORE_EMAIL: { "type": "UPDATE_STORE_EMAIL", "storeName": "Target Store Name", "newEmail": "email@address" }

      If store name is fuzzy, try to match closest from Current Stores list.
      If unsure about the action type, return: { "type": "UNKNOWN", "reason": "explanation" }
    `;

    // 呼叫 Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: context }] }],
        }),
      }
    );

    if (!response.ok) {
      throw new AppError('AI 服務請求失敗', 502, 'AI_REQUEST_FAILED');
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new AppError('AI 無法解析指令', 400, 'AI_PARSE_FAILED');
    }

    // 解析 JSON
    const jsonStr = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const action: AIAction = JSON.parse(jsonStr);

    let successMsg = '';
    let resultData: unknown = null;

    // 執行動作
    switch (action.type) {
      case 'ASSIGN_PRIMARY': {
        const store = stores.find(
          (s) => s.name.includes(action.storeName!) || action.storeName!.includes(s.name)
        );
        if (!store) {
          throw new AppError(`找不到門市：${action.storeName}`, 404, 'STORE_NOT_FOUND');
        }

        // 查找人員
        const staff = await prisma.staff.findFirst({
          where: {
            OR: [
              { name: { contains: action.managerName!, mode: 'insensitive' } },
              { nickname: { contains: action.managerName!, mode: 'insensitive' } },
            ],
          },
        });

        if (!staff) {
          throw new AppError(`找不到人員：${action.managerName}`, 404, 'STAFF_NOT_FOUND');
        }

        // 取得門市完整資訊
        const fullStore = await prisma.store.findFirst({
          where: { name: store.name },
        });

        if (fullStore) {
          // 更新門市經理
          await prisma.$transaction(async (tx) => {
            // 將現有主要經理設為非主要
            await tx.storeManager.updateMany({
              where: { storeId: fullStore.id, isPrimary: true, isActive: true },
              data: { isPrimary: false, endDate: new Date() },
            });

            // 新增主要經理
            await tx.storeManager.create({
              data: {
                storeId: fullStore.id,
                staffId: staff.id,
                isPrimary: true,
              },
            });
          });

          successMsg = `已成功將 ${store.name} 的主要店長變更為 ${action.managerName}`;
          resultData = { store: store.name, manager: action.managerName };
        }
        break;
      }

      case 'UPDATE_STORE_EMAIL': {
        const store = stores.find(
          (s) => s.name.includes(action.storeName!) || action.storeName!.includes(s.name)
        );
        if (!store) {
          throw new AppError(`找不到門市：${action.storeName}`, 404, 'STORE_NOT_FOUND');
        }

        await prisma.store.updateMany({
          where: { name: store.name },
          data: { roleEmail: action.newEmail },
        });

        successMsg = `已更新 ${store.name} 的 Role Email 為 ${action.newEmail}`;
        resultData = { store: store.name, email: action.newEmail };
        break;
      }

      case 'CREATE_STORE': {
        const newStore = await prisma.store.create({
          data: {
            code: action.code || 'NEW',
            name: action.name!,
            type: 'OTHER',
            roleEmail: `${(action.code || 'new').toLowerCase()}.manager@company.com`,
          },
        });

        successMsg = `已建立新門市：${action.name}`;
        resultData = newStore;
        break;
      }

      default:
        throw new AppError('無法辨識指令，請試著說得更清楚一點。', 400, 'UNKNOWN_ACTION');
    }

    const executionTime = Date.now() - startTime;

    // 記錄 AI 指令日誌
    await prisma.aICommandLog.create({
      data: {
        inputText: command,
        parsedAction: action,
        isSuccess: true,
        executionTime,
      },
    });

    return sendSuccess(res, {
      data: {
        action,
        result: resultData,
      },
      message: successMsg,
    });
  } catch (error: any) {
    // 記錄失敗日誌
    try {
      await prisma.aICommandLog.create({
        data: {
          inputText: req.body.command || '',
          parsedAction: null,
          isSuccess: false,
          errorMessage: error.message,
        },
      });
    } catch {}

    next(error);
  }
});

export default router;
