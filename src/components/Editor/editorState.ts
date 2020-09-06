import { IEditorState, TAction, IParagraph, TMarkup } from '../../types'
import { useReducer, useEffect } from 'react'
import { noop } from '../../utils'
import { TSelection } from '../../types/Editor'

const APPEND_PARAGRAPH = 'APPEND_PARAGRAPH'
const EDIT_PARAGRAPHS = 'EDIT_PARAGRAPHS'
const SET_CARET = 'SET_CARET'

export const getInintialState = (): IEditorState => ({
  paragraphs: [],
  caretLine: -1,
  caretColumn: 0,
})

export const reducer = (state: IEditorState, action: TAction) => {
  switch (action.type) {
    case APPEND_PARAGRAPH:
      const paragraph = action.payload
      const positon = paragraph.text.length
      return {
        ...state,
        paragraphs: [...state.paragraphs, paragraph],
        caretColumn: positon,
        caretLine: state.caretLine + 1
      }
    case SET_CARET:
      return {
        ...state,
        caretLine: action.payload.caretLine,
        caretColumn: action.payload.caretColumn
      }
    case EDIT_PARAGRAPHS:
      return {
        ...state,
        paragraphs: action.payload,
      }

    default:
      throw new Error('Undefined action');
  }
}

const rebuildMarkups = (markups: TMarkup[], type: number, start: number, end: number) => {
  const result = []
  markups.forEach(markup => {
    const isSameType = markup.type === type
    const isSameMarkup = markup.start === start && markup.end === end && isSameType
    if (isSameMarkup) return
    const isLiesWithin = start <= markup.start && end >= markup.end
    if (isLiesWithin && isSameType) return
    if (isLiesWithin && !isSameType) return result.push(markup)
    const hasIntersectionFromLeft = start < markup.start && end > markup.start
    const hasIntersectionFromRight = end > markup.end && start < markup.end
    if (!hasIntersectionFromLeft && !hasIntersectionFromRight) return result.push(markup)
    if (hasIntersectionFromLeft) {
      const left = { start: markup.start, end: end, type: markup.type }
      const right = { start: end, end: markup.end, type: markup.type }
      result.push(left, right)
      return
    }
    if (hasIntersectionFromRight) {
      const left = { start: markup.start, end: start, type: markup.type }
      const right = { start: start, end: markup.end, type: markup.type }
      result.push(left, right)
      return
    }
  })
  result.push({ type, start, end })
  //@ts-ignore
  result.sort((a: TMarkup, b: TMarkup) => {
    const { start: startA, end: endA } = a
    const { start: startB, end: endB } = b
    if (startA < startB) return -1
    if (startA === startB && endA > endB) return -1
    if (startA > startB) return 1
    if (startA === startB && endA < endB) return 1
    return 0
  })
  console.log(result)
  return result
}

export const useEditorState = (onChangeCallback = noop) => {
  const initialState = getInintialState()
  const [state, dispatch] = useReducer(reducer, initialState)
  useEffect(() => {
    onChangeCallback(state)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])
  const update = {
    appendParagraph: (payload: IParagraph) => dispatch({ type: APPEND_PARAGRAPH, payload }),
    insertText: (chars: string | null, selection: TSelection) => {
      if (!selection) return
      const { /* start, end,  */focus, isCollapsed } = selection
      if (isCollapsed) {
        const { line, column } = focus
        const paragraphs = state.paragraphs.slice()
        const paragraph = paragraphs[line]
        const { text } = paragraph
        const newText = [text.substring(0, column), chars, text.substring(column)].join('')
        paragraphs[line] = { ...paragraph, text: newText }
        dispatch({
          type: EDIT_PARAGRAPHS,
          payload: paragraphs
        })
      }
      dispatch({type: SET_CARET, payload: { caretLine: focus.line, caretColumn: focus.column + 1 }})
    },
    applyFormatting: (type: number, selection: TSelection) => {
      if (!selection) return
      const { start, end, focus, isCollapsed } = selection
      if (isCollapsed) return
      const { line: lineStart, column: columnStart } = start
      const { line: lineEnd, column: columnEnd } = end
      const paragraphs = state.paragraphs.slice()
      const isOneLine = lineStart === lineEnd
      for (let i = lineStart; i <= lineEnd; i += 1) {
        const paragraph = { ...paragraphs[i] }
        const markups = paragraph.markups
        let start: number = 0
        let end: number = 0
        if (isOneLine) {
          start = columnStart
          end = columnEnd - 1
        } else
        if (i === lineStart && !isOneLine) {
          start = columnStart
          end = paragraph.text.length - 1
        } else
        if (i === lineEnd && !isOneLine) {
          start = 0
          end = columnEnd - 1
        } else
        if (i > lineStart && i < lineEnd) {
          start = 0
          end = paragraph.text.length - 1
        }
        paragraph.markups = rebuildMarkups(markups, type, start, end)
        paragraphs[i] = paragraph
      }
      dispatch({
        type: EDIT_PARAGRAPHS,
        payload: paragraphs
      })
      dispatch({type: SET_CARET, payload: { caretLine: focus.line, caretColumn: focus.column }})
    }
  }
  return [state, update] as [IEditorState, typeof update]
  }