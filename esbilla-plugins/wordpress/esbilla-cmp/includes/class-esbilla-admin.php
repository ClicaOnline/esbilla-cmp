<?php
/**
 * Clase para la administración del plugin
 *
 * @package EsbillaCMP
 */

// Si se accede directamente, salir
if (!defined('ABSPATH')) {
    exit;
}

class Esbilla_Admin {

    /**
     * Slug de la página de opciones
     */
    private $options_page_slug = 'esbilla-settings';

    /**
     * Agrega el menú de administración del plugin
     */
    public function add_plugin_admin_menu() {
        add_options_page(
            __('Esbilla CMP - Configuración', 'esbilla-cmp'),
            __('Esbilla CMP', 'esbilla-cmp'),
            'manage_options',
            $this->options_page_slug,
            array($this, 'display_plugin_setup_page')
        );
    }

    /**
     * Registra los ajustes del plugin
     */
    public function register_settings() {
        register_setting('esbilla_settings_group', 'esbilla_settings', array($this, 'sanitize_settings'));

        // Sección: Configuración básica
        add_settings_section(
            'esbilla_basic_section',
            __('Configuración Básica', 'esbilla-cmp'),
            array($this, 'basic_section_callback'),
            $this->options_page_slug
        );

        // Campo: Habilitar plugin
        add_settings_field(
            'enabled',
            __('Habilitar Esbilla CMP', 'esbilla-cmp'),
            array($this, 'enabled_callback'),
            $this->options_page_slug,
            'esbilla_basic_section'
        );

        // Campo: Site ID
        add_settings_field(
            'site_id',
            __('Site ID', 'esbilla-cmp'),
            array($this, 'site_id_callback'),
            $this->options_page_slug,
            'esbilla_basic_section'
        );

        // Campo: API URL
        add_settings_field(
            'api_url',
            __('API URL', 'esbilla-cmp'),
            array($this, 'api_url_callback'),
            $this->options_page_slug,
            'esbilla_basic_section'
        );

        // Campo: Idioma
        add_settings_field(
            'language',
            __('Idioma del Plugin', 'esbilla-cmp'),
            array($this, 'language_callback'),
            $this->options_page_slug,
            'esbilla_basic_section'
        );

        // Sección: Modo de implementación
        add_settings_section(
            'esbilla_mode_section',
            __('Modo de Implementación', 'esbilla-cmp'),
            array($this, 'mode_section_callback'),
            $this->options_page_slug
        );

        // Campo: Modo
        add_settings_field(
            'implementation_mode',
            __('Modo', 'esbilla-cmp'),
            array($this, 'implementation_mode_callback'),
            $this->options_page_slug,
            'esbilla_mode_section'
        );

        // Sección: Configuración GTM (solo visible en modo GTM)
        add_settings_section(
            'esbilla_gtm_section',
            __('Configuración de Google Tag Manager', 'esbilla-cmp'),
            array($this, 'gtm_section_callback'),
            $this->options_page_slug
        );

        // Campo: GTM ID
        add_settings_field(
            'gtm_id',
            __('GTM Container ID', 'esbilla-cmp'),
            array($this, 'gtm_id_callback'),
            $this->options_page_slug,
            'esbilla_gtm_section'
        );

        // Sección: Script IDs (solo visible en modo simplified)
        add_settings_section(
            'esbilla_scripts_section',
            __('IDs de Scripts de Terceros', 'esbilla-cmp'),
            array($this, 'scripts_section_callback'),
            $this->options_page_slug
        );

        // Sección de Analytics (acordeón)
        add_settings_section(
            'esbilla_scripts_analytics_section',
            __('Analytics (7 plataformas)', 'esbilla-cmp'),
            array($this, 'scripts_analytics_section_callback'),
            $this->options_page_slug
        );

        // Analytics
        add_settings_field(
            'google_analytics_id',
            __('Google Analytics 4', 'esbilla-cmp'),
            array($this, 'google_analytics_id_callback'),
            $this->options_page_slug,
            'esbilla_scripts_analytics_section'
        );

        add_settings_field(
            'hotjar_id',
            __('Hotjar', 'esbilla-cmp'),
            array($this, 'hotjar_id_callback'),
            $this->options_page_slug,
            'esbilla_scripts_analytics_section'
        );

        add_settings_field(
            'microsoft_clarity_id',
            __('Microsoft Clarity', 'esbilla-cmp'),
            array($this, 'microsoft_clarity_id_callback'),
            $this->options_page_slug,
            'esbilla_scripts_analytics_section'
        );

        add_settings_field(
            'amplitude_id',
            __('Amplitude', 'esbilla-cmp'),
            array($this, 'amplitude_id_callback'),
            $this->options_page_slug,
            'esbilla_scripts_analytics_section'
        );

        add_settings_field(
            'crazyegg_id',
            __('Crazy Egg', 'esbilla-cmp'),
            array($this, 'crazyegg_id_callback'),
            $this->options_page_slug,
            'esbilla_scripts_analytics_section'
        );

        add_settings_field(
            'vwo_id',
            __('VWO (Visual Website Optimizer)', 'esbilla-cmp'),
            array($this, 'vwo_id_callback'),
            $this->options_page_slug,
            'esbilla_scripts_analytics_section'
        );

        add_settings_field(
            'optimizely_id',
            __('Optimizely', 'esbilla-cmp'),
            array($this, 'optimizely_id_callback'),
            $this->options_page_slug,
            'esbilla_scripts_analytics_section'
        );

        // Sección de Marketing (acordeón)
        add_settings_section(
            'esbilla_scripts_marketing_section',
            __('Marketing (10 plataformas)', 'esbilla-cmp'),
            array($this, 'scripts_marketing_section_callback'),
            $this->options_page_slug
        );

        // Marketing
        add_settings_field(
            'facebook_pixel_id',
            __('Facebook Pixel', 'esbilla-cmp'),
            array($this, 'facebook_pixel_id_callback'),
            $this->options_page_slug,
            'esbilla_scripts_marketing_section'
        );

        add_settings_field(
            'linkedin_insight_id',
            __('LinkedIn Insight Tag', 'esbilla-cmp'),
            array($this, 'linkedin_insight_id_callback'),
            $this->options_page_slug,
            'esbilla_scripts_marketing_section'
        );

        add_settings_field(
            'tiktok_pixel_id',
            __('TikTok Pixel', 'esbilla-cmp'),
            array($this, 'tiktok_pixel_id_callback'),
            $this->options_page_slug,
            'esbilla_scripts_marketing_section'
        );

        add_settings_field(
            'google_ads_id',
            __('Google Ads', 'esbilla-cmp'),
            array($this, 'google_ads_id_callback'),
            $this->options_page_slug,
            'esbilla_scripts_marketing_section'
        );

        add_settings_field(
            'microsoft_ads_id',
            __('Microsoft Ads (Bing)', 'esbilla-cmp'),
            array($this, 'microsoft_ads_id_callback'),
            $this->options_page_slug,
            'esbilla_scripts_marketing_section'
        );

        add_settings_field(
            'criteo_id',
            __('Criteo', 'esbilla-cmp'),
            array($this, 'criteo_id_callback'),
            $this->options_page_slug,
            'esbilla_scripts_marketing_section'
        );

        add_settings_field(
            'pinterest_id',
            __('Pinterest Tag', 'esbilla-cmp'),
            array($this, 'pinterest_id_callback'),
            $this->options_page_slug,
            'esbilla_scripts_marketing_section'
        );

        add_settings_field(
            'twitter_pixel_id',
            __('Twitter (X) Pixel', 'esbilla-cmp'),
            array($this, 'twitter_pixel_id_callback'),
            $this->options_page_slug,
            'esbilla_scripts_marketing_section'
        );

        add_settings_field(
            'taboola_id',
            __('Taboola', 'esbilla-cmp'),
            array($this, 'taboola_id_callback'),
            $this->options_page_slug,
            'esbilla_scripts_marketing_section'
        );

        add_settings_field(
            'hubspot_id',
            __('HubSpot', 'esbilla-cmp'),
            array($this, 'hubspot_id_callback'),
            $this->options_page_slug,
            'esbilla_scripts_marketing_section'
        );

        // Sección de Functional (acordeón)
        add_settings_section(
            'esbilla_scripts_functional_section',
            __('Functional (2 plataformas)', 'esbilla-cmp'),
            array($this, 'scripts_functional_section_callback'),
            $this->options_page_slug
        );

        // Functional
        add_settings_field(
            'intercom_id',
            __('Intercom', 'esbilla-cmp'),
            array($this, 'intercom_id_callback'),
            $this->options_page_slug,
            'esbilla_scripts_functional_section'
        );

        add_settings_field(
            'zendesk_id',
            __('Zendesk', 'esbilla-cmp'),
            array($this, 'zendesk_id_callback'),
            $this->options_page_slug,
            'esbilla_scripts_functional_section'
        );

        // Sección: Personalización
        add_settings_section(
            'esbilla_customization_section',
            __('Personalización', 'esbilla-cmp'),
            array($this, 'customization_section_callback'),
            $this->options_page_slug
        );

        // Campo: CSS Personalizado
        add_settings_field(
            'custom_css',
            __('CSS Personalizado', 'esbilla-cmp'),
            array($this, 'custom_css_callback'),
            $this->options_page_slug,
            'esbilla_customization_section'
        );
    }

