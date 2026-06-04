export enum ContactLifecycleTopicKey {
  StartingACW = "contact/acw",
  Connected = "contact/connected",
  Destroyed = "contact/destroy",
  Missed = "contact/missed",
  Cleared = "contact/cleared",
  Incoming = "contact/incoming",
  Connecting = "contact/connecting",
  Error = "contact/error",
  Pending = "contact/pending",
}

export enum AgentTopicKey {
  StateChanged = "agent/stateChange",
  RoutingProfileChanged = "agent/routingProfileChanged",
  EnabledChannelListChanged = "agent/enabledChannelListChanged",
  NetworkConnectionStatusChanged = "agent/networkConnectionStatusChanged",
  AvailabilityStateChanged = "agent/availabilityStateChanged",
  NextAvailabilityStateChanged = "agent/nextAvailabilityStateChanged",
}

export enum ContactTopicKey {
  ParticipantAdded = "contact/participantAdded",
  ParticipantDisconnected = "contact/participantDisconnected",
  ParticipantStateChanged = "contact/participantStateChanged",
}
