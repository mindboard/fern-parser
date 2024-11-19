
import { assertEquals } from "jsr:@std/assert";

import {
    Parser, ParseResult, Writer, ToSomething, 
    BEGIN, END, begin, end, parseResult, writer, runWriter, anyone, digit, letter, one, none, zeroOrMore, oneOrMore, seq, endBy, either, neither, option, check } from "../src/parser.ts"

import { HtmlBlock, foldHtmlBlocks } from "../src/htmlblock.ts"


Deno.test("anyone", () => {
    const text = "Hello, World!"

    const toJust: ToSomething<HtmlBlock> = (t)=> { return { kind: "just", text: t } }
    const p = anyone(toJust)
    const result = runWriter<HtmlBlock>(text).parse( p )
    assertEquals(result.r.ok, true)

    const htmlBlocks = foldHtmlBlocks(result)
    assertEquals(htmlBlocks[0].kind, "just")
    assertEquals(htmlBlocks[0].text, "H")
})

Deno.test("one", () => {
    const text = "Hello, World!"

    const toJust: ToSomething<HtmlBlock> = (t)=> { return { kind: "just", text: t } }
    const p = one(toJust, "Hello")
    const result = runWriter<HtmlBlock>(text).parse( p )
    assertEquals(result.r.ok, true)

    const htmlBlocks = foldHtmlBlocks(result)
    assertEquals(htmlBlocks[0].kind, "just")
    assertEquals(htmlBlocks[0].text, "Hello")
})

Deno.test("digit", () => {
    const text = "123"

    const toJust: ToSomething<HtmlBlock> = (t)=> { return { kind: "just", text: t } }
    const p = digit(toJust)
    const result = runWriter<HtmlBlock>(text).parse( p )
    assertEquals(result.r.ok, true)

    const htmlBlocks = foldHtmlBlocks(result)
    assertEquals(htmlBlocks[0].kind, "just")
    assertEquals(htmlBlocks[0].text, "1")
})

Deno.test("letter", () => {
    const text = "Hello, World!"

    const toJust: ToSomething<HtmlBlock> = (t)=> { return { kind: "just", text: t } }
    const p = letter(toJust)
    const result = runWriter<HtmlBlock>(text).parse( p )
    assertEquals(result.r.ok, true)

    const htmlBlocks = foldHtmlBlocks(result)
    assertEquals(htmlBlocks[0].kind, "just")
    assertEquals(htmlBlocks[0].text, "H")
})

Deno.test("zeroOrMore", () => {
    const text = "Hello, World!"

    const toJust: ToSomething<HtmlBlock> = (t)=> { return { kind: "just", text: t } }
    const p = zeroOrMore(letter(toJust))
    const result = runWriter<HtmlBlock>(text).parse( p )
    assertEquals(result.r.ok, true)

    const htmlBlocks = foldHtmlBlocks(result)
    assertEquals(htmlBlocks[0].kind, "just")
    assertEquals(htmlBlocks[0].text, "Hello")
})

Deno.test("oneOrMore", () => {
    const text = "Hello, World!"

    const toJust: ToSomething<HtmlBlock> = (t)=> { return { kind: "just", text: t } }
    const p = oneOrMore(anyone(toJust))
    const result = runWriter<HtmlBlock>(text).parse( p )
    assertEquals(result.r.ok, true)

    const htmlBlocks = foldHtmlBlocks(result)
    assertEquals(htmlBlocks[0].kind, "just")
    assertEquals(htmlBlocks[0].text, "Hello, World!")
})

Deno.test("oneOrMore-2", () => {
    const text = "Hello, World!"

    const toJust: ToSomething<HtmlBlock> = (t)=> { return { kind: "just", text: t } }
    const p = oneOrMore(digit(toJust))
    const result = runWriter<HtmlBlock>(text).parse( p )
    assertEquals(result.r.ok, false)

    /*
    const htmlBlocks = foldHtmlBlocks(result)
    assertEquals(htmlBlocks[0].kind, "just")
    assertEquals(htmlBlocks[0].text, "Hello, World!")
    */
})

Deno.test("seq", () => {
    const text = "Hello, World!"

    const toJust: ToSomething<HtmlBlock> = (t)=> { return { kind: "just", text: t } }
    const toOthers: ToSomething<HtmlBlock> = (t)=> { return { kind: "others", text: t } }

    const hello = one(toJust, "Hello")
    const comma = one(toOthers, ",")
    const space = one(toOthers, " ")
    const world = one(toJust, "World")
    const exclamation = one(toOthers, "!")

    const p = seq(hello, comma, space, world, exclamation,)
    const result = runWriter<HtmlBlock>(text).parse( p )
    assertEquals(result.r.ok, true)

    const htmlBlocks = foldHtmlBlocks(result)
    assertEquals(htmlBlocks[0].kind, "just")
    assertEquals(htmlBlocks[0].text, "Hello")
    assertEquals(htmlBlocks[1].kind, "others")
    assertEquals(htmlBlocks[1].text, ", ")
    assertEquals(htmlBlocks[2].kind, "just")
    assertEquals(htmlBlocks[2].text, "World")
    assertEquals(htmlBlocks[3].kind, "others")
    assertEquals(htmlBlocks[3].text, "!")
})

