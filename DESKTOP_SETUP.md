# Moldable — Desktop Setup (free LOCAL AI mesh on an RTX 3080)

This guide gets Moldable running on a fresh Windows or Linux desktop and wires its
"Sculpt from photo" feature to a **free, local, no-token** AI-mesh backend
(Tencent **Hunyuan3D-2.1**, with Microsoft **TRELLIS** as an optional alternative)
running on an **RTX 3080 (10–12 GB)**.

There are **three** moving parts:

| Part | Runtime | Port | What it does |
|---|---|---|---|
| 1. Static app | Python `http.server` | 8765 | Serves `Moldable.dc.html` in the browser |
| 2. Mesh bridge | Node (`tools/local-mesh-bridge.mjs`) | 8788 | Meshy-shaped API → calls the local AI server → runs `mesh-print.py` → serves a print-ready GLB |
| 3. AI mesh server | Python + CUDA (Hunyuan3D) | 8080 | The GPU image→3D model (the only part that needs the 3080) |

Parts 1 and 2 are lightweight and CPU-only. Part 3 is a heavy, separate CUDA install
and is where almost all of the effort and all of the VRAM go.

> **VRAM reality, up front (honest):** The common RTX 3080 is **10 GB**. That is
> enough for **shape-only** image→3D and nothing more.
> **PBR texture generation (≈21 GB on 2.1) is impossible on a 10 GB card — do not enable it.**
> Even shape-only at full precision is **OOM-prone on 10 GB**; you will likely need
> `octree_resolution` lowered to 128–192, `PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True`,
> and CPU offload / low-VRAM mode. A **12 GB** 3080/3080-Ti is the comfortable floor for
> shape-only. The bridge defaults (texture off, octree 256) are already tuned for this;
> on a 10 GB card drop octree further if you hit OOM.
>
> **System RAM matters too — it's not just the GPU.** The GPU does the math, but the model
> weights and (especially) any **CPU-offload / low-VRAM mode** live in system RAM. The
> tradeoff: the more you offload to fit a 10 GB card, the more RAM you need. Budget **≥16 GB
> RAM minimum, 32 GB comfortable**; the WinPortable `mmgp` build that drops VRAM to ~3 GB
> explicitly needs **≥24 GB system RAM**. Add a one-time **~5–10 GB disk** download for the
> weights (HuggingFace cache; set `HF_HOME` to relocate). The Node bridge + `mesh-print.py`
> are light (CPU, a few hundred MB).

---

## 0. Get the code

```bash
gh repo clone Choaterboater/moldable Moldable    # or: git clone https://github.com/Choaterboater/moldable Moldable
cd Moldable
```

All commands below assume your shell is **in the Moldable repo root** — this matters:
`local-mesh-bridge.mjs` invokes `tools/mesh-print.py` by **relative path**, so it must be
launched with the repo root as its working directory or remeshing silently falls back to
serving the raw mesh.

---

## 1. Install runtimes (Node + Python for the app & bridge)

You need **Node.js LTS** (24.x or 22.x) and **Python 3.10–3.12**. No `npm install` is
required — the bridge uses only Node built-ins and global `fetch` (Node 18+).

### Windows (PowerShell, run as Administrator for the installs)

```powershell
winget install -e --id OpenJS.NodeJS.LTS
winget install -e --id Python.Python.3.12
# close & reopen PowerShell so PATH refreshes, then verify:
node -v
python --version
py --version
```

### Linux (Debian/Ubuntu)

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs python3 python3-venv python3-pip
node -v
python3 --version
```
(Fedora/RHEL: `sudo dnf install nodejs python3 python3-pip`. Arch: `sudo pacman -S nodejs npm python`.)

---

## 2. Install the `mesh-print.py` Python deps (lightweight, CPU-only)

Keep this in its own venv — it is small and must NOT be mixed with the heavy CUDA env in step 4.

### Windows
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1     # if blocked: Set-ExecutionPolicy -Scope Process RemoteSigned
python -m pip install --upgrade pip
pip install trimesh numpy scikit-image fast-simplification
```

### Linux
```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install trimesh numpy scikit-image fast-simplification
```

