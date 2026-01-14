FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copiamos TODO el contexto
COPY . .

# 🔍 BUSCAMOS EL CSPROJ (esto es la clave)
RUN echo "==== SEARCHING CSPROJ ====" \
 && find . -name "*.csproj" -maxdepth 6

# ⚠️ AJUSTA ESTE WORKDIR SEGÚN EL OUTPUT DEL find
# (por ahora NO asumimos nada)
WORKDIR /src

# Intentamos restaurar usando path absoluto (lo corregimos luego)
RUN dotnet restore $(find . -name "Barber.Flow.Api.csproj" | head -n 1)

RUN dotnet build $(find . -name "Barber.Flow.Api.csproj" | head -n 1) \
  -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish $(find . -name "Barber.Flow.Api.csproj" | head -n 1) \
  -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Barber.Flow.Api.dll"]
