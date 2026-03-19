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
let lastTouches = [];
let isDragging = false;
let isScrolling = false;
let touchStartTime = 0;
let longPressTimeout = null;

// ------------------- TOUCH START -------------------
touchpad.addEventListener("touchstart", e => {
    if (!authorized) return;

    lastTouches = Array.from(e.touches).map(t => ({ x: t.clientX, y: t.clientY }));
    isDragging = false;
    isScrolling = false;
    touchStartTime = Date.now();

    // Single-finger long press → right click
    if (e.touches.length === 1) {
        longPressTimeout = setTimeout(() => {
            socket.emit("click", { button: "right" });
        }, 600); // 600ms long press
    }
});

// ------------------- TOUCH MOVE -------------------
touchpad.addEventListener("touchmove", e => {
    if (!authorized) return;

    if (e.touches.length === 1) {
        const t = e.touches[0];
        let dx = t.clientX - lastTouches[0].x;
        let dy = t.clientY - lastTouches[0].y;

        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
            isDragging = true;
            clearTimeout(longPressTimeout); // cancel long press if moving
        }

        socket.emit("move_cursor", { dx, dy });
        lastTouches[0] = { x: t.clientX, y: t.clientY };
    }

    if (e.touches.length === 2) {
        isScrolling = true;
        clearTimeout(longPressTimeout);

        const t1 = e.touches[0];
        const t2 = e.touches[1];

        const dy = ((t1.clientY - lastTouches[0].y) + (t2.clientY - lastTouches[1].y)) / 2;
        socket.emit("scroll", { dy });

        lastTouches = [
            { x: t1.clientX, y: t1.clientY },
            { x: t2.clientX, y: t2.clientY }
        ];
    }

    e.preventDefault(); // prevent page scrolling
});

// ------------------- TOUCH END -------------------
touchpad.addEventListener("touchend", e => {
    if (!authorized) return;
    clearTimeout(longPressTimeout);

    const touchDuration = Date.now() - touchStartTime;

    // Single finger tap → left click
    if (!isDragging && !isScrolling && e.changedTouches.length === 1 && touchDuration < 500) {
        socket.emit("click", { button: "left" });
    }

    // Two-finger tap → right click
    if (!isDragging && e.changedTouches.length === 2 && touchDuration < 500) {
        socket.emit("click", { button: "right" });
    }

    isDragging = false;
    isScrolling = false;
    lastTouches = [];
});

// ------------------- BUTTON CLICK -------------------
function sendClick(btn) {
    if (authorized) socket.emit("click", { button: btn });
}

function sendKey(key) {
    if (authorized) socket.emit("type_text", { key: key });
}

// ------------------- KEYBOARD INPUT -------------------
const keyboardInput = document.getElementById("keyboardInput");
keyboardInput.addEventListener("keydown", e => {
    if (!authorized) return;

    if (e.key === "Backspace") socket.emit("type_text", { key: "backspace" });
    else if (e.key === "Enter") socket.emit("type_text", { key: "enter" });
    else if (e.key === "Tab") socket.emit("type_text", { key: "tab" });
    else if (e.key.length === 1) socket.emit("type_text", { key: e.key });

    e.preventDefault();
});
