import Store from '../lib/Store';
import Dispatcher from '../Dispatcher';
import {ActionTypes} from '../Constants';

let sharedElements = {};
let owners = {};

function createElement(id) {
  const element = document.createElement('div');
  element.id = id;
  return element;
}

function handleDestroy({id}) {
  sharedElements = {...sharedElements};
  owners = {...owners};
  delete sharedElements[id];
  delete owners[id];
}

function handleTransferOwnership({id, ownerId}) {
  if (sharedElements[id] == null) {
    return false;
  }
  owners[id] = ownerId;
}

class SharedDOMElementStore extends Store {
  getFreeElement(id, ownerId) {
    let element = sharedElements[id];
    if (element == null) {
      sharedElements[id] = element = createElement(id);
      owners[id] = ownerId;
      return element;
    } else if (owners[id] == null || owners[id] === ownerId) {
      return element;
    }
    return null;
  }

  getOwnedNode(ownerId) {
    let ownedItem = null;
    Object.keys(owners).find(id => {
      if (owners[id] === ownerId) {
        ownedItem = id;
        return true;
      }
      return false;
    });
    return sharedElements[ownedItem];
  }

  getElement(id) {
    return sharedElements[id] || null;
  }

  getOwner(id) {
    return owners[id] || null;
  }
}

export default new SharedDOMElementStore(Dispatcher, action => {
  switch (action.type) {
    case ActionTypes.SHARED_NODE_DESTROY:
      return handleDestroy(action);
    case ActionTypes.SHARED_NODE_TRANSFER_OWNERSHIP:
      return handleTransferOwnership(action);
    default:
      return false;
  }
});
