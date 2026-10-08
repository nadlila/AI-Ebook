export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthSession {
  role?: 'AUTHOR' | 'READER';
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}
