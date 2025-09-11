export interface User {
  id: string;
  name: string;
  email?: string;
  age?: number;
  avatar?: string;
  type: 'student' | 'parent';
  token?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}
