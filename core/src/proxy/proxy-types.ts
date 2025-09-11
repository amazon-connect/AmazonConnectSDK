import type {
  ComponentChannelDownstreamSender,
  ComponentChannelUpstreamHandlerSetter,
} from "./component-channel-types";

/**
 * Parameters for adding an iframe-based child channel.
 * Used with the addChildIframeChannel method.
 */
export type AddChildChannelPortParams = {
  connectionId: string;
  port: MessagePort;
  providerId: string;
};

/**
 * Parameters for adding a component-based child channel.
 * Used with the addChildComponentChannel method.
 */
export type AddChildChannelDirectParams = {
  connectionId: string;
  providerId: string;
  sendDownstreamMessage: ComponentChannelDownstreamSender;
  setUpstreamMessageHandler: ComponentChannelUpstreamHandlerSetter;
};
