const board = document.getElementById("board");
//const playlist = "37i9dQZF1EJAnB2jypsBHB"; // blend
const playlist = "4CQNqjCyde5BIpJlUDxZZi";
let covers = {};
let emptyTiles = [];
let coins = 0;

function login(clientId, id) {
    const redirectUri = window.location.origin + window.location.pathname; // Redirect to the same page
    const scope = "user-read-private user-library-read playlist-read-private";
    const authUrl = `https://accounts.spotify.com/authorize?` +
        `client_id=${clientId}` +
        `&response_type=token` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=${encodeURIComponent(scope)}` +
        `&show_dialog=true`;

    async function fetchSpotifyPlaylist(accessToken) {
        try {
            const apiUrl = `https://api.spotify.com/v1/playlists/${id}/tracks`;
            const response = await fetch(apiUrl, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) throw new Error(`Error: ${response.status} ${response.statusText}`);

            const data = await response.json();
            return data.items.map(item => item.track.album.images[0]?.url).filter(url => url);
        } catch (error) {
            console.error("Failed to fetch playlist:", error);
            return null;
        }
    }

    function getAccessTokenFromUrl() {
        const params = new URLSearchParams(window.location.hash.substring(1));
        return params.get("access_token");
    }

    function handleAuthentication() {
        const token = getAccessTokenFromUrl();
        if (token) {
            localStorage.setItem("spotify_access_token", token);
            window.history.replaceState({}, document.title, window.location.pathname);
            return token;
        }
        return localStorage.getItem("spotify_access_token");
    }

    async function initialize() {
        let accessToken = handleAuthentication();
        if (!accessToken) {
            window.location.href = authUrl;
            return;
        }

        console.log("Using Access Token:", accessToken);
        const artworks = await fetchSpotifyPlaylist(accessToken);
        if (artworks) {
            console.log("Fetched Artworks:", artworks);
            covers = artworks;
        } else {
            console.log("Failed to retrieve artworks.");
        }

        init();
    }

    initialize();
}

function init() {
    board.innerHTML = "";

    for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 7; x++) {
            let tile = document.createElement("div");

            if (x === 0 && y === 0) {
                tile.classList.add("tile", "generator");
                tile.addEventListener("click", () => {
                    if (emptyTiles.length > 0) {
                        let randomIndex = Math.floor(Math.random() * emptyTiles.length);
                        let chosenTile = emptyTiles.splice(randomIndex, 1)[0];

                        chosenTile.classList.remove("empty");
                        chosenTile.dataset.value = "0";
                        chosenTile.style.backgroundImage = `url("${covers[0]}")`;
                        chosenTile.setAttribute("draggable", "true");
                    }
                });
            } else {
                let rand = Math.round(Math.random());
                if (rand === 0) {
                    tile.classList.add("tile");
                    tile.setAttribute("draggable", "true");
                    tile.dataset.value = Math.floor(Math.random() * 5);
                    tile.style.backgroundImage = `url("${covers[tile.dataset.value]}")`;
                } else {
                    tile.classList.add("tile", "empty");
                    tile.dataset.value = "-1";
                    emptyTiles.push(tile);
                }
            }

            board.appendChild(tile);
        }
    }
}
let draggedTile = null;
document.addEventListener("dragstart", (e) => {
    if (e.target.classList.contains("tile") && !e.target.classList.contains("generator") && !e.target.classList.contains("empty")) {
        draggedTile = e.target;
        e.target.style.opacity = "0.5";
    }
    let tiles = document.getElementById("board").children;
        for (let tile of tiles) {
            if (tile !== draggedTile) {
                tile.style.opacity = (tile.dataset.value === draggedTile.dataset.value) ? "1" : "0.3";
            } else {
                tile.style.background = "linear-gradient(-360deg, #000000 -50%, #2bff00 100% )}";
                tile.style.filter = "blur(4px)";
            }
        }
});
document.addEventListener("dragover", (e) => {
    e.preventDefault()
});
document.addEventListener("drop", (e) => {
    handleTileDrop(e.target);
});

document.addEventListener("touchstart", (e) => {
    let target = e.target.closest(".tile");
    if (target && !target.classList.contains("generator") && !target.classList.contains("empty")) {
        draggedTile = target;
        target.style.opacity = "0.5";
    }
});
document.addEventListener("touchend", (e) => {
    let touch = e.changedTouches[0];
    let target = document.elementFromPoint(touch.clientX, touch.clientY);
    handleTileDrop(target);
});

document.addEventListener("click", (e) => {
    if (e.target.id === "clear") {
        localStorage.removeItem("spotify_access_token");
        console.log("clicked");
        login("3905c0ce1dbf43dd92ca5c4d200984a0", playlist);
    }
});

function handleTileDrop(target) {
    for (let tile of tiles) {
        tile.style.opacity = "1";
    }

    if (!draggedTile) return;
    if (target && target.classList.contains("tile") && target !== draggedTile && !target.classList.contains("generator")) {
        if (!target.classList.contains("empty")) {
            if (parseInt(target.dataset.value) === parseInt(draggedTile.dataset.value)) {
                draggedTile.classList.add("empty");
                draggedTile.setAttribute("draggable", "false");
                draggedTile.style.backgroundImage = null;
                draggedTile.dataset.value = "-1";
                emptyTiles.push(draggedTile);

                target.dataset.value = (parseInt(target.dataset.value) + 1).toString();
                target.style.backgroundImage = `url("${covers[target.dataset.value]}")`;
                emptyTiles = emptyTiles.filter(tile => tile !== target);

                coins = coins + 1;
            }
        }
    }
    draggedTile = null;
}

login("3905c0ce1dbf43dd92ca5c4d200984a0", playlist);