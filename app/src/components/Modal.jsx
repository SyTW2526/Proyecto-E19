import React from 'react';

// Modal de confirmación
export function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirmar", cancelText = "Cancelar", variant = "danger" }) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      bg: 'bg-red-100',
      text: 'text-red-600',
      button: 'bg-red-600 hover:bg-red-700',
      icon: (
        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
    success: {
      bg: 'bg-green-100',
      text: 'text-green-600',
      button: 'bg-green-600 hover:bg-green-700',
      icon: (
        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    warning: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-600',
      button: 'bg-yellow-600 hover:bg-yellow-700',
      icon: (
        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    }
  };

  const style = variantStyles[variant] || variantStyles.danger;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4">
          <div className={`w-12 h-12 rounded-full ${style.bg} flex items-center justify-center mx-auto mb-4`}>
            {style.icon}
          </div>
          <h3 className="text-lg font-bold text-gray-900 text-center mb-2">{title}</h3>
          <p className="text-sm text-gray-600 text-center">{message}</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
          >
            {cancelText}
          </button>
          <button 
            onClick={() => { onConfirm(); onClose(); }}
            className={`flex-1 px-4 py-2.5 text-sm font-medium text-white ${style.button} rounded-xl transition-all`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal de alerta (solo info)
export function AlertModal({ isOpen, onClose, title, message, variant = "info" }) {
  if (!isOpen) return null;

  const variantStyles = {
    error: {
      bg: 'bg-red-100',
      icon: (
        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )
    },
    success: {
      bg: 'bg-green-100',
      icon: (
        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )
    },
    warning: {
      bg: 'bg-yellow-100',
      icon: (
        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
    info: {
      bg: 'bg-blue-100',
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  };

  const style = variantStyles[variant] || variantStyles.info;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4">
          <div className={`w-12 h-12 rounded-full ${style.bg} flex items-center justify-center mx-auto mb-4`}>
            {style.icon}
          </div>
          <h3 className="text-lg font-bold text-gray-900 text-center mb-2">{title}</h3>
          <p className="text-sm text-gray-600 text-center whitespace-pre-line">{message}</p>
        </div>
        <button 
          onClick={onClose}
          className="w-full px-4 py-2.5 text-sm font-medium text-white bg-[#7024BB] rounded-xl hover:bg-[#5a1d99] transition-all"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}

// Modal de input (reemplazo de prompt)
export function PromptModal({ isOpen, onClose, onConfirm, title, message, placeholder = "", defaultValue = "" }) {
  const [value, setValue] = React.useState(defaultValue);

  React.useEffect(() => {
    if (isOpen) setValue(defaultValue);
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
          {message && <p className="text-sm text-gray-600 mb-4">{message}</p>}
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7024BB] focus:border-transparent outline-none"
            autoFocus
          />
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
          >
            Cancelar
          </button>
          <button 
            onClick={() => { onConfirm(value); onClose(); }}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#7024BB] rounded-xl hover:bg-[#5a1d99] transition-all"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
