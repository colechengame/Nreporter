import { Router } from 'express';
import prisma from '../../config/database';
import { sendSuccess, sendCreated, sendNoContent, getPagination, buildMeta } from '../../shared/utils/response';
import { z } from 'zod';

const router = Router();

// DTO Schemas
const createTemplateSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  isAllReports: z.boolean().default(false),
  reportCodes: z.array(z.string()).optional(),
});

/**
 * @route   GET /api/templates
 * @desc    取得所有報表組合
 */
router.get('/', async (req, res, next) => {
  try {
    const { search, page, limit } = req.query;
    const pagination = getPagination({ page: Number(page), limit: Number(limit) });

    const where = {
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search as string, mode: 'insensitive' as const } },
          { description: { contains: search as string, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [templates, total] = await Promise.all([
      prisma.reportTemplate.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { name: 'asc' },
        include: {
          reports: { include: { report: true } },
        },
      }),
      prisma.reportTemplate.count({ where }),
    ]);

    // 格式化回應
    const formattedTemplates = templates.map((t) => ({
      id: t.id,
      templateCode: t.templateCode,
      name: t.name,
      description: t.description,
      isAllReports: t.isAllReports,
      reports: t.reports.map((r) => r.report.code),
      reportCount: t.isAllReports ? '全部' : t.reports.length,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    return sendSuccess(res, {
      data: formattedTemplates,
      meta: buildMeta(total, pagination.page, pagination.limit),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/templates/:id
 * @desc    取得單一報表組合
 */
router.get('/:id', async (req, res, next) => {
  try {
    const template = await prisma.reportTemplate.findUnique({
      where: { id: req.params.id },
      include: {
        reports: { include: { report: true } },
      },
    });

    return sendSuccess(res, { data: template });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/templates
 * @desc    新增報表組合
 */
router.post('/', async (req, res, next) => {
  try {
    const { name, description, isAllReports, reportCodes } = createTemplateSchema.parse(req.body);

    // 產生 templateCode
    const lastTemplate = await prisma.reportTemplate.findFirst({
      orderBy: { templateCode: 'desc' },
    });
    const nextNum = lastTemplate
      ? parseInt(lastTemplate.templateCode.replace('RT', '')) + 1
      : 1;
    const templateCode = `RT${String(nextNum).padStart(3, '0')}`;

    // 取得報表 IDs
    let reportIds: string[] = [];
    if (!isAllReports && reportCodes) {
      const reports = await prisma.report.findMany({
        where: { code: { in: reportCodes } },
      });
      reportIds = reports.map((r) => r.id);
    }

    const template = await prisma.reportTemplate.create({
      data: {
        templateCode,
        name,
        description,
        isAllReports,
        ...(reportIds.length > 0 && {
          reports: {
            create: reportIds.map((reportId) => ({ reportId })),
          },
        }),
      },
      include: { reports: { include: { report: true } } },
    });

    return sendCreated(res, template, '報表組合建立成功');
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/templates/:id
 * @desc    更新報表組合
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { name, description, isAllReports, reportCodes } = createTemplateSchema.partial().parse(req.body);

    // 使用交易更新
    const template = await prisma.$transaction(async (tx) => {
      // 更新基本資訊
      await tx.reportTemplate.update({
        where: { id: req.params.id },
        data: { name, description, isAllReports },
      });

      // 如果有更新報表列表
      if (reportCodes !== undefined && !isAllReports) {
        // 取得報表 IDs
        const reports = await tx.report.findMany({
          where: { code: { in: reportCodes } },
        });

        // 刪除現有關聯
        await tx.templateReport.deleteMany({ where: { templateId: req.params.id } });

        // 建立新關聯
        if (reports.length > 0) {
          await tx.templateReport.createMany({
            data: reports.map((r) => ({ templateId: req.params.id, reportId: r.id })),
          });
        }
      }

      return tx.reportTemplate.findUnique({
        where: { id: req.params.id },
        include: { reports: { include: { report: true } } },
      });
    });

    return sendSuccess(res, { data: template, message: '報表組合更新成功' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/templates/:id
 * @desc    刪除報表組合
 */
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.reportTemplate.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    return sendNoContent(res);
  } catch (error) {
    next(error);
  }
});

export default router;
