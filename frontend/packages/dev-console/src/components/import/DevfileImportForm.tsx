import * as React from 'react';
import * as _ from 'lodash';
import { Form } from '@patternfly/react-core';
import { FormikProps, FormikValues } from 'formik';
import { FormFooter } from '@console/shared/src/components/form-utils';
import { DevfileImportFormProps } from './import-types';
import GitSection from './git/GitSection';
import AppSection from './app/AppSection';
// import { parseDevfile } from '@console/internal/module/k8s';
import devfileMock from './devfile-data-mock';

// eslint-disable-next-line
window['allowDevfileContents'] = true;

const DevfileImportForm: React.FC<FormikProps<FormikValues> & DevfileImportFormProps> = ({
  values,
  errors,
  handleSubmit,
  handleReset,
  status,
  builderImages,
  isSubmitting,
  dirty,
  projects,
  setFieldValue,
}) => {
  const [devfileParseError, setDevfileParseError] = React.useState<string>(null);
  const devfileContents = values.devfile?.devfileContent;
  React.useEffect(() => {
    const setError = (msg) => {
      setDevfileParseError(msg);
      setFieldValue('devfile.devfileHasError', false);
    };
    const clearError = () => {
      setDevfileParseError(null);
      setFieldValue('devfile.devfileHasError', false);
    };

    if (devfileContents == null) {
      clearError();
      return;
    }

    // parseDevfile(devfileContents)
    new Promise((resolve, reject) => {
      // eslint-disable-next-line
      if (window['allowDevfileContents']) {
        resolve(devfileMock);
      } else {
        reject(new Error('devfile contents are invalid'));
      }
    })
      .then((value: any) => {
        if (value.devfileResources) {
          clearError();
          const {
            imageStream,
            buildResource,
            deployResource,
            service,
            route,
          } = value.devfileResources;
          setFieldValue('devfile.devfileSuggestedResources', {
            imageStream,
            buildResource,
            deployResource,
            service,
            route,
          });
          return;
        }

        // Failed to parse response, error out
        setError('Unknown error parsing Devfile');
      })
      .catch((e) => {
        setError(e.message);
      });
  }, [devfileContents, setFieldValue]);

  return (
    <Form onSubmit={handleSubmit} data-test-id="import-devfile-form">
      <GitSection
        buildStrategy="Devfile"
        builderImages={builderImages}
        customGitError={
          devfileParseError ? { body: devfileParseError, title: 'Devfile Parse Error' } : null
        }
      />
      <AppSection
        project={values.project}
        noProjectsAvailable={projects.loaded && _.isEmpty(projects.data)}
      />
      <FormFooter
        handleReset={handleReset}
        errorMessage={status && status.submitError}
        isSubmitting={isSubmitting}
        submitLabel="Create"
        sticky
        disableSubmit={!dirty || !_.isEmpty(errors)}
        resetLabel="Cancel"
      />
    </Form>
  );
};

export default DevfileImportForm;
