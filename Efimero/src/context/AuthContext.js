import React, { createContext, useContext, useReducer, useEffect } from 'react';
import StorageService from '../services/StorageService';

/**
 * Contexto de autenticación para Efímero
 * Maneja el estado del usuario y perfil
 */

const AuthContext = createContext();

// Estados iniciales
const initialState = {
  isAuthenticated: false,
  user: null,
  loading: true,
  error: null,
};

// Tipos de acciones
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
        loading: false,
        error: null,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        loading: false,
      };

    case AUTH_ACTIONS.UPDATE_PROFILE:
      return {
        ...state,
        user: {
          ...state.user,
          ...action.payload,
        },
      };

    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
}

// Provider
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Cargar perfil al iniciar
  useEffect(() => {
    loadUserProfile();
  }, []);

  // Cargar perfil de usuario desde storage
  const loadUserProfile = async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      const profile = await StorageService.getUserProfile();
      
      if (profile) {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: profile,
        });
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: 'Error loading user profile',
      });
    }
  };

  // Crear nuevo usuario
  const createUser = async (name) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      const userId = StorageService.generateUserId();
      const newUser = {
        id: userId,
        name: name.trim(),
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
      };

      const success = await StorageService.saveUserProfile(newUser);
      
      if (success) {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: newUser,
        });
        return { success: true, user: newUser };
      } else {
        throw new Error('Failed to save user profile');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: 'Error creating user profile',
      });
      return { success: false, error: error.message };
    }
  };

  // Actualizar perfil
  const updateProfile = async (updates) => {
    try {
      const updatedUser = {
        ...state.user,
        ...updates,
        lastActive: new Date().toISOString(),
      };

      const success = await StorageService.saveUserProfile(updatedUser);
      
      if (success) {
        dispatch({
          type: AUTH_ACTIONS.UPDATE_PROFILE,
          payload: updates,
        });
        return { success: true };
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: 'Error updating profile',
      });
      return { success: false, error: error.message };
    }
  };

  // Cerrar sesión
  const logout = async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      const success = await StorageService.clearAllData();
      
      if (success) {
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
        return { success: true };
      } else {
        throw new Error('Failed to clear data');
      }
    } catch (error) {
      console.error('Error during logout:', error);
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: 'Error during logout',
      });
      return { success: false, error: error.message };
    }
  };

  // Actualizar última actividad
  const updateLastActive = async () => {
    if (state.user) {
      const updates = {
        lastActive: new Date().toISOString(),
      };
      await updateProfile(updates);
    }
  };

  // Limpiar error
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Validar nombre de usuario
  const validateUserName = (name) => {
    if (!name || name.trim().length === 0) {
      return { valid: false, error: 'Name is required' };
    }
    
    if (name.trim().length < 2) {
      return { valid: false, error: 'Name must be at least 2 characters' };
    }
    
    if (name.trim().length > 50) {
      return { valid: false, error: 'Name must be less than 50 characters' };
    }
    
    // Verificar caracteres válidos (letras, números, espacios, algunos símbolos)
    const validNameRegex = /^[a-zA-Z0-9\s\-_.]+$/;
    if (!validNameRegex.test(name.trim())) {
      return { valid: false, error: 'Name contains invalid characters' };
    }
    
    return { valid: true };
  };

  // Obtener información del usuario para compartir
  const getUserShareInfo = () => {
    if (!state.user) return null;
    
    return {
      id: state.user.id,
      name: state.user.name,
      qrData: JSON.stringify({
        id: state.user.id,
        name: state.user.name,
        type: 'efimero_contact',
      }),
    };
  };

  const value = {
    // Estado
    ...state,
    
    // Acciones
    createUser,
    updateProfile,
    logout,
    updateLastActive,
    clearError,
    
    // Utilidades
    validateUserName,
    getUserShareInfo,
    loadUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

export default AuthContext;
