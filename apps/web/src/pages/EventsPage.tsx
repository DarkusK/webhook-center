import styles from './SimplePage.module.css'

function EventsPage() {
  return (
    <section className={styles.page}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>Event history</p>
        <h1>Webhook Events</h1>
        <p className={styles.lead}>
          Inspect captured request headers and bodies, then replay events when you need them.
        </p>
        <p className={styles.status}>Event history is coming in the next project phase.</p>
      </div>
    </section>
  )
}
export default EventsPage
