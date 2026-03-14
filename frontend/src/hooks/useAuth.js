import { useContext } from 'react';
import { AuthContext } from '../context/AuthContextValue';

export const useAuth = () => useContext(AuthContext);
