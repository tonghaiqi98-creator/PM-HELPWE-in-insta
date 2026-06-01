import { spawn } from 'node:child_process'

/**
 * 用本机 `lark-cli docs +create --markdown -` 创建飞书 docx。
 *
 * 注意（开发期捷径）：
 * - lark-cli 用的是它自己的认证身份（童海奇个人，cli_a9746473eaba1bea），不是 PM helper 应用
 * - 创建的文档归属童海奇个人云盘；folder-token 决定放在哪个文件夹
 * - 部署到飞书 H5 应用后，要切到 PM helper 应用的原生 docx OpenAPI
 * - 切换点：domains/requirement/docx-generator.ts 工厂换实现，本文件可弃用
 *
 * 失败模式：lark-cli 未安装 / 未认证 / 飞书 API 错 → 抛 Error，上层 catch 后只 console.warn 不阻塞草稿。
 */
export async function createDocxViaLarkCli(args: {
  folderToken?: string
  title: string
  markdown: string
  /** lark-cli binary 名，默认 'lark-cli'；可在测试中覆盖 */
  binary?: string
}): Promise<{ documentToken: string; documentUrl: string; raw: unknown }> {
  const cliArgs = ['docs', '+create', '--title', args.title, '--markdown', '-']
  if (args.folderToken) {
    cliArgs.push('--folder-token', args.folderToken)
  }
  const binary = args.binary ?? 'lark-cli'

  const { stdout, stderr, code } = await runCli(binary, cliArgs, args.markdown)
  if (code !== 0) {
    throw new Error(`lark-cli exited ${code}: ${stderr || stdout || '(no output)'}`)
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(stdout)
  } catch {
    throw new Error(`lark-cli stdout not JSON: ${stdout.slice(0, 400)}`)
  }
  const result = parsed as {
    ok?: boolean
    error?: unknown
    data?: { doc_id?: string; doc_url?: string; obj_token?: string; document_id?: string; url?: string }
  }
  if (!result.ok) {
    throw new Error(`lark-cli failed: ${JSON.stringify(result.error)}`)
  }
  const data = result.data ?? {}
  // lark-cli v1 实测返回 doc_id / doc_url；保留 obj_token / document_id / url 作为 v2 兜底
  const documentToken = data.doc_id || data.obj_token || data.document_id || ''
  if (!documentToken) {
    throw new Error(`lark-cli succeeded but no document token in: ${JSON.stringify(data)}`)
  }
  const documentUrl =
    data.doc_url || data.url || `https://arashivision.feishu.cn/docx/${documentToken}`
  return { documentToken, documentUrl, raw: parsed }
}

function runCli(
  binary: string,
  args: string[],
  stdin: string,
): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, { stdio: ['pipe', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => {
      stdout += d.toString()
    })
    child.stderr.on('data', (d) => {
      stderr += d.toString()
    })
    child.once('error', (err) => {
      reject(new Error(`spawn ${binary} failed: ${err.message}`))
    })
    child.once('close', (code) => {
      resolve({ stdout, stderr, code: code ?? -1 })
    })
    child.stdin.write(stdin)
    child.stdin.end()
  })
}