Deno.test("endBy", () => {
    const text = "Hello, World!"

    const toJust: ToSomething<HtmlBlock> = (t)=> { return { kind: "just", text: t } }
    const toOthers: ToSomething<HtmlBlock> = (t)=> { return { kind: "others", text: t } }

    const comma = one(toOthers, ",")
    const space = one(toOthers, " ")
    const exclamation = one(toOthers, "!")

    const p = seq(
        endBy(toJust, ","),
        comma,
        space,
        endBy(toJust, "!"),
        exclamation,
    )
        
    const result = runWriter<HtmlBlock>(text).parse( p )
    assertEquals(result.r.ok, true)

    const htmlBlocks = foldHtmlBlocks(result)
    assertEquals(htmlBlocks[0].kind, "just")
    assertEquals(htmlBlocks[0].text, "Hello")
    assertEquals(htmlBlocks[1].kind, "others")
    assertEquals(htmlBlocks[1].text, ", ")
    assertEquals(htmlBlocks[2].kind, "just")
    assertEquals(htmlBlocks[2].text, "World")
    assertEquals(htmlBlocks[3].kind, "others")
    assertEquals(htmlBlocks[3].text, "!")
})

Deno.test("either", () => {
    const text = "Hello, World!"

    const toJust: ToSomething<HtmlBlock> = (t)=> { return { kind: "just", text: t } }
    const toOthers: ToSomething<HtmlBlock> = (t)=> { return { kind: "others", text: t } }

    const hello = one(toJust, "Hello")
    const comma = one(toOthers, ",")
    const space = one(toOthers, " ")
    const world = one(toJust, "World")
    const exclamation = one(toOthers, "!")

    const p = zeroOrMore(
        either(
            hello,
            comma,
            space,
            world,
            exclamation,
        )
    )
    const result = runWriter<HtmlBlock>(text).parse( p )
    assertEquals(result.r.ok, true)

    const htmlBlocks = foldHtmlBlocks(result)
    assertEquals(htmlBlocks[0].kind, "just")
    assertEquals(htmlBlocks[0].text, "Hello")
    assertEquals(htmlBlocks[1].kind, "others")
    assertEquals(htmlBlocks[1].text, ", ")
    assertEquals(htmlBlocks[2].kind, "just")
    assertEquals(htmlBlocks[2].text, "World")
    assertEquals(htmlBlocks[3].kind, "others")
    assertEquals(htmlBlocks[3].text, "!")
})

Deno.test("neither", () => {
    const text = `
- Hello
* World
Hello, World!
`

    const toListItem: ToSomething<HtmlBlock>  = (t)=> { return { kind: "list-item", text: t } }
    const toMarkup: ToSomething<HtmlBlock>    = (t)=> { return { kind: "markup", text: t } }
    const toParagraph: ToSomething<HtmlBlock> = (t)=> { return { kind: "paragraph", text: t } }
    const toNothing: ToSomething<HtmlBlock>   = (t)=> { return { kind: "nothing", text: t } }

    const lineBreak = one(toNothing, "\n")

    const hypenMarkup = one(toMarkup, "- ")
    const asterMarkup = one(toMarkup, "* ")

    const hypenListItem = seq(
      lineBreak,
      hypenMarkup,
      endBy(toListItem, "\n"),
    )
    
    const asterListItem = seq(
      lineBreak,
      asterMarkup,
      endBy(toListItem, "\n"),
    )
    
    const paragraph = seq(
      lineBreak,
      neither(hypenMarkup, asterMarkup),
      endBy(toParagraph, "\n"),
    )
    
    const p = zeroOrMore(
      either(
        paragraph,
        hypenListItem,
        asterListItem,
      )
    )

    const result = runWriter<HtmlBlock>(text).parse( p )
    assertEquals(result.r.ok, true)

    const htmlBlocks = foldHtmlBlocks(result)
    assertEquals(htmlBlocks[0].kind, "nothing")
    assertEquals(htmlBlocks[0].text, "\n")
    assertEquals(htmlBlocks[1].kind, "markup")
    assertEquals(htmlBlocks[1].text, "- ")
    assertEquals(htmlBlocks[2].kind, "list-item")
    assertEquals(htmlBlocks[2].text, "Hello")
    assertEquals(htmlBlocks[3].kind, "nothing")
    assertEquals(htmlBlocks[3].text, "\n")
    assertEquals(htmlBlocks[4].kind, "markup")
    assertEquals(htmlBlocks[4].text, "* ")
    assertEquals(htmlBlocks[5].kind, "list-item")
    assertEquals(htmlBlocks[5].text, "World")
    assertEquals(htmlBlocks[6].kind, "nothing")
    assertEquals(htmlBlocks[6].text, "\n")
    assertEquals(htmlBlocks[7].kind, "paragraph")
    assertEquals(htmlBlocks[7].text, "Hello, World!")
})

