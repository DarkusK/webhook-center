import { useEndpoints } from '../features/endpoints/use-endpoints.js'
import { CreateEndpointForm } from '../features/endpoints/CreateEndpointForm.js'
import { CopyUrlButton } from '../features/endpoints/CopyUrlButton.js'
import { RenameEndpointForm } from '../features/endpoints/RenameEndpointForm.js'
import { DeleteEndpointButton } from '../features/endpoints/DeleteEndpointButton.js'
import styles from '../features/endpoints/EndpointDashboard.module.css'

function EndpointsPage() {
  const endpointsQuery = useEndpoints()
  if (endpointsQuery.isPending) {
    return (
      <section className={styles.page}>
        <div className={styles.statePanel}>
          <h1>Webhook Endpoints</h1>
          <p className={styles.stateMessage} role="status">
            Loading endpoints…
          </p>
        </div>
      </section>
    )
  }
  if (endpointsQuery.isError) {
    return (
      <section className={styles.page}>
        <div className={styles.statePanel}>
          <h1>Webhook Endpoints</h1>
          <p className={styles.errorMessage} role="alert">
            Unable to load endpoints: {endpointsQuery.error.message}
          </p>
          <button
            className={styles.retryButton}
            type="button"
            onClick={() => void endpointsQuery.refetch()}
          >
            Retry
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.page}>
      <header className={styles.pageHeader}>
        <h1>Webhook Endpoints</h1>
        <p className={styles.lead}>
          Create public URLs to capture and inspect incoming HTTP requests.
        </p>
      </header>

      <section className={styles.panel} aria-labelledby="create-endpoint-title">
        <h2 className={styles.sectionHeading} id="create-endpoint-title">
          Create endpoint
        </h2>
        <CreateEndpointForm />
      </section>

      <section aria-labelledby="endpoint-list-title">
        <div className={styles.sectionHeader}>
          <h2 id="endpoint-list-title">Your endpoints</h2>
          <span
            className={styles.countBadge}
            aria-label={`${endpointsQuery.data.length} endpoints`}
          >
            {endpointsQuery.data.length}
          </span>
        </div>

        {endpointsQuery.data.length === 0 ? (
          <p className={styles.emptyState}>
            No webhook endpoints yet. Create one to receive requests.
          </p>
        ) : (
          <ul className={styles.endpointList}>
            {endpointsQuery.data.map((endpoint) => (
              <li className={styles.endpointCard} key={endpoint.id}>
                <div className={styles.cardHeader}>
                  <div>
                    <h3 className={styles.endpointTitle}>{endpoint.name}</h3>
                    <p className={styles.createdAt}>
                      Created{' '}
                      <time dateTime={endpoint.createdAt}>
                        {new Date(endpoint.createdAt).toLocaleString()}
                      </time>
                    </p>
                  </div>
                  <DeleteEndpointButton endpointId={endpoint.id} endpointName={endpoint.name} />
                </div>

                <div className={styles.urlRow}>
                  <code className={styles.url} title={endpoint.captureUrl}>
                    {endpoint.captureUrl}
                  </code>
                  <CopyUrlButton url={endpoint.captureUrl} endpointName={endpoint.name} />
                </div>

                <RenameEndpointForm endpointId={endpoint.id} currentName={endpoint.name} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  )
}
export default EndpointsPage
