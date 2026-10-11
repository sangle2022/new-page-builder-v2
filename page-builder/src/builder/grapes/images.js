import { AI } from '../../api/client';

// Image placeholders carry data-pb-image-prompt (and data-pb-image-size).
// They come from templates, AI page generation and AI edits. This fills them
// one at a time (each request stays short), reusing gallery images when a
// similar one exists.

export function findImagePlaceholders(editor) {
  const wrapper = editor && editor.getWrapper();
  return wrapper ? wrapper.find('[data-pb-image-prompt]') : [];
}

function setImage(component, url) {
  const isImg = component.get('type') === 'image' || component.get('tagName') === 'img';
  if (isImg) {
    component.set('src', url);
    component.addAttributes({ src: url });
  } else {
    component.addStyle({ 'background-image': `url('${url}')` });
  }
  component.removeAttributes(['data-pb-image-prompt', 'data-pb-image-size']);
}

export async function fillImage(component, { pageId } = {}) {
  const attrs = component.getAttributes();
  const prompt = attrs['data-pb-image-prompt'];
  if (!prompt) return null;
  const res = await AI.generateImage({ prompt, size: attrs['data-pb-image-size'], pageId, reuseExisting: true });
  setImage(component, res.image.url);
  if (!attrs.alt && component.get('tagName') === 'img') component.addAttributes({ alt: res.image.name || prompt.slice(0, 80) });
  return res;
}

// onProgress({ done, total, reused, generated, failed, current })
export async function fillAllImages(editor, { pageId, onProgress, shouldStop } = {}) {
  const list = findImagePlaceholders(editor);
  const stats = { done: 0, total: list.length, reused: 0, generated: 0, failed: 0, errors: [] };
  for (const component of list) {
    if (shouldStop && shouldStop()) break;
    if (onProgress) onProgress({ ...stats, current: component.getAttributes()['data-pb-image-prompt'] });
    try {
      // eslint-disable-next-line no-await-in-loop
      const res = await fillImage(component, { pageId });
      if (res && res.reused) stats.reused += 1;
      else stats.generated += 1;
    } catch (e) {
      stats.failed += 1;
      stats.errors.push(e.message);
      if (e.status === 503 || e.status === 403) break; // AI not available: stop trying
    }
    stats.done += 1;
    if (onProgress) onProgress({ ...stats });
  }
  return stats;
}

// Use a picked gallery image for a placeholder or image component.
export function replaceImage(component, url) {
  setImage(component, url);
}

const isImageComponent = (c) => c && (c.get('type') === 'image' || c.get('tagName') === 'img');

// Put a gallery image on the selected component: replace it when it is an
// image (or an image placeholder), otherwise add it inside. Returns the
// component that now shows the image.
export function attachImage(editor, selected, img) {
  if (!selected) return null;
  const placeholderBg = !isImageComponent(selected) && selected.getAttributes()['data-pb-image-prompt'];
  if (isImageComponent(selected) || placeholderBg) {
    setImage(selected, img.url);
    if (isImageComponent(selected)) selected.addAttributes({ alt: selected.getAttributes().alt || img.name || '' });
    return selected;
  }
  const alt = String(img.prompt || img.name || 'Image').replace(/["<>]/g, '').slice(0, 120);
  const [added] = selected.append(`<img src="${img.url}" alt="${alt}" style="width:100%;height:auto;border-radius:16px">`);
  if (added) editor.select(added);
  return added || null;
}

// Tell open gallery views that a new image was saved.
export const notifyMediaChanged = () => window.dispatchEvent(new Event('pb:media-changed'));
