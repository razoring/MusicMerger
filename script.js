const board = document.getElementById("board");
//const playlist = "37i9dQZF1EJypfUGFp2ga5";
const playlist = "24YBBV4AZPFjQ8kaJRlF8v";
let accessToken = "";

function login(clientId, id) {
    const redirectUri = window.location.origin + window.location.pathname; // Redirect to the same page
    const scope = "user-read-private user-library-read";
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
        } else {
            console.log("Failed to retrieve artworks.");
        }
    }

    initialize();
}

function init() {
    board.innerHTML = ""; // clear board
    for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 7; x++) {
            if (x == Math.floor(7 / 2) && y == Math.floor(9 / 2)) {
                let tile = document.createElement("div");
                tile.classList.add("tile", "generator");
                board.appendChild(tile);
            } else {
                let rand = Math.round(Math.random());
                let tile = document.createElement("div");
                if (rand == 0) {
                    tile.classList.add("tile");
                    tile.style.backgroundImage = `url("https://s.tiled.co/assets/media/d17eae814ee7d6d724c4.png")`;
                    tile.setAttribute("draggable", "true");
                    tile.dataset.value = Math.round(Math.random() * 5);
                } else {
                    tile.classList.add("tile", "empty");
                }
                board.appendChild(tile);
            }
        }
    }
}

draggedTile = null;
document.addEventListener("dragover", (e) => e.preventDefault());
document.addEventListener("dragstart", (e) => {
    if (e.target.classList.contains("tile") && !e.target.classList.contains("generator") && !e.target.classList.contains("empty")) {
        draggedTile = e.target;
        e.target.style.opacity = "0.5";
    }
});
document.addEventListener("drop", (e) => {
    draggedTile.style.opacity = "1";
    if (e.target.classList.contains("tile") && draggedTile && !e.target.classList.contains("generator")) {
        if (!e.target.classList.contains("empty")) {
            if (e.target.dataset.value == draggedTile.dataset.value) {
                draggedTile.classList.add("empty");
                draggedTile.setAttribute("draggable", "false");
                draggedTile.style.backgroundImage = null;
            }
        }
    }
});

init();
login("3905c0ce1dbf43dd92ca5c4d200984a0", playlist); 