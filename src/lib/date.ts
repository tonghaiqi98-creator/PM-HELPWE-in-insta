import { addDays, differenceInDays, format, parseISO } from 'date-fns'

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function plusDaysISO(days: number, from: Date = new Date()): string {
  return format(addDays(from, days), 'yyyy-MM-dd')
}

export function daysUntil(dueDate: string, now: Date = new Date()): number {
  return differenceInDays(parseISO(dueDate), now)
}

export function isOverdue(dueDate: string, now: Date = new Date()): boolean {
  return daysUntil(dueDate, now) < 0
}
