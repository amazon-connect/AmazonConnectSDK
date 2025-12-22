/**
 * States that a contact can be in.
 */
export enum ContactStateType {}

/**
 * States that a participant can be in.
 */
export enum ParticipantStateType {
  Connecting = "connecting",
  Connected = "connected",
  Hold = "hold",
  Disconnected = "disconnected",
  Rejected = "rejected",
  SilentMonitor = "silent_monitor",
  Barge = "barge",
}

/**
 * Participant state information.
 */
export type ParticipantState =
  | { value: ParticipantStateType }
  | { value: "other"; actual: string };