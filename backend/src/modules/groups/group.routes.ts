import { Router } from 'express';
import prisma from '../../config/database';
import { sendSuccess, sendCreated, sendNoContent, getPagination, buildMeta } from '../../shared/utils/response';
import { z } from 'zod';

const router = Router();

// DTO Schemas
const createGroupSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  isAllStores: z.boolean().default(false),
  storeIds: z.array(z.string()).optional(),
});

const addManagerSchema = z.object({
  staffId: z.string().cuid(),
  reportCodes: z.array(z.string()).min(1),
});

/**
 * @route   GET /api/groups
 * @desc    取得所有群組
 */
router.get('/', async (req, res, next) => {
  try {
    const { search, page, limit } = req.query;
    const pagination = getPagination({ page: Number(page), limit: Number(limit) });

    const where = {
      isActive: true,
      ...(search && {
        name: { contains: search as string, mode: 'insensitive' as const },
      }),
    };

    const [groups, total] = await Promise.all([
      prisma.group.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { name: 'asc' },
        include: {
          stores: { include: { store: true } },
          managers: {
            include: {
              staff: true,
              scopes: { include: { report: true } },
            },
          },
        },
      }),
      prisma.group.count({ where }),
    ]);

    return sendSuccess(res, {
      data: groups,
      meta: buildMeta(total, pagination.page, pagination.limit),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/groups/:id
 * @desc    取得單一群組
 */
router.get('/:id', async (req, res, next) => {
  try {
    const group = await prisma.group.findUnique({
      where: { id: req.params.id },
      include: {
        stores: { include: { store: true } },
        managers: {
          include: {
            staff: true,
            scopes: { include: { report: true } },
          },
        },
      },
    });

    return sendSuccess(res, { data: group });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/groups
 * @desc    新增群組
 */
router.post('/', async (req, res, next) => {
  try {
    const { name, description, isAllStores, storeIds } = createGroupSchema.parse(req.body);

    const group = await prisma.group.create({
      data: {
        name,
        description,
        isAllStores,
        ...(storeIds && !isAllStores && {
          stores: {
            create: storeIds.map((storeId) => ({ storeId })),
          },
        }),
      },
      include: { stores: { include: { store: true } } },
    });

    return sendCreated(res, group, '群組建立成功');
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/groups/:id
 * @desc    更新群組
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { name, description, isAllStores, storeIds } = createGroupSchema.partial().parse(req.body);

    // 使用交易更新
    const group = await prisma.$transaction(async (tx) => {
      // 更新群組基本資訊
      const updated = await tx.group.update({
        where: { id: req.params.id },
        data: { name, description, isAllStores },
      });

      // 如果有更新門市列表
      if (storeIds !== undefined && !isAllStores) {
        // 刪除現有關聯
        await tx.groupStore.deleteMany({ where: { groupId: req.params.id } });
        // 建立新關聯
        await tx.groupStore.createMany({
          data: storeIds.map((storeId) => ({ groupId: req.params.id, storeId })),
        });
      }

      return tx.group.findUnique({
        where: { id: req.params.id },
        include: { stores: { include: { store: true } } },
      });
    });

    return sendSuccess(res, { data: group, message: '群組更新成功' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/groups/:id
 * @desc    刪除群組
 */
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.group.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    return sendNoContent(res);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/groups/:id/managers
 * @desc    新增群組管理者
 */
router.post('/:id/managers', async (req, res, next) => {
  try {
    const { staffId, reportCodes } = addManagerSchema.parse(req.body);

    // 取得報表 IDs
    const reports = await prisma.report.findMany({
      where: { code: { in: reportCodes } },
    });

    const manager = await prisma.groupManager.create({
      data: {
        groupId: req.params.id,
        staffId,
        scopes: {
          create: reports.map((r) => ({ reportId: r.id })),
        },
      },
      include: {
        staff: true,
        scopes: { include: { report: true } },
      },
    });

    return sendCreated(res, manager, '管理者新增成功');
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/groups/:id/managers/:managerId
 * @desc    移除群組管理者
 */
router.delete('/:id/managers/:managerId', async (req, res, next) => {
  try {
    await prisma.groupManager.update({
      where: { id: req.params.managerId },
      data: { isActive: false },
    });

    return sendNoContent(res);
  } catch (error) {
    next(error);
  }
});

export default router;
