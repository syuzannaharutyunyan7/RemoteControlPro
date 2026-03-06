# RemoteControlPro 🖱💻

Take control of your computer **mouse and keyboard remotely** from your phone! RemoteControlPro works on **macOS and Windows**, and you can run it straight from Python or build your own standalone app.

---

## Features

**Mouse Control**

* Move the cursor with adjustable speed
* Left-click and right-click (two-finger tap on Mac trackpads)
* MacBook-style touchpad scrolling

**Keyboard Control**

* Type text remotely
* Supports Backspace, Enter, Tab, Escape, and regular characters

**Security**

* PIN-protected access
* First-time users can create a PIN automatically

**Quick Connection**

* Scan a QR code to connect your phone instantly

---

## Installation & Running from Source

1. **Clone the repository:**

```bash
git clone https://github.com/<your-username>/RemoteControlPro.git
cd RemoteControlPro
```

2. **Install dependencies:**

```bash
pip install -r requirements.txt
```

3. **Start the server:**

```bash
python main.py
```

4. **Connect your phone:**
   Open the URL printed in your terminal, or simply scan the QR code.

---

## How to Use

1. Run `main.py` to start the server.
2. If it’s your first time, create a **PIN**.
3. Scan the QR code from your phone.
4. **Mouse control:**

   * Single tap → left click
   * Two-finger tap → right click
5. **Keyboard control:**

   * Type in the input field to send text to your computer.
6. **Extra buttons:** Left/right click, scroll, and more.

---

## Security

* Only devices with the correct PIN can control your computer.
* PINs are stored locally in `pin.txt` for persistent login.
* Easy PIN setup for first-time users.

---

## Folder Structure

```txt
RemoteControlPro/
├─ main.py           # Main server script
├─ pin.txt           # Stores server PIN
├─ templates/        # HTML templates
├─ static/           # JS, CSS, socket.io files
├─ requirements.txt  # Python dependencies
```

---

## Building a Standalone App 

Want a version you can run without Python? Build an executable:

**macOS:**

```bash
pyinstaller --onedir --windowed --add-data=templates:templates --add-data=static:static --add-data=pin.txt:. main.py
```

**Windows:**

```cmd
pyinstaller --onefile --windowed --add-data=templates;templates --add-data=static;static --add-data=pin.txt;. main.py
```

> This generates a runnable app ready to go on your system.

---

## License

MIT License

---
