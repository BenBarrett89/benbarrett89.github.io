"use client"

import { useEffect } from "react"
import type { RefObject } from "react"

type UseResizeObserverOptions<T extends Element> = {
  ref?: RefObject<T | null>
  box?: ResizeObserverBoxOptions
  onResize: () => void
}

export function useResizeObserver<T extends Element>({
  ref,
  box,
  onResize,
}: UseResizeObserverOptions<T>) {
  useEffect(() => {
    const element = ref?.current
    if (!element) {
      return
    }

    if (typeof window.ResizeObserver === "undefined") {
      window.addEventListener("resize", onResize, false)
      return () => window.removeEventListener("resize", onResize, false)
    }

    const observer = new window.ResizeObserver(() => onResize())
    observer.observe(element, { box })

    return () => observer.disconnect()
  }, [box, onResize, ref])
}