    /**
     * Sanitiza los valores de los ajustes
     */
    public function sanitize_settings($input) {
        $sanitized = array();

        $sanitized['enabled'] = !empty($input['enabled']) ? 1 : 0;
        $sanitized['site_id'] = sanitize_text_field($input['site_id'] ?? '');
        $sanitized['api_url'] = esc_url_raw($input['api_url'] ?? ESBILLA_DEFAULT_API_URL);
        $sanitized['language'] = in_array($input['language'] ?? 'es_ES', array('es_ES', 'ast', 'en_US'))
            ? $input['language']
            : 'es_ES';
        $sanitized['implementation_mode'] = in_array($input['implementation_mode'] ?? 'manual', array('manual', 'simplified', 'gtm'))
            ? $input['implementation_mode']
            : 'manual';

        $sanitized['gtm_id'] = sanitize_text_field($input['gtm_id'] ?? '');

        // Analytics
        $sanitized['google_analytics_id'] = sanitize_text_field($input['google_analytics_id'] ?? '');
        $sanitized['hotjar_id'] = sanitize_text_field($input['hotjar_id'] ?? '');
        $sanitized['microsoft_clarity_id'] = sanitize_text_field($input['microsoft_clarity_id'] ?? '');
        $sanitized['amplitude_id'] = sanitize_text_field($input['amplitude_id'] ?? '');
        $sanitized['crazyegg_id'] = sanitize_text_field($input['crazyegg_id'] ?? '');
        $sanitized['vwo_id'] = sanitize_text_field($input['vwo_id'] ?? '');
        $sanitized['optimizely_id'] = sanitize_text_field($input['optimizely_id'] ?? '');

        // Marketing
        $sanitized['facebook_pixel_id'] = sanitize_text_field($input['facebook_pixel_id'] ?? '');
        $sanitized['linkedin_insight_id'] = sanitize_text_field($input['linkedin_insight_id'] ?? '');
        $sanitized['tiktok_pixel_id'] = sanitize_text_field($input['tiktok_pixel_id'] ?? '');
        $sanitized['google_ads_id'] = sanitize_text_field($input['google_ads_id'] ?? '');
        $sanitized['microsoft_ads_id'] = sanitize_text_field($input['microsoft_ads_id'] ?? '');
        $sanitized['criteo_id'] = sanitize_text_field($input['criteo_id'] ?? '');
        $sanitized['pinterest_id'] = sanitize_text_field($input['pinterest_id'] ?? '');
        $sanitized['twitter_pixel_id'] = sanitize_text_field($input['twitter_pixel_id'] ?? '');
        $sanitized['taboola_id'] = sanitize_text_field($input['taboola_id'] ?? '');
        $sanitized['hubspot_id'] = sanitize_text_field($input['hubspot_id'] ?? '');

        // Functional
        $sanitized['intercom_id'] = sanitize_text_field($input['intercom_id'] ?? '');
        $sanitized['zendesk_id'] = sanitize_text_field($input['zendesk_id'] ?? '');

        // Sanitizar CSS personalizado (permitir CSS válido)
        $sanitized['custom_css'] = isset($input['custom_css'])
            ? wp_strip_all_tags($input['custom_css'])
            : '';

        return $sanitized;
    }

