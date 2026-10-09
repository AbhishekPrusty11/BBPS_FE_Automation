import fs from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';
import XLSX from 'xlsx';
import envConfig from '../Config/envConfig.js';

/**
 * NexusHtmlReporter - Plug-and-Play QA Automation HTML & Excel Reporter.
 * 
 * Features:
 * - Dynamic Module-Wise Filter selector (works for any suite automatically).
 * - Portal Filter & Execution Status Filter.
 * - High-level atomic workflow step cards with expandable technical action accordions.
 * - Complete visual screenshot evidence attached to every test case (Passed & Failed).
 * - Excel output (Test_Execution_Report.xlsx) containing all execution steps and screenshot paths.
 * - Auto-open report in default browser window upon completion.
 */
export default class NexusHtmlReporter {
  constructor(options = {}) {
    this.outputFolder = options.outputFolder || 'reports/nexus-report';
    this.outputDir = path.join(process.cwd(), this.outputFolder);
    this.outputFile = path.join(this.outputDir, 'index.html');
    this.excelFile = path.join(this.outputDir, 'Test_Execution_Report.xlsx');
    this.screenshotsDir = path.join(this.outputDir, 'screenshots');
    this.historyFile = path.join(this.outputDir, 'results-history.json');

    // Results from this run only, keyed per test (a retried test keeps its
    // final attempt). They are merged over the history in onEnd so the report
    // always covers every test, not just the ones run in this cycle.
    this.currentRun = new Map();

    this.suiteResults = {
      startTime: null,
      endTime: null,
      durationMs: 0,
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      tests: [],
    };
  }

  onBegin(config, suite) {
    this.suiteResults.startTime = new Date();
    if (!fs.existsSync(this.screenshotsDir)) {
      fs.mkdirSync(this.screenshotsDir, { recursive: true });
    }
  }

  onStdOut(chunk, test, result) {
    if (!result) return;
    if (!result.customLogs) result.customLogs = [];
    
    const output = Buffer.isBuffer(chunk) ? chunk.toString('utf-8') : chunk.toString();
    if (typeof output !== 'string') return;

    const lines = output.split('\n');
    for (let line of lines) {
      line = line.trim();
      // Filter out empty lines and internal Playwright/NPM noise
      if (line && 
          !line.startsWith('npm notice') && 
          !line.includes('Running') && 
          !line.includes('workers') &&
          !line.includes('Admin authentication saved')) {
        
        // Remove ANSI color codes just in case
        line = line.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
        result.customLogs.push(line);
      }
    }
  }

  /** seed.spec.ts is only a scaffold for the Playwright test agents, not a real test case. */
  isSeedSpec(filePath) {
    return path.basename(filePath || '') === 'seed.spec.ts';
  }

  onTestEnd(test, result) {
    if (this.isSeedSpec(test.location.file)) return;

    const filePath = test.location.file;
    const moduleName = this.extractModuleName(filePath, test.title, test.titlePath().join(' › '));
    const role = this.extractRole(filePath, test.titlePath());
    const userName = this.extractUserName(role);
    const portal = this.extractPortal(filePath, test.titlePath(), role);
    const tcId = this.extractTcId(test);

    const structuredSteps = this.extractStructuredSteps(result);

    const attachments = [];
    let primaryScreenshotPath = null;

    (result.attachments || []).forEach((att, attIdx) => {
      let base64 = null;
      let savedPath = null;

      if (att.contentType.startsWith('image/') && att.path && fs.existsSync(att.path)) {
        try {
          const imgBuf = fs.readFileSync(att.path);
          base64 = `data:${att.contentType};base64,${imgBuf.toString('base64')}`;

          const sanitizedTcId = tcId.replace(/[^a-zA-Z0-9_-]/g, '_');
          const titleKey = require('crypto').createHash('md5').update(test.title).digest('hex').slice(0, 6);
          const fileName = `${sanitizedTcId}_${titleKey}_${result.status}_${attIdx + 1}.png`;
          savedPath = path.join(this.screenshotsDir, fileName);
          fs.copyFileSync(att.path, savedPath);

          if (!primaryScreenshotPath) {
            primaryScreenshotPath = `screenshots/${fileName}`;
          }
        } catch {
          // ignore
        }
      }

      attachments.push({
        name: att.name,
        contentType: att.contentType,
        path: savedPath || att.path,
        relativePath: savedPath ? `screenshots/${path.basename(savedPath)}` : null,
        base64,
      });
    });

    // test.fail() marks a defect that is still present: the test fails as expected, so it did its job. Report it as
    // passed with a KNOWN DEFECT badge. If the defect is fixed the test "unexpectedly passes" and stays a real failure.
    const knownDefect = result.status === 'failed' && test.outcome() === 'expected';
    const defectNote = (test.annotations || []).find((a) => a.type === 'fail');
    const errorDetails = knownDefect
      ? {
          message: `KNOWN DEFECT (test marked test.fail): ${(defectNote && defectNote.description) || 'defect still present'}`,
          stack: result.error ? result.error.message || '' : '',
        }
      : result.error
        ? {
            message: result.error.message || 'Test case failed',
            stack: result.error.stack || '',
          }
        : null;

    this.currentRun.set(test.titlePath().join(' › '), {
      id: test.id,
      key: test.titlePath().join(' › '),
      file: path.relative(process.cwd(), filePath),
      executedAt: new Date().toISOString(),
      tcId,
      title: test.title,
      module: moduleName,
      portal,
      userName,
      status: knownDefect ? 'passed' : result.status,
      knownDefect,
      durationMs: result.duration,
      error: errorDetails,
      steps: structuredSteps,
      attachments,
      primaryScreenshot: primaryScreenshotPath,
      location: `${path.basename(test.location.file)}:${test.location.line}`,
    });
  }

