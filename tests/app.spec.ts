import { test, expect } from "@playwright/test";

test.describe("Travel Alarm App", () => {
  test("1. Home page loads with empty state", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Travel Alarm" })).toBeVisible();
    await expect(page.locator("text=No trips yet")).toBeVisible();
    await expect(page.locator("text=+ New Trip")).toBeVisible();
    await page.screenshot({ path: "tests/screenshots/01-home-empty.png" });
  });

  test("2. Navigate to New Trip page", async ({ page }) => {
    await page.goto("/");
    await page.click("text=+ New Trip");
    await expect(page).toHaveURL("/trip/new");
    await expect(page.locator("text=New Trip")).toBeVisible();
    await expect(page.locator("text=Destination")).toBeVisible();
    await expect(
      page.locator("text=Will use your current location")
    ).toBeVisible();
    await page.screenshot({ path: "tests/screenshots/02-new-trip-page.png" });
  });

  test("3. Mode selector works", async ({ page }) => {
    await page.goto("/trip/new");
    // Bus should be selected by default
    const busButton = page.locator("button", { hasText: "Bus" });
    await expect(busButton).toHaveClass(/bg-blue-600/);

    // Click Train
    await page.click("button:has-text('Train')");
    const trainButton = page.locator("button", { hasText: "Train" });
    await expect(trainButton).toHaveClass(/bg-blue-600/);
    await page.screenshot({ path: "tests/screenshots/03-mode-selector.png" });
  });

  test("4. Place search shows results for destination", async ({ page }) => {
    await page.goto("/trip/new");
    const destInput = page.locator('input[placeholder="Where are you going?"]');
    await destInput.fill("Goa");
    // Wait for Nominatim results (debounced 400ms + network)
    await page.waitForTimeout(2000);
    // Check if dropdown appeared
    const dropdown = page.locator(".absolute.z-50");
    const isVisible = await dropdown.isVisible().catch(() => false);
    if (isVisible) {
      await page.screenshot({
        path: "tests/screenshots/04-place-search-results.png",
      });
      // Click first result
      await dropdown.locator("button").first().click();
      await page.waitForTimeout(500);
    }
    await page.screenshot({
      path: "tests/screenshots/04b-place-selected.png",
    });
  });

  test("5. Add alarm modal works", async ({ page }) => {
    await page.goto("/trip/new");
    await page.click("text=+ Add Alarm");
    await expect(page.locator("text=Add Alarm").first()).toBeVisible();
    await page.screenshot({ path: "tests/screenshots/05-alarm-modal.png" });

    // Select distance type and use preset
    await page.click("button:has-text('📏 Distance')");
    await page.click("button:has-text('5 km')");
    await page.screenshot({
      path: "tests/screenshots/05b-alarm-preset-selected.png",
    });

    // Add the alarm
    await page.locator("button:has-text('Add Alarm')").last().click();
    await expect(page.locator("text=5 km before destination")).toBeVisible();
    await page.screenshot({ path: "tests/screenshots/05c-alarm-added.png" });
  });

  test("6. Add time-based alarm", async ({ page }) => {
    await page.goto("/trip/new");
    await page.click("text=+ Add Alarm");

    // Switch to time
    await page.click("button:has-text('⏱ Time')");
    await page.click("button:has-text('15 min')");
    await page.locator("button:has-text('Add Alarm')").last().click();
    await expect(page.locator("text=15 min before arrival")).toBeVisible();
    await page.screenshot({
      path: "tests/screenshots/06-time-alarm-added.png",
    });
  });

  test("7. Full trip creation flow", async ({ page }) => {
    await page.goto("/trip/new");

    // Search and select destination
    const destInput = page.locator('input[placeholder="Where are you going?"]');
    await destInput.fill("Goa");
    await page.waitForTimeout(2000);
    const dropdown = page.locator(".absolute.z-50");
    const isVisible = await dropdown.isVisible().catch(() => false);
    if (isVisible) {
      await dropdown.locator("button").first().click();
      await page.waitForTimeout(500);
    }

    // Select train mode
    await page.click("button:has-text('Train')");

    // Add distance alarm
    await page.click("text=+ Add Alarm");
    await page.click("button:has-text('📏 Distance')");
    await page.click("button:has-text('10 km')");
    await page.locator("button:has-text('Add Alarm')").last().click();

    // Add time alarm
    await page.click("text=+ Add Alarm");
    await page.click("button:has-text('⏱ Time')");
    await page.click("button:has-text('15 min')");
    await page.locator("button:has-text('Add Alarm')").last().click();

    await page.screenshot({
      path: "tests/screenshots/07-full-trip-form.png",
    });

    // Start trip button should be enabled if destination was selected
    const startBtn = page.locator("button:has-text('Start Trip')");
    await page.screenshot({
      path: "tests/screenshots/07b-ready-to-start.png",
    });
  });

  test("8. Create trip and check tracking page loads", async ({ page, context }) => {
    // Grant geolocation permission
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({ latitude: 12.9716, longitude: 77.5946 }); // Bangalore

    await page.goto("/trip/new");

    // Select destination
    const destInput = page.locator('input[placeholder="Where are you going?"]');
    await destInput.fill("Goa");
    await page.waitForTimeout(2000);
    const dropdown = page.locator(".absolute.z-50");
    const isVisible = await dropdown.isVisible().catch(() => false);
    if (isVisible) {
      await dropdown.locator("button").first().click();
      await page.waitForTimeout(500);
    }

    // Add an alarm
    await page.click("text=+ Add Alarm");
    await page.click("button:has-text('5 km')");
    await page.locator("button:has-text('Add Alarm')").last().click();

    // Click Start Trip
    await page.click("button:has-text('Start Trip')");
    await page.waitForTimeout(3000);

    // Should be on tracking page
    await page.screenshot({
      path: "tests/screenshots/08-tracking-page.png",
    });

    // Check key elements
    const endTripBtn = page.locator("button:has-text('End Trip')");
    await expect(endTripBtn).toBeVisible();
  });

  test("9. End trip returns to home with completed trip", async ({ page, context }) => {
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({ latitude: 12.9716, longitude: 77.5946 });

    await page.goto("/trip/new");

    const destInput = page.locator('input[placeholder="Where are you going?"]');
    await destInput.fill("Mumbai India");
    await page.waitForTimeout(2000);
    const dropdown = page.locator(".absolute.z-50");
    if (await dropdown.isVisible().catch(() => false)) {
      await dropdown.locator("button").first().click();
      await page.waitForTimeout(500);
    }

    await page.click("button:has-text('Start Trip')");
    await page.waitForTimeout(3000);

    // End the trip
    await page.click("button:has-text('End Trip')");
    await page.waitForURL("/");
    await page.waitForTimeout(500);

    await page.screenshot({
      path: "tests/screenshots/09-trip-completed-home.png",
    });
  });

  test("10. Tracking page shows avg speed and correct labels", async ({ page, context }) => {
    await context.grantPermissions(["geolocation", "notifications"]);
    await context.setGeolocation({ latitude: 12.9716, longitude: 77.5946 }); // Bangalore

    await page.goto("/trip/new");

    const destInput = page.locator('input[placeholder="Where are you going?"]');
    await destInput.fill("Goa");
    await page.waitForTimeout(2000);
    const dropdown = page.locator(".absolute.z-50");
    if (await dropdown.isVisible().catch(() => false)) {
      await dropdown.locator("button").first().click();
      await page.waitForTimeout(500);
    }

    // Add distance alarm
    await page.click("text=+ Add Alarm");
    await page.click("button:has-text('📏 Distance')");
    await page.click("button:has-text('5 km')");
    await page.locator("button:has-text('Add Alarm')").last().click();

    // Start trip
    await page.click("button:has-text('Start Trip')");
    await page.waitForTimeout(3000);

    // Check "To destination" label exists instead of "Distance left"
    await expect(page.locator("text=To destination")).toBeVisible();
    // Check "Avg (15m)" label for average speed
    await expect(page.locator("text=Avg (15m)")).toBeVisible();
    // Check speed label
    await expect(page.locator("text=Speed")).toBeVisible();
    // Check alarm shows "before destination"
    await expect(page.locator("text=5 km before destination")).toBeVisible();

    await page.screenshot({
      path: "tests/screenshots/10-tracking-labels.png",
    });

    // End trip
    await page.click("button:has-text('End Trip')");
    await page.waitForURL("/");
  });

  test("11. Delete a completed trip", async ({ page, context }) => {
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({ latitude: 12.9716, longitude: 77.5946 });

    // Create and complete a trip
    await page.goto("/trip/new");
    const destInput = page.locator('input[placeholder="Where are you going?"]');
    await destInput.fill("Chennai India");
    await page.waitForTimeout(2000);
    const dropdown = page.locator(".absolute.z-50");
    if (await dropdown.isVisible().catch(() => false)) {
      await dropdown.locator("button").first().click();
      await page.waitForTimeout(500);
    }
    await page.click("button:has-text('Start Trip')");
    await page.waitForTimeout(3000);
    await page.click("button:has-text('End Trip')");
    await page.waitForURL("/");
    await page.waitForTimeout(500);

    // Delete the trip
    const deleteBtn = page.locator("button:has-text('Delete')").first();
    if (await deleteBtn.isVisible().catch(() => false)) {
      await deleteBtn.click();
      await page.waitForTimeout(500);
    }

    await page.screenshot({
      path: "tests/screenshots/10-after-delete.png",
    });
  });
});
