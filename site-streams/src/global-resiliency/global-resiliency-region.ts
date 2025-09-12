export enum GlobalResiliencyRegion {
  Primary = "primary",
  Secondary = "secondary",
}

export interface GlobalResiliencyRegionIframe {
  iframe: HTMLIFrameElement;
  region: GlobalResiliencyRegion;
}
