import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Clipboard,
  Modal,
  Animated,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { globalStyles } from '../theme/styles';
import colors from '../theme/colors';

/**
 * Pantalla de perfil de usuario
 * Permite editar nombre, mostrar ID y cerrar sesión
 */

const ProfileScreen = ({ navigation }) => {
  const { user, updateProfile, logout, validateUserName, getUserShareInfo } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');
  const [isLoading, setIsLoading] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  
  // Animación para feedback visual
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleSaveName = async () => {
    const validation = validateUserName(editedName);
    
    if (!validation.valid) {
      Alert.alert('Error', validation.error);
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await updateProfile({ name: editedName.trim() });
      
      if (result.success) {
        setIsEditing(false);
        // Animación de éxito
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        Alert.alert('Error', 'No se pudo actualizar el nombre');
      }
    } catch (error) {
      Alert.alert('Error', 'Error al actualizar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyId = () => {
    if (user?.id) {
      Clipboard.setString(user.id);
      Alert.alert('¡Copiado!', 'ID copiado al portapapeles');
      
      // Animación de feedback
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres cerrar sesión? Se borrarán todos los datos locales.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Confirmar',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            const result = await logout();
            if (result.success) {
              navigation.replace('Welcome');
            } else {
              Alert.alert('Error', 'No se pudo cerrar sesión');
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleShowQR = () => {
    setShowQRModal(true);
  };

  const renderQRModal = () => {
    const shareInfo = getUserShareInfo();
    
    return (
      <Modal
        visible={showQRModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Mi código QR</Text>
            
            {/* Placeholder para QR - en implementación real usaríamos react-native-qrcode-generator */}
            <View style={styles.qrPlaceholder}>
              <Text style={styles.qrPlaceholderText}>QR</Text>
              <Text style={styles.qrId}>{user?.id}</Text>
            </View>
            
            <Text style={styles.modalDescription}>
              Comparte este código para que te agreguen como contacto
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[globalStyles.button, styles.modalButton]}
                onPress={() => {
                  if (shareInfo) {
                    Clipboard.setString(shareInfo.qrData);
                    Alert.alert('¡Copiado!', 'Datos de contacto copiados');
                  }
                }}
              >
                <Text style={globalStyles.buttonText}>Copiar datos</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[globalStyles.button, globalStyles.primaryButton, styles.modalButton]}
                onPress={() => setShowQRModal(false)}
              >
                <Text style={globalStyles.primaryButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={globalStyles.centerContainer}>
        <Text style={globalStyles.bodyText}>Cargando perfil...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={globalStyles.title}>Perfil</Text>
        </View>

        {/* Avatar placeholder */}
        <View style={styles.avatarContainer}>
          <Animated.View
            style={[
              styles.avatar,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Text style={styles.avatarText}>
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </Animated.View>
        </View>

        {/* Información del usuario */}
        <View style={styles.infoContainer}>
          {/* Nombre */}
          <View style={styles.infoSection}>
            <Text style={styles.label}>Nombre</Text>
            {isEditing ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={[globalStyles.input, styles.nameInput]}
                  value={editedName}
                  onChangeText={setEditedName}
                  placeholder="Ingresa tu nombre"
                  placeholderTextColor={colors.textMuted}
                  maxLength={50}
                  autoFocus={true}
                />
                <View style={styles.editButtons}>
                  <TouchableOpacity
                    style={[globalStyles.button, styles.editButton]}
                    onPress={() => {
                      setIsEditing(false);
                      setEditedName(user.name);
                    }}
                    disabled={isLoading}
                  >
                    <Text style={globalStyles.buttonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[globalStyles.button, globalStyles.primaryButton, styles.editButton]}
                    onPress={handleSaveName}
                    disabled={isLoading}
                  >
                    <Text style={globalStyles.primaryButtonText}>
                      {isLoading ? 'Guardando...' : 'Guardar'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.displayContainer}>
                <Text style={styles.displayText}>{user.name}</Text>
                <TouchableOpacity
                  style={styles.editIconButton}
                  onPress={() => setIsEditing(true)}
                >
                  <Text style={styles.editIcon}>✏️</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* ID de usuario */}
          <View style={styles.infoSection}>
            <Text style={styles.label}>ID de Usuario</Text>
            <View style={styles.idContainer}>
              <Text style={styles.idText}>{user.id}</Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={handleCopyId}
              >
                <Text style={styles.copyButtonText}>Copiar</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.idDescription}>
              Comparte este ID para que otros puedan agregarte
            </Text>
          </View>

          {/* Código QR */}
          <View style={styles.infoSection}>
            <TouchableOpacity
              style={[globalStyles.button, styles.qrButton]}
              onPress={handleShowQR}
            >
              <Text style={globalStyles.buttonText}>Mostrar código QR</Text>
            </TouchableOpacity>
          </View>

          {/* Información adicional */}
          <View style={styles.infoSection}>
            <Text style={styles.label}>Información</Text>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Creado:</Text>
              <Text style={styles.infoValue}>
                {new Date(user.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Última actividad:</Text>
              <Text style={styles.infoValue}>
                {new Date(user.lastActive).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Botón de cerrar sesión */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity
            style={[globalStyles.button, styles.logoutButton]}
            onPress={handleLogout}
            disabled={isLoading}
          >
            <Text style={[globalStyles.buttonText, styles.logoutButtonText]}>
              {isLoading ? 'Cerrando sesión...' : 'Cerrar sesión'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {renderQRModal()}
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
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
  },
  infoContainer: {
    paddingHorizontal: 20,
  },
  infoSection: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  displayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
  },
  displayText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  editIconButton: {
    padding: 5,
  },
  editIcon: {
    fontSize: 16,
  },
  editContainer: {
    marginBottom: 10,
  },
  nameInput: {
    marginBottom: 15,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  editButton: {
    flex: 0.48,
    paddingVertical: 12,
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  idText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
    fontFamily: 'monospace',
  },
  copyButton: {
    backgroundColor: colors.button,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  copyButtonText: {
    color: colors.buttonText,
    fontSize: 12,
    fontWeight: '600',
  },
  idDescription: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
  },
  qrButton: {
    backgroundColor: colors.surface,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.inputBorder,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    color: colors.text,
  },
  logoutContainer: {
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  logoutButton: {
    backgroundColor: colors.error,
  },
  logoutButtonText: {
    color: colors.secondary,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    maxWidth: '90%',
    width: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: colors.secondary,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  qrPlaceholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
  },
  qrId: {
    fontSize: 12,
    color: colors.primary,
    fontFamily: 'monospace',
  },
  modalDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 0.48,
    paddingVertical: 12,
  },
};

export default ProfileScreen;
