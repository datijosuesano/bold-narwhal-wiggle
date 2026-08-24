# Recorded Journey — GMAO navigation and work-order creation

## Purpose

Stabilize the recorded critical journey by preferring accessible locators and avoiding generated Radix/CSS selectors.

## Stable selector repairs identified

- Equipment **Voir** action: add `data-testid="asset-view-button"` to the `Eye` action button in `src/pages/AssetsPage.tsx`.
- Work-order **Échéance** trigger: add `data-testid="work-order-due-date"` to the outline `Button` wrapping the calendar popover in `src/components/WorkOrders/WorkOrderForm.tsx`.

The current source confirms that the equipment action is a semantic `Button` containing `Eye`, while the due-date control is a semantic `Button` containing the calendar icon. Avoid selectors based on `nth-of-type` or Radix-generated ids.

## Assertions proposed

1. After opening **Équipements**, the equipment inventory is visible.
2. After opening an equipment detail, the detail view is visible.
3. After opening **Ordres de Travail**, the **Nouvel OT** action is visible.
4. After filling the work-order form, the entered subject and description remain visible/selected.
5. After selecting priority **Élevée**, maintenance type **Corrective**, the specified equipment, due date, and technician, the form contains those selections.
6. After creating the OT, the creation action completes and the work order is represented in the application rather than asserting against incidental layout clicks.
7. The **Interventions**, **Planification**, **Rapports**, **Documentation**, and **Mon Profil** navigation targets can be opened by their accessible names.
8. The Reports page exposes **Voir Aperçu PDF** and **Nouveau Rapport** when their corresponding controls are present.

## Recorded actions deliberately not treated as assertions

The repeated clicks/double-clicks against calendar table cells, Radix dialog containers, `body`, and layout containers are incidental recording noise. They should not become test assertions or stable selectors.
