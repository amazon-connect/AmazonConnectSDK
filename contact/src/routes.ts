export enum AgentRoutes {
  getARN = "agent/getARN",
  getName = "agent/getName",
  getState = "agent/getState",
  getRoutingProfile = "agent/getRoutingProfile",
  getChannelConcurrency = "agent/getChannelConcurrency",
  getExtension = "agent/getExtension",
  getDialableCountries = "agent/getDialableCountries",
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
}
