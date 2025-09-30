import parseProfesia from "../utils/parsers/profesiaParser.js";
import { isValid } from "../utils/validator.js";
/**
Adapter for crawling and parsing jobs from Profesia.sk
*/
class ProfesiaAdapter {
  /**
  Parses job detail HTML and returns structured job data
  */
  parse(html, jobId, jobUrl) {
    return parseProfesia(html, jobId, jobUrl);
  }

  /**
  Processes all job links on a listing page:
  - Extracts job links
  - Checks robots.txt permission
  - De-dupes by jobId
  - Fetches and parses job detail
  - Validates and saves job data
  - Reports stats to Reporter 
  */
  async processJobsOnPage({ page, jobIdSet, robotsChecker, gotScraping, dataset, reporter }) {
    const jobs = await page.$$eval('li.list-row h2 a', links =>
      links.map(a => ({
        id: a.id || null,
        url: a.href || null,
      }))
    );

    await Promise.all(
      jobs.map(async job => {
        // Skip if missing URL/ID or not allowed by robots.txt
        if (!job.url || !job.id || ! await robotsChecker.isAllowed(job.url)) {
          reporter.addFailed(job.url);
          return;
        }
        // Skip if duplicate
        if (jobIdSet.has(job.id)) {
          reporter.addDuplicate();
          return;
        }

        jobIdSet.add(job.id);
        try {
          // Fetch job detail and parse
          const response = await gotScraping(job.url);
          const html = response.body;
          const jobData = this.parse(html, job.id, job.url);
          // Validate and save
          if (isValid(jobData)) {
            reporter.addJob(jobData);
            await dataset.pushData(jobData);
          }
        } catch (err) {
          reporter.addFailed(job.url);
          console.error(`Failed to process job ${job.url}:`, err);
        }
      })
    );
  }

  /**
  Finds and enqueues next listing pages:
  - Tries to find "next" page link and enqueue it if allowed
  - Otherwise, finds all offer links and enqueues allowed ones, respecting max_pages
  */
  async enqueueNextPages({ page, robotsChecker, enqueueLinks, visitedUrls, enqueuedCount, config, vLog }) {
    const nextUrl = await page.$eval('li > a.next', a => a.href).catch(() => null);
    if (nextUrl && await robotsChecker.isAllowed(nextUrl)) {
      enqueuedCount.value++;
      await enqueueLinks({
        urls: [nextUrl],
      });
    } else {
      // Get all offer links with 'praca' in href and no id
      const offerLinks = await page.$$eval('a', links =>
        links
          .filter(a => a.href && a.href.includes('praca') && !a.href.includes('detail') && !a.id)
          .map(a => a.href)
      );

      // Check robots.txt and enqueue each allowed link
      for (const href of offerLinks) {
        if (enqueuedCount.value >= config.max_pages) {
          vLog && vLog(`Reached max pages limit of ${config.max_pages}, not enqueuing more links.`);
          break;
        }
        if (!visitedUrls.has(href) && await robotsChecker.isAllowed(href)) {
          visitedUrls.add(href);
          enqueuedCount.value++;
          await enqueueLinks({ urls: [href] });
        }
      }
    }
  }
}

export default ProfesiaAdapter;
