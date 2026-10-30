'use strict';
const $ = (selector) => document.querySelector(selector);
const releasePage = 'https://github.com/polardev-ui/koreos/releases/latest';
const shots = {
 explorer: {name: 'Kore Explorer', description: 'Your files, folders, and favorite places, with a classic task pane and a familiar way to get around.'},
 paint: {name: 'Kore Paint', description: 'A blank canvas, a familiar toolbox, and room for a little creativity. Make something just because you can.'},
 calculator: {name: 'Kore Calculator', description: 'Simple, familiar, and ready when you need it. One of the everyday essentials included with KoreOS.'}
};
document.querySelectorAll('[data-shot]').forEach(button => button.addEventListener('click', () => {
 const key = button.dataset.shot;
 document.querySelectorAll('[data-shot]').forEach(other => {other.classList.toggle('selected', other === button);other.setAttribute('aria-pressed', String(other === button));});
 $('#gallery-image').src = `assets/${key}.png`;
 $('#gallery-image').alt = `${shots[key].name} running in KoreOS`;
 $('#gallery-description').textContent = shots[key].description;
 $('#gallery-zoom').dataset.image = `assets/${key}.png`;
 $('#gallery-zoom').dataset.caption = shots[key].name;
}));
document.querySelectorAll('[data-image]').forEach(button => button.addEventListener('click', () => {
 $('#dialog-image').src = button.dataset.image;
 $('#dialog-image').alt = button.dataset.caption;
 $('#image-caption').textContent = button.dataset.caption;
 $('#image-dialog').showModal();
}));
$('#close-dialog').addEventListener('click', () => $('#image-dialog').close());
$('#image-dialog').addEventListener('click', (event) => {if(event.target === $('#image-dialog')) $('#image-dialog').close();});
function setMenu(open) {$('#start-menu').hidden = !open;$('#start-button').setAttribute('aria-expanded', String(open));}
$('#start-button').addEventListener('click', () => setMenu($('#start-menu').hidden));
document.addEventListener('click', event => {if(!event.target.closest('#start-menu, #start-button')) setMenu(false);});
document.addEventListener('keydown', event => {if(event.key === 'Escape') setMenu(false);});
function restore() {$('#site-window').hidden = false;$('#minimized-message').hidden = true;}
function minimize() {$('#site-window').hidden = true;$('#minimized-message').hidden = false;}
$('#minimize').addEventListener('click', minimize);
$('#restore').addEventListener('click', restore);
$('#task-button').addEventListener('click', restore);
$('#maximize').addEventListener('click', () => {const expanded = $('#site-window').classList.toggle('maximized');$('#maximize').setAttribute('aria-pressed',String(expanded));});
document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', () => {restore();setMenu(false);}));
function clock() {$('#clock').textContent = new Date().toLocaleTimeString([], {hour:'numeric', minute:'2-digit'});$('#clock').dateTime = new Date().toISOString();}
clock();setInterval(clock, 30000);
if ('IntersectionObserver' in window) {
 const observer = new IntersectionObserver(entries => {
  const visible = entries.filter(entry => entry.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
  if(!visible) return;
  const id = visible.target.id;
  $('#location-name').textContent = id;
  document.querySelectorAll('nav a[href^="#"]').forEach(link => link.classList.toggle('active',link.hash === '#'+id));
 }, {rootMargin:'-10% 0px -50% 0px',threshold:[0,.1,.5]});
 document.querySelectorAll('main>section[id]').forEach(section=>observer.observe(section));
}
function safeGithubUrl(url) {
 try {const parsed = new URL(url);return parsed.protocol === 'https:' && parsed.hostname === 'github.com' && parsed.pathname.startsWith('/polardev-ui/koreos/releases/') ? parsed.href : null;} catch {return null;}
}
function applyRelease(release) {
 if (!Array.isArray(release.assets) || typeof release.tag_name !== 'string') throw new Error('Unexpected release data');
 $('#release-name').textContent = release.name || `KoreOS ${release.tag_name}`;
 $('#release-link').href = safeGithubUrl(release.html_url) || releasePage;
 for (const arch of ['arm64','amd64','intel']) {
  const asset = release.assets.find(file => new RegExp(`(?:^|[-_.])${arch}\\.iso$`, 'i').test(file.name));
  const link = $(`[data-arch="${arch}"]`);
  const detail = $(`[data-checksum="${arch}"]`);
  const download = asset && safeGithubUrl(asset.browser_download_url);
  if (!download) {
   link.href = releasePage;link.textContent = 'View available releases ↗';
   $(`[data-meta="${arch}"]`).textContent = 'No ISO for this platform in the latest release';
   detail.hidden = true; continue;
  }
  link.href = download;link.removeAttribute('aria-disabled');
  const size = Number.isFinite(asset.size) ? `${(asset.size / 1048576).toFixed(0)} MB · ` : '';
  const metaArch = arch === 'intel' ? 'INTEL' : arch.toUpperCase();
  $(`[data-meta="${arch}"]`).textContent = `${size}${metaArch} · ${arch === 'arm64' ? 'UEFI' : 'BIOS + UEFI'}`;
  const digest = /^sha256:[a-f\d]{64}$/i.test(asset.digest || '') ? asset.digest.slice(7) : null;
  detail.hidden = !digest;
  if(digest) {detail.querySelector('code').textContent = digest;detail.querySelector('button').dataset.hash = digest;}
 }
}
async function loadRelease() {
 try {
  const response = await fetch('https://api.github.com/repos/polardev-ui/koreos/releases/latest', {headers:{Accept:'application/vnd.github+json'},signal:AbortSignal.timeout(10000),cache:'no-cache'});
  if(!response.ok) throw new Error(`GitHub ${response.status}`);
  const release = await response.json(); applyRelease(release);
  $('#release-status').textContent = `Latest release from GitHub · Published ${new Date(release.published_at).toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'})}`;
 } catch {
  $('#release-status').textContent = 'GitHub could not be reached. Open the latest release below to choose your ISO.';
  document.querySelectorAll('.download-link').forEach(link => {link.href = releasePage;link.textContent = 'View latest release ↗';});
 }
}
document.querySelectorAll('.copy-hash').forEach(button => button.addEventListener('click', async () => {
 try {await navigator.clipboard.writeText(button.dataset.hash);button.textContent='Copied!';setTimeout(()=>button.textContent='Copy SHA-256',1800);}
 catch {button.textContent='Select and copy the checksum above';}
}));
loadRelease();
