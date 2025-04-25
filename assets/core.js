var queue1 = [];
var currentIndex = -1;

var upnext = {
    remove: function () {
        if (queue1.length > 0 && currentIndex >= 0) {
            const removed = queue1.splice(currentIndex, 1)[0];
            if (currentIndex >= queue1.length) {
                currentIndex = queue1.length - 1;
            }
            return removed;
        } else {
            console.warn("Queue is empty, nothing to remove.");
            return null;
        }
    },
    delsong: function (file) {
        const index = queue1.findIndex(item => item.path === file);
        if (index !== -1) {
            const removed = queue1.splice(index, 1)[0];
            if (index <= currentIndex) {
                currentIndex = Math.max(0, currentIndex - 1);
            }
            return removed;
        } else {
            console.warn("File not found in the queue.");
            return null;
        }
    },
    upnext: function () {
        if (queue1.length > 0 && currentIndex < queue1.length - 1) {
            currentIndex++;
            return queue1[currentIndex];
        } else {
            console.warn("No next song in the queue.");
            return null;
        }
    },
    previous: function () {
        if (queue1.length > 0 && currentIndex > 0) {
            currentIndex--;
            return queue1[currentIndex];
        } else {
            console.warn("No previous song in the queue.");
            return null;
        }
    },
    add: function (file) {
        queue1.push(file);
        console.log(`Added ${file.name} to the queue.`);
    },
    start: async function (path) {
        const files = await fs.ls(path);
        const shuffledFiles = files.items
            .filter(file => file.type === 'file')
            .sort(() => Math.random() - 0.5);

        queue1 = shuffledFiles.map(file => ({ path: file.path }));
        currentIndex = -1;
        console.log("Shuffled files added to the queue.");
    }
};

