import Store from './lib/Store';
import Dispatcher from './Dispatcher';
import {ActionTypes} from './Constants';

let count = 0;

function handleCount() {
  count++;
}

class CounterStore extends Store {
  get count() {
    return count;
  }
}

export default new CounterStore(Dispatcher, action => {
  switch (action.type) {
    case ActionTypes.INCREMENT_COUNTER:
      return handleCount();
    default:
      return false;
  }
});
