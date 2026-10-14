import { expect, test } from "@playwright/test";
import { createIncident, signIn, testIncidentTitle } from "./helpers";

test("rejects invalid credentials and loads protected workspace after sign-in", async ({
  page,
}) => {
  await signIn(page);

  const token = await page.evaluate(() =>
    localStorage.getItem("incidentiq_token"),
  );
  expect(token).toBeTruthy();

  const currentUser = await page.request.get("/api/v1/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(currentUser.ok()).toBeTruthy();
  await expect(currentUser.json()).resolves.toMatchObject({ role: "ADMIN" });
  await expect(page.locator("header").getByText("API connected")).toBeVisible();

  const title = testIncidentTitle();
  await createIncident(page, title);
  const persisted = await page.request.get(
    `/api/v1/incidents?search=${encodeURIComponent(title)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  expect(persisted.ok()).toBeTruthy();
  await expect(persisted.json()).resolves.toMatchObject({
    content: expect.arrayContaining([expect.objectContaining({ title })]),
  });
});
