import { describe, expect, it } from 'vitest'
import { convertAll, parseBase } from './BaseConverter'

describe('parseBase', () => {
  it('各进制的正常输入', () => {
    expect(parseBase('255', 10)).toBe(255)
    expect(parseBase('ff', 16)).toBe(255)
    expect(parseBase('FF', 16)).toBe(255)
    expect(parseBase('0x1F', 16)).toBe(31)
    expect(parseBase('1010', 2)).toBe(10)
    expect(parseBase('  42  ', 10)).toBe(42)
    // 前导零是合法写法，不应判为无效
    expect(parseBase('007', 8)).toBe(7)
    expect(parseBase('0', 10)).toBe(0)
  })

  // 修复前：负数直接 toString 得到 "0b-5"，parseInt("08", 8) 则静默返回 0
  it('拒绝负数', () => {
    expect(parseBase('-5', 10)).toBeNull()
    expect(parseBase('-0', 10)).toBeNull()
  })

  it('拒绝当前进制里的非法数字，不做静默截断', () => {
    expect(parseBase('08', 8)).toBeNull()
    expect(parseBase('2', 2)).toBeNull()
    expect(parseBase('5a', 10)).toBeNull()
    expect(parseBase('1', 2)).toBe(1)
  })

  it('拒绝空串', () => {
    expect(parseBase('', 10)).toBeNull()
    expect(parseBase('   ', 10)).toBeNull()
  })
})

describe('convertAll', () => {
  it('输出四个进制的表示', () => {
    expect(convertAll('255', 10)).toEqual({
      2: '0b11111111',
      8: '0o377',
      10: '255',
      16: '0xFF',
    })
    expect(convertAll('ff', 16)).toEqual({
      2: '0b11111111',
      8: '0o377',
      10: '255',
      16: '0xFF',
    })
  })

  it('无效输入时四个卡片都显示无效输入', () => {
    const invalid = { 2: '无效输入', 8: '无效输入', 10: '无效输入', 16: '无效输入' }
    expect(convertAll('-5', 10)).toEqual(invalid)
    expect(convertAll('08', 8)).toEqual(invalid)
    expect(convertAll('', 10)).toEqual(invalid)
  })
})