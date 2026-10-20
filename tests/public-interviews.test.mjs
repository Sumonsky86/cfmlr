import test from 'node:test';
import assert from 'node:assert/strict';
import { entrevistas } from '../src/data/interviews.ts';

test('el catálogo público se puede verificar sin bundler y conserva los IDs de origen', async () => {
  const { publicInterviewGroups } = await import('../src/data/public-interviews.ts');
  const videos = publicInterviewGroups.flatMap(group => group.items);
  assert.deepEqual(videos.map(video => video.id).sort(), Object.values(entrevistas).flat().map(video => video.id).sort());
  assert.equal(new Set(videos.map(video => video.id)).size, 14);
  for (const video of videos) {
    assert.ok(video.title.trim() && video.sourceTitle.trim());
    assert.equal(video.url, `https://www.youtube.com/watch?v=${video.id}`);
  }
  assert.equal(videos.find(video => video.id === 'eruZqiTysJA').title, 'Prevención del cáncer de mama');
  assert.equal(videos.find(video => video.id === '39Wd_DulN4M').title, 'La artrosis');
  assert.equal(publicInterviewGroups.find(group => group.id === 'gineco').doctor, 'Dr. Alfonso Alamo');
  assert.equal(publicInterviewGroups.find(group => group.id === 'vascular').doctor, 'Dr. Alejandro Alamo');
});
