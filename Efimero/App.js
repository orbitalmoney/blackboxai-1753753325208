import React from 'react';
import { StatusBar } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import { ConnectionProvider } from './src/context/ConnectionContext';
import AppNavigator from './src/navigation/AppNavigator';
import colors from './src/theme/colors';

/**
 * Componente principal de la aplicación Efímero
 * Configura los providers y la navegación principal
 */

const App = () => {
  return (
    <AuthProvider>
      <ConnectionProvider>
        <StatusBar
          barStyle="light-content"
          backgroundColor={colors.background}
          translucent={false}
        />
        <AppNavigator />
      </ConnectionProvider>
    </AuthProvider>
  );
};

export default App;
