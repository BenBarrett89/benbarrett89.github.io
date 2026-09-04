import type React from "react"

type ReactComponent =
  | React.ElementType
  | React.ForwardRefExoticComponent<React.RefAttributes<unknown>>

export const isFunctionComponent = (component: unknown): component is React.FC =>
  typeof component === "function"

export const isClassComponent = (
  component: unknown,
): component is React.ComponentClass => {
  if (typeof component !== "function") {
    return false
  }

  const prototype = component.prototype as {
    isReactComponent?: boolean
    render?: unknown
  }
  return !!prototype && (!!prototype.isReactComponent || !!prototype.render)
}

export const isForwardRefComponent = (
  component: unknown,
): component is React.ForwardRefExoticComponent<React.RefAttributes<unknown>> => {
  if (typeof component !== "object" || component === null) {
    return false
  }

  const symbol = (component as { $$typeof?: unknown }).$$typeof
  return typeof symbol === "symbol" && symbol.toString() === "Symbol(react.forward_ref)"
}

export const isReactComponent = (component: unknown): component is ReactComponent =>
  isFunctionComponent(component) ||
  isForwardRefComponent(component) ||
  isClassComponent(component)
