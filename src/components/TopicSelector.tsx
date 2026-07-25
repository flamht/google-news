"use client"

import { types, clubs, type Topic } from "@/lib/topics"

interface TopicSelectorProps {
  selectedType: string | null
  selectedClub: string | null
  onTypeChange: (id: string | null) => void
  onClubChange: (id: string | null) => void
}

function ChipGroup({
  items,
  selected,
  onChange,
  label,
}: {
  items: Topic[]
  selected: string | null
  onChange: (id: string | null) => void
  label: string
}) {
  return (
    <div>
      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {items.map((item) => {
          const active = selected === item.id
          return (
            <button
              key={item.id}
              onClick={() => onChange(active ? null : item.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                active
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              {item.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function TopicSelector({
  selectedType,
  selectedClub,
  onTypeChange,
  onClubChange,
}: TopicSelectorProps) {
  return (
    <div className="space-y-4">
      <ChipGroup items={types} selected={selectedType} onChange={onTypeChange} label="Type" />
      <ChipGroup items={clubs} selected={selectedClub} onChange={onClubChange} label="Club / League" />
    </div>
  )
}
