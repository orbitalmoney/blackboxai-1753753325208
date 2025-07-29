import React, { createContext, useContext, useReducer, useEffect } from 'react';
import WebRTCService from '../services/WebRTCService';
import StorageService from '../services/StorageService';
import { v4 as uuidv4 } from 'uuid';

/**
 * Contexto de conexión para Efímero
 * Maneja las conexiones P2P y el estado de los contactos
 */

const ConnectionContext = createContext();

// Estados iniciales
const initialState = {
  contacts: [],
  activeConnections: {},
  connectionState: 'disconnected',
  currentChat: null,
  messages: {},
  loading: false,
  error: null,
};

// Tipos de acciones
const CONNECTION_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_CONTACTS: 'SET_CONTACTS',
  ADD_CONTACT: 'ADD_CONTACT',
  UPDATE_CONTACT_STATUS: 'UPDATE_CONTACT_STATUS',
  SET_CONNECTION_STATE: 'SET_CONNECTION_STATE',
  SET_ACTIVE_CONNECTION: 'SET_ACTIVE_CONNECTION',
  REMOVE_ACTIVE_CONNECTION: 'REMOVE_ACTIVE_CONNECTION',
  SET_CURRENT_CHAT: 'SET_CURRENT_CHAT',
  ADD_MESSAGE: 'ADD_MESSAGE',
  REMOVE_MESSAGE: 'REMOVE_MESSAGE',
  SET_MESSAGES: 'SET_MESSAGES',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer
function connectionReducer(state, action) {
  switch (action.type) {
    case CONNECTION_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };

    case CONNECTION_ACTIONS.SET_CONTACTS:
      return {
        ...state,
        contacts: action.payload,
      };

    case CONNECTION_ACTIONS.ADD_CONTACT:
      return {
        ...state,
        contacts: [...state.contacts, action.payload],
      };

    case CONNECTION_ACTIONS.UPDATE_CONTACT_STATUS:
      return {
        ...state,
        contacts: state.contacts.map(contact =>
          contact.id === action.payload.contactId
            ? { ...contact, status: action.payload.status, lastSeen: action.payload.lastSeen }
            : contact
        ),
      };

    case CONNECTION_ACTIONS.SET_CONNECTION_STATE:
      return {
        ...state,
        connectionState: action.payload,
      };

    case CONNECTION_ACTIONS.SET_ACTIVE_CONNECTION:
      return {
        ...state,
        activeConnections: {
          ...state.activeConnections,
          [action.payload.contactId]: action.payload.connection,
        },
      };

    case CONNECTION_ACTIONS.REMOVE_ACTIVE_CONNECTION:
      const { [action.payload]: removed, ...remainingConnections } = state.activeConnections;
      return {
        ...state,
        activeConnections: remainingConnections,
      };

    case CONNECTION_ACTIONS.SET_CURRENT_CHAT:
      return {
        ...state,
        currentChat: action.payload,
      };

    case CONNECTION_ACTIONS.ADD_MESSAGE:
      const { contactId, message } = action.payload;
      return {
        ...state,
        messages: {
          ...state.messages,
          [contactId]: [
            ...(state.messages[contactId] || []),
            message,
          ],
        },
      };

    case CONNECTION_ACTIONS.REMOVE_MESSAGE:
      const { contactId: msgContactId, messageId } = action.payload;
      return {
        ...state,
        messages: {
          ...state.messages,
          [msgContactId]: (state.messages[msgContactId] || []).filter(
            msg => msg.id !== messageId
          ),
        },
      };

    case CONNECTION_ACTIONS.SET_MESSAGES:
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.contactId]: action.payload.messages,
        },
      };

    case CONNECTION_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    case CONNECTION_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
}

