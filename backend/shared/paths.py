from backend import settings

BIN_DIR = settings.BASE_DIR / 'backend' / 'bin'
"""The path to the backend/bin directory."""

IMPORT_DIR = settings.STORAGE_DIR / 'import'
"""The path to the import directory."""

DOWNLOAD_DIR = settings.STORAGE_DIR / 'downloads'
"""The path to the downloads directory."""

EXPORT_DIR = settings.STORAGE_DIR / 'export'
"""The path to the export directory."""

DATA_DIR = settings.STORAGE_DIR / 'data'
"""The path to the data directory."""
