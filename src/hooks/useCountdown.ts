import { useState, useEffect } from 'react'

export function useCountdown(expiresAt: number): number {
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.floor(expiresAt - Date.now() / 1000)
  )

  useEffect(() => {
    setSecondsLeft(Math.floor(expiresAt - Date.now() / 1000))
    const id = setInterval(() => {
      setSecondsLeft(Math.floor(expiresAt - Date.now() / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  return secondsLeft
}
