import { useState, useCallback, useRef, useEffect } from 'react'
import './Toast.css'

let showToastExternal = () => {}

/**
 * Call this from anywhere to show a toast.
 * Usage: showToast('Message', 'success' | 'error' | 'pending')
 */
export function showToast(message, type = 'success') {
  showToastExternal(message, type)
}

export default function Toast() {
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState('')
  const [type, setType] = useState('success')
  const timerRef = useRef(null)

  const show = useCallback((msg, t = 'success') => {
    setMessage(msg)
    setType(t)
    setVisible(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setVisible(false), 4000)
  }, [])

  useEffect(() => {
    showToastExternal = show
    return () => { showToastExternal = () => {} }
  }, [show])

  if (!visible) return null

  return (
    <div className={`toast ${type}`} id="toast">
      <span id="toastMessage">{message}</span>
    </div>
  )
}
