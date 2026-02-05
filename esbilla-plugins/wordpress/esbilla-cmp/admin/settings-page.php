<?php
/**
 * Página de configuración del plugin
 *
 * @package EsbillaCMP
 */

// Si se accede directamente, salir
if (!defined('ABSPATH')) {
    exit;
}

$options = get_option('esbilla_settings', array());
$mode = $options['implementation_mode'] ?? 'manual';
?>

<div class="wrap esbilla-settings-wrap">
    <h1>
        <?php echo esc_html(get_admin_page_title()); ?>
        <span class="esbilla-version">v<?php echo ESBILLA_VERSION; ?></span>
    </h1>

    <div class="esbilla-header">
        <p class="esbilla-tagline">
            <?php esc_html_e('Gestión de consentimiento RGPD/ePrivacy de código abierto', 'esbilla-cmp'); ?>
        </p>
    </div>

    <?php settings_errors(); ?>

    <?php if (Esbilla_Settings::is_enabled()): ?>
        <div class="notice notice-success">
            <p>
                <strong><?php esc_html_e('¡Esbilla CMP está activo!', 'esbilla-cmp'); ?></strong>
                <?php
                $mode_info = Esbilla_Settings::get_mode_info();
                printf(
                    esc_html__('Modo actual: %s %s', 'esbilla-cmp'),
                    esc_html($mode_info['icon']),
                    '<strong>' . esc_html($mode_info['name']) . '</strong>'
                );
                ?>
            </p>
        </div>
    <?php endif; ?>

    <div class="esbilla-content">
        <div class="esbilla-main">
            <form method="post" action="options.php">
                <?php
                settings_fields('esbilla_settings_group');
                do_settings_sections('esbilla-settings');
                submit_button(__('Guardar cambios', 'esbilla-cmp'));
                ?>
            </form>
        </div>

        <div class="esbilla-sidebar">
            <!-- Panel de información -->
            <div class="esbilla-panel">
                <h3><?php esc_html_e('Recursos', 'esbilla-cmp'); ?></h3>
                <ul class="esbilla-resources">
                    <li>
                        <a href="https://app.esbilla.com" target="_blank">
                            📊 <?php esc_html_e('Dashboard Esbilla', 'esbilla-cmp'); ?>
                        </a>
                    </li>
                    <li>
                        <a href="https://esbilla.com" target="_blank">
                            🌐 <?php esc_html_e('Sitio web', 'esbilla-cmp'); ?>
                        </a>
                    </li>
                    <li>
                        <a href="https://github.com/ClicaOnline/esbilla-cmp" target="_blank">
                            💻 <?php esc_html_e('GitHub (Código fuente)', 'esbilla-cmp'); ?>
                        </a>
                    </li>
                    <li>
                        <a href="https://github.com/ClicaOnline/esbilla-cmp/blob/main/HOWTO.md" target="_blank">
                            📚 <?php esc_html_e('Documentación', 'esbilla-cmp'); ?>
                        </a>
                    </li>
                </ul>
            </div>

            <!-- Panel de modo actual -->
            <?php if (Esbilla_Settings::is_enabled()): ?>
                <?php $mode_info = Esbilla_Settings::get_mode_info(); ?>
                <div class="esbilla-panel esbilla-mode-panel">
                    <h3><?php esc_html_e('Modo Actual', 'esbilla-cmp'); ?></h3>
                    <div class="esbilla-current-mode">
                        <div class="mode-icon"><?php echo esc_html($mode_info['icon']); ?></div>
                        <div class="mode-name"><?php echo esc_html($mode_info['name']); ?></div>
                        <div class="mode-desc"><?php echo esc_html($mode_info['description']); ?></div>
                    </div>

                    <?php if ($mode === 'manual'): ?>
                        <div class="esbilla-mode-help">
                            <h4><?php esc_html_e('Cómo usar el modo Manual:', 'esbilla-cmp'); ?></h4>
                            <ol>
                                <li><?php esc_html_e('Cambia type="text/javascript" a type="text/plain" en tus scripts de analytics/marketing', 'esbilla-cmp'); ?></li>
                                <li><?php esc_html_e('Añade data-category="analytics" o data-category="marketing"', 'esbilla-cmp'); ?></li>
                                <li><?php esc_html_e('Esbilla se encargará de activarlos cuando el usuario dé consentimiento', 'esbilla-cmp'); ?></li>
                            </ol>
                            <code style="display: block; background: #f5f5f5; padding: 12px; margin-top: 8px; font-size: 11px;">
                                &lt;script type="text/plain"<br>
                                &nbsp;&nbsp;data-category="analytics"<br>
                                &nbsp;&nbsp;src="https://..."&gt;<br>
                                &lt;/script&gt;
                            </code>
                        </div>
                    <?php elseif ($mode === 'simplified'): ?>
                        <div class="esbilla-mode-help">
                            <h4><?php esc_html_e('Modo Simplificado activo', 'esbilla-cmp'); ?></h4>
                            <p><?php esc_html_e('Configura los IDs de las plataformas que usas arriba, y el SDK cargará los scripts automáticamente cuando el usuario dé consentimiento.', 'esbilla-cmp'); ?></p>
                        </div>
                    <?php elseif ($mode === 'gtm'): ?>
                        <div class="esbilla-mode-help">
                            <h4><?php esc_html_e('Integración con GTM', 'esbilla-cmp'); ?></h4>
                            <p><?php esc_html_e('Configura tus tags en Google Tag Manager y usa las variables de Esbilla para controlar cuándo se activan.', 'esbilla-cmp'); ?></p>
                        </div>
                    <?php endif; ?>
                </div>
            <?php endif; ?>

            <!-- Panel de ayuda -->
            <div class="esbilla-panel">
                <h3><?php esc_html_e('Comparación de Modos', 'esbilla-cmp'); ?></h3>
                <table class="esbilla-modes-table">
                    <tr>
                        <td><strong>⚙️ Manual</strong></td>
                        <td><?php esc_html_e('Máximo control, requiere modificar código', 'esbilla-cmp'); ?></td>
                    </tr>
                    <tr>
                        <td><strong>🚀 Simplificado</strong></td>
                        <td><?php esc_html_e('Configuración rápida, ideal para sitios comunes', 'esbilla-cmp'); ?></td>
                    </tr>
                    <tr>
                        <td><strong>📊 GTM</strong></td>
                        <td><?php esc_html_e('Integración avanzada, para gestión compleja de tags', 'esbilla-cmp'); ?></td>
                    </tr>
                </table>
            </div>

            <!-- Panel de licencia -->
            <div class="esbilla-panel esbilla-license-panel">
                <h3><?php esc_html_e('Software Libre', 'esbilla-cmp'); ?></h3>
                <p class="esbilla-license">
                    <?php esc_html_e('Esbilla CMP es software libre bajo licencia GPL v3.', 'esbilla-cmp'); ?>
                    <?php esc_html_e('Hecho con ❤️ en Asturias.', 'esbilla-cmp'); ?>
                </p>
                <p class="esbilla-copyright">
                    © 2026 <a href="https://clicaonline.com" target="_blank">Clica Online Soluciones S.L.</a>
                </p>
            </div>
        </div>
    </div>
