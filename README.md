# bot-wp-arca

Un bot de WhatsApp que interactúa con los servicios web de ARCA (Agencia de Recaudación y Control Aduanero) de Argentina para realizar consultas y operaciones fiscales.

## Características principales

- Consulta de puntos de venta habilitados
- Consulta de tipos de comprobantes, conceptos, documentos e IVA
- Consulta de tipos de monedas y cotizaciones
- Consulta de último comprobante autorizado
- Emisión de facturas electrónicas (Facturación Electrónica)

## Requisitos previos

- Node.js (versión 16 o superior)
- npm
- Cuenta de WhatsApp vinculada a un número telefónico
- Certificados digitales de AFIP (.crt y .key)
- CUIT válido habilitado para facturación electrónica

## Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/tu-usuario/whatsapp-afip-bot.git
cd whatsapp-afip-bot
```

2. Instala las dependencias:
```bash
npm install
```

3. Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:
```
TESTMODE=true  # o false para entorno de producción
WEBSERVICEDIR=webservice/  # directorio para almacenar archivos
COOLDOWNTIME=2000  # tiempo de espera entre mensajes en ms
```

## Configuración inicial

1. Inicia el bot:
```bash
npm start
```

2. Escanea el código QR que aparece en la terminal con WhatsApp en tu teléfono.

3. Configura tus credenciales enviando los siguientes mensajes al bot:
   - `configuracion cuit TU_CUIT` (reemplaza TU_CUIT con tu número de CUIT)
   - Envía tu certificado `.crt` con el mensaje `configuracion crt` (como archivo adjunto)
   - Envía tu clave privada `.key` con el mensaje `configuracion key` (como archivo adjunto)

## Uso del bot

Envía cualquiera de estos comandos al bot:

- `puntos venta`: Lista tus puntos de venta habilitados
- `tipos comprobante`: Muestra los tipos de comprobantes disponibles
- `tipos documento`: Muestra los tipos de documentos aceptados
- `tipos iva`: Muestra las alícuotas de IVA
- `cotizacion [moneda] [fecha]`: Consulta cotización de moneda (ej: `cotizacion DOL 20230501`)
- `ultimo comprobante`: Consulta el último comprobante autorizado
- `facturar [pto_venta] [tipo] [concepto] [doc_tipo] [doc_nro] [importe] [iva]`: Emite una factura
- `ayuda`: Muestra todos los comandos disponibles

## Estructura del proyecto

- `main.ts`: Lógica principal del bot de WhatsApp
- `arca.ts`: Cliente para los servicios web de AFIP
- `file.ts`: Utilidades para manejo de archivos YAML y base64
- `webservice/`: Directorio donde se almacenan certificados y datos de usuarios

## Entorno de prueba vs producción

El bot funciona en entorno de prueba (homologación) por defecto. Para cambiar a producción:
1. Establece `TESTMODE=false` en el archivo `.env`
2. Asegúrate de tener certificados válidos para producción

## Contribuciones

Las contribuciones son bienvenidas. Por favor abre un issue o pull request para sugerir mejoras.

## Licencia

[MIT](https://choosealicense.com/licenses/mit/)