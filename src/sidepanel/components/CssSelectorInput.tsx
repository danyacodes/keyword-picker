interface CssSelectorInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function CssSelectorInput({ value, onChange }: CssSelectorInputProps) {
  return (
    <div className="css-section">
      <div className="css-section-label">CSS Selector</div>
      <div className="css-input-row">
        <input
          className="css-input"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="For example, .job-title, #company-name"
        />
      </div>
    </div>
  );
}
