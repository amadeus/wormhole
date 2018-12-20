let reqID = null;
const storesToDispatch = new Set();

function emitChanges() {
  storesToDispatch.forEach(store => store.emitChange());
  storesToDispatch.clear();
}

class Store {
  constructor(Dispatcher, handler) {
    Dispatcher.subscribe(action => {
      const returnValue = handler(action);
      if (returnValue === false) {
        return;
      }
      this.queueEmitChange();
    });

    this.handlers = new Set();
  }

  addChangeListener(method) {
    this.handlers.add(method);
  }

  removeChangeListener(method) {
    this.handlers.delete(method);
  }

  queueEmitChange() {
    if (storesToDispatch.size === 0) {
      cancelAnimationFrame(reqID);
      reqID = requestAnimationFrame(emitChanges);
    }
    storesToDispatch.add(this);
  }

  emitChange() {
    if (this.handlers.size > 0) {
      this.handlers.forEach(method => method());
    }
  }
}

export default Store;
