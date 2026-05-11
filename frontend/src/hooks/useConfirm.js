import { useState, useCallback, useRef } from 'react'

export function useConfirm() {
  const [state, setState] = useState({ open: false, message: '' })
  const resolveRef = useRef(null)

  const confirm = useCallback((message) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve
      setState({ open: true, message })
    })
  }, [])

  const handleConfirm = () => {
    resolveRef.current?.(true)
    resolveRef.current = null
    setState(s => ({ ...s, open: false }))
  }

  const handleCancel = () => {
    resolveRef.current?.(false)
    resolveRef.current = null
    setState(s => ({ ...s, open: false }))
  }

  return {
    confirm,
    dialogProps: { open: state.open, message: state.message, onConfirm: handleConfirm, onCancel: handleCancel },
  }
}
