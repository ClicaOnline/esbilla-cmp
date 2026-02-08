<?php
/**
 * Clase para integrar el Pegoyu de Esbilla en el frontend
 *
 * @package EsbillaCMP
 */

// Si se accede directamente, salir
if (!defined('ABSPATH')) {
    exit;
}

class Esbilla_SDK {

    /**
     * Opciones del plugin
     */
    private $options;

    /**
     * Constructor
     */
    public function __construct() {
        $this->options = get_option('esbilla_settings', array());
    }

    /**
     * Inyecta el Pegoyu de Esbilla en el <head>
     */
    public function inject_sdk() {
        // Verificar que esté habilitado y configurado
        if (empty($this->options['enabled']) || empty($this->options['site_id'])) {
            return;
        }

        $site_id = esc_attr($this->options['site_id']);
        $api_url = esc_url($this->options['api_url']);
        $mode = $this->options['implementation_mode'] ?? 'manual';

        // URL del Pegoyu
        $sdk_url = trailingslashit($api_url) . 'pegoyu.js';

        echo "\n<!-- Esbilla CMP Pegoyu v" . ESBILLA_SDK_VERSION . " (Performance Optimized) -->\n";

        // Config inline para G100 y otras opciones
        $enable_g100 = !empty($this->options['enable_g100']);
        ?>
        <script>
        window.esbillaConfig = window.esbillaConfig || {};
        window.esbillaConfig.enableG100 = <?php echo $enable_g100 ? 'true' : 'false'; ?>;
        </script>
        <?php

        // Resource hints para mejorar rendimiento
        $parsed_url = parse_url($api_url);
        $api_origin = $parsed_url['scheme'] . '://' . $parsed_url['host'];

        echo '<link rel="dns-prefetch" href="' . esc_url($api_origin) . '">' . "\n";
        echo '<link rel="preconnect" href="' . esc_url($api_origin) . '" crossorigin>' . "\n";

        // Atributos base del script
        $attributes = array(
            'src' => $sdk_url,
            'data-id' => $site_id,
            'data-api' => $api_url,
        );

        // Inyectar CSS personalizado si existe (inline crítico)
        if (!empty($this->options['custom_css'])) {
            echo '<style id="esbilla-custom-css">' . "\n";
            echo wp_strip_all_tags($this->options['custom_css']) . "\n";
            echo '</style>' . "\n";
        }

        // Modo de implementación
        switch ($mode) {
            case 'gtm':
                $this->inject_gtm_mode($attributes);
                break;

            case 'simplified':
                $this->inject_simplified_mode($attributes);
                break;

            case 'manual':
            default:
                $this->inject_manual_mode($attributes);
                break;
        }

        echo "<!-- /Esbilla CMP Pegoyu -->\n\n";
    }

    /**
     * Modo Manual: El usuario modifica scripts a type="text/plain"
     */
    private function inject_manual_mode($attributes) {
        // Lazy load del Pegoyu después del LCP para no impactar Core Web Vitals
        ?>
        <script>
        (function() {
            function loadEsbillaPegoyu() {
                var script = document.createElement('script');
                <?php foreach ($attributes as $key => $value): ?>
                script.setAttribute('<?php echo esc_js($key); ?>', '<?php echo esc_js($value); ?>');
                <?php endforeach; ?>
                script.defer = true;
                document.head.appendChild(script);
            }

            // Cargar después de que el contenido principal esté listo
            if ('requestIdleCallback' in window) {
                requestIdleCallback(loadEsbillaPegoyu, { timeout: 2000 });
            } else {
                setTimeout(loadEsbillaPegoyu, 1000);
            }
        })();
        </script>
        <?php
        echo '<!-- Modo Manual: Cambia type="text/javascript" a type="text/plain" en scripts de marketing/analytics -->' . "\n";
        echo '<!-- Ejemplo: <script type="text/plain" data-category="analytics" src="..."></script> -->' . "\n";
    }

