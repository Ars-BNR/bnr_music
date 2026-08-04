export interface dataUser {
  sub: number;
  email: string;
  role: string;
}

export interface user {
  accessToken: string;
  user: dataUser;
}
