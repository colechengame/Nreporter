import { Request, Response, NextFunction } from 'express';
import * as storeService from './store.service';
import {
  storeQuerySchema,
  createStoreSchema,
  updateStoreSchema,
  assignManagerSchema,
  addAuthUserSchema,
} from './store.dto';
import { sendSuccess, sendCreated, sendNoContent, buildMeta } from '../../shared/utils/response';

// ==================== 取得所有門市 ====================

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = storeQuerySchema.parse(req.query);
    const { stores, total, page, limit } = await storeService.findAllStores(query);

    return sendSuccess(res, {
      data: stores,
      meta: buildMeta(total, page, limit),
    });
  } catch (error) {
    next(error);
  }
};

// ==================== 取得單一門市 ====================

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const store = await storeService.findStoreById(id);

    return sendSuccess(res, { data: store });
  } catch (error) {
    next(error);
  }
};

// ==================== 新增門市 ====================

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createStoreSchema.parse(req.body);
    const store = await storeService.createStore(data);

    return sendCreated(res, store, '門市建立成功');
  } catch (error) {
    next(error);
  }
};

// ==================== 更新門市 ====================

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = updateStoreSchema.parse(req.body);
    const store = await storeService.updateStore(id, data);

    return sendSuccess(res, { data: store, message: '門市更新成功' });
  } catch (error) {
    next(error);
  }
};

// ==================== 刪除門市 ====================

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await storeService.deleteStore(id);

    return sendNoContent(res);
  } catch (error) {
    next(error);
  }
};

// ==================== 指派店經理 ====================

export const assignManager = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = assignManagerSchema.parse(req.body);
    const result = await storeService.assignManager(id, data);

    return sendSuccess(res, { data: result, message: '店經理指派成功' });
  } catch (error) {
    next(error);
  }
};

// ==================== 新增授權人員 ====================

export const addAuthUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = addAuthUserSchema.parse(req.body);
    const result = await storeService.addAuthUser(id, data);

    return sendCreated(res, result, '授權人員新增成功');
  } catch (error) {
    next(error);
  }
};

// ==================== 移除授權人員 ====================

export const removeAuthUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, authUserId } = req.params;
    await storeService.removeAuthUser(id, authUserId);

    return sendNoContent(res);
  } catch (error) {
    next(error);
  }
};
