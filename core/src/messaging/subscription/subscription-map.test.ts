import { SubscriptionMap } from "./subscription-map";
import { SubscriptionTopic } from "./types";

const topicFooA: SubscriptionTopic = { namespace: "foo", key: "a" };
const topicFooB: SubscriptionTopic = { namespace: "foo", key: "b" };
const topicBarA: SubscriptionTopic = { namespace: "bar", key: "a" };

const paramTopicFooAA: SubscriptionTopic = {
  namespace: "foo",
  key: "a",
  parameter: "a",
};
const paramTopicFooAB: SubscriptionTopic = {
  namespace: "foo",
  key: "a",
  parameter: "b",
};
const paramTopicFooBA: SubscriptionTopic = {
  namespace: "foo",
  key: "b",
  parameter: "a",
};
const paramTopicBarAA: SubscriptionTopic = {
  namespace: "bar",
  key: "b",
  parameter: "a",
};

let sut: SubscriptionMap<number>;

beforeEach(() => {
  sut = new SubscriptionMap();
});

describe("with a topic not containing a param", () => {
  test("should get an item that is added", () => {
    const expected = 1;
    sut.add(topicFooA, expected);

    const result = sut.get(topicFooA);

    expect(result).toEqual(expected);
  });

  test("should get an item that has been overwritten", () => {
    const expected = 1;
    sut.add(topicFooA, 5);
    sut.add(topicFooA, expected);

    const result = sut.get(topicFooA);

    expect(result).toEqual(expected);
  });

  test("should not get a result when item with same namespace but different key is added", () => {
    sut.add(topicFooA, 1);

    const result = sut.get(topicFooB);

    expect(result).toBeUndefined();
  });

  test("should not get a result when item with different namespace but same key is added", () => {
    sut.add(topicFooA, 1);

    const result = sut.get(topicBarA);

    expect(result).toBeUndefined();
  });

  test("should add a value to map where namespace is already used with different key", () => {
    const expectedKey1 = 100;
    const expectedKey2 = 200;
    sut.add(topicFooA, expectedKey1);

    sut.add(topicFooB, expectedKey2);

    const result1 = sut.get(topicFooA);
    const result2 = sut.get(topicFooB);
    expect(result1).toEqual(expectedKey1);
    expect(result2).toEqual(expectedKey2);
    expect(sut.getAllSubscriptions()).toHaveLength(2);
  });

  test("should delete value without impacting different key in same namespace", () => {
    const expected = 100;
    sut.add(topicFooA, expected);
    sut.add(topicFooB, 200);

    sut.delete(topicFooB);

    expect(sut.get(topicFooA)).toEqual(expected);
    expect(sut.get(topicFooB)).toBeUndefined();
    expect(sut.getAllSubscriptions()).toHaveLength(1);
  });

  test("should delete value without impacting same key with different namespace", () => {
    const expected = 100;
    sut.add(topicFooA, expected);
    sut.add(topicBarA, 200);

    sut.delete(topicBarA);

    expect(sut.get(topicFooA)).toEqual(expected);
    expect(sut.get(topicBarA)).toBeUndefined();
    expect(sut.getAllSubscriptions()).toHaveLength(1);
  });

  test("should not impact existing when deleting undefined value in namespace", () => {
    const expected = 100;
    sut.add(topicFooA, expected);

    sut.delete(topicFooB);

    expect(sut.get(topicFooA)).toEqual(expected);
    expect(sut.get(topicFooB)).toBeUndefined();
    expect(sut.getAllSubscriptions()).toHaveLength(1);
  });

  test("should not impact existing when deleting undefined value in different namespace", () => {
    const expected = 100;
    sut.add(topicFooA, expected);

    sut.delete(topicBarA);

    expect(sut.get(topicFooA)).toEqual(expected);
    expect(sut.get(topicBarA)).toBeUndefined();
    expect(sut.getAllSubscriptions()).toHaveLength(1);
  });
});

