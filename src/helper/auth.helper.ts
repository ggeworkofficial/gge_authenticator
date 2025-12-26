import { Request } from "express";
import { MainError } from "../errors/main.error";
import { AuthService } from "../services/auth.service";
import { Logger } from "../utils/logger";
import { AccessTokenExpiredError, AuthError } from "../errors/auth.error";

const logger = Logger.getLogger();

export interface AuthPayload {
  user_id?: string;
  device_id?: string;
  app_id?: string;
  session_id?: string;
  access_token?: string;
  refresh_token?: string;
  accessTokenTtl?: number;
  refreshTokenTtl?: number;
  access_token_expires_at?: Date | undefined;
  code_challenger?: string;
}

type AuthAppPayload =
  | {
      type: "pkce";
      code_challenger: string;
    }
  | {
      type: "hmac";
      app_id: string;
      signature: string;
      timestamp: number;
    }
  | {
      type: "internal";
      signature: string;
      timestamp: number;
    };

export const handleDeviceApi = async (
  base: string,
  devicePayload: any,
  headers: any
) => {
  const user_id = devicePayload.user_id;
  try { 
    const resp = await axios.post(`${base}/devices`, devicePayload, {headers});
    if (!resp.data || !(resp.data as any).device) throw new MainError("Device creation failed", 500, { payload: devicePayload });
    
    return (resp.data as any).device;
  } catch (err: any) {
    const { response } = err;

    if (response?.data?.errorType === "DeviceCreateError" &&
        response.data.message === "Device already exists") 
    {
      logger.warn(`Device already exists for user_id=${user_id}, device_id=${devicePayload.device_id}. Fetching existing device.`);

      const query = `user_id=${user_id}&device_id=${devicePayload.device_id}`;
      const getHeaders = await returnInternalSigniture(
        null,
        'GET',
        `/devices?${query}`
      );

      const existingResp = await axios.get(
        `${base}/devices?${query}`,
        { headers: getHeaders }
      );
      console.log(`Existing resp ${existingResp.data}`);
      
      const existingDevice = (existingResp.data as any).devices?.[0];
      if (!existingDevice) throw new MainError("Existing device not found", 500);

      return existingDevice;
    }

    throw err;
  }
};


export const handleAppApi = async (base: string, app_id: string, headers: any) => {
  try {
    const resp = await axios.get(`${base}/apps/${app_id}`, {headers});
    if (!(resp.data as any)?.app) {
      throw new MainError("App not found", 404, { app_id });
    }
    return (resp.data as any).app;
  } catch (err: any) {
    const apiError = err?.response?.data;

    if (apiError?.errorType) {
      const mapped = new MainError(apiError.message, 400, apiError.details);
      mapped.name = apiError.errorType;
      throw mapped;
    }

    throw err;
  }
};


export const handleSessionApi = async (
  base: string,
  sessionPayload: any,
  headers: any,
) => {
  try {
    const resp = await axios.post(`${base}/sessions`, sessionPayload, {headers});
    return resp.data;
  } catch (err: any) {
    const apiError = err?.response?.data;

    if (apiError?.errorType) {
      const mapped = new MainError(apiError.message, 400, apiError.details);
      mapped.name = apiError.errorType;
      throw mapped;
    }

    throw err;
  }
};


export const returnCodeChallange = async (service: any, response: any, code_challange?: string, ) => {
  if (!service || !(service instanceof AuthService)) {
    service = new AuthService()
  }
  if (code_challange) {
      const secret_key = await service.saveCodeChalleng(code_challange, response);
      return {
        secret_key,
        message: "Waiting for verification"
      };
  }
}

export const returnInternalSigniture = async (service: AuthService | null, method: string, url: string, body?: any) => {
  try {
    if (!service) {
      service = new AuthService();
    }

    let headers;
    const internalSigniture = await service.createInternalSignature({method, url, body})
    headers = {
      'x-internal-signature': internalSigniture.signature,
      'x-internal-timestamp': internalSigniture.timestamp
    }
    return headers;
  } catch(error) {
    throw error
  }
}

