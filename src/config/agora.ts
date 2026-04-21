import pkg from "agora-access-token";
const { RtcTokenBuilder, RtcRole } = pkg;
import "dotenv/config";

const APP_ID = process.env.AGORA_APP_ID || "";
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || "";

export const generateAgoraToken = (channelName: string, role: "publisher" | "subscriber", userId: string) => {
  // If credentials aren't set, return mock for dev
  if (!APP_ID || !APP_CERTIFICATE || APP_CERTIFICATE.includes("YOUR_AGORA")) {
      console.warn(`[AGORA] Credentials missing or invalid. ID: ${APP_ID ? 'OK' : 'MISSING'}. Certificate: ${APP_CERTIFICATE && !APP_CERTIFICATE.includes("YOUR_AGORA") ? 'OK' : 'MISSING'}. Returning mock token.`);
      return "MOCK_AGORA_TOKEN";
  }

  console.log(`[AGORA] Generating ${role} token for channel: ${channelName}`);

  const expirationTimeInSeconds = 3600; // 1 hour
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  const agoraRole = role === "publisher" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

  const token = RtcTokenBuilder.buildTokenWithAccount(
    APP_ID,
    APP_CERTIFICATE,
    channelName,
    userId,
    agoraRole,
    privilegeExpiredTs
  );

  return token;
};