describe("with a topic containing a param", () => {
  test("should get an item that is added", () => {
    const expected = 1;
    sut.add(paramTopicFooAA, expected);

    const result = sut.get(paramTopicFooAA);

    expect(result).toEqual(expected);
  });

  test("should overwrite an item when adding a value that already exists", () => {
    const expected = 1;
    sut.add(paramTopicFooAA, 5);

    sut.add(paramTopicFooAA, expected);

    const result = sut.get(paramTopicFooAA);
    expect(result).toEqual(expected);
  });

  test("should add an item with a different parameter without impacting original value", () => {
    const param1Value = 100;
    const param2Value = 200;
    sut.add(paramTopicFooAA, param1Value);

    sut.add(paramTopicFooAB, param2Value);

    expect(sut.get(paramTopicFooAA)).toEqual(param1Value);
    expect(sut.get(paramTopicFooAB)).toEqual(param2Value);
    expect(sut.getAllSubscriptions()).toHaveLength(2);
  });

  test("should add an item with a different key without impacting value with same namespace and param", () => {
    const key1Value = 100;
    const key2Value = 200;
    sut.add(paramTopicFooAA, key1Value);

    sut.add(paramTopicFooBA, key2Value);

    expect(sut.get(paramTopicFooAA)).toEqual(key1Value);
    expect(sut.get(paramTopicFooBA)).toEqual(key2Value);
    expect(sut.getAllSubscriptions()).toHaveLength(2);
  });

  test("should add an item with a different namespace without impacting value with same key and param", () => {
    const namespace1Value = 100;
    const namespace2Value = 200;
    sut.add(paramTopicFooAA, namespace1Value);

    sut.add(paramTopicBarAA, namespace2Value);

    expect(sut.get(paramTopicFooAA)).toEqual(namespace1Value);
    expect(sut.get(paramTopicBarAA)).toEqual(namespace2Value);
    expect(sut.getAllSubscriptions()).toHaveLength(2);
  });

  test("should delete a value", () => {
    sut.add(paramTopicFooAA, 100);

    sut.delete(paramTopicFooAA);

    const result = sut.get(paramTopicFooAA);
    expect(result).toBeUndefined();
    expect(sut.getAllSubscriptions()).toHaveLength(0);
  });

  test("should delete a value without impacting a topic with a different param", () => {
    const param1Value = 100;
    const param2Value = 200;
    sut.add(paramTopicFooAA, param1Value);
    sut.add(paramTopicFooAB, param2Value);

    sut.delete(paramTopicFooAB);

    expect(sut.get(paramTopicFooAA)).toEqual(param1Value);
    expect(sut.get(paramTopicFooAB)).toBeUndefined();
    expect(sut.getAllSubscriptions()).toHaveLength(1);
  });

  test("should take no action when deleting non existing value without impacting a topic with a different param", () => {
    const value = 100;
    sut.add(paramTopicFooAA, value);

    sut.delete(paramTopicFooAB);

    expect(sut.get(paramTopicFooAA)).toEqual(value);
    expect(sut.get(paramTopicFooAB)).toBeUndefined();
    expect(sut.getAllSubscriptions()).toHaveLength(1);
  });

  test("should delete a value without impacting a topic with a different key", () => {
    const key1Value = 100;
    const key2Value = 200;
    sut.add(paramTopicFooAA, key1Value);
    sut.add(paramTopicFooBA, key2Value);

    sut.delete(paramTopicFooBA);

    expect(sut.get(paramTopicFooAA)).toEqual(key1Value);
    expect(sut.get(paramTopicFooBA)).toBeUndefined();
    expect(sut.getAllSubscriptions()).toHaveLength(1);
  });

  test("should take no action when deleting non existing a value without impacting a topic with a different key", () => {
    const value = 100;
    sut.add(paramTopicFooAA, value);

    sut.delete(paramTopicFooBA);

    expect(sut.get(paramTopicFooAA)).toEqual(value);
    expect(sut.get(paramTopicFooBA)).toBeUndefined();
    expect(sut.getAllSubscriptions()).toHaveLength(1);
  });

  test("should delete a value without impacting a topic with a different namespace", () => {
    const namespace1Value = 100;
    const namespace2Value = 200;
    sut.add(paramTopicFooAA, namespace1Value);
    sut.add(paramTopicBarAA, namespace2Value);

    sut.delete(paramTopicBarAA);

    expect(sut.get(paramTopicFooAA)).toEqual(namespace1Value);
    expect(sut.get(paramTopicBarAA)).toBeUndefined();
    expect(sut.getAllSubscriptions()).toHaveLength(1);
  });

  test("should take no action when deleting non existing a value without impacting a topic with a different namespace", () => {
    const value = 100;
    sut.add(paramTopicFooAA, value);

    sut.delete(paramTopicBarAA);

    expect(sut.get(paramTopicFooAA)).toEqual(value);
    expect(sut.get(paramTopicBarAA)).toBeUndefined();
    expect(sut.getAllSubscriptions()).toHaveLength(1);
  });

  test("should not delete topic with param when deleting value without param", () => {
    const value = 100;
    sut.add(paramTopicFooAA, value);

    sut.delete(topicFooA);

    expect(sut.get(paramTopicFooAA)).toEqual(value);
    expect(sut.get(topicFooA)).toBeUndefined();
    expect(sut.getAllSubscriptions()).toHaveLength(1);
  });

  test("should not delete topic without param when deleting value with param", () => {
    const value = 100;
    sut.add(topicFooA, value);

    sut.delete(paramTopicFooAA);

    expect(sut.get(topicFooA)).toEqual(value);
    expect(sut.get(paramTopicFooAA)).toBeUndefined();
    expect(sut.getAllSubscriptions()).toHaveLength(1);
  });

  test("should return undefined when getting same namespace and key but different param", () => {
    sut.add(paramTopicFooAA, 100);

    const result = sut.get(paramTopicFooAB);

    expect(result).toBeUndefined();
  });

  test("should return undefined when getting same namespace and param but different key", () => {
    sut.add(paramTopicFooAA, 100);

    const result = sut.get(paramTopicFooBA);

    expect(result).toBeUndefined();
  });

  test("should return undefined when getting same key and param but different namespace", () => {
    sut.add(paramTopicFooAA, 100);

    const result = sut.get(paramTopicBarAA);

    expect(result).toBeUndefined();
  });

  test("should return undefined when getting param value when non param is stored", () => {
    sut.add(topicFooA, 100);

    const result = sut.get(paramTopicBarAA);

    expect(result).toBeUndefined();
  });

  test("should return undefined when getting non param value when param value is stored", () => {
    sut.add(paramTopicFooAA, 100);

    const result = sut.get(topicFooA);

    expect(result).toBeUndefined();
  });
});