Deno.test("option", () => {
    const text = "Hello Hello!"

    const toNothing: ToSomething<HtmlBlock> = (t)=> { return { kind: "nothing", text: t } }
    const toWord: ToSomething<HtmlBlock> = (t)=> { return { kind: "word", text: t } }

    const space = one(toNothing, " ")
    const hello = seq(
        one(toWord, "Hello"),
        option( one(toWord, "!") ),
    )
    const p = zeroOrMore(
        either(
            hello,
            space,
        )
    )
    const result = runWriter<HtmlBlock>(text).parse( p )
    assertEquals(result.r.ok, true)

    const htmlBlocks = foldHtmlBlocks(result)
    assertEquals(htmlBlocks[0].kind, "word")
    assertEquals(htmlBlocks[0].text, "Hello")
    assertEquals(htmlBlocks[1].kind, "nothing")
    assertEquals(htmlBlocks[1].text, " ")
    assertEquals(htmlBlocks[2].kind, "word")
    assertEquals(htmlBlocks[2].text, "Hello!")
})

Deno.test("check", () => {
    const text = "HelloWorld!"

    const toJust: ToSomething<HtmlBlock> = (t)=> { return { kind: "just", text: t } }

    const hello = one(toJust, "Hello")
    const world = one(toJust, "World!")

    const p = seq(
        hello,
        check(world),
    )
    const result = runWriter<HtmlBlock>(text).parse( p )
    assertEquals(result.r.ok, true)
    assertEquals(result.r.xs.length, 1)

    const htmlBlocks = foldHtmlBlocks(result)
    assertEquals(htmlBlocks[0].kind, "just")
    assertEquals(htmlBlocks[0].text, "Hello")
})

Deno.test("begin", () => {
    const text = "Hello, World!"

    const toJust: ToSomething<HtmlBlock> = (t)=> { return { kind: "just", text: t } }

    const p = seq(
        begin<HtmlBlock>(),
        anyone(toJust),
    )
    const result = runWriter<HtmlBlock>(text).parse( p )
    assertEquals(result.r.ok, true)
    assertEquals(result.r.xs.length, 1)

    const htmlBlocks = foldHtmlBlocks(result)
    assertEquals(htmlBlocks[0].kind, "just")
    assertEquals(htmlBlocks[0].text, "H")
})

Deno.test("BEGIN", () => {
    const text = "Hello, World!"

    const toJust: ToSomething<HtmlBlock> = (t)=> { return { kind: "just", text: t } }
    const toNothing: ToSomething<HtmlBlock> = (t)=> { return { kind: "nothing", text: t } }

    const p = seq(
        one(toNothing, BEGIN),
        anyone(toJust),
    )
    const result = runWriter<HtmlBlock>(text).parse( p )
    assertEquals(result.r.ok, true)
    assertEquals(result.r.xs.length, 1)

    const htmlBlocks = foldHtmlBlocks(result)
    assertEquals(htmlBlocks[0].kind, "just")
    assertEquals(htmlBlocks[0].text, "H")
})

Deno.test("end", () => {
    const text = "Hello, World!"

    const toJust: ToSomething<HtmlBlock> = (t)=> { return { kind: "just", text: t } }
    const toNothing: ToSomething<HtmlBlock> = (t)=> { return { kind: "nothing", text: t } }

    const p = seq(
        one(toJust, "Hello, World!"),
        one(toNothing, END),
    )
    const result = runWriter<HtmlBlock>(text).parse( p )
    assertEquals(result.r.ok, true)
    assertEquals(result.r.xs.length, 1)

    const htmlBlocks = foldHtmlBlocks(result)
    assertEquals(htmlBlocks[0].kind, "just")
    assertEquals(htmlBlocks[0].text, "Hello, World!")
})

Deno.test("END", () => {
    const text = "Hello, World!"

    const toJust: ToSomething<HtmlBlock> = (t)=> { return { kind: "just", text: t } }

    const p = endBy(toJust, END)
    const result = runWriter<HtmlBlock>(text).parse( p )
    assertEquals(result.r.ok, true)
    assertEquals(result.r.xs.length, 1)

    const htmlBlocks = foldHtmlBlocks(result)
    assertEquals(htmlBlocks[0].kind, "just")
    assertEquals(htmlBlocks[0].text, "Hello, World!")
})

