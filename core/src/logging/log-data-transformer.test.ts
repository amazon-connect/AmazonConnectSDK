import { LogDataTransformer } from "./log-data-transformer";
import { LogLevel } from "./log-level";
import { ConnectLogData } from "./logger-types";

describe("when a mixin is not set", () => {
  test("should output exact data field passed", () => {
    const data = { foo: "bar" };
    const sut = new LogDataTransformer(undefined);

    const result = sut.getTransformedData(LogLevel.info, data);

    expect(result).toBe(data);
  });

  test("should output undefined when undefined is passee", () => {
    const sut = new LogDataTransformer(undefined);

    const result = sut.getTransformedData(LogLevel.info, undefined);

    expect(result).toBeUndefined();
  });
});

describe("when a mixin is set", () => {
  test("should combine mixin an log entry data", () => {
    const mixinValue = { foo: 1 };
    const entryData = { bar: 2 };
    const sut = new LogDataTransformer(() => mixinValue);

    const result = sut.getTransformedData(LogLevel.info, entryData);

    expect(result).toEqual({
      foo: 1,
      bar: 2,
    });
  });

  test("should apply mixin data when log entry data is null", () => {
    const mixinValue = { foo: 1 };
    const sut = new LogDataTransformer(() => mixinValue);

    const result = sut.getTransformedData(LogLevel.info, undefined);

    expect(result).toEqual({
      foo: 1,
    });
  });

  test("should favor mixing data over log entry data", () => {
    const mixinValue = { foo: 1 };
    const entryData = { bar: 2, foo: 2 };
    const sut = new LogDataTransformer(() => mixinValue);

    const result = sut.getTransformedData(LogLevel.info, entryData);

    expect(result).toEqual({
      foo: 1,
      bar: 2,
    });
  });

  test("should allow dynamic results based upon parameters", () => {
    const mixin = jest
      .fn<ConnectLogData, [ConnectLogData, LogLevel]>()
      .mockImplementation((d, l) => ({
        level: l,
        original: d,
      }));
    const level = LogLevel.warn;
    const entryData = { bar: 2 };
    const sut = new LogDataTransformer(mixin);

    const result = sut.getTransformedData(level, entryData);

    expect(mixin).toHaveBeenCalledWith(entryData, level);
    expect(result).toEqual({
      level,
      original: entryData,
      bar: 2,
    });
  });
});
