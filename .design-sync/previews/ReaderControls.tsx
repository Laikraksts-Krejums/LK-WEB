import { ReaderControls } from "lk-web";

const noop = () => {};

export function MidIssue() {
  return (
    <ReaderControls
      label="12–13"
      totalPages={48}
      canPrev
      canNext
      isZoomed={false}
      onPrev={noop}
      onNext={noop}
      onZoomIn={noop}
      onZoomOut={noop}
      onFullscreen={noop}
    />
  );
}

export function Cover() {
  return (
    <ReaderControls
      label="1"
      totalPages={48}
      canPrev={false}
      canNext
      isZoomed={false}
      onPrev={noop}
      onNext={noop}
      onZoomIn={noop}
      onZoomOut={noop}
      onFullscreen={noop}
    />
  );
}

export function Zoomed() {
  return (
    <ReaderControls
      label="12–13"
      totalPages={48}
      canPrev
      canNext
      isZoomed
      onPrev={noop}
      onNext={noop}
      onZoomIn={noop}
      onZoomOut={noop}
      onFullscreen={noop}
    />
  );
}
