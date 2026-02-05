/**
 * JavaScript para la página de administración de Esbilla CMP
 *
 * @package EsbillaCMP
 */

(function($) {
    'use strict';

    $(document).ready(function() {
        // Validación de Site ID (formato Esbilla: site_xxx o UUID)
        const $siteId = $('input[name="esbilla_settings[site_id]"]');
        // Acepta formato Esbilla (site_xxx) o UUID tradicional
        const siteIdRegex = /^(site_[a-z0-9]+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

        $siteId.on('blur', function() {
            const value = $(this).val().trim();
            if (value && !siteIdRegex.test(value)) {
                $(this).css('border-color', '#dc2626');
                if (!$(this).next('.error-message').length) {
                    $(this).after('<p class="error-message" style="color: #dc2626; font-size: 12px; margin-top: 4px;">El Site ID debe tener formato válido (site_xxx)</p>');
                }
            } else {
                $(this).css('border-color', '');
                $(this).next('.error-message').remove();
            }
        });

        // Validación de GTM ID
        const $gtmId = $('input[name="esbilla_settings[gtm_id]"]');
        const gtmRegex = /^GTM-[A-Z0-9]+$/i;

        $gtmId.on('blur', function() {
            const value = $(this).val().trim();
            if (value && !gtmRegex.test(value)) {
                $(this).css('border-color', '#dc2626');
                if (!$(this).next('.error-message').length) {
                    $(this).after('<p class="error-message" style="color: #dc2626; font-size: 12px; margin-top: 4px;">El GTM ID debe tener formato GTM-XXXXXXX</p>');
                }
            } else {
                $(this).css('border-color', '');
                $(this).next('.error-message').remove();
            }
        });

        // Validación de Google Analytics ID
        const $gaId = $('input[name="esbilla_settings[google_analytics_id]"]');
        const gaRegex = /^G-[A-Z0-9]+$/i;

        $gaId.on('blur', function() {
            const value = $(this).val().trim();
            if (value && !gaRegex.test(value)) {
                $(this).css('border-color', '#dc2626');
                if (!$(this).next('.error-message').length) {
                    $(this).after('<p class="error-message" style="color: #dc2626; font-size: 12px; margin-top: 4px;">El Measurement ID debe tener formato G-XXXXXXXXXX</p>');
                }
            } else {
                $(this).css('border-color', '');
                $(this).next('.error-message').remove();
            }
        });

        // Animación al cambiar de modo
        $('input[name="esbilla_settings[implementation_mode]"]').on('change', function() {
            const mode = $(this).val();
            const $form = $(this).closest('form');

            // Animación suave
            $form.animate({ opacity: 0.7 }, 200, function() {
                $(this).animate({ opacity: 1 }, 200);
            });

            // Mensaje contextual
            const messages = {
                'manual': 'Modo Manual seleccionado. Tendrás control total sobre tus scripts.',
                'simplified': 'Modo Simplificado seleccionado. Configura los IDs de las plataformas que usas.',
                'gtm': 'Modo GTM seleccionado. Configura tu Google Tag Manager ID.'
            };

            // Mostrar mensaje temporal
            const $message = $('<div class="notice notice-info is-dismissible" style="margin: 12px 0;"><p>' + messages[mode] + '</p></div>');
            $form.prepend($message);

            setTimeout(function() {
                $message.fadeOut(300, function() {
                    $(this).remove();
                });
            }, 3000);
        });

        // Confirmar antes de guardar si no hay Site ID
        $('form').on('submit', function(e) {
            const $enabled = $('input[name="esbilla_settings[enabled]"]');
            const $siteIdField = $('input[name="esbilla_settings[site_id]"]');

            if ($enabled.is(':checked') && !$siteIdField.val().trim()) {
                e.preventDefault();
                alert('Por favor, introduce un Site ID válido antes de habilitar el plugin.');
                $siteIdField.focus();
                return false;
            }
        });

        // Copy to clipboard para ejemplos de código
        $('.esbilla-mode-help code').on('click', function() {
            const text = $(this).text();
            navigator.clipboard.writeText(text).then(function() {
                alert('Código copiado al portapapeles');
            }).catch(function(err) {
                console.error('Error al copiar:', err);
            });
        });

        // Tooltip al pasar sobre los iconos de modo
        $('.mode-icon').attr('title', 'Este es tu modo de implementación actual');
    });

})(jQuery);
