import type { JobData } from "../types";

function detectPortal(): "LINKEDIN" | "JUSTJOIN" | "PRACUJ" | "OTHER" {
  const host = window.location.hostname;
  if (host.includes("linkedin.com")) return "LINKEDIN";
  if (host.includes("justjoin.it")) return "JUSTJOIN";
  if (host.includes("pracuj.pl")) return "PRACUJ";
  return "OTHER";
}

function scrapeLinkedIn(): Partial<JobData> {
  const title =
    document.querySelector("h1.job-details-jobs-unified-top-card__job-title")
      ?.textContent?.trim() ??
    document.querySelector("h1")?.textContent?.trim();

  const company =
    document
      .querySelector(
        ".job-details-jobs-unified-top-card__company-name a, .job-details-jobs-unified-top-card__company-name"
      )
      ?.textContent?.trim() ??
    document.querySelector(".topcard__org-name-link")?.textContent?.trim();

  const location = document
    .querySelector(".job-details-jobs-unified-top-card__bullet")
    ?.textContent?.trim();

  return { title, company, location };
}

function scrapeJustJoin(): Partial<JobData> {
  const title = document.querySelector("h1")?.textContent?.trim();

  const company =
    document
      .querySelector("[data-testid='company-name'], .css-1id4k1")
      ?.textContent?.trim() ??
    document.querySelector("h2")?.textContent?.trim();

  const location = document
    .querySelector("[data-testid='location'], .css-1dqkhi2")
    ?.textContent?.trim();

  const salaryEl = document.querySelector(
    "[data-testid='salary'], .css-3pjcma"
  );
  const salary = salaryEl?.textContent?.trim();

  return { title, company, location, salary };
}

function scrapePracuj(): Partial<JobData> {
  const title = document
    .querySelector('[data-test="text-jobTitle"], h1')
    ?.textContent?.trim();

  const company = document
    .querySelector('[data-test="text-employerName"]')
    ?.textContent?.trim();

  const location = document
    .querySelector('[data-test="text-workLocation"]')
    ?.textContent?.trim();

  const salary = document
    .querySelector('[data-test="text-salary"]')
    ?.textContent?.trim();

  return { title, company, location, salary };
}

function scrapeCurrentPage(): JobData {
  const portal = detectPortal();
  const url = window.location.href;

  let scraped: Partial<JobData> = {};
  if (portal === "LINKEDIN") scraped = scrapeLinkedIn();
  else if (portal === "JUSTJOIN") scraped = scrapeJustJoin();
  else if (portal === "PRACUJ") scraped = scrapePracuj();

  return {
    title: scraped.title ?? "",
    company: scraped.company ?? "",
    location: scraped.location,
    salary: scraped.salary,
    url,
    portal,
  };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "SCRAPE_JOB") {
    sendResponse(scrapeCurrentPage());
  }
  return true;
});
