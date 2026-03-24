import { useTranslation } from 'react-i18next';
import { IconCross, Modal } from "hds-react";
import './ModalCloseButton.scss';
import PropTypes from 'prop-types';

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

ModalCloseButton.propTypes = {
    onClose: PropTypes.func,
    id: PropTypes.string,
    className: PropTypes.string
}

export default ModalCloseButton;