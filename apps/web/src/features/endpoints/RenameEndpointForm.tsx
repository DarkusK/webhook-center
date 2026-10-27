import { useForm } from 'react-hook-form'
import type { EndpointNameValues } from './endpoints.types.js'
import { useRenameEndpoint } from './use-endpoint-mutations.js'
import styles from './EndpointDashboard.module.css'

interface RenameEndpointProps {
  endpointId: number
  currentName: string
}

export function RenameEndpointForm({ endpointId, currentName }: RenameEndpointProps) {
  const inputId = `endpoint-name-${endpointId}`
  const errorId = `${inputId}-error`
  const {
    register,
    formState: { errors },
    reset,
    handleSubmit,
  } = useForm<EndpointNameValues>({
    defaultValues: {
      name: currentName,
    },
  })

  const renameEndpointMutation = useRenameEndpoint()
  function onSubmit(values: EndpointNameValues) {
    renameEndpointMutation.mutate(
      {
        id: endpointId,
        values: {
          name: values.name.trim(),
        },
      },
      {
        onSuccess: (updatedEndpoint) =>
          reset({
            name: updatedEndpoint.name,
          }),
      },
    )
  }
  return (
    <form
      className={styles.renameForm}
      aria-busy={renameEndpointMutation.isPending}
      noValidate
      onSubmit={handleSubmit(onSubmit)}
    >
      <label htmlFor={inputId}>New endpoint name</label>
      <input
        className={styles.input}
        id={inputId}
        placeholder="New endpoint name"
        aria-invalid={errors.name ? 'true' : 'false'}
        aria-describedby={errors.name ? errorId : undefined}
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
        className={styles.secondaryButton}
        type="submit"
        disabled={renameEndpointMutation.isPending}
      >
        {renameEndpointMutation.isPending ? 'Renaming…' : 'Rename'}
      </button>
      {errors.name && (
        <p className={styles.fieldError} id={errorId} role="alert">
          {errors.name.message}
        </p>
      )}
      {renameEndpointMutation.isError && (
        <p className={[styles.formMessage, styles.errorMessage].join(' ')} role="alert">
          {renameEndpointMutation.error.message}
        </p>
      )}
      {renameEndpointMutation.isSuccess && (
        <p className={[styles.formMessage, styles.successMessage].join(' ')} role="status">
          Endpoint renamed.
        </p>
      )}
    </form>
  )
}
