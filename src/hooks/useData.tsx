import useDataStore from '../store/useDataStore';

export const useData = useDataStore;

// We export a dummy DataProvider just in case some files still import it,
// but it's no longer necessary with Zustand. We removed it from App.tsx.
export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};
