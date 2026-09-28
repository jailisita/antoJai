# AntoJai 🍢

App de pedidos para un puesto de fritos, construida con **Expo + React Native + Supabase + Cloudinary**.

- Cualquiera puede **ver el menú sin iniciar sesión**.
- Los clientes se **registran/inician sesión** para hacer pedidos y ver su historial.
- Tú (el **admin**) tienes un panel para crear **categorías**, publicar/editar **productos** (con nombre, precio, descripción, info adicional y foto) y **confirmar pedidos**.
- Las **fotos de productos, el QR de pago y los comprobantes** se suben directo a **Cloudinary** (no ocupa espacio de tu base de datos y es gratis hasta un límite generoso).
- El cliente puede pagar por **Nequi / llave Bre-B** (sube el pantallazo del pago) o **efectivo contra entrega**, según lo que tú definas.

---

## 1. Requisitos

- Node.js 18+
- Una cuenta gratis en [supabase.com](https://supabase.com)
- Una cuenta gratis en [cloudinary.com](https://cloudinary.com)
- Expo Go instalado en tu celular (para probar rápido) o un simulador iOS/Android

## 2. Crear el proyecto en Supabase

1. Entra a [supabase.com](https://supabase.com) → **New project**.
2. Cuando esté listo, ve a **SQL Editor → New query**, pega el contenido completo de `supabase/schema.sql` (está en este proyecto) y dale **Run**. Esto crea todas las tablas, la seguridad (RLS) y las políticas.
3. Ve a **Project Settings → API** y copia:
   - `Project URL`
   - `anon public key`

> Nota: a diferencia de otros proyectos, aquí **no necesitas crear buckets de Storage** en Supabase — todas las fotos van a Cloudinary.

## 3. Crear el "upload preset" en Cloudinary (para subir fotos sin backend)

1. Entra a [cloudinary.com](https://cloudinary.com) → crea tu cuenta gratis.
2. En el **Dashboard**, copia tu **Cloud name** (aparece arriba, ej: `dxxxx1234`).
3. Ve a **Settings (⚙️) → Upload → Upload presets → Add upload preset**.
4. Ponle un nombre fácil de recordar, ej: `antojai_unsigned`.
5. En **Signing Mode** selecciona **Unsigned** (esto permite subir fotos directo desde el celular sin exponer tu clave secreta).
6. Guarda.

## 4. Configurar el proyecto local

```bash
cp .env.example .env
```

Edita `.env` con tus datos:

```
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key

EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=tu_cloud_name
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=antojai_unsigned
```

Instala dependencias:

```bash
npm install
```

Corre la app:

```bash
npx expo start
```

Escanea el QR con la app **Expo Go** (Android/iOS) o presiona `i` / `a` si tienes simuladores.

## 5. Convertirte en administrador

1. Abre la app y **regístrate normalmente** con tu correo (quedas como cliente por defecto).
2. En Supabase, ve a **SQL Editor** y corre (cambia el correo):

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'tu-correo@ejemplo.com');
```

3. Vuelve a abrir la app (o cierra y abre sesión). Verás el botón **"Ir al panel de administración"** en la pantalla principal y en tu perfil.

## 6. Montar tus productos

Panel admin → **Categorías**: crea las que necesites (ej: Empanadas, Papas rellenas, Salchipapas, Bebidas, Adiciones).

Panel admin → **Productos → Nuevo producto**: para cada producto defines:
- **Nombre** (ej: "Empanada de carne")
- **Precio**
- **Foto** (se sube automáticamente a Cloudinary al guardar)
- **Descripción** (opcional)
- **Información adicional** (opcional, texto libre — ingredientes, picante, tamaño, lo que quieras)
- **Categoría**
- **Disponible hoy** (para ocultarlo temporalmente sin borrarlo, ej. si se te acabó)

## 7. Configurar tu método de pago

Panel admin → **Método de pago**:
- Sube tu **QR de Bre-B / Nequi** (va a Cloudinary).
- Escribe tu **llave Bre-B o número Nequi**.
- Define si aceptas **efectivo contra entrega**.
- Agrega tu **WhatsApp**, dirección y horario (útil para mostrarlos más adelante en la app o compartirlos con clientes).

## 8. Cómo pide un cliente

1. Ve el menú sin necesidad de iniciar sesión, agrega productos al carrito.
2. Al ir a pagar, si no ha iniciado sesión, se le pide registrarse/iniciar sesión.
3. Elige método de pago:
   - **Nequi / Bre-B**: ve tu QR y llave, transfiere, sube el pantallazo → el pedido queda **"Pago en revisión"**.
   - **Efectivo contra entrega**: el pedido queda **"Pendiente de confirmación"**.
4. Tú revisas el pedido en **Panel admin → Pedidos**:
   - Si es Nequi: revisas el comprobante y tocas **Confirmar pago** o **Rechazar pago**.
   - Si es efectivo: tocas **Aceptar pedido** o **Rechazar pedido**.
5. Luego puedes ir avanzando el estado: **En preparación → Listo → Entregado**.

## 8b. Panel de administración (qué incluye)

Entra desde el banner de la pantalla principal o desde tu perfil (solo si tu rol es `admin`):

- **Dashboard**: ventas de hoy, pedidos por atender / en curso, total de productos y agotados.
- **Productos**: buscar, filtrar por categoría, **activar/desactivar disponibilidad con un toque**, crear, editar (foto, precio, descripción, info adicional, categoría) y eliminar.
- **Categorías**: crear, **renombrar**, **reordenar** (flechas) y eliminar; muestra cuántos productos tiene cada una.
- **Pedidos**: filtros *Por atender / En curso / Finalizados / Todos*, ver comprobante, confirmar o rechazar pago, avanzar estado, cancelar y **escribir al cliente por WhatsApp**.
- **Tienda y pagos**: QR, llave Nequi/Bre-B, efectivo sí/no, WhatsApp, dirección y horario (se muestran en el inicio de la app).

## 9. Estructura del proyecto

```
app/                    Pantallas (expo-router, basado en archivos)
  index.tsx              Menú público (sin login)
  product/[id].tsx        Detalle de producto
  cart.tsx                Carrito
  checkout.tsx             Pago (Nequi/Bre-B o efectivo) + subir comprobante
  login.tsx / register.tsx  Autenticación de clientes
  profile.tsx               Perfil del usuario
  orders/                   Mis pedidos (cliente)
  admin/                    Panel de administrador
    index.tsx                Dashboard
    categories.tsx           CRUD de categorías
    products/                CRUD de productos (con foto vía Cloudinary)
    orders/                  Revisar y confirmar pedidos
    settings.tsx             QR, llave Bre-B/Nequi, WhatsApp, horario
    _layout.tsx              Protege todo el panel (solo rol admin)

components/             Componentes reutilizables (tarjetas, botones, formulario de producto...)
context/                Estado global: sesión (Auth) y carrito (Cart)
lib/supabase.ts         Cliente de Supabase
lib/cloudinary.ts       Función para subir fotos a Cloudinary (sin backend propio)
types/                  Tipos de TypeScript
supabase/schema.sql     Script SQL completo (tablas + seguridad)
```

## 10. Publicar la app de verdad

Cuando quieras subirla a Play Store / App Store, usa **EAS Build** de Expo:

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android
eas build --platform ios
```

(Requiere cuenta gratuita de Expo y, para iOS, cuenta de Apple Developer).
