import { expect, test } from "@playwright/test";
import {
  createIncident,
  findIncident,
  signIn,
  testIncidentTitle,
} from "./helpers";

test("starts work, adds a note, and verifies both survive reload", async ({
  page,
}) => {
  await signIn(page);
  const title = testIncidentTitle();
  const note = `E2E investigation note ${Date.now()}`;
  await createIncident(page, title);

  const drawer = page.getByRole("dialog");
  await drawer.getByRole("button", { name: "Start work" }).click();
  await expect(drawer.getByText("IN PROGRESS")).toBeVisible();

  await drawer.getByLabel("Add an investigation note").fill(note);
  await drawer.getByRole("button", { name: "Add note" }).click();
  await expect(drawer.getByText(note)).toBeVisible();

  await findIncident(page, title);
  const reopened = page.getByRole("dialog");
  await expect(reopened.getByText("IN PROGRESS")).toBeVisible();
  await expect(reopened.getByText(note)).toBeVisible();
});
