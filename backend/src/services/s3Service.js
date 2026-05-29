/**
 * S3 Service
 * 
 * Handles all AWS S3 operations for document storage.
 * Uses AWS SDK v3 for S3 operations.
 */

const { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand, 
  ListObjectsV2Command,
  HeadObjectCommand
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

class S3Service {
  constructor() {
    // Initialize S3 client
    this.client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      } : undefined // Use IAM role if credentials not provided
    });

    // S3 bucket configuration
    this.documentsBucket = process.env.S3_DOCUMENTS_BUCKET || 'los-documents-dev';
    this.backupBucket = process.env.S3_BACKUP_BUCKET || 'los-backups-dev';
    
    // URL expiration time (in seconds)
    this.urlExpirationTime = parseInt(process.env.S3_URL_EXPIRATION || '3600'); // 1 hour default
  }

  /**
   * Upload a file to S3
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} originalFilename - Original filename
   * @param {string} mimeType - MIME type
   * @param {string} applicationId - Application ID for organizing files
   * @param {string} docType - Document type
   * @returns {Promise<Object>} Upload result with S3 key and bucket
   */
  async uploadFile(fileBuffer, originalFilename, mimeType, applicationId, docType) {
    try {
      // Generate unique filename
      const fileExtension = path.extname(originalFilename);
      const uniqueFilename = `${uuidv4()}${fileExtension}`;
      
      // Construct S3 key with organized structure
      const s3Key = `applications/${applicationId}/${docType}/${uniqueFilename}`;

      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: this.documentsBucket,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: mimeType,
        Metadata: {
          'original-filename': originalFilename,
          'application-id': applicationId,
          'doc-type': docType,
          'upload-date': new Date().toISOString()
        },
        ServerSideEncryption: 'AES256' // Enable server-side encryption
      });

      await this.client.send(command);

      console.log(`✅ File uploaded to S3: ${s3Key}`);

      return {
        s3Key,
        s3Bucket: this.documentsBucket,
        filename: uniqueFilename,
        originalFilename,
        fileSize: fileBuffer.length,
        mimeType
      };
    } catch (error) {
      console.error('❌ S3 upload error:', error);
      throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
  }

  /**
   * Generate a signed URL for downloading a file
   * @param {string} s3Key - S3 object key
   * @param {string} s3Bucket - S3 bucket name (optional, uses default if not provided)
   * @param {number} expiresIn - URL expiration time in seconds (optional)
   * @returns {Promise<string>} Signed URL
   */
  async generateSignedUrl(s3Key, s3Bucket = null, expiresIn = null) {
    try {
      const bucket = s3Bucket || this.documentsBucket;
      const expiration = expiresIn || this.urlExpirationTime;

      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: s3Key
      });

      const signedUrl = await getSignedUrl(this.client, command, {
        expiresIn: expiration
      });

      return signedUrl;
    } catch (error) {
      console.error('❌ Error generating signed URL:', error);
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
  }

  /**
   * Generate a signed URL for uploading a file (presigned PUT)
   * @param {string} s3Key - S3 object key
   * @param {string} mimeType - MIME type
   * @param {number} expiresIn - URL expiration time in seconds (optional)
   * @returns {Promise<string>} Signed URL for upload
   */
  async generateUploadUrl(s3Key, mimeType, expiresIn = 300) {
    try {
      const command = new PutObjectCommand({
        Bucket: this.documentsBucket,
        Key: s3Key,
        ContentType: mimeType
      });

      const signedUrl = await getSignedUrl(this.client, command, {
        expiresIn
      });

      return signedUrl;
    } catch (error) {
      console.error('❌ Error generating upload URL:', error);
      throw new Error(`Failed to generate upload URL: ${error.message}`);
    }
  }

  /**
   * Delete a file from S3
   * @param {string} s3Key - S3 object key
   * @param {string} s3Bucket - S3 bucket name (optional)
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async deleteFile(s3Key, s3Bucket = null) {
    try {
      const bucket = s3Bucket || this.documentsBucket;

      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: s3Key
      });

      await this.client.send(command);

      console.log(`✅ File deleted from S3: ${s3Key}`);
      return true;
    } catch (error) {
      console.error('❌ S3 delete error:', error);
      throw new Error(`Failed to delete file from S3: ${error.message}`);
    }
  }

  /**
   * Delete multiple files from S3
   * @param {Array<Object>} files - Array of {s3Key, s3Bucket} objects
   * @returns {Promise<Object>} Result with success and failure counts
   */
  async deleteMultipleFiles(files) {
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (const file of files) {
      try {
        await this.deleteFile(file.s3_key, file.s3_bucket);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          s3Key: file.s3_key,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * List files in a specific path
   * @param {string} prefix - S3 key prefix (path)
   * @param {string} s3Bucket - S3 bucket name (optional)
   * @returns {Promise<Array>} Array of file objects
   */
  async listFiles(prefix, s3Bucket = null) {
    try {
      const bucket = s3Bucket || this.documentsBucket;

      const command = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix
      });

      const response = await this.client.send(command);

      return (response.Contents || []).map(item => ({
        key: item.Key,
        size: item.Size,
        lastModified: item.LastModified,
        etag: item.ETag
      }));
    } catch (error) {
      console.error('❌ S3 list error:', error);
      throw new Error(`Failed to list files from S3: ${error.message}`);
    }
  }

  /**
   * Check if a file exists in S3
   * @param {string} s3Key - S3 object key
   * @param {string} s3Bucket - S3 bucket name (optional)
   * @returns {Promise<boolean>} True if file exists
   */
  async fileExists(s3Key, s3Bucket = null) {
    try {
      const bucket = s3Bucket || this.documentsBucket;

      const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: s3Key
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get file metadata
   * @param {string} s3Key - S3 object key
   * @param {string} s3Bucket - S3 bucket name (optional)
   * @returns {Promise<Object>} File metadata
   */
  async getFileMetadata(s3Key, s3Bucket = null) {
    try {
      const bucket = s3Bucket || this.documentsBucket;

      const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: s3Key
      });

      const response = await this.client.send(command);

      return {
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        lastModified: response.LastModified,
        etag: response.ETag,
        metadata: response.Metadata
      };
    } catch (error) {
      console.error('❌ Error getting file metadata:', error);
      throw new Error(`Failed to get file metadata: ${error.message}`);
    }
  }

  /**
   * Copy a file within S3 or between buckets
   * @param {string} sourceKey - Source S3 key
   * @param {string} destinationKey - Destination S3 key
   * @param {string} sourceBucket - Source bucket (optional)
   * @param {string} destinationBucket - Destination bucket (optional)
   * @returns {Promise<boolean>} True if copied successfully
   */
  async copyFile(sourceKey, destinationKey, sourceBucket = null, destinationBucket = null) {
    try {
      const srcBucket = sourceBucket || this.documentsBucket;
      const destBucket = destinationBucket || this.documentsBucket;

      const { CopyObjectCommand } = require('@aws-sdk/client-s3');
      
      const command = new CopyObjectCommand({
        Bucket: destBucket,
        CopySource: `${srcBucket}/${sourceKey}`,
        Key: destinationKey
      });

      await this.client.send(command);

      console.log(`✅ File copied: ${sourceKey} -> ${destinationKey}`);
      return true;
    } catch (error) {
      console.error('❌ S3 copy error:', error);
      throw new Error(`Failed to copy file in S3: ${error.message}`);
    }
  }

  /**
   * Get storage statistics for an application
   * @param {string} applicationId - Application ID
   * @returns {Promise<Object>} Storage statistics
   */
  async getApplicationStorageStats(applicationId) {
    try {
      const prefix = `applications/${applicationId}/`;
      const files = await this.listFiles(prefix);

      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      const fileCount = files.length;

      return {
        applicationId,
        fileCount,
        totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        files
      };
    } catch (error) {
      console.error('❌ Error getting storage stats:', error);
      throw new Error(`Failed to get storage statistics: ${error.message}`);
    }
  }

  /**
   * Health check for S3 service
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      // Try to list objects in the bucket (with limit 1)
      const command = new ListObjectsV2Command({
        Bucket: this.documentsBucket,
        MaxKeys: 1
      });

      await this.client.send(command);

      return {
        status: 'healthy',
        bucket: this.documentsBucket,
        region: process.env.AWS_REGION || 'us-east-1'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

module.exports = new S3Service();

// Made with Bob
