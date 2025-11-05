"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Users, Package, Zap, TrendingUp } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { DASHBOARD_METRICS } from "@/lib/mock-data"

const ICON_MAP = {
  Users,
  Package,
  Zap,
  TrendingUp,
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Panel de Control</h1>
          <p className="text-muted-foreground mt-1">Bienvenido a TechTrace - Sistema de Gestión de Inventario</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {DASHBOARD_METRICS.map((metric) => {
          const Icon = ICON_MAP[metric.icon as keyof typeof ICON_MAP]
          return (
            <Card key={metric.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
                <Icon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{metric.trend} este mes</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Alerts */}
      <Alert className="border-warning bg-warning/10">
        <AlertCircle className="h-4 w-4 text-warning" />
        <AlertTitle>Stock Bajo</AlertTitle>
        <AlertDescription>
          4 categorías de dispositivos tienen stock por debajo del nivel mínimo recomendado.
        </AlertDescription>
      </Alert>

      {/* Simple Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Resumen Rápido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Dispositivos Activos</span>
              <span className="text-xl font-bold">298</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Dispositivos en Stock</span>
              <span className="text-xl font-bold">44</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Empleados Activos</span>
              <span className="text-xl font-bold">124</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Sucursales</span>
              <span className="text-xl font-bold">4</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribución de Dispositivos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Laptops</span>
                <span className="text-sm font-semibold">120 (35%)</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: "35%" }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Teléfonos</span>
                <span className="text-sm font-semibold">140 (41%)</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-success h-2 rounded-full" style={{ width: "41%" }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Tablets</span>
                <span className="text-sm font-semibold">52 (15%)</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-warning h-2 rounded-full" style={{ width: "15%" }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">SIM Cards</span>
                <span className="text-sm font-semibold">30 (9%)</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-destructive h-2 rounded-full" style={{ width: "9%" }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
