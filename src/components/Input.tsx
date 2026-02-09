import React from 'react'
import clsx from 'clsx'

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  name?: string
  error?: string | null
}

const Input = React.forwardRef<HTMLInputElement, Props>(({ label, error, className, ...props }, ref) => {
  return (
    <div className={clsx('mb-3', className)}>
      {label && <label className="block text-sm font-medium text-neutral-700 mb-1">{label}</label>}
      <input
        ref={ref}
        className={clsx(
          'w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-300 border-neutral-300 bg-white transition-all',
          error && 'border-red-500 focus:ring-red-200'
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
})

Input.displayName = 'Input'
export default Input