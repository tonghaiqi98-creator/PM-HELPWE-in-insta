import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold">资源适配工作台</h1>
        <p className="mt-2 text-neutral-600">
          管理 APP 换图需求：模板创建 · 一键提单 · 看板跟踪 · 飞书提醒。
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/requirements/create"
          className="block rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-400"
        >
          <div className="text-base font-medium">提需求</div>
          <div className="mt-1 text-sm text-neutral-600">
            从模板创建一条换图需求，一键提单给设计 + 开发。
          </div>
        </Link>
        <Link
          href="/dashboard"
          className="block rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-400"
        >
          <div className="text-base font-medium">我的看板</div>
          <div className="mt-1 text-sm text-neutral-600">
            查看自己提的需求、状态、即将到期和已逾期。
          </div>
        </Link>
        <Link
          href="/shared-board"
          className="block rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-400"
        >
          <div className="text-base font-medium">共享看板</div>
          <div className="mt-1 text-sm text-neutral-600">
            作为设计/开发/测试/关注人，看到与我相关的需求。
          </div>
        </Link>
        <Link
          href="/templates"
          className="block rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-400"
        >
          <div className="text-base font-medium">模板库</div>
          <div className="mt-1 text-sm text-neutral-600">
            浏览图片位置 / 尺寸 / 格式 / 命名规则模板。
          </div>
        </Link>
      </section>

      <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <div className="font-medium">Phase 0 骨架</div>
        <div className="mt-1">
          当前是脚手架状态，所有页面均为占位。请先在 `.env.local` 配置飞书凭证，
          或设置 <code className="font-mono">DATA_SOURCE=mock</code> 进入开发模式。
          详见 <code className="font-mono">CLAUDE.md</code>。
        </div>
      </section>
    </div>
  )
}
