import React from 'react'
import clsx from 'clsx'

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, className, ...props }) => {
  return (
    <button
      className={clsx('px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60', className)}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button