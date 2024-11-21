/**
 * Represents a file that is attached to a resource.
 */
export type Attached = {
  /**
   * ARN of the resource that the file is attached to.
   * Could be a Connect Contact ARN or a Connect Case ARN.
   */
  associatedResourceArn: string;
};

/**
 * Base type for a file that is attached to a resource.
 */
export type Attachment = Attached & {
  /**
   * Identifier in Connect's File record
   */
  fileId: string;
};

export enum FileStatus {
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  PROCESSING = "PROCESSING",
  PENDING_UPLOAD = "PENDING_UPLOAD",
  UPLOAD_EXPIRED = "UPLOAD_EXPIRED",
  FAILED = "FAILED",
  DELETED = "DELETED",
}

export type AttachmentMetadata = Attachment & {
  fileArn: string;
  fileName: string;
  fileStatus: FileStatus;
  fileSizeInBytes: number;
  creationTime: string;
};

export type AttachmentError = {
  errorCode: string;
  errorMessage: string;
  fileId: string;
};

export type BatchGetAttachedFileMetadataResponse = {
  files: AttachmentMetadata[];
  errors: AttachmentError[];
};

/**
 * A group of files that are associated to the same resource
 */
export type RelatedAttachments = Attached & {
  fileIds: string[];
};

export type NewAttachment = Attached & {
  fileName: string;
  fileSizeInBytes: number;
  fileUseCaseType: "ATTACHMENT";
};

export type UploadableAttachment = Attachment & {
  /**
   * Include the file in a PUT request to this url
   */
  uploadUrl: string;
  /**
   * Send these required headers along with the file to the uploadUrl.
   */
  uploadHeaders: Record<string, string>;
  /**
   * The upload request must be a PUT.
   */
  uploadMethod: "PUT";

  /**
   * The status of the file upload.
   */
  fileStatus: FileStatus;
};

export type DownloadableAttachment = AttachmentMetadata & {
  downloadUrl: string;
};
