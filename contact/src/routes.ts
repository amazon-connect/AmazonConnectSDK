export enum AgentRoutes {
  getARN = "agent/getARN",
  getName = "agent/getName",
  getState = "agent/getState",
  getRoutingProfile = "agent/getRoutingProfile",
  getChannelConcurrency = "agent/getChannelConcurrency",
  getExtension = "agent/getExtension",
  getDialableCountries = "agent/getDialableCountries",
  setAvailabilityState = "agent/setAvailabilityState",
  setAvailabilityStateByName = "agent/setAvailabilityStateByName",
  setOffline = "agent/setOffline",
  listAvailabilityStates = "agent/listAvailabilityStates",
  listQuickConnects = "agent/listQuickConnects",
}

export enum ContactRoutes {
  getAttributes = "contact/getAttributes",
  getInitialContactId = "contact/getInitialContactId",
  getType = "contact/getType",
  getStateDuration = "contact/getStateDuration",
  getQueue = "contact/getQueue",
  getQueueTimestamp = "contact/getQueueTimestamp",
  getDescription = "contact/getDescription",
  getReferences = "contact/getReferences",
  getChannelType = "contact/getChannelType",
  addParticipant = "contact/addParticipant",
  transfer = "contact/transfer",
}
