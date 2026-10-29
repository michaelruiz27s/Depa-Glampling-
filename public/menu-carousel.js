/** Carrusel accesible del menú gastronómico: navegación, filtros y móvil táctil. */
document.addEventListener('DOMContentLoaded',()=>{
 const track=document.getElementById('menu-carousel-track');
 const wrapper=document.querySelector('.menu-carousel-wrapper');
 const prevBtn=document.getElementById('menu-prev-btn');
 const nextBtn=document.getElementById('menu-next-btn');
 const dots=document.getElementById('menu-carousel-dots');
 const tabs=[...document.querySelectorAll('.menu-tab-btn')];
 const cards=[...document.querySelectorAll('.menu-dish-card')];
 if(!track||!wrapper||!cards.length)return;
 const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
 let visible=[],index=0,timer=null,paused=false;
 const mobile=()=>window.innerWidth<=640;
 const perView=()=>mobile()?1:window.innerWidth<=960?2:3;
 const maxIndex=()=>Math.max(0,visible.length-perView());
 const stop=()=>{if(timer!==null){clearInterval(timer);timer=null;}};
 const paintDots=()=>{
  if(!dots)return;
  [...dots.children].forEach((dot,i)=>{
   dot.classList.toggle('active',i===index);
   dot.setAttribute('aria-current',i===index?'true':'false');
  });
 };
 const update=({animate=true}={})=>{
  index=Math.min(Math.max(0,index),maxIndex());
  if(mobile()){
   track.style.transform='none';
   const first=visible[0],target=visible[index];
   if(first&&target){
    const left=target.offsetLeft-first.offsetLeft;
    wrapper.scrollTo({left,behavior:animate&&!reducedMotion.matches?'smooth':'instant'});
   }
  }else{
   wrapper.scrollLeft=0;
   const first=visible[0];
   const gap=parseFloat(getComputedStyle(track).gap)||0;
   const step=first?first.getBoundingClientRect().width+gap:0;
   track.style.transform=`translateX(-${index*step}px)`;
  }
  if(prevBtn)prevBtn.disabled=index===0;
  if(nextBtn)nextBtn.disabled=index>=maxIndex();
  paintDots();
 };
 const rebuildDots=()=>{
  if(!dots)return;
  dots.replaceChildren();
  if(maxIndex()===0)return;
  for(let i=0;i<=maxIndex();i++){
   const b=document.createElement('button');
   b.type='button';b.className='menu-dot';
   b.setAttribute('aria-label',`Ver platillo ${i+1}`);
   b.addEventListener('click',()=>{index=i;update();restart();});
   dots.appendChild(b);
  }
  paintDots();
 };
 const start=()=>{
  stop();
  if(paused||reducedMotion.matches||document.hidden||maxIndex()<1)return;
  timer=setInterval(()=>{
   if(paused||document.hidden){stop();return;}
   index=index>=maxIndex()?0:index+1;
   update();
  },4500);
 };
 const restart=()=>{stop();start();};
 const filter=category=>{
  index=0;
  visible=cards.filter(card=>{
   const show=category==='all'||card.dataset.category===category;
   card.hidden=!show;
   card.style.display=show?'flex':'none';
   return show;
  });
  wrapper.scrollLeft=0;
  rebuildDots();update({animate:false});start();
 };
 tabs.forEach(tab=>tab.addEventListener('click',()=>{
  tabs.forEach(t=>{t.classList.toggle('active',t===tab);t.setAttribute('aria-selected',String(t===tab));});
  filter(tab.dataset.category||'all');
 }));
 prevBtn?.addEventListener('click',()=>{index--;update();restart();});
 nextBtn?.addEventListener('click',()=>{index++;update();restart();});
 cards.forEach(card=>card.querySelector('.menu-dish-media')?.addEventListener('keydown',e=>{
  if(e.key==='Enter'||e.key===' '){e.preventDefault();e.currentTarget.click();}
 }));
 wrapper.addEventListener('mouseenter',()=>{paused=true;stop();});
 wrapper.addEventListener('mouseleave',()=>{paused=false;start();});
 wrapper.addEventListener('focusin',()=>{paused=true;stop();});
 wrapper.addEventListener('focusout',e=>{if(!wrapper.contains(e.relatedTarget)){paused=false;start();}});
 wrapper.addEventListener('touchstart',()=>{paused=true;stop();},{passive:true});
 wrapper.addEventListener('touchend',()=>{paused=false;start();},{passive:true});
 let scrollFrame=null;
 wrapper.addEventListener('scroll',()=>{
  if(!mobile()||!visible.length)return;
  if(scrollFrame!==null)cancelAnimationFrame(scrollFrame);
  scrollFrame=requestAnimationFrame(()=>{
   const first=visible[0];if(!first)return;
   const step=visible[1]?visible[1].offsetLeft-first.offsetLeft:first.offsetWidth;
   index=Math.min(maxIndex(),Math.max(0,Math.round(wrapper.scrollLeft/Math.max(1,step))));
   paintDots();
  });
 },{passive:true});
 window.addEventListener('resize',()=>{rebuildDots();update({animate:false});restart();});
 document.addEventListener('visibilitychange',()=>document.hidden?stop():start());
 reducedMotion.addEventListener?.('change',()=>reducedMotion.matches?stop():start());
 filter('all');
});
