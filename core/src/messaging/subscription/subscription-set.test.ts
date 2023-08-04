import { SubscriptionSet } from "./subscription-set";
import { SubscriptionTopic } from "./types";

const topic1: SubscriptionTopic = { namespace: "foo", key: "a" };
const topic2: SubscriptionTopic = { namespace: "bar", key: "b" };

let sut: SubscriptionSet<number>;

beforeEach(() => {
  sut = new SubscriptionSet();
});

test("should add a value", () => {
  const expected = 1;

  sut.add(topic1, expected);

  expect(sut.size(topic1)).toEqual(1);
  expect(sut.isEmpty(topic1)).toBeFalsy();
  expect(sut.get(topic1)).toContain(expected);
});

test("should get an empty array when attempting to get a topic not defined", () => {
  const results = sut.get(topic1);

  expect(results).toHaveLength(0);
});

test("should only have one value when same value is added multiple times", () => {
  const expected1 = 1;
  const expected2 = 2;

  sut.add(topic1, expected1);
  sut.add(topic1, expected2);
  sut.add(topic1, expected1);
  sut.add(topic1, expected2);

  expect(sut.size(topic1)).toEqual(2);
  expect(sut.isEmpty(topic1)).toBeFalsy();
  const results = sut.get(topic1);
  expect(results).toContain(expected1);
  expect(results).toContain(expected2);
});

test("should delete value", () => {
  const valueToDelete = 1;
  const expected = 2;

  sut.add(topic1, valueToDelete);
  sut.add(topic1, expected);
  sut.delete(topic1, valueToDelete);

  expect(sut.size(topic1)).toEqual(1);
  expect(sut.isEmpty(topic1)).toBeFalsy();
  expect(sut.get(topic1)).toContain(expected);
});

test("should be empty when all values in set are deleted", () => {
  const v1 = 1;
  const v2 = 2;
  sut.add(topic1, v1);
  sut.add(topic1, v2);
  sut.delete(topic1, v1);
  sut.delete(topic1, v2);

  expect(sut.isEmpty(topic1)).toBeTruthy();
  expect(sut.size(topic1)).toEqual(0);
});

test("should be empty when no values were ever added to set", () => {
  expect(sut.isEmpty(topic1)).toBeTruthy();
  expect(sut.size(topic1)).toEqual(0);
});

test("should be empty when an item was deleted without first being added", () => {
  sut.delete(topic1, 1);
  sut.add(topic2, 1);

  expect(sut.size(topic1)).toEqual(0);
  expect(sut.isEmpty(topic1)).toBeTruthy();
});

test("should not be impacted when deleting a value with a different topic", () => {
  const expected = 1;

  sut.add(topic1, expected);
  sut.delete(topic2, expected);

  expect(sut.size(topic1)).toEqual(1);
  expect(sut.isEmpty(topic1)).toBeFalsy();
  expect(sut.get(topic1)).toContain(expected);
});

test("should return subscription when a value is in set", () => {
  const valueToDelete = 1;
  const expected = 2;
  sut.add(topic1, valueToDelete);
  sut.add(topic1, expected);
  sut.delete(topic1, valueToDelete);

  const result = sut.getAllSubscriptions();

  expect(result).toHaveLength(1);
  expect(result).toContainEqual(expect.objectContaining(topic1));
});

test("should not return subscription when all values is in set are removed", () => {
  const v1 = 1;
  const v2 = 2;
  sut.add(topic1, v1);
  sut.add(topic1, v2);
  sut.delete(topic1, v1);
  sut.delete(topic1, v2);

  const result = sut.getAllSubscriptions();

  expect(result).toHaveLength(0);
});
