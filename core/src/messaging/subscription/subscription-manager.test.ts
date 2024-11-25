/* eslint-disable @typescript-eslint/unbound-method */
import { MockedClass, MockedObject } from "jest-mock";
import { mock } from "jest-mock-extended";

import { SubscriptionHandlerIdMap } from "./subscription-handler-id-map";
import { SubscriptionManager } from "./subscription-manager";
import { SubscriptionMap } from "./subscription-map";
import {
  SubscriptionHandler,
  SubscriptionHandlerIdMapping,
  SubscriptionTopic,
  SubscriptionTopicHandlerIdItem,
} from "./types";

jest.mock("./subscription-handler-id-map");
jest.mock("./subscription-map");

const SubscriptionMapMock = SubscriptionMap as MockedClass<
  typeof SubscriptionMap<SubscriptionHandlerIdMap>
>;

const testTopic: SubscriptionTopic = {
  namespace: "namespace1",
  key: "key1",
};

let sut: SubscriptionManager;
let subscriptionMapMock: MockedObject<
  SubscriptionMap<SubscriptionHandlerIdMap>
>;
let handlerIdMapMock: MockedObject<SubscriptionHandlerIdMap>;

beforeEach(jest.resetAllMocks);

beforeEach(() => {
  sut = new SubscriptionManager();
  subscriptionMapMock = SubscriptionMapMock.mock.instances[0];
  handlerIdMapMock =
    new SubscriptionHandlerIdMap() as MockedObject<SubscriptionHandlerIdMap>;
});

describe("add", () => {
  test("should add new topic", () => {
    const testHandler = jest.fn();
    const expectedHandlerId = "foo";

    subscriptionMapMock.getOrAdd.mockReturnValueOnce(handlerIdMapMock);
    handlerIdMapMock.add.mockReturnValueOnce({ handlerId: expectedHandlerId });

    const { handlerId } = sut.add(testTopic, testHandler);

    expect(handlerId).toEqual(expectedHandlerId);
    expect(subscriptionMapMock.getOrAdd).toHaveBeenCalledWith(
      testTopic,
      expect.anything(),
    );
    expect(handlerIdMapMock.add).toHaveBeenCalledWith(testHandler);
    expect(subscriptionMapMock.getOrAdd.mock.calls[0][1]()).toBeInstanceOf(
      SubscriptionHandlerIdMap,
    );
  });
});

describe("get", () => {
  test("should return mapping when exists", () => {
    subscriptionMapMock.get.mockReturnValueOnce(handlerIdMapMock);
    const expectedResult: SubscriptionHandlerIdMapping[] = [
      { handler: jest.fn(), handlerId: "foo" },
    ];
    handlerIdMapMock.get.mockReturnValueOnce(expectedResult);

    const result = sut.get(testTopic);

    expect(result).toEqual(expectedResult);
    expect(subscriptionMapMock.get).toHaveBeenCalledWith(testTopic);
  });

  test("should return empty when topic is not defined", () => {
    subscriptionMapMock.get.mockReturnValueOnce(undefined);

    const result = sut.get(testTopic);

    expect(result).toHaveLength(0);
    expect(subscriptionMapMock.get).toHaveBeenCalledWith(testTopic);
  });
});

describe("getById", () => {
  const handlerId = "handler_1";

  test("should return value when exists", () => {
    subscriptionMapMock.get.mockReturnValueOnce(handlerIdMapMock);
    const testHandler: SubscriptionHandler = jest.fn();
    handlerIdMapMock.getHandlerById.mockReturnValueOnce(testHandler);

    const result = sut.getById(testTopic, handlerId);

    expect(result).toEqual(testHandler);
    expect(subscriptionMapMock.get).toHaveBeenCalledWith(testTopic);
    expect(handlerIdMapMock.getHandlerById).toHaveBeenCalledWith(handlerId);
  });

  test("should return null when topic is not defined", () => {
    subscriptionMapMock.get.mockReturnValueOnce(undefined);

    const result = sut.getById(testTopic, handlerId);

    expect(result).toBeNull();
    expect(subscriptionMapMock.get).toHaveBeenCalledWith(testTopic);
  });

  test("should return null when handler id map does not contain id", () => {
    subscriptionMapMock.get.mockReturnValueOnce(handlerIdMapMock);
    handlerIdMapMock.getHandlerById.mockReturnValueOnce(null);

    const result = sut.getById(testTopic, handlerId);

    expect(result).toBeNull();
    expect(subscriptionMapMock.get).toHaveBeenCalledWith(testTopic);
    expect(handlerIdMapMock.getHandlerById).toHaveBeenCalledWith(handlerId);
  });
});

