export type ComponentState =
  | "pending"
  | "provisioned"
  | "loading"
  | "loaded"
  | "connected"
  | "running"
  | "stopped"
  | "destroying"
  | "destroyed"
  | "restarting"
  | "error";

export type CurrentState = {
  state: ComponentState;
  version: number;
};
