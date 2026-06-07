export const Button = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  ...props
}) => {
  const baseStyles =
    'font-medium rounded-sm transition-all duration-200 flex items-center justify-center gap-2'

  const variantStyles = {
    primary: 'bg-gold text-navy hover:bg-gold-2',
    secondary: 'bg-navy-3 border border-bd2 text-txt hover:bg-navy-4',
    ghost: 'text-txs hover:text-txt',
  }

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-11px',
    md: 'px-4 py-2 text-13px',
    lg: 'px-6 py-3 text-14px',
  }

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant] || variantStyles.primary} ${sizeStyles[size] || sizeStyles.md} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
