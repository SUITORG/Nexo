#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const http = require('http');

const PROJECT_ROOT = process.cwd();
const TESTS_DIR = path.join(PROJECT_ROOT, '.suit/tests');
const LOG_DIR = path.join(PROJECT_ROOT, '.suit/logs/tests');

function parseArgs() {
  var args = {};
  for (var i = 2; i < process.argv.length; i++) {
    if (process.argv[i].startsWith('--')) {
      var key = process.argv[i].slice(2);
      var val = process.argv[i + 1];
      if (val && !val.startsWith('--')) { args[key] = val; i++; }
      else { args[key] = true; }
    }
  }
  if (!args.suite) { console.error('Usage: node probador/probador.js --suite <name> [--server <srv>] [--id <test>]'); process.exit(1); }
  return args;
}

function loadSuite(name) {
  var jsyaml = null;
  try { jsyaml = require('js-yaml'); } catch (e) {
    var filePath = path.join(TESTS_DIR, name + '.yaml');
    if (!fs.existsSync(filePath)) { console.error('Suite not found: ' + name); process.exit(1); }
    return JSON.parse(JSON.stringify(require('yaml').parse(fs.readFileSync(filePath, 'utf8'))));
  }
  var filePath = path.join(TESTS_DIR, name + '.yaml');
  if (!fs.existsSync(filePath)) { console.error('Suite not found: ' + name); process.exit(1); }
  var doc = jsyaml.load(fs.readFileSync(filePath, 'utf8'));
  return doc.suite || doc;
}

function sendRequest(url, test, defaultTimeout) {
  return new Promise(function(resolve) {
    var reqDef = test.request || {};
    var method = (reqDef.method || 'GET').toUpperCase();
    var headers = reqDef.headers || {};
    var body = null;
    var parsedUrl = new URL(url);
    var isPost = method === 'POST' || method === 'PUT' || method === 'PATCH';
    var testTimeout = reqDef.timeout || defaultTimeout || 15000;
    if (isPost && reqDef.body) { body = JSON.stringify(reqDef.body); if (!headers['Content-Type']) headers['Content-Type'] = 'application/json'; }
    var options = { hostname: parsedUrl.hostname, port: parsedUrl.port || 80, path: parsedUrl.pathname + parsedUrl.search, method: method, headers: headers, timeout: testTimeout };
    var startTime = Date.now();
    var reqObj = http.request(options, function(res) {
      var chunks = [];
      res.on('data', function(chunk) { chunks.push(chunk); });
      res.on('end', function() {
        var duration = Date.now() - startTime;
        var bodyText = Buffer.concat(chunks).toString('utf8');
        var parsedBody = null;
        try { parsedBody = JSON.parse(bodyText); } catch (e) {}
        resolve({ status: res.statusCode, headers: res.headers, body: bodyText, bodyJson: parsedBody, duration: duration });
      });
    });
    reqObj.on('error', function(err) { resolve({ status: 0, body: err.message, duration: Date.now() - startTime, error: err.code || 'CONNREFUSED' }); });
    reqObj.on('timeout', function() { reqObj.destroy(); resolve({ status: 0, body: 'Timeout (' + testTimeout + 'ms)', duration: testTimeout, error: 'TIMEOUT' }); });
    if (body) reqObj.write(body);
    reqObj.end();
  });
}

function evaluateExpectation(test, response) {
  var expect = test.expect || {};
  var issues = [];
  var passed = true;
  if (expect.status !== undefined) {
    if (response.status !== Number(expect.status)) { passed = false; issues.push('Expected status ' + expect.status + ', got ' + response.status); }
  }
  if (expect.body_contains) {
    var patterns = Array.isArray(expect.body_contains) ? expect.body_contains : [expect.body_contains];
    for (var pi = 0; pi < patterns.length; pi++) { if (!response.body.includes(patterns[pi])) { passed = false; issues.push('Body missing "' + patterns[pi] + '"'); } }
  }
  if (expect.body_has_key) {
    var keys = Array.isArray(expect.body_has_key) ? expect.body_has_key : [expect.body_has_key];
    for (var ki = 0; ki < keys.length; ki++) { if (!response.bodyJson || response.bodyJson[keys[ki]] === undefined) { passed = false; issues.push('Body missing key "' + keys[ki] + '"'); } }
  }
  return { passed: passed, issues: issues };
}

