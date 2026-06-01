import { z } from 'zod'

/** 通用：飞书 open_id 校验（开头 ou_，后跟随字符串） */
export const openIdSchema = z.string().regex(/^ou_/, 'open_id 必须以 ou_ 开头')

/** 通用：日期 ISO yyyy-MM-dd */
export const dateISOSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式应为 yyyy-MM-dd')

/** URL 校验，允许空字符串视为未填 */
export const optionalUrlSchema = z
  .string()
  .url('必须是合法 URL')
  .or(z.literal(''))
  .optional()
