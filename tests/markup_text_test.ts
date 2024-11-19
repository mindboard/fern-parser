
import { assertEquals } from "jsr:@std/assert";

import {
    Parser, ParseResult, Writer, ToSomething, 
    BEGIN, END, begin, end, parseResult, writer, runWriter, anyone, digit, letter, one, none, zeroOrMore, oneOrMore, seq, endBy, either, neither, option, check } from "../src/parser.ts"

import { HtmlBlock, foldHtmlBlocks } from "../src/htmlblock.ts"




Deno.test("image", () => {
    const text = "![foo](bar.jpg)"

    const toJust: ToSomething<HtmlBlock> = (t)=> { return { kind: "just", text: t } }
    const toImageAlt: ToSomething<HtmlBlock> = (t)=> { return { kind: "alt", text: t } }
    const toImageSrc: ToSomething<HtmlBlock> = (t)=> { return { kind: "src", text: t } }
    const toMarkup: ToSomething<HtmlBlock> = (t)=> { return { kind: "markup", text: t } }

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

    const result = runWriter<HtmlBlock>(text).parse( p )
    assertEquals(result.r.ok, true)

    const htmlBlocks = foldHtmlBlocks(result)
    assertEquals(htmlBlocks[0].kind, "markup")
    assertEquals(htmlBlocks[0].text, "![")
    assertEquals(htmlBlocks[1].kind, "alt")
    assertEquals(htmlBlocks[1].text, "foo")
    assertEquals(htmlBlocks[2].kind, "markup")
    assertEquals(htmlBlocks[2].text, "](")
    assertEquals(htmlBlocks[3].kind, "src")
    assertEquals(htmlBlocks[3].text, "bar.jpg")
    assertEquals(htmlBlocks[4].kind, "markup")
    assertEquals(htmlBlocks[4].text, ")")
})

Deno.test("paragraph", () => {
    const text = "The *quick* *brown* **fox** jumps over a *lazy* **dog**"

    const toJust: ToSomething<HtmlBlock> = (t)=> { return { kind: "just", text: t } }
    const toBold: ToSomething<HtmlBlock> = (t)=> { return { kind: "bold", text: t } }
    const toItalic: ToSomething<HtmlBlock> = (t)=> { return { kind: "italic", text: t } }
    const toMarkup: ToSomething<HtmlBlock> = (t)=> { return { kind: "markup", text: t } }
    const toNothing: ToSomething<HtmlBlock> = (t)=> { return { kind: "nothing", text: t } }

    const boldMarkup = one(toMarkup, "**")
    const bold = seq(
      boldMarkup,
      endBy(toBold, "**"),
      boldMarkup,
    )
    
    const italicMarkup = one(toMarkup, "*")
    const italic = seq(
      italicMarkup,
      neither(
        one(toNothing, "*"),
      ),
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

    const result = runWriter<HtmlBlock>(text).parse( p )
    assertEquals(result.r.ok, true)

    const htmlBlocks = foldHtmlBlocks(result)
    assertEquals(htmlBlocks.length, 20)

    assertEquals(htmlBlocks[0].kind, "just")
    assertEquals(htmlBlocks[0].text, "The ")
    assertEquals(htmlBlocks[1].kind, "markup")
    assertEquals(htmlBlocks[1].text, "*")
    assertEquals(htmlBlocks[2].kind, "italic")
    assertEquals(htmlBlocks[2].text, "quick")
    assertEquals(htmlBlocks[3].kind, "markup")
    assertEquals(htmlBlocks[3].text, "*")
    assertEquals(htmlBlocks[4].kind, "just")
    assertEquals(htmlBlocks[4].text, " ")
    assertEquals(htmlBlocks[5].kind, "markup")
    assertEquals(htmlBlocks[5].text, "*")
    assertEquals(htmlBlocks[6].kind, "italic")
    assertEquals(htmlBlocks[6].text, "brown")
    assertEquals(htmlBlocks[7].kind, "markup")
    assertEquals(htmlBlocks[7].text, "*")
    assertEquals(htmlBlocks[8].kind, "just")
    assertEquals(htmlBlocks[8].text, " ")
    assertEquals(htmlBlocks[9].kind, "markup")
    assertEquals(htmlBlocks[9].text, "**")
    assertEquals(htmlBlocks[10].kind, "bold")
    assertEquals(htmlBlocks[10].text, "fox")
    assertEquals(htmlBlocks[11].kind, "markup")
    assertEquals(htmlBlocks[11].text, "**")
    assertEquals(htmlBlocks[12].kind, "just")
    assertEquals(htmlBlocks[12].text, " jumps over a ")
    assertEquals(htmlBlocks[13].kind, "markup")
    assertEquals(htmlBlocks[13].text, "*")
    assertEquals(htmlBlocks[14].kind, "italic")
    assertEquals(htmlBlocks[14].text, "lazy")
    assertEquals(htmlBlocks[15].kind, "markup")
    assertEquals(htmlBlocks[15].text, "*")
    assertEquals(htmlBlocks[16].kind, "just")
    assertEquals(htmlBlocks[16].text, " ")
    assertEquals(htmlBlocks[17].kind, "markup")
    assertEquals(htmlBlocks[17].text, "**")
    assertEquals(htmlBlocks[18].kind, "bold")
    assertEquals(htmlBlocks[18].text, "dog")
    assertEquals(htmlBlocks[19].kind, "markup")
    assertEquals(htmlBlocks[19].text, "**")
})

Deno.test("list", () => {
    const text = ["- hello", "- world"].join("\n")

    const toListItem: ToSomething<HtmlBlock> = (t)=> { return { kind: "list-item", text: t } }
    const toMarkup: ToSomething<HtmlBlock> = (t)=> { return { kind: "markup", text: t } }
    const toNothing: ToSomething<HtmlBlock> = (t)=> { return { kind: "nothing", text: t } }

    const lineBreak = one(toNothing, "\n")
    const listItemMarkup = one(toMarkup, "- ")

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

    const result = runWriter<HtmlBlock>(text).parse( p )
    assertEquals(result.r.ok, true)

    const htmlBlocks = foldHtmlBlocks(result)
    assertEquals(htmlBlocks[0].kind, "markup")
    assertEquals(htmlBlocks[0].text, "- ")
    assertEquals(htmlBlocks[1].kind, "list-item")
    assertEquals(htmlBlocks[1].text, "hello")

    assertEquals(htmlBlocks[2].kind, "nothing")
    assertEquals(htmlBlocks[2].text, "\n")

    assertEquals(htmlBlocks[3].kind, "markup")
    assertEquals(htmlBlocks[3].text, "- ")
    assertEquals(htmlBlocks[4].kind, "list-item")
    assertEquals(htmlBlocks[4].text, "world")
})

