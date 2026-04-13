export interface User {
  id: string;
  name: string;
  username: string;
  password: string;
  role: string;
  address: string;
}

export class UserModel implements User {
  id:string;
  name: string;
  username: string;
  password: string;
  role: string = "farmer";
  address: string;

  constructor(user: Partial<User>) {
    this.id = user.id || "";
    this.name = user.name || "";
    this.username = user.username || "";
    this.password = user.password || "";
    this.role = user.role || "user";
    this.address = user.address || "";
  }
}
