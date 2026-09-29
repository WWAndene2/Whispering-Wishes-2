// ═══════════════════════════════════════════════════════════════════════════════
// WHISPERING WISHES — EventsTab (extracted from App.jsx)
// Time-gated content tracking with server-adjusted countdowns
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCcw, Calendar } from 'lucide-react';
import { getLocalizedEvents } from '../../data/banners.js';
import { getServerOffset } from '../../data/constants.js';
import { getServerAdjustedEnd, getServerWeekProgress } from '../../core/time.js';
import { Card, CardHeader, CardBody } from '../../shared/components/Card.jsx';
import { EventCard } from './EventCard.jsx';
import { getActiveBanners } from '../../shared/components/bannerUtils.js';
import { TabBackground } from '../../shared/backgrounds/TabBackground.jsx';
import { TabErrorBoundary } from '../../shared/errors/ErrorBoundaries.jsx';
import { t, formatNumber, getLocale } from '../../utils/i18n.js';
import { getCurrencyIcon } from '../../shared/utils/elementVisuals.js';
import { hideOnError } from '../../shared/utils/imageHelpers.js';
import { getEventRunId, readEventStatus, makeEventStatus } from './eventRuns.js';

// Events are seeded ahead of their start (next version's runs), so one whose currentStart
// hasn't come yet is left out of the tab and its counts until it begins.
const hasEventStarted = (ev, server, now) => {
  if (!ev.currentStart) return true;
  const startMs = new Date(getServerAdjustedEnd(ev.currentStart, server)).getTime();
  return isNaN(startMs) || startMs <= now;
};

// How often the tab re-reads the event list while open, so a run that starts or ends (and an
// event's move to its next scheduled run) shows without a reload. Also re-read on return to
// the app.
const EVENT_REFRESH_MS = 60000;

