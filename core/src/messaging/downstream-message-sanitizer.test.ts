import { mock } from "jest-mock-extended";

import {
  ChildConnectionCloseMessage,
  ChildConnectionEnabledDownstreamMessage,
  ChildDownstreamMessage,
} from "./child-connection-messages";
import { sanitizeDownstreamMessage } from "./downstream-message-sanitizer";
import {
  AcknowledgeMessage,
  ErrorMessage,
  PublishMessage,
  ResponseMessage,
} from "./messages";

describe("sanitizeDownstreamMessage", () => {
  test("should not modify a AcknowledgeMessage", () => {
    const message = mock<AcknowledgeMessage>({ type: "acknowledge" });

    const result = sanitizeDownstreamMessage(message);

    expect(result).toEqual(message);
  });

  test("should not modify a ErrorMessage", () => {
    const message = mock<ErrorMessage>({ type: "error" });

    const result = sanitizeDownstreamMessage(message);

    expect(result).toEqual(message);
  });

  test("should not modify a ChildConnectionCloseMessage", () => {
    const message = mock<ChildConnectionCloseMessage>({
      type: "childConnectionClose",
    });

    const result = sanitizeDownstreamMessage(message);

    expect(result).toEqual(message);
  });

  test("should sanitize the message of a ChildDownstreamMessage", () => {
    const message: ChildDownstreamMessage = {
      type: "childDownstreamMessage",
      connectionId: "c",
      targetProviderId: "tp",
      message: {
        type: "publish",
        topic: { namespace: "n", key: "k" },
        data: { foo: 1 },
      },
    };

    const result = sanitizeDownstreamMessage(message);

    expect(result).toEqual({
      type: "childDownstreamMessage",
      connectionId: "c",
      targetProviderId: "tp",
      message: {
        type: "publish",
        topic: { namespace: "n", key: "k" },
      },
    });
  });

  test("should remove the data of a publish message", () => {
    const message: PublishMessage = {
      type: "publish",
      topic: { namespace: "n", key: "k" },
      handlerId: "123",
      data: { foo: 1 },
    };

    const result = sanitizeDownstreamMessage(message);

    expect(result).toEqual({
      type: "publish",
      topic: { namespace: "n", key: "k" },
      handlerId: "123",
    });
  });

  test("should remove the data from a successful response message", () => {
    const message: ResponseMessage = {
      type: "response",
      isError: false,
      namespace: "n",
      requestId: "rid1",
      data: { foo: "1" },
    };

    const result = sanitizeDownstreamMessage(message);

    expect(result).toEqual({
      type: "response",
      isError: false,
      namespace: "n",
      requestId: "rid1",
    });
  });

  test("should remove the request data from a error response message", () => {
    const message: ResponseMessage = {
      type: "response",
      isError: true,
      namespace: "n",
      requestId: "rid1",
      errorKey: "ek",
      reason: "reason",
      details: {
        command: "c1",
        requestData: { foo: "1" },
        otherField: { bar: 2 },
      },
    };

    const result = sanitizeDownstreamMessage(message);

    expect(result).toEqual({
      type: "response",
      isError: true,
      namespace: "n",
      requestId: "rid1",
      errorKey: "ek",
      reason: "reason",
      details: {
        command: "c1",
      },
    });
  });

  test("should not modify a unknown message", () => {
    const message = {
      type: "unknown",
    } as unknown as ChildConnectionEnabledDownstreamMessage;

    const result = sanitizeDownstreamMessage(message);

    expect(result).toEqual(message);
  });

  test("should return a detailed message when the process throws an error", () => {
    const messageThatWillError = {
      type: "response",
      isError: true,
    } as ResponseMessage;

    const result = sanitizeDownstreamMessage(messageThatWillError);

    expect(result).toHaveProperty("error");
    expect(result.messageDetails).toContain("error");
    expect(result.message).toEqual(messageThatWillError);
  });
});
