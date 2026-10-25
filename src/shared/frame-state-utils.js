(() => {
  function stateScore(state) {
    return Number(state?.enabled) + Number(state?.hasRegion);
  }

  function selectFrameState(entries) {
    return entries
      .filter(entry => entry?.state)
      .sort((a, b) => stateScore(b.state) - stateScore(a.state))[0] || null;
  }

  globalThis.DmShieldFrameState = { selectFrameState };
})();
