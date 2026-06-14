import React from 'react';
import ElectricBorder from './ElectricBorder';

interface BentoCardProps {
  title: string;
  description?: string;
  subtitle?: string;
  className?: string;
  accentColor?: 'blue' | 'green' | 'purple' | 'orange' | 'slate';
  cta?: {
    text: string;
    onClick?: () => void;
  };
  children?: React.ReactNode;
  bgPattern?: 'basketball' | 'court' | 'grid' | 'none';
}

export const BentoCard: React.FC<BentoCardProps> = ({
  title,
  description,
  subtitle,
  className = '',
  accentColor = 'slate',
  cta,
  children,
  bgPattern = 'none',
}) => {
  // Map accent colors to CSS classes
  const accentClasses = {
    blue: {
      border: 'hover:border-brand-blue/30 group-hover:border-brand-blue/40',
      glow: 'shadow-glow-blue border-brand-blue/10',
      text: 'text-brand-blue',
      button: 'hover:bg-brand-blue/10 hover:text-brand-blue hover:border-brand-blue/30',
    },
    green: {
      border: 'hover:border-brand-green/30 group-hover:border-brand-green/40',
      glow: 'shadow-glow-green border-brand-green/10',
      text: 'text-brand-green',
      button: 'hover:bg-brand-green/10 hover:text-brand-green hover:border-brand-green/30',
    },
    purple: {
      border: 'hover:border-brand-purple/30 group-hover:border-brand-purple/40',
      glow: 'shadow-glow-purple border-brand-purple/10',
      text: 'text-brand-purple',
      button: 'hover:bg-brand-purple/10 hover:text-brand-purple hover:border-brand-purple/30',
    },
    orange: {
      border: 'hover:border-brand-orange/30 group-hover:border-brand-orange/40',
      glow: 'shadow-glow-orange border-brand-orange/10',
      text: 'text-brand-orange',
      button: 'hover:bg-brand-orange/10 hover:text-brand-orange hover:border-brand-orange/30',
    },
    slate: {
      border: 'hover:border-brand-slate/60 group-hover:border-brand-slate/80',
      glow: 'border-bg-border',
      text: 'text-brand-offwhite/70',
      button: 'hover:bg-bg-dark hover:text-white hover:border-brand-slate',
    },
  }[accentColor];

  // Map to exact hex stroke colors for the canvas-based ElectricBorder
  const borderHexColor = {
    blue: '#3b82f6',
    green: '#10b981',
    purple: '#8b5cf6',
    orange: '#f97316',
    slate: '#71717a',
  }[accentColor];

  return (
    <ElectricBorder
      color={borderHexColor}
      borderRadius={24}
      speed={1.2}
      chaos={0.1}
      className={className}
      style={{ height: '100%' }}
    >
      <div
        className={`group relative overflow-hidden rounded-3xl border border-bg-border bg-bg-card p-6 transition-all duration-300 hover:-translate-y-1 h-full flex flex-col justify-between ${accentClasses.glow} ${accentClasses.border}`}
      >
        {/* Background patterns */}
        {bgPattern === 'basketball' && (
          <svg
            className="absolute right-0 top-0 h-48 w-48 -translate-y-10 translate-x-10 opacity-5 transition-transform duration-500 group-hover:scale-110"
            viewBox="0 0 100 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="50" cy="50" r="45" />
            <path d="M50 5v90M5 50h90" />
            <path d="M18.2 18.2c15.6 15.6 15.6 48 0 63.6M81.8 18.2c-15.6 15.6-15.6 48 0 63.6" />
          </svg>
        )}

        {bgPattern === 'court' && (
          <svg
            className="absolute inset-0 h-full w-full opacity-[0.03] transition-transform duration-700 group-hover:scale-105"
            viewBox="0 0 200 120"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.8"
          >
            {/* Half court lines */}
            <rect x="5" y="5" width="190" height="110" />
            <line x1="100" y1="5" x2="100" y2="115" />
            <circle cx="100" cy="60" r="15" />
            {/* Three point lines */}
            <path d="M5 25h15c25 0 25 70 0 70H5" />
            <path d="M195 25h-15c-25 0-25 70 0 70h15" />
            {/* Restricted area keys */}
            <rect x="5" y="45" width="30" height="30" />
            <rect x="165" y="45" width="30" height="30" />
          </svg>
        )}

        {bgPattern === 'grid' && (
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] opacity-100 transition-opacity duration-300 group-hover:opacity-100" />
        )}

        {/* Decorative colored radial glow on hover */}
        <div
          className={`absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-20 ${
            accentColor === 'blue'
              ? 'bg-brand-blue'
              : accentColor === 'green'
              ? 'bg-brand-green'
              : accentColor === 'purple'
              ? 'bg-brand-purple'
              : accentColor === 'orange'
              ? 'bg-brand-orange'
              : 'bg-zinc-500'
          }`}
        />

        <div className="relative z-10 flex h-full flex-col justify-between flex-grow">
          <div>
            {/* Top Row: Subtitle */}
            <div className="flex items-center justify-between mb-4">
              {subtitle ? (
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-offwhite/50">
                  {subtitle}
                </span>
              ) : (
                <div className="h-5" />
              )}
            </div>

            {/* Main Title & Description */}
            <h3 className="text-2xl font-black tracking-tighter text-brand-offwhite group-hover:text-white transition-colors duration-200">
              {title}
            </h3>
            {description && (
              <p className="mt-2 text-sm text-brand-offwhite/75 leading-relaxed group-hover:text-brand-offwhite/90 transition-colors duration-200">
                {description}
              </p>
            )}
          </div>

          {/* Custom content child slot */}
          {children && <div className="mt-4 flex-grow">{children}</div>}

          {/* CTA Button */}
          {cta && (
            <div className="mt-6">
              <button
                onClick={cta.onClick}
                className={`w-full rounded-xl border border-bg-border bg-bg-dark py-2.5 text-sm font-semibold text-brand-offwhite/60 transition-all duration-300 hover:shadow-lg focus:outline-none ${accentClasses.button}`}
              >
                {cta.text}
              </button>
            </div>
          )}
        </div>
      </div>
    </ElectricBorder>
  );
};
