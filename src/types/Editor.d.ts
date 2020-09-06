import { IParagraph } from ".";

export interface IEditorState {
  paragraphs: IParagraph[]
  caretLine: number
  caretColumn: number
}

type TRange = {
  line: number
  column: number 
}
interface ISelection {
  start: TRange
  end: TRange
  focus: TRange
  isCollapsed: boolean
}

export type TSelection = ISelection | null

export interface TAction {
  type: string
  payload: any
}

export interface IEditor {
  key?: string
  className?: string
  editorState?: IEditorState
  onChange?: (editorState: IEditorState) => void
}