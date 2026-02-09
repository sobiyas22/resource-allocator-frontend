import React from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbItem { label: string; href?: string }
interface BreadcrumbsProps { items: BreadcrumbItem[] }

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-neutral-500 mb-6">
      <Link to="/" className="flex items-center hover:text-neutral-900 transition-colors">
        <Home className="w-4 h-4" />
      </Link>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="w-4 h-4 text-neutral-300" />
          {item.href ? (
            <Link to={item.href} className="hover:text-neutral-900 transition-colors">{item.label}</Link>
          ) : (
            <span className="text-neutral-900 font-medium">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}