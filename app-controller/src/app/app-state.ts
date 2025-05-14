export type AppState =
  | "pending"
  | "provisioned"
  | "loading"
  | "loaded"
  | "connected"
  | "running"
  | "stopped"
  | "restarting"
  | "destroying"
  | "destroyed"
  | "error";
