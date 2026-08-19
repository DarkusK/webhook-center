import { Link } from 'react-router'

function ErrorPage() {
  return (
    <div role="alert">
      <h1>Something went wrong</h1>
      <p>Please try again later.</p>
      <Link to="/"> Return home</Link>
    </div>
  )
}
export default ErrorPage
