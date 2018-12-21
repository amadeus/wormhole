// @flow

import * as React from 'react';
import {createPortal} from 'react-dom';

type ItemID = string;
type ItemNode = HTMLElement;

type TargetID = string;
type TargetNode = HTMLElement;

type WormholeProps = {|
  children: React.Node,
|};

type RenderFunction = (targets: {[TargetID]: TargetNode}, renderItemToTarget: (ItemID, TargetID) => void) => React.Node;

type WormholeState = {|
  items: {[ItemID]: [() => RenderFunction, ItemNode]},
  targets: {[TargetID]: TargetNode},
  renderItemToTarget: (ItemID, TargetID) => void,

  __toRender: Array<[RenderFunction, TargetNode | ItemNode, ItemID]>,
  __registerTarget: (TargetID, TargetNode) => void,
  __deleteTarget: TargetID => void,
  __registerItem: (ItemID, RenderFunction, ItemNode) => void,
  __deleteItem: ItemID => void,
|};

let instance = false;

const Context = React.createContext<WormholeState>({
  items: {},
  targets: {},
  renderItemToTarget: () => {},
  __toRender: [],
  __registerTarget: () => {},
  __deleteTarget: () => {},
  __registerItem: () => {},
  __deleteItem: () => {},
});

type ItemCoreProps = {|
  id: ItemID,
  __context: WormholeState,
  children: RenderFunction,
|};

class ItemCore extends React.Component<ItemCoreProps> {
  ref: {current: null | HTMLDivElement} = React.createRef();

  componentDidMount() {
    const {
      props: {__context, id, children},
      ref: {current},
    } = this;
    if (current != null) {
      __context.__registerItem(id, children, current);
    }
  }

  componentWillUnmount() {
    const {__context, id} = this.props;
    __context.__deleteTarget(id);
  }

  render() {
    return <div ref={this.ref} />;
  }
}

type ItemProps = {|
  id: ItemID,
  children: RenderFunction,
|};

const Item = ({children, id}: ItemProps) => (
  <Context.Consumer>
    {context => (
      <ItemCore __context={context} id={id}>
        {children}
      </ItemCore>
    )}
  </Context.Consumer>
);

type TargetCoreProps = {|
  id: TargetID,
  className?: ?string,
  __context: WormholeState,
|};

class TargetCore extends React.Component<TargetCoreProps> {
  ref: {current: null | HTMLDivElement} = React.createRef();

  componentDidMount() {
    const {
      props: {__context, id},
      ref: {current},
    } = this;
    if (current != null) {
      __context.__registerTarget(id, current);
    }
  }

  componentWillUnmount() {
    const {__context, id} = this.props;
    __context.__deleteTarget(id);
  }

  render() {
    const {
      ref,
      props: {className, id},
    } = this;
    return <div ref={ref} id={id} className={className} />;
  }
}

type TargetProps = {|
  id: TargetID,
  className?: ?string,
|};

const Target = ({id, className}: TargetProps) => (
  <Context.Consumer>{context => <TargetCore __context={context} id={id} className={className} />}</Context.Consumer>
);

class Wormhole extends React.PureComponent<WormholeProps, WormholeState> {
  static Context = Context;
  static Item = Item;
  static Target = Target;

  constructor(props: WormholeProps) {
    super(props);
    if (instance) {
      throw new Error('Wormhole.constructor: Only one instance allowed at a time');
    }
    instance = true;
    this.state = {
      items: {},
      targets: {},
      renderItemToTarget: this.renderItemToTarget,
      __toRender: [],
      __registerTarget: this.registerTarget,
      __deleteTarget: this.deleteTarget,
      __registerItem: this.registerItem,
      __deleteItem: this.deleteItem,
    };
  }

  componentWillUnmount() {
    instance = false;
  }

  registerTarget = (id: TargetID, node: TargetNode) => {
    this.setState(({targets}) => ({
      targets: {
        ...targets,
        [id]: node,
      },
    }));
  };

  deleteTarget = (id: TargetID) => {
    this.setState({});
  };

  registerItem = (id: ItemID, renderFunction: RenderFunction, node: ItemNode) => {
    this.setState(({items, __toRender}) => {
      const newItems = {...items, [id]: [renderFunction, node]};
      const newToRender = [...__toRender, [renderFunction, node, id]];
      return {
        items: newItems,
        __toRender: newToRender,
      };
    });
  };

  deleteItem = (id: ItemID) => {
    this.setState(({items, __toRender}) => {
      const newItems = {...items};
      delete newItems[id];

      let index = -1;
      let toRender = null;
      __toRender.find((item, i) => {
        if (item[2] === id && item[1] === items[id][1]) {
          index = i;
          return true;
        }
        return false;
      });
      if (index > -1) {
        toRender = [...__toRender];
        toRender.splice(index, 1);
      }

      return {
        items: newItems,
        __toRender: toRender || __toRender,
      };
    });
  };

  renderItemToTarget = (itemID: ItemID, targetID: TargetID) => {
    this.setState(({__toRender, targets, items}) => {
      const targetNode = targets[targetID];
      if (items[itemID] == null) {
        console.warn(`Wormhole.renderItemToTarget: Invalud itemID ${itemID}`);
        return {};
      }
      if (targetNode == null) {
        console.warn(`Wormhole.renderItemToTarget: Invalud targetID ${targetID}`);
        return {};
      }

      let toRender = null;
      let newItem;
      __toRender.find((item, index) => {
        if (item[2] === itemID) {
          newItem = [...item];
          newItem[1] = targetNode;
          toRender = [...__toRender];
          toRender.splice(index, 1, newItem);
          return true;
        }
        return false;
      });

      return {__toRender: toRender || __toRender};
    });
  };

  render() {
    const {
      props: {children},
      state: {__toRender, targets},
    } = this;
    return (
      <Context.Provider value={this.state}>
        {children}
        {__toRender.map(([render, node]) => createPortal(render(targets, this.renderItemToTarget), node))}
      </Context.Provider>
    );
  }
}

export default Wormhole;
