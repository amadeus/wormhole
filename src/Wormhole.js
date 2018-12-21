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

type RenderFunction = (currentTarget: TargetID, targets: TargetID[], renderItemToTarget: RenderToTarget) => React.Node;

type ToRenderProps = {|
  id: ItemID,
  targetID: TargetID,
  render: RenderFunction,
  renderNode: ItemNode,
|};

type WormholeState = {|
  targets: TargetID[],
  targetNodes: {[TargetID]: TargetNode},
  renderItemToTarget: (ItemID, TargetID) => void,

  __toRender: Array<ToRenderProps>,
  __registerTarget: (TargetID, TargetNode) => void,
  __deleteTarget: TargetID => void,
  __registerItem: (ItemID, RenderFunction, ItemNode, TargetNode) => void,
  __deleteItem: ItemID => void,
|};

let instance = false;

const Context = React.createContext<WormholeState>({
  targets: [],
  targetNodes: {},
  renderItemToTarget: () => {},
  __toRender: [],
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
      targets: [],
      targetNodes: {},
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
    this.setState(({targets, targetNodes}) => ({
      targets: [...targets, id],
      targetNodes: {
        ...targetNodes,
        [id]: node,
      },
    }));
  };

  deleteTarget = (id: TargetID) => {
    this.setState(({targets, targetNodes}) => {
      const newTargetNodes = {...targetNodes};
      delete newTargetNodes[id];
      const newTargets = [...targets];
      newTargets.splice(newTargets.indexOf(id), 1);
      return {
        targetNodes: newTargetNodes,
        targets: targets,
      };
    });
  };

  registerItem = (id: ItemID, render: RenderFunction, renderNode: ItemNode, targetNode: TargetNode) => {
    this.setState(({__toRender, targetNodes, targets}) => {
      const newToRender = [...__toRender, {id, targetID: id, render, renderNode}];
      const newTargetNodes = {...targetNodes, [id]: targetNode};
      const newTargets = [...targets, id];
      targetNode.appendChild(renderNode);
      return {
        targets: newTargets,
        targetNodes: newTargetNodes,
        __toRender: newToRender,
      };
    });
  };

  deleteItem = (id: ItemID) => {
    this.setState(({__toRender, targetNodes}) => {
      const newTargetNodes = {...targetNodes};
      delete newTargetNodes[id];

      let index = -1;
      let toRender = null;
      __toRender.find(({id: _id}, i) => {
        if (id === _id) {
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
        targetNodes: newTargetNodes,
        __toRender: toRender || __toRender,
      };
    });
  };

  renderItemToTarget = (itemID: ItemID, targetID: TargetID) => {
    this.setState(({targetNodes, __toRender}) => {
      const targetNode = targetNodes[targetID];
      if (targetNode == null) {
        console.warn(`Wormhole.renderItemToTarget: Invalid targetID: ${targetID}`);
        return {};
      }

      let item = __toRender.find(({id}) => id === itemID);
      if (item == null) {
        console.warn(`Wormhole.renderItemToTarget: Invalid itemID: ${itemID}`);
        return {};
      }
      if (item.targetID === targetID) {
        console.warn(`Wormhole.renderItemToTarget: Already in targetID: ${targetID}`);
        return {};
      }
      let toRenderSet: Set<ToRenderProps> = new Set(__toRender);
      toRenderSet.delete(item);
      item = {
        ...item,
        targetID: targetID,
      };
      toRenderSet.add(item);
      targetNode.appendChild(item.renderNode);
      return {
        __toRender: Array.from(toRenderSet),
      };
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
        {__toRender.map(({render, renderNode, targetID}) =>
          createPortal(render(targetID, targets, this.renderItemToTarget), renderNode)
        )}
      </Context.Provider>
    );
  }
}

export default Wormhole;
