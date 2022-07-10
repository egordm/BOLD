from pathlib import Path

BIN_DIR = Path(__file__).parent.parent.absolute() / 'backend' / 'bin'

ROOT_DIR = Path(__file__).parent.parent.parent.absolute()

STORAGE_DIR = ROOT_DIR / 'storage'

IMPORT_DIR = STORAGE_DIR / 'import'
DOWNLOAD_DIR = STORAGE_DIR / 'downloads'
EXPORT_DIR = STORAGE_DIR / 'export'
DATA_DIR = STORAGE_DIR / 'data'

