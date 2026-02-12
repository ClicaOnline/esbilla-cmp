const nodemailer = require('nodemailer');

/**
 * Email service for sending invitations
 * Uses SMTP configuration from environment variables
 */

// Create reusable transporter
const createTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[Email] SMTP not configured, emails will be logged to console');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Email templates by language
const getInvitationEmailTemplate = (locale, data) => {
  const { inviterName, organizationName, role, inviteUrl } = data;

  const templates = {
    es: {
      subject: `${inviterName} te invita a unirte a ${organizationName} en Esbilla CMP 🌽`,
      html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitación a ${organizationName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #FEF3E0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FEF3E0; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #FFBF00 0%, #FF8800 100%); padding: 40px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">🌽</div>
              <h1 style="margin: 0; color: #3D2B1F; font-size: 24px; font-weight: 700;">Esbilla CMP</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px 0; color: #3D2B1F; font-size: 20px; font-weight: 600;">
                Has recibido una invitación
              </h2>

              <p style="margin: 0 0 24px 0; color: #57534E; font-size: 16px; line-height: 1.6;">
                <strong>${inviterName}</strong> te ha invitado a unirte a
                <strong>${organizationName}</strong> como <strong>${role}</strong>
                en Esbilla CMP.
              </p>

              <p style="margin: 0 0 32px 0; color: #57534E; font-size: 14px; line-height: 1.6;">
                Esbilla es una plataforma de gestión de consentimientos (CMP) que te ayuda
                a cumplir con GDPR y ePrivacy de forma sencilla y transparente.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 0 0 24px 0;">
                    <a href="${inviteUrl}" style="display: inline-block; background-color: #FFBF00; color: #3D2B1F; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Aceptar invitación
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 8px 0; color: #78716C; font-size: 12px; line-height: 1.5;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:
              </p>
              <p style="margin: 0 0 24px 0; color: #78716C; font-size: 12px; word-break: break-all;">
                ${inviteUrl}
              </p>

              <p style="margin: 0; color: #A8A29E; font-size: 12px; line-height: 1.5;">
                Esta invitación expirará en 7 días. Si no solicitaste esta invitación,
                puedes ignorar este email de forma segura.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #FEF3E0; padding: 24px; text-align: center; border-top: 1px solid #E7E5E4;">
              <p style="margin: 0 0 8px 0; color: #78716C; font-size: 12px;">
                Esbilla CMP — Consent management made in Asturias 🌽
              </p>
              <p style="margin: 0; color: #A8A29E; font-size: 11px;">
                <a href="https://esbilla.com" style="color: #A8A29E; text-decoration: none;">esbilla.com</a> •
                <a href="https://github.com/jlasolis/esbilla" style="color: #A8A29E; text-decoration: none;">GitHub</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
      text: `
${inviterName} te ha invitado a unirte a ${organizationName}

Has sido invitado a unirte a ${organizationName} como ${role} en Esbilla CMP.

Para aceptar la invitación, visita:
${inviteUrl}

Esta invitación expirará en 7 días.

Esbilla CMP — Consent management made in Asturias 🌽
https://esbilla.com
      `,
    },
    en: {
      subject: `${inviterName} invited you to join ${organizationName} on Esbilla CMP 🌽`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation to ${organizationName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #FEF3E0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FEF3E0; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #FFBF00 0%, #FF8800 100%); padding: 40px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">🌽</div>
              <h1 style="margin: 0; color: #3D2B1F; font-size: 24px; font-weight: 700;">Esbilla CMP</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px 0; color: #3D2B1F; font-size: 20px; font-weight: 600;">
                You've been invited
              </h2>

              <p style="margin: 0 0 24px 0; color: #57534E; font-size: 16px; line-height: 1.6;">
                <strong>${inviterName}</strong> has invited you to join
                <strong>${organizationName}</strong> as <strong>${role}</strong>
                on Esbilla CMP.
              </p>

              <p style="margin: 0 0 32px 0; color: #57534E; font-size: 14px; line-height: 1.6;">
                Esbilla is a Consent Management Platform (CMP) that helps you
                comply with GDPR and ePrivacy in a simple and transparent way.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 0 0 24px 0;">
                    <a href="${inviteUrl}" style="display: inline-block; background-color: #FFBF00; color: #3D2B1F; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Accept invitation
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 8px 0; color: #78716C; font-size: 12px; line-height: 1.5;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 24px 0; color: #78716C; font-size: 12px; word-break: break-all;">
                ${inviteUrl}
              </p>

              <p style="margin: 0; color: #A8A29E; font-size: 12px; line-height: 1.5;">
                This invitation will expire in 7 days. If you didn't request this invitation,
                you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #FEF3E0; padding: 24px; text-align: center; border-top: 1px solid #E7E5E4;">
              <p style="margin: 0 0 8px 0; color: #78716C; font-size: 12px;">
                Esbilla CMP — Consent management made in Asturias 🌽
              </p>
              <p style="margin: 0; color: #A8A29E; font-size: 11px;">
                <a href="https://esbilla.com" style="color: #A8A29E; text-decoration: none;">esbilla.com</a> •
                <a href="https://github.com/jlasolis/esbilla" style="color: #A8A29E; text-decoration: none;">GitHub</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
      text: `
${inviterName} invited you to join ${organizationName}

You've been invited to join ${organizationName} as ${role} on Esbilla CMP.

To accept the invitation, visit:
${inviteUrl}

This invitation will expire in 7 days.

Esbilla CMP — Consent management made in Asturias 🌽
https://esbilla.com
      `,
    },
    ast: {
      subject: `${inviterName} convidóte a xunite a ${organizationName} n'Esbilla CMP 🌽`,
      html: `
<!DOCTYPE html>
<html lang="ast">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Convidada a ${organizationName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #FEF3E0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FEF3E0; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #FFBF00 0%, #FF8800 100%); padding: 40px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">🌽</div>
              <h1 style="margin: 0; color: #3D2B1F; font-size: 24px; font-weight: 700;">Esbilla CMP</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px 0; color: #3D2B1F; font-size: 20px; font-weight: 600;">
                Recibisti una convidada
              </h2>

              <p style="margin: 0 0 24px 0; color: #57534E; font-size: 16px; line-height: 1.6;">
                <strong>${inviterName}</strong> convidóte a xunite a
                <strong>${organizationName}</strong> como <strong>${role}</strong>
                n'Esbilla CMP.
              </p>

              <p style="margin: 0 0 32px 0; color: #57534E; font-size: 14px; line-height: 1.6;">
                Esbilla ye una plataforma de xestión de consentimientos (CMP) qu'ayúdate
                a cumplir col GDPR y ePrivacy de forma cenciella y tresparente.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 0 0 24px 0;">
                    <a href="${inviteUrl}" style="display: inline-block; background-color: #FFBF00; color: #3D2B1F; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Aceptar convidada
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 8px 0; color: #78716C; font-size: 12px; line-height: 1.5;">
                Si'l botón nun funciona, copia y apiega esti enllaz nel to navegador:
              </p>
              <p style="margin: 0 0 24px 0; color: #78716C; font-size: 12px; word-break: break-all;">
                ${inviteUrl}
              </p>

              <p style="margin: 0; color: #A8A29E; font-size: 12px; line-height: 1.5;">
                Esta convidada caducará en 7 díes. Si nun solicitesti esta convidada,
                pues inorar esti email de forma segura.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #FEF3E0; padding: 24px; text-align: center; border-top: 1px solid #E7E5E4;">
              <p style="margin: 0 0 8px 0; color: #78716C; font-size: 12px;">
                Esbilla CMP — Consent management made in Asturias 🌽
              </p>
              <p style="margin: 0; color: #A8A29E; font-size: 11px;">
                <a href="https://esbilla.com" style="color: #A8A29E; text-decoration: none;">esbilla.com</a> •
                <a href="https://github.com/jlasolis/esbilla" style="color: #A8A29E; text-decoration: none;">GitHub</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
      text: `
${inviterName} convidóte a xunite a ${organizationName}

Convidáronte a xunite a ${organizationName} como ${role} n'Esbilla CMP.

Pa aceptar la convidada, visita:
${inviteUrl}

Esta convidada caducará en 7 díes.

Esbilla CMP — Consent management made in Asturias 🌽
https://esbilla.com
      `,
    },
  };

  return templates[locale] || templates.es;
};

/**
 * Send invitation email
 */
const sendInvitationEmail = async (to, data) => {
  const transporter = createTransporter();

  if (!transporter) {
    // Development mode: log to console
    console.log('[Email] Would send invitation email to:', to);
    console.log('[Email] Data:', data);
    return { messageId: 'dev-mode-' + Date.now() };
  }

  const template = getInvitationEmailTemplate(data.locale || 'es', data);

  const mailOptions = {
    from: process.env.FROM_EMAIL || 'Esbilla CMP <noreply@esbilla.com>',
    to,
    subject: template.subject,
    text: template.text,
    html: template.html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[Email] Invitation sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('[Email] Error sending invitation:', error);
    throw error;
  }
};

module.exports = {
  sendInvitationEmail,
};