// Provider
export function ConnectionProvider({ children }) {
  const [state, dispatch] = useReducer(connectionReducer, initialState);

  // Cargar contactos al iniciar
  useEffect(() => {
    loadContacts();
    setupWebRTCCallbacks();
  }, []);

  // Configurar callbacks de WebRTC
  const setupWebRTCCallbacks = () => {
    WebRTCService.setOnMessageReceived(handleMessageReceived);
    WebRTCService.setOnConnectionStateChange(handleConnectionStateChange);
  };

  // Cargar contactos desde storage
  const loadContacts = async () => {
    try {
      dispatch({ type: CONNECTION_ACTIONS.SET_LOADING, payload: true });
      
      const contacts = await StorageService.getContacts();
      dispatch({
        type: CONNECTION_ACTIONS.SET_CONTACTS,
        payload: contacts,
      });
    } catch (error) {
      console.error('Error loading contacts:', error);
      dispatch({
        type: CONNECTION_ACTIONS.SET_ERROR,
        payload: 'Error loading contacts',
      });
    } finally {
      dispatch({ type: CONNECTION_ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Agregar contacto
  const addContact = async (contactData) => {
    try {
      // Validar ID
      if (!StorageService.isValidUserId(contactData.id)) {
        return { success: false, error: 'Invalid user ID format' };
      }

      // Verificar si ya existe
      const existingContact = state.contacts.find(c => c.id === contactData.id);
      if (existingContact) {
        return { success: false, error: 'Contact already exists' };
      }

      const result = await StorageService.addContact(contactData);
      
      if (result.success) {
        const newContact = {
          ...contactData,
          addedAt: new Date().toISOString(),
          status: 'offline',
        };
        
        dispatch({
          type: CONNECTION_ACTIONS.ADD_CONTACT,
          payload: newContact,
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error adding contact:', error);
      return { success: false, error: 'Error adding contact' };
    }
  };

  // Iniciar conexión P2P
  const initiateConnection = async (contactId) => {
    try {
      dispatch({ type: CONNECTION_ACTIONS.SET_CONNECTION_STATE, payload: 'connecting' });
      
      const signalData = await WebRTCService.initializeConnection();
      
      // En una implementación real, esto se compartiría con el contacto
      // Por ahora, devolvemos los datos para compartir manualmente
      return {
        success: true,
        signalData: signalData,
        instructions: 'Share this data with your contact to establish connection',
      };
    } catch (error) {
      console.error('Error initiating connection:', error);
      dispatch({ type: CONNECTION_ACTIONS.SET_CONNECTION_STATE, payload: 'failed' });
      return { success: false, error: error.message };
    }
  };

  // Responder a conexión
  const respondToConnection = async (contactId, offerData) => {
    try {
      dispatch({ type: CONNECTION_ACTIONS.SET_CONNECTION_STATE, payload: 'connecting' });
      
      const answerData = await WebRTCService.handleOffer(offerData);
      
      return {
        success: true,
        answerData: answerData,
        instructions: 'Send this answer data back to your contact',
      };
    } catch (error) {
      console.error('Error responding to connection:', error);
      dispatch({ type: CONNECTION_ACTIONS.SET_CONNECTION_STATE, payload: 'failed' });
      return { success: false, error: error.message };
    }
  };

  // Completar conexión
  const completeConnection = async (contactId, answerData) => {
    try {
      await WebRTCService.handleAnswer(answerData);
      
      dispatch({
        type: CONNECTION_ACTIONS.SET_ACTIVE_CONNECTION,
        payload: {
          contactId: contactId,
          connection: {
            state: 'connected',
            connectedAt: new Date().toISOString(),
          },
        },
      });

      // Actualizar estado del contacto
      await updateContactStatus(contactId, 'online');
      
      return { success: true };
    } catch (error) {
      console.error('Error completing connection:', error);
      dispatch({ type: CONNECTION_ACTIONS.SET_CONNECTION_STATE, payload: 'failed' });
      return { success: false, error: error.message };
    }
  };

  // Manejar mensaje recibido
  const handleMessageReceived = async (message) => {
    try {
      // Encontrar el contacto basado en la conexión activa
      const contactId = state.currentChat;
      
      if (contactId) {
        const messageWithId = {
          ...message,
          id: message.id || uuidv4(),
          received: true,
          read: false,
        };

        // Agregar mensaje al estado
        dispatch({
          type: CONNECTION_ACTIONS.ADD_MESSAGE,
          payload: {
            contactId: contactId,
            message: messageWithId,
          },
        });

        // Guardar en storage (temporal)
        await StorageService.saveChatMessage(contactId, messageWithId);
      }
    } catch (error) {
      console.error('Error handling received message:', error);
    }
  };

  // Manejar cambio de estado de conexión
  const handleConnectionStateChange = (newState) => {
    dispatch({
      type: CONNECTION_ACTIONS.SET_CONNECTION_STATE,
      payload: newState,
    });

    // Actualizar estado de contacto si está en chat activo
    if (state.currentChat) {
      const status = newState === 'connected' ? 'online' : 'offline';
      updateContactStatus(state.currentChat, status);
    }
  };

  // Enviar mensaje
  const sendMessage = async (contactId, messageData) => {
    try {
      const messageId = uuidv4();
      const message = {
        id: messageId,
        ...messageData,
        sent: true,
        timestamp: new Date().toISOString(),
      };

      // Enviar via WebRTC
      let success = false;
      
      if (messageData.type === 'text') {
        success = WebRTCService.sendTextMessage(messageData.content, messageId);
      } else if (messageData.type === 'file') {
        success = WebRTCService.sendFile(
          messageData.data,
          messageData.fileName,
          messageData.fileType,
          messageId
        );
      }

      if (success) {
        // Agregar mensaje al estado
        dispatch({
          type: CONNECTION_ACTIONS.ADD_MESSAGE,
          payload: {
            contactId: contactId,
            message: message,
          },
        });

        // Guardar en storage (temporal)
        await StorageService.saveChatMessage(contactId, message);
        
        return { success: true, messageId };
      } else {
        throw new Error('Failed to send message via WebRTC');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }
  };

  // Marcar mensaje como leído (autodestrucción)
  const markMessageAsRead = async (contactId, messageId) => {
    try {
      // Marcar como leído en storage (inicia autodestrucción)
      await StorageService.markMessageAsRead(contactId, messageId);
      
      // Programar eliminación del estado local
      setTimeout(() => {
        dispatch({
          type: CONNECTION_ACTIONS.REMOVE_MESSAGE,
          payload: { contactId, messageId },
        });
      }, 5000); // 5 segundos para autodestrucción
      
      return { success: true };
    } catch (error) {
      console.error('Error marking message as read:', error);
      return { success: false, error: error.message };
    }
  };

  // Cargar mensajes de chat
  const loadChatMessages = async (contactId) => {
    try {
      const messages = await StorageService.getChatMessages(contactId);
      
      dispatch({
        type: CONNECTION_ACTIONS.SET_MESSAGES,
        payload: {
          contactId: contactId,
          messages: messages,
        },
      });
      
      return { success: true, messages };
    } catch (error) {
      console.error('Error loading chat messages:', error);
      return { success: false, error: error.message };
    }
  };

  // Establecer chat actual
  const setCurrentChat = (contactId) => {
    dispatch({
      type: CONNECTION_ACTIONS.SET_CURRENT_CHAT,
      payload: contactId,
    });
    
    if (contactId) {
      loadChatMessages(contactId);
    }
  };

  // Actualizar estado de contacto
  const updateContactStatus = async (contactId, status) => {
    try {
      const success = await StorageService.updateContactStatus(contactId, status);
      
      if (success) {
        dispatch({
          type: CONNECTION_ACTIONS.UPDATE_CONTACT_STATUS,
          payload: {
            contactId: contactId,
            status: status,
            lastSeen: new Date().toISOString(),
          },
        });
      }
      
      return success;
    } catch (error) {
      console.error('Error updating contact status:', error);
      return false;
    }
  };

  // Desconectar de contacto
  const disconnectFromContact = (contactId) => {
    WebRTCService.closeConnection();
    
    dispatch({
      type: CONNECTION_ACTIONS.REMOVE_ACTIVE_CONNECTION,
      payload: contactId,
    });
    
    updateContactStatus(contactId, 'offline');
    
    if (state.currentChat === contactId) {
      dispatch({
        type: CONNECTION_ACTIONS.SET_CURRENT_CHAT,
        payload: null,
      });
    }
  };

  // Limpiar error
  const clearError = () => {
    dispatch({ type: CONNECTION_ACTIONS.CLEAR_ERROR });
  };

  // Obtener contacto por ID
  const getContactById = (contactId) => {
    return state.contacts.find(contact => contact.id === contactId);
  };

  // Verificar si está conectado a un contacto
  const isConnectedToContact = (contactId) => {
    return state.activeConnections[contactId] && 
           WebRTCService.isConnected();
  };

  const value = {
    // Estado
    ...state,
    
    // Acciones
    addContact,
    initiateConnection,
    respondToConnection,
    completeConnection,
    sendMessage,
    markMessageAsRead,
    loadChatMessages,
    setCurrentChat,
    updateContactStatus,
    disconnectFromContact,
    clearError,
    loadContacts,
    
    // Utilidades
    getContactById,
    isConnectedToContact,
  };

  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  );
}

// Hook personalizado
export function useConnection() {
  const context = useContext(ConnectionContext);
  
  if (!context) {
    throw new Error('useConnection must be used within a ConnectionProvider');
  }
  
  return context;
}

export default ConnectionContext;
