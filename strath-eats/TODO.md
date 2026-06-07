# TODO - VendorDashboard recommendations

- [x] Refactor `VendorDashboard.jsx`:
  - [ ] Remove unused imports (e.g., recharts `Legend`)
  - [ ] Improve add-menu-item validation (trim strings; validate numeric price > 0)
  - [ ] Make order badge/CTA labels consistent (based on `order.st` and `order.rm`)
  - [ ] Derive analytics charts from `orders` and/or `menuItems` instead of hardcoded constants
  - [ ] Extract repeated chart tooltip styles into a shared constant
  - [ ] Use stable React keys where possible
  - [ ] Ensure everything still builds/renders
- [ ] Run `npm run build` (or dev server) to verify no errors/warnings


