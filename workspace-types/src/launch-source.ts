export type LaunchSource = { name: string | undefined } & (
  | {
      type: "external";
      connectionId: string;
    }
  | {
      type: "internal";
    }
);
