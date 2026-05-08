namespace BurgerShop.Application.Ventas.DTOs;

public record CuentaCorrienteDto(
    int      Id,
    int      ClienteId,
    string   ClienteNombre,
    string?  ClienteTelefono,
    int?     ClienteLocalId,
    decimal  SaldoActual,
    decimal  LimiteCredito,
    bool     Activa,
    DateTime FechaApertura,
    DateTime FechaUltimoMovimiento);

public record MovimientoCuentaCorrienteDto(
    int      Id,
    int      CuentaCorrienteId,
    DateTime FechaMovimiento,
    DateTime FechaProceso,
    string   Tipo,
    decimal  Monto,
    decimal  SaldoResultante,
    int?     PedidoId,
    string?  NumeroTicket,
    int?     VentaId,
    string?  NumeroVenta,
    int?     MovimientoId,
    int?     UsuarioId,
    string?  UsuarioNombre,
    string?  Observaciones);

public record CrearCargoDto(
    int     ClienteId,
    decimal Monto,
    int?    VentaId,
    string? Observaciones);

public record CrearPagoCtaCteDto(
    int     ClienteId,
    decimal Monto,
    int     FormaPagoId,
    int     LocalId,
    string? Observaciones);

public record CrearAjusteDto(
    int     ClienteId,
    decimal Monto,
    bool    EsAFavor,
    string  Observaciones);

public record CuentaCorrienteStatsDto(
    decimal TotalDeudaActual,
    int     ClientesConDeuda,
    decimal TotalSaldoFavor,
    int     ClientesConFavor,
    decimal TotalCargosMes,
    decimal TotalPagosMes,
    int     CantidadPagosMes,
    decimal TotalAjustesFavorMes,
    decimal TotalAjustesContraMes,
    int     CantidadAjustesMes,
    string? ClienteTopDeudor,
    decimal MontoTopDeudor,
    decimal SaldoPromedioDeudor);
