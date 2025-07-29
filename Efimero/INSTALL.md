# Guía de Instalación - Efímero

Esta guía te ayudará a instalar y ejecutar la aplicación Efímero paso a paso.

## 📋 Prerrequisitos

### 1. Node.js
- Descargar e instalar Node.js versión 16 o superior desde [nodejs.org](https://nodejs.org/)
- Verificar instalación:
  ```bash
  node --version
  npm --version
  ```

### 2. React Native CLI
```bash
npm install -g react-native-cli
```

### 3. Java Development Kit (JDK)
- Instalar JDK 11 desde [Oracle](https://www.oracle.com/java/technologies/javase-jdk11-downloads.html) o [OpenJDK](https://openjdk.java.net/)
- Configurar variable de entorno `JAVA_HOME`

### 4. Android Studio
- Descargar desde [developer.android.com](https://developer.android.com/studio)
- Durante la instalación, asegúrate de instalar:
  - Android SDK
  - Android SDK Platform
  - Android Virtual Device

## 🔧 Configuración del Entorno

### Variables de Entorno (Windows)
```bash
# Agregar al PATH del sistema
ANDROID_HOME = C:\Users\TuUsuario\AppData\Local\Android\Sdk
JAVA_HOME = C:\Program Files\Java\jdk-11.0.x

# Agregar al PATH
%ANDROID_HOME%\emulator
%ANDROID_HOME%\tools
%ANDROID_HOME%\tools\bin
%ANDROID_HOME%\platform-tools
```

### Variables de Entorno (macOS/Linux)
```bash
# Agregar al ~/.bashrc o ~/.zshrc
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

## 📱 Instalación del Proyecto

### 1. Descargar el proyecto
```bash
# Si tienes git
git clone [URL_DEL_REPOSITORIO]
cd Efimero

# O descomprimir el archivo ZIP y navegar al directorio
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar Android (si es necesario)
```bash
# Limpiar caché si hay problemas
npx react-native clean-project-auto
```

## 🚀 Ejecución

### Opción 1: Emulador Android

1. **Abrir Android Studio**
2. **Crear/Iniciar un AVD (Android Virtual Device)**:
   - Tools > AVD Manager
   - Create Virtual Device
   - Seleccionar un dispositivo (ej: Pixel 4)
   - Seleccionar API Level 30 o superior
   - Finish y Start

3. **Ejecutar la aplicación**:
   ```bash
   npx react-native run-android
   ```

### Opción 2: Dispositivo Físico

1. **Habilitar opciones de desarrollador** en tu dispositivo Android:
   - Configuración > Acerca del teléfono
   - Tocar "Número de compilación" 7 veces
   - Volver a Configuración > Opciones de desarrollador
   - Activar "Depuración USB"

2. **Conectar dispositivo** via USB

3. **Verificar conexión**:
   ```bash
   adb devices
   ```

4. **Ejecutar la aplicación**:
   ```bash
   npx react-native run-android
   ```

## 🔨 Compilación APK

### APK de Debug
```bash
cd android
./gradlew assembleDebug
```
El APK se genera en: `android/app/build/outputs/apk/debug/app-debug.apk`

### APK de Release
```bash
cd android
./gradlew assembleRelease
```
El APK se genera en: `android/app/build/outputs/apk/release/app-release.apk`

## 🐛 Solución de Problemas Comunes

### Error: "SDK location not found"
```bash
# Crear archivo local.properties en android/
echo "sdk.dir=/ruta/a/tu/Android/Sdk" > android/local.properties
```

### Error: "Command failed: gradlew.bat"
```bash
# En Windows, usar:
cd android
gradlew.bat clean
gradlew.bat assembleDebug

# En macOS/Linux:
cd android
./gradlew clean
./gradlew assembleDebug
```

### Error: "Unable to load script"
```bash
# Reiniciar Metro bundler
npx react-native start --reset-cache
```

### Error: "Task :app:installDebug FAILED"
```bash
# Limpiar proyecto
cd android
./gradlew clean
cd ..
npx react-native run-android
```

### Problemas con dependencias
```bash
# Limpiar node_modules
rm -rf node_modules
npm install

# Limpiar caché de npm
npm cache clean --force
```

## 📱 Instalación del APK

### En Emulador
```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

### En Dispositivo Físico
1. Transferir el APK al dispositivo
2. Habilitar "Fuentes desconocidas" en Configuración > Seguridad
3. Abrir el APK desde el explorador de archivos
4. Seguir las instrucciones de instalación

## ✅ Verificación de Instalación

Una vez instalada la aplicación:

1. **Abrir Efímero**
2. **Tocar "Entrar"** en la pantalla de bienvenida
3. **Verificar que se crea un perfil** con ID único (formato ef-xxxxxxx)
4. **Navegar entre pestañas**: Contactos, Perfil, Configuración
5. **Probar agregar un contacto** con ID de prueba

## 🔄 Actualización

Para actualizar la aplicación:

1. **Descargar nueva versión** del código
2. **Instalar nuevas dependencias**:
   ```bash
   npm install
   ```
3. **Limpiar y recompilar**:
   ```bash
   npx react-native clean-project-auto
   npx react-native run-android
   ```

## 📞 Soporte

Si encuentras problemas:

1. **Revisar logs**:
   ```bash
   npx react-native log-android
   ```

2. **Verificar versiones**:
   ```bash
   node --version
   npm --version
   npx react-native --version
   ```

3. **Limpiar completamente**:
   ```bash
   # Limpiar todo
   rm -rf node_modules
   npm install
   cd android
   ./gradlew clean
   cd ..
   npx react-native start --reset-cache
   ```

## 🎯 Próximos Pasos

Una vez que tengas la aplicación funcionando:

1. **Leer el README.md** para entender las funcionalidades
2. **Probar la conexión P2P** con otro dispositivo
3. **Personalizar el ícono** siguiendo las instrucciones del README
4. **Explorar el código fuente** para entender la arquitectura

¡Disfruta usando Efímero! 🚀
