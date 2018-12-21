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

type RenderToTarget = (ItemID, TargetID) => void;

type RenderFunction = (
  currentTarget: TargetID,
  targets: {[TargetID]: TargetNode},
  renderItemToTarget: RenderToTarget
) => React.Node;

type ToRenderProps = {|
  id: ItemID,
  targetID: TargetID,
  render: RenderFunction,
  renderNode: ItemNode,
|};

type WormholeState = {|
  items: {[ItemID]: ToRenderProps},
  targets: {[TargetID]: TargetNode},
  renderItemToTarget: (ItemID, TargetID) => void,

  __registerTarget: (TargetID, TargetNode) => void,
  __deleteTarget: TargetID => void,
  __registerItem: (ItemID, RenderFunction, ItemNode, TargetNode) => void,
  __deleteItem: ItemID => void,
|};

let instance = false;

const Context = React.createContext<WormholeState>({
  items: {},
  targets: {},
  renderItemToTarget: () => {},
  __registerTarget: () => {},
  __deleteTarget: () => {},
  __registerItem: () => {},
  __deleteItem: () => {},
});

type ItemCoreProps = {|
  id: ItemID,
  className?: ?string,
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
      __context.__registerItem(id, children, document.createElement('div'), current);
    }
  }

  componentWillUnmount() {
    const {__context, id} = this.props;
    __context.__deleteTarget(id);
  }

  render() {
    return <div ref={this.ref} className={this.props.className} />;
  }
}

type ItemProps = {|
  id: ItemID,
  className?: ?string,
  children: RenderFunction,
|};

const Item = ({children, id, className}: ItemProps) => (
  <Context.Consumer>
    {context => (
      <ItemCore __context={context} id={id} className={className}>
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
    this.setState(({targets}) => ({targets: {...targets, [id]: node}}));
  };

  deleteTarget = (id: TargetID) => {
    this.setState(({targets}) => {
      const newTargets = {...targets};
      delete newTargets[id];
      return {targets: newTargets};
    });
  };

  registerItem = (id: ItemID, render: RenderFunction, renderNode: ItemNode, targetNode: TargetNode) => {
    this.setState(({items, targets}) => {
      const newItems = {...items, [id]: {id, targetID: id, render, renderNode}};
      const newTargets = {...targets, [id]: targetNode};
      targetNode.appendChild(renderNode);
      return {items: newItems, targets: newTargets};
    });
  };

  deleteItem = (id: ItemID) => {
    // FIXME: This won't work well in practice because if an item
    // gets unmounted, it will also remove it from the target.
    this.setState(({items, targets}) => {
      const newTargets = {...targets};
      delete newTargets[id];

      const newItems = {...items};
      delete newItems[id];

      return {
        targets: newTargets,
        items: newItems,
      };
    });
  };

  renderItemToTarget = (itemID: ItemID, targetID: TargetID) => {
    this.setState(({targets, items}) => {
      const targetNode = targets[targetID];
      if (targetNode == null) {
        console.warn(`Wormhole.renderItemToTarget: Invalid targetID: ${targetID}`);
        return {};
      }

      let item = items[itemID];
      if (item == null) {
        console.warn(`Wormhole.renderItemToTarget: Invalid itemID: ${itemID}`);
        return {};
      }
      if (item.targetID === targetID) {
        console.warn(`Wormhole.renderItemToTarget: Already in targetID: ${targetID}`);
        return {};
      }
      targetNode.appendChild(item.renderNode);
      return {
        items: {
          ...items,
          [itemID]: {
            ...item,
            targetID: targetID,
          },
        },
      };
    });
  };

  render() {
    const {
      props: {children},
      state: {items, targets},
    } = this;
    return (
      <Context.Provider value={this.state}>
        {children}
        {Object.keys(items).map(key => {
          const {render, renderNode, targetID} = items[key];
          return createPortal(render(targetID, targets, this.renderItemToTarget), renderNode);
        })}
      </Context.Provider>
    );
  }
}

export default Wormhole;
