import http.server
import json
import os
import urllib.parse

PORT = 3000
JSON_FILE = os.path.join(os.path.dirname(__file__), "posts.json")

class AdminHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        if parsed_path.path == "/api/posts":
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            if os.path.exists(JSON_FILE):
                with open(JSON_FILE, "r", encoding="utf-8") as f:
                    self.wfile.write(f.read().encode("utf-8"))
            else:
                self.wfile.write(json.dumps([]).encode("utf-8"))
            return
        
        if parsed_path.path == "/":
            self.path = "/admin.html"
        return super().do_GET()

    def do_POST(self):
        parsed_path = urllib.parse.urlparse(self.path)
        if parsed_path.path == "/api/save":
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            card_data = json.loads(body)

            posts = []
            if os.path.exists(JSON_FILE):
                with open(JSON_FILE, "r", encoding="utf-8") as f:
                    content = f.read().strip()
                    if content:
                        posts = json.loads(content)

            existing_idx = next((i for i, p in enumerate(posts) if p.get("id") == card_data.get("id")), -1)
            if existing_idx != -1:
                posts[existing_idx] = card_data
            else:
                posts.insert(0, card_data)

            with open(JSON_FILE, "w", encoding="utf-8") as f:
                json.dump(posts, f, ensure_ascii=False, indent=4)

            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"success": True}).encode("utf-8"))
            return

    def do_DELETE(self):
        parsed_path = urllib.parse.urlparse(self.path)
        if parsed_path.path == "/api/delete":
            query_params = urllib.parse.parse_qs(parsed_path.query)
            try:
                target_id = int(query_params.get("id", [0])[0])
            except ValueError:
                target_id = 0

            posts = []
            if os.path.exists(JSON_FILE):
                with open(JSON_FILE, "r", encoding="utf-8") as f:
                    content = f.read().strip()
                    if content:
                        posts = json.loads(content)

            posts = [p for p in posts if p.get("id") != target_id]

            with open(JSON_FILE, "w", encoding="utf-8") as f:
                json.dump(posts, f, ensure_ascii=False, indent=4)

            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"success": True}).encode("utf-8"))
            return

if __name__ == "__main__":
    server_address = ("", PORT)
    httpd = http.server.HTTPServer(server_address, AdminHandler)
    print(f"\n===========================================")
    print(f"[posts.json 시각 관리자 실행 완료 (Python)]")
    print(f"브라우저에서 접속하세요: http://localhost:{PORT}")
    print(f"===========================================\n")
    httpd.serve_forever()