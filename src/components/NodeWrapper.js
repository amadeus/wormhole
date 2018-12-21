import React, {Component, createRef} from 'react';
import {createPortal} from 'react-dom';
import connectStores from '../lib/connectStores';
import SharedDOMElementStore from '../stores/SharedDOMElementStore';

type NodeWrapperProps = {|
  children: () => React.Node,
  renderPlaceholder: () => React.Node,
  node: ?HTMLDivElement,
  id: string,
  ownerId: string,
|};

class NodeWrapper extends Component<NodeWrapperProps> {
  ref = createRef();

  componentDidMount() {
    const {
      props: {node},
      ref: {current},
    } = this;
    if (current != null && node != null) {
      current.appendChild(node);
    }
  }

  render() {
    const {children, renderPlaceholder, node} = this.props;
    const content = node != null ? createPortal(children(), node) : renderPlaceholder();
    return <div ref={this.ref}>{content}</div>;
  }
}

export default connectStores(
  [SharedDOMElementStore],
  ({id, ownerId}) => ({
    node: SharedDOMElementStore.getFreeElement(id, ownerId),
  }),
  NodeWrapper
);
