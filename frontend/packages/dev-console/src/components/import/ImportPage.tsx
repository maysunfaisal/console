import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import Helmet from 'react-helmet';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { PageHeading, Firehose, FirehoseResource, BuildStrategy } from '@console/internal/components/utils';
import DevPreviewBadge from '@console/shared/src/components/badges/DevPreviewBadge';
import { ImageStreamModel } from '@console/internal/models';
import { QUERY_PROPERTIES } from '../../const';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import QueryFocusApplication from '../QueryFocusApplication';
import ImportForm from './ImportForm';
import { ImportTypes, ImportData } from './import-types';

export type ImportPageProps = RouteComponentProps<{ ns?: string }>;

const ImportFlows = (t: TFunction): { [name: string]: ImportData } => ({
  git: {
    type: ImportTypes.git,
    title: t('devconsole~Import from Git'),
    buildStrategy: 'Source',
    loader: () =>
      import('./GitImportForm' /* webpackChunkName: "git-import-form" */).then((m) => m.default),
  },
  docker: {
    type: ImportTypes.docker,
    title: t('devconsole~Import from Dockerfile'),
    buildStrategy: 'Docker',
    loader: () =>
      import('./GitImportForm' /* webpackChunkName: "git-import-form" */).then((m) => m.default),
  },
  devfile: {
    type: ImportTypes.devfile,
    title: 'Import from devfile',
    buildStrategy: 'Devfile',
    loader: () =>
      import('./DevfileImportForm' /* webpackChunkName: "devfile-import-form" */).then((m) => m.default),
  },
  s2i: {
    type: ImportTypes.s2i,
    title: t('devconsole~Create Source-to-Image Application'),
    buildStrategy: 'Source',
    loader: () =>
      import('./SourceToImageForm' /* webpackChunkName: "source-to-image-form" */).then(
        (m) => m.default,
      ),
  },
});

const ImportPage: React.FunctionComponent<ImportPageProps> = ({ match, location }) => {
  const { t } = useTranslation();
  const namespace = match.params.ns;
  const searchParams = new URLSearchParams(location.search);
  const imageStreamName = searchParams.get('imagestream');
  const imageStreamNamespace = searchParams.get('imagestream-ns');
  const preselectedNamespace = searchParams.get('preselected-ns');
  const importType = searchParams.get('importType');

  let importData: ImportData;
  let resources: FirehoseResource[];
  if (imageStreamName && imageStreamNamespace) {
    importData = ImportFlows(t).s2i;
    resources = [
      {
        kind: ImageStreamModel.kind,
        prop: 'imageStreams',
        isList: false,
        name: imageStreamName,
        namespace: imageStreamNamespace,
      },
      {
        kind: 'Project',
        prop: 'projects',
        isList: true,
      },
    ];
  } else if (importType === ImportTypes.docker) {
    importData = ImportFlows(t).docker;
    resources = [
      {
        kind: 'Project',
        prop: 'projects',
        isList: true,
      },
    ];
  } else if (importType === ImportTypes.devfile) {
    importData = ImportFlows(t).devfile;
    resources = [
      {
        kind: 'Project',
        prop: 'projects',
        isList: true,
      },
    ];
  } else {
    importData = ImportFlows(t).git;
    resources = [
      {
        kind: ImageStreamModel.kind,
        prop: 'imageStreams',
        isList: true,
        namespace: 'openshift',
      },
      {
        kind: 'Project',
        prop: 'projects',
        isList: true,
      },
    ];
  }

  return (
    <QueryFocusApplication>
      {(application) => (
        <NamespacedPage disabled variant={NamespacedPageVariants.light}>
          <Helmet>
            <title>{importData.title}</title>
          </Helmet>
          {importType === ImportTypes.devfile
            ? <PageHeading title={importData.title} badge={<DevPreviewBadge />} />
            : <PageHeading title={importData.title} />
          }
          <div className="co-m-pane__body" style={{ paddingBottom: 0 }}>
            <Firehose resources={resources}>
              <ImportForm
                forApplication={application}
                contextualSource={searchParams.get(QUERY_PROPERTIES.CONTEXT_SOURCE)}
                namespace={namespace || preselectedNamespace}
                importData={importData}
              />
            </Firehose>
          </div>
        </NamespacedPage>
      )}
    </QueryFocusApplication>
  );
};

export default ImportPage;
