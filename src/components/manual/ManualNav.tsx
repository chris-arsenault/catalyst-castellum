import { BookOpenText, Hammer, LibraryBig, Skull } from "lucide-react";
import type { ManualSection } from "../../application/storeTypes";
import { useGamePresentation } from "../../application/presentationContext";

const ITEMS: readonly {
  icon: typeof BookOpenText;
  id: ManualSection;
}[] = [
  { id: "operations", icon: BookOpenText },
  { id: "build", icon: Hammer },
  { id: "encyclopedia", icon: LibraryBig },
  { id: "threats", icon: Skull },
];

export const ManualNav = ({
  active,
  onSelect,
}: {
  active: ManualSection;
  onSelect: (section: ManualSection) => void;
}) => {
  const { translator } = useGamePresentation();
  const labels = {
    operations: "ui.manual.nav.operations",
    build: "ui.manual.nav.build",
    encyclopedia: "ui.manual.nav.encyclopedia",
    threats: "ui.manual.nav.threats",
  } as const;
  return (
    <nav className="manual-primary-nav" aria-label={translator.text("ui.manual.sections")}>
      {ITEMS.map(({ icon: Icon, id }) => (
        <button
          key={id}
          type="button"
          className={active === id ? "active" : ""}
          aria-current={active === id ? "page" : undefined}
          data-testid={`manual-tab-${id}`}
          onClick={() => onSelect(id)}
        >
          <Icon size={16} />
          <span>{translator.text(labels[id])}</span>
        </button>
      ))}
    </nav>
  );
};
