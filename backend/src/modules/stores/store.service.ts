import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import type {
  StoreQuery,
  CreateStoreDTO,
  UpdateStoreDTO,
  AssignManagerDTO,
  AddAuthUserDTO,
} from './store.dto';

// ==================== 查詢 ====================

export const findAllStores = async (query: StoreQuery) => {
  const { type, search, isActive, page = 1, limit = 20 } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(type && { type }),
    ...(isActive !== undefined && { isActive }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { code: { contains: search, mode: 'insensitive' as const } },
        { roleEmail: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  };

  const [stores, total] = await Promise.all([
    prisma.store.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: 'asc' },
      include: {
        managers: {
          where: { isActive: true, isPrimary: true },
          include: { staff: true },
          take: 1,
        },
        authorizedUsers: {
          where: { isActive: true },
          include: {
            staff: true,
            scopes: { include: { report: true } },
          },
        },
      },
    }),
    prisma.store.count({ where }),
  ]);

  // 轉換資料格式
  const formattedStores = stores.map((store) => ({
    id: store.id,
    code: store.code,
    name: store.name,
    type: store.type,
    roleEmail: store.roleEmail,
    isActive: store.isActive,
    createdAt: store.createdAt,
    updatedAt: store.updatedAt,
    primaryManager: store.managers[0]
      ? {
          id: store.managers[0].id,
          staff: store.managers[0].staff,
          startDate: store.managers[0].startDate,
        }
      : null,
    authorizedUsers: store.authorizedUsers.map((au) => ({
      id: au.id,
      staff: au.staff,
      roleDesc: au.roleDesc,
      scopes: au.scopes.map((s) => s.report.code),
    })),
  }));

  return { stores: formattedStores, total, page, limit };
};

export const findStoreById = async (id: string) => {
  const store = await prisma.store.findUnique({
    where: { id },
    include: {
      managers: {
        where: { isActive: true },
        include: { staff: true },
        orderBy: { isPrimary: 'desc' },
      },
      authorizedUsers: {
        where: { isActive: true },
        include: {
          staff: true,
          scopes: { include: { report: true } },
        },
      },
    },
  });

  if (!store) {
    throw new AppError('門市不存在', 404, 'STORE_NOT_FOUND');
  }

  return store;
};

// ==================== 新增 ====================

export const createStore = async (data: CreateStoreDTO) => {
  // 檢查代碼是否已存在
  const existing = await prisma.store.findUnique({
    where: { code: data.code },
  });

  if (existing) {
    throw new AppError('門市代碼已存在', 409, 'STORE_CODE_EXISTS');
  }

  return prisma.store.create({
    data,
  });
};

// ==================== 更新 ====================

export const updateStore = async (id: string, data: UpdateStoreDTO) => {
  await findStoreById(id); // 確認存在

  return prisma.store.update({
    where: { id },
    data,
  });
};

// ==================== 刪除 ====================

export const deleteStore = async (id: string) => {
  await findStoreById(id); // 確認存在

  return prisma.store.delete({
    where: { id },
  });
};

// ==================== 指派店經理 ====================

export const assignManager = async (storeId: string, data: AssignManagerDTO) => {
  const { staffId, isPrimary } = data;

  // 確認門市存在
  await findStoreById(storeId);

  // 確認人員存在
  const staff = await prisma.staff.findUnique({ where: { id: staffId } });
  if (!staff) {
    throw new AppError('人員不存在', 404, 'STAFF_NOT_FOUND');
  }

  // 使用交易處理
  return prisma.$transaction(async (tx) => {
    // 如果是主要負責人，先將現有的主要負責人設為非主要
    if (isPrimary) {
      await tx.storeManager.updateMany({
        where: { storeId, isPrimary: true, isActive: true },
        data: { isPrimary: false, endDate: new Date() },
      });
    }

    // 檢查是否已存在該人員的管理記錄
    const existing = await tx.storeManager.findFirst({
      where: { storeId, staffId, isActive: true },
    });

    if (existing) {
      // 更新現有記錄
      return tx.storeManager.update({
        where: { id: existing.id },
        data: { isPrimary, startDate: new Date() },
        include: { staff: true, store: true },
      });
    }

    // 新增管理記錄
    return tx.storeManager.create({
      data: { storeId, staffId, isPrimary },
      include: { staff: true, store: true },
    });
  });
};

// ==================== 新增授權人員 ====================

export const addAuthUser = async (storeId: string, data: AddAuthUserDTO) => {
  const { staffId, roleDesc, reportCodes } = data;

  // 確認門市存在
  await findStoreById(storeId);

  // 確認人員存在
  const staff = await prisma.staff.findUnique({ where: { id: staffId } });
  if (!staff) {
    throw new AppError('人員不存在', 404, 'STAFF_NOT_FOUND');
  }

  // 確認所有報表代碼都存在
  const reports = await prisma.report.findMany({
    where: { code: { in: reportCodes } },
  });

  if (reports.length !== reportCodes.length) {
    throw new AppError('部分報表代碼不存在', 400, 'INVALID_REPORT_CODES');
  }

  // 使用交易處理
  return prisma.$transaction(async (tx) => {
    // 建立或更新授權人員記錄
    const authUser = await tx.storeAuthUser.upsert({
      where: { storeId_staffId: { storeId, staffId } },
      create: { storeId, staffId, roleDesc },
      update: { roleDesc, isActive: true },
    });

    // 刪除現有的權限範圍
    await tx.storeAuthScope.deleteMany({
      where: { storeAuthUserId: authUser.id },
    });

    // 建立新的權限範圍
    await tx.storeAuthScope.createMany({
      data: reports.map((report) => ({
        storeAuthUserId: authUser.id,
        reportId: report.id,
      })),
    });

    return tx.storeAuthUser.findUnique({
      where: { id: authUser.id },
      include: {
        staff: true,
        scopes: { include: { report: true } },
      },
    });
  });
};

// ==================== 移除授權人員 ====================

export const removeAuthUser = async (storeId: string, authUserId: string) => {
  const authUser = await prisma.storeAuthUser.findFirst({
    where: { id: authUserId, storeId },
  });

  if (!authUser) {
    throw new AppError('授權人員不存在', 404, 'AUTH_USER_NOT_FOUND');
  }

  return prisma.storeAuthUser.update({
    where: { id: authUserId },
    data: { isActive: false },
  });
};
