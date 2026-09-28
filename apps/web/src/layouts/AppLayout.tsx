import { NavLink, Outlet } from 'react-router'
import styles from './AppLayout.module.css'
function AppLayout() {
  const getLinkClassName = ({ isActive }: { isActive: boolean }) =>
    `${styles.link} ${isActive ? styles.activeLink : ''}`

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <nav className={styles.navigation} aria-label="Main navigation">
          <NavLink className={getLinkClassName} to="/" end>
            Home
          </NavLink>
          <NavLink className={getLinkClassName} to="/endpoints">
            Endpoints
          </NavLink>
          <NavLink className={getLinkClassName} to="/events">
            Events
          </NavLink>
        </nav>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
