/// <reference types="chrome"/>

import type { JobData, SaveApplicationPayload } from "../types";

const JOB_PORTALS = ["linkedin.com", "justjoin.it", "pracuj.pl"];

let cachedJobData: Partial<JobData> = {};

function show(id: string) {
  document.querySelectorAll<HTMLElement>(".view").forEach((el) => el.classList.add("hidden"));
  document.getElementById(id)!.classList.remove("hidden");
}

function setError(elId: string, msg: string) {
  const el = document.getElementById(elId)!;
  el.textContent = msg;
  el.classList.remove("hidden");
}

function clearMessages() {
  ["login-error", "save-error", "save-success"].forEach((id) => {
    document.getElementById(id)!.classList.add("hidden");
  });
}

async function getActiveTab(): Promise<chrome.tabs.Tab | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab ?? null;
}

async function scrapeJob(tab: chrome.tabs.Tab): Promise<JobData | null> {
  if (!tab.id) return null;

  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tab.id!, { type: "SCRAPE_JOB" }, (data: JobData) => {
      resolve(chrome.runtime.lastError ? null : data);
    });
  });
}

function fillForm(job: JobData) {
  cachedJobData = job;

  (document.getElementById("f-title") as HTMLInputElement).value = job.title;
  (document.getElementById("f-company") as HTMLInputElement).value = job.company;
  (document.getElementById("f-location") as HTMLInputElement).value = job.location ?? "";
  (document.getElementById("f-url") as HTMLInputElement).value = job.url;

  const salaryDisplay = job.salaryMin != null
    ? `${job.salaryMin}${job.salaryMax && job.salaryMax !== job.salaryMin ? `–${job.salaryMax}` : ""} ${job.currency ?? "PLN"}${job.salaryType === "HOURLY" ? "/h" : "/mies."}`
    : "";
  (document.getElementById("f-salary") as HTMLInputElement).value = salaryDisplay;

  const badge = document.getElementById("portal-badge")!;
  badge.textContent = job.portal;
  badge.dataset.portal = job.portal;
}

async function init() {
  const { authenticated } = await new Promise<{ authenticated: boolean }>((r) =>
    chrome.runtime.sendMessage({ type: "CHECK_AUTH" }, r)
  );

  if (!authenticated) {
    show("view-login");
    return;
  }

  const tab = await getActiveTab();
  const isJobPage = tab?.url && JOB_PORTALS.some((p) => tab.url!.includes(p));

  if (!isJobPage) {
    show("view-not-job");
    return;
  }

  show("view-save");
  const job = tab ? await scrapeJob(tab) : null;
  if (job) fillForm(job);
}

// Login
document.getElementById("login-form")!.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearMessages();

  const email = (document.getElementById("email") as HTMLInputElement).value;
  const password = (document.getElementById("password") as HTMLInputElement).value;

  const result = await new Promise<{ ok: boolean; error?: string }>((r) =>
    chrome.runtime.sendMessage({ type: "LOGIN", payload: { email, password } }, r)
  );

  if (result.ok) {
    await init();
  } else {
    setError("login-error", result.error ?? "Błąd logowania");
  }
});

// Open register page in new tab
document.getElementById("go-register")!.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: "http://localhost:5173/register" });
});

// Logout
document.getElementById("btn-logout")!.addEventListener("click", async () => {
  await new Promise((r) => chrome.runtime.sendMessage({ type: "LOGOUT" }, r));
  show("view-login");
});

// Save application
document.getElementById("save-form")!.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearMessages();

  const submitter = (e as SubmitEvent).submitter as HTMLButtonElement | null;
  const status: SaveApplicationPayload["status"] =
    submitter?.id === "btn-save-later" ? "SAVED" : "APPLIED";

  const btnApplied = document.getElementById("btn-applied") as HTMLButtonElement;
  const btnSaveLater = document.getElementById("btn-save-later") as HTMLButtonElement;
  btnApplied.disabled = true;
  btnSaveLater.disabled = true;

  const payload: SaveApplicationPayload = {
    title: (document.getElementById("f-title") as HTMLInputElement).value,
    company: (document.getElementById("f-company") as HTMLInputElement).value,
    location: (document.getElementById("f-location") as HTMLInputElement).value || undefined,
    url: (document.getElementById("f-url") as HTMLInputElement).value,
    portal: ((document.getElementById("portal-badge")! as HTMLElement).dataset.portal ?? "OTHER") as SaveApplicationPayload["portal"],
    status,
    notes: (document.getElementById("f-notes") as HTMLTextAreaElement).value || undefined,
    salaryMin: cachedJobData.salaryMin,
    salaryMax: cachedJobData.salaryMax,
    currency: cachedJobData.currency,
    salaryType: cachedJobData.salaryType,
    contractType: cachedJobData.contractType,
  };

  const result = await new Promise<{ ok: boolean; error?: string }>((r) =>
    chrome.runtime.sendMessage({ type: "SAVE_APPLICATION", payload }, r)
  );

  btnApplied.disabled = false;
  btnSaveLater.disabled = false;

  if (result.ok) {
    document.getElementById("save-success")!.classList.remove("hidden");
    setTimeout(() => window.close(), 1500);
  } else {
    setError("save-error", result.error ?? "Błąd zapisu");
  }
});

init();
