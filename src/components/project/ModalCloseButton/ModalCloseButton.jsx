import { useTranslation } from 'react-i18next';
import { IconCross } from "hds-react";
import './ModalCloseButton.scss';

const ModalCloseButton = ({ onClose, id, className }) => {
    const { t } = useTranslation();

    return (
        <button
            tabIndex={0}
            aria-label={t('common.close')}
            className={`modal-close-button ${className}`}
            id={id}
            onClick={onClose}
        >
            <IconCross aria-label={t('common.close')} size="m" />
        </button>
    );
};

export default ModalCloseButton;