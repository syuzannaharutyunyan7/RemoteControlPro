from flask import Flask, render_template
from flask_socketio import SocketIO
from pynput.mouse import Controller as MouseController, Button
from pynput.keyboard import Controller as KeyboardController, Key
import socket
import qrcode

# ------------------ SETUP ------------------
app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*")

mouse = MouseController()
keyboard = KeyboardController()

# ------------------ ROUTES ------------------
@app.route("/")
def home():
    return "Server Running ✅"

@app.route("/remote")
def remote():
    return render_template("remote.html")

# ------------------ SOCKET EVENTS ------------------
@socketio.on("move_cursor")
def move_cursor(data):
    dx = int(data.get("dx", 0))
    dy = int(data.get("dy", 0))
    x, y = mouse.position
    mouse.position = (x + dx, y + dy)

@socketio.on("click")
def click(data):
    button = data.get("button", "left")
    btn = Button.left if button == "left" else Button.right
    mouse.press(btn)
    mouse.release(btn)

@socketio.on("type_text")
def type_text(data):
    key = data.get("key", "")
    if key == "backspace":
        keyboard.press(Key.backspace)
        keyboard.release(Key.backspace)
    elif len(key) == 1:
        keyboard.type(key)

# ------------------ QR CODE ------------------
def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    except:
        ip = "127.0.0.1"
    finally:
        s.close()
    return ip

if __name__ == "__main__":
    local_ip = get_local_ip()
    url = f"http://{local_ip}:5050/remote"
    print("\nOpen this on your phone:", url)

    qr = qrcode.make(url)
    qr.show()

    socketio.run(app, host="0.0.0.0", port=5050)