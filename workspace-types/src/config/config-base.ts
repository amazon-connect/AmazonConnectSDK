export type ConfigBase = {
  arn: string;
  namespace: string;
  id: string;
  name: string;
  description: string;
  accessUrl: string;
  initializationTimeout?: number;
};
