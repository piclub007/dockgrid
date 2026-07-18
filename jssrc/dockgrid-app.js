// jssrc/dockgrid-app.js
(function init(){
    if(!window.DG || !window.DG.FB){ setTimeout(init,50); return; }
    const D=window.DG, FB=D.FB, ST=D.STATE;

    D.el=id=>document.getElementById(id);
    D.qs=(s,p)=> (p||document).querySelector(s);
    D.showToast=(msg,type='info')=>{ const c=D.el('toastContainer'), t=document.createElement('div'); t.className='toast '+type; t.textContent=msg; c.appendChild(t); setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateX(60px)'; setTimeout(()=>t.remove(),200) },2500) };
    D.searchGoogle=q=>{ if(!q.trim())return; window.open('https://www.google.com/search?q='+encodeURIComponent(q),'_blank') };
    D.toggleDropdown=id=>{ D.el(id).classList.toggle('show') };
    D.openModal=id=>{ D.el(id).classList.add('show'); D.el('avatarMenu').classList.remove('show') };
    D.closeModal=id=>{ D.el(id).classList.remove('show') };
    D.openAddWidgetModal=()=>D.openModal('addWidgetModal');
    D.openProfileModal=()=>D.openModal('profileModal');
    D.openBackgroundModal=()=>{ D.openModal('pageSettingsModal'); setTimeout(()=>D.switchSettingsTab('tab-background', D.qs('[data-tab="tab-background"]')),80) };
    D.openPageSettingsModal=()=>{ D.openModal('pageSettingsModal'); D._renderPageSettings() };

    // Greeting
    const hour = new Date().getHours();
    D.el('greetingMsg').textContent = hour<12?'Good morning':hour<18?'Good afternoon':'Good evening';

    // Lightbox
    D.openLightbox=url=>{ ST.lightboxImg=url; D.el('lightboxImg').src=url; D.el('lightbox').style.display='flex' };
    D.closeLightbox=()=>{ D.el('lightbox').style.display='none' };
    D.downloadImage=()=>{ if(ST.lightboxImg){ const a=document.createElement('a'); a.href=ST.lightboxImg; a.download='image'; a.click() } };

    // Page title
    D.savePageTitle=t=>{ t=t.trim()||'DockGrid Page'; ST.pageTitle=t; D.el('pageTitleDisplay').textContent=t; D._saveSetting('pageTitle',t) };

    // Background
    D.setBg=url=>{ ST.currentBg=url; D.el('bgLayer').style.backgroundImage=`url(${url})`; D._saveSetting('bg',url); D.qsa('.image-option').forEach(e=>e.classList.remove('selected')); const sel=D.qs(`.image-option[data-bg="${url}"]`); if(sel)sel.classList.add('selected') };
    D.resetBg=()=>D.setBg(FB.DEFAULT_BGS[0]);
    D.uploadBg=async e=>{ const f=e.target.files[0]; if(!f)return; const fd=new FormData(); fd.append('image',f); const r=await fetch(`https://api.imgbb.com/1/upload?key=${FB.IMGBB_KEY}`,{method:'POST',body:fd}); const d=await r.json(); if(d.success) D.setBg(d.data.url) };
    D.uploadProfile=async e=>{ const f=e.target.files[0]; if(!f)return; const fd=new FormData(); fd.append('image',f); const r=await fetch(`https://api.imgbb.com/1/upload?key=${FB.IMGBB_KEY}`,{method:'POST',body:fd}); const d=await r.json(); if(d.success){ D._updateProfileImg(d.data.url); D._saveSetting('profileImg',d.data.url); D.closeModal('profileModal') } };
    D._updateProfileImg=url=>{ D.el('avatarBtn').innerHTML=`<img src="${url}">`; D.el('profileAvatar').innerHTML=`<img src="${url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">` };

    D._saveSetting=async(k,v)=>{ if(!ST.currentUser)return; await FB.setDoc(FB.doc(FB.db,FB.COL.SETTINGS,ST.currentUser.uid),{[k]:v},{merge:true}) };

    // Grid
    D.updateCols=v=>{ ST.colCount=+v; D.el('widgetGrid').className=`widget-grid cols-${v}`; D._saveSetting('cols',+v) };

    // Widgets
    D.addWidget=async type=>{
        const names={bookmarks:'Bookmarks',rss:'RSS',notes:'Notes',tasks:'Tasks',embed:'Embed',project:'Project',clock:'Clock',gallery:'Gallery',calculator:'Calculator'};
        const sizes={bookmarks:'medium',rss:'medium',notes:'small',tasks:'medium',embed:'large',project:'large',clock:'small',gallery:'large',calculator:'small'};
        const id=type+'_'+Date.now();
        await FB.setDoc(FB.doc(FB.db,FB.COL.WIDGETS,id),{id,type,title:names[type],size:sizes[type],userId:ST.currentUser.uid,pageId:ST.currentPageId,data:{bookmarks:[],tasks:[],content:'',images:[],projectWidgets:[]},createdAt:FB.serverTimestamp(),updatedAt:FB.serverTimestamp()});
        D.closeModal('addWidgetModal'); D.showToast(`Added ${names[type]}`);
    };

    D.removeWidget=async id=>{ if(!confirm('Delete?'))return; await FB.deleteDoc(FB.doc(FB.db,FB.COL.WIDGETS,id)); D.closeContextMenu(); D.showToast('Deleted') };
    D.changeWidgetSize=async(id,size)=>{ await FB.setDoc(FB.doc(FB.db,FB.COL.WIDGETS,id),{size},{merge:true}); D.closeContextMenu(); D.showToast('Resized') };

    // Context menu
    D.openContextMenu=(wid,e)=>{ e.stopPropagation(); const w=ST.widgetsData.find(x=>x.id===wid); if(!w)return; const menu=D.el('widgetContextMenu'); menu.innerHTML=D._buildMenu(w).map(m=>m.label==='---'?'<div class="dropdown-divider"></div>':`<div class="dropdown-item${m.danger?' danger':''}" onclick="DG.closeContextMenu();${m.action}"><iconify-icon icon="${m.icon}"></iconify-icon>${m.label}</div>`).join(''); menu.style.left=e.clientX+'px'; menu.style.top=e.clientY+'px'; menu.classList.add('show') };
    D.closeContextMenu=()=>D.el('widgetContextMenu').classList.remove('show');
    D._buildMenu=w=>{ const id=w.id; const sizes=[{label:'Small',icon:'mdi:resize',action:`DG.changeWidgetSize('${id}','small')`},{label:'Medium',icon:'mdi:resize',action:`DG.changeWidgetSize('${id}','medium')`},{label:'Large',icon:'mdi:resize',action:`DG.changeWidgetSize('${id}','large')`},{label:'Huge',icon:'mdi:resize',action:`DG.changeWidgetSize('${id}','huge')`}]; const common=[{label:'Edit',icon:'mdi:pencil',action:`DG.openEditPanel('${id}')`},{label:'---'},...sizes,{label:'---'},{label:'Delete',icon:'mdi:delete',action:`DG.removeWidget('${id}')`,danger:true}]; if(w.type==='bookmarks')return[{label:'Open all',icon:'mdi:open-in-new',action:`DG._openAllBm('${id}')`},{label:'Add',icon:'mdi:plus',action:`DG.openEditPanel('${id}')`},{label:'---'},...common]; return common; };
    D._openAllBm=id=>{ const w=ST.widgetsData.find(x=>x.id===id); w?.data?.bookmarks?.forEach(b=>window.open(b.url,'_blank')); D.showToast('Opened all') };

    // Edit Panel
    D.openEditPanel=wid=>{ const w=ST.widgetsData.find(x=>x.id===wid); ST.editingWidgetId=wid; D.el('editPanelTitle').textContent=w.title; const body=D.el('editPanelBody'); switch(w.type){
        case'bookmarks':body.innerHTML=`<input class="form-input" id="editBmUrl" placeholder="URL"><button class="btn btn-primary btn-sm" onclick="DG._addBm()">Add</button><div id="editBmList" class="edit-list"></div>`; D._renderEditBm(w); break;
        case'notes':body.innerHTML=`<textarea class="form-input" id="editNoteContent" style="min-height:150px">${w.data?.content||''}</textarea>`; break;
        case'tasks':body.innerHTML=`<input class="form-input" id="editTaskInput" placeholder="Task"><button class="btn btn-primary btn-sm" onclick="DG._addTask()">Add</button><div id="editTaskList" class="edit-list"></div>`; D._renderEditTasks(w); break;
        case'embed':body.innerHTML=`<input class="form-input" id="editEmbedUrl" placeholder="YouTube URL">`; break;
        case'rss':body.innerHTML=`<input class="form-input" id="editRssUrl" placeholder="RSS URL">`; break;
        case'project':body.innerHTML=`<input class="form-input" id="editProjectName" placeholder="Name"><textarea class="form-input" id="editProjectDesc" placeholder="Description"></textarea><input class="form-input" id="editProjectUrl" placeholder="GitHub"><input class="form-input" id="editProjectWebsite" placeholder="Website"><div class="widget-type-grid">${['bookmarks','rss','gallery','notes','tasks','embed'].map(t=>`<button class="widget-type-btn" onclick="DG._addProjectSub('${wid}','${t}')"><iconify-icon icon="mdi:${t==='bookmarks'?'bookmark-multiple':t==='rss'?'rss':t==='gallery'?'image-multiple':t==='notes'?'note-text':t==='tasks'?'checkbox-marked':'code-tags'}"></iconify-icon>${t}</button>`).join('')}</div>`; break;
        case'clock':body.innerHTML=`<select class="form-select"><option>12h</option><option>24h</option></select>`; break;
        case'gallery':body.innerHTML=`<input type="file" class="form-input" multiple onchange="DG._uploadGallery(event)">`; break;
        case'calculator':body.innerHTML=`<select class="form-select"><option>Basic</option><option>Scientific</option></select>`; break;
    } D.el('editPanel').classList.add('open'); D.el('editPanelOverlay').classList.add('show'); D.closeContextMenu(); };
    D.closeEditPanel=()=>{ D.el('editPanel').classList.remove('open'); D.el('editPanelOverlay').classList.remove('show'); ST.editingWidgetId=null };
    D.saveEditPanel=async()=>{ const wid=ST.editingWidgetId; const w=ST.widgetsData.find(x=>x.id===wid); if(!w)return; const data={}; switch(w.type){ case'notes':data.content=D.el('editNoteContent').value; break; case'embed':data.embedUrl=D.el('editEmbedUrl').value; break; case'rss':data.rssUrl=D.el('editRssUrl').value; break; case'project':data.name=D.el('editProjectName').value; data.description=D.el('editProjectDesc').value; data.githubUrl=D.el('editProjectUrl').value; data.website=D.el('editProjectWebsite').value; break; } if(Object.keys(data).length) await FB.setDoc(FB.doc(FB.db,FB.COL.WIDGETS,wid),{data:{...w.data,...data},updatedAt:FB.serverTimestamp()},{merge:true}); D.closeEditPanel(); D.showToast('Saved') };

    D._addBm=async()=>{ const url=D.el('editBmUrl').value.trim(); if(!url)return; try{ const hn=new URL(url).hostname; const fv=`https://www.google.com/s2/favicons?domain=${hn}&sz=64`; let title=hn; try{ const r=await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`); const d=await r.json(); if(d.status==='success')title=d.data.title||title }catch(e){} const ref=FB.doc(FB.db,FB.COL.WIDGETS,ST.editingWidgetId); const snap=await FB.getDoc(ref); if(snap.exists()){ const w=snap.data(); const bm=w.data?.bookmarks||[]; bm.push({url,title,favicon:fv,hostname:hn}); await FB.setDoc(ref,{data:{...w.data,bookmarks:bm},updatedAt:FB.serverTimestamp()},{merge:true}); D._renderEditBm({data:{bookmarks:bm}}) } }catch(e){D.showToast('Invalid URL','error')} };
    D._renderEditBm=w=>{ D.el('editBmList').innerHTML=(w.data?.bookmarks||[]).map((b,i)=>`<div class="edit-item"><img src="${b.favicon}" width="14"> ${b.title} <button class="btn-x" onclick="DG._removeEditBm(${i})">✕</button></div>`).join('') };
    D._removeEditBm=async i=>{ const ref=FB.doc(FB.db,FB.COL.WIDGETS,ST.editingWidgetId); const snap=await FB.getDoc(ref); if(snap.exists()){ const w=snap.data(); const bm=w.data?.bookmarks||[]; bm.splice(i,1); await FB.setDoc(ref,{data:{...w.data,bookmarks:bm},updatedAt:FB.serverTimestamp()},{merge:true}); D._renderEditBm({data:{bookmarks:bm}}) } };
    D._addTask=async()=>{ const text=D.el('editTaskInput').value.trim(); if(!text)return; const ref=FB.doc(FB.db,FB.COL.WIDGETS,ST.editingWidgetId); const snap=await FB.getDoc(ref); if(snap.exists()){ const w=snap.data(); const tasks=w.data?.tasks||[]; tasks.push({text,done:false}); await FB.setDoc(ref,{data:{...w.data,tasks},updatedAt:FB.serverTimestamp()},{merge:true}); D._renderEditTasks({data:{tasks}}) } };
    D._renderEditTasks=w=>{ D.el('editTaskList').innerHTML=(w.data?.tasks||[]).map((t,i)=>`<div class="edit-item" onclick="DG._toggleEditTask(${i})"><iconify-icon icon="${t.done?'mdi:checkbox-marked':'mdi:checkbox-blank-outline'}" style="color:${t.done?'var(--green-500)':'#ccc'}"></iconify-icon> ${t.text}</div>`).join('') };
    D._toggleEditTask=async i=>{ const ref=FB.doc(FB.db,FB.COL.WIDGETS,ST.editingWidgetId); const snap=await FB.getDoc(ref); if(snap.exists()){ const w=snap.data(); const tasks=w.data?.tasks||[]; if(tasks[i]){tasks[i].done=!tasks[i].done; await FB.setDoc(ref,{data:{...w.data,tasks},updatedAt:FB.serverTimestamp()},{merge:true}); D._renderEditTasks({data:{tasks}}) } } };
    D._uploadGallery=async e=>{ const files=e.target.files; if(!files.length)return; const ref=FB.doc(FB.db,FB.COL.WIDGETS,ST.editingWidgetId); const snap=await FB.getDoc(ref); const imgs=snap.exists()?snap.data().data?.images||[]:[]; for(let f of files){ const fd=new FormData(); fd.append('image',f); const r=await fetch(`https://api.imgbb.com/1/upload?key=${FB.IMGBB_KEY}`,{method:'POST',body:fd}); const d=await r.json(); if(d.success)imgs.push(d.data.url) } await FB.setDoc(ref,{data:{...snap.data().data,images:imgs},updatedAt:FB.serverTimestamp()},{merge:true}) };
    D._addProjectSub=async(pid,type)=>{ const ref=FB.doc(FB.db,FB.COL.WIDGETS,pid); const snap=await FB.getDoc(ref); if(snap.exists()){ const w=snap.data(); const subs=w.data?.projectWidgets||[]; subs.push({type,title:type,data:{}}); await FB.setDoc(ref,{data:{...w.data,projectWidgets:subs},updatedAt:FB.serverTimestamp()},{merge:true}); D.showToast('Added') } };

    // Inline actions
    D.toggleTask=async(wid,i)=>{ const ref=FB.doc(FB.db,FB.COL.WIDGETS,wid); const snap=await FB.getDoc(ref); if(snap.exists()){ const w=snap.data(); const tasks=w.data?.tasks||[]; if(tasks[i]){tasks[i].done=!tasks[i].done; await FB.setDoc(ref,{data:{...w.data,tasks},updatedAt:FB.serverTimestamp()},{merge:true}) } } };
    D.updateNote=async(wid,content)=>{ await FB.setDoc(FB.doc(FB.db,FB.COL.WIDGETS,wid),{data:{content},updatedAt:FB.serverTimestamp()},{merge:true}) };

    // Render widget body
    D._renderBody=w=>{ const d=w.data||{}; switch(w.type){
        case'bookmarks':{ const bm=d.bookmarks||[]; if(!bm.length)return'<div class="widget-empty"><iconify-icon icon="mdi:bookmark-multiple-outline"></iconify-icon><p>No bookmarks</p></div>'; return`<div class="bookmark-grid">${bm.map(b=>`<a class="bookmark-card" href="${b.url}" target="_blank"><img src="${b.favicon}"><span>${(b.title||b.hostname).substring(0,7)}</span></a>`).join('')}</div>` }
        case'notes': return`<div class="note-toolbar"><button onclick="document.execCommand('bold')"><b>B</b></button><button onclick="document.execCommand('italic')"><i>I</i></button><button onclick="document.execCommand('underline')"><u>U</u></button></div><div class="note-content" contenteditable="true" oninput="DG.updateNote('${w.id}',this.innerText)">${d.content||''}</div>`;
        case'tasks':{ const tasks=d.tasks||[]; if(!tasks.length)return'<div class="widget-empty"><iconify-icon icon="mdi:checkbox-marked-outline"></iconify-icon><p>No tasks</p></div>'; const done=tasks.filter(t=>t.done).length; return`<div class="task-progress"><div class="task-progress-bar" style="width:${Math.round(done/tasks.length*100)}%"></div></div>${tasks.map((t,i)=>`<div class="task-item" onclick="DG.toggleTask('${w.id}',${i})"><iconify-icon icon="${t.done?'mdi:checkbox-marked':'mdi:checkbox-blank-outline'}" style="color:${t.done?'var(--green-500)':'#ccc'}"></iconify-icon>${t.text}</div>`).join('')}` }
        case'embed': return d.embedUrl?`<div class="embed-preview"><iframe src="${d.embedUrl}" allowfullscreen></iframe></div>`:'<div class="widget-empty"><iconify-icon icon="mdi:code-tags"></iconify-icon><p>No embed</p></div>';
        case'clock': return`<div class="clock-display"><div class="clock-time" id="clock_${w.id}">--:--</div><div class="clock-date" id="clockDate_${w.id}"></div></div>`; setTimeout(()=>{ const el=document.getElementById(`clock_${w.id}`); if(el){ const update=()=>{ el.textContent=new Date().toLocaleTimeString(); const de=document.getElementById(`clockDate_${w.id}`); if(de)de.textContent=new Date().toLocaleDateString() }; update(); setInterval(update,1000) } },100);
        case'calculator': return`<div class="calc-display" id="calcDisplay_${w.id}">0</div><div class="calc-grid">${'C÷×−789+456=123.0'.split('').map(k=>{ const ops={'C':'C','÷':'/','×':'*','−':'-'}; const v=ops[k]||k; return`<button class="calc-btn${'÷×−+'.includes(k)?' operator':k==='='?' equals':''}" onclick="${k==='C'?`DG.calcClear('${w.id}')`:k==='='?`DG.calcResult('${w.id}')`:`DG.calcInput('${w.id}','${v}')`}">${k}</button>` }).join('')}</div><input type="hidden" id="calcInput_${w.id}">`;
        case'gallery':{ const imgs=d.images||[]; if(!imgs.length)return'<div class="widget-empty"><iconify-icon icon="mdi:image-multiple-outline"></iconify-icon><p>No images</p></div>'; return`<div class="gallery-grid">${imgs.map(img=>`<div class="gallery-item" onclick="DG.openLightbox('${img}')"><img src="${img}"></div>`).join('')}</div>` }
        case'project':{ const hasContent=d.name||(d.projectWidgets||[]).length; if(!hasContent)return'<div class="widget-empty"><iconify-icon icon="mdi:folder-outline"></iconify-icon><p>Setup project</p></div>'; let html=`<div class="project-card">${d.name?`<div class="project-name">${d.name}</div>`:''}${d.description?`<div class="project-desc">${d.description}</div>`:''}<div class="project-meta">Owner: You</div>${d.website||d.githubUrl?`<div class="project-links">${d.website?`<a href="${d.website}" target="_blank">Website</a>`:''}${d.githubUrl?`<a href="${d.githubUrl}" target="_blank">GitHub</a>`:''}</div>`:''}`; const subs=d.projectWidgets||[]; if(subs.length){ html+=subs.map(s=>`<div class="sub-widget"><strong>${s.title}</strong></div>`).join('') } html+='</div>'; return html }
        default: return'<p>Widget ready</p>';
    }};
    D.calcInput=(wid,k)=>{ const inp=document.getElementById(`calcInput_${wid}`); inp.value+=k; document.getElementById(`calcDisplay_${wid}`).textContent=inp.value };
    D.calcResult=wid=>{ const inp=document.getElementById(`calcInput_${wid}`); try{ const res=Function('"use strict";return ('+inp.value+')')(); inp.value=res; document.getElementById(`calcDisplay_${wid}`).textContent=res }catch(e){ document.getElementById(`calcDisplay_${wid}`).textContent='Error' } };
    D.calcClear=wid=>{ document.getElementById(`calcInput_${wid}`).value=''; document.getElementById(`calcDisplay_${wid}`).textContent='0' };

    D.renderWidgets=()=>{ const grid=D.el('widgetGrid'); if(!ST.widgetsData.length){ grid.innerHTML=''; D.el('emptyState').style.display='flex'; return } D.el('emptyState').style.display='none'; grid.innerHTML=ST.widgetsData.map(w=>`<div class="widget size-${w.size||'medium'}" data-id="${w.id}"><div class="widget-header"><span class="widget-title" onclick="DG.openEditPanel('${w.id}')">${w.title}</span><div class="widget-actions"><button class="widget-btn" onclick="DG.openEditPanel('${w.id}')"><iconify-icon icon="mdi:pencil"></iconify-icon></button><button class="widget-btn" onclick="DG.openContextMenu('${w.id}',event)"><iconify-icon icon="mdi:dots-horizontal"></iconify-icon></button></div></div><div class="widget-body">${D._renderBody(w)}</div></div>`).join('') };

    // Init
    D.initApp=user=>{
        const name=user.displayName||user.email.split('@')[0];
        D.el('avatarInitial').textContent=name[0].toUpperCase();
        D.el('profileInitial').textContent=name[0].toUpperCase();
        D.el('usernameDisplay').textContent='@'+name.toLowerCase();
        D.el('bgImageGrid').innerHTML=FB.DEFAULT_BGS.map(url=>`<div class="image-option" style="background-image:url(${url})" onclick="DG.setBg('${url}')" data-bg="${url}"></div>`).join('');
        D.el('widgetTypeGrid').innerHTML='bookmarks,rss,notes,tasks,embed,project,clock,gallery,calculator'.split(',').map(t=>`<button class="widget-type-btn" onclick="DG.addWidget('${t}')"><iconify-icon icon="mdi:${t==='bookmarks'?'bookmark-multiple':t==='rss'?'rss':t==='notes'?'note-text':t==='tasks'?'checkbox-marked':t==='embed'?'code-tags':t==='project'?'folder':t==='clock'?'clock':t==='gallery'?'image-multiple':'calculator'}"></iconify-icon>${t[0].toUpperCase()+t.slice(1)}</button>`).join('');
        D._loadSettings(user.uid); D._loadWidgets(user.uid); D._loadPages(user.uid);
    };
    D._loadSettings=async uid=>{ const snap=await FB.getDoc(FB.doc(FB.db,FB.COL.SETTINGS,uid)); if(snap.exists()){ const d=snap.data(); if(d.bg) D.setBg(d.bg); if(d.cols) D.updateCols(d.cols); if(d.pageTitle) D.savePageTitle(d.pageTitle); if(d.profileImg) D._updateProfileImg(d.profileImg); ST.settings=d } };
    D._loadWidgets=uid=>{ FB.onSnapshot(FB.collection(FB.db,FB.COL.WIDGETS),snap=>{ ST.widgetsData=[]; snap.forEach(doc=>{ if(doc.data().userId===uid) ST.widgetsData.push({id:doc.id,...doc.data()}) }); D.renderWidgets() }) };
    D._loadPages=uid=>{ FB.onSnapshot(FB.query(FB.collection(FB.db,FB.COL.PAGES),FB.where('userId','==',uid)),snap=>{ const pages=[]; snap.forEach(d=>pages.push({id:d.id,title:d.data().title})); D.renderPagesList(pages) }) };
    D.renderPagesList=pages=>{ D.el('pagesList').innerHTML=pages.map(p=>`<div class="page-item${p.id===ST.currentPageId?' active':''}" onclick="DG.switchPage('${p.id}')">${p.title||'Untitled'}</div>`).join('')||'No pages'; D.el('pageLimit').textContent=pages.length+'/3' };

    D.switchPage=id=>{ ST.currentPageId=id; D.closePagesSidebar() };
    D.openPagesSidebar=()=>{ D.el('pagesSidebar').classList.add('open'); D.el('pagesOverlay').classList.add('show') };
    D.closePagesSidebar=()=>{ D.el('pagesSidebar').classList.remove('open'); D.el('pagesOverlay').classList.remove('show') };
    D.createNewPage=async()=>{ if(ST.currentUser){ const q=FB.query(FB.collection(FB.db,FB.COL.PAGES),FB.where('userId','==',ST.currentUser.uid)); const snap=await FB.getDocs(q); if(snap.size>=3) return D.showToast('Max 3 pages','error'); await FB.setDoc(FB.doc(FB.db,FB.COL.PAGES,'page_'+Date.now()),{userId:ST.currentUser.uid,title:'New Page',createdAt:FB.serverTimestamp()}); D.showToast('Created') } };

    D.handleSignOut=async()=>{ const m=await import("https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js"); await m.signOut(FB.auth); window.location.href='sign.html' };

    // Page settings tabs
    D._renderPageSettings=()=>{
        D.el('settingsTabs').innerHTML='General,Background,Layout,Preferences,Overview'.split(',').map((t,i)=>`<button class="modal-tab${i===0?' active':''}" onclick="DG.switchSettingsTab('tab-${t.toLowerCase()}',this)">${t}</button>`).join('');
        D.el('settingsTabContent').innerHTML=`
            <div class="tab-content active" id="tab-general">...</div>
            <div class="tab-content" id="tab-background"><div class="image-grid" id="bgImageGrid"></div><input type="file" onchange="DG.uploadBg(event)"><button onclick="DG.resetBg()">Reset</button></div>
            <div class="tab-content" id="tab-layout"><input type="number" value="${ST.colCount}" onchange="DG.updateCols(this.value)"></div>
            <div class="tab-content" id="tab-preferences">...</div>
            <div class="tab-content" id="tab-overview">...</div>`;
        D._setupBgGrid();
    };
    D.switchSettingsTab=(id,btn)=>{ D.qsa('.modal-tab').forEach(t=>t.classList.remove('active')); btn.classList.add('active'); D.qsa('.tab-content').forEach(t=>t.classList.remove('active')); D.el(id).classList.add('active') };
    D._setupBgGrid=()=>{ const g=D.el('bgImageGrid'); if(g) g.innerHTML=FB.DEFAULT_BGS.map(u=>`<div class="image-option" style="background-image:url(${u})" onclick="DG.setBg('${u}')" data-bg="${u}"></div>`).join('') };

    // Click outsides
    document.addEventListener('click',e=>{ if(!e.target.closest('.dropdown')) D.el('avatarMenu').classList.remove('show'); if(e.target.classList.contains('modal-overlay')) e.target.classList.remove('show'); if(!e.target.closest('.widget-menu-btn')) D.closeContextMenu() });
    document.addEventListener('keydown',e=>{ if(e.key==='Escape'){ D.closeContextMenu(); D.closeEditPanel(); D.closeLightbox(); D.el('avatarMenu').classList.remove('show'); document.querySelectorAll('.modal-overlay.show').forEach(m=>m.classList.remove('show')) } });
})();
