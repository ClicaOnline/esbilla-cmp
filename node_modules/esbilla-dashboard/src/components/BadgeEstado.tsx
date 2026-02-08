// esbilla-dashboard/src/components/BadgeEstado.tsx
interface BadgeEstadoProps {
  name: 'plan-free' | 'plan-pro' | 'plan-enterprise' | 'email-verified' | 'email-pending' | 'smtp-configured';
  label?: string;
  className?: string;
}

export function BadgeEstado({ name, label, className = '' }: BadgeEstadoProps) {
  const configs = {
    'plan-free': {
      svg: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#78716C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 1 9.8a7 7 0 0 1-9 8.2Z"/>
          <path d="M11 20v-5a4 4 0 0 1 4-4h5"/>
        </svg>
      ),
      bgColor: 'bg-stone-100',
      textColor: 'text-stone-600',
      label: label || 'Free'
    },
    'plan-pro': {
      svg: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#FFBF00" stroke="#FFBF00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ),
      bgColor: 'bg-amber-100',
      textColor: 'text-amber-700',
      label: label || 'Pro'
    },
    'plan-enterprise': {
      svg: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3D2B1F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21h18"/><path d="M9 8h1"/><path d="M9 12h1"/><path d="M9 16h1"/><path d="M14 8h1"/><path d="M14 12h1"/><path d="M14 16h1"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/>
        </svg>
      ),
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-800',
      label: label || 'Enterprise'
    },
    'email-verified': {
      svg: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      ),
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
      label: label || 'Verificado'
    },
    'email-pending': {
      svg: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#78716C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
      bgColor: 'bg-stone-100',
      textColor: 'text-stone-600',
      label: label || 'Pendiente'
    },
    'smtp-configured': {
      svg: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/><path d="m16 19 2 2 4-4"/>
        </svg>
      ),
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-700',
      label: label || 'SMTP OK'
    }
  };

  const config = configs[name];

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full ${config.bgColor} ${config.textColor} text-xs font-semibold ${className}`}>
      {config.svg}
      <span>{config.label}</span>
    </div>
  );
}