    /**
     * Muestra la página de configuración
     */
    public function display_plugin_setup_page() {
        include_once ESBILLA_PLUGIN_DIR . 'admin/settings-page.php';
    }

    /**
     * Callbacks de secciones
     */
    public function basic_section_callback() {
        echo '<p>' . esc_html__('Configura los datos básicos de tu sitio en Esbilla.', 'esbilla-cmp') . '</p>';
    }

    public function mode_section_callback() {
        echo '<p>' . esc_html__('Escoge el modo de implementación que mejor se adapte a tu sitio.', 'esbilla-cmp') . '</p>';
    }

    public function gtm_section_callback() {
        $options = get_option('esbilla_settings', array());
        $mode = $options['implementation_mode'] ?? 'manual';

        if ($mode !== 'gtm' && $mode !== 'simplified') {
            echo '<p style="opacity: 0.6;">' . esc_html__('Esta sección está disponible en modo Simplificado y GTM.', 'esbilla-cmp') . '</p>';
        } else {
            echo '<p>' . esc_html__('Configura tu Google Tag Manager para integración avanzada.', 'esbilla-cmp') . '</p>';
        }
    }

    public function scripts_section_callback() {
        $options = get_option('esbilla_settings', array());
        $mode = $options['implementation_mode'] ?? 'manual';

        if ($mode !== 'simplified') {
            echo '<p style="opacity: 0.6;">' . esc_html__('Esta sección solo está disponible en modo Simplificado. Cambia a modo Simplificado para configurar los IDs de las plataformas.', 'esbilla-cmp') . '</p>';
        } else {
            echo '<p>' . esc_html__('Configura los IDs de las plataformas que usas. Los scripts se cargarán automáticamente cuando el usuario dé consentimiento.', 'esbilla-cmp') . '</p>';
        }
    }

