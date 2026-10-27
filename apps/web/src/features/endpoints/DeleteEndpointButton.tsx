import { useRef } from 'react'
import { useDeleteEndpoint } from './use-endpoint-mutations.js'
import styles from './EndpointDashboard.module.css'

interface DeleteEndpointProps {
  endpointId: number
  endpointName: string
}

export function DeleteEndpointButton({ endpointId, endpointName }: DeleteEndpointProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const deleteEndpointMutation = useDeleteEndpoint()
  const openDialog = () => {
    deleteEndpointMutation.reset()
    dialogRef.current?.showModal()
  }
  const closeDialog = () => dialogRef.current?.close()
  const titleId = `delete-endpoint-title-${endpointId}`
  const descriptionId = `delete-endpoint-description-${endpointId}`

  function handleDelete() {
    deleteEndpointMutation.mutate(endpointId, { onSuccess: closeDialog })
  }

  return (
    <div className={styles.deleteAction}>
      <button className={styles.dangerOutline} type="button" onClick={openDialog}>
        Delete
      </button>
      <dialog
        className={styles.dialog}
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <h2 id={titleId}>Delete {endpointName}?</h2>
        <p className={styles.dialogDescription} id={descriptionId}>
          Deleting this endpoint will permanently delete all captured events. This action cannot be
          undone.
        </p>
        {deleteEndpointMutation.isError && (
          <p className={[styles.dialogError, styles.errorMessage].join(' ')} role="alert">
            {deleteEndpointMutation.error.message}
          </p>
        )}
        <div className={styles.dialogActions}>
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={closeDialog}
            disabled={deleteEndpointMutation.isPending}
          >
            Cancel
          </button>
          <button
            className={styles.dangerButton}
            type="button"
            onClick={handleDelete}
            disabled={deleteEndpointMutation.isPending}
          >
            {deleteEndpointMutation.isPending ? 'Deleting…' : 'Confirm delete'}
          </button>
        </div>
      </dialog>
    </div>
  )
}
