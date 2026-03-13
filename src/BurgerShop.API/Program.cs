using System.Text;
using BurgerShop.API.Extensions;
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
            .AllowAnyMethod();
    });
});

var app = builder.Build();

// Auto-migrate on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<BurgerShopDbContext>();
    db.Database.Migrate();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.MapGet("/api/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.Now }))
    .AllowAnonymous();

app.Run();
