import React from 'react';
import MaaraaikaIcon from '../../assets/timeline-symbols/maaraaika.svg?react';
import EsillaoloIcon from '../../assets/timeline-symbols/esillaolo.svg?react';
import TyoaikaIcon from '../../assets/timeline-symbols/tyoaika.svg?react';
import LautakuntaIcon from '../../assets/timeline-symbols/lautakunta.svg?react';
import VaiheenKestoIcon from '../../assets/timeline-symbols/vaiheen-kesto.svg?react';
import ValittuMaaraaikaIcon from '../../assets/timeline-symbols/valittu-maaraaika.svg?react';
import ValittuEsillaoloIcon from '../../assets/timeline-symbols/valittu-esillaolo.svg?react';
import VahvistettuIcon from '../../assets/timeline-symbols/vahvistettu.svg?react';
import MennytIcon from '../../assets/timeline-symbols/mennyt.svg?react';
import MyohassaIcon from '../../assets/timeline-symbols/myohassa.svg?react';

const leftSymbols = [
  <MaaraaikaIcon key="maaraaika" className="symbol-icon" />,
  <EsillaoloIcon key="esillaolo" className="symbol-icon" />,
  <TyoaikaIcon key="tyoaika" className="symbol-icon" />,
  <LautakuntaIcon key="lautakunta" className="symbol-icon" />,
  <VaiheenKestoIcon key="vaiheenkesto" className="symbol-icon" />,
];

const leftLabels = [
  "Määräaika",
  "Esillä- tai nähtävilläolo",
  "Kaavoitussihteerin työaika",
  "Lautakunta",
  "Vaiheen kesto"
];

const rightIcons = [
  <ValittuMaaraaikaIcon key="valittu-maaraaika" className="symbol-icon" />,
  <ValittuEsillaoloIcon key="valittu-esillaolo" className="symbol-icon" />,
  <VahvistettuIcon key="vahvistettu" className="symbol-icon" />,
  <MennytIcon key="mennyt" className="symbol-icon" />,
  <MyohassaIcon key="myohassa" className="symbol-icon" />,
];

const rightLabels = [
  "Käyttäjä on valinnut määräajan",
  "Käyttäjä on valinnut esilläolon",
  "Kaavoitussihteeri on vahvistanut päivämäärät",
  "Päivämäärät on vahvistettu, mennyt ajanhetki",
  <>Päivämääriä ei ole vahvistettu, mennyt ajanhetki,<span>&nbsp;myöhässä</span></>
];

const TimelineMenuTooltip = () => (
  <div className="element-tooltip">
    <div className="element-tooltip-left">
      <div className="tooltip-header">Symbolien selitykset</div>
      <div className="symbol-columns">
        <div className="symbol-column">
          {leftSymbols.map((icon, idx) => (
            <div className="symbol-row" key={idx}>{icon}</div>
          ))}
        </div>
        <div className="text-column">
          {leftLabels.map((text, idx) => (
            <div className="symbol-row" key={idx}>{text}</div>
          ))}
        </div>
      </div>
    </div>
    <div className="element-tooltip-divider" />
    <div className="element-tooltip-right">
        <div className="tooltip-header">Esimerkkejä</div>
        <div className="symbol-columns">
            <div className="symbol-column">
            {rightIcons.map((icon, idx) => (
                <div className="symbol-row" key={idx}>{icon}</div>
            ))}
            </div>
            <div className="text-column">
            {rightLabels.map((text, idx) => (
                <div className="symbol-row" key={idx}>{text}</div>
            ))}
            </div>
        </div>
    </div>
  </div>
);

export default TimelineMenuTooltip;