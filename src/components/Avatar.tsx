// градиенты аватаров в духе MAX
const GRADIENTS = [
  'linear-gradient(135deg, #ffb36b, #ff6b6b)',
  'linear-gradient(135deg, #7be08b, #29b36a)',
  'linear-gradient(135deg, #6bd3ff, #2f86ff)',
  'linear-gradient(135deg, #c39bff, #7a5cf0)',
  'linear-gradient(135deg, #ff9bd0, #f0508f)',
  'linear-gradient(135deg, #6fe3e0, #1fa5b3)',
]

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

function getBackground(title: string): string {
  let hash = 0
  for (const ch of title) hash = (hash * 31 + (ch.codePointAt(0) ?? 0)) >>> 0
  return GRADIENTS[hash % GRADIENTS.length]
}

interface AvatarProps {
  title: string
  size?: number
}

export function Avatar({ title, size = 54 }: AvatarProps) {
  return (
    <div
      className="avatar"
      style={{ width: size, height: size, background: getBackground(title), fontSize: size * 0.38 }}
      aria-hidden="true"
    >
      {getInitials(title)}
    </div>
  )
}
