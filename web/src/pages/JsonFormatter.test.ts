import { describe, expect, it } from 'vitest'
import { parseLenient } from './JsonFormatter'

describe('parseLenient', () => {
  it('严格合法的 JSON 原样解析', () => {
    expect(parseLenient('{"a":1}')).toEqual({ a: 1 })
    expect(parseLenient('[1,2,3]')).toEqual([1, 2, 3])
    expect(parseLenient('{"a":"he said \'hi\' ok"}')).toEqual({ a: "he said 'hi' ok" })
  })

  // 修复前：去注释与单引号替换会改写字符串内容，把本可解析的输入弄坏
  it('字符串里的 // 不被当成注释', () => {
    expect(parseLenient('{url: "https://a.com//b", n: 1}')).toEqual({
      url: 'https://a.com//b',
      n: 1,
    })
    expect(parseLenient('{url: \'https://a.com//b\', n: 4}')).toEqual({
      url: 'https://a.com//b',
      n: 4,
    })
    expect(parseLenient('{path: "C://tmp//x"}')).toEqual({ path: 'C://tmp//x' })
    expect(parseLenient('{"url":"https://a.com/x//y", /* note */ "n":1}')).toEqual({
      url: 'https://a.com/x//y',
      n: 1,
    })
  })

  it('宽松能力不因上述修复而退化', () => {
    expect(parseLenient('{a: 1, b: 2}')).toEqual({ a: 1, b: 2 })
    expect(parseLenient('{"a":1,}')).toEqual({ a: 1 })
    expect(parseLenient("{a: 'x', b: 'y'}")).toEqual({ a: 'x', b: 'y' })
    expect(parseLenient('{a: 1, // 注释\n b: 2}')).toEqual({ a: 1, b: 2 })
    expect(parseLenient('{/*块*/a: 1}')).toEqual({ a: 1 })
    expect(parseLenient('{a: "it\'s ok", n: 2}')).toEqual({ a: "it's ok", n: 2 })
    expect(parseLenient("{'a':'b',}")).toEqual({ a: 'b' })
    expect(parseLenient('{"a":[{"b":1,}]}')).toEqual({ a: [{ b: 1 }] })
  })

  it('双引号字符串内的撇号不被单引号替换破坏', () => {
    expect(parseLenient('{a: "it\'s ok", n: 2}')).toEqual({ a: "it's ok", n: 2 })
  })

  it('确实是坏输入时抛出', () => {
    expect(() => parseLenient('{bad}')).toThrow()
    expect(() => parseLenient('   ')).toThrow('请输入 JSON')
  })
})