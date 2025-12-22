export enum AppStateTopicKey {
  StateChanged = "app/stateChanged",
  Provisioned = "app/provisioned",
  Running = "app/running",
  Stopped = "app/stopped",
  Restarting = "app/restarting",
  Destroying = "app/destroying",
  Destroyed = "app/destroyed",
  Error = "app/error",
}

export enum AppTopicKeys {
  Focused = "app/focused",
}
