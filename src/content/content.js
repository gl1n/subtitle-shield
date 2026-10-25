(() => {
  if(globalThis.__dmShieldLoaded)return;
  globalThis.__dmShieldLoaded=true;
  const utils=globalThis.DmShieldUtils;
  const key = `dmShield:${location.origin}`;
  const root = document.createElement('div'); root.id = 'dm-shield-root';
  const hint = document.createElement('div'); hint.textContent = '拖动选择需要遮挡的区域 · Esc 取消'; hint.style.cssText = 'display:none;position:absolute;top:24px;left:50%;transform:translateX(-50%);padding:9px 14px;border-radius:9px;background:#171a1fee;color:#f4f5f7;font:13px -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;box-shadow:0 6px 20px #0005;'; root.append(hint);
  const shield = document.createElement('div'); shield.className = 'shield';
  const closeButton = document.createElement('button'); closeButton.className = 'shield-close'; closeButton.type = 'button'; closeButton.title = '关闭遮挡层'; closeButton.setAttribute('aria-label', '关闭遮挡层');
  const toolbar = document.createElement('div'); toolbar.className = 'shield-toolbar';
  toolbar.innerHTML = '<button class="done">完成</button><button class="cancel">取消</button>';
  ['tl','tr','bl','br'].forEach(pos => { const h=document.createElement('span');h.className=`handle ${pos}`;shield.append(h); }); shield.append(closeButton); root.append(shield,toolbar); document.documentElement.append(root);
  const media=()=>{
    const scope=document.fullscreenElement||document;
    const videos=[];
    const collect=root=>{
      if(root.nodeType===1&&root.tagName==='VIDEO')videos.push(root);
      root.querySelectorAll?.('video').forEach(v=>videos.push(v));
      root.querySelectorAll?.('*').forEach(el=>{if(el.shadowRoot)collect(el.shadowRoot)});
    };
    collect(scope);
    const visible=[...new Set(videos)].filter(v=>{const r=v.getBoundingClientRect();return r.width>0&&r.height>0});
    return visible.sort((a,b)=>{const ar=a.getBoundingClientRect(),br=b.getBoundingClientRect();return br.width*br.height-ar.width*ar.height})[0]||null;
  };
  const videoRect=()=>{
    const v=media(); if(!v)return null;
    const box=v.getBoundingClientRect();
    const style=getComputedStyle(v), fit=style.objectFit;
    const vw=v.videoWidth, vh=v.videoHeight;
    if(!vw||!vh||fit!=='contain')return box;
    return utils.containRect(box,vw,vh);
  };
  const playerRect=()=>{
    const existing=videoRect(); if(existing)return existing;
    if(window.top!==window){return {left:0,top:0,width:innerWidth,height:innerHeight,right:innerWidth,bottom:innerHeight};}
    const frames=[...document.querySelectorAll('iframe')].filter(f=>{const r=f.getBoundingClientRect();return r.width>240&&r.height>135});
    const frame=frames.sort((a,b)=>{const ar=a.getBoundingClientRect(),br=b.getBoundingClientRect();return br.width*br.height-ar.width*ar.height})[0];
    if(frame){const r=frame.getBoundingClientRect();return {left:r.left,top:r.top,width:r.width,height:r.height,right:r.right,bottom:r.bottom};}
    return null;
  };
  const hasVisiblePlayerIframe=()=>[...document.querySelectorAll('iframe')].some(f=>{const r=f.getBoundingClientRect();return r.width>240&&r.height>135});
  const ownsPlayer=()=>window.top!==window||!hasVisiblePlayerIframe();
  const inVideo=e=>{const r=playerRect();return !!r&&e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom};
  function syncFullscreenHost(){const host=document.fullscreenElement||document.documentElement;if(root.parentElement!==host)host.append(root);render()}
  let state=utils.defaultState(), editing=false, draft=null, action=null;
  const clamp=(n,min,max)=>Math.min(Math.max(n,min),max);
  function centerDraft(){if(state.autoCenter&&draft)draft=utils.centerRegion(draft)}
  function render(){
    if(!ownsPlayer()){
      shield.style.display='none';
      toolbar.style.display='none';
      root.classList.remove('editing');
      hint.style.display='none';
      return;
    }
    if(editing&&!action)centerDraft();
    const r=editing?draft:state.region;
    const vr=playerRect(), rr=root.getBoundingClientRect();
    if(r&&vr){
      shield.style.left=`${vr.left-rr.left+r.x*vr.width}px`;
      shield.style.top=`${vr.top-rr.top+r.y*vr.height}px`;
      shield.style.width=`${r.w*vr.width}px`;
      shield.style.height=`${r.h*vr.height}px`;
      shield.style.display=state.enabled||editing?'block':'none';
      toolbar.style.top=`${vr.top-rr.top+8}px`;
      toolbar.style.left=`${vr.left-rr.left+Math.max(8,vr.width-168)}px`;
    } else shield.style.display='none';
    toolbar.style.display=editing?'flex':'none';
    closeButton.style.display=!editing&&state.enabled&&!!r?'grid':'none';
    root.classList.toggle('editing',editing);
    hint.style.display=editing&&!r?'block':'none';
  }
  function save(){chrome.storage.local.set({[key]:state});}
  function enterEdit(){
    if(!utils.shouldEnterEdit(window.top===window,hasVisiblePlayerIframe()))return;
    editing=true;draft=state.region?{...state.region}:null;centerDraft();render();
  }
  function finish(){if(draft&&draft.w>0&&draft.h>0){state.region={...draft};state.enabled=true;save()} editing=false;draft=null;action=null;hint.style.display='none';render()}
  function cancel(){editing=false;draft=null;action=null;hint.style.display='none';render()}
  document.addEventListener('keydown', e=>{if(e.key==='Escape'&&editing)cancel()});
  function point(e){return utils.normalizePoint(e.clientX,e.clientY,playerRect())}
  root.addEventListener('pointerdown',e=>{if(!editing)return;shield.classList.remove('settling');if(e.target===root&&!draft){if(!inVideo(e))return;const p=point(e);draft={x:p.x,y:p.y,w:0,h:0};action={type:'create',start:p};shield.style.display='block'}else if(e.target===shield||e.target.classList.contains('shield')){const p=point(e);action={type:'move',start:p,base:{...draft}}}else if(e.target.classList.contains('handle')){const p=point(e);action={type:e.target.classList[1],start:p,base:{...draft}}} if(action)root.setPointerCapture(e.pointerId)});
  root.addEventListener('pointermove',e=>{if(!action)return;const p=point(e),a=action,b=a.base||draft,dx=p.x-a.start.x,dy=p.y-a.start.y;if(a.type==='create'){draft={x:Math.min(a.start.x,p.x),y:Math.min(a.start.y,p.y),w:Math.abs(dx),h:Math.abs(dy)}}else if(a.type==='move'){draft={...b,x:clamp(b.x+dx,0,1-b.w),y:clamp(b.y+dy,0,1-b.h)}}else{let x=b.x,y=b.y,w=b.w,h=b.h;if(a.type.includes('l')){x=clamp(b.x+dx,0,b.x+b.w-.03);w=b.w-(x-b.x)}if(a.type.includes('r'))w=clamp(b.w+dx,.03,1-x);if(a.type.includes('t')){y=clamp(b.y+dy,0,b.y+b.h-.03);h=b.h-(y-b.y)}if(a.type.includes('b'))h=clamp(b.h+dy,.03,1-y);draft={x,y,w,h}}render()});
  root.addEventListener('pointerup',()=>{if(!action)return;action=null;if(state.autoCenter&&draft){draft=utils.centerRegion(draft);shield.classList.add('settling');render();shield.addEventListener('transitionend',()=>shield.classList.remove('settling'),{once:true})}});toolbar.querySelector('.done').onclick=finish;toolbar.querySelector('.cancel').onclick=cancel;
  closeButton.onclick=e=>{e.stopPropagation();state.enabled=false;save();render()};
  chrome.runtime.onMessage.addListener((m,_,reply)=>{if(m.type==='getState'){reply({enabled:state.enabled,hasRegion:!!state.region,autoCenter:!!state.autoCenter});return true}if(m.type==='toggle'){state.enabled=!state.enabled;save();render()}if(m.type==='setEnabled'){state.enabled=m.enabled;save();render()}if(m.type==='setAutoCenter'){state.autoCenter=!!m.enabled;centerDraft();save();render()}if(m.type==='edit')enterEdit();if(m.type==='clear'){state=utils.defaultState();save();render()}});
  chrome.storage.local.get(key,r=>{if(r[key]){state={...r[key],autoCenter:r[key].autoCenter===undefined?true:!!r[key].autoCenter};render()}});
  document.addEventListener('fullscreenchange',syncFullscreenHost);
  window.addEventListener('resize',render);
  document.querySelectorAll('iframe').forEach(frame=>frame.addEventListener('load',render));
})();
