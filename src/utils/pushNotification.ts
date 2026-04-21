import { Expo } from "expo-server-sdk";
import type { ExpoPushMessage } from "expo-server-sdk";
import userModel from "../models/user.model";

// Create a new Expo SDK client
const expo = new Expo();

interface PushPayload {
  userId: string | string[];
  title: string;
  body: string;
  data?: any;
}

/**
 * Sends push notifications using Expo Push API
 * Supports single userId or array of userIds
 */
export const sendPushNotification = async (payload: PushPayload) => {
  const { userId, title, body, data } = payload;
  const userIds = Array.isArray(userId) ? userId : [userId];

  // Fetch push tokens for users
  const users = await userModel.find({ _id: { $in: userIds }, pushToken: { $ne: "" } });
  const pushTokens = users.map(u => u.pushToken).filter(t => t && Expo.isExpoPushToken(t)) as string[];

  if (pushTokens.length === 0) return;

  const messages: ExpoPushMessage[] = [];
  for (const pushToken of pushTokens) {
    messages.push({
      to: pushToken,
      sound: "default",
      title,
      body,
      data,
    });
  }

  // Batch messages to reduce network requests
  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error("Error sending push notifications chunk:", error);
    }
  }

  // NOTE: In production, you should handle receipts to find inactive tokens
  // and remove them from your database.
};
