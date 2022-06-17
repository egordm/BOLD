import dayjs from 'dayjs'

export const formatDateTime = (date: Date): string => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

export const formatUUIDShort = (uuid: string, length = 6): string => {
  return uuid.substring(0, length).toUpperCase()
}
