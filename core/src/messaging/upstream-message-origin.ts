export interface UpstreamMessageOrigin {
  _type: string;
  providerId: string;
}

export interface HasUpstreamMessageOrigin {
  messageOrigin: UpstreamMessageOrigin;
}
