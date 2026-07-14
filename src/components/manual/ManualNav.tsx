import { BookOpenText, Hammer, LibraryBig, Skull } from "lucide-react";
import type { ManualSection } from "../../application/storeTypes";

const ITEMS: readonly {
  icon: typeof BookOpenText;
  id: ManualSection;
  label: string;
}[] = [
  { id: "operations", label: "Operations", icon: BookOpenText },
  { id: "build", label: "Build", icon: Hammer },
  { id: "encyclopedia", label: "Encyclopedia", icon: LibraryBig },
  { id: "threats", label: "Threats", icon: Skull },
];

export const ManualNav = ({
  active,
  onSelect,
}: {
  active: ManualSection;
  onSelect: (section: ManualSection) => void;
}) => (
  <nav className="manual-primary-nav" aria-label="Facility manual sections">
    {ITEMS.map(({ icon: Icon, id, label }) => (
      <button
        key={id}
        type="button"
        className={active === id ? "active" : ""}
        aria-current={active === id ? "page" : undefined}
        data-testid={`manual-tab-${id}`}
        onClick={() => onSelect(id)}
      >
        <Icon size={16} />
        <span>{label}</span>
      </button>
    ))}
  </nav>
);
