// src/utils/dateUtils.ts
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc)

export function toApiISOString(date: string, time: string): string {
  // date: "2025-07-28", time: "09:00"
  return dayjs(`${date}T${time}`)
    .utc()
    .format('YYYY-MM-DDTHH:mm:ss[Z]')
}
