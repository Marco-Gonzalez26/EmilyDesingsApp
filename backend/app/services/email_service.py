import os
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pydantic import EmailStr
from typing import Optional, List, Dict
from dotenv import load_dotenv

load_dotenv()

conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM=os.getenv("MAIL_FROM"),
    MAIL_PORT=465,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_STARTTLS=False,
    MAIL_SSL_TLS=True,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
)

MAIL_FROM_NAME = os.getenv("MAIL_FROM_NAME", "Emily Designs")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:4200")


async def send_order_confirmation_email(
    to_email: EmailStr,
    nombre_cliente: str,
    numero_orden: str,
    total: float,
    items: List[Dict],
    direccion_envio: str,
) -> bool:
    """Enviar email de confirmación de orden"""

    try:

        items_html = ""
        for item in items:
            items_html += f"""
            <tr>
                <td style="padding: 15px; border-bottom: 1px solid #F5EDE8;">
                    <div style="font-weight: 600; color: #2D2424; margin-bottom: 5px;">
                        {item['nombre_producto']}
                    </div>
                    <div style="font-size: 14px; color: #8B7B75;">
                        Cantidad: {item['cantidad']} × ${item['precio_unitario']:.2f}
                    </div>
                </td>
                <td style="padding: 15px; border-bottom: 1px solid #F5EDE8; text-align: right;">
                    <span style="font-weight: 600; color: #2D2424;">
                        ${item['subtotal']:.2f}
                    </span>
                </td>
            </tr>
            """

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Georgia, serif; background-color: #FAF8F6;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 40px 20px;">
                        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                            
                            <tr>
                                <td style="background: linear-gradient(135deg, #D4A5A5 0%, #C89B9B 100%); padding: 40px 30px; text-align: center;">
                                    <h1 style="margin: 0; color: #FFFFFF; font-size: 32px; font-weight: 400; letter-spacing: 2px;">
                                        EMILY DESIGNS
                                    </h1>
                                    <p style="margin: 10px 0 0 0; color: #FFFFFF; font-size: 14px; opacity: 0.9;">
                                        Fashion & Elegance
                                    </p>
                                </td>
                            </tr>
                            
                            <tr>
                                <td style="padding: 40px 30px;">
                                    <h2 style="margin: 0 0 20px 0; color: #2D2424; font-size: 24px; font-weight: 400;">
                                        ¡Gracias por tu compra, {nombre_cliente}!
                                    </h2>
                                    <p style="margin: 0 0 20px 0; color: #8B7B75; font-size: 16px; line-height: 1.6;">
                                        Tu orden ha sido recibida y está siendo procesada. Te notificaremos cuando sea enviada.
                                    </p>
                                    
                                    <div style="background-color: #F5EDE8; border-left: 4px solid #D4A5A5; padding: 20px; margin: 30px 0; border-radius: 4px;">
                                        <div style="font-size: 14px; color: #8B7B75; margin-bottom: 5px;">
                                            Número de Orden
                                        </div>
                                        <div style="font-size: 24px; font-weight: 600; color: #2D2424;">
                                            #{numero_orden}
                                        </div>
                                    </div>
                                    
                                    <h3 style="margin: 30px 0 15px 0; color: #2D2424; font-size: 18px; font-weight: 600;">
                                        Detalles de tu Orden
                                    </h3>
                                    
                                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                                        {items_html}
                                        <tr>
                                            <td style="padding: 20px 15px 15px 15px; text-align: right; font-weight: 600; color: #2D2424; font-size: 18px;" colspan="2">
                                                Total: <span style="color: #D4A5A5;">${total:.2f}</span>
                                            </td>
                                        </tr>
                                    </table>
                                    
                                    <h3 style="margin: 30px 0 15px 0; color: #2D2424; font-size: 18px; font-weight: 600;">
                                        Dirección de Envío
                                    </h3>
                                    <div style="background-color: #FAF8F6; padding: 15px; border-radius: 4px; color: #2D2424; line-height: 1.6;">
                                        {direccion_envio.replace(chr(10), '<br>')}
                                    </div>
                                    
                                    <div style="text-align: center; margin: 40px 0;">
                                        <a href="{FRONTEND_URL}/ordenes" style="display: inline-block; background-color: #D4A5A5; color: #FFFFFF; text-decoration: none; padding: 15px 40px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                                            Ver Mi Orden
                                        </a>
                                    </div>
                                </td>
                            </tr>
                            
                            <tr>
                                <td style="background-color: #2D2424; padding: 30px; text-align: center;">
                                    
                                    <div style="border-top: 1px solid rgba(255, 255, 255, 0.2); padding-top: 20px; margin-top: 20px;">
                                        <p style="margin: 0; color: #8B7B75; font-size: 12px;">
                                            © 2026 Emily Designs. Todos los derechos reservados.
                                        </p>
                                    </div>
                                </td>
                            </tr>
                            
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """

        message = MessageSchema(
            subject=f"Confirmación de Orden #{numero_orden} - Emily Designs",
            recipients=[to_email],
            body=html_content,
            subtype="html",
        )

        fm = FastMail(conf)
        await fm.send_message(message)

        return True

    except Exception as e:
        return False


def send_password_reset_email(
    to_email: str, nombre_usuario: str, reset_token: str
) -> bool:
    """Enviar email de recuperación de contraseña"""

    reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"

    html_content = get_password_reset_template(
        nombre_usuario=nombre_usuario, reset_link=reset_link
    )

    subject = "Recuperación de Contraseña - Emily Designs"

    return send_email(to_email, subject, html_content)


def get_order_confirmation_template(
    nombre_cliente: str,
    numero_orden: str,
    total: float,
    items: list,
    direccion_envio: str,
) -> str:
    """Template HTML para confirmación de orden"""

    items_html = ""
    for item in items:
        items_html += f"""
        <tr>
            <td style="padding: 15px; border-bottom: 1px solid #F5EDE8;">
                <div style="font-weight: 600; color: #2D2424; margin-bottom: 5px;">
                    {item['nombre_producto']}
                </div>
                <div style="font-size: 14px; color: #8B7B75;">
                    Cantidad: {item['cantidad']} × ${item['precio_unitario']:.2f}
                </div>
            </td>
            <td style="padding: 15px; border-bottom: 1px solid #F5EDE8; text-align: right;">
                <span style="font-weight: 600; color: #2D2424;">
                    ${item['subtotal']:.2f}
                </span>
            </td>
        </tr>
        """

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmación de Orden</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Georgia', serif; background-color: #FAF8F6;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="padding: 40px 20px;">
                    <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                        
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #D4A5A5 0%, #C89B9B 100%); padding: 40px 30px; text-align: center;">
                                <h1 style="margin: 0; color: #FFFFFF; font-size: 32px; font-weight: 400; letter-spacing: 2px;">
                                    EMILY DESIGNS
                                </h1>
                                <p style="margin: 10px 0 0 0; color: #FFFFFF; font-size: 14px; opacity: 0.9;">
                                    Fashion & Elegance
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px 30px;">
                                <h2 style="margin: 0 0 20px 0; color: #2D2424; font-size: 24px; font-weight: 400;">
                                    ¡Gracias por tu compra, {nombre_cliente}!
                                </h2>
                                <p style="margin: 0 0 20px 0; color: #8B7B75; font-size: 16px; line-height: 1.6;">
                                    Tu orden ha sido recibida y está siendo procesada. Te notificaremos cuando sea enviada.
                                </p>
                                
                                <!-- Order Number Box -->
                                <div style="background-color: #F5EDE8; border-left: 4px solid #D4A5A5; padding: 20px; margin: 30px 0; border-radius: 4px;">
                                    <div style="font-size: 14px; color: #8B7B75; margin-bottom: 5px;">
                                        Número de Orden
                                    </div>
                                    <div style="font-size: 24px; font-weight: 600; color: #2D2424;">
                                        #{numero_orden}
                                    </div>
                                </div>
                                
                                <!-- Order Details -->
                                <h3 style="margin: 30px 0 15px 0; color: #2D2424; font-size: 18px; font-weight: 600;">
                                    Detalles de tu Orden
                                </h3>
                                
                                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                                    {items_html}
                                    <tr>
                                        <td style="padding: 20px 15px 15px 15px; text-align: right; font-weight: 600; color: #2D2424; font-size: 18px;" colspan="2">
                                            Total: <span style="color: #D4A5A5;">${total:.2f}</span>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- Shipping Address -->
                                <h3 style="margin: 30px 0 15px 0; color: #2D2424; font-size: 18px; font-weight: 600;">
                                    Dirección de Envío
                                </h3>
                                <div style="background-color: #FAF8F6; padding: 15px; border-radius: 4px; color: #2D2424; line-height: 1.6;">
                                    {direccion_envio.replace(chr(10), '<br>')}
                                </div>
                                
                                <!-- CTA Button -->
                                <div style="text-align: center; margin: 40px 0;">
                                    <a href="{FRONTEND_URL}/mis-ordenes" style="display: inline-block; background-color: #D4A5A5; color: #FFFFFF; text-decoration: none; padding: 15px 40px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                                        Ver Mi Orden
                                    </a>
                                </div>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #2D2424; padding: 30px; text-align: center;">
                                <p style="margin: 0 0 10px 0; color: #FFFFFF; font-size: 14px;">
                                    ¿Necesitas ayuda? Contáctanos en
                                </p>
                                <p style="margin: 0 0 20px 0;">
                                    <a href="mailto:soporte@emilydesigns.com" style="color: #D4A5A5; text-decoration: none;">
                                        soporte@emilydesigns.com
                                    </a>
                                </p>
                                <div style="border-top: 1px solid rgba(255, 255, 255, 0.2); padding-top: 20px; margin-top: 20px;">
                                    <p style="margin: 0; color: #8B7B75; font-size: 12px;">
                                        © 2025 Emily Designs. Todos los derechos reservados.
                                    </p>
                                </div>
                            </td>
                        </tr>
                        
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """


