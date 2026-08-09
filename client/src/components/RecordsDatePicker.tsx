import { Calendar } from 'lucide-react'
import {
  dayLabelFromKey,
  isTodayDateKey,
  retentionCutoffDateKey,
  todayDateKey,
} from '../lib/dateKey'

interface RecordsDatePickerProps {
  value: string
  onChange: (dateKey: string) => void
  className?: string
}

export default function RecordsDatePicker({ value, onChange, className = '' }: RecordsDatePickerProps) {
  const isToday = isTodayDateKey(value)
  const minDate = retentionCutoffDateKey()
  const maxDate = todayDateKey()

  return (
    <section
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 ${className}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <Calendar size={18} className="text-amber-600 shrink-0" />
            View records for
          </p>
          <p className="text-sm text-gray-500 mt-1">{dayLabelFromKey(value)}</p>
          <p className="text-xs text-gray-400 mt-1">
            Records kept for this month and last month only
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => onChange(todayDateKey())}
            className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-colors ${
              isToday
                ? 'bg-amber-100 border-amber-300 text-amber-900'
                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            Today
          </button>

          <label className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-gray-500 shrink-0">Pick date</span>
            <input
              type="date"
              value={value}
              min={minDate}
              max={maxDate}
              onChange={(e) => {
                const next = e.target.value
                if (!next) return
                if (next < minDate) onChange(minDate)
                else if (next > maxDate) onChange(maxDate)
                else onChange(next)
              }}
              className="flex-1 sm:flex-none px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:ring-2 focus:ring-amber-400 outline-none"
            />
          </label>
        </div>
      </div>
    </section>
  )
}
