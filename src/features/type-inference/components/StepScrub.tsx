// View layer — pure presentational component.
//
// The range input ("scrubber") that lets the user jump to any step. Logic
// (parsing the value, clamping) is the controller's responsibility; this
// component only forwards a parsed number.

type StepScrubProps = {
  viewIndex: number;
  lastIndex: number;
  stepCount: number;
  onChange: (index: number) => void;
};

export function StepScrub({
  viewIndex,
  lastIndex,
  stepCount,
  onChange,
}: StepScrubProps) {
  return (
    <label className="step-scrub">
      <span className="visually-hidden">Jump to step</span>
      <input
        type="range"
        min={0}
        max={lastIndex}
        value={viewIndex}
        onChange={(e) => onChange(Number.parseInt(e.target.value, 10))}
        aria-valuetext={`Step ${viewIndex + 1} of ${stepCount}`}
      />
    </label>
  );
}
