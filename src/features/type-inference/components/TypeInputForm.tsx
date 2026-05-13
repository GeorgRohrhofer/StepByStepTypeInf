// View layer — pure presentational component.
//
// The bottom input form. The controller hook owns the value and the
// submit/change behaviour; this component only renders inputs and forwards
// events. No `fetch`, no validation, no pipeline call.

import type { FormEventHandler } from "react";

type TypeInputFormProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

export function TypeInputForm({
  value,
  onChange,
  onSubmit,
}: TypeInputFormProps) {
  return (
    <form className="type-input" onSubmit={onSubmit}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={"e.g. (\\x.x) y"}
        aria-label="Lambda term"
      />
      <button type="submit">Run</button>
    </form>
  );
}
