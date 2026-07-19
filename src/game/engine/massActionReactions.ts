import type { GameDefinition } from "../definitionTypes";
import {
  GAS_ZONES,
  type GasZone,
  type LimitingFactor,
  type MassActionDirectionDefinition,
  type ReactionDefinition,
  type ReactionParticipant,
  type RoomReactionId,
  type RoomState,
  type SpeciesId,
} from "../types";
import { roomContactReactionMultiplier, roomGasReactionMultiplier } from "./equipment";
import { clamp } from "./math";
import { allocateSharedReactants } from "./massActionAllocation";
import { pressureFactor, temperatureFactor } from "./massActionKinetics";
import { roomStaticPressure, STANDARD_PRESSURE } from "./physics";

type MassActionReaction = ReactionDefinition & {
  behavior: Extract<ReactionDefinition["behavior"], { kind: "mass_action" }>;
};

interface RoomSnapshot {
  gas: RoomState["gas"];
  liquid: RoomState["liquid"];
  stationary: RoomState["stationary"];
}

interface Proposal {
  reaction: MassActionReaction;
  zone: GasZone;
  signedExtent: number;
  limitingFactor: LimitingFactor;
  consumption: Map<string, number>;
  scale: number;
}

const snapshotRoom = (room: RoomState): RoomSnapshot => ({
  gas: { lower: { ...room.gas.lower }, upper: { ...room.gas.upper } },
  liquid: { ...room.liquid },
  stationary: { ...room.stationary },
});

const inventoryAmount = (
  snapshot: RoomSnapshot,
  speciesId: SpeciesId,
  zone: GasZone,
  definition: GameDefinition
): number => {
  const phase = definition.species[speciesId].phase;
  if (phase === "gas") return snapshot.gas[zone][speciesId as keyof RoomSnapshot["gas"][GasZone]];
  if (phase === "liquid") return snapshot.liquid[speciesId as keyof RoomSnapshot["liquid"]];
  return snapshot.stationary[speciesId as keyof RoomSnapshot["stationary"]];
};

const inventoryKey = (speciesId: SpeciesId, zone: GasZone, definition: GameDefinition): string => {
  const phase = definition.species[speciesId].phase;
  return phase === "gas" ? `gas:${zone}:${speciesId}` : `${phase}:${speciesId}`;
};

const rateOrderActivity = (
  direction: MassActionDirectionDefinition,
  reaction: MassActionReaction,
  snapshot: RoomSnapshot,
  zone: GasZone,
  definition: GameDefinition
): number =>
  direction.rateOrders.reduce((activity, order) => {
    const amount = inventoryAmount(snapshot, order.species, zone, definition);
    const saturation = amount / Math.max(amount + reaction.behavior.halfSaturation, 1e-9);
    return activity * saturation ** order.order;
  }, 1);

const catalystFactor = (
  reaction: MassActionReaction,
  snapshot: RoomSnapshot,
  zone: GasZone,
  definition: GameDefinition
): number => {
  const catalyst = reaction.behavior.catalyst;
  if (!catalyst) return 1;
  const amount = inventoryAmount(snapshot, catalyst.species, zone, definition);
  return amount / Math.max(amount + catalyst.halfSaturation, 1e-9);
};

const inhibitorFactor = (
  reaction: MassActionReaction,
  snapshot: RoomSnapshot,
  zone: GasZone,
  definition: GameDefinition
): number =>
  (reaction.behavior.inhibitors ?? []).reduce((factor, inhibitor) => {
    const amount = inventoryAmount(snapshot, inhibitor.species, zone, definition);
    return factor * (inhibitor.halfInhibition / (inhibitor.halfInhibition + amount));
  }, 1);

interface DirectionRate {
  activity: number;
  catalyst: number;
  inhibitors: number;
  pressure: number;
  rate: number;
  temperature: number;
}

