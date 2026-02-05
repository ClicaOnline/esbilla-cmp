<?php
/**
 * Clase para integrar el SDK de Esbilla en el frontend
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
     * Inyecta el SDK de Esbilla en el <head>
     */
    public function inject_sdk() {
        // Verificar que esté habilitado y configurado
        if (empty($this->options['enabled']) || empty($this->options['site_id'])) {
            return;
        }

        $site_id = esc_attr($this->options['site_id']);
        $api_url = esc_url($this->options['api_url']);
        $mode = $this->options['implementation_mode'] ?? 'manual';

        // URL del SDK
        $sdk_url = trailingslashit($api_url) . 'sdk.js';

        echo "\n<!-- Esbilla CMP SDK v" . ESBILLA_SDK_VERSION . " -->\n";

        // Atributos base del script
        $attributes = array(
            'src' => $sdk_url,
            'data-id' => $site_id,
            'data-api' => $api_url,
        );

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

        echo "<!-- /Esbilla CMP SDK -->\n\n";
    }

    /**
     * Modo Manual: El usuario modifica scripts a type="text/plain"
     */
    private function inject_manual_mode($attributes) {
        echo '<script';
        foreach ($attributes as $key => $value) {
            echo ' ' . esc_attr($key) . '="' . esc_attr($value) . '"';
        }
        echo ' async></script>' . "\n";

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

        // Agregar configuración al data-script-config
        if (!empty($script_config)) {
            $attributes['data-script-config'] = wp_json_encode($script_config);
        }

        echo '<script';
        foreach ($attributes as $key => $value) {
            if ($key === 'data-script-config') {
                echo ' ' . esc_attr($key) . '=\'' . esc_js($value) . '\'';
            } else {
                echo ' ' . esc_attr($key) . '="' . esc_attr($value) . '"';
            }
        }
        echo ' async></script>' . "\n";

        echo '<!-- Modo Simplificado: Scripts cargados automáticamente por el SDK -->' . "\n";
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

        echo '<script';
        foreach ($attributes as $key => $value) {
            echo ' ' . esc_attr($key) . '="' . esc_attr($value) . '"';
        }
        echo ' async></script>' . "\n";

        echo '<!-- Modo GTM: Integración con Google Tag Manager -->' . "\n";

        if ($gtm_id) {
            echo '<!-- GTM Container: ' . esc_html($gtm_id) . ' -->' . "\n";
        } else {
            echo '<!-- IMPORTANTE: Configura tu GTM ID en los ajustes del plugin -->' . "\n";
        }
    }
}