function generateReport(suiteName, results, duration) {
  var passed = results.filter(function(r) { return r.passed; }).length;
  var failed = results.filter(function(r) { return !r.passed; }).length;
  var total = results.length;

  var md = '# Smoke Test Report: ' + suiteName + '\n';
  md += 'Date: ' + new Date().toISOString().slice(0, 10) + '\n';
  md += 'Duration: ' + duration + 'ms\n\n';
  md += '## Summary\n\n';
  md += '- ' + (failed === 0 ? 'PASS' : 'FAIL') + ' **' + passed + '/' + total + '** tests passed\n';
  md += '- Total time: ' + duration + 'ms\n\n';

  for (var ri = 0; ri < results.length; ri++) {
    var r = results[ri];
    md += '### ' + (r.passed ? 'PASS' : 'FAIL') + ' ' + r.id + ': ' + (r.description || '') + '\n';
    md += '**Status**: ' + r.httpStatus + ' | ' + r.duration + 'ms\n';
    if (r.url) md += '**URL**: `' + r.url + '`\n';
    if (r.issues && r.issues.length) { for (var ii = 0; ii < r.issues.length; ii++) md += '**Issue**: ' + r.issues[ii] + '\n'; }
    md += '\n';
  }

  md += '---\n*Report generated by probador (SuitOS Smoke Tester)*\n*Read-only: no servers or files were modified.*\n';
  return md;
}

function main() {
  var args = parseArgs();
  var suiteName = args.suite;
  var serverFilter = args.server || null;
  var testIdFilter = args.id || null;

  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

  console.log('\n  probador - Smoke Tester');
  console.log('  Suite: ' + suiteName + '\n');

  var suite = loadSuite(suiteName);
  var servers = suite.servers || [];
  var tests = suite.tests || [];
  var defaultServer = servers.length > 0 ? servers[0].url : 'http://localhost:3000';

  var results = [];
  for (var ti = 0; ti < tests.length; ti++) {
    var test = tests[ti];
    if (testIdFilter && test.id !== testIdFilter) continue;
    var reqInfo = test.request || {};
    var baseUrl = defaultServer;
    results.push({ id: test.id, description: test.description || '', url: baseUrl + (reqInfo.path || '/'), promise: sendRequest(baseUrl + (reqInfo.path || '/'), test, suite.config ? suite.config.timeout : 15000) });
  }

  var startTime = Date.now();
  Promise.all(results.map(function(r, idx) {
    if (!r.promise) return Promise.resolve();
    return r.promise.then(function(response) {
      var result = evaluateExpectation(tests[idx] || {}, response);
      r.passed = result.passed;
      r.issues = result.issues;
      r.httpStatus = response.status || 0;
      r.duration = response.duration;
      delete r.promise;
    });
  })).then(function() {
    var totalDuration = Date.now() - startTime;
    var passed = results.filter(function(r) { return r.passed; }).length;
    var failed = results.filter(function(r) { return !r.passed; }).length;
    console.log('  Results:');
    for (var ri = 0; ri < results.length; ri++) {
      var r = results[ri];
      console.log('  ' + (r.passed ? 'PASS' : 'FAIL') + ' ' + r.id + ' (' + (r.duration || 0) + 'ms)');
      if (!r.passed && r.issues) { for (var ii = 0; ii < r.issues.length; ii++) console.log('     -> ' + r.issues[ii]); }
    }
    console.log('\n  ' + (failed === 0 ? 'PASS' : 'FAIL') + ' ' + passed + '/' + results.length + ' passed (' + totalDuration + 'ms)\n');

    var md = generateReport(suiteName, results, totalDuration);
    var timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    var defaultOutput = path.join(LOG_DIR, timestamp + '-' + suiteName + '.md');
    var outputPath = args.output ? path.resolve(args.output) : defaultOutput;
    fs.writeFileSync(outputPath, md, 'utf8');
    console.log('  Report saved: ' + outputPath + '\n');
    if (failed > 0) process.exit(1);
  });
}

main();
