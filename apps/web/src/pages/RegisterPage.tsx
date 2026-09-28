import type { AuthFormValues } from '../features/auth/auth.types.js'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router'
import { register as registerUser } from '../features/auth/auth.api.js'
import styles from './AuthPage.module.css'
export default function RegisterPage() {
  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormValues>()
  const navigation = useNavigate()
  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: () => {
      navigation('/login', {
        replace: true,
        state: { registrationSucceeded: true },
      })
    },
  })
  return (
    <section className={styles.page} aria-labelledby="register-title">
      <h1 id="register-title">Create account</h1>
      <Link className={styles.switchLink} to="/login">
        Already have an account? Sign in
      </Link>{' '}
      <form
        className={styles.form}
        aria-busy={registerMutation.isPending}
        noValidate
        onSubmit={handleSubmit((values) => {
          registerMutation.mutate(values)
        })}
      >
        <label htmlFor="register-email">Email</label>
        <input
          id="register-email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'register-email-error' : undefined}
          {...registerField('email', {
            required: 'Email is required',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Enter a valid email address',
            },
          })}
        />
        {errors.email && (
          <p className={styles.fieldError} id="register-email-error">
            {errors.email.message}
          </p>
        )}{' '}
        <label htmlFor="register-password">Password</label>
        <input
          id="register-password"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? 'register-password-error' : undefined}
          {...registerField('password', {
            required: 'Password is required',
            minLength: {
              value: 15,
              message: 'Password must contain at least 15 characters',
            },
            maxLength: {
              value: 128,
              message: 'Password must contain at most 128 characters',
            },
          })}
        />
        {errors.password && (
          <p className={styles.fieldError} id="register-password-error">
            {errors.password.message}
          </p>
        )}{' '}
        {registerMutation.isError && (
          <p className={styles.serverError} role="alert">
            {registerMutation.error.message}
          </p>
        )}{' '}
        <button className={styles.submitButton} type="submit" disabled={registerMutation.isPending}>
          {' '}
          {registerMutation.isPending ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </section>
  )
}
