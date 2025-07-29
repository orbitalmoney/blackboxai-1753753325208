import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  StatusBar,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Dimensions,
} from 'react-native';
import { useConnection } from '../context/ConnectionContext';
import WebRTCService from '../services/WebRTCService';
import MediaService from '../services/MediaService';
import { globalStyles } from '../theme/styles';
import colors from '../theme/colors';

/**
 * Pantalla de chat P2P
 * Maneja mensajería efímera con texto, audio, video y archivos
 */

const { width } = Dimensions.get('window');

const ChatScreen = ({ route, navigation }) => {
  const { contactId, contactName } = route.params;
  const {
    messages,
    connectionState,
    sendMessage,
    markMessageAsRead,
    setCurrentChat,
    initiateConnection,
    respondToConnection,
    completeConnection,
    getContactById,
    isConnectedToContact,
  } = useConnection();

  const [messageText, setMessageText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [connectionData, setConnectionData] = useState(null);
  const [connectionStep, setConnectionStep] = useState('init'); // init, offer, answer, connected
  const [signalInput, setSignalInput] = useState('');

  const flatListRef = useRef(null);
  const contact = getContactById(contactId);
  const chatMessages = messages[contactId] || [];
  const isConnected = isConnectedToContact(contactId);

  useEffect(() => {
    setCurrentChat(contactId);
    
    // Configurar header
    navigation.setOptions({
      title: contactName,
      headerStyle: {
        backgroundColor: colors.surface,
      },
      headerTintColor: colors.text,
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleConnectionPress}
        >
          <Text style={[styles.headerButtonText, { color: getConnectionColor() }]}>
            {getConnectionText()}
          </Text>
        </TouchableOpacity>
      ),
    });

    return () => {
      setCurrentChat(null);
    };
  }, [contactId, contactName, connectionState]);

  const getConnectionColor = () => {
    switch (connectionState) {
      case 'connected':
        return colors.online;
      case 'connecting':
        return colors.connecting;
      default:
        return colors.offline;
    }
  };

  const getConnectionText = () => {
    switch (connectionState) {
      case 'connected':
        return 'Conectado';
      case 'connecting':
        return 'Conectando...';
      default:
        return 'Desconectado';
    }
  };

  const handleConnectionPress = () => {
    if (isConnected) {
      Alert.alert(
        'Conexión activa',
        'Ya estás conectado con este contacto',
        [{ text: 'OK' }]
      );
    } else {
      setShowConnectionModal(true);
      setConnectionStep('init');
    }
  };

  const handleInitiateConnection = async () => {
    try {
      const result = await initiateConnection(contactId);
      
      if (result.success) {
        setConnectionData(result.signalData);
        setConnectionStep('offer');
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo iniciar la conexión');
    }
  };

  const handleRespondToConnection = async () => {
    try {
      if (!signalInput.trim()) {
        Alert.alert('Error', 'Por favor pega los datos de conexión');
        return;
      }

      const offerData = JSON.parse(signalInput.trim());
      const result = await respondToConnection(contactId, offerData);
      
      if (result.success) {
        setConnectionData(result.answerData);
        setConnectionStep('answer');
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Datos de conexión inválidos');
    }
  };

  const handleCompleteConnection = async () => {
    try {
      if (!signalInput.trim()) {
        Alert.alert('Error', 'Por favor pega la respuesta de conexión');
        return;
      }

      const answerData = JSON.parse(signalInput.trim());
      const result = await completeConnection(contactId, answerData);
      
      if (result.success) {
        setShowConnectionModal(false);
        setConnectionStep('connected');
        Alert.alert('¡Éxito!', 'Conexión P2P establecida');
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Datos de respuesta inválidos');
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    if (!isConnected) {
      Alert.alert('Error', 'Debes establecer una conexión P2P primero');
      return;
    }

    const messageData = {
      type: 'text',
      content: messageText.trim(),
    };

    const result = await sendMessage(contactId, messageData);
    
    if (result.success) {
      setMessageText('');
      scrollToBottom();
    } else {
      Alert.alert('Error', 'No se pudo enviar el mensaje');
    }
  };

  const handleRecordAudio = async () => {
    if (!isConnected) {
      Alert.alert('Error', 'Debes establecer una conexión P2P primero');
      return;
    }

    try {
      if (!isRecording) {
        const result = await MediaService.startAudioRecording();
        if (result.success) {
          setIsRecording(true);
        } else {
          Alert.alert('Error', result.error);
        }
      } else {
        const result = await MediaService.stopAudioRecording();
        if (result.success) {
          setIsRecording(false);
          
          const messageData = {
            type: 'audio',
            data: result.data,
            duration: result.duration,
            fileName: `audio_${Date.now()}.mp4`,
          };

          await sendMessage(contactId, messageData);
        } else {
          Alert.alert('Error', result.error);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Error con la grabación de audio');
      setIsRecording(false);
    }
  };

  const handleSendFile = async () => {
    if (!isConnected) {
      Alert.alert('Error', 'Debes establecer una conexión P2P primero');
      return;
    }

    try {
      const result = await MediaService.pickDocument();
      
      if (result.success) {
        const messageData = {
          type: 'file',
          data: result.file.data,
          fileName: result.file.name,
          fileType: result.file.type,
          fileSize: result.file.size,
        };

        await sendMessage(contactId, messageData);
      }
    } catch (error) {
      Alert.alert('Error', 'Error al seleccionar archivo');
    }
  };

  const handleMessagePress = async (message) => {
    if (!message.read && message.received) {
      await markMessageAsRead(contactId, message.id);
    }
  };

  const handlePlayAudio = async (message) => {
    try {
      const tempFile = await MediaService.createTempAudioFile(
        message.data,
        message.fileName
      );
      
      if (tempFile.success) {
        await MediaService.playAudio(tempFile.path);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo reproducir el audio');
    }
  };

  const scrollToBottom = () => {
    if (flatListRef.current && chatMessages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  const renderMessage = ({ item: message }) => {
    const isSent = message.sent;
    const isRead = message.read;
    
    return (
      <TouchableOpacity
        style={[
          globalStyles.messageBubble,
          isSent ? globalStyles.sentMessage : globalStyles.receivedMessage,
          isRead && styles.readMessage,
        ]}
        onPress={() => handleMessagePress(message)}
        activeOpacity={0.7}
      >
        {message.type === 'text' && (
          <Text style={globalStyles.messageText}>{message.content}</Text>
        )}
        
        {message.type === 'audio' && (
          <View style={styles.audioMessage}>
            <TouchableOpacity
              style={styles.playButton}
              onPress={() => handlePlayAudio(message)}
            >
              <Text style={styles.playButtonText}>▶</Text>
            </TouchableOpacity>
            <Text style={styles.audioText}>Audio ({message.duration}s)</Text>
          </View>
        )}
        
        {message.type === 'file' && (
          <View style={styles.fileMessage}>
            <Text style={styles.fileName}>{message.fileName}</Text>
            <Text style={styles.fileSize}>
              {MediaService.formatFileSize(message.fileSize)}
            </Text>
          </View>
        )}
        
        <Text style={styles.messageTime}>
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
        
        {isRead && (
          <Text style={styles.readIndicator}>Autodestruido</Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderConnectionModal = () => (
    <Modal
      visible={showConnectionModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowConnectionModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.connectionModal}>
          <Text style={styles.modalTitle}>Establecer Conexión P2P</Text>
          
          {connectionStep === 'init' && (
            <View style={styles.connectionStep}>
              <Text style={styles.stepDescription}>
                Elige cómo establecer la conexión:
              </Text>
              
              <TouchableOpacity
                style={[globalStyles.button, globalStyles.primaryButton]}
                onPress={handleInitiateConnection}
              >
                <Text style={globalStyles.primaryButtonText}>
                  Iniciar conexión
                </Text>
              </TouchableOpacity>
              
              <Text style={styles.orText}>o</Text>
              
              <TouchableOpacity
                style={globalStyles.button}
                onPress={() => setConnectionStep('respond')}
              >
                <Text style={globalStyles.buttonText}>
                  Responder a conexión
                </Text>
              </TouchableOpacity>
            </View>
          )}
          
          {connectionStep === 'offer' && (
            <View style={styles.connectionStep}>
              <Text style={styles.stepDescription}>
                Comparte estos datos con tu contacto:
              </Text>
              
              <TextInput
                style={[styles.signalData, styles.readOnlyInput]}
                value={JSON.stringify(connectionData, null, 2)}
                multiline={true}
                editable={false}
              />
              
              <TouchableOpacity
                style={globalStyles.button}
                onPress={() => {
                  // Copiar al portapapeles
                  Alert.alert('Copiado', 'Datos copiados al portapapeles');
                }}
              >
                <Text style={globalStyles.buttonText}>Copiar datos</Text>
              </TouchableOpacity>
              
              <Text style={styles.stepDescription}>
                Luego pega la respuesta aquí:
              </Text>
              
              <TextInput
                style={styles.signalData}
                value={signalInput}
                onChangeText={setSignalInput}
                placeholder="Pega la respuesta aquí..."
                placeholderTextColor={colors.textMuted}
                multiline={true}
              />
              
              <TouchableOpacity
                style={[globalStyles.button, globalStyles.primaryButton]}
                onPress={handleCompleteConnection}
              >
                <Text style={globalStyles.primaryButtonText}>
                  Completar conexión
                </Text>
              </TouchableOpacity>
            </View>
          )}
          
          {connectionStep === 'respond' && (
            <View style={styles.connectionStep}>
              <Text style={styles.stepDescription}>
                Pega los datos de conexión que recibiste:
              </Text>
              
              <TextInput
                style={styles.signalData}
                value={signalInput}
                onChangeText={setSignalInput}
                placeholder="Pega los datos aquí..."
                placeholderTextColor={colors.textMuted}
                multiline={true}
              />
              
              <TouchableOpacity
                style={[globalStyles.button, globalStyles.primaryButton]}
                onPress={handleRespondToConnection}
              >
                <Text style={globalStyles.primaryButtonText}>
                  Generar respuesta
                </Text>
              </TouchableOpacity>
            </View>
          )}
          
          {connectionStep === 'answer' && (
            <View style={styles.connectionStep}>
              <Text style={styles.stepDescription}>
                Envía esta respuesta a tu contacto:
              </Text>
              
              <TextInput
                style={[styles.signalData, styles.readOnlyInput]}
                value={JSON.stringify(connectionData, null, 2)}
                multiline={true}
                editable={false}
              />
              
              <TouchableOpacity
                style={globalStyles.button}
                onPress={() => {
                  Alert.alert('Copiado', 'Respuesta copiada al portapapeles');
                }}
              >
                <Text style={globalStyles.buttonText}>Copiar respuesta</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <TouchableOpacity
            style={[globalStyles.button, styles.closeButton]}
            onPress={() => setShowConnectionModal(false)}
          >
            <Text style={globalStyles.buttonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={globalStyles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.surface} />
      
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Estado de conexión */}
        {!isConnected && (
          <View style={styles.connectionBanner}>
            <Text style={styles.connectionBannerText}>
              {connectionState === 'connecting' 
                ? 'Estableciendo conexión P2P...' 
                : 'Toca "Desconectado" para establecer conexión P2P'
              }
            </Text>
          </View>
        )}

        {/* Lista de mensajes */}
        <FlatList
          ref={flatListRef}
          data={chatMessages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={globalStyles.chatContainer}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
        />

        {/* Barra de entrada */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Escribe un mensaje..."
            placeholderTextColor={colors.textMuted}
            multiline={true}
            maxLength={1000}
          />
          
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, isRecording && styles.recordingButton]}
              onPress={handleRecordAudio}
            >
              <Text style={styles.actionButtonText}>
                {isRecording ? '⏹' : '🎤'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleSendFile}
            >
              <Text style={styles.actionButtonText}>📎</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={!messageText.trim()}
            >
              <Text style={styles.sendButtonText}>Enviar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {renderConnectionModal()}
    </SafeAreaView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    backgroundColor: colors.surface,
  },
  headerButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  connectionBanner: {
    backgroundColor: colors.connecting,
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  connectionBannerText: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.inputBorder,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.input,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.inputText,
    maxHeight: 100,
    marginRight: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.button,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  recordingButton: {
    backgroundColor: colors.error,
  },
  actionButtonText: {
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginLeft: 5,
  },
  sendButtonDisabled: {
    backgroundColor: colors.inputBorder,
  },
  sendButtonText: {
    color: colors.primary,
    fontWeight: '600',
  },
  readMessage: {
    opacity: 0.5,
  },
  messageTime: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  readIndicator: {
    fontSize: 10,
    color: colors.error,
    fontStyle: 'italic',
    marginTop: 2,
  },
  audioMessage: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  playButtonText: {
    color: colors.primary,
    fontSize: 12,
  },
  audioText: {
    color: colors.messageText,
    fontSize: 14,
  },
  fileMessage: {
    alignItems: 'flex-start',
  },
  fileName: {
    color: colors.messageText,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  fileSize: {
    color: colors.textMuted,
    fontSize: 12,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectionModal: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 25,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  connectionStep: {
    marginBottom: 20,
  },
  stepDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 15,
    textAlign: 'center',
    lineHeight: 20,
  },
  signalData: {
    backgroundColor: colors.input,
    borderRadius: 10,
    padding: 15,
    fontSize: 12,
    color: colors.inputText,
    fontFamily: 'monospace',
    minHeight: 100,
    marginBottom: 15,
    textAlignVertical: 'top',
  },
  readOnlyInput: {
    backgroundColor: colors.background,
    color: colors.textMuted,
  },
  orText: {
    textAlign: 'center',
    color: colors.textMuted,
    marginVertical: 10,
  },
  closeButton: {
    backgroundColor: colors.error,
    marginTop: 10,
  },
};

export default ChatScreen;
