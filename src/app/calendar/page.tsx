'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Tv2, Film } from 'lucide-react'
import MediaModal from '@/components/MediaModal'
import type { EnrichedEpisode, EnrichedMovie } from '../api/calendar/route'

type Item = EnrichedEpisode | EnrichedMovie

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function CalendarPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Item | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch('/api/calendar?type=all&days=90')
      .then(r => r.json())
      .then(d => {
        const eps: Item[] = (d.episodes ?? [])
        const mvs: Item[] = (d.movies ?? [])
        setItems([...eps, ...mvs])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date().toISOString().split('T')[0]

  const byDate = new Map<string, Item[]>()
  for (const item of items) {
    const d = item.releaseDate
    if (!d) continue
    if (!byDate.has(d)) byDate.set(d, [])
    byDate.get(d)!.push(item)
  }

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#e8e8f4]">Calendar</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="w-8 h-8 rounded-lg bg-[#17172a] border border-[#1e1e32] flex items-center justify-center text-[#6b6b8a] hover:text-[#e8e8f4] transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-[#e8e8f4] font-semibold min-w-[160px] text-center">{monthName}</span>
          <button
            onClick={nextMonth}
            className="w-8 h-8 rounded-lg bg-[#17172a] border border-[#1e1e32] flex items-center justify-center text-[#6b6b8a] hover:text-[#e8e8f4] transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="rounded-2xl border border-[#1e1e32] overflow-hidden">
        {/* Day names */}
        <div className="grid grid-cols-7 bg-[#11111c]">
          {DAY_NAMES.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-[#6b6b8a] py-3 border-b border-[#1e1e32]">
              {d}
            </div>
          ))}
        </div>

        {/* Cells */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            const dateStr = day ? isoDate(year, month, day) : ''
            const dayItems = day ? (byDate.get(dateStr) ?? []) : []
            const isToday = dateStr === today
            const isPast = day ? dateStr < today : false

            return (
              <div
                key={idx}
                className={`min-h-[90px] p-1.5 border-b border-r border-[#1e1e32] last:border-r-0 ${
                  !day ? 'bg-[#09090f]' : isPast ? 'bg-[#0a0a15]' : 'bg-[#11111c]'
                }`}
              >
                {day && (
                  <>
                    <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                      isToday
                        ? 'bg-[#4f46e5] text-white'
                        : isPast
                        ? 'text-[#4a4a62]'
                        : 'text-[#9090b8]'
                    }`}>
                      {day}
                    </span>

                    <div className="space-y-0.5">
                      {dayItems.slice(0, 3).map((item, i) => {
                        const isEp = item.kind === 'episode'
                        const title = isEp
                          ? (item as EnrichedEpisode).series.title
                          : (item as EnrichedMovie).title
                        return (
                          <button
                            key={i}
                            onClick={() => setSelected(item)}
                            className={`w-full flex items-center gap-1 rounded px-1 py-0.5 text-left hover:opacity-80 transition-opacity ${
                              isEp ? 'bg-[#6d28d9]/20 text-[#c4b5fd]' : 'bg-[#0e7490]/20 text-[#67e8f9]'
                            }`}
                          >
                            {isEp ? <Tv2 size={8} className="flex-shrink-0" /> : <Film size={8} className="flex-shrink-0" />}
                            <span className="text-[10px] font-medium truncate leading-tight">{title}</span>
                          </button>
                        )
                      })}
                      {dayItems.length > 3 && (
                        <p className="text-[9px] text-[#6b6b8a] px-1">+{dayItems.length - 3} more</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {loading && (
        <p className="text-center text-[#6b6b8a] text-sm">Loading calendar data...</p>
      )}

      {selected && <MediaModal item={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
