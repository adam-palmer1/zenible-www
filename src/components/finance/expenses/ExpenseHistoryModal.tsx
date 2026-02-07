import React from 'react';
import Modal from '../../ui/modal/Modal';
import ExpenseHistory from './ExpenseHistory';

interface ExpenseHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenseId: string | null;
  expenseName?: string;
}

const ExpenseHistoryModal: React.FC<ExpenseHistoryModalProps> = ({ open, onOpenChange, expenseId, expenseName }) => {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={`Change History: ${expenseName || 'Expense'}`}
      size="2xl"
      showCloseButton={true}
    >
      <div className="max-h-[60vh] overflow-y-auto">
        {expenseId && <ExpenseHistory expenseId={expenseId} />}
      </div>
    </Modal>
  );
};

export default ExpenseHistoryModal;
