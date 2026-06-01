import Link from 'next/link'
import { FeishuBootstrap } from '@/components/feishu-bootstrap'
import { getCurrentUser } from '@/lib/session'

const NAV = [
  { href: '/', label: '首页' },
  { href: '/requirements/create', label: '提需求' },
  { href: '/requirements', label: '我的需求' },
  { href: '/dashboard', label: '我的看板' },
  { href: '/shared-board', label: '共享看板' },
  { href: '/templates', label: '模板库' },
  { href: '/data', label: '数据库' },
  { href: '/settings', label: '设置' },
] as const

export default async function FeishuLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  const appId = process.env.NEXT_PUBLIC_FEISHU_APP_ID ?? ''
  const isMockFallback = user?.name?.includes('（开发）') ?? false

  return (
    <div className="flex min-h-screen flex-col">
      <FeishuBootstrap appId={appId} alreadyLoggedIn={!!user && !isMockFallback} />
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
          <Link href="/" className="font-semibold">
            资源适配工作台
          </Link>
          <nav className="flex gap-4 text-sm text-neutral-600">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-neutral-900">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto text-xs text-neutral-500">
            {user ? user.name : '未登录'}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </div>
  )
}
