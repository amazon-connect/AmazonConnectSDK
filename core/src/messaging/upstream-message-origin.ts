export interface UpstreamMessageOrigin {
  _type: string;
}

export interface HasUpstreamMessageOrigin {
  messageOrigin: UpstreamMessageOrigin;
}
