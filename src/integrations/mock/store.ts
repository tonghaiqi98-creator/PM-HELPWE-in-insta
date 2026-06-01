import type { Requirement, AssetItem } from '@/domains/requirement/types'
import type { AssetTemplate } from '@/domains/template/types'
import type { Collaborator } from '@/domains/collaborator/types'
import type { Member } from '@/domains/member/types'
import type { StatusLog } from '@/domains/workflow/types'
import type { DeviceEncoding, EncodingPosition } from '@/domains/device/types'

/**
 * 进程内存 store，仅用于 DATA_SOURCE=mock 开发期。
 */
type Store = {
  requirements: Map<string, Requirement>
  assetItems: Map<string, AssetItem>
  templates: Map<string, AssetTemplate>
  collaborators: Map<string, Collaborator>
  members: Map<string, Member>
  statusLogs: Map<string, StatusLog>
  deviceEncodings: Map<string, DeviceEncoding>
}

const globalScope = globalThis as unknown as { __pmh_mock_store?: Store }

export function getStore(): Store {
  if (!globalScope.__pmh_mock_store) {
    const store: Store = {
      requirements: new Map(),
      assetItems: new Map(),
      templates: new Map(),
      collaborators: new Map(),
      members: new Map(),
      statusLogs: new Map(),
      deviceEncodings: new Map(),
    }
    seedTemplates(store)
    seedDeviceEncodings(store)
    globalScope.__pmh_mock_store = store
  }
  return globalScope.__pmh_mock_store
}

/** 机型 SN 编码规则种子（来自 pictures/Z03、Z05、TRC 三张图） */
function seedDeviceEncodings(store: Store) {
  // 位 5-14 三机型一致
  const common: EncodingPosition[] = [
    { range: '5', name: '预留位', rule: '默认位 3' },
    { range: '6-7', name: '年份', rule: '字母表示，AA=2025、AB=2026、BA=2047；不含字母 O,I,Z,L' },
    { range: '8', name: '月份', rule: '字母表示，A=1月、B=2月 …' },
    {
      range: '9-14',
      name: '生产流水号',
      rule: '6 位唯一 ID；不含数字 0,1,2；不含字母 O,I,Z,L',
    },
  ]
  const hostType =
    'A=黑色版主机；B=白色版主机；C=黑色版分离屏；D=白色版分离屏'

  const list: DeviceEncoding[] = [
    {
      id: 'dev_z03',
      deviceCode: 'Z03',
      deviceName: 'Z03',
      example: 'BTLA3AAAXXXXXX',
      positions: [
        { range: '1-2', name: '产品代码', rule: '字母，Z03 为 BT' },
        { range: '3', name: '生产厂商代码', rule: '"E"=能率；"Z"=珠海；"L"=立讯' },
        { range: '4', name: '产品类型', rule: hostType },
        ...common,
      ],
    },
    {
      id: 'dev_z05',
      deviceCode: 'Z05',
      deviceName: 'Z05',
      example: 'CHLA3ABCXXXXXX',
      positions: [
        { range: '1-2', name: '产品代码', rule: '字母，Z05 为 CH' },
        { range: '3', name: '生产厂商代码', rule: '"L"=立讯' },
        { range: '4', name: '产品类型', rule: hostType },
        ...common,
      ],
    },
    {
      id: 'dev_trc',
      deviceCode: 'TRC',
      deviceName: 'TRC',
      example: 'BZEA3AAAXXXXXX',
      positions: [
        { range: '1-2', name: '产品代码', rule: '字母，TRC 为 BZ' },
        { range: '3', name: '生产厂商代码', rule: '"E"=能率' },
        {
          range: '4',
          name: '产品类型',
          rule: 'A=TX发射器(黑色)；B=TX发射器(白色)；C=RX接收器(标准版)；D=RX接收器(手机版)；E=充电盒',
        },
        ...common,
      ],
    },
  ]
  for (const d of list) store.deviceEncodings.set(d.id, d)
}

/**
 * 资源位种子数据，提炼自 Z03/Z05、C9 两份「连接图片资源」需求文档。
 * 这些资源位跨设备稳定，只有设备和交付图随设备变化。
 */