  onEnd(result) {
    this.suiteResults.endTime = new Date();
    this.suiteResults.durationMs = this.suiteResults.endTime - this.suiteResults.startTime;

    if (this.currentRun.size === 0) {
      console.log('\n\x1b[33m[NexusHtmlReporter] No tests were executed; the existing report was left unchanged.\x1b[0m\n');
      return;
    }

    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    const merged = this.loadHistory();
    for (const [key, entry] of this.currentRun) merged.set(key, entry);
    this.dropSupersededEntries(merged);
    this.saveHistory(merged);

    const tests = [...merged.values()].map((test, index) => ({
      ...test,
      tcId: `TC-${String(index + 1).padStart(3, '0')}`,
    }));
    this.suiteResults.tests = tests;
    this.suiteResults.total = tests.length;
    this.suiteResults.passed = tests.filter((t) => t.status === 'passed').length;
    this.suiteResults.failed = tests.filter((t) => t.status === 'failed' || t.status === 'timedOut').length;
    this.suiteResults.skipped = tests.length - this.suiteResults.passed - this.suiteResults.failed;
    this.suiteResults.executedThisRun = this.currentRun.size;

    const htmlContent = this.generateHtmlReport(this.suiteResults);
    fs.writeFileSync(this.outputFile, htmlContent, 'utf-8');

    this.generateExcelReport(this.suiteResults);

    console.log(`\n\x1b[32m[NexusHtmlReporter] QA Automation Report Generated:\x1b[0m ${this.outputFile}`);
    console.log(`\x1b[32m[NexusHtmlReporter] Excel Report Generated:\x1b[0m ${this.excelFile}\n`);

    this.autoOpenReport();
  }

  /**
   * Previous results, oldest position first. Entries whose spec file no longer
   * exists are dropped, and screenshots (stored on disk, not in the JSON) are
   * re-embedded so old test cards keep their evidence.
   */
  loadHistory() {
    const history = new Map();
    if (!fs.existsSync(this.historyFile)) return history;
    try {
      const saved = JSON.parse(fs.readFileSync(this.historyFile, 'utf-8'));
      for (const entry of saved) {
        if (!entry.file || this.isSeedSpec(entry.file)) continue;
        if (!fs.existsSync(path.resolve(process.cwd(), entry.file))) continue;
        entry.module = this.extractModuleName(entry.file, entry.title, entry.key);
        const role = this.extractRole(entry.file, entry.key.split(' › '));
        entry.userName = this.extractUserName(role);
        entry.portal = this.extractPortal(entry.file, entry.key.split(' › '), role);
        for (const att of entry.attachments || []) {
          if (att.relativePath && !att.base64) {
            const imgPath = path.join(this.outputDir, att.relativePath);
            if (fs.existsSync(imgPath)) {
              att.base64 = `data:${att.contentType};base64,${fs.readFileSync(imgPath).toString('base64')}`;
            }
          }
        }
        history.set(entry.key, entry);
      }
      this.dropSupersededEntries(history);
    } catch {
      // A corrupt history file just starts the report over from this run.
    }
    return history;
  }

  /**
   * History is keyed by the full test title, so renaming or reworking a test
   * leaves its old result behind (often a stale failure) beside the new one.
   * A test ID is unique within its spec file, so only the newest entry per
   * file + test ID is kept.
   */
  dropSupersededEntries(history) {
    // Older generic entries without a Playwright test ID cannot be reconciled safely.
    for (const [key, entry] of history) {
      if ((!entry.tcId || entry.tcId === 'TC-GENERIC') && !entry.id) history.delete(key);
    }
    const latest = new Map();
    for (const entry of history.values()) {
      const caseId = entry.tcId && entry.tcId !== 'TC-GENERIC' ? entry.tcId : entry.id;
      if (!caseId) continue;
      const id = `${entry.file}|${caseId}`;
      const current = latest.get(id);
      if (!current || entry.executedAt > current.executedAt) latest.set(id, entry);
    }
    for (const [key, entry] of history) {
      const caseId = entry.tcId && entry.tcId !== 'TC-GENERIC' ? entry.tcId : entry.id;
      if (caseId && latest.get(`${entry.file}|${caseId}`) !== entry) history.delete(key);
    }
  }

