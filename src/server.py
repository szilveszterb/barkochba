from flask import Flask, redirect, send_from_directory


app = Flask(__name__, static_url_path="")


@app.route("/static/<path:path>")
def serve_static(path):
    return send_from_directory("static", path)


@app.route("/")
@app.route("/index")
def redirect_index():
    return redirect("/static/index.html")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)