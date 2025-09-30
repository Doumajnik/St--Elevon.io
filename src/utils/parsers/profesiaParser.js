import * as cheerio from "cheerio";

/**
 * Parses Profesia.sk job detail HTML and extracts structured job data fields.
 * Returns an object with jobTitle, companyName, companyUrl, location, salary, employmentType, tags, postedAt, jobUrl, and description.
 */
function parseProfesia(html, jobId, jobUrl) {
  const $ = cheerio.load(html);

  // Job title
  const jobTitle = $("h1[itemprop='title']").first().text().trim() || null;

  // Company name and URL
  const companyElem = $("h2[itemprop='hiringOrganization'] span").first();
  const companyName = companyElem.text().trim() || null;
  const companyUrlElem = $(`span.hidden-xs a:contains('${companyName}')`).first();
  const companyUrl = companyUrlElem.attr("href") ? `https://www.profesia.sk${companyUrlElem.attr("href")}` : null;

  // Location
  const location = $("strong:contains('Miesto práce')").next("br").next("span").text().trim() || null;

  // Salary
  let salaryMin = null;
  let salaryMax = null;
  let salaryCurrency = null;
  let salaryPeriod = null;
  const salaryText = $(".salary-range").first().text().trim();
  if (salaryText && !/dohodou/i.test(salaryText)) {
    const match = salaryText.match(/([\d\s]+)(?:\s*–\s*([\d\s]+))?\s*(EUR)\/([a-z]+)/i);
    if (match) {
      salaryMin = Number(match[1].replace(/\s/g, ""));
      salaryMax = match[2] ? Number(match[2].replace(/\s/g, "")) : salaryMin;
      salaryCurrency = match[3];
      salaryPeriod = match[4];
    }
  }

  // Employment type
  const employmentType = $("span[itemprop='employmentType']").first().text().trim() || null;

  // Tags
  const tags = [];
  $("span.hidden-xs a[href*='/praca/']").each((i, el) => {
    const tag = $(el).text().trim();
    if (tag) tags.push(tag);
  });

  // Posted date
  let postedAt = null;
  const postText = $(".padding-on-bottom strong:contains('Dátum zverejnenia')").next("span").text().trim();
  if (postText) {
    const m = postText.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    if (m) {
      const [_, d, mth, y] = m;
      postedAt = `${y}-${mth.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
  }

  // Job description
  const description = $("div.details-desc").first().text().trim() || null;

  return {
    jobId,
    jobTitle,
    companyName,
    companyUrl,
    location,
    salaryMin,
    salaryMax,
    salaryCurrency,
    salaryPeriod,
    employmentType,
    tags,
    postedAt,
    jobUrl,
    description,
  };
}

export default parseProfesia;