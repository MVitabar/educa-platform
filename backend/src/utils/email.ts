import nodemailer from 'nodemailer';
import config from '../config';

// Configuración del transporte de correo
export const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure, // true para 465, false para otros puertos
  auth: {
    user: config.email.user,
    pass: config.email.password,
  },
});

// Interfaz para el correo electrónico
interface EmailOptions {
  email: string;
  subject: string;
  message: string;
  html?: string;
}

/**
 * Envía un correo electrónico
 * @param options Opciones del correo (email, subject, message, html)
 * @returns Promise con la información del envío
 */
const sendEmail = async (options: EmailOptions) => {
  // 1) Definir las opciones del correo
  const mailOptions = {
    from: `"${config.email.fromName}" <${config.email.fromEmail}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || options.message, // Usa HTML si está disponible, si no, usa texto plano
  };

  // 2) Enviar el correo
  return transporter.sendMail(mailOptions);
};

/**
 * Envía un correo de bienvenida al usuario recién registrado
 */
export const sendWelcomeEmail = async (user: { email: string; name: string; emailVerificationToken: string }) => {
  const verificationUrl = `${config.appUrl}/verify-email/${user.emailVerificationToken}`;
  
  const message = `
    ¡Bienvenido a ${config.appName}, ${user.name}!
    
    Gracias por registrarte en nuestra plataforma. 
    Por favor, verifica tu dirección de correo electrónico haciendo clic en el siguiente enlace:
    
    ${verificationUrl}
    
    Si no has creado una cuenta, por favor ignora este correo.
  `;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">¡Bienvenido a ${config.appName}, ${user.name}!</h2>
      <p>Gracias por registrarte en nuestra plataforma.</p>
      <p>Por favor, verifica tu dirección de correo electrónico haciendo clic en el siguiente botón:</p>
      <div style="margin: 25px 0;">
        <a href="${verificationUrl}" 
           style="background-color: #4CAF50; color: white; padding: 12px 25px; 
                  text-decoration: none; border-radius: 4px; font-weight: bold;">
          Verificar correo electrónico
        </a>
      </div>
      <p>O copia y pega este enlace en tu navegador:</p>
      <p style="word-break: break-all;">${verificationUrl}</p>
      <p>Si no has creado una cuenta, por favor ignora este correo.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 0.9em; color: #777;">
        Este es un correo automático, por favor no respondas a este mensaje.
      </p>
    </div>
  `;

  return sendEmail({
    email: user.email,
    subject: `Bienvenido a ${config.appName} - Verifica tu correo electrónico`,
    message,
    html,
  });
};

/**
 * Envía un correo para restablecer la contraseña
 */
export const sendPasswordResetEmail = async (user: { email: string; name: string; passwordResetToken: string }) => {
  const resetUrl = `${config.appUrl}/reset-password/${user.passwordResetToken}`;
  
  const message = `
    Hola ${user.name},
    
    Has solicitado restablecer tu contraseña. Por favor, haz clic en el siguiente enlace 
    para establecer una nueva contraseña:
    
    ${resetUrl}
    
    Este enlace es válido por 10 minutos.
    
    Si no has solicitado restablecer tu contraseña, por favor ignora este correo.
  `;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">Restablecer tu contraseña</h2>
      <p>Hola ${user.name},</p>
      <p>Has solicitado restablecer tu contraseña. Por favor, haz clic en el siguiente botón para establecer una nueva contraseña:</p>
      <div style="margin: 25px 0;">
        <a href="${resetUrl}" 
           style="background-color: #3498db; color: white; padding: 12px 25px; 
                  text-decoration: none; border-radius: 4px; font-weight: bold;">
          Restablecer contraseña
        </a>
      </div>
      <p>O copia y pega este enlace en tu navegador:</p>
      <p style="word-break: break-all;">${resetUrl}</p>
      <p>Este enlace es válido por 10 minutos.</p>
      <p>Si no has solicitado restablecer tu contraseña, por favor ignora este correo.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 0.9em; color: #777;">
        Este es un correo automático, por favor no respondas a este mensaje.
      </p>
    </div>
  `;

  return sendEmail({
    email: user.email,
    subject: 'Restablecer tu contraseña',
    message,
    html,
  });
};

export default sendEmail;
