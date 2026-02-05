<?php
/**
 * Clase auxiliar para gestionar ajustes
 *
 * @package EsbillaCMP
 */

// Si se accede directamente, salir
if (!defined('ABSPATH')) {
    exit;
}

class Esbilla_Settings {

    /**
     * Obtiene una opción específica
     */
    public static function get_option($key, $default = null) {
        $options = get_option('esbilla_settings', array());
        return $options[$key] ?? $default;
    }

    /**
     * Obtiene todas las opciones
     */
    public static function get_all_options() {
        return get_option('esbilla_settings', array());
    }

    /**
     * Verifica si el plugin está habilitado
     */
    public static function is_enabled() {
        $options = get_option('esbilla_settings', array());
        return !empty($options['enabled']) && !empty($options['site_id']);
    }

    /**
     * Obtiene el modo de implementación
     */
    public static function get_implementation_mode() {
        $options = get_option('esbilla_settings', array());
        return $options['implementation_mode'] ?? 'manual';
    }

    /**
     * Obtiene la información del modo actual
     */
    public static function get_mode_info() {
        $mode = self::get_implementation_mode();

        $modes = array(
            'manual' => array(
                'name' => __('Manual', 'esbilla-cmp'),
                'description' => __('Control total: modificas scripts manualmente', 'esbilla-cmp'),
                'icon' => '⚙️',
            ),
            'simplified' => array(
                'name' => __('Simplificado', 'esbilla-cmp'),
                'description' => __('Configuración rápida: SDK carga scripts automáticamente', 'esbilla-cmp'),
                'icon' => '🚀',
            ),
            'gtm' => array(
                'name' => __('Google Tag Manager', 'esbilla-cmp'),
                'description' => __('Integración avanzada vía GTM', 'esbilla-cmp'),
                'icon' => '📊',
            ),
        );

        return $modes[$mode] ?? $modes['manual'];
    }
}
