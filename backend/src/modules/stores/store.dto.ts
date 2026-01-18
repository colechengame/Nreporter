import { z } from 'zod';
import { StoreType } from '@prisma/client';

// ==================== 查詢參數 ====================

export const storeQuerySchema = z.object({
  type: z.nativeEnum(StoreType).optional(),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export type StoreQuery = z.infer<typeof storeQuerySchema>;

// ==================== 新增門市 ====================

export const createStoreSchema = z.object({
  code: z.string().min(2).max(20).regex(/^[A-Z0-9_]+$/, '代碼只能包含大寫字母、數字和底線'),
  name: z.string().min(2).max(100),
  type: z.nativeEnum(StoreType),
  roleEmail: z.string().email('請輸入有效的 Email'),
});

export type CreateStoreDTO = z.infer<typeof createStoreSchema>;

// ==================== 更新門市 ====================

export const updateStoreSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  roleEmail: z.string().email('請輸入有效的 Email').optional(),
  isActive: z.boolean().optional(),
});

export type UpdateStoreDTO = z.infer<typeof updateStoreSchema>;

// ==================== 指派店經理 ====================

export const assignManagerSchema = z.object({
  staffId: z.string().cuid(),
  isPrimary: z.boolean().default(true),
});

export type AssignManagerDTO = z.infer<typeof assignManagerSchema>;

// ==================== 新增授權人員 ====================

export const addAuthUserSchema = z.object({
  staffId: z.string().cuid(),
  roleDesc: z.string().max(50).optional(),
  reportCodes: z.array(z.string()).min(1, '至少需要選擇一個報表'),
});

export type AddAuthUserDTO = z.infer<typeof addAuthUserSchema>;
