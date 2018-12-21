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
  __registerItem: (ItemID, RenderFunction, ItemNode, ?string) => void,
  __deleteItem: ItemID => void,
|};

// NOTE: For now making this a singleton type component - since I am not sure
// of an elegant way to make instantiated contexts
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
  renderNodeClassName?: ?string,
  renderPlaceholder?: ?RenderFunction,
  __context: WormholeState,
  children: RenderFunction,
|};

class ItemCore extends React.Component<ItemCoreProps> {
  ref: {current: null | HTMLDivElement} = React.createRef();

  componentDidMount() {
    const {
      props: {__context, id, children, renderNodeClassName},
      ref: {current},
    } = this;
    if (current != null) {
      __context.__registerItem(id, children, current, renderNodeClassName);
    }
  }

  componentWillUnmount() {
    const {__context, id} = this.props;
    __context.__deleteItem(id);
  }

  renderPlaceholder() {
    const {__context, id, renderPlaceholder} = this.props;
    const item = __context.items[id];
    if (item == null || item.targetID === id || renderPlaceholder == null) {
      return null;
    }
    return renderPlaceholder(item.targetID, __context.targets, __context.renderItemToTarget);
  }

  render() {
    return (
      <div ref={this.ref} className={this.props.className}>
        {this.renderPlaceholder()}
      </div>
    );
  }
}

type ItemProps = {|
  id: ItemID,
  className?: ?string,
  renderNodeClassName?: ?string,
  renderPlaceholder?: ?RenderFunction,
  children: RenderFunction,
|};

export const Item = ({children, id, className, renderNodeClassName, renderPlaceholder}: ItemProps) => (
  <Context.Consumer>
    {context => (
      <ItemCore
        __context={context}
        id={id}
        className={className}
        renderNodeClassName={renderNodeClassName}
        renderPlaceholder={renderPlaceholder}>
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

export const Target = ({id, className}: TargetProps) => (
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

  registerItem = (id: ItemID, render: RenderFunction, targetNode: TargetNode, renderNodeClassName?: ?string) => {
    let renderNode;
    this.setState(
      ({items, targets}) => {
        const _item = items[id];
        let newItems = items;
        if (_item == null) {
          renderNode = document.createElement('div');
          renderNode.className = renderNodeClassName || '';
          newItems = {...items, [id]: {id, targetID: id, render, renderNode}};
        }
        const newTargets = {...targets, [id]: targetNode};
        return {items: newItems, targets: newTargets};
      },
      () => {
        renderNode != null && targetNode.appendChild(renderNode);
      }
    );
  };

  deleteItem = (id: ItemID) => {
    this.setState(({items, targets}) => {
      const newTargets = {...targets};
      delete newTargets[id];

      const item = items[id];
      let newItems = items;
      if (item.id === item.targetID) {
        newItems = {...items};
        delete newItems[id];
      }

      return {
        targets: newTargets,
        items: newItems,
      };
    });
  };

  renderItemToTarget = (itemID: ItemID, targetID: TargetID) => {
    let cleanupNode = null;
    this.setState(
      ({targets, items}) => {
        const targetNode = targets[targetID];
        let item = items[itemID];
        if (item == null) {
          console.warn(`Wormhole.renderItemToTarget: Invalid itemID: ${itemID}`);
          return {};
        }

        // If no valid target - queue node destruction
        if (targetNode == null) {
          cleanupNode = item.renderNode;
          const newItems = {...items};
          delete newItems[itemID];
          return {items: newItems};
        }

        if (item.targetID === targetID) {
          console.warn(`Wormhole.renderItemToTarget: Already in targetID: ${targetID}`);
          return {};
        }
        return {
          items: {
            ...items,
            [itemID]: {
              ...item,
              targetID: targetID,
            },
          },
        };
      },
      () => {
        if (cleanupNode == null) {
          const {items, targets} = this.state;
          const targetNode = targets[targetID];
          let item = items[itemID];
          if (item == null || targetNode == null) {
            console.warn(`Wormhole.renderItemToTarget: Somehow, someway, item or target nodes don't exist`);
            return;
          }
          targetNode.appendChild(item.renderNode);
        } else {
          const {parentNode} = cleanupNode;
          if (parentNode != null) {
            parentNode.removeChild(cleanupNode);
          }
        }
      }
    );
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
          return (
            <React.Fragment key={key}>
              {createPortal(render(targetID, targets, this.renderItemToTarget), renderNode)}
            </React.Fragment>
          );
        })}
      </Context.Provider>
    );
  }
}

export default Wormhole;
