import type { Currency, JobData, SalaryType } from "../types";

function detectPortal(): "LINKEDIN" | "JUSTJOIN" | "PRACUJ" | "OTHER" {
  const host = window.location.hostname;
  if (host.includes("linkedin.com")) return "LINKEDIN";
  if (host.includes("justjoin.it")) return "JUSTJOIN";
  if (host.includes("pracuj.pl")) return "PRACUJ";
  return "OTHER";
}

function parseSalaryText(text: string | undefined | null): Pick<JobData, "salaryMin" | "salaryMax" | "currency" | "salaryType"> {
  if (!text) return {};

  const currency: Currency | undefined =
    /zł|PLN/i.test(text) ? "PLN" :
    /\$|USD/.test(text) ? "USD" :
    /€|EUR/i.test(text) ? "EUR" :
    undefined;

  const salaryType: SalaryType = /\/\s*godz|\/\s*h\b|hourly/i.test(text) ? "HOURLY" : "MONTHLY";

  // Normalize thousands separators (space and comma), then extract integers
  const normalized = text.replace(/(\d)[\s,](\d{3})(?!\d)/g, "$1$2");
  const numbers = (normalized.match(/\d+/g) ?? [])
    .map(Number)
    .filter(n => n >= 10 && !(n >= 1900 && n <= 2099));

  if (numbers.length === 0) return {};

  return {
    salaryMin: numbers[0],
    salaryMax: numbers[numbers.length - 1],
    ...(currency && { currency }),
    salaryType,
  };
}

function detectContractType(pageText: string): "UoP" | "B2B" | "UoZ" | null {
  if (/\bUoP\b|umowa\s+o\s+prac[ęe]/i.test(pageText)) return "UoP";
  if (/\bB2B\b|\bkontrakt\b/i.test(pageText)) return "B2B";
  if (/\bUoZ\b|umowa\s+zlecen/i.test(pageText)) return "UoZ";
  return null;
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

  const salaryText = document
    .querySelector(".compensation__salary, .job-details-preferences-and-skills__pill")
    ?.textContent?.trim();

  const pageText = document.body.textContent ?? "";
  const contractType = detectContractType(pageText) ?? undefined;

  return { title, company, location, ...parseSalaryText(salaryText), contractType };
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

  const salaryText = document
    .querySelector("[data-testid='salary'], .css-3pjcma")
    ?.textContent?.trim();

  const pageText = document.body.textContent ?? "";
  const contractType = detectContractType(pageText) ?? undefined;

  return { title, company, location, ...parseSalaryText(salaryText), contractType };
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

  const salaryText = document
    .querySelector('[data-test="text-salary"]')
    ?.textContent?.trim();

  const pageText = document.body.textContent ?? "";
  const contractType = detectContractType(pageText) ?? undefined;

  return { title, company, location, ...parseSalaryText(salaryText), contractType };
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
    salaryMin: scraped.salaryMin,
    salaryMax: scraped.salaryMax,
    currency: scraped.currency,
    salaryType: scraped.salaryType,
    contractType: scraped.contractType,
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
