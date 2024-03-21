export enum ContactLifecycleTopicKey {
  StartingACW = "contact/acw",
  Connected = "contact/connected",
  Connecting = "contact/connecting",
  Destroyed = "contact/destroy",
  Error = "contact/error",
  Incoming = "contact/incoming",
  Missed = "contact/missed",
  Pending = "contact/pending",
}

export enum AgentTopicKey {
  StateChanged = "agent/stateChange",
}
