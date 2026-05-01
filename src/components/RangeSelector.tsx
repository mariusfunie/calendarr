'use client'

const OPTIONS = [7, 14, 30, 60] as const
export type DayRange = typeof OPTIONS[number]

interface Props {
  value: DayRange
  onChange: (v: DayRange) => void
}

export default function RangeSelector({ value, onChange }: Props) {
  return (
    <div className="flex gap-1 bg-[#11111c] border border-[#1e1e32] rounded-xl p-1">
      {OPTIONS.map(d => (
        <button
          key={d}
          onClick={() => onChange(d)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            value === d ? 'bg-[#4f46e5] text-white' : 'text-[#6b6b8a] hover:text-[#e8e8f4]'
          }`}
        >
          {d}d
        </button>
      ))}
    </div>
  )
}
