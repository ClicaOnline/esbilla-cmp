// esbilla-dashboard/src/components/IntegrationIcon.tsx
import * as simpleIcons from 'simple-icons';

interface IntegrationIconProps {
  name:
    // Analytics
    | 'googleanalytics' | 'hotjar' | 'amplitude' | 'crazyegg' | 'vwo' | 'optimizely' | 'microsoftclarity'
    // Marketing
    | 'facebook' | 'linkedin' | 'tiktok' | 'googleads' | 'microsoftbing' | 'criteo'
    | 'pinterest' | 'x' | 'taboola' | 'youtube' | 'hubspot'
    // Functional
    | 'intercom' | 'zendesk';
  size?: number;
  className?: string;
}

/**
 * Componente para mostrar iconos de integraciones de terceros
 * Usa la librería simple-icons para obtener los logos oficiales
 *
 * Categorías:
 * - Analytics: Google Analytics, Hotjar, Amplitude, Crazy Egg, VWO, Optimizely, Microsoft Clarity
 * - Marketing: Facebook, LinkedIn, TikTok, Google Ads, Microsoft Ads, Criteo, Pinterest, X/Twitter, Taboola, YouTube, HubSpot
 * - Functional: Intercom, Zendesk
 */
export function IntegrationIcon({ name, size = 32, className = '' }: IntegrationIconProps) {
  // Mapeo de nombres internos a nombres de Simple Icons
  const iconMap: Record<string, string> = {
    'googleanalytics': 'siGoogleanalytics',
    'hotjar': 'siHotjar',
    'amplitude': 'siAmplitude',
    'crazyegg': 'siCrazyegg',
    'vwo': 'siVwo',
    'optimizely': 'siOptimizely',
    'microsoftclarity': 'siMicrosoftclarity',
    'facebook': 'siFacebook',
    'linkedin': 'siLinkedin',
    'tiktok': 'siTiktok',
    'googleads': 'siGoogleads',
    'microsoftbing': 'siMicrosoftbing',
    'criteo': 'siCriteo',
    'pinterest': 'siPinterest',
    'x': 'siX',
    'taboola': 'siTaboola',
    'youtube': 'siYoutube',
    'hubspot': 'siHubspot',
    'intercom': 'siIntercom',
    'zendesk': 'siZendesk'
  };

  const iconKey = iconMap[name];

  // @ts-ignore - Simple Icons usa dynamic keys
  const icon = iconKey ? simpleIcons[iconKey] : null;

  if (!icon) {
    // Fallback: icono genérico
    return (
      <div
        className={`inline-flex items-center justify-center rounded-lg bg-stone-100 ${className}`}
        style={{ width: size, height: size }}
      >
        <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      title={icon.title}
    >
      <svg
        role="img"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill={`#${icon.hex}`}
        dangerouslySetInnerHTML={{ __html: icon.path }}
      />
    </div>
  );
}

/**
 * Componente alternativo: Badge con icono y label
 */
interface IntegrationBadgeProps extends IntegrationIconProps {
  label?: string;
  showLabel?: boolean;
}

export function IntegrationBadge({ name, label, showLabel = true, size = 24, className = '' }: IntegrationBadgeProps) {
  const iconMap: Record<string, string> = {
    'googleanalytics': 'siGoogleanalytics',
    'hotjar': 'siHotjar',
    'amplitude': 'siAmplitude',
    'crazyegg': 'siCrazyegg',
    'vwo': 'siVwo',
    'optimizely': 'siOptimizely',
    'microsoftclarity': 'siMicrosoftclarity',
    'facebook': 'siFacebook',
    'linkedin': 'siLinkedin',
    'tiktok': 'siTiktok',
    'googleads': 'siGoogleads',
    'microsoftbing': 'siMicrosoftbing',
    'criteo': 'siCriteo',
    'pinterest': 'siPinterest',
    'x': 'siX',
    'taboola': 'siTaboola',
    'youtube': 'siYoutube',
    'hubspot': 'siHubspot',
    'intercom': 'siIntercom',
    'zendesk': 'siZendesk'
  };

  const iconKey = iconMap[name];
  // @ts-ignore
  const icon = iconKey ? simpleIcons[iconKey] : null;

  const displayLabel = label || icon?.title || name;

  return (
    <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-stone-50 border border-stone-200 ${className}`}>
      <IntegrationIcon name={name} size={size} />
      {showLabel && (
        <span className="text-xs font-medium text-stone-700">{displayLabel}</span>
      )}
    </div>
  );
}
