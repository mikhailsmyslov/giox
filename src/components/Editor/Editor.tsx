import React, { useEffect, useRef, useCallback } from 'react'
import '../../assets/styles/Editor.css'
import useKeys from '../../hook/useRefreshKeys'
import { IEditor, IParagraph } from '../../types'
import { cx, isEmpty, getRandomString, noop } from '../../utils'
import Paragraph from '../Paragraph'
import { RETURN, BACK_SPACE, DELETE, B, I, L } from '../../constants/keyCodes'
import { useEditorState } from './editorState'
import { useSelection } from './selection'
import { BOLD, ITALIC, ANCHOR } from '../../constants/common'

const Editor: React.FC<IEditor> = (props) => {
  const { className, onChange = noop } = props
  const [editorKey] = useKeys()

  const editorRef = useRef<HTMLDivElement>(null)
  const [getSelection, setCaret] = useSelection(editorRef)
  const [state, updater] = useEditorState(onChange)

  const { paragraphs, caretLine, caretColumn } = state
  const handleBeforeInput = (e: React.FormEvent<HTMLDivElement> & InputEvent) => {
    
    const chars = e.data
    if (isEmpty(state.paragraphs)) {
      e.preventDefault()
      return updater.appendParagraph(createNewParagraph({ text: chars }))
    }
    const selection = getSelection()
    updater.insertText(chars, selection)
  }

  useEffect(() => {
    setCaret(caretLine, caretColumn)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caretColumn, caretLine])

  const createNewParagraph = (options = {}): IParagraph => ({
    key: getRandomString(),
    //@ts-ignore
    text: options.text || '',
    markups: []
  })

  const prevent = useCallback((e: any) => e.preventDefault(), [])

  const handleReturn = (e: React.KeyboardEvent<HTMLDivElement>) => {
    updater.appendParagraph(createNewParagraph())
  }

  const handleBackSpace = (e: React.KeyboardEvent<HTMLDivElement>) => {}
  const handleDelete = (e: React.KeyboardEvent<HTMLDivElement>) => {}

  const handleApplyAhchor = (e: React.KeyboardEvent<Node>) => {
    updater.applyFormatting(ANCHOR, getSelection())
  }

  const handleApplyItalic = (e: React.KeyboardEvent<HTMLDivElement>) => {
    updater.applyFormatting(ITALIC, getSelection())
  }

  const handleApplyBold = (e: React.KeyboardEvent<HTMLDivElement>) => {
    updater.applyFormatting(BOLD, getSelection())
  }

  const hadnleInsertNewLine = (e: React.KeyboardEvent<HTMLDivElement>) => {}

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const { which: keyCode } = e
    let handler
    switch (true) {
      case e.ctrlKey && keyCode === B:
        handler = handleApplyBold
        break
      case e.ctrlKey && keyCode === I:
        handler = handleApplyItalic
        break
      case e.ctrlKey && keyCode === L:
        handler = handleApplyAhchor
        break
      case e.shiftKey && keyCode === RETURN:
        handler = hadnleInsertNewLine
        break
      case keyCode === RETURN:
        handler = handleReturn
        break
      case keyCode === BACK_SPACE:
        handler = handleBackSpace
        break
      case keyCode === DELETE:
        handler = handleDelete
        break
    }
    if (handler) {
      e.preventDefault()
      handler(e)
    }
  }

  const classes = cx({ editor: true }, className)
  return (
    <div
      key={editorKey}
      ref={editorRef}
      contentEditable
      className={classes}
      onBeforeInput={handleBeforeInput}
      onKeyDown={handleKeyDown}
      onCopy={prevent}
      onPaste={prevent}
      onCut={prevent}
    >
      {paragraphs.map(({ key, ...props }, index) => (
      <Paragraph
        {...props} 
        key={key}
        data-line={String(index)}
        />))}
    </div>
  )
}
export default React.memo(Editor)