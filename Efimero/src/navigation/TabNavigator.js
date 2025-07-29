import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import colors from '../theme/colors';

// Screens
import ContactsScreen from '../screens/ContactsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';

/**
 * Navegador de pestañas inferior
 * Maneja la navegación entre las pantallas principales
 */

const Tab = createBottomTabNavigator();

// Componente de ícono personalizado (sin usar librerías de íconos)
const TabIcon = ({ name, focused }) => {
  const getIconText = () => {
    switch (name) {
      case 'Contacts':
        return '👥';
      case 'Profile':
        return '👤';
      case 'Settings':
        return '⚙️';
      default:
        return '•';
    }
  };

  const getLabel = () => {
    switch (name) {
      case 'Contacts':
        return 'Contactos';
      case 'Profile':
        return 'Perfil';
      case 'Settings':
        return 'Ajustes';
      default:
        return name;
    }
  };

  return (
    <View style={styles.tabIcon}>
      <Text style={[
        styles.iconText,
        { color: focused ? colors.secondary : colors.textMuted }
      ]}>
        {getIconText()}
      </Text>
      <Text style={[
        styles.labelText,
        { color: focused ? colors.secondary : colors.textMuted }
      ]}>
        {getLabel()}
      </Text>
    </View>
  );
};

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => (
          <TabIcon name={route.name} focused={focused} />
        ),
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.inputBorder,
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarShowLabel: false,
        headerStyle: {
          backgroundColor: colors.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.inputBorder,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
        tabBarActiveTintColor: colors.secondary,
        tabBarInactiveTintColor: colors.textMuted,
      })}
    >
      <Tab.Screen
        name="Contacts"
        component={ContactsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
};

const styles = {
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  iconText: {
    fontSize: 20,
    marginBottom: 4,
  },
  labelText: {
    fontSize: 10,
    fontWeight: '500',
  },
};

export default TabNavigator;
