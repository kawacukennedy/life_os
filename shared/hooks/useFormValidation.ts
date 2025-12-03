import { useState, useCallback } from 'react'

interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: string) => string | null
}

interface FieldConfig {
  [key: string]: ValidationRule
}

interface ValidationErrors {
  [key: string]: string
}

export function useFormValidation<T extends Record<string, any>>(config: FieldConfig) {
  const [errors, setErrors] = useState<ValidationErrors>({})

  const validate = useCallback((data: T): boolean => {
    const newErrors: ValidationErrors = {}

    for (const [field, rules] of Object.entries(config)) {
      const value = data[field]

      if (rules.required && (!value || value.toString().trim() === '')) {
        newErrors[field] = `${field} is required`
        continue
      }

      if (value && typeof value === 'string') {
        if (rules.minLength && value.length < rules.minLength) {
          newErrors[field] = `${field} must be at least ${rules.minLength} characters`
          continue
        }

        if (rules.maxLength && value.length > rules.maxLength) {
          newErrors[field] = `${field} must be no more than ${rules.maxLength} characters`
          continue
        }

        if (rules.pattern && !rules.pattern.test(value)) {
          newErrors[field] = `${field} format is invalid`
          continue
        }
      }

      if (rules.custom) {
        const customError = rules.custom(value)
        if (customError) {
          newErrors[field] = customError
          continue
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [config])

  const clearError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }, [])

  const clearAllErrors = useCallback(() => {
    setErrors({})
  }, [])

  return { errors, validate, clearError, clearAllErrors }
}