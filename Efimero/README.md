# Efímero - Aplicación de Mensajería P2P

Efímero es una aplicación móvil de mensajería peer-to-peer (P2P) desarrollada en React Native que permite la comunicación directa sin depender de servidores centrales.

## 🚀 Características

- **Mensajería P2P**: Conexión directa entre dispositivos usando WebRTC
- **Mensajes efímeros**: Los mensajes se autodestruyen al ser leídos
- **Sin servidores**: No depende de infraestructura centralizada
- **Multimedia**: Soporte para texto, audio, video y archivos
- **Tema oscuro**: Diseño minimalista en negro con íconos blancos
- **Multiidioma**: Soporte para Español e Inglés
- **Privacidad**: Todos los datos se almacenan localmente

## 📱 Funcionalidades

### Pantallas principales:
- **Bienvenida**: Logo animado y entrada a la aplicación
- **Perfil**: Gestión de nombre de usuario e ID único (formato ef-xxxxxxx)
- **Contactos**: Lista de contactos con estado online/offline
- **Chat**: Mensajería efímera con soporte multimedia
- **Configuración**: Ajustes de idioma y gestión de datos

### Características técnicas:
- Conexiones WebRTC para comunicación P2P
- Almacenamiento local con AsyncStorage
- Grabación y reproducción de audio
- Selección y envío de archivos
- Códigos QR para intercambio de contactos
- Autodestrucción de mensajes después de ser leídos

## 🛠️ Instalación y Configuración

### Prerrequisitos

1. **Node.js** (versión 16 o superior)
2. **React Native CLI**:
   ```bash
   npm install -g react-native-cli
   ```
3. **Android Studio** con SDK de Android
4. **Java Development Kit (JDK)** versión 11

### Configuración del entorno Android