function seedTemplates(store: Store) {
  const dyn = (
    sortOrder: number,
    scene: string,
    assetName: string,
    w: number,
    h: number,
    fps = 20,
  ): AssetTemplate => ({
    id: `tpl_connect_dyn_${sortOrder}`,
    module: '连接',
    category: '连接-动图',
    scene,
    assetName,
    assetKind: 'dynamic',
    format: 'webp',
    defaultSize: { width: w, height: h },
    fps,
    hasThemeVariants: false,
    namingRule: `connect_{device}_${slug(assetName)}.webp`,
    sortOrder,
  })

  const stat = (
    sortOrder: number,
    scene: string,
    assetName: string,
    w: number,
    h: number,
    theme = true,
  ): AssetTemplate => ({
    id: `tpl_connect_stat_${sortOrder}`,
    module: '连接',
    category: '连接-静态图',
    scene,
    assetName,
    assetKind: 'static',
    format: 'png',
    defaultSize: { width: w, height: h },
    hasThemeVariants: theme,
    namingRule: `connect_{device}_${slug(assetName)}.png`,
    sortOrder,
  })

  const lib = (
    sortOrder: number,
    assetName: string,
    w: number,
    h: number,
  ): AssetTemplate => ({
    id: `tpl_lib_${sortOrder}`,
    module: '连接',
    category: '资源库基础配置',
    scene: '资源库配置',
    assetName,
    assetKind: 'static',
    format: 'webp',
    defaultSize: { width: w, height: h },
    hasThemeVariants: false,
    namingRule: `lib_{device}_front_${slug(assetName)}.webp`,
    sortOrder,
  })

  const list: AssetTemplate[] = [
    // 连接-动图
    dyn(1, '连接过程中', '正视图顺时针旋转', 500, 500),
    dyn(2, '设备开机引导', '设备开机', 300, 300),
    dyn(3, '相机授权（第一次连接app时）', '相机授权', 520, 400),

    // 连接-静态图
    stat(1, '扫描到新设备（单台设备时）', '新设备发现', 112, 112),
    stat(2, '设备列表', '设备列表', 128, 128),
    stat(3, '连接失败弹窗', '正视图', 520, 400),
    stat(4, '主动断连弹窗', '断连连接', 300, 300),
    stat(5, '拍摄页断连重连', '拍摄页断连', 626, 626),
    stat(6, '陀螺仪矫正页面（相机中的图片）', '陀螺仪矫正', 750, 576),
    stat(7, '播放页，文件信息弹窗', '播放页占位图', 128, 128),
    stat(8, '帮助页', '连接帮助', 284, 284),

    // 资源库基础配置（正面图 大/中/小/小小）
    lib(1, '正面图-大', 939, 939),
    lib(2, '正面图-中', 780, 600),
    lib(3, '正面图-小', 426, 426),
    lib(4, '正面图-小小', 192, 192),

    // 线稿图
    {
      id: 'tpl_line_1',
      module: '连接',
      category: '线稿图',
      scene: '连接过程中（未加载出动图时）',
      assetName: '线稿图',
      assetKind: 'static',
      format: 'webp',
      defaultSize: { width: 780, height: 780 },
      hasThemeVariants: false,
      namingRule: 'connect_{device}_line.webp',
      sortOrder: 1,
    },
    {
      id: 'tpl_line_2',
      module: '连接',
      category: '线稿图',
      scene: '社区玩法',
      assetName: '角标',
      assetKind: 'static',
      format: 'png',
      defaultSize: { width: 24, height: 24 },
      hasThemeVariants: false,
      namingRule: 'community_{device}_badge.png',
      sortOrder: 2,
    },

    // 云存储（来自 C9 文档「云存储」表；标「没有」的配网/云端设备项不需资源，已跳过）
    cloud(1, '云存储入口（路径触发）', '云存储入口动效', 'dynamic', 'webp', 800, 800),
    cloud(2, '云存储入口', '云存储入口图', 'static', 'png', 672, 574),
    cloud(3, '设备管理', '设备管理', 'static', 'png', 550, 632, '尺寸待设计确认'),
    cloud(4, '云订阅卡片', '云订阅卡片', 'static', 'png', 550, 632, '尺寸待设计确认'),
    cloud(5, '备份失败', '备份失败', 'static', 'png', 550, 632),
    cloud(6, '引导充电', '引导充电', 'static', 'png', 550, 632),
    cloud(7, '备份完成', '备份完成', 'static', 'png', 550, 632),
    cloud(8, '相机加速备份中', '相机加速备份中', 'static', 'png', 550, 632),
  ]

  for (const t of list) store.templates.set(t.id, t)
}

function cloud(
  sortOrder: number,
  scene: string,
  assetName: string,
  assetKind: AssetTemplate['assetKind'],
  format: AssetTemplate['format'],
  w: number,
  h: number,
  note?: string,
): AssetTemplate {
  return {
    id: `tpl_cloud_${sortOrder}`,
    module: '云存储',
    category: '云存储',
    scene,
    assetName,
    assetKind,
    format,
    defaultSize: { width: w, height: h },
    hasThemeVariants: false,
    namingRule: `cloud_{device}_${slug(assetName)}.${format}`,
    note,
    sortOrder,
  }
}

function slug(s: string): string {
  return s.replace(/[（）()\s]/g, '').slice(0, 12)
}
