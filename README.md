# Profesia.sk Job Crawler

This project is an Apify/Crawlee-based crawler for extracting job offers from [Profesia.sk](https://www.profesia.sk/). It is designed for efficiency, reliability, and easy configuration.

## Architecture Overview

The crawling process is **split into two main parts**:

1. **URL Gathering:**  
   The crawler first collects URLs of individual job offers to be processed. When searching for new pages to crawl, it prioritizes the "next page" arrow at the bottom of the listing. This approach avoids following all job offer links on the listing page, which would otherwise cause duplication and waste resources—especially noticeable in smaller crawls (under 1000 listing pages).

2. **Job Detail Download & Extraction:**  
   After gathering URLs, the crawler downloads only the HTML of each job offer page (not all assets), which is much faster. It then parses the HTML to extract all required job information.

## Features

- **Efficient Pagination:**  
  Only the "next" arrow is followed for pagination if possible, minimizing duplicate work and unnecessary requests in smaller crawls (under 1000 job listing pages).
- **Enqueue Counter:**  
  An enqueue counter ensures that once the maximum number of pages is reached, the crawler stops looking for more URLs. This prevents slowdowns in large crawls.
- **De-duplication:**  
  Jobs are de-duplicated by both `jobId`.
- **Validation:**  
  Only valid job records are saved.
- **Configurable:**  
  All important parameters (start URL, concurrency, max pages, etc.) are set via `.env`.
- **Summary Reporting:**  
  After the crawl, a summary report is printed (counts, top locations, tags, etc.).
- **Respect for robots.txt:**  
  The crawler checks and respects robots.txt rules before crawling.
- **Graceful Stop:**  
  You can gracefully stop the crawler by writing `stop` to the `stop.txt` file. This is a nicer alternative to pressing Ctrl+C, as it allows the crawler to finish its current work and print the final statistics—useful for testing or ending a large run without losing results.

## Data Output

- **Apify Dataset:**  
  All jobs are saved in an Apify dataset, which is cleared and recreated at the start of each crawl.
- **Exported Files:**  
  After crawling, jobs are exported to both `jobs.json` and `jobs.csv` in the `output` directory.

## Usage

### Requirements

- Node.js 18+

### Setup & Running

1. Install dependencies:
   ```sh
   npm i
   ```
2. Configure parameters in `.env` (see `.env.example` for options like `START_URL`, `CONCURRENCY`, `MAX_PAGES`, etc.).
3. Start the crawler:
   ```sh
   npm start
   ```
   The crawler will use the parameters from your `.env` file.

4. To gracefully stop the crawler, write the word `stop` (lowercase) into the `stop.txt` file in the project root.  
   This will let the crawler finish its current work and print the summary, instead of killing the process with Ctrl+C.  
   **Note:** The `stop.txt` file is in `.gitignore` and will be created automatically (and formatted if it exists) when you run the crawler, so you do not need to create it yourself.

### Testing

Run all tests with:
```sh
npm test
```

## Output

- Results are saved in the Apify dataset (reset and formatted at the start of each crawl if it exists).
- After the crawl, jobs are exported to:
  - `./output/jobs.json`
  - `./output/jobs.csv`

## Assignment Fields Extracted

- `jobTitle`, `companyName`, `location`
- `salaryMin`, `salaryMax`, `salaryCurrency`, `salaryPeriod`
- `employmentType`, `seniority`
- `tags` (skills)
- `postedAt` (ISO date)
- `jobId`, `jobUrl`, `companyUrl`
- `description` (plain text, no HTML)

## Notes

- Normally, I do not submit assignments as a single large commit. For this project, I wanted to present a clean and    structured solution, so I avoided pushing my initial trials, errors, and early concepts that did not meet my standards.
- The crawler only accesses public pages and respects robots.txt and the site's Terms of Service.

---

**Author:** Dominik Haspra