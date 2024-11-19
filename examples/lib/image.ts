import {
  ToSomething,
  Writer,
  runWriter,
  one,
  endBy,
  seq } from "../../src/parser.ts"

import {
  HtmlBlock,
  foldHtmlBlocks } from "../../src/htmlblock.ts"

type ImageObject = {
  alt: string,
  src: string
}

const first = (list: string[]): string => {
  if( list.length>0 ){
    return list[0]
  } else {
    return ""
  }
}

const convertToImageObject = (text: string): ImageObject => {
  
  const toImageAlt: ToSomething<HtmlBlock> = (t)=>{
    return { kind: "image-alt", text: t }
  }
  const toImageSrc: ToSomething<HtmlBlock> = (t)=>{
    return { kind: "image-src", text: t }
  }
  const toMarkup: ToSomething<HtmlBlock>   = (t)=>{
    return { kind: "markup", text: t }
  }
  
  const exclamation        = one(toMarkup, "!")
  const squareBlacketBegin = one(toMarkup, "[")
  const squareBlacketEnd   = one(toMarkup, "]")
  const parenBegin         = one(toMarkup, "(")
  const parenEnd           = one(toMarkup, ")")
  
  const p = seq(
    exclamation,
    squareBlacketBegin,
    endBy(toImageAlt, "]"),
    squareBlacketEnd,
    parenBegin,
    endBy(toImageSrc, ")"),
    parenEnd,
  )
  
  const result: Writer<HtmlBlock> =
    runWriter<HtmlBlock>(text).parse( p )
  const htmlBlocks = foldHtmlBlocks(result)

  const altList = htmlBlocks.filter((it)=> {
    return it.kind=="image-alt"
  }).map((it)=> it.text)

  const srcList = htmlBlocks.filter((it)=> {
    return it.kind=="image-src"
  }).map((it)=> it.text)

  return {
    alt: first(altList),
    src: first(srcList)
  }
}

export type { ImageObject }
export { convertToImageObject }
