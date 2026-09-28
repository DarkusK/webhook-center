import { useCurrentUser } from './use-current-user.js'
import { Navigate, Outlet, useLocation } from 'react-router'
import LoadingPage from '../../pages/LoadingPage.js'
import ErrorPage from '../../pages/ErrorPage.js'

export default function ProtectedRoute() {
  const { data, isPending, isError } = useCurrentUser()
  const currentLocation = useLocation()
  if (isPending) {
    return <LoadingPage />
  }
  if (isError) {
    return <ErrorPage />
  }
  if (data === null) {
    return <Navigate to="/login" replace state={{ from: currentLocation }} />
  }
  return <Outlet />
}
