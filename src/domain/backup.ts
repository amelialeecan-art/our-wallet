// ===== 백업 / 복원 / CSV =====
// JSON 백업 빌드·검증, 거래 CSV 생성. (DOM 없음 — 다운로드는 lib/download)

import { categoryLabel, paymentSourceTitle, tEnum } from '../i18n/labels'
import type { DeviceState, Lang, WalletDb } from './types'

export const BACKUP_VERSION = 1

export interface BackupFile {
  app: 'our-wallet'
  backupVersion: number
  exportedAt: string
  fixedUsdKrwRate: number
  db: WalletDb
  device?: DeviceState
}

export function buildBackup(db: WalletDb, device?: DeviceState): BackupFile {
  return {
    app: 'our-wallet',
    backupVersion: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    fixedUsdKrwRate: db.settings.fxRate,
    db,
    ...(device ? { device } : {}),
  }
}

export type BackupValidation =
  | { ok: true; db: WalletDb; device?: DeviceState }
  | { ok: false; reason: string }

// 백업 파일 최소 구조 검증 (복원 전 안전 확인)
export function validateBackup(parsed: unknown): BackupValidation {
  if (!parsed || typeof parsed !== 'object') return { ok: false, reason: '백업 파일을 읽을 수 없어요' }
  const b = parsed as Partial<BackupFile>
  if (b.app !== 'our-wallet') return { ok: false, reason: '우리지갑 백업 파일이 아니에요' }
  const db = b.db as Partial<WalletDb> | undefined
  if (!db || typeof db !== 'object') return { ok: false, reason: '백업에 데이터가 없어요' }
  const arrays: (keyof WalletDb)[] = ['accounts', 'transactions', 'categories', 'paymentSources', 'quickActions', 'recurringItems', 'budgets']
  const arraysOk = arrays.every((k) => Array.isArray((db as Record<string, unknown>)[k]))
  if (!arraysOk || typeof db.settings !== 'object') return { ok: false, reason: '백업 구조가 올바르지 않아요' }
  return { ok: true, db: db as WalletDb, device: b.device }
}

export function backupFilename(date = new Date()): string {
  return `our-wallet-backup-${date.toISOString().slice(0, 10)}.json`
}
export function csvFilename(date = new Date()): string {
  return `our-wallet-transactions-${date.toISOString().slice(0, 10)}.csv`
}

// ----- CSV -----
function csvEscape(v: unknown): string {
  const s = v == null ? '' : String(v)
  return '"' + s.replace(/"/g, '""') + '"'
}

const CSV_COLUMNS = [
  'date',
  'type',
  'amountOriginal',
  'currency',
  'amountKrw',
  'category',
  'usedFor',
  'paymentSource',
  'recordedBy',
  'memo',
  'sourceKind',
  'sourceLabel',
  'createdAt',
]

// 한글 깨짐 방지를 위해 UTF-8 BOM 추가
export function transactionsToCsv(db: WalletDb, lang: Lang = 'ko'): string {
  const psById = new Map(db.paymentSources.map((p) => [p.id, p]))
  const lines = db.transactions
    .slice()
    .sort((a, b) => (a.date + a.createdAt).localeCompare(b.date + b.createdAt))
    .map((t) => {
      const ps = psById.get(t.paymentSourceId)
      return [
        t.date,
        t.type,
        t.amountOriginal,
        t.currency,
        t.amountKrw,
        categoryLabel(t.categoryId, db.categories, lang),
        tEnum('usedFor', t.usedFor, lang),
        ps ? paymentSourceTitle(ps, lang) : '',
        tEnum('recordedBy', t.recordedBy, lang),
        t.memo ?? '',
        t.sourceKind ?? '',
        t.sourceLabel ?? '',
        t.createdAt,
      ]
        .map(csvEscape)
        .join(',')
    })
  return '\uFEFF' + [CSV_COLUMNS.map(csvEscape).join(','), ...lines].join('\r\n')
}