export const getAuthPayload = (req: Request): AuthPayload => {
  const body = (req.body && Object.keys(req.body).length > 0) 
              ? req.body as AuthPayload 
              : {} as AuthPayload;
  const headers = req.headers;

  return {
    access_token: body.access_token || headers['x-access-token'] as string,
    refresh_token: body.refresh_token || headers['x-refresh-token'] as string,
    accessTokenTtl: body.accessTokenTtl || Number(headers['x-access-token-ttl']),
    refreshTokenTtl: body.refreshTokenTtl || Number(headers['x-refresh-token-ttl'])
  };
};

export const getAuthAppPayload = (req: Request): AuthAppPayload => {
  const headers = req.headers;

  const appId = headers["x-app-id"] as string | undefined;
  const codeChallenger = headers["x-code-challenger"] as string | undefined;

  const appSignature = headers["x-signature"] as string | undefined;
  const appTimestampRaw = headers["x-timestamp"] as string | undefined;

  const internalSignature = headers["x-internal-signature"] as string | undefined;
  const internalTimestampRaw = headers["x-internal-timestamp"] as string | undefined;

  const usingPKCE = !!codeChallenger;
  const usingAppHmac = !!appSignature || !!appTimestampRaw;
  const usingInternalHmac = !!internalSignature || !!internalTimestampRaw;

  const enabledMethods = [usingPKCE, usingAppHmac, usingInternalHmac].filter(Boolean)
    .length;

  if (enabledMethods === 0) {
    throw new AuthError("No authentication method provided", 400);
  }

  if (enabledMethods > 1) {
    throw new AuthError("Multiple authentication methods provided", 400);
  }

  if (usingInternalHmac && (appId || codeChallenger || appSignature)) {
    throw new AuthError("Invalid internal authentication headers", 400);
  }

  if (usingPKCE) {
    if (!appId) throw new AuthError("Missing x-app-id", 400);

    return {
      type: "pkce",
      code_challenger: codeChallenger!,
    };
  }

  if (usingAppHmac) {
    if (!appId) throw new AuthError("Missing x-app-id", 400);
    if (!appSignature || !appTimestampRaw) {
      throw new AuthError("Missing HMAC headers", 400);
    }

    const timestamp = Number(appTimestampRaw);
    if (Number.isNaN(timestamp)) {
      throw new AuthError("Invalid timestamp", 400);
    }

    return {
      type: "hmac",
      app_id: appId,
      signature: appSignature,
      timestamp,
    };
  }

  if (!internalSignature || !internalTimestampRaw) {
    throw new AuthError("Missing internal HMAC headers", 400);
  }

  const timestamp = Number(internalTimestampRaw);
  if (Number.isNaN(timestamp)) {
    throw new AuthError("Invalid internal timestamp", 400);
  }

  return {
    type: "internal",
    signature: internalSignature,
    timestamp,
  };
};

export async function authenticateRequest(params: {
  access_token?: string;
  refresh_token?: string;
  accessTokenTtl?: number;
  refreshTokenTtl?: number;
  baseUrl: string;
  service: AuthService;
}) {
  if (!params) throw new MainError("Prams is not provided", 401, {params});
  const {
    access_token,
    refresh_token,
    accessTokenTtl,
    refreshTokenTtl,
    service,
  } = params;

  try {
    const identity = await service.authenticate(
      access_token as string,
    );

    return {
      ... identity,
      access_token,
      refresh_token,
      refreshed: false,
    };
  } catch (err) { 
    if (!(err instanceof AccessTokenExpiredError)) {
      throw err;
    }

    if (!refresh_token) {
      throw new AuthError("Refresh token required", 401);
    }

    const refreshBody: any = {
      refresh_token,
    };

    if (accessTokenTtl !== undefined) {
      refreshBody.accessTokenTtl = accessTokenTtl;
    }

    const refreshResult = await service.refreshAccessToken({
      refresh_token,
      accessTtl: accessTokenTtl !== undefined ? Number(accessTokenTtl) : undefined,
      refreshTtl: refreshTokenTtl !== undefined ? Number(refreshTokenTtl) : undefined
    });

    return {
      ...refreshResult,
      refreshed: true,
    };
  }
}