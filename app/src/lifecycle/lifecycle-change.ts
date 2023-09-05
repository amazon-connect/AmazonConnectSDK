import { LifecycleStage } from "@amazon-connect/app-common";

import { AppContext } from "../app-context";

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
  T extends LifecycleStageChangeEvent = LifecycleStageChangeEvent
> = (evt: T) => Promise<void>;

export type AppCreateHandler = LifecycleStageChangeHandler<AppCreateEvent>;
export type AppStartHandler = LifecycleStageChangeHandler<AppStartEvent>;
export type AppStopHandler = LifecycleStageChangeHandler<AppStopEvent>;
export type AppDestroyHandler = LifecycleStageChangeHandler<AppDestroyEvent>;