async function loadmenus(path) {
    await fs.write(`/music/PlaylistExist Shuffler`, '1');
    document.body.innerHTML = "";
    console.log(`- Shuffler 0.0.1`);
    console.log(`- Booting...`);
    const menu = tk.c('div', document.body, 'menu');
    const toolbar = tk.c('div', document.body, 'toolbar');
    const tnav = tk.c('div', toolbar, 'tnav');
    const title = tk.c('div', toolbar, 'title');
    let refbtntxt = "Refresh";
    if (path) {
        refbtntxt = "Back";
    }
    tk.cb('normal', refbtntxt, function () {
        loadmenus();
    }, tnav);
    tk.cb('normal', 'Settings', function () {
        settings();
    }, tnav);
    const btn = tk.cb('normal', 'New...', function () {
        const array = [
            {
                name: 'Playlist',
                func: async function () {
                    const div = tk.modal();
                    tk.p(`Create a new playlist`, 'bold', div.div);
                    const input = tk.c('input', div.div, 'input');
                    input.placeholder = "Playlist name";
                    tk.cb('normal', 'Create', async function () {
                        const name = input.value;
                        if (name) {
                            await fs.write(`/music/${name}/PlaylistExist Shuffler`, '1');
                            console.log(`Created playlist ${name}`);
                            ui.dest(div.main, 300);
                            loadmenus();
                        } else {
                            console.warn("Playlist name cannot be empty.");
                        }
                    }, div.div);
                    tk.cb('normal', 'Cancel', function () {
                        ui.dest(div.main, 300);
                    }, div.div);
                }
            },
            {
                name: 'Song',
                func: async function () {
                    songdown();
                }
            }
        ];
        ui.dropdown(btn, array);
    }, title);
    menu.style.paddingTop = "60px";
    let files;
    if (path) {
        console.log(path);
        files = await fs.ls(path);
    } else {
        files = await fs.ls('/music/');
    }
    console.log(files.items.length);
    if (files.items.length === 1 || files.items.length === 0) {
        tk.p(`No music files found.`, undefined, menu);
        if (!path) {
            tk.p(`If you used https://theshuffler.vercel.app, use its new migration tool to copy your music over.`);
        }
    } else {
        for (const file of files.items) {
            if (file.name === "PlaylistExist Shuffler") {
                continue;
            }
            if (file.type === 'file') {
                try {
                    let ok;
                    let ok2;
                    const btn = tk.cb('list flex', '', undefined, menu);
                    const tnav = tk.c('div', btn, 'tnav');
                    const jsmediatags = window.jsmediatags;
                    const fileBlob = await fs.read(file.path);
                    try {
                        await jsmediatags.read(fileBlob, {
                            onSuccess: async function (tag) {
                                try {
                                    ok = tag.tags;
                                    const { data, format } = tag.tags.picture;
                                    const byteArray = new Uint8Array(data);
                                    const blob = new Blob([byteArray], { type: format });
                                    const img = tk.c('img', tnav, 'img20x20');
                                    const albcover = URL.createObjectURL(blob);
                                    img.src = albcover;
                                    ok2 = albcover;
                                    const span = tk.c('span', tnav);
                                    span.innerText = tag.tags.title || file.name;
                                    span.style.marginLeft = "8px";
                                } catch (error) {
                                    throw new Error("Error processing metadata or image.");
                                }
                            },
                            onError: function () {
                                throw new Error("Error reading metadata.");
                            }
                        });
                    } catch (error) {
                        console.warn(`Failed to process file ${file.name}:`, error);
                        ok = { title: file.name, artist: "Unknown", album: "Unknown" };
                        ok2 = "/assets/noimg.png";
                        const img = tk.c('img', tnav, 'img20x20');
                        img.src = ok2;
                        const span = tk.c('span', tnav);
                        span.innerText = file.name;
                        span.style.marginLeft = "8px";
                    }

                    tnav.addEventListener('click', async function () {
                        await play(file.path, ok2, ok);
                        ui.dest(menu, 0);
                    });

                    const title = tk.c('div', btn, 'title');
                    const extra = tk.cb('listbtn', '...', async function () {
                        const array = [
                            {
                                name: 'Play',
                                func: async function () {
                                    await play(file.path, ok2, ok);
                                    ui.dest(menu, 0);
                                }
                            },
                            {
                                name: 'Add to playlist',
                                func: async function () {
                                    const confirm = tk.modal();
                                    const input = tk.c('input', confirm.div, 'input');
                                    input.placeholder = "Enter playlist name";
                                    tk.cb('normal', 'Cancel', function () {
                                        ui.dest(confirm.main, 300);
                                    }, confirm.div);
                                    tk.cb('normal', 'Add', async function () {
                                        fs.write(`/music/${input.value}/${file.name}`, fileBlob);
                                    }, confirm.div);
                                }
                            },
                            {
                                name: 'Delete',
                                func: async function () {
                                    const confirm = tk.modal();
                                    tk.p(`Are you sure you want to delete ${ok.title || file.name}?`, 'bold', confirm.div);
                                    tk.cb('normal', 'Cancel', function () {
                                        ui.dest(confirm.main, 300);
                                    }, confirm.div);
                                    tk.cb('normal', 'Delete', async function () {
                                        ui.dest(confirm.main, 300);
                                        await fs.del(file.path);
                                        ui.dest(menu, 0);
                                        loadmenus(path);
                                    }, confirm.div);
                                }
                            }
                        ];
                        ui.dropdown(extra, array);
                    }, title);
                } catch (error) {
                    console.error(`- Error processing file ${file.name}: `, error);
                    const btn = tk.cb('list flex', '', undefined, menu);
                    const tnav = tk.c('div', btn, 'tnav');
                    const title = tk.c('div', btn, 'title');
                    const span = tk.c('span', tnav);
                    span.innerText = file.name;
                    span.style.marginLeft = "8px";

                    tnav.addEventListener('click', async function () {
                        const modal = tk.modal();
                        tk.p(`Failed to read metadata for ${file.name}.`, 'bold', modal.div);
                        tk.cb('normal', 'Close', function () {
                            ui.dest(modal.main, 300);
                        }, modal.div);
                    });
                }
            } else {
                const btn = tk.cb('list flex', '', undefined, menu);
                const tnav = tk.c('div', btn, 'tnav');
                const title = tk.c('div', btn, 'title');
                const span = tk.c('span', tnav);
                span.innerText = "Playlist";
                span.style.marginRight = "3px";
                span.style.opacity = "0.6";
                tnav.innerHTML += file.name;
                btn.addEventListener('click', async function () {
                    loadmenus(file.path);
                });
            }
        }
    }

    menu.ondragover = function (event) {
        event.preventDefault();
    };

    menu.ondrop = async function (event) {
        event.preventDefault();
        const files = event.dataTransfer.files;
        for (const file of files) {
            if (file.size > 0) {
                let path2;
                if (path) {
                    path2 = `${path}${file.name}`;
                    console.log(path2);
                } else {
                    path2 = `/music/${file.name}`;
                    console.log(path2);
                }
                await fs.write(path2, file);
                console.log(`Added ${file.name} to the library as a blob.`);
                loadmenus();
            } else {
                console.warn(`Skipped ${file.name} because it is empty.`);
            }
        }
    };
}