  saveHistory(merged) {
    const slim = [...merged.values()].map((t) => ({
      ...t,
      attachments: t.attachments.map((a) => ({ ...a, base64: null })),
    }));
    fs.writeFileSync(this.historyFile, JSON.stringify(slim, null, 2), 'utf-8');
  }

  /** Test ID comes from the test's `id` annotation; older titles that still start with an ID also work. */
  extractTcId(test) {
    const annotated = (test.annotations || []).find((a) => a.type === 'id');
    if (annotated && annotated.description) return annotated.description.toUpperCase();
    const match = test.title.match(/TC-[A-Z]+-\d+/i);
    return match ? match[0].toUpperCase() : 'TC-GENERIC';
  }

  extractModuleName(file, title, titlePath = '') {
    const lowerFile = file.toLowerCase();
    // Inventory Corp. Admin / Program Manager / Corporate suites are registered from shared helpers in fixtures/, so
    // their spec file says nothing about the page: use the describe title ("Inventory - <menu> - <page>") instead.
    const inventoryPage = titlePath.match(/Inventory - (Corp\. Admin|Program Manager|Corporate) - (Pending Request|View)/);
    if (inventoryPage) return `Inventory > ${inventoryPage[1]} > ${inventoryPage[2]}`;
    // Report Center specs cover two pages; the describe title (and, for the no-login tests, the URL in the title) says which.
    if (lowerFile.includes('report-center')) {
      const text = `${titlePath} ${title}`;
      if (/Onboarding/i.test(text) || /onboarding-report/i.test(text)) return 'Report Center > Customer Onboarding Report';
      if (/Other Reports/i.test(text) || /admin-report/i.test(text)) return 'Report Center > Other Reports';
      return 'Report Center > Navigation';
    }
    // Customer Support specs run the same tests on three tables, so the describe title names the section.
    if (lowerFile.includes('customer-support')) {
      const section = titlePath.match(/Customer Support - (My Queries|Assigned Queries|Escalated Queries|Raise a Ticket)/);
      return section ? `Customer Support > ${section[1]}` : 'Customer Support';
    }
    if (lowerFile.includes('prepaid-card-login') || lowerFile.includes('login') || lowerFile.includes('auth.setup')) return 'Login & Authentication';
    if (lowerFile.includes('inventory-buy-card')) return 'Inventory > Buy Card';
    if (lowerFile.includes('inventory-shipping-report')) return 'Inventory > Shipping Report';
    if (lowerFile.includes('pay-user')) return 'Pay User';
    if (lowerFile.includes('customer-create')) return 'Customer > Create';
    if (lowerFile.includes('customer-draft')) return 'Customer > Drafted Request';
    if (lowerFile.includes('customer-cards')) return 'Customer > Cards';
    if (lowerFile.includes('inventory-request-navigation')) return 'Inventory > Corp. Admin / Program Manager / Corporate > Navigation';
    if (lowerFile.includes('inventory-virtual-to-physical-pending')) return 'Inventory > Virtual to Physical Request > Pending Requests';
    if (lowerFile.includes('inventory-virtual-to-physical-view')) return 'Inventory > Virtual to Physical Request > View';
    if (lowerFile.includes('inventory-virtual-to-physical')) return 'Inventory > Virtual to Physical Request';
    if (lowerFile.includes('product-create')) return 'Product > Create';
    if (lowerFile.includes('product-view')) return 'Product > View';
    if (lowerFile.includes('product-draft')) return 'Product > Drafted Request';
    if (lowerFile.includes('corporate-admin-create')) return 'Corporate Admin > Create';
    if (lowerFile.includes('corporate-admin-view')) return 'Corporate Admin > View';
    if (lowerFile.includes('corporate-admin-draft')) return 'Corporate Admin > Drafted Request';
    if (lowerFile.includes('corporate-admin-change-request')) return 'Corporate Admin > Change Request';
    if (lowerFile.includes('program-manager-create')) return 'Program Manager > Create';
    if (lowerFile.includes('program-manager-view')) return 'Program Manager > View';
    if (lowerFile.includes('program-manager-draft')) return 'Program Manager > Drafted Request';
    if (lowerFile.includes('program-manager') || lowerFile.includes('prog-manager')) return 'Program Manager';
    if (lowerFile.includes('wallet-bank-admin')) return 'Wallet - Bank Admin';
    if (lowerFile.includes('wallet-settings')) return 'Wallet Settings - Super Admin';
    if (lowerFile.includes('inventory')) return 'Inventory';
    if (lowerFile.includes('bin-settings')) return 'BIN Settings';
    if (lowerFile.includes('card-template')) return 'Card Template';
    if (lowerFile.includes('origin')) return 'Origin';
    if (lowerFile.includes('feature-mapping')) return 'Feature Mapping';
    if (lowerFile.includes('api-partner')) return 'API Partner';
    if (lowerFile.includes('embossa')) return 'Embossa';
    if (lowerFile.includes('seed')) return 'Seed';

    const titleParts = titlePath.split(' › ').filter(Boolean);
    const specIndex = titleParts.findIndex((part) => part.toLowerCase().includes('.spec.'));
    const suiteTitle = specIndex >= 0 ? titleParts[specIndex + 1] : '';
    const moduleFromSuite = (suiteTitle || '')
      .replace(/\s*[-–—]\s*(Maker|Checker|Biller)\s*$/i, '')
      .trim();
    if (moduleFromSuite) return moduleFromSuite;

    const fileName = path.basename(file, path.extname(file)).replace(/\.spec$/i, '');
    return fileName
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .trim() || 'Uncategorized';
  }

