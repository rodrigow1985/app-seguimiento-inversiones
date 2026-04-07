// Errores de dominio siguiendo RFC 7807 Problem Details
// Ver docs/apis/errors.md

export interface ValidationErrorDetail {
  field: string
  message: string
}

export class AppError extends Error {
  constructor(
    public readonly type: string,
    public readonly title: string,
    public readonly status: number,
    public readonly detail: string,
    public readonly extra?: Record<string, unknown>,
  ) {
    super(detail)
    this.name = 'AppError'
  }

  toJSON(instance?: string) {
    return {
      type: `/errors/${this.type}`,
      title: this.title,
      status: this.status,
      detail: this.detail,
      instance,
      ...this.extra,
    }
  }
}

export class NotFoundError extends AppError {
  constructor(detail: string) {
    super('not-found', 'Recurso no encontrado', 404, detail)
  }
}

export class ValidationError extends AppError {
  constructor(detail: string, errors?: ValidationErrorDetail[]) {
    super('validation-error', 'Error de validación', 422, detail, errors ? { errors } : undefined)
  }
}

export class CclNotAvailableError extends AppError {
  constructor(date: string) {
    super(
      'ccl-not-available',
      'CCL no disponible',
      422,
      `No hay registro de CCL para la fecha ${date}. Cargá el valor manualmente en /ccl antes de continuar.`,
    )
  }
}

export class InsufficientUnitsError extends AppError {
  constructor(available: string, requested: string) {
    super(
      'insufficient-units',
      'Unidades insuficientes',
      409,
      `La posición tiene ${available} unidades disponibles, se intentaron vender ${requested}`,
    )
  }
}

export class PositionAlreadyClosedError extends AppError {
  constructor(positionId: string) {
    super(
      'position-already-closed',
      'Posición cerrada',
      409,
      `La posición ${positionId} está cerrada y no acepta nuevas operaciones`,
    )
  }
}

export class StrategyAlreadyClosedError extends AppError {
  constructor(strategyId: string) {
    super(
      'strategy-already-closed',
      'Estrategia DCA cerrada',
      409,
      `La estrategia DCA ${strategyId} fue cerrada y no acepta nuevas entradas`,
    )
  }
}

export class PriceUnavailableError extends AppError {
  constructor(ticker: string, source: string) {
    super(
      'price-unavailable',
      'Precio no disponible',
      503,
      `No se pudo obtener el precio actual de ${ticker} desde ${source}. Reintentá en unos minutos.`,
    )
  }
}
