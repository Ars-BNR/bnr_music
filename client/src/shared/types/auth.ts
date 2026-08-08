export interface dataUser {
  sub: number;
  email: string;
  roles: string[];
  permissions: string[];
  mustChangePassword?: boolean;
}

export interface user {
  accessToken: string;
  user: dataUser;
}
