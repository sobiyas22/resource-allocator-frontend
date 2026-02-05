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
      {label && <label className="block text-sm font-medium mb-1">{label}</label>}
      <input
        ref={ref}
        className={clsx('w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-200', error && 'border-red-500')}
        {...props}
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
})

Input.displayName = 'Input'
export default Input