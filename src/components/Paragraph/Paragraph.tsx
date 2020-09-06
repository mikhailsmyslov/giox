import React, { useMemo } from 'react'
import { IParagraph, TMarkup } from '../../types'
import { last, isEmpty, getRandomString } from '../../utils'
import { TParagraphAst } from '../../types/Paragraph'

const buildPlainTextMarkup = (start: number, end: number): TMarkup => ({ start, end, type: 0 })
const getTextForMarkup = (source: string, { start, end }: TMarkup) => source.substr(start, end - start + 1)

type TRange = {
  start: number
  end: number
}
const isBelongsTo = (rangeA: TRange, rangeB: TRange) => rangeA.start >= rangeB.start && rangeA.end <= rangeB.end

const buildExtendedFormattingMap = (text: string, markups: TMarkup[]) => {

  const startOfText = 0
  const endOfText = text.length - 1
  if (isEmpty(markups)) return [buildPlainTextMarkup(startOfText, endOfText)]

  const [first, ...rest] = markups
  const lastMarkup = last(markups)

  const left = first.start > startOfText
    ? [buildPlainTextMarkup(startOfText, first.start - 1)]
    : []

    const right = lastMarkup.end < endOfText
    ? [buildPlainTextMarkup(lastMarkup.end + 1, endOfText)]
    : []

  const middle = rest.reduce((accumulator, currentMarkup) => {
    const { start: startCurrent } = currentMarkup
    const prevMarkup = last(accumulator)
    const { start: startPrev, end: endPrev } = prevMarkup
    const isChild = isBelongsTo(currentMarkup, prevMarkup)
    const shouldPad = isChild ? startCurrent - startPrev > 0 : startCurrent - endPrev > 1
    const padStart = isChild ? startPrev : endPrev + 1
    const padEnd = startCurrent - 1
    if (shouldPad) accumulator.push(buildPlainTextMarkup(padStart, padEnd))
    accumulator.push(currentMarkup)
    return accumulator
  }, [first])

  return [...left, ...middle, ...right]
}

type TOptions = {
  [key: string]: any
}

const mapTypeToTag: TOptions = { root: 'p', 1: 'strong', 2: 'em', 3: 'a' }

const buildNode = (options: TOptions = {}): TParagraphAst => {
  const { type, text = null, children = [], key, start, end } = options
  const isRoot = options.type === 'root'
  const node: TParagraphAst = {
    type: mapTypeToTag[type] || null,
    text,
    props: {
      key: isRoot ? key : [key, type, start, end].join('_')
    },
    children
  }
  const { href } = options
  if (href) node.props.href = href
  return node
}

const buildAst = (text: string, markups: TMarkup[]): TParagraphAst => {
  const key = getRandomString()
  const buildNodeBinded = (options: any) => buildNode({ ...options, key })
  const root = buildNodeBinded({ type: 'root' })
  const queue = markups.slice()
  const contextRange = { start: 0, end: text.length - 1 } 

  const inner = (tree: TParagraphAst, queue: TMarkup[] = [], contextRange: TRange): TParagraphAst => {
    const current = queue.shift()
    if (!current) return tree
    const [next] = queue
    if (next && isBelongsTo(next, current)) {
      tree.children.push(inner(buildNodeBinded(current), queue, current))
      return inner(tree, queue, contextRange);
    }
    if (isBelongsTo(current, contextRange)) {
      const leaf = buildNodeBinded({ ...current, text: getTextForMarkup(text, current) })
      tree.children.push(leaf)
      return inner(tree, queue, contextRange)
    }
    queue.unshift(current)
    return tree
  }

  return inner(root, queue, contextRange)
}

const ZeroWidthCharacter = <>&#8203;</>
const buildComponent = (ast: TParagraphAst, rootProps = {}): React.ReactElement<any, any> | null=> {
  const { type, children, text, props } = ast
  const content: React.ReactNode = isEmpty(children)
    ? text || ZeroWidthCharacter
    : children.map(child => buildComponent(child))
  return React.createElement(
    type || React.Fragment,
    {...props, ...rootProps },
    content
  )
}

const Paragraph: React.FC<IParagraph> = (props) => {
  const { text, markups } = props
  const rootProps = { 'data-line': props['data-line'] }
  const extendedMarkups = useMemo(() => buildExtendedFormattingMap(text, markups), [text, markups])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ast = useMemo(() => buildAst(text, extendedMarkups), [extendedMarkups])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const Component = useMemo(() => buildComponent(ast, rootProps), [ast])
  return  Component
}

export default React.memo(Paragraph)