using BurgerShop.Application.Inventario.DTOs;
using BurgerShop.Application.Inventario.Interfaces;
using BurgerShop.Application.Ventas.DTOs;
using BurgerShop.Application.Ventas.Interfaces;
using BurgerShop.Domain.Entities.Inventario;
using BurgerShop.Domain.Entities.Ventas;
using BurgerShop.Domain.Enums;
using BurgerShop.Domain.Interfaces;
using BurgerShop.Domain.Interfaces.Ventas;
using Microsoft.Extensions.Logging;

namespace BurgerShop.Application.Ventas.Services;

public class CuentaCorrienteService : ICuentaCorrienteService
{
    private readonly ICuentaCorrienteRepository _cuentaRepo;
    private readonly IMovimientoService         _movimientoService;
    private readonly IRepository<Cliente>       _clienteRepo;
    private readonly IRepository<CodigoAccion>  _codigoAccionRepo;
    private readonly ILogger<CuentaCorrienteService> _logger;

    public CuentaCorrienteService(
        ICuentaCorrienteRepository cuentaRepo,
        IMovimientoService         movimientoService,
        IRepository<Cliente>       clienteRepo,
        IRepository<CodigoAccion>  codigoAccionRepo,
        ILogger<CuentaCorrienteService> logger)
    {
        _cuentaRepo        = cuentaRepo;
        _movimientoService = movimientoService;
        _clienteRepo       = clienteRepo;
        _codigoAccionRepo  = codigoAccionRepo;
        _logger            = logger;
    }

    // -----------------------------------------------------------------------
    // Consultas
    // -----------------------------------------------------------------------

