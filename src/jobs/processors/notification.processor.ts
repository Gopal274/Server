import { sendPushNotification } from "../../utils/pushNotification";

export const notificationProcessor = async (job: any) => {
  const { userId, title, body, data } = job.data;
  console.log(`Processing push notification job for users: ${Array.isArray(userId) ? userId.length : 1}`);
  try {
    await sendPushNotification({
        userId,
        title,
        body,
        data
    });
    console.log(`Push notification sent successfully`);
  } catch (error) {
    console.error(`Failed to send push notification`, error);
    throw error;
  }
};