const directionRate = (
  direction: MassActionDirectionDefinition | undefined,
  reaction: MassActionReaction,
  snapshot: RoomSnapshot,
  room: RoomState,
  zone: GasZone,
  definition: GameDefinition
): DirectionRate => {
  if (!direction)
    return { activity: 0, catalyst: 1, inhibitors: 1, pressure: 1, rate: 0, temperature: 1 };
  const temperature = temperatureFactor(
    direction,
    reaction.behavior.contact === "liquid" ? room.temperature : room.gasTemperature[zone]
  );
  const pressure = pressureFactor(
    direction,
    roomStaticPressure(room, definition) / STANDARD_PRESSURE
  );
  const activity = rateOrderActivity(direction, reaction, snapshot, zone, definition);
  const catalyst = catalystFactor(reaction, snapshot, zone, definition);
  const inhibitors = inhibitorFactor(reaction, snapshot, zone, definition);
  const equipment =
    reaction.behavior.contact === "liquid"
      ? roomContactReactionMultiplier(room, definition)
      : roomGasReactionMultiplier(room, definition);
  return {
    activity,
    catalyst,
    inhibitors,
    pressure,
    rate: Math.min(
      reaction.behavior.maximumRate * equipment,
      reaction.behavior.maximumRate *
        direction.rateConstant *
        activity *
        temperature *
        pressure *
        catalyst *
        inhibitors *
        equipment
    ),
    temperature,
  };
};

const directionParticipants = (
  reaction: MassActionReaction,
  direction: "forward" | "reverse"
): readonly ReactionParticipant[] =>
  direction === "forward" ? reaction.reactants : reaction.products;

const proposalLimit = (
  reaction: MassActionReaction,
  direction: "forward" | "reverse",
  metrics: DirectionRate,
  snapshot: RoomSnapshot,
  zone: GasZone,
  definition: GameDefinition,
  requestedExtent: number
): LimitingFactor => {
  const speciesLimits = directionParticipants(reaction, direction).map((participant) => ({
    extent:
      inventoryAmount(snapshot, participant.species, zone, definition) / participant.coefficient,
    factor: {
      kind: "species" as const,
      speciesId: participant.species,
      zone: definition.species[participant.species].phase === "gas" ? zone : null,
    },
  }));
  const minimumSpecies = speciesLimits.reduce(
    (minimum, candidate) => (candidate.extent < minimum.extent ? candidate : minimum),
    speciesLimits[0]!
  );
  if (minimumSpecies.extent <= requestedExtent + 1e-9) return minimumSpecies.factor;
  const conditions: Array<{ factor: number; code: LimitingFactor }> = [
    {
      factor: metrics.activity,
      code: { kind: "condition", code: "reaction_kinetics", zone },
    },
    {
      factor: metrics.temperature,
      code: { kind: "condition", code: "reaction_temperature", zone },
    },
    {
      factor: metrics.pressure,
      code: { kind: "condition", code: "reaction_pressure", zone },
    },
    {
      factor: metrics.catalyst,
      code: { kind: "condition", code: "catalyst_inventory", zone: null },
    },
    {
      factor: metrics.inhibitors,
      code: { kind: "condition", code: "reaction_inhibition", zone },
    },
  ];
  return conditions.reduce(
    (minimum, candidate) => (candidate.factor < minimum.factor ? candidate : minimum),
    conditions[0]!
  ).code;
};

const makeProposal = (
  reaction: MassActionReaction,
  snapshot: RoomSnapshot,
  room: RoomState,
  zone: GasZone,
  dt: number,
  definition: GameDefinition
): Proposal | null => {
  const forward = directionRate(
    reaction.behavior.forward,
    reaction,
    snapshot,
    room,
    zone,
    definition
  );
  const reverse = directionRate(
    reaction.behavior.reverse,
    reaction,
    snapshot,
    room,
    zone,
    definition
  );
  const netRate = forward.rate - reverse.rate;
  const direction = netRate >= 0 ? "forward" : "reverse";
  const metrics = direction === "forward" ? forward : reverse;
  const participants = directionParticipants(reaction, direction);
  const maximumExtent = Math.min(
    ...participants.map(
      ({ species, coefficient }) =>
        inventoryAmount(snapshot, species, zone, definition) / coefficient
    )
  );
  const requestedExtent = Math.min(Math.abs(netRate) * dt, maximumExtent);
  const limitingFactor = proposalLimit(
    reaction,
    direction,
    metrics,
    snapshot,
    zone,
    definition,
    requestedExtent
  );
  if (requestedExtent <= 1e-12) {
    const telemetry = room.reactions[reaction.id as RoomReactionId];
    if (telemetry.lastRate <= 0) telemetry.limitingFactor = limitingFactor;
    return null;
  }
  return {
    reaction,
    zone,
    signedExtent: direction === "forward" ? requestedExtent : -requestedExtent,
    limitingFactor,
    consumption: new Map(
      participants.map((participant) => [
        inventoryKey(participant.species, zone, definition),
        requestedExtent * participant.coefficient,
      ])
    ),
    scale: 1,
  };
};

