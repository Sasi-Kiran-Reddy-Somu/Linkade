// Detects metric changes per domain and pushes notifications.
// Called from MyProjects after projects state is stable.
// First call per domain just saves the baseline — no notifications generated.

import { addNotifications } from "./notifications";

interface MetricSnapshot {
  da: number;
  dr: number;
  tf: number;
  spamScore: number;
  traffic: number;
  snapshotAt: string;
  lastTrafficNotifAt: string | null;
}

function getSnapshot(domain: string): MetricSnapshot | null {
  try { return JSON.parse(localStorage.getItem(`metric-snapshot-${domain}`) ?? "null"); } catch { return null; }
}

function saveSnapshot(domain: string, snap: MetricSnapshot) {
  localStorage.setItem(`metric-snapshot-${domain}`, JSON.stringify(snap));
}

function fmt(n: number): string {
  return n.toLocaleString();
}

interface ProjectMetrics {
  domain: string;
  name: string;
  da: number;
  dr: number;
  tf: number;
  spamScore: number;
  traffic: number;
}

export function checkMetricChanges(projects: ProjectMetrics[]) {
  const now = new Date().toISOString();

  for (const p of projects) {
    const { domain, name, da, dr, tf, spamScore, traffic } = p;
    const existing = getSnapshot(domain);

    if (!existing) {
      // First visit — establish baseline, no notifications yet
      saveSnapshot(domain, { da, dr, tf, spamScore, traffic, snapshotAt: now, lastTrafficNotifAt: null });
      continue;
    }

    const notifs: Parameters<typeof addNotifications>[0] = [];

    // DA: notify for each +1
    const daDiff = Math.floor(da) - Math.floor(existing.da);
    if (daDiff > 0) {
      notifs.push({
        id: `metric-da-${domain}-${Math.floor(existing.da)}-${Math.floor(da)}`,
        type: "metric_up",
        title: `DA increased on ${name}`,
        body: `Domain Authority went up by ${daDiff} point${daDiff !== 1 ? "s" : ""} on ${domain} (${fmt(existing.da)} to ${fmt(da)}).`,
        domain,
        createdAt: now,
      });
    }

    // DR: notify for each +1
    const drDiff = Math.floor(dr) - Math.floor(existing.dr);
    if (drDiff > 0) {
      notifs.push({
        id: `metric-dr-${domain}-${Math.floor(existing.dr)}-${Math.floor(dr)}`,
        type: "metric_up",
        title: `DR increased on ${name}`,
        body: `Domain Rating went up by ${drDiff} point${drDiff !== 1 ? "s" : ""} on ${domain} (${fmt(existing.dr)} to ${fmt(dr)}).`,
        domain,
        createdAt: now,
      });
    }

    // TF: notify for each +1
    const tfDiff = Math.floor(tf) - Math.floor(existing.tf);
    if (tfDiff > 0) {
      notifs.push({
        id: `metric-tf-${domain}-${Math.floor(existing.tf)}-${Math.floor(tf)}`,
        type: "metric_up",
        title: `Trust Flow increased on ${name}`,
        body: `Trust Flow went up by ${tfDiff} point${tfDiff !== 1 ? "s" : ""} on ${domain} (${fmt(existing.tf)} to ${fmt(tf)}).`,
        domain,
        createdAt: now,
      });
    }

    // Spam: notify for each -1 (improvement)
    const spamDiff = Math.floor(existing.spamScore) - Math.floor(spamScore);
    if (spamDiff > 0) {
      notifs.push({
        id: `metric-spam-${domain}-${Math.floor(existing.spamScore)}-${Math.floor(spamScore)}`,
        type: "metric_up",
        title: `Spam score improved on ${name}`,
        body: `Spam score dropped by ${spamDiff} point${spamDiff !== 1 ? "s" : ""} on ${domain} (${fmt(existing.spamScore)} to ${fmt(spamScore)}).`,
        domain,
        createdAt: now,
      });
    }

    // Traffic: notify at most once every 30 days
    const lastTraffic = existing.lastTrafficNotifAt ? new Date(existing.lastTrafficNotifAt).getTime() : 0;
    const daysSinceTrafficNotif = (Date.now() - lastTraffic) / (1000 * 60 * 60 * 24);
    let newLastTrafficNotifAt = existing.lastTrafficNotifAt;

    if (daysSinceTrafficNotif >= 30 && existing.traffic > 0) {
      const trafficDiff = traffic - existing.traffic;
      const pct = Math.abs(Math.round((trafficDiff / existing.traffic) * 100));
      const direction = trafficDiff >= 0 ? "increased" : "decreased";
      notifs.push({
        id: `metric-traffic-${domain}-${now.slice(0, 7)}`,
        type: "traffic_update",
        title: `Monthly traffic update for ${name}`,
        body: `Traffic on ${domain} ${direction} by ${pct}% this month (${fmt(existing.traffic)} to ${fmt(traffic)} visits).`,
        domain,
        createdAt: now,
      });
      newLastTrafficNotifAt = now;
    }

    addNotifications(notifs);

    // Update snapshot
    saveSnapshot(domain, {
      da, dr, tf, spamScore, traffic,
      snapshotAt: now,
      lastTrafficNotifAt: newLastTrafficNotifAt,
    });
  }
}
