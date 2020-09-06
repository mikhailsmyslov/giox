import { SPACE_CHAR } from "../constants/common"

export const identity = (any: any) => any

export const noop = (any: any) => {}

export const isTextNode = (node: Node | null) => {
  if (!node) return false
  return node.nodeType === 3
}

export const isEmpty = (any: any) => {
  if (Array.isArray(any) || typeof any === 'string') return any.length === 0
  if (typeof any === 'object') return Object.keys(any).length === 0
  if (any === undefined || any === null || isNaN(any)) return true
  return false
}

export const first = (arr: Array<any>) => arr[0]
export const last = (arr: Array<any>) => arr[arr.length - 1]

type TClasses = {
  [key: string]: boolean
}
export const cx = (classes: TClasses = {}, className?: string) => {
  const classList = Object.keys(classes).filter(key => classes[key])
  if (className) classList.push(className)
  return classList.join(SPACE_CHAR)
}

const MULTIPLIER = Math.pow(2, 24)
export const getRandomString = () => Array(2).fill(Math.floor(Math.random() * MULTIPLIER).toString(32)).join('')