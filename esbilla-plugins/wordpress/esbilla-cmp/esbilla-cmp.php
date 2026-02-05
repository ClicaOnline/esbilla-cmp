<?php
/**
 * Plugin Name: Esbilla CMP - Consent Management Platform
 * Plugin URI: https://esbilla.com
 * Description: Gestión de consentimiento RGPD/ePrivacy de código abierto. Controla cookies y scripts con transparencia.
 * Version: 1.0.0
 * Author: Clica Online Soluciones S.L.
 * Author URI: https://clicaonline.com
 * License: GPL v3 or later
 * License URI: https://www.gnu.org/licenses/gpl-3.0.html
 * Text Domain: esbilla-cmp
 * Domain Path: /languages
 * Requires at least: 5.8
 * Requires PHP: 7.4
 *
 * @package EsbillaCMP
 */

// Si se accede directamente, salir
if (!defined('ABSPATH')) {
    exit;
}

// Constantes del plugin
define('ESBILLA_VERSION', '1.0.0');
define('ESBILLA_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('ESBILLA_PLUGIN_URL', plugin_dir_url(__FILE__));
define('ESBILLA_SDK_VERSION', '1.6.0');
define('ESBILLA_DEFAULT_API_URL', 'https://api.esbilla.com');

/**
 * Clase principal del plugin Esbilla CMP
 */
class Esbilla_CMP {

    /**
     * Instancia única del plugin
     */
    private static $instance = null;

    /**
     * Opciones del plugin
     */
    private $options;

    /**
     * Obtiene la instancia única del plugin
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor
     */
    private function __construct() {
        $this->load_dependencies();
        $this->set_locale();
        $this->define_admin_hooks();
        $this->define_public_hooks();
    }

    /**
     * Carga las dependencias del plugin
     */
    private function load_dependencies() {
        require_once ESBILLA_PLUGIN_DIR . 'includes/class-esbilla-sdk.php';
        require_once ESBILLA_PLUGIN_DIR . 'includes/class-esbilla-admin.php';
        require_once ESBILLA_PLUGIN_DIR . 'includes/class-esbilla-settings.php';
    }

    /**
     * Define la internacionalización del plugin
     */
    private function set_locale() {
        add_action('plugins_loaded', array($this, 'load_plugin_textdomain'));
    }

    /**
     * Carga los archivos de traducción
     */
    public function load_plugin_textdomain() {
        // Obtener el idioma configurado en el plugin
        $options = get_option('esbilla_settings', array());
        $plugin_locale = $options['language'] ?? 'es_ES';

        // Aplicar el idioma del plugin solo para el dominio 'esbilla-cmp'
        add_filter('plugin_locale', function($locale, $domain) use ($plugin_locale) {
            if ($domain === 'esbilla-cmp') {
                return $plugin_locale;
            }
            return $locale;
        }, 10, 2);

        load_plugin_textdomain(
            'esbilla-cmp',
            false,
            dirname(plugin_basename(__FILE__)) . '/languages/'
        );
    }

    /**
     * Define los hooks del área de administración
     */
    private function define_admin_hooks() {
        $admin = new Esbilla_Admin();

        add_action('admin_menu', array($admin, 'add_plugin_admin_menu'));
        add_action('admin_init', array($admin, 'register_settings'));
        add_action('admin_enqueue_scripts', array($admin, 'enqueue_styles'));
        add_action('admin_enqueue_scripts', array($admin, 'enqueue_scripts'));

        // Enlaces en la página de plugins
        add_filter('plugin_action_links_' . plugin_basename(__FILE__), array($admin, 'add_action_links'));
    }

    /**
     * Define los hooks del área pública
     */
    private function define_public_hooks() {
        $sdk = new Esbilla_SDK();

        add_action('wp_head', array($sdk, 'inject_sdk'), 1);
    }

    /**
     * Activación del plugin
     */
    public static function activate() {
        // Opciones por defecto
        $default_options = array(
            'site_id' => '',
            'api_url' => ESBILLA_DEFAULT_API_URL,
            'implementation_mode' => 'manual', // manual | simplified | gtm
            'gtm_id' => '',
            'enabled' => false,

            // Script IDs para modo simplified
            'google_analytics_id' => '',
            'hotjar_id' => '',
            'facebook_pixel_id' => '',
            'linkedin_insight_id' => '',
            'tiktok_pixel_id' => '',

            // Opciones avanzadas
            'template' => 'maiz', // maiz | modal | bottom-bar
            'auto_show' => true,
            'cookie_domain' => '',
            'cookie_path' => '/',
        );

        add_option('esbilla_settings', $default_options);
    }

    /**
     * Desactivación del plugin
     */
    public static function deactivate() {
        // Limpiar transients si es necesario
        delete_transient('esbilla_config_cache');
    }
}

// Hooks de activación y desactivación
register_activation_hook(__FILE__, array('Esbilla_CMP', 'activate'));
register_deactivation_hook(__FILE__, array('Esbilla_CMP', 'deactivate'));

// Inicializar el plugin
function esbilla_init() {
    return Esbilla_CMP::get_instance();
}

// Iniciar el plugin
esbilla_init();
