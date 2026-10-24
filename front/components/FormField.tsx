type FormFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "password";
  autoComplete?: string;
  required?: boolean;
  errors?: string[];
};

export function FormField({
  id,
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  required = false,
  errors = [],
}: FormFieldProps) {
  const errorId = `${id}-error`;
  const hasErrors = errors.length > 0;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={hasErrors}
        aria-describedby={hasErrors ? errorId : undefined}
        className="input"
      />
      {hasErrors && (
        <p id={errorId} className="text-sm text-red-600 dark:text-red-400">
          {errors.join(" ")}
        </p>
      )}
    </div>
  );
}