function EventsTab({
  state,
  dispatch,
  activeBanners,
  setActiveBanners,
  visualSettings,
  toast,
}) {
  const refreshCooldownRef = useRef(0);
  const [refreshCooling, setRefreshCooling] = useState(false);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const id = setInterval(refresh, EVENT_REFRESH_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVisible); };
  }, []);
  const entries = useMemo(() => Object.entries(getLocalizedEvents(getLocale(), now)), [now]);
  const runIds = useMemo(
    () => Object.fromEntries(entries.map(([key, ev]) => [key, getEventRunId(ev, state.server)])),
    [entries, state.server]
  );
  const statusOf = useCallback((key) => readEventStatus(state.eventStatus[key], runIds[key]), [state.eventStatus, runIds]);

  // P4-10 audit fix: prune stale eventStatus keys. Banner rotations remove events from EVENTS
  // but their 'done'/'skipped' status entries would otherwise accumulate in localStorage
  // forever. Also clears a status left from an event's previous run, and stamps a status saved
  // before runs were tracked with the current run so it clears when that run ends.
  useEffect(() => {
    const byKey = Object.fromEntries(entries);
    for (const [key, stored] of Object.entries(state.eventStatus || {})) {
      if (!byKey[key]) { dispatch({ type: 'SET_EVENT_STATUS', eventKey: key, status: null }); continue; }
      const runId = runIds[key];
      if (runId == null) continue;
      if (typeof stored === 'string') dispatch({ type: 'SET_EVENT_STATUS', eventKey: key, status: makeEventStatus(stored, runId) });
      else if (stored && typeof stored === 'object' && 'status' in stored && stored.run !== runId) dispatch({ type: 'SET_EVENT_STATUS', eventKey: key, status: null });
    }
  }, [entries, runIds, state.eventStatus, dispatch]);

  // L1-FIX: Memoize event progress stats (was 60+ array iterations per render)
  const progressStats = useMemo(() => {
    const { weekStartKey } = getServerWeekProgress(state.server);
    // Direct user request: Daily Reset's Done button resets itself every server day but
    // remembers/accumulates the week's completions — its status is { weekStart, days:
    // [dayKey, ...] } instead of the 'done'/'skipped' string every other event uses (see
    // EventCard.jsx's isDailyDoneToday). A list from a past week is stale (a new week always
    // starts unchecked) — checkedDailyDays only counts days that belong to the CURRENT week.
    const dailyStatus = state.eventStatus.dailyReset;
    const checkedDailyDays = (dailyStatus && dailyStatus.weekStart === weekStartKey && Array.isArray(dailyStatus.days))
      ? Math.min(7, dailyStatus.days.length) : 0;

    const startedEntries = entries.filter(([, ev]) => hasEventStarted(ev, state.server, now));
    // Weekly rewards: daily recurring (×7, the max across a full week) + weekly recurring sources
    const totalAstrite = entries.reduce((sum, [, ev]) => {
      const val = parseInt(ev.rewards, 10) || 0;
      if (!val) return sum;
      if (ev.dailyReset) return sum + val * 7;
      if (ev.weeklyReset) return sum + val;
      return sum;
    }, 0);
    const doneKeys = startedEntries.filter(([key]) => key !== 'dailyReset' && statusOf(key) === 'done');
    const skippedKeys = startedEntries.filter(([key]) => key !== 'dailyReset' && statusOf(key) === 'skipped');
    // BUG FIX 2026-09-11: this reduce was missing totalAstrite's own `ev.weeklyReset` guard,
    // so marking ANY event done — including one-off/limited-time events with no dailyReset/
    // weeklyReset flag at all (Tower of Adversity, Whimpering Wastes, Pioneer Podcast, Endstate
    // Matrix, Tactical Hologram, The Strings Remember, If Dreams Still Reverberate, Resonance
    // Sim Realm) — credited that event's full reward into the "Weekly Progress" Astrite bar,
    // even though totalAstrite (the denominator) never counted those events at all. That let
    // earnedAstrite exceed totalAstrite and put non-weekly rewards into a weekly total —
    // reported directly by the user. Only weeklyReset events belong here now; NOT ×7 (unlike
    // totalAstrite's own ×7), since a single 'done'/'skipped' status on a weekly event is only
    // ever worth val once. Daily Reset's own earned amount is handled separately below (val ×
    // however many of this week's days are actually checked).
    const earnedAstrite = doneKeys.reduce((sum, [, ev]) => {
      const val = parseInt(ev.rewards, 10) || 0;
      if (!val || !ev.weeklyReset) return sum;
      return sum + val;
    }, 0) + (parseInt(entries.find(([k]) => k === 'dailyReset')?.[1]?.rewards, 10) || 0) * checkedDailyDays;
    const skippedAstrite = skippedKeys.reduce((sum, [, ev]) => {
      const val = parseInt(ev.rewards, 10) || 0;
      if (!val || !ev.weeklyReset) return sum;
      return sum + val;
    }, 0);
    const dailyFullyChecked = checkedDailyDays >= 7;
    const hasProgress = doneKeys.length > 0 || skippedKeys.length > 0 || checkedDailyDays > 0;
    const doneCount = doneKeys.length + (dailyFullyChecked ? 1 : 0);
    const pendingCount = startedEntries.length - doneCount - skippedKeys.length;
    return { totalAstrite, earnedAstrite, skippedAstrite, hasProgress, doneCount, skippedCount: skippedKeys.length, pendingCount, totalCount: startedEntries.length };
  }, [state.eventStatus, state.server, entries, now, statusOf]);

  // L1-FIX: Memoize active/expired event split
  const { active, expired, eventImageMap } = useMemo(() => {
    const imgMap = {
      tacticalHologram: activeBanners.tacticalHologramImage,
      whimperingWastes: activeBanners.whimperingWastesImage,
      endstateMatrix: activeBanners.endstateMatrixImage,
      pioneerPodcast: activeBanners.pioneerPodcastImage,
      towerOfAdversity: activeBanners.towerOfAdversityImage,
      illusiveRealm: activeBanners.illusiveRealmImage,
      weeklyBoss: activeBanners.weeklyBossImage,
      dailyReset: activeBanners.dailyResetImage,
    };
    const isEventExpired = (ev) => {
      if (ev.dailyReset || ev.weeklyReset) return false;
      const isRecurring = ev.resetType && /^~?\d+\s*(days?|d|h|m)?$/i.test(ev.resetType.trim());
      if (isRecurring) return false;
      if (!ev.currentEnd) return false;
      const end = getServerAdjustedEnd(ev.currentEnd, state.server);
      const endMs = new Date(end).getTime();
      return !isNaN(endMs) && endMs <= now;
    };
    const started = entries.filter(([, ev]) => hasEventStarted(ev, state.server, now));
    return {
      active: started.filter(([, ev]) => !isEventExpired(ev)),
      expired: started.filter(([, ev]) => isEventExpired(ev)),
      eventImageMap: imgMap,
    };
  }, [activeBanners, state.server, entries, now]);

  // L1-FIX: Stable renderCard callback (was recreated every render)
  const renderCard = useCallback(([key, ev], isExpired) => (
    <EventCard
      key={key}
      event={{...ev, key}}
      server={state.server}
      bannerImage={eventImageMap[key] || ev.imageUrl}
      visualSettings={visualSettings}
      status={statusOf(key)}
      isExpired={isExpired}
      onStatusChange={(s) => dispatch({ type: 'SET_EVENT_STATUS', eventKey: key, status: makeEventStatus(s, runIds[key]) })}
    />
  ), [state.server, statusOf, runIds, eventImageMap, visualSettings, dispatch]);

  return (
    <div role="tabpanel" id="tabpanel-events" aria-labelledby="tab-events" tabIndex="0">
    <TabErrorBoundary tabName={t('tabs.events')}>
    <div className="kuro-calc space-y-3 tab-content">
      <TabBackground id="events" />

      <Card>
        <CardHeader action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (Date.now() - refreshCooldownRef.current < 3000) return;
                refreshCooldownRef.current = Date.now();
                setRefreshCooling(true);
                setTimeout(() => setRefreshCooling(false), 3000);
                setActiveBanners(getActiveBanners());
                toast?.addToast?.(t('events.bannerRefreshed'), 'success');
              }}
              disabled={refreshCooling}
              className={`text-sm flex items-center gap-1 transition-colors p-1.5 min-h-[48px] min-w-[48px] justify-center rounded-lg ${refreshCooling ? 'text-gray-600 cursor-not-allowed' : 'text-cyan-400 hover:text-cyan-300 hover:bg-white/5'}`}
            >
              <RefreshCcw size={12} className={refreshCooling ? 'animate-spin' : ''} /> {t('events.refreshTimers')}
            </button>
            <span className="text-gray-400 text-sm">{t('events.server', { server: state.server })}</span>
          </div>
        }>{t('events.title')}</CardHeader>
        <CardBody className="space-y-2">
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-yellow-400 text-base font-medium">{progressStats.hasProgress ? t('events.weeklyProgress') : t('events.weeklyRewards')}</span>
                  <span className="text-yellow-400 font-bold text-xl kuro-number">
                    <img src={getCurrencyIcon('Astrite')} alt="" className="inline w-4 h-4 -mt-0.5 mr-1" onError={hideOnError} />
                    {progressStats.hasProgress ? `${formatNumber(progressStats.earnedAstrite)} / ${formatNumber(progressStats.totalAstrite)}` : formatNumber(progressStats.totalAstrite)} {t('events.astrite')}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden flex">
                    <div className="h-full bg-emerald-400 rounded-l-full transition-[width] duration-300" style={{ width: `${progressStats.totalAstrite > 0 ? (progressStats.earnedAstrite / progressStats.totalAstrite) * 100 : 0}%` }} />
                    {progressStats.skippedAstrite > 0 && (
                      <div
                        className="h-full transition-[width] duration-300"
                        style={{
                          width: `${progressStats.totalAstrite > 0 ? (progressStats.skippedAstrite / progressStats.totalAstrite) * 100 : 0}%`,
                          background: 'repeating-linear-gradient(45deg, rgba(156,163,175,0.4), rgba(156,163,175,0.4) 2px, rgba(156,163,175,0.15) 2px, rgba(156,163,175,0.15) 4px)',
                        }}
                      />
                    )}
                  </div>
                  <span className="text-gray-400 text-sm flex-shrink-0">{progressStats.doneCount}/{progressStats.totalCount} {t('events.done')}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="kuro-stat kuro-stat-emerald flex-1 p-2">
                  <div className="text-emerald-400 text-xl font-bold kuro-number">{progressStats.doneCount}</div>
                  <div className="text-gray-500 kuro-micro-label">{t('events.completed')}</div>
                </div>
                <div className="kuro-stat kuro-stat-gold flex-1 p-2">
                  <div className="text-yellow-400 text-xl font-bold kuro-number">{progressStats.pendingCount}</div>
                  <div className="text-gray-500 kuro-micro-label">{t('events.pending')}</div>
                </div>
                <div className="kuro-stat kuro-stat-gray flex-1 p-2">
                  <div className="text-gray-400 text-xl font-bold kuro-number">{progressStats.skippedCount}</div>
                  <div className="text-gray-500 kuro-micro-label">{t('events.skipped')}</div>
                </div>
              </div>
        </CardBody>
      </Card>

      <div className="space-y-3 event-grid">
        {entries.length === 0 ? (
          <div className="kuro-empty-state text-center py-8">
            <Calendar size={24} className="mx-auto mb-2 opacity-50" />
            {t('events.noEvents')}
            <p className="text-gray-600 text-sm mt-1">{t('events.noEventsHint')}</p>
          </div>
        ) : (
          <>
            {active.map((entry) => renderCard(entry, false))}
            {expired.map((entry) => renderCard(entry, true))}
          </>
        )}
      </div>
      <p className="text-gray-500 text-sm text-center content-layer sticky bottom-0 py-2 kuro-gradient-fade-up">{t('events.resetTimesFooter', { server: state.server, offset: `${getServerOffset(state.server) >= 0 ? '+' : ''}${getServerOffset(state.server)}` })}</p>
    </div>
    </TabErrorBoundary>
    </div>
  );
}

export default React.memo(EventsTab, (prev, next) =>
  prev.state.eventStatus === next.state.eventStatus && prev.state.server === next.state.server &&
  prev.activeBanners === next.activeBanners && prev.visualSettings === next.visualSettings
);
