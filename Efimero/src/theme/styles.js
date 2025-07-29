import { StyleSheet, Dimensions } from 'react-native';
import colors from './colors';

const { width, height } = Dimensions.get('window');

/**
 * Estilos globales para la aplicación Efímero
 * Diseño minimalista y consistente
 */

export const globalStyles = StyleSheet.create({
  // Contenedores principales
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 20,
  },
  
  // Texto
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 15,
  },
  
  bodyText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  
  secondaryText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  
  mutedText: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
  },
  
  // Botones
  button: {
    backgroundColor: colors.button,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    minWidth: 120,
  },
  
  buttonText: {
    color: colors.buttonText,
    fontSize: 16,
    fontWeight: '600',
  },
  
  primaryButton: {
    backgroundColor: colors.secondary,
  },
  
  primaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Campos de entrada
  input: {
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.inputText,
    marginVertical: 8,
  },
  
  // Tarjetas
  card: {
    backgroundColor: colors.card,
    borderRadius: 15,
    padding: 20,
    marginVertical: 10,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  
  // Lista
  listItem: {
    backgroundColor: colors.surface,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.inputBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  // Chat
  chatContainer: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 10,
  },
  
  messageBubble: {
    maxWidth: width * 0.8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginVertical: 5,
  },
  
  sentMessage: {
    backgroundColor: colors.messageSent,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 5,
  },
  
  receivedMessage: {
    backgroundColor: colors.messageReceived,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 5,
  },
  
  messageText: {
    color: colors.messageText,
    fontSize: 16,
    lineHeight: 22,
  },
  
  // Header
  header: {
    backgroundColor: colors.surface,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.inputBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  
  // Estados de conexión
  statusOnline: {
    color: colors.online,
    fontSize: 12,
    fontWeight: '500',
  },
  
  statusOffline: {
    color: colors.offline,
    fontSize: 12,
    fontWeight: '500',
  },
  
  statusConnecting: {
    color: colors.connecting,
    fontSize: 12,
    fontWeight: '500',
  },
  
  // Utilidades
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  spaceBetween: {
    justifyContent: 'space-between',
  },
  
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  marginTop: {
    marginTop: 20,
  },
  
  marginBottom: {
    marginBottom: 20,
  },
  
  padding: {
    padding: 20,
  },
  
  // Animaciones
  fadeIn: {
    opacity: 1,
  },
  
  fadeOut: {
    opacity: 0,
  },
});

// Dimensiones útiles
export const dimensions = {
  width,
  height,
  isSmallDevice: width < 375,
  isLargeDevice: width > 414,
};

export default globalStyles;