describe("getOrAdd", () => {
  test("should get an existing value and not call add factory", () => {
    const expected = 1;
    const addFactory = jest.fn();
    sut.add(topicFooA, expected);

    const result = sut.getOrAdd(topicFooA, addFactory);

    expect(result).toEqual(expected);
    expect(addFactory).not.toHaveBeenCalled();
  });

  test("should add a value when existing value was never added", () => {
    const expected = 100;
    const addFactory = () => expected;

    const result = sut.getOrAdd(topicFooA, addFactory);

    expect(result).toEqual(expected);
  });

  test("should add a new value when existing value was added and then deleted", () => {
    const expected = 200;
    sut.add(topicFooA, 1);
    sut.delete(topicFooA);

    const addFactory = () => expected;

    const result = sut.getOrAdd(topicFooA, addFactory);

    expect(result).toEqual(expected);
  });
});

describe("addOrUpdate", () => {
  test("should add a value when when topic was not previously added", () => {
    const expected = 1;
    const addFactory = () => expected;
    const updateAction = jest.fn();

    const result = sut.addOrUpdate(topicFooA, addFactory, updateAction);

    expect(result).toEqual(expected);
    expect(updateAction).not.toHaveBeenCalled();
  });

  test("should add a value when when topic was added but then deleted", () => {
    const expected = 1;
    const addFactory = () => expected;
    const updateAction = jest.fn();
    sut.add(topicFooA, -1);
    sut.delete(topicFooA);

    const result = sut.addOrUpdate(topicFooA, addFactory, updateAction);

    expect(result).toEqual(expected);
    expect(updateAction).not.toHaveBeenCalled();
  });

  test("should update an existing value without invoking add factory", () => {
    const originalValue = 40;
    const incrementValue = 60;
    const expected = originalValue + incrementValue;
    const addFactory = jest.fn();
    const updateAction = (v: number) => v + incrementValue;
    sut.add(topicFooA, originalValue);

    const result = sut.addOrUpdate(topicFooA, addFactory, updateAction);

    expect(result).toEqual(expected);
    expect(addFactory).not.toHaveBeenCalled();
  });
});

