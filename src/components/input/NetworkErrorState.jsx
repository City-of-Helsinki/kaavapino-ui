// NetworkErrorState.jsx
import React, { useMemo, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { projectNetworkSelector } from '../../selectors/projectSelector';
import { Dialog, Button, Notification, IconCheckCircle } from 'hds-react';
import './NetworkErrorState.scss';

export default function NetworkErrorState() {
  // ---- Redux state ----
  // Network state via memoized selector (avoids recreating object + keeps pattern consistent)
  const network = useSelector(projectNetworkSelector);
  console.log('Network state:', network);
  const status = network.status || 'ok';
  const hasError = status === 'error';
  const isSuccess = status === 'success';
  // Banner only shown for error or success states; hidden in 'ok'
  const banner = useMemo(() => {
    if (hasError) {
      return {
        type: 'error',
        label: 'Tallennus epäonnistui',
        message: network.errorMessage || 'Tallennus epäonnistui yhteysongelman vuoksi.'
      };
    }
    if (isSuccess) {
      return {
        type: 'success',
        label: 'Yhteys palautunut',
        message: network.okMessage || 'Yhteys palautunut.'
      };
    }
    return null; // status 'ok' => hide banner
  }, [hasError, isSuccess, network.errorMessage, network.okMessage]);

  // Inline yellow panel visibility
  const [showWarning, setShowWarning] = useState(true);
  // Only the confirm is a dialog
  const [confirmOpen, setConfirmOpen] = useState(false);

  const onCopyClick = useCallback(async () => {
    const text = network.tempFieldContents || '';
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const el = document.createElement('textarea');
        el.value = text;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Clipboard copy failed', e);
    }
  }, [network.tempFieldContents]);

  return (
    <div className="network-error-state" aria-live="polite" aria-atomic="true">
      {/* Banner shown only when status is error or success */}
      {banner && (
        <Notification
          type={banner.type}
          label={banner.label}
          dismissible={false}
          size="default"
          aria-label={banner.label}
          className={`nes-notification nes-${banner.type}`}
        />
      )}
      {/* Warning panel only during error state */}
      {showWarning && hasError && (
        <Notification
          type="alert"
          label="Kenttä sisältää tallentamatonta tietoa"
          dismissible={false}
          size="default"
          className="nes-notification nes-warning-notification"
        >
          <div className="nes-warning-notification__content">
            <p className="mb-4">
              Kentän tallennus epäonnistui yhteysongelman vuoksi. Muokkaamasi tiedot on tallennettu
              väliaikaisesti muistiin. Kopioi kentän sisältö talteen. Kun yhteys palautuu, tarkista kentän
              tiedot ja päivitä ne tarvittaessa, sillä joku toinen käyttäjä on saattanut jo tehdä muutoksia
              samaan kenttään.
            </p>
            <p>
              Jos poistut näkymästä tai suljet tämän ilmoituksen, muutokset katoavat väliaikaisesta
              muistista, etkä voi enää kopioida niitä talteen.
            </p>
          </div>
          <div className="nes-warning-notification__actions">
            <Button onClick={onCopyClick} variant="primary">
              Kopioi kentän sisältö
            </Button>
            <Button onClick={() => setConfirmOpen(true)} variant="danger">
              Sulje ilmoitus
            </Button>
          </div>
        </Notification>
      )}
      {confirmOpen && (
        <Dialog
          id="network-warning-close-confirm"
          aria-labelledby="network-warning-close-confirm-title"
          isOpen
          close={() => setConfirmOpen(false)}
          variant="danger"
        >
          <Dialog.Header
            id="network-warning-close-confirm-title"
            iconLeft={<IconCheckCircle aria-hidden />}
          >
            Haluatko sulkea ilmoituksen?
          </Dialog.Header>
          <Dialog.Content>
            <p>
              Jos suljet ilmoituksen, et voi enää kopioida talteen väliaikaisessa muistissa olevaa,
              tallentamatonta sisältöä.
            </p>
          </Dialog.Content>
          <Dialog.ActionButtons>
            <Button onClick={() => setConfirmOpen(false)} variant="secondary">
              Peruuta
            </Button>
            <Button
              onClick={() => {
                setConfirmOpen(false);
                setShowWarning(false);
              }}
              variant="danger"
            >
              Sulje ilmoitus
            </Button>
          </Dialog.ActionButtons>
        </Dialog>
      )}
    </div>
  );
}