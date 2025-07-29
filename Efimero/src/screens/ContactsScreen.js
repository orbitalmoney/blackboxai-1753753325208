import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  StatusBar,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useConnection } from '../context/ConnectionContext';
import StorageService from '../services/StorageService';
import { globalStyles } from '../theme/styles';
import colors from '../theme/colors';

/**
 * Pantalla de contactos
 * Muestra lista de contactos y permite agregar nuevos
 */

const ContactsScreen = ({ navigation }) => {
  const {
    contacts,
    addContact,
    loadContacts,
    updateContactStatus,
    isConnectedToContact,
    loading,
    error,
  } = useConnection();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContactId, setNewContactId] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadContacts();
    setRefreshing(false);
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddContact = async () => {
    if (!newContactId.trim()) {
      Alert.alert('Error', 'Por favor ingresa un ID de usuario');
      return;
    }

    if (!StorageService.isValidUserId(newContactId.trim())) {
      Alert.alert('Error', 'Formato de ID inválido. Debe ser: ef-xxxxxxx');
      return;
    }

    if (!newContactName.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para el contacto');
      return;
    }

    setIsAddingContact(true);

    try {
      const contactData = {
        id: newContactId.trim(),
        name: newContactName.trim(),
      };

      const result = await addContact(contactData);

      if (result.success) {
        Alert.alert('¡Éxito!', 'Contacto agregado exitosamente');
        setShowAddModal(false);
        setNewContactId('');
        setNewContactName('');
      } else {
        Alert.alert('Error', result.error || 'No se pudo agregar el contacto');
      }
    } catch (error) {
      Alert.alert('Error', 'Error al agregar contacto');
    } finally {
      setIsAddingContact(false);
    }
  };

  const handleContactPress = (contact) => {
    navigation.navigate('Chat', { 
      contactId: contact.id,
      contactName: contact.name,
    });
  };

  const handleScanQR = () => {
    // En implementación real, abriría el escáner QR
    Alert.alert(
      'Escanear QR',
      'Funcionalidad de escáner QR no implementada en esta demo. Usa "Agregar por ID" para agregar contactos manualmente.',
      [{ text: 'OK' }]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return colors.online;
      case 'connecting':
        return colors.connecting;
      default:
        return colors.offline;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'online':
        return 'En línea';
      case 'connecting':
        return 'Conectando...';
      default:
        return 'Desconectado';
    }
  };

  const renderContactItem = ({ item }) => {
    const isConnected = isConnectedToContact(item.id);
    const statusColor = getStatusColor(item.status);
    const statusText = getStatusText(item.status);

    return (
      <TouchableOpacity
        style={styles.contactItem}
        onPress={() => handleContactPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.contactInfo}>
          <View style={styles.contactAvatar}>
            <Text style={styles.contactAvatarText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          
          <View style={styles.contactDetails}>
            <Text style={styles.contactName}>{item.name}</Text>
            <Text style={styles.contactId}>{item.id}</Text>
            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {statusText}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.contactActions}>
          {isConnected && (
            <View style={styles.connectedIndicator}>
              <Text style={styles.connectedText}>Conectado</Text>
            </View>
          )}
          <Text style={styles.chevron}>›</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderAddModal = () => (
    <Modal
      visible={showAddModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowAddModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Agregar Contacto</Text>
          
          <Text style={styles.inputLabel}>ID del Usuario</Text>
          <TextInput
            style={globalStyles.input}
            value={newContactId}
            onChangeText={setNewContactId}
            placeholder="ef-xxxxxxx"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          <Text style={styles.inputLabel}>Nombre del Contacto</Text>
          <TextInput
            style={globalStyles.input}
            value={newContactName}
            onChangeText={setNewContactName}
            placeholder="Nombre para mostrar"
            placeholderTextColor={colors.textMuted}
            maxLength={50}
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[globalStyles.button, styles.modalButton]}
              onPress={() => {
                setShowAddModal(false);
                setNewContactId('');
                setNewContactName('');
              }}
              disabled={isAddingContact}
            >
              <Text style={globalStyles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[globalStyles.button, globalStyles.primaryButton, styles.modalButton]}
              onPress={handleAddContact}
              disabled={isAddingContact}
            >
              <Text style={globalStyles.primaryButtonText}>
                {isAddingContact ? 'Agregando...' : 'Agregar'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[globalStyles.button, styles.qrButton]}
            onPress={handleScanQR}
            disabled={isAddingContact}
          >
            <Text style={globalStyles.buttonText}>Escanear código QR</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No tienes contactos aún</Text>
      <Text style={styles.emptyDescription}>
        Agrega contactos usando su ID o código QR para comenzar a chatear
      </Text>
      <TouchableOpacity
        style={[globalStyles.button, globalStyles.primaryButton, styles.addFirstContactButton]}
        onPress={() => setShowAddModal(true)}
      >
        <Text style={globalStyles.primaryButtonText}>Agregar primer contacto</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={globalStyles.title}>Contactos</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar contactos..."
          placeholderTextColor={colors.textMuted}
        />
      </View>

      {/* Lista de contactos */}
      {filteredContacts.length === 0 && !loading ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredContacts}
          renderItem={renderContactItem}
          keyExtractor={(item) => item.id}
          style={styles.contactsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.text}
            />
          }
        />
      )}

      {renderAddModal()}
    </SafeAreaView>
  );
};

const styles = {
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.inputBorder,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  contactsList: {
    flex: 1,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.inputBorder,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  contactAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  contactId: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  contactActions: {
    alignItems: 'center',
  },
  connectedIndicator: {
    backgroundColor: colors.online,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 5,
  },
  connectedText: {
    fontSize: 10,
    color: colors.secondary,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 20,
    color: colors.textMuted,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
  },
  addFirstContactButton: {
    paddingHorizontal: 30,
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
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 25,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 15,
  },
  modalButton: {
    flex: 0.48,
    paddingVertical: 12,
  },
  qrButton: {
    backgroundColor: colors.button,
    marginTop: 10,
  },
};

export default ContactsScreen;
