/** Error de negocio con código HTTP y mensaje claro para el tendero. */
export class ErrorNegocio extends Error {
  constructor(status, mensaje, detalles = undefined) {
    super(mensaje);
    this.name = 'ErrorNegocio';
    this.status = status;
    this.detalles = detalles;
  }
}

export const noValido = (mensaje, detalles) => new ErrorNegocio(400, mensaje, detalles);
export const noEncontrado = (mensaje = 'No se encontró el registro') => new ErrorNegocio(404, mensaje);
export const conflicto = (mensaje, detalles) => new ErrorNegocio(409, mensaje, detalles);
