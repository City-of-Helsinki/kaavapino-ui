import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

function Contract({ fields, hideTitle }) {

  const { t } = useTranslation();

  const renderField = (field, index) => {
    let value = field.value;

    if (value === null) {
      return null;
    }

    if (value === undefined) {
      value = null;
    }
    if (value === false) {
      value = t('project.no');
    }
    if (value === true) {
      value = t('project.yes');
    }

    if (field.choices) {
      const choice = field.choices.find(choice => choice.value === field.value);

      if (choice === undefined) {
        value = null;
      } else {
        value = choice.label;
      }
    }
    return (
      <div className="project-card-field" key={field.label + index}>
        <div>{field.label}</div>
        <div><b>{value}</b></div>
      </div>
    );
  };
  const renderFields = () => {
    return (
      <div>
        {!hideTitle && <h2>{t('project.contract-title')}</h2>}
        {fields?.map((field, index) => {
          return renderField(field, index);
        })
        }
      </div>
    );
  };
  const fieldsComponent = renderFields();

  return (
    <div className="contract">
      {fieldsComponent}
    </div>
  );
}

Contract.propTypes = {
  fields: PropTypes.array,
  hideTitle: PropTypes.bool
};

export default Contract

