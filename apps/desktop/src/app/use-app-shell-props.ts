import type { ComponentProps, Dispatch, MutableRefObject, SetStateAction } from 'react';

import { AppWorkspaceShell } from '../components/AppWorkspaceShell';
import { WorkspaceContentRouter } from '../components/WorkspaceContentRouter';

type WorkspaceProps = ComponentProps<typeof WorkspaceContentRouter>;
type ShellProps = ComponentProps<typeof AppWorkspaceShell>;

type UseAppShellPropsParams = {
  workspaceContentProps: WorkspaceProps;
  shellProps: Omit<ShellProps, 'workspaceContent'>;
};

export function useAppShellProps({ shellProps, workspaceContentProps }: UseAppShellPropsParams) {
  return {
    shellProps,
    workspaceContentProps,
  };
}

export type { ShellProps, WorkspaceProps };
