const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME || 'dlk8tegh5',
  api_key: process.env.CLOUDINARY_API_KEY || '475259751831441',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'b2RpKaKqFyHbXisB5LlCZ3Dh27A',
});

/**
 * Upload a base64 selfie image to Cloudinary
 * @param {string} base64Image - Base64 encoded image string
 * @param {string} sessionId - Unique session ID for the verification
 * @returns {Promise<string>} - Cloudinary image URL
 */
async function uploadSelfieImage(base64Image, sessionId) {
  try {
    if (!base64Image) {
      throw new Error('No image provided');
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: 'mcube_verification_selfies',
      public_id: `selfie_${sessionId}_${Date.now()}`,
      resource_type: 'image',
      transformation: [
        { width: 800, height: 800, crop: 'limit' }, // Limit max size
        { quality: 'auto:good' }, // Optimize quality
        { fetch_format: 'auto' }, // Auto format (WebP, etc.)
      ],
    });

    console.log('Selfie uploaded to Cloudinary:', result.secure_url);
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload selfie image: ${error.message}`);
  }
}

/**
 * Delete a selfie image from Cloudinary
 * @param {string} imageUrl - Cloudinary image URL to delete
 */
async function deleteSelfieImage(imageUrl) {
  try {
    if (!imageUrl) return;

    // Extract public_id from URL
    const parts = imageUrl.split('/');
    const filename = parts[parts.length - 1];
    const publicId = `mcube_verification_selfies/${filename.split('.')[0]}`;

    await cloudinary.uploader.destroy(publicId);
    console.log('Selfie deleted from Cloudinary:', publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
  }
}

module.exports = {
  uploadSelfieImage,
  deleteSelfieImage,
};
