import dayjs from 'dayjs'

export const formatDateTime = (date: Date): string => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

export const formatDuration = (date: Date): string => {
  return (dayjs(date) as any).fromNow()
}

export const formatUUIDShort = (uuid: string, length = 6): string => {
  return uuid.substring(0, length).toUpperCase()
}
