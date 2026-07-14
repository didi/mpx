import { ExpressionParser, parseFunc, ReplaceSource } from '../../../lib/runtime/components/react/parser'

describe('react runtime parser helpers', () => {
  it('parses arithmetic expressions with units, functions and unary negatives', () => {
    const parser = new ExpressionParser(
      'max(10px + 5px * 2, (-4px + 20px) / 2)',
      (value) => parseFloat(value),
      {
        max: Math.max
      }
    )

    expect(parser.parse()).toEqual({
      type: 'NUMBER',
      value: 20
    })
  })

  it('throws readable errors for malformed expressions', () => {
    expect(() => new ExpressionParser('(1 + 2,').parse()).toThrow('Expected closing parenthesis')
    expect(() => new ExpressionParser('(1 + 2').parse()).toThrow()
    expect(() => new ExpressionParser('min 1', undefined, { min: Math.min }).parse()).toThrow('Expected opening parenthesis after function')
    expect(() => new ExpressionParser('foo(1)', undefined, {}).parse()).toThrow('Unexpected token: foo')
  })

  it('extracts nested function calls and arguments', () => {
    expect(parseFunc('calc(10px + max(1px, 2px)) var(--x, rgb(1, 2, 3))', 'calc')).toEqual([
      {
        start: 0,
        end: 26,
        args: ['10px + max(1px, 2px)']
      }
    ])

    expect(parseFunc('var(--x, rgb(1, 2, 3)) var(--y)', 'var')).toEqual([
      {
        start: 0,
        end: 22,
        args: ['--x', 'rgb(1, 2, 3)']
      },
      {
        start: 23,
        end: 31,
        args: ['--y']
      }
    ])
  })

  it('applies ordered source replacements with inclusive end offsets', () => {
    const source = new ReplaceSource('linear-gradient(red, blue) url(hero.png)')

    source.replace(0, 25, 'gradient')
    source.replace(27, 39, 'image')

    expect(source.source()).toBe('gradient image')
    expect(new ReplaceSource('unchanged').source()).toBe('unchanged')
  })
})
