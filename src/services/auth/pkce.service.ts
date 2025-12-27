import { AuthRepository } from "../../repositories/auth.repository";
import { AuthError } from "../../errors/auth.error";
import { v4 as uuidv4 } from "uuid";
import * as crypto from "crypto";

export class PkceService {
  private authRepo = new AuthRepository();

  public async verifyPkce(secret_key: string, code_verifier: string): Promise<any> {
    try {
      const stored = await this.authRepo.findCodeChallange(secret_key);
      if (!stored) throw new AuthError("Code challenge not found", { secret_key });

      let parsed: any;
      try {
        parsed = JSON.parse(stored);
      } catch (e) {
        throw new AuthError("Stored code challenge is invalid", { secret_key, e });
      }

      const codeChallenge = parsed.code_challenge || parsed.code_challange;
      const response = parsed.response;

      if (!codeChallenge) throw new AuthError("Stored code challenge missing", { secret_key });

      const hash = crypto.createHash("sha256").update(code_verifier).digest();
      const b64 = hash.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

      if (b64 !== codeChallenge) {
        throw new AuthError("Code verifier does not match challenge", { secret_key });
      }

      if (response && typeof response === "object") {
        const out = { ...response };
        if (out.code_challenge) delete out.code_challenge;
        if (out.code_challange) delete out.code_challange;
        return out;
      }

      return response;
    } catch (err: any) {
      if (err instanceof AuthError) throw err;
      throw new AuthError("Code verification failed", { error: err });
    }
  }

  public async saveCodeChallenge(code_challange: string, response: any): Promise<string> {
    try {
      const key = uuidv4();
      await this.authRepo.storeCodeChallange(key, { code_challange, response });
      return key;
    } catch (error: any) {
      throw new AuthError("Authentication failed", { error });
    }
  }
}