    public function scripts_analytics_section_callback() {
        echo '<p style="margin: 0; color: #666; font-size: 13px;">' . esc_html__('Plataformas de análisis y comportamiento de usuarios', 'esbilla-cmp') . '</p>';
    }

    public function scripts_marketing_section_callback() {
        echo '<p style="margin: 0; color: #666; font-size: 13px;">' . esc_html__('Plataformas de publicidad y remarketing', 'esbilla-cmp') . '</p>';
    }

    public function scripts_functional_section_callback() {
        echo '<p style="margin: 0; color: #666; font-size: 13px;">' . esc_html__('Herramientas de soporte y comunicación con usuarios', 'esbilla-cmp') . '</p>';
    }

    public function customization_section_callback() {
        echo '<p>' . esc_html__('Personaliza el aspecto del banner con CSS.', 'esbilla-cmp') . '</p>';
    }

    /**
     * Callbacks de campos
     */
    public function enabled_callback() {
        $options = get_option('esbilla_settings', array());
        $checked = !empty($options['enabled']) ? 'checked' : '';
        ?>
        <label>
            <input type="checkbox" name="esbilla_settings[enabled]" value="1" <?php echo $checked; ?>>
            <?php esc_html_e('Activar Esbilla CMP en este sitio', 'esbilla-cmp'); ?>
        </label>
        <?php
    }

    public function site_id_callback() {
        $options = get_option('esbilla_settings', array());
        $value = $options['site_id'] ?? '';
        ?>
        <input type="text"
               name="esbilla_settings[site_id]"
               value="<?php echo esc_attr($value); ?>"
               class="regular-text"
               placeholder="site_ivnahsc12nyg"
               required>
        <p class="description">
            <?php esc_html_e('ID de tu sitio en el dashboard de Esbilla (app.esbilla.com)', 'esbilla-cmp'); ?>
        </p>
        <?php
    }

    public function api_url_callback() {
        $options = get_option('esbilla_settings', array());
        $value = $options['api_url'] ?? ESBILLA_DEFAULT_API_URL;
        ?>
        <input type="url"
               name="esbilla_settings[api_url]"
               value="<?php echo esc_url($value); ?>"
               class="regular-text">
        <p class="description">
            <?php esc_html_e('URL de la API de Esbilla (por defecto: https://api.esbilla.com)', 'esbilla-cmp'); ?>
        </p>
        <?php
    }

    public function language_callback() {
        $options = get_option('esbilla_settings', array());
        $value = $options['language'] ?? 'es_ES';
        ?>
        <select name="esbilla_settings[language]" class="regular-text">
            <option value="es_ES" <?php selected($value, 'es_ES'); ?>>🇪🇸 Español</option>
            <option value="ast" <?php selected($value, 'ast'); ?>>🏴 Asturianu</option>
            <option value="en_US" <?php selected($value, 'en_US'); ?>>🇬🇧 English</option>
        </select>
        <p class="description">
            <?php esc_html_e('Idioma de la interfaz del plugin (requiere recargar la página)', 'esbilla-cmp'); ?>
        </p>
        <?php
    }

