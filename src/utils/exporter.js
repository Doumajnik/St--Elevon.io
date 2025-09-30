import fs from 'fs';
import path from 'path';

/**
 * Cleans job fields by removing newlines and extra spaces.
 * Returns a new array of cleaned job objects.
 */
function cleanJobs(jobs) {
  return jobs.map(job => {
    const cleaned = {};
    for (const key in job) {
      let val = job[key] ?? '';
      val = String(val)
        .replace(/[\r\n]+/g, ' ')
        .replace(/\s\s+/g, ' ')
        .trim();
      cleaned[key] = val;
    }
    return cleaned;
  });
}

/**
 * Exports jobs to both JSON and CSV files in the output directory.
 */
export function exportJobs(jobs, outputDir) {
  const cleanedJobs = cleanJobs(jobs);
  exportJobToJson(cleanedJobs, outputDir);
  exportJobsToCsv(cleanedJobs, outputDir);
}

/**
 * Overwrites jobs.json with the provided jobs array.
 */
export function exportJobToJson(jobs, outputDir) {
  const filePath = path.join(outputDir, 'jobs.json');
  fs.writeFileSync(filePath, JSON.stringify(jobs, null, 2), 'utf-8');
}

/**
 * Exports jobs to jobs.csv in the output directory.
 */
export function exportJobsToCsv(jobs, outputDir) {
  const filePath = path.join(outputDir, 'jobs.csv');

  if (!jobs || jobs.length === 0) {
    fs.writeFileSync(filePath, '');
    console.log('No jobs to export to CSV.');
    return;
  }

  const headers = Object.keys(jobs[0]);
  const csvRows = [
    headers.join(','), // header row
    ...jobs.map(job =>
      headers.map(h => {
        // Escape double quotes and wrap in quotes
        return `"${String(job[h]).replace(/"/g, '""')}"`;
      }).join(',')
    )
  ];

  fs.writeFileSync(filePath, csvRows.join('\n'), 'utf-8');
}


