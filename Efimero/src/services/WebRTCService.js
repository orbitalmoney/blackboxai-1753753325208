import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
} from 'react-native-webrtc';

/**
 * Servicio WebRTC para conexiones P2P en Efímero
 * Maneja la señalización y conexión directa entre peers
 */

class WebRTCService {
  constructor() {
    this.peerConnection = null;
    this.dataChannel = null;
    this.localStream = null;
    this.remoteStream = null;
    this.isInitiator = false;
    this.connectionState = 'disconnected';
    this.onMessageReceived = null;
    this.onConnectionStateChange = null;
    this.onRemoteStreamReceived = null;
    
    // Configuración de servidores STUN/TURN públicos
    this.pcConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
      ],
    };
  }

  // Inicializar conexión como iniciador
  async initializeConnection() {
    try {
      this.isInitiator = true;
      await this.createPeerConnection();
      await this.createDataChannel();
      
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      
      return {
        type: 'offer',
        sdp: offer.sdp,
      };
    } catch (error) {
      console.error('Error initializing connection:', error);
      throw error;
    }
  }

  // Responder a una oferta de conexión
  async handleOffer(offerData) {
    try {
      this.isInitiator = false;
      await this.createPeerConnection();
      
      const offer = new RTCSessionDescription({
        type: 'offer',
        sdp: offerData.sdp,
      });
      
      await this.peerConnection.setRemoteDescription(offer);
      
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      
      return {
        type: 'answer',
        sdp: answer.sdp,
      };
    } catch (error) {
      console.error('Error handling offer:', error);
      throw error;
    }
  }

  // Manejar respuesta a la oferta
  async handleAnswer(answerData) {
    try {
      const answer = new RTCSessionDescription({
        type: 'answer',
        sdp: answerData.sdp,
      });
      
      await this.peerConnection.setRemoteDescription(answer);
    } catch (error) {
      console.error('Error handling answer:', error);
      throw error;
    }
  }

  // Manejar candidatos ICE
  async handleIceCandidate(candidateData) {
    try {
      const candidate = new RTCIceCandidate({
        candidate: candidateData.candidate,
        sdpMLineIndex: candidateData.sdpMLineIndex,
        sdpMid: candidateData.sdpMid,
      });
      
      await this.peerConnection.addIceCandidate(candidate);
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }

  // Crear conexión peer
  async createPeerConnection() {
    this.peerConnection = new RTCPeerConnection(this.pcConfig);
    
    // Manejar candidatos ICE
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // En una implementación real, esto se enviaría al peer remoto
        console.log('ICE candidate:', event.candidate);
      }
    };
    
    // Manejar cambios de estado de conexión
    this.peerConnection.onconnectionstatechange = () => {
      this.connectionState = this.peerConnection.connectionState;
      console.log('Connection state:', this.connectionState);
      
      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(this.connectionState);
      }
    };
    
    // Manejar stream remoto
    this.peerConnection.onaddstream = (event) => {
      this.remoteStream = event.stream;
      if (this.onRemoteStreamReceived) {
        this.onRemoteStreamReceived(event.stream);
      }
    };
    
    // Manejar canal de datos (solo para el receptor)
    if (!this.isInitiator) {
      this.peerConnection.ondatachannel = (event) => {
        this.setupDataChannel(event.channel);
      };
    }
  }

  // Crear canal de datos
  async createDataChannel() {
    this.dataChannel = this.peerConnection.createDataChannel('messages', {
      ordered: true,
    });
    
    this.setupDataChannel(this.dataChannel);
  }

  // Configurar canal de datos
  setupDataChannel(channel) {
    this.dataChannel = channel;
    
    this.dataChannel.onopen = () => {
      console.log('Data channel opened');
      this.connectionState = 'connected';
      if (this.onConnectionStateChange) {
        this.onConnectionStateChange('connected');
      }
    };
    
    this.dataChannel.onclose = () => {
      console.log('Data channel closed');
      this.connectionState = 'disconnected';
      if (this.onConnectionStateChange) {
        this.onConnectionStateChange('disconnected');
      }
    };
    
    this.dataChannel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (this.onMessageReceived) {
          this.onMessageReceived(message);
        }
      } catch (error) {
        console.error('Error parsing received message:', error);
      }
    };
    
    this.dataChannel.onerror = (error) => {
      console.error('Data channel error:', error);
    };
  }

  // Enviar mensaje de texto
  sendTextMessage(text, messageId) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      const message = {
        id: messageId,
        type: 'text',
        content: text,
        timestamp: new Date().toISOString(),
      };
      
      this.dataChannel.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  // Enviar archivo
  sendFile(fileData, fileName, fileType, messageId) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      const message = {
        id: messageId,
        type: 'file',
        content: fileData,
        fileName: fileName,
        fileType: fileType,
        timestamp: new Date().toISOString(),
      };
      
      this.dataChannel.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  // Obtener stream de cámara
  async getCameraStream(facingMode = 'user') {
    try {
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      };
      
      this.localStream = await mediaDevices.getUserMedia(constraints);
      return this.localStream;
    } catch (error) {
      console.error('Error getting camera stream:', error);
      throw error;
    }
  }

  // Obtener stream de audio
  async getAudioStream() {
    try {
      const constraints = {
        video: false,
        audio: true,
      };
      
      this.localStream = await mediaDevices.getUserMedia(constraints);
      return this.localStream;
    } catch (error) {
      console.error('Error getting audio stream:', error);
      throw error;
    }
  }

  // Agregar stream local a la conexión
  addLocalStream(stream) {
    if (this.peerConnection && stream) {
      this.peerConnection.addStream(stream);
    }
  }

  // Detener stream local
  stopLocalStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
      });
      this.localStream = null;
    }
  }

  // Cerrar conexión
  closeConnection() {
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    
    this.stopLocalStream();
    
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => {
        track.stop();
      });
      this.remoteStream = null;
    }
    
    this.connectionState = 'disconnected';
    this.isInitiator = false;
  }

  // Obtener estado de conexión
  getConnectionState() {
    return this.connectionState;
  }

  // Verificar si está conectado
  isConnected() {
    return this.connectionState === 'connected' && 
           this.dataChannel && 
           this.dataChannel.readyState === 'open';
  }

  // Configurar callbacks
  setOnMessageReceived(callback) {
    this.onMessageReceived = callback;
  }

  setOnConnectionStateChange(callback) {
    this.onConnectionStateChange = callback;
  }

  setOnRemoteStreamReceived(callback) {
    this.onRemoteStreamReceived = callback;
  }

  // Generar datos de señalización para compartir manualmente
  generateSignalingData() {
    if (this.peerConnection && this.peerConnection.localDescription) {
      return {
        type: this.peerConnection.localDescription.type,
        sdp: this.peerConnection.localDescription.sdp,
      };
    }
    return null;
  }
}

export default new WebRTCService();
