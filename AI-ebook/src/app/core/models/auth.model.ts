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
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}
