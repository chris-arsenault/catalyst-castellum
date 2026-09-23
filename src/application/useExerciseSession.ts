import { useCallback, useEffect, useRef, useState } from "react";
import type { ExerciseCommand, ExerciseRuntime, ExerciseState } from "../game/exercise";
import type { EncounterInteraction } from "./encounterSurface";
import { accumulateSimulationTicks } from "./simulationClock";
import {
  encodeExerciseSession,
  EXERCISE_SAVE_KEY,
  loadExerciseSession,
  type ExerciseSessionSave,
  type ExerciseStorage,
} from "./exerciseStorage";
import { createCommandCopy } from "../presentation/commandCopy";
import type { Translator } from "../localization/translator";
import { useEncounterPreferences } from "./useEncounterPreferences";

const browserStorage = (): ExerciseStorage | null => {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
};

const initialSession = (runtime: ExerciseRuntime, storage: ExerciseStorage | null) => {
  try {
    const raw = storage?.getItem(EXERCISE_SAVE_KEY);
    if (raw) return loadExerciseSession(raw, runtime);
  } catch {
    /* The exercise can run in memory when storage is unavailable. */
  }
  return { state: runtime.create(), guidance: true, evidence: [] };
};

const observeExercise = (
  session: ExerciseSessionSave,
  selected: EncounterInteraction
): string[] => {
  const evidence = new Set(session.evidence);
  const encounter = session.state.encounter;
  if (selected.kind === "inspect" && selected.towerId) evidence.add("coverage");
  if (Object.values(encounter.catalyst?.chargeByEnemy ?? {}).some((charge) => charge.amount > 0))
    evidence.add("charge");
  if (selected.kind === "configure_field") evidence.add("field");
  if ((encounter.catalyst?.accounting.consumed ?? 0) > 0) evidence.add("discharge");
  return [...evidence];
};

const useExercisePersistence = (runtime: ExerciseRuntime, storage: ExerciseStorage | null) => {
  const [session, setSession] = useState<ExerciseSessionSave | null>(() =>
    initialSession(runtime, storage)
  );
  const live = useRef(session);
  const [saveFailed, setSaveFailed] = useState(storage === null);
  const persist = useCallback(
    (next: ExerciseSessionSave) => {
      live.current = next;
      setSession(next);
      try {
        if (!storage) {
          setSaveFailed(true);
          return;
        }
        storage.setItem(EXERCISE_SAVE_KEY, encodeExerciseSession(next, runtime));
        setSaveFailed(false);
      } catch {
        setSaveFailed(true);
      }
    },
    [runtime, storage]
  );
  const readSession = useCallback(() => live.current, []);
  const currentEncounter = () => {
    if (!live.current) throw new Error("Exercise has no active state");
    return live.current.state.encounter;
  };
  return { session, live, readSession, currentEncounter, persist, saveFailed };
};

const useExerciseClock = (
  runtime: ExerciseRuntime,
  state: ExerciseState | undefined,
  live: React.RefObject<ExerciseSessionSave | null>,
  applyState: (state: ExerciseState) => void
) => {
  const remainder = useRef(0);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState<1 | 2>(1);
  const tick = useCallback(
    (seconds: number) => {
      if (!Number.isFinite(seconds) || seconds <= 0) return;
      const current = live.current;
      if (!current || paused || current.state.encounter.phase !== "assault") return;
      const clock = accumulateSimulationTicks(remainder.current, seconds, speed);
      const next = clock.ticks ? runtime.advanceTicks(current.state, clock.ticks) : current.state;
      remainder.current = next.encounter.phase === "assault" ? clock.remainder : 0;
      if (next !== current.state) applyState(next);
    },
    [paused, speed, runtime, live, applyState]
  );
  const phase = state?.encounter.phase;
  useEffect(() => {
    if (phase !== "assault" || paused) return;
    let previous = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      tick((now - previous) / 1000);
      previous = now;
    }, 50);
    return () => window.clearInterval(timer);
  }, [phase, paused, tick]);
  return {
    paused,
    setPaused,
    speed,
    setSpeed,
    tick,
    resetClock: () => {
      remainder.current = 0;
      setPaused(false);
    },
  };
};

export const useExerciseSession = (
  runtime: ExerciseRuntime,
  translator: Translator,
  storage = browserStorage()
) => {
  const { session, live, readSession, currentEncounter, persist, saveFailed } =
    useExercisePersistence(runtime, storage);
  const preferences = useEncounterPreferences();
  const [notice, setNotice] = useState<string | null>(null);
  const [interaction, changeInteraction] = useState<EncounterInteraction>({
    kind: "inspect",
    towerId: null,
  });
  const [selectedRoomId, selectRoom] = useState("switchyard");
  const setInteraction = (next: EncounterInteraction) => {
    changeInteraction(next);
    if (live.current) persist({ ...live.current, evidence: observeExercise(live.current, next) });
  };
  const applyState = useCallback(
    (state: ExerciseState) => {
      const previous = readSession();
      if (!previous) return;
      const next = { ...previous, state };
      next.evidence = observeExercise(next, interaction);
      persist(next);
    },
    [interaction, persist, readSession]
  );
  const clock = useExerciseClock(runtime, session?.state, live, applyState);
  const dispatch = (command: ExerciseCommand): boolean => {
    const current = live.current;
    if (!current) return false;
    const result = runtime.execute(current.state, command);
    if (!result.decision.allowed) {
      setNotice(createCommandCopy(translator)(result.decision));
      return false;
    }
    setNotice(null);
    if (command.type === "restart_exercise")
      persist({ state: result.state, guidance: current.guidance, evidence: [] });
    else applyState(result.state);
    if (
      result.state.waveIndex !== current.state.waveIndex ||
      command.type === "retry_wave" ||
      command.type === "restart_exercise"
    ) {
      changeInteraction({ kind: "inspect", towerId: null });
      clock.resetClock();
    }
    return true;
  };
  return {
    ...preferences,
    session,
    ...clock,
    interaction,
    setInteraction,
    selectedRoomId,
    selectRoom,
    notice,
    saveFailed,
    dispatch,
    currentEncounter,
    startFresh: () => {
      persist({ state: runtime.create(), guidance: true, evidence: [] });
      setInteraction({ kind: "inspect", towerId: null });
      clock.resetClock();
    },
    setGuidance: (guidance: boolean) => {
      if (live.current) persist({ ...live.current, guidance });
    },
  };
};

export type ExerciseSessionController = ReturnType<typeof useExerciseSession>;
