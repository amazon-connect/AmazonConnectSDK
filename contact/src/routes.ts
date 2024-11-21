export enum AgentRoutes {
  getARN = "agent/getARN",
  getName = "agent/getName",
  getState = "agent/getState",
  getRoutingProfile = "agent/getRoutingProfile",
  getChannelConcurrency = "agent/getChannelConcurrency",
  getDefaultOutboundQueue = "agent/getDefaultOutboundQueue",
  getRoutingProfileQueues = "agent/getRoutingProfileQueues",
  getExtension = "agent/getExtension",
  getDialableCountries = "agent/getDialableCountries",
}

export enum ContactRoutes {
  getAttributes = "contact/getAttributes",
  getInitialContactId = "contact/getInitialContactId",
  getType = "contact/getType",
  getChannelType = "contact/getChannelType",
  getStateDuration = "contact/getStateDuration",
  getQueue = "contact/getQueue",
  getQueueTimestamp = "contact/getQueueTimestamp",
  getDescription = "contact/getDescription",
  getReferences = "contact/getReferences",
}
