from flask import Flask, render_template, request
from flask_socketio import SocketIO
from pynput.mouse import Controller as MouseController, Button
from pynput.keyboard import Controller as KeyboardController, Key
import socket
import qrcode
import os
import random
import tkinter as tk
import threading

# ---------------- CONFIG ----------------
app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*")

mouse = MouseController()
keyboard = KeyboardController()
MOUSE_SPEED = 2.5
authorized_clients = set()
PIN_FILE = "pin.txt"

# ---------------- PIN SYSTEM ----------------
def get_or_create_pin():
    if not os.path.exists(PIN_FILE):
        pin = str(random.randint(1000, 9999))
        with open(PIN_FILE, "w") as f:
            f.write(pin)
        print("First run detected. Generated PIN:", pin)
        return pin
    else:
        with open(PIN_FILE, "r") as f:
            return f.read().strip()

def get_current_pin():
    with open(PIN_FILE, "r") as f:
        return f.read().strip()

def change_pin():
    new_pin = input("Enter new PIN: ").strip()
    if len(new_pin) < 4:
        print("PIN must be at least 4 digits")
        return
    with open(PIN_FILE, "w") as f:
        f.write(new_pin)
    print("PIN successfully updated!")

# ---------------- ROUTES ----------------
@app.route("/")
def home():
    return "Server Running ✅"

@app.route("/remote")
def remote():
    return render_template("remote.html")

# ---------------- SOCKET EVENTS ----------------
@socketio.on("authenticate")
def authenticate(data):
    pin = data.get("pin", "")
    sid = request.sid
    current_pin = get_current_pin()  # always read latest PIN
    if pin == current_pin:
        authorized_clients.add(sid)
        socketio.emit("auth_response", {"status": "success"}, to=sid)
    else:
        socketio.emit("auth_response", {"status": "fail"}, to=sid)

@socketio.on("move_cursor")
def move_cursor(data):
    if request.sid not in authorized_clients:
        return
    dx = float(data.get("dx", 0)) * MOUSE_SPEED
    dy = float(data.get("dy", 0)) * MOUSE_SPEED
    x, y = mouse.position
    mouse.position = (x + dx, y + dy)

@socketio.on("click")
def click(data):
    if request.sid not in authorized_clients:
        return
    button = data.get("button", "left")
    btn = Button.left if button == "left" else Button.right
    mouse.press(btn)
    mouse.release(btn)

@socketio.on("scroll")
def scroll(data):
    if request.sid not in authorized_clients:
        return
    dy = int(data.get("dy", 0))
    mouse.scroll(0, -dy)

@socketio.on("type_text")
def type_text(data):
    if request.sid not in authorized_clients:
        return
    key = data.get("key", "")
    special_keys = {
        "backspace": Key.backspace,
        "enter": Key.enter,
        "esc": Key.esc,
        "tab": Key.tab,
        "space": Key.space,
        "up": Key.up,
        "down": Key.down,
        "left": Key.left,
        "right": Key.right
    }
    if key in special_keys:
        keyboard.press(special_keys[key])
        keyboard.release(special_keys[key])
    elif len(key) == 1:
        keyboard.type(key)

# ---------------- NETWORK ----------------
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

def start_server():
    socketio.run(app, host="0.0.0.0", port=5050)

def show_qr():
    ip = get_local_ip()
    url = f"http://{ip}:5050/remote"
    print("Phone URL:", url)
    qr = qrcode.make(url)
    qr.show()

# ---------------- GUI ----------------
def launch_gui():
    window = tk.Tk()
    window.title("Remote Mouse Server")
    window.geometry("300x250")

    label = tk.Label(window, text="Remote Mouse Server", font=("Arial", 16))
    label.pack(pady=10)

    pin_label = tk.Label(window, text="Current PIN: " + get_current_pin())
    pin_label.pack(pady=5)

    btn1 = tk.Button(window, text="Start Server",
                     command=lambda: threading.Thread(target=start_server).start(),
                     width=20)
    btn1.pack(pady=5)

    btn2 = tk.Button(window, text="Connect Phone",
                     command=show_qr, width=20)
    btn2.pack(pady=5)

    btn3 = tk.Button(window, text="Change PIN",
                     command=change_pin, width=20)
    btn3.pack(pady=5)

    window.mainloop()

# ---------------- MAIN ----------------
if __name__ == "__main__":
    get_or_create_pin()  # ensure PIN exists
    launch_gui()