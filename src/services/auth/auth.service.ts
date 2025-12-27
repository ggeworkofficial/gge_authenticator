import dotenv from "dotenv";
import { PasswordAuthService } from "./password.service";
import { JwtAuthService } from "./jwt.service";
import { RefreshAuthService } from "./refresh.service";
import { PkceService } from "./pkce.service";
import { AppHmacAuthService } from "./apphmac.service";
import { InternalAuthService } from "./internal.service";
import { AuthRepository } from "../../repositories/auth.repository";
import { AdminAuthService } from "./admin.service";

dotenv.config();

export class AuthService {
  constructor(
    private password = new PasswordAuthService(),
    private jwt = new JwtAuthService(),
    private refresh = new RefreshAuthService(),
    private pkce = new PkceService(),
    private appHmac = new AppHmacAuthService(),
    private internal = new InternalAuthService(),
    private admin = new AdminAuthService()
  ) {}

  // Backwards-compatible access to some repo-backed helpers
  private authRepo = new AuthRepository();
  

  public async isUserAdmin(userId: string): Promise<boolean> {
    return this.admin.isUserAdmin(userId);
  }

  // Backwards-compatible method names used elsewhere in the codebase
  public async refreshAccessToken(params: any) {
    return this.refresh.rotate(params);
  }

  public async verifyCodeChallenge(secret_key: string, code_verifier: string) {
    return this.pkce.verifyPkce(secret_key, code_verifier);
  }

  // preserve existing typo used in helper: saveCodeChalleng
  public async saveCodeChalleng(code_challange: string, response: any) {
    return this.pkce.saveCodeChallenge(code_challange, response);
  }

  public async authenticateAppHmac(payload: any) {
    return this.appHmac.authenticate(payload);
  }

  // Password-related operations
  login(payload: any) {
    return this.password.login(payload);
  }

  changePassword(params: any) {
    return this.password.changePassword(params);
  }

  // JWT authentication
  authenticate(accessToken: string) {
    return this.jwt.authenticate(accessToken);
  }

  // Refresh token rotation
  refreshTokens(params: any) {
    return this.refresh.rotate(params);
  }

  // PKCE helpers
  verifyPkce(secret_key: string, code_verifier: string) {
    return this.pkce.verifyPkce(secret_key, code_verifier);
  }

  saveCodeChallenge(code_challenge: string, response: any) {
    return this.pkce.saveCodeChallenge(code_challenge, response);
  }

  // App HMAC
  authenticateApp(payload: any) {
    return this.appHmac.authenticate(payload);
  }

  // Internal HMAC
  createInternalSignature(params: any) {
    return this.internal.createInternalSignature(params);
  }

  validateInternalHmac(params: any) {
    return this.internal.validateInternalHmac(params);
  }
}
