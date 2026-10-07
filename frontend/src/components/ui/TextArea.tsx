import { forwardRef, type TextareaHTMLAttributes } from 'react'

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[11px] font-semibold uppercase tracking-[0.04em] text-graphite-600 font-body"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={`w-full px-3 py-2 text-sm font-body text-graphite-950 bg-surface border rounded-button placeholder:text-graphite-400 transition-colors duration-150 hover:border-graphite-300 focus:border-graphite-400 focus:outline-none focus:ring-0 min-h-20 resize-y ${
            error ? 'border-error' : 'border-graphite-200'
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-error font-body">{error}</p>}
      </div>
    )
  }
)

TextArea.displayName = 'TextArea'
