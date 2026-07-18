import { useGamePresentation } from "../application/presentationContext";

export const ClaimRigGraphic = () => {
  const { translator } = useGamePresentation();
  return (
    <svg
      className="claim-rig-graphic"
      viewBox="0 0 640 300"
      role="img"
      aria-label={translator.text("narrative.ui.transit.label")}
    >
      <defs>
        <linearGradient id="claim-rig-hull" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#285c4e" />
          <stop offset="1" stopColor="#0d241d" />
        </linearGradient>
        <radialGradient id="claim-rig-field">
          <stop offset="0" stopColor="#9be9d0" stopOpacity="0.42" />
          <stop offset="1" stopColor="#9be9d0" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g className="claim-rig-drift">
        <path d="M38 72 H160 M78 112 H202 M24 221 H181 M438 51 H592 M470 246 H625" />
      </g>
      <ellipse className="claim-rig-field" cx="325" cy="156" rx="235" ry="104" />
      <g className="claim-rig-tow">
        <path d="M76 148 H164" />
        <circle cx="64" cy="148" r="9" />
        <path d="M64 129 V167 M45 148 H83" />
      </g>
      <g className="claim-rig-hull">
        <path d="M157 116 L205 82 H430 L496 124 V184 L438 214 H206 L157 177 Z" />
        <path className="claim-rig-keel" d="M188 190 H457 L418 231 H236 Z" />
        <rect x="216" y="99" width="76" height="84" rx="9" />
        <rect x="307" y="74" width="112" height="109" rx="12" />
        <path className="claim-rig-bracket" d="M322 91 V83 H404 V91 M322 164 V174 H404 V164" />
        <circle className="claim-rig-core" cx="363" cy="130" r="27" />
        <path className="claim-rig-pipe" d="M181 151 H333 M391 151 H474" />
        <path
          className="claim-rig-array"
          d="M480 113 L544 87 M489 128 L560 128 M480 144 L544 171"
        />
        <circle className="claim-rig-light" cx="213" cy="199" r="4" />
        <circle className="claim-rig-light" cx="231" cy="199" r="4" />
        <circle className="claim-rig-light" cx="249" cy="199" r="4" />
      </g>
    </svg>
  );
};