</div>

<script>
// Mostrar/ocultar secciones según el modo seleccionado
jQuery(document).ready(function($) {
    function toggleSections() {
        const mode = $('input[name="esbilla_settings[implementation_mode]"]:checked').val();

        // GTM section (disponible en Simplificado y GTM)
        const $gtmSection = $('#esbilla_gtm_section').closest('tr').prev('tr');
        const $gtmFields = $gtmSection.nextAll('tr').slice(0, 1);

        if (mode === 'gtm' || mode === 'simplified') {
            $gtmSection.show();
            $gtmFields.show();
            $gtmFields.find('input').prop('disabled', false);
        } else {
            $gtmSection.hide();
            $gtmFields.hide();
            $gtmFields.find('input').prop('disabled', true);
        }

        // Scripts section
        const $scriptsSection = $('#esbilla_scripts_section').closest('tr').prev('tr');
        const $scriptsFields = $scriptsSection.nextAll('tr').slice(0, 5);

        if (mode === 'simplified') {
            $scriptsSection.show();
            $scriptsFields.show();
            $scriptsFields.find('input').prop('disabled', false);
        } else {
            $scriptsSection.hide();
            $scriptsFields.hide();
            $scriptsFields.find('input').prop('disabled', true);
        }
    }

    $('input[name="esbilla_settings[implementation_mode]"]').on('change', toggleSections);
    toggleSections();
});
</script>
