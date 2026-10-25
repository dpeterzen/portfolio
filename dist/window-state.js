// The window state is independent of layout so minimize/focus/restore stay predictable.
(function (root) {
  'use strict';
  class DesktopState {
    constructor(ids) {
      this.windows = new Map(ids.map(id => [id, {id, open:false, minimized:false, maximized:false, z:0}]));
      this.active = null; this.order = 0; this.hiddenSet = [];
    }
    get(id) { const item = this.windows.get(id); if (!item) throw new Error(`Unknown window: ${id}`); return item; }
    focus(id) { const item = this.get(id); if (!item.open || item.minimized) return; item.z = ++this.order; this.active = id; }
    open(id) { const item = this.get(id); item.open = true; item.minimized = false; this.hiddenSet = []; this.focus(id); }
    chooseActive() { this.active = [...this.windows.values()].filter(item => item.open && !item.minimized).sort((a,b)=>b.z-a.z)[0]?.id || null; }
    minimize(id) { const item = this.get(id); if (!item.open) return; item.minimized = true; this.chooseActive(); }
    close(id) { const item = this.get(id); item.open = false; item.minimized = false; this.hiddenSet = this.hiddenSet.filter(value=>value!==id); this.chooseActive(); }
    maximize(id) { const item = this.get(id); if (!item.open || item.minimized) return; item.maximized = !item.maximized; this.focus(id); }
    task(id) { const item = this.get(id); if (!item.open || item.minimized || this.active !== id) this.open(id); else this.minimize(id); }
    desktop() {
      if (this.hiddenSet.length) {
        const restore = this.hiddenSet.slice(); this.hiddenSet = [];
        for (const id of restore) { const item=this.get(id); if(item.open) {item.minimized=false;this.focus(id);} }
      } else {
        this.hiddenSet = [...this.windows.values()].filter(item=>item.open&&!item.minimized).sort((a,b)=>a.z-b.z).map(item=>item.id);
        for (const id of this.hiddenSet) this.get(id).minimized=true;
        this.active=null;
      }
    }
  }
  if (typeof module === 'object' && module.exports) module.exports = DesktopState;
  else root.DesktopState = DesktopState;
})(typeof window === 'undefined' ? globalThis : window);
