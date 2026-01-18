import { Router } from 'express';
import prisma from '../../config/database';
import { sendSuccess, sendCreated, sendNoContent, getPagination, buildMeta } from '../../shared/utils/response';
import { z } from 'zod';
import { StaffRole } from '@prisma/client';

const router = Router();

// DTO Schemas
const createStaffSchema = z.object({
  name: z.string().min(2).max(50),
  nickname: z.string().max(20).optional(),
  email: z.string().email().optional(),
  role: z.nativeEnum(StaffRole),
});

const updateStaffSchema = createStaffSchema.partial();

/**
 * @route   GET /api/staff
 * @desc    取得所有人員
 */
router.get('/', async (req, res, next) => {
  try {
    const { search, role, page, limit } = req.query;
    const pagination = getPagination({ page: Number(page), limit: Number(limit) });

    const where = {
      isActive: true,
      ...(role && { role: role as StaffRole }),
      ...(search && {
        OR: [
          { name: { contains: search as string, mode: 'insensitive' as const } },
          { nickname: { contains: search as string, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [staff, total] = await Promise.all([
      prisma.staff.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { name: 'asc' },
      }),
      prisma.staff.count({ where }),
    ]);

    return sendSuccess(res, {
      data: staff,
      meta: buildMeta(total, pagination.page, pagination.limit),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/staff/:id
 * @desc    取得單一人員
 */
router.get('/:id', async (req, res, next) => {
  try {
    const staff = await prisma.staff.findUnique({
      where: { id: req.params.id },
      include: {
        managedStores: { include: { store: true } },
        authorizedStores: { include: { store: true, scopes: { include: { report: true } } } },
        groupManagers: { include: { group: true } },
      },
    });

    return sendSuccess(res, { data: staff });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/staff
 * @desc    新增人員
 */
router.post('/', async (req, res, next) => {
  try {
    const data = createStaffSchema.parse(req.body);

    // 產生 staffCode
    const lastStaff = await prisma.staff.findFirst({
      orderBy: { staffCode: 'desc' },
    });
    const nextNum = lastStaff
      ? parseInt(lastStaff.staffCode.replace('S', '')) + 1
      : 1;
    const staffCode = `S${String(nextNum).padStart(3, '0')}`;

    const staff = await prisma.staff.create({
      data: { ...data, staffCode },
    });

    return sendCreated(res, staff, '人員新增成功');
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/staff/:id
 * @desc    更新人員
 */
router.put('/:id', async (req, res, next) => {
  try {
    const data = updateStaffSchema.parse(req.body);
    const staff = await prisma.staff.update({
      where: { id: req.params.id },
      data,
    });

    return sendSuccess(res, { data: staff, message: '人員更新成功' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/staff/:id
 * @desc    刪除人員 (軟刪除)
 */
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.staff.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    return sendNoContent(res);
  } catch (error) {
    next(error);
  }
});

export default router;