describe("delete", () => {
  test("should delete item without deleting non empty topic", () => {
    const handler: SubscriptionHandler = jest.fn();
    subscriptionMapMock.get.mockReturnValueOnce(handlerIdMapMock);
    handlerIdMapMock.delete.mockReturnValueOnce({ isEmpty: false });

    sut.delete(testTopic, handler);

    expect(subscriptionMapMock.get).toHaveBeenCalledWith(testTopic);
    expect(handlerIdMapMock.delete).toHaveBeenCalledWith(handler);
    expect(subscriptionMapMock.delete).not.toHaveBeenCalled();
  });

  test("should delete item and delete empty topic", () => {
    const handler: SubscriptionHandler = jest.fn();
    subscriptionMapMock.get.mockReturnValueOnce(handlerIdMapMock);
    handlerIdMapMock.delete.mockReturnValueOnce({ isEmpty: true });

    sut.delete(testTopic, handler);

    expect(subscriptionMapMock.get).toHaveBeenCalledWith(testTopic);
    expect(handlerIdMapMock.delete).toHaveBeenCalledWith(handler);
    expect(subscriptionMapMock.delete).toHaveBeenCalledWith(testTopic);
  });

  test("should not attempt delete of item or topic when topic is not defined", () => {
    const handler: SubscriptionHandler = jest.fn();
    subscriptionMapMock.get.mockReturnValueOnce(undefined);

    sut.delete(testTopic, handler);

    expect(subscriptionMapMock.get).toHaveBeenCalledWith(testTopic);
    expect(subscriptionMapMock.delete).not.toHaveBeenCalled();
    expect(subscriptionMapMock.delete).not.toHaveBeenCalled();
  });
});

describe("size", () => {
  test("should return the size when topic is defined", () => {
    const expectedSize = 4;
    subscriptionMapMock.get.mockReturnValueOnce(handlerIdMapMock);
    handlerIdMapMock.size.mockReturnValueOnce(expectedSize);

    const result = sut.size(testTopic);

    expect(result).toEqual(expectedSize);
    expect(subscriptionMapMock.get).toHaveBeenCalledWith(testTopic);
  });

  test("should return the zero when topic is not defined", () => {
    subscriptionMapMock.get.mockReturnValueOnce(undefined);

    const result = sut.size(testTopic);

    expect(result).toEqual(0);
    expect(subscriptionMapMock.get).toHaveBeenCalledWith(testTopic);
  });
});

describe("isEmpty", () => {
  test("should return the false when topic has items", () => {
    subscriptionMapMock.get.mockReturnValueOnce(handlerIdMapMock);
    handlerIdMapMock.size.mockReturnValueOnce(4);

    const result = sut.isEmpty(testTopic);

    expect(result).toBeFalsy();
    expect(subscriptionMapMock.get).toHaveBeenCalledWith(testTopic);
  });

  test("should return the true when topic does not have items", () => {
    subscriptionMapMock.get.mockReturnValueOnce(handlerIdMapMock);
    handlerIdMapMock.size.mockReturnValueOnce(0);

    const result = sut.isEmpty(testTopic);

    expect(result).toBeTruthy();
    expect(subscriptionMapMock.get).toHaveBeenCalledWith(testTopic);
  });

  test("should return true when topic is not defined", () => {
    subscriptionMapMock.get.mockReturnValueOnce(undefined);

    const result = sut.isEmpty(testTopic);

    expect(result).toBeTruthy();
    expect(subscriptionMapMock.get).toHaveBeenCalledWith(testTopic);
  });
});

describe("getAllSubscriptions", () => {
  test("should get all subscriptions", () => {
    const subscriptions: SubscriptionTopic[] = [testTopic];
    subscriptionMapMock.getAllSubscriptions.mockReturnValueOnce(subscriptions);

    const result = sut.getAllSubscriptions();

    expect(result).toEqual(subscriptions);
  });
});

describe("getAllSubscriptionHandlerIds", () => {
  test("should return empty array when no topics", () => {
    subscriptionMapMock.getAllSubscriptions.mockReturnValueOnce([]);

    const result = sut.getAllSubscriptionHandlerIds();

    expect(result).toEqual([]);
  });

  test("should return all subscription handler ids", () => {
    const topic1 = mock<SubscriptionTopic>();
    const topic2 = mock<SubscriptionTopic>();
    const topic3 = mock<SubscriptionTopic>();
    const topic1H1 = "t1h1";
    const topic3H1 = "t3h1";
    const topic3H2 = "t3h2";
    const topic3H3 = "t3h3";
    subscriptionMapMock.getAllSubscriptions.mockReturnValueOnce([
      topic1,
      topic2,
      topic3,
    ]);
    subscriptionMapMock.get.mockImplementation((topic) => {
      if (topic === topic1) {
        return mock<SubscriptionHandlerIdMap>({
          get: () => [{ handlerId: topic1H1, handler: jest.fn() }],
        });
      } else if (topic === topic3) {
        return mock<SubscriptionHandlerIdMap>({
          get: () =>
            [topic3H1, topic3H2, topic3H3].map((handlerId) => ({
              handlerId,
              handler: jest.fn(),
            })),
        });
      } else return mock<SubscriptionHandlerIdMap>({ get: () => [] });
    });
    const expectedResult: SubscriptionTopicHandlerIdItem[] = [
      { topic: topic1, handlerId: topic1H1 },
      { topic: topic3, handlerId: topic3H1 },
      { topic: topic3, handlerId: topic3H2 },
      { topic: topic3, handlerId: topic3H3 },
    ];

    const result = sut.getAllSubscriptionHandlerIds();

    expect(result).toEqual(expectedResult);
  });
});
