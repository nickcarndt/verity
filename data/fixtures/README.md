# Fixtures

Synthetic contracts and invoices for development, evals, and demos.

## Scenarios

| ID | Description | Exception types covered |
|---|---|---|
| `nextera-systems` | Nextera Systems SaaS agreement with 5 invoices | overbilling, missing_po, out_of_term, duplicate_invoice |

## Layout

Each scenario is a self-contained directory:

```
nextera-systems/
  manifest.json              # index of files in the scenario
  contract.json              # vendor master agreement + clauses
  invoices/                  # structured invoice JSON
  labels/
    expected_obligations.json  # ground truth for evals (Phase 4+)
    expected_exceptions.json   # labeled exceptions for evals (Phase 4+)
```

## Loading fixtures

```python
from shared.fixtures import load_fixture

fixture = load_fixture("nextera-systems")
print(fixture.contract.vendor_name)       # Nextera Systems, Inc.
print(len(fixture.invoices))              # 5
print(len(fixture.expected_exceptions))   # 4
```

Install the shared package first:

```bash
cd packages/shared && pip install -e .
```

## Design notes

- `inv-2025-001` is the **clean** invoice — no exceptions expected.
- Dollar amounts use string decimals in JSON for precision; Pydantic coerces to `Decimal`.
- Label files are ground truth for the Braintrust eval harness in later phases.