const availableByKey = (
  snapshot: RoomSnapshot,
  proposals: readonly Proposal[],
  definition: GameDefinition
): Map<string, number> => {
  const available = new Map<string, number>();
  for (const proposal of proposals) {
    for (const participant of directionParticipants(
      proposal.reaction,
      proposal.signedExtent >= 0 ? "forward" : "reverse"
    )) {
      const key = inventoryKey(participant.species, proposal.zone, definition);
      available.set(key, inventoryAmount(snapshot, participant.species, proposal.zone, definition));
    }
  }
  return available;
};

const changeInventory = (
  room: RoomState,
  speciesId: SpeciesId,
  zone: GasZone,
  delta: number,
  definition: GameDefinition
): void => {
  const phase = definition.species[speciesId].phase;
  if (phase === "gas") room.gas[zone][speciesId as keyof RoomState["gas"][GasZone]] += delta;
  else if (phase === "liquid") room.liquid[speciesId as keyof RoomState["liquid"]] += delta;
  else room.stationary[speciesId as keyof RoomState["stationary"]] += delta;
};

const applyProposal = (
  room: RoomState,
  proposal: Proposal,
  dt: number,
  definition: GameDefinition
): number => {
  const signedExtent = proposal.signedExtent * proposal.scale;
  if (Math.abs(signedExtent) <= 1e-12) return 0;
  for (const participant of proposal.reaction.reactants)
    changeInventory(
      room,
      participant.species,
      proposal.zone,
      -signedExtent * participant.coefficient,
      definition
    );
  for (const participant of proposal.reaction.products)
    changeInventory(
      room,
      participant.species,
      proposal.zone,
      signedExtent * participant.coefficient,
      definition
    );
  const heatDirection = signedExtent;
  room.gasTemperature[proposal.zone] = clamp(
    room.gasTemperature[proposal.zone] +
      heatDirection * proposal.reaction.behavior.gasHeatPerExtent,
    0,
    320
  );
  room.temperature = clamp(
    room.temperature + heatDirection * proposal.reaction.behavior.roomHeatPerExtent,
    0,
    280
  );
  const telemetry = room.reactions[proposal.reaction.id as RoomReactionId];
  const extent = Math.abs(signedExtent);
  telemetry.lastRate += extent / Math.max(dt, 0.0001);
  telemetry.direction = signedExtent >= 0 ? "forward" : "reverse";
  telemetry.limitingFactor = proposal.limitingFactor;
  room.reactionIntensity = Math.max(room.reactionIntensity, extent / Math.max(dt, 0.0001));
  return extent;
};

export const simulateMassActionNetwork = (
  room: RoomState,
  dt: number,
  definition: GameDefinition
): number => {
  const snapshot = snapshotRoom(room);
  const proposals = Object.values(definition.reactions)
    .filter((reaction): reaction is MassActionReaction => reaction.behavior.kind === "mass_action")
    .flatMap((reaction) => {
      const zones = reaction.behavior.contact === "liquid" ? (["lower"] as const) : GAS_ZONES;
      return zones.flatMap((zone) => {
        const proposal = makeProposal(reaction, snapshot, room, zone, dt, definition);
        return proposal ? [proposal] : [];
      });
    });
  allocateSharedReactants(proposals, availableByKey(snapshot, proposals, definition));
  const netByReaction = new Map<RoomReactionId, number>();
  let total = 0;
  for (const proposal of proposals) {
    total += applyProposal(room, proposal, dt, definition);
    const reactionId = proposal.reaction.id as RoomReactionId;
    netByReaction.set(
      reactionId,
      (netByReaction.get(reactionId) ?? 0) + proposal.signedExtent * proposal.scale
    );
  }
  for (const [reactionId, net] of netByReaction)
    room.reactions[reactionId].direction = net >= 0 ? "forward" : "reverse";
  return total;
};
