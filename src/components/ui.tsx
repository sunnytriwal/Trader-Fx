import React, { ReactNode, InputHTMLAttributes, SelectHTMLAttributes } from 'react';
import { cn } from '../lib/utils';

interface InputGroupProps {
  label: string;
  rightLabel?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  htmlFor?: string;
  className?: string;
  hint?: ReactNode;
}

export function InputGroup({ label, rightLabel, icon, children, htmlFor, className, hint }: InputGroupProps) {
  return (
    <div className={cn("flex flex-col gap-[8px] w-full", className)}>
      <div className="flex justify-between items-end text-[10px] font-bold dark:text-zinc-500 text-slate-500 tracking-widest font-mono uppercase">
        <label htmlFor={htmlFor} className="flex items-center gap-2">
          {icon && <span className="dark:text-zinc-600 text-slate-400">{icon}</span>}
          {label}
        </label>
        {rightLabel && <span>{rightLabel}</span>}
      </div>
      <div className="relative">
        {children}
      </div>
      {hint && (
        <div className="text-[11px] dark:text-zinc-500 text-slate-500 font-medium">
          {hint}
        </div>
      )}
    </div>
  );
}

export const Input = React.forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { icon?: ReactNode }>(
  ({ className, icon, ...props }, ref) => {
    return (
      <div className="relative w-full group">
        {icon && (
           <div className="absolute left-3 top-1/2 -translate-y-1/2 dark:text-zinc-500 text-slate-500 pointer-events-none group-focus-within:text-cyan-400 transition-colors font-mono font-medium z-10">
             {icon}
           </div>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full dark:bg-[#16161a] bg-slate-100 border dark:border-[#2a2a2a] border-slate-200 rounded-lg p-[14px] dark:text-zinc-100 text-slate-900 text-[14px] outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 focus:dark:bg-[#111116] bg-white transition-all font-mono shadow-inner shadow-black/50 relative z-0",
            icon && "pl-[40px]",
            className
          )}
          {...props}
        />
      </div>
    )
  }
)
Input.displayName = 'Input'

export const Select = React.forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative group w-full">
        <select
          ref={ref}
          className={cn(
            "w-full dark:bg-[#16161a] bg-slate-100 border dark:border-[#2a2a2a] border-slate-200 rounded-lg p-[14px] dark:text-zinc-100 text-slate-900 text-[14px] outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 focus:dark:bg-[#111116] bg-white transition-all appearance-none cursor-pointer font-sans shadow-inner shadow-black/50",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none dark:text-zinc-500 text-slate-500 group-focus-within:text-cyan-400 transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </div>
      </div>
    )
  }
)
Select.displayName = 'Select'

