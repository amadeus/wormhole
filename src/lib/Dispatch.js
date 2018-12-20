import EventEmitter from 'events';

const ACTION = 'ACTION';

class Dispatch extends EventEmitter {
  dispatch(action) {
    this.emit(ACTION, action);
  }

  subscribe(method) {
    this.on(ACTION, method);
  }

  unsubscribe(method) {
    this.off(ACTION, method);
  }
}

export default Dispatch;
