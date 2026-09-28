import { useCurrentUser } from './use-current-user.js'
import { Navigate, Outlet } from 'react-router'
import LoadingPage from '../../pages/LoadingPage.js'
import ErrorPage from '../../pages/ErrorPage.js'

export default function GuestOnlyRoute() {
  const { data, isPending, isError } = useCurrentUser()
  if (isPending) {
    return <LoadingPage />
  }
  if (isError) {
    return <ErrorPage />
  }
  if (data !== null) {
    return <Navigate to="/endpoints" replace />
  }
  return <Outlet />
}
