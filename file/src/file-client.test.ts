/* eslint-disable @typescript-eslint/unbound-method */
import { AmazonConnectProvider, Proxy } from "@amazon-connect/core";
import { mock, MockProxy } from "jest-mock-extended";

import { FileClient } from "./file-client";
import { fileNamespace } from "./file-namespace";
import { FileRoute } from "./routes";
import {
  AttachmentError,
  AttachmentMetadata,
  BatchGetAttachedFileMetadataResponse,
  DownloadableAttachment,
  FileStatus,
  NewAttachment,
  UploadableAttachment,
} from "./types";

jest.mock("@amazon-connect/core/lib/logging/connect-logger");

describe("FileClient works with attached files", () => {
  let mockProxy: MockProxy<Proxy>;
  let fileClient: FileClient;

  beforeEach(() => {
    jest.resetAllMocks();
    mockProxy = mock<Proxy>();
    const mockProvider = mock<AmazonConnectProvider>();
    mockProvider.getProxy.mockReturnValue(mockProxy);

    fileClient = new FileClient({
      provider: mockProvider,
    });
  });

  test("batchGetAttachedFileMetadata", async () => {
    const associatedResourceArn = "asdf-123ewr-sdfgtrgr-sdfasdfa";
    const fileId = "FILE_ID_1638";
    const activeContactId = "contactId123";
    const responseFiles: AttachmentMetadata[] = [
      {
        fileName: "file.txt",
        fileStatus: FileStatus.APPROVED,
        fileSizeInBytes: 123374,
        fileArn: fileId,
        fileId: fileId,
        associatedResourceArn,
        creationTime: "January",
      },
    ];
    const attachmentErrors: AttachmentError[] = [
      {
        errorCode: "someErrorCode",
        errorMessage: "someErrorMessage",
        fileId: "someFileId",
      },
    ];
    const mockResult = mock<BatchGetAttachedFileMetadataResponse>({
      files: responseFiles,
      errors: attachmentErrors,
    });
    mockProxy.request.mockResolvedValue(mockResult);

    const result = await fileClient.batchGetAttachedFileMetadata({
      relatedAttachments: {
        associatedResourceArn,
        fileIds: [fileId],
      },
      activeContactId,
    });

    expect(mockProxy.request).toHaveBeenCalledWith(
      fileNamespace,
      FileRoute.batchGetAttachedFileMetadata,
      {
        relatedAttachments: {
          associatedResourceArn,
          fileIds: [fileId],
        },
        activeContactId,
      },
    );
    expect(result).toStrictEqual(mockResult);
  });

  test("startAttachedFileUpload", async () => {
    const mockResult: UploadableAttachment = {
      associatedResourceArn: "associatedResourceArn",
      fileId: "fileId",
      uploadUrl: "uploadUrl",
      uploadHeaders: {
        "x-important-test-header": "test-value",
      },
      uploadMethod: "PUT",
      fileStatus: FileStatus.PROCESSING,
    };
    mockProxy.request.mockResolvedValue(mockResult);

    const associatedResourceArn = "asdf-123ewr-sdfgtrgr-sdfasdfa";
    const fileName = "FILE_NAME_3674";
    const newAttachment: NewAttachment = {
      associatedResourceArn: associatedResourceArn,
      fileName,
      fileSizeInBytes: 123,
      fileUseCaseType: "ATTACHMENT",
    };

    const result: UploadableAttachment =
      await fileClient.startAttachedFileUpload(newAttachment);

    expect(mockProxy.request).toHaveBeenCalledWith(
      fileNamespace,
      FileRoute.startAttachedFileUpload,
      newAttachment,
    );
    expect(result).toStrictEqual(mockResult);
  });

  test("completeAttachedFileUpload", async () => {
    mockProxy.request.mockResolvedValueOnce(undefined);

    const associatedResourceArn = "asdf-123ewr-sdfgtrgr-sdfasdfa";
    const fileId = "FILE_ID_3784";

    await fileClient.completeAttachedFileUpload({
      associatedResourceArn,
      fileId,
    });

    expect(mockProxy.request).toHaveBeenCalledWith(
      fileNamespace,
      FileRoute.completeAttachedFileUpload,
      { associatedResourceArn, fileId },
    );
  });

  test("getAttachedFileUrl", async () => {
    const downloadUrl = "https://example.com/dkldsjkdslk.doc";
    const associatedResourceArn = "asdf-123ewr-sdfgtrgr-sdfasdfa";
    const fileId = "FILE_ARN_26";
    const activeContactId = "contactId123";

    const mockResult: DownloadableAttachment = {
      fileName: "file.txt",
      fileStatus: FileStatus.APPROVED,
      fileSizeInBytes: 123374,
      fileArn: fileId,
      fileId: fileId,
      associatedResourceArn,
      creationTime: "January",
      downloadUrl,
    };

    mockProxy.request.mockResolvedValue(mockResult);

    const result: DownloadableAttachment = await fileClient.getAttachedFileUrl({
      attachment: {
        associatedResourceArn,
        fileId,
      },
      activeContactId,
    });

    expect(mockProxy.request).toHaveBeenCalledWith(
      fileNamespace,
      FileRoute.getAttachedFileUrl,
      {
        attachment: {
          associatedResourceArn,
          fileId,
        },
        activeContactId,
      },
    );
    expect(result).toStrictEqual(mockResult);
  });

  test("deleteAttachedFile", async () => {
    mockProxy.request.mockResolvedValue(undefined);

    const associatedResourceArn = "asdf-123ewr-sdfgtrgr-sdfasdfa";
    const fileId = "FILE_ARN_463";

    await fileClient.deleteAttachedFile({ associatedResourceArn, fileId });

    expect(mockProxy.request).toHaveBeenCalledWith(
      fileNamespace,
      FileRoute.deleteAttachedFile,
      { associatedResourceArn, fileId },
    );
  });
});
