# AI Hub aihubshell 다운로드 (Linux/macOS/Git Bash)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TOOLS_DIR="$ROOT/tools"
mkdir -p "$TOOLS_DIR"

echo "Downloading aihubshell..."
curl -fsSL -o "$TOOLS_DIR/aihubshell" "https://api.aihub.or.kr/api/aihubshell.do"
chmod +x "$TOOLS_DIR/aihubshell"

echo "Done. Set AIHUB_SHELL_PATH=$TOOLS_DIR/aihubshell in .env.local (optional)"
