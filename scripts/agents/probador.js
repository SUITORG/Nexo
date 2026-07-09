#!/usr/bin/env node
/**
 * probador — SuitOS Smoke Test Agent
 * Version: 1.0.0
 * Purpose: Read-only integration testing. Runs test suites defined in .suit/tests/*.yaml
 *          against running servers. Never modifies code or data.
 *
 * Usage:
 *   node scripts/agents/probador.js --suite cotizador
 *   node scripts/agents/probador.js --suite system
 *   node scripts/agents/probador.js --suite cotizador --server main
 *   node scripts/agents/probador.js --suite cotizador --id saludar
 *
 * Flags:
 *   --suite    Test suite name (matches .suit/tests/<name>.yaml, required)
 *   --server   Filter tests for a specific server only
 *   --id       Run a single test by ID
 *   --output   Custom output path (default: .suit/logs/tests/<timestamp>-<suite>.md)
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const yaml = require('js-yaml');

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const TESTS_DIR = path.join(PROJECT_ROOT, '.suit/tests');
const LOG_DIR = path.join(PROJECT_ROOT, '.suit/logs/tests');

function parseArgs() {
  var args = {};
  for (var i = 2; i < process.argv.length; i++) {
    if (process.argv[i].startsWith('--')) {
      var key = process.argv[i].slice(2);
      var val = process.argv[i + 1];
      if (val && !val.startsWith('--')) {
        args[key] = val;
        i++;
      } else {
        args[key] = true;
      }
    }
  }
  if (!args.suite) {
    console.error('Usage: node scripts/agents/probador.js --suite <name> [--server <srv>] [--id <test>]');
    process.exit(1);
  }
  return args;
}

// --- Minimal YAML parser for .suit/tests/*.yaml ---
function loadSuite(name) {
  var filePath = path.join(TESTS_DIR, name + '.yaml');
  if (!fs.existsSync(filePath)) {
    console.error('Suite not found: ' + name);
    console.error('Available: ' + fs.readdirSync(TESTS_DIR).filter(function(f) { return f.endsWith('.yaml'); }).join(', '));
    process.exit(1);
  }
  var doc = yaml.load(fs.readFileSync(filePath, 'utf8'));
  return doc.suite || doc;
}

function resolveUrl(suite, serverName) {
  var servers = suite.servers || [];
  for (var si = 0; si < servers.length; si++) {
    if (servers[si].name === serverName || !serverName) {
      return servers[si].url;
    }
  }
  return null;
}

function buildRequestUrl(baseUrl, test) {
  var req = test.request || {};
  var path_part = req.path || '/';
  var query = req.query || {};
  var url = (baseUrl || 'http://localhost:3003') + path_part;

  var queryParts = [];
  for (var key of Object.keys(query)) {
    var val = query[key];
    if (typeof val === 'object') {
      queryParts.push(encodeURIComponent(key) + '=' + encodeURIComponent(JSON.stringify(val)));
    } else {
      queryParts.push(encodeURIComponent(key) + '=' + encodeURIComponent(String(val)));
    }
  }
  if (queryParts.length) url += (url.includes('?') ? '&' : '?') + queryParts.join('&');

  return url;
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

    // For POST/PUT, send req.body as JSON (if present)
    if (isPost && reqDef.body) {
      body = JSON.stringify(reqDef.body);
      if (!headers['Content-Type']) headers['Content-Type'] = 'application/json';
    }

    var options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: headers,
      timeout: testTimeout
    };

    var startTime = Date.now();
    var reqObj = http.request(options, function(res) {
      var chunks = [];
      res.on('data', function(chunk) { chunks.push(chunk); });
      res.on('end', function() {
        var duration = Date.now() - startTime;
        var bodyText = Buffer.concat(chunks).toString('utf8');
        var parsedBody = null;
        try { parsedBody = JSON.parse(bodyText); } catch (e) {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: bodyText,
          bodyJson: parsedBody,
          duration: duration
        });
      });
    });

    reqObj.on('error', function(err) {
      resolve({ status: 0, body: err.message, duration: Date.now() - startTime, error: err.code || 'CONNREFUSED' });
    });

  reqObj.on('timeout', function() {
    reqObj.destroy();
    resolve({ status: 0, body: 'Timeout (' + testTimeout + 'ms)', duration: testTimeout, error: 'TIMEOUT' });
  });

    if (body) reqObj.write(body);
    reqObj.end();
  });
}

function evaluateExpectation(test, response) {
  var expect = test.expect || {};
  var issues = [];
  var passed = true;

  // Status check
  if (expect.status !== undefined) {
    var expectedStatus = Number(expect.status);
    if (response.status !== expectedStatus) {
      passed = false;
      issues.push('Esperaba status ' + expectedStatus + ', obtuvo ' + response.status);
    }
  }

  // Body contains string
  if (expect.body_contains) {
    var patterns = Array.isArray(expect.body_contains) ? expect.body_contains : [expect.body_contains];
    for (var pi = 0; pi < patterns.length; pi++) {
      var pat = patterns[pi];
      if (!response.body.includes(pat)) {
        passed = false;
        issues.push('Body no contiene "' + pat + '"');
      }
    }
  }

  // Body is array
  if (expect.body_is_array) {
    if (!Array.isArray(response.bodyJson)) {
      passed = false;
      issues.push('Body deberia ser un array, obtuvo: ' + typeof response.bodyJson);
    }
  }

  // Body has key
  if (expect.body_has_key) {
    var keys = Array.isArray(expect.body_has_key) ? expect.body_has_key : [expect.body_has_key];
    for (var ki = 0; ki < keys.length; ki++) {
      var key = keys[ki];
      if (!response.bodyJson || response.bodyJson[key] === undefined) {
        passed = false;
        issues.push('Body no contiene la clave "' + key + '"');
      }
    }
  }

  return { passed: passed, issues: issues };
}

function runTests(suite, serverFilter, testIdFilter) {
  var servers = suite.servers || [];
  var tests = suite.tests || [];
  var results = [];
  var defaultServer = servers.length > 0 ? servers[0].name : null;

  for (var ti = 0; ti < tests.length; ti++) {
    var test = tests[ti];
    if (testIdFilter && test.id !== testIdFilter) continue;
    if (test._items) continue; // skip array container

    var reqInfo = test.request || {};
    var serverName = reqInfo.server || defaultServer;
    if (serverFilter && serverName !== serverFilter) continue;

    var baseUrl = resolveUrl(suite, serverName);
    if (!baseUrl) {
      results.push({
        id: test.id,
        description: test.description || '',
        passed: false,
        issues: ['Server "' + serverName + '" not defined in suite'],
        duration: 0
      });
      continue;
    }

    var url = buildRequestUrl(baseUrl, test);
    var defaultTimeout = suite.config ? suite.config.timeout : 15000;
    results.push({ id: test.id, description: test.description || '', url: url, promise: sendRequest(url, test, defaultTimeout) });
  }

  return results;
}

function printProgress(tests, results) {
  var done = 0;
  var total = results.length;
  for (var ri = 0; ri < results.length; ri++) {
    if (results[ri].promise) {
      results[ri].promise.then(function() {
        done++;
        process.stdout.write('\r  Progreso: ' + done + '/' + total + ' pruebas');
        if (done === total) process.stdout.write('\n');
      });
    } else {
      done++;
    }
  }
}

function formatDuration(ms) {
  if (ms < 1000) return ms + 'ms';
  return (ms / 1000).toFixed(1) + 's';
}

function generateReport(suiteName, suite, results, duration) {
  var passed = results.filter(function(r) { return r.passed; }).length;
  var failed = results.filter(function(r) { return !r.passed; }).length;
  var total = results.length;

  var md = '';
  md += '# Smoke Test Report: ' + suiteName + '\n';
  md += 'Date: ' + new Date().toISOString().slice(0, 10) + '\n';
  md += 'Duration: ' + formatDuration(duration) + '\n';
  md += 'Suite: ' + (suite.description || suite.name || suiteName) + '\n\n';

  md += '## Resumen\n\n';
  md += '- ' + (failed === 0 ? '✅' : '❌') + ' **' + passed + '/' + total + '** pruebas pasaron\n';
  md += '- Duracion total: ' + formatDuration(duration) + '\n\n';

  if (!results.length) {
    md += '_No se ejecutaron pruebas._\n\n';
    md += '---\n*Reporte generado por probador v1.0.0 (SuitOS Smoke Tester)*\n';
    md += '*Read-only: ningun servidor o archivo fue modificado.*\n';
    return md;
  }

  for (var ri = 0; ri < results.length; ri++) {
    var r = results[ri];
    var icon = r.passed ? '✅' : '❌';
    md += '### ' + icon + ' ' + r.id + ': ' + (r.description || '') + '\n';
    md += '**Status**: ' + (r.passed ? 'PASS' : 'FAIL') + ' (' + r.httpStatus + ') | ' + formatDuration(r.duration) + '\n';
    if (r.url) md += '**URL**: `' + r.url + '`\n';
    if (r.issues && r.issues.length) {
      for (var ii = 0; ii < r.issues.length; ii++) {
        md += '**Issue**: ' + r.issues[ii] + '\n';
      }
    }
    md += '\n';
  }

  md += '---\n';
  md += '*Reporte generado por probador v1.0.0 (SuitOS Smoke Tester)*\n';
  md += '*Read-only: ningun servidor o archivo fue modificado.*\n';
  return md;
}

// --- Main ---
function main() {
  var args = parseArgs();
  var suiteName = args.suite;
  var serverFilter = args.server || null;
  var testIdFilter = args.id || null;

  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }

  console.log('\n  \uD83E\uDDD0 probador — SuitOS Smoke Tester');
  console.log('  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');
  console.log('  Suite: ' + suiteName);
  if (serverFilter) console.log('  Server filter: ' + serverFilter);
  if (testIdFilter) console.log('  Test filter: ' + testIdFilter);
  console.log('  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');

  // Load suite
  var suite = loadSuite(suiteName);
  var servers = suite.servers || [];
  var allTests = suite.tests || [];

  // Show test plan
  var count = allTests.length;
  console.log('  \uD83D\uDCCB ' + servers.length + ' server(s), ' + count + ' test(s)');
  console.log('  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n');

  // Run tests
  var results = runTests(suite, serverFilter, testIdFilter);

  // Resolve all promises and collect results
  var promises = [];
  for (var ri = 0; ri < results.length; ri++) {
    if (results[ri].promise) {
      promises.push(results[ri].promise.then(function(idx) {
        return function(response) {
          var r = results[idx];
          var matchedTest = null;
          var st = suite.tests || [];
          for (var sti = 0; sti < st.length; sti++) {
            if (st[sti].id === r.id) { matchedTest = st[sti]; break; }
          }
          var result = evaluateExpectation(matchedTest || {}, response);
          r.passed = result.passed;
          r.issues = result.issues;
          r.httpStatus = response.status || 0;
          r.duration = response.duration;
          delete r.promise;
        };
      }(ri)));
    } else {
      // Already resolved (error before request)
      promises.push(Promise.resolve());
    }
  }

  var startTime = Date.now();

  Promise.all(promises).then(function() {
    var totalDuration = Date.now() - startTime;
    var passed = results.filter(function(r) { return r.passed; }).length;
    var failed = results.filter(function(r) { return !r.passed; }).length;

    // Print results
    console.log('  Resultados:');
    console.log('  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');

    for (var ri = 0; ri < results.length; ri++) {
      var r = results[ri];
      var icon = r.passed ? '  \u2705' : '  \u274C';
      var statusLabel = r.passed ? 'PASS' : 'FAIL';
      var dur = formatDuration(r.duration);
      console.log(icon + ' [' + statusLabel + '] ' + r.id + ' (' + dur + ')');
      if (!r.passed && r.issues && r.issues.length) {
        for (var ii = 0; ii < r.issues.length; ii++) {
          console.log('     \u21B3 ' + r.issues[ii]);
        }
        if (r.httpStatus !== undefined) {
          console.log('     HTTP ' + r.httpStatus);
        }
      }
    }

    console.log('  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');
    var summaryIcon = failed === 0 ? '\u2705' : '\u274C';
    console.log('  ' + summaryIcon + ' ' + passed + '/' + results.length + ' pasaron (' + formatDuration(totalDuration) + ')\n');

    // Generate and save report
    var md = generateReport(suiteName, suite, results, totalDuration);
    var timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    var defaultOutput = path.join(LOG_DIR, timestamp + '-' + suiteName + '.md');
    var outputPath = args.output ? path.resolve(PROJECT_ROOT, args.output) : defaultOutput;
    fs.writeFileSync(outputPath, md, 'utf8');
    console.log('  \uD83D\uDCC4 Reporte guardado: ' + outputPath + '\n');

    // Exit with error code if any test failed
    if (failed > 0) process.exit(1);
  }).catch(function(err) {
    console.error('Fatal:', err.message);
    process.exit(1);
  });

  // Print progress indicator
  printProgress(suiteName, results);
}

main();
