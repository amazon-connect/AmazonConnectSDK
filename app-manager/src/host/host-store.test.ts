import { ConfigBase } from "@amazon-connect/workspace-types";
import { mock } from "jest-mock-extended";

import { Host } from "./host";
import { HostStore } from "./host-store";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TestHost = Host<any, ConfigBase>;

let sut: HostStore<TestHost>;

beforeEach(() => {
  sut = new HostStore<TestHost>();
});

describe("when app hosts are set", () => {
  const host1 = mock<TestHost>({ instanceId: "ah1" });
  const host2 = mock<TestHost>({ instanceId: "ah2" });
  const host3 = mock<TestHost>({ instanceId: "ah3" });

  beforeEach(() => {
    sut.set(host1);
    sut.set(host2);
    sut.set(host3);
  });

  describe("when getting by appInstanceId", () => {
    test("should return a single instance", () => {
      const result = sut.get("ah1");

      expect(result).toEqual(host1);
    });

    test("should return undefined when an instance is not set", () => {
      const result = sut.get("not-found");

      expect(result).toBeUndefined();
    });
  });

  describe("when getting bulk", () => {
    test("should return all instances requested", () => {
      const result = sut.getBatch(["ah1", "ah2"]);

      expect(result.hosts).toHaveLength(2);
      expect(result.hosts).toContain(host1);
      expect(result.hosts).toContain(host2);
      expect(result.missingValues).toBeUndefined();
    });

    test("should include missing values in result", () => {
      const missingInstanceId1 = "missing-value-1";
      const missingInstanceId2 = "missing-value-2";
      const result = sut.getBatch([
        "ah1",
        missingInstanceId1,
        "ah2",
        missingInstanceId2,
      ]);

      expect(result.hosts).toHaveLength(2);
      expect(result.hosts).toContain(host1);
      expect(result.hosts).toContain(host2);
      expect(result.missingValues).toHaveLength(2);
      expect(result.missingValues).toContain(missingInstanceId1);
      expect(result.missingValues).toContain(missingInstanceId2);
    });
  });

  describe("when getting all", () => {
    test("should return all values", () => {
      const result = sut.getAll();

      expect(result).toHaveLength(3);
      expect(result).toContain(host1);
      expect(result).toContain(host2);
      expect(result).toContain(host3);
    });
  });

  describe("when deleting a value", () => {
    beforeEach(() => {
      sut.delete("ah2");
    });

    test("should not impact getting other value", () => {
      const result = sut.get("ah1");

      expect(result).toEqual(host1);
    });

    test("should not return deleted value", () => {
      const result = sut.get("ah2");

      expect(result).toBeUndefined();
    });

    test("should not return in batch get", () => {
      const result = sut.getBatch(["ah1", "ah2", "ah3"]);

      expect(result.hosts).toHaveLength(2);
      expect(result.hosts).toContain(host1);
      expect(result.hosts).toContain(host3);
      expect(result.missingValues).toHaveLength(1);
      expect(result.missingValues).toContain("ah2");
    });

    test("should not return in get all", () => {
      const result = sut.getAll();

      expect(result).toHaveLength(2);
      expect(result).toContain(host1);
      expect(result).toContain(host3);
    });
  });
});
