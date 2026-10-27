import { Link } from 'react-router'
import styles from './SimplePage.module.css'

function ErrorPage() {
  return (
    <section className={styles.page}>
      <div className={styles.card} role="alert">
        <p className={styles.eyebrow}>Request failed</p>
        <h1>Something went wrong</h1>
        <p className={[styles.status, styles.error].join(' ')}>Please try again later.</p>
        <Link className={styles.link} to="/">
          Return home
        </Link>
      </div>
    </section>
  )
}
export default ErrorPage
