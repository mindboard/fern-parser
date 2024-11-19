//
// The MIT License (MIT)
//
// Copyright (c) 2024 Tomoaki, Oshima
//
// https://opensource.org/license/mit
//

const head = <T>(xs: T[]): T =>   { return xs[0] }
const tail = <T>(xs: T[]): T[] => { return xs.slice(1) }

enum SpecialChar {
    BEGIN,
    END
}

const BEGIN = SpecialChar.BEGIN
const END = SpecialChar.END

type ParseText = {
    text: string
    pos: number
}

const currentText = (pt: ParseText): string => {
    return pt.text.slice(pt.pos)
}
const nextParseText = (pt: ParseText, i: number): ParseText => {
    return { text: pt.text, pos: pt.pos + i}
}

type Parser<T> = (pt: ParseText) => Writer<T>

type ParseResult<T> = {
    ok: boolean
    xs: T[]
}

type Writer<T> = {
    pt: ParseText
    r: ParseResult<T>
    parse: (p: Parser<T>) => Writer<T>
}

const parseResult = <T>(ok: boolean, xs: T[]): ParseResult<T> => {
    return {ok: ok, xs: xs}
}

const runWriter = <T>(text: string): Writer<T> => {
    const initParseResult = parseResult<T>(true, [])
    return writer({
        text: text,
        pos: 0}, initParseResult)
}

const writer = <T>(pt: ParseText, r: ParseResult<T>): Writer<T> => {
    const appendResult = (r1: ParseResult<T>, r2: ParseResult<T>)=> {
        const ok = ( r1.ok && r2.ok )
        const xs = r1.xs.concat(r2.xs)
        return parseResult(ok, xs)
    }

    return {
        pt: pt,
        r: r,
        parse: (p: Parser<T>): Writer<T> => {
            const w = p(pt)
            return writer<T>(w.pt, appendResult(r, w.r))
        }
    }
}

const ngWriter = <T>(pt: ParseText): Writer<T> => {
    return writer<T>(pt, parseResult(false, []))
}

const okWriter = <T>(pt: ParseText, xs: T[]): Writer<T> => {
    return writer(pt, parseResult(true, xs))
}


type ToSomething<T> = (text: string) => T

const endBy = <T>(toSomething: ToSomething<T>, xms: string | SpecialChar): Parser<T> => {
    const drop = (text: string, offset: number): string => { return text.slice(offset) }
    const take = (text: string, l: number): string => { return text.slice(0, l) }
    const zip =  (text0: string, text1: string): Pair<string, string>[] => {
        const l = text0.length
        return Array.from({ length: l }, (_, i) => i).map((index)=>{
            return {first: text0[index], second: text1[index]}
        })
    }
    const min = (list: number[]): number => { return Math.min(...list) }

    const f = (pt0: ParseText, xm0: string, offset: number): Pair<Boolean, number> => {
        const text0 = currentText(pt0)
        const text1 = drop(text0, offset)
        if( text1.length < xm0.length ){
            return {first: false, second: offset}
        } else {
            const l = xm0.length
            const ok = (zip(take(text1, l), xm0).filter((pair)=>{
                return (pair.first == pair.second)
            }).length == l)

            if( ok ){
                return {first: true, second: offset}
            } else {
                return f(pt0, xm0, offset+1)
            }
        }
    }

    return (pt: ParseText): Writer<T> => {
        if( xms===SpecialChar.BEGIN || xms===SpecialChar.END ){
            if( xms===SpecialChar.BEGIN && pt.pos==0 ){
                const xs: T[] = []
                return okWriter(pt, xs)
            } else if( xms===SpecialChar.END ){
                const offset = (pt.text.length - pt.pos)
                const text = currentText(pt)
                return okWriter(
                    nextParseText(pt, offset),
                    [toSomething(text.slice(0, offset))])
            } else {
                return ngWriter(pt)
            }
        } else {
            const text = currentText(pt)
            if( text.length<1 ){
                return ngWriter(pt)
            } else {
                const list = [xms].map((xm0)=>f(pt, xm0, 0)).filter((pair)=> pair.first)
                if( list.length<1 ){
                    return ngWriter(pt)
                } else {
                    const minOffset = min( list.map((pair)=>pair.second) )
                    return okWriter(
                        nextParseText(pt, minOffset),
                        [toSomething(text.slice(0, minOffset))])
                }
            }
        }
    }
}

