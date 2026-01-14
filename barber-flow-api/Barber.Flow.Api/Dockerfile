FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# ✅ RUTA REAL (DOS NIVELES)
COPY ["Barber.Flow.Api/Barber.Flow.Api/Barber.Flow.Api.csproj", "Barber.Flow.Api/Barber.Flow.Api/"]
RUN dotnet restore "Barber.Flow.Api/Barber.Flow.Api/Barber.Flow.Api.csproj"

# Copiamos todo el contexto
COPY . .

# Nos movemos al folder correcto
WORKDIR "/src/Barber.Flow.Api/Barber.Flow.Api"
RUN dotnet build "Barber.Flow.Api.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "Barber.Flow.Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Barber.Flow.Api.dll"]
