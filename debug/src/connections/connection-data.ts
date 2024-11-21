export interface ConnectionData {
  readonly id: string;
  readonly startTime: number;
  readonly connectionType: string;

  readonly isStreams: boolean;
  readonly children: ConnectionData[];
}
