export interface user {
  accessToken: string;
  user: dataUser;
  refreshToken: string;
}
export interface dataUser {
  email?: string;
  id?: number;
  role?: string;
}
