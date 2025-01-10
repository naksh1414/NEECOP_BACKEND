export interface IBaseUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
