import { Router } from 'express';
import * as storeController from './store.controller';

const router = Router();

/**
 * @route   GET /api/stores
 * @desc    取得所有門市 (支援篩選、搜尋、分頁)
 * @query   type, search, isActive, page, limit
 */
router.get('/', storeController.getAll);

/**
 * @route   GET /api/stores/:id
 * @desc    取得單一門市詳情
 */
router.get('/:id', storeController.getById);

/**
 * @route   POST /api/stores
 * @desc    新增門市
 * @body    { code, name, type, roleEmail }
 */
router.post('/', storeController.create);

/**
 * @route   PUT /api/stores/:id
 * @desc    更新門市
 * @body    { name?, roleEmail?, isActive? }
 */
router.put('/:id', storeController.update);

/**
 * @route   DELETE /api/stores/:id
 * @desc    刪除門市
 */
router.delete('/:id', storeController.remove);

/**
 * @route   PUT /api/stores/:id/manager
 * @desc    指派/更換店經理
 * @body    { staffId, isPrimary }
 */
router.put('/:id/manager', storeController.assignManager);

/**
 * @route   POST /api/stores/:id/auth-users
 * @desc    新增授權人員
 * @body    { staffId, roleDesc?, reportCodes[] }
 */
router.post('/:id/auth-users', storeController.addAuthUser);

/**
 * @route   DELETE /api/stores/:id/auth-users/:authUserId
 * @desc    移除授權人員
 */
router.delete('/:id/auth-users/:authUserId', storeController.removeAuthUser);

export default router;