    public function implementation_mode_callback() {
        $options = get_option('esbilla_settings', array());
        $mode = $options['implementation_mode'] ?? 'manual';
        ?>
        <fieldset>
            <label style="display: block; margin-bottom: 12px;">
                <input type="radio"
                       name="esbilla_settings[implementation_mode]"
                       value="manual"
                       <?php checked($mode, 'manual'); ?>>
                <strong><?php esc_html_e('Manual', 'esbilla-cmp'); ?></strong><br>
                <span style="margin-left: 24px; color: #666;">
                    <?php esc_html_e('Tú modificas los scripts a type="text/plain" data-category="..."', 'esbilla-cmp'); ?>
                </span>
            </label>

            <label style="display: block; margin-bottom: 12px;">
                <input type="radio"
                       name="esbilla_settings[implementation_mode]"
                       value="simplified"
                       <?php checked($mode, 'simplified'); ?>>
                <strong><?php esc_html_e('Simplificado', 'esbilla-cmp'); ?></strong><br>
                <span style="margin-left: 24px; color: #666;">
                    <?php esc_html_e('Configuras IDs aquí, el SDK carga los scripts automáticamente', 'esbilla-cmp'); ?>
                </span>
            </label>

            <label style="display: block;">
                <input type="radio"
                       name="esbilla_settings[implementation_mode]"
                       value="gtm"
                       <?php checked($mode, 'gtm'); ?>>
                <strong><?php esc_html_e('Google Tag Manager', 'esbilla-cmp'); ?></strong><br>
                <span style="margin-left: 24px; color: #666;">
                    <?php esc_html_e('Integración vía GTM para control total de tags', 'esbilla-cmp'); ?>
                </span>
            </label>
        </fieldset>
        <?php
    }

    public function gtm_id_callback() {
        $options = get_option('esbilla_settings', array());
        $mode = $options['implementation_mode'] ?? 'manual';
        $value = $options['gtm_id'] ?? '';
        $disabled = ($mode !== 'gtm' && $mode !== 'simplified') ? 'disabled' : '';
        ?>
        <input type="text"
               name="esbilla_settings[gtm_id]"
               value="<?php echo esc_attr($value); ?>"
               class="regular-text"
               placeholder="GTM-XXXXXXX"
               <?php echo $disabled; ?>>
        <p class="description">
            <?php esc_html_e('ID de tu contenedor de Google Tag Manager (opcional)', 'esbilla-cmp'); ?>
        </p>
        <?php
    }

    public function google_analytics_id_callback() {
        $options = get_option('esbilla_settings', array());
        $mode = $options['implementation_mode'] ?? 'manual';
        $value = $options['google_analytics_id'] ?? '';
        $disabled = $mode !== 'simplified' ? 'disabled' : '';
        ?>
        <input type="text"
               name="esbilla_settings[google_analytics_id]"
               value="<?php echo esc_attr($value); ?>"
               class="regular-text"
               placeholder="G-XXXXXXXXXX"
               <?php echo $disabled; ?>>
        <p class="description">
            <?php esc_html_e('Measurement ID de Google Analytics 4', 'esbilla-cmp'); ?>
        </p>
        <?php
    }

    public function hotjar_id_callback() {
        $options = get_option('esbilla_settings', array());
        $mode = $options['implementation_mode'] ?? 'manual';
        $value = $options['hotjar_id'] ?? '';
        $disabled = $mode !== 'simplified' ? 'disabled' : '';
        ?>
        <input type="text"
               name="esbilla_settings[hotjar_id]"
               value="<?php echo esc_attr($value); ?>"
               class="regular-text"
               placeholder="1234567"
               <?php echo $disabled; ?>>
        <p class="description">
            <?php esc_html_e('Site ID de Hotjar', 'esbilla-cmp'); ?>
        </p>
        <?php
    }

    public function facebook_pixel_id_callback() {
        $options = get_option('esbilla_settings', array());
        $mode = $options['implementation_mode'] ?? 'manual';
        $value = $options['facebook_pixel_id'] ?? '';
        $disabled = $mode !== 'simplified' ? 'disabled' : '';
        ?>
        <input type="text"
               name="esbilla_settings[facebook_pixel_id]"
               value="<?php echo esc_attr($value); ?>"
               class="regular-text"
               placeholder="123456789012345"
               <?php echo $disabled; ?>>
        <p class="description">
            <?php esc_html_e('Pixel ID de Facebook', 'esbilla-cmp'); ?>
        </p>
        <?php
    }

    public function linkedin_insight_id_callback() {
        $options = get_option('esbilla_settings', array());
        $mode = $options['implementation_mode'] ?? 'manual';
        $value = $options['linkedin_insight_id'] ?? '';
        $disabled = $mode !== 'simplified' ? 'disabled' : '';
        ?>
        <input type="text"
               name="esbilla_settings[linkedin_insight_id]"
               value="<?php echo esc_attr($value); ?>"
               class="regular-text"
               placeholder="1234567"
               <?php echo $disabled; ?>>
        <p class="description">
            <?php esc_html_e('Partner ID de LinkedIn Insight Tag', 'esbilla-cmp'); ?>
        </p>
        <?php
    }

