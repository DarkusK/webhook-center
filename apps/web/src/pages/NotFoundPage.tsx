import styles from './SimplePage.module.css'

function NotFoundPage() {
  return (
    <section className={styles.page}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>404</p>
        <h1>Page not found</h1>
        <p className={styles.lead}>The page you requested does not exist.</p>
      </div>
    </section>
  )
}
export default NotFoundPage
