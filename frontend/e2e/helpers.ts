import { expect, type Page } from "@playwright/test";

const adminEmail = "admin@incidentiq.local";
const password = "IncidentIQ@123";

export async function signIn(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Work email").fill(adminEmail);
  await page.getByLabel("Password").fill("incorrect-password");
  await page.getByRole("button", { name: /Sign in to workspace/ }).click();
  await expect(page.getByText("Invalid email or password")).toBeVisible();

  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /Sign in to workspace/ }).click();
  await expect(page.getByText("Incident response snapshot")).toBeVisible();
}

export async function createIncident(
  page: Page,
  title: string,
): Promise<void> {
  await page.getByRole("button", { name: "New incident" }).first().click();
  const dialog = page.getByRole("dialog", { name: /Raise an incident/ });
  await dialog.getByLabel(/Incident title/).fill(title);
  await dialog
    .getByLabel(/Description/)
    .fill("Automated end-to-end validation incident.");
  await dialog.getByLabel("Priority").selectOption("MEDIUM");
  await dialog.getByLabel("Category").selectOption("OTHER");
  await dialog.getByRole("button", { name: "Create incident" }).click();
  await expect(
    page
      .getByRole("dialog", { name: title })
      .getByRole("heading", { name: title }),
  ).toBeVisible();
}

export async function findIncident(page: Page, title: string): Promise<void> {
  await page.getByRole("button", { name: "Close incident details" }).click();
  await page.goto("/incidents");
  await page.getByRole("textbox", { name: "Search incidents" }).fill(title);
  const incidentLink = page.getByRole("button", {
    name: new RegExp(`Open .*: ${escapeRegExp(title)}`),
  });
  await expect(incidentLink).toBeVisible();
  await incidentLink.click();
}

export function testIncidentTitle(): string {
  return `E2E validation ${Date.now()}`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
