import json
import subprocess
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
PORT = 8000


class AdminHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(BASE_DIR), **kwargs)

    def do_POST(self):
            if self.path != "/api/git-push":
                self.send_response(404)
                self.end_headers()
                return

            try:
                content_length = int(self.headers.get("Content-Length", 0))
                raw_body = self.rfile.read(content_length).decode("utf-8")
                payload = json.loads(raw_body) if raw_body else {}

                file_name = Path(payload.get("fileName", "db.json")).name
                data = payload.get("data", {})

                target_file = BASE_DIR / file_name
                target_file.write_text(
                    json.dumps(data, ensure_ascii=False, indent=4) + "\n",
                    encoding="utf-8",
                )

                proc = subprocess.run(
                    ["git", "lazy"],
                    cwd=str(BASE_DIR),
                    capture_output=True,
                    text=True,
                    shell=False,
                )

                output = (proc.stdout or proc.stderr or "").strip()
                if proc.returncode != 0:
                    self._send_json(500, {"ok": False, "error": output or "git lazy 실행 실패"})
                    return

                self._send_json(200, {"ok": True, "message": output or "푸시가 완료되었습니다."})
            except Exception as exc:
                self._send_json(500, {"ok": False, "error": str(exc)})

    def _send_json(self, status_code: int, body: dict):
        encoded = json.dumps(body, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", PORT), AdminHandler)
    print(f"Serving at http://127.0.0.1:{PORT}")
    server.serve_forever()