import { AuthRepository } from "../../repositories/auth.repository";

export class AdminAuthService {
  private authRepo = new AuthRepository();

  public async isUserAdmin(userId: string): Promise<boolean> {
    try {
      const flag = await this.authRepo.isUserAdmin(userId);
      return !!flag;
    } catch (err) {
      throw err;
    }
  }
}
