import {
  runWriter,
  begin,
  END,
  anyone,
  one,
  either,
  neither,
  endBy,
  seq,
  zeroOrMore,
  option,
  check } from "../src/parser.ts"

import {
  foldHtmlBlocks } from "../src/htmlblock.ts"

import {
  convertToImageObject } from "./lib/image.ts"

import {
  convertToParagraphObject } from "./lib/paragraph.ts"

import {
  convertToListObject } from "./lib/list.ts"


const paragraphObjectToHtml = (paragraphObject)=>{
  return paragraphObject.htmlBlocks.map((htmlBlock)=>{
    const kind = htmlBlock.kind
    const text = htmlBlock.text
    if( kind == "just" ){
      return text
    } else if( kind == "bold" ){
      return `<b>${text}</b>`
    } else if( kind == "italic" ){
      return `<i>${text}</i>`
    } else {
      return null
    }
  }).filter((it)=> it!=null).join("")
}

const convertInlineToHtml = (text)=>{
  return paragraphObjectToHtml(convertToParagraphObject(text))
}

const convertListBlockToHtml = (text)=>{
  const listObject = convertToListObject(text)
  return listObject.listItems.map((listItem)=>{
    const text = paragraphObjectToHtml(listItem.paragraph)
    return `<li>${text}</li>`
  }).join("\n")
}

const convertImageBlockToHtml = (text)=>{
  const imageObject = convertToImageObject(text)
  return `<img src="${imageObject.src}" alt="${imageObject.alt}"/>`
}

const convertToHtml = (htmlBlocks)=>{
  return htmlBlocks.map((htmlBlock)=>{
    const kind = htmlBlock.kind
    const text = htmlBlock.text
    if( kind == "h1" ){
      return `<h1>${convertInlineToHtml(text)}</h1>`
    } else if( kind == "h2" ){
      return `<h2>${convertInlineToHtml(text)}</h2>`
    } else if( kind == "h3" ){
      return `<h3>${convertInlineToHtml(text)}</h3>`
    } else if( kind == "image-block" ){
      return `<div>${convertImageBlockToHtml(text)}</div>`
    } else if( kind == "list-block" ){
      return `<ul>${convertListBlockToHtml(text)}</ul>`
    } else if( kind == "paragraph-block" ){
      return `<p>${convertInlineToHtml(text)}</p>`
    } else {
      return null
    }
  }).filter((it)=> it!=null).join("\n")
}



const text = `
# 日々の雑感

![夕焼けが空を染め上げる瞬間](sunset.jpg)

## 繊細な心の持ちよう

最近、ふとグラデーションの美しさに思いを馳せた。
夕焼けが空を染め上げる瞬間、色とりどりの光が心の奥深くに響く。
たわいない日常の中にも、**目を凝らせば美が存在**することを知る。

### ほんの些細なことに感謝を

- 友人との*会話*
- 突然の*雨*
- 温かい*一杯のコーヒー*

これらは何気ない出来事であるが、心の中にはじんわりとした温かさをもたらす。
人はこのような瞬間から、少しずつ生きる力を得るのだと思う。

夜の帳が下りる頃、街の明かりがともる様子を見る。
まるで星々が地上に降りてきたようで、どこかほっとさせてくれる。
この小さな喜びを大切にしながら、明日もまた過ごしていきたい。
生きることは、こうした**小さな積み重ねによって豊かになる**のだと、心が教えてくれる。 `


const toH1 = (t)=> { return { kind: "h1", text: t } }
const toH2 = (t)=> { return { kind: "h2", text: t } }
const toH3 = (t)=> { return { kind: "h3", text: t } }
const toMarkup   = (t)=> { return { kind: "markup", text: t } }
const toNothing  = (t)=> { return { kind: "nothing", text: "" } }

const lineBreak = one(toNothing, "\n")

const beginningOfLine = either(
  lineBreak,
  begin(),
)

const h1 = seq(
  beginningOfLine,
  one(toMarkup, "# "),
  endBy(toH1, "\n"),
)

const h2 = seq(
  beginningOfLine,
  one(toMarkup, "## "),
  endBy(toH2, "\n"),
)

const h3 = seq(
  beginningOfLine,
  one(toMarkup, "### "),
  endBy(toH3, "\n"),
)

const toImageBlock   = (t)=> { return { kind: "image-block", text: t } }

const imageBlock = seq(
  lineBreak,
  one(toImageBlock, "!["),
  endBy(toImageBlock, ")"),
  one(toImageBlock, ")"),
)


const toListBlock   = (t)=> { return { kind: "list-block", text: t } }

const listBlock = seq(
  beginningOfLine,
  one(toListBlock, "- "),
  endBy(toListBlock, "\n\n"),
)

const toParagraphBlock   = (t)=> { return { kind: "paragraph-block", text: t } }

const paragraphBlock = seq(
  lineBreak,
  neither(
    one(toNothing, "### "),
    one(toNothing, "## "),
    one(toNothing, "# "),
    one(toNothing, "- "),
    one(toNothing, "!["),
    lineBreak,
  ),
  either(
      endBy(toParagraphBlock, "\n\n"),
      endBy(toParagraphBlock, END),
  )
)

const emptyLine = seq(
  lineBreak,
  check(lineBreak),
)

const p = zeroOrMore(
  either(
    h1,h2,h3,
    imageBlock,
    listBlock,
    paragraphBlock,
    emptyLine,
    anyone(toNothing),
  )
)

const result = runWriter(text).parse( p )
console.log( convertToHtml( foldHtmlBlocks(result) ) )
