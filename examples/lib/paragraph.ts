import {
  ToSomething,
  Writer,
  runWriter,
  anyone,
  one,
  either,
  neither,
  endBy,
  seq,
  zeroOrMore } from "../../src/parser.ts"

import {
  HtmlBlock,
  foldHtmlBlocks } from "../../src/htmlblock.ts"


type ParagraphObject = {
  htmlBlocks: HtmlBlock[]
}

const convertToParagraphObject = (text: string): ParagraphObject => {

  const toJust: ToSomething<HtmlBlock> = (t)=>{
    return { kind: "just", text: t }
  }
  const toBold: ToSomething<HtmlBlock>   = (t)=>{
    return { kind: "bold", text: t }
  }
  const toItalic: ToSomething<HtmlBlock> = (t)=>{
    return { kind: "italic", text: t }
  }
  const toMarkup: ToSomething<HtmlBlock> = (t)=>{
    return { kind: "markup", text: t }
  }
  const toNothing: ToSomething<HtmlBlock>= (t)=>{
    return { kind: "nothing", text: t }
  }
  
  const boldMarkup = one(toMarkup, "**")
  const bold = seq(
    boldMarkup,
    endBy(toBold, "**"),
    boldMarkup,
  )
  
  const italicMarkup = one(toMarkup, "*")
  const italic = seq(
    italicMarkup,
    neither( one(toNothing, "*"),),
    endBy(toItalic, "*"),
    italicMarkup,
  )
  
  const p = zeroOrMore(
    either(
      italic,
      bold,
      anyone(toJust),
    )
  )
  
  const result: Writer<HtmlBlock> =
    runWriter<HtmlBlock>(text).parse( p )
  const htmlBlocks = foldHtmlBlocks(result)

  return { 
    htmlBlocks: htmlBlocks
  }
}

export type { ParagraphObject }
export { convertToParagraphObject }
