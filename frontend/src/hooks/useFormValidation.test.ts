import { renderHook, act } from '@testing-library/react'
import { useFormValidation } from './useFormValidation'

describe('useFormValidation', () => {
  const config = {
    email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    password: { required: true, minLength: 8 },
  }

  it('validates required fields', () => {
    const { result } = renderHook(() => useFormValidation(config))

    act(() => {
      result.current.validate({ email: '', password: '' })
    })

    expect(result.current.errors.email).toBe('email is required')
    expect(result.current.errors.password).toBe('password is required')
  })

  it('validates email pattern', () => {
    const { result } = renderHook(() => useFormValidation(config))

    act(() => {
      result.current.validate({ email: 'invalid-email', password: 'password123' })
    })

    expect(result.current.errors.email).toBe('email format is invalid')
  })

  it('validates min length', () => {
    const { result } = renderHook(() => useFormValidation(config))

    act(() => {
      result.current.validate({ email: 'test@example.com', password: 'short' })
    })

    expect(result.current.errors.password).toBe('password must be at least 8 characters')
  })

  it('passes validation with valid data', () => {
    const { result } = renderHook(() => useFormValidation(config))

    let isValid: boolean
    act(() => {
      isValid = result.current.validate({ email: 'test@example.com', password: 'password123' })
    })

    expect(isValid).toBe(true)
    expect(Object.keys(result.current.errors)).toHaveLength(0)
  })
})