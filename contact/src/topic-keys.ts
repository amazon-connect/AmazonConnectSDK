export enum ContactLifecycleTopicKey {
  StartingACW = "contact/acw",
  Connected = "contact/connected",
  Destroyed = "contact/destroy",
  Missed = "contact/missed",
  Cleared = "contact/cleared",
  Incoming = "contact/incoming",
}

export enum AgentTopicKey {
  StateChanged = "agent/stateChange",
}
