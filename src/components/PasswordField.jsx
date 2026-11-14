import React, { useState } from 'react';

export default function PasswordField({ id, label, placeholder, value, onChange, autoComplete }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="login-field">
      <label htmlFor={id} className="login-label">
        {label}
      </label>

      <div className="password-input-wrapper">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required
        />

        <button
          type="button"
          className="password-toggle-button"
          onClick={() => setVisible((prev) => !prev)}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        >
          {visible ? (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19C7 19 2.73 15.11 1 12c.72-1.29 1.68-2.49 2.83-3.54" />
              <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
              <path d="M1 1l22 22" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}