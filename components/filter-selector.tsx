"use client"

import { type FilterType, filters, type FilmSliders, presetSliders } from "@/lib/filters"

interface FilterSelectorProps {
  selectedFilter: FilterType
  onFilterChange: (filter: FilterType) => void
  sliders: FilmSliders
  onSlidersChange: (sliders: FilmSliders) => void
}

export function FilterSelector({ selectedFilter, onFilterChange, sliders, onSlidersChange }: FilterSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 justify-center">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => {
              onFilterChange(filter.id)
              if (filter.id !== "none") onSlidersChange(presetSliders(filter.id))
            }}
            className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
              selectedFilter === filter.id
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105 ring-2 ring-primary/50"
                : "bg-muted/50 text-foreground hover:bg-muted hover:scale-105 border border-border/50"
            }`}
          >
            {filter.name}
          </button>
        ))}
      </div>

      {selectedFilter !== "none" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SliderRow
            label="Intensity"
            value={sliders.intensity}
            onChange={(v) => onSlidersChange({ ...sliders, intensity: v })}
          />
          <SliderRow label="Grain" value={sliders.grain} onChange={(v) => onSlidersChange({ ...sliders, grain: v })} />
          <SliderRow label="Fade" value={sliders.fade} onChange={(v) => onSlidersChange({ ...sliders, fade: v })} />
          <SliderRow
            label="Warmth"
            value={sliders.warmth}
            onChange={(v) => onSlidersChange({ ...sliders, warmth: v })}
          />
          <SliderRow
            label="Softness"
            value={sliders.softness}
            onChange={(v) => onSlidersChange({ ...sliders, softness: v })}
          />
          <SliderRow
            label="Chroma"
            value={sliders.chroma}
            onChange={(v) => onSlidersChange({ ...sliders, chroma: v })}
          />
          <SliderRow label="Flash" value={sliders.flash} onChange={(v) => onSlidersChange({ ...sliders, flash: v })} />
        </div>
      )}
    </div>
  )
}

function SliderRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="bg-muted/30 border border-border/50 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold text-foreground">{label}</div>
        <div className="text-xs text-muted-foreground tabular-nums">{Math.round(value * 100)}%</div>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  )
}
