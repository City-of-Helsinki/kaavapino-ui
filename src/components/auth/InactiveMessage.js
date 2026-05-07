import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { t } from 'i18next';
import './InactiveMessage.scss';

const pad = value => String(value).padStart(2, '0');

const formatRemaining = ms => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60) % 60;
    const seconds = totalSeconds % 60;
    return `${pad(minutes)}:${pad(seconds)}`;
};

function InactiveMessage({ idleModal, extendSession, durationMs = 600000 }) {
    const intervalRef = useRef(null);
    const extendButtonRef = useRef(null);
    const [timer, setTimer] = useState(() => formatRemaining(durationMs));

    useEffect(() => {
        extendButtonRef.current?.focus();
        const handleKeyDown = event => {
            if (event.key === 'Tab') {
                event.preventDefault();
                event.stopPropagation();
                extendButtonRef.current?.focus();
            } else if (event.key === 'Escape') {
                extendSession();
            }
        };
        globalThis.addEventListener('keydown', handleKeyDown);
        return () => {
            globalThis.removeEventListener('keydown', handleKeyDown);
        }
    }, []);

    useEffect(() => {
        const deadline = Date.now() + durationMs;
        const tick = () => {
            const remaining = deadline - Date.now();
            setTimer(formatRemaining(remaining));
            if (remaining <= 0 && intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };

        tick();
        intervalRef.current = setInterval(tick, 1000);
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [durationMs]);

    if (!idleModal) {
        return <div>{t('messages.session-extended')}</div>;
    }

    return (
        <div>
            {t('messages.session-expiring', { timer })}
            <button
                className="extend-session-button"
                onClick={extendSession}
                ref={extendButtonRef}
            >
                {t('messages.extend-session')}
            </button>
        </div>
    );
}

InactiveMessage.propTypes = {
    extendSession: PropTypes.func,
    idleModal: PropTypes.bool.isRequired,
    durationMs: PropTypes.number
};

export default InactiveMessage;