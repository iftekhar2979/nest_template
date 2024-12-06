import * as bcrypt from 'bcryptjs';

export async function comparePassword(plainTextPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainTextPassword, hashedPassword);
}
