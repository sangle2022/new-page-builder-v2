#!/usr/bin/env node
// Lists files in functions/pb_ai_job/src that differ from the main
// function's src/, so a change made in one place is not forgotten in the
// other. Report only; it changes nothing.
//
//   node scripts/check-job-copy.js

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const main = path.join(root, 'functions/new_page_builder_v_2_function/src');
const job = path.join(root, 'functions/pb_ai_job/src');

const files = [];
(function walk(dir) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.js')) files.push(path.relative(job, p));
  });
})(job);

const differ = files.filter((f) => {
  const a = path.join(main, f);
  return !fs.existsSync(a) || fs.readFileSync(a, 'utf8') !== fs.readFileSync(path.join(job, f), 'utf8');
});

if (!differ.length) {
  console.log(`All ${files.length} job files match the main function.`);
} else {
  console.log(`${differ.length} of ${files.length} job files differ from the main function:`);
  differ.forEach((f) => console.log(`  ${f.split(path.sep).join('/')}`));
}
