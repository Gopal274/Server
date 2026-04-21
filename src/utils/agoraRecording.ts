import axios from "axios";
import "dotenv/config";

const APP_ID = process.env.AGORA_APP_ID || "";
const CUSTOMER_ID = process.env.AGORA_CUSTOMER_ID || "";
const CUSTOMER_SECRET = process.env.AGORA_CUSTOMER_SECRET || "";

const getAuthHeader = () => {
    const credentials = Buffer.from(`${CUSTOMER_ID}:${CUSTOMER_SECRET}`).toString("base64");
    return { Authorization: `Basic ${credentials}` };
};

export const acquireResourceId = async (channelName: string, uid: string) => {
    const url = `https://api.agora.io/v1/apps/${APP_ID}/cloud_recording/acquire`;
    const response = await axios.post(url, {
        cname: channelName,
        uid: uid,
        clientRequest: { resourceExpiredHour: 24 }
    }, { headers: getAuthHeader() });
    return response.data.resourceId;
};

export const startRecording = async (resourceId: string, channelName: string, uid: string, token: string) => {
    const url = `https://api.agora.io/v1/apps/${APP_ID}/cloud_recording/resourceid/${resourceId}/mode/mix/start`;
    const response = await axios.post(url, {
        cname: channelName,
        uid: uid,
        clientRequest: {
            token: token,
            recordingConfig: {
                maxIdleTime: 30,
                streamTypes: 2,
                audioProfile: 1,
                channelType: 0,
                videoStreamType: 0,
                transcodingConfig: {
                    width: 1280,
                    height: 720,
                    fps: 15,
                    bitrate: 1000,
                    maxVideoBitrate: 2000,
                    layoutConfig: [{
                        x_axis: 0.0,
                        y_axis: 0.0,
                        width: 1.0,
                        height: 1.0,
                        alpha: 1.0,
                        render_mode: 0
                    }]
                }
            },
            storageConfig: {
                vendor: 1, // 1 for AWS S3
                region: 0,
                bucket: process.env.S3_BUCKET,
                accessKey: process.env.S3_ACCESS_KEY,
                secretKey: process.env.S3_SECRET_KEY,
                fileNamePrefix: ["recordings"]
            }
        }
    }, { headers: getAuthHeader() });
    return response.data.sid;
};

export const stopRecording = async (resourceId: string, sid: string, channelName: string, uid: string) => {
    const url = `https://api.agora.io/v1/apps/${APP_ID}/cloud_recording/resourceid/${resourceId}/sid/${sid}/mode/mix/stop`;
    const response = await axios.post(url, {
        cname: channelName,
        uid: uid,
        clientRequest: {}
    }, { headers: getAuthHeader() });
    return response.data;
};
