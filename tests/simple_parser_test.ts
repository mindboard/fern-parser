
import { assertEquals } from "jsr:@std/assert";

import {
    Parser, ParseResult, Writer, ToSomething, 
    BEGIN, END, begin, end, parseResult, writer, runWriter, anyone, digit, letter, one, none, zeroOrMore, oneOrMore, seq, endBy, either, neither, option, check } from "../src/parser.ts"

Deno.test("hello-anyone", () => {
    const text = "Hello, World!"

    const toJust: ToSomething<string> = (t)=> { return `just: ${t}` }
    const p = anyone(toJust)
    const result = runWriter<string>(text).parse( p )
    assertEquals(result.r.ok, true)
    assertEquals(result.r.xs.length, 1)
    assertEquals(result.r.xs[0], "just: H")
})

Deno.test("hello-anyone-seq", () => {
    const text = "Hello, World!"

    const toJust: ToSomething<string> = (t)=> { return `just: ${t}` }
    const p = seq(
        anyone(toJust),
        anyone(toJust),
    )
    const result = runWriter<string>(text).parse( p )
    assertEquals(result.r.ok, true)
    assertEquals(result.r.xs.length, 2)
    assertEquals(result.r.xs[0], "just: H")
    assertEquals(result.r.xs[1], "just: e")
})

Deno.test("hello-zeroOrMore", () => {
    const text = "Hello"

    const toJust: ToSomething<string> = (t)=> { return `just: ${t}` }
    const p = zeroOrMore(anyone(toJust))
    const result = runWriter<string>(text).parse( p )
    assertEquals(result.r.ok, true)
    assertEquals(result.r.xs.length, 5)
    assertEquals(result.r.xs[0], "just: H")
    assertEquals(result.r.xs[1], "just: e")
    assertEquals(result.r.xs[2], "just: l")
    assertEquals(result.r.xs[3], "just: l")
    assertEquals(result.r.xs[4], "just: o")
})

Deno.test("hello-one", () => {
    const text = "Hello"

    const toJust: ToSomething<string> = (t)=> { return `just: ${t}` }
    const p = one(toJust, "H")
    const result = runWriter<string>(text).parse( p )
    assertEquals(result.r.ok, true)
    assertEquals(result.r.xs.length, 1)
    assertEquals(result.r.xs[0], "just: H")
})

Deno.test("hello-zeroOrMore-one", () => {
    const text = "Hello"

    const toJust: ToSomething<string> = (t)=> { return `just: ${t}` }
    const p = zeroOrMore(one(toJust, "H"))
    const result = runWriter<string>(text).parse( p )
    assertEquals(result.r.ok, true)
    assertEquals(result.r.xs.length, 1)
    assertEquals(result.r.xs[0], "just: H")
})

Deno.test("hello-one-failure-1", () => {
    const text = "Hello"

    const toJust: ToSomething<string> = (t)=> { return `just: ${t}` }
    const p = one(toJust, "h")
    const result = runWriter<string>(text).parse( p )
    assertEquals(result.r.ok, false)
})

Deno.test("hello-one-failure-2", () => {
    const text = "Hello"

    const toJust: ToSomething<string> = (t)=> { return `just: ${t}` }
    const p = zeroOrMore(one(toJust, "h"))
    const result = runWriter<string>(text).parse( p )
    assertEquals(result.r.ok, true)
    assertEquals(result.r.xs.length, 0)
})

Deno.test("hello-world!", () => {
    const text = "Hello, World!"

    const toJust: ToSomething<string> = (t)=> { return t }

    const hello = one(toJust, "Hello")
    const comma = one(toJust, ",")
    const space = one(toJust, " ")
    const world = one(toJust, "World")
    const excl  = one(toJust, "!")
    const p = seq(hello, comma, space, world, excl,)
    const result = runWriter<string>(text).parse( p )
    assertEquals(result.r.ok, true)

    assertEquals(
        result.r.xs.join(""),
        "Hello, World!")
})


Deno.test("hello-letter", () => {
    const text = "Hello, World!"

    const toJust: ToSomething<string> = (t)=> { return `just: ${t}` }
    const p = letter(toJust)
    const result = runWriter<string>(text).parse( p )
    assertEquals(result.r.ok, true)
    assertEquals(result.r.xs.length, 1)
    assertEquals(result.r.xs[0], "just: H")
})

Deno.test("hello-digit", () => {
    const text = "123"

    const toJust: ToSomething<string> = (t)=> { return `just: ${t}` }
    const p = digit(toJust)
    const result = runWriter<string>(text).parse( p )
    assertEquals(result.r.ok, true)
    assertEquals(result.r.xs.length, 1)
    assertEquals(result.r.xs[0], "just: 1")
})


