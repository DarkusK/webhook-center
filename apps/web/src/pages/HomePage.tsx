import styles from './SimplePage.module.css'

function HomePage() {
  return (
    <section className={styles.page}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>Developer tools</p>
        <h1>Webhook Center</h1>
        <p className={styles.lead}>
          Capture, inspect, and replay HTTP webhooks from one focused workspace.
        </p>
      </div>
    </section>
  )
}
export default HomePage