const none = <T>(toSomething: ToSomething<T>, t: string | SpecialChar ): Parser<T>=> {
    return (pt: ParseText): Writer<T> => {
        if( t===SpecialChar.BEGIN || t===SpecialChar.END ){
            if( t===SpecialChar.BEGIN && pt.pos==0 ){
                return ngWriter(pt)
            } else if( t===SpecialChar.END && pt.pos==pt.text.length ){
                return ngWriter(pt)
            } else {
                const xs: T[] = []
                return okWriter(pt, xs)
            }
        } else {
            const text = currentText(pt)
            if( text.length < t.length ){
                return ngWriter(pt)
            } else {
                if( text.slice(0, t.length) == t ){
                    return ngWriter(pt)
                } else {
                    return okWriter(
                        nextParseText(pt, t.length),
                        [toSomething(text.slice(0, t.length))])
                }
            }
        }
    }
}


const begin = <T>(): Parser<T>=> {
    return (pt: ParseText): Writer<T> => {
        if( pt.pos>0 ){
            return ngWriter(pt)
        } else {
            const xs: T[] = []
            return okWriter(pt, xs)
        }
    }
}

const end = <T>(): Parser<T>=> {
    return (pt: ParseText): Writer<T> => {
        if( pt.pos < pt.text.length ){
            return ngWriter(pt)
        } else {
            const xs: T[] = []
            return okWriter(pt, xs)
        }
    }
}

const anyone = <T>(toSomething: ToSomething<T>): Parser<T>=> {
    return (pt: ParseText): Writer<T> => {
        const text = currentText(pt)
        if( text.length<1 ){
            return ngWriter(pt)
        } else {
            const c = text[0]
            return okWriter(
                nextParseText(pt, 1),
                [toSomething(c)])
        }
    }
}

const reParser = <T>(toSomething: ToSomething<T>, re: RegExp): Parser<T>=> {
    return (pt: ParseText): Writer<T> => {
        const text = currentText(pt)
        if( text.length<1 ){
            return ngWriter(pt)
        } else {
            const c = text[0]
            if( re.exec(c) ){
                return okWriter(
                    nextParseText(pt, 1),
                    [toSomething(c)])
            } else {
                return ngWriter(pt)
            }
        }
    }
}

const digit = <T>(toSomething: ToSomething<T>): Parser<T>=> {
    const re = /[0-9]/
    return reParser(toSomething, re)
}

const letter = <T>(toSomething: ToSomething<T>): Parser<T>=> {
    const re = /[a-zA-Z]/
    return reParser(toSomething, re)
}

const one = <T>(toSomething: ToSomething<T>, t: string | SpecialChar ): Parser<T>=> {
    return (pt: ParseText): Writer<T> => {
        if( t===SpecialChar.BEGIN || t===SpecialChar.END ){
            if( t===SpecialChar.BEGIN && pt.pos==0 ){
                const xs: T[] = []
                return okWriter(pt, xs)
            } else if( t===SpecialChar.END && pt.pos==pt.text.length ){
                const xs: T[] = []
                return okWriter(pt, xs)
            } else {
                return ngWriter(pt)
            }
        } else {
            const text = currentText(pt)
            if( text.length < t.length ){
                return ngWriter(pt)
            } else {
                if( text.slice(0, t.length) == t ){
                    return okWriter(
                        nextParseText(pt, t.length),
                        [toSomething(t)])
                } else {
                    return ngWriter(pt)
                }
            }
        }
    }
}


type Pair<T,R> = {
    first: T
    second: R
}

