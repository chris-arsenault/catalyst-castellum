import { useGamePresentation } from "../application/presentationContext";
import {
  NARRATIVE_ROUTE_EDGES,
  NARRATIVE_SITES,
  NARRATIVE_SITES_BY_ID,
  type NarrativeSiteDefinition,
} from "../presentation/defaultGame";

interface CampaignRouteMapProps {
  readonly currentSite: NarrativeSiteDefinition;
}

type RouteRelation = "secured" | "current" | "next" | "pending";

const routeRelation = (
  site: NarrativeSiteDefinition,
  currentSite: NarrativeSiteDefinition
): RouteRelation => {
  if (site.order < currentSite.order) return "secured";
  if (site.order === currentSite.order) return "current";
  if (site.order === currentSite.order + 1) return "next";
  return "pending";
};

const routeStatus = (
  relation: RouteRelation,
  translator: ReturnType<typeof useGamePresentation>["translator"]
): string => {
  if (relation === "secured") return translator.text("narrative.ui.route.secured");
  if (relation === "current") return translator.text("narrative.ui.route.current");
  if (relation === "next") return translator.text("narrative.ui.route.next");
  return translator.text("narrative.ui.route.pending");
};

const routeY = (site: NarrativeSiteDefinition): number => site.mapPosition.y / 2;

export const CampaignRouteMap = ({ currentSite }: CampaignRouteMapProps) => {
  const { narrativeCopy, translator } = useGamePresentation();
  const title = translator.text("narrative.ui.route.title");

  return (
    <section className="campaign-route-map" aria-label={title}>
      <header>
        <strong>{title}</strong>
        <span>{narrativeCopy.act({ id: currentSite.actId }).name}</span>
      </header>
      <div className="campaign-route-field">
        <svg viewBox="0 0 100 50" role="list">
          {NARRATIVE_ROUTE_EDGES.map((edge) => {
            const from = NARRATIVE_SITES_BY_ID[edge.from];
            const to = NARRATIVE_SITES_BY_ID[edge.to];
            const secured = to.order <= currentSite.order;
            return (
              <line
                key={`${edge.from}.${edge.to}`}
                className={secured ? "secured" : "pending"}
                x1={from.mapPosition.x}
                y1={routeY(from)}
                x2={to.mapPosition.x}
                y2={routeY(to)}
              />
            );
          })}
          {NARRATIVE_SITES.map((site) => {
            const relation = routeRelation(site, currentSite);
            const revealed = relation !== "pending";
            const status = routeStatus(relation, translator);
            const name = revealed
              ? narrativeCopy.site(site).name
              : translator.text("narrative.ui.route.pending");
            return (
              <g
                key={site.id}
                role="listitem"
                className={`route-site ${relation}`}
                transform={`translate(${site.mapPosition.x} ${routeY(site)})`}
                aria-label={`${status}: ${name}`}
              >
                <circle r="2.2" />
                <text className="route-site-order" y="0.75" textAnchor="middle">
                  {site.order}
                </text>
                {revealed && (
                  <text className="route-site-name" y="6" textAnchor="middle">
                    {name}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
};
