'use strict';

const config = require('../config');

// Stratus access. Two buckets because they have different exposure:
//   pages bucket - project JSON and page HTML, private; served through this
//                  function only.
//   media bucket - images embedded directly in pages, so it needs public read.

const bucket = (capp, name) => capp.stratus().bucket(name);

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

async function putText(capp, key, text, contentType = 'text/plain; charset=utf-8') {
  const okPut = await bucket(capp, config.buckets.pages).putObject(key, Buffer.from(String(text), 'utf8'), {
    overwrite: 'true',
    contentType,
  });
  if (!okPut) throw new Error(`Stratus upload failed for ${key}`);
  return key;
}

async function getText(capp, key) {
  if (!key) return null;
  const stream = await bucket(capp, config.buckets.pages).getObject(key);
  if (!stream) return null;
  return (await streamToBuffer(stream)).toString('utf8');
}

async function getJson(capp, key) {
  const text = await getText(capp, key);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

const putJson = (capp, key, value) => putText(capp, key, JSON.stringify(value), 'application/json');

async function copy(capp, from, to) {
  // copyObject is server-side; fall back to read+write if the SDK or plan
  // does not support it.
  const b = bucket(capp, config.buckets.pages);
  try {
    await b.copyObject(from, to);
  } catch {
    const text = await getText(capp, from);
    if (text !== null) await putText(capp, to, text);
  }
  return to;
}

async function removeQuietly(capp, key, bucketName = config.buckets.pages) {
  if (!key) return;
  try {
    await bucket(capp, bucketName).deleteObject(key);
  } catch (e) {
    console.warn(`[storage] could not delete ${key}: ${e.message}`);
  }
}

async function deletePath(capp, prefix) {
  try {
    await bucket(capp, config.buckets.pages).deletePath(prefix);
  } catch (e) {
    console.warn(`[storage] could not delete path ${prefix}: ${e.message}`);
  }
}

// Media: returns the public object URL.
async function putMedia(capp, key, buffer, contentType) {
  const b = bucket(capp, config.buckets.media);
  const okPut = await b.putObject(key, buffer, { overwrite: 'true', contentType });
  if (!okPut) throw new Error(`Stratus upload failed for ${key}`);
  try {
    const details = await b.object(key).getDetails();
    if (details && details.object_url) return details.object_url;
  } catch {
    // fall through to the bucket URL
  }
  const base = b.bucketDetails && b.bucketDetails.bucket_url;
  return base ? `${base}/${key}` : key;
}

module.exports = { putText, getText, putJson, getJson, copy, removeQuietly, deletePath, putMedia, streamToBuffer };
