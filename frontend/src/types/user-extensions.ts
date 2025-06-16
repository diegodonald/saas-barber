import { User } from '../contexts/AuthContext';

// Extensão temporária para o tipo User
export interface UserExtended extends User {
  barbershopId?: string;
}
