import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

let runtimeErrors: string[];

test.beforeEach(async ({ page }) => {
  runtimeErrors = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "What can I help with?" }),
  ).toBeVisible();
});

test.afterEach(() => expect(runtimeErrors).toEqual([]));

async function openSettings(page: Page) {
  await page
    .getByRole("button", { name: "Alex Morgan account settings" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Make yourself at home" }),
  ).toBeVisible();
}

async function chatMenu(page: Page, title: string) {
  await page.getByRole("button", { name: title, exact: true }).hover();
  await page
    .getByRole("button", { name: `Options for ${title}`, exact: true })
    .click();
}

test("desktop frame, suggestions, and native keyboard command search", async ({
  page,
}) => {
  const sidebar = await page.locator(".desktop-sidebar").boundingBox();
  expect(sidebar?.width).toBe(260);
  await page
    .getByRole("button", { name: "Build something great", exact: true })
    .click();
  await expect(
    page.getByRole("combobox", { name: "Message ChatGPT" }),
  ).toContainText("TypeScript");
  await page.keyboard.press("Control+k");
  const dialog = page.getByRole("dialog", {
    name: "Search chats and commands",
  });
  await expect(dialog).toBeVisible();
  await dialog.locator("input").fill("TypeScript");
  await expect(
    dialog.getByRole("option", {
      name: "A little TypeScript help",
      exact: true,
    }),
  ).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("log")).toBeVisible();
  await expect(dialog).not.toBeVisible();
  await page.keyboard.press("Meta+n");
  await expect(
    page.getByRole("heading", { name: "What can I help with?" }),
  ).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "Message ChatGPT" }),
  ).toBeEmpty();
});