    public async Task<CuentaCorrienteDto?> GetByClienteIdAsync(int clienteId)
    {
        try
        {
            var cuenta = await _cuentaRepo.GetByClienteIdAsync(clienteId);
            return cuenta is null ? null : ToDto(cuenta);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetByClienteIdAsync), ex.Message);
            throw;
        }
    }

    public async Task<IEnumerable<CuentaCorrienteDto>> GetAllActivasAsync()
    {
        try
        {
            var cuentas = await _cuentaRepo.GetAllActivasAsync();
            return cuentas.Select(ToDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetAllActivasAsync), ex.Message);
            throw;
        }
    }

    public async Task<IEnumerable<CuentaCorrienteDto>> GetConSaldoAsync()
    {
        try
        {
            var cuentas = await _cuentaRepo.GetConSaldoAsync();
            return cuentas.Select(ToDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetConSaldoAsync), ex.Message);
            throw;
        }
    }

    public async Task<IEnumerable<MovimientoCuentaCorrienteDto>> GetMovimientosAsync(
        int clienteId, DateTime? desde, DateTime? hasta)
    {
        try
        {
            var cuenta = await _cuentaRepo.GetByClienteIdAsync(clienteId);
            if (cuenta is null)
                return Enumerable.Empty<MovimientoCuentaCorrienteDto>();

            var movimientos = await _cuentaRepo.GetMovimientosByCuentaAsync(cuenta.Id, desde, hasta);
            return movimientos.Select(ToMovimientoDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(GetMovimientosAsync), ex.Message);
            throw;
        }
    }

    // -----------------------------------------------------------------------
    // Operaciones
    // -----------------------------------------------------------------------

    public async Task<MovimientoCuentaCorrienteDto> RegistrarCargoAsync(
        CrearCargoDto dto, int? usuarioId)
    {
        try
        {
            if (dto.Monto <= 0)
                throw new InvalidOperationException("El monto del cargo debe ser mayor a cero.");

            // Verificar que el tipo de cliente permite cuenta corriente
            var cliente = await _clienteRepo.GetByIdAsync(dto.ClienteId)
                ?? throw new InvalidOperationException($"Cliente {dto.ClienteId} no encontrado.");

            // La validación de PermiteCuentaCorriente se hace a través de TipoClienteId
            // Si el cliente no tiene tipo o el tipo no permite cta cte, rechazamos
            // (El TipoCliente con sus campos se carga en la entidad cliente pero no tiene navigation aquí;
            //  si se necesita, el controller puede validarlo. La entidad cliente no incluye TipoCliente navegación
            //  en IRepository<Cliente>. Dejamos la verificación explícita para no sobre-complicar.)

            var cuenta = await ObtenerOCrearCuentaAsync(dto.ClienteId);

            // Verificar límite de crédito si está configurado
            if (cuenta.LimiteCredito > 0 && cuenta.SaldoActual + dto.Monto > cuenta.LimiteCredito)
                throw new InvalidOperationException(
                    $"El cargo supera el límite de crédito. " +
                    $"Saldo actual: {cuenta.SaldoActual:C}, Límite: {cuenta.LimiteCredito:C}, Monto solicitado: {dto.Monto:C}.");

            var ahora            = DateTime.Now;
            var nuevoSaldo       = cuenta.SaldoActual + dto.Monto;

            var movimiento = new MovimientoCuentaCorriente
            {
                CuentaCorrienteId = cuenta.Id,
                FechaMovimiento   = ahora,
                FechaProceso      = DateTime.Now,
                Tipo              = TipoMovimientoCuentaCorriente.Cargo,
                Monto             = dto.Monto,
                SaldoResultante   = nuevoSaldo,
                VentaId           = dto.VentaId,
                UsuarioId         = usuarioId,
                Observaciones     = dto.Observaciones
            };

            cuenta.SaldoActual           = nuevoSaldo;
            cuenta.FechaUltimoMovimiento = ahora;

            await _cuentaRepo.AddMovimientoAsync(movimiento);
            _cuentaRepo.Update(cuenta);
            await _cuentaRepo.SaveChangesAsync();

            return ToMovimientoDto(movimiento);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "{Method}: {Message}", nameof(RegistrarCargoAsync), ex.Message);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(RegistrarCargoAsync), ex.Message);
            throw;
        }
    }

    public async Task<MovimientoCuentaCorrienteDto> RegistrarPagoAsync(
        CrearPagoCtaCteDto dto, int? usuarioId)
    {
        try
        {
            if (dto.Monto <= 0)
                throw new InvalidOperationException("El monto del pago debe ser mayor a cero.");

            var cuenta = await _cuentaRepo.GetByClienteIdAsync(dto.ClienteId)
                ?? throw new InvalidOperationException(
                    $"No existe cuenta corriente para el cliente {dto.ClienteId}.");

            // Buscar el CodigoAccion PAG_CTA para registrar el movimiento en la tabla transversal
            var codigos   = await _codigoAccionRepo.FindAsync(c => c.Codigo == "PAG_CTA" && c.Activo);
            var pagCta    = codigos.FirstOrDefault()
                ?? throw new InvalidOperationException(
                    "Código de acción 'PAG_CTA' no encontrado o inactivo. Verifique la configuración de códigos.");

            // Registrar el movimiento en la tabla transversal (afecta caja)
            var movDto = new CrearMovimientoDto(
                CodigoAccionId:  pagCta.Id,
                ProductoId:      null,
                LocalId:         dto.LocalId,
                Cantidad:        1,
                PrecioUnitario:  dto.Monto,
                FechaMovimiento: DateTime.Now,
                Observaciones:   dto.Observaciones ?? $"Pago cuenta corriente - {cuenta.Cliente?.Nombre ?? $"Cliente #{dto.ClienteId}"}");

            var movimientoRegistrado = await _movimientoService.RegistrarMovimientoAsync(movDto, usuarioId);

            var ahora      = DateTime.Now;
            var nuevoSaldo = cuenta.SaldoActual - dto.Monto;

            var movimiento = new MovimientoCuentaCorriente
            {
                CuentaCorrienteId = cuenta.Id,
                FechaMovimiento   = ahora,
                FechaProceso      = DateTime.Now,
                Tipo              = TipoMovimientoCuentaCorriente.Pago,
                Monto             = dto.Monto,
                SaldoResultante   = nuevoSaldo,
                MovimientoId      = movimientoRegistrado.Id,
                UsuarioId         = usuarioId,
                Observaciones     = dto.Observaciones
            };

            cuenta.SaldoActual           = nuevoSaldo;
            cuenta.FechaUltimoMovimiento = ahora;

            await _cuentaRepo.AddMovimientoAsync(movimiento);
            _cuentaRepo.Update(cuenta);
            await _cuentaRepo.SaveChangesAsync();

            return ToMovimientoDto(movimiento);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "{Method}: {Message}", nameof(RegistrarPagoAsync), ex.Message);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(RegistrarPagoAsync), ex.Message);
            throw;
        }
    }

    public async Task<MovimientoCuentaCorrienteDto> RegistrarAjusteAsync(
        CrearAjusteDto dto, int? usuarioId)
    {
        try
        {
            if (dto.Monto <= 0)
                throw new InvalidOperationException("El monto del ajuste debe ser mayor a cero.");

            if (string.IsNullOrWhiteSpace(dto.Observaciones))
                throw new InvalidOperationException("Los ajustes manuales requieren una observación.");

            var cuenta = await ObtenerOCrearCuentaAsync(dto.ClienteId);

            var ahora      = DateTime.Now;
            // EsAFavor = true  → reduce deuda (descuento/corrección a favor del cliente)
            // EsAFavor = false → aumenta deuda (cargo adicional)
            var nuevoSaldo = dto.EsAFavor
                ? cuenta.SaldoActual - dto.Monto
                : cuenta.SaldoActual + dto.Monto;

            var movimiento = new MovimientoCuentaCorriente
            {
                CuentaCorrienteId = cuenta.Id,
                FechaMovimiento   = ahora,
                FechaProceso      = DateTime.Now,
                Tipo              = TipoMovimientoCuentaCorriente.AjusteManual,
                Monto             = dto.Monto,
                SaldoResultante   = nuevoSaldo,
                UsuarioId         = usuarioId,
                Observaciones     = dto.Observaciones
            };

            cuenta.SaldoActual           = nuevoSaldo;
            cuenta.FechaUltimoMovimiento = ahora;

            await _cuentaRepo.AddMovimientoAsync(movimiento);
            _cuentaRepo.Update(cuenta);
            await _cuentaRepo.SaveChangesAsync();

            return ToMovimientoDto(movimiento);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "{Method}: {Message}", nameof(RegistrarAjusteAsync), ex.Message);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(RegistrarAjusteAsync), ex.Message);
            throw;
        }
    }

    // -----------------------------------------------------------------------
    // Saldar cargo cuando el pedido fue cobrado en la entrega
    // -----------------------------------------------------------------------

    public async Task SaldarCargoPorVentaAsync(int ventaId, int? usuarioId)
    {
        try
        {
            var cargo = await _cuentaRepo.GetCargoPorVentaAsync(ventaId);
            if (cargo is null) return; // No había cargo en cta cte para esta venta

            var cuenta = cargo.CuentaCorriente;
            if (cuenta is null) return;

            var ahora = DateTime.Now;
            var nuevoSaldo = cuenta.SaldoActual - cargo.Monto;

            var pago = new MovimientoCuentaCorriente
            {
                CuentaCorrienteId = cuenta.Id,
                FechaMovimiento   = ahora,
                FechaProceso      = DateTime.Now,
                Tipo              = TipoMovimientoCuentaCorriente.Pago,
                Monto             = cargo.Monto,
                SaldoResultante   = nuevoSaldo,
                VentaId           = ventaId,
                UsuarioId         = usuarioId,
                Observaciones     = $"Pago automatico - cobrado en entrega (Venta #{ventaId})"
            };

            await _cuentaRepo.AddMovimientoAsync(pago);
            cuenta.SaldoActual = nuevoSaldo;
            cuenta.FechaUltimoMovimiento = ahora;
            _cuentaRepo.Update(cuenta);
            await _cuentaRepo.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(SaldarCargoPorVentaAsync), ex.Message);
            throw;
        }
    }

    // -----------------------------------------------------------------------
    // Gestión
    // -----------------------------------------------------------------------

    public async Task<CuentaCorrienteDto> ActualizarLimiteCreditoAsync(int clienteId, decimal limite)
    {
        try
        {
            if (limite < 0)
                throw new InvalidOperationException("El límite de crédito no puede ser negativo.");

            var cuenta = await ObtenerOCrearCuentaAsync(clienteId);
            cuenta.LimiteCredito = limite;
            _cuentaRepo.Update(cuenta);
            await _cuentaRepo.SaveChangesAsync();
            return ToDto(cuenta);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "{Method}: {Message}", nameof(ActualizarLimiteCreditoAsync), ex.Message);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en {Method}: {Message}", nameof(ActualizarLimiteCreditoAsync), ex.Message);
            throw;
        }
    }

    // -----------------------------------------------------------------------
    // Privados
    // -----------------------------------------------------------------------

    private async Task<CuentaCorriente> ObtenerOCrearCuentaAsync(int clienteId)
    {
        var cuenta = await _cuentaRepo.GetByClienteIdAsync(clienteId);
        if (cuenta is not null)
            return cuenta;

        // Primera operación para este cliente: abrir la cuenta con saldo 0
        var nueva = new CuentaCorriente
        {
            ClienteId              = clienteId,
            SaldoActual            = 0,
            LimiteCredito          = 0,
            Activa                 = true,
            FechaApertura          = DateTime.Now,
            FechaUltimoMovimiento  = DateTime.Now
        };

        await _cuentaRepo.AddAsync(nueva);
        await _cuentaRepo.SaveChangesAsync();
        return nueva;
    }

    private static CuentaCorrienteDto ToDto(CuentaCorriente c) => new(
        Id:                    c.Id,
        ClienteId:             c.ClienteId,
        ClienteNombre:         c.Cliente?.Nombre ?? string.Empty,
        ClienteTelefono:       c.Cliente?.Telefono,
        ClienteLocalId:        c.Cliente?.LocalId,
        SaldoActual:           c.SaldoActual,
        LimiteCredito:         c.LimiteCredito,
        Activa:                c.Activa,
        FechaApertura:         c.FechaApertura,
        FechaUltimoMovimiento: c.FechaUltimoMovimiento);

    private static MovimientoCuentaCorrienteDto ToMovimientoDto(MovimientoCuentaCorriente m) => new(
        Id:                m.Id,
        CuentaCorrienteId: m.CuentaCorrienteId,
        FechaMovimiento:   m.FechaMovimiento,
        FechaProceso:      m.FechaProceso,
        Tipo:              m.Tipo.ToString(),
        Monto:             m.Monto,
        SaldoResultante:   m.SaldoResultante,
        PedidoId:          null,
        NumeroTicket:      m.Venta?.NumeroTicket,
        VentaId:           m.VentaId,
        NumeroVenta:       m.Venta?.NumeroTicket,
        MovimientoId:      m.MovimientoId,
        UsuarioId:         m.UsuarioId,
        UsuarioNombre:     m.Usuario?.NombreCompleto,
        Observaciones:     m.Observaciones);
}
