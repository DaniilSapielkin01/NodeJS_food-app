export interface IBodySignup {
  email: string;
  password: string;
  name: string;
}

export interface IBodyLogin {
  email: string;
  password: string;
}

export interface ISaveRefreshToken {
  userId: string;
  token: string;
  expiresAt: Date;
}
