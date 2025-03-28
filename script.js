const board = document.getElementById("board");
const albums = document.getElementById("discs-holder");
const sidebar = document.getElementById("sidebar");
const receiver = document.getElementById("holder");
//const playlist = "37i9dQZF1EJAnB2jypsBHB"; // blend
const playlist = "4CQNqjCyde5BIpJlUDxZZi";
let tileAnimations = new Map();
let emptyTiles = [];
let discovered = [];
let covers = {};
let coins = 0;
let limit = 0;

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

        gameplay();
    }

    initialize();
}

function addAlbum(cover) {
    let album = document.createElement("div");
    album.setAttribute("draggable", "false");
    album.classList.add("album");
    album.dataset.value = cover.toString();
    let image = document.createElement("div");
    image.classList.add("tile", "empty");
    image.style.backgroundImage = `url("${covers[cover]}")`;
    album.appendChild(image);
    albums.appendChild(album);
    discovered.push(cover);
}

function gameplay() {
    /*function populateAlbums() {
        for (let y = covers.length-1;y>=0;y--) {
            let album = document.createElement("div");
            album.setAttribute("draggable", "false");
            album.classList.add("album");
            album.dataset.value = y.toString();
            let image = document.createElement("div");
            image.classList.add("tile", "empty");
            image.style.backgroundImage = `url("${covers[y]}")`;
            image.style.filter = 'blur(10px)';
            album.appendChild(image);
            albums.appendChild(album);

            if (album.dataset.value<4) {
                discovered.push(album);
                console.log(discovered);
            }
        }
    }*/
    
    function generate() {
        board.innerHTML = "";
    
        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 7; x++) {
                let tile = document.createElement("div");
    
                if (x === 0 && y === 0) {
                    tile.classList.add("tile", "generator");
                    tile.addEventListener("click", (e) => {
                        if (emptyTiles.length > 0) {
                            let randomIndex = Math.floor(Math.random() * emptyTiles.length);
                            let chosenTile = emptyTiles.splice(randomIndex, 1)[0];
    
                            let value = Math.round(Math.random()) * limit;
    
                            console.log(value);
                            chosenTile.classList.remove("empty");
                            chosenTile.dataset.value = value.toString();
                            chosenTile.style.backgroundImage = `url("${covers[value]}")`;
                            chosenTile.setAttribute("draggable", "true");
                        }
                    })
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

    //populateAlbums();
    generate();
}

let draggedTile = null;
let clonedTile = null;
document.addEventListener("dragstart", (e) => {
    handleDragStart(e.target);
});
document.addEventListener("dragover", (e) => {
    e.preventDefault()
});
document.addEventListener("drop", (e) => {
    handleTileDrop(e.target);
});

let startX = 0, startY = 0;
let isDragging = false;
let discsHolder = document.querySelector(".discs-holder");
document.addEventListener("touchstart", (e) => {
    let tile = e.target.closest(".tile");
    let album = e.target.closest(".album");

    if (tile) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isDragging = false;

        if (album) {
            if (parseInt(album.dataset.value)!=discovered.length) {
                return;
            }
        }

        if (!tile.classList.contains("generator")) {
            handleDragStart(e.target);

            clonedTile = tile.cloneNode(true);
            clonedTile.style.position = "absolute";
            clonedTile.style.width = `${tile.offsetWidth}px`; 
            clonedTile.style.height = `${tile.offsetHeight}px`;
            clonedTile.style.opacity = "0.7";
            clonedTile.style.pointerEvents = "none";
            clonedTile.style.zIndex = "999";
            document.body.appendChild(clonedTile);

            updateClonePosition(e.touches[0]);
        }
    }
});
document.addEventListener("touchmove", (e) => {
    if (clonedTile) {
        updateClonePosition(e.touches[0]);
    }

    let touchX = e.touches[0].clientX;
    let touchY = e.touches[0].clientY;

    let deltaX = Math.abs(touchX - startX);
    let deltaY = Math.abs(touchY - startY);

    if (deltaX > 10 || deltaY > 10) {
        isDragging = true;
    }

    // check if touch is still in holder
    let elementUnderTouch = document.elementFromPoint(touchX, touchY);
    if (!albums.contains(elementUnderTouch)) {
        isDragging = true;
    }
})
document.addEventListener("touchend", (e) => {
    let touch = e.changedTouches[0];
    let target = document.elementFromPoint(touch.clientX, touch.clientY);
    handleTileDrop(target);

    if (clonedTile) {
        clonedTile.remove();
        clonedTile = null;
    }
    draggedTile = null;
});

function updateClonePosition(touch) {
    clonedTile.style.left = `${touch.clientX - clonedTile.offsetWidth / 2}px`;
    clonedTile.style.top = `${touch.clientY - clonedTile.offsetHeight / 2}px`;
}

document.addEventListener("click", (e) => {
    if (e.target.id == "clear") {
        localStorage.removeItem("spotify_access_token");
        login("3905c0ce1dbf43dd92ca5c4d200984a0", playlist);
    }
});

function handleDragStart(target) {
    albums.style.opacity = "0%";
    sidebar.classList.add("dropping");
    receiver.classList.remove("shop");
    receiver.classList.add("sell");

    if (target.classList.contains("tile") && !target.classList.contains("generator") && !target.classList.contains("empty")) {
        draggedTile = target;
        target.style.opacity = "0.5";
    }
    let tiles = document.getElementById("board").children;
    for (let tile of tiles) {
        if (tile != null && draggedTile != null) {
            if (tile !== draggedTile) {
                tile.style.opacity = (tile.dataset.value === draggedTile.dataset.value) ? "1" : "0.3";
                if (tile.dataset.value == draggedTile.dataset.value) {
                    let hue = 0;
                    if (tileAnimations.has(tile)) {
                        clearInterval(tileAnimations.get(tile));
                    }
                    let interval = setInterval(() => {
                        hue = (hue + 5) % 360;
                        tile.style.boxShadow = `0px 0px 10px 1px hsla(${hue}, 100%, 50%, 0.7)`;
                    }, 100);
                    tileAnimations.set(tile, interval);
                }
            }
        }
    }
}

function handleTileDrop(target) {
    sidebar.classList.remove("dropping");
    receiver.classList.remove("sell");
    receiver.classList.add("shop");

    albums.style.opacity = "100%";
    refreshDiscs()

    let tiles = document.getElementById("board").children;
    for (let tile of tiles) {
        if (!tile.classList.contains("generator")) {
            tile.style.backgroundImage = `url("${covers[tile.dataset.value]}")`;
        }
        if (tileAnimations.has(tile)) {
            clearInterval(tileAnimations.get(tile));
            tileAnimations.delete(tile);
        }
        tile.style.opacity = "1";
        tile.style.boxShadow = "none";
        tile.style.border = "none";
    }

    if (!draggedTile) return;

    if (target.id == ("sidebar")) {
        if (!discovered.includes(draggedTile.dataset.value)) {
            addAlbum(draggedTile.dataset.value);
            draggedTile.classList.add("empty");
            draggedTile.setAttribute("draggable", "false");
            draggedTile.style.backgroundImage = null;
            draggedTile.dataset.value = "-1";
            emptyTiles.push(draggedTile);
        }
    } else {
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
                    document.getElementById("coinLabel").textContent = `${coins}`;
                }
            }
        }
    }

    draggedTile = null;
}

function refreshDiscs() {
    let lastVisibleAlbum = null;

    if (!isDragging) {
        if (lastVisibleAlbum) {
            lastVisibleAlbum.style.backgroundImage = `url("${covers[discovered.length - 1]}")`;
            lastVisibleAlbum.scrollIntoView({ behavior: "smooth", block: "center" });
            lastVisibleAlbum.setAttribute("draggable", "true"); 
        }
    }
}

login("3905c0ce1dbf43dd92ca5c4d200984a0", playlist);