import { z } from 'zod'
import { ASSET_CATEGORIES, ASSET_FORMATS } from '@/lib/constants'

export const templateSchema = z.object({
  module: z.string().min(1, '模块必填'),
  category: z.enum(ASSET_CATEGORIES),
  scene: z.string().min(1, '涉及环节必填'),
  assetName: z.string().min(1, '资源名称必填'),
  assetKind: z.enum(['static', 'dynamic']),
  format: z.enum(ASSET_FORMATS),
  defaultSize: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
  fps: z.number().int().positive().optional(),
  hasThemeVariants: z.boolean(),
  namingRule: z.string().optional(),
  devModule: z.string().optional(),
  exampleImageToken: z.string().optional(),
  note: z.string().optional(),
  sortOrder: z.number().int().nonnegative(),
})

export const updateTemplateSchema = templateSchema.partial()

export type TemplateInputParsed = z.infer<typeof templateSchema>
