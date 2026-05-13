// View layer — pure presentational component.
//
// "Prev"/"Next" arrow buttons. Receives both the click handler and the
// disabled flag as props so it can stay completely logic-free.

type StepNavProps = {
  direction: "prev" | "next";
  onClick: () => void;
  disabled: boolean;
};

export function StepNav({ direction, onClick, disabled }: StepNavProps) {
  const isPrev = direction === "prev";
  return (
    <button
      type="button"
      className={`step-nav step-nav--${direction}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={isPrev ? "Previous step" : "Next step"}
    >
      {isPrev ? "‹" : "›"}
    </button>
  );
}
