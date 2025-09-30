/**
 * Validates job offer data before saving.
 * Required fields: jobTitle, jobId, jobUrl, location.
 * Checks URL validity, postedAt date, tags array, and companyUrl if present.
 * Returns true if valid, false otherwise.
 */
export function isValid(jobData) {
  if (!jobData) return false;

  // Required fields (all must be non-empty strings)
  const requiredFields = ['jobTitle', 'jobId', 'jobUrl', 'location'];
  for (const field of requiredFields) {
    if (
      typeof jobData[field] !== 'string' ||
      jobData[field].trim() === ''
    ) {
      return false;
    }
  }

  // Validate jobUrl
  try {
    new URL(jobData.jobUrl);
  } catch {
    return false;
  }

  // Validate companyUrl (if present)
  if (jobData.companyUrl) {
    try {
      new URL(jobData.companyUrl);
    } catch {
      return false;
    }
  }

  // Validate postedAt (if present)
  if (jobData.postedAt && jobData.postedAt !== null) {
    const date = new Date(jobData.postedAt);
    const now = new Date();
    if (isNaN(date.getTime()) || date > now) {
      jobData.postedAt = null; // Allow, but set to null if invalid or in the future
    }
  }

  // Validate tags
  if (jobData.tags && !Array.isArray(jobData.tags)) {
    jobData.tags = [];
  }

  // Validate salary fields (if present)
  if (
    (jobData.salaryMin && typeof jobData.salaryMin !== 'number') ||
    (jobData.salaryMax && typeof jobData.salaryMax !== 'number')
  ) {
    return false;
  }

  return true;
}