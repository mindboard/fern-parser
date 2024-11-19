
import { assertEquals } from "jsr:@std/assert";

import {
    Parser, ParseResult, Writer, ToSomething, 
    BEGIN, END, begin, end, parseResult, writer, runWriter, anyone, digit, letter, one, none, zeroOrMore, oneOrMore, seq, endBy, either, neither, option, check } from "../src/parser.ts"

import { HtmlBlock, foldHtmlBlocks } from "../src/htmlblock.ts"


Deno.test("hello-anyone", () => {
    const text = "Hello, **World**!"

    const toJust: ToSomething<HtmlBlock> = (t) => { return { kind: "just", text: t} }
    const toBold: ToSomething<HtmlBlock> = (t) => { return { kind: "bold", text: t} }
    const toMarkup: ToSomething<HtmlBlock> = (t) => { return { kind: "markup", text: t} }

    const aster2 = one(toMarkup, "**")
    
    const bold = seq(
      aster2,
      endBy(toBold, "**"),
      aster2,
    )
    
    const p = zeroOrMore(
      either(
        bold,
        anyone(toJust),
      )
    )

    const result = runWriter<HtmlBlock>(text).parse( p )
    assertEquals(result.r.ok, true)

    const htmlBlocks = foldHtmlBlocks(result)

    assertEquals(htmlBlocks.length, 5)
    assertEquals(htmlBlocks[0].kind, "just")
    assertEquals(htmlBlocks[0].text, "Hello, ")
    assertEquals(htmlBlocks[1].kind, "markup")
    assertEquals(htmlBlocks[1].text, "**")
    assertEquals(htmlBlocks[2].kind, "bold")
    assertEquals(htmlBlocks[2].text, "World")
    assertEquals(htmlBlocks[3].kind, "markup")
    assertEquals(htmlBlocks[3].text, "**")
    assertEquals(htmlBlocks[4].kind, "just")
    assertEquals(htmlBlocks[4].text, "!")
})