    /**
     * Modo Simplificado: Configurar IDs en dashboard, SDK carga scripts
     */
    private function inject_simplified_mode($attributes) {
        $script_config = array();

        // Analytics
        if (!empty($this->options['google_analytics_id'])) {
            $script_config['analytics']['googleAnalytics'] = $this->options['google_analytics_id'];
        }
        if (!empty($this->options['hotjar_id'])) {
            $script_config['analytics']['hotjar'] = $this->options['hotjar_id'];
        }
        if (!empty($this->options['microsoft_clarity_id'])) {
            $script_config['analytics']['microsoftClarity'] = $this->options['microsoft_clarity_id'];
        }
        if (!empty($this->options['amplitude_id'])) {
            $script_config['analytics']['amplitude'] = $this->options['amplitude_id'];
        }
        if (!empty($this->options['crazyegg_id'])) {
            $script_config['analytics']['crazyEgg'] = $this->options['crazyegg_id'];
        }
        if (!empty($this->options['vwo_id'])) {
            $script_config['analytics']['vwo'] = $this->options['vwo_id'];
        }
        if (!empty($this->options['optimizely_id'])) {
            $script_config['analytics']['optimizely'] = $this->options['optimizely_id'];
        }
        if (!empty($this->options['sealmetrics_id'])) {
            $script_config['analytics']['sealmetrics'] = $this->options['sealmetrics_id'];
        }

        // Marketing
        if (!empty($this->options['facebook_pixel_id'])) {
            $script_config['marketing']['facebookPixel'] = $this->options['facebook_pixel_id'];
        }
        if (!empty($this->options['linkedin_insight_id'])) {
            $script_config['marketing']['linkedinInsight'] = $this->options['linkedin_insight_id'];
        }
        if (!empty($this->options['tiktok_pixel_id'])) {
            $script_config['marketing']['tiktokPixel'] = $this->options['tiktok_pixel_id'];
        }
        if (!empty($this->options['google_ads_id'])) {
            $script_config['marketing']['googleAds'] = $this->options['google_ads_id'];
        }
        if (!empty($this->options['microsoft_ads_id'])) {
            $script_config['marketing']['microsoftAds'] = $this->options['microsoft_ads_id'];
        }
        if (!empty($this->options['criteo_id'])) {
            $script_config['marketing']['criteo'] = $this->options['criteo_id'];
        }
        if (!empty($this->options['pinterest_id'])) {
            $script_config['marketing']['pinterest'] = $this->options['pinterest_id'];
        }
        if (!empty($this->options['twitter_pixel_id'])) {
            $script_config['marketing']['twitterPixel'] = $this->options['twitter_pixel_id'];
        }
        if (!empty($this->options['taboola_id'])) {
            $script_config['marketing']['taboola'] = $this->options['taboola_id'];
        }
        if (!empty($this->options['hubspot_id'])) {
            $script_config['marketing']['hubspot'] = $this->options['hubspot_id'];
        }
        if (!empty($this->options['uinterbox_id'])) {
            $script_config['marketing']['uinterbox'] = $this->options['uinterbox_id'];
        }

        // Functional
        if (!empty($this->options['intercom_id'])) {
            $script_config['functional']['intercom'] = $this->options['intercom_id'];
        }
        if (!empty($this->options['zendesk_id'])) {
            $script_config['functional']['zendesk'] = $this->options['zendesk_id'];
        }

        // Agregar configuración al data-script-config
        if (!empty($script_config)) {
            $attributes['data-script-config'] = wp_json_encode($script_config);
        }

        // Lazy load del Pegoyu después del LCP para no impactar Core Web Vitals
        ?>
        <script>
        (function() {
            function loadEsbillaPegoyu() {
                var script = document.createElement('script');
                <?php foreach ($attributes as $key => $value): ?>
                <?php if ($key === 'data-script-config'): ?>
                script.setAttribute('<?php echo esc_js($key); ?>', '<?php echo esc_js($value); ?>');
                <?php else: ?>
                script.setAttribute('<?php echo esc_js($key); ?>', '<?php echo esc_js($value); ?>');
                <?php endif; ?>
                <?php endforeach; ?>
                script.defer = true;
                document.head.appendChild(script);
            }

            // Cargar después de que el contenido principal esté listo
            if ('requestIdleCallback' in window) {
                requestIdleCallback(loadEsbillaPegoyu, { timeout: 2000 });
            } else {
                setTimeout(loadEsbillaPegoyu, 1000);
            }
        })();
        </script>
        <?php
        echo '<!-- Modo Simplificado: Scripts cargados automáticamente por el Pegoyu -->' . "\n";
    }

    /**
     * Modo GTM: Implementar vía Google Tag Manager
     */
    private function inject_gtm_mode($attributes) {
        $gtm_id = !empty($this->options['gtm_id']) ? $this->options['gtm_id'] : '';

        if ($gtm_id) {
            $attributes['data-gtm'] = $gtm_id;
        }
        $attributes['data-gtm-mode'] = 'true';

        // Lazy load del Pegoyu después del LCP para no impactar Core Web Vitals
        ?>
        <script>
        (function() {
            function loadEsbillaPegoyu() {
                var script = document.createElement('script');
                <?php foreach ($attributes as $key => $value): ?>
                script.setAttribute('<?php echo esc_js($key); ?>', '<?php echo esc_js($value); ?>');
                <?php endforeach; ?>
                script.defer = true;
                document.head.appendChild(script);
            }

            // Cargar después de que el contenido principal esté listo
            if ('requestIdleCallback' in window) {
                requestIdleCallback(loadEsbillaPegoyu, { timeout: 2000 });
            } else {
                setTimeout(loadEsbillaPegoyu, 1000);
            }
        })();
        </script>
        <?php
        echo '<!-- Modo GTM: Integración con Google Tag Manager -->' . "\n";

        if ($gtm_id) {
            echo '<!-- GTM Container: ' . esc_html($gtm_id) . ' -->' . "\n";
        } else {
            echo '<!-- IMPORTANTE: Configura tu GTM ID en los ajustes del plugin -->' . "\n";
        }
    }
}
