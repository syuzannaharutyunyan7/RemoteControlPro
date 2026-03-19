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

touchpad.addEventListener("touchstart", e => {
    if(!authorized) return;
    const t = e.touches[0];
    lastX = t.clientX;
    lastY = t.clientY;
});

touchpad.addEventListener("touchmove", e => {
    if(!authorized) return;
    const t = e.touches[0];

    if(e.touches.length == 1){
        let dx = t.clientX - lastX;
        let dy = t.clientY - lastY;
        socket.emit("move_cursor",{dx,dy});
    }

    if(e.touches.length == 2){
        let dy = t.clientY - lastY;
        socket.emit("scroll",{dy});
    }

    lastX = t.clientX;
    lastY = t.clientY;
    e.preventDefault();
});

touchpad.addEventListener("touchend", e => {
    if(!authorized) return;

    if(e.changedTouches.length == 1){
        socket.emit("click",{button:"left"});
    }

    if(e.changedTouches.length == 2){
        socket.emit("click",{button:"right"});
    }
});

function sendClick(btn){
    if(authorized) socket.emit("click",{button:btn});
}

function sendKey(key){
    if(authorized) socket.emit("type_text",{key:key});
}

// Keyboard input field
const keyboardInput = document.getElementById("keyboardInput");
keyboardInput.addEventListener("keydown", e => {
    if(!authorized) return;

    if(e.key==="Backspace") socket.emit("type_text",{key:"backspace"});
    else if(e.key==="Enter") socket.emit("type_text",{key:"enter"});
    else if(e.key==="Tab") socket.emit("type_text",{key:"tab"});
    else if(e.key.length === 1) socket.emit("type_text",{key:e.key});

    e.preventDefault();
});