1. Instalar Android Studio
2. Configurar las variables de entorno:
   ```bash
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

### Instalación del proyecto

1. **Clonar o descargar el proyecto**
2. **Navegar al directorio del proyecto**:
   ```bash
   cd Efimero
   ```
3. **Instalar dependencias**:
   ```bash
   npm install
   ```
4. **Instalar dependencias de iOS** (si planeas compilar para iOS):
   ```bash
   cd ios && pod install && cd ..
   ```

## 🏃‍♂️ Ejecución en Desarrollo

### Android

1. **Iniciar el emulador de Android** o conectar un dispositivo físico
2. **Ejecutar la aplicación**:
   ```bash
   npx react-native run-android
   ```
3. **Iniciar el Metro bundler** (en otra terminal):
   ```bash
   npx react-native start
   ```

### iOS (macOS únicamente)

1. **Abrir el simulador de iOS**
2. **Ejecutar la aplicación**:
   ```bash
   npx react-native run-ios
   ```

## 📦 Compilación para Producción

### Generar APK para Android

1. **Navegar al directorio android**:
   ```bash
   cd android
   ```
2. **Compilar APK de release**:
   ```bash
   ./gradlew assembleRelease
   ```
3. **El APK se generará en**:
   ```
   android/app/build/outputs/apk/release/app-release.apk
   ```

### Generar APK firmado (recomendado)

1. **Generar keystore**:
   ```bash
   keytool -genkeypair -v -storetype PKCS12 -keystore efimero-release-key.keystore -alias efimero-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```
2. **Colocar el keystore en** `android/app/`
3. **Crear archivo** `android/gradle.properties`:
   ```
   EFIMERO_UPLOAD_STORE_FILE=efimero-release-key.keystore
   EFIMERO_UPLOAD_KEY_ALIAS=efimero-key-alias
   EFIMERO_UPLOAD_STORE_PASSWORD=tu_password
   EFIMERO_UPLOAD_KEY_PASSWORD=tu_password
   ```
4. **Compilar APK firmado**:
   ```bash
   cd android && ./gradlew assembleRelease
   ```

## 🎨 Personalización del Ícono

### Generar íconos para Android

1. **Crear ícono base** (1024x1024 px) en formato PNG
2. **Usar Android Studio**:
   - Abrir `android/` en Android Studio
   - Click derecho en `app/src/main/res`
   - New > Image Asset
   - Seleccionar tu ícono y generar

### Estructura de íconos Android:
```
android/app/src/main/res/
├── mipmap-hdpi/ic_launcher.png (72x72)
├── mipmap-mdpi/ic_launcher.png (48x48)
├── mipmap-xhdpi/ic_launcher.png (96x96)
├── mipmap-xxhdpi/ic_launcher.png (144x144)
└── mipmap-xxxhdpi/ic_launcher.png (192x192)
```

## 🔧 Configuración Adicional

### Permisos Android

Los siguientes permisos están configurados en `AndroidManifest.xml`:
- `INTERNET`: Conexiones de red
- `CAMERA`: Acceso a la cámara
- `RECORD_AUDIO`: Grabación de audio
- `READ_EXTERNAL_STORAGE`: Lectura de archivos
- `WRITE_EXTERNAL_STORAGE`: Escritura de archivos
- `ACCESS_NETWORK_STATE`: Estado de la red
- `ACCESS_WIFI_STATE`: Estado del WiFi

### Configuración WebRTC

La aplicación usa servidores STUN públicos de Google:
- `stun:stun.l.google.com:19302`
- `stun:stun1.l.google.com:19302`
- `stun:stun2.l.google.com:19302`

## 📁 Estructura del Proyecto

```
Efimero/
├── android/                 # Configuración Android
├── ios/                     # Configuración iOS
├── src/
│   ├── components/          # Componentes reutilizables
│   ├── screens/            # Pantallas principales
│   ├── navigation/         # Configuración de navegación
│   ├── context/            # Contextos de React
│   ├── services/           # Servicios (WebRTC, Storage, Media)
│   ├── hooks/              # Hooks personalizados
│   ├── utils/              # Funciones utilitarias
│   ├── locales/            # Archivos de traducción
│   └── theme/              # Colores y estilos
├── App.js                  # Componente principal
├── index.js                # Punto de entrada
└── package.json            # Dependencias
```

## 🔒 Seguridad y Privacidad

- **Sin servidores centrales**: Toda la comunicación es P2P
- **Datos locales únicamente**: No se envía información a servidores
- **Mensajes efímeros**: Autodestrucción después de ser leídos
- **Cifrado WebRTC**: Comunicación cifrada por defecto
- **Sin tracking**: No se recopilan datos de usuario

## 🐛 Solución de Problemas

### Errores comunes:

1. **Error de compilación Android**:
   ```bash
   cd android && ./gradlew clean && cd .. && npx react-native run-android
   ```

2. **Metro bundler no inicia**:
   ```bash
   npx react-native start --reset-cache
   ```

3. **Problemas con dependencias**:
   ```bash
   rm -rf node_modules && npm install
   ```

4. **Error de permisos en Android**:
   - Verificar que los permisos estén en `AndroidManifest.xml`
   - Otorgar permisos manualmente en Configuración del dispositivo

### Logs de depuración:

- **Android**: `npx react-native log-android`
- **iOS**: `npx react-native log-ios`

## 📝 Notas de Desarrollo

### Limitaciones actuales:
- La señalización WebRTC es manual (copia/pega)
- QR scanner no implementado completamente
- Funciona mejor en red local
- Requiere que ambos dispositivos estén activos simultáneamente

### Posibles mejoras:
- Implementar servidor de señalización opcional
- Agregar soporte para llamadas de voz/video
- Mejorar la interfaz de conexión P2P
- Agregar cifrado adicional de mensajes
- Implementar respaldo de contactos

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📞 Soporte

Para reportar bugs o solicitar features, por favor abre un issue en el repositorio del proyecto.

---

**Efímero v1.0.0** - Mensajería P2P sin compromisos de privacidad.