const zeroOrMore = <T>(parser0: Parser<T>): Parser<T>=> {
    const f = (parser: Parser<T>, pt: ParseText, acc: T[]): Pair<ParseText, T[]> => {
        const text = currentText(pt)
        if( text.length<1 ){
            return { first: pt, second: acc }
        } else {
            const w = parser(pt)
            if( w.r.ok ){
                return f(parser, w.pt, acc.concat(w.r.xs))
            } else {
                return { first: pt, second: acc }
            }
        }
    }

    return (pt0: ParseText): Writer<T> => {
        const pair = f(parser0, pt0, [])
        return okWriter(pair.first, pair.second)
    }
}

const not = <T>(parser0: Parser<T>): Parser<T>=> {
    return (pt0: ParseText): Writer<T> => {
        const w = parser0(pt0)
        if( w.r.ok ){
            return ngWriter(pt0)
        } else {
            return okWriter(w.pt, w.r.xs)
        }
    }
}

const check = <T>(parser0: Parser<T>): Parser<T>=> {
    return (pt0: ParseText): Writer<T> => {
        const w = parser0(pt0)
        if( w.r.ok ){
            const xs: T[] = []
            return okWriter(pt0, xs)
        } else {
            return ngWriter(pt0)
        }
    }
}


const oneOrMore = <T>(parser: Parser<T>): Parser<T>=> {
    return (pt: ParseText): Writer<T> => {
        if( parser(pt).r.ok ){
            return zeroOrMore(parser)(pt)
        } else {
            return ngWriter(pt)
        }
    }
}

const and = <T>(p1: Parser<T>, p2: Parser<T>): Parser<T>=> {
    return (pt: ParseText): Writer<T> => {
        const text = currentText(pt)
        if( text.length<1 ){
            return ngWriter(pt)
        } else {
            const w1 = p1(pt)
            if( w1.r.ok ){
                const w2 = p2(w1.pt)
                if( w2.r.ok ) {
                    return okWriter(w2.pt, w1.r.xs.concat(w2.r.xs))
                } else {
                    return ngWriter(pt)
                }
            } else {
                return ngWriter(pt)
            }
        }
    }
}

const seq = <T>(...parsers: Parser<T>[]): Parser<T> => {
    if( parsers.length<1 ){
        return (pt: ParseText): Writer<T> => {
            return okWriter<T>(pt, [])
        }
    } else if( parsers.length==1 ){
        return head(parsers)
    } else {
        const initValue = head(parsers)
        return tail(parsers).reduce( (acc, p)=> {
            return and(acc, p)
        }, initValue )
    }
}

const or = <T>(p1: Parser<T>, p2: Parser<T>): Parser<T> => {
    return (pt: ParseText): Writer<T> => {
        const text = currentText(pt)
        if( text.length<1 ){
            return ngWriter(pt)
        } else {
            const w1 = p1(pt)
            if( w1.r.ok ){
                return okWriter(w1.pt, w1.r.xs)
            } else {
                const w2 = p2(pt)
                if( w2.r.ok ) {
                    return okWriter(w2.pt, w2.r.xs)
                } else {
                    return ngWriter(pt)
                }
            }
        }
    }
}

const either = <T>(...parsers: Parser<T>[]): Parser<T> => {
    if( parsers.length<1 ){
        return (pt: ParseText): Writer<T> => {
            return okWriter<T>(pt, [])
        }
    } else if( parsers.length==1 ){
        return head(parsers)
    } else {
        const initValue = head(parsers)
        return tail(parsers).reduce( (acc, p)=> {
            return or(acc, p)
        }, initValue )
    }
}

const neither = <T>(...parsers: Parser<T>[]): Parser<T> => {
    return not( either(...parsers) )
}

const option = <T>(parser: Parser<T>): Parser<T> => {
    return (pt: ParseText): Writer<T> => {
        const text = currentText(pt)
        if( text.length<1 ){
            return okWriter<T>(pt, [])
        } else {
            const w = parser(pt)
            if( w.r.ok ){
                return okWriter(w.pt, w.r.xs)
            } else {
                return okWriter<T>(pt, [])
            }
        }
    }
}

export type { Parser, ParseResult, Writer, ToSomething }
export { BEGIN, END, begin, end, parseResult, writer, runWriter, anyone, digit, letter, one, none, zeroOrMore, oneOrMore, seq, endBy, either, neither, option, check }
