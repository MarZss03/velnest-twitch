"""Fetch pinned, checked Poly Haven CC0 source models for the VELNEST room.

Downloaded files and provenance stay on the project's D: drive. The runtime uses
the optimized Blender export, never the API or third-party texture hosts.
"""
import concurrent.futures
import hashlib
import json
from pathlib import Path
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
DEST = ROOT / 'art/vendor/polyhaven'
ASSETS = ('modern_arm_chair_01', 'modern_coffee_table_02',
          'potted_plant_02', 'desk_lamp_arm_01')

def get(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'VELNEST asset preparation/1.0'})
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read()

def fetch_asset(asset):
    folder = DEST / asset
    folder.mkdir(parents=True, exist_ok=True)
    info = json.loads(get(f'https://api.polyhaven.com/info/{asset}'))
    files = json.loads(get(f'https://api.polyhaven.com/files/{asset}'))
    model = files['gltf']['1k']['gltf']
    entries = {f'{asset}_1k.gltf': model, **model['include']}
    checked = []
    def download(entry):
        relative, metadata = entry
        target = folder / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        content = target.read_bytes() if target.exists() else get(metadata['url'])
        if hashlib.md5(content).hexdigest() != metadata['md5']:
            raise ValueError(f'Checksum mismatch: {asset}/{relative}')
        target.write_bytes(content)
        return {'file': relative, 'url': metadata['url'], 'bytes': len(content),
                'sha256': hashlib.sha256(content).hexdigest(), 'upstream_md5': metadata['md5']}
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        checked = list(pool.map(download, entries.items()))
    provenance = {'asset': asset, 'name': info.get('name'), 'authors': info.get('authors'),
                  'source': f'https://polyhaven.com/a/{asset}', 'license': 'CC0-1.0',
                  'license_url': 'https://polyhaven.com/license', 'resolution': '1k',
                  'retrieved': '2026-10-28', 'files': checked}
    (folder / 'source.json').write_text(json.dumps(provenance, indent=2), encoding='utf8')
    print(f'{asset}: {len(checked)} verified files, {sum(x["bytes"] for x in checked):,} bytes')

if __name__ == '__main__':
    for asset in ASSETS:
        fetch_asset(asset)
