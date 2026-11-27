(() => {
  'use strict';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const fine=matchMedia('(hover: hover) and (pointer: fine)');
  const header=document.querySelector('.site-header,.header');
  const frame=document.querySelector('.hero-video-frame');
  const video=frame?.querySelector('video');
  const ribbons=[...document.querySelectorAll('.hero-ribbon,.side-ribbon')];
  const whatsapp=document.querySelector('.whatsapp-float');
  const footer=document.querySelector('.site-footer,.footer');
  let motionQueued=false;
  const updateWhatsAppPosition=()=>{
    if(!whatsapp||!footer)return;
    const buttonStyle=getComputedStyle(whatsapp);
    const rootFontSize=parseFloat(getComputedStyle(document.documentElement).fontSize);
    const baseBottom=parseFloat(buttonStyle.getPropertyValue('--whatsapp-bottom'))*rootFontSize;
    const footerBounds=footer.getBoundingClientRect();
    const buttonTop=innerHeight-baseBottom-whatsapp.offsetHeight;
    const buttonBottom=innerHeight-baseBottom;
    let lift=0;
    if(footerBounds.top<buttonBottom&&footerBounds.bottom>0){
      lift=Math.min(buttonBottom-footerBounds.top+8,Math.max(0,buttonTop-8));
    }
    whatsapp.style.setProperty('--whatsapp-footer-lift',`${lift}px`);
  };
  const updateScroll=()=>{
    header?.classList.toggle('is-scrolled',scrollY>60);
    if(!reduced.matches)ribbons.forEach((r,i)=>r.style.backgroundPosition=`0 ${scrollY*.1*(i?-1:1)}px`);
    if(video)video.style.transform=reduced.matches?'':`translateY(${Math.min(scrollY,innerHeight)*.035}px) scale(1.04)`;
    updateWhatsAppPosition();
    motionQueued=false;
  };
  const queueScroll=()=>{if(!motionQueued){motionQueued=true;requestAnimationFrame(updateScroll)}};
  addEventListener('scroll',queueScroll,{passive:true});
  addEventListener('resize',queueScroll,{passive:true});
  reduced.addEventListener('change',()=>{ribbons.forEach(r=>r.style.backgroundPosition='0 0');queueScroll()});
  updateScroll();

  // Smooth intro progress animation, gated by critical media readiness without layout jumps.
  const loader=document.getElementById('page-loader');
  if(loader){
    const content=loader.querySelector('.loader-content');
    let cake=content.querySelector('.loader-cake');
    if(!cake){
      cake=document.createElement('div');cake.className='loader-cake';cake.setAttribute('aria-hidden','true');
      const drawing=document.createElement('img');drawing.src='./tiramisu-doodle.svg';drawing.alt='';cake.append(drawing);
      content.prepend(cake);
    }
    let track=content.querySelector('.coffee-track');
    if(!track){
      track=document.createElement('div');track.className='coffee-track';track.setAttribute('role','progressbar');track.setAttribute('aria-label','Preparing your visit');track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax','100');
      const f=document.createElement('span');f.className='coffee-fill';track.append(f);
      content.append(track);
    }
    const fill=track.querySelector('.coffee-fill');
    let percent=content.querySelector('.loader-percent');
    if(!percent){
      percent=document.createElement('span');percent.className='loader-percent';percent.setAttribute('aria-hidden','true');
      content.append(percent);
    }

    let ready=document.readyState==='complete',readyAt=ready?performance.now():null,finished=false,progress=0;
    const started=performance.now();
    const minDuration=reduced.matches?200:850;
    const finishTail=reduced.matches?100:320;
    const critical=[...document.querySelectorAll('header img')];
    const resources=critical.map(img=>img.complete?Promise.resolve():new Promise(resolve=>{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',resolve,{once:true});setTimeout(resolve,1800)}));
    if(video&&video.readyState<2)resources.push(new Promise(resolve=>{video.addEventListener('loadeddata',resolve,{once:true});video.addEventListener('error',resolve,{once:true});setTimeout(resolve,2200)}));
    Promise.allSettled(resources).then(()=>{if(!ready){ready=true;readyAt=performance.now()}});

    let lastFrame=started;
    const tick=now=>{
      if(finished)return;
      const dt=Math.min(64,Math.max(0,now-lastFrame))/1000;
      lastFrame=now;
      const elapsed=now-started;
      const target=ready&&elapsed>=minDuration
        ? 100
        : Math.min(88,(elapsed/minDuration)*88);
      if(ready&&readyAt!==null&&now-readyAt<finishTail&&progress<100){
        const easeTarget=Math.min(100,Math.max(target,progress+(100-progress)*Math.min(1,dt*8.5)));
        progress=Math.max(progress,easeTarget);
      }else if(target>progress){
        const speed=ready?Math.max(38,(100-progress)*6.5):Math.max(18,(target-progress)*4.5);
        progress=Math.min(target,progress+speed*dt);
      }
      if(ready&&elapsed>=minDuration+finishTail)progress=100;

      const shown=Math.min(100,Math.round(progress));
      fill.style.setProperty('--progress',`${progress.toFixed(2)}%`);
      percent.textContent=String(shown).padStart(2,'0')+'%';
      track.setAttribute('aria-valuenow',String(shown));
      if(shown>=100){
        finished=true;
        setTimeout(()=>{
          loader.classList.add('is-hidden','hidden');
          setTimeout(()=>loader.remove(),480);
        },140);
      }else{
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
    setTimeout(()=>{if(!ready){ready=true;readyAt=performance.now()}},3000);
  }

  const icon=path=>`<svg viewBox="0 0 24 24" aria-hidden="true">${path}</svg>`;
  let stopAmbience=()=>{};
  if(frame&&video){
    const controls=document.createElement('div');controls.className='cinema-controls';
    const play=document.createElement('button'),mute=document.createElement('button'),ambience=document.createElement('button');
    [play,mute,ambience].forEach(button=>{button.type='button';button.className='cinema-control'});
    ambience.classList.add('ambience');ambience.setAttribute('aria-pressed','false');ambience.setAttribute('aria-label','Turn on ambient music');
    ambience.innerHTML='<span class="sound-bars" aria-hidden="true"><i></i><i></i><i></i></span><span class="sound-label">Music off</span>';
    const bar=document.createElement('div');bar.className='video-progress';bar.setAttribute('aria-hidden','true');const fill=document.createElement('span');bar.append(fill);
    const status=document.createElement('span');status.className='video-status';status.setAttribute('role','status');
    controls.append(ambience,play,mute);frame.append(controls,bar,status);
    let manuallyPaused=reduced.matches,visible=true;
    const sync=()=>{
      play.setAttribute('aria-label',video.paused?'Play brand video':'Pause brand video');
      play.innerHTML=video.paused?icon('<path d="m9 5 11 7-11 7Z"/>'):icon('<path d="M8 5v14M16 5v14"/>');
      mute.setAttribute('aria-label',video.muted?'Unmute brand video':'Mute brand video');mute.setAttribute('aria-pressed',String(!video.muted));
      mute.innerHTML=icon('<path d="M11 5 6 9H3v6h3l5 4Z"/>'+(video.muted?'<path d="m16 9 5 6m0-6-5 6"/>':'<path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>'));
    };
    const tryPlay=async()=>{try{await video.play();status.textContent=''}catch{status.textContent='Press play to watch the brand film.'}sync()};
    play.addEventListener('click',()=>{manuallyPaused=!video.paused;if(video.paused)tryPlay();else video.pause()});
    mute.addEventListener('click',()=>{video.muted=!video.muted;if(!video.muted)stopAmbience();sync()});
    ['play','pause','volumechange','loadedmetadata'].forEach(event=>video.addEventListener(event,sync));
    video.addEventListener('timeupdate',()=>fill.style.transform=`scaleX(${Number.isFinite(video.duration)&&video.duration>0?video.currentTime/video.duration:0})`);
    video.addEventListener('error',()=>{status.textContent='The brand film could not load. Your menu is still available.'});
    if('IntersectionObserver'in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible)video.pause();else if(!manuallyPaused&&!document.hidden)tryPlay()},{threshold:.08}).observe(frame);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();else if(visible&&!manuallyPaused)tryPlay()});
    reduced.addEventListener('change',()=>{if(reduced.matches){manuallyPaused=true;video.pause()}});
    if(reduced.matches){video.autoplay=false;video.pause()}
    sync();

    // A quiet, locally synthesised ambient chord; no tracking or remote audio.
    let audio,master,nodes=[],musicOn=false;
    const syncMusic=()=>{ambience.setAttribute('aria-pressed',String(musicOn));ambience.setAttribute('aria-label',musicOn?'Turn off ambient music':'Turn on ambient music');ambience.querySelector('.sound-label').textContent=musicOn?'Music on':'Music off'};
    const pauseMusic=async()=>{musicOn=false;if(audio){try{await audio.suspend()}catch{}}syncMusic()};
    stopAmbience=pauseMusic;
    ambience.addEventListener('click',async()=>{
      if(musicOn){await pauseMusic();return}
      const Context=window.AudioContext||window.webkitAudioContext;
      if(!Context){status.textContent='Ambient music is unavailable in this browser.';return}
      try{
        if(!audio){audio=new Context();master=audio.createGain();master.gain.value=.025;master.connect(audio.destination);
          [130.81,164.81,196,261.63].forEach((frequency,index)=>{const osc=audio.createOscillator(),gain=audio.createGain(),lfo=audio.createOscillator(),depth=audio.createGain();osc.type='sine';osc.frequency.value=frequency;gain.gain.value=.18;lfo.frequency.value=.055+index*.013;depth.gain.value=.055;lfo.connect(depth);depth.connect(gain.gain);osc.connect(gain);gain.connect(master);osc.start();lfo.start();nodes.push(osc,lfo)})}
        await audio.resume();musicOn=true;video.muted=true;syncMusic();sync();
      }catch{status.textContent='Music could not start. Please try again.'}
    });
    document.addEventListener('visibilitychange',()=>{if(!audio||!musicOn)return;if(document.hidden)audio.suspend().catch(()=>{});else audio.resume().catch(()=>{})});
    addEventListener('pagehide',()=>{nodes.forEach(node=>{try{node.stop()}catch{}});audio?.close().catch(()=>{})},{once:true});
  }

  // Pointer movement stays on imagery; native scrolling and touch remain intact.
  const halo=document.createElement('div');halo.className='cursor-halo';halo.setAttribute('aria-hidden','true');halo.textContent='EXPLORE';document.body.append(halo);
  let activeImage=null,pointerQueued=false,lastX=0,lastY=0;
  const paintPointer=()=>{
    pointerQueued=false;
    if(!fine.matches||reduced.matches){halo.classList.remove('active');return}
    halo.style.transform=`translate3d(${lastX-38}px,${lastY-38}px,0)`;
    if(activeImage){const rect=activeImage.getBoundingClientRect();const x=(lastX-rect.left)/rect.width-.5,y=(lastY-rect.top)/rect.height-.5;activeImage.style.setProperty('--image-x',x*12+'px');activeImage.style.setProperty('--image-y',y*10+'px');activeImage.style.setProperty('--image-rotate',x*1.4+'deg')}
  };
  const clearImage=()=>{if(activeImage){activeImage.style.removeProperty('--image-x');activeImage.style.removeProperty('--image-y');activeImage.style.removeProperty('--image-rotate')}activeImage=null;halo.classList.remove('active')};
  document.addEventListener('pointermove',event=>{
    if(!fine.matches||reduced.matches)return;
    lastX=event.clientX;lastY=event.clientY;
    const image=event.target.closest('.gallery-item,.product-image,.story-photo');
    if(image!==activeImage){clearImage();activeImage=image;halo.classList.toggle('active',!!image&&!image.classList.contains('story-photo'))}
    if(!pointerQueued){pointerQueued=true;requestAnimationFrame(paintPointer)}
  },{passive:true});
  document.documentElement.addEventListener('pointerleave',clearImage);
  reduced.addEventListener('change',clearImage);fine.addEventListener('change',clearImage);

  const zoom=document.createElement('dialog');zoom.className='image-dialog';zoom.setAttribute('aria-label','Product image detail');
  const close=document.createElement('button');close.type='button';close.className='close';close.setAttribute('aria-label','Close image detail');close.textContent='×';
  const zoomImage=document.createElement('img');zoomImage.alt='';const caption=document.createElement('p');zoom.append(close,zoomImage,caption);document.body.append(zoom);
  let zoomFocus=null;
  close.addEventListener('click',()=>zoom.close());zoom.addEventListener('click',event=>{if(event.target===zoom){const r=zoom.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)zoom.close()}});
  zoom.addEventListener('close',()=>{document.body.style.overflow='';zoomFocus?.focus()});
  document.querySelectorAll('.gallery-item,.product-image').forEach(container=>{
    const img=container.querySelector('img');if(!img)return;
    const button=document.createElement('button');button.type='button';button.className='image-open';button.setAttribute('aria-label','View '+img.alt);
    const hint=document.createElement('span');hint.className='image-hint';hint.setAttribute('aria-hidden','true');hint.textContent='VIEW DETAIL ↗';container.append(button,hint);
    button.addEventListener('click',()=>{if(typeof zoom.showModal!=='function')return;zoomFocus=button;zoomImage.src=img.currentSrc||img.src;zoomImage.alt=img.alt;caption.textContent=container.querySelector('figcaption')?.textContent||img.alt;document.body.style.overflow='hidden';clearImage();zoom.showModal()});
  });

  const mobile=document.getElementById('mobile-nav'),toggle=document.getElementById('menu-toggle');
  const closeNav=restore=>{if(!mobile?.classList.contains('open'))return;mobile.classList.remove('open');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Open navigation menu');toggle.textContent='☰';if(restore)toggle.focus()};
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeNav(true)});
  document.addEventListener('click',event=>{if(!mobile?.contains(event.target)&&!toggle?.contains(event.target))closeNav(false)});
  mobile?.addEventListener('click',event=>{if(event.target.closest('a'))toggle?.setAttribute('aria-label','Open navigation menu')});
  matchMedia('(min-width:1151px)').addEventListener('change',event=>{if(event.matches)closeNav(false)});
  const theme=document.getElementById('theme-toggle');
  try{const saved=localStorage.getItem('delisse-original-theme');if(['day','night'].includes(saved)&&saved!==document.documentElement.dataset.theme)theme?.click()}catch{}
  theme?.addEventListener('click',()=>{try{localStorage.setItem('delisse-original-theme',document.documentElement.dataset.theme)}catch{}});

  const sections=[...document.querySelectorAll('main>section[id]')];
  if('IntersectionObserver'in window){const tracker=new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)return;document.querySelectorAll('.nav-links a[href^="#"]').forEach(link=>{if(link.hash==='#'+entry.target.id)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current')})}),{rootMargin:'-20% 0px -55% 0px'});sections.forEach(section=>tracker.observe(section))}

  const form=document.getElementById('customer-form');
  if(form){
    const states=['Andaman and Nicobar Islands','Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chandigarh','Chhattisgarh','Dadra and Nagar Haveli and Daman and Diu','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jammu and Kashmir','Jharkhand','Karnataka','Kerala','Ladakh','Lakshadweep','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Puducherry','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal'];
    const select=document.getElementById('customer-state');states.forEach(state=>{const option=document.createElement('option');option.value=state;option.textContent=state;if(state==='Maharashtra')option.selected=true;select.append(option)});
    const preview=document.getElementById('address-preview');
    form.addEventListener('input',()=>{const data=Object.fromEntries(new FormData(form));preview.textContent=data.building||data.area||data.city?window.DelisseOrder.formatAddress(data):'Your delivery address will appear here.'});
    // Only the non-personal bag items and customizations are retained. Address fields stay in this page.
    const saveBag=()=>{try{localStorage.setItem('delisse-studio-bag',JSON.stringify([...cart.values()].map(item=>({id:item.product.id,quantity:item.quantity,dietary:item.dietary||'Veg (Eggless)',coffee:item.coffee||'Classic Espresso',sweetness:item.sweetness||'Classic',topping:item.topping||'Classic Cocoa',customNote:item.customNote||''}))))}catch{}};
    try{
      const saved=JSON.parse(localStorage.getItem('delisse-studio-bag')||'[]');
      if(Array.isArray(saved))saved.forEach(entry=>{
        const isPair=Array.isArray(entry);
        const id=isPair?entry[0]:entry?.id;
        const quantity=isPair?entry[1]:entry?.quantity;
        const product=products.find(p=>p.id===id);
        if(!product||!Number.isInteger(quantity)||quantity<=0||quantity>99)return;
        const cfg={
          dietary:isPair?'Veg (Eggless)':(entry.dietary||'Veg (Eggless)'),
          coffee:isPair?'Classic Espresso':(entry.coffee||'Classic Espresso'),
          sweetness:isPair?'Classic':(entry.sweetness||'Classic'),
          topping:isPair?'Classic Cocoa':(entry.topping||'Classic Cocoa'),
          customNote:isPair?'':(entry.customNote||'')
        };
        const key=typeof makeItemKey==='function'?makeItemKey(id,cfg):String(id);
        cart.set(key,{product,quantity,...cfg});
      });
      renderCart();
    }catch{}
    document.addEventListener('click',event=>{if(event.target.closest('[data-add],[data-card-key],[data-qty]')){saveBag();const button=event.target.closest('[data-add],[data-card-key],[data-qty]');const key=button.dataset.qty||button.dataset.cardKey;const scope=button.closest('#drawer-list')?'#drawer-list':'#product-grid';const kind=scope==='#drawer-list'?'data-qty':'data-card-key';const delta=button.dataset.change||'1';const next=key?document.querySelector(`${scope} [${kind}="${CSS.escape(key)}"][data-change="${delta}"]`):null;if(next)next.focus();else if(document.getElementById('drawer').classList.contains('open'))document.getElementById('close-drawer').focus()}});
    document.getElementById('drawer-list').addEventListener('change',saveBag);
    document.addEventListener('delisse-bag-updated',saveBag);
    const drawer=document.getElementById('drawer');
    new MutationObserver(()=>{const open=drawer.classList.contains('open');document.querySelectorAll('main,header,footer').forEach(element=>element.inert=open)}).observe(drawer,{attributes:true,attributeFilter:['class']});
  }
})();
