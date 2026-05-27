export const Pill = ({ children, icon, className = '' }) => {
  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 bg-gold/10 border border-gold/20 rounded-full text-11px font-bold text-gold uppercase tracking-wider ${className}`}
    >
      {icon && <span>{icon}</span>}
      {children}
    </div>
  )
}