    public function tiktok_pixel_id_callback() {
        $options = get_option('esbilla_settings', array());
        $mode = $options['implementation_mode'] ?? 'manual';
        $value = $options['tiktok_pixel_id'] ?? '';
        $disabled = $mode !== 'simplified' ? 'disabled' : '';
        ?>
        <input type="text"
               name="esbilla_settings[tiktok_pixel_id]"
               value="<?php echo esc_attr($value); ?>"
               class="regular-text"
               placeholder="XXXXXXXXXXXXXXXXXXXX"
               <?php echo $disabled; ?>>
        <p class="description">
            <?php esc_html_e('Pixel ID de TikTok', 'esbilla-cmp'); ?>
        </p>
        <?php
    }

    public function microsoft_clarity_id_callback() {
        $options = get_option('esbilla_settings', array());
        $mode = $options['implementation_mode'] ?? 'manual';
        $value = $options['microsoft_clarity_id'] ?? '';
        $disabled = $mode !== 'simplified' ? 'disabled' : '';
        ?>
        <input type="text"
               name="esbilla_settings[microsoft_clarity_id]"
               value="<?php echo esc_attr($value); ?>"
               class="regular-text"
               placeholder="abcdefghij"
               <?php echo $disabled; ?>>
        <p class="description">
            <?php esc_html_e('Project ID de Microsoft Clarity', 'esbilla-cmp'); ?>
        </p>
        <?php
    }

    public function amplitude_id_callback() {
        $options = get_option('esbilla_settings', array());
        $mode = $options['implementation_mode'] ?? 'manual';
        $value = $options['amplitude_id'] ?? '';
        $disabled = $mode !== 'simplified' ? 'disabled' : '';
        ?>
        <input type="text"
               name="esbilla_settings[amplitude_id]"
               value="<?php echo esc_attr($value); ?>"
               class="regular-text"
               placeholder="abcdefghijklmnopqrstuvwxyz123456"
               <?php echo $disabled; ?>>
        <p class="description">
            <?php esc_html_e('API Key de Amplitude', 'esbilla-cmp'); ?>
        </p>
        <?php
    }

    public function crazyegg_id_callback() {
        $options = get_option('esbilla_settings', array());
        $mode = $options['implementation_mode'] ?? 'manual';
        $value = $options['crazyegg_id'] ?? '';
        $disabled = $mode !== 'simplified' ? 'disabled' : '';
        ?>
        <input type="text"
               name="esbilla_settings[crazyegg_id]"
               value="<?php echo esc_attr($value); ?>"
               class="regular-text"
               placeholder="12345678"
               <?php echo $disabled; ?>>
        <p class="description">
            <?php esc_html_e('Account Number de Crazy Egg', 'esbilla-cmp'); ?>
        </p>
        <?php
    }

    public function vwo_id_callback() {
        $options = get_option('esbilla_settings', array());
        $mode = $options['implementation_mode'] ?? 'manual';
        $value = $options['vwo_id'] ?? '';
        $disabled = $mode !== 'simplified' ? 'disabled' : '';
        ?>
        <input type="text"
               name="esbilla_settings[vwo_id]"
               value="<?php echo esc_attr($value); ?>"
               class="regular-text"
               placeholder="123456"
               <?php echo $disabled; ?>>
        <p class="description">
            <?php esc_html_e('Account ID de VWO', 'esbilla-cmp'); ?>
        </p>
        <?php
    }

    public function optimizely_id_callback() {
        $options = get_option('esbilla_settings', array());
        $mode = $options['implementation_mode'] ?? 'manual';
        $value = $options['optimizely_id'] ?? '';
        $disabled = $mode !== 'simplified' ? 'disabled' : '';
        ?>
        <input type="text"
               name="esbilla_settings[optimizely_id]"
               value="<?php echo esc_attr($value); ?>"
               class="regular-text"
               placeholder="1234567890"
               <?php echo $disabled; ?>>
        <p class="description">
            <?php esc_html_e('Project ID de Optimizely', 'esbilla-cmp'); ?>
        </p>
        <?php
    }

    public function google_ads_id_callback() {
        $options = get_option('esbilla_settings', array());
        $mode = $options['implementation_mode'] ?? 'manual';
        $value = $options['google_ads_id'] ?? '';
        $disabled = $mode !== 'simplified' ? 'disabled' : '';
        ?>
        <input type="text"
               name="esbilla_settings[google_ads_id]"
               value="<?php echo esc_attr($value); ?>"
               class="regular-text"
               placeholder="AW-123456789"
               <?php echo $disabled; ?>>
        <p class="description">
            <?php esc_html_e('Conversion ID de Google Ads (AW-XXXXXXXXXX)', 'esbilla-cmp'); ?>
        </p>
        <?php
    }

