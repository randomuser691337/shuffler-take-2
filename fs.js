var wfs = new Worker('/wfs.js');
var fsloaded = false;
wfs.onmessage = function (event) {
    const { type, data, requestId } = event.data;
    if (pendingRequests[requestId]) {
        if (type === 'result') {
            pendingRequests[requestId].resolve(data);
        } else if (type === 'error') {
            pendingRequests[requestId].reject(data);
        }
        delete pendingRequests[requestId];
    } else if (type === 'db_ready') {
        fsloaded = true;
        console.log(`<i> Calling loadmenus()`);
        loadmenus();
    } else if (type === "reboot") {
        try {
            wd.reboot();
        } catch (error) {
            window.location.reload();
        }
    } else if (type === "runaway") {
        window.location.src = "https://meower.xyz?reason=You were sent here because you erased WebDesk. This is the developer's site, feel free to look around!";
    } else {
        console.warn('<!> Unknown message type or requestId from wfs:', type);
    }
};

const pendingRequests = {};
let requestIdCounter = 0;

var fs = {
    send: function (message, transferList) {
        wfs.postMessage(message, transferList);
    },
    askwfs: function (operation, params, opt) {
        const requestId = requestIdCounter++;
        return new Promise((resolve, reject) => {
            pendingRequests[requestId] = { resolve, reject };
            fs.send({ type: 'fs', operation, params, opt, requestId });
        });
    },
    date: function (path) {
        return this.askwfs('date', path);
    },
    read: function (path) {
        return this.askwfs('read', path);
    },
    write: function (path, data) {
        console.log(data);
        if (path.endsWith('/')) {
            wm.notif('Bad file write', `Remove "/" from the end of your path name.`);
        }
        return this.askwfs('write', path, data);
    },
    del: function (path) {
        return this.askwfs('delete', path);
    },
    erase: async function (path) {
        try {
            if (sys.webdeskbooted === true && ui) {
                const div = ui.darken();
                const menu = tk.c('div', div, 'cm');
                tk.p(`Erasing`, 'bold', menu);
                tk.c('div', menu, 'line-wobble').style.marginTop = "5px";
                menu.style.width = "120px";
            }
        } catch (error) {
            console.log(error);
        }
        await navigator.serviceWorker.getRegistrations().then(registrations => {
            for (let registration of registrations) {
                registration.unregister();
                if (registration.active) {
                    registration.active.postMessage({ type: 'stop' });
                }
            }
        });
        return this.askwfs('erase', path);
    },
    ls: function (path) {
        return this.askwfs('ls', path);
    },
    getall: function () {
        return this.askwfs('all');
    },
    delfold: function (path) {
        return this.askwfs('delfold', path);
    },
    copyfold: async function (oldplace, newplace) {
        const ok = await fs.ls(oldplace);
        const div = tk.c('div', document.body, 'cm');
        tk.p(`Copying ${oldplace} to ${newplace}`, undefined, div);
        const status = tk.p(`Starting...`, undefined, div);
        for (const path of ok.items) {
            if (path.type === "folder") {
                await fs.copyfold(path.path, newplace + path.name + "/");
            }
            const fileContent = await fs.read(path.path);
            await fs.write(newplace + path.name, fileContent);
            console.log(path.name);
            console.log(newplace);
            status.innerText = `Copying ${path.name}...`;
        }
        status.innerText = `Copy completed.`;
        setTimeout(() => ui.dest(div, 0), 3000);
    },
    persist: function () {
        return this.askwfs('persist');
    },
    usedspace: function () {
        return this.askwfs('space');
    },
};

var set = {
    set: async function (key, value) {
        try {
            sys.config[key] = value;
            await fs.write("/user/info/config.json", JSON.stringify(sys.config));
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    },
    del: async function (key) {
        try {
            delete sys.config[key];
            await fs.write("/user/info/config.json", JSON.stringify(sys.config));
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    },
    read: async function (key) {
        try {
            return key in sys.config ? sys.config[key] : undefined;
        } catch (error) {
            return undefined;
        }
    }
};