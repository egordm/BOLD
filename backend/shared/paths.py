from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent.parent.absolute()

STORAGE_DIR = ROOT_DIR / 'storage'

IMPORT_DIR = STORAGE_DIR / 'import'
DOWNLOAD_DIR = STORAGE_DIR / 'downloads'
