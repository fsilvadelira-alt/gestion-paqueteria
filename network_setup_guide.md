# 🌐 Guía de Conexión Segura en Red Local

Para que otras computadoras de la red vean la plataforma como **Segura** (con el candado verde), deben confiar en el Certificado de Autoridad (CA) que acabamos de generar.

## 📋 Pasos para otras computadoras (Windows)

1. **Obtener el certificado:**
   - Copia el archivo `rootCA.pem` que se encuentra en la carpeta `backend/certs/` de este servidor a la otra computadora (puedes usar una memoria USB o compartir la carpeta).
   - En la otra computadora, cambia la extensión de `.pem` a `.crt` (ejemplo: `rootCA.crt`).

2. **Instalar el certificado:**
   - Haz doble clic en el archivo `rootCA.crt`.
   - Haz clic en **Instalar certificado...**.
   - Selecciona **Usuario actual** y haz clic en Siguiente.
   - Selecciona **Colocar todos los certificados en el siguiente almacén**.
   - Haz clic en **Examinar** y elige **Entidades de certificación de raíz de confianza**.
   - Haz clic en Aceptar, Siguiente y **Finalizar**.
   - Aparecerá un aviso de seguridad preguntando si deseas instalar el certificado. Haz clic en **Sí**.

3. **Acceder a la plataforma:**
   - Abre tu navegador y visita:
     `https://192.168.68.119:3000`

---

## 📱 Pasos para Android/iOS

1. Envía el archivo `rootCA.pem` a tu dispositivo (por correo o descarga directa).
2. En la configuración de seguridad del teléfono, busca **Instalar desde el almacenamiento** -> **Certificado de CA**.
3. Selecciona el archivo y acéptalo.

---

> [!TIP]
> Si no instalas el certificado, la página seguirá funcionando pero el navegador mostrará una advertencia de "Conexión no privada". Simplemente deberás hacer clic en **Opciones avanzadas** y luego en **Acceder a (IP) (no seguro)**.
