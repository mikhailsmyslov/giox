import { TSelection } from "../../types/Editor"
import { isTextNode } from "../../utils"

export const useSelection = (editor: React.RefObject<HTMLDivElement>) => {
  const findParagraph = (node: Node | null): Node | null => {
    if (!node) return null
    const parent = node.parentNode
    if (!parent) return null
    if (parent.isSameNode(editor.current)) return node
    return findParagraph(parent)
  }

  const getLineNumber = (el: Node | HTMLElement | null): number => {
    const lineNumber = Number((el as HTMLElement)?.getAttribute('data-line'))
    return Number.isInteger(lineNumber) ? lineNumber : -1
  }

  const getSelection = (): TSelection => {
    const selection = document.getSelection()
    if (!selection) return null
    const { anchorNode, focusNode, focusOffset, anchorOffset } = selection
    const anchorLineNumber = getLineNumber(findParagraph(anchorNode))
    const focusLineNumber = getLineNumber(findParagraph(focusNode))

    const isBackwardsLine = focusLineNumber < anchorLineNumber
    const isSameLine = focusLineNumber === anchorLineNumber
    let isBackwards = false
    if (isSameLine) isBackwards = focusOffset < anchorOffset
    if (!isSameLine && isBackwardsLine) isBackwards = true

    const result = {
      start: {
        line: isBackwards ? focusLineNumber : anchorLineNumber,
        column: isBackwards ? focusOffset : anchorOffset
      },
      end: {
        line: isBackwards ? anchorLineNumber : focusLineNumber,
        column: isBackwards ? anchorOffset : focusOffset
      },
      focus: {
        line: focusLineNumber,
        column: focusOffset
      },
      isCollapsed: selection.isCollapsed
    }
    console.log(result)
    return result
  }

  const createRange = (node: Node, charsCount: number, range?: Range): Range => {
    if (!range) {
      range = document.createRange()
      range.selectNode(node)
      range.setStart(node, 0)
    }
    if (charsCount === 0) {
        range.setEnd(node, charsCount)
    } else
    if (node && charsCount > 0) {
      if (isTextNode(node)) {
        //@ts-ignore
        if (node.textContent?.length < charsCount) {
            charsCount -= (node.textContent?.length || 0)
        } else {
            range.setEnd(node, charsCount)
            charsCount = 0
        }
      } else {
        for (let i = 0; i < node.childNodes.length; i += 1) {
            range = createRange(node.childNodes[i], charsCount, range)
            if (charsCount === 0) break
        }
      }
    } 
    return range
  }

  const setCaret = (line: number, position: number) => {
    const sel = document.getSelection()
    if (!editor.current || !sel) return
    const targetNode = editor.current.childNodes[line]?.firstChild
    if (!targetNode) return
    const range = createRange(targetNode, position);
    if (range) {
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
    }
  }

  return [getSelection, setCaret] as [typeof getSelection,  typeof setCaret]
}

export default useSelection
