#!/usr/bin/env python3
import http.server
import socketserver
import os
import mimetypes
from urllib.parse import urlparse

class SPAHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        super().end_headers()

    def do_GET(self):
        # Parse the URL path
        url_path = urlparse(self.path).path

        # Check if it's a file request (has an extension)
        if '.' in os.path.basename(url_path):
            # It's a file request, handle normally
            super().do_GET()
        else:
            # It's likely a React Router route, serve index.html
            self.path = '/index.html'
            super().do_GET()

# Change to the dist directory
os.chdir('/Users/mounikakapa/job-automation-ai/frontend/dist')

# Setup the server
PORT = 3001
with socketserver.TCPServer(("", PORT), SPAHTTPRequestHandler) as httpd:
    print(f"SPA Server serving at http://localhost:{PORT}")
    print("This server handles React Router routes correctly")
    httpd.serve_forever()
