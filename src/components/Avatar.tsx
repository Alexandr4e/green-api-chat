const COLORS = ['#e17076', '#7bc862', '#65aadd', '#a695e7', '#ee7aae', '#6ec9cb', '#faa774']

function getInitials(title: string): string {
  const words = title.replace(/[^\p{L}\p{N} ]/gu, '').trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  // для номера телефона показываем две последние цифры
  if (/^\d/.test(words[0])) return words.join('').slice(-2)
  return words
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

function getColor(title: string): string {
  let hash = 0
  for (const ch of title) hash = (hash * 31 + (ch.codePointAt(0) ?? 0)) >>> 0
  return COLORS[hash % COLORS.length]
}

interface AvatarProps {
  title: string
  size?: number
}

export function Avatar({ title, size = 54 }: AvatarProps) {
  return (
    <div
      className="avatar"
      style={{ width: size, height: size, background: getColor(title), fontSize: size * 0.38 }}
      aria-hidden="true"
    >
      {getInitials(title)}
    </div>
  )
}
