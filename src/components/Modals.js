import React from 'react';
import { Modal } from 'react-bootstrap';
import { ActionButton } from '../components/Buttons.js';
import { translate } from '../localization/localize.js';
import '../Deployer.css';

function ConfirmModal(props) {
  return (
    <Modal
      className='modals'
      show={props.show}
      onHide={props.onHide}
      backdrop={'static'}
      dialogClassName={props.className}>

      <Modal.Header closeButton>
        <Modal.Title className='title'>{props.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {props.children}
      </Modal.Body>
      <Modal.Footer>
        {props.footer ||
          <ActionButton clickAction={props.onHide} displayLabel={translate('ok')}/>}
      </Modal.Footer>
    </Modal>
  );
}

function YesNoModal(props) {
  const footer = (
    <div className="btn-row">
      <ActionButton clickAction={props.yesAction} displayLabel={translate('yes')}/>
      <ActionButton type='default' clickAction={props.noAction} displayLabel={translate('no')}/>
    </div>
  );

  return (
    <ConfirmModal show={props.show} title={props.title} onHide={props.noAction} footer={footer}>
      {props.children}
    </ConfirmModal>
  );
}

function BaseInputModal(props) {

  //won't render footer, but implement footers in the body
  //to have control over the input contents changes.
  return (
    <Modal
      className='modals'
      show={props.show}
      onHide={props.onHide}
      backdrop={'static'}
      dialogClassName={props.className}>

      <Modal.Header closeButton>
        <Modal.Title className='title'>{props.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {props.children}
      </Modal.Body>
    </Modal>
  );
}

export { ConfirmModal, YesNoModal, BaseInputModal };
