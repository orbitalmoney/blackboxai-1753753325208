import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
  SafeAreaView,
  Switch,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import StorageService from '../services/StorageService';
import MediaService from '../services/MediaService';
import { globalStyles } from '../theme/styles';
import colors from '../theme/colors';

/**
 * Pantalla de configuración
 * Permite cambiar idioma, tema y borrar datos
 */

const SettingsScreen = ({ navigation }) => {
  const { logout } = useAuth();
  const [settings, setSettings] = useState({
    language: 'es',
    notifications: true,
    autoCleanup: true,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await StorageService.getSettings();
      setSettings(savedSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      const success = await StorageService.saveSettings(newSettings);
      if (success) {
        setSettings(newSettings);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'No se pudieron guardar las configuraciones');
    }
  };

  const handleLanguageChange = (language) => {
    const newSettings = { ...settings, language };
    saveSettings(newSettings);
    
    // En una implementación real, aquí se cambiaría el idioma de la app
    Alert.alert(
      'Idioma cambiado',
      `Idioma cambiado a ${language === 'es' ? 'Español' : 'English'}. Reinicia la app para aplicar los cambios.`
    );
  };

  const handleNotificationsToggle = (value) => {
    const newSettings = { ...settings, notifications: value };
    saveSettings(newSettings);
  };

  const handleAutoCleanupToggle = (value) => {
    const newSettings = { ...settings, autoCleanup: value };
    saveSettings(newSettings);
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Limpiar caché',
      '¿Estás seguro de que quieres limpiar los archivos temporales?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          onPress: async () => {
            setIsLoading(true);
            try {
              const result = await MediaService.cleanupTempFiles();
              if (result.success) {
                Alert.alert(
                  'Éxito',
                  `Se limpiaron ${result.cleaned} archivos temporales`
                );
              } else {
                Alert.alert('Error', 'No se pudo limpiar el caché');
              }
            } catch (error) {
              Alert.alert('Error', 'Error al limpiar caché');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Borrar todos los datos',
      '¿Estás seguro de que quieres borrar todos los datos y cerrar sesión? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar todo',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              const result = await logout();
              if (result.success) {
                navigation.replace('Welcome');
              } else {
                Alert.alert('Error', 'No se pudieron borrar los datos');
                setIsLoading(false);
              }
            } catch (error) {
              Alert.alert('Error', 'Error al borrar datos');
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    // En una implementación real, esto exportaría los datos del usuario
    Alert.alert(
      'Exportar datos',
      'Funcionalidad de exportación no implementada en esta demo.',
      [{ text: 'OK' }]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'Acerca de Efímero',
      'Efímero v1.0.0\n\nAplicación de mensajería P2P segura sin servidores centrales.\n\nDesarrollado con React Native.',
      [{ text: 'OK' }]
    );
  };

  const renderSettingItem = (title, description, onPress, rightComponent) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        {description && (
          <Text style={styles.settingDescription}>{description}</Text>
        )}
      </View>
      {rightComponent && (
        <View style={styles.settingRight}>
          {rightComponent}
        </View>
      )}
      {onPress && !rightComponent && (
        <Text style={styles.settingChevron}>›</Text>
      )}
    </TouchableOpacity>
  );

  const renderSection = (title, children) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={globalStyles.title}>Configuración</Text>
        </View>

        {/* Sección de idioma */}
        {renderSection('Idioma', [
          renderSettingItem(
            'Español',
            'Cambiar idioma a español',
            () => handleLanguageChange('es'),
            <View style={[
              styles.radioButton,
              settings.language === 'es' && styles.radioButtonSelected
            ]} />
          ),
          renderSettingItem(
            'English',
            'Change language to English',
            () => handleLanguageChange('en'),
            <View style={[
              styles.radioButton,
              settings.language === 'en' && styles.radioButtonSelected
            ]} />
          ),
        ])}

        {/* Sección de notificaciones */}
        {renderSection('Notificaciones', [
          renderSettingItem(
            'Notificaciones',
            'Recibir notificaciones de mensajes',
            null,
            <Switch
              value={settings.notifications}
              onValueChange={handleNotificationsToggle}
              trackColor={{ false: colors.inputBorder, true: colors.online }}
              thumbColor={colors.secondary}
            />
          ),
        ])}

        {/* Sección de privacidad */}
        {renderSection('Privacidad', [
          renderSettingItem(
            'Limpieza automática',
            'Limpiar archivos temporales automáticamente',
            null,
            <Switch
              value={settings.autoCleanup}
              onValueChange={handleAutoCleanupToggle}
              trackColor={{ false: colors.inputBorder, true: colors.online }}
              thumbColor={colors.secondary}
            />
          ),
          renderSettingItem(
            'Limpiar caché',
            'Eliminar archivos temporales y caché',
            handleClearCache
          ),
        ])}

        {/* Sección de datos */}
        {renderSection('Datos', [
          renderSettingItem(
            'Exportar datos',
            'Exportar contactos y configuraciones',
            handleExportData
          ),
          renderSettingItem(
            'Borrar todos los datos',
            'Eliminar todos los datos y cerrar sesión',
            handleClearAllData
          ),
        ])}

        {/* Sección de información */}
        {renderSection('Información', [
          renderSettingItem(
            'Acerca de Efímero',
            'Información de la aplicación',
            handleAbout
          ),
          renderSettingItem(
            'Versión',
            '1.0.0',
            null
          ),
        ])}

        {/* Información adicional */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Características de seguridad</Text>
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>• Conexiones P2P directas</Text>
            <Text style={styles.featureItem}>• Mensajes efímeros (autodestrucción)</Text>
            <Text style={styles.featureItem}>• Sin almacenamiento en servidores</Text>
            <Text style={styles.featureItem}>• Cifrado WebRTC nativo</Text>
            <Text style={styles.featureItem}>• Datos locales únicamente</Text>
          </View>
        </View>

        {/* Botón de cerrar sesión */}
        <View style={styles.logoutSection}>
          <TouchableOpacity
            style={[globalStyles.button, styles.logoutButton]}
            onPress={handleClearAllData}
            disabled={isLoading}
          >
            <Text style={[globalStyles.buttonText, styles.logoutButtonText]}>
              {isLoading ? 'Procesando...' : 'Cerrar sesión y borrar datos'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.inputBorder,
  },
  section: {
    marginTop: 25,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 15,
  },
  sectionContent: {
    backgroundColor: colors.surface,
    borderRadius: 15,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.inputBorder,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  settingRight: {
    marginLeft: 15,
  },
  settingChevron: {
    fontSize: 18,
    color: colors.textMuted,
    marginLeft: 10,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.inputBorder,
  },
  radioButtonSelected: {
    backgroundColor: colors.online,
    borderColor: colors.online,
  },
  infoSection: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 15,
  },
  featureList: {
    backgroundColor: colors.surface,
    borderRadius: 15,
    padding: 20,
  },
  featureItem: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 5,
  },
  logoutSection: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    marginBottom: 20,
  },
  logoutButton: {
    backgroundColor: colors.error,
  },
  logoutButtonText: {
    color: colors.secondary,
  },
};

export default SettingsScreen;
