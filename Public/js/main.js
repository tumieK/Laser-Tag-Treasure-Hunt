// Animate the heading text
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

window.addEventListener("load", () => {
  updateText("Laser Tech");
});

// Create new lobby
export async function newLobby() {
  try {
    const res = await fetch("/lobby/create");
    const data = await res.json();

    if (data.lobby?.id) {
      window.location.href = `/play.html?lobby=${data.lobby.id}&role=spectator`;
    } else {
      alert("Failed to create lobby");
    }
  } catch (err) {
    alert("Error creating lobby: " + err.message);
  }
}

// Join existing lobby
export async function joinLobby() {
  try {
    const lobby = document.getElementById("lobby")?.value.toUpperCase().trim();
    const username = document.getElementById("uname")?.value.toUpperCase().trim();

    if (!lobby || lobby.length !== 6) throw new Error("Lobby ID must be 6 letters");
    if (!username || username.length < 2) throw new Error("Username is required");

    const res = await fetch(`/lobby/join?lobby=${lobby}&username=${username}`);
    const data = await res.json();

    if (data.error) throw new Error(data.error);

    window.location.href = `/play.html?lobby=${data.lobby.id}&player=${data.player}&username=${username}`;
  } catch (err) {
    alert(err.message);
  }
}
