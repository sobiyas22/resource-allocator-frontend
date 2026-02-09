import React from 'react'
import clsx from 'clsx'

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, className, ...props }) => {
  return (
    <button
      className={clsx(
        'px-4 py-2 rounded-xl bg-neutral-700 text-white hover:bg-neutral-800 disabled:opacity-60 transition-colors font-medium',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button