describe("getAllSubscriptions", () => {
  test("should get all subscriptions", () => {
    sut.add(topicFooA, 1);
    sut.add(topicFooB, 2);
    sut.add(topicBarA, 3);
    sut.add(paramTopicFooAA, 4);
    sut.add(paramTopicFooAB, 5);
    sut.add(paramTopicFooBA, 6);

    const result = sut.getAllSubscriptions();

    expect(result).toHaveLength(6);

    // Cannot do object contains with non param as they overlap with the param topics
    expect(
      result.find(
        (topic) =>
          topic.namespace === topicFooA.namespace &&
          topic.key === topicFooA.key &&
          !topic.parameter,
      ),
    ).toBeDefined();
    expect(
      result.find(
        (topic) =>
          topic.namespace === topicFooB.namespace &&
          topic.key === topicFooB.key &&
          !topic.parameter,
      ),
    ).toBeDefined();
    expect(result).toContainEqual(expect.objectContaining(topicBarA));
    expect(result).toContainEqual(expect.objectContaining(paramTopicFooAA));
    expect(result).toContainEqual(expect.objectContaining(paramTopicFooAB));
    expect(result).toContainEqual(expect.objectContaining(paramTopicFooBA));
  });

  test("should not include param topic after it is removed", () => {
    sut.add(topicBarA, 1);
    sut.add(paramTopicFooAA, 2);
    sut.add(paramTopicFooAB, 3);
    sut.delete(paramTopicFooAA);

    const result = sut.getAllSubscriptions();

    expect(result).toHaveLength(2);
    expect(result).toContainEqual(expect.objectContaining(topicBarA));
    expect(result).not.toContainEqual(expect.objectContaining(paramTopicFooAA));
    expect(result).toContainEqual(expect.objectContaining(paramTopicFooAB));
  });

  test("should not include non param topic after it is removed", () => {
    sut.add(topicFooB, 1);
    sut.add(topicBarA, 2);
    sut.add(paramTopicFooAA, 3);
    sut.delete(topicBarA);

    const result = sut.getAllSubscriptions();

    expect(result).toHaveLength(2);
    expect(result).toContainEqual(expect.objectContaining(topicFooB));
    expect(result).not.toContainEqual(expect.objectContaining(topicBarA));
    expect(result).toContainEqual(expect.objectContaining(paramTopicFooAA));
  });

  test("should only include a topic once even when added twice", () => {
    sut.add(topicFooA, 1);
    sut.add(topicFooA, 2);
    sut.add(topicBarA, 3);

    const result = sut.getAllSubscriptions();

    expect(result).toHaveLength(2);
    expect(result).toContainEqual(expect.objectContaining(topicFooA));
    expect(result).toContainEqual(expect.objectContaining(topicBarA));
  });
});
