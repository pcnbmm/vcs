import { usePermissionsContext } from '@/components/providers/PermissionsContext';

export function usePermissions() {
    return usePermissionsContext();
}
