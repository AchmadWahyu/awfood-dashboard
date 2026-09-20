import { expect, test } from "@playwright/test";

const staffCode = process.env.E2E_STAFF_CODE;
const staffPin = process.env.E2E_STAFF_PIN;
const ownerEmail = process.env.E2E_OWNER_EMAIL;
const ownerPassword = process.env.E2E_OWNER_PASSWORD;

test("staff tetap berada di penutupan setelah login dan reload", async ({ page }) => {
  test.skip(!staffCode || !staffPin, "Set E2E_STAFF_CODE dan E2E_STAFF_PIN di environment lokal.");

  await page.goto("/login");
  await page.getByLabel("Kode Staff").fill(staffCode!);
  await page.getByLabel("PIN").fill(staffPin!);
  await page.getByRole("button", { name: "Masuk" }).click();

  await expect(page).toHaveURL("/employee/penutupan");
  await expect(page.getByText("AW Food").first()).toBeVisible();
  await page.waitForTimeout(250);
  await expect(page).toHaveURL("/employee/penutupan");

  await page.reload();
  await expect(page).toHaveURL("/employee/penutupan");
});

test("owner tetap berada di dashboard setelah login dan reload", async ({ page }) => {
  test.skip(!ownerEmail || !ownerPassword, "Set E2E_OWNER_EMAIL dan E2E_OWNER_PASSWORD di environment lokal.");

  await page.goto("/login/owner");
  await page.getByLabel("Email").fill(ownerEmail!);
  await page.getByLabel("Password").fill(ownerPassword!);
  await page.getByRole("button", { name: "Masuk" }).click();

  await expect(page).toHaveURL("/owner/dashboard");
  await expect(page.getByText("Dashboard Overview")).toBeVisible();
  await page.waitForTimeout(250);
  await expect(page).toHaveURL("/owner/dashboard");

  await page.reload();
  await expect(page).toHaveURL("/owner/dashboard");
});

test("PIN staff salah tetap di halaman login", async ({ page }) => {
  test.skip(!staffCode, "Set E2E_STAFF_CODE di environment lokal.");

  await page.goto("/login");
  await page.getByLabel("Kode Staff").fill(staffCode!);
  await page.getByLabel("PIN").fill("0000");
  await page.getByRole("button", { name: "Masuk" }).click();

  await expect(page).toHaveURL("/login");
  await expect(page.getByText("Kode staff atau PIN salah")).toBeVisible();
});
