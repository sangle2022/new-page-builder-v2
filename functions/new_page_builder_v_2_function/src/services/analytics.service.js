'use strict';

// Dashboard and reports: page/lead KPIs, lead trend, channel performance,
// top pages and operational alerts.

const db = require('../utils/db');
const pages = require('./page.service');
const leads = require('./lead.service');
const workflow = require('./workflow.service');

const day = (t) => String(t || '').slice(0, 10);
const month = (t) => String(t || '').slice(0, 7);

function lastDays(n) {
  const out = [];
  for (let i = n - 1; i >= 0; i -= 1) out.push(db.catalystDate(new Date(Date.now() - i * 864e5)).slice(0, 10));
  return out;
}

function lastMonths(n) {
  const out = [];
  const d = new Date();
  d.setDate(1);
  for (let i = n - 1; i >= 0; i -= 1) {
    const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push(`${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`);
  }
  return out;
}

function alertsFor(pageList, leadList) {
  const alerts = [];
  const today = db.catalystDate().slice(0, 10);
  const in7 = db.catalystDate(new Date(Date.now() + 7 * 864e5)).slice(0, 10);
  pageList.forEach((p) => {
    const s = p.settings || {};
    if (p.isLive && s.activeTill) {
      const till = String(s.activeTill).slice(0, 10);
      if (till < today) alerts.push({ level: 'error', pageId: p.id, text: `"${p.name}" passed its end date (${till}) and no longer accepts leads.` });
      else if (till <= in7) alerts.push({ level: 'warning', pageId: p.id, text: `"${p.name}" stops accepting leads on ${till}.` });
    }
    if (p.isLive && Number(s.responseLimit) > 0) {
      const used = p.leads / Number(s.responseLimit);
      if (used >= 1) alerts.push({ level: 'error', pageId: p.id, text: `"${p.name}" reached its response limit (${s.responseLimit}).` });
      else if (used >= 0.9) alerts.push({ level: 'warning', pageId: p.id, text: `"${p.name}" has used ${Math.round(used * 100)}% of its response limit.` });
    }
    if (p.status === pages.STATUS.PENDING && p.submittedTime) {
      const waitingDays = (Date.now() - new Date(String(p.submittedTime).replace(' ', 'T')).getTime()) / 864e5;
      if (waitingDays >= 2) alerts.push({ level: 'info', pageId: p.id, text: `"${p.name}" has been waiting for approval for ${Math.floor(waitingDays)} days.` });
    }
    if (p.isLive && p.views >= 200 && p.leads === 0) {
      alerts.push({ level: 'warning', pageId: p.id, text: `"${p.name}" has ${p.views} views but no leads. Check the form.` });
    }
  });
  const crmFailed = leadList.filter((l) => l.crmSync === 'Failed').length;
  if (crmFailed) alerts.push({ level: 'error', text: `${crmFailed} lead(s) failed to sync to Zoho CRM. Open Leads and retry.` });
  return alerts;
}

async function dashboard(capp) {
  const [pageList, leadList, activity] = await Promise.all([
    pages.list(capp, {}),
    leads.listAll(capp, {}),
    workflow.recentActivity(capp, 12).catch(() => []),
  ]);
  const complete = leadList.filter((l) => !l.isPartial);
  const today = db.catalystDate().slice(0, 10);
  const thisMonth = today.slice(0, 7);
  const views = pageList.reduce((n, p) => n + p.views, 0);

  const days = lastDays(30);
  const perDay = Object.fromEntries(days.map((d) => [d, 0]));
  complete.forEach((l) => {
    const d = day(l.createdTime);
    if (perDay[d] !== undefined) perDay[d] += 1;
  });

  const byPage = {};
  complete.forEach((l) => {
    byPage[l.pageId] = (byPage[l.pageId] || 0) + 1;
  });

  return {
    kpis: {
      pages: pageList.length,
      livePages: pageList.filter((p) => p.isLive).length,
      drafts: pageList.filter((p) => p.status === pages.STATUS.DRAFT).length,
      pendingApproval: pageList.filter((p) => p.status === pages.STATUS.PENDING).length,
      leads: complete.length,
      leadsToday: complete.filter((l) => day(l.createdTime) === today).length,
      leadsThisMonth: complete.filter((l) => month(l.createdTime) === thisMonth).length,
      partialLeads: leadList.length - complete.length,
      views,
      conversion: views ? Math.round((complete.length / views) * 1000) / 10 : 0,
    },
    trend: days.map((d) => ({ date: d, leads: perDay[d] })),
    channels: await leads.channelStats(capp, {}),
    topPages: pageList
      .map((p) => ({ id: p.id, name: p.name, slug: p.slug, isLive: p.isLive, views: p.views, leads: byPage[p.id] || p.leads, conversion: p.conversion }))
      .sort((a, b) => b.leads - a.leads || b.views - a.views)
      .slice(0, 8),
    statusBreakdown: Object.values(pages.STATUS).map((s) => ({ status: s, count: pageList.filter((p) => p.status === s).length })),
    recentLeads: complete.slice(0, 6).map((l) => ({ id: l.id, name: l.name, pageName: l.pageName, channel: l.channel, createdTime: l.createdTime })),
    activity,
    alerts: alertsFor(pageList, leadList),
  };
}

async function reports(capp, { pageId, months = 12 } = {}) {
  const [pageList, leadList] = await Promise.all([pages.list(capp, {}), leads.listAll(capp, { pageId, partial: 'false' })]);
  const ms = lastMonths(Math.min(24, Math.max(1, Number(months) || 12)));
  const monthly = ms.map((m) => ({ month: m, leads: leadList.filter((l) => month(l.createdTime) === m).length }));

  const campaigns = {};
  leadList.forEach((l) => {
    const c = l.utm.campaign || '(none)';
    campaigns[c] = (campaigns[c] || 0) + 1;
  });
  const devices = {};
  leadList.forEach((l) => {
    const d = l.device || 'Unknown';
    devices[d] = (devices[d] || 0) + 1;
  });
  const statuses = leads.LEAD_STATUSES.map((s) => ({ status: s, count: leadList.filter((l) => l.status === s).length }));

  const scoped = pageId ? pageList.filter((p) => p.id === String(pageId)) : pageList;
  return {
    monthly,
    channels: await leads.channelStats(capp, { pageId }),
    campaigns: Object.entries(campaigns)
      .map(([campaign, count]) => ({ campaign, leads: count }))
      .sort((a, b) => b.leads - a.leads)
      .slice(0, 20),
    devices: Object.entries(devices).map(([device, count]) => ({ device, leads: count })),
    funnel: statuses,
    pages: scoped
      .map((p) => ({ id: p.id, name: p.name, status: p.status, isLive: p.isLive, views: p.views, leads: p.leads, conversion: p.conversion, owner: p.ownerName }))
      .sort((a, b) => b.leads - a.leads),
  };
}

module.exports = { dashboard, reports };
