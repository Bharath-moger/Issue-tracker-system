export type Role = 'ADMIN' | 'USER';
export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}
export type UserSummary = Pick<User, '_id' | 'name' | 'email' | 'role'>;
export interface Credentials {
  email: string;
  password: string;
}
export interface Registration extends Credentials {
  name: string;
}
export interface Session {
  user: User;
  token: string;
}
