import { describe, expect, it } from "vitest";
import { DEFAULT_GAME_DEFINITION } from "../config";
import { WORLD_MAP } from "../content/worldMap";
import { facilityModelForMap } from "./derivedModel";
import { isProcessLine, processLineId } from "./map";
import { lineBuildCost, mintLineConnection, withConnection } from "./mapEdits";
import { validateWorldMap } from "./mapValidation";

const mint = (from: string, to: string) =>
  mintLineConnection(DEFAULT_GAME_DEFINITION, WORLD_MAP, "gas_line", from, to);

describe("in-play map edits", () => {
  it("mints a routed, costed line for an unauthored pair", () => {
    const line = mint("reservoir", "washlock");
    expect(line).not.toBeNull();
    if (!line) return;
    expect(line.id).toBe(processLineId("gas_line", "reservoir", "washlock"));
    expect(line.buildCost).toBe(
      lineBuildCost(DEFAULT_GAME_DEFINITION.lineSpecs.gas_line, line.route.length)
    );
    expect(line.route.length).toBeGreaterThan(1);
  });

  it("refuses to mint a pair the map already carries", () => {
    expect(mint("core", "furnace")).toBeNull();
  });

  it("appends edits behind the authored order and validates the result", () => {
    const line = mint("reservoir", "washlock");
    if (!line) throw new Error("expected a routed line");
    const edited = withConnection(WORLD_MAP, line);
    expect(edited).not.toBe(WORLD_MAP);
    expect(validateWorldMap(edited)).toEqual([]);
    const ids = Object.keys(edited.connections);
    expect(ids.slice(0, -1)).toEqual(Object.keys(WORLD_MAP.connections));
    expect(ids.at(-1)).toBe(line.id);
    const lines = Object.values(edited.connections).filter(isProcessLine);
    expect(lines.at(-1)?.id).toBe(line.id);
  });

  it("derives fresh geometry per edited map without disturbing the source cache", () => {
    const line = mint("reservoir", "washlock");
    if (!line) throw new Error("expected a routed line");
    const edited = withConnection(WORLD_MAP, line);
    expect(facilityModelForMap(edited)).not.toBe(facilityModelForMap(WORLD_MAP));
    expect(facilityModelForMap(WORLD_MAP)).toBe(facilityModelForMap(WORLD_MAP));
  });

  it("rejects duplicate connection ids loudly", () => {
    const line = mint("reservoir", "washlock");
    if (!line) throw new Error("expected a routed line");
    const edited = withConnection(WORLD_MAP, line);
    expect(() => withConnection(edited, line)).toThrow(/already exists/);
  });
});