  /** The role used by the test, inferred from the suite or its authentication setup. */
  extractRole(filePath, titlePath = []) {
    const roles = ['Maker', 'Checker', 'Biller'];
    const suiteTitles = Array.isArray(titlePath) ? titlePath.slice(0, -1) : [];

    for (const suiteTitle of suiteTitles.reverse()) {
      const match = suiteTitle.match(/(?:^|[-–—]\s*)(Maker|Checker|Biller)\s*$/i);
      if (match) return roles.find((role) => role.toLowerCase() === match[1].toLowerCase());
    }

    const testTitle = Array.isArray(titlePath) ? titlePath[titlePath.length - 1] : '';
    const loginMatch = (testTitle || '').match(/^(Maker|Checker|Biller)\s+Login$/i);
    if (loginMatch) return roles.find((role) => role.toLowerCase() === loginMatch[1].toLowerCase());

    const resolvedFile = path.resolve(process.cwd(), filePath || '');
    if (filePath && fs.existsSync(resolvedFile)) {
      const source = fs.readFileSync(resolvedFile, 'utf-8');
      const configuredRoles = new Set(
        [...source.matchAll(/setupAuth\s*\(\s*[^,]+,\s*['"](Maker|Checker|Biller)['"]\s*\)/gi)]
          .map((match) => roles.find((role) => role.toLowerCase() === match[1].toLowerCase()))
      );
      if (configuredRoles.size === 1) return [...configuredRoles][0];
    }

    return 'Unspecified';
  }

  /** The configured login account name for the role used by this test. */
  extractUserName(role) {
    const userName = envConfig.UAT.credentials[role]?.Username;
    return typeof userName === 'string' && userName.trim() ? userName.trim() : 'Unspecified';
  }

  extractPortal(filePath, titlePath = [], role = null) {
    role = role || this.extractRole(filePath, titlePath);
    if (role !== 'Unspecified') return role;
    return process.env.BANK ? process.env.BANK.toUpperCase() : 'Unspecified';
  }

  extractStructuredSteps(result) {
    const structured = [];
    const cleanText = (text) => String(text || '')
      .replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, '')
      .trim();
    let hasFailedStep = false;

    const visit = (steps, parentTestStep = null) => {
      for (const step of steps || []) {
        const category = step.category || '';
        const children = step.steps || [];
        let currentTestStep = parentTestStep;

        if (category === 'test.step') {
          const error = step.error ? cleanText(step.error.message) : null;
          currentTestStep = {
            title: error
              ? `❌ FAILED: ${cleanText(step.title)} — ${error.split('\n')[0]}`
              : cleanText(step.title),
            durationMs: step.duration || 0,
            error,
            technicalProof: [],
          };
          structured.push(currentTestStep);
          if (error && !children.length) hasFailedStep = true;
        } else if (category === 'pw:api' || category === 'expect') {
          const error = step.error ? cleanText(step.error.message) : null;
          const subtitle = cleanText(step.subtitle);
          const title = [cleanText(step.title), subtitle].filter(Boolean).join(' — ');
          if (error) hasFailedStep = true;

          if (parentTestStep) {
            parentTestStep.technicalProof.push({
              action: error ? `❌ FAILED: ${title} — ${error.split('\n')[0]}` : title,
              durationMs: step.duration || 0,
            });
          } else {
            structured.push({
              title: error ? `❌ FAILED: ${title} — ${error.split('\n')[0]}` : title,
              durationMs: step.duration || 0,
              error,
              technicalProof: [],
            });
          }
        }

        if (children.length) visit(children, currentTestStep);
      }
    };

    visit(result.steps);

    if (structured.length === 0) {
      const errorMessage = cleanText(result.error && result.error.message);
      const firstErrorLine = errorMessage.split('\n').find((line) => line.trim()) || '';
      structured.push({
        title: firstErrorLine
          ? `❌ FAILED: ${firstErrorLine}`
          : 'No Playwright workflow steps were recorded',
        durationMs: result.duration || 0,
        error: errorMessage || null,
        technicalProof: [],
      });
      hasFailedStep = Boolean(errorMessage);
    }

    if ((result.status === 'failed' || result.status === 'timedOut') && result.error && !hasFailedStep) {
      const errorMessage = cleanText(result.error.message);
      const errorMsg = errorMessage.split('\n').find((line) => line.trim()) || 'Unknown Error';
      structured.push({
        title: `❌ FAILED: ${errorMsg}`,
        durationMs: 0,
        error: errorMessage,
        technicalProof: [],
      });
    }

    return structured;
  }

  generateExcelReport(data) {
    const excelRows = data.tests.map((t, idx) => {
      const stepText = t.steps.length > 0
        ? t.steps.map((s, sIdx) => {
            return `Step ${sIdx + 1}: ${s.title}`;
          }).join('\n')
        : 'Steps executed in background flow';

      const screenshotCell = t.primaryScreenshot
        ? t.primaryScreenshot
        : (t.attachments.length > 0 ? 'Embedded in HTML Report' : 'N/A');

      return {
        'S.No': idx + 1,
        'TC ID': t.tcId,
        'Portal': t.portal,
        'User Name': t.userName,
        'Module': t.module,
        'Test Case Title': t.title,
        'Status': t.knownDefect ? 'PASSED (KNOWN DEFECT)' : t.status.toUpperCase(),
        'Duration (s)': (t.durationMs / 1000).toFixed(2),
        'Execution Workflow Steps': stepText,
        'Failure Reason': t.error ? t.error.message : 'N/A',
        'Screenshot Artifact Path': screenshotCell,
        'File Location': t.location,
        'Last Executed': t.executedAt ? new Date(t.executedAt).toLocaleString() : 'N/A',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    
    worksheet['!cols'] = [
      { wch: 6 },  // S.No
      { wch: 14 }, // TC ID
      { wch: 10 }, // Portal
      { wch: 20 }, // User Name
      { wch: 22 }, // Module
      { wch: 48 }, // Title
      { wch: 12 }, // Status
      { wch: 12 }, // Duration
      { wch: 65 }, // Steps
      { wch: 40 }, // Failure Reason
      { wch: 35 }, // Screenshot Path
      { wch: 30 }, // Location
      { wch: 22 }, // Last Executed
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'QA Execution Summary');
    try {
      XLSX.writeFile(workbook, this.excelFile);
    } catch (error) {
      // Windows locks the file while it is open in Excel; keep the run's
      // results by writing a timestamped copy instead of failing the report.
      if (error.code !== 'EBUSY' && error.code !== 'EPERM') throw error;
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      this.excelFile = path.join(this.outputDir, `Test_Execution_Report_${stamp}.xlsx`);
      XLSX.writeFile(workbook, this.excelFile);
      console.log(`\n\x1b[33m[NexusHtmlReporter] Test_Execution_Report.xlsx is open elsewhere; saved to ${this.excelFile} instead.\x1b[0m`);
    }
  }

  autoOpenReport() {
    try {
      if (process.platform === 'win32') {
        exec(`cmd.exe /c start "" "${this.outputFile}"`);
      } else if (process.platform === 'darwin') {
        exec(`open "${this.outputFile}"`);
      } else {
        exec(`xdg-open "${this.outputFile}"`);
      }
    } catch {
      // Ignore open errors
    }
  }

  generateHtmlReport(data) {
    const passedPct = data.total > 0 ? Math.round((data.passed / data.total) * 100) : 0;
    const failedPct = data.total > 0 ? Math.round((data.failed / data.total) * 100) : 0;
    const jsonStr = JSON.stringify(data).replace(/</g, '\\u003c');

    return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QA Automation Report</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-color: #090D16;
      --card-bg: #111827;
      --card-border: #1E293B;
      --text-main: #F8FAFC;
      --text-muted: #94A3B8;
      --accent-pass: #10B981;
      --accent-fail: #EF4444;
      --accent-skip: #F59E0B;
      --accent-primary: #6366F1;
      --accent-secondary: #0EA5E9;
      --border-radius: 16px;
      --font-sans: 'Plus Jakarta Sans', sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }

    [data-theme="light"] {
      --bg-color: #F1F5F9;
      --card-bg: #FFFFFF;
      --card-border: #E2E8F0;
      --text-main: #0F172A;
      --text-muted: #64748B;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg-color);
      color: var(--text-main);
      font-family: var(--font-sans);
      padding: 32px 24px;
      min-height: 100vh;
      transition: background-color 0.3s ease, color 0.3s ease;
    }

    .container {
      max-width: 1320px;
      margin: 0 auto;
    }

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--card-border);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .brand-badge {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      background: linear-gradient(135deg, #6366F1, #0EA5E9);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 800;
      font-size: 20px;
      box-shadow: 0 10px 25px rgba(99, 102, 241, 0.35);
    }

    .brand-title {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .btn-action {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 10px 20px;
      cursor: pointer;
      color: var(--text-main);
      font-weight: 700;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s ease;
      text-decoration: none;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .btn-action:hover {
      border-color: var(--accent-primary);
      transform: translateY(-2px);
    }

    .metrics-row {
      display: grid;
      grid-template-columns: 240px repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }

    .gauge-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: var(--border-radius);
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    .gauge-circle {
      position: relative;
      width: 100px;
      height: 100px;
    }
    .gauge-circle svg {
      width: 100px;
      height: 100px;
      transform: rotate(-90deg);
    }
    .gauge-circle circle {
      fill: none;
      stroke-width: 8;
      stroke-linecap: round;
    }
    .gauge-bg { stroke: rgba(255, 255, 255, 0.08); }
    .gauge-fill {
      stroke: var(--accent-pass);
      stroke-dasharray: 283;
      stroke-dashoffset: ${283 - (283 * passedPct) / 100};
      transition: stroke-dashoffset 1s ease-in-out;
    }
    .gauge-val {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      font-weight: 800;
      color: var(--accent-pass);
    }

    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: var(--border-radius);
      padding: 24px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }
    .stat-card::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px;
    }
    .stat-card.total::before { background: var(--accent-primary); }
    .stat-card.pass::before { background: var(--accent-pass); }
    .stat-card.fail::before { background: var(--accent-fail); }
    .stat-card.time::before { background: var(--accent-secondary); }

    .stat-label {
      color: var(--text-muted);
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .stat-num {
      font-size: 38px;
      font-weight: 800;
      margin-top: 6px;
      letter-spacing: -1px;
    }
    .stat-pass-num { color: var(--accent-pass); }
    .stat-fail-num { color: var(--accent-fail); }

    .controls-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: var(--border-radius);
      padding: 18px 24px;
      margin-bottom: 28px;
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      align-items: center;
    }

    .search-input {
      flex: 1;
      min-width: 250px;
      background: var(--bg-color);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 12px 18px;
      color: var(--text-main);
      font-family: var(--font-sans);
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
    }
    .search-input:focus { border-color: var(--accent-primary); }

    .select-dropdown {
      background: var(--bg-color);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 12px 18px;
      color: var(--text-main);
      font-family: var(--font-sans);
      font-size: 14px;
      font-weight: 600;
      outline: none;
      cursor: pointer;
    }
    .select-dropdown option {
      background: var(--card-bg);
      color: var(--text-main);
    }

    .filter-group { display: flex; gap: 10px; }
    .filter-btn {
      background: var(--bg-color);
      border: 1px solid var(--card-border);
      border-radius: 10px;
      padding: 10px 18px;
      cursor: pointer;
      font-weight: 700;
      font-size: 13px;
      color: var(--text-muted);
      transition: all 0.2s ease;
    }
    .filter-btn.active {
      background: var(--accent-primary);
      border-color: var(--accent-primary);
      color: white;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }

    .test-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: var(--border-radius);
      margin-bottom: 20px;
      overflow: hidden;
      transition: all 0.2s ease;
    }
    .test-card:hover {
      border-color: rgba(99, 102, 241, 0.4);
    }

    .test-header {
      padding: 20px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      user-select: none;
    }
    .test-main-info {
      display: flex;
      align-items: center;
      gap: 14px;
      flex: 1;
      flex-wrap: wrap;
    }

    .badge-status {
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .status-passed { background: rgba(16, 185, 129, 0.15); color: var(--accent-pass); border: 1px solid rgba(16, 185, 129, 0.3); }
    .status-failed { background: rgba(239, 68, 68, 0.15); color: var(--accent-fail); border: 1px solid rgba(239, 68, 68, 0.3); }
    .status-skipped { background: rgba(245, 158, 11, 0.15); color: var(--accent-skip); border: 1px solid rgba(245, 158, 11, 0.3); }

    .tag-portal {
      background: rgba(14, 165, 233, 0.12);
      color: var(--accent-secondary);
      padding: 5px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      border: 1px solid rgba(14, 165, 233, 0.25);
    }
    .tag-user {
      background: rgba(16, 185, 129, 0.12);
      color: var(--accent-pass, #10b981);
      padding: 5px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      border: 1px solid rgba(16, 185, 129, 0.25);
    }
    .tag-module {
      background: rgba(99, 102, 241, 0.12);
      color: var(--accent-primary);
      padding: 5px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      border: 1px solid rgba(99, 102, 241, 0.25);
    }

    .test-title { font-size: 16px; font-weight: 700; }
    .test-duration { font-family: var(--font-mono); font-size: 14px; color: var(--text-muted); }

    .test-body {
      padding: 0 24px 24px 24px;
      display: none;
      border-top: 1px solid var(--card-border);
      background: rgba(0, 0, 0, 0.15);
    }
    .test-card.open .test-body { display: block; }

    .section-label {
      font-size: 13px;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.6px;
      margin: 22px 0 12px 0;
    }

    .steps-timeline {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .step-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 16px;
    }
    .step-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .step-left { display: flex; align-items: center; gap: 14px; }
    .step-num {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: rgba(99, 102, 241, 0.2);
      color: var(--accent-primary);
      font-size: 13px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .step-title-text { font-size: 14px; font-weight: 700; }
    .step-time-badge { font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); }

    .proof-toggle {
      margin-top: 10px;
      font-size: 12px;
      font-weight: 700;
      color: var(--accent-secondary);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      user-select: none;
    }
    .proof-toggle:hover { text-decoration: underline; }

    .proof-content {
      margin-top: 10px;
      background: var(--bg-color);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 12px;
      font-family: var(--font-mono);
      font-size: 12px;
      display: none;
    }
    .proof-step-line {
      padding: 4px 0;
      border-bottom: 1px dashed rgba(255,255,255,0.06);
      display: flex;
      justify-content: space-between;
    }
    .proof-step-line:last-child { border-bottom: none; }

    .error-card {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 12px;
      padding: 18px;
      margin-top: 16px;
      font-family: var(--font-mono);
      font-size: 13px;
      color: #FCA5A5;
      white-space: pre-wrap;
      overflow-x: auto;
    }

    .evidence-gallery {
      margin-top: 16px;
    }
    .screenshot-img {
      width: 100%;
      max-width: 900px;
      border-radius: 12px;
      border: 1px solid var(--card-border);
      margin-top: 12px;
      box-shadow: 0 12px 30px rgba(0,0,0,0.4);
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">
        <div class="brand-badge">QA</div>
        <div>
          <div class="brand-title">QA Automation Report</div>
          <div style="font-size: 13px; color: var(--text-muted); margin-top: 2px;">BOB BBPS • Execution Proof & Verification Catalog</div>
        </div>
      </div>
      <div class="header-actions">
        <a class="btn-action" href="Test_Execution_Report.xlsx" download>
          📊 Download Excel Report (.xlsx)
        </a>
        <button class="btn-action" onclick="toggleTheme()">
          🌓 Switch Theme
        </button>
      </div>
    </header>

    <div class="metrics-row">
      <div class="gauge-card">
        <div class="gauge-circle">
          <svg viewBox="0 0 100 100">
            <circle class="gauge-bg" cx="50" cy="50" r="45" />
            <circle class="gauge-fill" cx="50" cy="50" r="45" />
          </svg>
          <div class="gauge-val">${passedPct}%</div>
        </div>
        <div style="font-size: 12px; font-weight: 700; color: var(--text-muted); margin-top: 10px;">PASS RATE</div>
      </div>

      <div class="stat-card total">
        <div class="stat-label">Total Test Cases</div>
        <div class="stat-num">${data.total}</div>
      </div>
      <div class="stat-card pass">
        <div class="stat-label">Passed Tests</div>
        <div class="stat-num stat-pass-num">${data.passed}</div>
      </div>
      <div class="stat-card fail">
        <div class="stat-label">Failed Tests</div>
        <div class="stat-num stat-fail-num">${data.failed}</div>
      </div>
      <div class="stat-card time">
        <div class="stat-label">Total Execution Time</div>
        <div class="stat-num" style="font-size: 30px;">${(data.durationMs / 1000).toFixed(1)}s</div>
      </div>
    </div>

    <div class="controls-card">
      <input type="text" class="search-input" id="search-input" placeholder="🔍 Search test cases by title, TC ID, module, user name, or portal..." oninput="filterTests()">
      
      <select class="select-dropdown" id="module-filter" onchange="filterTests()">
        <option value="all">📂 All Modules</option>
      </select>

      <div class="filter-group">
        <button class="filter-btn active" onclick="setFilter('all', this)">All Status</button>
        <button class="filter-btn" onclick="setFilter('passed', this)">Passed</button>
        <button class="filter-btn" onclick="setFilter('failed', this)">Failed</button>
      </div>
    </div>

    <div id="tests-container"></div>
  </div>

  <script>
    const reportData = ${jsonStr};
    let activeFilter = 'all';

    function toggleTheme() {
      const current = document.documentElement.getAttribute('data-theme');
      const target = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', target);
    }

    function populateModuleFilter() {
      const moduleSelect = document.getElementById('module-filter');
      const uniqueModules = [...new Set(reportData.tests.map(t => t.module))].sort();
      uniqueModules.forEach(mod => {
        const opt = document.createElement('option');
        opt.value = mod;
        opt.innerText = '📁 ' + mod;
        moduleSelect.appendChild(opt);
      });
    }

    function setFilter(filter, btn) {
      activeFilter = filter;
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterTests();
    }

    function toggleCard(card) {
      card.classList.toggle('open');
    }

    function toggleProof(elem, evt) {
      evt.stopPropagation();
      const content = elem.nextElementSibling;
      if (content.style.display === 'block') {
        content.style.display = 'none';
        elem.innerText = '🔍 View Technical Action Proof (' + elem.getAttribute('data-count') + ' DOM Events)';
      } else {
        content.style.display = 'block';
        elem.innerText = '🔼 Hide Technical Action Proof';
      }
    }

    function renderTests() {
      const container = document.getElementById('tests-container');
      const query = (document.getElementById('search-input').value || '').toLowerCase();
      const selectedModule = document.getElementById('module-filter').value;

      const filtered = reportData.tests.filter(t => {
        const matchesFilter = activeFilter === 'all' || t.status === activeFilter;
        const matchesModule = selectedModule === 'all' || t.module === selectedModule;
        const matchesQuery = !query || 
          t.title.toLowerCase().includes(query) ||
          t.portal.toLowerCase().includes(query) ||
          (t.userName || '').toLowerCase().includes(query) ||
          t.module.toLowerCase().includes(query) ||
          t.tcId.toLowerCase().includes(query);
        return matchesFilter && matchesModule && matchesQuery;
      });

      if (filtered.length === 0) {
        container.innerHTML = '<div class="test-card" style="padding: 36px; text-align: center; color: var(--text-muted);">No test cases match the active filter criteria.</div>';
        return;
      }

      container.innerHTML = filtered.map((t, idx) => {
        const statusClass = t.status === 'passed' ? 'status-passed' : (t.status === 'failed' ? 'status-failed' : 'status-skipped');
        const durationSec = (t.durationMs / 1000).toFixed(1);

        const stepsHtml = t.steps.length > 0 ? t.steps.map((s, sIdx) => {
          const proofLines = (s.technicalProof || []).map(p => \`
            <div class="proof-step-line">
              <span>\${escapeHtml(p.action)}</span>
              <span style="color: var(--text-muted);">\${p.durationMs}ms</span>
            </div>
          \`).join('');

          const proofToggleHtml = s.technicalProof && s.technicalProof.length > 0 ? \`
            <div class="proof-toggle" data-count="\${s.technicalProof.length}" onclick="toggleProof(this, event)">
              🔍 View Technical Action Proof (\${s.technicalProof.length} DOM Events)
            </div>
            <div class="proof-content">
              \${proofLines}
            </div>
          \` : '';

          return \`
            <div class="step-card">
              <div class="step-header-row">
                <div class="step-left">
                  <div class="step-num">\${sIdx + 1}</div>
                  <div class="step-title-text">\${escapeHtml(s.title)}</div>
                </div>
                <div class="step-time-badge">\${s.durationMs}ms</div>
              </div>
              \${proofToggleHtml}
            </div>
          \`;
        }).join('') : '<div style="font-size: 13px; color: var(--text-muted); padding: 10px;">Steps executed in background flow.</div>';

        const errorHtml = t.error ? \`
          <div class="section-label" style="color: var(--accent-fail);">Failure Diagnostics & Stack Trace:</div>
          <div class="error-card">
            <strong>Error Message:</strong> \${escapeHtml(t.error.message)}\n\n\${escapeHtml(t.error.stack)}
          </div>
        \` : '';

        const attachmentHtml = t.attachments.map(att => {
          if (att.base64) {
            return \`
              <div class="evidence-gallery">
                <div class="section-label">Execution Proof Screenshot:</div>
                <img class="screenshot-img" src="\${att.base64}" alt="\${att.name}" />
              </div>
            \`;
          }
          return '';
        }).join('');

        return \`
          <div class="test-card" id="test-\${idx}">
            <div class="test-header" onclick="toggleCard(this.parentElement)">
              <div class="test-main-info">
                <span class="badge-status \${statusClass}">\${t.status}</span>
                \${t.knownDefect ? '<span class="badge-status status-failed" title="The test is marked test.fail: the defect is still present">known defect</span>' : ''}
                <span class="tag-portal">\${escapeHtml(t.portal)}</span>
                <span class="tag-user">👤 \${escapeHtml(t.userName)}</span>
                <span class="tag-module">\${escapeHtml(t.module)}</span>
                <span class="test-title">\${escapeHtml(t.title)}</span>
              </div>
              <div class="test-duration">\${durationSec}s</div>
            </div>
            <div class="test-body">
              <div style="font-size: 12px; color: var(--text-muted); margin-top: 16px; font-family: var(--font-mono);">
                File: \${escapeHtml(t.location)} &nbsp;·&nbsp; Last executed: \${escapeHtml(t.executedAt ? new Date(t.executedAt).toLocaleString() : 'N/A')}
              </div>
              \${errorHtml}
              <div class="section-label">Test Execution Steps & Verification:</div>
              <div class="steps-timeline">
                \${stepsHtml}
              </div>
              \${attachmentHtml}
            </div>
          </div>
        \`;
      }).join('');
    }

    function filterTests() {
      renderTests();
    }

    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    document.addEventListener('DOMContentLoaded', () => {
      populateModuleFilter();
      renderTests();
    });
  </script>
</body>
</html>`;
  }
}