def get_password_reset_template(nombre_usuario: str, reset_link: str) -> str:
    """Template HTML para recuperación de contraseña"""

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperación de Contraseña</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Georgia', serif; background-color: #FAF8F6;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="padding: 40px 20px;">
                    <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                        
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #D4A5A5 0%, #C89B9B 100%); padding: 40px 30px; text-align: center;">
                                <h1 style="margin: 0; color: #FFFFFF; font-size: 32px; font-weight: 400; letter-spacing: 2px;">
                                    EMILY DESIGNS
                                </h1>
                                <p style="margin: 10px 0 0 0; color: #FFFFFF; font-size: 14px; opacity: 0.9;">
                                    Fashion & Elegance
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px 30px;">
                                <h2 style="margin: 0 0 20px 0; color: #2D2424; font-size: 24px; font-weight: 400;">
                                    Recuperación de Contraseña
                                </h2>
                                <p style="margin: 0 0 20px 0; color: #8B7B75; font-size: 16px; line-height: 1.6;">
                                    Hola {nombre_usuario},
                                </p>
                                <p style="margin: 0 0 20px 0; color: #8B7B75; font-size: 16px; line-height: 1.6;">
                                    Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo para crear una nueva contraseña.
                                </p>
                                
                                <!-- Alert Box -->
                                <div style="background-color: #FEF3CD; border-left: 4px solid #F6C343; padding: 15px; margin: 20px 0; border-radius: 4px;">
                                    <p style="margin: 0; color: #856404; font-size: 14px;">
                                        ⚠️ Este enlace expirará en 1 hora por seguridad.
                                    </p>
                                </div>
                                
                                <!-- CTA Button -->
                                <div style="text-align: center; margin: 40px 0;">
                                    <a href="{reset_link}" style="display: inline-block; background-color: #D4A5A5; color: #FFFFFF; text-decoration: none; padding: 15px 40px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                                        Restablecer Contraseña
                                    </a>
                                </div>
                                
                                <p style="margin: 20px 0 0 0; color: #8B7B75; font-size: 14px; line-height: 1.6;">
                                    Si no solicitaste este cambio, puedes ignorar este email de forma segura.
                                </p>
                                
                                <!-- Link alternativo -->
                                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #F5EDE8;">
                                    <p style="margin: 0 0 10px 0; color: #8B7B75; font-size: 12px;">
                                        Si el botón no funciona, copia y pega este enlace en tu navegador:
                                    </p>
                                    <p style="margin: 0; font-size: 12px; word-break: break-all;">
                                        <a href="{reset_link}" style="color: #D4A5A5; text-decoration: none;">
                                            {reset_link}
                                        </a>
                                    </p>
                                </div>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #2D2424; padding: 30px; text-align: center;">
                                <p style="margin: 0 0 10px 0; color: #FFFFFF; font-size: 14px;">
                                    ¿Necesitas ayuda? Contáctanos en
                                </p>
                                <p style="margin: 0 0 20px 0;">
                                    <a href="mailto:soporte@emilydesigns.com" style="color: #D4A5A5; text-decoration: none;">
                                        soporte@emilydesigns.com
                                    </a>
                                </p>
                                <div style="border-top: 1px solid rgba(255, 255, 255, 0.2); padding-top: 20px; margin-top: 20px;">
                                    <p style="margin: 0; color: #8B7B75; font-size: 12px;">
                                        © 2025 Emily Designs. Todos los derechos reservados.
                                    </p>
                                </div>
                            </td>
                        </tr>
                        
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
