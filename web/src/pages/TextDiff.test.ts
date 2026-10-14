import { describe, expect, it } from 'vitest'
import { diffLines } from './TextDiff'

describe('diffLines', () => {
  it('相同文本全部标为 same', () => {
    expect(diffLines('a\nb', 'a\nb')).toEqual([
      { type: 'same', line: 'a' },
      { type: 'same', line: 'b' },
    ])
  })

  // 修复前：'abc\n' 切出 ['abc','']，与 'abc' 逐项比较会多出一条空删除行
  it('仅结尾换行不同不算差异', () => {
    expect(diffLines('abc\n', 'abc')).toEqual([{ type: 'same', line: 'abc' }])
    expect(diffLines('abc', 'abc\n')).toEqual([{ type: 'same', line: 'abc' }])
    expect(diffLines('abc\n', 'abc\n')).toEqual([{ type: 'same', line: 'abc' }])
    expect(diffLines('a\nb\n', 'a\nb')).toEqual([
      { type: 'same', line: 'a' },
      { type: 'same', line: 'b' },
    ])
  })

  it('真正的空行仍然保留', () => {
    expect(diffLines('a\n\n', 'a\n')).toEqual([
      { type: 'same', line: 'a' },
      { type: 'remove', line: '' },
    ])
    expect(diffLines('a\n\nb', 'a\n\nb')).toEqual([
      { type: 'same', line: 'a' },
      { type: 'same', line: '' },
      { type: 'same', line: 'b' },
    ])
  })

  it('逐行差异', () => {
    expect(diffLines('a\nb\nc', 'a\nx\nc')).toEqual([
      { type: 'same', line: 'a' },
      { type: 'remove', line: 'b' },
      { type: 'add', line: 'x' },
      { type: 'same', line: 'c' },
    ])
  })

  it('行数不同时只输出存在的一侧', () => {
    expect(diffLines('a\nb', 'a')).toEqual([
      { type: 'same', line: 'a' },
      { type: 'remove', line: 'b' },
    ])
  })

  it('一侧为空', () => {
    expect(diffLines('a', '')).toEqual([{ type: 'remove', line: 'a' }])
    expect(diffLines('', 'a')).toEqual([{ type: 'add', line: 'a' }])
  })
})