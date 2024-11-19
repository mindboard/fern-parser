//
// The MIT License (MIT)
//
// Copyright (c) 2024 Tomoaki, Oshima
//
// https://opensource.org/license/mit
//

import { Writer } from "./parser.ts"

type HtmlBlock = {
    kind: string,
    text: string
}

const foldHtmlBlocks = (result: Writer<HtmlBlock>) => {
  if( result.r.ok ){
    return result.r.xs.reduce((acc: HtmlBlock[], htmlBlock: HtmlBlock)=>{
      if( acc.length==0 ){
        return [htmlBlock]
      } else {
        const lastHtmlBlock = acc[acc.length-1]
        if( lastHtmlBlock.kind == htmlBlock.kind ){
          return acc.slice(0, acc.length-1).concat({
            kind: lastHtmlBlock.kind,
            text: lastHtmlBlock.text + htmlBlock.text
          })
        } else {
          return acc.concat(htmlBlock)
        }
      }
    }, [])
  } else {
    return []
  }
}

export type { HtmlBlock }
export { foldHtmlBlocks }
