const agentRoutePrefix = "agent/";

export enum AgentRequests {
  getEndpoints = agentRoutePrefix + "getEndpoints",
  getARN = agentRoutePrefix + "getARN",
  getName = agentRoutePrefix + "getName",
  getState = agentRoutePrefix + "getState",
  getRoutingProfile = agentRoutePrefix + "getRoutingProfile",
  getChannelConcurrency = agentRoutePrefix + "getChannelConcurrency",
  getExtension = agentRoutePrefix + "getExtension",
  getDialableCountries = agentRoutePrefix + "getDialableCountries",
  getAllQueueARNs = agentRoutePrefix + "getAllQueueARNs",
  getPermissions = agentRoutePrefix + "getPermissions",
}
