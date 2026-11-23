'use strict';
(async () => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let paused = reduced;
  const visible = new Set();
  const toggle = document.querySelector('#pause-all');
  const heroWall = document.querySelector('.hero-wall');
  const heroIntro = document.querySelector('.hero-intro');
  const heroLoop = document.querySelector('.hero-loop');
  let introDone = reduced;
  if (introDone) heroWall.classList.add('intro-done');
  const play = video => {
    if (paused || document.hidden || video.closest('[hidden]')) return;
    if (video === heroIntro && introDone) return;
    if (video === heroLoop && !introDone) return;
    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;
    if (video.id === 'real-video') { video.play().catch(() => {}); return; }
    if (!video.getAttribute('src')) { video.src = video.dataset.src; video.load(); }
    video.play().catch(() => {});
  };
  const finishIntro = () => {
    if (introDone) return;
    introDone = true;
    heroWall.classList.add('intro-done');
    play(heroLoop);
    setTimeout(() => heroIntro.pause(), 1200);
  };
  heroIntro.addEventListener('ended', finishIntro);
  heroIntro.addEventListener('error', finishIntro);
  const observer = new IntersectionObserver(entries => entries.forEach(({target, isIntersecting}) => {
    if (isIntersecting) { visible.add(target); play(target); }
    else { visible.delete(target); target.pause(); }
  }), {threshold: .08});
  const register = root => root.querySelectorAll('video').forEach(video => {
    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;
    video.removeAttribute('controls');
    video.addEventListener('volumechange', () => {
      if (!video.muted || video.volume !== 0) {
        video.muted = true;
        video.volume = 0;
      }
    });
    observer.observe(video);
    video.addEventListener('error', () => {
      if (video.parentElement.querySelector('.media-error')) return;
      const message = document.createElement('div'); message.className = 'media-error'; message.textContent = 'Video unavailable.';
      const retry = document.createElement('button'); retry.className = 'retry-video'; retry.textContent = 'Retry';
      retry.onclick = () => {message.remove();video.load();play(video);}; message.append(retry);video.parentElement.append(message);
    });
  });
  const syncToggle = () => {toggle.textContent = paused ? 'Play videos' : 'Pause videos'; toggle.setAttribute('aria-pressed', String(paused));};
  syncToggle();
  toggle.addEventListener('click', () => { paused = !paused; syncToggle(); document.querySelectorAll('video').forEach(video => {if (paused) video.pause(); else if (visible.has(video)) play(video);});});
  document.addEventListener('visibilitychange', () => document.querySelectorAll('video').forEach(video => {if(document.hidden) video.pause();else if(visible.has(video)) play(video);}));
  register(document.querySelector('.hero'));
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const videoMarkup = (m,label) => `<div class="media-frame"><video muted loop playsinline preload="none" data-src="${escape(m.src)}" poster="${escape(m.poster)}" aria-label="${escape(label)}"></video></div>`;
  const outcome = value => `<span class="outcome ${value.toLowerCase()}">${value}</span>`;
  try {
    let media;
    if (location.protocol === 'file:') {
      const embedded = document.querySelector('#video-manifest-data');
      if (!embedded) throw new Error('Embedded manifest unavailable');
      media = JSON.parse(embedded.textContent);
    } else {
      const response = await fetch('video-manifest.json?v=20261122-trash-position4');
      if (!response.ok) throw new Error('Manifest unavailable');
      media = await response.json();
    }
    const tasks = [['close_door','Close door'],['open_oven','Open oven'],['open_trash_can','Open trash can'],['push_office_chair','Push office chair'],['bend_pick','Bend & pick']];
    const starts = document.querySelector('#starts-grid');
    starts.innerHTML = tasks.map(([key,title]) => `<div class="task-group" data-task-group="${key}"><div class="task-heading"><h3>${escape(title)}</h3><span>4 initial positions</span></div><div class="starts-row">${media.filter(m=>m.group==='starts'&&m.task===key).sort((a,b)=>a.start-b.start).map(m=>`<article class="video-card">${videoMarkup(m,`${title}, initial position ${m.start}, 3 times speed`)}<div class="video-meta"><strong>Initial position ${String(m.start).padStart(2,'0')}</strong><span>3×</span></div></article>`).join('')}</div></div>`).join('');
    const station = document.querySelector('#station-grid');
    station.innerHTML = ['HarnessHumanoid','Without adjustment'].flatMap(method=>[['open_oven','Open oven'],['open_trash_can','Open trash can'],['bend_pick','Bend & pick']].flatMap(([key,title])=>media.filter(m=>m.group==='station'&&m.task===key&&m.method===method).map(m=>`<article class="video-card"><h4 class="row-video-title">${escape(title)}</h4>${videoMarkup(m,`${title}, ${m.method}, ${m.outcome}`)}<div class="video-meta"><strong>${escape(m.method)}</strong>${outcome(m.outcome)}</div></article>`))).join('');
    const comparison = document.querySelector('#comparison-grid');
    comparison.innerHTML = media.filter(m=>m.group==='comparison').sort((a,b)=>a.trial-b.trial||b.method.localeCompare(a.method)).map(m=>`<article class="video-card" data-trial-card="${m.trial}"><h4 class="row-video-title">Trial ${m.trial}</h4>${videoMarkup(m,`Bend and pick trial ${m.trial}, ${m.method}, ${m.outcome}`)}<div class="video-meta"><strong>${escape(m.method)}</strong>${outcome(m.outcome)}</div></article>`).join('');
    const homes = document.querySelector('#homes-grid');
    homes.innerHTML = media.filter(m=>m.group==='homes').map((m,index)=>`<article class="home-card">${videoMarkup(m,`Sequence ${index+1}, ${m.tasks.length} tasks, 3 times speed`)}<div class="home-heading"><h3>Sequence ${String(index+1).padStart(2,'0')}</h3></div><ol class="task-sequence" aria-label="Task execution order">${m.tasks.map(task=>`<li>${escape(task)}</li>`).join('')}</ol></article>`).join('');
    register(starts); register(station); register(comparison); register(homes);
    document.querySelectorAll('[data-task]').forEach(button=>button.addEventListener('click',()=>{
      document.querySelectorAll('[data-task]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});
      starts.querySelectorAll('[data-task-group]').forEach(group=>{group.hidden=button.dataset.task!=='all'&&group.dataset.taskGroup!==button.dataset.task;group.querySelectorAll('video').forEach(video=>{if(group.hidden)video.pause();else if(visible.has(video))play(video);});});
    }));
  } catch(error) { document.querySelector('.load-error').hidden=false; console.error(error); }
  const realVideo = document.querySelector('#real-video');
  if (realVideo) {
    realVideo.muted = true;
    realVideo.defaultMuted = true;
    realVideo.volume = 0;
    realVideo.addEventListener('volumechange', () => {
      if (!realVideo.muted || realVideo.volume !== 0) {
        realVideo.muted = true;
        realVideo.volume = 0;
      }
    });
    observer.observe(realVideo);
    const player = document.querySelector('#real-player');
    const chapters = [...document.querySelectorAll('.chapter-card')];
    const marks = chapters.map(card => Number(card.dataset.time));
    const playBtn = document.querySelector('#real-play');
    const fullBtn = document.querySelector('#real-full');
    const seek = document.querySelector('#real-seek');
    const clock = document.querySelector('#real-time');
    const fmt = value => { const s = Math.max(0, Math.floor(value || 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
    const updateUI = time => {
      const index = time >= marks[2] ? 2 : time >= marks[1] ? 1 : 0;
      chapters.forEach((card, i) => card.classList.toggle('active', i === index));
      seek.value = time;
      clock.textContent = `${fmt(time)} / ${fmt(Math.ceil(realVideo.duration || Number(seek.max)))}`;
    };
    const togglePlay = () => { realVideo.muted = true; realVideo.volume = 0; if (realVideo.paused) realVideo.play().catch(() => {}); else realVideo.pause(); };
    const syncPlay = () => {
      const isPaused = realVideo.paused;
      playBtn.textContent = isPaused ? 'Play' : 'Pause';
      playBtn.setAttribute('aria-label', isPaused ? 'Play video' : 'Pause video');
    };
    playBtn.addEventListener('click', togglePlay);
    realVideo.addEventListener('click', togglePlay);
    realVideo.addEventListener('play', syncPlay);
    realVideo.addEventListener('pause', () => { syncPlay(); updateUI(realVideo.currentTime); });
    realVideo.addEventListener('ended', () => { syncPlay(); updateUI(realVideo.currentTime); });
    realVideo.addEventListener('timeupdate', () => updateUI(realVideo.currentTime));
    realVideo.addEventListener('seeked', () => updateUI(realVideo.currentTime));
    realVideo.addEventListener('loadedmetadata', () => { seek.max = realVideo.duration; updateUI(realVideo.currentTime); });
    seek.addEventListener('input', () => { const time = Number(seek.value); realVideo.currentTime = time; updateUI(time); });
    fullBtn.addEventListener('click', () => { if (document.fullscreenElement) document.exitFullscreen(); else if (player.requestFullscreen) player.requestFullscreen().catch(() => {}); });
    chapters.forEach(card => card.addEventListener('click', () => { const time = Number(card.dataset.time); realVideo.currentTime = time; updateUI(time); realVideo.play().catch(() => {}); }));
    updateUI(0);
  }
  const links=[...document.querySelectorAll('.header nav a')];
  const navObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting)links.forEach(link=>{const current=link.hash===`#${entry.target.id}`;link.classList.toggle('active',current);if(current)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});}),{rootMargin:'-15% 0px -65% 0px'});
  links.forEach(link=>navObserver.observe(document.querySelector(link.hash)));
})();
