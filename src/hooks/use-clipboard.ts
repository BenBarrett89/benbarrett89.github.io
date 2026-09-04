"use client"

import { useCallback, useState } from "react"

const DEFAULT_TIMEOUT = 2000

type UseClipboardReturnType = {
  copied: string | boolean
  copy: (text: string, id?: string) => Promise<{ success: boolean; error?: Error }>
}

export const useClipboard = (): UseClipboardReturnType => {
  const [copied, setCopied] = useState<string | boolean>(false)

  const copy = useCallback(async (text: string, id?: string) => {
    const markCopied = () => {
      setCopied(id || true)
      setTimeout(() => setCopied(false), DEFAULT_TIMEOUT)
    }

    const fallback = () => {
      const textArea = document.createElement("textarea")
      textArea.value = text
      textArea.style.position = "absolute"
      textArea.style.left = "-99999px"

      document.body.appendChild(textArea)
      textArea.select()

      const success = document.execCommand("copy")
      textArea.remove()

      if (success) {
        markCopied()
        return { success: true }
      }

      return { success: false, error: new Error("execCommand returned false") }
    }

    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text)
        markCopied()
        return { success: true }
      } catch {
        return fallback()
      }
    }

    return fallback()
  }, [])

  return { copied, copy }
}
