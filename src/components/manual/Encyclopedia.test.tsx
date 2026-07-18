/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Encyclopedia } from "./Encyclopedia";

afterEach(cleanup);

describe("encyclopedia bestiary", () => {
  it("presents the Ratter field record and selects every authored form by stable enemy id", () => {
    const onSelectEnemy = vi.fn();
    render(
      <Encyclopedia
        kind="bestiary"
        selectedEnemyType="deckmouth"
        selectedEquipmentId="gas_agitator"
        selectedReactionId="hydrogen_oxygen_combustion"
        onSelectEnemy={onSelectEnemy}
        onSelectEquipment={vi.fn()}
        onSelectKind={vi.fn()}
        onSelectReaction={vi.fn()}
      />
    );

    expect(screen.getByRole("heading", { name: "Deckmouth" })).toBeTruthy();
    expect(screen.getByText(/one deckmouth means the claim has started answering/i)).toBeTruthy();
    for (const name of [
      "Deckmouth",
      "Flintjack",
      "Shear-jelly",
      "Splitback",
      "Redlung",
      "Clatter",
      "Anchor",
      "Glowbag",
    ]) {
      expect(screen.getByRole("button", { name: new RegExp(name, "i") })).toBeTruthy();
    }

    fireEvent.click(screen.getByRole("button", { name: /Clatter/i }));
    expect(onSelectEnemy).toHaveBeenCalledWith("clatter");
  });
});
