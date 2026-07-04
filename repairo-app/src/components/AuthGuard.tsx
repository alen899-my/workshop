import { ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useRBAC } from '@/hooks/use-rbac';
import { Colors } from '@/constants/theme';

interface AuthGuardProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export default function AuthGuard({ permission, children, fallback }: AuthGuardProps) {
  const { can, loading } = useRBAC();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  }

  if (!can(permission)) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}
