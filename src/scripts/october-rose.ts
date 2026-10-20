import { isOctoberRoseActive, nextOctoberRoseBoundary } from '../utils/october-rose';

let timer: ReturnType<typeof setTimeout> | undefined;
function updateOctoberCampaign() {
  if (timer !== undefined) clearTimeout(timer);
  const now = new Date();
  const active = isOctoberRoseActive(now);
  document.querySelectorAll<HTMLElement>('[data-october-rose]').forEach(element => {
    element.hidden = !active;
  });
  const next = nextOctoberRoseBoundary(now);
  if (next !== null) {
    timer = setTimeout(updateOctoberCampaign, Math.min(Math.max(next - now.getTime(), 1), 2_147_483_647));
  }
}
updateOctoberCampaign();
window.addEventListener('pageshow', updateOctoberCampaign);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') updateOctoberCampaign();
});
