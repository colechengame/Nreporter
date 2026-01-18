import { Response } from 'express';

interface SuccessOptions<T> {
  data: T;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
  statusCode?: number;
}

export const sendSuccess = <T>(res: Response, options: SuccessOptions<T>) => {
  const { data, message, meta, statusCode = 200 } = options;

  return res.status(statusCode).json({
    success: true,
    data,
    ...(message && { message }),
    ...(meta && { meta }),
  });
};

export const sendCreated = <T>(res: Response, data: T, message?: string) => {
  return sendSuccess(res, { data, message, statusCode: 201 });
};

export const sendNoContent = (res: Response) => {
  return res.status(204).send();
};

interface PaginationParams {
  page?: number;
  limit?: number;
}

export const getPagination = (params: PaginationParams) => {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const buildMeta = (total: number, page: number, limit: number) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
});
