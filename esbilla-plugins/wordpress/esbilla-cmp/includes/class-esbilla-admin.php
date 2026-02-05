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

        // Analytics
        add_settings_field(
            'google_analytics_id',
            __('Google Analytics 4', 'esbilla-cmp'),
            array($this, 'google_analytics_id_callback'),
            $this->options_page_slug,
            'esbilla_scripts_section'
        );

        add_settings_field(
            'hotjar_id',
            __('Hotjar', 'esbilla-cmp'),
            array($this, 'hotjar_id_callback'),
            $this->options_page_slug,
            'esbilla_scripts_section'
        );

        // Marketing
        add_settings_field(
            'facebook_pixel_id',
            __('Facebook Pixel', 'esbilla-cmp'),
            array($this, 'facebook_pixel_id_callback'),
            $this->options_page_slug,
            'esbilla_scripts_section'
        );

        add_settings_field(
            'linkedin_insight_id',
            __('LinkedIn Insight Tag', 'esbilla-cmp'),
            array($this, 'linkedin_insight_id_callback'),
            $this->options_page_slug,
            'esbilla_scripts_section'
        );

        add_settings_field(
            'tiktok_pixel_id',
            __('TikTok Pixel', 'esbilla-cmp'),
            array($this, 'tiktok_pixel_id_callback'),
            $this->options_page_slug,
            'esbilla_scripts_section'
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
        $sanitized['implementation_mode'] = in_array($input['implementation_mode'] ?? 'manual', array('manual', 'simplified', 'gtm'))
            ? $input['implementation_mode']
            : 'manual';

        $sanitized['gtm_id'] = sanitize_text_field($input['gtm_id'] ?? '');
        $sanitized['google_analytics_id'] = sanitize_text_field($input['google_analytics_id'] ?? '');
        $sanitized['hotjar_id'] = sanitize_text_field($input['hotjar_id'] ?? '');
        $sanitized['facebook_pixel_id'] = sanitize_text_field($input['facebook_pixel_id'] ?? '');
        $sanitized['linkedin_insight_id'] = sanitize_text_field($input['linkedin_insight_id'] ?? '');
        $sanitized['tiktok_pixel_id'] = sanitize_text_field($input['tiktok_pixel_id'] ?? '');

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

        if ($mode !== 'gtm') {
            echo '<p style="opacity: 0.6;">' . esc_html__('Esta sección solo está disponible en modo GTM.', 'esbilla-cmp') . '</p>';
        }
    }

    public function scripts_section_callback() {
        $options = get_option('esbilla_settings', array());
        $mode = $options['implementation_mode'] ?? 'manual';

        if ($mode !== 'simplified') {
            echo '<p style="opacity: 0.6;">' . esc_html__('Esta sección solo está disponible en modo Simplificado.', 'esbilla-cmp') . '</p>';
        }
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
        $disabled = $mode !== 'gtm' ? 'disabled' : '';
        ?>
        <input type="text"
               name="esbilla_settings[gtm_id]"
               value="<?php echo esc_attr($value); ?>"
               class="regular-text"
               placeholder="GTM-XXXXXXX"
               <?php echo $disabled; ?>>
        <p class="description">
            <?php esc_html_e('ID de tu contenedor de Google Tag Manager', 'esbilla-cmp'); ?>
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
