import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { Textarea } from './Field';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'primary' | 'danger' | 'success' | 'secondary';
  withReason?: boolean;
  onConfirm: (reason?: string) => void;
  onClose: () => void;
}

export default function ConfirmDialog({
  open, title, message, confirmLabel = '확인', variant = 'primary', withReason, onConfirm, onClose,
}: Props) {
  const [reason, setReason] = useState('');
  const submit = () => {
    onConfirm(withReason ? reason : undefined);
    setReason('');
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width="max-w-md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>취소</Button>
          <Button variant={variant} onClick={submit} disabled={withReason && !reason.trim()}>{confirmLabel}</Button>
        </>
      }
    >
      <p className="text-sm text-slate-600 leading-relaxed mb-3">{message}</p>
      {withReason && (
        <Textarea
          rows={3}
          placeholder="사유를 입력하세요"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      )}
    </Modal>
  );
}
