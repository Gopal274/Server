import cloudinary from "../config/cloudinary";

/**
 * Transforms a Cloudinary video URL/ID into a signed HLS (m3u8) streaming URL.
 * Provides security via expiration and adaptive bitrate via sp_auto.
 */
export const transformToHls = (url: string): string => {
    if (!url || !url.includes("cloudinary.com")) {
        return url;
    }

    try {
        // Extract public_id from URL
        // Example URL: https://res.cloudinary.com/demo/video/upload/v1/courses/sample.mp4
        const parts = url.split("/");
        const uploadIndex = parts.indexOf("upload");
        if (uploadIndex === -1) return url;

        // Skip 'upload' and version (if present)
        let publicIdWithExt = parts.slice(uploadIndex + 1).join("/");
        if (publicIdWithExt.startsWith("v") && /v\d+/.test(publicIdWithExt.split("/")[0])) {
            publicIdWithExt = parts.slice(uploadIndex + 2).join("/");
        }

        // Remove extension
        const publicId = publicIdWithExt.replace(/\.[^/.]+$/, "");

        // Generate signed URL with 2 hour expiration
        return cloudinary.url(publicId, {
            resource_type: "video",
            streaming_profile: "auto",
            format: "m3u8",
            sign_url: true,
            expires_at: Math.floor(Date.now() / 1000) + 7200, // 2 hours
        });
    } catch (e) {
        console.error("HLS Transformation Error:", e);
        return url;
    }
};
