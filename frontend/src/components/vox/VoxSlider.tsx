/**
 * VoxSlider Component
 * Glass-morphism styled range slider with synchronized number input
 */

'use client'

import { useCallback } from 'react'

interface VoxSliderProps {
  name: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  label?: string
  className?: string
}

export function VoxSlider({
  name,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  label,
  className = '',
}: VoxSliderProps) {
  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(parseFloat(e.target.value))
    },
    [onChange]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseFloat(e.target.value)
      if (!isNaN(newValue)) {
        // Clamp value to min/max
        const clampedValue = Math.min(max, Math.max(min, newValue))
        onChange(clampedValue)
      }
    },
    [onChange, min, max]
  )

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const newValue = parseFloat(e.target.value)
      if (isNaN(newValue)) {
        onChange(min)
      } else {
        const clampedValue = Math.min(max, Math.max(min, newValue))
        // Round to step precision
        const roundedValue = Math.round(clampedValue / step) * step
        onChange(roundedValue)
      }
    },
    [onChange, min, max, step]
  )

  // Calculate percentage for slider track fill
  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm text-slate-400">{label}</label>
      )}
      <div className="flex items-center gap-3">
        {/* Range Slider */}
        <div className="flex-1 relative">
          <input
            type="range"
            name={`${name}_slider`}
            value={value}
            onChange={handleSliderChange}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            className="vox-slider w-full h-2 rounded-full appearance-none cursor-pointer
              bg-white/10 backdrop-blur-sm
              disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: `linear-gradient(to right, rgba(99, 102, 241, 0.5) 0%, rgba(99, 102, 241, 0.5) ${percentage}%, rgba(255, 255, 255, 0.1) ${percentage}%, rgba(255, 255, 255, 0.1) 100%)`,
            }}
          />
          <style jsx global>{`
            .vox-slider::-webkit-slider-thumb {
              appearance: none;
              width: 18px;
              height: 18px;
              border-radius: 50%;
              background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%);
              border: 2px solid rgba(255, 255, 255, 0.3);
              cursor: pointer;
              box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
              transition: transform 0.15s ease, box-shadow 0.15s ease;
            }
            .vox-slider::-webkit-slider-thumb:hover {
              transform: scale(1.1);
              box-shadow: 0 4px 12px rgba(99, 102, 241, 0.6);
            }
            .vox-slider::-moz-range-thumb {
              width: 18px;
              height: 18px;
              border-radius: 50%;
              background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%);
              border: 2px solid rgba(255, 255, 255, 0.3);
              cursor: pointer;
              box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
              transition: transform 0.15s ease, box-shadow 0.15s ease;
            }
            .vox-slider::-moz-range-thumb:hover {
              transform: scale(1.1);
              box-shadow: 0 4px 12px rgba(99, 102, 241, 0.6);
            }
            .vox-slider:disabled::-webkit-slider-thumb {
              cursor: not-allowed;
              opacity: 0.5;
            }
            .vox-slider:disabled::-moz-range-thumb {
              cursor: not-allowed;
              opacity: 0.5;
            }
          `}</style>
        </div>

        {/* Number Input */}
        <input
          type="number"
          name={`${name}_input`}
          value={value}
          onChange={handleInputChange}
          onBlur={handleBlur}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className="w-20 h-10 rounded-lg border border-white/10 bg-white/5 backdrop-blur-md
            px-3 py-2 text-sm text-white text-center
            focus:outline-none focus:ring-2 focus:ring-vox-idle/50 focus:border-vox-idle/50
            disabled:cursor-not-allowed disabled:opacity-50
            transition-all duration-200
            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      </div>
    </div>
  )
}

export default VoxSlider