async function settings() {
    document.body.innerHTML = "";
    const menu = tk.c('div', document.body, 'menu');
    tk.p(`Settings`, 'h2', menu);
    tk.p('Customize', undefined, menu);
    tk.cb('normal', 'Light mode', function () {
        ui.cv('font', '0, 0, 0');
        ui.cv('background', '255, 255, 255');
        ui.cv('inv', '0');
    }, menu);
    tk.cb('normal', 'Dark mode', function () {
        ui.cv('font', '255, 255, 255');
        ui.cv('background', '0, 0, 0');
        ui.cv('inv', '1');
    }, menu);
    const p = tk.p('', undefined, menu);
    tk.cb('normal', 'Back', function () {
        loadmenus();
    }, p);
}

async function songdown() {
    document.body.innerHTML = "";
    const menu = tk.c('div', document.body, 'menu');
    tk.p(`Download Song`, 'h2', menu);
    tk.p(`It's better to find music files yourself. Make sure the album name, artist name and song name are 100% correct.`, undefined, menu);
    const input = tk.c('input', menu, 'input');
    input.placeholder = "Song name";
    const input2 = tk.c('input', menu, 'input');
    input2.placeholder = "Artist name";
    const input3 = tk.c('input', menu, 'input');
    input3.placeholder = "Album name";
    tk.cb('normal', 'Close', async function () {
        loadmenus();
    }, menu);
    tk.cb('normal', 'Download', async function () {
        const title = input.value;
        const artist = input2.value;
        const album = input2.value;
        const params = new URLSearchParams({ title, artist, album });
        const response = await fetch(`https://songdown.meower.xyz/download?${params}`);

        if (!response.ok) {
            const err = await response.text();
            alert("Download failed: " + err);
            return;
        }

        const blob = await response.blob();
        const reader = new FileReader();

        reader.onload = function () {
            const blob = new Blob([reader.result], { type: 'audio/mpeg' });
            fs.write(`/music/${title} - ${artist}.mp3`, blob).then(() => {
                const status = tk.p('Downloaded ' + title + ' - ' + artist, undefined, menu);
                status.style.color = "green";
                setTimeout(() => {
                    ui.dest(status, 300);
                }, 3000);
            }).catch((error) => {
                console.error(`- Error writing file: `, error);
                const modal = tk.modal();
                tk.p('Error writing file', 'bold', modal);
                tk.p(`Error for developers: ` + error, undefined, modal);
                tk.cb('normal', 'Close', function () {
                    ui.dest(modal.main, 200);
                }, modal);
            });
        };

        reader.readAsArrayBuffer(blob);
    }, menu);
}

