import { useQuery } from '@tanstack/react-query';
import { getApi, readScenarioFromUrl } from '~/lib/api';

export function useDashboardData() {
  const scenario = readScenarioFromUrl();
  return useQuery({
    queryKey: ['dashboard', scenario],
    queryFn: () => getApi().getDashboardData(scenario),
    retry: false,
  });
}
