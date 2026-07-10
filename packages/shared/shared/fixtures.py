"""Load and validate fixture files against shared schemas."""

import json
import os
from pathlib import Path

from pydantic import BaseModel, TypeAdapter

from shared.contract import Contract, Obligation
from shared.invoice import Invoice
from shared.reconciliation import ExceptionFlag


def _find_fixtures_root() -> Path:
    """Locate data/fixtures by walking up from the repo or env override."""
    env_root = os.environ.get("VERITY_REPO_ROOT")
    if env_root:
        return Path(env_root) / "data" / "fixtures"

    for parent in Path(__file__).resolve().parents:
        fixtures = parent / "data" / "fixtures"
        if fixtures.is_dir():
            return fixtures

    msg = "Could not locate data/fixtures — set VERITY_REPO_ROOT if needed"
    raise FileNotFoundError(msg)


_FIXTURES_ROOT = _find_fixtures_root()


class FixtureManifest(BaseModel):
    """Index of a labeled fixture scenario."""

    id: str
    name: str
    description: str
    contract_file: str
    invoice_files: list[str]
    expected_obligations_file: str
    expected_exceptions_file: str


class FixtureSet(BaseModel):
    """Fully loaded and validated fixture scenario."""

    manifest: FixtureManifest
    contract: Contract
    invoices: list[Invoice]
    expected_obligations: list[Obligation]
    expected_exceptions: list[ExceptionFlag]


def _read_json(path: Path) -> object:
    """Read a JSON file and return parsed content."""
    return json.loads(path.read_text(encoding="utf-8"))


def load_fixture(fixture_id: str, *, root: Path | None = None) -> FixtureSet:
    """Load a fixture scenario by ID, validating every file against schemas."""
    base = (root or _FIXTURES_ROOT) / fixture_id
    manifest_path = base / "manifest.json"
    manifest = FixtureManifest.model_validate(_read_json(manifest_path))

    contract = Contract.model_validate(_read_json(base / manifest.contract_file))
    invoices = [
        Invoice.model_validate(_read_json(base / invoice_file))
        for invoice_file in manifest.invoice_files
    ]
    expected_obligations = TypeAdapter(list[Obligation]).validate_python(
        _read_json(base / manifest.expected_obligations_file),
    )
    expected_exceptions = TypeAdapter(list[ExceptionFlag]).validate_python(
        _read_json(base / manifest.expected_exceptions_file),
    )

    return FixtureSet(
        manifest=manifest,
        contract=contract,
        invoices=invoices,
        expected_obligations=expected_obligations,
        expected_exceptions=expected_exceptions,
    )
