// Hooks from Shadcn UI
import { useEffect, useState } from "react"

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 1000000

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

const toastTimeouts = new Map()

export const useToast = () => {
  const [toasts, setToasts] = useState([])

  const dismiss = (toastId) => {
    setToasts((toasts) => toasts.filter((toast) => toast.id !== toastId))
  }

  const update = (toastId, toast) => {
    setToasts((toasts) => toasts.map((t) => (t.id === toastId ? { ...t, ...toast } : t)))
  }

  const create = (toast) => {
    const id = toast.id || genId()
    const newToast = {
      ...toast,
      id,
      title: toast.title,
      description: toast.description,
      open: true,
    }

    setToasts((toasts) => {
      const maxToasts = TOAST_LIMIT
      const filteredToasts = [newToast, ...toasts].slice(0, maxToasts)
      return filteredToasts
    })

    return id
  }

  const toast = (props) => {
    const id = create(props)
    return id
  }

  useEffect(() => {
    toasts.forEach((toast) => {
      if (toast.open === false || toastTimeouts.has(toast.id)) {
        return
      }

      const timeout = setTimeout(() => {
        if (toastTimeouts.has(toast.id)) {
          toastTimeouts.delete(toast.id)
        }
        setToasts((toasts) => toasts.filter((t) => t.id !== toast.id))
      }, TOAST_REMOVE_DELAY)

      toastTimeouts.set(toast.id, timeout)
    })

    return () => {
      toastTimeouts.forEach((timeout) => {
        clearTimeout(timeout)
      })
      toastTimeouts.clear()
    }
  }, [toasts])

  return {
    toasts,
    toast,
    dismiss,
    update,
  }
}

export const toast = (props) => {
  const toastHelper = useToast()
  return toastHelper.toast(props)
}