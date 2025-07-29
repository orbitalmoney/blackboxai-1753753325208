import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Servicio de almacenamiento local para Efímero
 * Maneja toda la persistencia de datos en el dispositivo
 */

const STORAGE_KEYS = {
  USER_PROFILE: '@efimero_user_profile',
  CONTACTS: '@efimero_contacts',
  SETTINGS: '@efimero_settings',
  CHAT_HISTORY: '@efimero_chat_history',
};

class StorageService {
  // Perfil de usuario
  async saveUserProfile(profile) {
    try {
      const profileData = JSON.stringify(profile);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, profileData);
      return true;
    } catch (error) {
      console.error('Error saving user profile:', error);
      return false;
    }
  }

  async getUserProfile() {
    try {
      const profileData = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return profileData ? JSON.parse(profileData) : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  // Contactos
  async saveContacts(contacts) {
    try {
      const contactsData = JSON.stringify(contacts);
      await AsyncStorage.setItem(STORAGE_KEYS.CONTACTS, contactsData);
      return true;
    } catch (error) {
      console.error('Error saving contacts:', error);
      return false;
    }
  }

  async getContacts() {
    try {
      const contactsData = await AsyncStorage.getItem(STORAGE_KEYS.CONTACTS);
      return contactsData ? JSON.parse(contactsData) : [];
    } catch (error) {
      console.error('Error getting contacts:', error);
      return [];
    }
  }

  async addContact(contact) {
    try {
      const contacts = await this.getContacts();
      
      // Verificar si el contacto ya existe
      const existingContact = contacts.find(c => c.id === contact.id);
      if (existingContact) {
        return { success: false, message: 'Contact already exists' };
      }

      contacts.push({
        ...contact,
        addedAt: new Date().toISOString(),
        status: 'offline'
      });

      const success = await this.saveContacts(contacts);
      return { success, message: success ? 'Contact added' : 'Failed to add contact' };
    } catch (error) {
      console.error('Error adding contact:', error);
      return { success: false, message: 'Error adding contact' };
    }
  }

  async updateContactStatus(contactId, status) {
    try {
      const contacts = await this.getContacts();
      const contactIndex = contacts.findIndex(c => c.id === contactId);
      
      if (contactIndex !== -1) {
        contacts[contactIndex].status = status;
        contacts[contactIndex].lastSeen = new Date().toISOString();
        await this.saveContacts(contacts);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating contact status:', error);
      return false;
    }
  }

  // Configuraciones
  async saveSettings(settings) {
    try {
      const settingsData = JSON.stringify(settings);
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, settingsData);
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  }

  async getSettings() {
    try {
      const settingsData = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      return settingsData ? JSON.parse(settingsData) : {
        language: 'es',
        theme: 'dark',
        notifications: true,
      };
    } catch (error) {
      console.error('Error getting settings:', error);
      return {
        language: 'es',
        theme: 'dark',
        notifications: true,
      };
    }
  }

  // Historial de chat (temporal, se borra al leer)
  async saveChatMessage(contactId, message) {
    try {
      const chatKey = `${STORAGE_KEYS.CHAT_HISTORY}_${contactId}`;
      const existingMessages = await AsyncStorage.getItem(chatKey);
      const messages = existingMessages ? JSON.parse(existingMessages) : [];
      
      messages.push({
        ...message,
        timestamp: new Date().toISOString(),
        read: false,
      });

      await AsyncStorage.setItem(chatKey, JSON.stringify(messages));
      return true;
    } catch (error) {
      console.error('Error saving chat message:', error);
      return false;
    }
  }

  async getChatMessages(contactId) {
    try {
      const chatKey = `${STORAGE_KEYS.CHAT_HISTORY}_${contactId}`;
      const messagesData = await AsyncStorage.getItem(chatKey);
      return messagesData ? JSON.parse(messagesData) : [];
    } catch (error) {
      console.error('Error getting chat messages:', error);
      return [];
    }
  }

  async markMessageAsRead(contactId, messageId) {
    try {
      const chatKey = `${STORAGE_KEYS.CHAT_HISTORY}_${contactId}`;
      const messages = await this.getChatMessages(contactId);
      
      const messageIndex = messages.findIndex(m => m.id === messageId);
      if (messageIndex !== -1) {
        // Marcar como leído y programar autodestrucción
        messages[messageIndex].read = true;
        messages[messageIndex].readAt = new Date().toISOString();
        
        // Guardar temporalmente
        await AsyncStorage.setItem(chatKey, JSON.stringify(messages));
        
        // Autodestruir después de 5 segundos
        setTimeout(async () => {
          await this.deleteMessage(contactId, messageId);
        }, 5000);
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error marking message as read:', error);
      return false;
    }
  }

  async deleteMessage(contactId, messageId) {
    try {
      const chatKey = `${STORAGE_KEYS.CHAT_HISTORY}_${contactId}`;
      const messages = await this.getChatMessages(contactId);
      
      const filteredMessages = messages.filter(m => m.id !== messageId);
      await AsyncStorage.setItem(chatKey, JSON.stringify(filteredMessages));
      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      return false;
    }
  }

  // Limpiar todos los datos
  async clearAllData() {
    try {
      const keys = Object.values(STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);
      
      // También limpiar cualquier chat history
      const allKeys = await AsyncStorage.getAllKeys();
      const chatKeys = allKeys.filter(key => key.startsWith(STORAGE_KEYS.CHAT_HISTORY));
      if (chatKeys.length > 0) {
        await AsyncStorage.multiRemove(chatKeys);
      }
      
      return true;
    } catch (error) {
      console.error('Error clearing all data:', error);
      return false;
    }
  }

  // Generar ID único para usuario
  generateUserId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'ef-';
    for (let i = 0; i < 7; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Validar formato de ID
  isValidUserId(userId) {
    const regex = /^ef-[a-z0-9]{7}$/;
    return regex.test(userId);
  }
}

export default new StorageService();
