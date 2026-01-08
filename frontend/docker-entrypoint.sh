#!/bin/sh
set -e

# Configurar Next.js para escuchar en todas las interfaces
export HOSTNAME="0.0.0.0"

# Ejecutar el servidor Next.js
exec node server.js
