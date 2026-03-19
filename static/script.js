const socket = io();
let authorized = false;

let pin = prompt("Enter server PIN:");
socket.emit("authenticate", { pin: pin });

socket.on("auth_response", (data) => {
    if (data.status === "success") {
        authorized = true;
        alert("Connected!");
    } else {
        alert("Wrong PIN");
    }
});

const touchpad = document.getElementById("touchpad");
let lastX = 0, lastY = 0;
let isDragging = false;
let isScrolling = false;
let touchStartTime = 0;
let longPressTimeout = null;

touchpad.addEventListener("touchstart", e => {
    if (!authorized) return;
    const t = e.touches[0];
    lastX = t.clientX;
    lastY = t.clientY;
    isDragging = false;
    isScrolling = false;
    touchStartTime = Date.now();

    // Long-press detection for right-click
    if (e.touches.length === 1) {
        longPressTimeout = setTimeout(() => {
            socket.emit("click", { button: "right" });
        }, 600); // 600ms long press = right click
    }
});

touchpad.addEventListener("touchmove", e => {
    if (!authorized) return;

    const t = e.touches[0];

    if (e.touches.length === 1) {
        let dx = t.clientX - lastX;
        let dy = t.clientY - lastY;

        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
            isDragging = true;
            clearTimeout(longPressTimeout); // cancel long press if moving
        }

        socket.emit("move_cursor", { dx, dy });
    }

    if (e.touches.length === 2) {
        isScrolling = true;
        clearTimeout(longPressTimeout);

        // Average vertical movement between two fingers
        const t2 = e.touches[1];
        const dy = ((t.clientY - lastX) + (t2.clientY - lastY)) / 2;
        socket.emit("scroll", { dy });
    }

    lastX = t.clientX;
    lastY = t.clientY;
    e.preventDefault();
});

touchpad.addEventListener("touchend", e => {
    if (!authorized) return;
    clearTimeout(longPressTimeout);

    const touchDuration = Date.now() - touchStartTime;

    // Single finger tap → left click if not dragging or long press
    if (!isDragging && !isScrolling && e.changedTouches.length === 1 && touchDuration < 500) {
        socket.emit("click", { button: "left" });
    }

    // Two-finger tap → right click
    if (!isDragging && e.changedTouches.length === 2 && touchDuration < 500) {
        socket.emit("click", { button: "right" });
    }
});

// Button click functions
function sendClick(btn) {
    if (authorized) socket.emit("click", { button: btn });
}

function sendKey(key) {
    if (authorized) socket.emit("type_text", { key: key });
}

// Keyboard input field
const keyboardInput = document.getElementById("keyboardInput");
keyboardInput.addEventListener("keydown", e => {
    if (!authorized) return;

    if (e.key === "Backspace") socket.emit("type_text", { key: "backspace" });
    else if (e.key === "Enter") socket.emit("type_text", { key: "enter" });
    else if (e.key === "Tab") socket.emit("type_text", { key: "tab" });
    else if (e.key.length === 1) socket.emit("type_text", { key: e.key });

    e.preventDefault();
});