    public function microsoft_ads_id_callback() {
        $options = get_option('esbilla_settings', array());
        $mode = $options['implementation_mode'] ?? 'manual';
        $value = $options['microsoft_ads_id'] ?? '';
        $disabled = $mode !== 'simplified' ? 'disabled' : '';
        ?>
        <input type="text"
               name="esbilla_settings[microsoft_ads_id]"
               value="<?php echo esc_attr($value); ?>"
               class="regular-text"
               placeholder="12345678"
               <?php echo $disabled; ?>>
        <p class="description">
            <?php esc_html_e('UET Tag ID de Microsoft Ads', 'esbilla-cmp'); ?>
        </p>
        <?php
    }

    public function criteo_id_callback() {
        $options = get_option('esbilla_settings', array());
        $mode = $options['implementation_mode'] ?? 'manual';
        $value = $options['criteo_id'] ?? '';
        $disabled = $mode !== 'simplified' ? 'disabled' : '';
        ?>
        <input type="text"
               name="esbilla_settings[criteo_id]"
               value="<?php echo esc_attr($value); ?>"
               class="regular-text"
               placeholder="12345"
               <?php echo $disabled; ?>>
        <p class="description">
            <?php esc_html_e('Account ID de Criteo', 'esbilla-cmp'); ?>
        </p>
        <?php
    }

    public function pinterest_id_callback() {
        $options = get_option('esbilla_settings', array());
        $mode = $options['implementation_mode'] ?? 'manual';
        $value = $options['pinterest_id'] ?? '';
        $disabled = $mode !== 'simplified' ? 'disabled' : '';
        ?>
        <input type="text"
               name="esbilla_settings[pinterest_id]"
               value="<?php echo esc_attr($value); ?>"
               class="regular-text"
               placeholder="1234567890123"
               <?php echo $disabled; ?>>
        <p class="description">
            <?php esc_html_e('Tag ID de Pinterest', 'esbilla-cmp'); ?>
        </p>
        <?php
    }

    public function twitter_pixel_id_callback() {
        $options = get_option('esbilla_settings', array());
        $mode = $options['implementation_mode'] ?? 'manual';
        $value = $options['twitter_pixel_id'] ?? '';
        $disabled = $mode !== 'simplified' ? 'disabled' : '';
        ?>
        <input type="text"
               name="esbilla_settings[twitter_pixel_id]"
               value="<?php echo esc_attr($value); ?>"
               class="regular-text"
               placeholder="o1234"
               <?php echo $disabled; ?>>
        <p class="description">
            <?php esc_html_e('Pixel ID de Twitter/X', 'esbilla-cmp'); ?>
        </p>
        <?php
    }

    public function taboola_id_callback() {
        $options = get_option('esbilla_settings', array());
        $mode = $options['implementation_mode'] ?? 'manual';
        $value = $options['taboola_id'] ?? '';
        $disabled = $mode !== 'simplified' ? 'disabled' : '';
        ?>
        <input type="text"
               name="esbilla_settings[taboola_id]"
               value="<?php echo esc_attr($value); ?>"
               class="regular-text"
               placeholder="1234567"
               <?php echo $disabled; ?>>
        <p class="description">
            <?php esc_html_e('Account ID de Taboola', 'esbilla-cmp'); ?>
        </p>
        <?php
    }

    public function hubspot_id_callback() {
        $options = get_option('esbilla_settings', array());
        $mode = $options['implementation_mode'] ?? 'manual';
        $value = $options['hubspot_id'] ?? '';
        $disabled = $mode !== 'simplified' ? 'disabled' : '';
        ?>
        <input type="text"
               name="esbilla_settings[hubspot_id]"
               value="<?php echo esc_attr($value); ?>"
               class="regular-text"
               placeholder="12345678"
               <?php echo $disabled; ?>>
        <p class="description">
            <?php esc_html_e('Hub ID de HubSpot', 'esbilla-cmp'); ?>
        </p>
        <?php
    }

    public function intercom_id_callback() {
        $options = get_option('esbilla_settings', array());
        $mode = $options['implementation_mode'] ?? 'manual';
        $value = $options['intercom_id'] ?? '';
        $disabled = $mode !== 'simplified' ? 'disabled' : '';
        ?>
        <input type="text"
               name="esbilla_settings[intercom_id]"
               value="<?php echo esc_attr($value); ?>"
               class="regular-text"
               placeholder="abcd1234"
               <?php echo $disabled; ?>>
        <p class="description">
            <?php esc_html_e('App ID de Intercom', 'esbilla-cmp'); ?>
        </p>
        <?php
    }

