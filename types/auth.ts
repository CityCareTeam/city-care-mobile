export type LoginPayload = {
  username: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
};

export type RegisterPayload = {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
};

export type RegisterResponse = {
  userId: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  message: string;
};

export type MeResponse = {
  sub: string | null;
  email: string | null;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  roles: string[];
  mainRole: "Admin" | "Agent" | "Citizen" | null;
};
