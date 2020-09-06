export type TMarkup = {
  type:
  /** Plain text */
  0
  |
  /** Bold, via <strong> tag */
  1
  |
  /** Italic, via <em> tag */
  2
  |
  /** Anchor, via <a> tag */
  3
  /** Index of source text to start applying formatting */
  start: number
  /** Index of source text to finish applying formatting */
  end: number
  /** href attribute for and in case of <a> tag */
  href?: string
}

export type TParagraphAst = {
  type: typeof TMarkup.type | null
  text: string | null
  props: {
    key?: string
    href?: string
  }
  children: TParagraphAst[]
}

export interface IParagraph {
  /** Key */
  key: string
  /** Text content of paragraph */
  text: string
  /** Information regarding text formatting */
  markups: TMarkup[],
  'data-line'?: string 
}