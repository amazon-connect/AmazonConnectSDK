import { ConnectClient, ConnectClientConfig } from "@amazon-connect/core";

import { fileNamespace } from "./file-namespace";
import { FileRoute } from "./routes";
import {
  Attachment,
  BatchGetAttachedFileMetadataResponse,
  DownloadableAttachment,
  NewAttachment,
  RelatedAttachments,
  UploadableAttachment,
} from "./types";

export class FileClient extends ConnectClient {
  constructor(config?: ConnectClientConfig) {
    super(fileNamespace, config);
  }

  /**
   * Get metadata for files that are all associated with the same contact.
   * Does not return urls for downloading the file.
   *
   * @param {Object} request the request data
   * @param {RelatedAttachments} request.relatedAttachments the attachments to get the metadata for
   * @param {string} request.activeContactId the contact id the agent is actively handling
   * @returns {Promise<BatchGetAttachedFileMetadataResponse>} a promise that resolves to the metadata for the files
   */
  batchGetAttachedFileMetadata({
    relatedAttachments,
    activeContactId,
  }: {
    relatedAttachments: RelatedAttachments;
    activeContactId: string;
  }): Promise<BatchGetAttachedFileMetadataResponse> {
    return this.context.proxy.request(FileRoute.batchGetAttachedFileMetadata, {
      relatedAttachments,
      activeContactId,
    });
  }

  /**
   * Start uploading a file to Amazon Connect.
   *
   * Don't forget to call completeFileUpload() after uploading the file.
   *
   * @param {NewAttachment} data the attachment to upload
   * @returns {Promise<UploadableAttachment>} a promise that resolves to the file data and a presigned s3 url to upload the file to
   */
  startAttachedFileUpload(data: NewAttachment): Promise<UploadableAttachment> {
    return this.context.proxy.request(FileRoute.startAttachedFileUpload, data);
  }

  /**
   * Tell Amazon Connect that the file has finished uploading. To confirm that file is done sending,
   * use batchGetAttachedFileMetadata to check the file status.
   *
   * @param {Attachment} attachment the attachment to complete the upload for
   * @returns {Promise<void>} a promise that resolves to void when the file upload is complete
   */
  completeAttachedFileUpload(attachment: Attachment): Promise<void> {
    return this.context.proxy.request(
      FileRoute.completeAttachedFileUpload,
      attachment,
    );
  }

  /**
   * Retrieve an S3 url to download the file. Also includes file metadata.
   *
   * @param {Object} request the request data
   * @param {Attachment} request.attachment the attachment to get the url for
   * @param {string} request.activeContactId the contact id the agent is actively handling
   * @returns {Promise<DownloadableAttachment>} a promise that resolves to the file data and a url to download the file from
   */
  getAttachedFileUrl({
    attachment,
    activeContactId,
  }: {
    attachment: Attachment;
    activeContactId: string;
  }): Promise<DownloadableAttachment> {
    return this.context.proxy.request(FileRoute.getAttachedFileUrl, {
      attachment,
      activeContactId,
    });
  }

  /**
   * Permanently delete the attached file.
   *
   * @param {Attachment} data the attachment to delete
   * @returns {Promise<void>} a promise that resolves to void when the file is deleted
   */
  deleteAttachedFile(data: Attachment): Promise<void> {
    return this.context.proxy.request(FileRoute.deleteAttachedFile, data);
  }
}
