import { useState } from 'react'
import styles from './EndpointDashboard.module.css'

interface CopyUrlButtonProps {
  url: string
  endpointName: string
}
export function CopyUrlButton({ url, endpointName }: CopyUrlButtonProps) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle')

  async function handleCopy() {
    setCopyStatus('idle')
    try {
      await navigator.clipboard.writeText(url)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('error')
    }
  }
  return (
    <div className={styles.copyAction}>
      <button
        className={styles.secondaryButton}
        aria-label={`Copy URL for ${endpointName}`}
        type="button"
        onClick={() => void handleCopy()}
      >
        Copy URL
      </button>
      {copyStatus === 'copied' && (
        <p className={styles.copyMessage} role="status">
          Copied.
        </p>
      )}
      {copyStatus === 'error' && (
        <p className={styles.errorMessage} role="alert">
          Unable to copy URL.
        </p>
      )}
    </div>
  )
}
