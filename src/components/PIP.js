import React, {Component, createRef} from 'react';
import styles from './PIP.module.css';

class PIP extends Component {
  ref = createRef();
  componentDidUpdate(prevProps) {
    const {
      props: {node},
      ref: {current},
    } = this;
    if (current != null && node != null && node !== prevProps.node) {
      console.log(node);
      current.appendChild(node);
    }
  }

  render() {
    const {node} = this.props;
    return (
      <div ref={this.ref} className={styles.container}>
        {node == null ? `Empty pip` : null}
      </div>
    );
  }
}

export default PIP;
