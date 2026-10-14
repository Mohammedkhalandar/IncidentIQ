import { expect, test } from "@playwright/test";
import {
  createIncident,
  findIncident,
  signIn,
  testIncidentTitle,
} from "./helpers";

test("creates an incident and verifies it persists in the incident queue", async ({
  page,
}) => {
  await signIn(page);
  const title = testIncidentTitle();
  await createIncident(page, title);

  const token = await page.evaluate(() =>
    localStorage.getItem("incidentiq_token"),
  );
  const response = await page.request.get(
    `/api/v1/incidents?search=${encodeURIComponent(title)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  expect(response.ok()).toBeTruthy();
  const pageData = await response.json();
  expect(pageData.content).toEqual(
    expect.arrayContaining([expect.objectContaining({ title })]),
  );

  await findIncident(page, title);
  await expect(page.getByRole("dialog").getByRole("heading", { name: title })).toBeVisible();
});
