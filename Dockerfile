FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY . .
RUN dotnet restore BurgerShop.sln
RUN dotnet publish src/BurgerShop.API -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app .
ENV ASPNETCORE_URLS=http://+:${PORT:-5021}
EXPOSE 5021
ENTRYPOINT ["dotnet", "BurgerShop.API.dll"]
