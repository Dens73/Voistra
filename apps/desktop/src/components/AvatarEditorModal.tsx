import type { AvatarEditorState, Language } from '../app/types';

type AvatarEditorModalProps = {
  editor: AvatarEditorState;
  language: Language;
  onApply: () => void;
  onChange: (updater: (current: AvatarEditorState) => AvatarEditorState) => void;
  onClose: () => void;
};

export function AvatarEditorModal({
  editor,
  language,
  onApply,
  onChange,
  onClose,
}: AvatarEditorModalProps) {
  if (!editor) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="modal-card avatar-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="section-title">
          <h3>{language === 'ru' ? 'Редактор фото' : 'Avatar editor'}</h3>
        </div>
        <div className="avatar-editor-stage">
          <div className="avatar-editor-frame">
            <img
              src={editor.source}
              alt="avatar preview"
              style={{
                transform: `translate(${editor.offsetX}px, ${editor.offsetY}px) scale(${editor.scale})`,
              }}
            />
          </div>
        </div>
        <div className="audio-settings-shell">
          <label className="slider-field">
            <span>{language === 'ru' ? 'Масштаб' : 'Zoom'}</span>
            <input
              type="range"
              min="1"
              max="2.4"
              step="0.05"
              value={editor.scale}
              onChange={(event) =>
                onChange((current) => (current ? { ...current, scale: Number(event.target.value) } : current))
              }
            />
          </label>
          <label className="slider-field">
            <span>{language === 'ru' ? 'Смещение по горизонтали' : 'Horizontal offset'}</span>
            <input
              type="range"
              min="-120"
              max="120"
              step="1"
              value={editor.offsetX}
              onChange={(event) =>
                onChange((current) => (current ? { ...current, offsetX: Number(event.target.value) } : current))
              }
            />
          </label>
          <label className="slider-field">
            <span>{language === 'ru' ? 'Смещение по вертикали' : 'Vertical offset'}</span>
            <input
              type="range"
              min="-120"
              max="120"
              step="1"
              value={editor.offsetY}
              onChange={(event) =>
                onChange((current) => (current ? { ...current, offsetY: Number(event.target.value) } : current))
              }
            />
          </label>
        </div>
        <div className="inline-actions">
          <button className="ghost-button" type="button" onClick={onClose}>
            {language === 'ru' ? 'Отмена' : 'Cancel'}
          </button>
          <button className="primary-button" type="button" onClick={onApply}>
            {language === 'ru' ? 'Применить фото' : 'Apply image'}
          </button>
        </div>
      </div>
    </div>
  );
}
