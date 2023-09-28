import React, { useState } from 'react';
import { Modal } from 'semantic-ui-react';

const NewTaskModal = ({ open, onClose }) => {
  const [newTaskParams, setNewTaskParams] = useState({});

  const handleUpdateTaskParams = (key, value) =>
    setNewTaskParams({ ...newTaskParams, [key]: value });

  return (
    <Modal open={open} onClose={onClose} size="mini">
      <Modal.Header>New Task</Modal.Header>
      <Modal.Content>
        <div className="flex">{/*  */}</div>
      </Modal.Content>
    </Modal>
  );
};

export default NewTaskModal;
