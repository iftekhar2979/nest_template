import * as bcrypt from 'bcryptjs';

export async function comparePassword(
  plainTextPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(plainTextPassword, hashedPassword);
}


 export async function hashPassword(password: string):Promise<string> {
    const salt = await bcrypt.genSalt(10); // Generate salt with 10 rounds
  //  password = ;
    return await bcrypt.hash(password, salt)
  }

