import { useState, useCallback, useRef } from 'react'

/**
 * Generic hook for calling an async API function.
 * Returns { data, loading, error, execute }.
 */
export function useApi(apiFn) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const abortRef = useRef(null)

  const execute = useCallback(
    async (...args) => {
      // Cancel any in-flight request
      if (abortRef.current) abortRef.current.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setLoading(true)
      setError(null)
      try {
        const result = await apiFn(...args, controller.signal)
        setData(result)
        return result
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Unknown error')
        }
        return null
      } finally {
        setLoading(false)
      }
    },
    [apiFn]
  )

  const reset = useCallback(() => {
    setData(null)
    setError(null)
  }, [])

  return { data, loading, error, execute, reset }
}
