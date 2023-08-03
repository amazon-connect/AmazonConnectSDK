export type ProxySubjectStatus =
  | { initialized: false }
  | {
      initialized: true;
      startTime: Date;
    };