- `scikit-image` is required by the `--voxel` (watertight) path (`skimage.measure.marching_cubes`).
- `fast-simplification` backs the decimation used in the `--clean`/`--voxel` branch.

Smoke-test it on any GLB once you have one:
```bash
python tools/mesh-print.py in.glb out.stl --size 80 --voxel 0.8   # Windows: python ; Linux: python3
```

---

## 3. Run the static app + the bridge (without the GPU server yet)

You can stand these up now and confirm the wiring; the GPU server in step 4 is what
actually fulfils generation.

**Terminal #1 — static app**
```bash
python3 -m http.server 8765          # Windows: python -m http.server 8765
# open http://127.0.0.1:8765/Moldable.dc.html
```

**Terminal #2 — mesh bridge** (venv active so the spawned Python is found)
```bash
# Linux/macOS:
node tools/local-mesh-bridge.mjs

# Windows PowerShell:
node tools\local-mesh-bridge.mjs
```
The bridge logs: `ready on http://localhost:8788 -> Hunyuan3D http://127.0.0.1:8080 (generate) -> mesh-print -> GLB`

### ✅ Windows: Python + temp dir are handled automatically
The bridge now **auto-detects the Python command** — it runs `python` on Windows and
`python3` elsewhere (override with `$env:PYTHON="py"` if your install differs), and it
writes temp GLBs to the OS temp dir via `os.tmpdir()` (no need to set `TMPDIR`). Just make
sure the `python` it finds is the one with your step-2 venv deps (activate the venv in the
same terminal, or set `$env:PYTHON` to that venv's `python.exe`).

### ⚠ Gotcha — launch from the repo root
`mesh-print.py` is referenced relatively. If you run `node /full/path/.../local-mesh-bridge.mjs`
from another directory, Python can't find the script and the bridge serves the raw mesh.
Always `cd` into the Moldable root first.

---

## 4. Install + run the local AI-mesh server (the RTX 3080 part)

This is the large, separate install. **Primary = Hunyuan3D-2.1, shape-only.** You only
need the shape pipeline — this lets you **skip the two fragile custom CUDA-kernel builds**
(`custom_rasterizer`, `DifferentiableRenderer`), which exist only for texturing.

### 4A. Linux — Hunyuan3D-2.1 (recommended for the server)

```bash
git clone https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1
cd Hunyuan3D-2.1

conda create -n hunyuan3d python=3.10 -y
conda activate hunyuan3d

# PyTorch cu124 runs fine on Ampere/RTX 3080
pip install torch==2.5.1 torchvision==0.20.1 torchaudio==2.5.1 \
  --index-url https://download.pytorch.org/whl/cu124

pip install -r requirements.txt
# SHAPE-ONLY: STOP here. Do NOT build custom_rasterizer / DifferentiableRenderer,
# and do NOT download the RealESRGAN/PBR weights — those are texture-only.
```

> ⚠ **Verify before relying on `api_server.py`:** Hunyuan3D-2.1's stock `api_server.py`
> imports the model worker, which on some commits pulls in the texture/paint pipeline and
> therefore **requires the custom CUDA kernels to even start**. Check the cloned repo's
> `model_worker.py`/`api_server.py` imports. If it refuses to start shape-only, you have
> two honest options:
> 1. Build the two CUDA kernels anyway (needs nvcc/CUDA-toolkit 12.4 + a C++ compiler:
>    `conda install -c nvidia cuda-toolkit=12.4`, then
>    `cd hy3dpaint/custom_rasterizer && pip install -e . && cd ../..` and
>    `cd hy3dpaint/DifferentiableRenderer && bash compile_mesh_painter.sh && cd ../..`).
>    The `custom_rasterizer` path may be nested under `hy3dpaint/packages/` in some checkouts —
>    verify the actual tree. **(uncertain / repo-dependent)**
> 2. Use **Hunyuan3D-2.0** (`github.com/Tencent/Hunyuan3D-2`) instead — it has the more
>    mature FlashVDM / `enable_model_cpu_offload()` low-VRAM paths and the same
>    `/generate` `/send` `/status` API server, and is the safer bet for a 10 GB card.

**Launch the API server (match the bridge's expected port 8080):**
```bash
PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True \
python api_server.py --host 0.0.0.0 --port 8080
```
> ⚠ **Port note:** `api_server.py`'s argparse **default port is 8081**, but the bridge's
> default `HUNYUAN_URL` is **8080**. Either pass `--port 8080` (shown above) **or** keep
> 8081 and start the bridge with `HUNYUAN_URL=http://127.0.0.1:8081`. They must agree.

Weights auto-download from HuggingFace (`tencent/Hunyuan3D-2.1`, shape subfolder
`hunyuan3d-dit-v2-1`) on first run; set `HF_HOME` to control the cache location.

**Sanity-check it (raw base64, no data-URI prefix):**
```bash
curl http://localhost:8080/health
B64=$(base64 -w0 input.png)                 # macOS: base64 -i input.png | tr -d '\n'
curl -s -X POST http://localhost:8080/send -H 'content-type: application/json' \
  -d "{\"image\":\"$B64\",\"texture\":false,\"remove_background\":true,\"octree_resolution\":256}"
# -> {"uid":"..."} ; then poll:
curl http://localhost:8080/status/<uid>      # {"status":"completed","model_base64":"..."}
```

### 4B. Windows — Hunyuan3D one-click portable (easiest)

Use **YanWenKun's WinPortable** build: <https://github.com/YanWenKun/Hunyuan3D-2-WinPortable>.
It bundles 2.0+2.1 plus `mmgp` low-VRAM offloading (geometry in ~3 GB VRAM, but needs
≥24 GB **system RAM**), so it sidesteps the CUDA-kernel compile entirely.

1. NVIDIA driver ≥ 576.57; ≥ 24 GB system RAM.
2. Download the CUDA build for Ampere — current names are
   `Hunyuan3D2_WinPortable_cu129.7z.001/.002` (newer default) or the `cu126` equivalent;
   either works on a 3080.
3. Extract to a **short path** (e.g. `C:\AI\HY3D2`), enable Windows **Developer Mode**
   (for symlinks), run `UPDATE.bat` then `RUN.bat`.
4. It opens a Gradio UI (default `http://localhost:8080/`). **(uncertain)** The WinPortable
   build is primarily a Gradio app; confirm whether it also exposes the `api_server.py`
   `/generate` `/send` `/status` REST endpoints the bridge needs. If it only serves Gradio,
   either run `api_server.py` from inside its bundled Python, or use the manual conda route
   (4A adapted to Windows: same conda/pip steps; skip texture to avoid MSVC+CUDA compiles).

For a manual Windows GPU install, **WSL2 + Ubuntu is usually smoother** than native Windows
for the Hunyuan Python/CUDA stack — Moldable + the bridge can still run on native Windows.

### 4C. Optional alternative — Microsoft TRELLIS (fp16 fork)

An RTX 3080 can run TRELLIS, but **not** the official `microsoft/TRELLIS` repo unmodified
(it expects 16 GB+ and Linux). Use the fp16 fork
**IgorAherne/trellis-stable-projectorz**, which adds half-precision ("fits 8 GB") and a
FastAPI server:

```bash
# Windows: download the one-click bundle (own Python 3.11 + Torch 2.7 + CUDA 12.8)
#   v40_py311_trellis_stableprojectorz.zip from the repo's releases.
# Manual (Win/Linux):
git clone --recurse-submodules https://github.com/IgorAherne/trellis-stable-projectorz.git
cd trellis-stable-projectorz/code && git submodule update --init --recursive
pip install -r requirements.txt
python api_spz/main_api.py --ip 127.0.0.1 --port 7960 --precision half   # MUST pass half on a 3080
```
On a 10 GB card also enable NVIDIA Control Panel → "CUDA - Sysmem Fallback Policy" →
*Prefer Sysmem Fallback*, keep `texture_size` ≤ 1024, and run one job at a time (TRELLIS is single-job).

> ⚠ **TRELLIS is NOT drop-in with the current bridge.** Its API is different
> (`POST /generate` with a different body, `GET /status` → `COMPLETE`,
> `GET /download/model` for the GLB) from Hunyuan's `/generate` `/send` `/status`.
> Using it requires a small adapter in `local-mesh-bridge.mjs` (a `HY_BACKEND=trellis`
> branch). It is documented here as an alternative, not wired by default.

---

## 5. Point Moldable at the local bridge

1. Open `http://127.0.0.1:8765/Moldable.dc.html`.
2. Click the gear → **Settings** → **AI mesh** section.
3. Set **provider = "Replicate"** (this is the bridge-style provider whose base URL is the
   plain bridge address). In the base URL field confirm it reads exactly:
   ```
   http://localhost:8788
   ```
   > Note: the "Custom / bridge" provider auto-fills `http://localhost:8788/v1` (with `/v1`).
   > The bridge tolerates the `/v1` suffix, but choosing **Replicate** gives the clean
   > `http://localhost:8788` and avoids confusion. No token is needed for the local bridge.
4. (Optional) **Quality**: `detail` (keep detail, slicer auto-repairs) or `watertight`
   (the bridge passes `--voxel 0.8` to `mesh-print.py` for a sealed manifold).
5. Save.

### Smoke test
With all three servers up (8765 app, 8788 bridge, 8080 Hunyuan):
1. Sculpt-from-photo → pick an image → submit.
2. Watch the bridge terminal: `submitted to local Hunyuan` → `Hunyuan done -> remeshing` →
   `print-ready GLB ready`. The GLB loads back into the Moldable viewer.
3. If you see `mesh-print produced nothing — serving the RAW mesh`, mesh-print failed —
   almost always the `python` it found lacks your step-2 deps (activate the venv in the bridge's terminal, or set `$env:PYTHON`) — or a wrong cwd.

---

## 6. Bridge environment variables (tuning)

`tools/local-mesh-bridge.mjs` reads:

| Var | Default | Notes |
|---|---|---|
| `PORT` | `8788` | Bridge listen port (keep it so the GUI default works) |
| `HUNYUAN_URL` | `http://127.0.0.1:8080` | Where your AI server listens — **must match step 4** |
| `HUNYUAN_MODE` | `generate` | `generate` = sync `/generate` run in background; `async` = `/send`+`/status` |
| `MESH_SIZE` | `80` | Longest-axis mm passed to `mesh-print.py` |
| `HUNYUAN_STEPS` | `30` | `num_inference_steps`; 20–30 is plenty, lower = faster |
| `HUNYUAN_OCTREE` | `256` | `octree_resolution`; **drop to 128–192 on a 10 GB card** if OOM; 384 will OOM |
| `HUNYUAN_TEXTURE` | off | **Leave OFF on a 3080** — texture needs ~21 GB; printing doesn't need it |
| `TMPDIR` | OS temp dir | Auto (`os.tmpdir()`) on Win/Linux/macOS — override only to relocate temp GLBs |
| `PYTHON` | `python` (Win) / `python3` | The Python with your step-2 deps — set to your venv's `python` if it's not on PATH |

The bridge **serializes generations** (one GPU job at a time) — a 10 GB 3080 can't run two at once, so concurrent sculpts queue automatically.

Example:
```bash
HUNYUAN_URL=http://127.0.0.1:8081 HUNYUAN_MODE=async MESH_SIZE=90 HUNYUAN_OCTREE=192 \
  node tools/local-mesh-bridge.mjs
```

---

## Troubleshooting quick reference
- **Bridge logs "serving the RAW mesh"** → mesh-print didn't run: the `python` it found lacks the step-2 deps (set `$env:PYTHON` to your venv's python), wrong cwd, or a missing pip dep.
- **Submit hangs / browser times out** → AI server not reachable on `HUNYUAN_URL`, or port mismatch (8080 vs 8081).
- **CUDA OOM on the AI server** → lower `HUNYUAN_OCTREE` (192→128), set `PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True`, ensure `HUNYUAN_TEXTURE` is off, use 2.0 + CPU offload, or the WinPortable mmgp build.
- **`/status` casing differs** → confirm the exact strings your server returns (`processing`/`completed`/`error`) and adjust `runTask()` if a fork differs.
- **Firewall prompt (Windows)** on first `node`/`python` listen → allow on Private networks (localhost-only works even if you decline public).