async function play(path, img, name) {
    document.body.innerHTML = "";
    console.log(`- Playing ${path}`);
    const menu = tk.c('div', document.body, 'menu');
    const toolbar = tk.c('div', document.body, 'toolbar');
    const tnav = tk.c('div', toolbar, 'tnav');
    const title = tk.c('div', toolbar, 'title');
    menu.style.padding = "32px";
    menu.style.paddingTop = "70px";
    tk.cb('normal', 'Back', function () {
        loadmenus();
    }, tnav);
    tk.cb('normal', 'Queue', function () {
        loadmenus();
    }, title);
    menu.style.textAlign = "center";
    const img2 = tk.c('img', menu, 'cover');

    async function usedcol(image) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = image.width;
            canvas.height = image.height;
            context.drawImage(image, 0, 0, canvas.width, canvas.height);

            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const colorCount = {};
            let maxCount = 0;
            let mostUsedColor = 'rgb(0, 0, 0)';

            for (let i = 0; i < imageData.data.length; i += 4) {
                let r = imageData.data[i];
                let g = imageData.data[i + 1];
                let b = imageData.data[i + 2];

                if (r < 60 || g < 60 || b < 60) {
                    const adjustment = 60 - Math.min(r, g, b);
                    r = Math.min(r + adjustment, 255);
                    g = Math.min(g + adjustment, 255);
                    b = Math.min(b + adjustment, 255);
                }

                const color = `${r}, ${g}, ${b}`;

                colorCount[color] = (colorCount[color] || 0) + 1;

                if (colorCount[color] > maxCount) {
                    maxCount = colorCount[color];
                    mostUsedColor = color;
                }
            }

            resolve(mostUsedColor);
        });
    }

    img2.onload = async function () {
        const mostUsedColor = await usedcol(img2);
        ui.cv('accent', mostUsedColor);
    };

    img2.src = img;
    tk.p(name.title, 'bold', menu);
    tk.p(name.artist, undefined, menu);
    tk.p(name.album, undefined, menu);
    const musicData = await fs.read(path);
    const link = await URL.createObjectURL(musicData);
    const audio = new Audio(link);
    audio.controls = false;
    audio.autoplay = true;
    audio.style.width = "100%";
    tk.cb('btn', 'Back', function () { }, audio);
    let pause;
    let skip;

    async function loadsong(ok3) {
        const jsmediatags = window.jsmediatags;
        const fileBlob = await fs.read(ok3.path);
        await jsmediatags.read(fileBlob, {
            onSuccess: async function (tag) {
                if (tag.tags.picture) {
                    const { data, format } = await tag.tags.picture;
                    const byteArray = await new Uint8Array(data);
                    const blob = await new Blob([byteArray], { type: format });
                    const albcover = await URL.createObjectURL(blob);
                    await play(ok3.path, albcover, tag.tags);
                }
            },
            onError: function (error) {
                console.warn(`Failed to read metadata for ${file.name}:`, error);
            }
        });
    }

    const scrubber = tk.c('div', menu, 'flex-container');
    const timeplayed = tk.c('div', scrubber, 'timeplayed');
    const flexbar = tk.c('div', scrubber, 'flex-bar');
    const range = tk.c('input', flexbar, 'range');
    range.type = "range";
    const songlength = tk.c('div', scrubber, 'songlength');

    range.addEventListener('input', function () {
        const seekTime = audio.duration * (range.value / 100);
        audio.currentTime = seekTime;
    });

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }

    function dumbshit() {
        if (audio.duration) {
            const percent = (audio.currentTime / audio.duration) * 100;
            range.value = percent;
            timeplayed.innerText = formatTime(audio.currentTime);
            songlength.innerText = formatTime(audio.duration);
        }
    }

    dumbshit();
    setInterval(dumbshit, 1000);

    const backbtn = tk.cb('btnwrapper', '', async function () {
        if (queue1.length > 0) {
            const previousFile = upnext.previous();
            loadsong(previousFile);
        } else {
            console.warn("No previous song in the queue.");
            const modal = tk.modal();
            tk.p("No previous song to skip back to.", 'bold', modal.div);
            tk.cb('normal', 'Close', function () {
                ui.dest(modal.main, 300);
            }, modal.div);
        }
    }, menu);

    const back = tk.c('img', backbtn, 'btnicon');
    back.src = "/assets/skip-back.svg";

    const btn = tk.cb('btnwrapper', '', function () {
        if (pause.src.includes("circle-play.svg")) {
            audio.play();
            pause.src = "/assets/circle-pause.svg";
        } else if (pause.src.includes("circle-pause.svg")) {
            audio.pause();
            pause.src = "/assets/circle-play.svg";
        }
    }, menu);
    pause = tk.c('img', btn, 'btnicon');
    pause.src = "/assets/circle-pause.svg";

    const skipbtn = tk.cb('btnwrapper', '', async function () {
        const ok3 = await upnext.upnext();
        if (ok3 === null) {
            await upnext.start(path.substring(0, path.lastIndexOf('/')) + "/").then(() => {
                skipbtn.click();
            }).catch((error) => {
                const ok = tk.modal();
                tk.p('Error starting queue', 'bold', ok);
                tk.p(`Error for developers: ` + error, undefined, ok);
                tk.cb('normal', 'Close', function () {
                    ui.dest(ok, 200);
                }, ok);
            });
        } else {
            loadsong(ok3);
        }
    }, menu);

    skip = tk.c('img', skipbtn, 'btnicon');
    skip.src = "/assets/skip-forward.svg";

    audio.onended = function () {
        console.log(`- Finished playing ${path}`);
        skipbtn.click();
    };
    menu.appendChild(audio);

    if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', () => {
            audio.play();
            pause.src = "/assets/circle-pause.svg";
        });

        navigator.mediaSession.setActionHandler('pause', () => {
            audio.pause();
            pause.src = "/assets/circle-play.svg";
        });

        navigator.mediaSession.metadata = new MediaMetadata({
            title: name.title,
            artist: name.artist,
            album: name.album,
            artwork: [{ src: img }],
        });

        navigator.mediaSession.setActionHandler('previoustrack', async () => {
            if (queue1.length > 0) {
                const previousFile = upnext.previous();
                loadsong(previousFile);
            } else {
                console.warn("No previous song in the queue.");
            }
        });

        navigator.mediaSession.setActionHandler('nexttrack', async () => {
            const ok3 = await upnext.upnext();
            if (ok3 === null) {
                await upnext.start(path.substring(0, path.lastIndexOf('/')) + "/").then(() => {
                    skipbtn.click();
                }).catch((error) => {
                    const ok = tk.modal();
                    tk.p('Error starting queue', 'bold', ok);
                    tk.p(`Error for developers: ` + error, undefined, ok);
                    tk.cb('normal', 'Close', function () {
                        ui.dest(ok, 200);
                    }, ok);
                });
            } else {
                await loadsong(ok3);
            }
        });
    }

    function loadendui() {
        const queue = tk.c('div', menu, 'cover');
        queue.style.height = `${queue.offsetWidth / 1.5}px`;
        queue.style.overflow = "auto";
        queue.style.padding = "16px";
        queue.style.textAlign = "left";
        queue.style.marginTop = "4px";
        queue.innerHTML = "";
        tk.p('Queue (beta)', 'bold', queue);

        queue1.forEach((item, index) => {
            const btn = tk.cb('list flex', '', undefined, queue);
            const tnav = tk.c('div', btn, 'tnav');
            const span = tk.c('span', tnav);
            span.innerText = item.path || `Item ${index + 1}`;
            span.style.marginLeft = "8px";

            btn.addEventListener('click', async function () {
                await loadsong(item);
            });
        });

        $(menu).on('wheel', function (event) {
            event.preventDefault();
            if (event.originalEvent.deltaY > 0) {
                $(menu).animate({ scrollTop: menu.scrollHeight }, 300, 'swing');
            } else {
                $(menu).animate({ scrollTop: 0 }, 300, 'swing');
            }
        });

        let touchStartY = 0;
        let touchEndY = 0;

        menu.addEventListener('touchstart', function (event) {
            touchStartY = event.touches[0].clientY;
        });

        menu.addEventListener('touchend', function (event) {
            touchEndY = event.changedTouches[0].clientY;
            if (touchStartY > touchEndY + 40) {
                $(menu).animate({ scrollTop: menu.scrollHeight }, 300, 'swing');
            } else if (touchStartY < touchEndY - 40) {
                $(menu).animate({ scrollTop: 0 }, 300, 'swing');
            }
        });

        menu.ondragover = function (event) {
            event.preventDefault();
        };
    }

    const lines = await lyrics(name.title, name.artist);
    if (lines === null) {
        loadendui();
        return;
    } else {
        const lyrics = tk.c('div', menu, 'cover');
        lyrics.style.height = `${lyrics.offsetWidth}px`;
        lyrics.style.overflow = "auto";
        lyrics.style.padding = "16px";
        lyrics.style.textAlign = "left";
        lyrics.style.marginTop = "4px";
        lyrics.innerHTML = lines;
        loadendui();
    }
}