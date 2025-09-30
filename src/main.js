import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import { gotScraping } from 'got-scraping';
import { PuppeteerCrawler } from 'crawlee';
import { Dataset } from 'apify';
import ProfesiaAdapter from './adapters/profesiaAdapter.js';
import { exportJobs } from './utils/exporter.js';
import { RobotsChecker } from './utils/robotsChecker.js';
import Reporter from './utils/reporter.js';

// --- Config and Helpers ---

const VERBOSE = process.env.VERBOSE === 'true';
function vLog(...args) {
  if (VERBOSE) console.log(...args);
}

const config = {
  start_url: process.env.START_URL || 'https://www.profesia.sk/',
  concurrency: Number.parseInt(process.env.CONCURRENCY) || 2,
  max_pages: Number.parseInt(process.env.MAX_PAGES) || 4,
  output_dir: process.env.OUTPUT_DIR || 'output',
  max_requests_per_minute: Number.parseInt(process.env.MAX_REQUESTS_PER_MINUTE) || 100,
  max_request_retries: Number.parseInt(process.env.MAX_REQUEST_RETRIES) || 3,
  request_handler_timeout_secs: Number.parseInt(process.env.REQUEST_HANDLER_TIMEOUT_SECS) || 60,
};

// --- Utility Functions ---

/**
 * Clean or create the output directory.
 */
function prepareOutputDirectory(outputDir) {
  if (fs.existsSync(outputDir)) {
    fs.readdirSync(outputDir).forEach(file => {
      fs.unlinkSync(path.join(outputDir, file));
    });
  } else {
    fs.mkdirSync(outputDir, { recursive: true });
  }
}

/**
 * Prepare and clear the dataset.
 */
async function prepareDataset(datasetName) {
  let dataset = await Dataset.open(datasetName);
  await dataset.drop();
  return await Dataset.open(datasetName);
}

/**
 * Setup stop.txt watcher to gracefully stop the crawler.
 */
function setupStopFileWatcher(crawler, stopFile = 'stop.txt') {
  fs.writeFileSync(stopFile, '', 'utf-8');
  const interval = setInterval(async () => {
    if (fs.existsSync(stopFile)) {
      const content = fs.readFileSync(stopFile, 'utf-8').trim();
      if (content.toLowerCase() === 'stop') {
        vLog('Detected "stop" in stop.txt. Stopping crawler...');
        await crawler.teardown();
        clearInterval(interval);
      }
    }
  }, 2000);
  return interval;
}

/**
 * Create and configure the PuppeteerCrawler.
 */
function createCrawler({ config, profesiaAdapter, jobIdSet, robotsChecker, gotScraping, dataset, reporter, visitedUrls, enqueuedCount }) {
  return new PuppeteerCrawler({
    async requestHandler({ page, request, enqueueLinks }) {
      vLog(`Visited ${request.url}`);
      visitedUrls.add(request.url);

      await profesiaAdapter.processJobsOnPage({
        page,
        jobIdSet,
        robotsChecker,
        gotScraping,
        dataset,
        reporter
      });

      if (enqueuedCount.value >= config.max_pages) {
        vLog(`Reached max pages limit of ${config.max_pages}`);
        return;
      }

      await profesiaAdapter.enqueueNextPages({
        page,
        robotsChecker,
        enqueueLinks,
        visitedUrls,
        enqueuedCount,
        config,
        vLog
      });

      vLog('Closed request:', request.url);
    },
    maxConcurrency: config.concurrency,
    maxRequestsPerCrawl: config.max_pages,
    maxRequestsPerMinute: config.max_requests_per_minute,
    maxRequestRetries: config.max_request_retries,
    requestHandlerTimeoutSecs: config.request_handler_timeout_secs,
    headless: true,
  });
}

// --- Main Execution ---

async function main() {
  // Prepare output and dataset
  prepareOutputDirectory(config.output_dir);
  let dataset = await prepareDataset('profesia-jobs');

  // State holders
  const jobIdSet = new Set();
  const visitedUrls = new Set();
  const robotsChecker = new RobotsChecker();
  const profesiaAdapter = new ProfesiaAdapter();
  const reporter = new Reporter(config);
  const enqueuedCount = { value: 0 };

  // Create crawler
  const crawler = createCrawler({
    config,
    profesiaAdapter,
    jobIdSet,
    robotsChecker,
    gotScraping,
    dataset,
    reporter,
    visitedUrls,
    enqueuedCount
  });

  // Setup stop.txt watcher
  setupStopFileWatcher(crawler);

  try {
    vLog('Starting the crawl...\n');
    vLog(`Configuration: ${JSON.stringify(config)}`);

    reporter.startTimer();

    await robotsChecker.logRobotsInfo(config.start_url);

    const isAllowed = await robotsChecker.isAllowed(config.start_url);
    if (!isAllowed) {
      console.error(`Crawling disallowed by robots.txt: ${config.start_url}`);
      process.exit(1);
    }

    await crawler.run([config.start_url]);

    const jobs = await dataset.getData();
    exportJobs(jobs.items, config.output_dir);

    reporter.endTimer();
    reporter.printSummary();

    process.exit(0);
  } catch (error) {
    console.error('Error during crawling:', error);
    process.exit(1);
  }
}

// --- Start ---
main();
