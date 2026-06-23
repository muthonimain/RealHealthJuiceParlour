import { Calendar } from 'lucide-react'
import {
  dayLabelFromKey,
  isTodayDateKey,
  offsetDateKey,
  todayDateKey,
} from '../lib/dateKey'

interface RecordsDatePickerProps {
  value: string
  onChange: (dateKey: string) => void
  className?: string
}

export default function RecordsDatePicker({ value, onChange, className = '' }: RecordsDatePickerProps) {
  const yesterday = offsetDateKey(todayDateKey(), -1)
  const isToday = isTodayDateKey(value)

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
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onChange(yesterday)}
              className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                value === yesterday
                  ? 'bg-amber-100 border-amber-300 text-amber-900'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              Yesterday
            </button>
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
          </div>

          <label className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-gray-500 shrink-0">Pick date</span>
            <input
              type="date"
              value={value}
              max={todayDateKey()}
              onChange={(e) => e.target.value && onChange(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:ring-2 focus:ring-amber-400 outline-none"
            />
          </label>
        </div>
      </div>
    </section>
  )
}
