import { Router } from 'express';
import prisma from '../../config/database';
import { sendSuccess } from '../../shared/utils/response';

const router = Router();

/**
 * @route   GET /api/reports
 * @desc    取得所有報表
 */
router.get('/', async (req, res, next) => {
  try {
    const reports = await prisma.report.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { code: 'asc' }],
    });

    return sendSuccess(res, { data: reports });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/reports/:id
 * @desc    取得單一報表
 */
router.get('/:id', async (req, res, next) => {
  try {
    const report = await prisma.report.findUnique({
      where: { id: req.params.id },
    });

    return sendSuccess(res, { data: report });
  } catch (error) {
    next(error);
  }
});

// TODO: 實作完整的 CRUD 操作

export default router;
