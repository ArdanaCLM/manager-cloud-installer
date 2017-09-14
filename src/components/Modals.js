import React from 'react';
import { Modal } from 'react-bootstrap';
import { ActionButton } from '../components/Buttons.js';
import { translate } from '../localization/localize.js';
import '../Deployer.css';

class ConfirmModal extends Modal {
  constructor() {
    super();
    this.state = {showModal: false};

    this.close = this.close.bind(this);
  }

  componentWillReceiveProps(newProps) {
    if (this.props.show !== newProps.show) {
      this.setState({showModal: newProps.show});
    }
  }

  close() {
    this.setState({showModal: false});
  }

  render() {
    let action = (this.props.clickAction) ? this.props.clickAction : this.close;
    let footer = (this.props.footer) ? this.props.footer :
      (<ActionButton clickAction={action} displayLabel={translate('ok')}/>);

    return (
      <Modal className='modals' show={this.state.showModal} onHide={action} backdrop={'static'}
        dialogClassName={this.props.className}>
        <Modal.Header>
          <Modal.Title className='title'>{this.props.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {this.props.body}
        </Modal.Body>
        <Modal.Footer>
          {footer}
        </Modal.Footer>
      </Modal>
    );
  }
}

class YesNoModal extends ConfirmModal {
  render() {
    let footer = (
      <div className="btn-row">
        <ActionButton clickAction={this.props.yesAction} displayLabel={translate('yes')}/>
        <ActionButton clickAction={this.props.noAction} displayLabel={translate('no')}/>
      </div>
    );

    return (
      <ConfirmModal show={this.state.showModal} title={this.props.title} body={this.props.body}
        footer={footer}/>
    );
  }
}

class BaseInputModal extends Modal {
  constructor(props) {
    super(props);
  }

  //won't render footer, but implement footers in the body
  //to have control over the input contents changes.
  render() {
    if (this.props.show) {
      return (
        <Modal
          className='modals' show={this.props.show}
          dialogClassName={this.props.dialogClass}
          onHide={this.props.cancelAction}
          backdrop={'static'}>
          <Modal.Header closeButton>
            <Modal.Title className='title'>{this.props.title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {this.props.body}
          </Modal.Body>
        </Modal>
      );
    }
    return <div></div>;
  }
}

module.exports = {
  ConfirmModal: ConfirmModal,
  YesNoModal: YesNoModal,
  BaseInputModal: BaseInputModal
};
