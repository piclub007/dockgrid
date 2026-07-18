// ===== DOCKGRID APP =====
(function(){
    var D = window.DG;
    if(!D){ console.error('DG namespace not found'); return; }
    var FB = D.FB;
    var ST = D.STATE;

    // ===== UTILITY =====
    D.el = function(id){ return document.getElementById(id); };
    D.qs = function(sel, p){ return (p||document).querySelector(sel); };
    D.qsa = function(sel, p){ return (p||document).querySelectorAll(sel); };

    D.showToast = function(msg, type){
        type = type || 'info';
        var c = D.el('toastContainer') || D.createToastContainer();
        var t = document.createElement('div');
        t.className = 'toast ' + type;
        t.textContent = msg;
        c.appendChild(t);
        setTimeout(function(){ t.style.opacity='0'; t.style.transform='translateX(60px)'; t.style.transition='all 200ms'; setTimeout(function(){t.remove()},200); },2800);
    };
    
    D.createToastContainer = function(){
        var c = document.createElement('div');
        c.id = 'toastContainer';
        c.className = 'toast-container';
        document.body.appendChild(c);
        return c;
    };

    D.searchGoogle = function(q){ if(!q.trim())return; window.open('https://www.google.com/search?q='+encodeURIComponent(q),'_blank'); };
    D.showLoading = function(){ var b=D.el('loadingBar'); if(b){b.classList.add('active');b.classList.remove('done');} };
    D.hideLoading = function(){ var b=D.el('loadingBar'); if(b){b.classList.remove('active');b.classList.add('done');setTimeout(function(){b.classList.remove('done')},400);} };

    D.toggleDropdown = function(id){ var m=D.el(id); if(m)m.classList.toggle('show'); };
    D.openModal = function(id){ var m=D.el(id); if(m){m.classList.add('show');} var am=D.el('avatarMenu'); if(am)am.classList.remove('show'); };
    D.closeModal = function(id){ var m=D.el(id); if(m)m.classList.remove('show'); };
    D.openAddWidgetModal = function(){ D.openModal('addWidgetModal'); };
    D.openProfileModal = function(){ D.openModal('profileModal'); };
    D.openBackgroundModal = function(){ D.openModal('pageSettingsModal'); setTimeout(function(){ D.switchSettingsTab('tab-background', D.qs('[data-tab="tab-background"]')); },80); };
    D.openPageSettingsModal = function(){ D.openModal('pageSettingsModal'); };

    // ===== PAGE TITLE =====
    D.savePageTitle = function(title){
        title = (title||'').trim() || 'DockGrid Page';
        ST.currentPageTitle = title;
        var d = D.el('pageTitleDisplay'); if(d)d.textContent = title;
        var i = D.el('pageTitle'); if(i)i.value = title;
        D.saveSetting('pageTitle', title);
    };

    // ===== SETTINGS TABS =====
    D.switchSettingsTab = function(tabId, btn){
        D.qsa('.modal-tab').forEach(function(t){t.classList.remove('active')});
        D.qsa('.tab-content').forEach(function(t){t.classList.remove('active')});
        if(btn)btn.classList.add('active');
        var tab = D.el(tabId); if(tab)tab.classList.add('active');
    };

    // ===== PAGES SIDEBAR =====
    D.openPagesSidebar = function(){
        var s=D.el('pagesSidebar'), o=D.el('pagesOverlay'), am=D.el('avatarMenu');
        if(s)s.classList.add('open'); if(o)o.classList.add('show'); if(am)am.classList.remove('show');
    };
    D.closePagesSidebar = function(){
        var s=D.el('pagesSidebar'), o=D.el('pagesOverlay');
        if(s)s.classList.remove('open'); if(o)o.classList.remove('show');
    };

    D.createNewPage = async function(){
        if(!ST.currentUser)return;
        var pagesRef = FB.collection(FB.db, FB.COL.PAGES);
        var q = FB.query(pagesRef, FB.where('userId','==',ST.currentUser.uid));
        var snap = await FB.getDocs(q);
        if(snap.size >= 3){ D.showToast('Maximum 3 pages allowed','error'); return; }
        var pageId = 'page_'+Date.now();
        await FB.setDoc(FB.doc(FB.db, FB.COL.PAGES, pageId), {
            id:pageId, userId:ST.currentUser.uid, title:'New Page', icon:'📄',
            order:snap.size, isPublic:false,
            createdAt:FB.serverTimestamp(), updatedAt:FB.serverTimestamp()
        });
        D.showToast('Page created!','success');
    };

    D.switchPage = function(pageId){
        ST.currentPageId = pageId;
        D.closePagesSidebar();
        D.showToast('Switched page','success');
    };

    D.renderPagesList = function(pages){
        var list = D.el('pagesList'); if(!list)return;
        var currentId = ST.currentPageId;
        if(!pages.length){ list.innerHTML='<div class="pages-empty">No pages yet</div>'; }
        else { list.innerHTML = pages.map(function(p){
            var active = p.id===currentId?' active':'';
            var label = p.id===currentId?' (current)':'';
            return '<div class="page-item'+active+'" onclick="DG.switchPage(\''+p.id+'\')"><iconify-icon icon="mdi:file-document-outline" width="15" height="15"></iconify-icon>'+ (p.title||'Untitled') + label +'</div>';
        }).join(''); }
        var limit = D.el('pageLimit'); if(limit)limit.textContent = pages.length+'/3 pages used';
        var btn = D.el('newPageBtn');
        if(btn){ btn.disabled = pages.length>=3; btn.style.opacity = pages.length>=3?'0.5':'1'; btn.style.cursor = pages.length>=3?'not-allowed':'pointer'; }
    };

    // ===== BACKGROUND =====
    D.setBg = function(url){ ST.currentBg=url; D.updateBgDisplay(url); D.saveSetting('bg',url); };
    D.updateBgDisplay = function(url){
        var l=D.el('bgLayer'); if(l)l.style.backgroundImage='url('+url+')';
        D.qsa('.image-option').forEach(function(e){e.classList.remove('selected');if(e.dataset.bg===url)e.classList.add('selected')});
    };
    D.resetBg = function(){ D.setBg(FB.DEFAULT_BGS[0]); D.showToast('Background reset','success'); };

    D.uploadBg = async function(event){
        var file=event.target.files[0]; if(!file)return;
        D.showLoading(); D.showToast('Uploading...');
        var fd=new FormData(); fd.append('image',file);
        try{var res=await fetch('https://api.imgbb.com/1/upload?key='+FB.IMGBB_KEY,{method:'POST',body:fd});var d=await res.json();if(d.success){D.setBg(d.data.url);D.showToast('Background updated!','success')}}catch(e){D.showToast('Upload failed','error')}
        D.hideLoading();
    };

    D.uploadProfile = async function(event){
        var file=event.target.files[0]; if(!file)return;
        D.showLoading(); D.showToast('Uploading...');
        var fd=new FormData(); fd.append('image',file);
        try{var res=await fetch('https://api.imgbb.com/1/upload?key='+FB.IMGBB_KEY,{method:'POST',body:fd});var d=await res.json();if(d.success){D.updateProfileImages(d.data.url);D.saveSetting('profileImg',d.data.url);D.closeModal('profileModal');D.showToast('Profile updated!','success')}}catch(e){D.showToast('Upload failed','error')}
        D.hideLoading();
    };

    D.updateProfileImages = function(url){
        var ab=D.el('avatarBtn'), pa=D.el('profileAvatar');
        if(ab)ab.innerHTML='<img src="'+url+'" alt="P">';
        if(pa)pa.innerHTML='<img src="'+url+'" alt="P" style="width:100%;height:100%;object-fit:cover;border-radius:50%">';
    };

    // ===== SETTINGS =====
    D.saveSetting = async function(key,value){
        if(!ST.currentUser)return;
        await FB.setDoc(FB.doc(FB.db,FB.COL.SETTINGS,ST.currentUser.uid),{[key]:value},{merge:true});
    };

    D.updateOpacity = function(val){
        ST.widgetOpacity=parseInt(val);
        var ol=D.el('opLabel'); if(ol)ol.textContent=val+'%';
        D.updateOpacityUI(val);
        D.saveSetting('opacity',parseInt(val));
    };

    D.updateOpacityUI = function(val){
        var o=val/100;
        D.qsa('.widget').forEach(function(w){
            w.style.background='rgba(255,255,255,'+o+')';
            var h=w.querySelector('.widget-header'); if(h)h.style.background='rgba(250,250,250,'+o+')';
        });
    };

    D.updateCols = function(val){
        ST.colCount=parseInt(val);
        D.updateColDisplay(val);
        D.saveSetting('cols',parseInt(val));
    };

    D.updateColDisplay = function(val){
        var grid=D.el('widgetGrid'); if(!grid)return;
        grid.className='widget-grid'; if(val>=1&&val<=4)grid.classList.add('cols-'+val);
        var sel=D.el('columnCountSelect'); if(sel)sel.value=val;
    };

    // ===== WIDGET OPERATIONS =====
    D.addWidget = async function(type){
        var names={bookmarks:'Bookmarks',rss:'RSS News',notes:'Notes',tasks:'Tasks',embed:'Embed',project:'Project',clock:'Clock',gallery:'Gallery',calculator:'Calculator'};
        var sizes={bookmarks:'medium',rss:'medium',notes:'small',tasks:'medium',embed:'large',project:'large',clock:'small',gallery:'large',calculator:'small'};
        var id=type+'_'+Date.now();
        D.showLoading();
        await FB.setDoc(FB.doc(FB.db,FB.COL.WIDGETS,id),{
            id:id,type:type,title:names[type]||'Widget',size:sizes[type]||'medium',
            userId:ST.currentUser.uid,pageId:ST.currentPageId||'default',
            data:{bookmarks:[],tasks:[],content:'',items:[],images:[],projectWidgets:[]},
            createdAt:FB.serverTimestamp(),updatedAt:FB.serverTimestamp()
        });
        D.closeModal('addWidgetModal');
        D.showToast('Added '+(names[type]||'Widget'),'success');
        D.hideLoading();
    };

    D.removeWidget = async function(id){
        if(!confirm('Remove this widget?'))return;
        await FB.deleteDoc(FB.doc(FB.db,FB.COL.WIDGETS,id));
        D.closeContextMenu();
        D.showToast('Widget removed','success');
    };

    D.renameWidget = async function(id,newTitle){
        if(!(newTitle||'').trim())return;
        await FB.setDoc(FB.doc(FB.db,FB.COL.WIDGETS,id),{title:newTitle.trim()},{merge:true});
    };

    D.changeWidgetSize = async function(id,size){
        await FB.setDoc(FB.doc(FB.db,FB.COL.WIDGETS,id),{size:size},{merge:true});
        D.closeContextMenu();
        D.showToast('Size updated','success');
    };

    // ===== CONTEXT MENU =====
    D.openContextMenu = function(widgetId,event){
        event.stopPropagation();event.preventDefault();
        var menu=D.el('widgetContextMenu'); if(!menu)return;
        var widget=ST.widgetsData.find(function(w){return w.id===widgetId}); if(!widget)return;
        var items=D.getWidgetMenuItems(widget);
        menu.innerHTML=items.map(function(m){
            if(m.label==='divider')return'<div class="dropdown-divider"></div>';
            return'<button class="dropdown-item'+(m.danger?' danger':'')+'" onclick="DG.closeContextMenu();'+m.action+'"><iconify-icon icon="'+m.icon+'" width="14" height="14"></iconify-icon>'+m.label+'</button>';
        }).join('');
        var x=event.clientX,y=event.clientY;
        if(x+200>window.innerWidth)x=window.innerWidth-210;
        if(y+300>window.innerHeight)y=window.innerHeight-310;
        menu.style.left=x+'px';menu.style.top=y+'px';
        menu.classList.add('show');
        ST.contextMenuWidgetId=widgetId;
    };

    D.closeContextMenu = function(){ var m=D.el('widgetContextMenu'); if(m)m.classList.remove('show'); };

    D.getWidgetMenuItems = function(widget){
        var id=widget.id;
        var sizes=[
            {label:'Size: Small',icon:'mdi:resize',action:'DG.changeWidgetSize(\''+id+'\',\'small\')'},
            {label:'Size: Medium',icon:'mdi:resize',action:'DG.changeWidgetSize(\''+id+'\',\'medium\')'},
            {label:'Size: Large',icon:'mdi:resize',action:'DG.changeWidgetSize(\''+id+'\',\'large\')'},
            {label:'Size: Huge',icon:'mdi:resize',action:'DG.changeWidgetSize(\''+id+'\',\'huge\')'}
        ];
        var common=[
            {label:'Rename widget',icon:'mdi:pencil-outline',action:'DG.openEditPanel(\''+id+'\')'},
            {label:'divider'}
        ].concat(sizes).concat([{label:'divider'},{label:'Delete widget',icon:'mdi:delete-outline',action:'DG.removeWidget(\''+id+'\')',danger:true}]);
        var byType={
            bookmarks:[{label:'Open all links',icon:'mdi:open-in-new',action:'DG.openAllBookmarks(\''+id+'\')'},{label:'Add bookmark',icon:'mdi:bookmark-plus-outline',action:'DG.openEditPanel(\''+id+'\')'},{label:'divider'}].concat(common),
            rss:[{label:'Refresh',icon:'mdi:refresh',action:'DG.refreshRSS(\''+id+'\')'},{label:'Add feed',icon:'mdi:rss-plus',action:'DG.openEditPanel(\''+id+'\')'},{label:'divider'}].concat(common),
            notes:[{label:'Edit note',icon:'mdi:note-edit-outline',action:'DG.openEditPanel(\''+id+'\')'},{label:'divider'}].concat(common),
            tasks:[{label:'Add task',icon:'mdi:playlist-plus',action:'DG.openEditPanel(\''+id+'\')'},{label:'divider'}].concat(common),
            embed:[{label:'Edit embed',icon:'mdi:code-tags',action:'DG.openEditPanel(\''+id+'\')'},{label:'divider'}].concat(common),
            project:[{label:'Edit project',icon:'mdi:folder-edit-outline',action:'DG.openEditPanel(\''+id+'\')'},{label:'divider'}].concat(common),
            clock:[{label:'Settings',icon:'mdi:cog-outline',action:'DG.openEditPanel(\''+id+'\')'},{label:'divider'}].concat(common),
            gallery:[{label:'Add images',icon:'mdi:image-plus',action:'DG.openEditPanel(\''+id+'\')'},{label:'divider'}].concat(common),
            calculator:[{label:'Mode',icon:'mdi:swap-horizontal',action:'DG.openEditPanel(\''+id+'\')'},{label:'divider'}].concat(common)
        };
        return byType[widget.type]||common;
    };

    // ===== EDIT PANEL =====
    D.openEditPanel = function(widgetId){
        var widget=ST.widgetsData.find(function(w){return w.id===widgetId}); if(!widget)return;
        ST.editingWidgetId=widgetId;
        var title=D.el('editPanelTitle'); if(title)title.textContent='Edit '+(widget.title||'Widget');
        var body=D.el('editPanelBody'); if(!body)return;

        switch(widget.type){
            case'bookmarks':
                body.innerHTML='<div class="form-group"><label class="form-label">Add Bookmark URL</label><input type="url" class="form-input" id="editBmUrl" placeholder="https://example.com"></div><button class="btn btn-primary btn-sm" style="width:100%;margin-bottom:12px" onclick="DG.addBookmarkFromPanel()">Add Bookmark</button><div id="editBmList" class="edit-list"></div>';
                D.renderEditBookmarks(widget); break;
            case'notes':
                body.innerHTML='<div class="form-group"><label class="form-label">Note Content</label><textarea class="form-input form-textarea" id="editNoteContent" style="min-height:200px;background:#fff9c4;color:#333">'+((widget.data&&widget.data.content)||'')+'</textarea></div>'; break;
            case'tasks':
                body.innerHTML='<div class="form-group"><label class="form-label">New Task</label><input type="text" class="form-input" id="editTaskInput" placeholder="Task description"><button class="btn btn-primary btn-sm" style="width:100%;margin-top:6px" onclick="DG.addTaskFromPanel()">Add Task</button></div><div id="editTaskList" class="edit-list"></div>';
                D.renderEditTasks(widget); break;
            case'embed':
                body.innerHTML='<div class="form-group"><label class="form-label">Embed URL</label><input type="url" class="form-input" id="editEmbedUrl" placeholder="YouTube, Figma, Docs URL"></div>'; break;
            case'rss':
                body.innerHTML='<div class="form-group"><label class="form-label">RSS Feed URL</label><input type="url" class="form-input" id="editRssUrl" placeholder="https://feeds.example.com/rss"></div>'; break;
            case'project':
                body.innerHTML='<div class="form-group"><label class="form-label">Project Name</label><input type="text" class="form-input" id="editProjectName" placeholder="My Project"><label class="form-label" style="margin-top:10px">Description</label><textarea class="form-input form-textarea" id="editProjectDesc" placeholder="Project description"></textarea><label class="form-label" style="margin-top:10px">GitHub URL</label><input type="url" class="form-input" id="editProjectUrl" placeholder="https://github.com/user/repo"><label class="form-label" style="margin-top:10px">Website</label><input type="url" class="form-input" id="editProjectWebsite" placeholder="https://example.com"><label class="form-label" style="margin-top:10px">Add Sub-Widgets</label><div class="widget-type-grid" style="grid-template-columns:repeat(2,1fr)">'+[{t:'bookmarks',i:'mdi:bookmark-multiple-outline',n:'Bookmarks'},{t:'rss',i:'mdi:rss',n:'RSS Feed'},{t:'gallery',i:'mdi:image-multiple-outline',n:'Gallery'},{t:'notes',i:'mdi:note-text-outline',n:'Note'},{t:'tasks',i:'mdi:checkbox-marked-outline',n:'Tasks'},{t:'embed',i:'mdi:code-tags',n:'Embed'}].map(function(s){return'<button class="widget-type-btn" onclick="DG.addProjectSubWidget(\''+widgetId+'\',\''+s.t+'\')"><iconify-icon icon="'+s.i+'"></iconify-icon>'+s.n+'</button>'}).join('')+'</div>'; break;
            case'clock': body.innerHTML='<div class="form-group"><label class="form-label">Time Format</label><select class="form-select" id="editClockFmt"><option>12-hour</option><option>24-hour</option></select></div>'; break;
            case'gallery': body.innerHTML='<div class="form-group"><label class="form-label">Upload Images</label><input type="file" class="form-input" accept="image/*" multiple id="editGalleryUpload" onchange="DG.uploadGalleryImages(event)"></div><div id="editGalleryPreview" class="gallery-grid"></div>'; break;
            case'calculator': body.innerHTML='<div class="form-group"><label class="form-label">Mode</label><select class="form-select" id="editCalcMode"><option>Basic</option><option>Scientific</option></select></div>'; break;
        }

        var panel=D.el('editPanel'), overlay=D.el('editPanelOverlay');
        if(panel)panel.classList.add('open'); if(overlay)overlay.classList.add('show');
        D.closeContextMenu();
    };

    D.closeEditPanel = function(){
        var panel=D.el('editPanel'), overlay=D.el('editPanelOverlay');
        if(panel)panel.classList.remove('open'); if(overlay)overlay.classList.remove('show');
        ST.editingWidgetId=null;
    };

    D.saveEditPanel = async function(){
        var widgetId=ST.editingWidgetId; if(!widgetId)return;
        var widget=ST.widgetsData.find(function(w){return w.id===widgetId}); if(!widget)return;

        switch(widget.type){
            case'notes': var c=D.el('editNoteContent'); if(c)await FB.setDoc(FB.doc(FB.db,FB.COL.WIDGETS,widgetId),{data:{content:c.value},updatedAt:FB.serverTimestamp()},{merge:true}); break;
            case'embed': var u=D.el('editEmbedUrl'); if(u&&u.value)await FB.setDoc(FB.doc(FB.db,FB.COL.WIDGETS,widgetId),{data:{embedUrl:u.value},updatedAt:FB.serverTimestamp()},{merge:true}); break;
            case'rss': var r=D.el('editRssUrl'); if(r&&r.value)await FB.setDoc(FB.doc(FB.db,FB.COL.WIDGETS,widgetId),{data:{rssUrl:r.value},updatedAt:FB.serverTimestamp()},{merge:true}); break;
            case'project':
                var pn=D.el('editProjectName'), pd=D.el('editProjectDesc'), pu=D.el('editProjectUrl'), pw=D.el('editProjectWebsite');
                var pdata={};
                if(pn)pdata.name=pn.value; if(pd)pdata.description=pd.value; if(pu)pdata.githubUrl=pu.value; if(pw)pdata.website=pw.value;
                await FB.setDoc(FB.doc(FB.db,FB.COL.WIDGETS,widgetId),{data:Object.assign({},widget.data||{},pdata),updatedAt:FB.serverTimestamp()},{merge:true});
                break;
        }
        D.closeEditPanel(); D.showToast('Saved','success');
    };

    // ===== BOOKMARK PANEL FUNCTIONS =====
    D.addBookmarkFromPanel = async function(){
        var url=(D.el('editBmUrl').value||'').trim(); if(!url)return;
        D.el('editBmUrl').value='';
        var widgetId=ST.editingWidgetId;
        try{
            var hostname=new URL(url).hostname;
            var favicon='https://www.google.com/s2/favicons?domain='+hostname+'&sz=64';
            var title=hostname;
            try{var res=await fetch('https://api.microlink.io/?url='+encodeURIComponent(url));var d=await res.json();if(d.status==='success'&&d.data.title)title=d.data.title}catch(e){}
            var ref=FB.doc(FB.db,FB.COL.WIDGETS,widgetId);var snap=await FB.getDoc(ref);
            if(snap.exists()){var w=snap.data();var bm=(w.data&&w.data.bookmarks)||[];bm.push({url:url,title:title,favicon:favicon,hostname:hostname});await FB.setDoc(ref,{data:Object.assign({},w.data,{bookmarks:bm}),updatedAt:FB.serverTimestamp()},{merge:true});D.renderEditBookmarks({data:{bookmarks:bm}})}
        }catch(e){D.showToast('Failed','error')}
    };
    D.renderEditBookmarks = function(w){ var l=D.el('editBmList'); if(!l)return; var bm=(w.data&&w.data.bookmarks)||[]; l.innerHTML=bm.map(function(b,i){return'<div class="edit-item"><img src="'+b.favicon+'" style="width:14px;height:14px"><span>'+b.title+'</span><button onclick="DG.removeEditBookmark('+i+')" class="btn-x">✕</button></div>'}).join(''); };
    D.removeEditBookmark = async function(i){ var ref=FB.doc(FB.db,FB.COL.WIDGETS,ST.editingWidgetId);var snap=await FB.getDoc(ref);if(snap.exists()){var w=snap.data();var bm=(w.data&&w.data.bookmarks)||[];bm.splice(i,1);await FB.setDoc(ref,{data:Object.assign({},w.data,{bookmarks:bm}),updatedAt:FB.serverTimestamp()},{merge:true});D.renderEditBookmarks({data:{bookmarks:bm}})} };

    // ===== TASK PANEL FUNCTIONS =====
    D.addTaskFromPanel = async function(){ var t=D.el('editTaskInput'); if(!t||!t.value.trim())return; var text=t.value.trim();t.value=''; var ref=FB.doc(FB.db,FB.COL.WIDGETS,ST.editingWidgetId);var snap=await FB.getDoc(ref);if(snap.exists()){var w=snap.data();var tasks=(w.data&&w.data.tasks)||[];tasks.push({text:text,done:false});await FB.setDoc(ref,{data:Object.assign({},w.data,{tasks:tasks}),updatedAt:FB.serverTimestamp()},{merge:true});D.renderEditTasks({data:{tasks:tasks}})} };
    D.renderEditTasks = function(w){ var l=D.el('editTaskList'); if(!l)return; var tasks=(w.data&&w.data.tasks)||[]; l.innerHTML=tasks.map(function(t,i){return'<div class="edit-item" onclick="DG.toggleEditTask('+i+')"><iconify-icon icon="'+(t.done?'mdi:checkbox-marked':'mdi:checkbox-blank-outline')+'" width="14" height="14" style="color:'+(t.done?'var(--green-500)':'#888')+'"></iconify-icon><span style="text-decoration:'+(t.done?'line-through':'none')+'">'+t.text+'</span></div>'}).join(''); };
    D.toggleEditTask = async function(i){ var ref=FB.doc(FB.db,FB.COL.WIDGETS,ST.editingWidgetId);var snap=await FB.getDoc(ref);if(snap.exists()){var w=snap.data();var tasks=(w.data&&w.data.tasks)||[];if(tasks[i]){tasks[i].done=!tasks[i].done;await FB.setDoc(ref,{data:Object.assign({},w.data,{tasks:tasks}),updatedAt:FB.serverTimestamp()},{merge:true});D.renderEditTasks({data:{tasks:tasks}})} } };

    // ===== GALLERY =====
    D.uploadGalleryImages = async function(event){
        var files=event.target.files; if(!files.length)return;
        var widgetId=ST.editingWidgetId;
        var ref=FB.doc(FB.db,FB.COL.WIDGETS,widgetId);var snap=await FB.getDoc(ref);
        var images=(snap.exists()&&snap.data().data&&snap.data().data.images)||[];
        for(var i=0;i<files.length;i++){
            var fd=new FormData();fd.append('image',files[i]);
            try{var res=await fetch('https://api.imgbb.com/1/upload?key='+FB.IMGBB_KEY,{method:'POST',body:fd});var d=await res.json();if(d.success)images.push(d.data.url)}catch(e){}
        }
        await FB.setDoc(ref,{data:Object.assign({},snap.exists()?snap.data().data:{},{images:images}),updatedAt:FB.serverTimestamp()},{merge:true});
        D.showToast(images.length+' images','success');
    };

    // ===== PROJECT SUB-WIDGETS =====
    D.addProjectSubWidget = async function(projectId, type){
        var names={bookmarks:'Bookmarks',rss:'RSS Feed',gallery:'Gallery',notes:'Note',tasks:'Tasks',embed:'Embed'};
        var ref=FB.doc(FB.db,FB.COL.WIDGETS,projectId);var snap=await FB.getDoc(ref);
        if(snap.exists()){var w=snap.data();var subs=(w.data&&w.data.projectWidgets)||[];subs.push({type:type,title:names[type]||'Widget',data:{bookmarks:[],tasks:[],content:'',images:[]}});await FB.setDoc(ref,{data:Object.assign({},w.data,{projectWidgets:subs}),updatedAt:FB.serverTimestamp()},{merge:true});D.showToast('Added '+names[type],'success')}
    };

    D.openAllBookmarks = function(id){
        var w=ST.widgetsData.find(function(ww){return ww.id===id});
        if(w&&w.data&&w.data.bookmarks){w.data.bookmarks.forEach(function(b){window.open(b.url,'_blank')});D.showToast('Opened '+w.data.bookmarks.length+' links','success')}
        D.closeContextMenu();
    };

    D.refreshRSS = function(id){ D.showToast('Refreshing...','success'); D.closeContextMenu(); };

    // ===== INLINE TOGGLE TASK =====
    D.toggleTaskInline = async function(widgetId,index){
        var ref=FB.doc(FB.db,FB.COL.WIDGETS,widgetId);var snap=await FB.getDoc(ref);
        if(snap.exists()){var w=snap.data();var tasks=(w.data&&w.data.tasks)||[];if(tasks[index]){tasks[index].done=!tasks[index].done;await FB.setDoc(ref,{data:Object.assign({},w.data,{tasks:tasks}),updatedAt:FB.serverTimestamp()},{merge:true})}}
    };

    // ===== CLOCK =====
    D.startClock = function(widgetId){
        var update=function(){var el=document.getElementById('clock_'+widgetId);if(!el)return;var now=new Date();el.textContent=now.toLocaleTimeString();var de=document.getElementById('clockDate_'+widgetId);if(de)de.textContent=now.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'})};
        update();setInterval(update,1000);
    };

    // ===== CALCULATOR =====
    D.calcInput = function(widgetId,key){ var inp=document.getElementById('calcInput_'+widgetId); if(inp)inp.value+=key; };
    D.calcResult = function(widgetId){ var inp=document.getElementById('calcInput_'+widgetId); if(!inp)return; try{inp.value=Function('"use strict";return ('+inp.value+')')()}catch(e){inp.value='Error'} };
    D.calcClear = function(widgetId){ var inp=document.getElementById('calcInput_'+widgetId); if(inp)inp.value=''; };

    // ===== RENDER WIDGET BODY =====
    D.renderWidgetBody = function(w){
        var body='';
        switch(w.type){
            case'bookmarks':
                var bm=(w.data&&w.data.bookmarks)||[];
                if(!bm.length)body='<div class="widget-empty"><iconify-icon icon="mdi:bookmark-multiple-outline" width="22" height="22"></iconify-icon><p>No bookmarks yet</p><button class="btn btn-primary btn-sm" onclick="DG.openEditPanel(\''+w.id+'\')">Add</button></div>';
                else body='<div class="bookmark-grid">'+bm.map(function(b){
                    var name=b.title||b.hostname||''; if(name.length>7)name=name.substring(0,7)+'..';
                    return'<a href="'+b.url+'" target="_blank" class="bookmark-card" rel="noopener" title="'+(b.title||'')+'"><img src="'+b.favicon+'" class="bookmark-card-icon" onerror="this.style.display=\'none\'"><span class="bookmark-card-name">'+name+'</span></a>';
                }).join('')+'</div>';
                break;
            case'notes':
                var content=(w.data&&w.data.content)||'';
                if(!content)body='<div class="widget-empty"><iconify-icon icon="mdi:note-text-outline" width="22" height="22"></iconify-icon><p>No notes yet</p><button class="btn btn-primary btn-sm" onclick="DG.openEditPanel(\''+w.id+'\')">Write</button></div>';
                else body='<div class="note-content" style="background:#fff9c4;padding:12px;border-radius:4px;white-space:pre-wrap;font-size:12px;line-height:1.5;color:#333">'+content+'</div>';
                break;
            case'tasks':
                var tasks=(w.data&&w.data.tasks)||[];
                if(!tasks.length)body='<div class="widget-empty"><iconify-icon icon="mdi:checkbox-marked-outline" width="22" height="22"></iconify-icon><p>No tasks yet</p><button class="btn btn-primary btn-sm" onclick="DG.openEditPanel(\''+w.id+'\')">Add Tasks</button></div>';
                else{var done=tasks.filter(function(t){return t.done}).length;var pct=Math.round(done/tasks.length*100);var allDone=done===tasks.length;
                    body='<div class="task-progress"><div class="task-progress-bar" style="width:'+pct+'%"></div></div><div style="font-size:10px;color:#999;margin-bottom:6px">'+done+'/'+tasks.length+' done</div>';
                    body+=tasks.map(function(t,i){return'<div class="task-item" onclick="DG.toggleTaskInline(\''+w.id+'\','+i+')"><iconify-icon icon="'+(t.done?'mdi:checkbox-marked':'mdi:checkbox-blank-outline')+'" width="15" height="15" style="color:'+(t.done?'var(--green-500)':'#ccc')+';flex-shrink:0"></iconify-icon><span style="text-decoration:'+(t.done?'line-through':'none')+';opacity:'+(t.done?'0.5':'1')+'">'+t.text+'</span></div>'}).join('');
                    if(allDone)body+='<div style="text-align:center;margin-top:8px"><button class="btn btn-primary btn-sm" onclick="DG.hideCompletedTasks(\''+w.id+'\')">Hide completed</button></div>';
                }
                break;
            case'embed':
                var embedUrl=(w.data&&w.data.embedUrl)||'';
                if(!embedUrl)body='<div class="widget-empty"><iconify-icon icon="mdi:code-tags" width="22" height="22"></iconify-icon><p>No embed yet</p><button class="btn btn-primary btn-sm" onclick="DG.openEditPanel(\''+w.id+'\')">Add</button></div>';
                else{var etype=D.detectEmbedType(embedUrl);if(etype==='youtube'){var vid=embedUrl.match(/(?:v=|\/)([\w-]{11})/);vid=vid?vid[1]:null;if(vid)body='<div class="embed-preview"><iframe src="https://www.youtube.com/embed/'+vid+'" allowfullscreen></iframe></div>'}else if(etype==='vimeo'){var vmid=embedUrl.match(/vimeo\.com\/(\d+)/);vmid=vmid?vmid[1]:null;if(vmid)body='<div class="embed-preview"><iframe src="https://player.vimeo.com/video/'+vmid+'" allowfullscreen></iframe></div>'}else{body='<div class="embed-preview"><iframe src="'+embedUrl+'" allowfullscreen></iframe></div>'}}
                break;
            case'rss':
                body='<div class="widget-empty"><iconify-icon icon="mdi:rss" width="22" height="22"></iconify-icon><p>RSS Feed</p><button class="btn btn-primary btn-sm" onclick="DG.openEditPanel(\''+w.id+'\')">Add Feed</button></div>';
                break;
            case'project':
                var pdata=w.data||{};
                body='<div class="project-card">';
                if(pdata.name)body+='<div class="project-name">'+pdata.name+'</div>';
                if(pdata.description)body+='<div class="project-desc">'+pdata.description+'</div>';
                if(pdata.githubUrl||pdata.website)body+='<div class="project-links">'+(pdata.website?'<a href="'+pdata.website+'" target="_blank">🌐 Website</a> ':'')+(pdata.githubUrl?'<a href="'+pdata.githubUrl+'" target="_blank">📂 GitHub</a>':'')+'</div>';
                body+='<div style="margin-top:8px;font-size:10px;color:#999">Owner: You</div>';
                var subs=pdata.projectWidgets||[];
                if(subs.length)body+='<div style="margin-top:8px"><strong style="font-size:11px">Resources ('+subs.length+'):</strong></div>';
                body+='</div>';
                if(!pdata.name&&!subs.length)body='<div class="widget-empty"><iconify-icon icon="mdi:folder-outline" width="22" height="22"></iconify-icon><p>Setup your project</p><button class="btn btn-primary btn-sm" onclick="DG.openEditPanel(\''+w.id+'\')">Setup</button></div>';
                break;
            case'clock':
                body='<div class="clock-display"><div class="clock-time" id="clock_'+w.id+'">--:--:--</div><div class="clock-date" id="clockDate_'+w.id+'"></div></div>';
                setTimeout(function(){D.startClock(w.id)},100);
                break;
            case'calculator':
                var keys=['C','÷','×','−','7','8','9','+','4','5','6','=','1','2','3','.','0','00',''];
                body='<div class="calc-display" id="calcDisplay_'+w.id+'">0</div><div class="calc-grid">'+keys.map(function(k){var acts={'C':'C','÷':'/','×':'*','−':'-'};var v=acts[k]||k;if(k==='C')return'<button class="calc-btn" onclick="DG.calcClear(\''+w.id+'\')" style="color:var(--red-500)">C</button>';if(k==='=')return'<button class="calc-btn equals" onclick="DG.calcResult(\''+w.id+'\')">=</button>';if('÷×−+'.indexOf(k)>=0)return'<button class="calc-btn operator" onclick="DG.calcInput(\''+w.id+'\',\''+v+'\')">'+k+'</button>';if(!k)return'<div></div>';return'<button class="calc-btn" onclick="DG.calcInput(\''+w.id+'\',\''+v+'\')">'+k+'</button>'}).join('')+'</div><input type="hidden" id="calcInput_'+w.id+'" value="">';
                break;
            case'gallery':
                var images=(w.data&&w.data.images)||[];
                if(!images.length)body='<div class="widget-empty"><iconify-icon icon="mdi:image-multiple-outline" width="22" height="22"></iconify-icon><p>No images yet</p><button class="btn btn-primary btn-sm" onclick="DG.openEditPanel(\''+w.id+'\')">Add Images</button></div>';
                else{body='<div class="gallery-scroll" id="galleryScroll_'+w.id+'"><div class="gallery-masonry">'+images.map(function(img){return'<div class="gallery-item"><img src="'+img+'" loading="lazy" onerror="this.parentElement.style.display=\'none\'"></div>'}).join('')+'</div></div>';setTimeout(function(){D.initGalleryScroll(w.id,images.length)},200);}
                break;
            default:body='<p style="color:#999;text-align:center;padding:16px">Widget ready</p>';
        }
        return body;
    };

    D.detectEmbedType = function(url){ try{var h=new URL(url).hostname;if(h.includes('youtube.com')||h.includes('youtu.be'))return'youtube';if(h.includes('vimeo.com'))return'vimeo';if(h.includes('figma.com'))return'figma';if(h.includes('docs.google.com'))return'gdocs';return'website'}catch(e){return'invalid'} };

    D.hideCompletedTasks = async function(id){
        var ref=FB.doc(FB.db,FB.COL.WIDGETS,id);var snap=await FB.getDoc(ref);
        if(snap.exists()){var w=snap.data();var tasks=(w.data&&w.data.tasks)||[];tasks=tasks.filter(function(t){return!t.done});await FB.setDoc(ref,{data:Object.assign({},w.data,{tasks:tasks}),updatedAt:FB.serverTimestamp()},{merge:true});D.showToast('Completed tasks hidden','success')}
    };

    // ===== GALLERY AUTO-SCROLL =====
    D.initGalleryScroll = function(widgetId, count){
        if(count<=4)return;
        var container=document.getElementById('galleryScroll_'+widgetId); if(!container)return;
        var scroll=0; var speed=0.5;
        function animate(){if(!document.getElementById('galleryScroll_'+widgetId))return;scroll+=speed;if(scroll>=container.scrollHeight/2)scroll=0;container.scrollTop=scroll;requestAnimationFrame(animate)}
        var clone=container.querySelector('.gallery-masonry'); if(clone){var c=clone.cloneNode(true);container.appendChild(c)}
        animate();
    };

    // ===== RENDER ALL WIDGETS =====
    D.renderWidgets = function(){
        var grid=D.el('widgetGrid'); var empty=D.el('emptyState'); if(!grid)return;
        var wData=ST.widgetsData||[];
        if(!wData.length){grid.innerHTML='';empty.style.display='flex';return}
        empty.style.display='none';
        grid.innerHTML=wData.map(function(w){
            var body=D.renderWidgetBody(w);
            var sizeClass=w.size?' size-'+w.size:' size-medium';
            return'<div class="widget'+sizeClass+'" data-id="'+w.id+'"><div class="widget-header"><span class="widget-title" onclick="DG.openEditPanel(\''+w.id+'\')" title="Click to edit">'+(w.title||'Untitled')+'</span><div class="widget-hover-actions"><button class="widget-action-btn" title="Edit" onclick="DG.openEditPanel(\''+w.id+'\')"><iconify-icon icon="mdi:pencil-outline" width="14" height="14"></iconify-icon></button><button class="widget-menu-btn" title="Menu" onclick="DG.openContextMenu(\''+w.id+'\',event)"><iconify-icon icon="mdi:dots-horizontal" width="16" height="16"></iconify-icon></button></div></div><div class="widget-body">'+body+'</div></div>';
        }).join('');
        D.initDragDrop();
    };

    // ===== DRAG & DROP =====
    D.initDragDrop = function(){
        var grid=D.el('widgetGrid'); if(!grid||grid._sortable)return;
        if(typeof Sortable !== 'undefined'){
            var sortable=new Sortable(grid,{animation:200,easing:'cubic-bezier(0.4,0,0.2,1)',ghostClass:'sortable-ghost',chosenClass:'sortable-chosen',handle:'.widget-header',onEnd:function(){D.showToast('Widget moved','success')}});
            grid._sortable=sortable;
        }
    };

    // ===== INIT =====
    D.initApp = function(user){
        var name=(user.displayName||(user.email?user.email.split('@')[0]:'user'));
        var ai=D.el('avatarInitial'), pi=D.el('profileInitial'), ud=D.el('usernameDisplay');
        if(ai)ai.textContent=name[0].toUpperCase(); if(pi)pi.textContent=name[0].toUpperCase();
        if(ud)ud.textContent='@'+name.toLowerCase().replace(/\s/g,'_');

        var bgGrid=D.el('bgImageGrid'); if(bgGrid)bgGrid.innerHTML=FB.DEFAULT_BGS.map(function(url){return'<div class="image-option" style="background-image:url(\''+url+'\')" onclick="DG.setBg(\''+url+'\')" data-bg="'+url+'"></div>'}).join('');

        var wGrid=D.el('widgetTypeGrid'); if(wGrid){
            var types=[{id:'bookmarks',icon:'mdi:bookmark-multiple-outline',name:'Bookmarks'},{id:'rss',icon:'mdi:rss',name:'RSS News'},{id:'notes',icon:'mdi:note-text-outline',name:'Notes'},{id:'tasks',icon:'mdi:checkbox-marked-outline',name:'Tasks'},{id:'embed',icon:'mdi:code-tags',name:'Embed'},{id:'project',icon:'mdi:folder-outline',name:'Project'},{id:'clock',icon:'mdi:clock-outline',name:'Clock'},{id:'gallery',icon:'mdi:image-multiple-outline',name:'Gallery'},{id:'calculator',icon:'mdi:calculator',name:'Calculator'}];
            wGrid.innerHTML=types.map(function(t){return'<button class="widget-type-btn" onclick="DG.addWidget(\''+t.id+'\')"><iconify-icon icon="'+t.icon+'"></iconify-icon>'+t.name+'</button>'}).join('');
        }

        D.loadSettings(user.uid); D.loadWidgets(user.uid); D.loadPages(user.uid);
    };

    D.loadSettings = async function(uid){
        try{var snap=await FB.getDoc(FB.doc(FB.db,FB.COL.SETTINGS,uid));if(snap.exists()){var d=snap.data();if(d.bg){ST.currentBg=d.bg;D.updateBgDisplay(d.bg)}if(d.cols){ST.colCount=d.cols;D.updateColDisplay(d.cols)}if(d.opacity!=null){ST.widgetOpacity=d.opacity;D.updateOpacityUI(d.opacity)}if(d.pageTitle){ST.currentPageTitle=d.pageTitle;var pt=D.el('pageTitleDisplay');if(pt)pt.textContent=d.pageTitle;var pi=D.el('pageTitle');if(pi)pi.value=d.pageTitle}if(d.profileImg)D.updateProfileImages(d.profileImg)}}catch(e){}
    };

    D.loadWidgets = function(uid){
        var q=FB.collection(FB.db,FB.COL.WIDGETS);
        FB.onSnapshot(q,function(snap){ST.widgetsData=[];snap.forEach(function(doc){if(doc.data().userId===uid)ST.widgetsData.push({id:doc.id,title:doc.data().title,type:doc.data().type,size:doc.data().size,data:doc.data().data,projectWidgets:doc.data().projectWidgets})});D.renderWidgets()});
    };

    D.loadPages = function(uid){
        var q=FB.query(FB.collection(FB.db,FB.COL.PAGES),FB.where('userId','==',uid));
        FB.onSnapshot(q,function(snap){var pages=[];snap.forEach(function(doc){pages.push({id:doc.id,title:doc.data().title})});D.renderPagesList(pages)});
    };

    // ===== SIGN OUT =====
    D.handleSignOut = async function(){
        var mod=await import("https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js");
        await mod.signOut(FB.auth); window.location.href='sign.html';
    };

    // ===== GLOBAL CLICK =====
    document.addEventListener('click',function(e){
        if(!e.target.closest('.widget-menu-btn')&&!e.target.closest('#widgetContextMenu'))D.closeContextMenu();
        if(!e.target.closest('.dropdown')){var am=D.el('avatarMenu');if(am)am.classList.remove('show')}
        if(e.target.classList.contains('modal-overlay'))e.target.classList.remove('show');
    });
    document.addEventListener('keydown',function(e){if(e.key==='Escape'){D.closeContextMenu();D.closeEditPanel();var am=D.el('avatarMenu');if(am)am.classList.remove('show');D.qsa('.modal-overlay.show').forEach(function(m){m.classList.remove('show')});D.closePagesSidebar()}});

    console.log('%c🚀 DockGrid App %cReady %cby PIReactive','font-size:16px;font-weight:900;color:#ff6b35;font-family:monospace;','font-size:12px;color:#888;','font-size:11px;color:#555;');
})();
