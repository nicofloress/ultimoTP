import { useState, useEffect, useRef } from 'react';

/**
 * Formatea un número con separador de miles (punto) y decimal (coma).
 * Ej: 1500.5 → "1.500,50"  |  1000 → "1.000"
 */
export function formatearNumero(value: number | string | undefined | null, decimales?: number): string {
  if (value === undefined || value === null || value === '') return '';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '';
  return num.toLocaleString('es-AR', decimales !== undefined ? { minimumFractionDigits: decimales, maximumFractionDigits: decimales } : {});
}

/**
 * Formatea un monto como moneda ARS: "$1.500,00"
 */
export function formatearMonto(value: number): string {
  return '$' + value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface NumericInputProps {
  value: number | string;
  onChange: (value: number) => void;
  className?: string;
  placeholder?: string;
  min?: number;
  step?: number;
  required?: boolean;
  decimales?: boolean; // permite decimales (default false)
  disabled?: boolean;
}

/**
 * Input numérico con formato de miles (punto) y decimal (coma).
 * Internamente almacena el valor como number.
 */
export default function NumericInput({
  value,
  onChange,
  className = '',
  placeholder = '',
  min,
  required,
  decimales = false,
  disabled = false,
}: NumericInputProps) {
  const [display, setDisplay] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const isTyping = useRef(false);

  // Sincronizar display con value externo (solo cuando no está tipeando)
  useEffect(() => {
    if (!isTyping.current) {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(num) || num === 0) {
        setDisplay(num === 0 ? '0' : '');
      } else {
        setDisplay(formatearNumero(num));
      }
    }
  }, [value]);

  const parsearInput = (raw: string): number => {
    // Quitar puntos de miles, reemplazar coma por punto decimal
    const limpio = raw.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(limpio);
    return isNaN(num) ? 0 : num;
  };

  const formatearDisplay = (raw: string): string => {
    // Permitir solo dígitos, coma (decimal) y signo negativo
    let limpio = raw.replace(/[^\d,\-]/g, '');

    // Solo una coma
    const partes = limpio.split(',');
    if (partes.length > 2) {
      limpio = partes[0] + ',' + partes.slice(1).join('');
    }

    // Si no permite decimales, quitar coma
    if (!decimales) {
      limpio = limpio.replace(',', '');
    }

    // Formatear parte entera con puntos de miles
    const [entera, decimal] = limpio.split(',');
    const enteraSinSigno = entera.replace('-', '');
    const signo = entera.startsWith('-') ? '-' : '';

    if (enteraSinSigno === '') {
      return decimal !== undefined ? ',' + decimal : '';
    }

    const enteraFormateada = parseInt(enteraSinSigno, 10).toLocaleString('es-AR');

    if (decimal !== undefined) {
      return signo + enteraFormateada + ',' + decimal;
    }
    return signo + enteraFormateada;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isTyping.current = true;
    const raw = e.target.value;

    // Si está vacío
    if (raw === '' || raw === '-') {
      setDisplay(raw);
      onChange(0);
      return;
    }

    const formatted = formatearDisplay(raw);
    setDisplay(formatted);

    const num = parsearInput(formatted);
    if (min !== undefined && num < min) return;
    onChange(num);
  };

  const handleBlur = () => {
    isTyping.current = false;
    const num = parsearInput(display);
    if (decimales) {
      setDisplay(num === 0 && display === '' ? '' : formatearNumero(num, 2));
    } else {
      setDisplay(num === 0 && display === '' ? '' : formatearNumero(num));
    }
  };

  const handleFocus = () => {
    isTyping.current = true;
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      value={display}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      className={className}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
    />
  );
}
