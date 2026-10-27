import { useForm } from 'react-hook-form'
import type { EndpointNameValues } from './endpoints.types.js'
import { useCreateEndpoint } from './use-endpoint-mutations.js'
import styles from './EndpointDashboard.module.css'

export function CreateEndpointForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EndpointNameValues>()
  const createEndpointMutation = useCreateEndpoint()
  function onSubmit(values: EndpointNameValues) {
    createEndpointMutation.mutate({ name: values.name.trim() }, { onSuccess: () => reset() })
  }

  return (
    <form
      className={styles.createForm}
      aria-busy={createEndpointMutation.isPending}
      noValidate
      onSubmit={handleSubmit(onSubmit)}
    >
      <label className={styles.label} htmlFor="endpoint-name">
        Endpoint name
      </label>
      <input
        className={styles.input}
        id="endpoint-name"
        placeholder="Orders webhook"
        aria-invalid={errors.name ? 'true' : 'false'}
        aria-describedby={errors.name ? 'endpoint-name-error' : undefined}
        {...register('name', {
          required: 'Endpoint name required',
          maxLength: {
            value: 100,
            message: 'Endpoint name must be 100 characters or fewer',
          },
          validate: (value: string) => value.trim().length > 0 || 'Endpoint name is required',
        })}
      />
      <button
        className={styles.primaryButton}
        type="submit"
        disabled={createEndpointMutation.isPending}
      >
        {createEndpointMutation.isPending ? 'Creating…' : 'Create endpoint'}
      </button>
      {errors.name && (
        <p className={styles.fieldError} id="endpoint-name-error" role="alert">
          {errors.name.message}
        </p>
      )}
      {createEndpointMutation.isError && (
        <p className={[styles.formMessage, styles.errorMessage].join(' ')} role="alert">
          {createEndpointMutation.error.message}
        </p>
      )}
      {createEndpointMutation.isSuccess && (
        <p className={[styles.formMessage, styles.successMessage].join(' ')} role="status">
          Endpoint created.
        </p>
      )}
    </form>
  )
}
