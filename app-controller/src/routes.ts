export enum AppRoutes {
  getCatalog = "app/getCatalog",
  getConfig = "app/getConfig",
}

export enum AppInstanceRoutes {
  launch = "app-instance/launch",
  destroy = "app-instance/destroyInstance",
}

export enum AppControllerRoutes {
  getCatalog = "app/getCatalog",
  getConfig = "app/getConfig",
  launchApp = "app-launcher/launch",
  getApp = "app-instance/get-app-info",
  getApps = "app-manager/get-apps",
  focusApp = "app-instance/focus",
  closeApp = "app-instance/close",
}
