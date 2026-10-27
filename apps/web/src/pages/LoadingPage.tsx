import styles from './SimplePage.module.css'

function LoadingPage() {
  return (
    <section className={styles.page}>
      <div className={styles.card} role="status" aria-live="polite">
        <p className={styles.eyebrow}>Please wait</p>
        <h1>Loading</h1>
        <p className={styles.status}>Loading webhook data…</p>
      </div>
    </section>
  )
}

export default LoadingPage
