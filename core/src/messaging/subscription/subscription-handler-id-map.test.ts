import { mocked } from "jest-mock";

import { generateUUID } from "../../utility";
import { SubscriptionHandlerIdMap } from "./subscription-handler-id-map";

jest.mock("../../utility/id-generator");

let sut: SubscriptionHandlerIdMap;
const handler1 = jest.fn();
const handlerId1 = "handler_1";
const handler2 = jest.fn();
const handlerId2 = "handler_2";

beforeEach(() => {
  sut = new SubscriptionHandlerIdMap();
});

beforeEach(jest.resetAllMocks);

describe("when map is empty", () => {
  test("should be empty when created", () => {
    expect(sut.size()).toBe(0);
  });

  test("should add the a single handler", () => {
    mocked(generateUUID).mockReturnValueOnce(handlerId1);

    const { handlerId: handlerIdResult } = sut.add(handler1);

    expect(handlerIdResult).toEqual(handlerId1);
    expect(sut.size()).toBe(1);
  });

  test("should add two handlers", () => {
    mocked(generateUUID)
      .mockReturnValueOnce(handlerId1)
      .mockReturnValueOnce(handlerId2);

    const { handlerId: handlerIdResult1 } = sut.add(handler1);
    const { handlerId: handlerIdResult2 } = sut.add(handler2);

    expect(handlerIdResult1).toEqual(handlerId1);
    expect(handlerIdResult2).toEqual(handlerId2);
    expect(sut.size()).toBe(2);
  });

  test("should return null for id when handler does not exist", () => {
    const unknownHandler = jest.fn();

    const result = sut.getIdByHandler(unknownHandler);

    expect(result).toBeNull();
  });

  test("should return null for handler when id does not exist", () => {
    const unknownHandlerId = "unknown_handler";

    const result = sut.getHandlerById(unknownHandlerId);

    expect(result).toBeNull();
  });

  test("should return empty get when called", () => {
    const result = sut.get();

    expect(result).toHaveLength(0);
  });

  test("should attempt to delete unknown handler and return isEmpty", () => {
    const unknownHandler = jest.fn();

    const { isEmpty: isEmptyResult } = sut.delete(unknownHandler);

    expect(isEmptyResult).toBeTruthy();
  });
});

describe("when map has two handlers added", () => {
  beforeEach(() => {
    mocked(generateUUID)
      .mockReturnValueOnce(handlerId1)
      .mockReturnValueOnce(handlerId2);

    sut.add(handler1);
    sut.add(handler2);
  });

  test("should get handler by id", () => {
    const result = sut.getHandlerById(handlerId1);

    expect(result).toEqual(handler1);
  });

  test("should get id by handler", () => {
    const result1 = sut.getIdByHandler(handler1);
    const result2 = sut.getIdByHandler(handler2);

    expect(result1).toEqual(handlerId1);
    expect(result2).toEqual(handlerId2);
  });

  test("should not readd a handler that already exists", () => {
    const { handlerId: handlerIdResult } = sut.add(handler1);

    expect(handlerIdResult).toEqual(handlerId1);
    expect(sut.size()).toBe(2);
    expect(generateUUID).toHaveBeenCalledTimes(2);
  });

  test("should return null for id when handler does not exist", () => {
    const unknownHandler = jest.fn();

    const result = sut.getIdByHandler(unknownHandler);

    expect(result).toBeNull();
  });

  test("should return null for handler when id does not exist", () => {
    const unknownHandlerId = "unknown_handler";

    const result = sut.getHandlerById(unknownHandlerId);

    expect(result).toBeNull();
  });

  test("should get both handlers", () => {
    const result = sut.get();

    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([
        { handler: handler1, handlerId: handlerId1 },
        { handler: handler2, handlerId: handlerId2 },
      ]),
    );
  });

  test("should delete one handler without impacting the other", () => {
    const { isEmpty: isEmptyResult } = sut.delete(handler1);

    expect(isEmptyResult).toBeFalsy();
    expect(sut.size()).toEqual(1);
    expect(sut.getIdByHandler(handler1)).toBeNull();
    expect(sut.getHandlerById(handlerId1)).toBeNull();
    expect(sut.getIdByHandler(handler2)).toEqual(handlerId2);
    expect(sut.getHandlerById(handlerId2)).toEqual(handler2);
  });

  test("should delete both handlers", () => {
    sut.delete(handler1);
    const { isEmpty: isEmptyResult } = sut.delete(handler2);

    expect(isEmptyResult).toBeTruthy();
    expect(sut.size()).toEqual(0);
    expect(sut.getIdByHandler(handler1)).toBeNull();
    expect(sut.getHandlerById(handlerId1)).toBeNull();
    expect(sut.getIdByHandler(handler2)).toBeNull();
    expect(sut.getHandlerById(handlerId2)).toBeNull();
  });
});
