import { mocked } from "jest-mock";

import { UpstreamMessageOrigin } from "../messaging";
import { generateUUID } from "../utility";
import { createRequestMessage } from "./request-message-factory";
jest.mock("../utility/id-generator");

describe("createRequestMessage", () => {
  test("should create message with requestId", () => {
    const namespace = "namespace-1";
    const command = "command-1";
    const data = { foo: 1 };
    const messageOrigin: UpstreamMessageOrigin = { _type: "test" };
    const requestId = "abc";
    mocked(generateUUID).mockReturnValueOnce(requestId);

    const result = createRequestMessage(
      namespace,
      command,
      data,
      messageOrigin,
    );

    expect(result.namespace).toEqual(namespace);
    expect(result.command).toEqual(command);
    expect(result.data).toEqual(data);
    expect(result.messageOrigin).toEqual(messageOrigin);
    expect(result.requestId).toEqual(requestId);
  });
});
