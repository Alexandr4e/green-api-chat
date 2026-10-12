import { ChatsIcon, LogoutIcon } from './icons'

interface NavRailProps {
  onLogout: () => void
}

/** Узкая левая панель навигации, как в веб-версии MAX. В приложении один раздел — «Чаты». */
export function NavRail({ onLogout }: NavRailProps) {
  return (
    <nav className="nav-rail" aria-label="Основная навигация">
      <div className="nav-rail__item nav-rail__item--active" aria-current="page">
        <ChatsIcon className="nav-rail__icon" />
        <span className="nav-rail__label">Чаты</span>
      </div>
      <button type="button" className="nav-rail__item nav-rail__item--action nav-rail__item--bottom" onClick={onLogout}>
        <LogoutIcon className="nav-rail__icon" />
        <span className="nav-rail__label">Выйти</span>
      </button>
    </nav>
  )
}
