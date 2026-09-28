import { useMutation, useQueryClient } from '@tanstack/react-query'
import { login as loginUser } from '../features/auth/auth.api.js'
import { currentUserQueryKey } from '../features/auth/use-current-user.js'
import { Link, useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import type { AuthFormValues } from '../features/auth/auth.types.js'
import { useLocation, type Location } from 'react-router'
import styles from './AuthPage.module.css'

type LoginLocationState = {
  from?: Location
  registrationSucceeded?: boolean
}

export default function LoginPage() {
  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormValues>()
  const location = useLocation()
  const locationState = location.state as LoginLocationState | null
  const from = locationState?.from
  const queryClient = useQueryClient()
  const navigation = useNavigate()
  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (user) => {
      queryClient.setQueryData(currentUserQueryKey, user)
      navigation(from ?? '/endpoints', { replace: true })
    },
  })

  return (
    <section className={styles.page} aria-labelledby="login-title">
      <h1 id="login-title">Sign in</h1>
      {locationState?.registrationSucceeded && (
        <p className={styles.successMessage} role="status">
          Account created. You can now sign in.
        </p>
      )}
      <Link className={styles.switchLink} to="/register">
        New to Webhook Center? Create an account
      </Link>{' '}
      <form
        className={styles.form}
        aria-busy={loginMutation.isPending}
        noValidate
        onSubmit={handleSubmit((values) => {
          loginMutation.mutate(values)
        })}
      >
        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'login-email-error' : undefined}
          {...registerField('email', {
            required: 'Email is required',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Enter a valid email address',
            },
          })}
        />
        {errors.email && (
          <p className={styles.fieldError} id="login-email-error">
            {errors.email.message}
          </p>
        )}{' '}
        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? 'login-password-error' : undefined}
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
          <p className={styles.fieldError} id="login-password-error">
            {errors.password.message}
          </p>
        )}{' '}
        {loginMutation.isError && (
          <p className={styles.serverError} role="alert">
            {loginMutation.error.message}
          </p>
        )}{' '}
        <button className={styles.submitButton} type="submit" disabled={loginMutation.isPending}>
          {' '}
          {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </section>
  )
}
