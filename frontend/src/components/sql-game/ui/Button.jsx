const variants = {
  primary:   'bg-sql-primary text-background font-bold hover:opacity-90 shadow-[0_0_12px_rgba(0,255,65,0.3)]',
  secondary: 'border border-sql-secondary text-sql-secondary hover:bg-sql-secondary/10',
  outlined:  'border border-border text-accent hover:border-accent',
  inverted:  'bg-[#E0D7FF] text-background hover:opacity-90',
}

export function Button({ variant = 'outlined', className = '', children, ...props }) {
  return (
    <button
      className={`px-4 py-1.5 rounded text-sm font-mono transition-all ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
