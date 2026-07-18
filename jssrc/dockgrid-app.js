// ===== DOCKGRID APP - Waits for DG namespace =====
(function initDG(){
    if(!window.DG || !window.DG.FB){ setTimeout(initDG, 50); return; }
    
    var D=window.DG, FB=D.FB, ST=D.STATE;
    
    // ===== UTILITY =====
    D.el=function(id){return document.getElementById(id)};
    D.qs=function(s,p){return(p||document).querySelector(s)};
    D.qsa=function(s,p){return(p||document).querySelectorAll(s)};
    D.showToast=function(m,t){t=t||'info';var c=D.el('toastContainer')||(function(){var x=document.createElement('div');x.id='toastContainer';x.className='toast-container';document.body.appendChild(x);return x})();var z=document.createElement('div');z.className='toast '+t;z.textContent=m;c.appendChild(z);setTimeout(function(){z.style.opacity='0';z.style.transform='translateX(60px)';z.style.transition='all 200ms';setTimeout(function(){z.remove()},200)},2800)};
    D.searchGoogle=function(q){if(!q.trim())return;window.open('https://www.google.com/search?q='+encodeURIComponent(q),'_blank')};
    D.showLoading=function(){var b=D.el('loadingBar');if(b){b.classList.add('active');b.classList.remove('done')}};
    D.hideLoading=function(){var b=D.el('loadingBar');if(b){b.classList.remove('active');b.classList.add('done');setTimeout(function(){b.classList.remove('done')},400)}};
    D.toggleDropdown=function(id){var m=D.el(id);if(m)m.classList.toggle('show')};
    D.openModal=function(id){var m=D.el(id);if(m)m.classList.add('show');var a=D.el('avatarMenu');if(a)a.classList.remove('show')};
    D.closeModal=function(id){var m=D.el(id);if(m)m.classList.remove('show')};
    D.openAddWidgetModal=function(){D.openModal('addWidgetModal')};
    D.openProfileModal=function(){D.openModal('profileModal')};
    D.openBackgroundModal=function(){D.openModal('pageSettingsModal');setTimeout(function(){var t=D.qs('[data-tab="tab-background"]');if(t)D.switchSettingsTab('tab-background',t)},100)};
    D.openPageSettingsModal=function(){D.openModal('pageSettingsModal');D.renderPageSettings()};

    // ===== PAGE TITLE =====
    D.savePageTitle=function(t){t=(t||'').trim()||'DockGrid Page';ST.currentPageTitle=t;var d=D.el('pageTitleDisplay');if(d)d.textContent=t;D.saveSetting('pageTitle',t)};

    // ===== PAGE SETTINGS (ADVANCED) =====
    D.renderPageSettings = function(){
        var tabs = [
            {id:'tab-general',label:'📄 General'},
            {id:'tab-background',label:'🖼 Background'},
            {id:'tab-layout',label:'📐 Layout'},
            {id:'tab-preferences',label:'🔍 Preferences'},
            {id:'tab-overview',label:'📊 Overview'},
            {id:'tab-analytics',label:'📈 Analytics'}
        ];
        var tabsEl = D.el('settingsTabs');
        var contentEl = D.el('settingsTabContent');
        if(!tabsEl||!contentEl)return;
        tabsEl.innerHTML = tabs.map(function(t,i){return '<button class="modal-tab'+(i===0?' active':'')+'" data-tab="'+t.id+'" onclick="DG.switchSettingsTab(\''+t.id+'\',this)">'+t.label+'</button>'}).join('');
        contentEl.innerHTML = [
            D._renderGeneralTab(),
            D._renderBackgroundTab(),
            D._renderLayoutTab(),
            D._renderPreferencesTab(),
            D._renderOverviewTab(),
            D._renderAnalyticsTab()
        ].join('');
        // Show first tab
        var first = D.el('tab-general'); if(first) first.classList.add('active');
    };

    D._renderGeneralTab = function(){
        return '<div class="tab-content active" id="tab-general">'+
            '<div class="form-group"><label class="form-label form-label-row">Page Title <small id="titleCount">0/50</small></label><input type="text" class="form-input" id="pageTitle" placeholder="Enter title" maxlength="50" oninput="document.getElementById(\'titleCount\').textContent=this.value.length+\'/50\'" value="'+ (ST.currentPageTitle||'') +'"></div>'+
            '<div class="form-group"><label class="form-label">Description <small>(max 250 chars)</small></label><textarea class="form-input form-textarea" id="pageDescription" placeholder="Describe this page..." maxlength="250">'+(ST.settings.description||'')+'</textarea></div>'+
            '<div class="form-toggle"><span class="form-toggle-label">Auto Generate Description</span><label class="form-toggle-switch"><input type="checkbox" id="autoDesc"><span class="form-toggle-slider"></span></label></div>'+
            '<div class="form-group"><label class="form-label">Page Category</label><select class="form-select" id="pageCategory"><option>Personal</option><option>Work</option><option>School</option><option>Projects</option><option>Custom Folder</option></select></div>'+
            '<div class="form-group"><label class="form-label">Page Icon</label><input type="text" class="form-input" id="pageIcon" placeholder="📄 (emoji)" value="📄"></div>'+
            '<div class="form-row"><div class="form-group"><label class="form-label">Page Color</label><input type="color" class="form-color" id="pageColor" value="#ff6b35" style="width:100%;height:36px"></div><div class="form-group"><label class="form-label">Visibility</label><select class="form-select" id="pageVisibility"><option>Private</option><option>Public</option><option>Password Protected</option><option>Unlisted</option></select></div></div>'+
            '<div class="form-toggle"><span class="form-toggle-label">Hide Page (archive without deleting)</span><label class="form-toggle-switch"><input type="checkbox" id="hidePage"><span class="form-toggle-slider"></span></label></div>'+
            '<div class="form-section-divider"></div>'+
            '<div style="display:flex;gap:8px"><button class="btn btn-dark btn-sm" style="flex:1;justify-content:center" onclick="DG.duplicatePage()">📋 Duplicate Page</button><button class="btn btn-dark btn-sm" style="flex:1;justify-content:center;color:#f87171" onclick="DG.deletePage()">🗑 Delete Page</button></div>'+
            '</div>';
    };

    D._renderBackgroundTab = function(){
        return '<div class="tab-content" id="tab-background">'+
            '<div class="form-group"><label class="form-label">Background Type</label><select class="form-select" id="bgType"><option>Image</option><option>Solid Color</option><option>Gradient</option><option>Dynamic Wallpaper</option></select></div>'+
            '<div class="form-group"><label class="form-label">Select Image</label><div class="image-grid" id="bgImageGrid"></div></div>'+
            '<div class="form-group"><label class="form-label">Upload Image</label><input type="file" class="form-input" id="bgUpload" accept="image/*" onchange="DG.uploadBg(event)" style="padding:7px"></div>'+
            '<div class="form-row"><div class="form-group"><label class="form-label">Background Color</label><input type="color" class="form-color" id="bgColor" value="#f5f5f5" style="width:100%;height:36px"></div><div class="form-group"><label class="form-label">Overlay Color</label><input type="color" class="form-color" id="bgOverlayColor" value="#000000" style="width:100%;height:36px"></div></div>'+
            '<div class="form-group"><label class="form-label">Background Position</label><select class="form-select" id="bgPosition"><option>Cover</option><option>Center</option><option>Contain</option><option>Repeat</option></select></div>'+
            '<div class="form-group"><label class="form-label">Background Blur: <span id="blurLabel">0px</span></label><input type="range" class="form-range" min="0" max="50" value="0" id="bgBlur" oninput="document.getElementById(\'blurLabel\').textContent=this.value+\'px\'"></div>'+
            '<div class="form-group"><label class="form-label">Background Brightness: <span id="brightLabel">100%</span></label><input type="range" class="form-range" min="20" max="200" value="100" id="bgBrightness" oninput="document.getElementById(\'brightLabel\').textContent=this.value+\'%\'"></div>'+
            '<div class="form-group"><label class="form-label">Widget Transparency: <span id="opLabel">96%</span></label><input type="range" class="form-range" min="60" max="100" value="96" id="widgetOpacity" oninput="DG.updateOpacity(this.value)"></div>'+
            '<button class="btn btn-dark" style="width:100%;justify-content:center;margin-top:8px" onclick="DG.resetBg()">Reset Background</button>'+
            '</div>';
    };

    D._renderLayoutTab = function(){
        return '<div class="tab-content" id="tab-layout">'+
            '<div class="form-group"><label class="form-label">Grid Columns</label><input type="number" class="form-input" id="gridCols" min="1" max="12" value="'+(ST.colCount||3)+'" onchange="DG.updateCols(this.value)"></div>'+
            '<div class="form-group"><label class="form-label">Widget Gap: <span id="gapLabel">14px</span></label><input type="range" class="form-range" min="0" max="40" value="14" id="widgetGap" oninput="document.getElementById(\'gapLabel\').textContent=this.value+\'px\'"></div>'+
            '<div class="form-group"><label class="form-label">Widget Corner Radius: <span id="radiusLabel">8px</span></label><input type="range" class="form-range" min="0" max="30" value="8" id="widgetRadius" oninput="document.getElementById(\'radiusLabel\').textContent=this.value+\'px\'"></div>'+
            '<div class="form-group"><label class="form-label">Default Widget Width</label><select class="form-select" id="defaultWidgetWidth"><option>Small</option><option selected>Medium</option><option>Large</option><option>Extra Large</option></select></div>'+
            '<div class="form-toggle"><span class="form-toggle-label">Auto Arrange Widgets</span><label class="form-toggle-switch"><input type="checkbox" id="autoArrange"><span class="form-toggle-slider"></span></label></div>'+
            '<div class="form-toggle"><span class="form-toggle-label">Snap to Grid</span><label class="form-toggle-switch"><input type="checkbox" id="snapGrid" checked><span class="form-toggle-slider"></span></label></div>'+
            '<div class="form-toggle"><span class="form-toggle-label">Lock Layout</span><label class="form-toggle-switch"><input type="checkbox" id="lockLayout"><span class="form-toggle-slider"></span></label></div>'+
            '<div class="form-toggle"><span class="form-toggle-label">Compact Mode</span><label class="form-toggle-switch"><input type="checkbox" id="compactMode"><span class="form-toggle-slider"></span></label></div>'+
            '<button class="btn btn-dark" style="width:100%;justify-content:center;margin-top:8px" onclick="DG.resetLayout()">Reset Layout</button>'+
            '</div>';
    };

    D._renderPreferencesTab = function(){
        return '<div class="tab-content" id="tab-preferences">'+
            '<div class="form-toggle"><span class="form-toggle-label">Show Search Bar</span><label class="form-toggle-switch"><input type="checkbox" id="showSearch" checked><span class="form-toggle-slider"></span></label></div>'+
            '<div class="form-group"><label class="form-label">Search Placeholder</label><input type="text" class="form-input" id="searchPlaceholder" value="Search Google or type a URL..."></div>'+
            '<div class="form-group"><label class="form-label">Default Search Engine</label><select class="form-select" id="searchEngine"><option>Google</option><option>DuckDuckGo</option><option>Bing</option><option>Brave</option></select></div>'+
            '<div class="form-group"><label class="form-label">Open Links</label><select class="form-select" id="linkTarget"><option value="_blank">New Tab</option><option value="_self">Same Tab</option></select></div>'+
            '<div class="form-toggle"><span class="form-toggle-label">Show Widget Headers</span><label class="form-toggle-switch"><input type="checkbox" id="showHeaders" checked><span class="form-toggle-slider"></span></label></div>'+
            '<div class="form-toggle"><span class="form-toggle-label">Enable Widget Animations</span><label class="form-toggle-switch"><input type="checkbox" id="enableAnim" checked><span class="form-toggle-slider"></span></label></div>'+
            '<div class="form-toggle"><span class="form-toggle-label">Auto Refresh Widgets</span><label class="form-toggle-switch"><input type="checkbox" id="autoRefresh"><span class="form-toggle-slider"></span></label></div>'+
            '<div class="form-group"><label class="form-label">Refresh Interval</label><select class="form-select" id="refreshInterval"><option>5 Minutes</option><option selected>15 Minutes</option><option>30 Minutes</option><option>60 Minutes</option></select></div>'+
            '<div class="form-toggle"><span class="form-toggle-label">Confirm Before Deleting Widgets</span><label class="form-toggle-switch"><input type="checkbox" id="confirmDelete" checked><span class="form-toggle-slider"></span></label></div>'+
            '<div class="form-group"><label class="form-label">Page Zoom: <span id="zoomLabel">100%</span></label><input type="range" class="form-range" min="50" max="150" value="100" id="pageZoom" oninput="document.getElementById(\'zoomLabel\').textContent=this.value+\'%\'"></div>'+
            '</div>';
    };

    D._renderOverviewTab = function(){
        var s = ST.pageStats || {};
        return '<div class="tab-content" id="tab-overview">'+
            '<p style="color:var(--white-a50);font-size:10px;margin-bottom:12px">View information about your dashboard. <em>Read-only — updates automatically.</em></p>'+
            '<div class="stats-grid">'+
            '<div class="stat-card"><div class="stat-card-value">'+(s.totalWidgets||0)+'</div><div class="stat-card-label">Total Widgets</div></div>'+
            '<div class="stat-card"><div class="stat-card-value">'+(s.totalBookmarks||0)+'</div><div class="stat-card-label">Bookmarks</div></div>'+
            '<div class="stat-card"><div class="stat-card-value">'+(s.totalTasks||0)+'</div><div class="stat-card-label">Tasks</div></div>'+
            '<div class="stat-card"><div class="stat-card-value">'+(s.completedTasks||0)+'</div><div class="stat-card-label">Completed</div></div>'+
            '<div class="stat-card"><div class="stat-card-value">'+(s.totalNotes||0)+'</div><div class="stat-card-label">Notes</div></div>'+
            '<div class="stat-card"><div class="stat-card-value">'+(s.totalFeeds||0)+'</div><div class="stat-card-label">RSS Feeds</div></div>'+
            '<div class="stat-card"><div class="stat-card-value">'+(s.totalProjects||0)+'</div><div class="stat-card-label">Projects</div></div>'+
            '<div class="stat-card"><div class="stat-card-value">'+(s.totalImages||0)+'</div><div class="stat-card-label">Images</div></div>'+
            '</div>'+
            '<div class="form-section-divider"></div>'+
            '<div style="font-size:10px;color:var(--white-a50);display:flex;flex-direction:column;gap:4px">'+
            '<div style="display:flex;justify-content:space-between"><span>Last Modified:</span><span>'+(s.lastModified||'Just now')+'</span></div>'+
            '<div style="display:flex;justify-content:space-between"><span>Created On:</span><span>'+(s.createdOn||'Today')+'</span></div>'+
            '<div style="display:flex;justify-content:space-between"><span>Storage Used:</span><span>'+(s.storage||'< 1 MB')+'</span></div>'+
            '</div></div>';
    };

    D._renderAnalyticsTab = function(){
        return '<div class="tab-content" id="tab-analytics">'+
            '<p style="color:var(--white-a50);font-size:10px;margin-bottom:12px">Monitor how this page is being used.</p>'+
            '<div style="text-align:center;padding:30px;color:var(--white-a50)"><iconify-icon icon="mdi:chart-bar" width="40" height="40" style="opacity:0.3"></iconify-icon><p style="margin-top:8px;font-size:11px">Analytics are disabled.</p><p style="font-size:10px;margin-top:4px">Enable analytics to collect anonymous usage statistics for this page.</p></div>'+
            '</div>';
    };

    D.switchSettingsTab = function(tabId, btn){
        D.qsa('.modal-tab').forEach(function(t){t.classList.remove('active')});
        D.qsa('.tab-content').forEach(function(t){t.classList.remove('active')});
        if(btn)btn.classList.add('active');
        var tab = D.el(tabId); if(tab)tab.classList.add('active');
    };

    D.duplicatePage = function(){ D.showToast('Page duplicated!','success'); };
    D.deletePage = function(){ if(confirm('Permanently delete this page?')){ D.showToast('Page deleted','success'); } };
    D.resetLayout = function(){ D.showToast('Layout reset','success'); };

    // ===== PAGES SIDEBAR =====
    D.openPagesSidebar=function(){var s=D.el('pagesSidebar'),o=D.el('pagesOverlay'),a=D.el('avatarMenu');if(s)s.classList.add('open');if(o)o.classList.add('show');if(a)a.classList.remove('show')};
    D.closePagesSidebar=function(){var s=D.el('pagesSidebar'),o=D.el('pagesOverlay');if(s)s.classList.remove('open');if(o)o.classList.remove('show')};
    D.createNewPage=async function(){if(!ST.currentUser)return;var q=FB.query(FB.collection(FB.db,FB.COL.PAGES),FB.where('userId','==',ST.currentUser.uid));var snap=await FB.getDocs(q);if(snap.size>=3){D.showToast('Maximum 3 pages allowed','error');return}var pid='page_'+Date.now();await FB.setDoc(FB.doc(FB.db,FB.COL.PAGES,pid),{id:pid,userId:ST.currentUser.uid,title:'New Page',icon:'📄',order:snap.size,isPublic:false,createdAt:FB.serverTimestamp(),updatedAt:FB.serverTimestamp()});D.showToast('Page created!','success')};
    D.switchPage=function(id){ST.currentPageId=id;D.closePagesSidebar();D.showToast('Switched page','success')};
    D.renderPagesList=function(pages){var l=D.el('pagesList');if(!l)return;var cid=ST.currentPageId;if(!pages.length){l.innerHTML='<div class="pages-empty">No pages yet</div>'}else{l.innerHTML=pages.map(function(p){var a=p.id===cid?' active':'';var lb=p.id===cid?' (current)':'';return'<div class="page-item'+a+'" onclick="DG.switchPage(\''+p.id+'\')"><iconify-icon icon="mdi:file-document-outline" width="15" height="15"></iconify-icon>'+ (p.title||'Untitled')+lb+'</div>'}).join('')}var lim=D.el('pageLimit');if(lim)lim.textContent=pages.length+'/3 pages used';var btn=D.el('newPageBtn');if(btn){btn.disabled=pages.length>=3;btn.style.opacity=pages.length>=3?'0.5':'1';btn.style.cursor=pages.length>=3?'not-allowed':'pointer'}};

    // ===== BACKGROUND =====
    D.setBg=function(url){ST.currentBg=url;D.updateBgDisplay(url);D.saveSetting('bg',url)};
    D.updateBgDisplay=function(url){var l=D.el('bgLayer');if(l)l.style.backgroundImage='url('+url+')';D.qsa('.image-option').forEach(function(e){e.classList.remove('selected');if(e.dataset.bg===url)e.classList.add('selected')})};
    D.resetBg=function(){D.setBg(FB.DEFAULT_BGS[0]);D.showToast('Background reset','success')};
    D.uploadBg=async function(e){var f=e.target.files[0];if(!f)return;D.showLoading();D.showToast('Uploading...');var fd=new FormData();fd.append('image',f);try{var r=await fetch('https://api.imgbb.com/1/upload?key='+FB.IMGBB_KEY,{method:'POST',body:fd});var d=await r.json();if(d.success){D.setBg(d.data.url);D.showToast('Background updated!','success')}}catch(ex){D.showToast('Upload failed','error')}D.hideLoading()};
    D.uploadProfile=async function(e){var f=e.target.files[0];if(!f)return;D.showLoading();D.showToast('Uploading...');var fd=new FormData();fd.append('image',f);try{var r=await fetch('https://api.imgbb.com/1/upload?key='+FB.IMGBB_KEY,{method:'POST',body:fd});var d=await r.json();if(d.success){D.updateProfileImages(d.data.url);D.saveSetting('profileImg',d.data.url);D.closeModal('profileModal');D.showToast('Profile updated!','success')}}catch(ex){D.showToast('Upload failed','error')}D.hideLoading()};
    D.updateProfileImages=function(url){var a=D.el('avatarBtn'),p=D.el('profileAvatar');if(a)a.innerHTML='<img src="'+url+'" alt="P">';if(p)p.innerHTML='<img src="'+url+'" alt="P" style="width:100%;height:100%;object-fit:cover;border-radius:50%">'};

    // ===== SETTINGS =====
    D.saveSetting=async function(k,v){if(!ST.currentUser)return;await FB.setDoc(FB.doc(FB.db,FB.COL.SETTINGS,ST.currentUser.uid),{[k]:v},{merge:true})};
    D.updateOpacity=function(v){ST.widgetOpacity=parseInt(v);var o=D.el('opLabel');if(o)o.textContent=v+'%';D.updateOpacityUI(v);D.saveSetting('opacity',parseInt(v))};
    D.updateOpacityUI=function(v){var o=v/100;D.qsa('.widget').forEach(function(w){w.style.background='rgba(255,255,255,'+o+')';var h=w.querySelector('.widget-header');if(h)h.style.background='rgba(250,250,250,'+o+')'})};
    D.updateCols=function(v){ST.colCount=parseInt(v);D.updateColDisplay(v);D.saveSetting('cols',parseInt(v))};
    D.updateColDisplay=function(v){var g=D.el('widgetGrid');if(!g)return;g.className='widget-grid';if(v>=1&&v<=4)g.classList.add('cols-'+v);var s=D.el('columnCountSelect');if(s)s.value=v;var n=D.el('gridCols');if(n)n.value=v};

    // ===== WIDGETS =====
    D.addWidget=async function(type){var names={bookmarks:'Bookmarks',rss:'RSS News',notes:'Notes',tasks:'Tasks',embed:'Embed',project:'Project',clock:'Clock',gallery:'Gallery',calculator:'Calculator'};var sizes={bookmarks:'medium',rss:'medium',notes:'small',tasks:'medium',embed:'large',project:'large',clock:'small',gallery:'large',calculator:'small'};var id=type+'_'+Date.now();D.showLoading();await FB.setDoc(FB.doc(FB.db,FB.COL.WIDGETS,id),{id:id,type:type,title:names[type]||'Widget',size:sizes[type]||'medium',userId:ST.currentUser.uid,pageId:ST.currentPageId||'default',data:{bookmarks:[],tasks:[],content:'',items:[],images:[],projectWidgets:[]},createdAt:FB.serverTimestamp(),updatedAt:FB.serverTimestamp()});D.closeModal('addWidgetModal');D.showToast('Added '+(names[type]||'Widget'),'success');D.hideLoading()};
    D.removeWidget=async function(id){if(!confirm('Remove this widget?'))return;await FB.deleteDoc(FB.doc(FB.db,FB.COL.WIDGETS,id));D.closeContextMenu();D.showToast('Widget removed','success')};
    D.changeWidgetSize=async function(id,size){await FB.setDoc(FB.doc(FB.db,FB.COL.WIDGETS,id),{size:size},{merge:true});D.closeContextMenu();D.showToast('Size updated','success')};

    // ===== CONTEXT MENU =====
    D.openContextMenu=function(wid,e){e.stopPropagation();e.preventDefault();var m=D.el('widgetContextMenu');if(!m)return;var w=ST.widgetsData.find(function(x){return x.id===wid});if(!w)return;var items=D._getMenuItems(w);m.innerHTML=items.map(function(x){if(x.label==='divider')return'<div class="dropdown-divider"></div>';return'<button class="dropdown-item'+(x.danger?' danger':'')+'" onclick="DG.closeContextMenu();'+x.action+'"><iconify-icon icon="'+x.icon+'" width="14" height="14"></iconify-icon>'+x.label+'</button>'}).join('');var x=e.clientX,y=e.clientY;if(x+200>window.innerWidth)x=window.innerWidth-210;if(y+300>window.innerHeight)y=window.innerHeight-310;m.style.left=x+'px';m.style.top=y+'px';m.classList.add('show')};
    D.closeContextMenu=function(){var m=D.el('widgetContextMenu');if(m)m.classList.remove('show')};
    D._getMenuItems=function(w){var id=w.id;var sizes=[{label:'Size: Small',icon:'mdi:resize',action:'DG.changeWidgetSize(\''+id+'\',\'small\')'},{label:'Size: Medium',icon:'mdi:resize',action:'DG.changeWidgetSize(\''+id+'\',\'medium\')'},{label:'Size: Large',icon:'mdi:resize',action:'DG.changeWidgetSize(\''+id+'\',\'large\')'},{label:'Size: Huge',icon:'mdi:resize',action:'DG.changeWidgetSize(\''+id+'\',\'huge\')'}];var common=[{label:'Edit',icon:'mdi:pencil-outline',action:'DG.openEditPanel(\''+id+'\')'},{label:'divider'}].concat(sizes).concat([{label:'divider'},{label:'Delete',icon:'mdi:delete-outline',action:'DG.removeWidget(\''+id+'\')',danger:true}]);var bt={bookmarks:[{label:'Open all',icon:'mdi:open-in-new',action:'DG._openAllBm(\''+id+'\')'},{label:'Add',icon:'mdi:bookmark-plus-outline',action:'DG.openEditPanel(\''+id+'\')'},{label:'divider'}].concat(common),rss:[{label:'Refresh',icon:'mdi:refresh',action:'DG.showToast(\'Refreshing...\')'},{label:'divider'}].concat(common),notes:[{label:'Edit',icon:'mdi:note-edit-outline',action:'DG.openEditPanel(\''+id+'\')'},{label:'divider'}].concat(common),tasks:[{label:'Add task',icon:'mdi:playlist-plus',action:'DG.openEditPanel(\''+id+'\')'},{label:'divider'}].concat(common),embed:[{label:'Edit',icon:'mdi:code-tags',action:'DG.openEditPanel(\''+id+'\')'},{label:'divider'}].concat(common),project:[{label:'Edit',icon:'mdi:folder-edit-outline',action:'DG.openEditPanel(\''+id+'\')'},{label:'divider'}].concat(common),clock:[{label:'Settings',icon:'mdi:cog-outline',action:'DG.openEditPanel(\''+id+'\')'},{label:'divider'}].concat(common),gallery:[{label:'Add images',icon:'mdi:image-plus',action:'DG.openEditPanel(\''+id+'\')'},{label:'divider'}].concat(common),calculator:[{label:'Mode',icon:'mdi:swap-horizontal',action:'DG.openEditPanel(\''+id+'\')'},{label:'divider'}].concat(common)};return bt[w.type]||common};
    D._openAllBm=function(id){var w=ST.widgetsData.find(function(x){return x.id===id});if(w&&w.data&&w.data.bookmarks){w.data.bookmarks.forEach(function(b){window.open(b.url,'_blank')});D.showToast('Opened '+w.data.bookmarks.length+' links','success')}D.closeContextMenu()};

    // ===== EDIT PANEL =====
    D.openEditPanel=function(wid){var w=ST.widgetsData.find(function(x){return x.id===wid});if(!w)return;ST.editingWidgetId=wid;var t=D.el('editPanelTitle');if(t)t.textContent='Edit '+(w.title||'Widget');var b=D.el('editPanelBody');if(!b)return;switch(w.type){case'bookmarks':b.innerHTML='<div class="form-group"><label class="form-label">Add Bookmark URL</label><input type="url" class="form-input" id="editBmUrl" placeholder="https://example.com"></div><button class="btn btn-primary btn-sm" style="width:100%;margin-bottom:12px" onclick="DG._addBmFromPanel()">Add Bookmark</button><div class="edit-list" id="editBmList"></div>';D._renderEditBm(w);break;case'notes':b.innerHTML='<div class="form-group"><label class="form-label">Note Content</label><textarea class="form-input form-textarea" id="editNoteContent" style="min-height:200px;background:#fff9c4;color:#333;font-size:13px">'+((w.data&&w.data.content)||'')+'</textarea></div>';break;case'tasks':b.innerHTML='<div class="form-group"><label class="form-label">New Task</label><input type="text" class="form-input" id="editTaskInput" placeholder="Task description"><button class="btn btn-primary btn-sm" style="width:100%;margin-top:6px" onclick="DG._addTaskFromPanel()">Add Task</button></div><div class="edit-list" id="editTaskList"></div>';D._renderEditTasks(w);break;case'embed':b.innerHTML='<div class="form-group"><label class="form-label">Embed URL</label><input type="url" class="form-input" id="editEmbedUrl" placeholder="YouTube, Figma, Docs URL"></div>';break;case'rss':b.innerHTML='<div class="form-group"><label class="form-label">RSS Feed URL</label><input type="url" class="form-input" id="editRssUrl" placeholder="https://feeds.example.com/rss"></div>';break;case'project':b.innerHTML='<div class="form-group"><label class="form-label">Project Name</label><input type="text" class="form-input" id="editProjectName" placeholder="My Project"><label class="form-label" style="margin-top:10px">Description</label><textarea class="form-input form-textarea" id="editProjectDesc" placeholder="Project description"></textarea><label class="form-label" style="margin-top:10px">GitHub URL</label><input type="url" class="form-input" id="editProjectUrl" placeholder="https://github.com/user/repo"><label class="form-label" style="margin-top:10px">Website</label><input type="url" class="form-input" id="editProjectWebsite" placeholder="https://example.com"><label class="form-label" style="margin-top:10px">Add Sub-Resources</label><div class="widget-type-grid" style="grid-template-columns:repeat(2,1fr)">'+[{t:'bookmarks',i:'mdi:bookmark-multiple-outline',n:'Bookmarks'},{t:'rss',i:'mdi:rss',n:'RSS Feed'},{t:'gallery',i:'mdi:image-multiple-outline',n:'Gallery'},{t:'notes',i:'mdi:note-text-outline',n:'Note'},{t:'tasks',i:'mdi:checkbox-marked-outline',n:'Tasks'},{t:'embed',i:'mdi:code-tags',n:'Embed'}].map(function(s){return'<button class="widget-type-btn" onclick="DG._addProjectSub(\''+wid+'\',\''+s.t+'\')"><iconify-icon icon="'+s.i+'"></iconify-icon>'+s.n+'</button>'}).join('')+'</div>';break;case'clock':b.innerHTML='<div class="form-group"><label class="form-label">Time Format</label><select class="form-select" id="editClockFmt"><option>12-hour</option><option>24-hour</option></select></div>';break;case'gallery':b.innerHTML='<div class="form-group"><label class="form-label">Upload Images</label><input type="file" class="form-input" accept="image/*" multiple id="editGalleryUpload" onchange="DG._uploadGallery(event)"></div><div id="editGalleryPreview" class="gallery-masonry"></div>';break;case'calculator':b.innerHTML='<div class="form-group"><label class="form-label">Mode</label><select class="form-select" id="editCalcMode"><option>Basic</option><option>Scientific</option></select></div>';break}var p=D.el('editPanel'),o=D.el('editPanelOverlay');if(p)p.classList.add('open');if(o)o.classList.add('show');D.closeContextMenu()};
    D.closeEditPanel=function(){var p=D.el('editPanel'),o=D.el('editPanelOverlay');if(p)p.classList.remove('open');if(o)o.classList.remove('show');ST.editingWidgetId=null};
    D.saveEditPanel=async function(){var wid=ST.editingWidgetId;if(!wid)return;var w=ST.widgetsData.find(function(x){return x.id===wid});if(!w)return;switch(w.type){case'notes':var c=D.el('editNoteContent');if(c)await FB.setDoc(FB.doc(FB.db,FB.COL.WIDGETS,wid),{data:{content:c.value},updatedAt:FB.serverTimestamp()},{merge:true});break;case'embed':var u=D.el('editEmbedUrl');if(u&&u.value)await FB.setDoc(FB.doc(FB.db,FB.COL.WIDGETS,wid),{data:{embedUrl:u.value},updatedAt:FB.serverTimestamp()},{merge:true});break;case'rss':var r=D.el('editRssUrl');if(r&&r.value)await FB.setDoc(FB.doc(FB.db,FB.COL.WIDGETS,wid),{data:{rssUrl:r.value},updatedAt:FB.serverTimestamp()},{merge:true});break;case'project':var pn=D.el('editProjectName'),pd=D.el('editProjectDesc'),pu=D.el('editProjectUrl'),pw=D.el('editProjectWebsite');var pd={};if(pn)pd.name=pn.value;if(pd)pd.description=pd.value;if(pu)pd.githubUrl=pu.value;if(pw)pd.website=pw.value;await FB.setDoc(FB.doc(FB.db,FB.COL.WIDGETS,wid),{data:Object.assign({},w.data||{},pd),updatedAt:FB.serverTimestamp()},{merge:true});break}D.closeEditPanel();D.showToast('Saved','success')};
    D._addBmFromPanel=async function(){var u=(D.el('editBmUrl').value||'').trim();if(!u)return;D.el('editBmUrl').value='';var wid=ST.editingWidgetId;try{var hn=new URL(u).hostname;var fv='https://www.google.com/s2/favicons?domain='+hn+'&sz=64';var tl=hn;try{var r=await fetch('https://api.microlink.io/?url='+encodeURIComponent(u));var d=await r.json();if(d.status==='success'&&d.data.title)tl=d.data.title}catch(e){}var ref=FB.doc(FB.db,FB.COL.WIDGETS,wid);var sn=await FB.getDoc(ref);if(sn.exists()){var w=sn.data();var bm=(w.data&&w.data.bookmarks)||[];bm.push({url:u,title:tl,favicon:fv,hostname:hn});await FB.setDoc(ref,{data:Object.assign({},w.data,{bookmarks:bm}),updatedAt:FB.serverTimestamp()},{merge:true});D._renderEditBm({data:{bookmarks:bm}})}}catch(e){D.showToast('Failed','error')}};
    D._renderEditBm=function(w){var l=D.el('editBmList');if(!l)return;var bm=(w.data&&w.data.bookmarks)||[];l.innerHTML=bm.map(function(b,i){return'<div class="edit-item"><img src="'+b.favicon+'" style="width:14px;height:14px"><span>'+b.title+'</span><button class="btn-x" onclick="DG._removeEditBm('+i+')">✕</button></div>'}).join('')};
    D._removeEditBm=async function(i){var ref=FB.doc(FB.db,FB.COL.WIDGETS,ST.editingWidgetId);var sn=await FB.getDoc(ref);if(sn.exists()){var w=sn.data();var bm=(w.data&&w.data.bookmarks)||[];bm.splice(i,1);await FB.setDoc(ref,{data:Object.assign({},w.data,{bookmarks:bm}),updatedAt:FB.serverTimestamp()},{merge:true});D._renderEditBm({data:{bookmarks:bm}})}};
    D._addTaskFromPanel=async function(){var t=D.el('editTaskInput');if(!t||!t.value.trim())return;var tx=t.value.trim();t.value='';var ref=FB.doc(FB.db,FB.COL.WIDGETS,ST.editingWidgetId);var sn=await FB.getDoc(ref);if(sn.exists()){var w=sn.data();var ts=(w.data&&w.data.tasks)||[];ts.push({text:tx,done:false});await FB.setDoc(ref,{data:Object.assign({},w.data,{tasks:ts}),updatedAt:FB.serverTimestamp()},{merge:true});D._renderEditTasks({data:{tasks:ts}})}};
    D._renderEditTasks=function(w){var l=D.el('editTaskList');if(!l)return;var ts=(w.data&&w.data.tasks)||[];l.innerHTML=ts.map(function(t,i){return'<div class="edit-item" onclick="DG._toggleEditTask('+i+')"><iconify-icon icon="'+(t.done?'mdi:checkbox-marked':'mdi:checkbox-blank-outline')+'" width="14" height="14" style="color:'+(t.done?'var(--green-500)':'#888')+'"></iconify-icon><span style="text-decoration:'+(t.done?'line-through':'none')+'">'+t.text+'</span></div>'}).join('')};
    D._toggleEditTask=async function(i){var ref=FB.doc(FB.db,FB.COL.WIDGETS,ST.editingWidgetId);var sn=await FB.getDoc(ref);if(sn.exists()){var w=sn.data();var ts=(w.data&&w.data.tasks)||[];if(ts[i]){ts[i].done=!ts[i].done;await FB.setDoc(ref,{data:Object.assign({},w.data,{tasks:ts}),updatedAt:FB.serverTimestamp()},{merge:true});D._renderEditTasks({data:{tasks:ts}})}}};
    D._uploadGallery=async function(e){var fs=e.target.files;if(!fs.length)return;var wid=ST.editingWidgetId;var ref=FB.doc(FB.db,FB.COL.WIDGETS,wid);var sn=await FB.getDoc(ref);var imgs=(sn.exists()&&sn.data().data&&sn.data().data.images)||[];for(var i=0;i<fs.length;i++){var fd=new FormData();fd.append('image',fs[i]);try{var r=await fetch('https://api.imgbb.com/1/upload?key='+FB.IMGBB_KEY,{method:'POST',body:fd});var d=await r.json();if(d.success)imgs.push(d.data.url)}catch(ex){}}await FB.setDoc(ref,{data:Object.assign({},sn.exists()?sn.data().data:{},{images:imgs}),updatedAt:FB.serverTimestamp()},{merge:true});D.showToast(imgs.length+' images','success')};
    D._addProjectSub=async function(pid,type){var names={bookmarks:'Bookmarks',rss:'RSS Feed',gallery:'Gallery',notes:'Note',tasks:'Tasks',embed:'Embed'};var ref=FB.doc(FB.db,FB.COL.WIDGETS,pid);var sn=await FB.getDoc(ref);if(sn.exists()){var w=sn.data();var subs=(w.data&&w.data.projectWidgets)||[];subs.push({type:type,title:names[type]||'Widget',data:{}});await FB.setDoc(ref,{data:Object.assign({},w.data,{projectWidgets:subs}),updatedAt:FB.serverTimestamp()},{merge:true});D.showToast('Added '+names[type],'success')}};

    // ===== INLINE TASK TOGGLE =====
    D.toggleTaskInline=async function(wid,i){var ref=FB.doc(FB.db,FB.COL.WIDGETS,wid);var sn=await FB.getDoc(ref);if(sn.exists()){var w=sn.data();var ts=(w.data&&w.data.tasks)||[];if(ts[i]){ts[i].done=!ts[i].done;await FB.setDoc(ref,{data:Object.assign({},w.data,{tasks:ts}),updatedAt:FB.serverTimestamp()},{merge:true})}}};
    D.hideCompletedTasks=async function(id){var ref=FB.doc(FB.db,FB.COL.WIDGETS,id);var sn=await FB.getDoc(ref);if(sn.exists()){var w=sn.data();var ts=(w.data&&w.data.tasks)||[];ts=ts.filter(function(t){return!t.done});await FB.setDoc(ref,{data:Object.assign({},w.data,{tasks:ts}),updatedAt:FB.serverTimestamp()},{merge:true});D.showToast('Completed tasks hidden','success')}};

    // ===== CLOCK =====
    D.startClock=function(wid){var u=function(){var el=document.getElementById('clock_'+wid);if(!el)return;var n=new Date();el.textContent=n.toLocaleTimeString();var de=document.getElementById('clockDate_'+wid);if(de)de.textContent=n.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'});var le=document.getElementById('clockLoc_'+wid);if(le)le.textContent=(Intl.DateTimeFormat().resolvedOptions().timeZone||'Local')};u();setInterval(u,1000)};

    // ===== CALCULATOR =====
    D.calcInput=function(wid,k){var i=document.getElementById('calcInput_'+wid);if(i)i.value+=k;var d=document.getElementById('calcDisplay_'+wid);if(d)d.textContent=i?i.value:'0'};
    D.calcResult=function(wid){var i=document.getElementById('calcInput_'+wid);var d=document.getElementById('calcDisplay_'+wid);if(!i)return;try{var r=Function('"use strict";return ('+i.value+')')();i.value=r;if(d)d.textContent=r}catch(e){if(d)d.textContent='Error';i.value=''}};
    D.calcClear=function(wid){var i=document.getElementById('calcInput_'+wid);var d=document.getElementById('calcDisplay_'+wid);if(i)i.value='';if(d)d.textContent='0'};

    // ===== GALLERY SCROLL =====
    D.initGalleryScroll=function(wid,c){if(c<=4)return;var el=document.getElementById('galleryScroll_'+wid);if(!el)return;var s=0,sp=0.4;function anim(){if(!document.getElementById('galleryScroll_'+wid))return;s+=sp;if(s>=el.scrollHeight/2)s=0;el.scrollTop=s;requestAnimationFrame(anim)}var cl=el.querySelector('.gallery-masonry');if(cl){var cp=cl.cloneNode(true);el.appendChild(cp)}anim()};

    // ===== RENDER WIDGET BODY =====
    D.renderWidgetBody=function(w){
        var b='';
        switch(w.type){
            case'bookmarks':var bm=(w.data&&w.data.bookmarks)||[];if(!bm.length)b='<div class="widget-empty"><iconify-icon icon="mdi:bookmark-multiple-outline" width="24" height="24"></iconify-icon><p>No bookmarks yet</p><button class="btn btn-primary btn-sm" onclick="DG.openEditPanel(\''+w.id+'\')">Add</button></div>';else b='<div class="bookmark-grid">'+bm.map(function(x){var n=x.title||x.hostname||'';if(n.length>7)n=n.substring(0,7)+'..';return'<a href="'+x.url+'" target="_blank" class="bookmark-card" rel="noopener" title="'+(x.title||'')+'"><img src="'+x.favicon+'" class="bookmark-card-icon" onerror="this.style.display=\'none\'"><span class="bookmark-card-name">'+n+'</span></a>'}).join('')+'</div>';break;
            case'notes':var c=(w.data&&w.data.content)||'';if(!c)b='<div class="widget-empty"><iconify-icon icon="mdi:note-text-outline" width="24" height="24"></iconify-icon><p>No notes yet</p><button class="btn btn-primary btn-sm" onclick="DG.openEditPanel(\''+w.id+'\')">Write</button></div>';else b='<div class="note-content">'+c+'</div>';break;
            case'tasks':var ts=(w.data&&w.data.tasks)||[];if(!ts.length)b='<div class="widget-empty"><iconify-icon icon="mdi:checkbox-marked-outline" width="24" height="24"></iconify-icon><p>No tasks yet</p><button class="btn btn-primary btn-sm" onclick="DG.openEditPanel(\''+w.id+'\')">Add Tasks</button></div>';else{var dn=ts.filter(function(t){return t.done}).length;var pct=Math.round(dn/ts.length*100);var ad=dn===ts.length;b='<div class="task-progress"><div class="task-progress-bar" style="width:'+pct+'%"></div></div><div class="task-stats"><span>'+dn+'/'+ts.length+' done</span><span>'+pct+'%</span></div>';b+=ts.map(function(t,i){return'<div class="task-item" onclick="DG.toggleTaskInline(\''+w.id+'\','+i+')"><iconify-icon icon="'+(t.done?'mdi:checkbox-marked':'mdi:checkbox-blank-outline')+'" width="15" height="15" style="color:'+(t.done?'var(--green-500)':'#ccc')+';flex-shrink:0"></iconify-icon><span style="text-decoration:'+(t.done?'line-through':'none')+';opacity:'+(t.done?'0.5':'1')+'">'+t.text+'</span></div>'}).join('');if(ad)b+='<div style="text-align:center;margin-top:8px"><button class="btn btn-primary btn-sm" onclick="DG.hideCompletedTasks(\''+w.id+'\')">✨ All done! Hide</button></div>'}break;
            case'embed':var eu=(w.data&&w.data.embedUrl)||'';if(!eu)b='<div class="widget-empty"><iconify-icon icon="mdi:code-tags" width="24" height="24"></iconify-icon><p>No embed yet</p><button class="btn btn-primary btn-sm" onclick="DG.openEditPanel(\''+w.id+'\')">Add</button></div>';else{var et=D._detectEmbed(eu);if(et==='youtube'){var v=eu.match(/(?:v=|\/)([\w-]{11})/);v=v?v[1]:null;if(v)b='<div class="embed-preview"><iframe src="https://www.youtube.com/embed/'+v+'" allowfullscreen></iframe></div>'}else if(et==='vimeo'){var vm=eu.match(/vimeo\.com\/(\d+)/);vm=vm?vm[1]:null;if(vm)b='<div class="embed-preview"><iframe src="https://player.vimeo.com/video/'+vm+'" allowfullscreen></iframe></div>'}else b='<div class="embed-preview"><iframe src="'+eu+'" allowfullscreen></iframe></div>'}break;
            case'rss':b='<div class="widget-empty"><iconify-icon icon="mdi:rss" width="24" height="24"></iconify-icon><p>RSS Feed</p><button class="btn btn-primary btn-sm" onclick="DG.openEditPanel(\''+w.id+'\')">Add Feed</button></div>';break;
            case'project':var pd=w.data||{};b='<div class="project-card">';if(pd.name)b+='<div class="project-name">'+pd.name+'</div>';if(pd.description)b+='<div class="project-desc">'+pd.description+'</div>';b+='<div class="project-meta"><span><iconify-icon icon="mdi:account" width="12" height="12"></iconify-icon> Owner: You</span>';if(pd.githubUrl||pd.website)b+='</div><div class="project-links">'+(pd.website?'<a href="'+pd.website+'" target="_blank">🌐 Website</a>':'')+(pd.githubUrl?'<a href="'+pd.githubUrl+'" target="_blank">📂 GitHub</a>':'')+'</div>';else b+='</div>';var subs=pd.projectWidgets||[];if(subs.length)b+='<div class="project-resources">'+subs.map(function(s){return'<span class="project-resource-tag">'+ (s.title||s.type) +'</span>'}).join('')+'</div>';b+='</div>';if(!pd.name&&!subs.length)b='<div class="widget-empty"><iconify-icon icon="mdi:folder-outline" width="24" height="24"></iconify-icon><p>Setup your project</p><button class="btn btn-primary btn-sm" onclick="DG.openEditPanel(\''+w.id+'\')">Setup</button></div>';break;
            case'clock':b='<div class="clock-display"><div class="clock-time" id="clock_'+w.id+'">--:--:--</div><div class="clock-date" id="clockDate_'+w.id+'"></div><div class="clock-location" id="clockLoc_'+w.id+'">Local Time</div></div>';setTimeout(function(){D.startClock(w.id)},100);break;
            case'calculator':var ks=['C','÷','×','−','7','8','9','+','4','5','6','=','1','2','3','.','0','00',''];b='<div class="calc-display" id="calcDisplay_'+w.id+'">0</div><div class="calc-grid">'+ks.map(function(k){var a={'C':'C','÷':'/','×':'*','−':'-'};var v=a[k]||k;if(k==='C')return'<button class="calc-btn" onclick="DG.calcClear(\''+w.id+'\')" style="color:var(--red-500)">C</button>';if(k==='=')return'<button class="calc-btn equals" onclick="DG.calcResult(\''+w.id+'\')">=</button>';if('÷×−+'.indexOf(k)>=0)return'<button class="calc-btn operator" onclick="DG.calcInput(\''+w.id+'\',\''+v+'\')">'+k+'</button>';if(!k)return'<div></div>';return'<button class="calc-btn" onclick="DG.calcInput(\''+w.id+'\',\''+v+'\')">'+k+'</button>'}).join('')+'</div><input type="hidden" id="calcInput_'+w.id+'" value="">';break;
            case'gallery':var imgs=(w.data&&w.data.images)||[];if(!imgs.length)b='<div class="widget-empty"><iconify-icon icon="mdi:image-multiple-outline" width="24" height="24"></iconify-icon><p>No images yet</p><button class="btn btn-primary btn-sm" onclick="DG.openEditPanel(\''+w.id+'\')">Add Images</button></div>';else{b='<div class="gallery-scroll" id="galleryScroll_'+w.id+'"><div class="gallery-masonry">'+imgs.map(function(x){return'<div class="gallery-item"><img src="'+x+'" loading="lazy" onerror="this.parentElement.style.display=\'none\'"></div>'}).join('')+'</div></div>';setTimeout(function(){D.initGalleryScroll(w.id,imgs.length)},200)}break;
            default:b='<p style="color:#999;text-align:center;padding:16px">Widget ready</p>';
        }return b;
    };
    D._detectEmbed=function(u){try{var h=new URL(u).hostname;if(h.includes('youtube.com')||h.includes('youtu.be'))return'youtube';if(h.includes('vimeo.com'))return'vimeo';return'website'}catch(e){return'invalid'}};

    // ===== RENDER ALL =====
    D.renderWidgets=function(){var g=D.el('widgetGrid'),e=D.el('emptyState');if(!g)return;var wd=ST.widgetsData||[];if(!wd.length){g.innerHTML='';e.style.display='flex';return}e.style.display='none';g.innerHTML=wd.map(function(w){var bd=D.renderWidgetBody(w);var sc=w.size?' size-'+w.size:' size-medium';return'<div class="widget'+sc+'" data-id="'+w.id+'"><div class="widget-header"><span class="widget-title" onclick="DG.openEditPanel(\''+w.id+'\')" title="Click to edit">'+(w.title||'Untitled')+'</span><div class="widget-hover-actions"><button class="widget-action-btn" title="Edit" onclick="DG.openEditPanel(\''+w.id+'\')"><iconify-icon icon="mdi:pencil-outline" width="14" height="14"></iconify-icon></button><button class="widget-menu-btn" title="Menu" onclick="DG.openContextMenu(\''+w.id+'\',event)"><iconify-icon icon="mdi:dots-horizontal" width="16" height="16"></iconify-icon></button></div></div><div class="widget-body">'+bd+'</div></div>'}).join('');D._initSortable()};
    D._initSortable=function(){var g=D.el('widgetGrid');if(!g||g._sorted)return;if(typeof Sortable!=='undefined'){var s=new Sortable(g,{animation:200,easing:'cubic-bezier(0.4,0,0.2,1)',ghostClass:'sortable-ghost',chosenClass:'sortable-chosen',handle:'.widget-header',onEnd:function(){}});g._sorted=s}};

    // ===== INIT =====
    D.initApp=function(user){
        var nm=(user.displayName||(user.email?user.email.split('@')[0]:'user'));
        var ai=D.el('avatarInitial'),pi=D.el('profileInitial'),ud=D.el('usernameDisplay');
        if(ai)ai.textContent=nm[0].toUpperCase();if(pi)pi.textContent=nm[0].toUpperCase();if(ud)ud.textContent='@'+nm.toLowerCase().replace(/\s/g,'_');
        var bgG=D.el('bgImageGrid');if(bgG)bgG.innerHTML=FB.DEFAULT_BGS.map(function(u){return'<div class="image-option" style="background-image:url(\''+u+'\')" onclick="DG.setBg(\''+u+'\')" data-bg="'+u+'"></div>'}).join('');
        var wG=D.el('widgetTypeGrid');if(wG){var ts=[{id:'bookmarks',icon:'mdi:bookmark-multiple-outline',name:'Bookmarks'},{id:'rss',icon:'mdi:rss',name:'RSS News'},{id:'notes',icon:'mdi:note-text-outline',name:'Notes'},{id:'tasks',icon:'mdi:checkbox-marked-outline',name:'Tasks'},{id:'embed',icon:'mdi:code-tags',name:'Embed'},{id:'project',icon:'mdi:folder-outline',name:'Project'},{id:'clock',icon:'mdi:clock-outline',name:'Clock'},{id:'gallery',icon:'mdi:image-multiple-outline',name:'Gallery'},{id:'calculator',icon:'mdi:calculator',name:'Calculator'}];wG.innerHTML=ts.map(function(t){return'<button class="widget-type-btn" onclick="DG.addWidget(\''+t.id+'\')"><iconify-icon icon="'+t.icon+'"></iconify-icon>'+t.name+'</button>'}).join('')}
        D.loadSettings(user.uid);D.loadWidgets(user.uid);D.loadPages(user.uid);
    };
    D.loadSettings=async function(uid){try{var s=await FB.getDoc(FB.doc(FB.db,FB.COL.SETTINGS,uid));if(s.exists()){var d=s.data();if(d.bg){ST.currentBg=d.bg;D.updateBgDisplay(d.bg)}if(d.cols){ST.colCount=d.cols;D.updateColDisplay(d.cols)}if(d.opacity!=null){ST.widgetOpacity=d.opacity;D.updateOpacityUI(d.opacity)}if(d.pageTitle){ST.currentPageTitle=d.pageTitle;var pt=D.el('pageTitleDisplay');if(pt)pt.textContent=d.pageTitle}}if(d.profileImg)D.updateProfileImages(d.profileImg);ST.settings=d}catch(e){}};
    D.loadWidgets=function(uid){var q=FB.collection(FB.db,FB.COL.WIDGETS);FB.onSnapshot(q,function(s){ST.widgetsData=[];var stats={totalWidgets:0,totalBookmarks:0,totalTasks:0,completedTasks:0,totalNotes:0,totalFeeds:0,totalProjects:0,totalImages:0};s.forEach(function(d){if(d.data().userId===uid){var w={id:d.id,title:d.data().title,type:d.data().type,size:d.data().size,data:d.data().data};ST.widgetsData.push(w);stats.totalWidgets++;if(w.type==='bookmarks')stats.totalBookmarks+=(w.data&&w.data.bookmarks?w.data.bookmarks.length:0);if(w.type==='tasks'){var ts=w.data&&w.data.tasks?w.data.tasks:[];stats.totalTasks+=ts.length;stats.completedTasks+=ts.filter(function(t){return t.done}).length}if(w.type==='notes'&&w.data&&w.data.content)stats.totalNotes++;if(w.type==='rss')stats.totalFeeds++;if(w.type==='project')stats.totalProjects++;if(w.type==='gallery')stats.totalImages+=(w.data&&w.data.images?w.data.images.length:0)}});ST.pageStats=stats;D.renderWidgets()})};
    D.loadPages=function(uid){var q=FB.query(FB.collection(FB.db,FB.COL.PAGES),FB.where('userId','==',uid));FB.onSnapshot(q,function(s){var pgs=[];s.forEach(function(d){pgs.push({id:d.id,title:d.data().title})});D.renderPagesList(pgs)})};

    // ===== SIGN OUT =====
    D.handleSignOut=async function(){var m=await import("https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js");await m.signOut(FB.auth);window.location.href='sign.html'};

    // ===== GLOBAL EVENTS =====
    document.addEventListener('click',function(e){if(!e.target.closest('.widget-menu-btn')&&!e.target.closest('#widgetContextMenu'))D.closeContextMenu();if(!e.target.closest('.dropdown')){var a=D.el('avatarMenu');if(a)a.classList.remove('show')}if(e.target.classList.contains('modal-overlay'))e.target.classList.remove('show')});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'){D.closeContextMenu();D.closeEditPanel();var a=D.el('avatarMenu');if(a)a.classList.remove('show');D.qsa('.modal-overlay.show').forEach(function(m){m.classList.remove('show')});D.closePagesSidebar()}});

    console.log('%c🚀 DockGrid App %cReady %cby PIReactive','font-size:16px;font-weight:900;color:#ff6b35;font-family:monospace;','font-size:12px;color:#888;','font-size:11px;color:#555;');
})();
