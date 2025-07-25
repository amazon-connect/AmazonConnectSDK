export enum ContactLifecycleTopicKey {
  StartingACW = "contact/acw",
  Connected = "contact/connected",
  Destroyed = "contact/destroy",
  Missed = "contact/missed",
  Cleared = "contact/cleared",
}

export enum AgentTopicKey {
  StateChanged = "agent/stateChange",
  RoutingProfileChanged = "agent/routingProfileChanged",
  EnabledChannelListChanged = "agent/enabledChannelListChanged",
}
