/**
 * Reporter class for collecting and summarizing crawl statistics.
 * Tracks jobs, duplicates, failures, locations, tags, companies, salaries, and employment types.
 * Provides methods to add stats and print a summary report at the end.
 */
class Reporter {
  /**
   * Initializes counters and data holders for reporting.
   */
  constructor(config = {}) {
    this.totalJobs = 0;
    this.duplicates = 0;
    this.failed = 0;
    this.locations = {};
    this.tags = {};
    this.companies = {};
    this.salaries = [];
    this.employmentTypes = {};
    this.startTime = null;
    this.endTime = null;
    this.failedUrls = [];
    this.config = config;
  }

  /**
   * Start timer for crawl duration.
   */
  startTimer() {
    this.startTime = Date.now();
  }

  /**
   * End timer for crawl duration.
   */
  endTimer() {
    this.endTime = Date.now();
  }

  /**
   * Add a successfully processed job and update stats.
   */
  addJob(job) {
    this.totalJobs++;
    // Track location counts
    if (job.location) {
      this.locations[job.location] = (this.locations[job.location] || 0) + 1;
    }
    // Track tag/skill counts
    if (Array.isArray(job.tags)) {
      for (const tag of job.tags) {
        this.tags[tag] = (this.tags[tag] || 0) + 1;
      }
    }
    // Track company counts
    if (job.companyName) {
      this.companies[job.companyName] = (this.companies[job.companyName] || 0) + 1;
    }
    // Track salary info
    if (typeof job.salaryMin === 'number' && typeof job.salaryMax === 'number') {
      this.salaries.push({
        min: job.salaryMin,
        max: job.salaryMax,
        currency: job.salaryCurrency,
        period: job.salaryPeriod,
      });
    }
    // Track employment type counts
    if (job.employmentType) {
      this.employmentTypes[job.employmentType] = (this.employmentTypes[job.employmentType] || 0) + 1;
    }
  }

  /**
   * Increment duplicate counter.
   */
  addDuplicate() {
    this.duplicates++;
  }

  /**
   * Increment failed counter and store failed URL.
   */
  addFailed(url = null) {
    this.failed++;
    if (url) this.failedUrls.push(url);
  }

  /**
   * Print a summary report of the crawl.
   */
  printSummary() {
    // Calculate crawl duration
    const duration = this.startTime && this.endTime
      ? ((this.endTime - this.startTime) / 1000).toFixed(2)
      : null;

    console.log('\n--- CRAWL SUMMARY REPORT ---\n');
    if (duration) {
      console.log(`Crawl duration: ${duration} seconds`);
    }
    console.log(`Total jobs processed: ${this.totalJobs}`);
    console.log(`Duplicates skipped: ${this.duplicates}`);
    console.log(`Failed/invalid jobs: ${this.failed}`);

    // Print top 5 locations
    const topLocations = Object.entries(this.locations)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    console.log('\nTop locations:');
    for (const [loc, count] of topLocations) {
      console.log(`  ${loc}: ${count}`);
    }

    // Print top 5 tags/skills
    const topTags = Object.entries(this.tags)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    console.log('\nTop tags:');
    for (const [tag, count] of topTags) {
      console.log(`  ${tag}: ${count}`);
    }

    // Print top 5 companies
    const topCompanies = Object.entries(this.companies)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    console.log('\nTop companies:');
    for (const [company, count] of topCompanies) {
      console.log(`  ${company}: ${count}`);
    }

    // Print salary statistics
    if (this.salaries.length > 0) {
      const minSalaries = this.salaries.map(s => s.min);
      const maxSalaries = this.salaries.map(s => s.max);
      const avgMin = (minSalaries.reduce((a, b) => a + b, 0) / minSalaries.length).toFixed(2);
      const avgMax = (maxSalaries.reduce((a, b) => a + b, 0) / maxSalaries.length).toFixed(2);
      const currency = this.salaries[0].currency || '';
      const period = this.salaries[0].period || '';
      console.log(`\nSalary stats:`);
      console.log(`  Jobs with salary info: ${this.salaries.length}`);
      console.log(`  Average min: ${avgMin} ${currency} / ${period}`);
      console.log(`  Average max: ${avgMax} ${currency} / ${period}`);
    } else {
      console.log('\nSalary stats:');
      console.log('  No salary info available.');
    }

    // Print top 3 employment types
    const topEmploymentTypes = Object.entries(this.employmentTypes)
      .sort((a, b) => b[1] - a[1])
      .filter(([type, count]) => type && count > 0)
      .slice(0, 3);

    if (topEmploymentTypes.length > 0) {
      console.log('\nTop employment types:');
      for (const [type, count] of topEmploymentTypes) {
        console.log(`  ${type}: ${count}`);
      }
    } else {
      console.log('\nTop employment types:');
      console.log('  No employment type data available.');
    }

    // Print unique counts
    console.log(`\nUnique locations: ${Object.keys(this.locations).length}`);
    console.log(`Unique tags: ${Object.keys(this.tags).length}`);
    console.log(`Unique companies: ${Object.keys(this.companies).length}`);

    // Print up to 5 failed URLs
    if (this.failedUrls.length) {
      console.log('\nFailed job URLs (first 5):');
      this.failedUrls.slice(0, 5).forEach(url => console.log(`  ${url}`));
    }

    console.log('---------------------------\n');
  }
}

export default Reporter;