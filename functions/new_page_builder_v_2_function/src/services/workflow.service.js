'use strict';

// Marketing approval workflow.
//
//   Draft/Rejected/Unpublished --submit--> Pending Approval
//   Pending Approval --approve--> Approved      (approves that exact version)
//   Pending Approval --reject---> Rejected      (comment required)
//   Pending Approval --withdraw-> Draft
//   Approved (or Unpublished with an approved version) --publish--> Published
//   live page --unpublish--> Unpublished
//
// Submitting snapshots a version; publishing serves the approved version, so
// edits made after approval never reach visitors without another review.

const config = require('../config');
const db = require('../utils/db');
const pages = require('./page.service');
const { can, P } = require('../config/roles');
const { badRequest, forbidden, conflict } = require('../utils/http');

const { STATUS } = pages;

async function log(capp, user, page, action, fromStatus, toStatus, versionNo, comment = '') {
  try {
    await db.table(capp, 'PageApprovals').insertRow({
      PageId: String(page.id),
      PageName: page.name,
      Action: action,
      FromStatus: fromStatus,
      ToStatus: toStatus,
      VersionNo: versionNo || 0,
      ActorName: user.name,
      ActorEmail: user.email,
      Comment: comment || '',
    });
  } catch (e) {
    // The audit table is required, but a logging failure must not undo a
    // transition that has already been written.
    console.error('[workflow] audit log failed', e.message);
  }
}

const isOwner = (user, page) => !!page.ownerEmail && page.ownerEmail === user.email;

async function submit(capp, user, id, { note } = {}) {
  const page = pages.toDto(await pages.getRow(capp, id));
  if (!can(user.role, P.PAGE_SUBMIT)) throw forbidden();
  if (!pages.canEdit(user, page)) throw forbidden('Only the page owner or marketing can submit this page');
  if (![STATUS.DRAFT, STATUS.REJECTED, STATUS.UNPUBLISHED].includes(page.status)) {
    throw conflict(`A page in "${page.status}" status cannot be sent for approval`);
  }
  if (!page.formConfig.length) {
    // Allowed, but worth knowing: no form means no leads.
    console.warn(`[workflow] page ${id} submitted without a lead form`);
  }
  const { versionNo } = await pages.snapshot(capp, user, id, { source: 'submit', note });
  await db.table(capp, 'Pages').updateRow({
    ROWID: id,
    Status: STATUS.PENDING,
    SubmittedBy: user.name,
    SubmittedTime: db.catalystDate(),
    ReviewComment: note || '',
  });
  await log(capp, user, page, 'Submitted', page.status, STATUS.PENDING, versionNo, note);
  return pages.toDto(await pages.getRow(capp, id));
}

async function withdraw(capp, user, id) {
  const page = pages.toDto(await pages.getRow(capp, id));
  if (page.status !== STATUS.PENDING) throw conflict('Only pages waiting for approval can be withdrawn');
  if (!pages.canEdit(user, page) && !can(user.role, P.PAGE_APPROVE)) throw forbidden();
  await db.table(capp, 'Pages').updateRow({ ROWID: id, Status: STATUS.DRAFT });
  await log(capp, user, page, 'Withdrawn', page.status, STATUS.DRAFT, page.currentVersion);
  return pages.toDto(await pages.getRow(capp, id));
}

function assertReviewer(user, page) {
  if (!can(user.role, P.PAGE_APPROVE)) throw forbidden('Only the marketing team can review pages');
  // Four-eyes rule: marketing members cannot approve their own submission.
  if (user.role !== 'admin' && page.submittedBy === user.name && isOwner(user, page)) {
    throw forbidden('Another marketing team member must review your own page');
  }
}

async function approve(capp, user, id, { comment } = {}) {
  const page = pages.toDto(await pages.getRow(capp, id));
  if (page.status !== STATUS.PENDING) throw conflict('Only pages waiting for approval can be approved');
  assertReviewer(user, page);
  await db.table(capp, 'Pages').updateRow({
    ROWID: id,
    Status: STATUS.APPROVED,
    ApprovedVersion: page.currentVersion,
    ReviewedBy: user.name,
    ReviewedTime: db.catalystDate(),
    ReviewComment: comment || '',
  });
  await log(capp, user, page, 'Approved', page.status, STATUS.APPROVED, page.currentVersion, comment);
  return pages.toDto(await pages.getRow(capp, id));
}

async function reject(capp, user, id, { comment } = {}) {
  if (!comment || !String(comment).trim()) throw badRequest('Please give a reason so the author knows what to change');
  const page = pages.toDto(await pages.getRow(capp, id));
  if (page.status !== STATUS.PENDING) throw conflict('Only pages waiting for approval can be rejected');
  assertReviewer(user, page);
  await db.table(capp, 'Pages').updateRow({
    ROWID: id,
    Status: STATUS.REJECTED,
    ReviewedBy: user.name,
    ReviewedTime: db.catalystDate(),
    ReviewComment: String(comment).trim(),
  });
  await log(capp, user, page, 'Rejected', page.status, STATUS.REJECTED, page.currentVersion, comment);
  return pages.toDto(await pages.getRow(capp, id));
}

