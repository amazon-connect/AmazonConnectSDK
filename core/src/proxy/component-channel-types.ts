import type {
  ChildConnectionEnabledDownstreamMessage,
  ChildConnectionEnabledUpstreamMessage,
} from "../messaging/child-connection-messages";

/**
 * Function type for sending downstream messages in component channel communication.
 * Used to send messages from the proxy to child entities without MessagePort.
 * Only applicable to component channels, not iframe channels.
 */
export type ComponentChannelDownstreamSender = (
  message: ChildConnectionEnabledDownstreamMessage,
) => void;

/**
 * Function type for setting up upstream message handlers in component channel communication.
 * Used to register a handler function that will receive upstream messages from child entities.
 * Only applicable to component channels, not iframe channels.
 */
export type ComponentChannelUpstreamHandlerSetter = (
  handler: (message: ChildConnectionEnabledUpstreamMessage) => void,
) => void;
