import { listTemplates, groupByCategory } from '@/domains/template/service'
import { TemplateManager } from '@/components/template-selector/template-manager'

export const dynamic = 'force-dynamic'

export default async function TemplatesPage() {
  const templates = await listTemplates()
  const groups = groupByCategory(templates)
  return <TemplateManager groups={groups} />
}
