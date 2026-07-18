// Full dockgrid-app.js - Complete application logic
(function initDG() {
    if (!window.DG || !window.DG.FB) { setTimeout(initDG, 50); return; }
    const D = window.DG, FB = D.FB, ST = D.STATE;

    // Helper
    D.el = id => document.getElementById(id);
    D.qs = (s, p) => (p || document).querySelector(s);
    D.qsa = (s, p) => (p || document).querySelectorAll(s);

    // Toast
    D.showToast = (msg, type = 'info') => {
        const c = D.el('toastContainer');
        const t = document.createElement('div');
        t.className = `toast ${type}`;
        t.textContent = msg;
        c.appendChild(t);
        setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(60px)'; t.style.transition = 'all 200ms'; setTimeout(() => t.remove(), 200) }, 2500);
    };

    // Search
    D.searchGoogle = q => { if (!q.trim()) return; window.open('https://www.google.com/search?q=' + encodeURIComponent(q), '_blank'); };

    // Loading
    D.showLoading = () => { const b = D.el('loadingBar'); if (b) { b.classList.add('active'); b.classList.remove('done'); } };
    D.hideLoading = () => { const b = D.el('loadingBar'); if (b) { b.classList.remove('active'); b.classList.add('done'); setTimeout(() => b.classList.remove('done'), 400); } };

    // Dropdown & Modal
    D.toggleDropdown = id => { D.el(id).classList.toggle('show'); };
    D.openModal = id => { D.el(id).classList.add('show'); D.el('avatarMenu').classList.remove('show'); };
    D.closeModal = id => { D.el(id).classList.remove('show'); };
    D.openAddWidgetModal = () => D.openModal('addWidgetModal');
    D.openProfileModal = () => D.openModal('profileModal');
    D.openBackgroundModal = () => { D.openModal('pageSettingsModal'); setTimeout(() => D.switchSettingsTab('tab-background', D.qs('[data-tab="tab-background"]')), 80); };
    D.openPageSettingsModal = () => { D.openModal('pageSettingsModal'); D._renderPageSettings(); };

    // Lightbox
    D.openLightbox = url => { ST.lightboxImg = url; D.el('lightboxImg').src = url; D.el('lightbox').style.display = 'flex'; };
    D.closeLightbox = () => { D.el('lightbox').style.display = 'none'; };
    D.downloadImage = () => { if (ST.lightboxImg) { const a = document.createElement('a'); a.href = ST.lightboxImg; a.download = 'image'; a.click(); } };

    // Greeting
    const hour = new Date().getHours();
    D.el('greetingMsg').textContent = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    // Page Title
    D.savePageTitle = t => { t = (t || '').trim() || 'DockGrid Page'; ST.pageTitle = t; D.el('pageTitleDisplay').textContent = t; D._saveSetting('pageTitle', t); };

    // Background
    D._bgUrls = FB.DEFAULT_BGS; // Will be updated on load
    D.setBg = url => { ST.currentBg = url; D.el('bgLayer').style.backgroundImage = `url(${url})`; D._saveSetting('bg', url); D._markSelectedBg(url); };
    D.resetBg = () => D.setBg(FB.DEFAULT_BGS[0]);
    D.uploadBg = async e => {
        const f = e.target.files[0]; if (!f) return;
        const fd = new FormData(); fd.append('image', f);
        try {
            const r = await fetch(`https://api.imgbb.com/1/upload?key=${FB.IMGBB_KEY}`, { method: 'POST', body: fd });
            const d = await r.json();
            if (d.success) D.setBg(d.data.url);
        } catch (ex) { D.showToast('Upload failed', 'error'); }
    };
    D.uploadProfile = async e => {
        const f = e.target.files[0]; if (!f) return;
        const fd = new FormData(); fd.append('image', f);
        try {
            const r = await fetch(`https://api.imgbb.com/1/upload?key=${FB.IMGBB_KEY}`, { method: 'POST', body: fd });
            const d = await r.json();
            if (d.success) { D._updateProfileImg(d.data.url); D._saveSetting('profileImg', d.data.url); D.closeModal('profileModal'); D.showToast('Profile updated'); }
        } catch (ex) { D.showToast('Upload failed', 'error'); }
    };
    D._updateProfileImg = url => {
        D.el('avatarBtn').innerHTML = `<img src="${url}" alt="P">`;
        D.el('profileAvatar').innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" alt="P">`;
    };
    D._markSelectedBg = url => {
        D.qsa('.image-option').forEach(e => { e.classList.remove('selected'); if (e.dataset.bg === url) e.classList.add('selected'); });
    };

    // Settings
    D._saveSetting = async (k, v) => { if (!ST.currentUser) return; await FB.setDoc(FB.doc(FB.db, FB.COL.SETTINGS, ST.currentUser.uid), { [k]: v }, { merge: true }); };

    // Grid Columns
    D.updateCols = v => { ST.colCount = +v; D.el('widgetGrid').className = `widget-grid cols-${v}`; D._saveSetting('cols', +v); };

    // Page Settings Tabs
    D._renderPageSettings = () => {
        const tabs = ['General', 'Background', 'Layout', 'Preferences', 'Overview'];
        D.el('settingsTabs').innerHTML = tabs.map((t, i) => `<button class="modal-tab${i === 0 ? ' active' : ''}" onclick="DG.switchSettingsTab('tab-${t.toLowerCase()}',this)" style="padding:10px 14px;border:none;background:transparent;cursor:pointer;border-bottom:2px solid ${i===0?'var(--orange-500)':'transparent'}">${t}</button>`).join('');
        D.el('settingsTabContent').innerHTML = `
            <div class="tab-content active" id="tab-general" style="display:block">
                <div class="form-group"><label>Page Title</label><input class="form-input" id="pageTitle" value="${ST.pageTitle}" onchange="DG.savePageTitle(this.value)"></div>
                <div class="form-group"><label>Description</label><textarea class="form-input" id="pageDescription">${ST.settings.description||''}</textarea></div>
            </div>
            <div class="tab-content" id="tab-background" style="display:none">
                <div class="image-grid" id="bgImageGrid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px"></div>
                <input type="file" onchange="DG.uploadBg(event)" style="margin-top:8px">
                <button class="btn btn-light" onclick="DG.resetBg()">Reset</button>
            </div>
            <div class="tab-content" id="tab-layout" style="display:none">
                <label>Columns</label>
                <input type="number" min="1" max="4" value="${ST.colCount}" onchange="DG.updateCols(this.value)" class="form-input">
            </div>
            <div class="tab-content" id="tab-preferences" style="display:none">
                <div class="form-toggle"><span>Open links in new tab</span><label class="form-toggle-switch"><input type="checkbox" checked><span class="form-toggle-slider"></span></label></div>
            </div>
            <div class="tab-content" id="tab-overview" style="display:none">
                <p>Widgets: ${ST.widgetsData.length}</p>
            </div>
        `;
        D._setupBgGrid();
    };
    D.switchSettingsTab = (id, btn) => {
        D.qsa('.modal-tab').forEach(t => { t.style.borderBottomColor = 'transparent'; });
        btn.style.borderBottomColor = 'var(--orange-500)';
        D.qsa('.tab-content').forEach(t => t.style.display = 'none');
        D.el(id).style.display = 'block';
    };
    D._setupBgGrid = () => {
        const grid = D.el('bgImageGrid');
        if (grid) {
            grid.innerHTML = D._bgUrls.map(url => `<div class="image-option" style="background-image:url(${url})" onclick="DG.setBg('${url}')" data-bg="${url}"></div>`).join('');
            D._markSelectedBg(ST.currentBg);
        }
    };

    // Pages Sidebar
    D.openPagesSidebar = () => { D.el('pagesSidebar').classList.add('open'); D.el('pagesOverlay').classList.add('show'); };
    D.closePagesSidebar = () => { D.el('pagesSidebar').classList.remove('open'); D.el('pagesOverlay').classList.remove('show'); };

    // Page creation with templates
    D.openNewPageModal = async () => {
        D.openModal('newPageModal');
        const grid = D.el('templateSelectionGrid');
        const templates = await window.DG.loadTemplates();
        grid.innerHTML = templates.map(t => `
            <div class="card" style="padding:16px;border:1px solid #ddd;border-radius:8px;cursor:pointer" onclick="DG.createPageFromTemplate('${t.id}')">
                <strong>${t.name}</strong>
                <p style="font-size:12px;color:#666">${t.description||''}</p>
            </div>
        `).join('') || '<p>No templates available.</p>';
    };

    D.createPageFromTemplate = async (templateId) => {
        D.closeModal('newPageModal');
        const templates = await window.DG.loadTemplates();
        const tpl = templates.find(t => t.id === templateId);
        if (!tpl) return;
        // Check page limit
        const q = FB.query(FB.collection(FB.db, FB.COL.PAGES), FB.where('userId', '==', ST.currentUser.uid));
        const snap = await FB.getDocs(q);
        if (snap.size >= 3) { D.showToast('Max 3 pages', 'error'); return; }
        const pageId = 'page_' + Date.now();
        await FB.setDoc(FB.doc(FB.db, FB.COL.PAGES, pageId), {
            id: pageId, userId: ST.currentUser.uid, title: tpl.name, icon: '📄', order: snap.size,
            createdAt: FB.serverTimestamp(), updatedAt: FB.serverTimestamp()
        });
        if (tpl.defaultWidgets) {
            for (const w of tpl.defaultWidgets) {
                const widgetId = w.type + '_' + Date.now() + Math.random().toString(36).slice(2, 8);
                await FB.setDoc(FB.doc(FB.db, FB.COL.WIDGETS, widgetId), {
                    id: widgetId, type: w.type, title: w.title || w.type, size: w.size || 'medium',
                    userId: ST.currentUser.uid, pageId, data: w.data || {},
                    createdAt: FB.serverTimestamp(), updatedAt: FB.serverTimestamp()
                });
            }
        }
        ST.currentPageId = pageId;
        D.showToast('Page created from template');
    };

    D.createPageFromScratch = () => {
        D.closeModal('newPageModal');
        D.createNewPage();
    };

    // Original create blank page (for "from scratch")
    D.createNewPage = async () => {
        if (!ST.currentUser) return;
        const q = FB.query(FB.collection(FB.db, FB.COL.PAGES), FB.where('userId', '==', ST.currentUser.uid));
        const snap = await FB.getDocs(q);
        if (snap.size >= 3) { D.showToast('Max 3 pages', 'error'); return; }
        const pageId = 'page_' + Date.now();
        await FB.setDoc(FB.doc(FB.db, FB.COL.PAGES, pageId), {
            id: pageId, userId: ST.currentUser.uid, title: 'Untitled Page', icon: '📄', order: snap.size,
            createdAt: FB.serverTimestamp(), updatedAt: FB.serverTimestamp()
        });
        ST.currentPageId = pageId;
        D.showToast('Page created');
    };

    // Switch page
    D.switchPage = pageId => { ST.currentPageId = pageId; D.closePagesSidebar(); D.showToast('Switched'); };

    // Render pages list
    D.renderPagesList = pages => {
        const list = D.el('pagesList');
        if (!list) return;
        if (!pages.length) { list.innerHTML = '<div style="padding:12px;color:#999;font-size:13px">No pages yet</div>'; }
        else {
            list.innerHTML = pages.map(p => `<div class="page-item${p.id === ST.currentPageId ? ' active' : ''}" onclick="DG.switchPage('${p.id}')" style="padding:10px 12px;cursor:pointer;border-radius:4px;display:flex;align-items:center;gap:8px">
                <iconify-icon icon="mdi:file-document-outline" width="16"></iconify-icon> ${p.title||'Untitled'} ${p.id===ST.currentPageId?'(current)':''}
            </div>`).join('');
        }
        D.el('pageLimit').textContent = `${pages.length}/3`;
    };

    // Widgets
    D.addWidget = async type => {
        const names = { bookmarks: 'Bookmarks', rss: 'RSS', notes: 'Notes', tasks: 'Tasks', embed: 'Embed', project: 'Project', clock: 'Clock', gallery: 'Gallery', calculator: 'Calculator' };
        const sizes = { bookmarks: 'medium', rss: 'medium', notes: 'small', tasks: 'medium', embed: 'large', project: 'large', clock: 'small', gallery: 'large', calculator: 'small' };
        const id = type + '_' + Date.now();
        await FB.setDoc(FB.doc(FB.db, FB.COL.WIDGETS, id), {
            id, type, title: names[type] || 'Widget', size: sizes[type] || 'medium',
            userId: ST.currentUser.uid, pageId: ST.currentPageId || 'default',
            data: { bookmarks: [], tasks: [], content: '', images: [], projectWidgets: [], embedUrl: '', rssUrl: '' },
            createdAt: FB.serverTimestamp(), updatedAt: FB.serverTimestamp()
        });
        D.closeModal('addWidgetModal'); D.showToast('Widget added');
    };

    D.removeWidget = async id => { if (!confirm('Delete widget?')) return; await FB.deleteDoc(FB.doc(FB.db, FB.COL.WIDGETS, id)); D.closeContextMenu(); D.showToast('Deleted'); };
    D.changeWidgetSize = async (id, size) => { await FB.setDoc(FB.doc(FB.db, FB.COL.WIDGETS, id), { size }, { merge: true }); D.closeContextMenu(); D.showToast('Size changed'); };

    // Context menu
    D.openContextMenu = (wid, e) => {
        e.stopPropagation();
        const w = ST.widgetsData.find(x => x.id === wid);
        if (!w) return;
        const menu = D.el('widgetContextMenu');
        menu.innerHTML = D._buildMenu(w).map(m => m.label === '---' ? '<div class="dropdown-divider"></div>' : `<div class="dropdown-item" onclick="DG.closeContextMenu();${m.action}"><iconify-icon icon="${m.icon}"></iconify-icon>${m.label}</div>`).join('');
        menu.style.left = e.clientX + 'px';
        menu.style.top = e.clientY + 'px';
        menu.classList.add('show');
    };
    D.closeContextMenu = () => D.el('widgetContextMenu').classList.remove('show');
    D._buildMenu = w => {
        const id = w.id;
        const sizes = [
            { label: 'Small', icon: 'mdi:resize', action: `DG.changeWidgetSize('${id}','small')` },
            { label: 'Medium', icon: 'mdi:resize', action: `DG.changeWidgetSize('${id}','medium')` },
            { label: 'Large', icon: 'mdi:resize', action: `DG.changeWidgetSize('${id}','large')` },
            { label: 'Huge', icon: 'mdi:resize', action: `DG.changeWidgetSize('${id}','huge')` }
        ];
        const common = [
            { label: 'Edit', icon: 'mdi:pencil', action: `DG.openEditPanel('${id}')` },
            { label: '---' },
            ...sizes,
            { label: '---' },
            { label: 'Delete', icon: 'mdi:delete', action: `DG.removeWidget('${id}')`, danger: true }
        ];
        if (w.type === 'bookmarks') return [{ label: 'Open all', icon: 'mdi:open-in-new', action: `DG._openAllBm('${id}')` }, { label: 'Add', icon: 'mdi:plus', action: `DG.openEditPanel('${id}')` }, { label: '---' }, ...common];
        return common;
    };
    D._openAllBm = id => { const w = ST.widgetsData.find(x => x.id === id); w?.data?.bookmarks?.forEach(b => window.open(b.url, '_blank')); D.showToast('Opened all'); };

    // Edit Panel
    D.openEditPanel = wid => {
        const w = ST.widgetsData.find(x => x.id === wid);
        ST.editingWidgetId = wid;
        D.el('editPanelTitle').textContent = w.title;
        const body = D.el('editPanelBody');
        switch (w.type) {
            case 'bookmarks': body.innerHTML = `<input class="form-input" id="editBmUrl" placeholder="URL"><button class="btn btn-primary btn-sm" onclick="DG._addBm()">Add</button><div id="editBmList" style="margin-top:8px"></div>`; D._renderEditBm(w); break;
            case 'notes': body.innerHTML = `<textarea class="form-input" id="editNoteContent" style="min-height:150px">${w.data?.content||''}</textarea>`; break;
            case 'tasks': body.innerHTML = `<input class="form-input" id="editTaskInput" placeholder="Task"><button class="btn btn-primary btn-sm" onclick="DG._addTask()">Add</button><div id="editTaskList" style="margin-top:8px"></div>`; D._renderEditTasks(w); break;
            case 'embed': body.innerHTML = `<input class="form-input" id="editEmbedUrl" placeholder="YouTube URL">`; break;
            case 'rss': body.innerHTML = `<input class="form-input" id="editRssUrl" placeholder="RSS URL">`; break;
            case 'project': body.innerHTML = `<input class="form-input" id="editProjectName" placeholder="Name"><textarea class="form-input" id="editProjectDesc" placeholder="Description"></textarea><input class="form-input" id="editProjectUrl" placeholder="GitHub"><input class="form-input" id="editProjectWebsite" placeholder="Website"><div style="margin-top:12px"><strong>Add Resource</strong></div><div class="widget-type-grid" style="grid-template-columns:repeat(3,1fr)">${['bookmarks','rss','gallery','notes','tasks','embed'].map(t => `<button class="widget-type-btn" onclick="DG._addProjectSub('${wid}','${t}')"><iconify-icon icon="mdi:${t==='bookmarks'?'bookmark-multiple':t==='rss'?'rss':t==='gallery'?'image-multiple':t==='notes'?'note-text':t==='tasks'?'checkbox-marked':'code-tags'}"></iconify-icon>${t}</button>`).join('')}</div>`; break;
            case 'clock': body.innerHTML = `<select class="form-select"><option>12h</option><option>24h</option></select>`; break;
            case 'gallery': body.innerHTML = `<input type="file" class="form-input" multiple onchange="DG._uploadGallery(event)">`; break;
            case 'calculator': body.innerHTML = `<select class="form-select"><option>Basic</option><option>Scientific</option></select>`; break;
        }
        D.el('editPanel').classList.add('open');
        D.el('editPanelOverlay').classList.add('show');
        D.closeContextMenu();
    };
    D.closeEditPanel = () => { D.el('editPanel').classList.remove('open'); D.el('editPanelOverlay').classList.remove('show'); ST.editingWidgetId = null; };
    D.saveEditPanel = async () => {
        const wid = ST.editingWidgetId;
        const w = ST.widgetsData.find(x => x.id === wid);
        if (!w) return;
        const data = {};
        switch (w.type) {
            case 'notes': data.content = D.el('editNoteContent').value; break;
            case 'embed': data.embedUrl = D.el('editEmbedUrl').value; break;
            case 'rss': data.rssUrl = D.el('editRssUrl').value; break;
            case 'project': data.name = D.el('editProjectName').value; data.description = D.el('editProjectDesc').value; data.githubUrl = D.el('editProjectUrl').value; data.website = D.el('editProjectWebsite').value; break;
        }
        if (Object.keys(data).length) await FB.setDoc(FB.doc(FB.db, FB.COL.WIDGETS, wid), { data: { ...w.data, ...data }, updatedAt: FB.serverTimestamp() }, { merge: true });
        D.closeEditPanel(); D.showToast('Saved');
    };

    // Bookmark helpers
    D._addBm = async () => {
        const url = D.el('editBmUrl').value.trim();
        if (!url) return;
        try {
            const hn = new URL(url).hostname;
            const fv = `https://www.google.com/s2/favicons?domain=${hn}&sz=64`;
            let title = hn;
            try { const r = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`); const d = await r.json(); if (d.status === 'success') title = d.data.title || title; } catch (e) { }
            const ref = FB.doc(FB.db, FB.COL.WIDGETS, ST.editingWidgetId);
            const snap = await FB.getDoc(ref);
            if (snap.exists()) {
                const w = snap.data();
                const bm = w.data?.bookmarks || [];
                bm.push({ url, title, favicon: fv, hostname: hn });
                await FB.setDoc(ref, { data: { ...w.data, bookmarks: bm }, updatedAt: FB.serverTimestamp() }, { merge: true });
                D._renderEditBm({ data: { bookmarks: bm } });
            }
        } catch (e) { D.showToast('Invalid URL', 'error'); }
    };
    D._renderEditBm = w => { const l = D.el('editBmList'); if (l) l.innerHTML = (w.data?.bookmarks || []).map((b, i) => `<div class="edit-item"><img src="${b.favicon}" width="14"> ${b.title} <button class="btn-x" onclick="DG._removeEditBm(${i})">✕</button></div>`).join(''); };
    D._removeEditBm = async i => {
        const ref = FB.doc(FB.db, FB.COL.WIDGETS, ST.editingWidgetId);
        const snap = await FB.getDoc(ref);
        if (snap.exists()) {
            const w = snap.data(); const bm = w.data?.bookmarks || []; bm.splice(i, 1);
            await FB.setDoc(ref, { data: { ...w.data, bookmarks: bm }, updatedAt: FB.serverTimestamp() }, { merge: true });
            D._renderEditBm({ data: { bookmarks: bm } });
        }
    };

    // Task helpers
    D._addTask = async () => {
        const text = D.el('editTaskInput').value.trim(); if (!text) return;
        const ref = FB.doc(FB.db, FB.COL.WIDGETS, ST.editingWidgetId);
        const snap = await FB.getDoc(ref);
        if (snap.exists()) {
            const w = snap.data(); const tasks = w.data?.tasks || []; tasks.push({ text, done: false });
            await FB.setDoc(ref, { data: { ...w.data, tasks }, updatedAt: FB.serverTimestamp() }, { merge: true });
            D._renderEditTasks({ data: { tasks } });
        }
    };
    D._renderEditTasks = w => { const l = D.el('editTaskList'); if (l) l.innerHTML = (w.data?.tasks || []).map((t, i) => `<div class="edit-item" onclick="DG._toggleEditTask(${i})"><iconify-icon icon="${t.done ? 'mdi:checkbox-marked' : 'mdi:checkbox-blank-outline'}" style="color:${t.done ? 'var(--green-500)' : '#ccc'}"></iconify-icon> ${t.text}</div>`).join(''); };
    D._toggleEditTask = async i => {
        const ref = FB.doc(FB.db, FB.COL.WIDGETS, ST.editingWidgetId);
        const snap = await FB.getDoc(ref);
        if (snap.exists()) {
            const w = snap.data(); const tasks = w.data?.tasks || []; if (tasks[i]) tasks[i].done = !tasks[i].done;
            await FB.setDoc(ref, { data: { ...w.data, tasks }, updatedAt: FB.serverTimestamp() }, { merge: true });
            D._renderEditTasks({ data: { tasks } });
        }
    };

    // Gallery upload
    D._uploadGallery = async e => {
        const files = e.target.files; if (!files.length) return;
        const ref = FB.doc(FB.db, FB.COL.WIDGETS, ST.editingWidgetId);
        const snap = await FB.getDoc(ref);
        const imgs = snap.exists() ? snap.data().data?.images || [] : [];
        for (let f of files) {
            const fd = new FormData(); fd.append('image', f);
            const r = await fetch(`https://api.imgbb.com/1/upload?key=${FB.IMGBB_KEY}`, { method: 'POST', body: fd });
            const d = await r.json();
            if (d.success) imgs.push(d.data.url);
        }
        await FB.setDoc(ref, { data: { ...snap.data().data, images: imgs }, updatedAt: FB.serverTimestamp() }, { merge: true });
    };

    // Project sub-widgets
    D._addProjectSub = async (pid, type) => {
        const ref = FB.doc(FB.db, FB.COL.WIDGETS, pid);
        const snap = await FB.getDoc(ref);
        if (snap.exists()) {
            const w = snap.data(); const subs = w.data?.projectWidgets || [];
            subs.push({ type, title: type, data: {} });
            await FB.setDoc(ref, { data: { ...w.data, projectWidgets: subs }, updatedAt: FB.serverTimestamp() }, { merge: true });
            D.showToast('Resource added');
        }
    };

    // Inline task toggle
    D.toggleTask = async (wid, i) => {
        const ref = FB.doc(FB.db, FB.COL.WIDGETS, wid);
        const snap = await FB.getDoc(ref);
        if (snap.exists()) {
            const w = snap.data(); const tasks = w.data?.tasks || []; if (tasks[i]) tasks[i].done = !tasks[i].done;
            await FB.setDoc(ref, { data: { ...w.data, tasks }, updatedAt: FB.serverTimestamp() }, { merge: true });
        }
    };

    // Note inline update
    D.updateNote = async (wid, content) => {
        await FB.setDoc(FB.doc(FB.db, FB.COL.WIDGETS, wid), { data: { content }, updatedAt: FB.serverTimestamp() }, { merge: true });
    };

    // Render widget body (for each type)
    D._renderWidgetBody = w => {
        const d = w.data || {};
        switch (w.type) {
            case 'bookmarks': {
                const bm = d.bookmarks || [];
                if (!bm.length) return '<div class="widget-empty"><iconify-icon icon="mdi:bookmark-multiple-outline"></iconify-icon><p>No bookmarks</p></div>';
                return `<div class="bookmark-grid">${bm.map(b => `<a class="bookmark-card" href="${b.url}" target="_blank"><img src="${b.favicon}"><span>${(b.title || b.hostname).substring(0, 7)}</span></a>`).join('')}</div>`;
            }
            case 'notes':
                return `<div class="note-toolbar"><button onclick="document.execCommand('bold')"><b>B</b></button><button onclick="document.execCommand('italic')"><i>I</i></button><button onclick="document.execCommand('underline')"><u>U</u></button></div><div class="note-content" contenteditable="true" oninput="DG.updateNote('${w.id}',this.innerText)">${d.content || ''}</div>`;
            case 'tasks': {
                const tasks = d.tasks || [];
                if (!tasks.length) return '<div class="widget-empty"><iconify-icon icon="mdi:checkbox-marked-outline"></iconify-icon><p>No tasks</p></div>';
                const done = tasks.filter(t => t.done).length;
                return `<div class="task-progress"><div class="task-progress-bar" style="width:${Math.round(done / tasks.length * 100)}%"></div></div>${tasks.map((t, i) => `<div class="task-item" onclick="DG.toggleTask('${w.id}',${i})"><iconify-icon icon="${t.done ? 'mdi:checkbox-marked' : 'mdi:checkbox-blank-outline'}" style="color:${t.done ? 'var(--green-500)' : '#ccc'}"></iconify-icon>${t.text}</div>`).join('')}`;
            }
            case 'embed':
                return d.embedUrl ? `<div class="embed-preview"><iframe src="${d.embedUrl}" allowfullscreen></iframe></div>` : '<div class="widget-empty"><iconify-icon icon="mdi:code-tags"></iconify-icon><p>No embed</p></div>';
            case 'clock':
                setTimeout(() => {
                    const el = document.getElementById(`clock_${w.id}`);
                    if (el) {
                        const update = () => { el.textContent = new Date().toLocaleTimeString(); };
                        update(); setInterval(update, 1000);
                    }
                }, 100);
                return `<div class="clock-display"><div class="clock-time" id="clock_${w.id}">--:--</div><div class="clock-date">${new Date().toLocaleDateString()}</div></div>`;
            case 'calculator':
                return `<div class="calc-display" id="calcDisplay_${w.id}">0</div><div class="calc-grid">${'C÷×−789+456=123.0'.split('').map(k => {
                    const ops = { 'C': 'C', '÷': '/', '×': '*', '−': '-' }; const v = ops[k] || k;
                    return `<button class="calc-btn${'÷×−+'.includes(k) ? ' operator' : k === '=' ? ' equals' : ''}" onclick="${k === 'C' ? `DG.calcClear('${w.id}')` : k === '=' ? `DG.calcResult('${w.id}')` : `DG.calcInput('${w.id}','${v}')`}">${k}</button>`;
                }).join('')}</div><input type="hidden" id="calcInput_${w.id}">`;
            case 'gallery': {
                const imgs = d.images || [];
                if (!imgs.length) return '<div class="widget-empty"><iconify-icon icon="mdi:image-multiple-outline"></iconify-icon><p>No images</p></div>';
                return `<div class="gallery-grid">${imgs.map(img => `<div class="gallery-item" onclick="DG.openLightbox('${img}')"><img src="${img}"></div>`).join('')}</div>`;
            }
            case 'project': {
                const hasContent = d.name || (d.projectWidgets || []).length;
                if (!hasContent) return '<div class="widget-empty"><iconify-icon icon="mdi:folder-outline"></iconify-icon><p>Setup project</p></div>';
                let html = `<div class="project-card">${d.name ? `<div class="project-name">${d.name}</div>` : ''}${d.description ? `<div class="project-desc">${d.description}</div>` : ''}<div class="project-meta">Owner: You</div>${(d.website || d.githubUrl) ? `<div class="project-links">${d.website ? `<a href="${d.website}" target="_blank">Website</a>` : ''}${d.githubUrl ? `<a href="${d.githubUrl}" target="_blank">GitHub</a>` : ''}</div>` : ''}`;
                const subs = d.projectWidgets || [];
                if (subs.length) {
                    html += subs.map(s => `<div class="sub-widget"><strong>${s.title}</strong></div>`).join('');
                }
                html += '</div>';
                return html;
            }
            default:
                return '<p>Widget ready</p>';
        }
    };

    // Calculator helpers
    D.calcInput = (wid, k) => { const inp = document.getElementById(`calcInput_${wid}`); inp.value += k; document.getElementById(`calcDisplay_${wid}`).textContent = inp.value; };
    D.calcResult = wid => { const inp = document.getElementById(`calcInput_${wid}`); try { const res = Function('"use strict";return (' + inp.value + ')')(); inp.value = res; document.getElementById(`calcDisplay_${wid}`).textContent = res; } catch (e) { document.getElementById(`calcDisplay_${wid}`).textContent = 'Error'; } };
    D.calcClear = wid => { const inp = document.getElementById(`calcInput_${wid}`); inp.value = ''; document.getElementById(`calcDisplay_${wid}`).textContent = '0'; };

    // Render all widgets
    D.renderWidgets = () => {
        const grid = D.el('widgetGrid');
        if (!ST.widgetsData.length) { grid.innerHTML = ''; D.el('emptyState').style.display = 'flex'; return; }
        D.el('emptyState').style.display = 'none';
        grid.innerHTML = ST.widgetsData.map(w => `<div class="widget size-${w.size || 'medium'}" data-id="${w.id}">
            <div class="widget-header">
                <span class="widget-title" onclick="DG.openEditPanel('${w.id}')">${w.title}</span>
                <div class="widget-actions">
                    <button class="widget-btn" onclick="DG.openEditPanel('${w.id}')"><iconify-icon icon="mdi:pencil"></iconify-icon></button>
                    <button class="widget-btn" onclick="DG.openContextMenu('${w.id}',event)"><iconify-icon icon="mdi:dots-horizontal"></iconify-icon></button>
                </div>
            </div>
            <div class="widget-body">${D._renderWidgetBody(w)}</div>
        </div>`).join('');
        // Init Sortable
        if (typeof Sortable !== 'undefined') {
            new Sortable(grid, { animation: 200, handle: '.widget-header', ghostClass: 'sortable-ghost' });
        }
    };

    // Initialize
    D.initApp = async user => {
        const name = user.displayName || (user.email ? user.email.split('@')[0] : 'user');
        D.el('avatarInitial').textContent = name[0].toUpperCase();
        D.el('profileInitial').textContent = name[0].toUpperCase();
        D.el('usernameDisplay').textContent = '@' + name.toLowerCase().replace(/\s/g, '_');
        
        // Load backgrounds
        D._bgUrls = await window.DG.loadBackgrounds();
        D._setupBgGrid();

        // Setup widget type grid
        const types = ['bookmarks','rss','notes','tasks','embed','project','clock','gallery','calculator'];
        D.el('widgetTypeGrid').innerHTML = types.map(t => {
            const icons = { bookmarks:'bookmark-multiple', rss:'rss', notes:'note-text', tasks:'checkbox-marked', embed:'code-tags', project:'folder', clock:'clock', gallery:'image-multiple', calculator:'calculator' };
            return `<button class="widget-type-btn" onclick="DG.addWidget('${t}')" style="padding:12px;border:1px solid #ddd;border-radius:8px;background:#fff;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px"><iconify-icon icon="mdi:${icons[t]}"></iconify-icon>${t[0].toUpperCase()+t.slice(1)}</button>`;
        }).join('');

        // Load settings
        const snap = await FB.getDoc(FB.doc(FB.db, FB.COL.SETTINGS, user.uid));
        if (snap.exists()) {
            const d = snap.data();
            if (d.bg) { ST.currentBg = d.bg; D.el('bgLayer').style.backgroundImage = `url(${d.bg})`; }
            if (d.cols) D.updateCols(d.cols);
            if (d.pageTitle) { ST.pageTitle = d.pageTitle; D.el('pageTitleDisplay').textContent = d.pageTitle; }
            if (d.profileImg) D._updateProfileImg(d.profileImg);
            ST.settings = d;
        }

        // Load pages
        FB.onSnapshot(FB.query(FB.collection(FB.db, FB.COL.PAGES), FB.where('userId', '==', user.uid)), snap => {
            const pages = [];
            snap.forEach(d => pages.push({ id: d.id, title: d.data().title }));
            if (pages.length === 0) {
                // Auto-create default page if none
                (async () => {
                    const pageId = 'default';
                    await FB.setDoc(FB.doc(FB.db, FB.COL.PAGES, pageId), { id: pageId, userId: user.uid, title: 'My Dashboard', icon: '📄', order: 0, createdAt: FB.serverTimestamp(), updatedAt: FB.serverTimestamp() });
                    ST.currentPageId = pageId;
                    D.renderPagesList([{ id: pageId, title: 'My Dashboard' }]);
                })();
            } else {
                ST.currentPageId = pages[0].id;
                D.renderPagesList(pages);
            }
        });

        // Load widgets
        FB.onSnapshot(FB.collection(FB.db, FB.COL.WIDGETS), snap => {
            ST.widgetsData = [];
            snap.forEach(doc => { if (doc.data().userId === user.uid && doc.data().pageId === ST.currentPageId) ST.widgetsData.push({ id: doc.id, ...doc.data() }); });
            D.renderWidgets();
        });
    };

    // Sign out
    D.handleSignOut = async () => { const m = await import("https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js"); await m.signOut(FB.auth); window.location.href = 'sign.html'; };

    // Click outside
    document.addEventListener('click', e => {
        if (!e.target.closest('.dropdown')) D.el('avatarMenu').classList.remove('show');
        if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('show');
        if (!e.target.closest('.widget-btn')) D.closeContextMenu();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { D.closeContextMenu(); D.closeEditPanel(); D.closeLightbox(); D.el('avatarMenu').classList.remove('show'); D.qsa('.modal-overlay.show').forEach(m => m.classList.remove('show')); } });

    console.log('🚀 DockGrid App Ready');
})();
