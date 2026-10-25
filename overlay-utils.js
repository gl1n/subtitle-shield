(() => {
  const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);

  function centerRegion(region) {
    return region ? { ...region, x: (1 - region.w) / 2 } : region;
  }

  function normalizePoint(clientX, clientY, rect) {
    if (!rect || !rect.width || !rect.height) return { x: 0, y: 0 };
    return {
      x: clamp((clientX - rect.left) / rect.width),
      y: clamp((clientY - rect.top) / rect.height),
    };
  }

  function containRect(box, videoWidth, videoHeight) {
    if (!box || !videoWidth || !videoHeight) return box;
    const videoRatio = videoWidth / videoHeight;
    const boxRatio = box.width / box.height;
    let width = box.width;
    let height = box.height;
    if (videoRatio > boxRatio) height = width / videoRatio;
    else width = height * videoRatio;
    return {
      left: box.left + (box.width - width) / 2,
      top: box.top + (box.height - height) / 2,
      width,
      height,
      right: box.left + (box.width + width) / 2,
      bottom: box.top + (box.height + height) / 2,
    };
  }

  function shouldEnterEdit(isTopFrame, hasVisiblePlayerIframe) {
    return !(isTopFrame && hasVisiblePlayerIframe);
  }

  function defaultState() {
    return { enabled: false, region: null, autoCenter: true };
  }

  globalThis.DmShieldUtils = { centerRegion, normalizePoint, containRect, shouldEnterEdit, defaultState };
})();
