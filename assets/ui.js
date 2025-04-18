var ui = {
    cv: function (varName, varValue) {
        const root = document.documentElement;
        root.style.setProperty(`--${varName}`, `${varValue}`);
    },
    play: async function (filename) {
        const audio = new Audio(filename);
        audio.volume = 1.0;
        await audio.play();
        return audio;
    },
    dropdown: function (element, items) {
        const dropdown = document.createElement('div');
        dropdown.classList.add('dropdown');
        items.forEach(item => {
            const itemDiv = document.createElement('button');
            itemDiv.innerText = item.name;
            itemDiv.addEventListener('click', async () => {
                await item.func();
                ui.dest(dropdown, 20);
            });
            dropdown.appendChild(itemDiv);
        });

        setTimeout(function () {
            document.body.addEventListener('click', function (event) {
                ui.dest(dropdown, 20);
            });
        }, 250)

        document.body.appendChild(dropdown);
        const rect = element.getBoundingClientRect();
        const rect2 = dropdown.getBoundingClientRect();
        const do2 = rect.right - rect2.width  + "px";
        dropdown.style.left = do2;
        dropdown.style.top = `${rect.bottom}px`;
        return dropdown;
    },
    dest: function (dr1, anim) {
        if (dr1) {
            if (anim) {
                $(dr1).fadeOut(anim, function () { dr1.remove(); });
            } else if (anim === 0) {
                dr1.remove();
            } else {
                $(dr1).fadeOut(170, function () { dr1.remove(); });
            }
        }
    },
}

