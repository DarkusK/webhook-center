import { Routes, Route } from 'react-router'
import AppLayout from './layouts/AppLayout.js'
import HomePage from './pages/HomePage.js'
import EndpointsPage from './pages/EndpointsPage.js'
import EventsPage from './pages/EventsPage.js'
import NotFoundPage from './pages/NotFoundPage.js'
import LoadingPage from './pages/LoadingPage.js'
import ErrorPage from './pages/ErrorPage.js'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="endpoints" element={<EndpointsPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="loading" element={<LoadingPage />} />
        <Route path="error" element={<ErrorPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
