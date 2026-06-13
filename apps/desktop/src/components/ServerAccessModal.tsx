import type { FormEvent } from 'react';

import { ActionIcon } from './app-primitives';

type ServerAccessStrings = {
  newServer: string;
  createServer: string;
  serverName: string;
  serverDraftName: string;
  description: string;
  serverDraftDescription: string;
  joinServer: string;
  joinByServerId: string;
  pasteServerId: string;
};

type ServerAccessModalProps = {
  createServerForm: {
    name: string;
    description: string;
  };
  i18n: ServerAccessStrings;
  joinServerForm: {
    serverId: string;
  };
  open: boolean;
  onClose: () => void;
  onCreateServerChange: (updater: (current: { name: string; description: string }) => { name: string; description: string }) => void;
  onCreateServerSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onJoinServerChange: (value: string) => void;
  onJoinServerSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
};

export function ServerAccessModal({
  createServerForm,
  i18n,
  joinServerForm,
  open,
  onClose,
  onCreateServerChange,
  onCreateServerSubmit,
  onJoinServerChange,
  onJoinServerSubmit,
}: ServerAccessModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="section-title">
          <h3>{i18n.newServer}</h3>
          <button className="ghost-button icon-compact" type="button" onClick={onClose}>
            <ActionIcon kind="close" />
          </button>
        </div>
        <div className="server-modal-grid">
          <form className="panel form-grid compact" onSubmit={onCreateServerSubmit}>
            <div className="panel-heading">
              <strong>{i18n.createServer}</strong>
            </div>
            <label>
              {i18n.serverName}
              <input
                value={createServerForm.name}
                onChange={(event) => onCreateServerChange((current) => ({ ...current, name: event.target.value }))}
                placeholder={i18n.serverDraftName}
                required
              />
            </label>
            <label>
              {i18n.description}
              <input
                value={createServerForm.description}
                onChange={(event) =>
                  onCreateServerChange((current) => ({ ...current, description: event.target.value }))
                }
                placeholder={i18n.serverDraftDescription}
              />
            </label>
            <button className="primary-button" type="submit">
              <ActionIcon kind="plus" /> {i18n.createServer}
            </button>
          </form>

          <form className="panel form-grid compact" onSubmit={onJoinServerSubmit}>
            <div className="panel-heading">
              <strong>{i18n.joinServer}</strong>
            </div>
            <label>
              {i18n.joinByServerId}
              <input
                value={joinServerForm.serverId}
                onChange={(event) => onJoinServerChange(event.target.value)}
                placeholder={i18n.pasteServerId}
              />
            </label>
            <button className="ghost-button" type="submit">
              <ActionIcon kind="link" /> {i18n.joinServer}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