    public function zendesk_id_callback() {
        $options = get_option('esbilla_settings', array());
        $mode = $options['implementation_mode'] ?? 'manual';
        $value = $options['zendesk_id'] ?? '';
        $disabled = $mode !== 'simplified' ? 'disabled' : '';
        ?>
        <input type="text"
               name="esbilla_settings[zendesk_id]"
               value="<?php echo esc_attr($value); ?>"
               class="regular-text"
               placeholder="abcdefgh-1234-5678-90ab-cdefghijklmn"
               <?php echo $disabled; ?>>
        <p class="description">
            <?php esc_html_e('Key de Zendesk Web Widget', 'esbilla-cmp'); ?>
        </p>
        <?php
    }

    public function custom_css_callback() {
        $options = get_option('esbilla_settings', array());
        $value = $options['custom_css'] ?? '';
        ?>
        <textarea
               name="esbilla_settings[custom_css]"
               rows="12"
               class="large-text code"
               placeholder="/* Ejemplo de personalización */&#10;#esbilla-banner {&#10;  border-radius: 16px;&#10;  box-shadow: 0 8px 32px rgba(0,0,0,0.12);&#10;}&#10;&#10;#esbilla-banner-title {&#10;  font-size: 1.5rem;&#10;  color: #1e40af;&#10;}&#10;&#10;.esbilla-btn.btn-primary {&#10;  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);&#10;}"><?php echo esc_textarea($value); ?></textarea>
        <p class="description">
            <?php esc_html_e('Código CSS para personalizar el banner de cookies.', 'esbilla-cmp'); ?>
        </p>
        <div style="margin-top: 12px; padding: 12px; background: #e0f2fe; border-left: 4px solid #0284c7;">
            <p style="margin: 0 0 8px 0; font-weight: 600; color: #0c4a6e;">
                <?php esc_html_e('IDs y clases disponibles:', 'esbilla-cmp'); ?>
            </p>
            <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #0c4a6e;">
                <li><code>#esbilla-banner</code> - <?php esc_html_e('Contenedor principal', 'esbilla-cmp'); ?></li>
                <li><code>#esbilla-banner-inner</code> - <?php esc_html_e('Contenedor interno', 'esbilla-cmp'); ?></li>
                <li><code>#esbilla-banner-icon</code> - <?php esc_html_e('Icono del banner', 'esbilla-cmp'); ?></li>
                <li><code>#esbilla-banner-title</code> - <?php esc_html_e('Título', 'esbilla-cmp'); ?></li>
                <li><code>#esbilla-banner-description</code> - <?php esc_html_e('Descripción', 'esbilla-cmp'); ?></li>
                <li><code>#esbilla-btn-accept</code>, <code>#esbilla-btn-reject</code>, <code>#esbilla-btn-settings</code> - <?php esc_html_e('Botones', 'esbilla-cmp'); ?></li>
            </ul>
            <p style="margin: 8px 0 0 0;">
                <a href="https://esbilla.com/docs/personalizacion-banner" target="_blank" style="color: #0284c7; text-decoration: underline;">
                    <?php esc_html_e('Ver guía completa de personalización →', 'esbilla-cmp'); ?>
                </a>
            </p>
        </div>
        <?php
    }

    /**
     * Carga los estilos del admin
     */
    public function enqueue_styles($hook) {
        if ('settings_page_' . $this->options_page_slug !== $hook) {
            return;
        }

        wp_enqueue_style(
            'esbilla-admin',
            ESBILLA_PLUGIN_URL . 'assets/css/admin.css',
            array(),
            ESBILLA_VERSION
        );
    }

    /**
     * Carga los scripts del admin
     */
    public function enqueue_scripts($hook) {
        if ('settings_page_' . $this->options_page_slug !== $hook) {
            return;
        }

        wp_enqueue_script(
            'esbilla-admin',
            ESBILLA_PLUGIN_URL . 'assets/js/admin.js',
            array('jquery'),
            ESBILLA_VERSION,
            true
        );
    }

    /**
     * Agrega enlaces de acción en la página de plugins
     */
    public function add_action_links($links) {
        $settings_link = '<a href="' . admin_url('options-general.php?page=' . $this->options_page_slug) . '">' .
                         __('Ajustes', 'esbilla-cmp') . '</a>';
        array_unshift($links, $settings_link);
        return $links;
    }
}
