import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import { PermissionsAndroid, Platform } from 'react-native';

/**
 * Servicio de medios para Efímero
 * Maneja grabación de audio/video, selección de archivos y permisos
 */

class MediaService {
  constructor() {
    this.audioRecorderPlayer = new AudioRecorderPlayer();
    this.isRecording = false;
    this.isPlaying = false;
    this.currentRecordingPath = null;
  }

  // Solicitar permisos necesarios
  async requestPermissions() {
    if (Platform.OS === 'android') {
      try {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        ];

        const granted = await PermissionsAndroid.requestMultiple(permissions);
        
        return {
          audio: granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === 'granted',
          camera: granted[PermissionsAndroid.PERMISSIONS.CAMERA] === 'granted',
          storage: granted[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] === 'granted' &&
                   granted[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] === 'granted',
        };
      } catch (error) {
        console.error('Error requesting permissions:', error);
        return { audio: false, camera: false, storage: false };
      }
    }
    
    // Para iOS, los permisos se manejan automáticamente
    return { audio: true, camera: true, storage: true };
  }

  // Verificar permisos
  async checkPermissions() {
    if (Platform.OS === 'android') {
      try {
        const audioPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
        const cameraPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.CAMERA
        );
        const storagePermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
        );

        return {
          audio: audioPermission,
          camera: cameraPermission,
          storage: storagePermission,
        };
      } catch (error) {
        console.error('Error checking permissions:', error);
        return { audio: false, camera: false, storage: false };
      }
    }
    
    return { audio: true, camera: true, storage: true };
  }

  // Grabación de audio
  async startAudioRecording() {
    try {
      const permissions = await this.checkPermissions();
      if (!permissions.audio) {
        const granted = await this.requestPermissions();
        if (!granted.audio) {
          throw new Error('Audio permission not granted');
        }
      }

      const path = `${RNFS.CachesDirectoryPath}/audio_${Date.now()}.mp4`;
      this.currentRecordingPath = path;

      const audioSet = {
        AudioEncoderAndroid: 'aac',
        AudioSourceAndroid: 'mic',
        AVEncoderAudioQualityKeyIOS: 'high',
        AVNumberOfChannelsKeyIOS: 2,
        AVFormatIDKeyIOS: 'mp4',
      };

      await this.audioRecorderPlayer.startRecorder(path, audioSet);
      this.isRecording = true;
      
      return { success: true, path };
    } catch (error) {
      console.error('Error starting audio recording:', error);
      return { success: false, error: error.message };
    }
  }

  async stopAudioRecording() {
    try {
      if (!this.isRecording) {
        return { success: false, error: 'Not recording' };
      }

      const result = await this.audioRecorderPlayer.stopRecorder();
      this.isRecording = false;

      // Leer el archivo y convertir a base64
      const audioData = await RNFS.readFile(this.currentRecordingPath, 'base64');
      
      return {
        success: true,
        path: this.currentRecordingPath,
        data: audioData,
        duration: result,
      };
    } catch (error) {
      console.error('Error stopping audio recording:', error);
      return { success: false, error: error.message };
    }
  }

  // Reproducción de audio
  async playAudio(audioPath) {
    try {
      if (this.isPlaying) {
        await this.stopAudio();
      }

      await this.audioRecorderPlayer.startPlayer(audioPath);
      this.isPlaying = true;

      this.audioRecorderPlayer.addPlayBackListener((e) => {
        if (e.currentPosition === e.duration) {
          this.stopAudio();
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Error playing audio:', error);
      return { success: false, error: error.message };
    }
  }

  async stopAudio() {
    try {
      await this.audioRecorderPlayer.stopPlayer();
      this.audioRecorderPlayer.removePlayBackListener();
      this.isPlaying = false;
      return { success: true };
    } catch (error) {
      console.error('Error stopping audio:', error);
      return { success: false, error: error.message };
    }
  }

  // Selección de documentos
  async pickDocument() {
    try {
      const permissions = await this.checkPermissions();
      if (!permissions.storage) {
        const granted = await this.requestPermissions();
        if (!granted.storage) {
          throw new Error('Storage permission not granted');
        }
      }

      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        copyTo: 'cachesDirectory',
      });

      if (result && result.length > 0) {
        const file = result[0];
        
        // Leer el archivo y convertir a base64
        const fileData = await RNFS.readFile(file.fileCopyUri, 'base64');
        
        return {
          success: true,
          file: {
            name: file.name,
            type: file.type,
            size: file.size,
            uri: file.uri,
            data: fileData,
          },
        };
      }

      return { success: false, error: 'No file selected' };
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        return { success: false, error: 'User cancelled' };
      }
      console.error('Error picking document:', error);
      return { success: false, error: error.message };
    }
  }

  // Guardar archivo recibido
  async saveReceivedFile(fileData, fileName, fileType) {
    try {
      const permissions = await this.checkPermissions();
      if (!permissions.storage) {
        const granted = await this.requestPermissions();
        if (!granted.storage) {
          throw new Error('Storage permission not granted');
        }
      }

      const downloadsPath = RNFS.DownloadDirectoryPath;
      const filePath = `${downloadsPath}/${fileName}`;
      
      await RNFS.writeFile(filePath, fileData, 'base64');
      
      return {
        success: true,
        path: filePath,
        message: 'File saved to Downloads',
      };
    } catch (error) {
      console.error('Error saving file:', error);
      return { success: false, error: error.message };
    }
  }

  // Crear archivo de audio temporal desde base64
  async createTempAudioFile(audioData, fileName = null) {
    try {
      const tempFileName = fileName || `temp_audio_${Date.now()}.mp4`;
      const tempPath = `${RNFS.CachesDirectoryPath}/${tempFileName}`;
      
      await RNFS.writeFile(tempPath, audioData, 'base64');
      
      return {
        success: true,
        path: tempPath,
      };
    } catch (error) {
      console.error('Error creating temp audio file:', error);
      return { success: false, error: error.message };
    }
  }

  // Limpiar archivos temporales
  async cleanupTempFiles() {
    try {
      const tempDir = RNFS.CachesDirectoryPath;
      const files = await RNFS.readDir(tempDir);
      
      const tempFiles = files.filter(file => 
        file.name.startsWith('audio_') || 
        file.name.startsWith('temp_audio_') ||
        file.name.startsWith('video_')
      );

      for (const file of tempFiles) {
        await RNFS.unlink(file.path);
      }

      return { success: true, cleaned: tempFiles.length };
    } catch (error) {
      console.error('Error cleaning temp files:', error);
      return { success: false, error: error.message };
    }
  }

  // Obtener información de archivo
  async getFileInfo(filePath) {
    try {
      const stat = await RNFS.stat(filePath);
      return {
        success: true,
        info: {
          size: stat.size,
          isFile: stat.isFile(),
          isDirectory: stat.isDirectory(),
          mtime: stat.mtime,
          ctime: stat.ctime,
        },
      };
    } catch (error) {
      console.error('Error getting file info:', error);
      return { success: false, error: error.message };
    }
  }

  // Formatear tamaño de archivo
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Obtener extensión de archivo
  getFileExtension(fileName) {
    return fileName.split('.').pop().toLowerCase();
  }

  // Verificar si es archivo de imagen
  isImageFile(fileName) {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    const extension = this.getFileExtension(fileName);
    return imageExtensions.includes(extension);
  }

  // Verificar si es archivo de audio
  isAudioFile(fileName) {
    const audioExtensions = ['mp3', 'wav', 'aac', 'mp4', 'm4a', 'ogg'];
    const extension = this.getFileExtension(fileName);
    return audioExtensions.includes(extension);
  }

  // Verificar si es archivo de video
  isVideoFile(fileName) {
    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'];
    const extension = this.getFileExtension(fileName);
    return videoExtensions.includes(extension);
  }

  // Estado de grabación
  getRecordingState() {
    return {
      isRecording: this.isRecording,
      isPlaying: this.isPlaying,
      currentPath: this.currentRecordingPath,
    };
  }
}

export default new MediaService();
