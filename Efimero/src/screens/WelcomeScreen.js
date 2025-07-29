import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { globalStyles } from '../theme/styles';
import colors from '../theme/colors';

/**
 * Pantalla de bienvenida de Efímero
 * Muestra logo animado y botón de entrada
 */

const { width, height } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  const { createUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startAnimations();
  }, []);

  const startAnimations = () => {
    // Secuencia de animaciones
    Animated.sequence([
      // Logo aparece con fade y scale
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      // Texto desliza hacia arriba
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      // Botón aparece
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleEnter = async () => {
    setIsLoading(true);
    
    try {
      // Crear usuario con nombre por defecto
      const result = await createUser('Usuario');
      
      if (result.success) {
        // Navegar a la pantalla principal
        navigation.replace('Main');
      } else {
        console.error('Error creating user:', result.error);
        // En caso de error, aún así navegar (el usuario puede configurar después)
        navigation.replace('Main');
      }
    } catch (error) {
      console.error('Error in handleEnter:', error);
      navigation.replace('Main');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      <View style={styles.content}>
        {/* Logo animado */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.logo}>
            <Text style={styles.logoText}>E</Text>
          </View>
        </Animated.View>

        {/* Título y subtítulo */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              transform: [{ translateY: slideAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          <Text style={styles.title}>Efímero</Text>
          <Text style={styles.subtitle}>Mensajería P2P Segura</Text>
          <Text style={styles.description}>
            Comunicación privada sin servidores
          </Text>
        </Animated.View>

        {/* Botón de entrada */}
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              opacity: buttonAnim,
              transform: [
                {
                  translateY: buttonAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={[
              globalStyles.button,
              globalStyles.primaryButton,
              styles.enterButton,
              isLoading && styles.buttonDisabled,
            ]}
            onPress={handleEnter}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={[globalStyles.primaryButtonText, styles.buttonText]}>
              {isLoading ? 'Iniciando...' : 'Entrar'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Indicadores de características */}
        <Animated.View
          style={[
            styles.featuresContainer,
            {
              opacity: buttonAnim,
            },
          ]}
        >
          <View style={styles.feature}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Sin servidores</Text>
          </View>
          <View style={styles.feature}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Mensajes efímeros</Text>
          </View>
          <View style={styles.feature}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Conexión directa</Text>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: colors.textSecondary,
    marginBottom: 15,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 40,
  },
  enterButton: {
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 30,
    shadowColor: colors.secondary,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  featuresContainer: {
    alignItems: 'center',
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textSecondary,
    marginRight: 10,
  },
  featureText: {
    fontSize: 12,
    color: colors.textMuted,
  },
};

export default WelcomeScreen;
