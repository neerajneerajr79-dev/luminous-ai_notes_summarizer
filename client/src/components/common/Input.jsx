import React, { forwardRef, useId } from 'react';
import clsx from 'clsx';

const Input = forwardRef(function Input(
  { label, error, hint, type = 'text', className, ...props },
  ref
) {
  const id = useId();
  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <label htmlFor={id} className="label">
          {label}
        </label>
      )}
      <input
        id={props.id || id}
        ref={ref}
        type={type}
        className={clsx('input', error && 'border-red-400 focus:border-red-400 focus:ring-red-100')}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink-soft">{hint}</p>
      ) : null}
    </div>
  );
});

export default Input;
