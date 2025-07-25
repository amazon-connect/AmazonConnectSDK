import { LifecycleStage } from "@amazon-connect/workspace-types";

import { AppContext } from "../app-context";
import { ServiceContext } from "../service";

type BaseLifecycleStageChangeEvent<TStage extends LifecycleStage> = {
  stage: TStage;
  context: AppContext;
};

export type AppCreateEvent = BaseLifecycleStageChangeEvent<"create">;
export type AppStartEvent = BaseLifecycleStageChangeEvent<"start">;
export type AppStopEvent = BaseLifecycleStageChangeEvent<"stop">;
export type AppDestroyEvent = BaseLifecycleStageChangeEvent<"destroy">;

export type LifecycleStageChangeEvent =
  | AppCreateEvent
  | AppStartEvent
  | AppStopEvent
  | AppDestroyEvent;

export type LifecycleStageChangeHandler<
  T extends LifecycleStageChangeEvent = LifecycleStageChangeEvent,
> = (evt: T) => Promise<void>;

export type AppCreateHandler = LifecycleStageChangeHandler<AppCreateEvent>;
export type AppStartHandler = LifecycleStageChangeHandler<AppStartEvent>;
export type AppStopHandler = LifecycleStageChangeHandler<AppStopEvent>;
export type AppDestroyHandler = LifecycleStageChangeHandler<AppDestroyEvent>;

export type ServiceCreatedEvent = {
  stage: "create";
  context: ServiceContext;
};

export type ServiceCreatedHandler = (evt: ServiceCreatedEvent) => Promise<void>;
