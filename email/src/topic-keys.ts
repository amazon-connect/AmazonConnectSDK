export enum EmailContactEvents {
  /**
   * The agent has accepted an inbound email contact.
   *
   * @see ContactLifecycleTopicKey.Connected
   */
  InboundContactConnected = "inbound-contact-connected",

  /**
   * An outbound email contact has been assigned to the agent.
   *
   * @see ContactLifecycleTopicKey.Connected
   */
  OutboundContactConnected = "outbound-contact-connected",
}
