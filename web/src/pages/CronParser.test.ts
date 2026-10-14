import { describe, expect, it } from 'vitest'
import { describeCron, getNextRuns } from './CronParser'

const WEEKDAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

function nextRuns(expr: string, count = 3): string[] {
  return getNextRuns(expr, count).map(
    run => `${run.getMonth() + 1}/${run.getDate()} ${WEEKDAY_NAMES[run.getDay()]} ${run.getHours()}:${String(run.getMinutes()).padStart(2, '0')}`
  )
}

describe('getNextRuns 星期字段', () => {
  // 修复前：cron 的 7 表示星期日，而 getDay() 的星期日是 0，永远匹配不上
  it('7 与 0 都表示星期日', () => {
    for (const expr of ['0 9 * * 7', '0 9 * * 0']) {
      const runs = nextRuns(expr)
      expect(runs).toHaveLength(3)
      expect(runs.every(run => run.includes('周日'))).toBe(true)
    }
    expect(nextRuns('0 9 * * 7')).toEqual(nextRuns('0 9 * * 0'))
  })

  it('区间右端点写 7 也算星期日', () => {
    // 1-7 是常见的"每天"写法，此前漏掉星期日
    const everyDay = nextRuns('0 9 * * 1-7', 7)
    expect(everyDay).toHaveLength(7)
    expect(new Set(everyDay.map(run => run.split(' ')[1])).size).toBe(7)

    expect(nextRuns('0 9 * * 5-7').map(run => run.split(' ')[1])).toEqual([
      '周五',
      '周六',
      '周日',
    ])
    expect(nextRuns('0 9 * * 1,7').map(run => run.split(' ')[1])).toEqual([
      '周日',
      '周一',
      '周日',
    ])
  })

  it('不含 7 的星期字段行为不变', () => {
    expect(nextRuns('0 9 * * 3').map(run => run.split(' ')[1])).toEqual([
      '周三',
      '周三',
      '周三',
    ])
    expect(nextRuns('0 9 * * 1-5').map(run => run.split(' ')[1])).toEqual([
      '周四',
      '周五',
      '周一',
    ])
  })

  it('* 与步长表达式仍走通用逻辑', () => {
    const every15 = nextRuns('*/15 * * * *', 2)
    expect(every15).toHaveLength(2)
    for (const run of every15) {
      expect(Number(run.split(' ')[2].split(':')[1]) % 15).toBe(0)
    }
  })

  it('字段数不对时返回空', () => {
    expect(getNextRuns('0 9 * *', 3)).toEqual([])
  })
})

describe('describeCron', () => {
  it('星期 7 显示为周日而不是数字', () => {
    expect(describeCron('0 9 * * 7')).toContain('周日')
    expect(describeCron('0 9 * * 1-7')).toBe('0 分，9 时，在 周一 到 周日')
    expect(describeCron('*/5 * * * *')).toBe('从 0 开始，每隔 5 个 分')
    expect(describeCron('0 9 1 * 1')).toBe('0 分，9 时，1 号，在 周一')
  })

  it('字段数不对时给出提示', () => {
    expect(describeCron('0 9 * *')).toBe('需要 5 个字段：分 时 日 月 周')
  })
})