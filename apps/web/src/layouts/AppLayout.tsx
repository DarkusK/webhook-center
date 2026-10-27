import { NavLink, Outlet, useNavigate } from 'react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCurrentUser, currentUserQueryKey } from '../features/auth/use-current-user.js'
import styles from './AppLayout.module.css'
import { logout as logoutUser } from '../features/auth/auth.api.js'

function AppLayout() {
  const getLinkClassName = ({ isActive }: { isActive: boolean }) =>
    `${styles.link} ${isActive ? styles.activeLink : ''}`
  const { data: user, isPending, isError } = useCurrentUser()
  const queryClient = useQueryClient()
  const navigation = useNavigate()
  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      queryClient.setQueryData(currentUserQueryKey, null)
      navigation('/', { replace: true })
    },
  })
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <nav className={styles.navigation} aria-label="Main navigation">
          <NavLink className={styles.brand} to="/" end>
            Webhook Center
          </NavLink>
          {isPending && <p role="status">Loading session...</p>}
          {isError && <p role="alert">Unable to load session</p>}
          <NavLink className={getLinkClassName} to="/" end>
            Home
          </NavLink>
          {!isPending &&
            !isError &&
            (user ? (
              <>
                <NavLink className={getLinkClassName} to="/endpoints">
                  Endpoints
                </NavLink>
                <NavLink className={getLinkClassName} to="/events">
                  Events
                </NavLink>
                <div className={styles.account}>
                  {logoutMutation.isError && <p role="alert">{logoutMutation.error.message}</p>}
                  <span className={styles.userEmail}>{user.email}</span>
                  <button
                    className={styles.logoutButton}
                    type="button"
                    onClick={() => logoutMutation.mutate()}
                    disabled={logoutMutation.isPending}
                  >
                    {logoutMutation.isPending ? 'Signing out...' : 'Sign out'}
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.account}>
                <NavLink className={getLinkClassName} to="/login">
                  Sign in
                </NavLink>
                <NavLink className={getLinkClassName} to="/register">
                  Create account
                </NavLink>
              </div>
            ))}
        </nav>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