test("model selection, streaming, cancellation, and regeneration", async ({
  page,
}) => {
  await page.getByRole("button", { name: "ChatGPT 4o", exact: true }).click();
  await page.getByRole("menuitem", { name: /o3-mini/ }).click();
  await expect(
    page.getByRole("button", { name: "ChatGPT o3-mini", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Reason", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Message ChatGPT" })
    .fill("Help me debug a TypeScript error");
  await page.getByRole("combobox", { name: "Message ChatGPT" }).press("Enter");
  await expect(page.getByRole("log")).toHaveAttribute("aria-busy", "true");
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(page.getByText("You stopped this response.")).toBeVisible();
  await page
    .getByRole("button", { name: "Regenerate response", exact: true })
    .click();
  await expect(page.getByRole("log")).toHaveAttribute("aria-busy", "true");
  await expect(page.getByRole("log")).not.toHaveAttribute("aria-busy", "true", {
    timeout: 15_000,
  });
  await expect(page.locator(".message-code")).toBeVisible();
  await page
    .getByRole("button", { name: "Good response", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Good response", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.locator(".chat-canvas").evaluate((element) => {
    element.scrollTop = 0;
  });
  await page.getByRole("button", { name: /Thought for 4 seconds/ }).click();
  await expect(page.getByText("Approach summary")).toBeVisible();
});

test("file attachment previews can be added and removed", async ({ page }) => {
  await page
    .locator('input[type="file"]')
    .setInputFiles({
      name: "quarterly-report.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("Demo attachment"),
    });
  await expect(page.locator(".attachment-name")).toHaveText(
    "quarterly-report.pdf",
  );
  await page
    .getByRole("button", { name: "Remove quarterly-report.pdf", exact: true })
    .click();
  await expect(page.locator(".attachment-chip")).toHaveCount(0);
});

test("rename, pin, archive, restore, and delete a conversation", async ({
  page,
}) => {
  await chatMenu(page, "A little TypeScript help");
  await page.getByRole("menuitem", { name: "Rename", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Conversation title", exact: true })
    .fill("Types made simple");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await chatMenu(page, "Types made simple");
  await page.getByRole("menuitem", { name: "Pin chat", exact: true }).click();
  await expect(page.locator(".history-group").first()).toContainText("Pinned");
  await chatMenu(page, "Types made simple");
  await page.getByRole("menuitem", { name: "Archive", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Types made simple", exact: true }),
  ).toHaveCount(0);
  await openSettings(page);
  await page.getByRole("tab", { name: "Data controls", exact: true }).click();
  await page
    .getByRole("button", { name: "Restore Types made simple", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Close settings", exact: true })
    .click();
  await chatMenu(page, "Types made simple");
  await page
    .getByRole("menuitem", { name: "Delete chat", exact: true })
    .click();
  await page.getByRole("button", { name: "Delete chat", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Types made simple", exact: true }),
  ).toHaveCount(0);
});

test("all official themes switch and preferences survive reload", async ({
  page,
}) => {
  await openSettings(page);
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Matcha", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-astryx-theme",
    "desktop-matcha",
  );
  await page.getByRole("tab", { name: "Speech", exact: true }).click();
  await page.getByRole("button", { name: "Juniper", exact: true }).click();
  await page.getByRole("menuitem", { name: /Cove/ }).click();
  await page.waitForTimeout(350);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute(
    "data-astryx-theme",
    "desktop-matcha",
  );
  await openSettings(page);
  await page.getByRole("tab", { name: "Speech", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Cove", exact: true }),
  ).toBeVisible();
});

test("companion opens from a shortcut, sends, and closes with Escape", async ({
  page,
}) => {
  await page.keyboard.press("Alt+Space");
  const dialog = page.getByRole("dialog", {
    name: "ChatGPT companion",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await page
    .getByRole("textbox", { name: "Ask ChatGPT companion", exact: true })
    .fill("Plan a calmer morning");
  await dialog.locator(".send-button").click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("log")).toContainText("Plan a calmer morning");
  await page.keyboard.press("Alt+Space");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
});

test("data export and explicitly confirmed deletion work", async ({ page }) => {
  await openSettings(page);
  await page.getByRole("tab", { name: "Data controls", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export data", exact: true }).click();
  expect((await download).suggestedFilename()).toBe(
    "chatgpt-conversations.json",
  );
  await page.getByRole("button", { name: "Delete all", exact: true }).click();
  await expect(
    page.getByText("Delete all conversations?", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Delete all", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(
    page.getByText("A fresh start. Your conversations will appear here."),
  ).toBeVisible();
});

test("window controls are reversible", async ({ page }) => {
  await page
    .getByRole("button", { name: "Minimize window", exact: true })
    .click();
  await expect(
    page.getByText("A little breathing room.", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Back to ChatGPT", exact: true })
    .click();
  await page.getByRole("button", { name: "Close window", exact: true }).click();
  await expect(
    page.getByText("See you soon, Alex.", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Back to ChatGPT", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "What can I help with?" }),
  ).toBeVisible();
});

test("mobile canvas and navigation stay within the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".desktop-sidebar")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await page.getByRole("button", { name: "Open sidebar", exact: true }).click();
  await expect(page.locator(".desktop-sidebar")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".desktop-sidebar")).toHaveCount(0);
  await page.getByRole("button", { name: "Open sidebar", exact: true }).click();
  await page
    .getByRole("button", { name: "A little TypeScript help", exact: true })
    .click();
  await expect(page.locator(".desktop-sidebar")).toHaveCount(0);
  await expect(page.getByRole("log")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
});

test("slash commands create tokens and submitted input can be recalled", async ({
  page,
}) => {
  const input = page.getByRole("combobox", {
    name: "Message ChatGPT",
    exact: true,
  });
  await input.fill("/");
  await page
    .getByRole("option", { name: "Search the web", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Search", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(input).toContainText("Search");
  await input.fill("Help me make a calmer plan");
  await input.press("Enter");
  await expect(page.getByRole("log")).toContainText(
    "Help me make a calmer plan",
  );
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await input.focus();
  await input.press("ArrowUp");
  await expect(input).toContainText("Help me make a calmer plan");
});

test("response copy uses the clipboard and feedback can be toggled", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page
    .getByRole("button", { name: "A little TypeScript help", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Copy response", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Copied", exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    "type User",
  );
  await page
    .getByRole("button", { name: "Good response", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Good response", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "Good response", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Good response", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
});

test("home and settings meet automated WCAG AA checks", async ({ page }) => {
  await page.waitForTimeout(1100);
  const home = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(home.violations).toEqual([]);
  await openSettings(page);
  await page.waitForTimeout(600);
  const settings = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(settings.violations).toEqual([]);
});

for (const theme of ["Dark", "Matcha"]) {
  test(`${theme} keeps the desktop size budget and passes automated contrast checks`, async ({
    page,
  }) => {
    await openSettings(page);
    await page.getByRole("button", { name: theme, exact: true }).click();
    await page
      .getByRole("button", { name: "Close settings", exact: true })
      .click();
    await page.waitForTimeout(700);
    expect((await page.locator(".desktop-sidebar").boundingBox())?.width).toBe(
      260,
    );
    const lastSuggestion = await page
      .locator(".suggestion-card")
      .last()
      .boundingBox();
    const composer = await page.locator(".main-composer").boundingBox();
    expect(lastSuggestion!.y + lastSuggestion!.height).toBeLessThan(
      composer!.y,
    );
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(audit.violations).toEqual([]);
  });
}
