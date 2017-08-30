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
      <Modal className='modals' show={this.state.showModal} onHide={action} backdrop={'static'}>
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
      <div>
        <ActionButton clickAction={this.props.yesAction} displayLabel={translate('yes')} hasNext/>
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
    this.state = {
      showModal: false,
      isDoneDisabled: this.props.isDoneDisabled
    };
  }

  componentWillReceiveProps(newProps) {
    this.setState({
      showModal: newProps.show,
      isDoneDisabled: newProps.isDoneDisabled
    });
  }

  renderFooter() {
    if(this.props.footer) {
      return this.props.footer;
    }
    else {
      return (
        <div>
          <ActionButton
            hasNext
            clickAction={this.props.cancelAction} displayLabel={translate('cancel')}/>
          <ActionButton
            isDisabled={this.state.isDoneDisabled}
            clickAction={this.props.doneAction} displayLabel={translate('done')}/>
        </div>
      );
    }
  }
  render() {
    return (
      <Modal
        className='modals' show={this.state.showModal}
        onHide={this.props.cancelAction} backdrop={'static'}>
        <Modal.Header>
          <Modal.Title className='title'>{this.props.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {this.props.body}
        </Modal.Body>
        <Modal.Footer>
          {this.renderFooter()}
        </Modal.Footer>
      </Modal>
    );
  }
}

class ConnectionInputModal extends BaseInputModal {
  constructor(props) {
    super(props);
  }

  renderFooter() {
    return (
      <div>
        <ActionButton
          hasNext
          clickAction={this.props.cancelAction} displayLabel={translate('cancel')}/>
        <ActionButton
          hasNext
          clickAction={this.props.testAction} displayLabel={translate('test')}/>
        <ActionButton
          isDisabled={this.state.isDoneDisabled}
          clickAction={this.props.doneAction} displayLabel={translate('done')}/>
      </div>
    );
  }

  render() {
    return (
      <BaseInputModal
        cancelAction={this.props.cancelAction} testAction={this.props.testAction}
        doneAction={this.props.doneAction}
        show={this.state.showModal} title={this.props.title}
        body={this.props.body} footer={this.renderFooter()}/>
    );
  }
}

module.exports = {
  ConfirmModal: ConfirmModal,
  YesNoModal: YesNoModal,
  BaseInputModal: BaseInputModal,
  ConnectionInputModal: ConnectionInputModal
};
