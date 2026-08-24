import { expect, test } from "@playwright/test";

const TEST_TITLE = "mauvaise coloration de la plaque et mauvaise migration";
const TEST_DESCRIPTION =
  "la décoloration ne se fait pas bien. on peut apercevoir les trace de la migration mais le haut de la plaque reste colorer.";
const TEST_ASSET =
  "appareil d'électrophorèse - MINIPHORSN: MNP-451450 • LABORATOIRE FSUCOM TOIT ROUGE";
const TEST_TECHNICIAN = "SANO Josué";

async function signIn(page: import("@playwright/test").Page) {
  // Provide credentials through environment variables rather than committing them.
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;

  if (!email || !password) {
    throw new Error("E2E_EMAIL and E2E_PASSWORD must be set to run this test.");
  }

  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
}

test.describe("Création et suivi d’un ordre de travail biomédical", () => {
  test("crée un OT correctif, vérifie sa planification et l’accès aux rapports", async ({ page }) => {
    await signIn(page);

    await expect(page.getByText("BioPulse", { exact: true }).first()).toBeVisible();

    await page.getByRole("link", { name: "Tableau de bord", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);

    await page.getByRole("link", { name: "Discussions", exact: true }).click();
    await expect(page).toHaveURL(/\/chat$/);

    await page.getByRole("link", { name: "Statistiques", exact: true }).click();
    await expect(page).toHaveURL(/\/statistics$/);

    await page.getByRole("link", { name: "Équipements", exact: true }).click();
    await expect(page).toHaveURL(/\/assets$/);
    await expect(page.getByRole("heading", { name: "Gestion des Équipements", exact: true })).toBeVisible();

    // The recorder used a fragile row/column selector here. Prefer the visible action by role.
    const equipmentRow = page.getByRole("row").filter({ hasText: "MINIPHORSN" }).first();
    await expect(equipmentRow).toBeVisible();
    await equipmentRow.getByRole("button").nth(1).click();
    await expect(page.getByRole("heading", { name: "Détails", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Close", exact: true }).click();

    await page.getByRole("link", { name: "Ordres de Travail", exact: true }).click();
    await expect(page).toHaveURL(/\/work-orders$/);
    await expect(page.getByRole("heading", { name: "Ordres de Travail", exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Nouvel OT", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Créer un Ordre de Travail", exact: true })).toBeVisible();

    await page.getByRole("textbox", { name: "Objet de l'intervention", exact: true }).fill(TEST_TITLE);

    await page.getByRole("combobox").filter({ hasText: "Moyenne" }).click();
    await page.getByRole("option", { name: "Élevée", exact: true }).click();
    await expect(page.getByRole("combobox").filter({ hasText: "Élevée" })).toBeVisible();

    await page.getByRole("combobox").filter({ hasText: /Préventive|Corrective/ }).click();
    await page.getByRole("option", { name: "Corrective", exact: true }).click();
    await expect(page.getByRole("combobox").filter({ hasText: "Corrective" })).toBeVisible();

    await page.getByRole("combobox").filter({ hasText: "Choisir un appareil" }).click();
    await page.getByRole("option", { name: TEST_ASSET, exact: true }).click();
    await expect(page.getByRole("combobox").filter({ hasText: "MNP-451450" })).toBeVisible();

    await page.getByRole("button", { name: "Échéance", exact: true }).click();
    await expect(page.getByRole("button", { name: "lundi 24 août 2026", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "lundi 24 août 2026", exact: true }).click();
    await expect(page.getByRole("button", { name: "Échéance", exact: true })).toContainText("24/08/2026");

    await page.getByRole("combobox").filter({ hasText: /Non assigné|Choisir un technicien/ }).click();
    await page.getByRole("option", { name: TEST_TECHNICIAN, exact: true }).click();
    await expect(page.getByRole("combobox").filter({ hasText: TEST_TECHNICIAN })).toBeVisible();

    await page.getByRole("textbox", { name: "Description détaillée", exact: true }).fill(TEST_DESCRIPTION);
    await expect(page.getByRole("textbox", { name: "Description détaillée", exact: true })).toHaveValue(TEST_DESCRIPTION);

    await page.getByRole("button", { name: "Créer l'Ordre de Travail", exact: true }).click();

    await expect(page.getByText("Ordre de travail créé !", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Ordres de Travail", exact: true })).toBeVisible();

    // The planning page reads work_orders directly, so verify that the newly created OT is scheduled.
    await page.getByRole("link", { name: "Planification", exact: true }).click();
    await expect(page).toHaveURL(/\/planning$/);
    await expect(page.getByRole("heading", { name: "Suivi de Planification", exact: true })).toBeVisible();
    await expect(page.getByText(TEST_TITLE, { exact: true })).toBeVisible();

    await page.getByRole("link", { name: "Outils de Travail", exact: true }).click();
    await expect(page).toHaveURL(/\/tools$/);

    await page.getByRole("link", { name: "Rapports", exact: true }).click();
    await expect(page).toHaveURL(/\/reports$/);
    await expect(page.getByRole("heading", { name: "Rapports d'Activité", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Nouveau Rapport", exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Nouveau Rapport", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Créer un Rapport", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Close", exact: true }).click();

    await page.getByRole("link", { name: "Documentation", exact: true }).click();
    await expect(page).toHaveURL(/\/documentation$/);
    await expect(page.getByRole("link", { name: "Mon Profil", exact: true })).toBeVisible();

    await page.getByRole("link", { name: "Mon Profil", exact: true }).click();
    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.getByRole("heading", { name: "Mon Profil", exact: true })).toBeVisible();
  });
});