// A page owned by a marketing member (reviewer) needs no second approval.
const ownMarketingPage = (user, page) => can(user.role, P.PAGE_APPROVE) && isOwner(user, page);

// Publish without an approved version: approval switched off, admins, or a
// marketing member publishing their own page.
function canPublishDirect(user, page) {
  return !config.workflow.requireApproval || can(user.role, P.PAGE_PUBLISH_DIRECT) || ownMarketingPage(user, page);
}

function canPublish(user, page) {
  if (!can(user.role, P.PAGE_PUBLISH)) return false;
  return can(user.role, P.PAGE_APPROVE) || isOwner(user, page);
}

async function publish(capp, user, id, { comment: inputComment } = {}) {
  let comment = inputComment;
  let page = pages.toDto(await pages.getRow(capp, id));
  if (!canPublish(user, page)) throw forbidden('Only the page owner or marketing can publish');

  let versionNo;
  const approvedReady =
    page.status === STATUS.APPROVED || (page.status === STATUS.UNPUBLISHED && page.approvedVersion > 0);

  if (approvedReady) {
    versionNo = page.approvedVersion;
  } else {
    const direct = canPublishDirect(user, page);
    if (!direct) {
      throw conflict('This page needs marketing approval before it can be published. Send it for approval first.');
    }
    // Marketing (the reviewers) may publish their own page straight away,
    // also while it waits in the review queue. Others must decide first.
    if (page.status === STATUS.PENDING && !ownMarketingPage(user, page) && !can(user.role, P.PAGE_PUBLISH_DIRECT)) {
      throw conflict('Approve or withdraw the pending review first');
    }
    const note = ownMarketingPage(user, page) && !can(user.role, P.PAGE_PUBLISH_DIRECT) ? 'Published by its owner from the marketing team' : 'Published without approval';
    ({ versionNo } = await pages.snapshot(capp, user, id, { source: 'publish', note }));
    comment = comment || note;
    await db.table(capp, 'Pages').updateRow({ ROWID: id, ApprovedVersion: versionNo });
    page = pages.toDto(await pages.getRow(capp, id));
  }

  const keys = pages.versionKeys(id, versionNo);
  await db.table(capp, 'Pages').updateRow({
    ROWID: id,
    Status: STATUS.PUBLISHED,
    IsLive: true,
    LiveVersion: versionNo,
    LiveFileID: keys.render,
    PublishedBy: user.name,
    PublishedTime: db.catalystDate(),
  });
  await log(capp, user, page, 'Published', page.status, STATUS.PUBLISHED, versionNo, comment);
  return pages.toDto(await pages.getRow(capp, id));
}

async function unpublish(capp, user, id, { comment } = {}) {
  const page = pages.toDto(await pages.getRow(capp, id));
  if (!page.isLive) throw conflict('This page is not live');
  if (!canPublish(user, page)) throw forbidden('Only the page owner or marketing can unpublish');
  const nextStatus = page.status === STATUS.PUBLISHED ? STATUS.UNPUBLISHED : page.status;
  await db.table(capp, 'Pages').updateRow({ ROWID: id, IsLive: false, Status: nextStatus });
  await log(capp, user, page, 'Unpublished', page.status, nextStatus, page.liveVersion, comment);
  return pages.toDto(await pages.getRow(capp, id));
}

async function history(capp, id) {
  const rows = await db.select(capp, 'PageApprovals', `PageId = ${db.q(id)}`, 'ORDER BY CREATEDTIME DESC LIMIT 200');
  return rows.map((r) => ({
    id: r.ROWID,
    action: r.Action,
    fromStatus: r.FromStatus,
    toStatus: r.ToStatus,
    versionNo: Number(r.VersionNo || 0),
    actorName: r.ActorName,
    actorEmail: r.ActorEmail,
    comment: r.Comment,
    time: r.CREATEDTIME,
  }));
}

async function recentActivity(capp, limit = 30) {
  const rows = await db.select(capp, 'PageApprovals', '', `ORDER BY CREATEDTIME DESC LIMIT ${db.num(limit)}`);
  return rows.map((r) => ({
    id: r.ROWID,
    pageId: r.PageId,
    pageName: r.PageName,
    action: r.Action,
    actorName: r.ActorName,
    comment: r.Comment,
    time: r.CREATEDTIME,
  }));
}

module.exports = { submit, withdraw, approve, reject, publish, unpublish, history, recentActivity, canPublish, canPublishDirect, log };
