import * as React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import {
  Toolbar,
  ToolbarGroup,
  ToolbarGroupVariant,
  ToolbarItem,
  ToolbarContent,
  Popover,
  Button,
} from '@patternfly/react-core';
import { InfoCircleIcon } from '@patternfly/react-icons';
import { Visualization } from '@patternfly/react-topology';
import { useQueryParams } from '@console/shared';
import { RootState } from '@console/internal/redux';
import { getActiveNamespace } from '@console/internal/reducers/ui';
import { ExternalLink } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { TextFilter } from '@console/internal/components/factory';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { ConsoleLinkModel } from '@console/internal/models';
import { setTopologyFilters } from '../redux/action';
import { DisplayFilters, TopologyViewType } from '../topology-types';
import {
  getSupportedTopologyFilters,
  getSupportedTopologyKinds,
  getTopologyFilters,
  onSearchChange,
} from './filter-utils';
import FilterDropdown from './FilterDropdown';
import KindFilterDropdown from './KindFilterDropdown';
import { getNamespaceDashboardKialiLink } from '../topology-utils';
import QuickSearchButton from './quick-search/QuickSearchButton';

import './TopologyFilterBar.scss';

type StateProps = {
  filters: DisplayFilters;
  supportedFilters: string[];
  supportedKinds: { [key: string]: number };
  namespace: string;
};

type DispatchProps = {
  onFiltersChange: (filters: DisplayFilters) => void;
};

type OwnProps = {
  visualization?: Visualization;
  viewType: TopologyViewType;
};

type MergeProps = StateProps & DispatchProps & OwnProps;

type TopologyFilterBarProps = MergeProps;

const TopologyFilterBar: React.FC<TopologyFilterBarProps> = ({
  filters,
  supportedFilters,
  supportedKinds,
  onFiltersChange,
  visualization,
  viewType,
  namespace,
}) => {
  const [consoleLinks] = useK8sWatchResource<K8sResourceKind[]>({
    isList: true,
    kind: referenceForModel(ConsoleLinkModel),
    optional: true,
  });
  const kialiLink = getNamespaceDashboardKialiLink(consoleLinks, namespace);
  const queryParams = useQueryParams();
  const searchQuery = queryParams.get('searchQuery') || '';

  const onTextFilterChange = (text) => {
    const query = text?.trim();
    onSearchChange(query);
  };

  return (
    <Toolbar className="co-namespace-bar odc-topology-filter-bar">
      <ToolbarContent>
        <ToolbarItem>
          <QuickSearchButton />
        </ToolbarItem>
        <ToolbarGroup variant={ToolbarGroupVariant['filter-group']}>
          <ToolbarItem>
            <FilterDropdown
              filters={filters}
              viewType={viewType}
              supportedFilters={supportedFilters}
              onChange={onFiltersChange}
            />
          </ToolbarItem>
        </ToolbarGroup>
        <ToolbarGroup variant={ToolbarGroupVariant['filter-group']}>
          <ToolbarItem>
            <KindFilterDropdown
              filters={filters}
              supportedKinds={supportedKinds}
              onChange={onFiltersChange}
            />
          </ToolbarItem>
        </ToolbarGroup>
        <ToolbarGroup variant={ToolbarGroupVariant['filter-group']}>
          <ToolbarItem>
            <TextFilter
              placeholder="Find by name..."
              value={searchQuery}
              autoFocus
              onChange={onTextFilterChange}
              className="odc-topology-filter-bar__text-filter"
            />
          </ToolbarItem>
          {viewType === TopologyViewType.graph ? (
            <ToolbarItem>
              <Popover
                aria-label="Find by name"
                position="left"
                bodyContent={
                  <>
                    Search results may appear outside of the visible area.{' '}
                    <Button
                      variant="link"
                      onClick={() => visualization.getGraph().fit(80)}
                      isInline
                    >
                      Click here
                    </Button>{' '}
                    to fit to the screen.
                  </>
                }
              >
                <Button variant="link" className="odc-topology-filter-bar__info-icon">
                  <InfoCircleIcon />
                </Button>
              </Popover>
            </ToolbarItem>
          ) : null}
        </ToolbarGroup>
        {kialiLink && (
          <ToolbarItem className="odc-topology-filter-bar__kiali-link">
            <ExternalLink href={kialiLink} text="Kiali" />
          </ToolbarItem>
        )}
      </ToolbarContent>
    </Toolbar>
  );
};

const mapStateToProps = (state: RootState): StateProps => {
  const states = {
    filters: getTopologyFilters(state),
    supportedFilters: getSupportedTopologyFilters(state),
    supportedKinds: getSupportedTopologyKinds(state),
    namespace: getActiveNamespace(state),
  };
  return states;
};

const dispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  onFiltersChange: (filters: DisplayFilters) => {
    dispatch(setTopologyFilters(filters));
  },
});

const mergeProps = (
  { filters, supportedFilters, supportedKinds, namespace }: StateProps,
  { onFiltersChange }: DispatchProps,
  { visualization, viewType }: OwnProps,
): MergeProps => ({
  filters,
  supportedFilters,
  supportedKinds,
  namespace,
  onFiltersChange,
  visualization,
  viewType,
});

export default connect<StateProps, DispatchProps, OwnProps, MergeProps>(
  mapStateToProps,
  dispatchToProps,
  mergeProps,
)(TopologyFilterBar);
