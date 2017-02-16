from flask import Flask, redirect
import os
import argparse
from flask import request, Response
import requests

app = Flask(__name__,
            static_url_path="",
            static_folder="static")

AKINATOR_API_BASE = "http://api-en4.akinator.com/"

@app.route("/")
def root_index():
    return app.send_static_file("index.html")


@app.route("/api/aki/<path:path>")
def proxy_engine(path):
    def assemble_url(host, path, query):
        result = ""
        if host:
            result += host
        if path:
            result += path
        if query:
            result += "?" + query
        return result
    query = request.query_string.decode("utf-8")
    remote_url = assemble_url(AKINATOR_API_BASE, path, query)
    print("PROXY: " + remote_url )
    resp = requests.get(remote_url )
    return Response(resp.content, headers={
        "Content-Type": resp.headers.get("Content-Type", None)
    })


def main():
    def get_port(args):
        port = args.port
        if port is None:
            port = os.environ.get("PORT", 5000)
        return int(port)

    parser = argparse.ArgumentParser()
    parser.add_argument("-p", "--port")
    args = parser.parse_args()

    port = get_port(args)
    app.run(host='0.0.0.0', port=port)


if __name__ == "__main__":
    main()
