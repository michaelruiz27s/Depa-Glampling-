(function (root) {
 const normalize = value => typeof value === 'string' ? value.trim() : '';
 const invalid = (field, message) => ({ field, message });
 const validPassword = value => typeof value === 'string' &&
  value.length >= 8 && value.length <= 128 && Boolean(value.trim());

 function validateRegistration(input) {
  const nombre = normalize(input.nombre);
  const correo = normalize(input.correo).toLowerCase();
  const telefono = normalize(input.telefono);
  const { password } = input;

  if (nombre.length < 3 || nombre.length > 150 ||
      !/^\p{L}[\p{L}\p{M} .’'-]*$/u.test(nombre) || !/\p{L}.*\p{L}/u.test(nombre)) {
   return invalid('nombre', 'Escribe un nombre de 3 a 150 caracteres sin números.');
  }
  if (telefono || (input.telefono != null && typeof input.telefono !== 'string')) {
   const digits = telefono.replace(/\D/g, '');
   if (telefono.length > 35 || !/^\+?(?:\d|\(\d+\))(?:[ -]?(?:\d|\(\d+\)))*$/.test(telefono) ||
       digits.length < 7 || digits.length > 15) {
    return invalid('telefono', 'Escribe un teléfono de 7 a 15 dígitos. Puedes usar el prefijo + y el código de país.');
   }
  }
  const [local, domain, extra] = correo.split('@');
  const labels = domain?.split('.') || [];
  const emailPart = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+$/;
  const domainLabel = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
  if (correo.length > 254 || local.length > 64 || extra !== undefined ||
      !local.split('.').every(part => emailPart.test(part)) ||
      labels.length < 2 || !labels.every(label => domainLabel.test(label)) ||
      !/[a-z]/.test(labels.at(-1))) {
   return invalid('correo', 'Escribe un correo válido, por ejemplo, tu@correo.com.');
  }
  if (!validPassword(password)) {
   return invalid('password', 'Usa una contraseña de 8 a 128 caracteres que no sea solo espacios.');
  }
  if (input.politicas !== true) {
   return invalid('politicas', 'Debes aceptar las políticas de privacidad para crear tu cuenta.');
  }
  return { nombre, correo, telefono, password };
 }

 if (typeof module === 'object' && module.exports) {
  module.exports = validateRegistration;
  module.exports.validPassword = validPassword;
 }
 else root.validateRegistration = validateRegistration;
})(globalThis);
