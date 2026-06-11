import { useEffect } from 'react';
import L from 'leaflet';
import { useMap } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import './MapZoomControl.scss';

/**
 * Renders Leaflet zoom in/out controls as <button> elements instead of the
 * default <a> anchors. Use together with `zoomControl={false}` on MapContainer.
 */
function MapZoomControl({ position = 'topleft' }) {
  const map = useMap();
  const { t } = useTranslation();

  useEffect(() => {
    const ZoomControl = L.Control.extend({
      onAdd: function () {
        const container = L.DomUtil.create(
          'div',
          'leaflet-bar leaflet-control leaflet-control-zoom'
        );

        const zoomInLabel = t('map.zoom-in', 'Zoom in');
        const zoomOutLabel = t('map.zoom-out', 'Zoom out');

        const zoomIn = L.DomUtil.create('button', 'leaflet-control-zoom-in', container);
        zoomIn.type = 'button';
        zoomIn.innerHTML = '+';
        zoomIn.title = zoomInLabel;
        zoomIn.setAttribute('aria-label', zoomInLabel);

        const zoomOut = L.DomUtil.create('button', 'leaflet-control-zoom-out', container);
        zoomOut.type = 'button';
        zoomOut.innerHTML = '\u2212'; // Unicode minus sign
        zoomOut.title = zoomOutLabel;
        zoomOut.setAttribute('aria-label', zoomOutLabel);

        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);
        L.DomEvent.on(zoomIn, 'click', L.DomEvent.stop);
        L.DomEvent.on(zoomIn, 'click', () => map.zoomIn());
        L.DomEvent.on(zoomOut, 'click', L.DomEvent.stop);
        L.DomEvent.on(zoomOut, 'click', () => map.zoomOut());

        return container;
      }
    })

    const control = new ZoomControl({ position });
    control.addTo(map);

    return () => {
      control.remove();
    }
  }, [map, position, t]);

  return null;
}

MapZoomControl.propTypes = {
    position: PropTypes.string
}
export default MapZoomControl;
