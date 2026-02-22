export function timeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  const intervals: [number, string][] = [
    [31536000, 'año'],
    [2592000, 'mes'],
    [604800, 'semana'],
    [86400, 'día'],
    [3600, 'hora'],
    [60, 'minuto'],
  ]

  for (const [interval, label] of intervals) {
    const count = Math.floor(seconds / interval)
    if (count >= 1) {
      return `hace ${count} ${label}${count > 1 ? 's' : ''}`
    }
  }

  return 'justo ahora'
}
