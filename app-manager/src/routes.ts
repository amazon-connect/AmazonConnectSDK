export enum AppRoutes {
  getCatalog = "app/getCatalog",
  getConfig = "app/getConfig",
}

export enum WorkspaceRoutes {
  registerConnection = "workspace/registerConnection",
}

export enum AppManagerRoutes {
  clear = "appManager/clear",
}

export enum AppInstanceRoutes {
  getState = "app-instance/getState",
  launchLegacy = "app-instance/launch",
  launch = "app-instance/launchInstance",
  updateState = "app-instance/updateState",
  destroy = "app-instance/destroyInstance",
  destroyAll = "app-instance/destroyAllInstances",
}
