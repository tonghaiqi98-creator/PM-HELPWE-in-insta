import { z } from 'zod'
import { PRIORITIES, INTAKE_PLATFORMS, APP_PLATFORMS } from '@/lib/constants'
import { dateISOSchema, openIdSchema } from '@/lib/validation'

const appPlatformSchema = z.enum(APP_PLATFORMS)
const intakePlatformSchema = z.enum(INTAKE_PLATFORMS)
const prioritySchema = z.enum(PRIORITIES)
const requirementTypeSchema = z.enum(['type_1', 'type_2', 'type_3', 'type_4'])
const assetKindSchema = z.enum(['static', 'dynamic'])
const imageFormatSchema = z.enum(['png', 'jpg', 'webp', 'lottie'])
const themeSchema = z.enum(['light', 'dark'])

export const createAssetItemSchema = z.object({
  templateId: z.string().optional(),
  module: z.string().min(1),
  category: z.string().min(1),
  scene: z.string().min(1),
  assetName: z.string().min(1),
  assetKind: assetKindSchema,
  format: imageFormatSchema,
  size: z.object({ width: z.number().int().positive(), height: z.number().int().positive() }),
  fps: z.number().int().positive().optional(),
  themes: z.array(themeSchema),
  sortOrder: z.number().int().nonnegative(),
})

export const createRequirementSchema = z.object({
  title: z.string().min(2, '标题至少 2 个字').max(80),
  targetDevice: z.string().min(1, '请填写目标机型'),
  type: requirementTypeSchema,
  intakePlatform: intakePlatformSchema,
  appPlatforms: z.array(appPlatformSchema).min(1, '至少选一个平台'),
  // 需求指标：创建草稿可空，一键提单前再校验（见 ticket service）
  successMetric: z.string().optional(),
  priority: prioritySchema,
  expectedDueDate: dateISOSchema,
  remark: z.string().optional(),
  creatorOpenId: openIdSchema,
  creatorName: z.string().min(1),
  assetItems: z.array(createAssetItemSchema).min(1, '至少选一个资源位'),
})

export type CreateRequirementInputParsed = z.infer<typeof createRequirementSchema>