var tk = {
    loadbar: function (el) {
        const bar = tk.c('div', el, 'line-wobble');
        return bar;
    },
    c: function (type, ele, classn) {
        const ok = document.createElement(type);
        if (ele) {
            ele.appendChild(ok);
        }
        if (classn) {
            ok.classList = classn;
        }
        return ok;
    },
    g: function (element) {
        return document.getElementById(element);
    },
    line: function (ele) {
        const ok = tk.c('div', ele, 'line');
        const no = tk.c('div', ok, 'lineinside');
    },
    t: function (ele, text) {
        ele.innerHTML = text;
    },
    p: function (contents, classn, div) {
        const fuck = document.createElement('p');
        fuck.innerHTML = contents;
        if (classn) {
            fuck.classList = classn;
        }
        div.appendChild(fuck);
        return fuck;
    },
    ps: function (contents, classn, div) {
        const fuck = document.createElement('p');
        fuck.innerText = contents;
        if (classn) {
            fuck.classList = classn;
        }
        div.appendChild(fuck);
        return fuck;
    },
    img: async function (src, classn, div, draggable, directurl) {
        const fuck = document.createElement('img');
        div.appendChild(fuck);
        async function reload(param) {
            try {
                const data = await fs.read(src);
                if (data) {
                    if (typeof data === 'string') {
                        if (data.startsWith('<svg')) {
                            const blob = new Blob([data], { type: 'image/svg+xml' });
                            fuck.src = URL.createObjectURL(blob);
                        } else {
                            fuck.src = data;
                        }
                    } else if (data instanceof Uint8Array || data instanceof ArrayBuffer) {
                        const base64String = btoa(String.fromCharCode(...new Uint8Array(data)));
                        fuck.src = `data:image/png;base64,${base64String}`;
                    } else {
                        console.error('Unsupported data type for image rendering.');
                    }
                } else {
                    fuck.src = src;
                }
            } catch (error) {
                console.log(error);
                fuck.src = src;
                console.log(data);
            }
        }
        if (classn) {
            fuck.classList = classn;
        }
        if (draggable === false) {
            fuck.setAttribute('draggable', false);
        }
        if (directurl !== true) {
            await reload();
        } else {
            fuck.src = src;
        }
        let edit = {
            load: async function (new2) {
                src = new2;
                await reload();
            }
        }
        return { img: fuck, edit };
    },
    css: function (path) {
        return initcss(path);
    },
    cb: function (classn, name, func, ele) {
        const button = document.createElement('button');
        button.className = classn;
        button.innerText = name;
        if (func) {
            button.addEventListener('click', func);
        }
        if (ele) {
            ele.appendChild(button);
        }
        
        return button;
    },
    a: function (ele1, ele2) {
        ele1.appendChild(ele2);
    },
    mbw: function (title, wid, hei, full, min, quit, icon, resize) {
        var windowDiv = document.createElement('div');
        windowDiv.classList.add('window');
        windowDiv.setAttribute('wdname', title);
        var titlebarDiv = tk.c('div', undefined, 'd tb');
        if (sys.mobui !== true) {
            windowDiv.style.width = wid;
            windowDiv.style.height = hei;
            windowDiv.style.maxWidth = "80vw";
            windowDiv.style.maxHeight = "90vh";
        } else {
            const btm2 = el.mbpos;
            windowDiv.style.top = btm2.height + 8 + "px";
            windowDiv.style.left = "8px";
            windowDiv.style.right = "8px";
            windowDiv.style.boxShadow = "none";
            windowDiv.style.resize = "none";
            const btm = el.tbpos;
            windowDiv.style.bottom = btm.height + 12 + "px";
        }

        var winbtns = tk.c('div', undefined, 'tnav');
        var winbtnc = tk.c('div', winbtns, 'tnavc');
        var closeButton = document.createElement('button');
        let closeButtonNest = document.createElement('button');
        if (sys.mobui === true) {
            closeButtonNest.classList.add('winbmob');
            closeButton.classList.add('b3');
            closeButton.innerText = "Quit";
        } else {
            closeButtonNest.classList.add('winbnest');
            closeButton.classList.add('winb');
        }

        closeButtonNest.appendChild(closeButton);
        let shortened;
        if (sys.mob === true) {
            shortened = ui.truncater(title, 12);
        } else {
            shortened = ui.truncater(title, 60);
        }
        const tbn = tk.cb('tbbutton', '', function () {
            wm.show(windowDiv, tbn);
        }, el.tr);
        if (icon) {
            tk.img(icon, 'dockicon', tbn, false, 'noretry');
        } else {
            tk.img('/system/lib/img/icons/noicon.svg', 'dockicon', tbn, false, 'noretry');
        }

        const tooltip = tk.c('div', document.body, 'tooltipd');
        tooltip.textContent = shortened;

        function updateTooltipPosition() {
            const { x, width } = tbn.getBoundingClientRect();
            tooltip.style.left = `${x + width / 2 - tooltip.offsetWidth / 2}px`;
            setTimeout(updateTooltipPosition, 200);
        }

        window.addEventListener("resize", updateTooltipPosition);

        if (el.taskbar) {
            new ResizeObserver(updateTooltipPosition).observe(el.taskbar);
        }

        updateTooltipPosition();
        const showTooltip = () => { tooltip.classList.add('visible'); };
        const hideTooltip = () => { tooltip.classList.remove('visible'); };
        tbn.addEventListener('mouseenter', showTooltip);
        tbn.addEventListener('mouseleave', hideTooltip);

        const removeTooltipListener = () => {
            tbn.removeEventListener('mouseenter', showTooltip);
            tbn.removeEventListener('mouseleave', hideTooltip);
        };

        if (quit === undefined) {
            closeButton.classList.add('red');
            closeButtonNest.addEventListener('click', async function () {
                const mousedownevent = new MouseEvent('click');
                windowDiv.dispatchEvent(mousedownevent);
                ui.dest(windowDiv, 0);
                ui.dest(tbn, 0);
                removeTooltipListener();
                setTimeout(async function () {
                    const yeah = ughfine(windowDiv);
                    if (yeah) {
                        yeah.dispatchEvent(mousedownevent);
                    } else {
                        if (el.menubarbtn) el.menubarbtn.innerText = "Desktop";
                    }
                }, 40);
            });
        } else {
            closeButton.classList.add('grey');
        }
        let minimizeButton = document.createElement('button');
        let minimizeButtonNest = document.createElement('button');
        if (sys.mobui === true) {
            minimizeButtonNest.classList.add('winbmob');
            minimizeButton.classList.add('b3');
            minimizeButton.innerText = "Hide";
        } else {
            minimizeButtonNest.classList.add('winbnest');
            minimizeButton.classList.add('winb');
        }
        minimizeButtonNest.appendChild(minimizeButton);
        if (min === undefined && el.tr !== undefined) {
            minimizeButton.classList.add('yel');
            minimizeButtonNest.addEventListener('click', async function () {
                await wm.minimize(windowDiv, tbn);
            });
        } else {
            minimizeButton.classList.add('grey');
        }
        winbtnc.appendChild(closeButtonNest);
        winbtnc.appendChild(minimizeButtonNest);
        if (sys.mobui !== true) {
            var maximizeButton = document.createElement('button');
            const maximizeButtonNest = document.createElement('button');
            maximizeButtonNest.classList.add('winbnest');
            maximizeButton.classList.add('winb');
            maximizeButtonNest.appendChild(maximizeButton);
            if (full === undefined) {
                maximizeButton.classList.add('gre');
                maximizeButton.addEventListener('click', function () {
                    wm.max(windowDiv);
                });
                titlebarDiv.addEventListener('dblclick', function () {
                    wm.max(windowDiv);
                });
            } else {
                maximizeButton.classList.add('grey');
            }
            winbtnc.appendChild(maximizeButtonNest);
        }
        titlebarDiv.appendChild(winbtns);
        var titleDiv = document.createElement('div');
        titleDiv.classList = 'title wintitle';
        titleDiv.innerHTML = title;
        titlebarDiv.appendChild(titleDiv);
        windowDiv.appendChild(titlebarDiv);
        var contentDiv = document.createElement('div');
        contentDiv.classList.add('content');
        windowDiv.appendChild(contentDiv);
        document.body.appendChild(windowDiv);
        wd.win();
        wd.win(windowDiv, closeButtonNest, minimizeButtonNest, tbn);
        windowDiv.addEventListener('click', function () {
            wd.win(windowDiv, closeButtonNest, minimizeButtonNest, tbn);
        });
        if (sys.mobui !== true) {
            setTimeout(function () { ui.center(windowDiv); }, 10);
        }
        if (resize !== true) {
            const resizeBarStyles = {
                position: 'absolute',
                background: 'transparent',
                zIndex: 9999,
                cursor: 'ew-resize'
            };

            const resizeBars = [
                { side: 'top', cursor: 'ns-resize', style: { top: '-1px', left: 0, right: 0, height: '7px' } },
                { side: 'bottom', cursor: 'ns-resize', style: { bottom: '-1px', left: 0, right: 0, height: '7px' } },
                { side: 'left', cursor: 'ew-resize', style: { top: 0, bottom: 0, left: '-1px', width: '7px' } },
                { side: 'right', cursor: 'ew-resize', style: { top: 0, bottom: 0, right: '-1px', width: '7px' } }
            ];

            resizeBars.forEach(bar => {
                const resizeBar = document.createElement('div');
                Object.assign(resizeBar.style, resizeBarStyles, bar.style);
                resizeBar.style.cursor = bar.cursor;
                windowDiv.appendChild(resizeBar);

                resizeBar.addEventListener('mousedown', function (e) {
                    e.preventDefault();
                    const startX = e.clientX;
                    const startY = e.clientY;
                    const startWidth = parseInt(document.defaultView.getComputedStyle(windowDiv).width, 10);
                    const startHeight = parseInt(document.defaultView.getComputedStyle(windowDiv).height, 10);

                    function doDrag(e) {
                        if (bar.side === 'right') {
                            windowDiv.style.width = (startWidth + e.clientX - startX) + 'px';
                        } else if (bar.side === 'left') {
                            const newWidth = startWidth - (e.clientX - startX);
                            if (newWidth > 0) {
                                windowDiv.style.width = newWidth + 'px';
                                windowDiv.style.left = e.clientX + 'px';
                            }
                        } else if (bar.side === 'bottom') {
                            windowDiv.style.height = (startHeight + e.clientY - startY) + 'px';
                        } else if (bar.side === 'top') {
                            const newHeight = startHeight - (e.clientY - startY);
                            if (newHeight > 0) {
                                windowDiv.style.height = newHeight + 'px';
                                windowDiv.style.top = e.clientY + 'px';
                            }
                        }
                    }

                    function stopDrag() {
                        document.documentElement.removeEventListener('mousemove', doDrag, false);
                        document.documentElement.removeEventListener('mouseup', stopDrag, false);
                    }

                    document.documentElement.addEventListener('mousemove', doDrag, false);
                    document.documentElement.addEventListener('mouseup', stopDrag, false);
                }, false);
            });
        }
        return { win: windowDiv, main: contentDiv, tbn, title: titlebarDiv, closebtn: closeButtonNest, winbtns, name: titleDiv, minbtn: minimizeButtonNest };
    }
}
