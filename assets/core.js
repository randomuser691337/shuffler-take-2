let queue1 = [];
let queue2 = [];

var upnext = {
    remove: function () {
        if (queue1.length > 0) {
            return queue1.shift();
        } else {
            console.warn("Queue is empty, nothing to remove.");
            return null;
        }
    },
    delsong: function (file) {
        const index = queue1.findIndex(item => item.path === file.path);
        if (index !== -1) {
            const removed = queue1.splice(index, 1)[0];
            console.log(`Removed ${removed.name} from the queue.`);
            return removed;
        } else {
            console.warn("File not found in the queue.");
            return null;
        }
    },
    upnext: function () {
        if (queue1.length > 0) {
            const nextFile = queue1[0];
            return nextFile;
        } else {
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

        for (const file of shuffledFiles) {
            this.add(file);
        }

        console.log("Shuffled files added to the queue.");
    }
};


async function loadmenus() {
    document.body.innerHTML = "";
    console.log(`- Shuffler 0.0.1`);
    console.log(`- Booting...`);
    const menu = tk.c('div', document.body, 'menu');
    tk.p(`Music`, 'h2', menu);
    const files = await fs.ls('/music/');
    if (files.items.length === 0) {
        tk.p(`No music files found.`, undefined, menu);
    } else {
        for (const file of files.items) {
            if (file.type === 'file') {
                let ok;
                let ok2;
                const btn = tk.cb('list flex', '', undefined, menu);
                const tnav = tk.c('div', btn, 'tnav');
                const jsmediatags = window.jsmediatags;
                const fileBlob = await fs.read(file.path);
                await jsmediatags.read(fileBlob, {
                    onSuccess: async function (tag) {
                        if (tag.tags.picture) {
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
                        }
                    },
                    onError: function (error) {
                        console.warn(`Failed to read metadata for ${file.name}:`, error);
                    }
                });

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
                                const sliced = file.path.substring(0, file.path.lastIndexOf('/'));
                                console.log(sliced);
                                upnext.start(sliced + "/");
                                ui.dest(menu, 0);
                            }
                        },
                        {
                            name: 'Delete',
                            func: async function () {
                                const confirm = window.confirm(`Are you sure you want to delete ${file.name}?`);
                                if (confirm) {
                                    await fs.del(file.path);
                                    console.log(`Deleted ${file.name}`);
                                    ui.dest(menu, 0);
                                    loadmenus();
                                }
                            }
                        }
                    ];
                    ui.dropdown(extra, array)
                }, title);
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
                const path = `/music/${file.name}`;
                await fs.write(path, file);
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

async function play(path, img, name) {
    document.body.innerHTML = "";
    console.log(`- Playing ${path}`);
    const menu = tk.c('div', document.body, 'menu');
    menu.style.padding = "32px";
    menu.style.textAlign = "center";
    const img2 = tk.c('img', menu, 'cover');
    img2.src = img;
    tk.p(name.title, undefined, menu);
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
        const ok3 = upnext.upnext();
        if (ok3 === null) {
            await upnext.start(path.substring(0, path.lastIndexOf('/')));
            skipbtn.click();
        } else {
            const jsmediatags = window.jsmediatags;
            const fileBlob = await fs.read(ok3.path);
            await jsmediatags.read(fileBlob, {
                onSuccess: async function (tag) {
                    if (tag.tags.picture) {
                        const { data, format } = await tag.tags.picture;
                        const byteArray = await new Uint8Array(data);
                        const blob = await new Blob([byteArray], { type: format });
                        const albcover = await URL.createObjectURL(blob);
                        await upnext.delsong(ok3);
                        await play(ok3.path, albcover, tag.tags);
                    }
                },
                onError: function (error) {
                    console.warn(`Failed to read metadata for ${file.name}:`, error);
                }
            });
        }
    }, menu);
    skip = tk.c('img', skipbtn, 'btnicon');
    skip.src = "/assets/skip-forward.svg";

    audio.onended = function () {
        console.log(`- Finished playing ${path}`);
        menu.remove();
    };
    menu.appendChild(audio);
}