// Animate header text (Laser Tech)
function updateText(text) {
  const delay = 200;
  const h1 = document.getElementById("animated");

  h1.innerHTML = text
    .split("")
    .map(letter => `<span>${letter}</span>`)
    .join("");

  Array.from(h1.children).forEach((span, index) => {
    setTimeout(() => {
      span.classList.add("wavy");
    }, index * 60 + delay);
  });
}

window.addEventListener('load', function () {
  updateText("Laser Tech");
});

// Create a new lobby (Spectator)
async function newLobby() {
  try {
    const res = await fetch("/lobby/create");
    const data = await res.json();

    if (data.lobby && data.lobby.id) {
      window.location.href = `/play.html?lobby=${data.lobby.id}&role=spectator`;
    } else {
      alert("Failed to create lobby");
    }
  } catch (err) {
    alert("Error creating lobby: " + err.message);
  }
}

// Join an existing lobby (Player)
async function joinLobby() {
  try {
    const lobbyId = document.getElementById("lobby")?.value.trim().toUpperCase();
    const username = document.getElementById("uname")?.value.trim().toUpperCase();

    if (lobbyId.length !== 6) {
      throw new Error("Lobby ID must be 6 letters");
    }
    if (username.length < 2) {
      throw new Error("Username must be at least 2 characters");
    }

    const res = await fetch(`/lobby/join?lobby=${lobbyId}&username=${username}`);
    const data = await res.json();

    if (data.error) {
      throw new Error(data.error);
    }

    window.location.href = `/play.html?lobby=${data.lobby.id}&player=${data.player}&username=${username}`;
  } catch (err) {
    alert(err.message);
  }
}

// Export functions if needed (e.g. if used in modules)
export { newLobby, joinLobby, updateText };
