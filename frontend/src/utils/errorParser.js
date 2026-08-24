/**
 * Parses API error responses securely, preventing objects/arrays from being rendered directly in React.
 * Specially formatted to clean up FastAPI/Pydantic validation errors.
 */
export const parseError = (err) => {
  const detail = err.response?.data?.detail;
  if (!detail) {
    return err.message || 'An unexpected error occurred.';
  }
  
  if (typeof detail === 'string') {
    return detail;
  }
  
  if (Array.isArray(detail)) {
    // Standard FastAPI validation error structure: [{loc: ['body', 'field'], msg: 'error msg', type: '...'}]
    return detail
      .map((d) => {
        const field = d.loc ? d.loc.filter((locVal) => locVal !== 'body').join('.') : '';
        const prefix = field ? `"${field}" ` : '';
        return `${prefix}${d.msg}`;
      })
      .join('; ');
  }
  
  if (typeof detail === 'object') {
    return detail.message || JSON.stringify(detail);
  }
  
  return String(detail);
};
