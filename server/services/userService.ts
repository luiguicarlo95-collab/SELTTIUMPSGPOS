
import { UserRepository } from "../repositories/userRepository";
import { query } from "../config/db";
import bcrypt from "bcryptjs";
import { ApiError } from "../middleware/errorHandler";

export class UserService {
  static async getAllUsers() {
    return UserRepository.findAll();
  }

  static async createUser(data: any) {
    const { email, password, name, role } = data;
    const currentCount = UserRepository.count();
    const unlimited_users = query.get("SELECT value FROM settings WHERE key = 'unlimited_users'") as { value: string };
    
    if (unlimited_users?.value !== '1' && currentCount >= 5) {
      throw new ApiError(400, "Límite de 5 usuarios alcanzado.");
    }
    
    if (role === 'DESARROLLADOR') throw new ApiError(400, "Rol no permitido");

    const hashedPassword = bcrypt.hashSync(password, 10);
    return UserRepository.create({ email, password: hashedPassword, name, role: role || 'ESTANDARD' });
  }

  static async updateUser(id: number, data: any) {
    const { password } = data;
    const updateData: any = { ...data };
    delete updateData.id;

    if (password) {
      updateData.password = bcrypt.hashSync(password, 10);
    } else {
      delete updateData.password;
    }

    return UserRepository.update(id, updateData);
  }

  static async deleteUser(id: number) {
    return UserRepository.delete(id);
  }
}
