"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import api from "@/lib/api";
import Link from "next/link";

const ROLES = [
  { value: "CITIZEN", label: "Ciudadano / Fanatico" },
  { value: "PLAYER", label: "Jugador" },
  { value: "REFEREE", label: "Arbitro" },
  { value: "SCOREKEEPER", label: "Planillero" },
  { value: "DIRECTOR", label: "Directivo de Club" },
  { value: "ORGANIZER", label: "Organizador" },
  { value: "OBSERVER", label: "Veedor" },
  { value: "JOURNALIST", label: "Periodista" },
];

const GENDERS = [
  { value: "MALE", label: "Masculino" },
  { value: "FEMALE", label: "Femenino" },
  { value: "NON_BINARY", label: "No binario" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefiero no decir" },
];

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    gender: "",
    requestedRole: "CITIZEN",
    documentType: "",
    documentNumber: "",
    birthDate: "",
    heightCm: "",
    weightKg: "",
    roleJustification: "",
  });
  const router = useRouter();

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleStep1Next = () => {
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      toast.error("Completa todos los campos obligatorios");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Las contrasenas no coinciden");
      return;
    }
    if (formData.password.length < 8) {
      toast.error("La contrasena debe tener minimo 8 caracteres");
      return;
    }
    if (formData.requestedRole === "CITIZEN") {
      handleSubmit();
    } else {
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const payload: any = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
        gender: formData.gender || undefined,
        requestedRole: formData.requestedRole,
      };
      if (step === 2 || formData.requestedRole !== "CITIZEN") {
        if (formData.documentType) payload.documentType = formData.documentType;
        if (formData.documentNumber) payload.documentNumber = formData.documentNumber;
        if (formData.birthDate) payload.birthDate = formData.birthDate;
        if (formData.heightCm) payload.heightCm = parseInt(formData.heightCm);
        if (formData.weightKg) payload.weightKg = parseFloat(formData.weightKg);
        if (formData.roleJustification) payload.roleJustification = formData.roleJustification;
      }
      await api.post("/auth/register", payload);
      toast.success("Registro exitoso. Revisa tu correo para confirmar tu cuenta.");
      router.push("/login");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error en el registro");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Crear Cuenta</CardTitle>
          <CardDescription>
            {step === 1 ? "Paso 1: Datos basicos" : "Paso 2: Datos de identificacion"}
          </CardDescription>
          <div className="flex justify-center gap-2 mt-2">
            <div className={`h-2 w-16 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
            <div className={`h-2 w-16 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
          </div>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombres *</Label>
                  <Input value={formData.firstName} onChange={(e) => updateField("firstName", e.target.value)} placeholder="Juan" />
                </div>
                <div className="space-y-2">
                  <Label>Apellidos *</Label>
                  <Input value={formData.lastName} onChange={(e) => updateField("lastName", e.target.value)} placeholder="Perez" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Correo electronico *</Label>
                <Input type="email" value={formData.email} onChange={(e) => updateField("email", e.target.value)} placeholder="tu@email.com" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contrasena *</Label>
                  <Input type="password" value={formData.password} onChange={(e) => updateField("password", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Confirmar *</Label>
                  <Input type="password" value={formData.confirmPassword} onChange={(e) => updateField("confirmPassword", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Telefono</Label>
                  <Input value={formData.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="3001234567" />
                </div>
                <div className="space-y-2">
                  <Label>Genero</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.gender} onChange={(e) => updateField("gender", e.target.value)}>
                    <option value="">Seleccionar</option>
                    {GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Rol solicitado *</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.requestedRole} onChange={(e) => updateField("requestedRole", e.target.value)}>
                  {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <Button className="w-full" onClick={handleStep1Next} disabled={isLoading}>
                {formData.requestedRole === "CITIZEN" ? (isLoading ? "Registrando..." : "Registrarme") : "Siguiente"}
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de documento</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.documentType} onChange={(e) => updateField("documentType", e.target.value)}>
                    <option value="">Seleccionar</option>
                    <option value="CEDULA_CIUDADANIA">Cedula de Ciudadania</option>
                    <option value="CEDULA_EXTRANJERIA">Cedula de Extranjeria</option>
                    <option value="PASAPORTE">Pasaporte</option>
                    <option value="TARJETA_IDENTIDAD">Tarjeta de Identidad</option>
                    <option value="NIT">NIT</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Numero de documento</Label>
                  <Input value={formData.documentNumber} onChange={(e) => updateField("documentNumber", e.target.value)} placeholder="1234567890" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Fecha de nacimiento</Label>
                <Input type="date" value={formData.birthDate} onChange={(e) => updateField("birthDate", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Altura (cm)</Label>
                  <Input type="number" value={formData.heightCm} onChange={(e) => updateField("heightCm", e.target.value)} placeholder="175" />
                </div>
                <div className="space-y-2">
                  <Label>Peso (kg)</Label>
                  <Input type="number" value={formData.weightKg} onChange={(e) => updateField("weightKg", e.target.value)} placeholder="70" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Justificacion del rol</Label>
                <textarea className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]" value={formData.roleJustification} onChange={(e) => updateField("roleJustification", e.target.value)} placeholder="Por que solicitas este rol?" />
              </div>
              <div className="flex gap-4">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Atras</Button>
                <Button className="flex-1" onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? "Registrando..." : "Registrarme"}
                </Button>
              </div>
            </div>
          )}

          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">Ya tienes cuenta? </span>
            <Link href="/login" className="text-primary hover:underline">Iniciar sesion</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
