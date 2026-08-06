export interface dataUser {
  sub: number;
  email: string;
  roles: string[];
  permissions: string[];
}

export interface user {
  accessToken: string;
  user: dataUser;
}
