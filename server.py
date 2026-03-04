from flask import Flask, render_template
from flask_socketio import SocketIO
from pynput.mouse import Controller as MouseController, Button
from pynput.keyboard import Controller as KeyboardController

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*")

mouse = MouseController()
keyboard = KeyboardController()

@app.route("/")
def index():
    return "Remote Mouse Server Running"

@app.route("/remote")
def remote():
    return render_template("remote.html")

# Move mouse (relative movement)
@socketio.on("move_cursor")
def handle_move(data):
    dx = int(data.get("dx", 0))
    dy = int(data.get("dy", 0))

    x, y = mouse.position
    mouse.position = (x + dx, y + dy)

# Mouse click
@socketio.on("click")
def handle_click(data):
    button = data.get("button", "left")
    btn = Button.left if button == "left" else Button.right
    mouse.press(btn)
    mouse.release(btn)

# Keyboard typing
@socketio.on("type")
def handle_type(data):
    text = data.get("text", "")
    keyboard.type(text)

def start_server():
    socketio.run(app, host="0.0.0.0", port=5050)