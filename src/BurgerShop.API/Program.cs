using System.Text;
using BurgerShop.API.Extensions;
using BurgerShop.API.Middleware;
using BurgerShop.Application.Notificaciones;
using BurgerShop.Domain.Interfaces;
using BurgerShop.Infrastructure.Data;
using BurgerShop.Infrastructure.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.OpenApi.Models;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// PORT dinámico para Railway
var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(port))
{
    builder.WebHost.UseUrls($"http://+:{port}");
}

// EF Core - PostgreSQL
// Las variables de entorno DATABASE_URL / CONNECTION_STRING tienen prioridad (para Railway)
var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
var connectionString = Environment.GetEnvironmentVariable("CONNECTION_STRING");
var pgConnection = connectionString ?? databaseUrl;

if (!string.IsNullOrEmpty(pgConnection))
{
    // Si es formato postgres:// de Railway, convertir a formato Npgsql
    if (pgConnection.StartsWith("postgres://") || pgConnection.StartsWith("postgresql://"))
    {
        var uri = new Uri(pgConnection);
        var userInfo = uri.UserInfo.Split(':');
        pgConnection = $"Host={uri.Host};Port={uri.Port};Database={uri.AbsolutePath.TrimStart('/')};Username={userInfo[0]};Password={userInfo[1]};SSL Mode=Require;Trust Server Certificate=true";
    }
}
else
{
    pgConnection = builder.Configuration.GetConnectionString("DefaultConnection");
}

builder.Services.AddDbContext<BurgerShopDbContext>(options =>
    options.UseNpgsql(pgConnection)
        .ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning)));

// Shared
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

// Módulos
builder.Services.AddAuthServices();
builder.Services.AddCatalogoServices();
builder.Services.AddVentasServices();
builder.Services.AddLogisticaServices();
builder.Services.AddFinanzasServices();
builder.Services.AddSistemaServices();
builder.Services.AddInventarioServices();

// SignalR
builder.Services.AddSignalR();
builder.Services.AddScoped<INotificacionService, NotificacionService>();

// JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };

        // Permitir que SignalR reciba el token desde query string
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs/notificaciones"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Ingrese el token JWT. Ejemplo: Bearer {token}"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var frontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL");

        policy.SetIsOriginAllowed(origin =>
            {
                var uri = new Uri(origin);
                if (uri.Host == "localhost") return true;
                if (uri.Host.EndsWith(".vercel.app")) return true;
                if (!string.IsNullOrEmpty(frontendUrl) && origin.TrimEnd('/') == frontendUrl.TrimEnd('/')) return true;
                return false;
            })
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

// Auto-migrate on startup + backfill RepartoZonaId
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<BurgerShopDbContext>();
    db.Database.Migrate();

    // Fix: desvincular ventas que están en cajas de otro local
    // o que son de una fecha anterior a la apertura de la caja
    db.Database.ExecuteSqlRaw(@"
        UPDATE ""Ventas"" v
        SET ""CierreCajaId"" = NULL
        FROM ""CierresCaja"" c
        WHERE v.""CierreCajaId"" = c.""Id""
          AND (
            (c.""LocalId"" IS NOT NULL AND v.""LocalId"" IS NOT NULL AND v.""LocalId"" != c.""LocalId"")
            OR (v.""FechaCreacion"" < c.""FechaApertura"")
          );
    ");

    // Backfill: setear UnidadMinima según categoría
    // Hamburguesas (mega=1 o hijas de mega=1) = 2
    // Salchichas (mega=2 o hijas de mega=2) = 6
    // Panes tradicional/maxi (mega=3, nombres con tradicional/maxi) = 4
    // Panes pancho/superpancho (mega=3, nombres con pancho) = 6
    db.Database.ExecuteSqlRaw(@"
        UPDATE ""Productos"" SET ""UnidadMinima"" = 2
        WHERE ""UnidadMinima"" <= 1 AND ""CategoriaId"" IN (
            SELECT ""Id"" FROM ""Categorias"" WHERE ""TipoMegaCategoria"" = 1
            UNION SELECT ""Id"" FROM ""Categorias"" WHERE ""CategoriaPadreId"" IN (SELECT ""Id"" FROM ""Categorias"" WHERE ""TipoMegaCategoria"" = 1)
        );
        UPDATE ""Productos"" SET ""UnidadMinima"" = 6
        WHERE ""UnidadMinima"" <= 1 AND ""CategoriaId"" IN (
            SELECT ""Id"" FROM ""Categorias"" WHERE ""TipoMegaCategoria"" = 2
            UNION SELECT ""Id"" FROM ""Categorias"" WHERE ""CategoriaPadreId"" IN (SELECT ""Id"" FROM ""Categorias"" WHERE ""TipoMegaCategoria"" = 2)
        );
        UPDATE ""Productos"" SET ""UnidadMinima"" = 4
        WHERE ""UnidadMinima"" <= 1 AND ""CategoriaId"" IN (
            SELECT ""Id"" FROM ""Categorias"" WHERE ""Nombre"" ILIKE '%tradicional%' OR ""Nombre"" ILIKE '%maxi%'
        );
        UPDATE ""Productos"" SET ""UnidadMinima"" = 6
        WHERE ""UnidadMinima"" <= 1 AND ""CategoriaId"" IN (
            SELECT ""Id"" FROM ""Categorias"" WHERE ""Nombre"" ILIKE '%pancho%'
        );

        UPDATE ""Productos"" SET ""UnidadMinima"" = 1 WHERE ""UnidadMinima"" = 0;
    ");

    // Seed: asegurar que existe la forma de pago "Cuenta Corriente"
    db.Database.ExecuteSqlRaw(@"
        INSERT INTO ""FormasPago"" (""Nombre"", ""PorcentajeRecargo"", ""Activa"")
        SELECT 'Cuenta Corriente', 0, true
        WHERE NOT EXISTS (SELECT 1 FROM ""FormasPago"" WHERE ""Nombre"" = 'Cuenta Corriente');
    ");

    // Backfill: vincular ventas existentes que tienen repartidor/zona con su RepartoZona
    db.Database.ExecuteSqlRaw(@"
        UPDATE ""Ventas"" v
        SET ""RepartoZonaId"" = rz.""Id""
        FROM ""RepartosZona"" rz
        WHERE v.""RepartoZonaId"" IS NULL
          AND v.""ZonaId"" = rz.""ZonaId""
          AND v.""RepartidorId"" = rz.""RepartidorId""
          AND rz.""Fecha"" = CURRENT_DATE
          AND v.""FechaAsignacion""::date = CURRENT_DATE
    ");
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<RequestLoggingMiddleware>();
app.MapControllers();
app.MapHub<NotificacionHub>("/hubs/notificaciones");

app.MapGet("/api/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.Now }))
    .AllowAnonymous();

app.Run();
