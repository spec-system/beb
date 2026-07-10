import { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
type Size = 'sm' | 'md';

const VARIANT: Record<Variant, string> = {
  primary: 'win7-btn win7-btn-primary text-sm',
  secondary: 'win7-btn win7-btn-secondary text-sm',
  danger: 'win7-btn win7-btn-danger text-sm',
  success: 'win7-btn win7-btn-success text-sm',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-200 border border-transparent font-bold',
};
const SIZE: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  children?: ReactNode;
};

export default function Button({ variant = 'primary', size = 'md', className = '', children, ...rest }: Props) {
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none ${VARIANT[variant]} ${SIZE[size]} ${className}`}
    >
      {children}
    </button>
  );
}
