'use strict';
(async () => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let paused = reduced;
  const visible = new Set();
  const toggle = document.querySelector('#pause-all');
  const play = video => {
    if (paused || document.hidden || video.closest('[hidden]')) return;
    if (!video.getAttribute('src')) { video.src = video.dataset.src; video.load(); }
    video.play().catch(() => {});
  };
  const observer = new IntersectionObserver(entries => entries.forEach(({target, isIntersecting}) => {
    if (isIntersecting) { visible.add(target); play(target); }
    else { visible.delete(target); target.pause(); }
  }), {threshold: .08});
  const register = root => root.querySelectorAll('video').forEach(video => {
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
  const videoMarkup = (m,label) => `<div class="media-frame"><video controls muted loop playsinline preload="none" data-src="${escape(m.src)}" poster="${escape(m.poster)}" aria-label="${escape(label)}"></video></div>`;
  const outcome = value => `<span class="outcome ${value.toLowerCase()}">${value}</span>`;
  try {
    const response = await fetch('video-manifest.json');
    if (!response.ok) throw new Error('Manifest unavailable');
    const media = await response.json();
    const tasks = [['close_door','Close door'],['open_oven','Open oven'],['open_trash_can','Open trash can'],['push_office_chair','Push office chair'],['bend_pick','Bend & pick']];
    const starts = document.querySelector('#starts-grid');
    starts.innerHTML = tasks.map(([key,title]) => `<div class="task-group" data-task-group="${key}"><div class="task-heading"><h3>${escape(title)}</h3><span>4 initial positions</span></div><div class="starts-row">${media.filter(m=>m.group==='starts'&&m.task===key).sort((a,b)=>a.start-b.start).map(m=>`<article class="video-card">${videoMarkup(m,`${title}, initial position ${m.start}, 5 times speed`)}<div class="video-meta"><strong>Initial position ${String(m.start).padStart(2,'0')}</strong><span>5×</span></div></article>`).join('')}</div></div>`).join('');
    const station = document.querySelector('#station-grid');
    station.innerHTML = [['open_oven','Open oven'],['open_trash_can','Open trash can'],['bend_pick','Bend & pick']].map(([key,title])=>`<div class="station-column"><h3>${escape(title)}</h3>${media.filter(m=>m.group==='station'&&m.task===key).sort((a,b)=>a.method.localeCompare(b.method)).map(m=>`<article class="video-card">${videoMarkup(m,`${title}, ${m.method}, ${m.outcome}`)}<div class="video-meta"><strong>${escape(m.method)}</strong>${outcome(m.outcome)}</div></article>`).join('')}</div>`).join('');
    const comparison = document.querySelector('#comparison-grid');
    // Keep both trials in the DOM; switching trials pauses the hidden pair.
    comparison.innerHTML = media.filter(m=>m.group==='comparison').sort((a,b)=>a.trial-b.trial||b.method.localeCompare(a.method)).map(m=>`<article class="video-card" data-trial-card="${m.trial}" ${m.trial!==1?'hidden':''}>${videoMarkup(m,`Bend and pick trial ${m.trial}, ${m.method}, ${m.outcome}`)}<div class="video-meta"><strong>${escape(m.method)}</strong>${outcome(m.outcome)}</div></article>`).join('');
    const homes = document.querySelector('#homes-grid');
    homes.innerHTML = media.filter(m=>m.group==='homes').map((m,index)=>`<article class="home-card">${videoMarkup(m,`${m.title}, ${m.tasks.length} tasks, 5 times speed`)}<div class="home-heading"><h3>${escape(m.title)}</h3><span>Home ${String(index+1).padStart(2,'0')} · ${m.tasks.length} tasks</span></div><ol class="task-sequence" aria-label="Task execution order">${m.tasks.map(task=>`<li>${escape(task)}</li>`).join('')}</ol></article>`).join('');
    register(starts); register(station); register(comparison); register(homes);
    document.querySelectorAll('[data-task]').forEach(button=>button.addEventListener('click',()=>{
      document.querySelectorAll('[data-task]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});
      starts.querySelectorAll('[data-task-group]').forEach(group=>{group.hidden=button.dataset.task!=='all'&&group.dataset.taskGroup!==button.dataset.task;group.querySelectorAll('video').forEach(video=>{if(group.hidden)video.pause();else if(visible.has(video))play(video);});});
    }));
    document.querySelectorAll('[data-trial]').forEach(button=>button.addEventListener('click',()=>{
      document.querySelectorAll('[data-trial]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});
      comparison.querySelectorAll('[data-trial-card]').forEach(card=>{card.hidden=card.dataset.trialCard!==button.dataset.trial;card.querySelectorAll('video').forEach(video=>{if(card.hidden)video.pause();else if(visible.has(video))play(video);});});
    }));
  } catch(error) { document.querySelector('.load-error').hidden=false; console.error(error); }
  const links=[...document.querySelectorAll('.header nav a')];
  const navObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting)links.forEach(link=>{const current=link.hash===`#${entry.target.id}`;link.classList.toggle('active',current);if(current)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});}),{rootMargin:'-15% 0px -65% 0px'});
  links.forEach(link=>navObserver.observe(document.querySelector(link.hash)));
})();
