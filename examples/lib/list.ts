import {
  ToSomething,
  Writer,
  Parser,
  runWriter,
  begin,
  END,
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

import {
  ParagraphObject,
  convertToParagraphObject } from "./paragraph.ts"


type ListItem = {
  paragraph: ParagraphObject
}

type ListObject = {
  listItems: ListItem[]
}


const convertToListObject = (text: string): ListObject => {
  const toListItem: ToSomething<HtmlBlock> = (t)=>{
    return { kind: "list-item", text: t }
  }
  const toMarkup: ToSomething<HtmlBlock>   = (t)=>{
    return { kind: "markup", text: t }
  }
  const toNothing: ToSomething<HtmlBlock>  = (t)=>{
    return { kind: "nothing", text: t }
  }
  
  const lineBreak: Parser<HtmlBlock> = one(toNothing, "\n")
  const listItemMarkup: Parser<HtmlBlock> = one(toMarkup, "- ")
  
  const p = zeroOrMore(
    seq(
      either(
       begin(),
       lineBreak,
      ),
      listItemMarkup,
      either(
        endBy(toListItem, "\n"),
        endBy(toListItem, END),
      ),
    )
  )
  
  const result: Writer<HtmlBlock> =
      runWriter<HtmlBlock>(text).parse( p )
  const htmlBlocks = foldHtmlBlocks(result)

  const listItemTextList: string[] = htmlBlocks.filter((it)=> {
     return it.kind=="list-item"
  }).map((it)=> it.text)

  const listItems: ListItem[] =  listItemTextList.map((t)=>{
    return {
      paragraph: convertToParagraphObject(t)
    }
  })

  return {
    listItems: listItems
  }
}

export type { ListItem, ListObject }
export { convertToListObject }
